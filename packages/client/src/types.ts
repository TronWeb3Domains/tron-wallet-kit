import type { TronLinkAdapterOptions } from "@tron-wallet-kit/adapter-tronlink";
import type { WalletConnectAdapterOptions, WalletConnectNetworkName } from "@tron-wallet-kit/adapter-walletconnect";
import type { TronwalletBridgeInnerAdapter, TronwalletBridgeTronWeb } from "@tron-wallet-kit/adapter-tronwallet-bridge";
import type {
  SignTransactionRequest,
  SignMessageRequest,
  SignMessageResult,
  SignTransactionResult,
  TransactionPayload,
  TronAccount,
  TronNetwork,
  TxResult,
  WalletAdapter,
  WalletAdapterType,
  WalletCapabilities,
  WalletManager,
  WalletManagerConfig,
  WalletMetadata,
  WalletNetwork,
  WalletNetworkId,
  WalletPlatform,
  WalletSessionBalance
} from "@tron-wallet-kit/core";
import type { ResolvedWalletUiConfig, ThemeConfig, WalletButton, WalletModal, WalletToast, WalletUiConfig } from "@tron-wallet-kit/ui";
import type { TronWalletCatalogItem } from "@tron-wallet-kit/ui";
import type { InjectedStrategy } from "./adapters/injected-strategy";
import type { WalletDescriptor } from "./wallets/types";

export type { WalletConnectAdapterOptions, WalletConnectNetworkName };


export type DefaultAdaptersConfig = {
  wallets?: "all" | Array<string | WalletDescriptor>;
  disabledWallets?: readonly string[];
  walletConnectProjectId?: string;
  walletConnectNetwork?: WalletConnectNetworkName | string;
  tronlink?: TronLinkAdapterOptions;
  walletconnect?: Omit<WalletConnectAdapterOptions, "projectId" | "network">;
  tronweb3Bridge?: {
    enabled?: boolean;
    tronWeb?: TronwalletBridgeTronWeb | (() => TronwalletBridgeTronWeb | undefined);
    network?: WalletNetwork;
  };
  onWalletConnectUri?: (uri: string) => void;
};

export type WalletClientConfig = Omit<WalletManagerConfig, "adapters" | "network"> &
  DefaultAdaptersConfig & {
    network?: WalletNetwork | WalletNetworkId;
    adapters?: WalletAdapter[];
    tronweb3Adapters?: TronWeb3AdapterBridgeConfig[];
    ui?: WalletUiConfig;
    connectButton?: {
      target?: HTMLElement | string;
      label?: string;
      connectedLabel?: string;
      showBalance?: boolean;
    };
    useBrowserStorage?: boolean;
    identity?: WalletClientIdentityConfig;
    balance?: WalletClientBalanceConfig;
    tronWeb?: {
      fullHost?: string;
      apiKey?: string;
      headers?: Record<string, string>;
    };
  };

export type TronWeb3AdapterLike = TronwalletBridgeInnerAdapter;

export type TronWeb3AdapterBridgeConfig = {
  adapter: TronWeb3AdapterLike;
  id?: string;
  metadata?: Partial<WalletMetadata>;
  type?: WalletAdapterType;
  platforms?: WalletPlatform[];
  group?: string;
  network?: WalletNetwork;
  tronWeb?: TronwalletBridgeTronWeb | (() => TronwalletBridgeTronWeb | undefined);
  capabilities?: Partial<WalletCapabilities>;
  signMessageMode?: "string" | "messageObject";
};

