import { getFoxWalletInjectedProvider } from "../../injected/detect";
import type { WalletDescriptor } from "../types";

export const foxwallet: WalletDescriptor = {
  id: "foxwallet",
  name: "FoxWallet",
  integration: "injected",
  homepage: "https://foxwallet.com/",
  platforms: ["mobile"],
  group: "popular",
  mobileDeepLink: { scheme: "foxwallet", urlTemplate: "foxwallet://dapp?url={encodedUrl}" },
  detect: { providerPaths: ["foxwallet.tronLink", "foxwallet.tron"], provider: getFoxWalletInjectedProvider }
};
