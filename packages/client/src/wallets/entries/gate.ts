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
  addressTimeoutMs: 15000,
  addressSettleMs: 800,
  accountChangeEventNames: ["accountsChanged", "accountChanged", "connect"],
  accountChangeTimeoutMs: 5000,
  emptyAddressRetryDelayMs: 300,
  emptyAddressRetryTimeoutMs: 3000,
  // Gate exposes tronWeb.defaultAddress even before an explicit dapp request, and calling
  // request() again while already exposing an account hangs / returns code 4000 (their own
  // adapter documents this). So prefer the injected address and skip request().
  preferInjectedAddress: true,
  detect: {
    providerPaths: ["gatewallet.tronWeb", "gatewallet.tron", "gatewallet.tronLink"],
    provider: getGateInjectedProvider,
    availabilityProbe: hasGateInjectedMarker
  },
  // Gate browser extension authorizes via eth_requestAccounts only; tron_requestAccounts is the
  // in-app (mobile) method and calling it on the extension can trigger internal errors.
  requestMethods: ["eth_requestAccounts"]
};
