import type { WalletDescriptor } from "../types";

export const onekey: WalletDescriptor = {
  id: "onekey",
  name: "OneKey",
  integration: "injected",
  homepage: "https://onekey.so/",
  platforms: ["extension"],
  group: "popular",
  detect: { providerPaths: ["$onekey.tron", "$onekey.tronLink"] }
};
