import { resolveMode, resolveTheme } from "./themes";
import { resolveLabelPack } from "./locales";
import { TRON_WALLET_CATALOG } from "./wallet-catalog";
import type { ResolvedWalletUiConfig, WalletListLayout, WalletUiConfig } from "./types";

const FEATURED_DEFAULT_LIMIT = 5;

export function resolveWalletUiConfig(config: WalletUiConfig = {}): ResolvedWalletUiConfig {
  const themeName = config.themeName ?? (resolveMode(config.themeMode ?? config.mode) === "dark" ? "dark" : "light");
  const customTheme = {
    ...(config.accent ? { accent: config.accent, focusRing: config.accent } : {}),
    ...(config.fontFamily ? { fontFamily: config.fontFamily } : {}),
    ...(config.customTheme ?? {})
  };
  const featuredLimit = normalizeDeprecatedFeaturedLimit(config.walletList?.featuredLimit);
  const featuredWallets = config.walletList?.featuredWallets;
  const labels = resolveLabelPack(config.locale, config.labels);
  return {
    theme: resolveTheme({ themeName, ...(Object.keys(customTheme).length > 0 ? { tokens: customTheme } : {}) }),
    labels,
    catalog: config.catalog ?? TRON_WALLET_CATALOG,
    modal: {
      title: config.modal?.title ?? labels.connectModal.title,
      subtitle: config.modal?.subtitle ?? labels.connectModal.subtitle,
      width: config.modal?.width ?? "default",
      footerText: config.modal?.footerText ?? "TRON Wallet Kit",
      showCloseButton: config.modal?.showCloseButton ?? true,
      closeOnBackdropClick: config.modal?.closeOnBackdropClick ?? true,
      closeOnSelect: config.modal?.closeOnSelect ?? true,
      disableAnimations: config.modal?.disableAnimations ?? false,
      onModalOpen: config.modal?.onModalOpen ?? (() => undefined),
      onModalClose: config.modal?.onModalClose ?? (() => undefined),
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
      layout: normalizeWalletListLayout(config.walletList?.layout),
      featuredMode: config.walletList?.featuredMode ?? "installed-first",
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

function normalizeWalletListLayout(layout: WalletListLayout | undefined): "list" | "card" {
  if (layout === "card" || layout === "grid") return "card";
  return "list";
}

function normalizeDeprecatedFeaturedLimit(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return FEATURED_DEFAULT_LIMIT;
  return Math.max(1, Math.trunc(value));
}

export function createDefaultWalletUiConfig(config: WalletUiConfig = {}): ResolvedWalletUiConfig {
  return resolveWalletUiConfig(config);
}
