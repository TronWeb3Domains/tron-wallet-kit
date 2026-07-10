import { getSafePalInjectedProvider } from "../../injected/detect";
import type { WalletDescriptor } from "../types";

export const safepal: WalletDescriptor = {
  id: "safepal",
  name: "SafePal",
  integration: "injected",
  homepage: "https://www.safepal.com/",
  downloadUrl: "https://www.safepal.com/download?product=2",
  platforms: ["extension", "mobile"],
  group: "popular",
  supportsWalletConnect: true,
  detect: { provider: getSafePalInjectedProvider },
  signMessageMode: "sign"
};
