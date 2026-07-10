import { TRON_MAINNET, WalletKitError, type TronNetwork, type WalletManager } from "@tron-wallet-kit/core";

export type BalanceTronWeb = {
  trx?: {
    getBalance?(address: string): Promise<unknown> | unknown;
  };
};

export type TronDomainTronWeb = BalanceTronWeb & {
  setAddress?(address: string): void;
  contract(): { at(address: string): Promise<unknown> };
};

const balanceTronWebPathsByWallet: Record<string, readonly string[]> = {
  tronlink: ["tronLink.tronWeb", "tron.tronWeb", "tronWeb"],
  tokenpocket: ["tokenpocket.tron.tronWeb", "tokenpocket.tronWeb"],
  okx: ["okxwallet.tronLink.tronWeb"],
  bitget: ["bitkeep.tron.tronWeb", "bitkeep.tronLink.tronWeb", "bitkeep.tronWeb"],
  trust: ["trustwallet.tronLink.tronWeb", "tronWeb"],
  gate: ["gatewallet.tron.tronWeb", "gatewallet.tronLink.tronWeb", "gatewallet.tronWeb"],
  foxwallet: ["foxwallet.tronLink.tronWeb"],
  bybit: ["bybitWallet.tronLink.tronWeb", "bybitWallet.tron.tronWeb"],
  imtoken: ["tronweb"],
  binance: ["binancew3w.tron.tronWeb", "binancew3w.tronLink.tronWeb"],
  safepal: ["tronWeb"],
  guarda: ["guarda.tronWeb", "guarda.tron.tronWeb"],
  onekey: ["$onekey.tron.tronWeb", "$onekey.tronLink.tronWeb"],
  backpack: ["backpack.tron.tronWeb", "backpack.tronLink.tronWeb"]
};

let sharedTronWeb: TronDomainTronWeb | undefined;

export function resolveBalanceTronWeb(walletId: string | undefined): BalanceTronWeb | undefined {
  const paths = walletId ? balanceTronWebPathsByWallet[walletId] : undefined;
  for (const path of paths ?? []) {
    const value = getPathValue(globalThis as unknown as Record<string, unknown>, path);
    if (isBalanceTronWeb(value)) return value;
  }
  return undefined;
}

export async function getSharedTronWeb(manager: WalletManager | undefined, network: TronNetwork | undefined, walletId: string | undefined): Promise<TronDomainTronWeb> {
  const testTronWeb = (globalThis as { __tronWalletKitTronWebForTest?: TronDomainTronWeb }).__tronWalletKitTronWebForTest;
  if (testTronWeb) {
    sharedTronWeb = testTronWeb;
    return sharedTronWeb;
  }
  if (sharedTronWeb) return sharedTronWeb;
  const injected = resolveIdentityTronWeb(walletId);
  if (injected) {
    sharedTronWeb = injected;
    return sharedTronWeb;
  }
  const resolvedNetwork = network ?? manager?.getNetwork() ?? TRON_MAINNET;
  const fullHost = resolvedNetwork.fullHost ?? resolvedNetwork.httpRpcUrl ?? resolvedNetwork.rpcUrl;
  const TronWeb = await loadTronWebConstructor();
  sharedTronWeb = new TronWeb({ fullHost });
  return sharedTronWeb;
}

function resolveIdentityTronWeb(walletId: string | undefined): TronDomainTronWeb | undefined {
  const tronWeb = resolveBalanceTronWeb(walletId);
  return isTronDomainTronWeb(tronWeb) ? tronWeb : undefined;
}

function isBalanceTronWeb(value: unknown): value is BalanceTronWeb {
  if (typeof value !== "object" || value === null) return false;
  const trx = (value as BalanceTronWeb).trx;
  return typeof trx?.getBalance === "function";
}

function isTronDomainTronWeb(value: unknown): value is TronDomainTronWeb {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<TronDomainTronWeb>;
  return typeof candidate.contract === "function";
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

type TronWebConstructor = new (options: { fullHost: string }) => TronDomainTronWeb;
