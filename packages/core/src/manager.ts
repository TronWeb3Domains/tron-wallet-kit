import { BaseWalletAdapter } from "./adapter";
import { WalletKitError } from "./errors";
import { WalletEventEmitter } from "./events";
import type { WalletEventListener, WalletEventName } from "./events";
import { NetworkRegistry } from "./networks";
import { MemoryWalletStorage } from "./storage";
import type {
  ConnectOptions,
  ConnectResult,
  SignMessageRequest,
  SignMessageResult,
  SignTransactionRequest,
  SignTransactionResult,
  StoredWalletSessionEnvelope,
  SubmitTransactionRequest,
  TransactionPayload,
  TxResult,
  WalletAccount,
  WalletAdapter,
  WalletCapabilities,
  WalletManagerConfig,
  WalletNetwork,
  WalletSession,
  WalletStorage,
  WalletTransaction,
  WalletTransactionStatus
} from "./types";
import { formatExplorerUrl } from "./utils";

export class WalletManager {
  readonly events = new WalletEventEmitter();
  readonly registry: NetworkRegistry;
  readonly storage: WalletStorage;
  readonly storageKey: string;
  readonly appName: string | undefined;
  private readonly adapters = new Map<string, WalletAdapter>();
  private readonly transactions: WalletTransaction[] = [];
  private session: WalletSession | null = null;
  private activeAdapterId: string | null = null;

  constructor(readonly config: WalletManagerConfig = {}) {
    this.appName = config.appName;
    this.registry = new NetworkRegistry(config.networks);
    this.storage = config.storage ?? new MemoryWalletStorage();
    this.storageKey = config.storageKey ?? "session";
    this.config.adapters?.forEach((adapter) => this.register(adapter));
  }

  register(adapter: WalletAdapter): this {
    if (!adapter.metadata?.id) {
      throw new WalletKitError("INVALID_ADAPTER", "Wallet adapter metadata.id is required");
    }
    this.adapters.set(adapter.metadata.id, adapter);
    return this;
  }

  getWallets(): WalletAdapter[] {
    return [...this.adapters.values()];
  }

  getAdapter(adapterId?: string): WalletAdapter | null {
    const id = adapterId ?? this.activeAdapterId;
    return id ? (this.adapters.get(id) ?? null) : null;
  }

  getSession(): WalletSession | null {
    return this.session;
  }

  getAccount(): WalletAccount | null {
    return this.session?.account ?? null;
  }

  getNetwork(): WalletNetwork {
    return this.session?.network ?? this.registry.resolve(this.config.network);
  }

  getCapabilities(adapterId?: string): WalletCapabilities | null {
    return this.getAdapter(adapterId)?.capabilities ?? null;
  }

  can(capability: keyof WalletCapabilities, adapterId?: string): boolean {
    return Boolean(this.getCapabilities(adapterId)?.[capability]);
  }

  on<T extends WalletEventName>(event: T, listener: WalletEventListener<T>): () => void {
    return this.events.on(event, listener);
  }

  async connect(adapterId: string, options: ConnectOptions = {}): Promise<WalletSession> {
    const adapter = this.requireAdapter(adapterId);
    this.events.emit("connecting", { adapterId });
    try {
      const available = await adapter.isAvailable?.();
      if (available === false) {
        throw new WalletKitError("WALLET_UNAVAILABLE", `${adapter.metadata.name} is not available`);
      }

      const network = this.registry.resolve(options.network ?? this.config.network);
      const connectOptions: ConnectOptions = { ...options, network };
      const appName = options.appName ?? this.appName;
      if (appName) connectOptions.appName = appName;
      const userOnAccountChanged = options.onAccountChanged;
      const userOnNetworkChanged = options.onNetworkChanged;
      const userOnDisconnect = options.onDisconnect;
      connectOptions.onAccountChanged = (address) => {
        this.handleAdapterAccountChanged(adapter.metadata.id, address);
        userOnAccountChanged?.(address);
      };
      connectOptions.onNetworkChanged = (nextNetwork) => {
        this.handleAdapterNetworkChanged(adapter.metadata.id, nextNetwork);
        userOnNetworkChanged?.(nextNetwork);
      };
      connectOptions.onDisconnect = () => {
        void this.disconnect();
        userOnDisconnect?.();
      };
      const result = await adapter.connect(connectOptions);
      const session = this.createSession(adapter, result, network);
      await this.setSession(session);
      this.events.emit("connected", { session });
      return session;
    } catch (error) {
      this.events.emit("rejected", { kind: "connect", adapterId, error });
      this.events.emit("error", { adapterId, error });
      throw error;
    }
  }

