import { standardInjected } from "../../adapters/injected-strategy";
import type { WalletDescriptor } from "../types";

export const backpack: WalletDescriptor = {
  id: "backpack",
  name: "Backpack",
  integration: "injected",
  homepage: "https://backpack.app/",
  platforms: ["extension"],
  group: "popular",
  injected: standardInjected({ providerPaths: ["backpack.tron", "backpack.tronLink"] }),
  detect: { providerPaths: ["backpack.tron", "backpack.tronLink"] }
};
