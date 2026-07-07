import { TRON_MAINNET, TRON_NILE, TRON_SHASTA, WalletKitError, type WalletNetwork } from "@tron-wallet-kit/core";
import type { InjectedTronProvider } from "../types";

export function hasMetaMaskEthereumProvider(): boolean {
  const ethereum = (globalThis as typeof globalThis & { ethereum?: { isMetaMask?: boolean; overrideIsMetaMask?: boolean; providers?: Array<{ isMetaMask?: boolean }> } }).ethereum;
  if (!ethereum) return false;
  if (ethereum.isMetaMask && !ethereum.overrideIsMetaMask) return true;
  return Boolean(ethereum.providers?.some((provider) => provider.isMetaMask));
}

export function getGuardaInjectedProvider(): InjectedTronProvider | undefined {
  const guarda = (globalThis as typeof globalThis & { guarda?: unknown }).guarda;
  if (!guarda || typeof guarda !== "object") return undefined;
  const wallet = guarda as { tron?: unknown; tronWeb?: InjectedTronProvider["tronWeb"]; request?: InjectedTronProvider["request"] };
  if (wallet.tron && typeof wallet.tron === "object") {
    const tron = wallet.tron as InjectedTronProvider;
    const provider: InjectedTronProvider = { ...tron };
    if (!provider.tronWeb && wallet.tronWeb) provider.tronWeb = wallet.tronWeb;
    return provider;
  }
  if (typeof wallet.request === "function" || wallet.tronWeb) return wallet as InjectedTronProvider;
  return undefined;
}

export function getBitgetInjectedProvider(): InjectedTronProvider | undefined {
  const globals = globalThis as typeof globalThis & {
    bitkeep?: unknown;
    tronLink?: unknown;
    tronWeb?: InjectedTronProvider["tronWeb"];
    isBitKeep?: boolean;
  };
  const bitkeep = globals.bitkeep;
  if (bitkeep && typeof bitkeep === "object") {
    const wallet = bitkeep as {
      tron?: unknown;
      tronLink?: unknown;
      tronWeb?: InjectedTronProvider["tronWeb"];
      request?: InjectedTronProvider["request"];
    };
    const provider = mergeParentTronWeb(wallet.tronLink) ?? mergeParentTronWeb(wallet.tron) ?? mergeParentTronWeb(wallet);
    if (provider) return provider;

    function mergeParentTronWeb(value: unknown): InjectedTronProvider | undefined {
      if (!isInjectedTronProvider(value)) return undefined;
      const provider: InjectedTronProvider = { ...value };
      if (!provider.tronWeb && wallet.tronWeb) provider.tronWeb = wallet.tronWeb;
      return provider;
    }
  }
  if (globals.isBitKeep && isInjectedTronProvider(globals.tronLink)) {
    const provider: InjectedTronProvider = { ...globals.tronLink };
    if (!provider.tronWeb && globals.tronWeb) provider.tronWeb = globals.tronWeb;
    return provider;
  }
  return undefined;
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
    return (current as Record<string, unknown>)[part];
  }, source);
}

function isInjectedTronProvider(value: unknown): value is InjectedTronProvider {
  if (typeof value !== "object" || value === null) return false;
  const provider = value as InjectedTronProvider;
  return typeof provider.request === "function" || typeof provider.tronWeb === "object";
}

function extractInjectedAddress(result: unknown): string | undefined {
  if (Array.isArray(result) && typeof result[0] === "string") return result[0];
  if (typeof result === "string") return result;
  if (typeof result !== "object" || result === null) return undefined;
  const response = result as { address?: unknown; code?: unknown };
  if (typeof response.address === "string") return response.address;
  return undefined;
}
