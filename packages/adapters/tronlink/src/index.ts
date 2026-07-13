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
import { TRONLINK_ICON } from "./icon.generated";

type TronLinkRequestAccountsResponse = {
  code: 200 | 4000 | 4001;
  message?: string;
};

type TronWeb = {
  ready?: boolean;
  defaultAddress?: {
    base58?: string;
    hex?: string;
  };
  fullNode?: { host?: string };
  solidityNode?: { host?: string };
  eventServer?: { host?: string };
  trx: {
    getBlockByNumber?(blockNumber: number): Promise<{ blockID?: string }>;
    sign<TTransaction extends TransactionPayload>(transaction: TTransaction): Promise<TTransaction>;
    signMessageV2(message: string): Promise<string>;
    sendTransaction?(to: string, amountSun: number): Promise<{ txid?: string; txID?: string; transaction?: { txID?: string } }>;
  };
};

type LegacyTronLinkProvider = {
  isTronLink?: boolean;
  ready?: boolean;
  tronWeb?: TronWeb;
  request(args: { method: "tron_requestAccounts" }): Promise<TronLinkRequestAccountsResponse | null>;
};

type Tip1193TronProvider = {
  isTronLink?: boolean;
  tronWeb?: TronWeb | false;
  request(args: { method: "eth_requestAccounts" } | { method: string; params?: unknown }): Promise<unknown>;
  on?(event: "chainChanged" | "accountsChanged", callback: (...args: unknown[]) => void): void;
  removeListener?(event: "chainChanged" | "accountsChanged", callback: (...args: unknown[]) => void): void;
};

type TronLinkProvider =
  | { kind: "tip1193"; provider: Tip1193TronProvider }
  | { kind: "legacy"; provider: LegacyTronLinkProvider };

export { TRONLINK_ICON };

const TIP6963_ANNOUNCE_PROVIDER_EVENT = "TIP6963:announceProvider";
const TIP6963_REQUEST_PROVIDER_EVENT = "TIP6963:requestProvider";
const TRONLINK_TIP6963_NAME = "TronLink";

export type TronLinkAdapterOptions = {
  metadata?: Partial<WalletMetadata>;
  provider?: () => TronLinkProvider | undefined;
  checkTimeoutMs?: number;
  checkIntervalMs?: number;
};

export class TronLinkAdapter implements WalletAdapter {
  readonly adapterApiVersion = "1.1";
  readonly metadata: WalletMetadata;
  readonly capabilities: WalletCapabilities = {
    connect: true,
    disconnect: true,
    signMessage: true,
    signTransaction: true,
    submitTransaction: true,
    transferTrx: true
  };

  private readonly providerResolver: () => TronLinkProvider | undefined;
  private readonly checkTimeoutMs: number;
  private readonly checkIntervalMs: number;
  private readonly hasCustomProviderResolver: boolean;
  private provider: TronLinkProvider | undefined;
  private account: WalletAccount | undefined;
  private network: WalletNetwork | undefined;

  constructor(options: TronLinkAdapterOptions = {}) {
    this.metadata = {
      id: "tronlink",
      name: "TronLink",
      icon: TRONLINK_ICON,
      homepage: "https://www.tronlink.org/",
      downloadUrl: "https://www.tronlink.org/",
      type: "extension",
      platforms: ["extension", "mobile"],
      description: "TRON browser extension and mobile wallet.",
      ...options.metadata
    };
    this.hasCustomProviderResolver = Boolean(options.provider);
    this.providerResolver = options.provider ?? getGlobalTronLinkProvider;
    this.checkTimeoutMs = options.checkTimeoutMs ?? 5000;
    this.checkIntervalMs = options.checkIntervalMs ?? 100;
  }

  async isAvailable(): Promise<boolean> {
    if (hasGlobalTronLinkInstalledMarker()) return true;
    return Boolean(await this.waitForProvider());
  }

  detect(): boolean {
    return hasGlobalTronLinkDetectMarker() || Boolean(this.providerResolver());
  }

