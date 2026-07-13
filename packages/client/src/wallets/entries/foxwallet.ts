import { standardInjected } from "../../adapters/injected-strategy";
import { safeGetProperty } from "../../injected/detect";
import type { InjectedTronProvider } from "../../types";
import type { WalletDescriptor } from "../types";

function getFoxWalletInjectedProvider(): InjectedTronProvider | undefined {
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

export const foxwallet: WalletDescriptor = {
  id: "foxwallet",
  name: "FoxWallet",
  integration: "injected",
  homepage: "https://foxwallet.com/",
  platforms: ["mobile"],
  group: "popular",
  mobileDeepLink: { scheme: "foxwallet", urlTemplate: "foxwallet://dapp?url={encodedUrl}" },
  injected: standardInjected({ providerPaths: ["foxwallet.tronLink", "foxwallet.tron"], provider: getFoxWalletInjectedProvider }),
  detect: { providerPaths: ["foxwallet.tronLink", "foxwallet.tron"], provider: getFoxWalletInjectedProvider }
};
