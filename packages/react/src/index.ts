import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { createWalletAuth, type TronAuthAdapter, type TronAuthController, type TronAuthControllerOptions, type TronAuthState } from "@tron-wallet-kit/auth";
import { createWalletKit, type TronIdentity, type WalletClientConfig, type WalletKit } from "@tron-wallet-kit/client";
import type { SignMessageRequest, SignMessageResult, WalletAccount, WalletCapabilities, WalletNetworkId, WalletSession } from "@tron-wallet-kit/core";
import { copyToClipboard, createAccountPanelHtml, createAddressQrPanelHtml, createConnectModalHtml, createStyledQrDataUrl, createThemeStyleProperties, createTransactionHistoryPanelHtml, createWalletButtonHtml, ensureWalletKitStyles, mapAdapterToWalletOption, mergeWalletOptionsWithCatalog, QR_FALLBACK_DARK, resolveSessionWalletMetadata, shortenAddress, type AccountPanelViewModel, type ConnectModalViewModel, type ThemeConfig, type WalletButtonViewModel } from "@tron-wallet-kit/ui";
import type { WalletAvailability } from "@tron-wallet-kit/ui";

export type WalletStatus = "disconnected" | "connecting" | "connected";

export type TronWalletProviderProps = WalletClientConfig & {
  kit?: WalletKit;
  children?: ReactNode;
  clearStoredSessionOnAutoReconnectDisabled?: boolean;
  authenticationAdapter?: TronAuthAdapter;
  authenticationOptions?: TronAuthControllerOptions;
  authenticationController?: TronAuthController;
};

export type TronKitProviderProps = {
  config?: WalletClientConfig;
  kit?: WalletKit;
  theme?: TronKitProviderTheme;
  children?: ReactNode;
  clearStoredSessionOnAutoReconnectDisabled?: boolean;
  authenticationAdapter?: TronAuthAdapter;
  authenticationOptions?: TronAuthControllerOptions;
  authenticationController?: TronAuthController;
};

export type AdaptiveThemeConfig = {
  light: ThemeConfig;
  dark: ThemeConfig;
};

export type TronKitProviderTheme = ThemeConfig | AdaptiveThemeConfig;

export type ThemeFactoryOptions = Partial<ThemeConfig["tokens"]> & {
  accentColor?: string;
  accentColorForeground?: string;
  borderRadius?: "none" | "small" | "medium" | "large";
  fontStack?: "system" | "rounded";
  tokens?: ThemeConfig["tokens"];
};

export type DefaultTronKitConfig = Omit<WalletClientConfig, "network" | "walletConnectNetwork" | "walletConnectProjectId" | "appName"> & {
  /** @deprecated Prefer `metadata.name` for production integrations. */
  appName?: string;
  network?: WalletNetworkId | WalletClientConfig["network"];
  walletConnectProjectId?: string;
  walletConnectNetwork?: WalletClientConfig["walletConnectNetwork"];
};

export type TronConnectButtonProps = Omit<WalletButtonProps, "connectedLabel"> & {
  accountStatus?: "full" | "avatar" | "address";
  chainStatus?: "full" | "icon" | "none";
};

export type TronAccountState = {
  address?: string;
  account: WalletAccount | null;
  session: WalletSession | null;
  status: WalletStatus;
  isConnected: boolean;
  isConnecting: boolean;
  displayName?: string;
};

export type TronConnectState = {
  wallets: ReturnType<WalletKit["manager"]["getWallets"]>;
  connect(walletId?: string): Promise<WalletSession | void>;
  openConnectModal(): void;
  closeConnectModal(): void;
  status: WalletStatus;
};

export type TronBalanceState = {
  balance: WalletSession["balance"] | undefined;
  data: WalletSession["balance"] | undefined;
  isLoading: boolean;
  refresh(): Promise<WalletSession["balance"] | undefined>;
};

export type SignMessageState = {
  signMessage(request: string | SignMessageRequest): Promise<SignMessageResult>;
  isPending: boolean;
};

export type TrxNameState = {
  name?: string;
  identity?: TronIdentity;
  isLoading: boolean;
  refresh(): Promise<TronIdentity | undefined>;
};

