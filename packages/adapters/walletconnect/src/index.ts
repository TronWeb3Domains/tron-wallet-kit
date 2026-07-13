import {
  TRON_MAINNET,
  TRON_NILE,
  TRON_SHASTA,
  WalletKitError,
  type ConnectOptions,
  type ConnectResult,
  type SignMessageRequest,
  type SignMessageResult,
  type SignTransactionRequest,
  type SignTransactionResult,
  type SubmitTransactionRequest,
  type TransactionPayload,
  type TxResult,
  type WalletAccount,
  type WalletAdapter,
  type WalletCapabilities,
  type WalletMetadata,
  type WalletNetwork
} from "@tron-wallet-kit/core";
import SignClient from "@walletconnect/sign-client";
import { WALLETCONNECT_ICON } from "./icon.generated";

export type WalletConnectNetworkName = "mainnet" | "shasta" | "nile";

export { WALLETCONNECT_ICON };

export type WalletConnectWalletLike = {
  connect(options?: { onUri?: (uri: string) => void }): Promise<{ address: string }>;
  disconnect(): Promise<void>;
  signMessage(message: string): Promise<string>;
  signTransaction<TTransaction extends TransactionPayload>(transaction: TTransaction): Promise<TTransaction>;
  sendTrx?(options: { to: string; amountSun: bigint }): Promise<{ txHash?: string; hash?: string; txid?: string; raw?: unknown }>;
  sendTransaction?(to: string, amountSun: number): Promise<{ txid?: string; txID?: string }>;
  checkConnectStatus?(): Promise<{ address: string }>;
};

export type WalletConnectWalletFactoryOptions = {
  projectId: string;
  network: string;
  relayUrl?: string;
  metadata?: Record<string, unknown>;
  methods?: string[];
  events?: string[];
  allWallets?: "SHOW" | "HIDE" | "ONLY_MOBILE";
};

export type WalletConnectWalletFactory = (
  options: WalletConnectWalletFactoryOptions
) => Promise<WalletConnectWalletLike> | WalletConnectWalletLike;

export type WalletConnectAdapterOptions = {
  projectId?: string;
  metadata?: Partial<WalletMetadata>;
  icon?: string;
  onUri?: (uri: string) => void;
  network?: WalletConnectNetworkName | string;
  relayUrl?: string;
  walletFactory?: WalletConnectWalletFactory;
  appMetadata?: Record<string, unknown>;
  methods?: string[];
  events?: string[];
  allWallets?: "SHOW" | "HIDE" | "ONLY_MOBILE";
};

type SignClientInstance = Awaited<ReturnType<typeof SignClient.init>>;

type WalletConnectSessionNamespace = {
  accounts?: string[];
};

type WalletConnectSession = {
  topic: string;
  namespaces?: Record<string, WalletConnectSessionNamespace>;
};

const DEFAULT_WALLETCONNECT_METHODS = ["tron_signMessage", "tron_signTransaction"] as const;
const DEFAULT_WALLETCONNECT_EVENTS = ["accountsChanged", "chainChanged"] as const;
const DEFAULT_WALLETCONNECT_APPROVAL_TIMEOUT_MS = 180_000;

export class WalletConnectAdapter implements WalletAdapter {
  readonly adapterApiVersion = "1.1";
  readonly metadata: WalletMetadata;
  readonly capabilities: WalletCapabilities = {
    connect: true,
    disconnect: true,
    signMessage: true,
    signTransaction: true,
    submitTransaction: true,
    transferTrx: true,
    qr: true,
    deeplink: true
  };

  private readonly walletFactory: WalletConnectWalletFactory;
  private readonly relayUrl: string | undefined;
  private readonly appMetadata: Record<string, unknown> | undefined;
  private readonly allWallets: "SHOW" | "HIDE" | "ONLY_MOBILE";
  private wallet: WalletConnectWalletLike | undefined;
  private account: WalletAccount | undefined;
  private network: WalletNetwork;
  private connectAttemptId = 0;

