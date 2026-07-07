import type { WalletOptionViewModel } from "./types";
import { walletIcons } from "./wallets/icons.generated";

type WalletPlatform = "extension" | "mobile";

export type TronWalletCatalogItem = {
  id: string;
  name: string;
  group: "featured" | "popular" | "hardware" | "extension" | "mobile";
  transport: "extension" | "walletconnect" | "qr" | "hardware" | "mobile";
  platforms: readonly WalletPlatform[];
  homepage?: string;
  downloadUrl?: string;
  icon?: string;
  adapterId?: string;
  walletConnectFallback?: boolean;
  badge?: WalletOptionViewModel["badge"];
};

export const TRON_WALLET_CATALOG: readonly TronWalletCatalogItem[] = [
  {
    id: "tronlink",
    name: "TronLink",
    group: "featured",
    transport: "extension",
    platforms: ["extension", "mobile"],
    homepage: "https://www.tronlink.org/",
    badge: { label: "INSTALLED", tone: "installed" }
  },
  {
    id: "metamask",
    name: "MetaMask",
    group: "popular",
    transport: "extension",
    platforms: ["extension"],
    homepage: "https://metamask.io/",
    badge: { label: "TRON", tone: "tron" }
  },
  {
    id: "okx",
    name: "OKX Wallet",
    group: "popular",
    transport: "extension",
    platforms: ["extension", "mobile"],
    homepage: "https://www.okx.com/web3"
  },
  {
    id: "bitget",
    name: "Bitget Wallet",
    group: "popular",
    transport: "extension",
    platforms: ["extension", "mobile"],
    homepage: "https://web3.bitget.com/"
  },
  {
    id: "tokenpocket",
    name: "TokenPocket",
    group: "popular",
    transport: "extension",
    platforms: ["extension", "mobile"],
    homepage: "https://www.tokenpocket.pro/",
    walletConnectFallback: true,
    badge: { label: "QR CODE", tone: "qr" }
  },
  {
    id: "trust",
    name: "Trust Wallet",
    group: "popular",
    transport: "extension",
    platforms: ["extension", "mobile"],
    homepage: "https://trustwallet.com/",
    walletConnectFallback: true,
    badge: { label: "QR CODE", tone: "qr" }
  },
  {
    id: "binance",
    name: "Binance Web3 Wallet",
    group: "popular",
    transport: "extension",
    platforms: ["extension", "mobile"],
    homepage: "https://www.binance.com/en/web3wallet",
    walletConnectFallback: true,
    badge: { label: "QR CODE", tone: "qr" }
  },
  {
    id: "gate",
    name: "Gate Wallet",
    group: "popular",
    transport: "extension",
    platforms: ["extension"],
    homepage: "https://www.gate.io/web3",
    badge: { label: "TRON", tone: "tron" }
  },
  {
    id: "foxwallet",
    name: "FoxWallet",
    group: "popular",
    transport: "mobile",
    platforms: ["mobile"],
    homepage: "https://foxwallet.com/",
    badge: { label: "TRON", tone: "tron" }
  },
  {
    id: "bybit",
    name: "Bybit Wallet",
    group: "popular",
    transport: "extension",
    platforms: ["extension", "mobile"],
    homepage: "https://www.bybit.com/web3",
    badge: { label: "TRON", tone: "tron" }
  },
  {
    id: "imtoken",
    name: "imToken",
    group: "popular",
    transport: "mobile",
    platforms: ["mobile"],
    homepage: "https://token.im/",
    badge: { label: "TRON", tone: "tron" }
  },
  {
    id: "tomo",
    name: "Tomo Wallet",
    group: "popular",
    transport: "mobile",
    platforms: ["mobile"],
    homepage: "https://tomo.inc/",
    badge: { label: "TRON", tone: "tron" }
  },
  {
    id: "guarda",
    name: "Guarda",
    group: "popular",
    transport: "extension",
    platforms: ["extension"],
    homepage: "https://guarda.com/",
    badge: { label: "TRON", tone: "tron" }
  },
  {
    id: "backpack",
    name: "Backpack",
    group: "popular",
    transport: "extension",
    platforms: ["extension"],
    homepage: "https://backpack.app/",
    badge: { label: "TRON", tone: "tron" }
  },
  {
    id: "onekey",
    name: "OneKey",
    group: "popular",
    transport: "extension",
    platforms: ["extension"],
    homepage: "https://onekey.so/",
    badge: { label: "TRON", tone: "tron" }
  },
  {
    id: "ledger",
    name: "Ledger",
    group: "hardware",
    transport: "hardware",
    platforms: ["extension"],
    homepage: "https://www.ledger.com/",
    badge: { label: "TRON", tone: "tron" }
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    group: "featured",
    transport: "walletconnect",
    platforms: ["mobile"],
    homepage: "https://walletconnect.com/",
    badge: { label: "QR CODE", tone: "qr" }
  }
];

