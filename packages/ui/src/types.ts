import type { WalletAccount, WalletKitErrorMessageCatalog, WalletPlatform } from "@tron-wallet-kit/core";

export type ThemeName =
  | "default"
  | "light"
  | "dark"
  | "tron"
  | "tron-energy"
  | "nile"
  | "shasta"
  | "bandwidth"
  | "energy"
  | "sun"
  | "graphite"
  | "midnight"
  | "ocean"
  | "glass"
  | "rounded"
  | "crisp"
  | "soft"
  | "neon"
  | "terminal"
  | "minimal"
  | "highContrast";

export type ThemeTokens = {
  colorScheme: "light" | "dark";
  fontFamily: string;
  radius: string;
  walletRadius: string;
  walletIconRadius: string;
  shadow: string;
  backdrop: string;
  backdropBlur: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  surfaceHover: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  success: string;
  warning: string;
  danger: string;
  focusRing: string;
  spinnerTrail: string;
  badgeInstalledBackground: string;
  badgeInstalledText: string;
  badgeQrBackground: string;
  badgeQrText: string;
  badgeRecentBackground: string;
  badgeRecentText: string;
  badgeMutedBackground: string;
  badgeMutedText: string;
  fallbackIconBackground: string;
  fallbackIconColor: string;
  qrForeground: string;
  qrBackground: string;
};

export type UiMode = "light" | "dark" | "auto";

export type ThemeConfig = {
  mode?: UiMode;
  themeMode?: UiMode;
  themeName?: ThemeName;
  accent?: string;
  fontFamily?: string;
  tokens?: Partial<ThemeTokens>;
};

export type WalletListLayout = "list" | "card" | "grid";
export type FeaturedWalletMode = "manual" | "installed-first" | "installed-only";
export type AccountPanelMode = "inline" | "modal";
export type ToastPosition = "bottom-right" | "bottom-left" | "bottom-center";
export type WalletKitLocale = "en" | "vi" | (string & {});
export type WalletEnvironmentKind = "desktop-extension" | "mobile-in-app" | "mobile-browser";

export type WalletEnvironment = {
  kind: WalletEnvironmentKind;
  isMobile: boolean;
  hasInjected: boolean;
};

export type WalletListConfig = {
  layout?: WalletListLayout;
  featuredMode?: FeaturedWalletMode;
  wallets?: "all" | string[];
  disabledWallets?: string[];
  showUnavailable?: boolean;
  /** @deprecated Featured wallets are no longer capped; kept for pre-1.0 compatibility. */
  featuredLimit?: number;
  featuredWallets?: string[];
  sortAvailableFirst?: boolean;
};

export type TronWalletCatalogItem = {
  id: string;
  name: string;
  enabled?: boolean;
  group?: string;
  transport?: "extension" | "walletconnect" | "qr" | "hardware" | "mobile" | "embedded" | string;
  platforms: readonly WalletPlatform[];
  homepage?: string;
  downloadUrl?: string;
  icon?: string;
  adapterId?: string;
  providerPaths?: readonly string[];
  conflictMarkers?: readonly string[];
  mobileDeepLink?: {
    scheme: string;
    urlTemplate?: string;
  };
  supportsWalletConnect?: boolean;
  featured?: number;
  badge?: WalletOptionViewModel["badge"];
};