  constructor(private readonly options: WalletConnectAdapterOptions = {}) {
    this.walletFactory = options.walletFactory ?? createDefaultWalletConnectWallet;
    this.relayUrl = options.relayUrl;
    this.appMetadata = options.appMetadata;
    this.allWallets = options.allWallets ?? "HIDE";
    this.network = resolveWalletConnectNetwork(options.network ?? "nile");
    this.metadata = {
      id: "walletconnect",
      name: "WalletConnect",
      icon: options.icon ?? WALLETCONNECT_ICON,
      homepage: "https://walletconnect.com/",
      downloadUrl: "https://walletconnect.com/",
      type: "walletconnect",
      platforms: ["mobile"],
      description: "WalletConnect transport for TRON mobile wallet sessions.",
      ...options.metadata
    };
  }

  isAvailable(): boolean {
    return Boolean(this.options.projectId);
  }

  detect(): boolean {
    return this.isAvailable();
  }

  async connect(options: ConnectOptions & { onUri?: (uri: string) => void } = {}): Promise<ConnectResult> {
    if (!this.options.projectId) {
      throw new WalletKitError("WALLET_UNSUPPORTED", "WalletConnect requires a projectId before it can connect.");
    }

    try {
      this.network = typeof options.network === "object" && options.network ? options.network : this.network;
      this.connectAttemptId += 1;
      const wallet = await this.getOrCreateWallet(this.options.projectId, this.network);
      const onUri =
        options.onUri || this.options.onUri
          ? (uri: string) => {
              options.onUri?.(uri);
              if (options.onUri !== this.options.onUri) this.options.onUri?.(uri);
            }
          : undefined;
      const { address } = await wallet.connect(onUri ? { onUri } : undefined);
      if (!address) throw new WalletKitError("CONNECTION_FAILED", "WalletConnect did not return an address.");
      this.wallet = wallet;
      this.account = { address, network: this.network, networkType: this.network.networkType, activationStatus: "unknown" };
      return { account: this.account, network: this.network, raw: wallet };
    } catch (cause) {
      await this.cleanupHalfOpenSession();
      throw normalizeWalletConnectError(cause, "CONNECTION_FAILED", "Failed to connect WalletConnect.");
    }
  }

  async restoreSession(): Promise<ConnectResult | null> {
    if (!this.options.projectId || !this.wallet?.checkConnectStatus) return null;
    const { address } = await this.wallet.checkConnectStatus();
    if (!address) return null;
    this.account = { address, network: this.network, networkType: this.network.networkType };
    return { account: this.account, network: this.network, raw: this.wallet };
  }

  async disconnect(): Promise<void> {
    this.connectAttemptId += 1;
    const wallet = this.wallet;
    this.wallet = undefined;
    this.account = undefined;
    if (wallet) await wallet.disconnect();
  }

  async cancelPendingConnection(): Promise<void> {
    this.connectAttemptId += 1;
    await this.cleanupHalfOpenSession();
  }

  async signMessage(request: SignMessageRequest): Promise<SignMessageResult> {
    try {
      const signature = await this.getConnectedWallet().signMessage(request.message);
      return { signatureKind: "signature", signature, proof: signature, raw: signature };
    } catch (cause) {
      throw normalizeWalletConnectError(cause, "SIGN_MESSAGE_FAILED", "Failed to sign message with WalletConnect.");
    }
  }

  async signTransaction(request: SignTransactionRequest): Promise<SignTransactionResult> {
    try {
      const transaction = await this.getConnectedWallet().signTransaction(request.transaction);
      const signature = extractSignature(transaction);
      return { transaction, signedTransaction: transaction, ...(signature ? { signature } : {}), signed: true, raw: transaction };
    } catch (cause) {
      throw normalizeWalletConnectError(cause, "SIGN_TRANSACTION_FAILED", "Failed to sign transaction with WalletConnect.");
    }
  }

