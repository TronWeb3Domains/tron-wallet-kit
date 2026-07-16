import { applyThemeToElement, createWalletKitRoot, ensureWalletKitStyles } from "./dom";
import type { ThemeConfig } from "./types";

export type TransactionPreviewDetailViewModel = {
  label: string;
  value: string;
};

export type TransactionPreviewViewModel = {
  title?: string;
  summary: string;
  details?: readonly TransactionPreviewDetailViewModel[];
  raw?: unknown;
};

export type TransactionPreviewDialogOptions = ThemeConfig & {
  confirmLabel?: string;
  cancelLabel?: string;
  showRaw?: boolean;
  document?: Document;
};

export type TransactionPreviewDialog = {
  confirm(preview: TransactionPreviewViewModel): Promise<boolean>;
  mount(target?: HTMLElement | string): void;
  close(result?: boolean): void;
  destroy(): void;
  setTheme(config: ThemeConfig): void;
};

type PendingConfirmation = {
  preview: TransactionPreviewViewModel;
  resolve: (accepted: boolean) => void;
};

export function createTransactionPreviewDialog(options: TransactionPreviewDialogOptions = {}): TransactionPreviewDialog {
  const documentRef = options.document ?? globalThis.document;
  let root: HTMLElement | null = null;
  let mounted = false;
  let pending: PendingConfirmation | null = null;
  let currentTheme: ThemeConfig = options;
  const confirmLabel = options.confirmLabel ?? "Confirm";
  const cancelLabel = options.cancelLabel ?? "Cancel";
  const showRaw = options.showRaw ?? false;

  const mount = (target?: HTMLElement | string) => {
    if (mounted) return;
    ensureWalletKitStyles(documentRef);
    root = createWalletKitRoot(currentTheme, documentRef);
    root.dataset.twkTransactionPreviewRoot = "true";
    const container = resolveTarget(target, documentRef) ?? documentRef.body;
    container.append(root);
    mounted = true;
  };

  const render = () => {
    if (!root || !pending) return;
    const { preview } = pending;
    const details = preview.details?.length
      ? `<dl class="twk-transaction-preview-details">${preview.details
          .map(
            (detail) =>
              `<div class="twk-transaction-preview-detail"><dt>${escapeHtml(detail.label)}</dt><dd>${escapeHtml(detail.value)}</dd></div>`
          )
          .join("")}</dl>`
      : "";
    const raw =
      showRaw && preview.raw !== undefined
        ? `<details class="twk-transaction-preview-raw"><summary>Raw transaction</summary><pre>${escapeHtml(formatRaw(preview.raw))}</pre></details>`
        : "";

    root.innerHTML = `
      <div class="twk-overlay" data-twk-transaction-preview="true">
        <section class="twk-modal twk-transaction-preview" role="dialog" aria-modal="true" aria-labelledby="twk-transaction-preview-title" tabindex="-1">
          <header class="twk-header">
            <span class="twk-header-spacer" aria-hidden="true"></span>
            <div class="twk-header-main">
              <h2 class="twk-title" id="twk-transaction-preview-title">${escapeHtml(preview.title ?? "Review transaction")}</h2>
            </div>
            <button class="twk-close" type="button" data-twk-preview-action="cancel" aria-label="${escapeHtml(cancelLabel)}">
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div class="twk-body twk-transaction-preview-body">
            <p class="twk-transaction-preview-summary">${escapeHtml(preview.summary)}</p>
            ${details}
            ${raw}
          </div>
          <footer class="twk-transaction-preview-footer">
            <button class="twk-action twk-transaction-preview-button" type="button" data-twk-preview-action="cancel">${escapeHtml(cancelLabel)}</button>
            <button class="twk-action twk-transaction-preview-button" type="button" data-twk-preview-action="confirm" data-tone="primary">${escapeHtml(confirmLabel)}</button>
          </footer>
        </section>
      </div>`;

    root.querySelectorAll<HTMLElement>("[data-twk-preview-action]").forEach((button) => {
      button.addEventListener("click", () => close(button.dataset.twkPreviewAction === "confirm"));
    });
    const panel = root.querySelector<HTMLElement>(".twk-transaction-preview");
    panel?.focus({ preventScroll: true });
  };

  const close = (result = false) => {
    const confirmation = pending;
    pending = null;
    if (root) root.innerHTML = "";
    confirmation?.resolve(result);
  };

  return {
    confirm(preview) {
      if (!mounted) mount();
      close(false);
      return new Promise<boolean>((resolve) => {
        pending = { preview, resolve };
        render();
      });
    },
    mount,
    close,
    destroy() {
      close(false);
      root?.remove();
      root = null;
      mounted = false;
    },
    setTheme(config) {
      currentTheme = config;
      if (root) applyThemeToElement(root, config);
    }
  };
}

function resolveTarget(target: HTMLElement | string | undefined, documentRef: Document): HTMLElement | null {
  if (!target) return null;
  if (typeof target !== "string") return target;
  return documentRef.querySelector<HTMLElement>(target);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function formatRaw(raw: unknown): string {
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return String(raw);
  }
}
