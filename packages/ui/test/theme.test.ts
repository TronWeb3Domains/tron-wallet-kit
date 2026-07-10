import { describe, expect, it } from "vitest";
import {
  createAccountPanelHtml,
  createAddressQrPanelHtml,
  createConnectModalHtml,
  createDefaultWalletUiConfig,
  copyToClipboard,
  createQrDataUrl,
  createThemeStyleProperties,
  createThemeStyleText,
  createTransactionToastContainerHtml,
  createTransactionToastHtml,
  createTransactionHistoryPanelHtml,
  createWalletInlineHtml,
  createWalletButtonHtml,
  createWalletKitStyles,
  applyWalletListConfig,
  filterWalletOptions,
  getFeaturedWalletOptions,
  getThemeNames,
  mergeWalletOptionsWithCatalog,
  renderWalletQr,
  resolveWalletUiConfig,
  resolveTheme,
  resolveWalletEnvironment,
} from "../src/index";

describe("themeName presets", () => {
  it("ships multiple theme names for product customization", () => {
    expect(getThemeNames()).toEqual([
      "default",
      "light",
      "dark",
      "tron",
      "tron-energy",
      "nile",
      "shasta",
      "bandwidth",
      "energy",
      "sun",
      "graphite",
      "midnight",
      "ocean",
      "glass",
      "rounded",
      "crisp",
      "soft",
      "neon",
      "terminal",
      "minimal",
      "highContrast",
    ]);
  });

  it("resolves selected themeName with token overrides", () => {
    const theme = resolveTheme({
      themeName: "tron",
      tokens: {
        radius: "20px",
        accent: "#ff0000",
      },
    });

    expect(theme.name).toBe("tron");
    expect(theme.tokens.colorScheme).toBe("dark");
    expect(theme.tokens.radius).toBe("20px");
    expect(theme.tokens.accent).toBe("#ff0000");
  });

  it("creates scoped CSS variables for portal roots", () => {
    expect(createThemeStyleText({ themeName: "energy" }, "[data-twk-root]")).toContain(
      "[data-twk-root]",
    );
    expect(createThemeStyleText({ themeName: "energy" })).toContain("--twk-accent");
    expect(createThemeStyleText({ themeName: "energy" })).toContain("--twk-color-scheme");
    expect(createThemeStyleText({ themeName: "energy" })).toContain("color-scheme: dark");
  });

  it("creates inline style properties for framework wrappers", () => {
    const properties = createThemeStyleProperties({ themeName: "bandwidth" });

    expect(properties["color-scheme"]).toBe("dark");
    expect(properties["--twk-accent"]).toBe("#3b82f6");
    expect(properties["--twk-wallet-radius"]).toBe("8px");
    expect(properties["--twk-surface-hover"]).toBe("#1d3455");
  });

  it("uses polished measured defaults for light and dark", () => {
    expect(resolveTheme({ themeName: "light" }).tokens).toMatchObject({
      radius: "28px",
      walletRadius: "16px",
      walletIconRadius: "7px",
      surface: "#ffffff",
      accent: "#0988f0",
      qrForeground: "#0a0a0a",
      qrBackground: "#ffffff",
    });
    expect(resolveTheme({ themeName: "dark" }).tokens).toMatchObject({
      radius: "28px",
      walletRadius: "16px",
      walletIconRadius: "7px",
      surface: "#141414",
      accent: "#0988f0",
      qrForeground: "#111827",
      qrBackground: "#ffffff",
    });
  });

  it("keeps production theme text contrast above WCAG AA", () => {
    for (const themeName of ["light", "dark", "tron", "tron-energy", "nile", "shasta", "bandwidth", "energy", "sun", "terminal", "highContrast"] as const) {
      const { tokens } = resolveTheme({ themeName });
      expect(contrast(tokens.text, tokens.surface), themeName).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("resolves auto mode to a concrete light or dark preset", () => {
    const theme = resolveTheme({ mode: "auto" });

    expect(["light", "dark"]).toContain(theme.name);
    expect(["light", "dark"]).toContain(theme.tokens.colorScheme);
  });
});

describe("wallet kit surfaces", () => {
  it("creates token-driven, portal-safe component CSS", () => {
    const styles = createWalletKitStyles("[data-twk-root]");

    expect(styles).toContain("[data-twk-root] .twk-overlay");
    expect(styles).toContain("width: min(400px, calc(100vw - 32px))");
    expect(styles).toContain("height: 360px");
    expect(styles).toContain(".twk-body");
    expect(styles).toContain(".twk-qr-code");
    expect(styles).not.toContain(".twk-qr-theme-action");
    expect(styles).toContain(".twk-qr-skeleton::after");
    expect(styles).toContain("padding: 8px 20px 12px");
    expect(styles).toContain("min-height: 44px");
    expect(styles).toContain("-webkit-tap-highlight-color: transparent");
    expect(styles).toContain("appearance: none");
    expect(styles).toContain("transform: none");
    expect(styles).toContain(".twk-action-icon");
    expect(styles).toContain(".twk-action-label");
    expect(styles).toContain("line-height: 1.28");
    expect(styles).toContain("padding-block: 1px");
    expect(styles).toContain(".twk-action-spin");
    expect(styles).toContain("opacity: 0.58");
    expect(styles).toContain(".twk-skeleton-name");
    expect(styles).toContain(".twk-skeleton-balance");
    expect(styles).toContain(".twk-connecting-ring");
    expect(styles).toContain(".twk-connecting-ring-accent");
    expect(styles).toContain("height: 110px");
    expect(styles).toContain("width: 110px");
    expect(styles).toContain("stroke-dasharray: 78 162");
    expect(styles).toContain("@keyframes twk-connecting-dash");
    expect(styles).not.toContain(".twk-connecting-ring-trail");
    expect(styles).not.toMatch(/\.twk-connecting-ring\s*{[^}]*border-radius:\s*999px/);
    expect(styles).not.toContain(".twk-connecting-arc");
    expect(styles).not.toContain(".twk-qr-tabs");
    expect(styles).toContain("height: 168px");
    expect(styles).toContain("var(--twk-wallet-icon-radius)");
    expect(styles).toContain("background: var(--twk-surface)");
    expect(styles).toContain(".twk-badge");
    expect(styles).toContain(".twk-button-icon");
    expect(styles).toContain(".twk-button-panel");
    expect(styles).toContain("backdrop-filter: blur(var(--twk-backdrop-blur))");
    expect(styles).toContain("outline: 2px solid var(--twk-focus-ring)");
    expect(styles).toContain(".twk-modal:focus");
    expect(styles).toContain("outline: none");
    expect(styles).toContain("will-change: opacity, transform");
    expect(styles).toContain("translateY(6px) scale(.992)");
    expect(styles).not.toContain("#");
    expect(styles).not.toContain("rgba(");
  });

  it("creates a stable connect modal with wallet ready states", () => {
    const html = createConnectModalHtml({
      wallets: [
        {
          id: "tronlink",
          name: "TronLink",
          readyState: "found",
          status: "connecting",
        },
        {
          id: "walletconnect",
          name: "WalletConnect",
          readyState: "notFound",
          capabilities: ["qr"],
        },
      ],
      errorMessage: "User rejected the request",
    });

    expect(html).toContain('role="dialog"');
    expect(html).toContain('tabindex="-1" data-twk-panel="true"');
    expect(html).toContain('data-twk-wallet-id="tronlink"');
    expect(html).toContain("Connecting");
    expect(html).toContain("QR CODE");
    expect(html).toContain("twk-badge");
    expect(html).toContain("User rejected the request");
    expect(html).toContain("twk-status");
    expect(html).toContain('data-tone="danger"');
  });

  it("reserves wallet card icon and name space while readiness is loading", () => {
    const html = createConnectModalHtml({
      wallets: [
        {
          id: "tronlink",
          name: "TronLink",
          readyState: "loading",
        },
      ],
    });

    expect(html).toContain('class="twk-wallet-icon" data-loading="true"');
    expect(html).toContain('class="twk-wallet-name" data-loading="true"');
    expect(html).toContain('data-loading="true"');
    expect(html).toContain("TronLink");
  });

  it("creates a token-driven wallet button in disconnected and connected states", () => {
    const disconnected = createWalletButtonHtml();
    expect(disconnected).toContain("Connect Wallet");
    expect(disconnected).toContain('data-status="disconnected"');
    expect(disconnected).toContain("twk-button-icon");

    const connected = createWalletButtonHtml({
      status: "connected",
      connectedLabel: "alice.trx",
      address: "TXYZabcdefghijklmnopqrstuvwxyz123456789",
      balanceTrx: "12.5",
      adapterName: "TronLink",
      hasPendingTransactions: true,
      variant: "pill"
    });
    expect(connected).toContain("alice.trx");
    expect(connected).toContain("(12.5 TRX)");
    expect(connected).toContain("twk-button-chevron");
    expect(connected).toContain("twk-button-pending");
    expect(connected).toContain('data-variant="pill"');

    const loading = createWalletButtonHtml({
      status: "connected",
      connectedLabel: "alice.trx",
      identityLoading: true,
      balanceLoading: true,
    });
    expect(loading).toContain("twk-skeleton-name");
    expect(loading).toContain("twk-skeleton-balance");
  });

  it("renders TRON featured wallets with TronLink first and WalletConnect last", () => {
    const html = createConnectModalHtml({
      wallets: [
        {
          id: "walletconnect",
          adapterId: "walletconnect",
          name: "WalletConnect",
          readyState: "found",
          capabilities: ["qr"],
        },
        {
          id: "tronlink",
          adapterId: "tronlink",
          name: "TronLink",
          readyState: "found",
        },
      ],
    });

    expect(html.indexOf('data-twk-wallet-id="tronlink"')).toBeLessThan(html.indexOf('data-twk-wallet-id="walletconnect"'));
    expect(html).toContain('data-twk-action="show-all-wallets"');
    expect(html).toContain("Powered by TRON Wallet Kit");
    expect(html).not.toContain("reown");
    expect(html).not.toContain("MULTICHAIN");
  });

  it("merges the TRON wallet catalog without treating it as multichain", () => {
    const wallets = mergeWalletOptionsWithCatalog([
      {
        id: "tronlink",
        adapterId: "tronlink",
        name: "TronLink",
        readyState: "found",
      },
      {
        id: "walletconnect",
        adapterId: "walletconnect",
        name: "WalletConnect",
        readyState: "found",
        capabilities: ["qr"],
      },
    ]);

    expect(wallets.some((wallet) => wallet.id === "tokenpocket" && wallet.adapterId === "walletconnect")).toBe(true);
    expect(wallets.find((wallet) => wallet.id === "tronlink")?.platforms).toEqual(["extension", "mobile"]);
    expect(wallets.find((wallet) => wallet.id === "tokenpocket")?.platforms).toEqual(["extension", "mobile"]);
    expect(wallets.find((wallet) => wallet.id === "okx")?.adapterId).toBe("okx");
    expect(wallets.find((wallet) => wallet.id === "bitget")?.adapterId).toBe("bitget");
    expect(filterWalletOptions(wallets, "trust").map((wallet) => wallet.id)).toEqual(["trust"]);
    const featured = getFeaturedWalletOptions(wallets);
    expect(featured).toHaveLength(5);
    expect(featured.at(0)?.id).toBe("tronlink");
    expect(featured.map((wallet) => wallet.id)).toEqual(["tronlink", "walletconnect", "tokenpocket", "binance", "safepal"]);
    expect(featured.findIndex((wallet) => wallet.id === "walletconnect")).toBeLessThan(featured.findIndex((wallet) => wallet.id === "tokenpocket"));
    expect(featured.some((wallet) => wallet.readyState === "notFound" && !wallet.capabilities?.includes("qr") && wallet.transport !== "hardware")).toBe(false);
  });

  it("falls back dual-mode wallets to WalletConnect QR when the extension is unavailable", () => {
    const wallets = mergeWalletOptionsWithCatalog([
      {
        id: "tokenpocket",
        adapterId: "tokenpocket",
        name: "TokenPocket",
        readyState: "notFound",
        transport: "extension",
      },
      {
        id: "walletconnect",
        name: "WalletConnect",
        readyState: "found",
        capabilities: ["qr"],
        transport: "walletconnect",
      },
    ]);
    const tokenPocket = wallets.find((wallet) => wallet.id === "tokenpocket");

    expect(tokenPocket).toMatchObject({
      id: "tokenpocket",
      adapterId: "walletconnect",
      readyState: "found",
      transport: "qr",
      available: true,
      badge: { label: "QR CODE", tone: "qr" },
    });

    const html = createConnectModalHtml({
      view: "qr",
      activeWalletId: "tokenpocket",
      qrUri: "wc:test",
      wallets,
    });

    expect(html).toContain("TokenPocket");
    expect(html).toContain("Don&#39;t have TokenPocket?");
    expect(html).not.toContain("Don&#39;t have WalletConnect?");
  });

  it("accepts runtime catalog icons without owning a static icon map", () => {
    const wallets = mergeWalletOptionsWithCatalog(
      [],
      undefined,
      [
        {
          id: "tronlink",
          name: "TronLink",
          enabled: true,
          group: "featured",
          transport: "extension",
          platforms: ["extension"],
          icon: "data:image/svg+xml;base64,PHN2Zy8+",
          homepage: "https://www.tronlink.org/",
          downloadUrl: "https://www.tronlink.org/"
        }
      ]
    );

    expect(wallets.find((wallet) => wallet.id === "tronlink")?.icon).toBe("data:image/svg+xml;base64,PHN2Zy8+");
  });

  it("carries registry metadata for future platform-specific wallet UX", () => {
    const wallets = mergeWalletOptionsWithCatalog([]);
    const trust = wallets.find((wallet) => wallet.id === "trust");
    const binance = wallets.find((wallet) => wallet.id === "binance");

    expect(trust).toMatchObject({
      providerPaths: ["trustwallet.tronLink", "trustwallet.tron"],
      supportsWalletConnect: true,
      mobileDeepLink: { scheme: "https" },
    });
    expect(binance?.conflictMarkers).toContain("isBinance");
  });

  it("supports advanced wallet list controls with explicit featured modes and layouts", () => {
    const wallets = mergeWalletOptionsWithCatalog([
      { id: "tronlink", name: "TronLink", readyState: "found" },
      { id: "tokenpocket", name: "TokenPocket", readyState: "notFound", transport: "extension" },
      { id: "walletconnect", name: "WalletConnect", readyState: "found", transport: "walletconnect", capabilities: ["qr"] },
      { id: "okx", name: "OKX Wallet", readyState: "notFound" },
      { id: "bitget", name: "Bitget Wallet", readyState: "notFound" },
      { id: "trust", name: "Trust Wallet", readyState: "notFound" },
      { id: "binance", name: "Binance Web3 Wallet", readyState: "notFound" },
      { id: "metamask", name: "MetaMask", readyState: "notFound" },
      { id: "gate", name: "Gate Wallet", readyState: "notFound" },
      { id: "bybit", name: "Bybit Wallet", readyState: "notFound" },
      { id: "guarda", name: "Guarda", readyState: "notFound" },
    ]);
    const featuredWallets = getFeaturedWalletOptions(wallets, {
      featuredMode: "manual",
      featuredWallets: ["tronlink", "tokenpocket", "okx", "bitget", "trust", "binance", "walletconnect", "metamask", "gate", "bybit", "guarda"],
    });
    const installedFirstWallets = getFeaturedWalletOptions(wallets, {
      featuredMode: "installed-first",
    });
    const installedOnlyWithoutInstalled = getFeaturedWalletOptions(
      wallets.map((wallet) => ({ ...wallet, readyState: wallet.id === "walletconnect" ? "found" as const : "notFound" as const, available: wallet.id === "walletconnect" })),
      { featuredMode: "installed-only" }
    );
    const installedFirstWithoutInstalled = getFeaturedWalletOptions(
      wallets.map((wallet) => ({ ...wallet, readyState: wallet.id === "walletconnect" ? "found" as const : "notFound" as const, available: wallet.id === "walletconnect" })),
      { featuredMode: "installed-first" }
    );

    expect(featuredWallets.map((wallet) => wallet.id)).toEqual(["tronlink", "tokenpocket", "okx", "bitget", "trust", "binance", "walletconnect", "metamask", "gate", "bybit", "guarda"]);
    expect(installedFirstWallets.map((wallet) => wallet.id)).toEqual(["tronlink", "walletconnect", "tokenpocket", "binance", "safepal"]);
    expect(installedFirstWallets.findIndex((wallet) => wallet.id === "walletconnect")).toBeLessThan(installedFirstWallets.findIndex((wallet) => wallet.id === "tokenpocket"));
    expect(installedFirstWallets.map((wallet) => wallet.id)).not.toEqual(expect.arrayContaining(["okx", "bitget"]));
    expect(installedFirstWallets.some((wallet) => wallet.readyState === "notFound" && !wallet.capabilities?.includes("qr") && wallet.transport !== "hardware")).toBe(false);
    expect(installedOnlyWithoutInstalled.map((wallet) => wallet.id)).toEqual(["walletconnect"]);
    expect(installedFirstWithoutInstalled[0]?.id).toBe("walletconnect");

    const manyInstalled = getFeaturedWalletOptions(
      mergeWalletOptionsWithCatalog([
        { id: "tronlink", name: "TronLink", readyState: "found" },
        { id: "tokenpocket", name: "TokenPocket", readyState: "found" },
        { id: "okx", name: "OKX Wallet", readyState: "found" },
        { id: "bitget", name: "Bitget Wallet", readyState: "found" },
        { id: "trust", name: "Trust Wallet", readyState: "found" },
        { id: "walletconnect", name: "WalletConnect", readyState: "found", transport: "walletconnect", capabilities: ["qr"] },
      ]),
      { featuredMode: "installed-first" }
    );
    expect(manyInstalled.map((wallet) => wallet.id)).toEqual(["tronlink", "tokenpocket", "okx", "bitget", "trust", "walletconnect"]);

    const html = createConnectModalHtml({
      wallets,
      walletList: {
        layout: "card",
        featuredMode: "manual",
        featuredWallets: featuredWallets.map((wallet) => wallet.id),
      },
    });
    expect(html).toContain('data-layout="card"');
    expect(html).toContain('data-scope="featured"');
    expect(html).toContain("twk-wallet-card");
    expect(html).not.toContain("twk-wallet-compact");
    expect(html).toContain('data-status="installed"');
    expect(html).toContain('data-status="qr"');
    expect(html).toContain('data-twk-wallet-id="walletconnect"');
    expect(html).toMatch(/data-twk-wallet-id="walletconnect"[\s\S]*?data-status="qr"/);

    const styles = createWalletKitStyles("[data-twk-root]");
    expect(styles).toContain(".twk-wallet-status");
    expect(styles).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(styles).toContain('.twk-wallet-grid[data-scope="featured"]');
    expect(styles).toContain("max-height: min(360px, 52vh)");
    expect(styles).toContain('[data-overflow="bottom"]');
    expect(styles).toContain('[data-overflow="top"]');
    expect(styles).toContain('[data-overflow="both"]');
    expect(styles).not.toContain('.twk-wallet-grid[data-scope="featured"][data-overflow');
    expect(styles).not.toContain('.twk-wallet-grid[data-scope="featured"] {\n  height: min(360px, 52vh)');
    expect(styles).toContain("padding: 4px 16px 8px");
    expect(styles).toContain("min-height: 12px");
    expect(styles).toContain("height: 56px");
    expect(styles).toContain("height: 18px");
    expect(styles).toContain("height: 12px");
    expect(styles).toContain("border: 1.5px solid var(--twk-surface)");
    expect(styles).toContain("background: var(--twk-success)");
    expect(styles).not.toContain('data-status="qr"] {\n  background: var(--twk-badge-qr-bg)');
    expect(styles).toContain("color: var(--twk-badge-qr-fg)");

    const filtered = applyWalletListConfig(wallets, {
      wallets: ["walletconnect", "tronlink", "okx", "trust"],
      disabledWallets: ["trust"],
      sortAvailableFirst: true,
    });
    expect(filtered.map((wallet) => wallet.id)).toEqual(["tronlink", "walletconnect", "okx"]);
  });

  it("applies platform-aware wallet visibility for desktop and mobile browser", () => {
    const wallets = [
      { id: "tronlink", name: "TronLink", readyState: "found" as const, platforms: ["extension", "mobile"] as const },
      { id: "gate", name: "Gate Wallet", readyState: "notFound" as const, platforms: ["extension"] as const },
      { id: "foxwallet", name: "FoxWallet", readyState: "notFound" as const, platforms: ["mobile"] as const, mobileDeepLink: { scheme: "foxwallet" } },
      { id: "ledger", name: "Ledger", readyState: "notFound" as const, platforms: ["hardware"] as const, transport: "hardware" },
      { id: "walletconnect", name: "WalletConnect", readyState: "found" as const, platforms: ["mobile"] as const, transport: "walletconnect", capabilities: ["qr"] },
    ];

    const desktopWallets = applyWalletListConfig(wallets, {}, { kind: "desktop-extension", isMobile: false, hasInjected: true });
    expect(desktopWallets.map((wallet) => wallet.id)).toEqual(["tronlink", "walletconnect", "ledger", "gate"]);

    const mobileWallets = applyWalletListConfig(
      wallets,
      { showUnavailable: false },
      { kind: "mobile-browser", isMobile: true, hasInjected: false }
    );
    expect(mobileWallets.map((wallet) => wallet.id)).toEqual(["tronlink", "walletconnect", "foxwallet"]);

    const mobileFeatured = getFeaturedWalletOptions(mobileWallets, { featuredMode: "installed-first" }, { kind: "mobile-browser", isMobile: true, hasInjected: false });
    expect(mobileFeatured[0]?.id).toBe("walletconnect");

    const mobileHtml = createConnectModalHtml({
      wallets,
      walletEnvironment: { kind: "mobile-browser", isMobile: true, hasInjected: false },
      walletList: { showUnavailable: false },
    });
    expect(mobileHtml).toContain('data-twk-wallet-id="walletconnect"');
    expect(mobileHtml).toContain('data-twk-wallet-id="foxwallet"');
    expect(mobileHtml).not.toContain('data-twk-wallet-id="gate"');
    expect(mobileHtml).not.toContain('data-twk-wallet-id="ledger"');
  });

  it("keeps Ledger hardware selectable without an extension installed badge", () => {
    const html = createConnectModalHtml({
      view: "all-wallets",
      wallets: [
        {
          id: "ledger",
          name: "Ledger",
          readyState: "notFound",
          available: false,
          platforms: ["hardware"],
          transport: "hardware",
        },
      ],
    });

    expect(html).toContain('data-twk-wallet-id="ledger"');
    expect(html).not.toContain('data-twk-wallet-id="ledger" data-twk-adapter-id="ledger" data-twk-platforms="hardware" aria-label="Ledger: Not installed" disabled');
    expect(html).toContain("HARDWARE");
    expect(html).not.toContain("NOT INSTALLED");
  });

  it("detects desktop, mobile browser, and mobile in-app wallet environments", () => {
    expect(resolveWalletEnvironment({ navigator: { userAgent: "Mozilla/5.0", maxTouchPoints: 0 } } as unknown as Window).kind).toBe("desktop-extension");
    expect(resolveWalletEnvironment({ navigator: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile", maxTouchPoints: 5 } } as unknown as Window).kind).toBe("mobile-browser");
    expect(resolveWalletEnvironment({ navigator: { userAgent: "Mozilla/5.0 (Linux; Android 14) Mobile", maxTouchPoints: 5 }, tronWeb: {} } as unknown as Window).kind).toBe("mobile-in-app");
  });

  it("renders all-wallets search, connecting detail, and QR views", () => {
    const allWalletsHtml = createConnectModalHtml({
      view: "all-wallets",
      searchQuery: "token",
      wallets: [
        {
          id: "tronlink",
          name: "TronLink",
          readyState: "found",
        },
        {
          id: "walletconnect",
          name: "WalletConnect",
          readyState: "found",
          capabilities: ["qr"],
        },
      ],
    });
    expect(allWalletsHtml).toContain('data-twk-search="wallets"');
    expect(allWalletsHtml).toContain('data-twk-wallet-id="tokenpocket"');
    expect(allWalletsHtml).toContain('data-twk-platforms="extension mobile"');
    expect(allWalletsHtml).not.toContain('data-twk-wallet-id="tronlink"');
    expect(allWalletsHtml).toContain("Powered by TRON Wallet Kit");

    const allWalletsWithoutFooter = createConnectModalHtml({
      view: "all-wallets",
      showPoweredBy: false,
      wallets: [],
    });
    expect(allWalletsWithoutFooter).not.toContain("Powered by TRON Wallet Kit");

    const flatAllWalletsHtml = createConnectModalHtml({
      view: "all-wallets",
      walletList: { layout: "card" },
      wallets: [
        {
          id: "tronlink",
          name: "TronLink",
          readyState: "loading",
          platforms: ["extension", "mobile"],
        },
        {
          id: "tokenpocket",
          name: "TokenPocket",
          readyState: "found",
          capabilities: ["qr"],
          platforms: ["extension", "mobile"],
        },
      ],
    });
    expect(flatAllWalletsHtml).toContain("twk-wallet-grid");
    expect(flatAllWalletsHtml).toContain('data-scope="all"');
    expect(flatAllWalletsHtml).not.toContain("twk-wallet-sections");
    expect(flatAllWalletsHtml).not.toContain('data-platform="extension"');
    expect(flatAllWalletsHtml).toContain('class="twk-wallet-card"');
    expect(flatAllWalletsHtml).toContain('data-loading="true"');
    expect(flatAllWalletsHtml).toContain("twk-skeleton");

    const loadingAllWalletsHtml = createConnectModalHtml({
      view: "all-wallets",
      walletsLoading: true,
      wallets: [],
    });
    expect(loadingAllWalletsHtml).toContain('data-scope="all"');
    expect(loadingAllWalletsHtml).toContain('data-loading="true"');

    const connectingHtml = createConnectModalHtml({
      view: "connecting",
      activeWalletId: "tronlink",
      wallets: [
        {
          id: "tronlink",
          name: "TronLink",
          readyState: "found",
          downloadUrl: "https://www.tronlink.org/download",
        },
      ],
    });
    expect(connectingHtml).toContain("Continue in TronLink");
    expect(connectingHtml).toContain('data-twk-action="retry"');
    expect(connectingHtml).toContain("twk-connecting-ring");
    expect(connectingHtml).toContain("twk-connecting-ring-accent");
    expect(connectingHtml).toContain('viewBox="0 0 110 110"');
    expect(connectingHtml).toContain('width="110"');
    expect(connectingHtml).toContain('height="110"');
    expect(connectingHtml).toContain('rx="36"');
    expect(connectingHtml).toContain("pathLength=\"240\"");
    expect(connectingHtml).not.toContain("twk-connecting-ring-trail");
    expect(connectingHtml).not.toContain("&times;");
    expect(connectingHtml).toContain("https://www.tronlink.org/download");

    const retryBusyHtml = createConnectModalHtml({
      view: "connecting",
      activeWalletId: "tronlink",
      retryState: "busy",
      wallets: [
        {
          id: "tronlink",
          name: "TronLink",
          readyState: "found",
        },
      ],
    });
    expect(retryBusyHtml).toContain('data-busy="true" disabled');
    expect(retryBusyHtml).toContain("twk-action-spin");
    expect(retryBusyHtml).toContain("Try again");

    const qrHtml = createConnectModalHtml({
      view: "qr",
      activeWalletId: "walletconnect",
      qrUri: "wc:test",
      qrImageSrc: "data:image/png;base64,abc",
      wallets: [
        {
          id: "walletconnect",
          name: "WalletConnect",
          readyState: "found",
          capabilities: ["qr"],
        },
      ],
    });
    expect(qrHtml).toContain("twk-qr-large");
    expect(qrHtml).toContain('data-twk-qr-code="true"');
    expect(qrHtml).not.toContain('data-twk-action="toggle-qr-light"');
    expect(qrHtml).not.toContain('aria-pressed="false"');
    expect(qrHtml).not.toContain("twk-qr-tabs");
    expect(qrHtml).not.toContain("Mobile</span>");
    expect(qrHtml).not.toContain("twk-view-title");
    expect(qrHtml.indexOf("twk-qr-large")).toBeLessThan(qrHtml.indexOf("Scan this QR Code"));
    expect(qrHtml).not.toContain("twk-qr-uri");
    expect(qrHtml).toContain("data:image/png;base64,abc");
    expect(qrHtml).toContain("twk-action-icon");
    expect(qrHtml).toContain("twk-action-label");

    const loadingQrHtml = createConnectModalHtml({
      view: "qr",
      activeWalletId: "walletconnect",
      wallets: [
        {
          id: "walletconnect",
          name: "WalletConnect",
          readyState: "found",
          capabilities: ["qr"],
        },
      ],
    });
    expect(loadingQrHtml).toContain('class="twk-qr-code" data-loading="true" data-twk-qr-code="true"');
    expect(loadingQrHtml).toContain("twk-qr-skeleton");
    expect(loadingQrHtml).not.toContain('data-twk-action="toggle-qr-light"');

    const walletConnectQrHtml = createConnectModalHtml({
      view: "qr",
      activeWalletId: "walletconnect",
      qrUri: "wc:test",
      qrCopyState: "copied",
      wallets: [
        {
          id: "tokenpocket",
          adapterId: "walletconnect",
          name: "TokenPocket",
          readyState: "found",
          capabilities: ["qr"],
        },
        {
          id: "walletconnect",
          name: "WalletConnect",
          readyState: "found",
          capabilities: ["qr"],
        },
      ],
    });
    expect(walletConnectQrHtml).toContain('<h2 class="twk-title" id="twk-connect-title">WalletConnect</h2>');
    expect(walletConnectQrHtml).not.toContain("Don&#39;t have WalletConnect?");
    expect(walletConnectQrHtml).toContain("Copy link");
    expect(walletConnectQrHtml).toContain('data-state="success"');
    expect(walletConnectQrHtml).not.toContain("Don&#39;t have TokenPocket?");
  });

  it("surfaces QR render failures and wallet icon image fallbacks", () => {
    const html = createConnectModalHtml({
      view: "qr",
      qrUri: "wc:broken",
      qrRenderState: "error",
      activeWalletId: "walletconnect",
      wallets: [
        {
          id: "walletconnect",
          name: "WalletConnect",
          icon: "https://example.invalid/icon.svg",
          readyState: "found",
          capabilities: ["qr"],
        },
      ],
    });

    expect(html).toContain('data-twk-qr-renderer="error"');
    expect(html).toContain("Unable to render QR code");

    const walletHtml = createConnectModalHtml({
      wallets: [
        {
          id: "walletconnect",
          name: "WalletConnect",
          icon: "https://example.invalid/icon.svg",
          readyState: "found",
          capabilities: ["qr"],
        },
      ],
    });
    expect(walletHtml).toContain('onerror="this.remove()"');
    expect(walletHtml).toContain("twk-wallet-icon-fallback");
  });

  it("falls back to execCommand for clipboard copy results", async () => {
    let copiedValue = "";
    const textarea = {
      value: "",
      style: {},
      setAttribute: () => undefined,
      select: () => undefined,
      setSelectionRange: () => undefined,
      remove: () => undefined,
    };
    const documentRef = {
      defaultView: { navigator: {} },
      body: {
        append: () => {
          copiedValue = textarea.value;
        },
      },
      createElement: () => textarea,
      execCommand: (command: string) => command === "copy",
    } as unknown as Document;

    await expect(copyToClipboard("tron-value", documentRef)).resolves.toBe(true);
    expect(copiedValue).toBe("tron-value");
  });

  it("keeps technical connection errors compact inside detail panels", () => {
    const html = createConnectModalHtml({
      view: "connecting",
      activeWalletId: "metamask",
      errorMessage:
        "Failed to fetch dynamically imported module: http://127.0.0.1:5174/node_modules/.vite/deps/@tronweb3_tronwallet-adapter-metamask-tron.js?v=2220cb3c",
      wallets: [
        {
          id: "metamask",
          name: "MetaMask",
          readyState: "found",
        },
      ],
    });

    expect(html).toContain("Connection declined");
    expect(html).not.toContain("node_modules/.vite/deps");
    expect(html).toContain("MetaMask could not be loaded. Refresh the page and try again.");
  });

  it("creates inline wallet picker markup with a network badge", () => {
    const html = createWalletInlineHtml({
      networkName: "Nile",
      networkType: "TESTNET",
      wallets: [
        {
          id: "tronlink",
          name: "TronLink",
          readyState: "found",
        },
      ],
    });

    expect(html).toContain("twk-inline");
    expect(html).not.toContain("twk-overlay");
    expect(html).toContain("twk-network-badge");
    expect(html).toContain("Nile");
    expect(html).toContain("TESTNET");

    const mainnetHtml = createWalletInlineHtml({
      networkName: "TRON Mainnet",
      networkType: "MAINNET",
      wallets: [
        {
          id: "tronlink",
          name: "TronLink",
          readyState: "found",
        },
      ],
    });
    expect(mainnetHtml).not.toContain("twk-network-badge");
  });

  it("keeps all-wallets flat without wallet grouping markup", () => {
    const wallets = [
      { id: "walletconnect", name: "WalletConnect", readyState: "found" as const, group: "featured", capabilities: ["qr"] },
      { id: "tokenpocket", name: "TokenPocket", readyState: "found" as const, group: "popular", capabilities: ["qr"] },
      { id: "okx", name: "OKX Wallet", readyState: "found" as const, group: "popular" },
      { id: "bitget", name: "Bitget Wallet", readyState: "found" as const, group: "popular" },
      { id: "guarda", name: "Guarda", readyState: "found" as const, group: "popular" },
    ];
    const flat = createConnectModalHtml({
      view: "all-wallets",
      wallets,
    });

    expect(flat).not.toContain("twk-wallet-groups");
    expect(flat).not.toContain("twk-mini-stack");
    expect(flat).not.toContain("twk-mini-count");
    expect(flat).toContain("twk-wallet-grid");
  });

  it("creates an account panel with copy, QR, and recent transaction slots", () => {
    const html = createAccountPanelHtml({
      account: {
        address: "TXYZabcdefghijklmnopqrstuvwxyz123456789",
        domain: "alice.trx",
      },
      networkName: "nile",
      balanceTrx: "123.45",
      copyState: "copied",
      addressQr: {
        src: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
      },
      recentTransactions: [
        {
          id: "tx-1",
          label: "Send TRX",
          status: "pending",
          txHash: "abcdef1234567890abcdef1234567890abcdef12",
          explorerUrl: "https://tronscan.org/#/transaction/abcdef1234567890abcdef1234567890abcdef12",
        },
        { id: "tx-2", label: "Confirmed", status: "success", txHash: "2222222222222222222222222222222222222222" },
        { id: "tx-3", label: "Failed", status: "failed", txHash: "3333333333333333333333333333333333333333" },
        { id: "tx-4", label: "Fourth", status: "unknown", txHash: "4444444444444444444444444444444444444444" },
      ],
      showSendButton: true,
    });

    expect(html).toContain("Connected");
    expect(html).toContain("alice.trx");
    expect(html).toContain("123.45 TRX");
    expect(html).not.toContain("nile");
    expect(html).not.toContain("TRX TRX");
    expect(html).toContain("Copied");
    expect(html).toContain('data-state="success"');
    expect(html).toContain("twk-action-icon");
    expect(html).toContain("twk-action-label");
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("twk-qr-slot");
    expect(html).toContain('data-has-recent="true"');
    expect(html).toContain("twk-tx-section");
    expect(html).toContain("twk-tx-header");
    expect(html).toContain('data-twk-action="tx-history"');
    expect(html).toContain("View");
    expect(html).toContain("Send TRX");
    expect(html).toContain("Confirmed");
    expect(html).toContain("Failed");
    expect(html).not.toContain("Fourth");
    expect(html).toContain('data-status="pending"');
    expect(html).toContain("twk-tx-link");
  });

  it("keeps recent transactions opt-in when there are no transactions", () => {
    const html = createAccountPanelHtml({
      account: {
        address: "TXYZabcdefghijklmnopqrstuvwxyz123456789",
      },
    });

    expect(html).toContain('data-has-recent="false"');
    expect(html).not.toContain("twk-tx-section");
  });

  it("creates an address QR sub-view with back, copy, and shared QR target", () => {
    const html = createAddressQrPanelHtml({
      address: "TXYZabcdefghijklmnopqrstuvwxyz123456789",
      copyState: "copied",
    });

    expect(html).toContain('data-twk-account-view="address-qr"');
    expect(html).toContain('data-twk-action="account-back"');
    expect(html).toContain('data-twk-action="close-account"');
    expect(html).toContain('data-twk-address-qr-code="true"');
    expect(html).not.toContain('data-twk-action="toggle-address-qr-light"');
    expect(html).not.toContain('aria-pressed="true"');
    expect(html).toContain("TXYZabcdefghijklmnopqrstuvwxyz123456789");
    expect(html).toContain("Copied");
    expect(html).toContain('data-state="success"');
  });

  it("renders stable account identity and balance skeletons", () => {
    const html = createAccountPanelHtml({
      account: {
        address: "TXYZabcdefghijklmnopqrstuvwxyz123456789",
      },
      identityLoading: true,
      balanceLoading: true,
    });

    expect(html).toContain('class="twk-domain" data-loading="true"');
    expect(html).toContain('class="twk-pill-balance" data-loading="true"');
    expect(html).toContain("twk-skeleton");
  });

  it("hides balance when missing instead of rendering a dash", () => {
    const html = createAccountPanelHtml({
      account: {
        address: "TXYZabcdefghijklmnopqrstuvwxyz123456789",
        network: {
          id: "nile",
          name: "Nile",
          networkType: "TESTNET",
          nativeAsset: "TRX",
          nativeAssetDecimals: 6,
          rpcUrl: "https://nile.trongrid.io",
        },
      },
    });

    expect(html).not.toContain('class="twk-pill-balance"');
    expect(html).not.toContain(">-<");
    expect(html).not.toContain("TRX TRX");
  });

  it("does not render network labels inside the account panel", () => {
    const html = createAccountPanelHtml({
      account: {
        address: "TXYZabcdefghijklmnopqrstuvwxyz123456789",
      },
      networkName: "TRON mainnet",
    });

    expect(html).not.toContain("TRON mainnet");
  });

  it("omits fallback account name and explorer unless explicitly enabled", () => {
    const html = createAccountPanelHtml({
      account: {
        address: "TXYZabcdefghijklmnopqrstuvwxyz123456789",
      },
      explorerUrl: "https://tronscan.org/#/address/TXYZabcdefghijklmnopqrstuvwxyz123456789",
    });

    expect(html).not.toContain("twk-domain");
    expect(html).toContain("twk-account-meta-pill");
    expect(html).toContain("TXYZ");
    expect(html).not.toContain("Explorer");
  });

  it("creates a full recent transaction history sub-view", () => {
    const html = createTransactionHistoryPanelHtml({
      account: {
        address: "TXYZabcdefghijklmnopqrstuvwxyz123456789",
      },
      recentTransactions: [
        { id: "tx-1", label: "One", status: "pending", txHash: "1111111111111111111111111111111111111111" },
        { id: "tx-2", label: "Two", status: "success", txHash: "2222222222222222222222222222222222222222" },
        { id: "tx-3", label: "Three", status: "failed", txHash: "3333333333333333333333333333333333333333" },
        { id: "tx-4", label: "Four", status: "unknown", txHash: "4444444444444444444444444444444444444444" },
      ],
    });

    expect(html).toContain('data-twk-account-view="tx-history"');
    expect(html).toContain('data-twk-action="account-back"');
    expect(html).toContain("One");
    expect(html).toContain("Four");
  });


  it("escapes untrusted display values", () => {
    const html = createConnectModalHtml({
      view: "all-wallets",
      searchQuery: "bad",
      wallets: [
        {
          id: "bad",
          name: "<script>alert(1)</script>",
          readyState: "found",
        },
      ],
    });

    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("resolves TRON UI config with simple defaults", () => {
    const config = resolveWalletUiConfig({
      mode: "dark",
      customTheme: {
        radius: "18px",
      },
      modal: {
        title: "Connect TRON",
      },
      walletList: {
        layout: "grid",
      },
      toast: true,
    });

    expect(config.theme.name).toBe("dark");
    expect(config.theme.tokens.radius).toBe("18px");
    expect(config.modal.title).toBe("Connect TRON");
    expect(config.walletList.layout).toBe("card");
    expect(config.walletList.featuredMode).toBe("installed-first");
    expect(config.toast && config.toast.position).toBe("bottom-right");
    expect(createDefaultWalletUiConfig().accountPanel.showAddressQr).toBe(true);

    const manualConfig = resolveWalletUiConfig({
      walletList: {
        featuredLimit: 3,
        featuredWallets: ["tronlink", "tokenpocket", "okx", "bitget", "trust", "binance", "walletconnect", "metamask", "gate", "bybit", "guarda"],
      },
    });
    expect(manualConfig.walletList.featuredWallets).toEqual(["tronlink", "tokenpocket", "okx", "bitget", "trust", "binance", "walletconnect", "metamask", "gate", "bybit", "guarda"]);
  });

  it("resolves built-in locales and app label overrides", () => {
    const viConfig = resolveWalletUiConfig({ locale: "vi" });
    expect(viConfig.labels.connectModal.title).toBe("Ket noi vi");
    expect(viConfig.modal.title).toBe("Ket noi vi");

    const overridden = resolveWalletUiConfig({
      locale: "vi",
      modal: { title: "Ket noi TRON" },
      labels: {
        connectModal: {
          tryAgain: "Lam lai"
        }
      }
    });
    expect(overridden.modal.title).toBe("Ket noi TRON");
    expect(overridden.labels.connectModal.tryAgain).toBe("Lam lai");
    expect(overridden.labels.connectModal.qrCode).toBe("Ma QR");

    const html = createConnectModalHtml({
      labels: overridden.labels.connectModal,
      wallets: [
        {
          id: "walletconnect",
          name: "WalletConnect",
          readyState: "found",
          capabilities: ["qr"],
        },
      ],
    });
    expect(html).toContain("Ket noi vi");
    expect(html).toContain("Tat ca vi");
    expect(html).toContain("MA QR");
  });

  it("creates accessible transaction toasts with explorer and dismiss actions", () => {
    const toast = createTransactionToastHtml({
      id: "tx-1",
      label: "Transaction confirmed",
      status: "success",
      txHash: "abcdef1234567890abcdef1234567890abcdef12",
      explorerUrl: "https://tronscan.org/#/transaction/abcdef",
    });
    const container = createTransactionToastContainerHtml([
      {
        id: "tx-1",
        label: "Transaction submitted",
        status: "pending",
      },
    ]);

    expect(toast).toContain('role="status"');
    expect(toast).toContain('data-status="success"');
    expect(toast).toContain('data-twk-toast-dismiss="tx-1"');
    expect(toast).toContain("https://tronscan.org/#/transaction/abcdef");
    expect(container).toContain('aria-live="polite"');
    expect(container).toContain("twk-toast-spinner");
  });

  it("creates QR data URLs for addresses or WalletConnect URIs", async () => {
    const dataUrl = await createQrDataUrl("TXYZabcdefghijklmnopqrstuvwxyz123456789");

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(typeof renderWalletQr).toBe("function");
  });

  it("creates transaction toast markup", () => {
    const html = createTransactionToastContainerHtml([
      {
        id: "tx-1",
        label: "Transaction submitted",
        status: "pending",
        txHash: "abcdef1234567890abcdef1234567890abcdef12",
      },
    ]);

    expect(html).toContain("twk-toast-root");
    expect(html).toContain('data-status="pending"');
    expect(html).toContain("twk-toast-spinner");
    expect(html).toContain("twk-toast-dismiss");
    expect(html).toContain("Transaction submitted");
  });
});

function contrast(foreground: string, background: string): number {
  const fg = luminance(parseHex(foreground));
  const bg = luminance(parseHex(background));
  const light = Math.max(fg, bg);
  const dark = Math.min(fg, bg);
  return (light + 0.05) / (dark + 0.05);
}

function luminance([red, green, blue]: readonly [number, number, number]): number {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function parseHex(value: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(value);
  if (!match) throw new Error(`Expected hex color, got ${value}`);
  const hex = match[1] as string;
  return [Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16)];
}
