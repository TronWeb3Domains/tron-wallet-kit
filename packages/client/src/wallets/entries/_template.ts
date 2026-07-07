import type { WalletDescriptor } from "../types";

/**
 * 1. Has @tronweb3/tronwallet-adapter-<id> -> integration: "tronweb3-bridge" + lazy importer.
 * 2. Injects a TRON provider only -> integration: "injected" + detect.
 * 3. Mobile-only via WalletConnect -> integration: "walletconnect".
 * 4. Heavy custom API -> integration: "custom" + createAdapter.
 */
export const myWallet: WalletDescriptor = {
  id: "mywallet",
  name: "My Wallet",
  integration: "injected",
  homepage: "https://example.com",
  platforms: ["extension"],
  group: "popular",
  detect: { providerPaths: ["myWallet.tron"] }
};
