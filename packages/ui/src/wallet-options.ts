import type { WalletAdapter } from "@tron-wallet-kit/core";
import { en } from "./locales/en";
import { resolveWalletBadge } from "./wallet-badges";
import { isHardwareWallet } from "./wallet-kinds";
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
  if (adapter.metadata.catalog?.featured !== undefined) option.featured = adapter.metadata.catalog.featured;
  if (adapter.metadata.catalog?.providerPaths) option.providerPaths = adapter.metadata.catalog.providerPaths;
  if (adapter.metadata.catalog?.conflictMarkers) option.conflictMarkers = adapter.metadata.catalog.conflictMarkers;
  if (adapter.metadata.catalog?.mobileDeepLink) option.mobileDeepLink = adapter.metadata.catalog.mobileDeepLink;
  if (adapter.metadata.catalog?.supportsWalletConnect !== undefined) option.supportsWalletConnect = adapter.metadata.catalog.supportsWalletConnect;
  if (capabilities.length > 0) option.capabilities = capabilities;
  const badgeWallet = { id: adapter.metadata.id, capabilities, readyState };
  const badge = resolveWalletBadge(
    {
      ...badgeWallet,
      ...(adapter.metadata.type !== undefined ? { transport: adapter.metadata.type } : {}),
      ...(adapter.metadata.platforms !== undefined ? { platforms: adapter.metadata.platforms } : {})
    },
    labels
  );
  if (badge) option.badge = badge;
  return option;
}

function resolveReadyState(adapter: WalletAdapter, availability: WalletAvailability): WalletReadyState {
  if (isHardwareWallet({ id: adapter.metadata.id, transport: adapter.metadata.type, platforms: adapter.metadata.platforms })) return "found";
  if (availability === "loading") return "loading";
  if (availability === false) return "notFound";
  if (availability === true) return "found";
  return adapter.isAvailable ? "loading" : "found";
}
