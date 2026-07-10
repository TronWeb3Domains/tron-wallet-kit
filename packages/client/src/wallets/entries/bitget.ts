import { getBitgetInjectedProvider } from "../../injected/detect";
import type { WalletDescriptor } from "../types";

export const bitget: WalletDescriptor = {
  id: "bitget",
  name: "Bitget Wallet",
  integration: "injected",
  homepage: "https://web3.bitget.com/",
  platforms: ["extension", "mobile"],
  group: "popular",
  featured: 4,
  detect: { providerPaths: ["bitkeep.tronLink", "bitkeep.tron"], provider: getBitgetInjectedProvider }
};
