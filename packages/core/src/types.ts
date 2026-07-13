export type WalletNetworkId = "mainnet" | "nile" | "shasta" | (string & {});

export interface WalletNetwork {
  id: WalletNetworkId;
  name: string;
  family?: "tron" | string;
  networkType: "MAINNET" | "TESTNET" | "DEVNET" | "CUSTOM";
  nativeAsset?: "TRX";
  nativeAssetDecimals?: 6;
  rpcUrl: string;
  httpRpcUrl?: string;
  walletConnectChainId?: string;
  explorerTxUrl?: string;
  explorerAccountUrl?: string;
  fullHost?: string;
  solidityNode?: string;
  eventServer?: string;
}

export interface WalletAccount {
  address: string;
  hexAddress?: string;
  publicKey?: string;
  network?: WalletNetwork;
  networkType?: string;
  activationStatus?: "active" | "unfunded" | "unknown";
  domain?: string;
  displayName?: string;
  avatar?: string;
}

export interface WalletSessionBalance {
  value: string;
  formatted: string;
  symbol: "TRX";
  spendable?: string;
  raw?: unknown;
}

export interface WalletSession {
  id: string;
  adapterId: string;
  walletName: string;
  account: WalletAccount;
  network: WalletNetwork;
  connectedAt: number;
  updatedAt: number;
  expiresAt?: number;
  balance?: WalletSessionBalance;
  metadata?: Record<string, unknown>;
}

export type WalletAdapterType = "extension" | "walletconnect" | "hardware" | "mobile" | "embedded" | string;
export type WalletPlatform = "extension" | "mobile" | "hardware";

export interface WalletMetadata {
  id: string;
  name: string;
  icon?: string;
  homepage?: string;
  downloadUrl?: string;
  description?: string;
  type?: WalletAdapterType;
  group?: string;
  platforms?: WalletPlatform[];
  availabilityMode?: "auto" | "on-demand";
}

export interface WalletCapabilities {
  connect: boolean;
  disconnect?: boolean;
  signMessage?: boolean;
  signTransaction?: boolean;
  submitTransaction?: boolean;
  transferTrx?: boolean;
  transferTrc10?: boolean;
  transferTrc20?: boolean;
  tokenTransfer?: boolean;
  smartContract?: boolean;
  resourceManagement?: boolean;
  governance?: boolean;
  qr?: boolean;
  deeplink?: boolean;
}

export interface ConnectOptions {
  network?: WalletNetwork | WalletNetworkId;
  appName?: string;
  onlyIfTrusted?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
  onUri?: (uri: string) => void;
  onAccountChanged?: (address: string) => void;
  onNetworkChanged?: (network: WalletNetwork) => void;
  onDisconnect?: () => void;
}

export interface ConnectResult {
  account: WalletAccount;
  network?: WalletNetwork;
  session?: Partial<WalletSession>;
  raw?: unknown;
}

export type SignatureKind = "signature" | "signedTx";

export interface SignMessageRequest {
  message: string;
  account?: WalletAccount;
  session?: WalletSession;
}

export interface SignMessageResult {
  signatureKind: SignatureKind;
  proof?: string;
  signature?: string;
  txBlob?: string;
  publicKey?: string;
  raw?: unknown;
}

export type TronMethodHint =
  | "transferTrx"
  | "transferTrc10"
  | "transferTrc20"
  | "triggerSmartContract"
  | "freezeBalance"
  | "unfreezeBalance"
  | "voteWitness"
  | "delegateResource"
  | "undelegateResource"
  | "generic";

export type TransactionPayload = Record<string, unknown>;

export interface SignTransactionRequest {
  transaction: TransactionPayload;
  account?: WalletAccount;
  session?: WalletSession;
  methodHint?: TronMethodHint;
}

export interface SignTransactionResult {
  transaction?: TransactionPayload;
  signedTransaction?: TransactionPayload;
  txBlob?: string;
  signature?: string;
  signed: boolean;
  raw?: unknown;
}

export interface SubmitTransactionRequest {
  transaction: TransactionPayload;
  methodHint?: TronMethodHint;
  account?: WalletAccount;
  session?: WalletSession;
  description?: string;
}

export type WalletTransactionStatus = "submitted" | "confirmed" | "failed" | "unknown";

export interface TxResult {
  hash: string;
  status?: WalletTransactionStatus;
  explorerUrl?: string;
  raw?: unknown;
}

export interface WalletTransaction {
  id: string;
  hash: string;
  adapterId: string;
  account: string;
  network: WalletNetwork;
  status: WalletTransactionStatus;
  methodHint?: TronMethodHint;
  description?: string;
  submittedAt: number;
  updatedAt: number;
  explorerUrl?: string;
  raw?: unknown;
}

export interface WalletStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

export const WALLET_STORAGE_VERSION = 1 as const;

export interface StoredWalletSessionEnvelope {
  version: typeof WALLET_STORAGE_VERSION;
  session: WalletSession;
  updatedAt: number;
}

export interface WalletManagerConfig {
  appName?: string;
  network?: WalletNetwork | WalletNetworkId;
  networks?: WalletNetwork[];
  storage?: WalletStorage;
  storageKey?: string;
  autoReconnect?: boolean;
  recoveryRetryDelaysMs?: number[];
  adapters?: WalletAdapter[];
}

export interface WalletAdapter {
  adapterApiVersion?: "1.0" | "1.1" | string;
  metadata: WalletMetadata;
  capabilities: WalletCapabilities;
  /**
   * Side-effect-free installed/visible marker used by UI lists.
   * This must not open wallet popups or call account request methods.
   */
  detect?: () => boolean | Promise<boolean>;
  isAvailable?: () => boolean | Promise<boolean>;
  connect(options: ConnectOptions): Promise<ConnectResult>;
  disconnect?: () => Promise<void>;
  restoreSession?: (session: WalletSession) => Promise<ConnectResult | null>;
  canRecoverSession?: (options: ConnectOptions) => boolean | Promise<boolean>;
  recoverSession?: (options: ConnectOptions) => Promise<ConnectResult | null>;
  cancelPendingConnection?: () => void | Promise<void>;
  signMessage?: (request: SignMessageRequest) => Promise<SignMessageResult>;
  signTransaction?: (request: SignTransactionRequest) => Promise<SignTransactionResult>;
  submitTransaction?: (request: SubmitTransactionRequest) => Promise<TxResult>;
}

export type TronNetwork = WalletNetwork;
export type TronAccount = WalletAccount;
export type TronTransactionPayload = TransactionPayload;
