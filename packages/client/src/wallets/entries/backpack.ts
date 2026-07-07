import type { WalletDescriptor } from "../types";

export const backpack: WalletDescriptor = {
  id: "backpack",
  name: "Backpack",
  integration: "tronweb3-bridge",
  homepage: "https://backpack.app/",
  platforms: ["extension"],
  group: "popular",
  injectedFallback: { providerPaths: ["backpack.tron", "backpack.tronLink"] },
  importer: async () => {
    const module = await import("@tronweb3/tronwallet-adapter-backpack");
    return new module.BackpackAdapter();
  }
};
