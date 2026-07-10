import { TRON_MAINNET, TRON_NILE, TRON_SHASTA, WalletKitError, type WalletNetwork } from "@tron-wallet-kit/core";
import type { InjectedTronProvider } from "../types";

export function hasMetaMaskEthereumProvider(): boolean {
  const ethereum = (globalThis as typeof globalThis & { ethereum?: { isMetaMask?: boolean; overrideIsMetaMask?: boolean; providers?: Array<{ isMetaMask?: boolean }> } }).ethereum;
  if (!ethereum) return false;
  if (ethereum.isMetaMask && !ethereum.overrideIsMetaMask) return true;
  return Boolean(ethereum.providers?.some((provider) => provider.isMetaMask));
}

export function getGuardaInjectedProvider(): InjectedTronProvider | undefined {
  const guarda = safeGetProperty(globalThis as unknown as Record<string, unknown>, "guarda");
  if (!guarda || typeof guarda !== "object") return undefined;
  const wallet = guarda as Record<string, unknown>;
  const walletTronWeb = safeGetProperty(wallet, "tronWeb") as InjectedTronProvider["tronWeb"] | undefined;
  const tron = safeGetProperty(wallet, "tron");
  if (isInjectedTronProvider(tron)) {
    const provider = cloneInjectedProvider(tron);
    if (!provider.tronWeb && walletTronWeb) provider.tronWeb = walletTronWeb;
    return provider;
  }
  if (isInjectedTronProvider(wallet)) return cloneInjectedProvider(wallet);
  return undefined;
}

export function getBitgetInjectedProvider(): InjectedTronProvider | undefined {
  const globals = globalThis as unknown as Record<string, unknown>;
  const bitkeep = safeGetProperty(globals, "bitkeep");
  if (bitkeep && typeof bitkeep === "object") {
    const wallet = bitkeep as Record<string, unknown>;
    const walletTronWeb = safeGetProperty(wallet, "tronWeb") as InjectedTronProvider["tronWeb"] | undefined;
    const provider = mergeParentTronWeb(safeGetProperty(wallet, "tronLink")) ?? mergeParentTronWeb(safeGetProperty(wallet, "tron")) ?? mergeParentTronWeb(wallet);
    if (provider) return provider;

    function mergeParentTronWeb(value: unknown): InjectedTronProvider | undefined {
      if (!isInjectedTronProvider(value)) return undefined;
      const provider = cloneInjectedProvider(value);
      if (!provider.tronWeb && walletTronWeb) provider.tronWeb = walletTronWeb;
      return provider;
    }
  }
  const globalTronLink = safeGetProperty(globals, "tronLink");
  if (safeGetProperty(globals, "isBitKeep") && isInjectedTronProvider(globalTronLink)) {
    const provider = cloneInjectedProvider(globalTronLink);
    const globalTronWeb = safeGetProperty(globals, "tronWeb") as InjectedTronProvider["tronWeb"] | undefined;
    if (!provider.tronWeb && globalTronWeb) provider.tronWeb = globalTronWeb;
    return provider;
  }
  return undefined;
}

export function getBinanceInjectedProvider(): InjectedTronProvider | undefined {
  const globals = globalThis as unknown as Record<string, unknown>;
  const binancew3w = safeGetProperty(globals, "binancew3w");
  if (!binancew3w || typeof binancew3w !== "object") return undefined;
  const wallet = binancew3w as Record<string, unknown>;
  const tron = safeGetProperty(wallet, "tron");
  if (!tron || typeof tron !== "object") return undefined;

  const provider = tron as Record<string, unknown>;
  const getAccount = safeGetProperty(provider, "getAccount");
  const getChainId = safeGetProperty(provider, "getChainId");
  const signMessageV2 = safeGetProperty(provider, "signMessageV2");
  const signTransaction = safeGetProperty(provider, "signTransaction");
  if (typeof getAccount !== "function") return undefined;
  const trx: NonNullable<NonNullable<InjectedTronProvider["tronWeb"]>["trx"]> = {};
  if (typeof getChainId === "function") {
    trx.getBlockByNumber = async () => {
      const chainId = String(await getChainId.call(provider));
      const suffix = chainId.startsWith("0x") ? chainId.slice(2).slice(-8) : "";
      return { blockID: `${"0".repeat(56)}${suffix}` };
    };
  }
  if (typeof signMessageV2 === "function") {
    trx.signMessageV2 = (message: string) => signMessageV2.call(provider, message);
  }
  if (typeof signTransaction === "function") {
    trx.sign = (transaction: unknown) => signTransaction.call(provider, transaction);
  }

  return {
    request: async ({ method, params }) => {
      if (method === "tron_requestAccounts" || method === "eth_requestAccounts") {
        const account = await getAccount.call(provider);
        const address = extractInjectedAddress(account);
        return address ? [address] : account;
      }
      if (method === "tron_signMessage" && typeof signMessageV2 === "function") {
        const message = typeof params === "object" && params !== null && "message" in params ? (params as { message?: unknown }).message : params;
        return signMessageV2.call(provider, String(message ?? ""));
      }
      if (method === "tron_signTransaction" && typeof signTransaction === "function") {
        const transaction = typeof params === "object" && params !== null && "transaction" in params ? (params as { transaction?: unknown }).transaction : params;
        return signTransaction.call(provider, transaction);
      }
      return undefined;
    },
    tronWeb: {
      trx
    }
  };
}

