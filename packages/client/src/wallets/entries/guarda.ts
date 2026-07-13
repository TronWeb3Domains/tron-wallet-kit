import { standardInjected } from "../../adapters/injected-strategy";
import { cloneInjectedProvider, isInjectedTronProvider, safeGetProperty } from "../../injected/detect";
import type { InjectedTronProvider } from "../../types";
import type { WalletDescriptor } from "../types";

function getGuardaInjectedProvider(): InjectedTronProvider | undefined {
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

export const guarda: WalletDescriptor = {
  id: "guarda",
  name: "Guarda",
  integration: "injected",
  homepage: "https://guarda.com/",
  platforms: ["extension"],
  group: "popular",
  injected: standardInjected({ providerPaths: ["guarda.tron", "guarda"], provider: getGuardaInjectedProvider, rdns: ["com.guarda.wallet"] }),
  detect: { providerPaths: ["guarda.tron", "guarda"], provider: getGuardaInjectedProvider }
};