  async connect(options: ConnectOptions = {}): Promise<ConnectResult> {
    try {
      const provider = await this.getProvider();
      const address = await requestAddress(provider);
      const tronWeb = getProviderTronWeb(provider);

      if (!address) {
        throw new WalletKitError("CONNECTION_FAILED", "TronLink wallet is locked or no account is available.");
      }

      const network = await resolveNetwork(tronWeb, options.network);
      this.provider = provider;
      this.network = network;
      this.account = {
        address,
        network,
        networkType: network.networkType,
        activationStatus: "unknown",
        ...(tronWeb.defaultAddress?.hex ? { hexAddress: tronWeb.defaultAddress.hex } : {})
      };

      return { account: this.account, network, raw: provider };
    } catch (cause) {
      throw normalizeTronLinkError(cause, "CONNECTION_FAILED", "Failed to connect TronLink.");
    }
  }

  async disconnect(): Promise<void> {
    this.provider = undefined;
    this.account = undefined;
    this.network = undefined;
  }

  async restoreSession(): Promise<ConnectResult | null> {
    if (!(await this.isAvailable())) return null;
    const provider = await this.getProvider();
    const tronWeb = getProviderTronWeb(provider);
    const address = tronWeb.defaultAddress?.base58;
    if (!address) return null;
    const network = await resolveNetwork(tronWeb, this.network);
    this.provider = provider;
    this.network = network;
    this.account = {
      address,
      network,
      networkType: network.networkType,
      ...(tronWeb.defaultAddress?.hex ? { hexAddress: tronWeb.defaultAddress.hex } : {})
    };
    return { account: this.account, network, raw: provider };
  }

  async signMessage(request: SignMessageRequest): Promise<SignMessageResult> {
    try {
      const signature = await this.getConnectedTronWeb().trx.signMessageV2(request.message);
      return { signatureKind: "signature", signature, proof: signature, raw: signature };
    } catch (cause) {
      throw normalizeTronLinkError(cause, "SIGN_MESSAGE_FAILED", "Failed to sign message with TronLink.");
    }
  }

  async signTransaction(request: SignTransactionRequest): Promise<SignTransactionResult> {
    try {
      const transaction = await this.getConnectedTronWeb().trx.sign(request.transaction);
      const signature = extractSignature(transaction);
      return { transaction, signedTransaction: transaction, ...(signature ? { signature } : {}), signed: true, raw: transaction };
    } catch (cause) {
      throw normalizeTronLinkError(cause, "SIGN_TRANSACTION_FAILED", "Failed to sign transaction with TronLink.");
    }
  }

  async submitTransaction(request: SubmitTransactionRequest): Promise<TxResult> {
    try {
      const tronWeb = this.getConnectedTronWeb();
      if (request.methodHint === "transferTrx" && tronWeb.trx.sendTransaction) {
        const to = String(request.transaction.to ?? "");
        const amountSun = toSafeNumber(request.transaction.amountSun);
        const raw = await tronWeb.trx.sendTransaction(to, amountSun);
        const hash = raw.txid ?? raw.txID ?? raw.transaction?.txID;
        if (!hash) {
          throw new WalletKitError("SEND_TRANSACTION_FAILED", "TronLink did not return a transaction hash.", raw);
        }
        return { hash, status: "submitted", raw };
      }

      const signRequest = {
        transaction: request.transaction,
        ...(request.methodHint ? { methodHint: request.methodHint } : {}),
        ...(request.account ? { account: request.account } : {}),
        ...(request.session ? { session: request.session } : {})
      };
      const signed = await this.signTransaction(signRequest);
      const hash = String(signed.transaction?.txID ?? signed.transaction?.txid ?? signed.signedTransaction?.txID ?? "");
      if (!hash) {
        throw new WalletKitError("SEND_TRANSACTION_FAILED", "Signed transaction did not include a transaction hash.");
      }
      return { hash, status: "submitted", raw: signed.raw };
    } catch (cause) {
      throw normalizeTronLinkError(cause, "SEND_TRANSACTION_FAILED", "Failed to submit transaction with TronLink.");
    }
  }

