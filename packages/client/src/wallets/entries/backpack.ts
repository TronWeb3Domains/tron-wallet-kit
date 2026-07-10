import type { WalletDescriptor } from "../types";

export const backpack: WalletDescriptor = {
  id: "backpack",
  name: "Backpack",
  integration: "injected",
  homepage: "https://backpack.app/",
  platforms: ["extension"],
  group: "popular",
  detect: { providerPaths: ["backpack.tron", "backpack.tronLink"] }
};
