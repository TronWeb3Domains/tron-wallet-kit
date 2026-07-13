import { TRON_MAINNET, TRON_NILE, TRON_SHASTA, WalletKitError, type WalletNetwork } from "@tron-wallet-kit/core";
import type { InjectedTronProvider } from "../types";

export function hasMetaMaskEthereumProvider(): boolean {
  const ethereum = (globalThis as typeof globalThis & { ethereum?: { isMetaMask?: boolean; overrideIsMetaMask?: boolean; providers?: Array<{ isMetaMask?: boolean }> } }).ethereum;
  if (!ethereum) return false;
  if (ethereum.isMetaMask && !ethereum.overrideIsMetaMask) return true;
  return Boolean(ethereum.providers?.some((provider) => provider.isMetaMask));
}

export function getInjectedTronProvider(paths: readonly string[]): InjectedTronProvider | undefined {
  for (const path of paths) {
    const provider = getPathValue(globalThis as unknown as Record<string, unknown>, path);
    if (isInjectedTronProvider(provider)) return provider;
  }
  return undefined;
}

export function readInjectedAddress(provider?: InjectedTronProvider): string | undefined {
  return extractInjectedAddress(provider?.tronWeb?.defaultAddress) ??
    extractInjectedAddress(provider) ??
    extractInjectedAddress(provider?.tronWeb);
}

export function readInjectedAddressPayload(value: unknown): string | undefined {
  return extractInjectedAddress(value);
}

export function readInjectedAddressFromPaths(paths: readonly string[]): string | undefined {
  for (const path of paths) {
    const value = getPathValue(globalThis as unknown as Record<string, unknown>, path);
    const address = extractInjectedAddress(value) ?? readInjectedAddress(isInjectedTronProvider(value) ? value : undefined);
    if (address) return address;
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
  return readInjectedAddress(provider);
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

export function isInjectedTronProvider(value: unknown): value is InjectedTronProvider {
  if (typeof value !== "object" || value === null) return false;
  const provider = value as unknown as Record<string, unknown>;
  return typeof safeGetProperty(provider, "request") === "function" || typeof safeGetProperty(provider, "tronWeb") === "object";
}

export function cloneInjectedProvider(value: unknown): InjectedTronProvider {
  const source = value as unknown as Record<string, unknown>;
  const request = safeGetProperty(source, "request");
  const on = safeGetProperty(source, "on");
  const off = safeGetProperty(source, "off");
  const removeListener = safeGetProperty(source, "removeListener");
  const tronWeb = safeGetProperty(source, "tronWeb");
  const provider: InjectedTronProvider = {};
  if (typeof request === "function") {
    provider.request = request.bind(source) as (args: { method: string; params?: unknown }) => Promise<unknown>;
  }
  if (typeof on === "function") {
    provider.on = on.bind(source) as (event: string, listener: (...args: unknown[]) => void) => void;
  }
  if (typeof off === "function") {
    provider.off = off.bind(source) as (event: string, listener: (...args: unknown[]) => void) => void;
  }
  if (typeof removeListener === "function") {
    provider.removeListener = removeListener.bind(source) as (event: string, listener: (...args: unknown[]) => void) => void;
  }
  if (typeof tronWeb === "object" && tronWeb !== null) {
    provider.tronWeb = tronWeb as NonNullable<InjectedTronProvider["tronWeb"]>;
  }
  return provider;
}

export function safeGetProperty(source: Record<string, unknown>, key: string): unknown {
  try {
    return source[key];
  } catch {
    return undefined;
  }
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

export function getDefaultBase58Address(defaultAddress: unknown): string | undefined {
  if (typeof defaultAddress !== "object" || defaultAddress === null) return undefined;
  const base58 = safeGetProperty(defaultAddress as Record<string, unknown>, "base58");
  return typeof base58 === "string" ? base58 : undefined;
}

export function extractInjectedAddress(result: unknown): string | undefined {
  if (Array.isArray(result) && typeof result[0] === "string") return result[0];
  if (typeof result === "string") return result;
  if (typeof result !== "object" || result === null) return undefined;
  const response = result as {
    accountAddress?: unknown;
    accounts?: unknown;
    address?: unknown;
    base58?: unknown;
    selectedAddress?: unknown;
    defaultAddress?: unknown;
    code?: unknown;
  };
  if (typeof response.accountAddress === "string") return response.accountAddress;
  if (typeof response.address === "string") return response.address;
  if (typeof response.base58 === "string") return response.base58;
  if (typeof response.selectedAddress === "string") return response.selectedAddress;
  const accounts = extractInjectedAddress(response.accounts);
  if (accounts) return accounts;
  const nested = extractInjectedAddress(response.defaultAddress);
  if (nested) return nested;
  return undefined;
}
