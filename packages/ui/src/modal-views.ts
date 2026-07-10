import { createActionContentHtml } from "./actions";
import { actionSpinnerIcon, checkIcon, externalIcon, linkIcon, qrIcon, refreshIcon, searchIcon, statusErrorIcon } from "./icons";
import { escapeAttribute, escapeHtml } from "./utils";
import { resolveWalletBadge } from "./wallet-badges";
import { filterWalletOptions, getFeaturedWalletOptions } from "./wallet-catalog";
import { inferWalletPlatforms, isHardwareWallet, isQrWallet } from "./wallet-kinds";
import type { ConnectModalLabels, ConnectModalView, ConnectModalViewModel, WalletOptionViewModel } from "./types";

export function normalizeConnectErrorMessage(error: unknown, wallet?: WalletOptionViewModel): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (/dynamically imported module|importing a module script failed|failed to fetch/i.test(raw)) {
    return `${wallet?.name ?? "Wallet"} could not be loaded. Refresh the page and try again.`;
  }
  if (/wallet_not_found|not found|not available/i.test(raw)) {
    return `${wallet?.name ?? "Wallet"} is not available.`;
  }
  const compact = raw.replace(/\s+/g, " ").trim();
  if (compact.length <= 140) return compact;
  return `${compact.slice(0, 137)}...`;
}

export function createConnectModalBodyHtml(viewModel: ConnectModalViewModel & { view: ConnectModalView; labels: ConnectModalLabels }): string {
  if (viewModel.view === "all-wallets") return createAllWalletsHtml(viewModel);
  if (viewModel.view === "connecting") return createConnectingHtml(viewModel);
  if (viewModel.view === "qr") return createQrHtml(viewModel);
  return createFeaturedHtml(viewModel);
}

function createFeaturedHtml(viewModel: ConnectModalViewModel & { labels: ConnectModalLabels }): string {
  const labels = viewModel.labels;
  const featuredWallets = getFeaturedWalletOptions(viewModel.wallets, viewModel.walletList, viewModel.walletEnvironment);
  const layout = resolveWalletListLayout(viewModel.walletList);
  const walletRows = createWalletCollectionHtml(featuredWallets, labels, viewModel.selectedWalletId, layout, "featured");
  const total = viewModel.wallets.length;
  const status = createStatusHtml(viewModel.errorMessage, viewModel.errorMessage ? "danger" : "idle");
  const allWalletsLabel = createAllWalletsTriggerLabel(labels.allWallets);
  return `${createNetworkBadgeHtml(viewModel)}
  ${walletRows}
  <button class="twk-search-trigger" type="button" data-twk-action="show-all-wallets">
    <span class="twk-search-label"><span class="twk-search-icon">${searchIcon()}</span><span class="twk-wallet-name">${escapeHtml(allWalletsLabel)}</span></span>
    <span class="twk-badge" data-tone="muted">${escapeHtml(`${total}+`)}</span>
  </button>
  ${status}
  ${createPoweredByFooterHtml(viewModel)}`;
}

function createAllWalletsHtml(viewModel: ConnectModalViewModel & { labels: ConnectModalLabels }): string {
  const labels = viewModel.labels;
  const wallets = filterWalletOptions(viewModel.wallets, viewModel.searchQuery);
  const layout = resolveWalletListLayout(viewModel.walletList);
  const gridBody = viewModel.walletsLoading
    ? createWalletSkeletonGridHtml(Math.max(6, Math.min(wallets.length || 8, 9)), layout, "all")
    : wallets.length > 0
      ? createWalletCollectionHtml(wallets, labels, viewModel.selectedWalletId, layout, "all")
      : `<div class="twk-no-wallets">${escapeHtml(labels.noWalletsFound)}</div>`;
  return `<div class="twk-all-wallets">
    ${createNetworkBadgeHtml(viewModel)}
    <label class="twk-search-field">
      <span class="twk-sr-only">${escapeHtml(labels.searchWallet)}</span>
      <input class="twk-wallet-search-input" data-twk-search="wallets" type="search" value="${escapeAttribute(viewModel.searchQuery ?? "")}" placeholder="${escapeAttribute(labels.searchPlaceholder)}" autocomplete="off" />
      <span class="twk-search-icon" aria-hidden="true">${searchIcon()}</span>
    </label>
    ${gridBody}
    ${createStatusHtml(viewModel.errorMessage, viewModel.errorMessage ? "danger" : "idle")}
    ${createPoweredByFooterHtml(viewModel)}
  </div>`;
}

