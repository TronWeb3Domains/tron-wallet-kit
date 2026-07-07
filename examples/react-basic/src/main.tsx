import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { TronWalletProvider, WalletButton, useWalletKit, useWalletSession, useWalletStatus } from "@tron-wallet-kit/react";
import { createQrDataUrl, createThemeStyleProperties, createTransactionToastContainerHtml, getThemeNames, type ThemeName } from "@tron-wallet-kit/ui";

const walletConnectProjectId = "a4109c95d50e5c136cdafaf9fc44c105";
const kitFontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

type ButtonVariant = "default" | "pill" | "minimal";
type AccountPanelMode = "dropdown" | "modal";

function ExampleApp() {
  const [themeName, setThemeName] = useState<ThemeName>("default");
  const [buttonVariant, setButtonVariant] = useState<ButtonVariant>("pill");
  const [accountPanelMode, setAccountPanelMode] = useState<AccountPanelMode>("modal");
  const [showBalance, setShowBalance] = useState(true);
  const [showRecentTransactions, setShowRecentTransactions] = useState(true);
  const [walletConnectUri, setWalletConnectUri] = useState("");

  return (
    <TronWalletProvider
      walletConnectProjectId={walletConnectProjectId}
      network="mainnet"
      walletConnectNetwork="mainnet"
      onWalletConnectUri={setWalletConnectUri}
      ui={{
        themeName,
        toast: true,
        showRecentTransactions,
        modal: { subtitle: "" },
        accountPanel: { mode: accountPanelMode === "modal" ? "modal" : "inline", showRecentTransactions }
      }}
      useBrowserStorage
    >
      <ExampleWorkspace
        accountPanelMode={accountPanelMode}
        buttonVariant={buttonVariant}
        showBalance={showBalance}
        showRecentTransactions={showRecentTransactions}
        themeName={themeName}
        walletConnectUri={walletConnectUri}
        onAccountPanelModeChange={setAccountPanelMode}
        onButtonVariantChange={setButtonVariant}
        onShowBalanceChange={setShowBalance}
        onShowRecentTransactionsChange={setShowRecentTransactions}
        onThemeChange={setThemeName}
      />
    </TronWalletProvider>
  );
}

type ExampleWorkspaceProps = {
  accountPanelMode: AccountPanelMode;
  buttonVariant: ButtonVariant;
  showBalance: boolean;
  showRecentTransactions: boolean;
  themeName: ThemeName;
  walletConnectUri: string;
  onAccountPanelModeChange: (mode: AccountPanelMode) => void;
  onButtonVariantChange: (variant: ButtonVariant) => void;
  onShowBalanceChange: (showBalance: boolean) => void;
  onShowRecentTransactionsChange: (showRecentTransactions: boolean) => void;
  onThemeChange: (themeName: ThemeName) => void;
};

function ExampleWorkspace(props: ExampleWorkspaceProps) {
  const kit = useWalletKit();
  const session = useWalletSession();
  const status = useWalletStatus();
  const [log, setLog] = useState("Ready.");
  const [walletConnectQr, setWalletConnectQr] = useState<string | undefined>();
  const [toastHtml, setToastHtml] = useState("");
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
    if (!props.walletConnectUri) {
      setWalletConnectQr(undefined);
      return () => {
        cancelled = true;
      };
    }

    void createQrDataUrl(props.walletConnectUri).then((dataUrl) => {
      if (!cancelled) setWalletConnectQr(dataUrl);
    });

    return () => {
      cancelled = true;
    };
  }, [props.walletConnectUri]);

  const signMessage = async () => {
    try {
      const result = await kit.signMessage("Hello from TRON Wallet Kit");
      setLog(`Signature:\n${result.proof ?? result.signature ?? result.txBlob ?? ""}`);
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
              <WalletButton
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
                  <textarea className="textarea compact" readOnly value={props.walletConnectUri} />
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
            </div>
            <div className="toggle-list">
              <label>
                <input aria-label="Show balance on button" type="checkbox" checked={props.showBalance} onChange={(event) => props.onShowBalanceChange(event.target.checked)} />
                <span>Show balance on button</span>
              </label>
              <label>
                <input aria-label="Show recent transactions" type="checkbox" checked={props.showRecentTransactions} onChange={(event) => props.onShowRecentTransactionsChange(event.target.checked)} />
                <span>Show recent transactions</span>
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

          <section className="panel log-panel">
            <div className="section-heading">
              <span>Log</span>
              <small>{session ? session.account.address : "No session"}</small>
            </div>
            <pre className="log">{log}</pre>
            <pre className="log session-log">{JSON.stringify({ status, session: sessionSummary }, null, 2)}</pre>
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