  async autoReconnect(): Promise<WalletSession | null> {
    if (!this.config.autoReconnect) return null;
    const stored = await this.readStoredSession();
    if (!stored) return null;
    const adapter = this.adapters.get(stored.adapterId);
    if (!adapter?.restoreSession) {
      this.events.emit("session_stale", { session: stored });
      return null;
    }

    try {
      const result = await adapter.restoreSession(stored);
      if (!result) {
        this.events.emit("session_stale", { session: stored });
        return null;
      }
      const session = this.createSession(adapter, result, stored.network, stored);
      await this.setSession(session);
      this.events.emit("session_restored", { session });
      this.events.emit("connected", { session });
      return session;
    } catch (error) {
      this.events.emit("session_stale", { session: stored });
      this.events.emit("error", { adapterId: stored.adapterId, error });
      return null;
    }
  }

  async disconnect(): Promise<void> {
    const session = this.session ?? undefined;
    const adapterId = this.activeAdapterId ?? session?.adapterId;
    const adapter = adapterId ? this.adapters.get(adapterId) : null;
    await adapter?.disconnect?.();
    await this.storage.removeItem(this.storageKey);
    this.session = null;
    this.activeAdapterId = null;
    this.events.emit("disconnected", {
      ...(adapterId ? { adapterId } : {}),
      ...(session ? { session } : {})
    });
  }

  async signMessage(request: string | SignMessageRequest): Promise<SignMessageResult> {
    const session = this.requireSession();
    const adapter = this.requireAdapter(session.adapterId);
    if (!adapter.signMessage) throw new WalletKitError("UNSUPPORTED", `${adapter.metadata.name} cannot sign messages`);
    const normalized = typeof request === "string" ? { message: request } : request;
    this.events.emit("signing", { kind: "message", adapterId: session.adapterId });
    try {
      const result = await adapter.signMessage({ ...normalized, account: session.account, session });
      if (!result.proof && !result.signature && !result.txBlob) {
        throw new WalletKitError("INVALID_SIGNATURE", "Wallet returned an empty signature proof");
      }
      this.events.emit("signed", { kind: "message", adapterId: session.adapterId, result });
      return result;
    } catch (error) {
      this.events.emit("rejected", { kind: "message", adapterId: session.adapterId, error });
      throw error;
    }
  }

  async signTransaction(request: TransactionPayload | SignTransactionRequest): Promise<SignTransactionResult> {
    const session = this.requireSession();
    const adapter = this.requireAdapter(session.adapterId);
    if (!adapter.signTransaction) {
      throw new WalletKitError("UNSUPPORTED", `${adapter.metadata.name} cannot sign transactions`);
    }
    const normalized: SignTransactionRequest =
      typeof request === "object" && request !== null && "transaction" in request
        ? (request as SignTransactionRequest)
        : { transaction: request as TransactionPayload };
    this.events.emit("signing", { kind: "transaction", adapterId: session.adapterId });
    try {
      const result = await adapter.signTransaction({ ...normalized, account: session.account, session });
      if (!result.signed) throw new WalletKitError("INVALID_TRANSACTION_SIGNATURE", "Wallet did not sign transaction");
      this.events.emit("signed", { kind: "transaction", adapterId: session.adapterId, result });
      return result;
    } catch (error) {
      this.events.emit("rejected", { kind: "transaction", adapterId: session.adapterId, error });
      throw error;
    }
  }