export function getSafePalInjectedProvider(): InjectedTronProvider | undefined {
  const globals = globalThis as unknown as Record<string, unknown>;
  const safePalHook = safeGetProperty(globals, "SafePalHook");
  const tronWeb = safeGetProperty(globals, "tronWeb");
  if (!safePalHook || typeof safePalHook !== "object") return undefined;
  if (!tronWeb || typeof tronWeb !== "object") return undefined;
  const hook = safePalHook as Record<string, unknown>;
  const request = safeGetProperty(hook, "request");
  const provider: InjectedTronProvider = {
    tronWeb: createSafePalTronWeb(tronWeb, hook)
  };

  if (typeof request === "function") {
    provider.request = async (args) => {
      const result = await request.call(hook, args);
      provider.tronWeb = createSafePalTronWeb(tronWeb, hook);
      if (args.method === "tron_requestAccounts" || args.method === "eth_requestAccounts") {
        const address = extractInjectedAddress(result) ?? getDefaultBase58Address(safeGetProperty(hook, "defaultAddress"));
        return typeof address === "string" ? [address] : result;
      }
      return result;
    };
  }

  return provider;
}

export function getFoxWalletInjectedProvider(): InjectedTronProvider | undefined {
  const foxwallet = safeGetProperty(globalThis as unknown as Record<string, unknown>, "foxwallet");
  if (!foxwallet || typeof foxwallet !== "object") return undefined;
  const wallet = foxwallet as Record<string, unknown>;
  const walletRequest = safeGetProperty(wallet, "request");
  const walletTronWeb = safeGetProperty(wallet, "tronWeb") as InjectedTronProvider["tronWeb"] | undefined;
  return mergeFoxWalletProvider(safeGetProperty(wallet, "tronLink")) ?? mergeFoxWalletProvider(safeGetProperty(wallet, "tron")) ?? mergeFoxWalletProvider(wallet);

  function mergeFoxWalletProvider(value: unknown): InjectedTronProvider | undefined {
    if (!value || typeof value !== "object") return undefined;
    const source = value as Record<string, unknown>;
    const sourceRequest = safeGetProperty(source, "request");
    const sourceTronWeb = safeGetProperty(source, "tronWeb") as InjectedTronProvider["tronWeb"] | undefined;
    const provider: InjectedTronProvider = {};
    if (typeof sourceRequest === "function") {
      provider.request = sourceRequest.bind(source) as (args: { method: string; params?: unknown }) => Promise<unknown>;
    } else if (typeof walletRequest === "function") {
      provider.request = walletRequest.bind(wallet) as (args: { method: string; params?: unknown }) => Promise<unknown>;
    }
    if (typeof sourceTronWeb === "object" && sourceTronWeb !== null) {
      provider.tronWeb = sourceTronWeb;
    } else if (typeof walletTronWeb === "object" && walletTronWeb !== null) {
      provider.tronWeb = walletTronWeb;
    }
    return provider.request || provider.tronWeb ? provider : undefined;
  }
}

export function getGateInjectedProvider(): InjectedTronProvider | undefined {
  const gatewallet = safeGetProperty(globalThis as unknown as Record<string, unknown>, "gatewallet");
  if (!gatewallet || typeof gatewallet !== "object") return undefined;
  const wallet = gatewallet as Record<string, unknown>;
  const walletRequest = safeGetProperty(wallet, "request");
  const walletTronWeb = safeGetProperty(wallet, "tronWeb") as InjectedTronProvider["tronWeb"] | undefined;
  const tronLink = safeGetProperty(wallet, "tronLink");
  const provider = mergeGateProvider(safeGetProperty(wallet, "tron")) ?? mergeGateProvider(tronLink) ?? mergeGateProvider(wallet);
  if (provider) return provider;
  if (tronLink && typeof tronLink === "object" && walletTronWeb) return { tronWeb: walletTronWeb };
  return undefined;

  function mergeGateProvider(value: unknown): InjectedTronProvider | undefined {
    if (!isInjectedTronProvider(value)) return undefined;
    const provider = cloneInjectedProvider(value);
    if (!provider.request && typeof walletRequest === "function") {
      provider.request = walletRequest.bind(wallet) as (args: { method: string; params?: unknown }) => Promise<unknown>;
    }
    if (!provider.tronWeb && walletTronWeb) provider.tronWeb = walletTronWeb;
    return provider;
  }
}

