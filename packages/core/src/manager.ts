import { BaseWalletAdapter } from "./adapter";
import { WalletKitError, createWalletError, normalizeWalletError } from "./errors";
import { WalletEventEmitter } from "./events";
import type { WalletEventListener, WalletEventName } from "./events";
import { NetworkRegistry } from "./networks";
import { MemoryWalletStorage } from "./storage";
import { WalletTransactionStore } from "./tx-store";
import { WALLET_STORAGE_VERSION } from "./types";
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

const DEFAULT_CONNECT_TIMEOUT_MS = 180_000;
const DEFAULT_DISCONNECT_TIMEOUT_MS = 2_000;
const DEFAULT_SIGN_TIMEOUT_MS = 180_000;
const RECOVER_SESSION_RETRY_DELAYS_MS = [0, 700, 1600, 3000];

export class WalletManager {
  readonly events = new WalletEventEmitter();
  readonly registry: NetworkRegistry;
  readonly storage: WalletStorage;
  readonly storageKey: string;
  readonly appName: string | undefined;
  readonly transactionStore: WalletTransactionStore | null;
  private readonly adapters = new Map<string, WalletAdapter>();
  private readonly transactions: WalletTransaction[] = [];
  private session: WalletSession | null = null;
  private activeAdapterId: string | null = null;
  private pendingAdapterId: string | null = null;
  private pendingAbortController: AbortController | undefined;
  private autoReconnectPromise: Promise<WalletSession | null> | undefined;

  constructor(readonly config: WalletManagerConfig = {}) {
    this.appName = config.appName ?? config.metadata?.name;
    this.registry = new NetworkRegistry(config.networks);
    this.storage = config.storage ?? new MemoryWalletStorage();
    this.storageKey = config.storageKey ?? "session";
    this.transactionStore =
      config.transactionStore === false || config.transactionStore?.enabled === false
        ? null
        : new WalletTransactionStore({
            storage: this.storage,
            keyPrefix: config.transactionStore?.storageKey ?? `${this.storageKey}:transactions`,
            ...(config.transactionStore?.max !== undefined ? { max: config.transactionStore.max } : {}),
            ...(config.transactionStore?.staleSubmittedMs !== undefined ? { staleSubmittedMs: config.transactionStore.staleSubmittedMs } : {})
          });
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
    await this.cancelPendingConnection(adapterId);
    if (this.activeAdapterId && this.activeAdapterId !== adapterId) {
      await this.disconnect();
    }
    this.pendingAdapterId = adapterId;
    this.pendingAbortController = new AbortController();
    this.events.emit("connecting", { adapterId });
    try {
      const network = this.registry.resolve(options.network ?? this.config.network);
      const signal = options.signal ?? this.pendingAbortController.signal;
      const connectOptions: ConnectOptions = { ...options, network, signal };
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
      const { timedOut, value: result } = await this.withTimeout(adapter.connect(connectOptions), options.timeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS);
      if (timedOut) {
        // Adapter's connect() promise is left dangling on timeout — tell the adapter to clean up
        // its pending request (deeplink/popup) so it doesn't leak.
        try { await adapter.cancelPendingConnection?.(); } catch { /* best-effort */ }
        throw createWalletError.requestTimeout(`${adapter.metadata.name} connect timed out`);
      }
      if (signal.aborted || this.pendingAdapterId !== adapterId || !result) throw createWalletError.connectionRejected(adapter.metadata.name);
      const session = this.createSession(adapter, result, network, undefined, options.metadata);
      await this.setSession(session);
      this.events.emit("connected", { session });
      return session;
    } catch (error) {
      const normalized = normalizeWalletError(error);
      this.events.emit("rejected", { kind: "connect", adapterId, error: normalized });
      this.events.emit("error", { adapterId, error: normalized });
      throw normalized;
    } finally {
      if (this.pendingAdapterId === adapterId) {
        this.pendingAdapterId = null;
        this.pendingAbortController = undefined;
      }
    }
  }

  async autoReconnect(): Promise<WalletSession | null> {
    if (!this.config.autoReconnect) return null;
    this.autoReconnectPromise ??= this.runAutoReconnect().finally(() => {
      this.autoReconnectPromise = undefined;
    });
    return this.autoReconnectPromise;
  }

  async clearStoredSession(): Promise<void> {
    await this.storage.removeItem(this.storageKey);
  }

