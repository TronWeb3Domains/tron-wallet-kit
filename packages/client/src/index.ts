import { createTronLinkAdapter, type TronLinkAdapterOptions } from "@tron-wallet-kit/adapter-tronlink";
import {
  createLazyTronwalletBridgeAdapter,
  createTronwalletBridgeAdapter,
  type TronwalletBridgeInnerAdapter,
  type TronwalletBridgeTronWeb
} from "@tron-wallet-kit/adapter-tronwallet-bridge";
import {
  createWalletConnectAdapter,
  type WalletConnectAdapterOptions,
  type WalletConnectNetworkName
} from "@tron-wallet-kit/adapter-walletconnect";
import {
  createBrowserWalletStorage,
  NetworkRegistry,
  TRON_MAINNET,
  TRON_NILE,
  TRON_SHASTA,
  WalletKitError,
  WalletManager,
  type ConnectOptions,
  type SignMessageRequest,
  type SignMessageResult,
  type SignTransactionResult,
  type SubmitTransactionRequest,
  type TransactionPayload,
  type TronAccount,
  type TronMethodHint,
  type TronNetwork,
  type TxResult,
  type WalletAdapter,
  type WalletAdapterType,
  type WalletCapabilities,
  type WalletManagerConfig,
  type WalletMetadata,
  type WalletNetwork,
  type WalletNetworkId,
  type WalletPlatform,
  type WalletSessionBalance
} from "@tron-wallet-kit/core";
import {
  createWalletButton,
  createWalletModal,
  createWalletToast,
  getTronWalletCatalogIcon,
  type ThemeConfig,
  type WalletButton,
  type WalletModal,
  type WalletToast,
  type WalletUiConfig
} from "@tron-wallet-kit/ui";

export type DefaultAdaptersConfig = {
  wallets?: "all" | Array<"tronlink" | "walletconnect" | "tokenpocket" | "okx" | "bitget" | "trust" | "metamask" | "gate" | "bybit" | "binance" | "guarda" | "onekey" | "backpack" | "imtoken" | "foxwallet" | string>;
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
      sign<TTransaction extends TransactionPayload>(transaction: TTransaction): Promise<TTransaction>;
    };
  };
  request?: (args: { method: string; params?: unknown }) => Promise<unknown>;
};

