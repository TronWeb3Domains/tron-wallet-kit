import type { WalletDescriptor } from "../types";

export const okx: WalletDescriptor = {
  id: "okx",
  name: "OKX Wallet",
  integration: "tronweb3-bridge",
  homepage: "https://www.okx.com/web3",
  platforms: ["extension", "mobile"],
  group: "popular",
  featured: 3,
  injectedFallback: { providerPaths: ["okxwallet.tronLink"] },
  importer: async () => {
    const module = await import("@tronweb3/tronwallet-adapter-okxwallet");
    return new module.OkxWalletAdapter();
  }
};
