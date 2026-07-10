import { createTronLinkAdapter } from "@tron-wallet-kit/adapter-tronlink";
import type { WalletDescriptor } from "../types";

export const tronlink: WalletDescriptor = {
  id: "tronlink",
  name: "TronLink",
  integration: "custom",
  homepage: "https://www.tronlink.org/",
  platforms: ["extension", "mobile"],
  group: "featured",
  featured: 1,
  createAdapter: (config) => createTronLinkAdapter({ checkTimeoutMs: 800, ...config.tronlink })
};