  private async getProvider(): Promise<TronLinkProvider> {
    const provider = await this.waitForProvider();
    if (!provider) throw new WalletKitError("WALLET_NOT_FOUND", "TronLink provider was not found.");
    return provider;
  }

  private async waitForProvider(): Promise<TronLinkProvider | undefined> {
    const immediate = this.providerResolver();
    if (immediate || this.checkTimeoutMs <= 0 || (typeof window === "undefined" && !this.hasCustomProviderResolver)) return immediate;
    return new Promise((resolve) => {
      let settled = false;
      let tip6963Done = this.hasCustomProviderResolver;
      let pollingDone = false;
      const check = () => {
        if (settled) return;
        const provider = this.providerResolver();
        if (provider) {
          finish(provider);
          return;
        }
        if (Date.now() - startedAt >= this.checkTimeoutMs) {
          pollingDone = true;
          if (tip6963Done) finish();
          return;
        }
        globalThis.setTimeout(check, this.checkIntervalMs);
      };
      const finish = (provider?: TronLinkProvider) => {
        if (settled) return;
        settled = true;
        resolve(provider);
      };
      const startedAt = Date.now();
      if (!this.hasCustomProviderResolver) {
        void discoverTip6963TronLinkProvider(this.checkTimeoutMs).then((provider) => {
          tip6963Done = true;
          if (provider) finish(provider);
          else if (pollingDone) finish();
        });
      }
      globalThis.setTimeout(check, this.checkIntervalMs);
    });
  }

  private getConnectedTronWeb(): TronWeb {
    if (!this.provider) throw new WalletKitError("NO_SESSION", "TronLink is not connected.");
    return getProviderTronWeb(this.provider);
  }
}

export function createTronLinkAdapter(options: TronLinkAdapterOptions = {}): TronLinkAdapter {
  return new TronLinkAdapter(options);
}

function getGlobalTronLinkProvider(): TronLinkProvider | undefined {
  const globalObject = globalThis as typeof globalThis & {
    tron?: Tip1193TronProvider;
    tronLink?: LegacyTronLinkProvider;
    tronWeb?: TronWeb;
    tokenpocket?: unknown;
    bitkeep?: unknown;
    okxwallet?: unknown;
    bybitWallet?: unknown;
    gatewallet?: unknown;
    binancew3w?: unknown;
    trustwallet?: unknown;
    backpack?: unknown;
    $onekey?: unknown;
    mathwallet?: unknown;
    mathWallet?: unknown;
    MathWallet?: unknown;
  };

  if (globalObject.tron?.isTronLink && !isKnownNonTronLinkProvider(globalObject.tron, globalObject)) {
    return { kind: "tip1193", provider: globalObject.tron };
  }
  if (globalObject.tronLink && isLikelyTronLinkGlobal(globalObject)) {
    const provider =
      globalObject.tronLink.tronWeb || !globalObject.tronWeb
        ? globalObject.tronLink
        : { ...globalObject.tronLink, tronWeb: globalObject.tronWeb };
    return { kind: "legacy", provider };
  }
  return undefined;
}

function hasGlobalTronLinkInstalledMarker(): boolean {
  const globalObject = globalThis as TronProviderGlobals;
  if (globalObject.tron?.isTronLink && !isKnownNonTronLinkProvider(globalObject.tron, globalObject)) return true;
  if (globalObject.tronLink?.isTronLink && !isKnownNonTronLinkProvider(globalObject.tronLink, globalObject)) return true;
  if (!globalObject.tronLink || typeof globalObject.tronLink.request !== "function") return false;
  if (isNestedKnownWalletProvider(globalObject.tronLink, globalObject)) return false;
  if (isLinkedToKnownWalletProvider(globalObject.tronLink, globalObject)) return false;
  return true;
}

