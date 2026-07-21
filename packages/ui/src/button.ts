import type { WalletManager, WalletTransactionStatus } from "@tron-wallet-kit/core";
import { createAccountPanelHtml, createAddressQrPanelHtml, createTransactionHistoryPanelHtml } from "./account-panel";
import { copyToClipboard } from "./clipboard";
import { applyThemeToElement, createWalletKitRoot, ensureWalletKitStyles } from "./dom";
import { walletIcon } from "./icons";
import { en } from "./locales/en";
import { createStyledQrDataUrl, QR_FALLBACK_DARK } from "./qr";
import { resolveSessionWalletMetadata } from "./session-wallet";
import { escapeAttribute, escapeHtml, shortenAddress } from "./utils";
import type { AccountPanelViewModel, ThemeConfig, WalletButton, WalletButtonLabels, WalletButtonViewModel, WalletModal } from "./types";

const defaultWalletButtonLabels: WalletButtonLabels = en.walletButton;

export function createWalletButtonHtml(viewModel: WalletButtonViewModel = {}): string {
  const labels = { ...defaultWalletButtonLabels, ...viewModel.labels };
  const status = viewModel.status ?? "disconnected";
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const label =
    isConnecting
      ? labels.connecting
      : isConnected
        ? viewModel.connectedLabel ?? viewModel.label ?? (viewModel.address ? shortenAddress(viewModel.address) : labels.openAccount)
        : viewModel.label ?? labels.connect;
  const size = viewModel.size ?? "md";
  const variant = viewModel.variant ?? "default";
  const showAdapterIcon = viewModel.showAdapterIcon ?? true;
  const showChevron = isConnected && (viewModel.showChevron ?? true);
  const showBalance = isConnected && (viewModel.showBalance ?? Boolean(viewModel.balanceTrx ?? viewModel.balanceLoading));
  const icon = showAdapterIcon ? createWalletButtonIconHtml(viewModel) : "";
  const labelHtml = isConnected && viewModel.identityLoading
    ? `<span class="twk-button-label twk-skeleton-name twk-skeleton-pill" data-loading="true"><span class="twk-skeleton" aria-hidden="true"></span><span class="twk-sr-only">${escapeHtml(label)}</span></span>`
    : `<span class="twk-button-label">${escapeHtml(label)}</span>`;
  const balance = showBalance
    ? viewModel.balanceLoading
      ? `<span class="twk-button-balance twk-skeleton-balance twk-skeleton-pill" data-loading="true"><span class="twk-skeleton" aria-hidden="true"></span><span class="twk-sr-only">TRX balance</span></span>`
      : viewModel.balanceTrx
        ? `<span class="twk-button-balance">(${escapeHtml(viewModel.balanceTrx)} TRX)</span>`
        : ""
    : "";
  const chevron = showChevron
    ? `<span class="twk-button-chevron" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`
    : "";
  const pending = isConnected && viewModel.hasPendingTransactions ? `<span class="twk-button-pending" aria-hidden="true"></span>` : "";
  return `<button class="twk-connect-button" type="button" data-status="${escapeAttribute(status)}" data-size="${escapeAttribute(size)}" data-variant="${escapeAttribute(variant)}" aria-label="${escapeAttribute(isConnected ? labels.openAccount : label)}" ${isConnecting ? "disabled" : ""}>
  <span class="twk-button-icon-wrap">${icon}${pending}</span>
  ${labelHtml}
  ${balance}
  ${chevron}
</button>`;
}

function createWalletButtonIconHtml(viewModel: WalletButtonViewModel): string {
  if (viewModel.adapterIcon) {
    return `<span class="twk-button-icon"><img src="${escapeAttribute(viewModel.adapterIcon)}" alt="" aria-hidden="true" /></span>`;
  }
  return `<span class="twk-button-icon twk-button-icon-generic" aria-hidden="true">${walletIcon()}</span>`;
}

export type WalletButtonControllerOptions = {
  manager: WalletManager;
  modal: WalletModal;
  label?: string;
  connectedLabel?: string;
  showBalance?: boolean;
  accountPanelMode?: "dropdown" | "modal";
  size?: WalletButtonViewModel["size"];
  variant?: WalletButtonViewModel["variant"];
  theme?: ThemeConfig;
  refreshAccountDetails?: () => Promise<void> | void;
};

