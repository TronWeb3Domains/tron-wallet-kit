import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { createWalletKit, type TronIdentity, type WalletClientConfig, type WalletKit } from "@tron-wallet-kit/client";
import type { WalletAccount, WalletCapabilities, WalletSession } from "@tron-wallet-kit/core";
import { copyToClipboard, createAccountPanelHtml, createAddressQrPanelHtml, createConnectModalHtml, createStyledQrDataUrl, createThemeStyleProperties, createTransactionHistoryPanelHtml, createWalletButtonHtml, ensureWalletKitStyles, mapAdapterToWalletOption, mergeWalletOptionsWithCatalog, QR_FALLBACK_DARK, resolveSessionWalletMetadata, shortenAddress, type AccountPanelViewModel, type ConnectModalViewModel, type ThemeConfig, type WalletButtonViewModel } from "@tron-wallet-kit/ui";
import type { WalletAvailability } from "@tron-wallet-kit/ui";

export type WalletStatus = "disconnected" | "connecting" | "connected";

export type TronWalletProviderProps = WalletClientConfig & {
  kit?: WalletKit;
  children?: ReactNode;
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
  showRecentTransactions?: boolean;
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
  addressQrSrc?: string;
};

const WalletKitContext = createContext<WalletKit | null>(null);

export function TronWalletProvider(props: TronWalletProviderProps) {
  const kitRef = useRef<WalletKit | null>(null);
  const ownsKitRef = useRef(false);
  if (!kitRef.current || (props.kit && kitRef.current !== props.kit)) {
    kitRef.current = props.kit ?? createWalletKit(props);
    ownsKitRef.current = !props.kit;
  }
  const kit = kitRef.current;
  useEffect(() => {
    void kit.manager.autoReconnect();
    return () => {
      if (ownsKitRef.current) {
        kit.destroy();
        kitRef.current = null;
      } else {
        kit.manager.destroy();
      }
    };
  }, [kit]);
  return createElement(WalletKitContext.Provider, { value: kit }, props.children);
}

export const TronWalletKitProvider = TronWalletProvider;

export function useWalletKit(): WalletKit {
  const kit = useContext(WalletKitContext);
  if (!kit) throw new Error("useWalletKit must be used within TronWalletProvider.");
  return kit;
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
  useWalletKitStyles();
  const session = useWalletSession();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
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
        mode: props.accountPanelMode ?? "dropdown",
        view: accountPanelView,
        ...(props.showRecentTransactions !== undefined ? { showRecentTransactions: props.showRecentTransactions } : {})
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
    const mode = props.accountPanelMode ?? "dropdown";
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
  }, [accountOpen, accountPanelView, props.accountPanelMode]);

  useEffect(() => {
    if (!accountOpen) return;
    const mode = props.accountPanelMode ?? "dropdown";
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
  }, [accountOpen, props.accountPanelMode]);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target instanceof Element ? event.target : null;
    const action = target?.closest("[data-twk-action]")?.getAttribute("data-twk-action");
    if (action === "copy" && session) {
      void copyText(session.account.address).then((copied) => {
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
        setAccountOpen(false);
        setAccountPanelView("account");
      }
      return;
    }
    if (props.onClick) {
      props.onClick();
      return;
    }
    if (session) {
      setAccountOpen((open) => {
        const nextOpen = !open;
        if (!nextOpen) setAccountPanelView("account");
        return nextOpen;
      });
      return;
    }
    kit.openModal();
  };

  return createElement("div", {
    ref: rootRef,
    className: "twk-root",
    "data-twk-root": "true",
    style: useThemeStyle(props.theme),
    onClick: handleClick,
    dangerouslySetInnerHTML: { __html: `${html}${panelHtml}` }
  });
}

function createWalletButtonAccountPanelHtml(input: WalletButtonAccountPanelModel): string {
  const transactions = input.kit.manager.getTransactions(10).map(mapTransaction);
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
      ...(input.session.network.explorerAccountUrl ? { explorerUrl: input.session.network.explorerAccountUrl.replace("{address}", input.session.account.address) } : {}),
      copyState: input.copyState,
      recentTransactions: transactions,
      ...(input.showRecentTransactions !== undefined ? { showRecentTransactions: input.showRecentTransactions } : {}),
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
    style: useThemeStyle(props.theme),
    dangerouslySetInnerHTML: { __html: html }
  });
}

export function AccountPanel(props: AccountPanelProps) {
  const kit = useWalletKit();
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
    recentTransactions: props.recentTransactions ?? kit.manager.getTransactions(5).map(mapTransaction),
    ...(props.showDisconnectButton !== undefined ? { showDisconnectButton: props.showDisconnectButton } : {})
  });

  return createElement("div", {
    className: "twk-root",
    "data-twk-root": "true",
    style: useThemeStyle(props.theme),
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
    ...(transaction.explorerUrl ? { explorerUrl: transaction.explorerUrl } : {})
  } as const;
}
