import type { WalletManager } from "@tron-wallet-kit/core";
import { applyThemeToElement, createWalletKitRoot, ensureWalletKitStyles } from "./dom";
import { walletIcon } from "./icons";
import { escapeAttribute, escapeHtml, shortenAddress } from "./utils";
import type { ThemeConfig, WalletButton, WalletButtonLabels, WalletButtonViewModel, WalletModal } from "./types";

const defaultWalletButtonLabels: WalletButtonLabels = {
  connect: "Connect Wallet",
  connecting: "Connecting",
  openAccount: "Open account"
};

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
    ? `<span class="twk-button-label twk-skeleton-name" data-loading="true"><span class="twk-skeleton" aria-hidden="true"></span><span class="twk-sr-only">${escapeHtml(label)}</span></span>`
    : `<span class="twk-button-label">${escapeHtml(label)}</span>`;
  const balance = showBalance
    ? viewModel.balanceLoading
      ? `<span class="twk-button-balance twk-skeleton-balance" data-loading="true"><span class="twk-skeleton" aria-hidden="true"></span><span class="twk-sr-only">TRX balance</span></span>`
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

export function createWalletButton(options: { manager: WalletManager; modal: WalletModal; label?: string; connectedLabel?: string; theme?: ThemeConfig }): WalletButton {
  let root: HTMLElement | null = null;
  const render = () => {
    if (!root) return;
    const session = options.manager.getSession();
    const adapter = session ? options.manager.getAdapter(session.adapterId) : null;
    const pending = options.manager.getTransactions().some((transaction) => transaction.status === "submitted");
    const viewModel: WalletButtonViewModel = {
      status: session ? "connected" : "disconnected",
      hasPendingTransactions: pending
    };
    if (options.label) viewModel.label = options.label;
    if (options.connectedLabel) viewModel.connectedLabel = options.connectedLabel;
    else if (session) viewModel.connectedLabel = shortenAddress(session.account.address);
    if (session?.account.address) viewModel.address = session.account.address;
    if (session?.balance?.formatted) viewModel.balanceTrx = session.balance.formatted;
    if (adapter?.metadata.icon) viewModel.adapterIcon = adapter.metadata.icon;
    if (adapter?.metadata.name) viewModel.adapterName = adapter.metadata.name;
    root.innerHTML = createWalletButtonHtml(viewModel);
  };
  const unsubscribe = [
    options.manager.on("connecting", render),
    options.manager.on("connected", render),
    options.manager.on("disconnected", render),
    options.manager.on("session_restored", render),
    options.manager.on("tx_submitted", render),
    options.manager.on("tx_confirmed", render),
    options.manager.on("tx_failed", render)
  ];
  return {
    mount(target) {
      const documentRef = typeof target === "string" ? globalThis.document : target.ownerDocument;
      if (!documentRef) throw new Error("createWalletButton requires a DOM document.");
      ensureWalletKitStyles(documentRef);
      root = createWalletKitRoot(options.theme, documentRef);
      root.addEventListener("click", () => options.modal.open());
      const targetElement = typeof target === "string" ? documentRef.querySelector(target) : target;
      if (!targetElement) throw new Error(`Wallet button target was not found: ${String(target)}`);
      targetElement.append(root);
      render();
    },
    setTheme(config) {
      if (root) applyThemeToElement(root, config);
    },
    destroy() {
      unsubscribe.forEach((off) => off());
      root?.remove();
      root = null;
    }
  };
}
