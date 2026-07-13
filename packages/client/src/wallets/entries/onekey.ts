import { standardInjected } from "../../adapters/injected-strategy";
import type { WalletDescriptor } from "../types";

export const onekey: WalletDescriptor = {
  id: "onekey",
  name: "OneKey",
  integration: "injected",
  homepage: "https://onekey.so/",
  platforms: ["extension"],
  group: "popular",
  availabilityMode: "on-demand",
  injected: standardInjected({ providerPaths: ["$onekey.tron", "$onekey.tronLink"] }),
  detect: { providerPaths: ["$onekey.tron", "$onekey.tronLink"] }
};
