import type { WalletManager } from "@tron-wallet-kit/core";
import { resolveWalletUiConfig } from "./config";
import { applyThemeToElement, createElementFromHtml, createWalletKitRoot, ensureWalletKitStyles } from "./dom";
import { backIcon, closeIcon } from "./icons";
import { en } from "./locales/en";
import { copyToClipboard } from "./clipboard";
import { createStyledQrDataUrl, renderWalletQr } from "./qr";
import { escapeAttribute, escapeHtml } from "./utils";
import { applyWalletListConfig, mergeWalletOptionsWithCatalog } from "./wallet-catalog";
import { mapAdapterToWalletOption, type WalletAvailability } from "./wallet-options";
import { createConnectModalBodyHtml, normalizeConnectErrorMessage, resolveActiveWallet, resolveHeaderTitle, resolveQrEventWallet } from "./modal-views";
import type {
  ConnectModalLabels,
  ConnectModalView,
  ConnectModalViewModel,
  ThemeConfig,
  WalletEnvironment,
  WalletInline,
  WalletModal,
  WalletOptionViewModel,
  WalletUiConfig
} from "./types";

const defaultConnectModalLabels: ConnectModalLabels = en.connectModal;
const AUTO_CONNECT_RETRY_DELAY_MS = 650;

type ConnectWalletOptions = {
  retry?: boolean;
  autoRetryAttempt?: number;
};

function shouldAutoRetryConnect(error: unknown, wallet: WalletOptionViewModel, options: { isQrFlow: boolean; attempt?: number }): boolean {
  if (options.isQrFlow) return false;
  if (wallet.id === "gate" || wallet.adapterId === "gate") return false;
  if ((options.attempt ?? 0) >= 1) return false;
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message = error instanceof Error ? error.message : String(error);
  if (/user_rejected|reject|denied|cancel/i.test(`${code} ${message}`)) return false;
  if (/wallet_unavailable|wallet_not_found|not available|not installed|not found/i.test(`${code} ${message}`)) return false;
  if (code === "CONNECTION_FAILED" || code === "REQUEST_TIMEOUT") return true;
  return /did not return an address|request connect error|failed to connect|connect timed out|timeout/i.test(message) && wallet.id !== "walletconnect";
}

function resolveModalBodyModel(viewModel: ConnectModalViewModel): {
  bodyModel: ConnectModalViewModel & { view: ConnectModalView; labels: ConnectModalLabels };
  view: ConnectModalView;
  labels: ConnectModalLabels;
  activeWallet: WalletOptionViewModel | undefined;
} {
  const labels = { ...defaultConnectModalLabels, ...viewModel.labels };
  const view = viewModel.view ?? "featured";
  const wallets = applyWalletListConfig(mergeWalletOptionsWithCatalog(viewModel.wallets, labels, viewModel.catalog), viewModel.walletList, viewModel.walletEnvironment);
  const activeWallet = resolveActiveWallet(wallets, viewModel.activeWalletId ?? viewModel.selectedWalletId);
  const bodyModel: ConnectModalViewModel & { view: ConnectModalView; labels: ConnectModalLabels } = {
    ...viewModel,
    view,
    wallets,
    labels
  };
  if (activeWallet?.id) bodyModel.activeWalletId = activeWallet.id;
  return { bodyModel, view, labels, activeWallet };
}

