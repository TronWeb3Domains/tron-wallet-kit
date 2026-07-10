import { getGuardaInjectedProvider } from "../../injected/detect";
import type { WalletDescriptor } from "../types";

export const guarda: WalletDescriptor = {
  id: "guarda",
  name: "Guarda",
  integration: "injected",
  homepage: "https://guarda.com/",
  platforms: ["extension"],
  group: "popular",
  detect: { providerPaths: ["guarda.tron", "guarda"], provider: getGuardaInjectedProvider }
};
