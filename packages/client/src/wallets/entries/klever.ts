import type { WalletDescriptor } from "../types";

export const klever: WalletDescriptor = {
  id: "klever",
  name: "Klever Wallet",
  integration: "walletconnect",
  homepage: "https://klever.io/crypto-wallet/tron-trx/",
  downloadUrl: "https://klever.io/download/",
  platforms: ["extension", "mobile"],
  group: "popular",
  supportsWalletConnect: true,
  description: "Enabled as a WalletConnect-routed catalog wallet until TRON injected provider paths are confirmed."
};
