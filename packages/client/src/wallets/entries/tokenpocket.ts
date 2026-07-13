import { standardInjected } from "../../adapters/injected-strategy";
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
  injected: standardInjected({ providerPaths: ["tokenpocket.tron", "tokenpocket.tronWeb"] }),
  detect: { providerPaths: ["tokenpocket.tron", "tokenpocket.tronWeb"] }
};
