import type { TronAccount, TronNetwork, WalletManager, WalletSession } from "@tron-wallet-kit/core";
import type {
  GasFreeApiHeadersResolver,
  GasFreeBalance,
  GasFreeBalanceResolver,
  GasFreeMode,
  GasFreeRuntime,
  GasFreeSnapshot,
  WalletClientGasFreeConfig
} from "./types";

const GASFREE_USDT_MAINNET = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const GASFREE_SDK_PACKAGE = "@gasfree/gasfree-sdk";
const GASFREE_CHAIN_IDS: Record<string, number> = {
  mainnet: Number("0x2b6653dc"),
  nile: Number("0xcd8690dc"),
  shasta: Number("0x94a9059e")
};

type GasFreeSdkModule = {
  TronGasFree: new (options: { chainId?: number; chainInfo?: GasFreeChainInfo }) => {
    generateGasFreeAddress(userAddress: string): string;
  };
};

type GasFreeChainInfo = {
  chainId: number;
  gasFreeController: string;
  beacon: string;
  creationCode: string;
};

type GasFreeRuntimeState = {
  mode: GasFreeMode;
  address: string | undefined;
  balance: GasFreeBalance | undefined;
  isLoading: boolean;
  error: string | undefined;
};

type GasFreeProviderAccountInfo = {
  accountAddress: string | undefined;
  gasFreeAddress: string | undefined;
  active: boolean | undefined;
  nonce: string | undefined;
  allowSubmit: boolean | undefined;
  assets: GasFreeProviderAsset[];
  raw: unknown;
};

type GasFreeProviderAsset = {
  tokenAddress: string | undefined;
  tokenSymbol: string | undefined;
  balance: string | undefined;
  available: string | undefined;
  frozen: string | undefined;
  decimal: number | undefined;
  raw: unknown;
};

export type Trc20GasFreeBalanceResolverOptions = {
  fullHost?: string;
  token?: string;
  decimals?: number;
  symbol?: string;
  fetch?: typeof globalThis.fetch;
};

export function createTrc20GasFreeBalanceResolver(options: Trc20GasFreeBalanceResolverOptions = {}): GasFreeBalanceResolver {
  return async ({ account, gasFreeAddress, token }) => {
    const fetcher = options.fetch ?? globalThis.fetch;
    if (!fetcher) return undefined;

    const fullHost = (options.fullHost ?? "https://api.trongrid.io").replace(/\/+$/, "");
    const contractAddress = options.token ?? token;
    const parameter = await encodeTronAddressParameter(gasFreeAddress);
    const response = await fetcher(`${fullHost}/wallet/triggerconstantcontract`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        owner_address: account.address,
        contract_address: contractAddress,
        function_selector: "balanceOf(address)",
        parameter,
        visible: true
      })
    });
    if (!response.ok) throw new Error(`GasFree TRC20 balance request failed with status ${response.status}.`);

    const payload = await response.json();
    const rawHex = isRecord(payload) && Array.isArray(payload.constant_result) ? payload.constant_result[0] : undefined;
    if (typeof rawHex !== "string") return undefined;
    const raw = BigInt(`0x${rawHex || "0"}`).toString();
    return formatGasFreeBalance(raw, options.decimals ?? 6, options.symbol ?? "USDT", payload);
  };
}

