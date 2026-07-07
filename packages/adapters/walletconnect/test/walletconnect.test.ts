import { describe, expect, it } from "vitest";
import { createWalletConnectAdapter, type WalletConnectWalletLike } from "../src/index";

function createMockWallet(overrides: Partial<WalletConnectWalletLike> = {}) {
  const calls = {
    disconnect: 0,
    onUri: ""
  };

  const wallet: WalletConnectWalletLike & { calls: typeof calls } = {
    calls,
    connect: async (options) => {
      if (options?.onUri) {
        options.onUri("wc:mock");
        calls.onUri = "wc:mock";
      }
      return { address: "TWalletConnect" };
    },
    disconnect: async () => {
      calls.disconnect += 1;
    },
    signMessage: async (message) => `signed:${message}`,
    signTransaction: async <TTransaction extends Record<string, unknown>>(transaction: TTransaction) => ({
      ...transaction,
      signature: ["wc-signature"]
    }),
    sendTrx: async () => ({ txHash: "wc-tx" }),
    ...overrides
  };

  return wallet;
}

describe("WalletConnectAdapter", () => {
  it("requires projectId and exposes object capabilities", () => {
    const adapter = createWalletConnectAdapter();

    expect(adapter.isAvailable()).toBe(false);
    expect(adapter.metadata.icon).toMatch(/^data:image\/svg\+xml,/);
    expect(adapter.metadata.homepage).toBe("https://walletconnect.com/");
    expect(adapter.metadata.type).toBe("walletconnect");
    expect(adapter.capabilities.qr).toBe(true);
    expect(createWalletConnectAdapter({ projectId: "project" }).isAvailable()).toBe(true);
  });

  it("connects with custom URI callback and resolves network", async () => {
    const wallet = createMockWallet();
    const adapter = createWalletConnectAdapter({
      projectId: "project",
      network: "mainnet",
      walletFactory: () => wallet
    });

    const result = await adapter.connect();
    expect(result.account.address).toBe("TWalletConnect");
    expect(wallet.calls.onUri).toBe("");
    expect(result.network).toMatchObject({
      id: "mainnet",
      networkType: "MAINNET",
      walletConnectChainId: "tron:0x2b6653dc"
    });

    await adapter.disconnect();
    expect(wallet.calls.disconnect).toBe(1);
  });

  it("passes onUri from connect options", async () => {
    const wallet = createMockWallet();
    const adapter = createWalletConnectAdapter({
      projectId: "project",
      walletFactory: () => wallet
    });

    const uris: string[] = [];
    await adapter.connect({ onUri: (uri) => uris.push(uri) });
    expect(uris).toEqual(["wc:mock"]);
  });

  it("calls both configured and per-connect URI callbacks", async () => {
    const wallet = createMockWallet();
    const configuredUris: string[] = [];
    const connectUris: string[] = [];
    const adapter = createWalletConnectAdapter({
      projectId: "project",
      onUri: (uri) => configuredUris.push(uri),
      walletFactory: () => wallet
    });

    await adapter.connect({ onUri: (uri) => connectUris.push(uri) });

    expect(configuredUris).toEqual(["wc:mock"]);
    expect(connectUris).toEqual(["wc:mock"]);
  });

  it("signs messages and transactions", async () => {
    const adapter = createWalletConnectAdapter({
      projectId: "project",
      walletFactory: () => createMockWallet()
    });

    await adapter.connect();
    await expect(adapter.signMessage({ message: "hello" })).resolves.toMatchObject({
      signatureKind: "signature",
      proof: "signed:hello"
    });
    await expect(adapter.signTransaction({ transaction: { txID: "tx" } })).resolves.toMatchObject({
      transaction: { txID: "tx", signature: ["wc-signature"] },
      signature: "wc-signature",
      signed: true
    });
  });

  it("supports direct transferTrx submit when wallet implementation provides it", async () => {
    const adapter = createWalletConnectAdapter({
      projectId: "project",
      walletFactory: () => createMockWallet()
    });

    await adapter.connect();
    await expect(
      adapter.submitTransaction({ methodHint: "transferTrx", transaction: { to: "TReceiver", amountSun: 1n } })
    ).resolves.toMatchObject({
      hash: "wc-tx",
      status: "submitted"
    });
  });

  it("cleans up half-open sessions when connect fails", async () => {
    const wallet = createMockWallet({
      connect: async () => {
        throw new Error("User closed the connection modal");
      }
    });

    const adapter = createWalletConnectAdapter({
      projectId: "project",
      walletFactory: () => wallet
    });

    await expect(adapter.connect()).rejects.toMatchObject({ code: "USER_REJECTED" });
    expect(wallet.calls.disconnect).toBe(1);
  });
});