export type InjectedTronAdapterConfig = {
  id: string;
  name: string;
  providerPaths: readonly string[];
  icon?: string;
  homepage?: string;
  downloadUrl?: string;
  platforms?: WalletPlatform[];
  provider?: () => InjectedTronProvider | undefined;
  requestMethods?: readonly string[];
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
  functionSelector: string;
  parameters?: unknown[];
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
  setTheme(theme: ThemeConfig): void;
  openModal(): void;
  closeModal(): void;
  disconnect(): Promise<void>;
  refreshBalance(): Promise<WalletSessionBalance | undefined>;
  refreshAccount(): Promise<TronAccount | null>;
  refreshIdentity(): Promise<TronIdentity | undefined>;
  getSession: WalletManager["getSession"];
  signMessage(request: string | SignMessageRequest): Promise<SignMessageResult>;
  signTransaction(transaction: TransactionPayload): Promise<SignTransactionResult>;
  sendTransaction(transaction: TransactionPayload): Promise<TxResult>;
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

export type TronDomainNetworkConfig = {
  rpcUrl: string;
  contractAddress: string;
  apiKey?: string;
};

export type TronDomainSdkConfig = {
  testnet?: Partial<TronDomainNetworkConfig>;
  mainnet?: Partial<TronDomainNetworkConfig>;
  defaultNetwork?: "mainnet" | "testnet";
};

export type WalletClientIdentityConfig = {
  enabled?: boolean;
  resolver?: TronIdentityResolver;
  trondomain?: TronDomainSdkConfig;
  metadataKeys?: string[];
  failSilently?: boolean;
  cacheTtlMs?: number;
};

export type WalletClientBalanceConfig = {
  enabled?: boolean;
  resolver?: TronBalanceResolver;
  failSilently?: boolean;
};

export function createDefaultAdapters(config: DefaultAdaptersConfig = {}): WalletAdapter[] {
  const defaultWallets = [
    "tronlink",
    "tokenpocket",
    "okx",
    "bitget",
    "trust",
    "metamask",
    "gate",
    "foxwallet",
    "bybit",
    "imtoken",
    "binance",
    "guarda",
    "onekey",
    "backpack",
    "walletconnect"
  ];
  const requested = new Set(config.wallets === "all" || !config.wallets ? defaultWallets : config.wallets);
  const adapters: WalletAdapter[] = [];
  if (requested.has("tronlink")) adapters.push(createTronLinkAdapter(config.tronlink));
  if (config.tronweb3Bridge?.enabled !== false) {
    for (const bridgeConfig of defaultTronwalletBridgeWallets) {
      if (requested.has(bridgeConfig.id)) adapters.push(createDefaultTronwalletBridgeAdapter(bridgeConfig, config));
    }
  }
  for (const injectedConfig of defaultInjectedTronWallets) {
    if (requested.has(injectedConfig.id)) adapters.push(createInjectedTronAdapter(injectedConfig));
  }
  if (requested.has("walletconnect") && config.walletConnectProjectId) {
    adapters.push(
      createWalletConnectAdapter({
        projectId: config.walletConnectProjectId,
        ...config.walletconnect,
        ...(config.walletConnectNetwork ? { network: config.walletConnectNetwork } : {}),
        ...(config.onWalletConnectUri ? { onUri: config.onWalletConnectUri } : {})
      })
    );
  }
  return adapters;
}

export function createInjectedTronAdapter(config: InjectedTronAdapterConfig): WalletAdapter {
  let provider: InjectedTronProvider | undefined;
  let connectedNetwork: WalletNetwork | undefined;
  const metadata: WalletMetadata = {
    id: config.id,
    name: config.name,
    ...(config.icon ? { icon: config.icon } : {}),
    ...(config.homepage ? { homepage: config.homepage } : {}),
    ...(config.downloadUrl ?? config.homepage ? { downloadUrl: config.downloadUrl ?? config.homepage } : {}),
    type: "extension",
    group: "popular",
    platforms: config.platforms ?? ["extension"],
    description: `${config.name} TRON browser extension adapter.`,
    ...config.metadata
  };
  const resolveProvider = () => config.provider?.() ?? getInjectedTronProvider(config.providerPaths);

  return {
    adapterApiVersion: "1.1",
    metadata,
    capabilities: {
      connect: true,
      disconnect: true,
      signMessage: true,
      signTransaction: true
    },
    isAvailable: () => Boolean(resolveProvider()),
    connect: async (options: ConnectOptions = {}) => {
      const nextProvider = resolveProvider();
      if (!nextProvider) throw new WalletKitError("WALLET_NOT_FOUND", `${metadata.name} provider was not found.`);
      const address = await requestInjectedAddress(nextProvider, config.requestMethods);
      if (!address) throw new WalletKitError("CONNECTION_FAILED", `${metadata.name} did not return an address.`);
      const network = typeof options.network === "object" && options.network ? options.network : await resolveInjectedNetwork(nextProvider, connectedNetwork);
      provider = nextProvider;
      connectedNetwork = network;
      return {
        account: {
          address,
          network,
          networkType: network.networkType,
          activationStatus: "unknown",
          ...(nextProvider.tronWeb?.defaultAddress?.hex ? { hexAddress: nextProvider.tronWeb.defaultAddress.hex } : {})
        },
        network,
        raw: nextProvider
      };
    },
    disconnect: async () => {
      provider = undefined;
      connectedNetwork = undefined;
    },
    signMessage: async ({ message }) => {
      const activeProvider = provider ?? resolveProvider();
      if (!activeProvider) throw new WalletKitError("NO_SESSION", `${metadata.name} is not connected.`);
      const signature =
        (await activeProvider.tronWeb?.trx?.signMessageV2?.(message)) ??
        (await requestOptionalString(activeProvider, "tron_signMessage", { message }));
      if (!signature) throw new WalletKitError("SIGN_MESSAGE_FAILED", `${metadata.name} did not return a signature.`);
      return { signatureKind: "signature" as const, signature, proof: signature, raw: signature };
    },
    signTransaction: async ({ transaction }) => {
      const activeProvider = provider ?? resolveProvider();
      if (!activeProvider) throw new WalletKitError("NO_SESSION", `${metadata.name} is not connected.`);
      const signedTransaction =
        (await activeProvider.tronWeb?.trx?.sign?.(transaction)) ??
        ((await activeProvider.request?.({ method: "tron_signTransaction", params: { transaction } })) as TransactionPayload | undefined);
      if (!signedTransaction) throw new WalletKitError("SIGN_TRANSACTION_FAILED", `${metadata.name} did not return a signed transaction.`);
      return { transaction: signedTransaction, signedTransaction, signed: true, raw: signedTransaction };
    }
  };
}

export function createTronWeb3AdapterBridge(config: TronWeb3AdapterBridgeConfig): WalletAdapter {
  return createTronwalletBridgeAdapter(config.adapter, {
    id: normalizeWalletId(config.id ?? config.metadata?.id ?? String(config.adapter.name)),
    ...(config.metadata ? { metadata: config.metadata } : {}),
    ...(config.type ? { type: config.type } : {}),
    ...(config.platforms ? { platforms: config.platforms } : {}),
    ...(config.group ? { group: config.group } : {}),
    ...(config.network ? { network: config.network } : {}),
    ...(config.tronWeb ? { tronWeb: config.tronWeb } : {}),
    ...(config.capabilities ? { capabilities: config.capabilities } : {}),
    ...(config.signMessageMode ? { signMessageMode: config.signMessageMode } : {})
  });
}

export function createTronWeb3AdapterBridges(configs: readonly TronWeb3AdapterBridgeConfig[] = []): WalletAdapter[] {
  return configs.map((config) => createTronWeb3AdapterBridge(config));
}

type DefaultTronwalletBridgeWalletConfig = {
  id: "tokenpocket" | "okx" | "bitget" | "trust" | "metamask" | "gate" | "bybit" | "binance" | "guarda" | "onekey" | "backpack" | "imtoken" | "foxwallet";
  name: string;
  homepage: string;
  platforms: WalletPlatform[];
  signMessageMode?: "string" | "messageObject";
  availabilityTimeoutMs?: number;
  availabilityProbe?: () => boolean | Promise<boolean>;
  injectedFallback?: InjectedTronAdapterConfig;
  importer: () => Promise<TronwalletBridgeInnerAdapter>;
};

function createDefaultTronwalletBridgeAdapter(
  bridgeConfig: DefaultTronwalletBridgeWalletConfig,
  config: DefaultAdaptersConfig
): WalletAdapter {
  const bridgeAdapter = createLazyTronwalletBridgeAdapter({
    id: bridgeConfig.id,
    metadata: {
      name: bridgeConfig.name,
      ...walletIconMetadata(bridgeConfig.id),
      homepage: bridgeConfig.homepage,
      downloadUrl: bridgeConfig.homepage,
      description: `${bridgeConfig.name} TRON wallet adapter bridged from @tronweb3/tronwallet-adapter.`
    },
    type: "extension",
    platforms: bridgeConfig.platforms,
    ...(bridgeConfig.signMessageMode ? { signMessageMode: bridgeConfig.signMessageMode } : {}),
    ...(bridgeConfig.availabilityTimeoutMs ? { availabilityTimeoutMs: bridgeConfig.availabilityTimeoutMs } : {}),
    ...(config.tronweb3Bridge?.network ? { network: config.tronweb3Bridge.network } : {}),
    ...(config.tronweb3Bridge?.tronWeb ? { tronWeb: config.tronweb3Bridge.tronWeb } : {}),
    importer: bridgeConfig.importer
  });
  const probedBridgeAdapter = bridgeConfig.availabilityProbe
    ? createAvailabilityProbeWalletAdapter(bridgeAdapter, bridgeConfig.availabilityProbe)
    : bridgeAdapter;
  if (!bridgeConfig.injectedFallback) return probedBridgeAdapter;
  return createFallbackWalletAdapter(probedBridgeAdapter, createInjectedTronAdapter(bridgeConfig.injectedFallback));
}

function createAvailabilityProbeWalletAdapter(primary: WalletAdapter, probe: () => boolean | Promise<boolean>): WalletAdapter {
  return {
    ...(primary.adapterApiVersion ? { adapterApiVersion: primary.adapterApiVersion } : {}),
    metadata: primary.metadata,
    capabilities: primary.capabilities,
    isAvailable: async () => {
      if (await Promise.resolve(probe()).catch(() => false)) return true;
      return Boolean(await Promise.resolve(primary.isAvailable?.()).catch(() => false));
    },
    connect: (options) => primary.connect(options),
    ...(primary.disconnect ? { disconnect: () => primary.disconnect!() } : {}),
    ...(primary.restoreSession ? { restoreSession: (session) => primary.restoreSession!(session) } : {}),
    ...(primary.canRecoverSession ? { canRecoverSession: (options) => primary.canRecoverSession!(options) } : {}),
    ...(primary.recoverSession ? { recoverSession: (options) => primary.recoverSession!(options) } : {}),
    ...(primary.cancelPendingConnection ? { cancelPendingConnection: () => primary.cancelPendingConnection!() } : {}),
    ...(primary.signMessage ? { signMessage: (request) => primary.signMessage!(request) } : {}),
    ...(primary.signTransaction ? { signTransaction: (request) => primary.signTransaction!(request) } : {}),
    ...(primary.submitTransaction ? { submitTransaction: (request) => primary.submitTransaction!(request) } : {})
  };
}

function createFallbackWalletAdapter(primary: WalletAdapter, fallback: WalletAdapter): WalletAdapter {
  let active: WalletAdapter | undefined;
  const chooseAvailable = async (): Promise<WalletAdapter> => {
    if (await Promise.resolve(fallback.isAvailable?.()).catch(() => false)) return fallback;
    if (await Promise.resolve(primary.isAvailable?.()).catch(() => false)) return primary;
    return primary;
  };
  const chooseActive = async (): Promise<WalletAdapter> => active ?? chooseAvailable();

  return {
    ...(primary.adapterApiVersion ? { adapterApiVersion: primary.adapterApiVersion } : {}),
    metadata: primary.metadata,
    capabilities: {
      ...fallback.capabilities,
      ...primary.capabilities
    },
    isAvailable: async () => {
      if (await Promise.resolve(fallback.isAvailable?.()).catch(() => false)) return true;
      return Boolean(await Promise.resolve(primary.isAvailable?.()).catch(() => false));
    },
    connect: async (options) => {
      active = await chooseAvailable();
      return active.connect(options);
    },
    disconnect: async () => {
      await active?.disconnect?.();
      active = undefined;
    },
    restoreSession: async (session) => {
      const adapter = await chooseAvailable();
      active = adapter;
      return adapter.restoreSession?.(session) ?? null;
    },
    canRecoverSession: async (options) => {
      const adapter = await chooseAvailable();
      return Boolean(await adapter.canRecoverSession?.(options));
    },
    recoverSession: async (options) => {
      active = await chooseAvailable();
      return active.recoverSession?.(options) ?? null;
    },
    cancelPendingConnection: async () => {
      await active?.cancelPendingConnection?.();
    },
    signMessage: async (request) => {
      const adapter = await chooseActive();
      if (!adapter.signMessage) throw new WalletKitError("UNSUPPORTED", `${primary.metadata.name} cannot sign messages.`);
      return adapter.signMessage(request);
    },
    signTransaction: async (request) => {
      const adapter = await chooseActive();
      if (!adapter.signTransaction) throw new WalletKitError("UNSUPPORTED", `${primary.metadata.name} cannot sign transactions.`);
      return adapter.signTransaction(request);
    },
    submitTransaction: async (request) => {
      const adapter = await chooseActive();
      if (!adapter.submitTransaction) throw new WalletKitError("UNSUPPORTED", `${primary.metadata.name} cannot submit transactions.`);
      return adapter.submitTransaction(request);
    }
  };
}

export function createWalletClient(config: WalletClientConfig = {}): WalletManager {
  const networks = config.networks;
  const registry = new NetworkRegistry(networks);
  const network = registry.resolve(config.network);
  const adapters = [...(config.adapters ?? []), ...createDefaultAdapters(config), ...createTronWeb3AdapterBridges(config.tronweb3Adapters)];
  return new WalletManager({
    ...(config.appName ? { appName: config.appName } : {}),
    network,
    ...(networks ? { networks } : {}),
    ...(config.storage ?? (config.useBrowserStorage ? createBrowserWalletStorage() : undefined)
      ? { storage: config.storage ?? createBrowserWalletStorage() }
      : {}),
    ...(config.storageKey ? { storageKey: config.storageKey } : {}),
    ...(config.autoReconnect !== undefined ? { autoReconnect: config.autoReconnect } : {}),
    adapters
  });
}

function normalizeWalletId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/wallet$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function walletIconMetadata(walletId: string): { icon?: string } {
  const icon = getTronWalletCatalogIcon(walletId);
  return icon ? { icon } : {};
}

const defaultInjectedTronWallets: readonly InjectedTronAdapterConfig[] = [];

const defaultTronwalletBridgeWallets: readonly DefaultTronwalletBridgeWalletConfig[] = [
  {
    id: "tokenpocket",
    name: "TokenPocket",
    homepage: "https://www.tokenpocket.pro/",
    platforms: ["extension", "mobile"],
    injectedFallback: {
      id: "tokenpocket",
      name: "TokenPocket",
      providerPaths: ["tokenpocket.tron"],
      homepage: "https://www.tokenpocket.pro/",
      platforms: ["extension", "mobile"]
    },
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-tokenpocket");
      return new module.TokenPocketAdapter();
    }
  },
  {
    id: "okx",
    name: "OKX Wallet",
    homepage: "https://www.okx.com/web3",
    platforms: ["extension", "mobile"],
    injectedFallback: {
      id: "okx",
      name: "OKX Wallet",
      providerPaths: ["okxwallet.tronLink"],
      homepage: "https://www.okx.com/web3",
      platforms: ["extension", "mobile"]
    },
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-okxwallet");
      return new module.OkxWalletAdapter();
    }
  },
  {
    id: "bitget",
    name: "Bitget Wallet",
    homepage: "https://web3.bitget.com/",
    platforms: ["extension", "mobile"],
    injectedFallback: {
      id: "bitget",
      name: "Bitget Wallet",
      providerPaths: ["bitkeep.tronLink", "bitkeep.tron"],
      homepage: "https://web3.bitget.com/",
      platforms: ["extension", "mobile"]
    },
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-bitkeep");
      return new module.BitKeepAdapter();
    }
  },
  {
    id: "trust",
    name: "Trust Wallet",
    homepage: "https://trustwallet.com/",
    platforms: ["extension", "mobile"],
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-trust");
      return new module.TrustAdapter();
    }
  },
  {
    id: "metamask",
    name: "MetaMask",
    homepage: "https://metamask.io/",
    platforms: ["extension"],
    signMessageMode: "messageObject",
    availabilityTimeoutMs: 3200,
    availabilityProbe: hasMetaMaskEthereumProvider,
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-metamask-tron");
      return new module.MetaMaskAdapter();
    }
  },
  {
    id: "gate",
    name: "Gate Wallet",
    homepage: "https://www.gate.io/web3",
    platforms: ["extension"],
    injectedFallback: {
      id: "gate",
      name: "Gate Wallet",
      providerPaths: ["gatewallet.tron", "gatewallet.tronLink"],
      homepage: "https://www.gate.io/web3",
      platforms: ["extension"]
    },
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-gatewallet");
      return new module.GateWalletAdapter();
    }
  },
  {
    id: "foxwallet",
    name: "FoxWallet",
    homepage: "https://foxwallet.com/",
    platforms: ["mobile"],
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-foxwallet");
      return new module.FoxWalletAdapter();
    }
  },
  {
    id: "bybit",
    name: "Bybit Wallet",
    homepage: "https://www.bybit.com/web3",
    platforms: ["extension", "mobile"],
    injectedFallback: {
      id: "bybit",
      name: "Bybit Wallet",
      providerPaths: ["bybitWallet.tronLink", "bybitWallet.tron"],
      homepage: "https://www.bybit.com/web3",
      platforms: ["extension", "mobile"]
    },
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-bybit");
      return new module.BybitWalletAdapter();
    }
  },
  {
    id: "imtoken",
    name: "imToken",
    homepage: "https://token.im/",
    platforms: ["mobile"],
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-imtoken");
      return new module.ImTokenAdapter();
    }
  },
  {
    id: "binance",
    name: "Binance Web3 Wallet",
    homepage: "https://www.binance.com/en/web3wallet",
    platforms: ["extension", "mobile"],
    injectedFallback: {
      id: "binance",
      name: "Binance Web3 Wallet",
      providerPaths: ["binancew3w.tron", "binancew3w.tronLink"],
      homepage: "https://www.binance.com/en/web3wallet",
      platforms: ["extension", "mobile"]
    },
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-binance");
      return new module.BinanceWalletAdapter();
    }
  },
  {
    id: "guarda",
    name: "Guarda",
    homepage: "https://guarda.com/",
    platforms: ["extension"],
    injectedFallback: {
      id: "guarda",
      name: "Guarda",
      providerPaths: ["guarda"],
      homepage: "https://guarda.com/",
      platforms: ["extension"]
    },
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-guarda");
      return new module.GuardaAdapter();
    }
  },
  {
    id: "onekey",
    name: "OneKey",
    homepage: "https://onekey.so/",
    platforms: ["extension"],
    injectedFallback: {
      id: "onekey",
      name: "OneKey",
      providerPaths: ["$onekey.tron", "$onekey.tronLink"],
      homepage: "https://onekey.so/",
      platforms: ["extension"]
    },
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-onekey");
      return new module.OneKeyAdapter();
    }
  },
  {
    id: "backpack",
    name: "Backpack",
    homepage: "https://backpack.app/",
    platforms: ["extension"],
    injectedFallback: {
      id: "backpack",
      name: "Backpack",
      providerPaths: ["backpack.tron", "backpack.tronLink"],
      homepage: "https://backpack.app/",
      platforms: ["extension"]
    },
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-backpack");
      return new module.BackpackAdapter();
    }
  }
];

