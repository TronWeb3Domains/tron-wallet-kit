import type { WalletDescriptor } from "../types";

export const imtoken: WalletDescriptor = {
  id: "imtoken",
  name: "imToken",
  integration: "tronweb3-bridge",
  homepage: "https://token.im/",
  platforms: ["mobile"],
  group: "popular",
  importer: async () => {
    const module = await import("@tronweb3/tronwallet-adapter-imtoken");
    return new module.ImTokenAdapter();
  }
};
