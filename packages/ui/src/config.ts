import { resolveMode, resolveTheme } from "./themes";
import { resolveLabelPack } from "./locales";
import type { ResolvedWalletUiConfig, WalletUiConfig } from "./types";

const FEATURED_DEFAULT_LIMIT = 5;
const FEATURED_MAX_LIMIT = 10;

export function resolveWalletUiConfig(config: WalletUiConfig = {}): ResolvedWalletUiConfig {
  const themeName = config.themeName ?? (resolveMode(config.themeMode ?? config.mode) === "dark" ? "dark" : "light");
  const featuredLimit = clampInteger(config.walletList?.featuredLimit ?? FEATURED_DEFAULT_LIMIT, 1, FEATURED_MAX_LIMIT);
  const featuredWallets = config.walletList?.featuredWallets?.slice(0, FEATURED_MAX_LIMIT);
  const labels = resolveLabelPack(config.locale, config.labels);
  return {
    theme: resolveTheme({ themeName, ...(config.customTheme ? { tokens: config.customTheme } : {}) }),
    labels,
    modal: {
      title: config.modal?.title ?? labels.connectModal.title,
      subtitle: config.modal?.subtitle ?? labels.connectModal.subtitle,
      width: config.modal?.width ?? "default",
      footerText: config.modal?.footerText ?? "TRON Wallet Kit",
      showCloseButton: config.modal?.showCloseButton ?? true,
      closeOnBackdropClick: config.modal?.closeOnBackdropClick ?? true,
      closeOnSelect: config.modal?.closeOnSelect ?? true,
      disableAnimations: config.modal?.disableAnimations ?? false,
      branding: {
        showPoweredBy: config.modal?.branding?.showPoweredBy ?? true,
        poweredByText: config.modal?.branding?.poweredByText ?? config.modal?.footerText ?? labels.connectModal.poweredBy
      }
    },
    qr: {
      size: config.qr?.size ?? 304,
      addressSize: config.qr?.addressSize ?? 264,
      margin: config.qr?.margin ?? 4,
      includeWalletLogo: config.qr?.includeWalletLogo ?? true,
      errorCorrectionLevel: config.qr?.errorCorrectionLevel ?? "M"
    },
    walletList: {
      layout: config.walletList?.layout ?? "list",
      wallets: config.walletList?.wallets ?? "all",
      disabledWallets: config.walletList?.disabledWallets ?? [],
      showUnavailable: config.walletList?.showUnavailable ?? true,
      featuredLimit,
      featuredWallets: featuredWallets ?? [],
      sortAvailableFirst: config.walletList?.sortAvailableFirst ?? true
    },
    accountPanel: {
      mode: config.accountPanel?.mode ?? "modal",
      copyAddress: config.accountPanel?.copyAddress ?? true,
      showAddressQr: config.accountPanel?.showAddressQr ?? true,
      showRecentTransactions: config.accountPanel?.showRecentTransactions ?? config.showRecentTransactions ?? true,
      disconnect: config.accountPanel?.disconnect ?? true,
      maxVisibleTransactions: config.accountPanel?.maxVisibleTransactions ?? config.maxVisibleTransactions ?? 3,
      explorerAccountUrl: config.accountPanel?.explorerAccountUrl ?? ""
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

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

export function createDefaultWalletUiConfig(config: WalletUiConfig = {}): ResolvedWalletUiConfig {
  return resolveWalletUiConfig(config);
}
