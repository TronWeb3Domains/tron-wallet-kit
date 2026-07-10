import type { WalletDescriptor } from "../types";

export const bybit: WalletDescriptor = {
  id: "bybit",
  name: "Bybit Wallet",
  integration: "injected",
  homepage: "https://www.bybit.com/web3",
  platforms: ["extension", "mobile"],
  group: "popular",
  detect: { providerPaths: ["bybitWallet.tronLink", "bybitWallet.tron"] }
};
