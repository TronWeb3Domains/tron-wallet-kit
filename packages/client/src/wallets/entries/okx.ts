import { standardInjected } from "../../adapters/injected-strategy";
import type { WalletDescriptor } from "../types";

export const okx: WalletDescriptor = {
  id: "okx",
  name: "OKX Wallet",
  integration: "injected",
  homepage: "https://www.okx.com/web3",
  platforms: ["extension", "mobile"],
  group: "popular",
  featured: 3,
  injected: standardInjected({ providerPaths: ["okxwallet.tronLink"] }),
  detect: { providerPaths: ["okxwallet.tronLink"] }
};
