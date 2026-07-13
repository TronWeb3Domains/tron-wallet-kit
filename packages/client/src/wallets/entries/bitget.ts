import { standardInjected } from "../../adapters/injected-strategy";
import { getBitgetInjectedProvider, hasBitgetInjectedMarker } from "../../injected/detect";
import type { WalletDescriptor } from "../types";

export const bitget: WalletDescriptor = {
  id: "bitget",
  name: "Bitget Wallet",
  integration: "injected",
  homepage: "https://web3.bitget.com/",
  platforms: ["extension", "mobile"],
  group: "popular",
  featured: 4,
  injected: standardInjected({
    providerPaths: ["bitkeep.tronLink", "bitkeep.tron"],
    provider: getBitgetInjectedProvider,
    marker: hasBitgetInjectedMarker,
    requestMethods: ["tron_requestAccounts", "eth_requestAccounts"],
    addressSettleMs: 2500,
    emptyAddressRetryDelayMs: 350,
    emptyAddressRetryTimeoutMs: 3000,
    preferInjectedAddress: true
  }),
  detect: {
    providerPaths: ["bitkeep.tronLink", "bitkeep.tron"],
    provider: getBitgetInjectedProvider,
    availabilityProbe: hasBitgetInjectedMarker
  },
  requestMethods: ["tron_requestAccounts", "eth_requestAccounts"],
  addressSettleMs: 2500,
  emptyAddressRetryDelayMs: 350,
  emptyAddressRetryTimeoutMs: 3000,
  preferInjectedAddress: true
};
