import type { WalletManager } from "@tron-wallet-kit/core";
import { createActionContentHtml } from "./actions";
import { resolveWalletUiConfig } from "./config";
import { applyThemeToElement, createElementFromHtml, createWalletKitRoot, ensureWalletKitStyles } from "./dom";
import { actionSpinnerIcon, backIcon, checkIcon, closeIcon, externalIcon, linkIcon, refreshIcon, searchIcon, statusErrorIcon } from "./icons";
import { createStyledQrDataUrl, renderWalletQr } from "./qr";
import { escapeAttribute, escapeHtml } from "./utils";
import { filterWalletOptions, getFeaturedWalletOptions, mergeWalletOptionsWithCatalog } from "./wallet-catalog";
import { mapAdapterToWalletOption, type WalletAvailability } from "./wallet-options";
import type {
  ConnectModalLabels,
  ConnectModalView,
  ConnectModalViewModel,
  ThemeConfig,
  WalletInline,
  WalletModal,
  WalletOptionViewModel,
  WalletUiConfig
} from "./types";

const defaultConnectModalLabels: ConnectModalLabels = {
  title: "Connect Wallet",
  subtitle: "",
  allWallets: "All Wallets",
  back: "Back",
  close: "Close",
  connecting: "Connecting",
  continueInWallet: "Continue in",
  acceptRequest: "Accept connection request in the wallet",
  tryAgain: "Try again",
  getWallet: "Get",
  searchWallet: "Search wallet",
  searchPlaceholder: "Search wallet",
  noWalletsFound: "No TRON wallets found",
  poweredBy: "Powered by TRON Wallet Kit",
  unavailable: "Unavailable",
  ready: "Ready",
  installed: "Installed",
  notInstalled: "Not installed",
  qrCode: "QR code",
  tron: "TRON",
  scanQr: "Scan this QR Code with your phone",
  dontHave: "Don't have"
};