function hasMetaMaskEthereumProvider(): boolean {
  const ethereum = (globalThis as typeof globalThis & { ethereum?: { isMetaMask?: boolean; overrideIsMetaMask?: boolean; providers?: Array<{ isMetaMask?: boolean }> } }).ethereum;
  if (!ethereum) return false;
  if (ethereum.isMetaMask && !ethereum.overrideIsMetaMask) return true;
  return Boolean(ethereum.providers?.some((provider) => provider.isMetaMask));
}

function getInjectedTronProvider(paths: readonly string[]): InjectedTronProvider | undefined {
  for (const path of paths) {
    const provider = getPathValue(globalThis as unknown as Record<string, unknown>, path);
    if (isInjectedTronProvider(provider)) return provider;
  }
  return undefined;
}

function getPathValue(source: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (typeof current !== "object" || current === null) return undefined;
    return (current as Record<string, unknown>)[part];
  }, source);
}

function isInjectedTronProvider(value: unknown): value is InjectedTronProvider {
  if (typeof value !== "object" || value === null) return false;
  const provider = value as InjectedTronProvider;
  return typeof provider.request === "function" || typeof provider.tronWeb === "object";
}

async function requestInjectedAddress(provider: InjectedTronProvider, methods: readonly string[] = ["tron_requestAccounts", "eth_requestAccounts"]): Promise<string | undefined> {
  for (const method of methods) {
    try {
      const result = await provider.request?.({ method });
      const address = extractInjectedAddress(result) ?? provider.tronWeb?.defaultAddress?.base58;
      if (address) return address;
    } catch (error) {
      if (isUserRejected(error)) throw new WalletKitError("USER_REJECTED", "User rejected the wallet request.", error);
    }
  }
  return provider.tronWeb?.defaultAddress?.base58;
}