const featuredOrder = ["tronlink", "tokenpocket", "okx", "bitget", "walletconnect"];

export function getTronWalletCatalogIcon(walletId: string): string | undefined {
  const item = TRON_WALLET_CATALOG.find((wallet) => wallet.id === walletId);
  return item?.icon ?? walletIcons[walletId];
}

export function mergeWalletOptionsWithCatalog(wallets: readonly WalletOptionViewModel[]): WalletOptionViewModel[] {
  const adapterIds = new Set(wallets.map((wallet) => wallet.adapterId ?? wallet.id));
  const byId = new Map(wallets.map((wallet) => [wallet.id, wallet]));
  const merged: WalletOptionViewModel[] = [];

  for (const item of TRON_WALLET_CATALOG) {
    const current = byId.get(item.id);
    if (current) {
      merged.push(enrichWalletOption(current, item, adapterIds));
      byId.delete(item.id);
      continue;
    }

    const nativeAdapterId = item.adapterId ?? item.id;
    const hasNativeAdapter = adapterIds.has(nativeAdapterId);
    const canUseWalletConnect = item.walletConnectFallback === true && adapterIds.has("walletconnect");
    const adapterId = hasNativeAdapter ? nativeAdapterId : canUseWalletConnect ? "walletconnect" : nativeAdapterId;
    const transport = hasNativeAdapter ? item.transport : canUseWalletConnect ? "qr" : item.transport;
    const option: WalletOptionViewModel = {
      id: item.id,
      adapterId,
      name: item.name,
      group: item.group,
      transport,
      platforms: item.platforms,
      available: hasNativeAdapter || canUseWalletConnect,
      readyState: hasNativeAdapter || canUseWalletConnect ? "found" : "notFound",
      capabilities: transport === "qr" || transport === "walletconnect" ? ["qr"] : [],
      badge: item.badge ?? createCatalogBadge({ ...item, transport }, hasNativeAdapter || canUseWalletConnect)
    };
    const icon = getTronWalletCatalogIcon(item.id);
    if (icon) option.icon = icon;
    if (item.homepage) option.homepage = item.homepage;
    if (item.downloadUrl) option.downloadUrl = item.downloadUrl;
    merged.push(option);
  }

  return [...merged, ...byId.values()];
}

export function getFeaturedWalletOptions(wallets: readonly WalletOptionViewModel[], limit = 5): WalletOptionViewModel[] {
  const byId = new Map(wallets.map((wallet) => [wallet.id, wallet]));
  const featured = featuredOrder.flatMap((id) => {
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

function enrichWalletOption(wallet: WalletOptionViewModel, item: TronWalletCatalogItem, adapterIds: ReadonlySet<string>): WalletOptionViewModel {
  const canUseWalletConnect = item.walletConnectFallback === true && adapterIds.has("walletconnect");
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
  const badge = useQrFallback ? { label: "QR CODE", tone: "qr" as const } : wallet.badge ?? item.badge;
  if (icon) option.icon = icon;
  if (homepage) option.homepage = homepage;
  if (downloadUrl) option.downloadUrl = downloadUrl;
  if (badge) option.badge = badge;
  return option;
}

function createCatalogBadge(item: TronWalletCatalogItem, available: boolean): NonNullable<WalletOptionViewModel["badge"]> {
  if (item.transport === "qr" || item.transport === "walletconnect") return { label: "QR CODE", tone: "qr" };
  if (available) return { label: "INSTALLED", tone: "installed" };
  return { label: "TRON", tone: "tron" };
}
