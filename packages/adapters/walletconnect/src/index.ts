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
  allWallets?: "SHOW" | "HIDE" | "ONLY_MOBILE";
};

export type WalletConnectWalletFactory = (
  options: WalletConnectWalletFactoryOptions
) => Promise<WalletConnectWalletLike> | WalletConnectWalletLike;

export type WalletConnectAdapterOptions = {
  projectId?: string;
  metadata?: Partial<WalletMetadata>;
  onUri?: (uri: string) => void;
  network?: WalletConnectNetworkName | string;
  relayUrl?: string;
  walletFactory?: WalletConnectWalletFactory;
  appMetadata?: Record<string, unknown>;
  allWallets?: "SHOW" | "HIDE" | "ONLY_MOBILE";
};

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

  constructor(private readonly options: WalletConnectAdapterOptions = {}) {
    this.walletFactory = options.walletFactory ?? createDefaultWalletConnectWallet;
    this.relayUrl = options.relayUrl;
    this.appMetadata = options.appMetadata;
    this.allWallets = options.allWallets ?? "HIDE";
    this.network = resolveWalletConnectNetwork(options.network ?? "nile");
    this.metadata = {
      id: "walletconnect",
      name: "WalletConnect",
      icon: WALLETCONNECT_ICON,
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

  async connect(options: ConnectOptions & { onUri?: (uri: string) => void } = {}): Promise<ConnectResult> {
    if (!this.options.projectId) {
      throw new WalletKitError("WALLET_UNSUPPORTED", "WalletConnect requires a projectId before it can connect.");
    }

    try {
      this.network = typeof options.network === "object" && options.network ? options.network : this.network;
      const wallet = await this.getOrCreateWallet(this.options.projectId, this.network);
      const onUri =
        options.onUri || this.options.onUri
          ? (uri: string) => {
              this.options.onUri?.(uri);
              if (options.onUri !== this.options.onUri) options.onUri?.(uri);
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
    const wallet = this.wallet;
    this.wallet = undefined;
    this.account = undefined;
    if (wallet) await wallet.disconnect();
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
  const module = (await import("@tronweb3/walletconnect-tron")) as unknown as {
    WalletConnectWallet?: new (options: Record<string, unknown>) => WalletConnectWalletLike;
  };

  if (!module.WalletConnectWallet) {
    throw new WalletKitError("WALLET_UNSUPPORTED", "@tronweb3/walletconnect-tron does not export WalletConnectWallet.");
  }

  return new module.WalletConnectWallet({
    network: options.network,
    options: {
      projectId: options.projectId,
      ...(options.relayUrl ? { relayUrl: options.relayUrl } : {}),
      ...(options.metadata ? { metadata: options.metadata } : {})
    },
    allWallets: options.allWallets
  });
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
