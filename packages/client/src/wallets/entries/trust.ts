import { standardInjected } from "../../adapters/injected-strategy";
import type { WalletDescriptor } from "../types";

export const trust: WalletDescriptor = {
  id: "trust",
  name: "Trust Wallet",
  integration: "injected",
  homepage: "https://trustwallet.com/",
  platforms: ["extension", "mobile"],
  group: "popular",
  supportsWalletConnect: true,
  injected: standardInjected({ providerPaths: ["trustwallet.tronLink", "trustwallet.tron"] }),
  detect: { providerPaths: ["trustwallet.tronLink", "trustwallet.tron"] }
};
