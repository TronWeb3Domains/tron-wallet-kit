import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createWalletKit } from "@tron-wallet-kit/client";
import type { WalletAdapter } from "@tron-wallet-kit/core";
import { AccountPanel, ConnectModal, TronWalletProvider, WalletButton } from "../src/index";

describe("React wallet surfaces", () => {
  it("renders the connect modal from registered adapters", () => {
    const kit = createWalletKit({ adapters: [createMockAdapter()] });
    const html = renderToStaticMarkup(
      createElement(TronWalletProvider, { kit }, createElement(ConnectModal, { theme: { themeName: "tron" } }))
    );

    expect(html).toContain("twk-root");
    expect(html).toContain("--twk-accent");
    expect(html).toContain("TronLink");
    expect(html).toContain("Connect Wallet");
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
    expect(html).toContain("Send TRX");
  });
});

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
      return { account: { address: "TXYZabcdefghijklmnopqrstuvwxyz123456789" } };
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