export type TronAuthHookState = TronAuthState & {
  signIn(): Promise<TronAuthState>;
  signOut(): void;
  isAvailable: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export type AccountModalState = {
  openAccountModal?: () => void;
  closeAccountModal?: () => void;
  accountModalOpen: boolean;
};

type InternalAccountModalState = AccountModalState & {
  setAccountModalOpen?: (open: boolean) => void;
};

export type ConnectModalProps = Omit<ConnectModalViewModel, "wallets"> & {
  open?: boolean;
  theme?: ThemeConfig;
};

export type AccountPanelProps = Partial<AccountPanelViewModel> & {
  open?: boolean;
  theme?: ThemeConfig;
};

export type WalletButtonProps = Omit<WalletButtonViewModel, "status" | "address" | "adapterIcon" | "adapterName"> & {
  theme?: ThemeConfig;
  onClick?: () => void;
  accountPanelMode?: "dropdown" | "modal";
  accountPanelOpen?: boolean;
  onAccountPanelOpenChange?: (open: boolean) => void;
  showRecentTransactions?: boolean;
  maxVisibleTransactions?: number;
  explorerAccountUrl?: string;
};

type WalletButtonAccountPanelModel = {
  kit: WalletKit;
  session: WalletSession;
  displayName?: string;
  balanceTrx?: string;
  identityLoading: boolean;
  balanceLoading: boolean;
  copyState: "idle" | "copied";
  mode: "dropdown" | "modal";
  view: "account" | "address-qr" | "tx-history";
  showRecentTransactions?: boolean;
  maxVisibleTransactions?: number;
  explorerAccountUrl?: string;
  addressQrSrc?: string;
};

const WalletKitContext = createContext<WalletKit | null>(null);
const AccountModalContext = createContext<InternalAccountModalState>({ accountModalOpen: false });
const ThemeContext = createContext<ThemeConfig | undefined>(undefined);
const AuthContext = createContext<TronAuthController | null>(null);

export function getDefaultConfig(config: DefaultTronKitConfig): WalletClientConfig {
  const walletConnectProjectId = config.walletConnectProjectId?.trim();
  const network = config.network ?? "mainnet";
  const {
    walletConnectProjectId: _walletConnectProjectId,
    walletConnectNetwork: _walletConnectNetwork,
    network: _network,
    ...baseConfig
  } = config;
  const appName = config.appName ?? config.metadata?.name;
  const resolved: WalletClientConfig = {
    ...baseConfig,
    ...(appName ? { appName } : {}),
    network,
    useBrowserStorage: config.useBrowserStorage ?? true,
    autoReconnect: config.autoReconnect ?? false,
    ui: {
      toast: true,
      ...config.ui,
      accountPanel: {
        mode: "modal",
        showRecentTransactions: true,
        ...config.ui?.accountPanel
      },
      walletList: {
        featuredMode: "installed-first",
        sortAvailableFirst: true,
        ...config.ui?.walletList
      }
    }
  };
  if (walletConnectProjectId) resolved.walletConnectProjectId = walletConnectProjectId;
  if (config.walletConnectNetwork) {
    resolved.walletConnectNetwork = config.walletConnectNetwork;
  } else if (typeof network === "string") {
    resolved.walletConnectNetwork = network;
  }
  return resolved;
}

export function lightTheme(options?: ThemeFactoryOptions): ThemeConfig {
  return createFactoryTheme("light", options);
}

export function darkTheme(options?: ThemeFactoryOptions): ThemeConfig {
  return createFactoryTheme("dark", options);
}

function createFactoryTheme(themeName: "light" | "dark", options: ThemeFactoryOptions = {}): ThemeConfig {
  const {
    accentColor,
    accentColorForeground,
    borderRadius,
    fontStack,
    tokens,
    ...tokenOverrides
  } = options;
  const resolvedTokens: ThemeConfig["tokens"] = {
    ...tokenOverrides,
    ...tokens
  };
  if (accentColor) {
    resolvedTokens.accent = accentColor;
    resolvedTokens.focusRing = accentColor;
  }
  if (accentColorForeground) resolvedTokens.accentText = accentColorForeground;
  const radius = resolveFactoryRadius(borderRadius);
  if (radius) {
    resolvedTokens.radius = radius.modal;
    resolvedTokens.walletRadius = radius.wallet;
    resolvedTokens.walletIconRadius = radius.icon;
  }
  const fontFamily = resolveFactoryFont(fontStack);
  if (fontFamily) resolvedTokens.fontFamily = fontFamily;
  return Object.keys(resolvedTokens).length > 0 ? { themeName, tokens: resolvedTokens } : { themeName };
}

function resolveFactoryRadius(borderRadius: ThemeFactoryOptions["borderRadius"]): { modal: string; wallet: string; icon: string } | undefined {
  switch (borderRadius) {
    case "none":
      return { modal: "0px", wallet: "0px", icon: "0px" };
    case "small":
      return { modal: "8px", wallet: "6px", icon: "5px" };
    case "medium":
      return { modal: "16px", wallet: "12px", icon: "10px" };
    case "large":
      return { modal: "24px", wallet: "18px", icon: "14px" };
    default:
      return undefined;
  }
}

function resolveFactoryFont(fontStack: ThemeFactoryOptions["fontStack"]): string | undefined {
  if (fontStack === "rounded") {
    return '"Nunito Sans", Inter, ui-rounded, "SF Pro Rounded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  }
  if (fontStack === "system") {
    return 'Inter, "Inter var", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  }
  return undefined;
}

function useResolvedProviderTheme(theme: TronKitProviderTheme | undefined): ThemeConfig | undefined {
  const prefersDark = usePrefersDarkMode();
  return useMemo(() => {
    if (!theme) return undefined;
    if (isAdaptiveTheme(theme)) return prefersDark ? theme.dark : theme.light;
    return theme;
  }, [prefersDark, theme]);
}

function isAdaptiveTheme(theme: TronKitProviderTheme): theme is AdaptiveThemeConfig {
  return typeof theme === "object" && theme !== null && "light" in theme && "dark" in theme;
}

function usePrefersDarkMode(): boolean {
  const [prefersDark, setPrefersDark] = useState(() => {
    if (typeof globalThis.matchMedia !== "function") return false;
    return globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (typeof globalThis.matchMedia !== "function") return undefined;
    const media = globalThis.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setPrefersDark(media.matches);
    onChange();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }
    media.addListener?.(onChange);
    return () => media.removeListener?.(onChange);
  }, []);

  return prefersDark;
}

export function TronKitProvider(props: TronKitProviderProps) {
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const theme = useResolvedProviderTheme(props.theme);
  const config = useMemo<WalletClientConfig>(() => {
    const base = props.config ?? {};
    if (!theme) return base;
    const themedUi = {
      ...base.ui,
      ...theme
    };
    if (theme.tokens) themedUi.customTheme = theme.tokens;
    return {
      ...base,
      ui: themedUi
    };
  }, [props.config, theme]);

  const accountModal = useMemo<InternalAccountModalState>(
    () => ({
      accountModalOpen,
      setAccountModalOpen,
      openAccountModal: () => setAccountModalOpen(true),
      closeAccountModal: () => setAccountModalOpen(false)
    }),
    [accountModalOpen]
  );

  return createElement(
    AccountModalContext.Provider,
    { value: accountModal },
    createElement(
      ThemeContext.Provider,
      { value: theme },
      createElement(
        TronWalletProvider,
        {
          ...config,
          ...(props.kit ? { kit: props.kit } : {}),
          ...(props.clearStoredSessionOnAutoReconnectDisabled !== undefined
            ? { clearStoredSessionOnAutoReconnectDisabled: props.clearStoredSessionOnAutoReconnectDisabled }
            : {}),
          ...(props.authenticationAdapter ? { authenticationAdapter: props.authenticationAdapter } : {}),
          ...(props.authenticationOptions ? { authenticationOptions: props.authenticationOptions } : {}),
          ...(props.authenticationController ? { authenticationController: props.authenticationController } : {})
        },
        props.children
      )
    )
  );
}

export function TronWalletProvider(props: TronWalletProviderProps) {
  const kitRef = useRef<WalletKit | null>(null);
  const ownsKitRef = useRef(false);
  if (!kitRef.current || (props.kit && kitRef.current !== props.kit)) {
    kitRef.current = props.kit ?? createWalletKit(props);
    ownsKitRef.current = !props.kit;
  }
  const kit = kitRef.current;
  const authControllerRef = useRef<TronAuthController | null>(null);
  const ownsAuthControllerRef = useRef(false);
  const authAdapterRef = useRef<TronAuthAdapter | undefined>(undefined);
  const authOptionsRef = useRef<TronAuthControllerOptions | undefined>(undefined);
  if (props.authenticationController) {
    if (authControllerRef.current !== props.authenticationController) {
      if (ownsAuthControllerRef.current) authControllerRef.current?.destroy();
      authControllerRef.current = props.authenticationController;
      ownsAuthControllerRef.current = false;
      authAdapterRef.current = undefined;
      authOptionsRef.current = undefined;
    }
  } else if (props.authenticationAdapter) {
    const shouldCreateAuthController =
      !authControllerRef.current ||
      !ownsAuthControllerRef.current ||
      authAdapterRef.current !== props.authenticationAdapter ||
      authOptionsRef.current !== props.authenticationOptions;
    if (shouldCreateAuthController) {
      if (ownsAuthControllerRef.current) authControllerRef.current?.destroy();
      authControllerRef.current = createWalletAuth(kit.manager, props.authenticationAdapter, props.authenticationOptions);
      ownsAuthControllerRef.current = true;
      authAdapterRef.current = props.authenticationAdapter;
      authOptionsRef.current = props.authenticationOptions;
    }
  } else if (authControllerRef.current) {
    if (ownsAuthControllerRef.current) authControllerRef.current.destroy();
    authControllerRef.current = null;
    ownsAuthControllerRef.current = false;
    authAdapterRef.current = undefined;
    authOptionsRef.current = undefined;
  }
  const authController = authControllerRef.current;
  useEffect(() => {
    if (kit.manager.config.autoReconnect) {
      void kit.manager.autoReconnect();
    } else if (props.clearStoredSessionOnAutoReconnectDisabled) {
      void kit.manager.clearStoredSession();
    }
    return () => {
      if (ownsAuthControllerRef.current) {
        authControllerRef.current?.destroy();
        authControllerRef.current = null;
      }
      if (ownsKitRef.current) {
        kit.destroy();
        kitRef.current = null;
      } else {
        kit.manager.destroy();
      }
    };
  }, [kit]);
  const children = authController
    ? createElement(
        AuthContext.Provider,
        { value: authController },
        props.children,
        createElement(TronAuthPrompt, { controller: authController })
      )
    : props.children;
  return createElement(WalletKitContext.Provider, { value: kit }, children);
}

export const TronWalletKitProvider = TronWalletProvider;

function TronAuthPrompt(props: { controller: TronAuthController }) {
  const providerTheme = useContext(ThemeContext);
  const session = useWalletSession();
  const state = useSyncExternalStore(
    (onStoreChange) => props.controller.subscribe(onStoreChange),
    () => props.controller.getState(),
    () => props.controller.getState()
  );
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const sessionKey = session ? `${session.adapterId}:${session.account.address}:${session.network.id}` : "";
  useWalletKitStyles();

  useEffect(() => {
    setDismissedFor(null);
  }, [sessionKey]);

  if (!session || state.status === "authenticated" || dismissedFor === sessionKey) return null;

  const loading = state.status === "loading";
  const errorMessage = state.status === "error" ? formatReactAuthError(state.error) : "";
  const signIn = () => {
    void props.controller.signIn();
  };

  return createElement(
    "div",
    {
      className: "twk-root",
      "data-twk-root": "true",
      style: useThemeStyle(providerTheme)
    },
    createElement(
      "div",
      {
        className: "twk-button-panel-overlay",
        "data-twk-auth-panel": "true"
      },
      createElement(
        "section",
        {
          className: "twk-account-panel twk-auth-panel",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "twk-auth-title",
          tabIndex: -1
        },
        createElement(
          "header",
          { className: "twk-header" },
          createElement("span", { className: "twk-header-spacer", "aria-hidden": "true" }),
          createElement(
            "div",
            { className: "twk-header-main" },
            createElement("h2", { className: "twk-title", id: "twk-auth-title" }, "Sign in with TRON")
          ),
          createElement(
            "button",
            {
              className: "twk-close",
              type: "button",
              "aria-label": "Close sign-in prompt",
              onClick: () => setDismissedFor(sessionKey)
            },
            createElement("span", { "aria-hidden": "true" }, "×")
          )
        ),
        createElement(
          "div",
          { className: "twk-body twk-auth-body" },
          createElement("p", { className: "twk-transaction-preview-summary" }, "Sign a message to prove ownership of this TRON account."),
          createElement(
            "dl",
            { className: "twk-transaction-preview-details" },
            createElement(
              "div",
              { className: "twk-transaction-preview-detail" },
              createElement("dt", null, "Wallet"),
              createElement("dd", null, session.walletName)
            ),
            createElement(
              "div",
              { className: "twk-transaction-preview-detail" },
              createElement("dt", null, "Account"),
              createElement("dd", null, session.account.domain ?? shortenAddress(session.account.address))
            )
          ),
          errorMessage ? createElement("div", { className: "twk-status", "data-tone": "danger" }, errorMessage) : null,
          createElement(
            "div",
            { className: "twk-transaction-preview-footer twk-auth-actions" },
            createElement(
              "button",
              {
                className: "twk-action",
                type: "button",
                disabled: loading,
                onClick: () => setDismissedFor(sessionKey)
              },
              "Not now"
            ),
            createElement(
              "button",
              {
                className: "twk-action",
                "data-tone": "primary",
                type: "button",
                disabled: loading,
                "data-busy": loading ? "true" : undefined,
                onClick: signIn
              },
              loading ? "Signing..." : "Sign in"
            )
          )
        )
      )
    )
  );
}

function formatReactAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "Authentication failed.";
  return message.length > 160 ? `${message.slice(0, 157)}...` : message;
}

export function useWalletKit(): WalletKit {
  const kit = useContext(WalletKitContext);
  if (!kit) throw new Error("useWalletKit must be used within TronWalletProvider.");
  return kit;
}

export const useTronKit = useWalletKit;

export function useTronAuth(): TronAuthHookState {
  const controller = useContext(AuthContext);
  const state = useSyncExternalStore(
    (onStoreChange) => {
      if (!controller) return () => undefined;
      return controller.subscribe(onStoreChange);
    },
    () => controller?.getState() ?? ({ status: "unauthenticated" } satisfies TronAuthState),
    () => controller?.getState() ?? ({ status: "unauthenticated" } satisfies TronAuthState)
  );
  return {
    ...state,
    signIn: () => controller?.signIn() ?? Promise.resolve({ status: "error", error: new Error("Authentication is not configured.") }),
    signOut: () => controller?.signOut(),
    isAvailable: Boolean(controller),
    isLoading: state.status === "loading",
    isAuthenticated: state.status === "authenticated"
  };
}

export function useTronAccount(): TronAccountState {
  const session = useWalletSession();
  const status = useWalletStatus();
  const displayName = session?.account.domain ?? session?.account.displayName ?? (session?.account.address ? shortenAddress(session.account.address) : undefined);
  return {
    ...(session?.account.address ? { address: session.account.address } : {}),
    account: session?.account ?? null,
    session,
    status,
    isConnected: status === "connected",
    isConnecting: status === "connecting",
    ...(displayName ? { displayName } : {})
  };
}

export function useTronConnect(): TronConnectState {
  const kit = useWalletKit();
  const status = useWalletStatus();
  const wallets = useManagerSnapshot(kit, () => kit.manager.getWallets());
  const openConnectModal = useCallback(() => kit.openModal(), [kit]);
  const closeConnectModal = useCallback(() => kit.closeModal(), [kit]);
  const connect = useCallback(
    async (walletId?: string) => {
      if (!walletId) {
        kit.openModal();
        return undefined;
      }
      return kit.manager.connect(walletId);
    },
    [kit]
  );
  return { wallets, connect, openConnectModal, closeConnectModal, status };
}

export function useTronDisconnect() {
  const kit = useWalletKit();
  const disconnect = useCallback(() => kit.disconnect(), [kit]);
  return { disconnect };
}

export function useConnectModal() {
  const kit = useWalletKit();
  return {
    openConnectModal: useCallback(() => kit.openModal(), [kit]),
    closeConnectModal: useCallback(() => kit.closeModal(), [kit])
  };
}

export function useAccountModal(): AccountModalState {
  return useContext(AccountModalContext);
}

export function useTronBalance(): TronBalanceState {
  const kit = useWalletKit();
  const session = useWalletSession();
  const [balance, setBalance] = useState(session?.balance);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setBalance(session?.balance);
  }, [session?.balance, session?.account.address, session?.network.id]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await kit.refreshBalance();
      setBalance(next);
      return next;
    } finally {
      setIsLoading(false);
    }
  }, [kit]);

  useEffect(() => {
    if (!session?.account.address || session.balance) return;
    void refresh().catch(() => setIsLoading(false));
  }, [refresh, session?.account.address, session?.balance]);

  return { balance, data: balance, isLoading, refresh };
}

