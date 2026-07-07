import type { WalletDescriptor } from "../types";

export const tokenpocket: WalletDescriptor = {
  id: "tokenpocket",
  name: "TokenPocket",
  integration: "tronweb3-bridge",
  homepage: "https://www.tokenpocket.pro/",
  platforms: ["extension", "mobile"],
  group: "popular",
  featured: 2,
  supportsWalletConnect: true,
  injectedFallback: { providerPaths: ["tokenpocket.tron", "tokenpocket.tronWeb", "tronWeb"] },
  importer: async () => {
    const module = await import("@tronweb3/tronwallet-adapter-tokenpocket");
    return new module.TokenPocketAdapter();
  }
};