export function createWalletButton(options: WalletButtonControllerOptions): WalletButton {
  let root: HTMLElement | null = null;
  let documentRef: Document | null = null;
  let accountOpen = false;
  let accountView: "account" | "address-qr" | "tx-history" = "account";
  let copyState: "idle" | "copied" = "idle";
  let addressQrSrc: string | undefined;
  let isRefreshingDetails = false;
  let refreshRunId = 0;
  let qrRunId = 0;

  const render = () => {
    if (!root) return;
    const session = options.manager.getSession();
    const adapter = session ? options.manager.getAdapter(session.adapterId) : null;
    const walletMetadata = resolveSessionWalletMetadata(session, adapter);
    const pending = options.manager.getTransactions().some((transaction) => transaction.status === "submitted");
    const viewModel: WalletButtonViewModel = {
      status: session ? "connected" : "disconnected",
      hasPendingTransactions: pending
    };
    if (options.label) viewModel.label = options.label;
    if (options.connectedLabel) viewModel.connectedLabel = options.connectedLabel;
    else if (session) viewModel.connectedLabel = session.account.domain ?? session.account.displayName ?? shortenAddress(session.account.address);
    if (options.size) viewModel.size = options.size;
    if (options.variant) viewModel.variant = options.variant;
    if (session?.account.address) viewModel.address = session.account.address;
    const showBalance = options.showBalance ?? true;
    viewModel.showBalance = showBalance;
    if (session?.balance?.formatted) viewModel.balanceTrx = session.balance.formatted;
    if (session && showBalance && !session.balance?.formatted) viewModel.balanceLoading = isRefreshingDetails;
    if (session && !session.account.domain && !session.account.displayName) viewModel.identityLoading = isRefreshingDetails;
    if (walletMetadata.icon) viewModel.adapterIcon = walletMetadata.icon;
    if (walletMetadata.name) viewModel.adapterName = walletMetadata.name;
    const panelHtml = session && accountOpen
      ? createButtonAccountPanelHtml(session, accountView, copyState, addressQrSrc, options.manager, options.accountPanelMode ?? "modal")
      : "";
    root.innerHTML = `${createWalletButtonHtml(viewModel)}${panelHtml}`;
  };
  const refreshAccountDetails = () => {
    const session = options.manager.getSession();
    if (!session || !options.refreshAccountDetails) return;
    const runId = ++refreshRunId;
    isRefreshingDetails = true;
    render();
    void Promise.resolve(options.refreshAccountDetails())
      .catch(() => undefined)
      .finally(() => {
        if (runId !== refreshRunId) return;
        isRefreshingDetails = false;
        render();
      });
  };
  const renderAddressQr = () => {
    const session = options.manager.getSession();
    if (!root || !session?.account.address || accountView !== "address-qr") return;
    const runId = ++qrRunId;
    addressQrSrc = undefined;
    render();
    const foreground = typeof globalThis.getComputedStyle === "function"
      ? globalThis.getComputedStyle(root).getPropertyValue("--twk-qr-foreground").trim() || QR_FALLBACK_DARK
      : QR_FALLBACK_DARK;
    void createStyledQrDataUrl(session.account.address, { width: 264, margin: 4, foreground, background: "transparent" })
      .then((src) => {
        if (runId !== qrRunId) return;
        addressQrSrc = src;
        render();
      })
      .catch(() => undefined);
  };
  const closeAccountPanel = () => {
    accountOpen = false;
    accountView = "account";
    copyState = "idle";
    addressQrSrc = undefined;
    qrRunId += 1;
    render();
  };
  const handleClick = (event: Event) => {
    const target = event.target instanceof Element ? event.target : null;
    const action = target?.closest("[data-twk-action]")?.getAttribute("data-twk-action");
    const session = options.manager.getSession();
    if (action === "copy" && session && documentRef) {
      void copyToClipboard(session.account.address, documentRef).then((copied) => {
        if (!copied) return;
        copyState = "copied";
        render();
        globalThis.setTimeout(() => {
          copyState = "idle";
          render();
        }, 1400);
      });
      return;
    }
    if (action === "address-qr") {
      accountView = "address-qr";
      renderAddressQr();
      return;
    }
    if (action === "tx-history") {
      accountView = "tx-history";
      render();
      return;
    }
    if (action === "account-back") {
      accountView = "account";
      addressQrSrc = undefined;
      qrRunId += 1;
      render();
      return;
    }
    if (action === "close-account") {
      closeAccountPanel();
      return;
    }
    if (action === "disconnect") {
      void options.manager.disconnect();
      closeAccountPanel();
      return;
    }
    if (target?.closest(".twk-account-panel")) return;
    if (session) {
      event.preventDefault();
      event.stopPropagation();
      accountOpen = !accountOpen;
      if (!accountOpen) {
        accountView = "account";
        addressQrSrc = undefined;
        qrRunId += 1;
      }
      render();
      return;
    }
    options.modal.open();
  };
  const handleOutsidePointerDown = (event: PointerEvent) => {
    if (!accountOpen || !root) return;
    const target = event.target;
    if (target instanceof Node && root.contains(target)) return;
    closeAccountPanel();
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && accountOpen) closeAccountPanel();
  };
  const unsubscribe = [
    options.manager.on("connecting", render),
    options.manager.on("connected", () => {
      accountOpen = false;
      accountView = "account";
      render();
      refreshAccountDetails();
    }),
    options.manager.on("disconnected", () => {
      closeAccountPanel();
    }),
    options.manager.on("session_restored", () => {
      render();
      refreshAccountDetails();
    }),
    options.manager.on("tx_submitted", render),
    options.manager.on("tx_confirmed", render),
    options.manager.on("tx_failed", render)
  ];
  return {
    mount(target) {
      documentRef = typeof target === "string" ? globalThis.document : target.ownerDocument;
      if (!documentRef) throw new Error("createWalletButton requires a DOM document.");
      ensureWalletKitStyles(documentRef);
      root = createWalletKitRoot(options.theme, documentRef);
      root.addEventListener("click", handleClick);
      documentRef.addEventListener("pointerdown", handleOutsidePointerDown);
      documentRef.addEventListener("keydown", handleKeyDown);
      const targetElement = typeof target === "string" ? documentRef.querySelector(target) : target;
      if (!targetElement) throw new Error(`Wallet button target was not found: ${String(target)}`);
      targetElement.append(root);
      render();
      if (options.manager.getSession()) refreshAccountDetails();
    },
    setTheme(config) {
      if (root) applyThemeToElement(root, config);
    },
    destroy() {
      unsubscribe.forEach((off) => off());
      root?.removeEventListener("click", handleClick);
      documentRef?.removeEventListener("pointerdown", handleOutsidePointerDown);
      documentRef?.removeEventListener("keydown", handleKeyDown);
      root?.remove();
      root = null;
      documentRef = null;
    }
  };
}

