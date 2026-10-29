import { TRON_MAINNET, WalletKitError, type TronNetwork, type WalletManager } from "@tron-wallet-kit/core";

export type BalanceTronWeb = {
  trx?: {
    getBalance?(address: string): Promise<unknown> | unknown;
    sendRawTransaction?(transaction: Record<string, unknown>): Promise<unknown>;
  };
};

export type TronDomainTronWeb = BalanceTronWeb & {
  setAddress?(address: string): void;
  contract(): { at(address: string): Promise<unknown> };
  toSun?(value: string | number): number | string;
  transactionBuilder?: {
    sendTrx?(to: string, amountSun: number, from?: string): Promise<Record<string, unknown>>;
    withdrawReward?(ownerAddress?: string): Promise<Record<string, unknown>>;
    withdrawBlockRewards?(ownerAddress?: string): Promise<Record<string, unknown>>;
    triggerSmartContract?(
      contractAddress: string,
      functionSelector: string,
      options?: Record<string, unknown>,
      parameters?: unknown[],
      issuerAddress?: string
    ): Promise<Record<string, unknown>>;
  };
};

export type SharedTronWebConfig = {
  fullHost?: string;
  apiKey?: string;
  headers?: Record<string, string>;
};

const balanceTronWebPathsByWallet: Record<string, readonly string[]> = {
  tronlink: ["tronLink.tronWeb", "tron.tronWeb", "tronWeb"],
  tokenpocket: ["tokenpocket.tron.tronWeb", "tokenpocket.tronWeb"],
  okx: ["okxwallet.tronLink.tronWeb"],
  bitget: ["bitkeep.tron.tronWeb", "bitkeep.tronLink.tronWeb", "bitkeep.tronWeb"],
  trust: ["trustwallet.tronLink.tronWeb", "trustwallet.tron.tronWeb"],
  gate: ["gatewallet.tron.tronWeb", "gatewallet.tronLink.tronWeb", "gatewallet.tronWeb"],
  foxwallet: ["foxwallet.tronLink.tronWeb"],
  bybit: ["bybitWallet.tronLink.tronWeb", "bybitWallet.tron.tronWeb"],
  imtoken: ["tronweb"],
  binance: ["binancew3w.tron.tronWeb", "binancew3w.tronLink.tronWeb"],
  safepal: ["safepalTronProvider.tronWeb", "safepalwallet.tron.tronWeb", "SafePalHook.tronWeb", "tronWeb"],
  guarda: ["guarda.tronWeb", "guarda.tron.tronWeb"],
  onekey: ["$onekey.tron.tronWeb", "$onekey.tronLink.tronWeb"],
  backpack: ["backpack.tron.tronWeb", "backpack.tronLink.tronWeb"]
};

const sharedTronWebByHost = new Map<string, TronDomainTronWeb>();
let sharedTronWebConfig: SharedTronWebConfig = {};

export function configureSharedTronWeb(config: SharedTronWebConfig | undefined): void {
  sharedTronWebConfig = config ?? {};
}

export function resolveBalanceTronWeb(walletId: string | undefined): BalanceTronWeb | undefined {
  const paths = walletId ? balanceTronWebPathsByWallet[walletId] : undefined;
  const preferredPaths = walletId === "trust" && /Android|iPhone|iPad|iPod/i.test(globalThis.navigator?.userAgent ?? "")
    ? ["trustwallet.tron.tronWeb", "trustwallet.tronLink.tronWeb"]
    : paths;
  for (const path of preferredPaths ?? []) {
    const value = getPathValue(globalThis as unknown as Record<string, unknown>, path);
    if (isBalanceTronWeb(value)) return value;
  }
  return undefined;
}

export async function getSharedTronWeb(manager: WalletManager | undefined, network: TronNetwork | undefined, _walletId: string | undefined): Promise<TronDomainTronWeb> {
  const testTronWeb = (globalThis as { __tronWalletKitTronWebForTest?: TronDomainTronWeb }).__tronWalletKitTronWebForTest;
  if (testTronWeb) return testTronWeb;
  const resolvedNetwork = network ?? manager?.getNetwork() ?? TRON_MAINNET;
  const fullHost = sharedTronWebConfig.fullHost ?? resolvedNetwork.fullHost ?? resolvedNetwork.httpRpcUrl ?? resolvedNetwork.rpcUrl;
  const headers = {
    ...(sharedTronWebConfig.headers ?? {}),
    ...(sharedTronWebConfig.apiKey ? { "TRON-PRO-API-KEY": sharedTronWebConfig.apiKey } : {})
  };
  const cacheKey = `${fullHost}:${JSON.stringify(headers)}`;
  const cached = sharedTronWebByHost.get(cacheKey);
  if (cached) return cached;
  const TronWeb = await loadTronWebConstructor();
  const tronWeb = new TronWeb({ fullHost, ...(Object.keys(headers).length > 0 ? { headers } : {}) });
  sharedTronWebByHost.set(cacheKey, tronWeb);
  return tronWeb;
}

function isBalanceTronWeb(value: unknown): value is BalanceTronWeb {
  if (typeof value !== "object" || value === null) return false;
  const trx = (value as BalanceTronWeb).trx;
  return typeof trx?.getBalance === "function";
}

async function loadTronWebConstructor(): Promise<TronWebConstructor> {
  const tronWebModule = (await import("tronweb")) as unknown as { TronWeb?: TronWebConstructor; default?: { TronWeb?: TronWebConstructor } | TronWebConstructor };
  const defaultExport = tronWebModule.default;
  const TronWeb = tronWebModule.TronWeb ?? (typeof defaultExport === "function" ? defaultExport : defaultExport?.TronWeb);
  if (!TronWeb) throw new WalletKitError("CONFIGURATION_ERROR", "Unable to load TronWeb constructor.");
  return TronWeb;
}

function getPathValue(source: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (typeof current !== "object" || current === null) return undefined;
    return (current as Record<string, unknown>)[part];
  }, source);
}

type TronWebConstructor = new (options: { fullHost: string; headers?: Record<string, string> }) => TronDomainTronWeb;
