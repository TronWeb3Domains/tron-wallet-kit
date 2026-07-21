import { createElementFromHtml } from "./dom";
import { createActionContentHtml } from "./actions";
import {
  backIcon,
  checkIcon,
  closeIcon,
  copyIcon,
  externalIcon,
  logoutIcon,
  qrIcon,
  sendIcon,
  arrowDownIcon,
  arrowUpIcon,
  fileCheckIcon,
  lockClosedIcon,
  lockOpenIcon,
  voteIcon,
  giftIcon,
  codeIcon,
  questionIcon
} from "./icons";
import { en } from "./locales/en";
import { escapeAttribute, escapeHtml, shortenAddress } from "./utils";
import type { AccountPanelLabels, AccountPanelViewModel, ActivityLabels, AddressQrPanelViewModel, RecentTransactionViewModel, TransactionKind } from "./types";

const defaultAccountPanelLabels: AccountPanelLabels = en.accountPanel;
const defaultActivityLabels: ActivityLabels = en.activity;
const DEFAULT_DATE_LOCALE = "en-US";

export function createAccountPanelHtml(viewModel: AccountPanelViewModel): string {
  const labels = { ...defaultAccountPanelLabels, ...viewModel.labels };
  if (viewModel.gasFree?.configured && viewModel.gasFree.mode === "gasfree") {
    return createGasFreeAccountPanelHtml(viewModel, labels);
  }
  const activityLabels = { ...defaultActivityLabels, ...viewModel.activityLabels };
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
      ? visibleTransactions.map((transaction) => createActivityTransactionRowHtml(transaction, activityLabels, "compact")).join("")
      : createTransactionEmptyHtml(labels.noTransactions);
  const recent =
    transactionCount > 0 || viewModel.transactionsLoading
      ? `<section class="twk-tx-section" aria-label="${escapeAttribute(labels.recentTransactions)}">
        <div class="twk-tx-header">
          <span>${escapeHtml(labels.recentTransactions)}</span>
          <span class="twk-tx-count${viewModel.transactionsLoading ? " twk-skeleton-pill" : ""}" ${viewModel.transactionsLoading ? 'data-loading="true"' : ""}>${viewModel.transactionsLoading ? '<span class="twk-skeleton" aria-hidden="true"></span><span class="twk-sr-only">Loading transactions</span>' : transactionCount > 9 ? "9+" : transactionCount}</span>
          ${transactionCount > maxVisibleTransactions ? `<button class="twk-tx-header-link" type="button" data-twk-action="tx-history">${escapeHtml(activityLabels.title)}</button>` : ""}
        </div>
        <div class="twk-tx-list"><div class="twk-tx-list-inner">${transactions}</div></div>
      </section>`
      : "";
  const gasFreeChip =
    viewModel.gasFree?.configured
        ? `<button class="twk-gasfree-chip" type="button" data-twk-action="gasfree-mode" data-enabled="${viewModel.gasFree.enabled ? "true" : "false"}" aria-label="${escapeAttribute(viewModel.gasFree.enabled ? labels.gasFreeTitle : viewModel.gasFree.disabledReason ?? labels.gasFreeUnavailable)}" title="${escapeAttribute(viewModel.gasFree.enabled ? labels.gasFreeTitle : viewModel.gasFree.disabledReason ?? labels.gasFreeUnavailable)}">
        <span class="twk-gasfree-mark" aria-hidden="true">F</span>
        <span>${escapeHtml(labels.gasFree)}</span>
        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>`
      : "";
  const showBalanceDivider = Boolean(balanceHtml);
  const metaPill = `<div class="twk-account-meta-pill">
    <span class="twk-pill-address">${escapeHtml(shortenAddress(viewModel.account.address))}</span>
    ${showBalanceDivider ? `<span class="twk-pill-divider" aria-hidden="true"></span>${balanceHtml}` : ""}
    ${qrButton}
  </div>`;

  return `<section class="twk-account-panel" data-has-recent="${recent ? "true" : "false"}" aria-labelledby="twk-account-title">
  <header class="twk-header">
    <div class="twk-header-action" data-hidden="true" aria-hidden="true"><span class="twk-back" data-hidden="true" aria-hidden="true"></span></div>
    <div class="twk-header-main">
      <h2 class="twk-title" id="twk-account-title">${escapeHtml(labels.title)}</h2>
    </div>
    <div class="twk-header-action">${gasFreeChip || '<span class="twk-back" data-hidden="true" aria-hidden="true"></span>'}</div>
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
        <button class="twk-action" type="button" data-twk-action="copy" data-twk-copy-value="${escapeAttribute(viewModel.account.address)}" aria-describedby="twk-copy-status">${createActionContentHtml(copyIconHtml, labels.copy, copyState)}</button>
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

function createGasFreeAccountPanelHtml(viewModel: AccountPanelViewModel, labels: AccountPanelLabels): string {
  const gasFree = viewModel.gasFree!;
  const hasIdentityName = Boolean(viewModel.account.domain ?? viewModel.account.displayName);
  const displayName = viewModel.account.domain ?? viewModel.account.displayName;
  const identityHtml = viewModel.identityLoading
    ? `<div class="twk-domain twk-skeleton-line" data-loading="true"><span class="twk-skeleton" aria-hidden="true"></span><span class="twk-sr-only">${escapeHtml(shortenAddress(viewModel.account.address))}</span></div>`
    : hasIdentityName
      ? `<div class="twk-domain">${escapeHtml(displayName!)}</div>`
      : "";
  const avatar = viewModel.account.avatar
    ? `<img src="${escapeAttribute(viewModel.account.avatar)}" alt="" aria-hidden="true" />`
    : `<span class="twk-avatar-spot" aria-hidden="true"></span>`;
  const copyStatusLabel = viewModel.copyState === "copied" ? labels.copied : labels.copy;
  const copyIconHtml = viewModel.copyState === "copied" ? checkIcon() : copyIcon();
  const copyState = viewModel.copyState === "copied" ? "success" : undefined;
  const address = gasFree.address;
  const balance = gasFree.balance;
  const balanceHtml = gasFree.isLoading && !balance
    ? `<span class="twk-pill-balance twk-skeleton-pill" data-loading="true"><span class="twk-skeleton" aria-hidden="true"></span><span class="twk-sr-only">${escapeHtml(labels.gasFreeBalanceLoading)}</span></span>`
    : balance
      ? `<span class="twk-pill-balance">${escapeHtml(balance.formatted)} ${escapeHtml(balance.symbol)}</span>`
      : `<span class="twk-pill-balance twk-muted">-- USDT</span>`;
  const metaPill = address
    ? `<div class="twk-account-meta-pill twk-gasfree-meta-pill">
      <span class="twk-pill-address">${escapeHtml(shortenAddress(address))}</span>
      <span class="twk-pill-divider" aria-hidden="true"></span>
      ${balanceHtml}
      <button class="twk-address-qr-action" type="button" data-twk-action="gasfree-address-qr" aria-label="${escapeAttribute(labels.showQr)}">${qrIcon()}</button>
    </div>`
    : gasFree.isLoading
      ? `<div class="twk-account-meta-pill twk-gasfree-meta-pill twk-skeleton-line" data-loading="true"><span class="twk-skeleton" aria-hidden="true"></span><span class="twk-sr-only">${escapeHtml(labels.gasFreeAddress)}</span></div>`
      : `<div class="twk-address-chip twk-address-chip-full">${escapeHtml(gasFree.error ?? gasFree.disabledReason ?? labels.gasFreeUnavailable)}</div>`;
  const copyButton = address
    ? `<button class="twk-action" type="button" data-twk-action="copy" data-twk-copy-value="${escapeAttribute(address)}" aria-describedby="twk-copy-status">${createActionContentHtml(copyIconHtml, labels.copy, copyState)}</button>`
    : "";

  return `<section class="twk-account-panel" data-twk-account-view="gasfree" aria-labelledby="twk-gasfree-title">
  <header class="twk-header">
    <button class="twk-back" type="button" data-twk-action="gasfree-back" aria-label="${escapeAttribute(labels.backToGeneral)}">${backIcon()}</button>
    <div class="twk-header-main">
      <h2 class="twk-title" id="twk-gasfree-title">${escapeHtml(labels.gasFreeTitle)}</h2>
    </div>
    <button class="twk-close" type="button" data-twk-action="close-account" aria-label="${escapeAttribute(labels.close)}">${closeIcon()}</button>
  </header>
  <div class="twk-account-body">
    <div class="twk-account-card twk-gasfree-card" data-avatar-tone="${avatarTone(viewModel.account.address)}">
      <div class="twk-account-hero">
        <div class="twk-account-avatar">${avatar}</div>
        <div class="twk-identity">
          ${identityHtml}
          ${metaPill}
        </div>
      </div>
      <div class="twk-actions">
        ${copyButton}
        <button class="twk-action" type="button" data-twk-action="gasfree-back">${createActionContentHtml(backIcon(), labels.backToGeneral)}</button>
      </div>
      <span class="twk-sr-only" id="twk-copy-status" aria-live="polite">${escapeHtml(copyStatusLabel)}</span>
    </div>
  </div>
</section>`;
}

export function createTransactionHistoryPanelHtml(viewModel: AccountPanelViewModel): string {
  const labels = { ...defaultAccountPanelLabels, ...viewModel.labels };
  const activityLabels = { ...defaultActivityLabels, ...viewModel.activityLabels };
  const transactionCount = viewModel.recentTransactions?.length ?? 0;
  const transactions =
    viewModel.transactionsLoading
      ? createTransactionSkeletonRowsHtml(3)
      : transactionCount > 0
      ? createActivityTransactionsHtml(viewModel.recentTransactions!, activityLabels)
      : createTransactionEmptyHtml(activityLabels.empty);

  return `<section class="twk-account-panel" data-twk-account-view="tx-history" aria-labelledby="twk-tx-history-title">
  <header class="twk-header">
    <button class="twk-back" type="button" data-twk-action="account-back" aria-label="${escapeAttribute(labels.back)}">${backIcon()}</button>
    <div class="twk-header-main">
      <h2 class="twk-title" id="twk-tx-history-title">${escapeHtml(activityLabels.title)}</h2>
    </div>
    <button class="twk-close" type="button" data-twk-action="close-account" aria-label="${escapeAttribute(labels.close)}">${closeIcon()}</button>
  </header>
  <div class="twk-account-body">
    <section class="twk-activity-section twk-tx-history-view" aria-label="${escapeAttribute(activityLabels.title)}">
      <div class="twk-tx-list twk-activity-scroll" data-overflow="${transactionCount > 3 ? "both" : "none"}"><div class="twk-tx-list-inner twk-activity-list">${transactions}</div></div>
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
      <button class="twk-action" type="button" data-twk-action="copy" data-twk-copy-value="${escapeAttribute(viewModel.address)}" aria-describedby="twk-copy-status">${createActionContentHtml(copyIconHtml, labels.copy, copyState)}</button>
      <span class="twk-sr-only" id="twk-copy-status" aria-live="polite">${escapeHtml(copyStatusLabel)}</span>
    </div>
  </div>
</section>`;
}

function createActivityTransactionsHtml(transactions: readonly RecentTransactionViewModel[], labels: ActivityLabels): string {
  let currentGroup = "";
  return transactions
    .map((transaction) => {
      const group = formatTransactionDayGroup(transaction.timestamp);
      const heading = group && group !== currentGroup ? `<div class="twk-activity-month">${escapeHtml(group)}</div>` : "";
      if (group) currentGroup = group;
      return `${heading}${createActivityTransactionRowHtml(transaction, labels)}`;
    })
    .join("");
}

function activityIconSvg(kind: TransactionKind): string {
  if (kind === "received" || kind === "receivedToken") return arrowDownIcon();
  if (kind === "sent" || kind === "sentToken") return arrowUpIcon();
  if (kind === "approve") return fileCheckIcon();
  if (kind === "staked" || kind === "delegated") return lockClosedIcon();
  if (kind === "unstaked" || kind === "undelegated") return lockOpenIcon();
  if (kind === "voted") return voteIcon();
  if (kind === "claimedRewards") return giftIcon();
  if (kind === "contractCall") return codeIcon();
  return questionIcon();
}

function createActivityTransactionRowHtml(transaction: RecentTransactionViewModel, labels: ActivityLabels, density: "regular" | "compact" = "regular"): string {
  const date = density === "compact" ? formatRelativeTransactionTime(transaction.timestamp) : "";
  const kind = transaction.kind ?? fallbackKindFromStatus(transaction.status);
  const title = transaction.title ?? formatActivityTitle(kind, transaction.token, transaction.resource, labels) ?? transaction.label;
  const statusSubtitle = transaction.status === "pending" || transaction.status === "failed" ? transaction.subtitle || statusLabel(transaction.status, labels) : "";
  const resourceSubtitle = transaction.resource ? resourceLabel(transaction.resource, labels) : "";
  const subtitle = statusSubtitle || transaction.subtitle || resourceSubtitle || (transaction.status === "success" ? "" : statusLabel(transaction.status, labels));
  const direction = transaction.direction ?? fallbackDirection(kind);
  const amountTone = transaction.status === "failed" ? "muted" : transaction.amountTone ?? (direction === "in" ? "in" : direction === "out" ? "out" : "muted");
  const amountText = normalizeActivityAmountText(transaction.amountText);
  const right = amountText
    ? `<span class="twk-activity-amount" data-tone="${escapeAttribute(amountTone)}" data-status="${escapeAttribute(transaction.status)}">${escapeHtml(amountText)}</span>`
    : createActivityStatusChipHtml(transaction.status, labels);
  const rowClass = density === "compact" ? "twk-activity-row twk-activity-row-compact" : "twk-activity-row";
  const sideMeta = date ? `<span class="twk-activity-date">${escapeHtml(date)}</span>` : "";
  const content = `<span class="twk-activity-icon" data-kind="${escapeAttribute(kind)}" data-direction="${escapeAttribute(direction)}" data-status="${escapeAttribute(transaction.status)}" aria-hidden="true">${activityIconSvg(kind)}${activityBadgeIcon(direction, transaction.status)}</span>
  <span class="twk-activity-main"><span class="twk-activity-title">${escapeHtml(title)}</span><span class="twk-activity-meta" data-status="${escapeAttribute(transaction.status)}">${escapeHtml(subtitle)}</span></span>
  <span class="twk-activity-side">${right}${sideMeta}</span>`;

  return transaction.explorerUrl
    ? `<a class="${rowClass}" href="${escapeAttribute(transaction.explorerUrl)}" target="_blank" rel="noreferrer" data-twk-transaction-id="${escapeAttribute(transaction.id)}" data-status="${escapeAttribute(transaction.status)}" aria-label="${escapeAttribute(labels.view)} ${escapeAttribute(title)}">${content}</a>`
    : `<div class="${rowClass}" data-twk-transaction-id="${escapeAttribute(transaction.id)}" data-status="${escapeAttribute(transaction.status)}">${content}</div>`;
}

function formatActivityTitle(kind: TransactionKind, token: string | undefined, resource: RecentTransactionViewModel["resource"], labels: ActivityLabels): string {
  if (kind === "receivedToken") return formatLabel(labels.receivedToken, { token: token ?? "TRC20" });
  if (kind === "sentToken") return formatLabel(labels.sentToken, { token: token ?? "TRC20" });
  if (kind === "approve") return formatLabel(labels.approve, { token: token ?? "TRC20" });
  if (kind === "delegated") return formatLabel(labels.delegated, { resource: resourceLabel(resource, labels) || labels.energy });
  if (kind === "undelegated") return formatLabel(labels.undelegated, { resource: resourceLabel(resource, labels) || labels.energy });
  return labels[kind] ?? labels.unknown;
}

function resourceLabel(resource: RecentTransactionViewModel["resource"], labels: ActivityLabels): string {
  if (resource === "bandwidth") return labels.bandwidth;
  if (resource === "energy") return labels.energy;
  return "";
}

function formatLabel(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => String(vars[key] ?? ""));
}

function fallbackKindFromStatus(status: RecentTransactionViewModel["status"]): TransactionKind {
  return status === "unknown" ? "unknown" : "contractCall";
}

function fallbackDirection(kind: TransactionKind): "in" | "out" | "neutral" {
  if (kind === "received" || kind === "receivedToken" || kind === "claimedRewards") return "in";
  if (kind === "sent" || kind === "sentToken") return "out";
  return "neutral";
}

function normalizeActivityAmountText(amountText: string | undefined): string {
  if (!amountText) return "";
  const normalized = amountText.trim();
  return /\d/.test(normalized) ? normalized : "";
}

function createActivityStatusChipHtml(status: RecentTransactionViewModel["status"], labels: ActivityLabels): string {
  if (status !== "pending" && status !== "failed") return "";
  const label = status === "pending" ? labels.pending : labels.failed;
  return `<span class="twk-activity-status twk-activity-status-chip" data-status="${escapeAttribute(status)}">${escapeHtml(label)}</span>`;
}

function statusLabel(status: RecentTransactionViewModel["status"], labels: ActivityLabels): string {
  if (status === "pending") return labels.pending;
  if (status === "failed") return labels.failed;
  if (status === "success") return labels.confirmed;
  return labels.unknown;
}

function activityBadgeIcon(direction: "in" | "out" | "neutral", status: RecentTransactionViewModel["status"]): string {
  if (status === "pending") {
    return `<span class="twk-activity-badge" data-status="pending"><svg class="twk-activity-spinner" width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true"><circle cx="26" cy="26" r="23" stroke="currentColor" stroke-opacity=".18" stroke-width="2.4"></circle><path d="M49 26a23 23 0 0 1-23 23" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path></svg></span>`;
  }
  if (status === "failed") {
    return `<span class="twk-activity-badge" data-status="failed"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></span>`;
  }
  if (direction === "in") {
    return `<span class="twk-activity-badge" data-direction="in"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7h10v10M17 7 6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
  }
  if (direction === "out") {
    return `<span class="twk-activity-badge" data-direction="out"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17V7h10M7 7l11 11" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
  }
  return "";
}

