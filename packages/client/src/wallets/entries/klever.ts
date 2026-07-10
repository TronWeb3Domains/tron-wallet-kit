import type { WalletDescriptor } from "../types";

export const klever: WalletDescriptor = {
  id: "klever",
  name: "Klever Wallet",
  integration: "walletconnect",
  homepage: "https://klever.io/crypto-wallet/tron-trx/",
  downloadUrl: "https://klever.io/download/",
  platforms: ["extension", "mobile"],
  group: "popular",
  enabled: false,
  supportsWalletConnect: true,
  description: "Staged until provider paths or WalletConnect QA are confirmed."
};
