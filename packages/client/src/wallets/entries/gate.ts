import { hasGateInjectedMarker } from "../../injected/detect";
import type { WalletDescriptor } from "../types";

export const gate: WalletDescriptor = {
  id: "gate",
  name: "Gate Wallet",
  integration: "tronweb3-bridge",
  homepage: "https://www.gate.io/web3",
  platforms: ["extension"],
  group: "popular",
  availabilityTimeoutMs: 5000,
  availabilityProbe: hasGateInjectedMarker,
  importer: async () => {
    const mod = await import("@tronweb3/tronwallet-adapter-gatewallet");
    const globalObject = globalThis as Record<string, unknown>;
    if (!globalObject.window) globalObject.window = globalThis;
    return new mod.GateWalletAdapter({
      openAppWithDeeplink: false
    });
  },
};
