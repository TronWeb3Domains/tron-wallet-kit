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
  addressTimeoutMs: 5000,
  addressSettleMs: 900,
  accountChangeEventNames: ["accountsChanged"],
  accountChangeTimeoutMs: 5000,
  detect: {
    providerPaths: ["gatewallet.tron", "gatewallet.tronLink", "gatewallet.tronWeb"],
    provider: getGateInjectedProvider,
    availabilityProbe: hasGateInjectedMarker
  },
  requestMethods: ["eth_requestAccounts"]
};