function createPoweredByFooterHtml(viewModel: Pick<ConnectModalViewModel, "showPoweredBy" | "poweredByText"> & { labels: ConnectModalLabels }): string {
  return viewModel.showPoweredBy === false ? "" : `<div class="twk-footer">${escapeHtml(viewModel.poweredByText ?? viewModel.labels.poweredBy)}</div>`;
}

function createWalletSkeletonGridHtml(count: number, layout: "list" | "card", scope?: "featured" | "all"): string {
  const card = layout === "card"
    ? `<span class="twk-wallet-card" data-loading="true" aria-hidden="true"><span class="twk-wallet-icon" data-loading="true"><span class="twk-skeleton"></span></span><span class="twk-wallet-name" data-loading="true"><span class="twk-skeleton"></span></span></span>`
    : `<span class="twk-wallet-row" data-loading="true" aria-hidden="true"><span class="twk-wallet-main"><span class="twk-wallet-icon" data-loading="true"><span class="twk-skeleton"></span></span><span class="twk-wallet-name" data-loading="true"><span class="twk-skeleton"></span></span></span><span class="twk-badge" data-loading="true" data-tone="muted"><span class="twk-skeleton"></span></span></span>`;
  return `<div class="twk-wallet-grid" data-layout="${escapeAttribute(layout)}" ${scope ? `data-scope="${escapeAttribute(scope)}"` : ""} data-loading="true">${card.repeat(count)}</div>`;
}

function getWalletPlatforms(wallet: WalletOptionViewModel): Array<"extension" | "mobile" | "hardware"> {
  return (wallet.platforms?.length ? wallet.platforms : inferWalletPlatforms(wallet)).filter((platform) => platform === "extension" || platform === "mobile" || platform === "hardware");
}

function createInstallRowHtml(name: string, installUrl: string | undefined, labels: ConnectModalLabels): string {
  if (!installUrl) return "";
  return `<div class="twk-install-row"><span>${escapeHtml(`${labels.dontHave} ${name}?`)}</span><a class="twk-action twk-link twk-install-action" href="${escapeAttribute(installUrl)}" target="_blank" rel="noreferrer">${createActionContentHtml(externalIcon(), labels.getWallet)}</a></div>`;
}

function createConnectingHtml(viewModel: ConnectModalViewModel & { labels: ConnectModalLabels }): string {
  const labels = viewModel.labels;
  const wallet = resolveActiveWallet(viewModel.wallets, viewModel.activeWalletId ?? viewModel.selectedWalletId);
  if (!wallet) return createFeaturedHtml(viewModel);
  const installUrl = wallet.downloadUrl ?? wallet.homepage;
  const installRow = createInstallRowHtml(wallet.name, installUrl, labels);
  const hasError = Boolean(viewModel.errorMessage);
  const displayError = hasError ? normalizeConnectErrorMessage(viewModel.errorMessage, wallet) : undefined;
  const retryBusy = viewModel.retryState === "busy";
  const retryIcon = retryBusy ? actionSpinnerIcon() : refreshIcon();
  return `<div class="twk-connect-detail">
    ${createConnectingWalletIconHtml(wallet, hasError)}
    <h3 class="twk-title twk-view-title" ${hasError ? `data-tone="danger"` : ""}>${escapeHtml(hasError ? labels.connectionDeclined : `${labels.continueInWallet} ${wallet.name}`)}</h3>
    <p class="twk-detail-subtitle">${escapeHtml(hasError ? displayError ?? labels.acceptRequest : labels.acceptRequest)}</p>
    <div class="twk-detail-actions">
      <button class="twk-action" type="button" data-twk-action="retry" ${retryBusy ? `data-busy="true" disabled` : ""}>${createActionContentHtml(retryIcon, labels.tryAgain, retryBusy ? "busy" : undefined)}</button>
    </div>
    ${installRow}
  </div>`;
}