export async function hasGateInjectedMarker(): Promise<boolean> {
  if (hasGateGlobalMarker()) return true;
  if (hasGateEthereumMarker()) return true;
  return waitForGateEip6963Marker();
}

export function getInjectedTronProvider(paths: readonly string[]): InjectedTronProvider | undefined {
  for (const path of paths) {
    const provider = getPathValue(globalThis as unknown as Record<string, unknown>, path);
    if (isInjectedTronProvider(provider)) return provider;
  }
  return undefined;
}

export async function requestInjectedAddress(
  provider: InjectedTronProvider,
  methods: readonly string[] = ["tron_requestAccounts", "eth_requestAccounts"]
): Promise<string | undefined> {
  for (const method of methods) {
    try {
      const result = await provider.request?.({ method });
      const address = extractInjectedAddress(result);
      if (address) return address;
    } catch (error) {
      if (isUserRejected(error)) throw new WalletKitError("USER_REJECTED", "User rejected the wallet request.", error);
    }
  }
  return provider.tronWeb?.defaultAddress?.base58;
}

export async function requestOptionalString(provider: InjectedTronProvider, method: string, params: unknown): Promise<string | undefined> {
  const result = await provider.request?.({ method, params });
  return typeof result === "string" ? result : undefined;
}

export async function resolveInjectedNetwork(provider: InjectedTronProvider, fallback?: WalletNetwork): Promise<WalletNetwork> {
  const block = await provider.tronWeb?.trx?.getBlockByNumber?.(0);
  const chainId = block?.blockID ? `0x${block.blockID.slice(-8)}` : undefined;
  if (chainId === "0x2b6653dc") return { ...TRON_MAINNET };
  if (chainId === "0x94a9059e") return { ...TRON_SHASTA };
  if (chainId === "0xcd8690dc") return { ...TRON_NILE };
  return fallback ?? TRON_NILE;
}

export function isUserRejected(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = "code" in error ? (error as { code?: unknown }).code : undefined;
  const message = "message" in error ? String((error as { message?: unknown }).message) : "";
  return code === 4001 || /reject|denied|cancel/i.test(message);
}

function getPathValue(source: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (typeof current !== "object" || current === null) return undefined;
    return safeGetProperty(current as Record<string, unknown>, part);
  }, source);
}

function isInjectedTronProvider(value: unknown): value is InjectedTronProvider {
  if (typeof value !== "object" || value === null) return false;
  const provider = value as unknown as Record<string, unknown>;
  return typeof safeGetProperty(provider, "request") === "function" || typeof safeGetProperty(provider, "tronWeb") === "object";
}

function cloneInjectedProvider(value: unknown): InjectedTronProvider {
  const source = value as unknown as Record<string, unknown>;
  const request = safeGetProperty(source, "request");
  const tronWeb = safeGetProperty(source, "tronWeb");
  const provider: InjectedTronProvider = {};
  if (typeof request === "function") {
    provider.request = request.bind(source) as (args: { method: string; params?: unknown }) => Promise<unknown>;
  }
  if (typeof tronWeb === "object" && tronWeb !== null) {
    provider.tronWeb = tronWeb as NonNullable<InjectedTronProvider["tronWeb"]>;
  }
  return provider;
}

function safeGetProperty(source: Record<string, unknown>, key: string): unknown {
  try {
    return source[key];
  } catch {
    return undefined;
  }
}

function hasGateGlobalMarker(): boolean {
  const globals = globalThis as unknown as Record<string, unknown>;
  for (const key of ["gatewallet", "gateWallet", "GateWallet"]) {
    const marker = safeGetProperty(globals, key);
    if (isGateWalletLike(marker)) return true;
  }
  return false;
}

function isGateWalletLike(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const wallet = value as Record<string, unknown>;
  return Boolean(
    safeGetProperty(wallet, "tronLink") ||
      safeGetProperty(wallet, "tron") ||
      safeGetProperty(wallet, "tronWeb") ||
      safeGetProperty(wallet, "request")
  );
}

