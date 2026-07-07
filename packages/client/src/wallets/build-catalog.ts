import { getTronWalletCatalogIcon, type TronWalletCatalogItem } from "@tron-wallet-kit/ui";
import type { WalletDescriptor } from "./types";

export function buildCatalog(wallets: readonly WalletDescriptor[]): TronWalletCatalogItem[] {
  return wallets
    .filter((wallet) => wallet.enabled !== false)
    .map((wallet) => {
      const icon = wallet.icon ?? getTronWalletCatalogIcon(wallet.id);
      const item: TronWalletCatalogItem = {
        id: wallet.id,
        name: wallet.name,
        enabled: wallet.enabled ?? true,
        group: wallet.group ?? "popular",
        transport: resolveTransport(wallet),
        platforms: wallet.platforms,
        homepage: wallet.homepage,
        downloadUrl: wallet.downloadUrl ?? wallet.homepage,
        ...(icon ? { icon } : {}),
        ...(wallet.featured !== undefined ? { featured: wallet.featured } : {}),
        ...(wallet.mobileDeepLink ? { mobileDeepLink: wallet.mobileDeepLink } : {}),
        ...(wallet.supportsWalletConnect ? { supportsWalletConnect: wallet.supportsWalletConnect } : {})
      };
      if (wallet.integration === "injected") {
        if (wallet.detect.providerPaths) item.providerPaths = wallet.detect.providerPaths;
      }
      if (wallet.integration === "tronweb3-bridge") {
        if (wallet.injectedFallback?.providerPaths) item.providerPaths = wallet.injectedFallback.providerPaths;
      }
      if (wallet.integration === "walletconnect") {
        item.badge = { label: "", tone: "qr" };
      }
      return item;
    });
}

function resolveTransport(wallet: WalletDescriptor): NonNullable<TronWalletCatalogItem["transport"]> {
  if (wallet.integration === "walletconnect") return "walletconnect";
  if (wallet.platforms.includes("extension")) return "extension";
  return "mobile";
}
