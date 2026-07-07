import { createTronLinkAdapter } from "@tron-wallet-kit/adapter-tronlink";
import { createWalletConnectAdapter } from "@tron-wallet-kit/adapter-walletconnect";
import {
  createBrowserWalletStorage,
  NetworkRegistry,
  WalletManager,
  getEnabledTronWalletRegistryItems,
  type WalletAdapter
} from "@tron-wallet-kit/core";
import { createDefaultTronwalletBridgeAdapter, createTronWeb3AdapterBridges } from "./adapters/bridge";
import { defaultInjectedTronWallets, defaultTronwalletBridgeWallets } from "./adapters/defaults";
import { createInjectedTronAdapter } from "./adapters/injected";
import type { DefaultAdaptersConfig, WalletClientConfig } from "./types";

export function createDefaultAdapters(config: DefaultAdaptersConfig = {}): WalletAdapter[] {
  const defaultWallets = getEnabledTronWalletRegistryItems().map((wallet) => wallet.id);
  const requested = new Set(config.wallets === "all" || !config.wallets ? defaultWallets : config.wallets);
  for (const walletId of config.disabledWallets ?? []) requested.delete(walletId);
  const adapters: WalletAdapter[] = [];
  if (requested.has("tronlink")) adapters.push(createTronLinkAdapter(config.tronlink));
  if (config.tronweb3Bridge?.enabled !== false) {
    for (const bridgeConfig of defaultTronwalletBridgeWallets) {
      if (requested.has(bridgeConfig.id)) adapters.push(createDefaultTronwalletBridgeAdapter(bridgeConfig, config));
    }
  }
  for (const injectedConfig of defaultInjectedTronWallets) {
    if (requested.has(injectedConfig.id)) adapters.push(createInjectedTronAdapter(injectedConfig));
  }
  if (requested.has("walletconnect") && config.walletConnectProjectId) {
    adapters.push(
      createWalletConnectAdapter({
        projectId: config.walletConnectProjectId,
        ...config.walletconnect,
        ...(config.walletConnectNetwork ? { network: config.walletConnectNetwork } : {}),
        ...(config.onWalletConnectUri ? { onUri: config.onWalletConnectUri } : {})
      })
    );
  }
  return adapters;
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
