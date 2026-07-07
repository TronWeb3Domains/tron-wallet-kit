import { resolveMode, resolveTheme } from "./themes";
import type { ResolvedWalletUiConfig, WalletUiConfig } from "./types";

export function resolveWalletUiConfig(config: WalletUiConfig = {}): ResolvedWalletUiConfig {
  const themeName = config.themeName ?? (resolveMode(config.themeMode ?? config.mode) === "dark" ? "dark" : "light");
  return {
    theme: resolveTheme({ themeName, ...(config.customTheme ? { tokens: config.customTheme } : {}) }),
    modal: {
      title: config.modal?.title ?? "Connect wallet",
      subtitle: config.modal?.subtitle ?? "",
      width: config.modal?.width ?? "default",
      footerText: config.modal?.footerText ?? "TRON Wallet Kit"
    },
    walletList: {
      layout: config.walletList?.layout ?? "list",
      wallets: config.walletList?.wallets ?? "all",
      showUnavailable: config.walletList?.showUnavailable ?? true
    },
    accountPanel: {
      mode: config.accountPanel?.mode ?? "modal",
      copyAddress: config.accountPanel?.copyAddress ?? true,
      showAddressQr: config.accountPanel?.showAddressQr ?? true,
      showRecentTransactions: config.accountPanel?.showRecentTransactions ?? config.showRecentTransactions ?? true,
      disconnect: config.accountPanel?.disconnect ?? true
    },
    toast: config.toast
      ? {
          position: typeof config.toast === "object" ? config.toast.position ?? "bottom-right" : "bottom-right",
          maxVisible: typeof config.toast === "object" ? config.toast.maxVisible ?? 3 : 3,
          autoDismissMs: typeof config.toast === "object" ? config.toast.autoDismissMs ?? 5000 : 5000
        }
      : false
  };
}

export function createDefaultWalletUiConfig(config: WalletUiConfig = {}): ResolvedWalletUiConfig {
  return resolveWalletUiConfig(config);
}
