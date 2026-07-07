import { TRON_WALLET_REGISTRY, type TronWalletGroup, type TronWalletTransport } from "@tron-wallet-kit/core";
import { en } from "./locales/en";
import type { ConnectModalLabels, WalletListConfig, WalletOptionViewModel } from "./types";
import { walletIcons } from "./wallets/icons.generated";

type WalletPlatform = "extension" | "mobile";

export type TronWalletCatalogItem = {
  id: string;
  name: string;
  enabled: boolean;
  group: TronWalletGroup;
  transport: TronWalletTransport;
  platforms: readonly WalletPlatform[];
  homepage?: string;
  downloadUrl?: string;
  icon?: string;
  adapterId?: string;
  providerPaths?: readonly string[];
  conflictMarkers?: readonly string[];
  mobileDeepLink?: {
    scheme: string;
    urlTemplate?: string;
  };
  supportsWalletConnect?: boolean;
  badge?: WalletOptionViewModel["badge"];
};

const catalogBadgeTones: Record<string, NonNullable<WalletOptionViewModel["badge"]>["tone"]> = {
  tronlink: "installed",
  tokenpocket: "qr",
  trust: "qr",
  binance: "qr",
  walletconnect: "qr"
};

export const TRON_WALLET_CATALOG: readonly TronWalletCatalogItem[] = TRON_WALLET_REGISTRY.filter((wallet) => wallet.enabled).map((wallet) => {
  const tone = catalogBadgeTones[wallet.id];
  return {
    ...wallet,
    ...(tone ? { badge: { label: "", tone } } : {})
  };
});

const featuredOrder = ["tronlink", "tokenpocket", "okx", "bitget", "walletconnect"];
const FEATURED_DEFAULT_LIMIT = 5;
const FEATURED_MAX_LIMIT = 10;

export function getTronWalletCatalogIcon(walletId: string): string | undefined {
  const item = TRON_WALLET_CATALOG.find((wallet) => wallet.id === walletId);
  return item?.icon ?? walletIcons[walletId];
}

export function mergeWalletOptionsWithCatalog(wallets: readonly WalletOptionViewModel[], labels: ConnectModalLabels = en.connectModal): WalletOptionViewModel[] {
  const adapterIds = new Set(wallets.map((wallet) => wallet.adapterId ?? wallet.id));
  const byId = new Map(wallets.map((wallet) => [wallet.id, wallet]));
  const merged: WalletOptionViewModel[] = [];

  for (const item of TRON_WALLET_CATALOG) {
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
    const transport = hasNativeAdapter ? item.transport : canUseWalletConnect ? "qr" : item.transport;
    const option: WalletOptionViewModel = {
      id: item.id,
      adapterId,
      name: item.name,
      group: item.group,
      transport,
      platforms: item.platforms,
      ...(item.providerPaths ? { providerPaths: item.providerPaths } : {}),
      ...(item.conflictMarkers ? { conflictMarkers: item.conflictMarkers } : {}),
      ...(item.mobileDeepLink ? { mobileDeepLink: item.mobileDeepLink } : {}),
      ...(item.supportsWalletConnect ? { supportsWalletConnect: item.supportsWalletConnect } : {}),
      available: hasNativeAdapter || canUseWalletConnect,
      readyState: hasNativeAdapter || canUseWalletConnect ? "found" : "notFound",
      capabilities: transport === "qr" || transport === "walletconnect" ? ["qr"] : [],
      badge: createCatalogBadge({ ...item, transport }, hasNativeAdapter || canUseWalletConnect, labels)
    };
    const icon = getTronWalletCatalogIcon(item.id);
    if (icon) option.icon = icon;
    if (item.homepage) option.homepage = item.homepage;
    if (item.downloadUrl) option.downloadUrl = item.downloadUrl;
    merged.push(option);
  }

  return [...merged, ...byId.values()];
}

export function getFeaturedWalletOptions(wallets: readonly WalletOptionViewModel[], config: Pick<WalletListConfig, "featuredLimit" | "featuredWallets"> | number = FEATURED_DEFAULT_LIMIT): WalletOptionViewModel[] {
  const limit = clampFeaturedLimit(typeof config === "number" ? config : config.featuredLimit);
  const orderedIds = typeof config === "number" || !config.featuredWallets?.length ? featuredOrder : config.featuredWallets.slice(0, FEATURED_MAX_LIMIT);
  const byId = new Map(wallets.map((wallet) => [wallet.id, wallet]));
  const featured = orderedIds.flatMap((id) => {
    const wallet = byId.get(id);
    return wallet ? [wallet] : [];
  });
  const walletConnect = featured.find((wallet) => wallet.id === "walletconnect");
  const withoutWalletConnect = featured.filter((wallet) => wallet.id !== "walletconnect");
  return [...withoutWalletConnect.slice(0, Math.max(0, limit - (walletConnect ? 1 : 0))), ...(walletConnect ? [walletConnect] : [])];
}