function formatTransactionDayGroup(timestamp?: string): string {
  const date = parseTransactionDate(timestamp);
  if (!date) return "";
  const today = startOfLocalDay(new Date());
  const target = startOfLocalDay(date);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return new Intl.DateTimeFormat(DEFAULT_DATE_LOCALE, { day: "2-digit", month: "short" }).format(date);
}

function formatTransactionDate(timestamp?: string): string {
  const date = parseTransactionDate(timestamp);
  if (!date) return "";
  return new Intl.DateTimeFormat(DEFAULT_DATE_LOCALE, { day: "2-digit", month: "short" }).format(date);
}

function formatRelativeTransactionTime(timestamp?: string): string {
  const date = parseTransactionDate(timestamp);
  if (!date) return "";
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs)) return "";
  const absMs = Math.abs(diffMs);
  const suffix = diffMs < 0 ? "from now" : "ago";
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (absMs < minute) return "now";
  if (absMs < hour) return `${Math.max(1, Math.round(absMs / minute))}m ${suffix}`;
  if (absMs < day) return `${Math.round(absMs / hour)}h ${suffix}`;
  if (absMs < 2 * day && diffMs >= 0) return "Yesterday";
  if (absMs < 7 * day) return `${Math.round(absMs / day)}d ${suffix}`;
  return formatTransactionDate(timestamp);
}

function parseTransactionDate(timestamp?: string): Date | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function createTransactionEmptyHtml(label: string): string {
  return `<div class="twk-tx-empty"><span class="twk-tx-empty-icon" aria-hidden="true">${codeIcon()}</span><span>${escapeHtml(label)}</span></div>`;
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
