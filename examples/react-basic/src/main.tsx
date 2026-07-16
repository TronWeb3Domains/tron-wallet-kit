import { StrictMode, useEffect, useMemo, useState } from "react";
import { createTronAuthenticationAdapter } from "@tron-wallet-kit/auth";
import { createRoot } from "react-dom/client";
import { TronConnectButton, TronKitProvider, getDefaultConfig, useTronKit, useWalletSession, useWalletStatus } from "@tron-wallet-kit/react";
import { createQrDataUrl, createThemeStyleProperties, createTransactionToastContainerHtml, getThemeNames, type ThemeName, type WalletListConfig } from "@tron-wallet-kit/ui";

const walletConnectProjectId = ((import.meta as ImportMeta & { env?: { VITE_WALLETCONNECT_PROJECT_ID?: string } }).env?.VITE_WALLETCONNECT_PROJECT_ID) || "a4109c95d50e5c136cdafaf9fc44c105";
const kitFontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

type ButtonVariant = "default" | "pill" | "minimal";
type AccountPanelMode = "dropdown" | "modal";
type WalletLayout = "list" | "card";
type FeaturedMode = "manual" | "installed-first" | "installed-only";
type FeaturedPreset = "recommended" | "extended" | "max";
type AllWalletsPreset = "all" | "core";

const featuredWalletPresets: Record<FeaturedPreset, string[]> = {
  recommended: ["tronlink", "tokenpocket", "okx", "bitget", "walletconnect"],
  extended: ["tronlink", "tokenpocket", "okx", "bitget", "trust", "binance", "metamask", "gate", "walletconnect"],
  max: ["tronlink", "tokenpocket", "okx", "bitget", "trust", "binance", "walletconnect", "metamask", "gate", "bybit"]
};

const allWalletPresets: Record<AllWalletsPreset, "all" | string[]> = {
  all: "all",
  core: ["tronlink", "tokenpocket", "okx", "bitget", "trust", "walletconnect"]
};