function hasGlobalTronLinkDetectMarker(): boolean {
  const globalObject = globalThis as TronProviderGlobals;
  if (globalObject.tron?.isTronLink && !isKnownNonTronLinkProvider(globalObject.tron, globalObject)) return true;
  if (globalObject.tronLink?.isTronLink && !isKnownNonTronLinkProvider(globalObject.tronLink, globalObject)) return true;
  if (globalObject.tron && !globalObject.tron.isTronLink) return false;
  if (globalObject.tronLink && typeof globalObject.tronLink === "object") {
    if (isNestedKnownWalletProvider(globalObject.tronLink as LegacyTronLinkProvider, globalObject)) return false;
    if (isLinkedToKnownWalletProvider(globalObject.tronLink, globalObject)) return false;
    return true;
  }
  if (globalObject.tron && !globalObject.tron.isTronLink) return false;
  if (isUsableTronWeb(globalObject.tronWeb) && !isTronWebLinkedToKnownWallet(globalObject.tronWeb, globalObject)) return true;
  return false;
}

async function discoverTip6963TronLinkProvider(timeoutMs: number): Promise<TronLinkProvider | undefined> {
  if (typeof window === "undefined" || timeoutMs <= 0) return undefined;

  return new Promise((resolve) => {
    let settled = false;
    const cleanup = () => {
      window.removeEventListener(TIP6963_ANNOUNCE_PROVIDER_EVENT, onAnnounce as EventListener);
      globalThis.clearTimeout(timer);
    };
    const finish = (provider?: TronLinkProvider) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(provider);
    };
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<{ info?: { name?: string; rdns?: string }; provider?: unknown }>).detail;
      if (!detail || detail.info?.name !== TRONLINK_TIP6963_NAME || !isTip1193TronProvider(detail.provider)) return;
      finish({ kind: "tip1193", provider: detail.provider });
    };
    const timer = globalThis.setTimeout(() => finish(), timeoutMs);

    window.addEventListener(TIP6963_ANNOUNCE_PROVIDER_EVENT, onAnnounce as EventListener);
    window.dispatchEvent(new Event(TIP6963_REQUEST_PROVIDER_EVENT));
  });
}

function isTip1193TronProvider(value: unknown): value is Tip1193TronProvider {
  if (!value || typeof value !== "object") return false;
  const provider = value as Partial<Tip1193TronProvider>;
  return provider.isTronLink === true && typeof provider.request === "function";
}

type TronProviderGlobals = {
  tron?: Tip1193TronProvider;
  tronLink?: LegacyTronLinkProvider;
  tronWeb?: TronWeb;
  tokenpocket?: unknown;
  bitkeep?: unknown;
  okxwallet?: unknown;
  bybitWallet?: unknown;
  gatewallet?: unknown;
  binancew3w?: unknown;
  trustwallet?: unknown;
  backpack?: unknown;
  $onekey?: unknown;
  mathwallet?: unknown;
  mathWallet?: unknown;
  MathWallet?: unknown;
};

function isLikelyTronLinkGlobal(globalObject: {
  tron?: Tip1193TronProvider;
  tronLink?: LegacyTronLinkProvider;
  tronWeb?: TronWeb;
  tokenpocket?: unknown;
  bitkeep?: unknown;
  okxwallet?: unknown;
  bybitWallet?: unknown;
  gatewallet?: unknown;
  binancew3w?: unknown;
  trustwallet?: unknown;
  backpack?: unknown;
  $onekey?: unknown;
  mathwallet?: unknown;
  mathWallet?: unknown;
  MathWallet?: unknown;
}): boolean {
  if (globalObject.tronLink?.isTronLink && !isKnownNonTronLinkProvider(globalObject.tronLink, globalObject)) return true;
  if (isNestedKnownWalletProvider(globalObject.tronLink, globalObject)) return false;
  if (isLinkedToKnownWalletProvider(globalObject.tronLink, globalObject)) return false;
  if (hasExplicitLegacyTronLinkSignal(globalObject.tronLink, globalObject.tronWeb)) return true;
  return hasLegacyTronLinkShape(globalObject.tronLink, globalObject.tronWeb) || hasLegacyTronLinkRequestShape(globalObject.tronLink);
}

function hasExplicitLegacyTronLinkSignal(provider: LegacyTronLinkProvider | undefined, tronWeb: TronWeb | undefined): boolean {
  if (!provider || typeof provider.request !== "function") return false;
  if (provider.ready === true) return true;
  if (provider.tronWeb?.ready === true) return true;
  return tronWeb?.ready === true;
}

