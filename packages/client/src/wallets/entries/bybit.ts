import type { WalletDescriptor } from "../types";

export const bybit: WalletDescriptor = {
  id: "bybit",
  name: "Bybit Wallet",
  integration: "tronweb3-bridge",
  homepage: "https://www.bybit.com/web3",
  platforms: ["extension", "mobile"],
  group: "popular",
  injectedFallback: { providerPaths: ["bybitWallet.tronLink", "bybitWallet.tron"] },
  importer: async () => {
    const module = await import("@tronweb3/tronwallet-adapter-bybit");
    return new module.BybitWalletAdapter();
  }
};
