import type { WalletPlatform } from "./types";

/**
 * @deprecated Core no longer owns wallet catalog metadata.
 *
 * Runtime wallet metadata is derived from `@tron-wallet-kit/client` wallet
 * descriptors via `buildCatalog()` and `WalletMetadata.catalog`. These exports
 * remain only as a pre-1.0 compatibility shim for older imports.
 */

export type TronWalletTransport = "extension" | "walletconnect" | "qr" | "hardware" | "mobile";
export type TronWalletGroup = "featured" | "popular" | "hardware" | "extension" | "mobile";

export type TronWalletRegistryItem = {
  id: string;
  name: string;
  enabled: boolean;
  group: TronWalletGroup;
  transport: TronWalletTransport;
  platforms: readonly WalletPlatform[];
  homepage?: string;
  downloadUrl?: string;
  providerPaths?: readonly string[];
  conflictMarkers?: readonly string[];
  mobileDeepLink?: {
    scheme: string;
    urlTemplate?: string;
  };
  supportsWalletConnect?: boolean;
  upstreamPackage?: string;
};

/** @deprecated Use `@tron-wallet-kit/client` wallet descriptors and `buildCatalog()`. */
export const TRON_WALLET_REGISTRY: readonly TronWalletRegistryItem[] = [];

/** @deprecated Use string wallet ids or wallet descriptors from `@tron-wallet-kit/client`. */
export type TronWalletRegistryId = string;

/** @deprecated Use `@tron-wallet-kit/client` wallet descriptors and `buildCatalog()`. */
export function getTronWalletRegistryItem(_walletId: string): TronWalletRegistryItem | undefined {
  return undefined;
}

/** @deprecated Use `@tron-wallet-kit/client` wallet descriptors and `buildCatalog()`. */
export function getEnabledTronWalletRegistryItems(): readonly TronWalletRegistryItem[] {
  return TRON_WALLET_REGISTRY;
}