function createButtonAccountPanelHtml(
  session: NonNullable<ReturnType<WalletManager["getSession"]>>,
  view: "account" | "address-qr" | "tx-history",
  copyState: "idle" | "copied",
  addressQrSrc: string | undefined,
  manager: WalletManager,
  mode: "dropdown" | "modal"
): string {
  if (view === "address-qr") {
    return createButtonPanelShell(createAddressQrPanelHtml({
      address: session.account.address,
      copyState,
      ...(addressQrSrc ? { qrImageSrc: addressQrSrc } : {})
    }), mode);
  }
  const model: AccountPanelViewModel = {
    account: session.account,
    ...(session.balance?.formatted ? { balanceTrx: session.balance.formatted } : {}),
    copyState,
    recentTransactions: manager.getTransactions(10).map(mapTransaction),
    showRecentTransactions: true,
    maxVisibleTransactions: 3,
    showAddressQrButton: true
  };
  const panel = view === "tx-history" ? createTransactionHistoryPanelHtml(model) : createAccountPanelHtml(model);
  return createButtonPanelShell(panel, mode);
}

function createButtonPanelShell(panel: string, mode: "dropdown" | "modal"): string {
  if (mode === "modal") {
    return `<div class="twk-button-panel-overlay" data-twk-account-panel-mode="modal">${panel}</div>`;
  }
  return `<div class="twk-button-panel" data-twk-account-panel-mode="dropdown">${panel}</div>`;
}

function mapTransaction(transaction: ReturnType<WalletManager["getTransactions"]>[number]) {
  return {
    id: transaction.id,
    label: transaction.description ?? "TRON transaction",
    status: mapTransactionStatus(transaction.status),
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

function mapTransactionStatus(status: WalletTransactionStatus): "pending" | "success" | "failed" | "unknown" {
  if (status === "confirmed") return "success";
  if (status === "submitted") return "pending";
  if (status === "failed") return "failed";
  return "unknown";
}