export function createConnectModalHtml(viewModel: ConnectModalViewModel): string {
  const { bodyModel, view, labels, activeWallet } = resolveModalBodyModel(viewModel);
  const headerTitle = resolveHeaderTitle(view, labels, activeWallet);
  const headerSubtitle = view === "featured" ? labels.subtitle : "";
  const body = createConnectModalBodyHtml(bodyModel);
  const backButton =
    view === "featured"
      ? `<button class="twk-back" type="button" data-hidden="true" aria-hidden="true" tabindex="-1">${backIcon()}</button>`
      : `<button class="twk-back" type="button" data-twk-action="back" aria-label="${escapeAttribute(labels.back)}">${backIcon()}</button>`;
  const closeButton =
    viewModel.showCloseButton === false
      ? `<span class="twk-back" data-hidden="true" aria-hidden="true"></span>`
      : `<button class="twk-close" type="button" data-twk-action="close" aria-label="${escapeAttribute(labels.close)}">${closeIcon()}</button>`;

  return `<div class="twk-overlay" data-twk-action="backdrop">
  <section class="twk-modal" role="dialog" aria-modal="true" aria-labelledby="twk-connect-title" tabindex="-1" data-twk-panel="true">
    <header class="twk-header">
      ${backButton}
      <div class="twk-header-main">
        <h2 class="twk-title" id="twk-connect-title">${escapeHtml(headerTitle)}</h2>
        ${headerSubtitle ? `<p class="twk-subtitle">${escapeHtml(headerSubtitle)}</p>` : ""}
      </div>
      ${closeButton}
    </header>
    <div class="twk-body" data-twk-view="${escapeAttribute(view)}">
      ${body}
    </div>
  </section>
</div>`;
}

export function createConnectModalElement(viewModel: ConnectModalViewModel, documentRef = globalThis.document): HTMLElement {
  return createElementFromHtml(createConnectModalHtml(viewModel), documentRef);
}

export function createWalletInlineHtml(viewModel: ConnectModalViewModel): string {
  const { bodyModel, view } = resolveModalBodyModel(viewModel);
  return `<section class="twk-inline" data-twk-view="${escapeAttribute(view)}" tabindex="-1" data-twk-panel="true">
  <div class="twk-body">
    ${createConnectModalBodyHtml(bodyModel)}
  </div>
</section>`;
}

type WalletControllerMode = "modal" | "inline";
type WalletController = {
  mount(target?: HTMLElement | string): void;
  open(): void;
  close(): void;
  setTheme(config: ThemeConfig): void;
  destroy(): void;
};

export function createWalletModal(options: { manager: WalletManager; ui?: WalletUiConfig; document?: Document } & ThemeConfig): WalletModal {
  const controller = createWalletController(options, "modal");
  return {
    open: controller.open,
    close: controller.close,
    mount(target?: HTMLElement) {
      controller.mount(target);
    },
    setTheme: controller.setTheme,
    destroy: controller.destroy
  };
}