  async disconnect(): Promise<void> {
    const session = this.session ?? undefined;
    const adapterId = this.activeAdapterId ?? session?.adapterId;
    const adapter = adapterId ? this.adapters.get(adapterId) : null;
    try {
      await this.cancelPendingConnection();
      const { timedOut } = await this.withTimeout(adapter?.disconnect?.(), DEFAULT_DISCONNECT_TIMEOUT_MS);
      if (adapter?.disconnect && timedOut) {
        this.events.emit("session_stale", { ...(session ? { session } : {}), reason: "disconnect_timeout" });
        await adapter.cancelPendingConnection?.();
      }
    } catch (error) {
      const normalized = normalizeWalletError(error);
      this.events.emit("error", { ...(adapterId ? { adapterId } : {}), error: normalized });
      await Promise.resolve(adapter?.cancelPendingConnection?.()).catch(() => {});
    } finally {
      await this.storage.removeItem(this.storageKey);
      this.session = null;
      this.activeAdapterId = null;
      this.transactions.length = 0;
      this.events.emit("disconnected", {
        ...(adapterId ? { adapterId } : {}),
        ...(session ? { session } : {})
      });
    }
  }

  async signMessage(request: string | SignMessageRequest): Promise<SignMessageResult> {
    const session = this.requireSession();
    const adapter = this.requireAdapter(session.adapterId);
    if (!adapter.signMessage) throw new WalletKitError("UNSUPPORTED", `${adapter.metadata.name} cannot sign messages`);
    const normalized = typeof request === "string" ? { message: request } : request;
    this.events.emit("signing", { kind: "message", adapterId: session.adapterId });
    try {
      const { timedOut, value: result } = await this.withTimeout(adapter.signMessage({ ...normalized, account: session.account, session }), DEFAULT_SIGN_TIMEOUT_MS);
      if (timedOut) {
        try { await adapter.cancelPendingConnection?.(); } catch { /* best-effort */ }
        throw createWalletError.requestTimeout(`${adapter.metadata.name} sign message timed out`);
      }
      if (!result) throw createWalletError.requestTimeout(`${adapter.metadata.name} sign message timed out`);
      if (!result.proof && !result.signature && !result.txBlob) {
        throw new WalletKitError("INVALID_SIGNATURE", "Wallet returned an empty signature proof");
      }
      this.events.emit("signed", { kind: "message", adapterId: session.adapterId, result });
      return result;
    } catch (error) {
      const normalizedError = normalizeWalletError(error);
      this.events.emit("rejected", { kind: "message", adapterId: session.adapterId, error: normalizedError });
      throw normalizedError;
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
      const { timedOut, value: result } = await this.withTimeout(adapter.signTransaction({ ...normalized, account: session.account, session }), DEFAULT_SIGN_TIMEOUT_MS);
      if (timedOut) {
        try { await adapter.cancelPendingConnection?.(); } catch { /* best-effort */ }
        throw createWalletError.requestTimeout(`${adapter.metadata.name} sign transaction timed out`);
      }
      if (!result) throw createWalletError.requestTimeout(`${adapter.metadata.name} sign transaction timed out`);
      if (!result.signed) throw new WalletKitError("INVALID_TRANSACTION_SIGNATURE", "Wallet did not sign transaction");
      this.events.emit("signed", { kind: "transaction", adapterId: session.adapterId, result });
      return result;
    } catch (error) {
      const normalizedError = normalizeWalletError(error);
      this.events.emit("rejected", { kind: "transaction", adapterId: session.adapterId, error: normalizedError });
      throw normalizedError;
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
      const { timedOut, value: result } = await this.withTimeout(adapter.submitTransaction({ ...request, account: session.account, session }), DEFAULT_SIGN_TIMEOUT_MS);
      if (timedOut) {
        try { await adapter.cancelPendingConnection?.(); } catch { /* best-effort */ }
        throw createWalletError.requestTimeout(`${adapter.metadata.name} submit transaction timed out`);
      }
      if (!result) throw createWalletError.requestTimeout(`${adapter.metadata.name} submit transaction timed out`);
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
      const normalizedError = normalizeWalletError(error);
      this.events.emit("rejected", { kind: "transaction", adapterId: session.adapterId, error: normalizedError });
      this.events.emit("error", { adapterId: session.adapterId, error: normalizedError });
      throw normalizedError;
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
      ...(input.kind ? { kind: input.kind } : {}),
      ...(input.direction ? { direction: input.direction } : {}),
      ...(input.title ? { title: input.title } : {}),
      ...(input.subtitle ? { subtitle: input.subtitle } : {}),
      ...(input.amountText ? { amountText: input.amountText } : {}),
      ...(input.amountTone ? { amountTone: input.amountTone } : {}),
      ...(input.token ? { token: input.token } : {}),
      ...(input.resource ? { resource: input.resource } : {}),
      ...(explorerUrl ? { explorerUrl } : {}),
      ...(input.raw !== undefined ? { raw: input.raw } : {})
    };
    this.transactions.unshift(transaction);
    this.applyTransactionLimitAndStaleness();
    void this.persistTransactions();
    this.events.emit("tx_submitted", { transaction });
    return transaction;
  }