export function useTrxName(): TrxNameState {
  const kit = useWalletKit();
  const session = useWalletSession();
  const [identity, setIdentity] = useState<TronIdentity | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await kit.refreshIdentity();
      setIdentity(next);
      return next;
    } finally {
      setIsLoading(false);
    }
  }, [kit]);

  useEffect(() => {
    setIdentity(session?.account.domain || session?.account.displayName || session?.account.avatar
      ? {
          ...(session.account.domain ? { domain: session.account.domain } : {}),
          ...(session.account.displayName ? { displayName: session.account.displayName } : {}),
          ...(session.account.avatar ? { avatar: session.account.avatar } : {})
        }
      : undefined);
    if (!session?.account.address || session.account.domain || session.account.displayName) return;
    void refresh().catch(() => setIsLoading(false));
  }, [refresh, session?.account.address, session?.account.domain, session?.account.displayName, session?.account.avatar, session?.network.id]);

  const name = identity?.domain ?? identity?.displayName ?? session?.account.domain ?? session?.account.displayName;
  return { ...(name ? { name } : {}), ...(identity ? { identity } : {}), isLoading, refresh };
}

export function useSignMessage(): SignMessageState {
  const kit = useWalletKit();
  const [isPending, setIsPending] = useState(false);
  const signMessage = useCallback(
    async (request: string | SignMessageRequest) => {
      setIsPending(true);
      try {
        return await kit.signMessage(request);
      } finally {
        setIsPending(false);
      }
    },
    [kit]
  );
  return { signMessage, isPending };
}