function createWalletController(options: { manager: WalletManager; ui?: WalletUiConfig; document?: Document } & ThemeConfig, mode: WalletControllerMode): WalletController {
  const documentRef = options.document ?? globalThis.document;
  const config = resolveWalletUiConfig(options.ui);
  let root: HTMLElement | null = null;
  let lastFocusedElement: HTMLElement | null = null;
  let view: ConnectModalView = "featured";
  let viewStack: ConnectModalView[] = ["featured"];
  let selectedWalletId: string | undefined;
  let activeWalletId: string | undefined;
  let searchQuery = "";
  let qrUri: string | undefined;
  let qrImageSrc: string | undefined;
  let qrRenderFailed = false;
  let qrCopyState: "idle" | "copied" = "idle";
  let qrCopyResetTimer: number | undefined;
  let retryTimer: number | undefined;
  let retryBusy = false;
  let errorMessage: string | undefined;
  let connectFlowId = 0;
  let activeConnectAdapterId: string | undefined;
  let activeConnectIsQrFlow = false;
  const availability = new Map<string, WalletAvailability>();
  let removeQrListener: (() => void) | undefined;
  let allWalletsPrimed = false;
  let allWalletsLoading = false;
  let allWalletsTimer: number | undefined;

  const getWalletOptions = () =>
    mergeWalletOptionsWithCatalog(
      options.manager.getWallets().map((adapter) => mapAdapterToWalletOption(adapter, availability.get(adapter.metadata.id), config.labels.connectModal)),
      config.labels.connectModal,
      config.catalog
    );

  const primeAllWalletsSkeleton = () => {
    if (allWalletsPrimed) return;
    allWalletsPrimed = true;
    allWalletsLoading = true;
    allWalletsTimer = documentRef.defaultView?.setTimeout(() => {
      allWalletsTimer = undefined;
      allWalletsLoading = false;
      render();
    }, 600);
  };

  const render = (renderOptions?: { preserveSearchFocus?: boolean; searchSelectionStart?: number | null; searchSelectionEnd?: number | null }) => {
    if (!root) return;
    const entering = root.dataset.twkRenderedView !== view;
    const searchFocus = getSearchFocusSnapshot(root);
    root.dataset.twkRenderedView = view;
    const network = options.manager.getNetwork();
    const viewModel: ConnectModalViewModel = {
      wallets: getWalletOptions(),
      view,
      networkName: network.name,
      networkType: network.networkType,
      ...(selectedWalletId ? { selectedWalletId } : {}),
      ...(activeWalletId ? { activeWalletId } : {}),
      ...(searchQuery ? { searchQuery } : {}),
      ...(qrUri ? { qrUri } : {}),
      ...(qrImageSrc ? { qrImageSrc } : {}),
      ...(qrRenderFailed ? { qrRenderState: "error" as const } : {}),
      ...(qrCopyState === "copied" ? { qrCopyState } : {}),
      ...(retryBusy ? { retryState: "busy" as const } : {}),
      ...(errorMessage ? { errorMessage } : {}),
      ...(allWalletsLoading && view === "all-wallets" ? { walletsLoading: true } : {}),
      catalog: config.catalog,
      labels: { ...config.labels.connectModal, title: config.modal.title, subtitle: config.modal.subtitle },
      showCloseButton: config.modal.showCloseButton,
      showPoweredBy: config.modal.branding.showPoweredBy ?? true,
      poweredByText: config.modal.branding.poweredByText ?? config.labels.connectModal.poweredBy,
      walletList: config.walletList,
      walletEnvironment: resolveWalletEnvironment(documentRef.defaultView)
    };
    root.innerHTML = mode === "modal" ? createConnectModalHtml(viewModel) : createWalletInlineHtml(viewModel);
    if (entering && !config.modal.disableAnimations) root.querySelector(".twk-body")?.setAttribute("data-twk-entering", "true");
    renderQrIntoRoot();
    updateWalletGridOverflow(root);
    if (renderOptions?.preserveSearchFocus || searchFocus) {
      restoreSearchFocus(root, renderOptions?.searchSelectionStart ?? searchFocus?.selectionStart, renderOptions?.searchSelectionEnd ?? searchFocus?.selectionEnd);
      return;
    }
    if (entering) focusPrimaryControl(root);
  };

  const refreshAvailability = () => {
    for (const adapter of options.manager.getWallets()) {
      if (adapter.metadata.availabilityMode === "on-demand") {
        if (availability.get(adapter.metadata.id) === undefined) availability.set(adapter.metadata.id, true);
        continue;
      }
      if (!adapter.isAvailable) {
        availability.set(adapter.metadata.id, true);
        continue;
      }
      const id = adapter.metadata.id;
      const first = availability.get(id) === undefined;
      if (first) availability.set(id, "loading");
      const check = Promise.resolve(adapter.isAvailable()).catch(() => false);
      const settle = first
        ? Promise.all([check, new Promise<void>((resolve) => documentRef.defaultView?.setTimeout(resolve, 600))]).then(([available]) => available)
        : check;
      void settle.then((available) => {
        availability.set(id, available);
        render();
      });
    }
    render();
  };

  const pushView = (nextView: ConnectModalView) => {
    if (view !== nextView) viewStack.push(nextView);
    view = nextView;
  };

  const replaceView = (nextView: ConnectModalView) => {
    if (viewStack.length === 0) viewStack = ["featured"];
    viewStack[viewStack.length - 1] = nextView;
    view = nextView;
  };

  const resetFlow = () => {
    connectFlowId += 1;
    if (retryTimer !== undefined) {
      documentRef.defaultView?.clearTimeout(retryTimer);
      retryTimer = undefined;
    }
    activeConnectAdapterId = undefined;
    activeConnectIsQrFlow = false;
    view = "featured";
    viewStack = ["featured"];
    selectedWalletId = undefined;
    activeWalletId = undefined;
    searchQuery = "";
    qrUri = undefined;
    qrImageSrc = undefined;
    qrRenderFailed = false;
    qrCopyState = "idle";
    retryBusy = false;
    errorMessage = undefined;
  };

  const cancelConnectionFlow = (options: { clearWallet?: boolean } = {}) => {
    connectFlowId += 1;
    if (retryTimer !== undefined) {
      documentRef.defaultView?.clearTimeout(retryTimer);
      retryTimer = undefined;
    }
    activeConnectAdapterId = undefined;
    activeConnectIsQrFlow = false;
    qrUri = undefined;
    qrImageSrc = undefined;
    qrRenderFailed = false;
    qrCopyState = "idle";
    retryBusy = false;
    errorMessage = undefined;
    if (options.clearWallet !== false) {
      selectedWalletId = undefined;
      activeWalletId = undefined;
    }
  };

  const goBack = () => {
    if (view === "qr" || view === "connecting") cancelConnectionFlow();
    if (viewStack.length > 1) viewStack.pop();
    view = viewStack.at(-1) ?? "featured";
    errorMessage = undefined;
    render();
  };

  const connectWallet = (wallet: WalletOptionViewModel, connectOptions?: ConnectWalletOptions) => {
    const adapterId = wallet.adapterId ?? wallet.id;
    const isQrFlow = wallet.capabilities?.includes("qr") || wallet.transport === "walletconnect" || wallet.transport === "qr" || wallet.id === "walletconnect" || adapterId === "walletconnect";
    const flowId = connectFlowId + 1;
    connectFlowId = flowId;
    activeConnectAdapterId = adapterId;
    activeConnectIsQrFlow = isQrFlow;
    selectedWalletId = wallet.id;
    activeWalletId = wallet.id;
    pushView(isQrFlow ? "qr" : "connecting");
    qrUri = undefined;
    qrImageSrc = undefined;
    qrRenderFailed = false;
    qrCopyState = "idle";
    if (!connectOptions?.retry) retryBusy = false;
    errorMessage = undefined;
    render();
    void options.manager.connect(adapterId, {
      metadata: {
        walletId: wallet.id,
        walletName: wallet.name,
        ...(wallet.icon ? { walletIcon: wallet.icon } : {})
      },
      onUri: (uri) => {
        if (flowId === connectFlowId && activeConnectAdapterId === adapterId) options.manager.emitQr(adapterId, uri);
      }
    }).then(() => {
      if (flowId !== connectFlowId || activeConnectAdapterId !== adapterId) return;
      if (mode === "modal" && config.modal.closeOnSelect) closeModal({ force: true });
    }).catch((error: unknown) => {
      if (flowId !== connectFlowId || activeConnectAdapterId !== adapterId) return;
      if (shouldAutoRetryConnect(error, wallet, { isQrFlow, attempt: connectOptions?.autoRetryAttempt ?? 0 })) {
        retryBusy = true;
        errorMessage = undefined;
        view = "connecting";
        render();
        if (retryTimer !== undefined) documentRef.defaultView?.clearTimeout(retryTimer);
        const retryFlowId = connectFlowId;
        retryTimer = documentRef.defaultView?.setTimeout(() => {
          retryTimer = undefined;
          if (retryFlowId !== connectFlowId || activeConnectAdapterId !== adapterId) return;
          connectWallet(wallet, { retry: true, autoRetryAttempt: (connectOptions?.autoRetryAttempt ?? 0) + 1 });
        }, AUTO_CONNECT_RETRY_DELAY_MS);
        return;
      }
      retryBusy = false;
      errorMessage = normalizeConnectErrorMessage(error, wallet);
      view = qrUri ? "qr" : "connecting";
      render();
    });
  };

  const mount = (target?: HTMLElement | string) => {
    ensureWalletKitStyles(documentRef);
    root = createWalletKitRoot(config.theme, documentRef);
    root.hidden = mode === "modal";
    root.addEventListener("click", (event) => {
      const targetElement = event.target instanceof Element ? event.target : null;
      if (!targetElement) return;
      if (mode === "modal" && targetElement.closest("[data-twk-action='close']")) {
        closeModal({ force: true });
        return;
      }
      if (targetElement.closest("[data-twk-action='back']")) {
        goBack();
        return;
      }
      if (mode === "modal" && targetElement === root?.querySelector(".twk-overlay") && config.modal.closeOnBackdropClick) {
        closeModal({ force: true });
        return;
      }
      if (targetElement.closest("[data-twk-action='show-all-wallets']")) {
        cancelConnectionFlow();
        pushView("all-wallets");
        searchQuery = "";
        errorMessage = undefined;
        primeAllWalletsSkeleton();
        render();
        return;
      }
      if (targetElement.closest("[data-twk-action='retry']")) {
        const wallet = getWalletOptions().find((item) => item.id === activeWalletId);
        if (wallet) {
          retryBusy = true;
          render();
          if (retryTimer !== undefined) documentRef.defaultView?.clearTimeout(retryTimer);
          const retryFlowId = connectFlowId;
          retryTimer = documentRef.defaultView?.setTimeout(() => {
            retryTimer = undefined;
            if (retryFlowId !== connectFlowId) return;
            connectWallet(wallet, { retry: true });
          }, 180);
        }
        return;
      }
      if (targetElement.closest("[data-twk-action='copy-uri']") && qrUri) {
        void copyToClipboard(qrUri, documentRef).then((copied) => {
          if (!copied || !root) return;
          qrCopyState = "copied";
          render();
          if (qrCopyResetTimer !== undefined) documentRef.defaultView?.clearTimeout(qrCopyResetTimer);
          qrCopyResetTimer = documentRef.defaultView?.setTimeout(() => {
            qrCopyState = "idle";
            render();
          }, 1400);
        });
        return;
      }
      const walletButton = targetElement.closest("[data-twk-wallet-id]");
      const walletId = walletButton?.getAttribute("data-twk-wallet-id");
      if (!walletId || walletButton?.hasAttribute("disabled")) return;
      const wallet = getWalletOptions().find((item) => item.id === walletId);
      if (wallet) connectWallet(wallet);
    });
    root.addEventListener("input", (event) => {
      const targetElement = event.target;
      if (!(targetElement instanceof HTMLInputElement) || targetElement.getAttribute("data-twk-search") !== "wallets") return;
      searchQuery = targetElement.value;
      render({
        preserveSearchFocus: true,
        searchSelectionStart: targetElement.selectionStart,
        searchSelectionEnd: targetElement.selectionEnd
      });
    });
    root.addEventListener("keydown", (event) => {
      if (mode !== "modal") return;
      if (event.key === "Escape") {
        closeModal({ force: true });
        return;
      }
      if (event.key === "Tab" && root) trapFocus(event, root);
    });
    root.addEventListener("focusin", (event) => {
      const targetElement = event.target instanceof HTMLElement ? event.target : null;
      if (!targetElement || !root) return;
      const grid = targetElement.closest<HTMLElement>(".twk-wallet-grid[data-scope]");
      if (!grid) return;
      targetElement.scrollIntoView({ block: "nearest", inline: "nearest" });
      updateWalletGridOverflow(root);
    });
    root.addEventListener("scroll", (event) => {
      if (!(event.target instanceof HTMLElement) || !root) return;
      if (!event.target.matches(".twk-wallet-grid[data-scope]")) return;
      updateWalletGridOverflow(root);
    }, true);
    removeQrListener = options.manager.on("qr", ({ adapterId, uri }) => {
      const wallet = resolveQrEventWallet(getWalletOptions(), adapterId, activeWalletId ?? selectedWalletId);
      if (!activeConnectAdapterId || adapterId !== activeConnectAdapterId) return;
      const flowId = connectFlowId;
      activeConnectIsQrFlow = true;
      activeWalletId = wallet?.id ?? adapterId;
      selectedWalletId = wallet?.id ?? adapterId;
      replaceView("qr");
      qrUri = uri;
      qrImageSrc = undefined;
      qrRenderFailed = false;
      qrCopyState = "idle";
      retryBusy = false;
      render();
      void createStyledQrDataUrl(uri, {
        width: config.qr.size,
        margin: config.qr.margin,
        errorCorrectionLevel: config.qr.errorCorrectionLevel
      }).then((src) => {
        if (flowId === connectFlowId && activeConnectAdapterId === adapterId && qrUri === uri && view === "qr") {
          qrImageSrc = src;
          render();
        }
      }).catch(() => {
        if (flowId === connectFlowId && activeConnectAdapterId === adapterId && qrUri === uri && view === "qr") {
          qrRenderFailed = true;
          errorMessage = config.labels.connectModal.qrRenderFailed;
          render();
        }
      });
    });
    const targetElement = resolveMountTarget(target, mode, documentRef);
    targetElement.append(root);
    render();
    refreshAvailability();
  };

  const closeModal = (options: { force?: boolean } = {}) => {
    const hasActiveQrFlow = activeConnectIsQrFlow || activeConnectAdapterId === "walletconnect";
    if (!options.force && hasActiveQrFlow) {
      view = "qr";
      if (root) root.hidden = false;
      render();
      return;
    }
    if (root) root.hidden = true;
    resetFlow();
    lastFocusedElement?.focus?.();
  };

  const api: WalletController = {
    open() {
      if (mode !== "modal") return;
      if (!root) mount();
      if (root) {
        lastFocusedElement = documentRef.activeElement instanceof HTMLElement ? documentRef.activeElement : null;
        root.hidden = false;
        refreshAvailability();
      }
    },
    close() {
      if (mode !== "modal") return;
      closeModal({ force: true });
    },
    mount,
    setTheme(theme) {
      if (root) applyThemeToElement(root, theme);
    },
    destroy() {
      cancelConnectionFlow();
      removeQrListener?.();
      if (qrCopyResetTimer !== undefined) documentRef.defaultView?.clearTimeout(qrCopyResetTimer);
      if (retryTimer !== undefined) documentRef.defaultView?.clearTimeout(retryTimer);
      if (allWalletsTimer !== undefined) documentRef.defaultView?.clearTimeout(allWalletsTimer);
      root?.remove();
      root = null;
    }
  };
  return api;

  function renderQrIntoRoot(): void {
    if (!root || !qrUri || qrImageSrc || view !== "qr") return;
    const target = root.querySelector<HTMLElement>("[data-twk-qr-code='true']");
    if (!target) return;
    const wallet = resolveActiveWallet(getWalletOptions(), activeWalletId ?? selectedWalletId);
    const flowId = connectFlowId;
    const uri = qrUri;
    void renderWalletQr(target, qrUri, {
      width: config.qr.size,
      margin: config.qr.margin,
      errorCorrectionLevel: config.qr.errorCorrectionLevel,
      ...(config.qr.includeWalletLogo && wallet?.icon ? { logo: wallet.icon } : {})
    }).catch(() => {
      if (flowId === connectFlowId && qrUri === uri && view === "qr") {
        qrRenderFailed = true;
        errorMessage = config.labels.connectModal.qrRenderFailed;
        render();
      }
    });
  }
}