function extractInjectedAddress(result: unknown): string | undefined {
  if (Array.isArray(result) && typeof result[0] === "string") return result[0];
  if (typeof result === "string") return result;
  if (typeof result !== "object" || result === null) return undefined;
  const response = result as { address?: unknown; code?: unknown };
  if (typeof response.address === "string") return response.address;
  return undefined;
}

async function requestOptionalString(provider: InjectedTronProvider, method: string, params: unknown): Promise<string | undefined> {
  const result = await provider.request?.({ method, params });
  return typeof result === "string" ? result : undefined;
}

async function resolveInjectedNetwork(provider: InjectedTronProvider, fallback?: WalletNetwork): Promise<WalletNetwork> {
  const block = await provider.tronWeb?.trx?.getBlockByNumber?.(0);
  const chainId = block?.blockID ? `0x${block.blockID.slice(-8)}` : undefined;
  if (chainId === "0x2b6653dc") return { ...TRON_MAINNET };
  if (chainId === "0x94a9059e") return { ...TRON_SHASTA };
  if (chainId === "0xcd8690dc") return { ...TRON_NILE };
  return fallback ?? TRON_NILE;
}

function isUserRejected(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = "code" in error ? (error as { code?: unknown }).code : undefined;
  const message = "message" in error ? String((error as { message?: unknown }).message) : "";
  return code === 4001 || /reject|denied|cancel/i.test(message);
}

