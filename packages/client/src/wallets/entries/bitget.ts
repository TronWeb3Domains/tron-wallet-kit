import { standardInjected, withAddressPoll, withPreferInjectedAddress, withRequestMethods } from "../../adapters/injected-strategy";
import { cloneInjectedProvider, isInjectedTronProvider, safeGetProperty } from "../../injected/detect";
import type { InjectedTronProvider } from "../../types";
import type { WalletDescriptor } from "../types";

function getBitgetInjectedProvider(): InjectedTronProvider | undefined {
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

function hasBitgetInjectedMarker(): boolean {
  const globals = globalThis as unknown as Record<string, unknown>;
  return Boolean(
    safeGetProperty(globals, "bitkeep") ||
      safeGetProperty(globals, "bitget") ||
      safeGetProperty(globals, "bitgetWallet") ||
      safeGetProperty(globals, "BitgetWallet") ||
      safeGetProperty(globals, "isBitKeep")
  );
}

export const bitget: WalletDescriptor = {
  id: "bitget",
  name: "Bitget Wallet",
  integration: "injected",
  homepage: "https://web3.bitget.com/",
  platforms: ["extension", "mobile"],
  group: "popular",
  featured: 4,
  injected: withPreferInjectedAddress(withAddressPoll(withRequestMethods(standardInjected({
    providerPaths: ["bitkeep.tronLink", "bitkeep.tron"],
    provider: getBitgetInjectedProvider,
    rdns: ["com.bitget.web3"],
    marker: hasBitgetInjectedMarker
  }), ["tron_requestAccounts", "eth_requestAccounts"]), {
    settleMs: 2500,
    retryDelayMs: 350,
    retryTimeoutMs: 3000
  })),
  detect: {
    providerPaths: ["bitkeep.tronLink", "bitkeep.tron"],
    provider: getBitgetInjectedProvider,
    availabilityProbe: hasBitgetInjectedMarker
  }
};