export function createWalletInline(options: { manager: WalletManager; ui?: WalletUiConfig; document?: Document } & ThemeConfig): WalletInline {
  const controller = createWalletController(options, "inline");
  return {
    mount(target: HTMLElement | string) {
      controller.mount(target);
    },
    setTheme: controller.setTheme,
    destroy: controller.destroy
  };
}

export function resolveWalletEnvironment(windowRef: (Window & typeof globalThis) | Window | null | undefined = (globalThis as unknown as { window?: Window & typeof globalThis }).window): WalletEnvironment {
  const navigatorRef = windowRef?.navigator;
  const userAgent = navigatorRef?.userAgent ?? "";
  const touchPoints = navigatorRef?.maxTouchPoints ?? 0;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent) || touchPoints > 1 && /Macintosh/i.test(userAgent);
  const hasInjected = hasInjectedTronProvider(windowRef);
  if (isMobile && hasInjected) return { kind: "mobile-in-app", isMobile, hasInjected };
  if (isMobile) return { kind: "mobile-browser", isMobile, hasInjected };
  return { kind: "desktop-extension", isMobile, hasInjected };
}

function hasInjectedTronProvider(windowRef: (Window & typeof globalThis) | Window | null | undefined): boolean {
  const candidate = windowRef as unknown as Record<string, unknown> | undefined;
  if (!candidate) return false;
  if (candidate.tronWeb || candidate.tronLink || candidate.tron) return true;
  for (const key of ["okxwallet", "bitkeep", "trustwallet", "tokenpocket", "binancew3w", "bybitWallet", "gatewallet", "guarda", "$onekey", "backpack"]) {
    const value = candidate[key] as Record<string, unknown> | undefined;
    if (value?.tron || value?.tronLink || value?.tronWeb) return true;
  }
  return false;
}