  async submitTransaction(request: SubmitTransactionRequest): Promise<TxResult> {
    try {
      const wallet = this.getConnectedWallet();
      if (request.methodHint === "transferTrx") {
        const to = String(request.transaction.to ?? "");
        const amountSun = BigInt(String(request.transaction.amountSun ?? 0));
        if (wallet.sendTrx) {
          const raw = await wallet.sendTrx({ to, amountSun });
          const hash = raw.txHash ?? raw.hash ?? raw.txid;
          if (!hash) throw new WalletKitError("SEND_TRANSACTION_FAILED", "WalletConnect did not return a transaction hash.", raw);
          return { hash, status: "submitted", raw };
        }
        if (wallet.sendTransaction) {
          const raw = await wallet.sendTransaction(to, toSafeNumber(amountSun));
          const hash = raw.txid ?? raw.txID;
          if (!hash) throw new WalletKitError("SEND_TRANSACTION_FAILED", "WalletConnect did not return a transaction hash.", raw);
          return { hash, status: "submitted", raw };
        }
      }

      const signRequest = {
        transaction: request.transaction,
        ...(request.methodHint ? { methodHint: request.methodHint } : {}),
        ...(request.account ? { account: request.account } : {}),
        ...(request.session ? { session: request.session } : {})
      };
      const signed = await this.signTransaction(signRequest);
      const hash = String(signed.transaction?.txID ?? signed.transaction?.txid ?? signed.signedTransaction?.txID ?? "");
      if (!hash) throw new WalletKitError("SEND_TRANSACTION_FAILED", "Signed transaction did not include a transaction hash.");
      return { hash, status: "submitted", raw: signed.raw };
    } catch (cause) {
      throw normalizeWalletConnectError(cause, "SEND_TRANSACTION_FAILED", "Failed to submit transaction with WalletConnect.");
    }
  }

  private async getOrCreateWallet(projectId: string, network: WalletNetwork): Promise<WalletConnectWalletLike> {
    if (this.wallet) return this.wallet;
    const wallet = await this.walletFactory({
      projectId,
      network: network.walletConnectChainId ?? toWalletConnectChainId(network.id),
      allWallets: this.allWallets,
      ...(this.options.methods ? { methods: this.options.methods } : {}),
      ...(this.options.events ? { events: this.options.events } : {}),
      ...(this.relayUrl ? { relayUrl: this.relayUrl } : {}),
      ...(this.appMetadata ? { metadata: this.appMetadata } : {})
    });
    this.wallet = wallet;
    return wallet;
  }

  private getConnectedWallet(): WalletConnectWalletLike {
    if (!this.wallet) throw new WalletKitError("NO_SESSION", "WalletConnect is not connected.");
    return this.wallet;
  }

  private async cleanupHalfOpenSession(): Promise<void> {
    const wallet = this.wallet;
    this.wallet = undefined;
    if (!wallet) return;
    try {
      await wallet.disconnect();
    } catch {
      // Best-effort cleanup for aborted QR/session flows.
    }
  }
}

export function createWalletConnectAdapter(options: WalletConnectAdapterOptions = {}): WalletConnectAdapter {
  return new WalletConnectAdapter(options);
}

async function createDefaultWalletConnectWallet(options: WalletConnectWalletFactoryOptions): Promise<WalletConnectWalletLike> {
  return new LiteWalletConnectWallet(options);
}

class LiteWalletConnectWallet implements WalletConnectWalletLike {
  private client: SignClientInstance | undefined;
  private session: WalletConnectSession | undefined;
  private address: string | undefined;

  constructor(private readonly options: WalletConnectWalletFactoryOptions) {}

