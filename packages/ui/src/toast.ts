import type { WalletManager, WalletTransaction } from "@tron-wallet-kit/core";
import { resolveWalletUiConfig } from "./config";
import { applyThemeToElement, createWalletKitRoot, ensureWalletKitStyles } from "./dom";
import { checkIcon, closeIcon, externalIcon } from "./icons";
import { escapeAttribute, escapeHtml, shortenAddress } from "./utils";
import type { ThemeConfig, ToastPosition, TransactionToastViewModel, WalletToast, WalletUiConfig } from "./types";

export function createTransactionToastHtml(toast: TransactionToastViewModel): string {
  const link = toast.explorerUrl
    ? `<a class="twk-toast-link" href="${escapeAttribute(toast.explorerUrl)}" target="_blank" rel="noopener">View ${externalIcon()}</a>`
    : "";
  const icon =
    toast.status === "pending"
      ? `<span class="twk-toast-spinner" aria-hidden="true"></span>`
      : toast.status === "success"
        ? checkIcon()
        : toast.status === "failed"
          ? closeIcon()
          : "?";
  return `<div class="twk-toast" role="status" data-twk-toast-id="${escapeAttribute(toast.id)}" data-status="${escapeAttribute(toast.status)}">
  <span class="twk-toast-icon" aria-hidden="true">${icon}</span>
  <span class="twk-toast-body">
    <span class="twk-toast-label">${escapeHtml(toast.label)}</span>
    <span class="twk-toast-hash">${escapeHtml(toast.txHash ? shortenAddress(toast.txHash) : toast.status)}</span>
  </span>
  ${link}
  <button class="twk-toast-dismiss" type="button" data-twk-toast-dismiss="${escapeAttribute(toast.id)}" aria-label="Dismiss notification">${closeIcon()}</button>
</div>`;
}

export function createTransactionToastContainerHtml(toasts: readonly TransactionToastViewModel[], position: ToastPosition = "bottom-right"): string {
  return `<div class="twk-toast-root" data-position="${escapeAttribute(position)}" aria-live="polite">${toasts
    .map(createTransactionToastHtml)
    .join("")}</div>`;
}

export function createWalletToast(options: { manager: WalletManager; ui?: WalletUiConfig; document?: Document } & ThemeConfig): WalletToast {
  const documentRef = options.document ?? globalThis.document;
  const config = resolveWalletUiConfig(options.ui);
  const toasts: TransactionToastViewModel[] = [];
  const dismissTimers = new Map<string, number>();
  let root: HTMLElement | null = null;
  const render = () => {
    if (!root || !config.toast) return;
    root.innerHTML = createTransactionToastContainerHtml(toasts.slice(0, config.toast.maxVisible), config.toast.position);
  };
  const dismiss = (toastId: string) => {
    const timer = dismissTimers.get(toastId);
    if (timer !== undefined) {
      documentRef.defaultView?.clearTimeout(timer);
      dismissTimers.delete(toastId);
    }
    const index = toasts.findIndex((toast) => toast.id === toastId);
    if (index >= 0) {
      toasts.splice(index, 1);
      render();
    }
  };
  const scheduleDismiss = (toastId: string, status: TransactionToastViewModel["status"]) => {
    if (!config.toast || status === "pending") return;
    const existingTimer = dismissTimers.get(toastId);
    if (existingTimer !== undefined) documentRef.defaultView?.clearTimeout(existingTimer);
    const timer = documentRef.defaultView?.setTimeout(() => dismiss(toastId), config.toast.autoDismissMs);
    if (timer !== undefined) dismissTimers.set(toastId, timer);
  };
  const push = (transaction: WalletTransaction, status: TransactionToastViewModel["status"]) => {
    const nextToast: TransactionToastViewModel = {
      id: transaction.id,
      label: status === "pending" ? "Transaction submitted" : status === "success" ? "Transaction confirmed" : "Transaction failed",
      status,
      txHash: transaction.hash,
      ...(transaction.explorerUrl ? { explorerUrl: transaction.explorerUrl } : {})
    };
    const existingIndex = toasts.findIndex((toast) => toast.txHash === transaction.hash || toast.id === transaction.id);
    if (existingIndex >= 0) {
      toasts.splice(existingIndex, 1);
    }
    toasts.unshift(nextToast);
    render();
    scheduleDismiss(nextToast.id, status);
  };
  const unsubscribe = [
    options.manager.on("tx_submitted", ({ transaction }) => push(transaction, "pending")),
    options.manager.on("tx_confirmed", ({ transaction }) => push(transaction, "success")),
    options.manager.on("tx_failed", ({ transaction }) => push(transaction, "failed"))
  ];
  return {
    mount(target?: HTMLElement) {
      if (!config.toast) return;
      ensureWalletKitStyles(documentRef);
      root = createWalletKitRoot(config.theme, documentRef);
      root.addEventListener("click", (event) => {
        const target = event.target instanceof Element ? event.target.closest("[data-twk-toast-dismiss]") : null;
        const toastId = target?.getAttribute("data-twk-toast-dismiss");
        if (toastId) dismiss(toastId);
      });
      (target ?? documentRef.body).append(root);
      render();
    },
    setTheme(theme) {
      if (root) applyThemeToElement(root, theme);
    },
    destroy() {
      unsubscribe.forEach((off) => off());
      dismissTimers.forEach((timer) => documentRef.defaultView?.clearTimeout(timer));
      dismissTimers.clear();
      root?.remove();
      root = null;
    }
  };
}
