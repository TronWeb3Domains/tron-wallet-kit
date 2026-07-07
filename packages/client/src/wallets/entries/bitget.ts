import { getBitgetInjectedProvider } from "../../injected/detect";
import type { WalletDescriptor } from "../types";

export const bitget: WalletDescriptor = {
  id: "bitget",
  name: "Bitget Wallet",
  integration: "tronweb3-bridge",
  homepage: "https://web3.bitget.com/",
  platforms: ["extension", "mobile"],
  group: "popular",
  featured: 4,
  injectedFallback: { providerPaths: ["bitkeep.tronLink", "bitkeep.tron"], provider: getBitgetInjectedProvider },
  importer: async () => {
    const module = await import("@tronweb3/tronwallet-adapter-bitkeep");
    return new module.BitKeepAdapter();
  }
};