  async connect(options: { onUri?: (uri: string) => void } = {}): Promise<{ address: string }> {
    const client = await this.getClient();
    const existingTopics = new Set(getSignClientSessions(client).map((session) => session.topic));
    const { uri, approval } = await client.connect({
      requiredNamespaces: {
        tron: {
          methods: this.options.methods ?? [...DEFAULT_WALLETCONNECT_METHODS],
          chains: [this.options.network],
          events: this.options.events ?? [...DEFAULT_WALLETCONNECT_EVENTS]
        }
      }
    });

    if (uri) options.onUri?.(uri);

    const session = await Promise.race([
      approval() as Promise<WalletConnectSession>,
      waitForApprovedSession(client, this.options.network, existingTopics, DEFAULT_WALLETCONNECT_APPROVAL_TIMEOUT_MS)
    ]);
    const address = getSessionAddress(session, this.options.network);
    if (!address) throw new WalletKitError("CONNECTION_FAILED", "WalletConnect did not return an address.", session);

    this.session = session;
    this.address = address;
    return { address };
  }

  async disconnect(): Promise<void> {
    const session = this.session;
    this.session = undefined;
    this.address = undefined;
    if (!session || !this.client) return;
    await this.client.disconnect({
      topic: session.topic,
      reason: { code: 6000, message: "User disconnected." }
    });
  }

  async signMessage(message: string): Promise<string> {
    const result = await this.request<unknown>("tron_signMessage", {
      address: this.getAddress(),
      currentAddress: this.getAddress(),
      message
    });
    return normalizeWalletConnectResult(result);
  }

  async signTransaction<TTransaction extends TransactionPayload>(transaction: TTransaction): Promise<TTransaction> {
    const result = await this.request<unknown>("tron_signTransaction", {
      currentAddress: this.getAddress(),
      transaction: { ...transaction }
    });
    return normalizeWalletConnectResult<TTransaction>(result);
  }

  async checkConnectStatus(): Promise<{ address: string }> {
    const client = await this.getClient();
    const sessions = getSignClientSessions(client);
    const session = sessions.find((candidate) => Boolean(getSessionAddress(candidate, this.options.network)));
    const address = session ? getSessionAddress(session, this.options.network) : undefined;
    if (!session || !address) return { address: "" };
    this.session = session;
    this.address = address;
    return { address };
  }

  private async request<TResult>(method: string, params: Record<string, unknown>): Promise<TResult> {
    const client = await this.getClient();
    const session = this.getSession();
    return client.request<TResult>({
      topic: session.topic,
      chainId: this.options.network,
      request: { method, params }
    });
  }

  private async getClient(): Promise<SignClientInstance> {
    if (this.client) return this.client;
    const metadata = normalizeWalletConnectMetadata(this.options.metadata);
    this.client = await SignClient.init({
      projectId: this.options.projectId,
      ...(this.options.relayUrl ? { relayUrl: this.options.relayUrl } : {}),
      metadata
    });
    this.client.on("session_delete", () => {
      this.session = undefined;
      this.address = undefined;
    });
    return this.client;
  }

  private getSession(): WalletConnectSession {
    if (!this.session) throw new WalletKitError("NO_SESSION", "WalletConnect is not connected.");
    return this.session;
  }

  private getAddress(): string {
    if (!this.address) throw new WalletKitError("NO_SESSION", "WalletConnect is not connected.");
    return this.address;
  }
}

function normalizeWalletConnectMetadata(metadata: Record<string, unknown> | undefined): {
  name: string;
  description: string;
  url: string;
  icons: string[];
} {
  const defaultUrl = typeof globalThis.location === "object" && globalThis.location?.origin ? globalThis.location.origin : "https://trxdomains.xyz";
  const icons = Array.isArray(metadata?.icons) ? metadata.icons.filter((icon): icon is string => typeof icon === "string") : [];
  return {
    name: typeof metadata?.name === "string" ? metadata.name : "TRON Wallet Kit",
    description: typeof metadata?.description === "string" ? metadata.description : "TRON Wallet Kit",
    url: typeof metadata?.url === "string" ? metadata.url : defaultUrl,
    icons
  };
}

