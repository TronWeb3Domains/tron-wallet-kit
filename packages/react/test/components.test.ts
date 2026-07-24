import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { TronAuthAdapter } from "@tron-wallet-kit/auth";
import { createWalletKit } from "@tron-wallet-kit/client";
import type { WalletAdapter } from "@tron-wallet-kit/core";
import { createThemeStyleProperties } from "@tron-wallet-kit/ui";
import {
  AccountPanel,
  ConnectModal,
  TronConnectButton,
  TronKitProvider,
  TronWalletProvider,
  WalletButton,
  darkTheme,
  getDefaultConfig,
  lightTheme,
  useAccountModal,
  useConnectModal,
  useSignMessage,
  useTronAccount,
  useTronBalance,
  useTronConnect,
  useTronDisconnect,
  useTronAuth,
  useTrxName
} from "../src/index";

describe("React wallet surfaces", () => {
  it("creates a ConnectKit-style default config without requiring WalletConnect", () => {
    const config = getDefaultConfig({ appName: "TRON dApp", network: "mainnet" });

    expect(config.appName).toBe("TRON dApp");
    expect(config.network).toBe("mainnet");
    expect(config.walletConnectProjectId).toBeUndefined();
    expect(config.ui?.accountPanel?.mode).toBe("modal");
    expect(config.ui?.walletList?.featuredMode).toBe("installed-first");
  });

  it("renders the ConnectKit-style provider and button API", () => {
    const kit = createWalletKit({ adapters: [createMockAdapter()], wallets: [] });
    const html = renderToStaticMarkup(
      createElement(
        TronKitProvider,
        { kit, config: getDefaultConfig({ appName: "TRON dApp" }), theme: lightTheme() },
        createElement(TronConnectButton, { accountStatus: "full", chainStatus: "none" })
      )
    );

    expect(html).toContain("twk-connect-button");
    expect(html).toContain("Connect Wallet");
    expect(darkTheme().themeName).toBe("dark");
  });

  it("supports adaptive provider themes and theme factory shortcuts", () => {
    const kit = createWalletKit({ adapters: [createMockAdapter()] });
    const theme = {
      light: lightTheme({ accentColor: "#0988f0", accentColorForeground: "#ffffff", borderRadius: "medium" }),
      dark: darkTheme({ accentColor: "#00e5a8", fontStack: "rounded" })
    };
    const html = renderToStaticMarkup(
      createElement(
        TronKitProvider,
        { kit, config: getDefaultConfig({ appName: "TRON dApp" }), theme },
        createElement(TronConnectButton, null)
      )
    );

    expect(html).toContain("--twk-accent:#0988f0");
    expect(html).toContain("--twk-accent-text:#ffffff");
    expect(html).toContain("--twk-radius:16px");
  });

  it("generates stable token maps from theme factories", () => {
    expect(createThemeStyleProperties(lightTheme({
      accentColor: "#0988f0",
      accentColorForeground: "#ffffff",
      borderRadius: "large",
      fontStack: "system"
    }))).toMatchObject({
      "--twk-accent": "#0988f0",
      "--twk-accent-text": "#ffffff",
      "--twk-focus-ring": "#0988f0",
      "--twk-radius": "24px",
      "--twk-wallet-radius": "18px",
      "--twk-wallet-icon-radius": "14px",
      "color-scheme": "light"
    });
    expect(createThemeStyleProperties(darkTheme({
      accentColor: "#00e5a8",
      borderRadius: "none",
      tokens: { surface: "#010101" }
    }))).toMatchObject({
      "--twk-accent": "#00e5a8",
      "--twk-focus-ring": "#00e5a8",
      "--twk-radius": "0px",
      "--twk-surface": "#010101",
      "color-scheme": "dark"
    });
  });

  it("supports a fully custom hook-driven wallet UI", async () => {
    const kit = createWalletKit({ adapters: [createMockAdapter()], wallets: [] });
    await kit.manager.connect("tronlink");

    const connectedHtml = renderToStaticMarkup(
      createElement(
        TronKitProvider,
        { kit, config: getDefaultConfig({ appName: "TRON dApp" }) },
        createElement(CustomHookWalletUi)
      )
    );

    expect(connectedHtml).toContain('data-status="connected"');
    expect(connectedHtml).toContain("TXYZabcdefghijklmnopqrstuvwxyz123456789");
    expect(connectedHtml).toContain("alice.trx");
    expect(connectedHtml).toContain("12.5");
    expect(connectedHtml).toContain("wallets:1");
    expect(connectedHtml).toContain("connectModal:function");
    expect(connectedHtml).toContain("accountModal:function");
    expect(connectedHtml).toContain("disconnect:function");
    expect(connectedHtml).toContain("sign:false");

    await kit.disconnect();
    const disconnectedHtml = renderToStaticMarkup(
      createElement(
        TronKitProvider,
        { kit, config: getDefaultConfig({ appName: "TRON dApp" }) },
        createElement(CustomHookWalletUi)
      )
    );

    expect(disconnectedHtml).toContain('data-status="disconnected"');
    expect(disconnectedHtml).toContain("no-address");
  });

  it("renders the connect modal from registered adapters", () => {
    const kit = createWalletKit({ adapters: [createMockAdapter()] });
    const html = renderToStaticMarkup(
      createElement(TronWalletProvider, { kit }, createElement(ConnectModal, { theme: { themeName: "tron" } }))
    );

    expect(html).toContain("twk-root");
    expect(html).toContain("--twk-accent");
    expect(html).toContain("TronLink");
    expect(html).toContain("Connect Wallet");
    expect(html).toContain("data:image/svg+xml;base64,");
  });

  it("renders the wallet button from the shared UI kit renderer", () => {
    const kit = createWalletKit({ adapters: [createMockAdapter()] });
    const html = renderToStaticMarkup(
      createElement(TronWalletProvider, { kit }, createElement(WalletButton, { theme: { themeName: "tron" }, variant: "pill" }))
    );

    expect(html).toContain("twk-connect-button");
    expect(html).toContain("Connect Wallet");
    expect(html).toContain('data-variant="pill"');
    expect(html).toContain("--twk-accent");
  });

  it("keeps the connected account chevron visible even when chain status is hidden", async () => {
    const kit = createWalletKit({ adapters: [createMockAdapter()], wallets: [] });
    await kit.manager.connect("tronlink");
    const html = renderToStaticMarkup(
      createElement(
        TronKitProvider,
        { kit, config: getDefaultConfig({ appName: "TRON dApp" }) },
        createElement(TronConnectButton, { accountStatus: "full", chainStatus: "none" })
      )
    );

    expect(html).toContain("twk-button-chevron");
    expect(html).toContain("Alice");
    expect(html).toContain("12.5 TRX");
  });

  it("renders SIWT auth prompt only when authentication is configured", async () => {
    const kit = createWalletKit({ adapters: [createMockAdapter()], wallets: [] });
    await kit.manager.connect("tronlink");
    const authAdapter: TronAuthAdapter = {
      getNonce: () => "nonce",
      verify: async (input) => ({
        ...input,
        valid: true
      })
    };

    const withoutAuth = renderToStaticMarkup(
      createElement(
        TronKitProvider,
        { kit, config: getDefaultConfig({ appName: "TRON dApp" }) },
        createElement(TronConnectButton, null)
      )
    );
    const withAuth = renderToStaticMarkup(
      createElement(
        TronKitProvider,
        { kit, config: getDefaultConfig({ appName: "TRON dApp" }), authenticationAdapter: authAdapter },
        createElement(AuthStatusProbe)
      )
    );

    expect(withoutAuth).not.toContain("Sign in with TRON");
    expect(withAuth).toContain("Sign in with TRON");
    expect(withAuth).toContain("auth:unauthenticated:true");
  });


  it("renders the account panel with copy, QR, and recent transaction data", () => {
    const kit = createWalletKit();
    const html = renderToStaticMarkup(
      createElement(
        TronWalletProvider,
        { kit },
        createElement(AccountPanel, {
          account: {
            address: "TXYZabcdefghijklmnopqrstuvwxyz123456789",
            domain: "alice.trx"
          },
          balanceTrx: "88.5",
          networkName: "nile",
          addressQr: {
            src: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E"
          },
          recentTransactions: [
            {
              id: "tx-1",
              label: "Send TRX",
              kind: "sent",
              amountText: "-1 TRX",
              subtitle: "To TReceiver...2Zp9",
              status: "success",
              txHash: "abcdef1234567890abcdef1234567890abcdef12"
            }
          ]
        })
      )
    );

    expect(html).toContain("alice.trx");
    expect(html).toContain("88.5 TRX");
    expect(html).not.toContain("nile");
    expect(html).toContain("twk-qr-slot");
    expect(html).toContain("Sent");
    expect(html).toContain("-1 TRX");
    expect(html).toContain("To TReceiver...2Zp9");
  });
});

