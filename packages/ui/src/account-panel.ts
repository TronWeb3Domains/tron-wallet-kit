import { createElementFromHtml } from "./dom";
import { createActionContentHtml } from "./actions";
import { backIcon, checkIcon, closeIcon, copyIcon, externalIcon, logoutIcon, qrIcon, sendIcon } from "./icons";
import { en } from "./locales/en";
import { escapeAttribute, escapeHtml, shortenAddress } from "./utils";
import type { AccountPanelLabels, AccountPanelViewModel, AddressQrPanelViewModel, RecentTransactionViewModel } from "./types";

const defaultAccountPanelLabels: AccountPanelLabels = en.accountPanel;

export function createAccountPanelHtml(viewModel: AccountPanelViewModel): string {
  const labels = { ...defaultAccountPanelLabels, ...viewModel.labels };
  const hasIdentityName = Boolean(viewModel.account.domain ?? viewModel.account.displayName);
  const displayName = viewModel.account.domain ?? viewModel.account.displayName;
  const balanceText = viewModel.balanceTrx ? `${viewModel.balanceTrx} TRX` : "";
  const identityHtml = viewModel.identityLoading
    ? `<div class="twk-domain twk-skeleton-line" data-loading="true"><span class="twk-skeleton" aria-hidden="true"></span><span class="twk-sr-only">${escapeHtml(shortenAddress(viewModel.account.address))}</span></div>`
    : hasIdentityName
      ? `<div class="twk-domain">${escapeHtml(displayName!)}</div>`
      : "";
  const balanceHtml = viewModel.balanceLoading
    ? `<span class="twk-pill-balance twk-skeleton-pill" data-loading="true"><span class="twk-skeleton" aria-hidden="true"></span><span class="twk-sr-only">Loading balance</span></span>`
    : balanceText
      ? `<span class="twk-pill-balance">${escapeHtml(balanceText)}</span>`
      : "";
  const copyStatusLabel = viewModel.copyState === "copied" ? labels.copied : labels.copy;
  const explorerUrl = viewModel.explorerUrl ?? viewModel.account.network?.explorerAccountUrl?.replace("{address}", viewModel.account.address);
  const avatar = viewModel.account.avatar
    ? `<img src="${escapeAttribute(viewModel.account.avatar)}" alt="" aria-hidden="true" />`
    : `<span class="twk-avatar-spot" aria-hidden="true"></span>`;
  const copyIconHtml = viewModel.copyState === "copied" ? checkIcon() : copyIcon();
  const copyState = viewModel.copyState === "copied" ? "success" : undefined;
  const explorerButton = viewModel.showExplorerButton && explorerUrl
    ? `<a class="twk-action" href="${escapeAttribute(explorerUrl)}" target="_blank" rel="noreferrer">${createActionContentHtml(externalIcon(), labels.explorer)}</a>`
    : "";
  const disconnectButton =
    viewModel.showDisconnectButton === false
      ? ""
      : `<button class="twk-action" type="button" data-twk-action="disconnect">${createActionContentHtml(logoutIcon(), labels.disconnect)}</button>`;
  const sendButton = viewModel.showSendButton
    ? `<button class="twk-action twk-primary" type="button" data-twk-action="send">${createActionContentHtml(sendIcon(), "Send")}</button>`
    : "";
  const qrButton = viewModel.showAddressQrButton
    ? `<button class="twk-address-qr-action" type="button" data-twk-action="address-qr" aria-label="${escapeAttribute(labels.showQr)}">${qrIcon()}</button>`
    : "";
  const qr = viewModel.addressQr
    ? `<img src="${escapeAttribute(viewModel.addressQr.src)}" alt="${escapeAttribute(viewModel.addressQr.alt ?? labels.qrAlt)}" />`
    : `<span class="twk-muted">${escapeHtml(labels.qrAlt)}</span>`;
  const transactionCount = viewModel.recentTransactions?.length ?? 0;
  const maxVisibleTransactions = Math.max(1, Math.trunc(viewModel.maxVisibleTransactions ?? 3));
  const visibleTransactions = viewModel.recentTransactions?.slice(0, maxVisibleTransactions) ?? [];
  const transactions =
    viewModel.transactionsLoading
      ? createTransactionSkeletonRowsHtml(Math.min(3, maxVisibleTransactions))
      : visibleTransactions.length > 0
      ? visibleTransactions.map(createTransactionRowHtml).join("")
      : `<div class="twk-tx-empty">${escapeHtml(labels.noTransactions)}</div>`;
  const recent =
    transactionCount > 0 || viewModel.transactionsLoading
      ? `<section class="twk-tx-section" aria-label="${escapeAttribute(labels.recentTransactions)}">
        <div class="twk-tx-header">
          <span>${escapeHtml(labels.recentTransactions)}</span>
          <span class="twk-tx-count${viewModel.transactionsLoading ? " twk-skeleton-pill" : ""}" ${viewModel.transactionsLoading ? 'data-loading="true"' : ""}>${viewModel.transactionsLoading ? '<span class="twk-skeleton" aria-hidden="true"></span><span class="twk-sr-only">Loading transactions</span>' : transactionCount > 9 ? "9+" : transactionCount}</span>
          ${transactionCount > maxVisibleTransactions ? `<button class="twk-tx-header-link" type="button" data-twk-action="tx-history">View ${externalIcon()}</button>` : ""}
        </div>
        <div class="twk-tx-list"><div class="twk-tx-list-inner">${transactions}</div></div>
      </section>`
      : "";
  const showBalanceDivider = Boolean(balanceHtml);
  const metaPill = `<div class="twk-account-meta-pill">
    <span class="twk-pill-address">${escapeHtml(shortenAddress(viewModel.account.address))}</span>
    ${showBalanceDivider ? `<span class="twk-pill-divider" aria-hidden="true"></span>${balanceHtml}` : ""}
    ${qrButton}
  </div>`;

  return `<section class="twk-account-panel" data-has-recent="${recent ? "true" : "false"}" aria-labelledby="twk-account-title">
  <header class="twk-header">
    <span class="twk-back" data-hidden="true" aria-hidden="true"></span>
    <div class="twk-header-main">
      <h2 class="twk-title" id="twk-account-title">${escapeHtml(labels.title)}</h2>
    </div>
    <span class="twk-back" data-hidden="true" aria-hidden="true"></span>
  </header>
  <div class="twk-account-body">
    <div class="twk-account-card" data-avatar-tone="${avatarTone(viewModel.account.address)}" data-has-recent="${recent ? "true" : "false"}">
      <div class="twk-account-hero">
        <div class="twk-account-avatar">${avatar}</div>
        <div class="twk-identity">
          ${identityHtml}
          ${metaPill}
        </div>
      </div>
      ${recent}
      <div class="twk-actions">
        <button class="twk-action" type="button" data-twk-action="copy" aria-describedby="twk-copy-status">${createActionContentHtml(copyIconHtml, labels.copy, copyState)}</button>
        <span class="twk-sr-only" id="twk-copy-status" aria-live="polite">${escapeHtml(copyStatusLabel)}</span>
        ${explorerButton}
        ${sendButton}
        ${disconnectButton}
      </div>
    </div>
  </div>
  ${viewModel.showAddressQrButton ? "" : `<div class="twk-section">
    <div class="twk-qr-slot">${qr}</div>
  </div>`}
</section>`;
}

