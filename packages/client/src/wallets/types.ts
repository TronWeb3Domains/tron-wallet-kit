import type { TronWalletGroup, WalletAdapter, WalletPlatform } from "@tron-wallet-kit/core";
import type { TronwalletBridgeInnerAdapter } from "@tron-wallet-kit/adapter-tronwallet-bridge";
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
  supportsWalletConnect?: boolean;
  mobileDeepLink?: {
    scheme: string;
    urlTemplate?: string;
  };
};

export type InjectedDetect = {
  providerPaths?: readonly string[];
  provider?: InjectedTronAdapterConfig["provider"];
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
  detect: InjectedDetect;
  requestMethods?: readonly string[];
  signMessageMode?: "signMessageV2" | "sign" | "request";
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