function hasGateEthereumMarker(): boolean {
  const ethereum = safeGetProperty(globalThis as unknown as Record<string, unknown>, "ethereum");
  return [ethereum, ...getEthereumProviders(ethereum)].some(isGateEthereumProvider);
}

function getEthereumProviders(ethereum: unknown): unknown[] {
  if (!ethereum || typeof ethereum !== "object") return [];
  const providers = safeGetProperty(ethereum as Record<string, unknown>, "providers");
  return Array.isArray(providers) ? providers : [];
}

function isGateEthereumProvider(provider: unknown): boolean {
  if (!provider || typeof provider !== "object") return false;
  const record = provider as Record<string, unknown>;
  if (safeGetProperty(record, "isGateWallet") || safeGetProperty(record, "isGate")) return true;
  const info = safeGetProperty(record, "info");
  if (isGateProviderInfo(info)) return true;
  const providerInfo = safeGetProperty(record, "providerInfo");
  return isGateProviderInfo(providerInfo);
}

function isGateProviderInfo(info: unknown): boolean {
  if (!info || typeof info !== "object") return false;
  const record = info as Record<string, unknown>;
  const name = String(safeGetProperty(record, "name") ?? "");
  const rdns = String(safeGetProperty(record, "rdns") ?? "");
  return /gate/i.test(name) || /gate/i.test(rdns);
}

function waitForGateEip6963Marker(timeoutMs = 250): Promise<boolean> {
  const target = globalThis as unknown as {
    addEventListener?: (type: string, listener: EventListener) => void;
    removeEventListener?: (type: string, listener: EventListener) => void;
    dispatchEvent?: (event: Event) => boolean;
    CustomEvent?: typeof CustomEvent;
  };
  if (!target.addEventListener || !target.removeEventListener || !target.dispatchEvent || typeof Event !== "function") {
    return Promise.resolve(false);
  }
  const addEventListener = target.addEventListener.bind(globalThis) as (type: string, listener: EventListener) => void;
  const removeEventListener = target.removeEventListener.bind(globalThis) as (type: string, listener: EventListener) => void;
  const dispatchEvent = target.dispatchEvent.bind(globalThis) as (event: Event) => boolean;
  return new Promise((resolve) => {
    let settled = false;
    const cleanup = () => {
      removeEventListener("eip6963:announceProvider", listener);
      clearTimeout(timer);
    };
    const done = (value: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };
    const listener: EventListener = (event) => {
      const detail = "detail" in event ? (event as CustomEvent<{ info?: unknown; provider?: unknown }>).detail : undefined;
      if (isGateProviderInfo(detail?.info) || isGateEthereumProvider(detail?.provider)) done(true);
    };
    const timer = setTimeout(() => done(false), timeoutMs);
    addEventListener("eip6963:announceProvider", listener);
    dispatchEvent(new Event("eip6963:requestProvider"));
  });
}

function createSafePalTronWeb(tronWeb: unknown, hook: Record<string, unknown>): NonNullable<InjectedTronProvider["tronWeb"]> {
  const source = tronWeb as Record<string, unknown>;
  const defaultAddress = safeGetProperty(source, "defaultAddress") ?? safeGetProperty(hook, "defaultAddress");
  const trx = safeGetProperty(source, "trx");
  const normalized: NonNullable<InjectedTronProvider["tronWeb"]> = {};
  if (typeof defaultAddress === "object" && defaultAddress !== null) {
    normalized.defaultAddress = defaultAddress as NonNullable<NonNullable<InjectedTronProvider["tronWeb"]>["defaultAddress"]>;
  }
  if (typeof trx === "object" && trx !== null) {
    normalized.trx = trx as NonNullable<NonNullable<InjectedTronProvider["tronWeb"]>["trx"]>;
  }
  return normalized;
}

function getDefaultBase58Address(defaultAddress: unknown): string | undefined {
  if (typeof defaultAddress !== "object" || defaultAddress === null) return undefined;
  const base58 = safeGetProperty(defaultAddress as Record<string, unknown>, "base58");
  return typeof base58 === "string" ? base58 : undefined;
}

function extractInjectedAddress(result: unknown): string | undefined {
  if (Array.isArray(result) && typeof result[0] === "string") return result[0];
  if (typeof result === "string") return result;
  if (typeof result !== "object" || result === null) return undefined;
  const response = result as { address?: unknown; code?: unknown };
  if (typeof response.address === "string") return response.address;
  return undefined;
}
