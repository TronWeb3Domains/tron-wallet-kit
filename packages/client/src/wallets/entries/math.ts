import type { WalletDescriptor } from "../types";
import { getMathWalletInjectedProvider } from "../../injected/detect";

export const math: WalletDescriptor = {
  id: "math",
  name: "MathWallet",
  integration: "injected",
  homepage: "https://mathwallet.org/",
  downloadUrl: "https://mathwallet.org/en-us/",
  platforms: ["extension", "mobile"],
  group: "popular",
  supportsWalletConnect: true,
  detect: { provider: getMathWalletInjectedProvider },
  requestMethods: ["tron_requestAccounts"],
  description: "TronWeb-compatible injected wallet with WalletConnect fallback."
};
