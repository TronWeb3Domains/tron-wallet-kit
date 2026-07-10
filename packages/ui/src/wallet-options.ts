import type { WalletAdapter } from "@tron-wallet-kit/core";
import { en } from "./locales/en";
import type { ConnectModalLabels, WalletOptionViewModel } from "./types";

export type WalletAvailability = boolean | "loading" | undefined;
type WalletReadyState = NonNullable<WalletOptionViewModel["readyState"]>;

export function mapAdapterToWalletOption(adapter: WalletAdapter, availability?: WalletAvailability, labels: ConnectModalLabels = en.connectModal): WalletOptionViewModel {
  const readyState = resolveReadyState(adapter, availability);
  const capabilities = Object.entries(adapter.capabilities)
    .filter(([, supported]) => supported === true)
    .map(([capability]) => capability);
  const option: WalletOptionViewModel = {
    id: adapter.metadata.id,
    adapterId: adapter.metadata.id,
    name: adapter.metadata.name,
    available: readyState !== "notFound" && readyState !== "unsupported",
    readyState,
  };
  if (adapter.metadata.icon) option.icon = adapter.metadata.icon;
  if (adapter.metadata.homepage) option.homepage = adapter.metadata.homepage;
  if (adapter.metadata.downloadUrl) option.downloadUrl = adapter.metadata.downloadUrl;
  if (adapter.metadata.group) option.group = adapter.metadata.group;
  if (adapter.metadata.type) option.transport = adapter.metadata.type;
  if (adapter.metadata.platforms) option.platforms = adapter.metadata.platforms;
  if (capabilities.length > 0) option.capabilities = capabilities;
  const badge = createWalletBadge(adapter, readyState, capabilities, labels);
  if (badge) option.badge = badge;
  return option;
}

function resolveReadyState(adapter: WalletAdapter, availability: WalletAvailability): WalletReadyState {
  if (adapter.metadata.type === "hardware" || adapter.metadata.platforms?.includes("hardware")) return "found";
  if (availability === "loading") return "loading";
  if (availability === false) return "notFound";
  if (availability === true) return "found";
  return adapter.isAvailable ? "loading" : "found";
}

function createWalletBadge(adapter: WalletAdapter, readyState: WalletReadyState, capabilities: readonly string[], labels: ConnectModalLabels): WalletOptionViewModel["badge"] {
  if (capabilities.includes("qr") || adapter.metadata.type === "walletconnect" || adapter.metadata.id === "walletconnect") {
    return { label: labels.qrCode.toUpperCase(), tone: "qr" };
  }
  if (adapter.metadata.type === "hardware" || adapter.metadata.platforms?.includes("hardware")) return { label: "HARDWARE", tone: "tron" };
  if (readyState === "found") return { label: labels.installed.toUpperCase(), tone: "installed" };
  if (readyState === "loading") return { label: labels.checking.toUpperCase(), tone: "muted" };
  if (readyState === "notFound") return { label: labels.notInstalled.toUpperCase(), tone: "muted" };
  if (readyState === "unsupported") return { label: labels.unavailable.toUpperCase(), tone: "muted" };
  return { label: labels.tron.toUpperCase(), tone: "tron" };
}