export type InjectedTronProvider = {
  tronWeb?: {
    defaultAddress?: {
      base58?: string;
      hex?: string;
    };
    trx?: {
      getBalance?(address: string): Promise<unknown> | unknown;
      getBlockByNumber?(blockNumber: number): Promise<{ blockID?: string }>;
      signMessageV2?(message: string): Promise<string>;
      sign?(payload: TransactionPayload | string): Promise<unknown>;
    };
  };
  request?: (args: { method: string; params?: unknown }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  off?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export type InjectedTronAdapterConfig = {
  id: string;
  name: string;
  providerPaths: readonly string[];
  strategy?: InjectedStrategy;
  icon?: string;
  homepage?: string;
  downloadUrl?: string;
  platforms?: WalletPlatform[];
  provider?: () => InjectedTronProvider | undefined;
  availabilityProbe?: () => boolean | Promise<boolean>;
  requestMethods?: readonly string[];
  signMessageMode?: "signMessageV2" | "sign" | "request";
  availabilityTimeoutMs?: number;
  addressTimeoutMs?: number;
  addressSettleMs?: number;
  accountChangeEventNames?: readonly string[];
  accountChangeTimeoutMs?: number;
  emptyAddressRetryDelayMs?: number;
  emptyAddressRetryTimeoutMs?: number;
  preferInjectedAddress?: boolean;
  metadata?: Partial<WalletMetadata>;
};

export type TransferTrxRequest = {
  to: string;
  amountSun: string | number | bigint;
  description?: string;
};

export type TransferTrc10Request = {
  tokenId: string;
  to: string;
  amount: string | number | bigint;
  description?: string;
};

export type TransferTrc20Request = {
  contractAddress: string;
  to: string;
  amount: string | number | bigint;
  feeLimit?: string | number | bigint;
  description?: string;
};

export type TriggerSmartContractRequest = {
  contractAddress: string;
  functionSelector?: string;
  function?: string;
  options?: Record<string, unknown>;
  parameters?: unknown[];
  parameter?: unknown[];
  issuerAddress?: string;
  callValue?: string | number | bigint;
  feeLimit?: string | number | bigint;
  description?: string;
};

export type ResourceRequest = {
  amountSun: string | number | bigint;
  resource: "BANDWIDTH" | "ENERGY";
  to?: string;
  description?: string;
};

export type VoteWitnessRequest = {
  votes: Array<{ witnessAddress: string; voteCount: number }>;
  description?: string;
};

export type WalletKit = {
  manager: WalletManager;
  modal: WalletModal;
  button: WalletButton | null;
  toast: WalletToast | null;
  catalog: readonly TronWalletCatalogItem[];
  uiConfig: ResolvedWalletUiConfig;
  setTheme(theme: ThemeConfig): void;
  destroy(): void;
  openModal(): void;
  closeModal(): void;
  disconnect(): Promise<void>;
  refreshBalance(): Promise<WalletSessionBalance | undefined>;
  refreshAccount(): Promise<TronAccount | null>;
  refreshIdentity(): Promise<TronIdentity | undefined>;
  getSession: WalletManager["getSession"];
  signMessage(request: string | SignMessageRequest): Promise<SignMessageResult>;
  signTransaction(transaction: TransactionPayload | SignTransactionRequest): Promise<SignTransactionResult>;
  sendTransaction(transaction: TransactionPayload): Promise<TxResult>;
  sendRawTransaction(transaction: TransactionPayload): Promise<TxResult>;
  signAndSendTransaction(transaction: TransactionPayload | SignTransactionRequest): Promise<TxResult>;
  getTronWeb(): Promise<unknown>;
  transactionBuilder: {
    sendTrx(to: string, amountSun: string | number | bigint, from?: string): Promise<TransactionPayload>;
    triggerSmartContract(
      contractAddress: string,
      functionSelector: string,
      options?: Record<string, unknown>,
      parameters?: unknown[],
      issuerAddress?: string
    ): Promise<TransactionPayload>;
    triggerSmartContract(request: TriggerSmartContractRequest): Promise<TransactionPayload>;
  };
  transferTrx(request: TransferTrxRequest): Promise<TxResult>;
  transferTrc10(request: TransferTrc10Request): Promise<TxResult>;
  transferTrc20(request: TransferTrc20Request): Promise<TxResult>;
  triggerSmartContract(request: TriggerSmartContractRequest): Promise<TxResult>;
  freezeBalance(request: ResourceRequest): Promise<TxResult>;
  unfreezeBalance(request: ResourceRequest): Promise<TxResult>;
  delegateResource(request: Required<Pick<ResourceRequest, "to">> & ResourceRequest): Promise<TxResult>;
  undelegateResource(request: Required<Pick<ResourceRequest, "to">> & ResourceRequest): Promise<TxResult>;
  voteWitness(request: VoteWitnessRequest): Promise<TxResult>;
};

export type TronIdentity = {
  domain?: string;
  displayName?: string;
  avatar?: string;
  website?: string;
  metadata?: Record<string, string>;
};

export type TronIdentityResolverContext = {
  network: TronNetwork | undefined;
  walletId: string | undefined;
};

export type TronIdentityResolver = (account: TronAccount, context: TronIdentityResolverContext) => Promise<TronIdentity | undefined>;

export type TronBalanceResolverContext = {
  network: TronNetwork | undefined;
  walletId: string | undefined;
};

export type TronBalanceResolverResult = WalletSessionBalance | string | number | undefined;

export type TronBalanceResolver = (account: TronAccount, context: TronBalanceResolverContext) => Promise<TronBalanceResolverResult>;

export type WalletClientIdentityConfig = {
  enabled?: boolean;
  resolver?: TronIdentityResolver;
  contractAddress?: string;
  metadataKeys?: string[];
  failSilently?: boolean;
  cacheTtlMs?: number;
  resolverTimeoutMs?: number;
};

export type WalletClientBalanceConfig = {
  enabled?: boolean;
  resolver?: TronBalanceResolver;
  failSilently?: boolean;
};