export function filterWalletOptions(wallets: readonly WalletOptionViewModel[], query = ""): WalletOptionViewModel[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...wallets];
  return wallets.filter((wallet) => `${wallet.name} ${wallet.id}`.toLowerCase().includes(normalized));
}

export function applyWalletListConfig(wallets: readonly WalletOptionViewModel[], config: WalletListConfig = {}): WalletOptionViewModel[] {
  const allowed = config.wallets === "all" || !config.wallets ? undefined : new Set(config.wallets);
  const disabled = new Set(config.disabledWallets ?? []);
  const filtered = wallets.filter((wallet) => {
    if (allowed && !allowed.has(wallet.id)) return false;
    if (disabled.has(wallet.id)) return false;
    if (config.showUnavailable === false && isUnavailableWallet(wallet)) return false;
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
  if (wallet.capabilities?.includes("qr") || wallet.transport === "qr" || wallet.transport === "walletconnect" || wallet.id === "walletconnect") return 1;
  if (wallet.readyState === "loading") return 2;
  if (wallet.readyState === "notFound" || wallet.readyState === "unsupported" || wallet.available === false) return 3;
  return 2;
}

function isUnavailableWallet(wallet: WalletOptionViewModel): boolean {
  return wallet.readyState === "notFound" || wallet.readyState === "unsupported" || wallet.available === false;
}

function clampFeaturedLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) return FEATURED_DEFAULT_LIMIT;
  return Math.max(1, Math.min(FEATURED_MAX_LIMIT, Math.trunc(value ?? FEATURED_DEFAULT_LIMIT)));
}

function enrichWalletOption(wallet: WalletOptionViewModel, item: TronWalletCatalogItem, adapterIds: ReadonlySet<string>, labels: ConnectModalLabels): WalletOptionViewModel {
  const canUseWalletConnect = item.supportsWalletConnect === true && item.id !== "walletconnect" && adapterIds.has("walletconnect");
  const useQrFallback = canUseWalletConnect && (wallet.readyState === "notFound" || wallet.readyState === "unsupported");
  const transport = useQrFallback ? "qr" : wallet.transport ?? item.transport;
  const option: WalletOptionViewModel = {
    ...wallet,
    adapterId: useQrFallback ? "walletconnect" : wallet.adapterId ?? item.adapterId ?? item.id,
    group: wallet.group ?? item.group,
    transport,
    platforms: wallet.platforms ?? item.platforms,
    ...(useQrFallback
      ? {
          available: true,
          readyState: "found" as const,
          capabilities: [...new Set([...(wallet.capabilities ?? []), "qr"])]
        }
      : {})
  };
  const icon = wallet.icon ?? getTronWalletCatalogIcon(item.id);
  const homepage = wallet.homepage ?? item.homepage;
  const downloadUrl = wallet.downloadUrl ?? item.downloadUrl;
  const providerPaths = wallet.providerPaths ?? item.providerPaths;
  const conflictMarkers = wallet.conflictMarkers ?? item.conflictMarkers;
  const mobileDeepLink = wallet.mobileDeepLink ?? item.mobileDeepLink;
  const supportsWalletConnect = wallet.supportsWalletConnect ?? item.supportsWalletConnect;
  const badgeTransport: TronWalletTransport = useQrFallback ? "qr" : item.transport;
  const badge = useQrFallback ? { label: labels.qrCode.toUpperCase(), tone: "qr" as const } : wallet.badge ?? createCatalogBadge({ ...item, transport: badgeTransport }, wallet.available === true || wallet.readyState === "found", labels);
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

function createCatalogBadge(item: TronWalletCatalogItem, available: boolean, labels: ConnectModalLabels): NonNullable<WalletOptionViewModel["badge"]> {
  const tone = item.badge?.tone;
  if (tone === "qr" || item.transport === "qr" || item.transport === "walletconnect") return { label: labels.qrCode.toUpperCase(), tone: "qr" };
  if (tone === "installed" || available) return { label: labels.installed.toUpperCase(), tone: "installed" };
  return { label: labels.tron.toUpperCase(), tone: "tron" };
}
