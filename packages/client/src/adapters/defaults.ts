import { getBitgetInjectedProvider, getGuardaInjectedProvider, hasMetaMaskEthereumProvider } from "../injected/detect";
import { injectedFallbackFromRegistry, walletRegistryFields } from "../injected/registry-map";
import type { InjectedTronAdapterConfig } from "../types";
import type { DefaultTronwalletBridgeWalletConfig } from "./bridge";

export const defaultInjectedTronWallets: readonly InjectedTronAdapterConfig[] = [];

export const defaultTronwalletBridgeWallets: readonly DefaultTronwalletBridgeWalletConfig[] = [
  {
    ...walletRegistryFields("tokenpocket"),
    injectedFallback: injectedFallbackFromRegistry("tokenpocket"),
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-tokenpocket");
      return new module.TokenPocketAdapter();
    }
  },
  {
    ...walletRegistryFields("okx"),
    injectedFallback: injectedFallbackFromRegistry("okx"),
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-okxwallet");
      return new module.OkxWalletAdapter();
    }
  },
  {
    ...walletRegistryFields("bitget"),
    injectedFallback: injectedFallbackFromRegistry("bitget", { provider: getBitgetInjectedProvider }),
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-bitkeep");
      return new module.BitKeepAdapter();
    }
  },
  {
    ...walletRegistryFields("trust"),
    injectedFallback: injectedFallbackFromRegistry("trust"),
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-trust");
      return new module.TrustAdapter();
    }
  },
  {
    ...walletRegistryFields("metamask"),
    signMessageMode: "messageObject",
    availabilityTimeoutMs: 3200,
    availabilityProbe: hasMetaMaskEthereumProvider,
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-metamask-tron");
      return new module.MetaMaskAdapter();
    }
  },
  {
    ...walletRegistryFields("gate"),
    injectedFallback: injectedFallbackFromRegistry("gate"),
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-gatewallet");
      return new module.GateWalletAdapter();
    }
  },
  {
    ...walletRegistryFields("foxwallet"),
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-foxwallet");
      return new module.FoxWalletAdapter();
    }
  },
  {
    ...walletRegistryFields("bybit"),
    injectedFallback: injectedFallbackFromRegistry("bybit"),
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-bybit");
      return new module.BybitWalletAdapter();
    }
  },
  {
    ...walletRegistryFields("imtoken"),
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-imtoken");
      return new module.ImTokenAdapter();
    }
  },
  {
    ...walletRegistryFields("binance"),
    injectedFallback: injectedFallbackFromRegistry("binance"),
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-binance");
      return new module.BinanceWalletAdapter();
    }
  },
  {
    ...walletRegistryFields("guarda"),
    injectedFallback: injectedFallbackFromRegistry("guarda", { provider: getGuardaInjectedProvider }),
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-guarda");
      return new module.GuardaAdapter();
    }
  },
  {
    ...walletRegistryFields("onekey"),
    injectedFallback: injectedFallbackFromRegistry("onekey"),
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-onekey");
      return new module.OneKeyAdapter();
    }
  },
  {
    ...walletRegistryFields("backpack"),
    injectedFallback: injectedFallbackFromRegistry("backpack"),
    importer: async () => {
      const module = await import("@tronweb3/tronwallet-adapter-backpack");
      return new module.BackpackAdapter();
    }
  }
];