export function createWalletKit(config: WalletClientConfig = {}): WalletKit {
  const manager = createWalletClient(config);
  const modal = createWalletModal({ manager, ...(config.ui ? { ui: config.ui } : {}) });
  const buttonTheme = toThemeConfig(config.ui);
  const button = config.connectButton
    ? createWalletButton({
        manager,
        modal,
        ...(buttonTheme ? { theme: buttonTheme } : {}),
        ...(config.connectButton.label ? { label: config.connectButton.label } : {}),
        ...(config.connectButton.connectedLabel ? { connectedLabel: config.connectButton.connectedLabel } : {})
      })
    : null;
  const toast = config.ui?.toast ? createWalletToast({ manager, ui: config.ui }) : null;
  const identityResolver = resolveIdentityResolver(config.identity);
  const identityCache = new Map<string, { identity: TronIdentity | undefined; expiresAt: number }>();
  const identityCacheTtlMs = config.identity?.cacheTtlMs ?? 10 * 60 * 1000;
  const balanceResolver = config.balance?.enabled === false ? undefined : (config.balance?.resolver ?? createDefaultTrxBalanceResolver());

  if (typeof document !== "undefined") {
    modal.mount();
    toast?.mount();
    if (config.connectButton?.target) button?.mount(config.connectButton.target);
  }

  const submit = (methodHint: TronMethodHint, transaction: TransactionPayload, description?: string) =>
    manager.submitTransaction({ methodHint, transaction, ...(description ? { description } : {}) });

  return {
    manager,
    modal,
    button,
    toast,
    setTheme: (theme) => {
      modal.setTheme(theme);
      button?.setTheme(theme);
      toast?.setTheme(theme);
    },
    openModal: () => modal.open(),
    closeModal: () => modal.close(),
    disconnect: () => manager.disconnect(),
    refreshBalance: async () => {
      const session = manager.getSession();
      if (!session || !balanceResolver) return session?.balance;
      try {
        const result = await balanceResolver(session.account, { network: manager.getNetwork(), walletId: session.adapterId });
        const balance = normalizeBalance(result);
        if (!balance) return session.balance;
        await manager.setSession({ ...session, balance, updatedAt: Date.now() });
        return balance;
      } catch (error) {
        if (config.balance?.failSilently !== false) return session.balance;
        throw error;
      }
    },
    refreshAccount: async () => manager.getAccount(),
    refreshIdentity: async () => {
      const session = manager.getSession();
      const account = session?.account;
      if (!session || !account || !identityResolver) return undefined;
      const key = `${manager.getNetwork().id}:${account.address}`;
      const cached = identityCache.get(key);
      if (cached && cached.expiresAt > Date.now()) return cached.identity;
      try {
        const identity = await identityResolver(account, { network: manager.getNetwork(), walletId: session.adapterId });
        identityCache.set(key, { identity, expiresAt: Date.now() + identityCacheTtlMs });
        if (identity) {
          await manager.setSession({
            ...session,
            account: {
              ...session.account,
              ...(identity.domain ? { domain: identity.domain } : {}),
              ...(identity.displayName ? { displayName: identity.displayName } : {}),
              ...(identity.avatar ? { avatar: identity.avatar } : {})
            },
            updatedAt: Date.now()
          });
        }
        return identity;
      } catch (error) {
        if (config.identity?.failSilently !== false) return undefined;
        throw error;
      }
    },
    getSession: manager.getSession.bind(manager),
    signMessage: (request) => manager.signMessage(request),
    signTransaction: (transaction) => manager.signTransaction(transaction),
    sendTransaction: (transaction) => submit("generic", transaction),
    transferTrx: (request) => submit("transferTrx", { to: request.to, amountSun: String(request.amountSun) }, request.description),
    transferTrc10: (request) =>
      submit("transferTrc10", { tokenId: request.tokenId, to: request.to, amount: String(request.amount) }, request.description),
    transferTrc20: (request) =>
      submit(
        "transferTrc20",
        { contractAddress: request.contractAddress, to: request.to, amount: String(request.amount), feeLimit: request.feeLimit ? String(request.feeLimit) : undefined },
        request.description
      ),
    triggerSmartContract: (request) => submit("triggerSmartContract", { ...request }, request.description),
    freezeBalance: (request) => submit("freezeBalance", { amountSun: String(request.amountSun), resource: request.resource }, request.description),
    unfreezeBalance: (request) => submit("unfreezeBalance", { amountSun: String(request.amountSun), resource: request.resource }, request.description),
    delegateResource: (request) => submit("delegateResource", { to: request.to, amountSun: String(request.amountSun), resource: request.resource }, request.description),
    undelegateResource: (request) => submit("undelegateResource", { to: request.to, amountSun: String(request.amountSun), resource: request.resource }, request.description),
    voteWitness: (request) => submit("voteWitness", { votes: request.votes }, request.description)
  };
}