function createQrHtml(viewModel: ConnectModalViewModel & { labels: ConnectModalLabels }): string {
  const labels = viewModel.labels;
  const wallet = resolveActiveWallet(viewModel.wallets, viewModel.activeWalletId ?? viewModel.selectedWalletId);
  const name = wallet?.name ?? "WalletConnect";
  const installUrl = wallet
    ? wallet.downloadUrl ?? wallet.homepage
    : undefined;
  const isQrTransport = wallet?.capabilities?.includes("qr") || wallet?.transport === "qr" || wallet?.transport === "walletconnect" || wallet?.id === "walletconnect";
  const copyState = viewModel.qrCopyState === "copied" ? "success" : undefined;
  const copyIcon = viewModel.qrCopyState === "copied" ? checkIcon() : linkIcon();
  const retryBusy = viewModel.retryState === "busy";
  const retryIcon = retryBusy ? actionSpinnerIcon() : refreshIcon();
  const installRow = wallet?.id === "walletconnect" ? "" : createInstallRowHtml(name, installUrl, labels);
  const qrContent = viewModel.qrUri
    ? `<span class="twk-qr-code" data-twk-qr-code="true" ${viewModel.qrRenderState === "error" ? 'data-twk-qr-renderer="error"' : ""}>${viewModel.qrRenderState === "error" ? `<span class="twk-qr-error">${escapeHtml(labels.qrRenderFailed)}</span>` : viewModel.qrImageSrc ? `<img src="${escapeAttribute(viewModel.qrImageSrc)}" alt="${escapeAttribute(`${name} ${labels.qrCode}`)}" />${wallet ? `<span class="twk-qr-center-logo">${createWalletIconHtml(wallet)}</span>` : ""}` : `<span class="twk-qr-skeleton" aria-hidden="true"></span>`}</span>`
    : `<span class="twk-qr-code" data-loading="true" data-twk-qr-code="true"><span class="twk-qr-skeleton" aria-hidden="true"></span><span class="twk-sr-only">${escapeHtml(labels.qrCode)}</span></span>`;
  return `<div class="twk-connect-detail">
    <div class="twk-qr-slot twk-qr-large">${qrContent}</div>
    <p class="twk-detail-subtitle">${escapeHtml(isQrTransport ? labels.scanQr : labels.acceptRequest)}</p>
    <div class="twk-detail-actions">
      <button class="twk-action" type="button" data-twk-action="copy-uri" ${viewModel.qrUri ? "" : "disabled"}>${createActionContentHtml(copyIcon, labels.copyLink, copyState)}</button>
      <button class="twk-action" type="button" data-twk-action="retry" ${retryBusy ? `data-busy="true" disabled` : ""}>${createActionContentHtml(retryIcon, labels.tryAgain, retryBusy ? "busy" : undefined)}</button>
    </div>
    ${createErrorHtml(viewModel.errorMessage ? normalizeConnectErrorMessage(viewModel.errorMessage, wallet) : undefined)}
    ${installRow}
  </div>`;
}

function createWalletRowHtml(wallet: WalletOptionViewModel, labels: ConnectModalLabels, selectedWalletId?: string): string {
  const disabled = isWalletDisabled(wallet);
  const isConnecting = selectedWalletId === wallet.id || wallet.status === "connecting";
  const badge = wallet.badge ?? resolveWalletBadge(wallet, labels);
  const statusLabel = wallet.disabledReason ?? (disabled ? labels.unavailable : isConnecting ? labels.connecting : badge.label);
  return `<button class="twk-wallet-row" type="button" data-twk-wallet-id="${escapeAttribute(wallet.id)}" data-twk-adapter-id="${escapeAttribute(wallet.adapterId ?? wallet.id)}" data-twk-platforms="${escapeAttribute(getWalletPlatforms(wallet).join(" "))}" aria-label="${escapeAttribute(`${wallet.name}: ${statusLabel}`)}" ${disabled ? "disabled" : ""}>
  <span class="twk-wallet-main">
    ${createWalletIconHtml(wallet)}
    ${createWalletNameHtml(wallet)}
  </span>
  ${createWalletBadgeHtml(wallet, isConnecting ? labels.connecting : badge.label, badge.tone)}
</button>`;
}

