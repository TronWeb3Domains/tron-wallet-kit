import type { WalletDescriptor } from "../types";

export const gate: WalletDescriptor = {
  id: "gate",
  name: "Gate Wallet",
  integration: "tronweb3-bridge",
  homepage: "https://www.gate.io/web3",
  platforms: ["extension"],
  group: "popular",
  injectedFallback: { providerPaths: ["gatewallet.tron", "gatewallet.tronLink"] },
  importer: async () => {
    const module = await import("@tronweb3/tronwallet-adapter-gatewallet");
    return new module.GateWalletAdapter();
  }
};
