import { isHardwareWallet, isQrWallet } from "./wallet-kinds";
import type { ConnectModalLabels, TronWalletCatalogItem, WalletOptionViewModel } from "./types";

type WalletBadgeTone = NonNullable<WalletOptionViewModel["badge"]>["tone"];
type RequiredWalletBadgeTone = Exclude<WalletBadgeTone, undefined>;
type WalletBadge = NonNullable<WalletOptionViewModel["badge"]>;
type WalletBadgeInput = Pick<WalletOptionViewModel, "id" | "transport" | "platforms" | "capabilities" | "readyState" | "available" | "badge">;

type ResolveWalletBadgeOptions = {
  available?: boolean;
  tone?: WalletBadgeTone;
};

export function resolveWalletBadge(wallet: WalletBadgeInput, labels: ConnectModalLabels, options: ResolveWalletBadgeOptions = {}): WalletBadge {
  const tone = options.tone ?? wallet.badge?.tone;
  const available = options.available ?? wallet.available === true;
  const transport = wallet.transport;
  if (tone === "qr" || transport === "qr" || transport === "walletconnect" || isQrWallet(wallet)) return createBadge(labels.qrCode, "qr");
  if (tone === "tron" && (transport === "hardware" || isHardwareWallet(wallet))) return createBadge("HARDWARE", "tron", false);
  if (transport === "hardware" || isHardwareWallet(wallet)) return createBadge("HARDWARE", "tron", false);
  if (wallet.readyState === "loading") return createBadge(labels.checking, "muted");
  if (tone === "installed" || wallet.readyState === "found" || available) return createBadge(labels.installed, "installed");
  if (wallet.readyState === "notFound") return createBadge(labels.notInstalled, "muted");
  if (wallet.readyState === "unsupported") return createBadge(labels.unavailable, "muted");
  return createBadge(labels.tron, "tron");
}

export function resolveCatalogBadge(item: TronWalletCatalogItem, available: boolean, labels: ConnectModalLabels): WalletBadge {
  const wallet: WalletBadgeInput = {
    id: item.id,
    platforms: item.platforms,
    available
  };
  if (item.transport !== undefined) wallet.transport = item.transport;
  if (item.badge !== undefined) wallet.badge = item.badge;
  return resolveWalletBadge(wallet, labels, { available, tone: item.badge?.tone });
}

export function createQrWalletBadge(labels: ConnectModalLabels): WalletBadge {
  return createBadge(labels.qrCode, "qr");
}

function createBadge(label: string, tone: RequiredWalletBadgeTone, uppercase = true): WalletBadge {
  return { label: uppercase ? label.toUpperCase() : label, tone };
}
