import { WalletKitError, getTronWalletRegistryItem, type WalletPlatform } from "@tron-wallet-kit/core";
import { getTronWalletCatalogIcon } from "@tron-wallet-kit/ui";
import type { InjectedTronAdapterConfig } from "../types";

export type WalletRegistryBridgeFields = {
  id: string;
  name: string;
  homepage: string;
  platforms: WalletPlatform[];
};

export function normalizeWalletId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/wallet$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function walletIconMetadata(walletId: string): { icon?: string } {
  const icon = getTronWalletCatalogIcon(walletId);
  return icon ? { icon } : {};
}

export function walletRegistryFields(walletId: string): WalletRegistryBridgeFields {
  const item = getTronWalletRegistryItem(walletId);
  if (!item) throw new WalletKitError("CONFIGURATION_ERROR", `Unknown default TRON wallet: ${walletId}`);
  return {
    id: item.id,
    name: item.name,
    homepage: item.homepage ?? "",
    platforms: [...item.platforms]
  };
}

export function injectedFallbackFromRegistry(
  walletId: string,
  options: Partial<Pick<InjectedTronAdapterConfig, "provider" | "requestMethods">> = {}
): InjectedTronAdapterConfig {
  const item = getTronWalletRegistryItem(walletId);
  if (!item) throw new WalletKitError("CONFIGURATION_ERROR", `Unknown injected TRON wallet: ${walletId}`);
  return {
    id: item.id,
    name: item.name,
    providerPaths: item.providerPaths ?? [],
    ...(item.homepage ? { homepage: item.homepage } : {}),
    platforms: [...item.platforms],
    ...options
  };
}