function ExampleApp() {
  const [themeName, setThemeName] = useState<ThemeName>("default");
  const [buttonVariant, setButtonVariant] = useState<ButtonVariant>("pill");
  const [accountPanelMode, setAccountPanelMode] = useState<AccountPanelMode>("modal");
  const [showBalance, setShowBalance] = useState(true);
  const [resolveIdentity, setResolveIdentity] = useState(true);
  const [showRecentTransactions, setShowRecentTransactions] = useState(true);
  const [transactionPreviewEnabled, setTransactionPreviewEnabled] = useState(true);
  const [mockAuthEnabled, setMockAuthEnabled] = useState(false);
  const [walletLayout, setWalletLayout] = useState<WalletLayout>("list");
  const [featuredMode, setFeaturedMode] = useState<FeaturedMode>("installed-first");
  const [featuredPreset, setFeaturedPreset] = useState<FeaturedPreset>("recommended");
  const [allWalletsPreset, setAllWalletsPreset] = useState<AllWalletsPreset>("all");
  const [showUnavailableWallets, setShowUnavailableWallets] = useState(true);
  const walletList = useMemo<WalletListConfig>(() => {
    return {
      layout: walletLayout,
      featuredMode,
      featuredWallets: featuredMode === "manual" ? featuredWalletPresets[featuredPreset] : [],
      wallets: allWalletPresets[allWalletsPreset],
      showUnavailable: showUnavailableWallets,
      sortAvailableFirst: true
    };
  }, [allWalletsPreset, featuredMode, featuredPreset, showUnavailableWallets, walletLayout]);
  const config = useMemo(() => getDefaultConfig({
    metadata: {
      name: "TRON Wallet Kit React Basic",
      description: "Local TRON Wallet Kit React playground.",
      url: typeof window !== "undefined" ? window.location.origin : "https://trxdomains.xyz",
      icons: typeof window !== "undefined" ? [`${window.location.origin}/favicon.ico`] : []
    },
    walletConnectProjectId,
    network: "mainnet",
    walletConnectNetwork: "mainnet",
    identity: {
      enabled: resolveIdentity,
      failSilently: true,
      cacheTtlMs: 10 * 60 * 1000
    },
    ui: {
      themeName,
      toast: true,
      showRecentTransactions,
      walletList,
      modal: { subtitle: "" },
      accountPanel: { mode: accountPanelMode === "modal" ? "modal" : "inline", showRecentTransactions },
      transactionPreview: {
        enabled: transactionPreviewEnabled,
        confirmLabel: "Continue",
        cancelLabel: "Cancel"
      }
    },
    autoReconnect: false,
    storageKey: "react-basic-session-v2",
    useBrowserStorage: true
  }), [accountPanelMode, resolveIdentity, showRecentTransactions, themeName, transactionPreviewEnabled, walletList]);
  const authenticationAdapter = useMemo(
    () =>
      mockAuthEnabled
        ? createTronAuthenticationAdapter({
            getNonce: () => `react-basic-${Date.now()}`,
            verify: async (input) => ({
              ...input,
              valid: Boolean(input.proof),
              ...(!input.proof ? { reason: "Missing wallet signature." } : {})
            })
          })
        : undefined,
    [mockAuthEnabled]
  );
  const authenticationProps = authenticationAdapter
    ? {
        authenticationAdapter,
        authenticationOptions: {
          domain: "React Basic",
          uri: typeof window !== "undefined" ? window.location.origin : "https://trxdomains.xyz",
          statement: "Sign in to the TRON Wallet Kit playground."
        }
      }
    : {};

  return (
    <TronKitProvider
      config={config}
      clearStoredSessionOnAutoReconnectDisabled
      {...authenticationProps}
    >
      <ExampleWorkspace
        accountPanelMode={accountPanelMode}
        buttonVariant={buttonVariant}
        showBalance={showBalance}
        resolveIdentity={resolveIdentity}
        showRecentTransactions={showRecentTransactions}
        transactionPreviewEnabled={transactionPreviewEnabled}
        mockAuthEnabled={mockAuthEnabled}
        walletLayout={walletLayout}
        featuredMode={featuredMode}
        featuredPreset={featuredPreset}
        allWalletsPreset={allWalletsPreset}
        showUnavailableWallets={showUnavailableWallets}
        themeName={themeName}
        onAccountPanelModeChange={setAccountPanelMode}
        onButtonVariantChange={setButtonVariant}
        onShowBalanceChange={setShowBalance}
        onResolveIdentityChange={setResolveIdentity}
        onShowRecentTransactionsChange={setShowRecentTransactions}
        onTransactionPreviewEnabledChange={setTransactionPreviewEnabled}
        onMockAuthEnabledChange={setMockAuthEnabled}
        onWalletLayoutChange={setWalletLayout}
        onFeaturedModeChange={setFeaturedMode}
        onFeaturedPresetChange={setFeaturedPreset}
        onAllWalletsPresetChange={setAllWalletsPreset}
        onShowUnavailableWalletsChange={setShowUnavailableWallets}
        onThemeChange={setThemeName}
      />
    </TronKitProvider>
  );
}

type ExampleWorkspaceProps = {
  accountPanelMode: AccountPanelMode;
  buttonVariant: ButtonVariant;
  showBalance: boolean;
  resolveIdentity: boolean;
  showRecentTransactions: boolean;
  transactionPreviewEnabled: boolean;
  mockAuthEnabled: boolean;
  walletLayout: WalletLayout;
  featuredMode: FeaturedMode;
  featuredPreset: FeaturedPreset;
  allWalletsPreset: AllWalletsPreset;
  showUnavailableWallets: boolean;
  themeName: ThemeName;
  onAccountPanelModeChange: (mode: AccountPanelMode) => void;
  onButtonVariantChange: (variant: ButtonVariant) => void;
  onShowBalanceChange: (showBalance: boolean) => void;
  onResolveIdentityChange: (resolveIdentity: boolean) => void;
  onShowRecentTransactionsChange: (showRecentTransactions: boolean) => void;
  onTransactionPreviewEnabledChange: (enabled: boolean) => void;
  onMockAuthEnabledChange: (enabled: boolean) => void;
  onWalletLayoutChange: (layout: WalletLayout) => void;
  onFeaturedModeChange: (mode: FeaturedMode) => void;
  onFeaturedPresetChange: (preset: FeaturedPreset) => void;
  onAllWalletsPresetChange: (preset: AllWalletsPreset) => void;
  onShowUnavailableWalletsChange: (showUnavailable: boolean) => void;
  onThemeChange: (themeName: ThemeName) => void;
};

