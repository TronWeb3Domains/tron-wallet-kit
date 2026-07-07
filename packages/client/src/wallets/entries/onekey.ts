import type { WalletDescriptor } from "../types";

export const onekey: WalletDescriptor = {
  id: "onekey",
  name: "OneKey",
  integration: "tronweb3-bridge",
  homepage: "https://onekey.so/",
  platforms: ["extension"],
  group: "popular",
  injectedFallback: { providerPaths: ["$onekey.tron", "$onekey.tronLink"] },
  importer: async () => {
    const module = await import("@tronweb3/tronwallet-adapter-onekey");
    return new module.OneKeyAdapter();
  }
};