  async submitTransaction(request: SubmitTransactionRequest): Promise<TxResult> {
    const session = this.requireSession();
    const adapter = this.requireAdapter(session.adapterId);
    if (!adapter.submitTransaction) {
      throw new WalletKitError("UNSUPPORTED", `${adapter.metadata.name} cannot submit transactions`);
    }
    this.events.emit("signing", { kind: "transaction", adapterId: session.adapterId });
    try {
      const result = await adapter.submitTransaction({ ...request, account: session.account, session });
      if (!result.hash) throw new WalletKitError("INVALID_TX_RESULT", "Wallet returned an empty transaction hash");
      const transaction = this.addTransaction({
        hash: result.hash,
        status: result.status ?? "submitted",
        ...(request.methodHint ? { methodHint: request.methodHint } : {}),
        ...(request.description ? { description: request.description } : {}),
        ...(result.raw !== undefined ? { raw: result.raw } : {}),
        ...(result.explorerUrl ? { explorerUrl: result.explorerUrl } : {})
      });
      this.events.emit("signed", { kind: "transaction", adapterId: session.adapterId, result });
      if (transaction.status === "confirmed") this.events.emit("tx_confirmed", { transaction });
      if (transaction.status === "failed") this.events.emit("tx_failed", { transaction });
      return result;
    } catch (error) {
      this.events.emit("rejected", { kind: "transaction", adapterId: session.adapterId, error });
      this.events.emit("error", { adapterId: session.adapterId, error });
      throw error;
    }
  }

  addTransaction(input: Omit<Partial<WalletTransaction>, "id" | "adapterId" | "account" | "network" | "submittedAt" | "updatedAt"> & { hash: string }): WalletTransaction {
    const session = this.requireSession();
    const now = Date.now();
    const explorerUrl = input.explorerUrl ?? formatExplorerUrl(session.network.explorerTxUrl, input.hash);
    const transaction: WalletTransaction = {
      id: `${input.hash}:${now}`,
      hash: input.hash,
      adapterId: session.adapterId,
      account: session.account.address,
      network: session.network,
      status: input.status ?? "submitted",
      submittedAt: now,
      updatedAt: now,
      ...(input.methodHint ? { methodHint: input.methodHint } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(explorerUrl ? { explorerUrl } : {}),
      ...(input.raw !== undefined ? { raw: input.raw } : {})
    };
    this.transactions.unshift(transaction);
    this.events.emit("tx_submitted", { transaction });
    return transaction;
  }

  updateTransaction(hash: string, status: WalletTransactionStatus, error?: unknown): WalletTransaction | null {
    const transaction = this.transactions.find((item) => item.hash === hash) ?? null;
    if (!transaction) return null;
    transaction.status = status;
    transaction.updatedAt = Date.now();
    if (status === "confirmed") this.events.emit("tx_confirmed", { transaction });
    if (status === "failed") this.events.emit("tx_failed", { transaction, error });
    return transaction;
  }

  getTransactions(limit?: number): WalletTransaction[] {
    return typeof limit === "number" ? this.transactions.slice(0, limit) : [...this.transactions];
  }

  async authenticate(request: SignMessageRequest): Promise<SignMessageResult> {
    return this.signMessage(request);
  }

  emitQr(adapterId: string, uri: string): void {
    this.events.emit("qr", { adapterId, uri });
  }

  async setSession(session: WalletSession): Promise<void> {
    this.session = session;
    this.activeAdapterId = session.adapterId;
    const envelope: StoredWalletSessionEnvelope = { version: 1, session: createStoredSession(session), updatedAt: Date.now() };
    await this.storage.setItem(this.storageKey, JSON.stringify(envelope));
  }

  private createSession(adapter: WalletAdapter, result: ConnectResult, fallbackNetwork: WalletNetwork, previous?: WalletSession): WalletSession {
    const network = result.network ?? result.account.network ?? fallbackNetwork;
    const now = Date.now();
    const account: WalletAccount = {
      ...result.account,
      network,
      networkType: result.account.networkType ?? network.networkType
    };
    const expiresAt = result.session?.expiresAt ?? previous?.expiresAt;
    const balance = result.session?.balance ?? previous?.balance;
    return {
      id: result.session?.id ?? previous?.id ?? `${adapter.metadata.id}:${account.address}`,
      adapterId: adapter.metadata.id,
      walletName: adapter.metadata.name,
      account,
      network,
      connectedAt: result.session?.connectedAt ?? previous?.connectedAt ?? now,
      updatedAt: now,
      ...(expiresAt ? { expiresAt } : {}),
      ...(balance ? { balance } : {}),
      metadata: { ...(previous?.metadata ?? {}), ...(result.session?.metadata ?? {}) }
    };
  }

  private async readStoredSession(): Promise<WalletSession | null> {
    const value = await this.storage.getItem(this.storageKey);
    if (!value) return null;
    try {
      const envelope = JSON.parse(value) as StoredWalletSessionEnvelope;
      return envelope.version === 1 ? envelope.session : null;
    } catch {
      await this.storage.removeItem(this.storageKey);
      return null;
    }
  }

  private requireAdapter(adapterId: string): WalletAdapter {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) throw new WalletKitError("UNKNOWN_ADAPTER", `Unknown wallet adapter: ${adapterId}`);
    return adapter;
  }

