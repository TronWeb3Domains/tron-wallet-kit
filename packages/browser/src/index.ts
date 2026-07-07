export * from "@tron-wallet-kit/core";
export * from "@tron-wallet-kit/client";
export * from "@tron-wallet-kit/ui";
export { createTronLinkAdapter, TronLinkAdapter } from "@tron-wallet-kit/adapter-tronlink";
export type { TronLinkAdapterOptions } from "@tron-wallet-kit/adapter-tronlink";
export { createWalletConnectAdapter, WalletConnectAdapter } from "@tron-wallet-kit/adapter-walletconnect";
export type { WalletConnectAdapterOptions, WalletConnectNetworkName } from "@tron-wallet-kit/adapter-walletconnect";

import { createWalletKit, type WalletClientConfig, type WalletKit } from "@tron-wallet-kit/client";
import { applyThemeToElement, ensureWalletKitStyles, type ThemeConfig } from "@tron-wallet-kit/ui";

export type BrowserKitConfig = WalletClientConfig & {
  theme?: ThemeConfig;
  root?: HTMLElement;
};

export function createBrowserKit(config: BrowserKitConfig = {}): WalletKit & { root?: HTMLElement } {
  const kit = createWalletKit(config);
  const root = config.root ?? globalThis.document?.body;

  if (root) {
    root.dataset.twkRoot = "true";
    root.classList.add("twk-root");
    applyThemeToElement(root, config.theme);
  }

  if (globalThis.document) ensureWalletKitStyles(globalThis.document);

  return { ...kit, root };
}
