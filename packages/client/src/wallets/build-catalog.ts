import type { TronWalletCatalogItem } from "@tron-wallet-kit/ui";
import { getWalletIcon } from "./icons.generated";
import type { WalletDescriptor } from "./types";

export function buildCatalog(wallets: readonly WalletDescriptor[]): TronWalletCatalogItem[] {
  return wallets
    .filter((wallet) => wallet.enabled !== false)
    .map(buildCatalogItem);
}

export function buildCatalogItem(wallet: WalletDescriptor): TronWalletCatalogItem {
  const icon = wallet.icon ?? getWalletIcon(wallet.id);
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
  const providerPaths = resolveProviderPaths(wallet);
  if (providerPaths) item.providerPaths = providerPaths;
  if (wallet.conflictMarkers) item.conflictMarkers = wallet.conflictMarkers;
  if (wallet.integration === "walletconnect") item.badge = { label: "", tone: "qr" };
  return item;
}

function resolveProviderPaths(wallet: WalletDescriptor): readonly string[] | undefined {
  if (wallet.providerPaths) return wallet.providerPaths;
  if (wallet.integration === "injected") return wallet.detect?.providerPaths;
  if (wallet.integration === "tronweb3-bridge") return wallet.injectedFallback?.providerPaths;
  return undefined;
}

function resolveTransport(wallet: WalletDescriptor): NonNullable<TronWalletCatalogItem["transport"]> {
  if (wallet.integration === "walletconnect" && wallet.id === "walletconnect") return "walletconnect";
  if (wallet.platforms.includes("hardware")) return "hardware";
  if (wallet.platforms.includes("extension")) return "extension";
  return "mobile";
}