function resolveMountTarget(target: HTMLElement | string | undefined, mode: WalletControllerMode, documentRef: Document): HTMLElement {
  if (mode === "modal") {
    if (typeof target === "string") {
      const targetElement = documentRef.querySelector<HTMLElement>(target);
      if (!targetElement) throw new Error(`Wallet modal target was not found: ${target}`);
      return targetElement;
    }
    return target ?? documentRef.body;
  }
  const targetElement = typeof target === "string" ? documentRef.querySelector<HTMLElement>(target) : target;
  if (!targetElement) throw new Error(`Wallet inline target was not found: ${String(target)}`);
  return targetElement;
}

function focusPrimaryControl(root: HTMLElement): void {
  const activeElement = root.ownerDocument.activeElement;
  if (activeElement instanceof HTMLInputElement && root.contains(activeElement)) return;
  const searchInput = root.querySelector<HTMLElement>(".twk-wallet-search-input");
  if (searchInput) {
    searchInput.focus?.({ preventScroll: true });
    return;
  }
  focusModalPanel(root);
}

function focusModalPanel(root: HTMLElement): void {
  const panel = root.querySelector<HTMLElement>("[data-twk-panel='true']");
  panel?.focus?.({ preventScroll: true });
}

function updateWalletGridOverflow(root: HTMLElement): void {
  for (const grid of root.querySelectorAll<HTMLElement>(".twk-wallet-grid[data-scope]")) {
    const overflow = grid.scrollHeight - grid.clientHeight > 1;
    if (!overflow) {
      delete grid.dataset.overflow;
      continue;
    }
    const atTop = grid.scrollTop <= 1;
    const atBottom = grid.scrollTop + grid.clientHeight >= grid.scrollHeight - 1;
    grid.dataset.overflow = atTop ? "bottom" : atBottom ? "top" : "both";
  }
}

