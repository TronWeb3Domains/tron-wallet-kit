import { createWalletConnectAdapter } from "@tron-wallet-kit/adapter-walletconnect";
import type { WalletAdapter, WalletMetadata } from "@tron-wallet-kit/core";
import { createDefaultTronwalletBridgeAdapter, type DefaultTronwalletBridgeWalletConfig } from "../adapters/bridge";
import { createInjectedTronAdapter } from "../adapters/injected";
import type { DefaultAdaptersConfig, InjectedTronAdapterConfig } from "../types";
import { getWalletIcon } from "./icons.generated";
import type { WalletDescriptor } from "./types";

export function buildAdapters(wallets: readonly WalletDescriptor[], config: DefaultAdaptersConfig = {}): WalletAdapter[] {
  const adapters: WalletAdapter[] = [];
  for (const wallet of wallets) {
    if (wallet.enabled === false) continue;
    const adapter = buildAdapter(wallet, config);
    if (adapter) adapters.push(hydrateAdapterMetadata(wallet, adapter));
  }
  return adapters;
}

function buildAdapter(wallet: WalletDescriptor, config: DefaultAdaptersConfig): WalletAdapter | undefined {
  switch (wallet.integration) {
    case "custom":
      return wallet.createAdapter(config);
    case "tronweb3-bridge":
      if (config.tronweb3Bridge?.enabled === false) return undefined;
      return createDefaultTronwalletBridgeAdapter(toBridgeConfig(wallet), config);
    case "injected":
      return createInjectedTronAdapter(toInjectedConfig(wallet));
    case "walletconnect":
      if (!config.walletConnectProjectId) return undefined;
      return createWalletConnectAdapter({
        projectId: config.walletConnectProjectId,
        ...config.walletconnect,
        ...(config.walletConnectNetwork ? { network: config.walletConnectNetwork } : {}),
        ...(config.onWalletConnectUri ? { onUri: config.onWalletConnectUri } : {})
      });
  }
}

function toBridgeConfig(wallet: Extract<WalletDescriptor, { integration: "tronweb3-bridge" }>): DefaultTronwalletBridgeWalletConfig {
  return {
    id: wallet.id,
    name: wallet.name,
    homepage: wallet.homepage,
    ...(wallet.platforms.includes("hardware") ? { type: "hardware" as const } : {}),
    platforms: [...wallet.platforms],
    ...(wallet.signMessageMode ? { signMessageMode: wallet.signMessageMode } : {}),
    ...(wallet.availabilityTimeoutMs ? { availabilityTimeoutMs: wallet.availabilityTimeoutMs } : {}),
    ...(wallet.availabilityProbe ? { availabilityProbe: wallet.availabilityProbe } : {}),
    ...(wallet.injectedFallback ? { injectedFallback: toInjectedFallback(wallet) } : {}),
    importer: wallet.importer
  };
}

function toInjectedFallback(wallet: Extract<WalletDescriptor, { integration: "tronweb3-bridge" }>): InjectedTronAdapterConfig {
  return {
    id: wallet.id,
    name: wallet.name,
    providerPaths: wallet.injectedFallback?.providerPaths ?? [],
    ...(wallet.injectedFallback?.provider ? { provider: wallet.injectedFallback.provider } : {}),
    ...(wallet.injectedFallback?.availabilityProbe ? { availabilityProbe: wallet.injectedFallback.availabilityProbe } : {}),
    ...(wallet.injectedFallback?.requestMethods ? { requestMethods: wallet.injectedFallback.requestMethods } : {}),
    homepage: wallet.homepage,
    downloadUrl: wallet.downloadUrl ?? wallet.homepage,
    platforms: [...wallet.platforms]
  };
}

function toInjectedConfig(wallet: Extract<WalletDescriptor, { integration: "injected" }>): InjectedTronAdapterConfig {
  const icon = wallet.icon ?? getWalletIcon(wallet.id);
  return {
    id: wallet.id,
    name: wallet.name,
    providerPaths: wallet.detect.providerPaths ?? [],
    ...(wallet.detect.provider ? { provider: wallet.detect.provider } : {}),
    ...(wallet.detect.availabilityProbe ? { availabilityProbe: wallet.detect.availabilityProbe } : {}),
    ...(icon ? { icon } : {}),
    homepage: wallet.homepage,
    downloadUrl: wallet.downloadUrl ?? wallet.homepage,
    platforms: [...wallet.platforms],
    ...(wallet.requestMethods ? { requestMethods: wallet.requestMethods } : {}),
    ...(wallet.signMessageMode ? { signMessageMode: wallet.signMessageMode } : {}),
    ...(wallet.availabilityTimeoutMs ? { availabilityTimeoutMs: wallet.availabilityTimeoutMs } : {}),
    ...(wallet.addressTimeoutMs ? { addressTimeoutMs: wallet.addressTimeoutMs } : {}),
    ...(wallet.addressSettleMs ? { addressSettleMs: wallet.addressSettleMs } : {}),
    ...(wallet.preferInjectedAddress ? { preferInjectedAddress: true } : {})
  };
}

function hydrateAdapterMetadata(wallet: WalletDescriptor, adapter: WalletAdapter): WalletAdapter {
  const icon = wallet.icon ?? getWalletIcon(wallet.id);
  if (!icon) return adapter;
  (adapter as WalletAdapter & { metadata: WalletMetadata }).metadata = {
    ...adapter.metadata,
    icon
  };
  return adapter;
}
