import type { WalletDescriptor } from "../types";

export const binance: WalletDescriptor = {
  id: "binance",
  name: "Binance Web3 Wallet",
  integration: "tronweb3-bridge",
  homepage: "https://www.binance.com/en/web3wallet",
  platforms: ["extension", "mobile"],
  group: "popular",
  supportsWalletConnect: true,
  injectedFallback: { providerPaths: ["binancew3w.tron", "binancew3w.tronLink"] },
  importer: async () => {
    const module = await import("@tronweb3/tronwallet-adapter-binance");
    return new module.BinanceWalletAdapter();
  }
};
