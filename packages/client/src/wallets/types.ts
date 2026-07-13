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
  requestMethods?: readonly string[];
  signMessageMode?: "signMessageV2" | "sign" | "request";
  availabilityTimeoutMs?: number;
  addressTimeoutMs?: number;
  addressSettleMs?: number;
  accountChangeEventNames?: readonly string[];
  accountChangeTimeoutMs?: number;
  emptyAddressRetryDelayMs?: number;
  emptyAddressRetryTimeoutMs?: number;
  // For wallets whose request() hangs/re-prompts when already exposing an account (e.g. Gate):
  // use the already-injected tronWeb.defaultAddress.base58 first and only call request() if absent.
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