function CustomHookWalletUi() {
  const account = useTronAccount();
  const balance = useTronBalance();
  const trxName = useTrxName();
  const connect = useTronConnect();
  const disconnect = useTronDisconnect();
  const signer = useSignMessage();
  const connectModal = useConnectModal();
  const accountModal = useAccountModal();

  return createElement(
    "output",
    { "data-status": account.status },
    [
      account.address ?? "no-address",
      trxName.name ?? "no-name",
      balance.balance?.formatted ?? "no-balance",
      `wallets:${connect.wallets.length}`,
      `connectModal:${typeof connectModal.openConnectModal}`,
      `accountModal:${typeof accountModal.openAccountModal}`,
      `disconnect:${typeof disconnect.disconnect}`,
      `sign:${signer.isPending}`
    ].join("|")
  );
}

function AuthStatusProbe() {
  const auth = useTronAuth();
  return createElement("output", null, `auth:${auth.status}:${auth.isAvailable}`);
}

function createMockAdapter(): WalletAdapter {
  return {
    metadata: {
      id: "tronlink",
      name: "TronLink"
    },
    capabilities: {
      connect: true,
      disconnect: true,
      signMessage: true,
      signTransaction: true
    },
    async connect() {
      return {
        account: {
          address: "TXYZabcdefghijklmnopqrstuvwxyz123456789",
          domain: "alice.trx",
          displayName: "Alice"
        },
        session: {
          balance: {
            value: "12500000",
            formatted: "12.5",
            symbol: "TRX"
          }
        }
      };
    },
    async disconnect() {
      return undefined;
    },
    async signMessage({ message }) {
      return { signatureKind: "signature", signature: `signed:${message}`, proof: `signed:${message}` };
    },
    async signTransaction({ transaction }) {
      return { transaction, signed: true };
    }
  };
}
