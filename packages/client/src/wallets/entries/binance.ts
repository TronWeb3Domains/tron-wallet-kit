import { getBinanceInjectedProvider } from "../../injected/detect";
import type { WalletDescriptor } from "../types";

export const binance: WalletDescriptor = {
  id: "binance",
  name: "Binance Web3 Wallet",
  integration: "injected",
  homepage: "https://www.binance.com/en/web3wallet",
  platforms: ["extension", "mobile"],
  group: "popular",
  supportsWalletConnect: true,
  detect: { providerPaths: ["binancew3w.tron"], provider: getBinanceInjectedProvider }
};
