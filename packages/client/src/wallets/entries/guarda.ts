import { getGuardaInjectedProvider } from "../../injected/detect";
import type { WalletDescriptor } from "../types";

export const guarda: WalletDescriptor = {
  id: "guarda",
  name: "Guarda",
  integration: "tronweb3-bridge",
  homepage: "https://guarda.com/",
  platforms: ["extension"],
  group: "popular",
  injectedFallback: { providerPaths: ["guarda.tron", "guarda"], provider: getGuardaInjectedProvider },
  importer: async () => {
    const module = await import("@tronweb3/tronwallet-adapter-guarda");
    return new module.GuardaAdapter();
  }
};