function ExampleWorkspace(props: ExampleWorkspaceProps) {
  const kit = useTronKit();
  const session = useWalletSession();
  const status = useWalletStatus();
  const [log, setLog] = useState("Ready.");
  const [walletConnectQr, setWalletConnectQr] = useState<string | undefined>();
  const [walletConnectUri, setWalletConnectUri] = useState("");
  const [toastHtml, setToastHtml] = useState("");
  const [gateDiagnostics, setGateDiagnostics] = useState("");
  const [trxRecipient, setTrxRecipient] = useState("");
  const [trxAmountSun, setTrxAmountSun] = useState("1000000");
  const [contractAddress, setContractAddress] = useState("");
  const [contractFunction, setContractFunction] = useState("buyDomain(string,string)");
  const [contractOptions, setContractOptions] = useState('{"feeLimit":100000000}');
  const [contractParameters, setContractParameters] = useState('[{"type":"string","value":"alice"},{"type":"string","value":"trx"}]');
  const kitThemeStyle = useMemo(() => {
    const properties = createThemeStyleProperties({ themeName: props.themeName });
    const { "color-scheme": colorScheme, ...variables } = properties;
    return {
      ...variables,
      "--example-font-family": variables["--twk-font-family"] ?? kitFontFamily,
      colorScheme: colorScheme ?? "light"
    };
  }, [props.themeName]);

  useEffect(() => {
    let cancelled = false;
    if (!walletConnectUri) {
      setWalletConnectQr(undefined);
      return () => {
        cancelled = true;
      };
    }

    void createQrDataUrl(walletConnectUri).then((dataUrl) => {
      if (!cancelled) setWalletConnectQr(dataUrl);
    });

    return () => {
      cancelled = true;
    };
  }, [walletConnectUri]);

  useEffect(() => {
    return kit.manager.on("qr", ({ adapterId, uri }) => {
      if (adapterId === "walletconnect") setWalletConnectUri(uri);
    });
  }, [kit]);

  useEffect(() => {
    const refresh = () => setGateDiagnostics(JSON.stringify(readGateDiagnostics(), null, 2));
    refresh();
    const interval = window.setInterval(refresh, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const signMessage = async () => {
    try {
      const result = await kit.signMessage("Hello from TRON Wallet Kit");
      setLog(`Signature:\n${result.proof ?? result.signature ?? result.txBlob ?? ""}`);
    } catch (error) {
      setLog(formatError(error));
    }
  };

  const buildTrxTransfer = async () => {
    try {
      const transaction = await kit.transactionBuilder.sendTrx(trxRecipient, trxAmountSun, session?.account.address);
      setLog(formatJson({ action: "transactionBuilder.sendTrx", transaction }));
    } catch (error) {
      setLog(formatError(error));
    }
  };

  const signAndSendTrx = async () => {
    try {
      const result = await kit.transferTrx({
        to: trxRecipient,
        amountSun: trxAmountSun,
        description: `Send ${trxAmountSun} SUN`
      });
      setLog(formatJson({ action: "transferTrx", result }));
    } catch (error) {
      setLog(formatError(error));
    }
  };

  const buildSmartContract = async () => {
    try {
      const request = readSmartContractRequest(contractAddress, contractFunction, contractOptions, contractParameters, session?.account.address);
      const transaction = await kit.transactionBuilder.triggerSmartContract(request);
      setLog(formatJson({ action: "transactionBuilder.triggerSmartContract", transaction }));
    } catch (error) {
      setLog(formatError(error));
    }
  };

  const signAndSendSmartContract = async () => {
    try {
      const request = readSmartContractRequest(contractAddress, contractFunction, contractOptions, contractParameters, session?.account.address);
      const result = await kit.triggerSmartContract({
        ...request,
        description: `Trigger ${contractFunction}`
      });
      setLog(formatJson({ action: "triggerSmartContract", result }));
    } catch (error) {
      setLog(formatError(error));
    }
  };

  const addMockTransaction = () => {
    if (!session) {
      setLog("Connect a wallet before adding a mock transaction.");
      return;
    }
    const hash = `mock-${Date.now()}`;
    const transaction = kit.manager.addTransaction({
      hash,
      status: "submitted",
      methodHint: "transferTrx",
      description: "Mock TRX transaction"
    });
    setToastHtml(
      createTransactionToastContainerHtml([
        {
          id: transaction.id,
          label: "Mock transaction submitted",
          status: "pending",
          txHash: hash
        }
      ])
    );
  };

  const openConnect = () => kit.openModal();
  const disconnect = async () => {
    await kit.disconnect();
    setLog("Disconnected.");
  };

  const sessionSummary = session
    ? {
        wallet: session.walletName,
        address: session.account.address,
        identity: session.account.domain ?? session.account.displayName ?? "not resolved",
        network: session.network.name,
        balance: session.balance?.formatted ?? "loading"
      }
    : null;

  return (
    <main className="shell react-basic" style={kitThemeStyle}>
      <section className="workspace react-workspace">
        <header className="topbar">
          <div>
            <h1>React Basic</h1>
            <p>TRON Wallet Kit playground</p>
          </div>
          <span className={`status-pill ${status === "connected" ? "is-connected" : ""}`}>{status}</span>
          <a className="button secondary" href="/">
            Examples
          </a>
        </header>

        <div className="react-dashboard">
          <section className="panel kit-panel">
            <div className="section-heading">
              <span>Kit</span>
              <small>TRON mainnet</small>
            </div>
            <div className="kit-connect">
              <TronConnectButton
                accountPanelMode={props.accountPanelMode}
                showBalance={props.showBalance}
                showRecentTransactions={props.showRecentTransactions}
                theme={{ themeName: props.themeName }}
                variant={props.buttonVariant}
              />
              <div className="row">
                <button className="button secondary" type="button" onClick={openConnect}>
                  Open modal
                </button>
                <button className="button secondary" type="button" disabled={status !== "connected"} onClick={disconnect}>
                  Disconnect
                </button>
              </div>
            </div>
            <div className="metric-list">
              <div>
                <span>Wallet</span>
                <strong>{sessionSummary?.wallet ?? "Not connected"}</strong>
              </div>
              <div>
                <span>Address</span>
                <strong>{sessionSummary?.address ?? "No account"}</strong>
              </div>
              <div>
                <span>Identity</span>
                <strong>{sessionSummary?.identity ?? "No domain"}</strong>
              </div>
              <div>
                <span>Balance</span>
                <strong>{sessionSummary?.balance ?? "0 TRX"}</strong>
              </div>
            </div>
            {walletConnectQr ? (
              <div className="qr-row">
                <div className="qr-preview compact">
                  <img src={walletConnectQr} alt="WalletConnect QR" />
                </div>
                <label className="field">
                  <span>WalletConnect URI</span>
                  <textarea className="textarea compact" readOnly value={walletConnectUri} />
                </label>
              </div>
            ) : null}
          </section>

          <section className="panel config-panel">
            <div className="section-heading">
              <span>Configuration</span>
              <small>Default theme first</small>
            </div>
            <div className="config-grid">
              <label className="field">
                <span>Theme</span>
                <select aria-label="Theme" className="select" value={props.themeName} onChange={(event) => props.onThemeChange(event.target.value as ThemeName)}>
                  {getThemeNames().map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Button variant</span>
                <select aria-label="Button variant" className="select" value={props.buttonVariant} onChange={(event) => props.onButtonVariantChange(event.target.value as ButtonVariant)}>
                  <option value="pill">pill</option>
                  <option value="default">default</option>
                  <option value="minimal">minimal</option>
                </select>
              </label>
              <label className="field">
                <span>Account panel</span>
                <select aria-label="Account panel" className="select" value={props.accountPanelMode} onChange={(event) => props.onAccountPanelModeChange(event.target.value as AccountPanelMode)}>
                  <option value="modal">modal</option>
                  <option value="dropdown">dropdown</option>
                </select>
              </label>
              <label className="field">
                <span>Wallet layout</span>
                <select aria-label="Wallet layout" className="select" value={props.walletLayout} onChange={(event) => props.onWalletLayoutChange(event.target.value as WalletLayout)}>
                  <option value="list">list</option>
                  <option value="card">card</option>
                </select>
              </label>
              <label className="field">
                <span>Featured mode</span>
                <select aria-label="Featured mode" className="select" value={props.featuredMode} onChange={(event) => props.onFeaturedModeChange(event.target.value as FeaturedMode)}>
                  <option value="installed-first">installed-first</option>
                  <option value="installed-only">installed-only</option>
                  <option value="manual">manual</option>
                </select>
              </label>
              <label className="field">
                <span>Manual featured</span>
                <select aria-label="Featured wallets" className="select" value={props.featuredPreset} onChange={(event) => props.onFeaturedPresetChange(event.target.value as FeaturedPreset)}>
                  <option value="recommended">5 recommended</option>
                  <option value="extended">9 manual</option>
                  <option value="max">10 manual max</option>
                </select>
              </label>
              <label className="field">
                <span>All wallets</span>
                <select aria-label="All wallets preset" className="select" value={props.allWalletsPreset} onChange={(event) => props.onAllWalletsPresetChange(event.target.value as AllWalletsPreset)}>
                  <option value="all">all enabled</option>
                  <option value="core">core only</option>
                </select>
              </label>
            </div>
            <div className="toggle-list">
              <label>
                <input aria-label="Show balance on button" type="checkbox" checked={props.showBalance} onChange={(event) => props.onShowBalanceChange(event.target.checked)} />
                <span>Show balance on button</span>
              </label>
              <label>
                <input aria-label="Resolve TRX Domains" type="checkbox" checked={props.resolveIdentity} onChange={(event) => props.onResolveIdentityChange(event.target.checked)} />
                <span>Resolve TRX Domains</span>
              </label>
              <label>
                <input aria-label="Show recent transactions" type="checkbox" checked={props.showRecentTransactions} onChange={(event) => props.onShowRecentTransactionsChange(event.target.checked)} />
                <span>Show recent transactions</span>
              </label>
              <label>
                <input aria-label="Transaction preview confirmation" type="checkbox" checked={props.transactionPreviewEnabled} onChange={(event) => props.onTransactionPreviewEnabledChange(event.target.checked)} />
                <span>Transaction preview confirmation</span>
              </label>
              <label>
                <input aria-label="Mock SIWT authentication" type="checkbox" checked={props.mockAuthEnabled} onChange={(event) => props.onMockAuthEnabledChange(event.target.checked)} />
                <span>Mock SIWT authentication</span>
              </label>
              <label>
                <input aria-label="Show unavailable wallets" type="checkbox" checked={props.showUnavailableWallets} onChange={(event) => props.onShowUnavailableWalletsChange(event.target.checked)} />
                <span>Show unavailable wallets</span>
              </label>
            </div>
          </section>

          <section className="panel task-panel">
            <div className="section-heading">
              <span>Tasks</span>
              <small>Wallet actions</small>
            </div>
            <div className="task-list">
              <button className="button" type="button" disabled={status !== "connected"} onClick={signMessage}>
                Sign message
              </button>
              <button className="button secondary" type="button" onClick={addMockTransaction}>
                Add mock tx
              </button>
            </div>
          </section>

          <section className="panel task-panel">
            <div className="section-heading">
              <span>Transactions</span>
              <small>Build, sign, broadcast</small>
            </div>
            <div className="config-grid">
              <label className="field">
                <span>TRX recipient</span>
                <input className="input" value={trxRecipient} onChange={(event) => setTrxRecipient(event.target.value)} placeholder="T..." />
              </label>
              <label className="field">
                <span>Amount SUN</span>
                <input className="input" value={trxAmountSun} onChange={(event) => setTrxAmountSun(event.target.value)} inputMode="numeric" />
              </label>
            </div>
            <div className="task-list">
              <button className="button secondary" type="button" disabled={status !== "connected" || !trxRecipient} onClick={buildTrxTransfer}>
                Build TRX tx
              </button>
              <button className="button" type="button" disabled={status !== "connected" || !trxRecipient} onClick={signAndSendTrx}>
                Sign and send TRX
              </button>
            </div>
            <div className="config-grid">
              <label className="field">
                <span>Contract address</span>
                <input className="input" value={contractAddress} onChange={(event) => setContractAddress(event.target.value)} placeholder="T..." />
              </label>
              <label className="field">
                <span>Function selector</span>
                <input className="input" value={contractFunction} onChange={(event) => setContractFunction(event.target.value)} />
              </label>
              <label className="field">
                <span>Options JSON</span>
                <textarea className="textarea compact" value={contractOptions} onChange={(event) => setContractOptions(event.target.value)} />
              </label>
              <label className="field">
                <span>Parameters JSON</span>
                <textarea className="textarea compact" value={contractParameters} onChange={(event) => setContractParameters(event.target.value)} />
              </label>
            </div>
            <div className="task-list">
              <button className="button secondary" type="button" disabled={status !== "connected" || !contractAddress} onClick={buildSmartContract}>
                Build contract tx
              </button>
              <button className="button" type="button" disabled={status !== "connected" || !contractAddress} onClick={signAndSendSmartContract}>
                Sign and execute
              </button>
            </div>
          </section>

          <section className="panel log-panel">
            <div className="section-heading">
              <span>Log</span>
              <small>{session ? session.account.address : "No session"}</small>
            </div>
            <pre className="log">{log}</pre>
            <pre className="log session-log">{JSON.stringify({ status, session: sessionSummary }, null, 2)}</pre>
          </section>

          <section className="panel log-panel">
            <div className="section-heading">
              <span>Gate diagnostics</span>
              <small>Injected markers</small>
            </div>
            <pre className="log session-log">{gateDiagnostics}</pre>
          </section>
        </div>
      </section>

      {toastHtml ? <div className="twk-root" data-twk-root="true" style={kitThemeStyle} dangerouslySetInnerHTML={{ __html: toastHtml }} /> : null}
    </main>
  );
}

function formatError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function readSmartContractRequest(contractAddress: string, functionSelector: string, optionsJson: string, parametersJson: string, issuerAddress: string | undefined) {
  return {
    contractAddress,
    functionSelector,
    options: parseJsonObject(optionsJson),
    parameters: parseJsonArray(parametersJson),
    ...(issuerAddress ? { issuerAddress } : {})
  };
}

function parseJsonObject(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value || "{}");
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Options JSON must be an object.");
  return parsed as Record<string, unknown>;
}

function parseJsonArray(value: string): unknown[] {
  const parsed = JSON.parse(value || "[]");
  if (!Array.isArray(parsed)) throw new Error("Parameters JSON must be an array.");
  return parsed;
}

function readGateDiagnostics() {
  const source = window as typeof window & {
    gatewallet?: unknown;
    gateWallet?: unknown;
    GateWallet?: unknown;
    ethereum?: {
      isGateWallet?: unknown;
      isGate?: unknown;
      providers?: Array<Record<string, unknown>>;
      info?: unknown;
      providerInfo?: unknown;
    };
  };
  return {
    gatewallet: summarizeGateObject(source.gatewallet),
    gateWallet: summarizeGateObject(source.gateWallet),
    GateWallet: summarizeGateObject(source.GateWallet),
    ethereum: source.ethereum
      ? {
          isGateWallet: source.ethereum.isGateWallet,
          isGate: source.ethereum.isGate,
          info: source.ethereum.info,
          providerInfo: source.ethereum.providerInfo,
          providers: source.ethereum.providers?.map((provider) => ({
            isGateWallet: provider.isGateWallet,
            isGate: provider.isGate,
            info: provider.info,
            providerInfo: provider.providerInfo,
            keys: Object.keys(provider).slice(0, 20)
          }))
        }
      : undefined
  };
}

function summarizeGateObject(value: unknown) {
  if (!value || typeof value !== "object") return value ?? null;
  const record = value as Record<string, unknown>;
  return {
    keys: Object.keys(record).slice(0, 30),
    hasTron: Boolean(record.tron),
    hasTronLink: Boolean(record.tronLink),
    hasTronWeb: Boolean(record.tronWeb),
    hasRequest: typeof record.request === "function",
    tronKeys: summarizeObjectKeys(record.tron),
    tronLinkKeys: summarizeObjectKeys(record.tronLink),
    tronWebKeys: summarizeObjectKeys(record.tronWeb)
  };
}

function summarizeObjectKeys(value: unknown) {
  return value && typeof value === "object" ? Object.keys(value as Record<string, unknown>).slice(0, 20) : [];
}

const rootElement = document.getElementById("root") as HTMLElement & {
  __tronWalletKitRoot?: ReturnType<typeof createRoot>;
};
const root = rootElement.__tronWalletKitRoot ?? createRoot(rootElement);
rootElement.__tronWalletKitRoot = root;

root.render(
  <StrictMode>
    <ExampleApp />
  </StrictMode>
);
