import type { WalletDescriptor } from "../types";

export const foxwallet: WalletDescriptor = {
  id: "foxwallet",
  name: "FoxWallet",
  integration: "tronweb3-bridge",
  homepage: "https://foxwallet.com/",
  platforms: ["mobile"],
  group: "popular",
  importer: async () => {
    const module = await import("@tronweb3/tronwallet-adapter-foxwallet");
    return new module.FoxWalletAdapter();
  }
};
