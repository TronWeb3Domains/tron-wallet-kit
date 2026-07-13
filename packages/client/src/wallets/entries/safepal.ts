import { standardInjected } from "../../adapters/injected-strategy";
import { getSafePalInjectedProvider, hasSafePalInjectedMarker } from "../../injected/detect";
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
  injected: standardInjected({
    provider: getSafePalInjectedProvider,
    marker: hasSafePalInjectedMarker,
    signMessageMode: "sign",
    addressSettleMs: 2500,
    emptyAddressRetryDelayMs: 300,
    emptyAddressRetryTimeoutMs: 3000
  }),
  detect: { provider: getSafePalInjectedProvider, availabilityProbe: hasSafePalInjectedMarker },
  addressSettleMs: 2500,
  emptyAddressRetryDelayMs: 300,
  emptyAddressRetryTimeoutMs: 3000,
  signMessageMode: "sign"
};
