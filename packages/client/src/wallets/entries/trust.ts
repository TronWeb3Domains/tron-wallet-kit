import type { WalletDescriptor } from "../types";

export const trust: WalletDescriptor = {
  id: "trust",
  name: "Trust Wallet",
  integration: "tronweb3-bridge",
  homepage: "https://trustwallet.com/",
  platforms: ["extension", "mobile"],
  group: "popular",
  supportsWalletConnect: true,
  injectedFallback: { providerPaths: ["trustwallet.tronLink", "trustwallet.tron"] },
  importer: async () => {
    const module = await import("@tronweb3/tronwallet-adapter-trust");
    return new module.TrustAdapter();
  }
};