function restoreSearchFocus(root: HTMLElement, selectionStart?: number | null, selectionEnd?: number | null): void {
  const input = root.querySelector<HTMLInputElement>(".twk-wallet-search-input");
  if (!input) return;
  input.focus({ preventScroll: true });
  const start = selectionStart ?? input.value.length;
  const end = selectionEnd ?? start;
  try {
    input.setSelectionRange(start, end);
  } catch {
    // Some input modes can reject selection ranges; focus preservation is still useful.
  }
}

function getSearchFocusSnapshot(root: HTMLElement): { selectionStart: number | null; selectionEnd: number | null } | undefined {
  const activeElement = root.ownerDocument.activeElement;
  if (!(activeElement instanceof HTMLInputElement) || activeElement.getAttribute("data-twk-search") !== "wallets" || !root.contains(activeElement)) return undefined;
  return {
    selectionStart: activeElement.selectionStart,
    selectionEnd: activeElement.selectionEnd
  };
}

function trapFocus(event: KeyboardEvent, root: HTMLElement): void {
  const controls = [...root.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled])")].filter((element) => !element.hasAttribute("aria-hidden") && element.tabIndex !== -1);
  if (controls.length === 0) return;
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (!event.shiftKey && root.ownerDocument.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
  if (event.shiftKey && root.ownerDocument.activeElement === first) {
    event.preventDefault();
    last?.focus();
  }
}