  updateTransaction(hash: string, status: WalletTransactionStatus, error?: unknown): WalletTransaction | null {
    const transaction = this.transactions.find((item) => item.hash === hash) ?? null;
    if (!transaction) return null;
    transaction.status = status;
    transaction.updatedAt = Date.now();
    void this.persistTransactions();
    if (status === "confirmed") this.events.emit("tx_confirmed", { transaction });
    if (status === "failed") this.events.emit("tx_failed", { transaction, error });
    return transaction;
  }

  getTransactions(limit?: number): WalletTransaction[] {
    this.applyTransactionLimitAndStaleness();
    return typeof limit === "number" ? this.transactions.slice(0, limit) : [...this.transactions];
  }

  async authenticate(request: SignMessageRequest): Promise<SignMessageResult> {
    return this.signMessage(request);
  }

  emitQr(adapterId: string, uri: string): void {
    this.events.emit("qr", { adapterId, uri });
  }

  async setSession(session: WalletSession): Promise<void> {
    const previous = this.session;
    this.session = session;
    this.activeAdapterId = session.adapterId;
    const envelope: StoredWalletSessionEnvelope = { version: WALLET_STORAGE_VERSION, session: createStoredSession(session), updatedAt: Date.now() };
    await this.storage.setItem(this.storageKey, JSON.stringify(envelope));
    if (!previous || previous.account.address !== session.account.address || previous.network.id !== session.network.id) {
      await this.loadTransactionsForSession(session);
    }
  }

  async cancelPendingConnection(exceptAdapterId?: string): Promise<void> {
    const pending = this.pendingAdapterId;
    if (!pending || pending === exceptAdapterId) return;
    this.pendingAbortController?.abort();
    this.pendingAbortController = undefined;
    this.pendingAdapterId = null;
    try {
      await this.adapters.get(pending)?.cancelPendingConnection?.();
    } catch (error) {
      this.events.emit("error", { adapterId: pending, error: normalizeWalletError(error) });
    }
    this.events.emit("session_stale", { reason: "connection_cancelled" });
  }

  destroy(): void {
    void this.cancelPendingConnection();
    this.events.removeAllListeners();
  }

  private async runAutoReconnect(): Promise<WalletSession | null> {
    const serialized = await this.storage.getItem(this.storageKey);
    if (!serialized) return this.recoverPendingReturnSession();

    const stored = this.parseStoredSession(serialized);
    if (!stored) {
      await this.storage.removeItem(this.storageKey);
      this.events.emit("session_expired", {});
      return null;
    }

    const adapter = this.adapters.get(stored.adapterId);
    if (!adapter) {
      await this.storage.removeItem(this.storageKey);
      this.events.emit("session_expired", { session: stored });
      return null;
    }

    try {
      if (adapter.restoreSession) {
        const result = await adapter.restoreSession(stored);
        if (!result) {
          this.events.emit("session_stale", { session: stored, reason: "restore_unavailable" });
          return null;
        }
        const session = this.createSession(adapter, result, stored.network, stored);
        await this.setSession(session);
        this.events.emit("session_restored", { session });
        this.events.emit("connected", { session });
        return session;
      }

      if (adapter.isAvailable && !(await adapter.isAvailable())) {
        this.events.emit("session_stale", { session: stored, reason: "adapter_unavailable" });
        return null;
      }
      await this.setSession(stored);
      this.events.emit("session_restored", { session: stored, stale: true });
      this.events.emit("connected", { session: stored });
      return stored;
    } catch (error) {
      const normalized = normalizeWalletError(error);
      await this.storage.removeItem(this.storageKey);
      this.events.emit("session_expired", { session: stored });
      this.events.emit("error", { adapterId: stored.adapterId, error: normalized });
      return null;
    }
  }