export function createGasFreeRuntime(manager: WalletManager, config: WalletClientGasFreeConfig | undefined): GasFreeRuntime {
  const normalized = normalizeGasFreeConfig(config);
  let state: GasFreeRuntimeState = { mode: "general", address: undefined, balance: undefined, isLoading: false, error: undefined };
  const listeners = new Set<() => void>();
  const addressCache = new Map<string, string>();
  const balanceCache = new Map<string, GasFreeBalance>();
  const providerAccountCache = new Map<string, GasFreeProviderAccountInfo>();
  let runId = 0;

  const emit = () => listeners.forEach((listener) => listener());
  const getSession = () => manager.getSession();
  const isEnabledForSession = (session: WalletSession | null = getSession()) => Boolean(normalized.enabled && session && isMainnet(session.network));
  const getDisabledReason = (session: WalletSession | null = getSession()) => {
    if (!normalized.enabled) return "GasFree is disabled.";
    if (!session) return "Connect a wallet to use GasFree.";
    if (!isMainnet(session.network)) return "GasFree is available on TRON mainnet.";
    return undefined;
  };
  const getAddressCacheKey = (session: WalletSession) => `${session.network.id}:${session.account.address}`;
  const getBalanceCacheKey = (address: string) => `${normalized.token}:${address}`;
  const buildSnapshot = (): GasFreeSnapshot => {
    const session = getSession();
    const enabled = isEnabledForSession(session);
    const disabledReason = enabled ? undefined : getDisabledReason(session);
    const snapshot: GasFreeSnapshot = {
      configured: normalized.enabled,
      enabled,
      mode: normalized.enabled ? state.mode : "general",
      isLoading: state.isLoading,
      token: normalized.token
    };
    if (state.address) snapshot.address = state.address;
    if (state.balance) snapshot.balance = state.balance;
    if (state.error) snapshot.error = state.error;
    if (disabledReason) snapshot.disabledReason = disabledReason;
    return snapshot;
  };
  let cachedSnapshot = buildSnapshot();
  const setState = (next: Partial<GasFreeRuntimeState>) => {
    state = { ...state, ...next };
    cachedSnapshot = buildSnapshot();
    emit();
  };

  const runtime: GasFreeRuntime = {
    get enabled() {
      return isEnabledForSession();
    },
    getMode: () => state.mode,
    setMode: (mode) => {
      const nextMode = mode === "gasfree" && !normalized.enabled ? "general" : mode;
      setState({ mode: nextMode });
      if (nextMode === "gasfree") {
        void runtime.refresh();
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => cachedSnapshot,
    getAddress: async () => {
      const session = getSession();
      if (!session) return undefined;
      if (!isEnabledForSession(session)) return undefined;
      const key = getAddressCacheKey(session);
      const cached = addressCache.get(key);
      if (cached) {
        if (state.address !== cached) setState({ address: cached, error: undefined });
        return cached;
      }
      const providerAccount = await getProviderAccountInfo(session);
      if (providerAccount?.gasFreeAddress) {
        addressCache.set(key, providerAccount.gasFreeAddress);
        setState({ address: providerAccount.gasFreeAddress, error: undefined });
        return providerAccount.gasFreeAddress;
      }
      const gasFree = await createGasFree(session.network, normalized);
      const address = gasFree.generateGasFreeAddress(session.account.address);
      addressCache.set(key, address);
      setState({ address, error: undefined });
      return address;
    },
    getBalance: async () => {
      const address = await runtime.getAddress();
      const session = getSession();
      if (!address || !session || !isEnabledForSession(session)) return undefined;
      const key = getBalanceCacheKey(address);
      const cached = balanceCache.get(key);
      if (cached) {
        if (state.balance !== cached) setState({ balance: cached });
        return cached;
      }
      const providerAccount = await getProviderAccountInfo(session);
      const providerBalance = providerAccount ? normalizeGasFreeProviderBalance(providerAccount, normalized.token) : undefined;
      if (providerBalance) {
        balanceCache.set(key, providerBalance);
        setState({ balance: providerBalance });
        return providerBalance;
      }
      const balance = await resolveGasFreeBalance(normalized, session.account, session.network, address);
      if (balance) {
        balanceCache.set(key, balance);
        setState({ balance });
      }
      return balance;
    },
    refresh: async () => {
      const session = getSession();
      if (!isEnabledForSession(session)) {
        setState({ address: undefined, balance: undefined, isLoading: false, error: undefined });
        return runtime.getSnapshot();
      }
      const currentRun = ++runId;
      setState({ isLoading: true, error: undefined });
      try {
        const address = await runtime.getAddress();
        const balance = await runtime.getBalance();
        if (currentRun === runId) setState({ address, balance, isLoading: false, error: undefined });
      } catch (error) {
        if (currentRun === runId) {
          setState({ isLoading: false, error: errorMessage(error) });
          if (normalized.failSilently === false) throw error;
        }
      }
      return runtime.getSnapshot();
    }
  };

  async function getProviderAccountInfo(session: WalletSession): Promise<GasFreeProviderAccountInfo | undefined> {
    if (!normalized.apiBaseUrl) return undefined;
    const key = getAddressCacheKey(session);
    const cached = providerAccountCache.get(key);
    if (cached) return cached;
    const info = await fetchGasFreeAccountInfo(normalized.apiBaseUrl, session.account, session.network, normalized);
    if (info) {
      providerAccountCache.set(key, info);
      if (info.gasFreeAddress) addressCache.set(key, info.gasFreeAddress);
    }
    return info;
  }

  const resetForSession = () => {
    runId += 1;
    const mode = normalized.enabled ? state.mode : "general";
    state = { mode, address: undefined, balance: undefined, isLoading: false, error: undefined };
    cachedSnapshot = buildSnapshot();
    emit();
  };
  const unsubscribe = [
    manager.on("connected", resetForSession),
    manager.on("disconnected", resetForSession),
    manager.on("session_restored", resetForSession)
  ];
  const originalSubscribe = runtime.subscribe;
  runtime.subscribe = (listener) => {
    const off = originalSubscribe(listener);
    return () => {
      off();
      if (listeners.size === 0 && !manager.getSession()) unsubscribe.forEach((unsub) => unsub());
    };
  };

  return runtime;
}

function normalizeGasFreeConfig(config: WalletClientGasFreeConfig | undefined): Required<Pick<WalletClientGasFreeConfig, "enabled" | "token" | "failSilently">> &
  Omit<WalletClientGasFreeConfig, "enabled" | "token" | "failSilently"> {
  return {
    ...config,
    enabled: config?.enabled ?? false,
    token: config?.token ?? GASFREE_USDT_MAINNET,
    failSilently: config?.failSilently ?? true
  };
}

async function createGasFree(network: TronNetwork, config: ReturnType<typeof normalizeGasFreeConfig>) {
  await ensureGasFreeSdkGlobals();
  const { TronGasFree } = await import(GASFREE_SDK_PACKAGE) as GasFreeSdkModule;
  const defaultChainId = GASFREE_CHAIN_IDS.mainnet;
  if (!defaultChainId) throw new Error("GasFree mainnet chain id is not configured.");
  const chainId = normalizeChainId(config.chainId ?? GASFREE_CHAIN_IDS[String(network.id)] ?? defaultChainId);
  if (config.gasFreeController || config.beacon || config.creationCode) {
    if (!config.gasFreeController || !config.beacon || !config.creationCode) {
      throw new Error("Custom GasFree chain info requires gasFreeController, beacon, and creationCode.");
    }
    return new TronGasFree({
      chainInfo: {
        chainId,
        gasFreeController: config.gasFreeController,
        beacon: config.beacon,
        creationCode: config.creationCode
      }
    });
  }
  return new TronGasFree({ chainId });
}

async function ensureGasFreeSdkGlobals() {
  type ProcessShim = {
    browser?: boolean;
    env?: Record<string, string | undefined>;
    nextTick?: (callback: () => void) => void;
  };
  const scope = globalThis as unknown as { global?: typeof globalThis; Buffer?: unknown } & Record<string, unknown>;
  scope.global ??= globalThis;
  const processShim = (scope["process"] ?? {}) as ProcessShim;
  processShim.env ??= {};
  processShim.browser ??= true;
  processShim.nextTick ??= (callback) => {
    queueMicrotask(callback);
  };
  scope["process"] = processShim;
  if (!scope.Buffer) {
    const { Buffer } = await import("buffer");
    scope.Buffer = Buffer;
  }
}

async function encodeTronAddressParameter(address: string): Promise<string> {
  const { TronWeb } = await import("tronweb");
  const hex = TronWeb.address.toHex(address).replace(/^41/, "");
  return hex.padStart(64, "0");
}

async function resolveGasFreeBalance(
  config: ReturnType<typeof normalizeGasFreeConfig>,
  account: TronAccount,
  network: TronNetwork,
  gasFreeAddress: string
): Promise<GasFreeBalance | undefined> {
  const resolver: GasFreeBalanceResolver | undefined = config.balanceResolver;
  if (resolver) {
    return normalizeGasFreeBalance(await resolver({ account, network, gasFreeAddress, token: config.token }));
  }
  return undefined;
}

async function fetchGasFreeAccountInfo(
  apiBaseUrl: string,
  account: TronAccount,
  network: TronNetwork,
  config: ReturnType<typeof normalizeGasFreeConfig>
): Promise<GasFreeProviderAccountInfo | undefined> {
  const fetcher = config.fetch ?? globalThis.fetch;
  if (!fetcher) return undefined;
  const url = buildGasFreeApiUrl(apiBaseUrl, `/api/v1/address/${encodeURIComponent(account.address)}`);
  const headers = await resolveGasFreeApiHeaders(config.apiHeaders, {
    method: "GET",
    url: url.toString(),
    path: url.pathname,
    timestamp: Math.floor(Date.now() / 1000),
    account,
    network
  });
  const init: RequestInit = headers ? { method: "GET", headers } : { method: "GET" };
  const response = await fetcher(url.toString(), init);
  const payload = await parseGasFreeApiResponse(response);
  return normalizeGasFreeProviderAccountInfo(payload);
}

function buildGasFreeApiUrl(apiBaseUrl: string, path: string): URL {
  return new URL(`${apiBaseUrl.replace(/\/+$/, "")}${path}`);
}

async function resolveGasFreeApiHeaders(
  resolver: GasFreeApiHeadersResolver | undefined,
  context: Parameters<GasFreeApiHeadersResolver>[0]
): Promise<HeadersInit | undefined> {
  return resolver ? resolver(context) : undefined;
}

async function parseGasFreeApiResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  let payload: unknown = text;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  if (!response.ok) {
    const message = isRecord(payload) ? firstString(payload.message, payload.reason) : undefined;
    throw new Error(message ?? `GasFree provider API request failed with status ${response.status}.`);
  }
  if (isRecord(payload) && typeof payload.code === "number" && payload.code !== 200) {
    const message = firstString(payload.message, payload.reason) ?? `GasFree provider API returned code ${payload.code}.`;
    throw new Error(message);
  }
  return payload;
}

function normalizeGasFreeProviderAccountInfo(input: unknown): GasFreeProviderAccountInfo | undefined {
  const body = isRecord(input) && isRecord(input.data) ? input.data : input;
  if (!isRecord(body)) return undefined;
  const assets = Array.isArray(body.assets) ? body.assets.map(normalizeGasFreeProviderAsset).filter(isDefined) : [];
  return {
    accountAddress: firstString(body.accountAddress, body.account_address),
    gasFreeAddress: firstString(body.gasFreeAddress, body.gas_free_address),
    active: typeof body.active === "boolean" ? body.active : undefined,
    nonce: firstString(body.nonce),
    allowSubmit: typeof body.allowSubmit === "boolean" ? body.allowSubmit : typeof body.allow_submit === "boolean" ? body.allow_submit : undefined,
    assets,
    raw: input
  };
}

function normalizeGasFreeProviderAsset(input: unknown): GasFreeProviderAsset | undefined {
  if (!isRecord(input)) return undefined;
  return {
    tokenAddress: firstString(input.tokenAddress, input.token_address),
    tokenSymbol: firstString(input.tokenSymbol, input.token_symbol, input.symbol),
    balance: firstString(input.balance, input.available, input.amount, input.value, input.tokenBalance, input.token_balance),
    available: firstString(input.available, input.availableBalance, input.available_balance),
    frozen: firstString(input.frozen),
    decimal: firstNumber(input.decimal, input.decimals, input.tokenDecimals, input.token_decimals),
    raw: input
  };
}

function normalizeGasFreeProviderBalance(info: GasFreeProviderAccountInfo, token: string): GasFreeBalance | undefined {
  const matchingAsset =
    info.assets.find((asset) => asset.tokenAddress === token) ??
    info.assets.find((asset) => asset.tokenSymbol?.toUpperCase() === "USDT") ??
    info.assets[0];
  if (!matchingAsset?.balance) return undefined;
  return formatGasFreeBalance(matchingAsset.balance, matchingAsset.decimal ?? 6, matchingAsset.tokenSymbol ?? "USDT", matchingAsset.raw);
}

export function normalizeGasFreeBalance(input: unknown): GasFreeBalance | undefined {
  if (input == null) return undefined;
  if (typeof input === "string" || typeof input === "number" || typeof input === "bigint") {
    return formatGasFreeBalance(String(input), 6, "USDT", input);
  }
  const value = input as Record<string, unknown>;
  const data = isRecord(value.data) ? value.data : value;
  const balance = firstString(data.balance, data.value, data.amount, data.available, data.availableBalance, data.tokenBalance);
  const formatted = firstString(data.formatted, data.display, data.displayBalance, data.uiAmount);
  const decimals = firstNumber(data.decimals, data.tokenDecimals) ?? 6;
  const symbol = firstString(data.symbol, data.tokenSymbol) ?? "USDT";
  if (formatted) {
    return {
      value: balance ?? formatted,
      formatted,
      symbol,
      decimals,
      raw: input
    };
  }
  if (!balance) return undefined;
  return formatGasFreeBalance(balance, decimals, symbol, input);
}

function formatGasFreeBalance(value: string, decimals: number, symbol: string, raw: unknown): GasFreeBalance {
  const formatted = formatUnits(value, decimals);
  return { value, formatted, symbol, decimals, raw };
}

function formatUnits(value: string, decimals: number): string {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return normalized;
  if (decimals <= 0) return normalized;
  const padded = normalized.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals).replace(/^0+(?=\d)/, "") || "0";
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

function normalizeChainId(value: string | number): number {
  return typeof value === "string" ? Number(value) : value;
}

function isMainnet(network: TronNetwork): boolean {
  return network.id === "mainnet" || network.networkType === "MAINNET";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "bigint") return String(value);
  }
  return undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.length > 0 && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
