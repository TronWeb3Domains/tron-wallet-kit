import { en } from "./locales/en";
import { createQrWalletBadge, resolveCatalogBadge } from "./wallet-badges";
import { inferWalletPlatforms, isHardwareWallet, isMobileCapableWallet, isQrFallbackWallet, isQrWallet, isWalletConnectWallet } from "./wallet-kinds";
import type { ConnectModalLabels, TronWalletCatalogItem, WalletEnvironment, WalletListConfig, WalletOptionViewModel } from "./types";

/**
 * @deprecated UI is catalog-agnostic. `@tron-wallet-kit/client` builds and
 * injects the runtime catalog from wallet descriptors.
 */
export const TRON_WALLET_CATALOG: readonly TronWalletCatalogItem[] = [];

const featuredOrder = ["tronlink", "tokenpocket", "okx", "bitget", "walletconnect"];

export function mergeWalletOptionsWithCatalog(
  wallets: readonly WalletOptionViewModel[],
  labels: ConnectModalLabels = en.connectModal,
  catalog: readonly TronWalletCatalogItem[] = TRON_WALLET_CATALOG
): WalletOptionViewModel[] {
  const adapterIds = new Set(wallets.map((wallet) => wallet.adapterId ?? wallet.id));
  const byId = new Map(wallets.map((wallet) => [wallet.id, wallet]));
  const merged: WalletOptionViewModel[] = [];

  for (const item of catalog.filter((wallet) => wallet.enabled !== false)) {
    const group = item.group ?? "popular";
    const itemTransport = item.transport ?? (item.platforms.includes("extension") ? "extension" : "mobile");
    const current = byId.get(item.id);
    if (current) {
      merged.push(enrichWalletOption(current, item, adapterIds, labels));
      byId.delete(item.id);
      continue;
    }

    const nativeAdapterId = item.adapterId ?? item.id;
    const hasNativeAdapter = adapterIds.has(nativeAdapterId);
    const canUseWalletConnect = item.supportsWalletConnect === true && item.id !== "walletconnect" && adapterIds.has("walletconnect");
    const adapterId = hasNativeAdapter ? nativeAdapterId : canUseWalletConnect ? "walletconnect" : nativeAdapterId;
    const transport = hasNativeAdapter ? itemTransport : canUseWalletConnect ? "qr" : itemTransport;
    const option: WalletOptionViewModel = {
      id: item.id,
      adapterId,
      name: item.name,
      group,
      transport,
      platforms: item.platforms,
      ...(item.featured !== undefined ? { featured: item.featured } : {}),
      ...(item.providerPaths ? { providerPaths: item.providerPaths } : {}),
      ...(item.conflictMarkers ? { conflictMarkers: item.conflictMarkers } : {}),
      ...(item.mobileDeepLink ? { mobileDeepLink: item.mobileDeepLink } : {}),
      ...(item.supportsWalletConnect ? { supportsWalletConnect: item.supportsWalletConnect } : {}),
      available: hasNativeAdapter || canUseWalletConnect,
      readyState: hasNativeAdapter || canUseWalletConnect ? "found" : "notFound",
      capabilities: transport === "qr" || transport === "walletconnect" ? ["qr"] : [],
      badge: resolveCatalogBadge({ ...item, group, transport }, hasNativeAdapter || canUseWalletConnect, labels)
    };
    if (item.icon) option.icon = item.icon;
    if (item.homepage) option.homepage = item.homepage;
    if (item.downloadUrl) option.downloadUrl = item.downloadUrl;
    merged.push(option);
  }

  return [...merged, ...byId.values()];
}