export function createTransactionHistoryPanelHtml(viewModel: AccountPanelViewModel): string {
  const labels = { ...defaultAccountPanelLabels, ...viewModel.labels };
  const transactionCount = viewModel.recentTransactions?.length ?? 0;
  const transactions =
    viewModel.transactionsLoading
      ? createTransactionSkeletonRowsHtml(3)
      : transactionCount > 0
      ? viewModel.recentTransactions!.map(createTransactionRowHtml).join("")
      : `<div class="twk-tx-empty">${escapeHtml(labels.noTransactions)}</div>`;

  return `<section class="twk-account-panel" data-twk-account-view="tx-history" aria-labelledby="twk-tx-history-title">
  <header class="twk-header">
    <button class="twk-back" type="button" data-twk-action="account-back" aria-label="${escapeAttribute(labels.back)}">${backIcon()}</button>
    <div class="twk-header-main">
      <h2 class="twk-title" id="twk-tx-history-title">${escapeHtml(labels.recentTransactions)}</h2>
    </div>
    <button class="twk-close" type="button" data-twk-action="close-account" aria-label="${escapeAttribute(labels.close)}">${closeIcon()}</button>
  </header>
  <div class="twk-account-body">
    <section class="twk-tx-section twk-tx-history-view" aria-label="${escapeAttribute(labels.recentTransactions)}">
      <div class="twk-tx-header">
        <span>${escapeHtml(labels.recentTransactions)}</span>
        <span class="twk-tx-count${viewModel.transactionsLoading ? " twk-skeleton-pill" : ""}" ${viewModel.transactionsLoading ? 'data-loading="true"' : ""}>${viewModel.transactionsLoading ? '<span class="twk-skeleton" aria-hidden="true"></span><span class="twk-sr-only">Loading transactions</span>' : transactionCount > 9 ? "9+" : transactionCount}</span>
      </div>
      <div class="twk-tx-list"><div class="twk-tx-list-inner">${transactions}</div></div>
    </section>
  </div>
</section>`;
}

