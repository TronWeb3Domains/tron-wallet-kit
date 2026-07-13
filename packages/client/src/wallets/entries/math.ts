import type { WalletDescriptor } from "../types";
import { standardInjected } from "../../adapters/injected-strategy";
import { cloneInjectedProvider, isInjectedTronProvider, safeGetProperty } from "../../injected/detect";
import type { InjectedTronProvider } from "../../types";

function getMathWalletInjectedProvider(): InjectedTronProvider | undefined {
  const globals = globalThis as unknown as Record<string, unknown>;
  const namespacedProvider =
    mergeMathWalletProvider(safeGetProperty(globals, "mathwallet"), true) ??
    mergeMathWalletProvider(safeGetProperty(globals, "mathWallet"), true) ??
    mergeMathWalletProvider(safeGetProperty(globals, "MathWallet"), true);
  if (namespacedProvider) return namespacedProvider;

  return mergeMathWalletProvider(safeGetProperty(globals, "tronLink"), false) ??
    mergeMathWalletProvider(safeGetProperty(globals, "tron"), false) ??
    createMathWalletProviderFromTronWeb(safeGetProperty(globals, "tronWeb"), false);
}

function mergeMathWalletProvider(value: unknown, namespaced: boolean): InjectedTronProvider | undefined {
  if (!value || typeof value !== "object") return undefined;
  const wallet = value as Record<string, unknown>;
  if (!namespaced && !hasMathWalletMarker(wallet)) return undefined;

  const walletRequest = safeGetProperty(wallet, "request");
  const walletTronWeb = safeGetProperty(wallet, "tronWeb") as InjectedTronProvider["tronWeb"] | undefined;
  const provider =
    createMathWalletProviderFromBranch(safeGetProperty(wallet, "tron"), wallet, walletTronWeb) ??
    createMathWalletProviderFromBranch(safeGetProperty(wallet, "tronLink"), wallet, walletTronWeb) ??
    createMathWalletProviderFromBranch(wallet, wallet, walletTronWeb) ??
    createMathWalletProviderFromTronWeb(walletTronWeb, true);
  if (!provider) return undefined;

  if (!provider.request && typeof walletRequest === "function") {
    provider.request = walletRequest.bind(wallet) as (args: { method: string; params?: unknown }) => Promise<unknown>;
  }
  return provider;
}

function createMathWalletProviderFromBranch(value: unknown, wallet: Record<string, unknown>, parentTronWeb?: InjectedTronProvider["tronWeb"]): InjectedTronProvider | undefined {
  if (isInjectedTronProvider(value)) {
    const provider = cloneInjectedProvider(value);
    if (!provider.tronWeb && parentTronWeb) provider.tronWeb = parentTronWeb;
    return provider;
  }
  const provider = createMathWalletProviderFromTronWeb(value, value === parentTronWeb || hasMathWalletMarker(wallet));
  if (provider && parentTronWeb && !provider.tronWeb) provider.tronWeb = parentTronWeb;
  return provider;
}

function createMathWalletProviderFromTronWeb(value: unknown, allowNamespace: boolean): InjectedTronProvider | undefined {
  if (!value || typeof value !== "object") return undefined;
  const tronWeb = value as InjectedTronProvider["tronWeb"] & Record<string, unknown>;
  if (!allowNamespace && !hasMathWalletMarker(tronWeb)) return undefined;
  if (typeof tronWeb.trx !== "object" || tronWeb.trx === null) return undefined;
  return { tronWeb };
}

function hasMathWalletMarker(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const source = value as Record<string, unknown>;
  const markerKeys = ["isMathWallet", "isMath", "isMathWalletProvider", "_isMathWallet"];
  if (markerKeys.some((key) => safeGetProperty(source, key) === true)) return true;
  const name = safeGetProperty(source, "name") ?? safeGetProperty(source, "walletName") ?? safeGetProperty(source, "providerName");
  return typeof name === "string" && /math\s*wallet|mathwallet/i.test(name);
}

export const math: WalletDescriptor = {
  id: "math",
  name: "MathWallet",
  integration: "injected",
  homepage: "https://mathwallet.org/",
  downloadUrl: "https://mathwallet.org/en-us/",
  platforms: ["extension", "mobile"],
  group: "popular",
  supportsWalletConnect: true,
  injected: standardInjected({ provider: getMathWalletInjectedProvider, requestMethods: ["tron_requestAccounts"] }),
  detect: { provider: getMathWalletInjectedProvider },
  requestMethods: ["tron_requestAccounts"],
  description: "TronWeb-compatible injected wallet with WalletConnect fallback."
};
