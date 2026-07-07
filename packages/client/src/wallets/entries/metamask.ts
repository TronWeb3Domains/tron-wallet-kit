import { hasMetaMaskEthereumProvider } from "../../injected/detect";
import type { WalletDescriptor } from "../types";

export const metamask: WalletDescriptor = {
  id: "metamask",
  name: "MetaMask",
  integration: "tronweb3-bridge",
  homepage: "https://metamask.io/",
  platforms: ["extension"],
  group: "popular",
  signMessageMode: "messageObject",
  availabilityTimeoutMs: 3200,
  availabilityProbe: hasMetaMaskEthereumProvider,
  importer: async () => {
    const module = await import("@tronweb3/tronwallet-adapter-metamask-tron");
    return new module.MetaMaskAdapter();
  }
};