export function createAccountPanelElement(viewModel: AccountPanelViewModel, documentRef = globalThis.document): HTMLElement {
  return createElementFromHtml(createAccountPanelHtml(viewModel), documentRef);
}

export function createAddressQrPanelHtml(viewModel: AddressQrPanelViewModel): string {
  const labels = { ...defaultAccountPanelLabels, ...viewModel.labels };
  const copyStatusLabel = viewModel.copyState === "copied" ? labels.copied : labels.copy;
  const copyIconHtml = viewModel.copyState === "copied" ? checkIcon() : copyIcon();
  const copyState = viewModel.copyState === "copied" ? "success" : undefined;
  const qrContent = viewModel.qrImageSrc
    ? `<img src="${escapeAttribute(viewModel.qrImageSrc)}" alt="${escapeAttribute(labels.qrAlt)}" />`
    : `<span class="twk-qr-code" data-twk-address-qr-code="true" data-loading="true"><span class="twk-qr-skeleton twk-skeleton-qr" aria-hidden="true"></span></span>`;

  return `<section class="twk-account-panel" data-twk-account-view="address-qr" aria-labelledby="twk-address-qr-title">
  <header class="twk-header">
    <button class="twk-back" type="button" data-twk-action="account-back" aria-label="${escapeAttribute(labels.back)}">${backIcon()}</button>
    <div class="twk-header-main">
      <h2 class="twk-title" id="twk-address-qr-title">${escapeHtml(labels.addressTitle)}</h2>
    </div>
    <button class="twk-close" type="button" data-twk-action="close-account" aria-label="${escapeAttribute(labels.close)}">${closeIcon()}</button>
  </header>
  <div class="twk-section twk-address-qr-view">
    <div class="twk-qr-slot twk-address-qr-slot">${qrContent}</div>
    <div class="twk-address-chip twk-address-chip-full">${escapeHtml(viewModel.address)}</div>
    <div class="twk-actions">
      <button class="twk-action" type="button" data-twk-action="copy" aria-describedby="twk-copy-status">${createActionContentHtml(copyIconHtml, labels.copy, copyState)}</button>
      <span class="twk-sr-only" id="twk-copy-status" aria-live="polite">${escapeHtml(copyStatusLabel)}</span>
    </div>
  </div>
</section>`;
}

function createTransactionRowHtml(transaction: RecentTransactionViewModel): string {
  const txHash = transaction.txHash ? shortenAddress(transaction.txHash) : "";
  const link = transaction.explorerUrl
    ? `<a class="twk-tx-link" href="${escapeAttribute(transaction.explorerUrl)}" target="_blank" rel="noreferrer">View ${externalIcon()}</a>`
    : `<span class="twk-tx-status" data-status="${escapeAttribute(transaction.status)}">${escapeHtml(transaction.status)}</span>`;
  return `<div class="twk-tx-row" data-twk-transaction-id="${escapeAttribute(transaction.id)}">
  <span class="twk-tx-icon" data-status="${escapeAttribute(transaction.status)}" aria-hidden="true"></span>
  <span class="twk-tx-main"><span class="twk-tx-label">${escapeHtml(transaction.label)}</span><span class="twk-tx-hash">${escapeHtml(txHash || transaction.status)}</span></span>
  ${link}
</div>`;
}

function createTransactionSkeletonRowsHtml(count: number): string {
  return Array.from({ length: Math.max(1, count) }, () => `<div class="twk-tx-row twk-tx-skeleton-row twk-skeleton-row" data-loading="true" aria-hidden="true">
  <span class="twk-tx-icon twk-skeleton-circle" data-loading="true"><span class="twk-skeleton"></span></span>
  <span class="twk-tx-main">
    <span class="twk-tx-label twk-skeleton-line" data-loading="true"><span class="twk-skeleton"></span></span>
    <span class="twk-tx-hash twk-skeleton-line" data-loading="true"><span class="twk-skeleton"></span></span>
  </span>
  <span class="twk-action twk-skeleton-button" data-loading="true"><span class="twk-skeleton"></span></span>
</div>`).join("");
}

function avatarTone(address: string): string {
  let hash = 0;
  for (let index = 0; index < address.length; index += 1) {
    hash = (hash * 31 + address.charCodeAt(index)) % 6;
  }
  return String(hash);
}