function normalizeConnectErrorMessage(error: unknown, wallet?: WalletOptionViewModel): string {
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

function resolveModalBodyModel(viewModel: ConnectModalViewModel): {
  bodyModel: ConnectModalViewModel & { view: ConnectModalView; labels: ConnectModalLabels };
  view: ConnectModalView;
  labels: ConnectModalLabels;
  activeWallet: WalletOptionViewModel | undefined;
} {
  const labels = { ...defaultConnectModalLabels, ...viewModel.labels };
  const view = viewModel.view ?? "featured";
  const wallets = mergeWalletOptionsWithCatalog(viewModel.wallets);
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
  <section class="twk-modal" role="dialog" aria-modal="true" aria-labelledby="twk-connect-title">
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
  return `<section class="twk-inline" data-twk-view="${escapeAttribute(view)}">
  <div class="twk-body">
    ${createConnectModalBodyHtml(bodyModel)}
  </div>
</section>`;
}

export function createWalletModal(options: { manager: WalletManager; ui?: WalletUiConfig; document?: Document } & ThemeConfig): WalletModal {
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
  let qrCopyState: "idle" | "copied" = "idle";
  let qrCopyResetTimer: number | undefined;
  let retryBusy = false;
  let errorMessage: string | undefined;
  const availability = new Map<string, WalletAvailability>();
  let removeQrListener: (() => void) | undefined;
  let allWalletsPrimed = false;
  let allWalletsLoading = false;

  const getWalletOptions = () =>
    mergeWalletOptionsWithCatalog(options.manager.getWallets().map((adapter) => mapAdapterToWalletOption(adapter, availability.get(adapter.metadata.id))));

  const primeAllWalletsSkeleton = () => {
    if (allWalletsPrimed) return;
    allWalletsPrimed = true;
    allWalletsLoading = true;
    documentRef.defaultView?.setTimeout(() => {
      allWalletsLoading = false;
      render();
    }, 600);
  };

  const render = () => {
    if (!root) return;
    const entering = root.dataset.twkRenderedView !== view;
    root.dataset.twkRenderedView = view;
    root.innerHTML = createConnectModalHtml({
      wallets: getWalletOptions(),
      view,
      networkName: options.manager.getNetwork().name,
      networkType: options.manager.getNetwork().networkType,
      ...(selectedWalletId ? { selectedWalletId } : {}),
      ...(activeWalletId ? { activeWalletId } : {}),
      ...(searchQuery ? { searchQuery } : {}),
      ...(qrUri ? { qrUri } : {}),
      ...(qrImageSrc ? { qrImageSrc } : {}),
      ...(qrCopyState === "copied" ? { qrCopyState } : {}),
      ...(retryBusy ? { retryState: "busy" as const } : {}),
      ...(errorMessage ? { errorMessage } : {}),
      ...(allWalletsLoading && view === "all-wallets" ? { walletsLoading: true } : {}),
      labels: { title: config.modal.title, subtitle: config.modal.subtitle }
    });
    if (entering) root.querySelector(".twk-body")?.setAttribute("data-twk-entering", "true");
    renderQrIntoRoot();
    focusPrimaryControl(root);
  };

  const refreshAvailability = () => {
    for (const adapter of options.manager.getWallets()) {
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
    view = "featured";
    viewStack = ["featured"];
    selectedWalletId = undefined;
    activeWalletId = undefined;
    searchQuery = "";
    qrUri = undefined;
    qrImageSrc = undefined;
    qrCopyState = "idle";
    retryBusy = false;
    errorMessage = undefined;
  };

  const goBack = () => {
    if (viewStack.length > 1) viewStack.pop();
    view = viewStack.at(-1) ?? "featured";
    errorMessage = undefined;
    render();
  };

  const connectWallet = (wallet: WalletOptionViewModel, connectOptions?: { retry?: boolean }) => {
    const adapterId = wallet.adapterId ?? wallet.id;
    selectedWalletId = wallet.id;
    activeWalletId = wallet.id;
    pushView(wallet.capabilities?.includes("qr") || wallet.transport === "walletconnect" ? "qr" : "connecting");
    qrUri = undefined;
    qrImageSrc = undefined;
    qrCopyState = "idle";
    if (!connectOptions?.retry) retryBusy = false;
    errorMessage = undefined;
    render();
    void options.manager.connect(adapterId, {
      onUri: (uri) => options.manager.emitQr(adapterId, uri)
    }).then(() => api.close()).catch((error: unknown) => {
      retryBusy = false;
      errorMessage = normalizeConnectErrorMessage(error, wallet);
      view = qrUri ? "qr" : "connecting";
      render();
    });
  };

  const mount = (target?: HTMLElement) => {
    ensureWalletKitStyles(documentRef);
    root = createWalletKitRoot(config.theme, documentRef);
    root.hidden = true;
    root.addEventListener("click", (event) => {
      const targetElement = event.target instanceof Element ? event.target : null;
      if (!targetElement) return;
      if (targetElement.closest("[data-twk-action='close']")) {
        api.close();
        return;
      }
      if (targetElement.closest("[data-twk-action='back']")) {
        goBack();
        return;
      }
      if (targetElement === root?.querySelector(".twk-overlay")) {
        api.close();
        return;
      }
      if (targetElement.closest("[data-twk-action='show-all-wallets']")) {
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
          documentRef.defaultView?.setTimeout(() => connectWallet(wallet, { retry: true }), 180);
        }
        return;
      }
      if (targetElement.closest("[data-twk-action='copy-uri']") && qrUri) {
        void documentRef.defaultView?.navigator.clipboard?.writeText(qrUri);
        qrCopyState = "copied";
        render();
        if (qrCopyResetTimer !== undefined) documentRef.defaultView?.clearTimeout(qrCopyResetTimer);
        qrCopyResetTimer = documentRef.defaultView?.setTimeout(() => {
          qrCopyState = "idle";
          render();
        }, 1400);
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
      render();
    });
    root.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        api.close();
        return;
      }
      if (event.key === "Tab" && root) trapFocus(event, root);
    });
    removeQrListener = options.manager.on("qr", ({ adapterId, uri }) => {
      const wallet = resolveQrEventWallet(getWalletOptions(), adapterId, activeWalletId ?? selectedWalletId);
      activeWalletId = wallet?.id ?? adapterId;
      selectedWalletId = wallet?.id ?? adapterId;
      replaceView("qr");
      qrUri = uri;
      qrImageSrc = undefined;
      qrCopyState = "idle";
      retryBusy = false;
      render();
      void createStyledQrDataUrl(uri, { width: 304, margin: 4 }).then((src) => {
        if (qrUri === uri && view === "qr") {
          qrImageSrc = src;
          render();
        }
      }).catch(() => {});
    });
    (target ?? documentRef.body).append(root);
    render();
    refreshAvailability();
  };

  const api: WalletModal = {
    open() {
      if (!root) mount();
      if (root) {
        lastFocusedElement = documentRef.activeElement instanceof HTMLElement ? documentRef.activeElement : null;
        root.hidden = false;
        refreshAvailability();
      }
    },
    close() {
      if (root) root.hidden = true;
      resetFlow();
      lastFocusedElement?.focus?.();
    },
    mount,
    setTheme(theme) {
      if (root) applyThemeToElement(root, theme);
    },
    destroy() {
      removeQrListener?.();
      if (qrCopyResetTimer !== undefined) documentRef.defaultView?.clearTimeout(qrCopyResetTimer);
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
    void renderWalletQr(target, qrUri, {
      width: 304,
      margin: 4,
      background: "transparent",
      ...(wallet?.icon ? { logo: wallet.icon } : {})
    }).catch(() => {
      target.dataset.twkQrRenderer = "error";
    });
  }
}