function createWalletCardHtml(wallet: WalletOptionViewModel, labels: ConnectModalLabels, selectedWalletId?: string): string {
  const disabled = isWalletDisabled(wallet);
  const isConnecting = selectedWalletId === wallet.id || wallet.status === "connecting";
  const badge = wallet.badge ?? resolveWalletBadge(wallet, labels);
  const statusLabel = wallet.disabledReason ?? (disabled ? labels.unavailable : isConnecting ? labels.connecting : badge.label);
  const indicator = createWalletStatusIndicatorHtml(wallet, labels, isConnecting);
  return `<button class="twk-wallet-card" type="button" data-twk-wallet-id="${escapeAttribute(wallet.id)}" data-twk-adapter-id="${escapeAttribute(wallet.adapterId ?? wallet.id)}" data-twk-platforms="${escapeAttribute(getWalletPlatforms(wallet).join(" "))}" aria-label="${escapeAttribute(`${wallet.name}: ${statusLabel}`)}" ${disabled ? "disabled" : ""} ${wallet.readyState === "loading" ? 'data-loading="true"' : ""}>
    <span class="twk-wallet-icon-wrap">${createWalletIconHtml(wallet)}${indicator}</span>
    ${createWalletNameHtml(wallet)}
  </button>`;
}

function createWalletCollectionHtml(wallets: readonly WalletOptionViewModel[], labels: ConnectModalLabels, selectedWalletId: string | undefined, layout: "list" | "card", scope: "featured" | "all"): string {
  const items = wallets.map((wallet) => layout === "card" ? createWalletCardHtml(wallet, labels, selectedWalletId) : createWalletRowHtml(wallet, labels, selectedWalletId)).join("");
  return `<div class="twk-wallet-grid" data-layout="${escapeAttribute(layout)}" data-scope="${escapeAttribute(scope)}">${items}</div>`;
}

function resolveWalletListLayout(config: ConnectModalViewModel["walletList"]): "list" | "card" {
  return config?.layout === "card" || config?.layout === "grid" ? "card" : "list";
}

function createWalletStatusIndicatorHtml(wallet: WalletOptionViewModel, labels: ConnectModalLabels, isConnecting: boolean): string {
  if (wallet.readyState === "loading") return "";
  if (isConnecting) return `<span class="twk-wallet-status" data-status="connecting" aria-hidden="true">${actionSpinnerIcon()}</span>`;
  if (wallet.status === "error") return `<span class="twk-wallet-status" data-status="error" aria-label="${escapeAttribute(labels.unavailable)}">${statusErrorIcon()}</span>`;
  if (isQrWallet(wallet)) {
    return `<span class="twk-wallet-status" data-status="qr" aria-label="${escapeAttribute(labels.qrCode)}">${qrIcon()}</span>`;
  }
  if (wallet.readyState === "found" || wallet.available === true) {
    return `<span class="twk-wallet-status" data-status="installed" aria-label="${escapeAttribute(labels.installed)}"></span>`;
  }
  return "";
}

function createWalletNameHtml(wallet: WalletOptionViewModel): string {
  if (wallet.readyState === "loading") {
    return `<span class="twk-wallet-name" data-loading="true"><span class="twk-skeleton" aria-hidden="true"></span><span class="twk-sr-only">${escapeHtml(wallet.name)}</span></span>`;
  }
  return `<span class="twk-wallet-name">${escapeHtml(wallet.name)}</span>`;
}

function createWalletBadgeHtml(wallet: WalletOptionViewModel, label: string, tone?: NonNullable<WalletOptionViewModel["badge"]>["tone"]): string {
  if (wallet.readyState === "loading") {
    return `<span class="twk-badge" data-loading="true" data-tone="muted"><span class="twk-skeleton" aria-hidden="true"></span><span class="twk-sr-only">${escapeHtml(label)}</span></span>`;
  }
  return `<span class="twk-badge" data-tone="${escapeAttribute(tone ?? "muted")}">${escapeHtml(label)}</span>`;
}

function createWalletIconHtml(wallet: WalletOptionViewModel): string {
  if (wallet.readyState === "loading") {
    return `<span class="twk-wallet-icon" data-loading="true"><span class="twk-skeleton" aria-hidden="true"></span></span>`;
  }
  const icon = wallet.icon
    ? `<img src="${escapeAttribute(wallet.icon)}" alt="" aria-hidden="true" onerror="this.remove()" /><span class="twk-wallet-icon-fallback" aria-hidden="true">${escapeHtml(wallet.name.slice(0, 1).toUpperCase())}</span>`
    : `<span aria-hidden="true">${escapeHtml(wallet.name.slice(0, 1).toUpperCase())}</span>`;
  return `<span class="twk-wallet-icon">${icon}</span>`;
}

