import {
  createLazyTronwalletBridgeAdapter,
  createTronwalletBridgeAdapter,
  type TronwalletBridgeInnerAdapter
} from "@tron-wallet-kit/adapter-tronwallet-bridge";
import type { WalletAdapter, WalletAdapterType, WalletPlatform } from "@tron-wallet-kit/core";
import { createAvailabilityProbeWalletAdapter, createFallbackWalletAdapter } from "./combinators";
import { createInjectedTronAdapter } from "./injected";
import { normalizeWalletId, walletIconMetadata } from "../injected/registry-map";
import type { DefaultAdaptersConfig, InjectedTronAdapterConfig, TronWeb3AdapterBridgeConfig } from "../types";

export type DefaultTronwalletBridgeWalletConfig = {
  id: string;
  name: string;
  homepage: string;
  type?: WalletAdapterType;
  platforms: WalletPlatform[];
  signMessageMode?: "string" | "messageObject";
  availabilityTimeoutMs?: number;
  availabilityProbe?: () => boolean | Promise<boolean>;
  injectedFallback?: InjectedTronAdapterConfig;
  importer: () => Promise<TronwalletBridgeInnerAdapter>;
};

export function createTronWeb3AdapterBridge(config: TronWeb3AdapterBridgeConfig): WalletAdapter {
  return createTronwalletBridgeAdapter(config.adapter, {
    id: normalizeWalletId(config.id ?? config.metadata?.id ?? String(config.adapter.name)),
    ...(config.metadata ? { metadata: config.metadata } : {}),
    ...(config.type ? { type: config.type } : {}),
    ...(config.platforms ? { platforms: config.platforms } : {}),
    ...(config.group ? { group: config.group } : {}),
    ...(config.network ? { network: config.network } : {}),
    ...(config.tronWeb ? { tronWeb: config.tronWeb } : {}),
    ...(config.capabilities ? { capabilities: config.capabilities } : {}),
    ...(config.signMessageMode ? { signMessageMode: config.signMessageMode } : {})
  });
}

export function createTronWeb3AdapterBridges(configs: readonly TronWeb3AdapterBridgeConfig[] = []): WalletAdapter[] {
  return configs.map((config) => createTronWeb3AdapterBridge(config));
}

export function createDefaultTronwalletBridgeAdapter(
  bridgeConfig: DefaultTronwalletBridgeWalletConfig,
  config: DefaultAdaptersConfig
): WalletAdapter {
  const bridgeAdapter = createLazyTronwalletBridgeAdapter({
    id: bridgeConfig.id,
    metadata: {
      name: bridgeConfig.name,
      ...walletIconMetadata(bridgeConfig.id),
      homepage: bridgeConfig.homepage,
      downloadUrl: bridgeConfig.homepage,
      description: `${bridgeConfig.name} TRON wallet adapter bridged from @tronweb3/tronwallet-adapter.`
    },
    type: bridgeConfig.type ?? "extension",
    platforms: bridgeConfig.platforms,
    ...(bridgeConfig.signMessageMode ? { signMessageMode: bridgeConfig.signMessageMode } : {}),
    ...(bridgeConfig.availabilityTimeoutMs ? { availabilityTimeoutMs: bridgeConfig.availabilityTimeoutMs } : {}),
    ...(config.tronweb3Bridge?.network ? { network: config.tronweb3Bridge.network } : {}),
    ...(config.tronweb3Bridge?.tronWeb ? { tronWeb: config.tronweb3Bridge.tronWeb } : {}),
    importer: bridgeConfig.importer
  });
  const probedBridgeAdapter = bridgeConfig.availabilityProbe
    ? createAvailabilityProbeWalletAdapter(bridgeAdapter, bridgeConfig.availabilityProbe)
    : bridgeAdapter;
  if (!bridgeConfig.injectedFallback) return probedBridgeAdapter;
  return createFallbackWalletAdapter(probedBridgeAdapter, createInjectedTronAdapter(bridgeConfig.injectedFallback));
}