export function createWalletInline(options: { manager: WalletManager; ui?: WalletUiConfig; document?: Document } & ThemeConfig): WalletInline {
  const documentRef = options.document ?? globalThis.document;
  const config = resolveWalletUiConfig(options.ui);
  let root: HTMLElement | null = null;
  let view: ConnectModalView = "featured";
  let viewStack: ConnectModalView[] = ["featured"];
  let selectedWalletId: string | undefined;
  let activeWalletId: string | undefined;
  let searchQuery = "";
  let qrUri: string | undefined;
  let qrImageSrc: string | undefined;
  let qrCopyState: "idle" | "copied" = "idle";
  let qrCopyResetTimer: number | undefined;
  let retryBusy = false;
  let errorMessage: string | undefined;
  const availability = new Map<string, WalletAvailability>();
  let removeQrListener: (() => void) | undefined;
  let allWalletsPrimed = false;
  let allWalletsLoading = false;

  const getWalletOptions = () =>
    mergeWalletOptionsWithCatalog(options.manager.getWallets().map((adapter) => mapAdapterToWalletOption(adapter, availability.get(adapter.metadata.id))));

  const primeAllWalletsSkeleton = () => {
    if (allWalletsPrimed) return;
    allWalletsPrimed = true;
    allWalletsLoading = true;
    documentRef.defaultView?.setTimeout(() => {
      allWalletsLoading = false;
      render();
    }, 600);
  };

  const render = () => {
    if (!root) return;
    const network = options.manager.getNetwork();
    root.innerHTML = createWalletInlineHtml({
      wallets: getWalletOptions(),
      view,
      networkName: network.name,
      networkType: network.networkType,
      ...(selectedWalletId ? { selectedWalletId } : {}),
      ...(activeWalletId ? { activeWalletId } : {}),
      ...(searchQuery ? { searchQuery } : {}),
      ...(qrUri ? { qrUri } : {}),
      ...(qrImageSrc ? { qrImageSrc } : {}),
      ...(qrCopyState === "copied" ? { qrCopyState } : {}),
      ...(retryBusy ? { retryState: "busy" as const } : {}),
      ...(errorMessage ? { errorMessage } : {}),
      ...(allWalletsLoading && view === "all-wallets" ? { walletsLoading: true } : {}),
      labels: { title: config.modal.title, subtitle: config.modal.subtitle }
    });
    renderQrIntoRoot();
  };

  const refreshAvailability = () => {
    for (const adapter of options.manager.getWallets()) {
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

  const goBack = () => {
    if (viewStack.length > 1) viewStack.pop();
    view = viewStack.at(-1) ?? "featured";
    errorMessage = undefined;
    render();
  };

  const connectWallet = (wallet: WalletOptionViewModel, connectOptions?: { retry?: boolean }) => {
    const adapterId = wallet.adapterId ?? wallet.id;
    selectedWalletId = wallet.id;
    activeWalletId = wallet.id;
    pushView(wallet.capabilities?.includes("qr") || wallet.transport === "walletconnect" ? "qr" : "connecting");
    qrUri = undefined;
    qrCopyState = "idle";
    if (!connectOptions?.retry) retryBusy = false;
    errorMessage = undefined;
    render();
    void options.manager.connect(adapterId, {
      onUri: (uri) => options.manager.emitQr(adapterId, uri)
    }).catch((error: unknown) => {
      retryBusy = false;
      errorMessage = normalizeConnectErrorMessage(error, wallet);
      view = qrUri ? "qr" : "connecting";
      render();
    });
  };

  const mount = (target: HTMLElement | string) => {
    ensureWalletKitStyles(documentRef);
    root = createWalletKitRoot(config.theme, documentRef);
    root.addEventListener("click", (event) => {
      const targetElement = event.target instanceof Element ? event.target : null;
      if (!targetElement) return;
      if (targetElement.closest("[data-twk-action='back']")) {
        goBack();
        return;
      }
      if (targetElement.closest("[data-twk-action='show-all-wallets']")) {
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
          documentRef.defaultView?.setTimeout(() => connectWallet(wallet, { retry: true }), 180);
        }
        return;
      }
      if (targetElement.closest("[data-twk-action='copy-uri']") && qrUri) {
        void documentRef.defaultView?.navigator.clipboard?.writeText(qrUri);
        qrCopyState = "copied";
        render();
        if (qrCopyResetTimer !== undefined) documentRef.defaultView?.clearTimeout(qrCopyResetTimer);
        qrCopyResetTimer = documentRef.defaultView?.setTimeout(() => {
          qrCopyState = "idle";
          render();
        }, 1400);
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
      render();
    });
    removeQrListener = options.manager.on("qr", ({ adapterId, uri }) => {
      const wallet = resolveQrEventWallet(getWalletOptions(), adapterId, activeWalletId ?? selectedWalletId);
      activeWalletId = wallet?.id ?? adapterId;
      selectedWalletId = wallet?.id ?? adapterId;
      if (viewStack.at(-1) !== "qr") viewStack.push("qr");
      view = "qr";
      qrUri = uri;
      qrImageSrc = undefined;
      qrCopyState = "idle";
      retryBusy = false;
      render();
      void createStyledQrDataUrl(uri, { width: 304, margin: 4 }).then((src) => {
        if (qrUri === uri && view === "qr") {
          qrImageSrc = src;
          render();
        }
      }).catch(() => {});
    });
    const targetElement = typeof target === "string" ? documentRef.querySelector(target) : target;
    if (!targetElement) throw new Error(`Wallet inline target was not found: ${String(target)}`);
    targetElement.append(root);
    render();
    refreshAvailability();
  };

  return {
    mount,
    setTheme(theme) {
      if (root) applyThemeToElement(root, theme);
    },
    destroy() {
      removeQrListener?.();
      if (qrCopyResetTimer !== undefined) documentRef.defaultView?.clearTimeout(qrCopyResetTimer);
      root?.remove();
      root = null;
    }
  };

  function renderQrIntoRoot(): void {
    if (!root || !qrUri || qrImageSrc || view !== "qr") return;
    const target = root.querySelector<HTMLElement>("[data-twk-qr-code='true']");
    if (!target) return;
    const wallet = resolveActiveWallet(getWalletOptions(), activeWalletId ?? selectedWalletId);
    void renderWalletQr(target, qrUri, {
      width: 304,
      margin: 4,
      background: "transparent",
      ...(wallet?.icon ? { logo: wallet.icon } : {})
    }).catch(() => {
      target.dataset.twkQrRenderer = "error";
    });
  }
}

function createConnectModalBodyHtml(viewModel: ConnectModalViewModel & { view: ConnectModalView; labels: ConnectModalLabels }): string {
  if (viewModel.view === "all-wallets") return createAllWalletsHtml(viewModel);
  if (viewModel.view === "connecting") return createConnectingHtml(viewModel);
  if (viewModel.view === "qr") return createQrHtml(viewModel);
  return createFeaturedHtml(viewModel);
}

function createFeaturedHtml(viewModel: ConnectModalViewModel & { labels: ConnectModalLabels }): string {
  const labels = viewModel.labels;
  const featuredWallets = getFeaturedWalletOptions(viewModel.wallets);
  const walletRows = featuredWallets.map((wallet) => createWalletRowHtml(wallet, labels, viewModel.selectedWalletId)).join("");
  const total = viewModel.wallets.length;
  const status = createStatusHtml(viewModel.errorMessage, viewModel.errorMessage ? "danger" : "idle");
  return `${createNetworkBadgeHtml(viewModel)}
  <div class="twk-wallet-list">
    ${walletRows}
    <button class="twk-search-trigger" type="button" data-twk-action="show-all-wallets">
      <span class="twk-search-label"><span class="twk-search-icon">${searchIcon()}</span><span class="twk-wallet-name">${escapeHtml(labels.allWallets)}</span></span>
      <span class="twk-badge" data-tone="muted">${escapeHtml(`${total}+`)}</span>
    </button>
  </div>
  ${status}
  <div class="twk-footer">${escapeHtml(labels.poweredBy)}</div>`;
}

function createAllWalletsHtml(viewModel: ConnectModalViewModel & { labels: ConnectModalLabels }): string {
  const labels = viewModel.labels;
  const wallets = filterWalletOptions(viewModel.wallets, viewModel.searchQuery);
  const gridBody = viewModel.walletsLoading
    ? createWalletSkeletonGridHtml(Math.max(6, Math.min(wallets.length || 8, 9)))
    : wallets.length > 0
      ? `<div class="twk-wallet-grid">${wallets.map((wallet) => createWalletCardHtml(wallet, labels, viewModel.selectedWalletId)).join("")}</div>`
      : `<div class="twk-no-wallets">${escapeHtml(labels.noWalletsFound)}</div>`;
  return `<div class="twk-all-wallets">
    ${createNetworkBadgeHtml(viewModel)}
    <label class="twk-search-field">
      <span class="twk-search-icon">${searchIcon()}</span>
      <span class="twk-sr-only">${escapeHtml(labels.searchWallet)}</span>
      <input class="twk-wallet-search-input" data-twk-search="wallets" type="search" value="${escapeAttribute(viewModel.searchQuery ?? "")}" placeholder="${escapeAttribute(labels.searchPlaceholder)}" autocomplete="off" />
    </label>
    ${gridBody}
    ${createStatusHtml(viewModel.errorMessage, viewModel.errorMessage ? "danger" : "idle")}
  </div>`;
}

function createWalletSkeletonGridHtml(count: number): string {
  const card = `<span class="twk-wallet-card" data-loading="true" aria-hidden="true"><span class="twk-wallet-icon" data-loading="true"><span class="twk-skeleton"></span></span><span class="twk-wallet-name" data-loading="true"><span class="twk-skeleton"></span></span></span>`;
  return `<div class="twk-wallet-grid" data-loading="true">${card.repeat(count)}</div>`;
}

function getWalletPlatforms(wallet: WalletOptionViewModel): Array<"extension" | "mobile"> {
  if (wallet.platforms?.length) return wallet.platforms.filter((platform) => platform === "extension" || platform === "mobile");
  if (wallet.transport === "mobile" || wallet.transport === "qr" || wallet.transport === "walletconnect" || wallet.capabilities?.includes("qr")) return ["mobile"];
  if (wallet.transport === "extension") return ["extension"];
  return ["extension"];
}

function createInstallRowHtml(name: string, installUrl: string | undefined, labels: ConnectModalLabels): string {
  if (!installUrl) return "";
  return `<div class="twk-install-row"><span>${escapeHtml(`${labels.dontHave} ${name}?`)}</span><a class="twk-action twk-link" href="${escapeAttribute(installUrl)}" target="_blank" rel="noreferrer">${createActionContentHtml(externalIcon(), labels.getWallet)}</a></div>`;
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
    <h3 class="twk-title twk-view-title" ${hasError ? `data-tone="danger"` : ""}>${escapeHtml(hasError ? "Connection declined" : `${labels.continueInWallet} ${wallet.name}`)}</h3>
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
    ? `<span class="twk-qr-code" data-twk-qr-code="true">${viewModel.qrImageSrc ? `<img src="${escapeAttribute(viewModel.qrImageSrc)}" alt="${escapeAttribute(`${name} ${labels.qrCode}`)}" />${wallet ? `<span class="twk-qr-center-logo">${createWalletIconHtml(wallet)}</span>` : ""}` : `<span class="twk-qr-skeleton" aria-hidden="true"></span>`}</span>`
    : `<span class="twk-qr-code" data-loading="true" data-twk-qr-code="true"><span class="twk-qr-skeleton" aria-hidden="true"></span><span class="twk-sr-only">${escapeHtml(labels.qrCode)}</span></span>`;
  return `<div class="twk-connect-detail">
    <div class="twk-qr-slot twk-qr-large">${qrContent}</div>
    <p class="twk-detail-subtitle">${escapeHtml(isQrTransport ? labels.scanQr : labels.acceptRequest)}</p>
    <div class="twk-detail-actions">
      <button class="twk-action" type="button" data-twk-action="copy-uri" ${viewModel.qrUri ? "" : "disabled"}>${createActionContentHtml(copyIcon, "Copy link", copyState)}</button>
      <button class="twk-action" type="button" data-twk-action="retry" ${retryBusy ? `data-busy="true" disabled` : ""}>${createActionContentHtml(retryIcon, labels.tryAgain, retryBusy ? "busy" : undefined)}</button>
    </div>
    ${createErrorHtml(viewModel.errorMessage ? normalizeConnectErrorMessage(viewModel.errorMessage, wallet) : undefined)}
    ${installRow}
  </div>`;
}

function createWalletRowHtml(wallet: WalletOptionViewModel, labels: ConnectModalLabels, selectedWalletId?: string): string {
  const disabled = isWalletDisabled(wallet);
  const isConnecting = selectedWalletId === wallet.id || wallet.status === "connecting";
  const badge = wallet.badge ?? createFallbackBadge(wallet, labels);
  const statusLabel = wallet.disabledReason ?? (disabled ? labels.unavailable : isConnecting ? labels.connecting : badge.label);
  return `<button class="twk-wallet-row" type="button" data-twk-wallet-id="${escapeAttribute(wallet.id)}" data-twk-adapter-id="${escapeAttribute(wallet.adapterId ?? wallet.id)}" aria-label="${escapeAttribute(`${wallet.name}: ${statusLabel}`)}" ${disabled ? "disabled" : ""}>
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
  const badge = wallet.badge ?? createFallbackBadge(wallet, labels);
  const statusLabel = wallet.disabledReason ?? (disabled ? labels.unavailable : isConnecting ? labels.connecting : badge.label);
  return `<button class="twk-wallet-card" type="button" data-twk-wallet-id="${escapeAttribute(wallet.id)}" data-twk-adapter-id="${escapeAttribute(wallet.adapterId ?? wallet.id)}" data-twk-platforms="${escapeAttribute(getWalletPlatforms(wallet).join(" "))}" aria-label="${escapeAttribute(`${wallet.name}: ${statusLabel}`)}" ${disabled ? "disabled" : ""} ${wallet.readyState === "loading" ? 'data-loading="true"' : ""}>
    ${createWalletIconHtml(wallet)}
    ${createWalletNameHtml(wallet)}
  </button>`;
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
    ? `<img src="${escapeAttribute(wallet.icon)}" alt="" aria-hidden="true" />`
    : `<span aria-hidden="true">${escapeHtml(wallet.name.slice(0, 1).toUpperCase())}</span>`;
  return `<span class="twk-wallet-icon">${icon}</span>`;
}

function createLargeWalletIconHtml(wallet: WalletOptionViewModel): string {
  const icon = wallet.icon
    ? `<img src="${escapeAttribute(wallet.icon)}" alt="" aria-hidden="true" />`
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

function createFallbackBadge(wallet: WalletOptionViewModel, labels: ConnectModalLabels): NonNullable<WalletOptionViewModel["badge"]> {
  if (wallet.capabilities?.includes("qr") || wallet.id === "walletconnect" || wallet.transport === "walletconnect") return { label: labels.qrCode.toUpperCase(), tone: "qr" };
  if (wallet.readyState === "found") return { label: labels.installed.toUpperCase(), tone: "installed" };
  if (wallet.readyState === "notFound") return { label: labels.notInstalled.toUpperCase(), tone: "muted" };
  return { label: labels.tron.toUpperCase(), tone: "tron" };
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
  const supportsQr = wallet.capabilities?.includes("qr") || wallet.id === "walletconnect" || wallet.transport === "walletconnect";
  return wallet.readyState === "unsupported" || (wallet.readyState === "notFound" && !supportsQr);
}

function resolveActiveWallet(wallets: readonly WalletOptionViewModel[], walletId?: string): WalletOptionViewModel | undefined {
  return wallets.find((wallet) => wallet.id === walletId) ?? wallets.find((wallet) => wallet.adapterId === walletId);
}

function resolveQrEventWallet(wallets: readonly WalletOptionViewModel[], adapterId: string, preferredWalletId?: string): WalletOptionViewModel | undefined {
  const preferred = preferredWalletId ? resolveActiveWallet(wallets, preferredWalletId) : undefined;
  if (preferred && (preferred.adapterId ?? preferred.id) === adapterId) return preferred;
  return wallets.find((wallet) => wallet.id === adapterId) ?? wallets.find((wallet) => wallet.id === "walletconnect") ?? wallets.find((wallet) => (wallet.adapterId ?? wallet.id) === adapterId);
}

function resolveHeaderTitle(view: ConnectModalView, labels: ConnectModalLabels, activeWallet?: WalletOptionViewModel): string {
  if (view === "all-wallets") return labels.allWallets;
  if (view === "connecting" || view === "qr") return activeWallet?.name ?? labels.title;
  return labels.title;
}

function focusPrimaryControl(root: HTMLElement): void {
  const activeElement = root.ownerDocument.activeElement;
  if (activeElement instanceof HTMLInputElement && root.contains(activeElement)) return;
  const control = root.querySelector<HTMLElement>(".twk-wallet-search-input, [data-twk-action='retry'], [data-twk-wallet-id], [data-twk-action='close']");
  control?.focus?.();
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