export type WalletUiConfig = {
  themeMode?: UiMode;
  mode?: UiMode;
  themeName?: ThemeName;
  accent?: string;
  fontFamily?: string;
  customTheme?: Partial<ThemeTokens>;
  locale?: WalletKitLocale;
  labels?: WalletUiLabels;
  catalog?: readonly TronWalletCatalogItem[];
  showRecentTransactions?: boolean;
  maxVisibleTransactions?: number;
  modal?: {
    title?: string;
    subtitle?: string;
    width?: "default" | "wide";
    footerText?: string;
    showCloseButton?: boolean;
    closeOnBackdropClick?: boolean;
    closeOnSelect?: boolean;
    disableAnimations?: boolean;
    onModalOpen?: () => void;
    onModalClose?: () => void;
    branding?: {
      showPoweredBy?: boolean;
      poweredByText?: string;
    };
  };
  qr?: {
    size?: number;
    addressSize?: number;
    margin?: number;
    includeWalletLogo?: boolean;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  };
  walletList?: WalletListConfig;
  accountPanel?: {
    mode?: AccountPanelMode;
    copyAddress?: boolean;
    showAddressQr?: boolean;
    showRecentTransactions?: boolean;
    disconnect?: boolean;
    maxVisibleTransactions?: number;
    explorerAccountUrl?: string;
  };
  toast?:
    | boolean
    | {
        position?: ToastPosition;
        maxVisible?: number;
        autoDismissMs?: number;
      };
};

export type ResolvedTheme = {
  name: ThemeName;
  tokens: ThemeTokens;
};

export type ResolvedWalletUiConfig = {
  theme: ResolvedTheme;
  labels: WalletKitLabelPack;
  catalog: readonly TronWalletCatalogItem[];
  modal: Required<NonNullable<WalletUiConfig["modal"]>>;
  qr: Required<NonNullable<WalletUiConfig["qr"]>>;
  walletList: Required<NonNullable<WalletUiConfig["walletList"]>>;
  accountPanel: Required<NonNullable<WalletUiConfig["accountPanel"]>>;
  toast: false | {
    position: ToastPosition;
    maxVisible: number;
    autoDismissMs: number;
  };
};

export type WalletOptionViewModel = {
  id: string;
  adapterId?: string;
  name: string;
  icon?: string;
  homepage?: string;
  downloadUrl?: string;
  group?: string;
  transport?: "extension" | "walletconnect" | "qr" | "hardware" | "mobile" | "embedded" | string;
  platforms?: readonly WalletPlatform[];
  providerPaths?: readonly string[];
  conflictMarkers?: readonly string[];
  mobileDeepLink?: {
    scheme: string;
    urlTemplate?: string;
  };
  supportsWalletConnect?: boolean;
  featured?: number;
  available?: boolean;
  readyState?: "found" | "notFound" | "unsupported" | "loading";
  status?: "idle" | "connecting" | "connected" | "error";
  capabilities?: readonly string[];
  disabledReason?: string;
  badge?: {
    label: string;
    tone?: "installed" | "qr" | "recent" | "tron" | "muted";
  };
};

export type ConnectModalLabels = {
  title: string;
  subtitle: string;
  allWallets: string;
  back: string;
  close: string;
  connecting: string;
  continueInWallet: string;
  acceptRequest: string;
  tryAgain: string;
  getWallet: string;
  searchWallet: string;
  searchPlaceholder: string;
  noWalletsFound: string;
  poweredBy: string;
  unavailable: string;
  ready: string;
  installed: string;
  notInstalled: string;
  qrCode: string;
  tron: string;
  scanQr: string;
  dontHave: string;
  checking: string;
  connectionDeclined: string;
  copyLink: string;
  qrRenderFailed: string;
};

export type ConnectModalView = "featured" | "all-wallets" | "connecting" | "qr";

export type ConnectModalViewModel = {
  labels?: Partial<ConnectModalLabels>;
  wallets: readonly WalletOptionViewModel[];
  catalog?: readonly TronWalletCatalogItem[];
  view?: ConnectModalView;
  networkName?: string;
  networkType?: string;
  selectedWalletId?: string;
  activeWalletId?: string;
  searchQuery?: string;
  qrUri?: string;
  qrImageSrc?: string;
  qrRenderState?: "error";
  qrCopyState?: "idle" | "copied";
  retryState?: "idle" | "busy";
  errorTitle?: string;
  errorMessage?: string;
  errorMessages?: WalletKitErrorMessageCatalog;
  showCloseButton?: boolean;
  showPoweredBy?: boolean;
  poweredByText?: string;
  walletsLoading?: boolean;
  walletList?: WalletListConfig;
  walletEnvironment?: WalletEnvironment;
};