function hasLegacyTronLinkShape(provider: LegacyTronLinkProvider | undefined, tronWeb: TronWeb | undefined): boolean {
  if (!provider || typeof provider.request !== "function") return false;
  return Boolean(isUsableTronWeb(provider.tronWeb) || isUsableTronWeb(tronWeb));
}

function hasLegacyTronLinkRequestShape(provider: LegacyTronLinkProvider | undefined): boolean {
  return Boolean(provider && typeof provider.request === "function");
}

function isUsableTronWeb(tronWeb: unknown): tronWeb is TronWeb {
  if (!tronWeb || typeof tronWeb !== "object") return false;
  const candidate = tronWeb as Partial<TronWeb>;
  return Boolean(candidate.trx && typeof candidate.trx === "object");
}

function isNestedKnownWalletProvider(provider: LegacyTronLinkProvider | undefined, globalObject: TronProviderGlobals): boolean {
  if (!provider) return false;
  return KNOWN_NON_TRONLINK_PROVIDER_PATHS.some((path) => readPath(globalObject, path) === provider);
}

function isKnownNonTronLinkProvider(provider: unknown, globalObject: TronProviderGlobals): boolean {
  if (!provider) return false;
  if (KNOWN_NON_TRONLINK_PROVIDER_PATHS.some((path) => readPath(globalObject, path) === provider)) return true;
  return isLinkedToKnownWalletProvider(provider, globalObject);
}

const KNOWN_NON_TRONLINK_PROVIDER_PATHS = [
  ["tokenpocket", "tron"],
  ["tokenpocket", "tronLink"],
  ["bitkeep", "tron"],
  ["bitkeep", "tronLink"],
  ["okxwallet", "tron"],
  ["okxwallet", "tronLink"],
  ["bybitWallet", "tron"],
  ["bybitWallet", "tronLink"],
  ["gatewallet", "tron"],
  ["gatewallet", "tronLink"],
  ["binancew3w", "tron"],
  ["binancew3w", "tronLink"],
  ["trustwallet", "tron"],
  ["trustwallet", "tronLink"],
  ["backpack", "tron"],
  ["backpack", "tronLink"],
  ["$onekey", "tron"],
  ["$onekey", "tronLink"],
  ["mathwallet", "tron"],
  ["mathwallet", "tronLink"],
  ["mathWallet", "tron"],
  ["mathWallet", "tronLink"],
  ["MathWallet", "tron"],
  ["MathWallet", "tronLink"]
] as const;

const KNOWN_NON_TRONLINK_PROVIDER_ROOTS = [
  "tokenpocket",
  "bitkeep",
  "okxwallet",
  "bybitWallet",
  "gatewallet",
  "binancew3w",
  "trustwallet",
  "backpack",
  "$onekey",
  "mathwallet",
  "mathWallet",
  "MathWallet"
] as const;

function isLinkedToKnownWalletProvider(provider: unknown, globalObject: TronProviderGlobals): boolean {
  if (!provider) return false;
  const providerTronWeb = readPath(provider, ["tronWeb"]);
  if (!providerTronWeb) return false;
  return isTronWebLinkedToKnownWallet(providerTronWeb, globalObject);
}

function isTronWebLinkedToKnownWallet(providerTronWeb: unknown, globalObject: TronProviderGlobals): boolean {
  if (!providerTronWeb) return false;
  return KNOWN_NON_TRONLINK_PROVIDER_ROOTS.some((root) => {
    const wallet = readPath(globalObject, [root]);
    const walletTronWeb = readPath(wallet, ["tronWeb"]) ?? readPath(wallet, ["tron", "tronWeb"]) ?? readPath(wallet, ["tronLink", "tronWeb"]);
    return Boolean(walletTronWeb && providerTronWeb === walletTronWeb);
  });
}

function readPath(source: unknown, path: readonly string[]): unknown {
  return path.reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
}

