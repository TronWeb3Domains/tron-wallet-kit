import { standardInjected } from "../../adapters/injected-strategy";
import type { WalletDescriptor } from "../types";

export const bybit: WalletDescriptor = {
  id: "bybit",
  name: "Bybit Wallet",
  integration: "injected",
  homepage: "https://www.bybit.com/web3",
  platforms: ["extension", "mobile"],
  group: "popular",
  injected: standardInjected({ providerPaths: ["bybitWallet.tronLink", "bybitWallet.tron"], rdns: ["com.bybit"] }),
  detect: { providerPaths: ["bybitWallet.tronLink", "bybitWallet.tron"] }
};