function normalizeBalance(result: TronBalanceResolverResult): WalletSessionBalance | undefined {
  if (result === undefined) return undefined;
  if (typeof result === "object") return result;
  const formatted = typeof result === "number" ? String(result) : result;
  return {
    value: formatted,
    formatted,
    symbol: "TRX"
  };
}

export function createDefaultTrxBalanceResolver(): TronBalanceResolver {
  return async (account, context) => {
    const tronWeb = resolveBalanceTronWeb(context.walletId);
    const value = await tronWeb?.trx?.getBalance?.(account.address);
    if (value === undefined || value === null) return undefined;
    return normalizeSunBalance(value);
  };
}

type BalanceTronWeb = {
  trx?: {
    getBalance?(address: string): Promise<unknown> | unknown;
  };
};

const balanceTronWebPathsByWallet: Record<string, readonly string[]> = {
  tronlink: ["tronLink.tronWeb", "tron.tronWeb", "tronWeb"],
  tokenpocket: ["tokenpocket.tron.tronWeb", "tokenpocket.tronWeb"],
  okx: ["okxwallet.tronLink.tronWeb"],
  bitget: ["bitkeep.tron.tronWeb", "bitkeep.tronLink.tronWeb"],
  trust: ["trustwallet.tronLink.tronWeb", "tronWeb"],
  gate: ["gatewallet.tron.tronWeb", "gatewallet.tronLink.tronWeb"],
  foxwallet: ["foxwallet.tronLink.tronWeb"],
  bybit: ["bybitWallet.tronLink.tronWeb", "bybitWallet.tron.tronWeb"],
  imtoken: ["tronweb"],
  binance: ["binancew3w.tron.tronWeb", "binancew3w.tronLink.tronWeb"],
  guarda: ["guarda.tronWeb", "guarda.tron.tronWeb"],
  onekey: ["$onekey.tron.tronWeb", "$onekey.tronLink.tronWeb"],
  backpack: ["backpack.tron.tronWeb", "backpack.tronLink.tronWeb"]
};