async function requestAddress(provider: TronLinkProvider): Promise<string | undefined> {
  if (provider.kind === "tip1193") {
    const result = await provider.provider.request({ method: "eth_requestAccounts" });
    const address = Array.isArray(result) && typeof result[0] === "string" ? result[0] : undefined;
    return address ?? getProviderTronWeb(provider).defaultAddress?.base58;
  }

  if (provider.kind === "legacy") {
    const result = await provider.provider.request({ method: "tron_requestAccounts" });
    if (result?.code === 4001) throw new WalletKitError("USER_REJECTED", result.message ?? "User rejected TronLink connection.");
    if (result?.code === 4000) throw new WalletKitError("CONNECTION_FAILED", result.message ?? "A TronLink request is already pending.");
    hydrateLegacyTronWeb(provider.provider);
  }

  return getProviderTronWeb(provider).defaultAddress?.base58;
}

function getProviderTronWeb(provider: TronLinkProvider): TronWeb {
  if (provider.kind === "legacy") hydrateLegacyTronWeb(provider.provider);
  const tronWeb = provider.provider.tronWeb;
  if (!tronWeb) throw new WalletKitError("CONNECTION_FAILED", "TronLink tronWeb is not available.");
  return tronWeb;
}

function hydrateLegacyTronWeb(provider: LegacyTronLinkProvider): void {
  if (provider.tronWeb) return;
  const tronWeb = (globalThis as TronProviderGlobals).tronWeb;
  if (tronWeb) provider.tronWeb = tronWeb;
}

async function resolveNetwork(tronWeb: TronWeb, fallback: ConnectOptions["network"]): Promise<WalletNetwork> {
  const block = await tronWeb.trx.getBlockByNumber?.(0);
  const chainId = block?.blockID ? `0x${block.blockID.slice(-8)}` : undefined;
  const resolved = createNetworkFromChainId(chainId);
  if (resolved.id !== "unknown") return withProviderHosts(resolved, tronWeb);
  if (typeof fallback === "object" && fallback) return withProviderHosts(fallback, tronWeb);
  return withProviderHosts(TRON_MAINNET, tronWeb);
}

function createNetworkFromChainId(chainId: string | undefined): WalletNetwork {
  if (chainId === "0x2b6653dc") return { ...TRON_MAINNET };
  if (chainId === "0x94a9059e") return { ...TRON_SHASTA };
  if (chainId === "0xcd8690dc") return { ...TRON_NILE };
  return {
    id: "unknown",
    name: "TRON Unknown",
    family: "tron",
    networkType: "CUSTOM",
    nativeAsset: "TRX",
    nativeAssetDecimals: 6,
    rpcUrl: ""
  };
}

function withProviderHosts(network: WalletNetwork, tronWeb: TronWeb): WalletNetwork {
  return {
    ...network,
    ...(tronWeb.fullNode?.host ?? network.fullHost ? { fullHost: tronWeb.fullNode?.host ?? network.fullHost } : {}),
    ...(tronWeb.solidityNode?.host ?? network.solidityNode ? { solidityNode: tronWeb.solidityNode?.host ?? network.solidityNode } : {}),
    ...(tronWeb.eventServer?.host ?? network.eventServer ? { eventServer: tronWeb.eventServer?.host ?? network.eventServer } : {})
  };
}

function extractSignature(transaction: TransactionPayload): string | undefined {
  const signature = transaction.signature;
  if (Array.isArray(signature) && typeof signature[0] === "string") return signature[0];
  return typeof signature === "string" ? signature : undefined;
}

function toSafeNumber(value: unknown): number {
  const amount = typeof value === "bigint" ? value : BigInt(String(value));
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new WalletKitError("SEND_TRANSACTION_FAILED", "TRX amount in SUN is too large.");
  }
  return Number(amount);
}

function normalizeTronLinkError(cause: unknown, code: string, message: string): WalletKitError {
  if (cause instanceof WalletKitError) return cause;
  if (typeof cause === "object" && cause !== null && "code" in cause && (cause as { code?: unknown }).code === 4001) {
    return new WalletKitError("USER_REJECTED", "User rejected the TronLink request.", cause);
  }
  return new WalletKitError(code, message, cause);
}