export function useWalletSession(): WalletSession | null {
  const kit = useWalletKit();
  return useManagerSnapshot(kit, () => kit.manager.getSession());
}

export function useWalletAccount(): WalletAccount | null {
  const session = useWalletSession();
  return session?.account ?? null;
}

export function useWalletStatus(): WalletStatus {
  const session = useWalletSession();
  const kit = useWalletKit();
  return useManagerSnapshot(kit, () => (session ? "connected" : "disconnected"));
}

export function useWalletCapabilities(): WalletCapabilities | null {
  const kit = useWalletKit();
  const session = useWalletSession();
  return session ? kit.manager.getCapabilities(session.adapterId) : null;
}

export function WalletButton(props: WalletButtonProps) {
  const kit = useWalletKit();
  const accountModal = useContext(AccountModalContext);
  const providerTheme = useContext(ThemeContext);
  useWalletKitStyles();
  const session = useWalletSession();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [uncontrolledAccountOpen, setUncontrolledAccountOpen] = useState(false);
  const accountOpen = props.accountPanelOpen ?? uncontrolledAccountOpen;
  const setAccountOpen = useCallback(
    (next: boolean | ((open: boolean) => boolean)) => {
      const resolved = typeof next === "function" ? next(accountOpen) : next;
      if (props.accountPanelOpen === undefined) setUncontrolledAccountOpen(resolved);
      props.onAccountPanelOpenChange?.(resolved);
    },
    [accountOpen, props.accountPanelOpen, props.onAccountPanelOpenChange]
  );
  const [accountPanelView, setAccountPanelView] = useState<"account" | "address-qr" | "tx-history">("account");
  const [identity, setIdentity] = useState<TronIdentity | undefined>();
  const [balanceTrx, setBalanceTrx] = useState<string | undefined>();
  const [identityLoading, setIdentityLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [addressQrSrc, setAddressQrSrc] = useState<string | undefined>();
  const pendingTransactions = useManagerSnapshot(kit, () => kit.manager.getTransactions().some((transaction) => transaction.status === "submitted"));
  const adapter = session ? kit.manager.getAdapter(session.adapterId) : null;
  const walletMetadata = resolveSessionWalletMetadata(session, adapter);
  const identityName = props.connectedLabel ?? identity?.displayName ?? identity?.domain ?? session?.account.displayName ?? session?.account.domain;
  const displayName = identityName ?? (session ? shortenAddress(session.account.address) : undefined);
  const resolvedBalance = balanceTrx ?? session?.balance?.formatted;
  const viewModel: WalletButtonViewModel = {
    status: session ? "connected" : "disconnected",
    hasPendingTransactions: props.hasPendingTransactions ?? pendingTransactions
  };
  if (props.labels) viewModel.labels = props.labels;
  if (props.label) viewModel.label = props.label;
  if (displayName) viewModel.connectedLabel = displayName;
  if (session?.account.address) viewModel.address = session.account.address;
  if (resolvedBalance) viewModel.balanceTrx = resolvedBalance;
  if (identityLoading) viewModel.identityLoading = true;
  if (balanceLoading) viewModel.balanceLoading = true;
  if (walletMetadata.icon) viewModel.adapterIcon = walletMetadata.icon;
  if (walletMetadata.name) viewModel.adapterName = walletMetadata.name;
  if (props.showAdapterIcon !== undefined) viewModel.showAdapterIcon = props.showAdapterIcon;
  if (props.showChevron !== undefined) viewModel.showChevron = props.showChevron;
  if (props.showBalance !== undefined) viewModel.showBalance = props.showBalance;
  if (props.size) viewModel.size = props.size;
  if (props.variant) viewModel.variant = props.variant;
  const html = createWalletButtonHtml(viewModel);
  const panelModel: WalletButtonAccountPanelModel | undefined = session
    ? {
        kit,
        session,
        copyState,
        identityLoading,
        balanceLoading,
        mode: props.accountPanelMode ?? (kit.uiConfig.accountPanel.mode === "modal" ? "modal" : "dropdown"),
        view: accountPanelView,
        showRecentTransactions: props.showRecentTransactions ?? kit.uiConfig.accountPanel.showRecentTransactions,
        maxVisibleTransactions: props.maxVisibleTransactions ?? kit.uiConfig.accountPanel.maxVisibleTransactions,
        explorerAccountUrl: props.explorerAccountUrl ?? kit.uiConfig.accountPanel.explorerAccountUrl
      }
    : undefined;
  if (panelModel && identityName) panelModel.displayName = identityName;
  if (panelModel && resolvedBalance) panelModel.balanceTrx = resolvedBalance;
  if (panelModel && addressQrSrc) panelModel.addressQrSrc = addressQrSrc;
  const panelHtml = session && accountOpen && panelModel ? createWalletButtonAccountPanelHtml(panelModel) : "";

  useEffect(() => {
    if (!session?.account.address) {
      setAccountOpen(false);
      setAccountPanelView("account");
      setIdentity(undefined);
      setBalanceTrx(undefined);
      setIdentityLoading(false);
      setBalanceLoading(false);
      return;
    }

    let cancelled = false;
    setIdentity(session.account.domain || session.account.displayName || session.account.avatar
      ? {
          ...(session.account.domain ? { domain: session.account.domain } : {}),
          ...(session.account.displayName ? { displayName: session.account.displayName } : {}),
          ...(session.account.avatar ? { avatar: session.account.avatar } : {})
        }
      : undefined);
    setBalanceTrx(session.balance?.formatted);
    setIdentityLoading(!props.connectedLabel && !session.account.domain && !session.account.displayName);
    setBalanceLoading(!session.balance?.formatted);
    const identityTimers: ReturnType<typeof globalThis.setTimeout>[] = [];
    const runIdentityRefresh = (attempt = 0) => {
      void kit.refreshIdentity().then((nextIdentity) => {
        if (cancelled) return;
        if (!nextIdentity && attempt < 2) {
          identityTimers.push(globalThis.setTimeout(() => runIdentityRefresh(attempt + 1), attempt === 0 ? 1400 : 3200));
          return;
        }
        {
          setIdentity(nextIdentity);
          setIdentityLoading(false);
        }
      }).catch(() => {
        if (!cancelled) setIdentityLoading(false);
      });
    };
    identityTimers.push(globalThis.setTimeout(() => runIdentityRefresh(0), 260));
    void kit.refreshBalance().then((balance) => {
      if (!cancelled) {
        setBalanceTrx(balance?.formatted);
        setBalanceLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setBalanceLoading(false);
    });
    return () => {
      cancelled = true;
      identityTimers.forEach((timer) => globalThis.clearTimeout(timer));
    };
  }, [kit, session?.account.address, session?.network.id]);

  useEffect(() => {
    if (!accountOpen || accountPanelView !== "address-qr" || !session?.account.address) {
      setAddressQrSrc(undefined);
      return;
    }
    let cancelled = false;
    const qrRoot = rootRef.current;
    const qrFg = qrRoot && typeof globalThis.getComputedStyle === "function"
      ? globalThis.getComputedStyle(qrRoot).getPropertyValue("--twk-qr-foreground").trim() || QR_FALLBACK_DARK
      : QR_FALLBACK_DARK;
    void createStyledQrDataUrl(session.account.address, { width: 264, margin: 4, foreground: qrFg, background: "transparent" })
      .then((src) => { if (!cancelled) setAddressQrSrc(src); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [accountOpen, accountPanelView, session?.account.address]);

  useEffect(() => {
    if (!pendingTransactions || !session) return;
    const timers = [1600, 4000].map((delay) =>
      globalThis.setTimeout(() => {
        void kit.refreshBalance().then((balance) => setBalanceTrx(balance?.formatted));
      }, delay)
    );
    return () => timers.forEach((timer) => globalThis.clearTimeout(timer));
  }, [kit, pendingTransactions, session]);

  useEffect(() => {
    if (!accountOpen) return;
    const mode = props.accountPanelMode ?? (kit.uiConfig.accountPanel.mode === "modal" ? "modal" : "dropdown");
    if (mode === "modal" && typeof document !== "undefined") {
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      globalThis.setTimeout(() => focusFirstPanelControl(rootRef.current), 0);
      return () => {
        document.body.style.overflow = previousOverflow;
        previousFocusRef.current?.focus();
        previousFocusRef.current = null;
      };
    }
    return undefined;
  }, [accountOpen, accountPanelView, kit.uiConfig.accountPanel.mode, props.accountPanelMode]);

  useEffect(() => {
    if (!accountOpen) return;
    const mode = props.accountPanelMode ?? (kit.uiConfig.accountPanel.mode === "modal" ? "modal" : "dropdown");
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target)) return;
      setAccountOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setAccountPanelView("account");
        return;
      }
      if (event.key === "Tab" && mode === "modal") {
        const panel = rootRef.current?.querySelector<HTMLElement>(".twk-button-panel-overlay .twk-account-panel");
        if (panel) trapFocus(event, panel);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen, kit.uiConfig.accountPanel.mode, props.accountPanelMode]);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const liveSession = kit.manager.getSession();
    const target = event.target instanceof Element ? event.target : null;
    const action = target?.closest("[data-twk-action]")?.getAttribute("data-twk-action");
    if (action === "copy" && liveSession) {
      void copyText(liveSession.account.address).then((copied) => {
        if (!copied) return;
        setCopyState("copied");
        globalThis.setTimeout(() => setCopyState("idle"), 1400);
      });
      return;
    }
    if (action === "address-qr") {
      setAccountPanelView("address-qr");
      return;
    }
    if (action === "tx-history") {
      setAccountPanelView("tx-history");
      return;
    }
    if (action === "account-back") {
      setAccountPanelView("account");
      return;
    }
    if (action === "close-account") {
      setAccountOpen(false);
      setAccountPanelView("account");
      return;
    }
    if (action === "disconnect") {
      void kit.disconnect();
      setAccountOpen(false);
      setAccountPanelView("account");
      return;
    }
    // Clicks inside the account panel wrapper: only the backdrop (outside the card) closes.
    // Clicks on the card itself must NOT close or toggle the panel.
    const panelWrap = target?.closest(".twk-button-panel-overlay, .twk-button-panel");
    if (panelWrap) {
      if (target && !target.closest(".twk-account-panel")) {
        event.preventDefault();
        event.stopPropagation();
        setAccountOpen(false);
        setAccountPanelView("account");
      }
      return;
    }
    if (liveSession) {
      event.preventDefault();
      event.stopPropagation();
      setAccountOpen((open) => {
        const nextOpen = !open;
        if (!nextOpen) setAccountPanelView("account");
        return nextOpen;
      });
      return;
    }
    if (props.onClick) {
      props.onClick();
      return;
    }
    kit.openModal();
  };

  return createElement("div", {
    ref: rootRef,
    className: "twk-root",
    "data-twk-root": "true",
    style: useThemeStyle(props.theme ?? providerTheme),
    onClick: handleClick,
    dangerouslySetInnerHTML: { __html: `${html}${panelHtml}` }
  });
}

export function TronConnectButton(props: TronConnectButtonProps) {
  const accountModal = useContext(AccountModalContext);
  const accountStatus = props.accountStatus ?? "full";
  const { accountStatus: _accountStatus, chainStatus: _chainStatus, ...walletButtonProps } = props;
  const buttonProps: WalletButtonProps = {
    ...walletButtonProps,
    accountPanelMode: props.accountPanelMode ?? "modal",
    onAccountPanelOpenChange: (open) => {
      if (props.accountPanelOpen !== undefined) accountModal.setAccountModalOpen?.(open);
      props.onAccountPanelOpenChange?.(open);
    },
    showAdapterIcon: props.showAdapterIcon ?? accountStatus !== "address",
    showBalance: props.showBalance ?? accountStatus === "full",
    showChevron: props.showChevron ?? true
  };
  if (props.accountPanelOpen !== undefined) buttonProps.accountPanelOpen = props.accountPanelOpen;
  return createElement(WalletButton, buttonProps);
}

function createWalletButtonAccountPanelHtml(input: WalletButtonAccountPanelModel): string {
  const transactions = input.kit.manager.getTransactions(Math.max(10, input.maxVisibleTransactions ?? 0)).map(mapTransaction);
  const account = {
    ...input.session.account,
    ...(input.displayName?.endsWith(".trx") ? { domain: input.displayName } : input.displayName ? { displayName: input.displayName } : {})
  };
  let panel: string;
  if (input.view === "address-qr") {
    panel = createAddressQrPanelHtml({
          address: input.session.account.address,
          copyState: input.copyState,
          ...(input.addressQrSrc ? { qrImageSrc: input.addressQrSrc } : {})
        });
  } else {
    const accountPanelModel = {
      account,
      ...(input.balanceTrx ? { balanceTrx: input.balanceTrx } : {}),
      identityLoading: input.identityLoading,
      balanceLoading: input.balanceLoading,
      ...((input.explorerAccountUrl || input.session.network.explorerAccountUrl) ? { explorerUrl: (input.explorerAccountUrl || input.session.network.explorerAccountUrl)!.replace("{address}", input.session.account.address) } : {}),
      copyState: input.copyState,
      activityLabels: input.kit.uiConfig.labels.activity,
      recentTransactions: transactions,
      ...(input.showRecentTransactions !== undefined ? { showRecentTransactions: input.showRecentTransactions } : {}),
      ...(input.maxVisibleTransactions ? { maxVisibleTransactions: input.maxVisibleTransactions } : {}),
      showAddressQrButton: true
    } satisfies AccountPanelViewModel;
    panel = input.view === "tx-history" ? createTransactionHistoryPanelHtml(accountPanelModel) : createAccountPanelHtml(accountPanelModel);
  }
  if (input.mode === "modal") {
    return `<div class="twk-button-panel-overlay" data-twk-account-panel-mode="modal">${panel}</div>`;
  }
  return `<div class="twk-button-panel" data-twk-account-panel-mode="dropdown">${panel}</div>`;
}

async function copyText(value: string): Promise<boolean> {
  if (typeof document === "undefined") return false;
  return copyToClipboard(value, document);
}

function focusFirstPanelControl(root: HTMLElement | null): void {
  const panel = root?.querySelector<HTMLElement>(".twk-button-panel-overlay .twk-account-panel");
  const focusable = panel ? getFocusablePanelControls(panel) : [];
  focusable[0]?.focus();
}

function trapFocus(event: KeyboardEvent, panel: HTMLElement): void {
  const focusable = getFocusablePanelControls(panel);
  if (focusable.length === 0) {
    event.preventDefault();
    panel.focus();
    return;
  }
  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  const active = document.activeElement;
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
    return;
  }
  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function getFocusablePanelControls(panel: HTMLElement): HTMLElement[] {
  return Array.from(
    panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
}

export function ConnectModal(props: ConnectModalProps) {
  const kit = useWalletKit();
  const providerTheme = useContext(ThemeContext);
  useWalletKitStyles();
  const session = useWalletSession();
  const [availability, setAvailability] = useState<Record<string, WalletAvailability>>({});

  useEffect(() => {
    let cancelled = false;
    const adapters = kit.manager.getWallets();
    const initial: Record<string, WalletAvailability> = {};
    for (const adapter of adapters) {
      initial[adapter.metadata.id] = adapter.isAvailable ? "loading" : true;
    }
    setAvailability(initial);

    for (const adapter of adapters) {
      if (!adapter.isAvailable) continue;
      void Promise.resolve(adapter.isAvailable())
        .then((available) => {
          if (!cancelled) setAvailability((current) => ({ ...current, [adapter.metadata.id]: available }));
        })
        .catch(() => {
          if (!cancelled) setAvailability((current) => ({ ...current, [adapter.metadata.id]: false }));
        });
    }

    return () => {
      cancelled = true;
    };
  }, [kit]);

  const wallets = mergeWalletOptionsWithCatalog(
    kit.manager.getWallets().map((adapter) => mapAdapterToWalletOption(adapter, availability[adapter.metadata.id] ?? (adapter.isAvailable ? "loading" : true))),
    undefined,
    props.catalog ?? kit.catalog
  );
  const html = createConnectModalHtml({
    wallets,
    ...(props.view ? { view: props.view } : {}),
    ...(props.labels ? { labels: props.labels } : {}),
    ...(session?.adapterId ? { selectedWalletId: session.adapterId } : {}),
    ...(props.activeWalletId ? { activeWalletId: props.activeWalletId } : {}),
    ...(props.searchQuery ? { searchQuery: props.searchQuery } : {}),
    ...(props.qrUri ? { qrUri: props.qrUri } : {}),
    ...(props.qrImageSrc ? { qrImageSrc: props.qrImageSrc } : {}),
    ...(props.errorMessage ? { errorMessage: props.errorMessage } : {}),
    ...(props.showCloseButton !== undefined ? { showCloseButton: props.showCloseButton } : {}),
    ...(props.walletList ? { walletList: props.walletList } : {})
  });

  if (props.open === false) return null;
  return createElement("div", {
    className: "twk-root",
    "data-twk-root": "true",
    style: useThemeStyle(props.theme ?? providerTheme),
    dangerouslySetInnerHTML: { __html: html }
  });
}

export function AccountPanel(props: AccountPanelProps) {
  const kit = useWalletKit();
  const providerTheme = useContext(ThemeContext);
  useWalletKitStyles();
  const session = useWalletSession();
  const account = props.account ?? session?.account;
  if (props.open === false || !account) return null;

  const balanceTrx = props.balanceTrx ?? session?.balance?.formatted;
  const html = createAccountPanelHtml({
    account,
    ...(props.labels ? { labels: props.labels } : {}),
    ...(balanceTrx ? { balanceTrx } : {}),
    ...(props.identityLoading !== undefined ? { identityLoading: props.identityLoading } : {}),
    ...(props.balanceLoading !== undefined ? { balanceLoading: props.balanceLoading } : {}),
    ...(props.addressQr ? { addressQr: props.addressQr } : {}),
    ...(props.copyState ? { copyState: props.copyState } : {}),
    activityLabels: kit.uiConfig.labels.activity,
    recentTransactions: props.recentTransactions ?? kit.manager.getTransactions(5).map(mapTransaction),
    ...(props.showDisconnectButton !== undefined ? { showDisconnectButton: props.showDisconnectButton } : {})
  });

  return createElement("div", {
    className: "twk-root",
    "data-twk-root": "true",
    style: useThemeStyle(props.theme ?? providerTheme),
    dangerouslySetInnerHTML: { __html: html }
  });
}

function useManagerSnapshot<T>(kit: WalletKit, getSnapshot: () => T): T {
  return useSyncExternalStore(
    (onStoreChange) => {
      const off = [
        kit.manager.on("connecting", onStoreChange),
        kit.manager.on("connected", onStoreChange),
        kit.manager.on("disconnected", onStoreChange),
        kit.manager.on("accountChanged", onStoreChange),
        kit.manager.on("networkChanged", onStoreChange),
        kit.manager.on("session_restored", onStoreChange),
        kit.manager.on("session_stale", onStoreChange),
        kit.manager.on("session_expired", onStoreChange),
        kit.manager.on("tx_submitted", onStoreChange),
        kit.manager.on("tx_confirmed", onStoreChange),
        kit.manager.on("tx_failed", onStoreChange)
      ];
      return () => off.forEach((unsubscribe) => unsubscribe());
    },
    getSnapshot,
    getSnapshot
  );
}

function useWalletKitStyles(): void {
  useEffect(() => {
    if (typeof document !== "undefined") ensureWalletKitStyles(document);
  }, []);
}

function useThemeStyle(theme?: ThemeConfig): Record<string, string> {
  return useMemo(() => {
    const properties = createThemeStyleProperties(theme);
    const colorScheme = properties["color-scheme"] ?? "light";
    const rest = { ...properties };
    delete rest["color-scheme"];
    return { ...rest, colorScheme };
  }, [theme]);
}

function mapTransaction(transaction: ReturnType<WalletKit["manager"]["getTransactions"]>[number]) {
  return {
    id: transaction.id,
    label: transaction.description ?? "TRON transaction",
    status: transaction.status === "confirmed" ? "success" : transaction.status === "submitted" ? "pending" : transaction.status,
    txHash: transaction.hash,
    timestamp: new Date(transaction.submittedAt).toISOString(),
    ...(transaction.kind ? { kind: transaction.kind } : {}),
    ...(transaction.direction ? { direction: transaction.direction } : {}),
    ...(transaction.title ? { title: transaction.title } : {}),
    ...(transaction.subtitle ? { subtitle: transaction.subtitle } : {}),
    ...(transaction.amountText ? { amountText: transaction.amountText } : {}),
    ...(transaction.amountTone ? { amountTone: transaction.amountTone } : {}),
    ...(transaction.token ? { token: transaction.token } : {}),
    ...(transaction.resource ? { resource: transaction.resource } : {}),
    ...(transaction.explorerUrl ? { explorerUrl: transaction.explorerUrl } : {})
  } as const;
}
