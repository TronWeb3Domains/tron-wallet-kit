import type { TronWalletGroup, WalletAdapter, WalletPlatform } from "@tron-wallet-kit/core";
import type { TronwalletBridgeInnerAdapter } from "@tron-wallet-kit/adapter-tronwallet-bridge";
import type { InjectedStrategy } from "../adapters/injected-strategy";
import type { DefaultAdaptersConfig, InjectedTronAdapterConfig } from "../types";

export type WalletDescriptorBase = {
  id: string;
  name: string;
  homepage: string;
  downloadUrl?: string;
  platforms: readonly WalletPlatform[];
  group?: TronWalletGroup;
  featured?: number;
  description?: string;
  icon?: string;
  enabled?: boolean;
  availabilityMode?: "auto" | "on-demand";
  supportsWalletConnect?: boolean;
  mobileDeepLink?: {
    scheme: string;
    urlTemplate?: string;
  };
  providerPaths?: readonly string[];
  conflictMarkers?: readonly string[];
};

export type InjectedDetect = {
  providerPaths?: readonly string[];
  provider?: InjectedTronAdapterConfig["provider"];
  availabilityProbe?: InjectedTronAdapterConfig["availabilityProbe"];
  requestMethods?: InjectedTronAdapterConfig["requestMethods"];
};

export type Tronweb3BridgeWalletDescriptor = WalletDescriptorBase & {
  integration: "tronweb3-bridge";
  importer: () => Promise<TronwalletBridgeInnerAdapter>;
  signMessageMode?: "string" | "messageObject";
  availabilityTimeoutMs?: number;
  availabilityProbe?: () => boolean | Promise<boolean>;
  injectedFallback?: InjectedDetect;
};

export type InjectedWalletDescriptor = WalletDescriptorBase & {
  integration: "injected";
  detect?: InjectedDetect;
  injected?: InjectedStrategy;
  /**
   * @deprecated Put wallet connect quirks in `injected: standardInjected(...)`
   * plus decorators such as `withRequestMethods(...)`.
   */
  requestMethods?: readonly string[];
  /**
   * @deprecated Put signing quirks in `withSignMode(...)`.
   */
  signMessageMode?: "signMessageV2" | "sign" | "request";
  /**
   * @deprecated Use wallet-local strategy composition instead of flat descriptor
   * timing fields. Kept for backward compatibility with existing descriptors.
   */
  availabilityTimeoutMs?: number;
  /**
   * @deprecated Use `withAddressPoll(...)` or a wallet-local strategy.
   */
  addressTimeoutMs?: number;
  /**
   * @deprecated Use `withAddressPoll(...)`.
   */
  addressSettleMs?: number;
  /**
   * @deprecated Use `withEvents(...)`.
   */
  accountChangeEventNames?: readonly string[];
  /**
   * @deprecated Use `withAddressPoll(...)` / `withEvents(...)`.
   */
  accountChangeTimeoutMs?: number;
  /**
   * @deprecated Use `withAddressPoll(...)`.
   */
  emptyAddressRetryDelayMs?: number;
  /**
   * @deprecated Use `withAddressPoll(...)`.
   */
  emptyAddressRetryTimeoutMs?: number;
  /**
   * @deprecated Use `withPreferInjectedAddress(...)`.
   */
  preferInjectedAddress?: boolean;
};

export type WalletConnectWalletDescriptor = WalletDescriptorBase & {
  integration: "walletconnect";
};

export type CustomWalletDescriptor = WalletDescriptorBase & {
  integration: "custom";
  createAdapter: (config: DefaultAdaptersConfig) => WalletAdapter | undefined;
};

export type WalletDescriptor =
  | Tronweb3BridgeWalletDescriptor
  | InjectedWalletDescriptor
  | WalletConnectWalletDescriptor
  | CustomWalletDescriptor;