  private async recoverPendingReturnSession(): Promise<WalletSession | null> {
    const network = this.getNetwork();
    const candidates: WalletAdapter[] = [];
    for (const adapter of this.adapters.values()) {
      if (!adapter.recoverSession) continue;
      try {
        if (adapter.canRecoverSession && !(await adapter.canRecoverSession({ network, walletId: adapter.metadata.id } as ConnectOptions & { walletId: string }))) continue;
        candidates.push(adapter);
      } catch {
        // Skip adapters whose recovery probe throws.
      }
    }
    if (candidates.length === 0) return null;

    const announced = new Set<string>();
    const delays = this.config.recoveryRetryDelaysMs ?? RECOVER_SESSION_RETRY_DELAYS_MS;
    for (const delayMs of delays) {
      if (delayMs > 0) await this.delay(delayMs);
      for (const adapter of candidates) {
        try {
          if (!announced.has(adapter.metadata.id)) {
            announced.add(adapter.metadata.id);
            this.events.emit("connecting", { adapterId: adapter.metadata.id, recovering: true });
          }
          const result = await adapter.recoverSession?.({ network });
          if (!result) continue;
          const session = this.createSession(adapter, result, network);
          await this.setSession(session);
          this.events.emit("session_restored", { session });
          this.events.emit("connected", { session });
          return session;
        } catch {
          // Try the next adapter or retry cycle.
        }
      }
    }

    for (const adapter of candidates) {
      this.events.emit("session_stale", { reason: "recover_unavailable", attempts: delays.length });
      void adapter.cancelPendingConnection?.();
    }
    return null;
  }

  private createSession(adapter: WalletAdapter, result: ConnectResult, fallbackNetwork: WalletNetwork, previous?: WalletSession, metadata?: Record<string, unknown>): WalletSession {
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
      metadata: { ...(previous?.metadata ?? {}), ...(metadata ?? {}), ...(result.session?.metadata ?? {}) }
    };
  }

  private async readStoredSession(): Promise<WalletSession | null> {
    const value = await this.storage.getItem(this.storageKey);
    if (!value) return null;
    const session = this.parseStoredSession(value);
    if (!session) await this.storage.removeItem(this.storageKey);
    return session;
  }

  private parseStoredSession(serialized: string): WalletSession | null {
    try {
      const parsed = JSON.parse(serialized) as Partial<StoredWalletSessionEnvelope> | WalletSession;
      if (parsed && typeof parsed === "object" && "version" in parsed && "session" in parsed) {
        return parsed.version === WALLET_STORAGE_VERSION && this.isValidStoredSession(parsed.session) ? parsed.session : null;
      }
      return this.isValidStoredSession(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private isValidStoredSession(value: unknown): value is WalletSession {
    if (!value || typeof value !== "object") return false;
    const session = value as Partial<WalletSession>;
    if (typeof session.adapterId !== "string" || session.adapterId.length === 0) return false;
    if (typeof session.connectedAt !== "number") return false;
    if (!session.account || typeof session.account.address !== "string" || session.account.address.length === 0) return false;
    if (!session.network || typeof session.network !== "object") return false;
    if (typeof session.expiresAt === "number" && session.expiresAt <= Date.now()) return false;
    return true;
  }

  private async withTimeout<T>(promise: Promise<T> | undefined, timeoutMs: number): Promise<{ timedOut: boolean; value?: T }> {
    if (!promise) return { timedOut: false };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<{ timedOut: true }>((resolve) => {
      timer = setTimeout(() => resolve({ timedOut: true }), timeoutMs);
    });
    try {
      return await Promise.race([promise.then((value) => ({ timedOut: false, value }) as const), timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private requireAdapter(adapterId: string): WalletAdapter {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) throw createWalletError.walletNotFound(adapterId);
    return adapter;
  }

  private requireSession(): WalletSession {
    if (!this.session) throw createWalletError.notConnected();
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
    this.transactions.length = 0;
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
    this.transactions.length = 0;
    void this.setSession(this.session);
  }

  private async loadTransactionsForSession(session: WalletSession): Promise<void> {
    if (!this.transactionStore) {
      this.applyTransactionLimitAndStaleness();
      return;
    }
    const loaded = await this.transactionStore.load(session.account.address, session.network.id);
    this.transactions.length = 0;
    this.transactions.push(...loaded);
  }

  private async persistTransactions(): Promise<void> {
    const session = this.session;
    if (!session || !this.transactionStore) return;
    await this.transactionStore.save(session.account.address, session.network.id, this.transactions);
  }

  private applyTransactionLimitAndStaleness(): void {
    if (!this.transactionStore) return;
    const normalized = this.transactionStore.normalize(this.transactions);
    this.transactions.length = 0;
    this.transactions.push(...normalized);
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