export function getFeaturedWalletOptions(wallets: readonly WalletOptionViewModel[], config: Pick<WalletListConfig, "featuredMode" | "featuredWallets"> | number = {}, environment?: WalletEnvironment): WalletOptionViewModel[] {
  const normalizedConfig = typeof config === "number" ? {} : config;
  const mode = normalizedConfig.featuredMode ?? (normalizedConfig.featuredWallets?.length ? "manual" : "installed-first");
  const byId = new Map(wallets.map((wallet) => [wallet.id, wallet]));
  const ranked = [...wallets].filter((wallet) => getWalletRank(wallet) < Number.POSITIVE_INFINITY).sort(compareWalletRank);
  const rankedIds = ranked.length > 0 ? ranked.map((wallet) => wallet.id) : featuredOrder;
  const manualIds = normalizedConfig.featuredWallets?.length ? normalizedConfig.featuredWallets : rankedIds;

  if (mode === "manual") {
    return uniqueWalletsById(manualIds.flatMap((id) => byId.get(id) ? [byId.get(id) as WalletOptionViewModel] : []));
  }

  if (environment?.kind === "mobile-browser") {
    const walletConnect = byId.get("walletconnect");
    if (mode === "installed-only") return walletConnect ? [walletConnect] : [];
    const mobileRanked = wallets.filter((wallet) => wallet.id !== "walletconnect" && isMobileCapableWallet(wallet)).sort(compareWalletRank);
    return walletConnect ? uniqueWalletsById([walletConnect, ...mobileRanked]) : mobileRanked;
  }

  const installed = wallets.filter(isInstalledWallet).sort(compareWalletRank);
  if (mode === "installed-only") {
    return installed.length > 0 ? installed : getWalletConnectFallback(byId);
  }

  const installedIds = new Set(installed.map((wallet) => wallet.id));
  const walletConnect = byId.get("walletconnect");
  const targetCount = Math.max(installed.length + (walletConnect ? 1 : 0), rankedIds.length);
  const qrFallbacks = wallets
    .filter((wallet) => !installedIds.has(wallet.id) && isQrFeaturedFallbackWallet(wallet))
    .sort(compareWalletRank);
  const hardware = wallets
    .filter((wallet) => !installedIds.has(wallet.id) && isHardwareWallet(wallet))
    .sort(compareWalletRank);
  const loading = wallets
    .filter((wallet) => !installedIds.has(wallet.id) && !isWalletConnectWallet(wallet) && !isQrFeaturedFallbackWallet(wallet) && !isHardwareWallet(wallet) && wallet.readyState === "loading")
    .sort(compareWalletRank);
  const featured = uniqueWalletsById([
    ...installed,
    ...(walletConnect ? [walletConnect] : []),
    ...qrFallbacks,
    ...hardware,
    ...loading
  ]).slice(0, targetCount);
  if (installed.length === 0) {
    return walletConnect ? uniqueWalletsById([walletConnect, ...featured]) : featured;
  }
  return featured;
}

export function filterWalletOptions(wallets: readonly WalletOptionViewModel[], query = ""): WalletOptionViewModel[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...wallets];
  return wallets.filter((wallet) => `${wallet.name} ${wallet.id}`.toLowerCase().includes(normalized));
}

export function applyWalletListConfig(wallets: readonly WalletOptionViewModel[], config: WalletListConfig = {}, environment?: WalletEnvironment): WalletOptionViewModel[] {
  const allowed = config.wallets === "all" || !config.wallets ? undefined : new Set(config.wallets);
  const disabled = new Set(config.disabledWallets ?? []);
  const filtered = wallets.filter((wallet) => {
    if (allowed && !allowed.has(wallet.id)) return false;
    if (disabled.has(wallet.id)) return false;
    if (!isWalletVisibleInEnvironment(wallet, environment)) return false;
    if (config.showUnavailable === false && isUnavailableWallet(wallet) && !shouldKeepUnavailableForEnvironment(wallet, environment)) return false;
    return true;
  });
  if (config.sortAvailableFirst === false) return filtered;
  return sortWalletsByAvailability(filtered);
}

export function sortWalletsByAvailability(wallets: readonly WalletOptionViewModel[]): WalletOptionViewModel[] {
  return [...wallets].sort((a, b) => walletAvailabilityRank(a) - walletAvailabilityRank(b));
}

function walletAvailabilityRank(wallet: WalletOptionViewModel): number {
  if (wallet.readyState === "found" || wallet.available === true) return 0;
  if (isQrWallet(wallet) || isHardwareWallet(wallet)) return 1;
  if (wallet.readyState === "loading") return 2;
  if (wallet.readyState === "notFound" || wallet.readyState === "unsupported" || wallet.available === false) return 3;
  return 2;
}

function isUnavailableWallet(wallet: WalletOptionViewModel): boolean {
  if (isHardwareWallet(wallet)) return false;
  return wallet.readyState === "notFound" || wallet.readyState === "unsupported" || wallet.available === false;
}

function isWalletVisibleInEnvironment(wallet: WalletOptionViewModel, environment?: WalletEnvironment): boolean {
  if (!environment) return true;
  if (isQrWallet(wallet)) return true;
  const platforms = wallet.platforms ?? inferWalletPlatforms(wallet);
  if (environment.kind === "desktop-extension") return platforms.includes("extension") || platforms.includes("hardware");
  return platforms.includes("mobile");
}