function createLargeWalletIconHtml(wallet: WalletOptionViewModel): string {
  const icon = wallet.icon
    ? `<img src="${escapeAttribute(wallet.icon)}" alt="" aria-hidden="true" onerror="this.remove()" /><span class="twk-wallet-icon-fallback" aria-hidden="true">${escapeHtml(wallet.name.slice(0, 1).toUpperCase())}</span>`
    : `<span aria-hidden="true">${escapeHtml(wallet.name.slice(0, 1).toUpperCase())}</span>`;
  return `<span class="twk-wallet-icon-large">${icon}</span>`;
}

function createConnectingWalletIconHtml(wallet: WalletOptionViewModel, hasError: boolean): string {
  return `<span class="twk-connecting-icon-wrap" data-state="${hasError ? "error" : "pending"}">
    ${hasError ? "" : createConnectingRingHtml()}
    ${createLargeWalletIconHtml(wallet)}
    ${hasError ? `<span class="twk-connecting-error-dot" aria-hidden="true">${statusErrorIcon()}</span>` : ""}
  </span>`;
}

function createConnectingRingHtml(): string {
  return `<span class="twk-connecting-ring" aria-hidden="true">
    <svg class="twk-connecting-ring-svg" viewBox="0 0 110 110" width="110" height="110" focusable="false">
      <rect class="twk-connecting-ring-accent" x="8" y="8" width="94" height="94" rx="36" pathLength="240"></rect>
    </svg>
  </span>`;
}

function createAllWalletsTriggerLabel(label: string): string {
  return label === "All Wallets" ? "All wallets" : label;
}

function createErrorHtml(message?: string): string {
  return message ? `<div class="twk-error" role="alert">${escapeHtml(message)}</div>` : "";
}

function createStatusHtml(message: string | undefined, tone: "idle" | "danger" = "idle"): string {
  const content = message ? escapeHtml(message) : "";
  return `<div class="twk-status" role="${tone === "danger" ? "alert" : "status"}" aria-live="polite" data-tone="${escapeAttribute(tone)}" ${message ? "" : 'aria-hidden="true"'}>${content}</div>`;
}

function createNetworkBadgeHtml(viewModel: ConnectModalViewModel): string {
  if (!viewModel.networkName) return "";
  const networkType = viewModel.networkType ?? "";
  const tone = networkType.toLowerCase().includes("main") ? "mainnet" : "testnet";
  if (tone === "mainnet") return "";
  return `<div class="twk-network-badge" data-tone="${escapeAttribute(tone)}"><span>${escapeHtml(viewModel.networkName)}</span>${networkType ? `<span>${escapeHtml(networkType)}</span>` : ""}</div>`;
}

function isWalletDisabled(wallet: WalletOptionViewModel): boolean {
  if (isHardwareWallet(wallet)) return false;
  return wallet.readyState === "unsupported" || (wallet.readyState === "notFound" && !isQrWallet(wallet));
}

export function resolveActiveWallet(wallets: readonly WalletOptionViewModel[], walletId?: string): WalletOptionViewModel | undefined {
  return wallets.find((wallet) => wallet.id === walletId) ?? wallets.find((wallet) => wallet.adapterId === walletId);
}

export function resolveQrEventWallet(wallets: readonly WalletOptionViewModel[], adapterId: string, preferredWalletId?: string): WalletOptionViewModel | undefined {
  const preferred = preferredWalletId ? resolveActiveWallet(wallets, preferredWalletId) : undefined;
  if (preferred && (preferred.adapterId ?? preferred.id) === adapterId) return preferred;
  return wallets.find((wallet) => wallet.id === adapterId) ?? wallets.find((wallet) => wallet.id === "walletconnect") ?? wallets.find((wallet) => (wallet.adapterId ?? wallet.id) === adapterId);
}

export function resolveHeaderTitle(view: ConnectModalView, labels: ConnectModalLabels, activeWallet?: WalletOptionViewModel): string {
  if (view === "all-wallets") return labels.allWallets;
  if (view === "connecting" || view === "qr") return activeWallet?.name ?? labels.title;
  return labels.title;
}
