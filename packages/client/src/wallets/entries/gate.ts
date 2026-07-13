import { standardInjected } from "../../adapters/injected-strategy";
import { getGateInjectedProvider, hasGateInjectedMarker } from "../../injected/detect";
import type { WalletDescriptor } from "../types";

export const gate: WalletDescriptor = {
  id: "gate",
  name: "Gate Wallet",
  integration: "injected",
  homepage: "https://www.gate.io/web3",
  platforms: ["extension"],
  group: "popular",
  availabilityTimeoutMs: 5000,
  injected: standardInjected({
    providerPaths: ["gatewallet.tron", "gatewallet.tronLink", "gatewallet.tronWeb"],
    provider: getGateInjectedProvider,
    marker: hasGateInjectedMarker,
    requestMethods: ["eth_requestAccounts"],
    addressTimeoutMs: 15000,
    addressSettleMs: 8000,
    accountChangeEventNames: ["accountsChanged"],
    accountChangeTimeoutMs: 5000
  }),
  detect: {
    providerPaths: ["gatewallet.tron", "gatewallet.tronLink", "gatewallet.tronWeb"],
    provider: getGateInjectedProvider,
    availabilityProbe: hasGateInjectedMarker
  },
  requestMethods: ["eth_requestAccounts"]
};