function shouldKeepUnavailableForEnvironment(wallet: WalletOptionViewModel, environment?: WalletEnvironment): boolean {
  if (environment?.kind !== "mobile-browser") return false;
  return isMobileCapableWallet(wallet);
}

function enrichWalletOption(wallet: WalletOptionViewModel, item: TronWalletCatalogItem, adapterIds: ReadonlySet<string>, labels: ConnectModalLabels): WalletOptionViewModel {
  const canUseWalletConnect = item.supportsWalletConnect === true && item.id !== "walletconnect" && adapterIds.has("walletconnect");
  const useQrFallback = canUseWalletConnect && (wallet.readyState === "notFound" || wallet.readyState === "unsupported");
  const itemTransport = item.transport ?? (item.platforms.includes("extension") ? "extension" : "mobile");
  const group = wallet.group ?? item.group ?? "popular";
  const transport = useQrFallback ? "qr" : wallet.transport ?? itemTransport;
  const option: WalletOptionViewModel = {
    ...wallet,
    adapterId: useQrFallback ? "walletconnect" : wallet.adapterId ?? item.adapterId ?? item.id,
    group,
    transport,
    platforms: wallet.platforms ?? item.platforms,
    ...(wallet.featured !== undefined || item.featured !== undefined ? { featured: wallet.featured ?? item.featured } : {}),
    ...(useQrFallback
      ? {
          available: true,
          readyState: "found" as const,
          capabilities: [...new Set([...(wallet.capabilities ?? []), "qr"])]
        }
      : {})
  };
  const icon = wallet.icon ?? item.icon;
  const homepage = wallet.homepage ?? item.homepage;
  const downloadUrl = wallet.downloadUrl ?? item.downloadUrl;
  const providerPaths = wallet.providerPaths ?? item.providerPaths;
  const conflictMarkers = wallet.conflictMarkers ?? item.conflictMarkers;
  const mobileDeepLink = wallet.mobileDeepLink ?? item.mobileDeepLink;
  const supportsWalletConnect = wallet.supportsWalletConnect ?? item.supportsWalletConnect;
  const badgeTransport = useQrFallback ? "qr" : itemTransport;
  const badge = useQrFallback ? createQrWalletBadge(labels) : wallet.badge ?? resolveCatalogBadge({ ...item, group, transport: badgeTransport }, wallet.available === true || wallet.readyState === "found", labels);
  if (icon) option.icon = icon;
  if (homepage) option.homepage = homepage;
  if (downloadUrl) option.downloadUrl = downloadUrl;
  if (providerPaths) option.providerPaths = providerPaths;
  if (conflictMarkers) option.conflictMarkers = conflictMarkers;
  if (mobileDeepLink) option.mobileDeepLink = mobileDeepLink;
  if (supportsWalletConnect !== undefined) option.supportsWalletConnect = supportsWalletConnect;
  if (badge) option.badge = badge;
  return option;
}

function getWalletConnectFallback(byId: ReadonlyMap<string, WalletOptionViewModel>): WalletOptionViewModel[] {
  const walletConnect = byId.get("walletconnect");
  return walletConnect ? [walletConnect] : [];
}

function uniqueWalletsById(wallets: readonly WalletOptionViewModel[]): WalletOptionViewModel[] {
  const seen = new Set<string>();
  return wallets.filter((wallet) => {
    if (seen.has(wallet.id)) return false;
    seen.add(wallet.id);
    return true;
  });
}

function compareWalletRank(a: WalletOptionViewModel, b: WalletOptionViewModel): number {
  return getWalletRank(a) - getWalletRank(b) || a.name.localeCompare(b.name);
}

function getWalletRank(wallet: WalletOptionViewModel): number {
  if (typeof wallet.featured === "number") return wallet.featured;
  const order = featuredOrder.indexOf(wallet.id);
  return order === -1 ? Number.POSITIVE_INFINITY : order + 1000;
}

function isInstalledWallet(wallet: WalletOptionViewModel): boolean {
  if (isWalletConnectWallet(wallet) || isQrFallbackWallet(wallet)) return false;
  if (isHardwareWallet(wallet)) return false;
  return wallet.readyState === "found" || wallet.available === true;
}

function isQrFeaturedFallbackWallet(wallet: WalletOptionViewModel): boolean {
  return isQrFallbackWallet(wallet);
}