export type RecentTransactionViewModel = {
  id: string;
  label: string;
  status: "pending" | "success" | "failed" | "unknown";
  txHash?: string;
  timestamp?: string;
  explorerUrl?: string;
};

export type AccountPanelLabels = {
  title: string;
  addressTitle: string;
  back: string;
  close: string;
  copy: string;
  copied: string;
  disconnect: string;
  explorer: string;
  showQr: string;
  lightQr: string;
  noTransactions: string;
  recentTransactions: string;
  qrAlt: string;
};

export type DisplayWalletAccount = WalletAccount & {
  domain?: string;
  displayName?: string;
};

export type AccountPanelViewModel = {
  labels?: Partial<AccountPanelLabels>;
  account: DisplayWalletAccount;
  networkName?: string;
  balanceTrx?: string;
  identityLoading?: boolean;
  balanceLoading?: boolean;
  addressQr?: {
    src: string;
    alt?: string;
  };
  explorerUrl?: string;
  showExplorerButton?: boolean;
  copyState?: "idle" | "copied";
  recentTransactions?: readonly RecentTransactionViewModel[];
  transactionsLoading?: boolean;
  maxVisibleTransactions?: number;
  showRecentTransactions?: boolean;
  showSendButton?: boolean;
  showDisconnectButton?: boolean;
  showAddressQrButton?: boolean;
};

export type AddressQrPanelViewModel = {
  labels?: Partial<AccountPanelLabels>;
  address: string;
  qrImageSrc?: string;
  copyState?: "idle" | "copied";
};

export type WalletButtonLabels = {
  connect: string;
  connecting: string;
  openAccount: string;
};

export type ToastLabels = {
  txSubmitted: string;
  txConfirmed: string;
  txFailed: string;
  viewOnExplorer: string;
  dismiss: string;
};

export type WalletKitLabelPack = {
  connectModal: ConnectModalLabels;
  accountPanel: AccountPanelLabels;
  walletButton: WalletButtonLabels;
  toast: ToastLabels;
  errors: WalletKitErrorMessageCatalog;
};

export type WalletUiLabels = {
  connectModal?: Partial<ConnectModalLabels>;
  accountPanel?: Partial<AccountPanelLabels>;
  walletButton?: Partial<WalletButtonLabels>;
  toast?: Partial<ToastLabels>;
  errors?: WalletKitErrorMessageCatalog;
};

export type WalletButtonViewModel = {
  labels?: Partial<WalletButtonLabels>;
  status?: "disconnected" | "connecting" | "connected";
  label?: string;
  connectedLabel?: string;
  address?: string;
  balanceTrx?: string;
  adapterIcon?: string;
  adapterName?: string;
  showAdapterIcon?: boolean;
  showChevron?: boolean;
  showBalance?: boolean;
  identityLoading?: boolean;
  balanceLoading?: boolean;
  hasPendingTransactions?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "pill" | "minimal";
};

export type QrCodeOptions = {
  width?: number;
  margin?: number;
  foreground?: string;
  background?: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
};

export type TransactionToastViewModel = {
  labels?: Partial<ToastLabels>;
  id: string;
  label: string;
  status: "pending" | "success" | "failed" | "unknown";
  txHash?: string;
  explorerUrl?: string;
};

export interface WalletModal {
  open(): void;
  close(): void;
  mount(target?: HTMLElement): void;
  setTheme(config: ThemeConfig): void;
  destroy(): void;
}

export interface WalletInline {
  mount(target: HTMLElement | string): void;
  setTheme(config: ThemeConfig): void;
  destroy(): void;
}

export interface WalletButton {
  mount(target: HTMLElement | string): void;
  setTheme(config: ThemeConfig): void;
  destroy(): void;
}

export interface WalletToast {
  mount(target?: HTMLElement): void;
  setTheme(config: ThemeConfig): void;
  destroy(): void;
}