  private requireSession(): WalletSession {
    if (!this.session) throw new WalletKitError("NO_SESSION", "Connect a TRON wallet first");
    return this.session;
  }

  private handleAdapterAccountChanged(adapterId: string, address: string): void {
    if (!this.session || this.session.adapterId !== adapterId || !address) return;
    const account: WalletAccount = {
      ...this.session.account,
      address
    };
    this.session = {
      ...this.session,
      id: `${adapterId}:${address}`,
      account,
      updatedAt: Date.now()
    };
    this.events.emit("accountChanged", { account, session: this.session });
    void this.setSession(this.session);
  }

  private handleAdapterNetworkChanged(adapterId: string, network: WalletNetwork): void {
    if (!this.session || this.session.adapterId !== adapterId) return;
    const account: WalletAccount = {
      ...this.session.account,
      network,
      networkType: network.networkType
    };
    this.session = {
      ...this.session,
      account,
      network,
      updatedAt: Date.now()
    };
    this.events.emit("networkChanged", { network, session: this.session });
    void this.setSession(this.session);
  }
}

function createStoredSession(session: WalletSession): WalletSession {
  const metadata = toJsonSafeObject(session.metadata);
  const balanceRaw = toJsonSafeValue(session.balance?.raw);
  const { metadata: _metadata, balance, ...baseSession } = session;
  const storedBalance: WalletSession["balance"] | undefined = balance
    ? {
        value: balance.value,
        formatted: balance.formatted,
        symbol: balance.symbol,
        ...(balance.spendable ? { spendable: balance.spendable } : {}),
        ...(balanceRaw !== undefined ? { raw: balanceRaw } : {})
      }
    : undefined;
  return {
    ...baseSession,
    account: {
      ...session.account,
      ...(session.account.network ? { network: { ...session.account.network } } : {})
    },
    network: { ...session.network },
    ...(storedBalance ? { balance: storedBalance } : {}),
    ...(metadata ? { metadata } : {})
  };
}

function toJsonSafeObject(value: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!value) return undefined;
  const safe = toJsonSafeValue(value);
  return safe && typeof safe === "object" && !Array.isArray(safe) ? (safe as Record<string, unknown>) : undefined;
}

function toJsonSafeValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") return undefined;
  if (typeof value === "bigint") return value.toString();
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return undefined;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => toJsonSafeValue(item, seen)).filter((item) => item !== undefined);
  }

  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const safe = toJsonSafeValue(item, seen);
    if (safe !== undefined) output[key] = safe;
  }
  return Object.keys(output).length > 0 ? output : undefined;
}

export { BaseWalletAdapter };