function resolveBalanceTronWeb(walletId: string | undefined): BalanceTronWeb | undefined {
  const paths = walletId ? balanceTronWebPathsByWallet[walletId] : undefined;
  for (const path of paths ?? []) {
    const value = getPathValue(globalThis as unknown as Record<string, unknown>, path);
    if (isBalanceTronWeb(value)) return value;
  }
  return undefined;
}

function isBalanceTronWeb(value: unknown): value is BalanceTronWeb {
  if (typeof value !== "object" || value === null) return false;
  const trx = (value as BalanceTronWeb).trx;
  return typeof trx?.getBalance === "function";
}

function normalizeSunBalance(value: unknown): WalletSessionBalance | undefined {
  const sun = toBalanceBigInt(value);
  if (sun === undefined) return undefined;
  const whole = sun / 1_000_000n;
  const fraction = sun % 1_000_000n;
  const fractionText = fraction.toString().padStart(6, "0").replace(/0+$/, "");
  const formatted = fractionText ? `${whole.toString()}.${fractionText}` : whole.toString();
  return {
    value: sun.toString(),
    formatted,
    symbol: "TRX",
    raw: value
  };
}

function toBalanceBigInt(value: unknown): bigint | undefined {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isFinite(value)) return BigInt(Math.trunc(value));
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return BigInt(value.trim());
  return undefined;
}

