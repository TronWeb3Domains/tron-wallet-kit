import type { WalletDescriptor } from "../types";

export const trust: WalletDescriptor = {
  id: "trust",
  name: "Trust Wallet",
  integration: "injected",
  homepage: "https://trustwallet.com/",
  platforms: ["extension", "mobile"],
  group: "popular",
  supportsWalletConnect: true,
  detect: { providerPaths: ["trustwallet.tronLink", "trustwallet.tron"] }
};
