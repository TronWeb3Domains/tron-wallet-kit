import {
  createBrowserWalletStorage,
  NetworkRegistry,
  WalletManager,
  type WalletAdapter
} from "@tron-wallet-kit/core";
import { createTronWeb3AdapterBridges } from "./adapters/bridge";
import type { DefaultAdaptersConfig, WalletClientConfig } from "./types";
import { buildAdapters } from "./wallets/build-adapters";
import { resolveWalletDescriptors } from "./wallets/registry";

export function createDefaultAdapters(config: DefaultAdaptersConfig = {}): WalletAdapter[] {
  const requestedDescriptors = resolveWalletDescriptors(config.wallets);
  const requested = new Set(requestedDescriptors.map((wallet) => wallet.id));
  for (const walletId of config.disabledWallets ?? []) requested.delete(walletId);
  return buildAdapters(
    requestedDescriptors.filter((wallet) => requested.has(wallet.id)),
    config
  );
}

export function createWalletClient(config: WalletClientConfig = {}): WalletManager {
  const networks = config.networks;
  const registry = new NetworkRegistry(networks);
  const network = registry.resolve(config.network);
  const adapters = [...(config.adapters ?? []), ...createDefaultAdapters(config), ...createTronWeb3AdapterBridges(config.tronweb3Adapters)];
  return new WalletManager({
    ...(config.appName ? { appName: config.appName } : {}),
    network,
    ...(networks ? { networks } : {}),
    ...(config.storage ?? (config.useBrowserStorage ? createBrowserWalletStorage() : undefined)
      ? { storage: config.storage ?? createBrowserWalletStorage() }
      : {}),
    ...(config.storageKey ? { storageKey: config.storageKey } : {}),
    ...(config.autoReconnect !== undefined ? { autoReconnect: config.autoReconnect } : {}),
    adapters
  });
}