function toThemeConfig(ui: WalletUiConfig | undefined): ThemeConfig | undefined {
  if (!ui) return undefined;
  const theme: ThemeConfig = {};
  if (ui.themeName) theme.themeName = ui.themeName;
  if (ui.mode) theme.mode = ui.mode;
  if (ui.themeMode) theme.themeMode = ui.themeMode;
  if (ui.customTheme) theme.tokens = ui.customTheme;
  return Object.keys(theme).length > 0 ? theme : undefined;
}

export function createTronDomainIdentityResolver(
  config: Omit<WalletClientIdentityConfig, "enabled" | "resolver" | "failSilently"> = {}
): TronIdentityResolver {
  let sdkPromise: Promise<TronDomainSdk> | undefined;
  const metadataKeys = config.metadataKeys ?? ["avatar", "website"];

  return async (account) => {
    sdkPromise ??= loadTronDomainSdk(config.trondomain);
    const sdk = await sdkPromise;
    const domain = normalizeDomain(await sdk.getDomain(account.address));
    if (!domain) return undefined;

    const identity: TronIdentity = { domain, displayName: domain };
    if (metadataKeys.length > 0 && sdk.getMetadatas) {
      const entries = await sdk.getMetadatas(metadataKeys, domain);
      const metadata = Object.fromEntries(
        entries.map((entry) => [entry.key, entry.value?.trim() ?? ""] as const).filter(([, value]) => value.length > 0)
      );
      identity.metadata = metadata;
      if (metadata.avatar) identity.avatar = metadata.avatar;
      if (metadata.website) identity.website = metadata.website;
    }
    return identity;
  };
}

function resolveIdentityResolver(config: WalletClientIdentityConfig | undefined): TronIdentityResolver | undefined {
  if (!config?.enabled) return undefined;
  return config.resolver ?? createTronDomainIdentityResolver(config);
}

function normalizeDomain(domain: unknown): string | undefined {
  if (typeof domain !== "string") return undefined;
  const trimmed = domain.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

type TronDomainSdk = {
  getDomain(address: string): Promise<string>;
  getMetadatas?(keys: string[], domain: string): Promise<Array<{ key: string; value: string | undefined }>>;
};

type TronDomainModule = {
  SDK(config?: TronDomainSdkConfig): Promise<TronDomainSdk>;
};

async function loadTronDomainSdk(config: TronDomainSdkConfig | undefined): Promise<TronDomainSdk> {
  // trondomainjs is CommonJS and currently ships without TypeScript declarations.
  // @ts-expect-error package has no bundled declaration file
  const module = (await import("trondomainjs")) as TronDomainModule | { default: TronDomainModule };
  const domainModule = "SDK" in module ? module : module.default;
  return domainModule.SDK(config);
}