function getSignClientSessions(client: SignClientInstance): WalletConnectSession[] {
  const sessionStore = (client as SignClientInstance & { session?: { getAll?: () => WalletConnectSession[] } }).session;
  return sessionStore?.getAll?.() ?? [];
}

async function waitForApprovedSession(client: SignClientInstance, chainId: string, existingTopics: ReadonlySet<string>, timeoutMs: number): Promise<WalletConnectSession> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const session = getSignClientSessions(client).find((candidate) => !existingTopics.has(candidate.topic) && Boolean(getSessionAddress(candidate, chainId)));
    if (session) return session;
    await delay(250);
  }
  throw new WalletKitError("REQUEST_TIMEOUT", "WalletConnect approval timed out.");
}

function getSessionAddress(session: WalletConnectSession, chainId: string): string | undefined {
  const namespaces = Object.values(session.namespaces ?? {});
  const accounts = namespaces.flatMap((namespace) => namespace.accounts ?? []);
  const account = accounts.find((candidate) => candidate.startsWith(`${chainId}:`)) ??
    accounts.find((candidate) => candidate.startsWith("tron:")) ??
    accounts[0];
  const address = account?.split(":").pop();
  return address || undefined;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeWalletConnectResult<TResult = string>(result: unknown): TResult {
  if (typeof result === "string") {
    try {
      const parsed = JSON.parse(result) as { result?: TResult };
      return (parsed.result ?? parsed) as TResult;
    } catch {
      return result as TResult;
    }
  }
  if (typeof result === "object" && result !== null && "result" in result) {
    return (result as { result?: TResult }).result as TResult;
  }
  return result as TResult;
}

function toWalletConnectChainId(network: WalletConnectNetworkName | string): string {
  if (network === "mainnet") return "tron:0x2b6653dc";
  if (network === "shasta") return "tron:0x94a9059e";
  if (network === "nile") return "tron:0xcd8690dc";
  return network.startsWith("tron:") ? network : `tron:${network}`;
}

function resolveWalletConnectNetwork(network: WalletConnectNetworkName | string): WalletNetwork {
  const chainId = toWalletConnectChainId(network).replace(/^tron:/, "");
  if (chainId === "0x2b6653dc") return { ...TRON_MAINNET };
  if (chainId === "0x94a9059e") return { ...TRON_SHASTA };
  if (chainId === "0xcd8690dc") return { ...TRON_NILE };
  return {
    id: "unknown",
    name: "TRON Custom",
    family: "tron",
    networkType: "CUSTOM",
    nativeAsset: "TRX",
    nativeAssetDecimals: 6,
    rpcUrl: "",
    walletConnectChainId: toWalletConnectChainId(network)
  };
}

function extractSignature(transaction: TransactionPayload): string | undefined {
  const signature = transaction.signature;
  if (Array.isArray(signature) && typeof signature[0] === "string") return signature[0];
  return typeof signature === "string" ? signature : undefined;
}

function toSafeNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new WalletKitError("SEND_TRANSACTION_FAILED", "TRX amount in SUN is too large.");
  }
  return Number(value);
}

function normalizeWalletConnectError(cause: unknown, code: string, message: string): WalletKitError {
  if (cause instanceof WalletKitError) return cause;
  if (isWalletConnectUserRejected(cause)) {
    return new WalletKitError("USER_REJECTED", "User rejected the WalletConnect request.", cause);
  }
  return new WalletKitError(code, message, cause);
}

function isWalletConnectUserRejected(cause: unknown): boolean {
  if (!(typeof cause === "object" && cause !== null)) return false;
  const message = "message" in cause ? String((cause as { message?: unknown }).message) : "";
  const code = "code" in cause ? (cause as { code?: unknown }).code : undefined;
  return code === 4001 || /user closed|user rejected|rejected/i.test(message);
}
