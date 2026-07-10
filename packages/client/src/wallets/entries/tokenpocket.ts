import type { WalletDescriptor } from "../types";

export const tokenpocket: WalletDescriptor = {
  id: "tokenpocket",
  name: "TokenPocket",
  integration: "injected",
  homepage: "https://www.tokenpocket.pro/",
  platforms: ["extension", "mobile"],
  group: "popular",
  featured: 2,
  supportsWalletConnect: true,
  detect: { providerPaths: ["tokenpocket.tron", "tokenpocket.tronWeb"] }
};
