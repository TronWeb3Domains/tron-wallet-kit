import { afterEach, describe, expect, it } from "vitest";
import { TRON_NILE, type WalletAdapter } from "@tron-wallet-kit/core";
import { createInjectedTronAdapter, createTronWeb3AdapterBridge, createWalletClient, createWalletKit } from "../src/index";

function createMockAdapter(id = "mock"): WalletAdapter {
  return {
    metadata: {
      id,
      name: "Mock Wallet"
    },
    capabilities: {
      connect: true,
      disconnect: true,
      signMessage: true,
      signTransaction: true,
      submitTransaction: true,
      transferTrx: true
    },
    connect: async () => ({
      account: { address: "TMockAddress", network: TRON_NILE },
      network: TRON_NILE
    }),
    disconnect: async () => undefined,
    signMessage: async ({ message }) => ({
      signatureKind: "signature",
      signature: `signed:${message}`,
      proof: `signed:${message}`
    }),
    signTransaction: async ({ transaction }) => ({
      transaction,
      signedTransaction: transaction,
      signed: true
    }),
    submitTransaction: async ({ methodHint }) => ({
      hash: methodHint === "transferTrx" ? "trx-hash" : "generic-hash",
      status: "submitted"
    })
  };
}

describe("client entrypoints", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).tokenpocket;
    delete (globalThis as Record<string, unknown>).okxwallet;
    delete (globalThis as Record<string, unknown>).bitkeep;
    delete (globalThis as Record<string, unknown>).ethereum;
    delete (globalThis as Record<string, unknown>).gatewallet;
    delete (globalThis as Record<string, unknown>).bybitWallet;
    delete (globalThis as Record<string, unknown>).binancew3w;
    delete (globalThis as Record<string, unknown>).$onekey;
    delete (globalThis as Record<string, unknown>).trustwallet;
    delete (globalThis as Record<string, unknown>).foxwallet;
    delete (globalThis as Record<string, unknown>).tronWeb;
  });

  it("creates a WalletManager with registered adapters", async () => {
    const manager = createWalletClient({ adapters: [createMockAdapter()] });

    await expect(manager.connect("mock")).resolves.toMatchObject({
      account: { address: "TMockAddress" },
      network: { id: "nile" }
    });
    expect(manager.getAccount()?.address).toBe("TMockAddress");
  });

  it("creates a kit with TRON-native transaction helpers", async () => {
    const kit = createWalletKit({ adapters: [createMockAdapter()] });

    await kit.manager.connect("mock");
    await expect(kit.signMessage("hello")).resolves.toMatchObject({ proof: "signed:hello" });
    await expect(kit.sendTransaction({ txID: "tx" })).resolves.toMatchObject({ hash: "generic-hash" });
    await expect(kit.transferTrx({ to: "TReceiver", amountSun: 1n })).resolves.toMatchObject({
      hash: "trx-hash"
    });
    expect(kit.manager.getTransactions()[0]?.methodHint).toBe("transferTrx");
  });

  it("includes extension wallets by default and WalletConnect only when a projectId is configured", () => {
    expect(createWalletClient().getWallets().map((wallet) => wallet.metadata.id)).toEqual([
      "tronlink",
      "tokenpocket",
      "okx",
      "bitget",
      "trust",
      "metamask",
      "gate",
      "foxwallet",
      "bybit",
      "imtoken",
      "binance",
      "guarda",
      "onekey",
      "backpack"
    ]);
    expect(createWalletClient({ walletConnectProjectId: "project" }).getWallets().map((wallet) => wallet.metadata.id)).toEqual([
      "tronlink",
      "tokenpocket",
      "okx",
      "bitget",
      "trust",
      "metamask",
      "gate",
      "foxwallet",
      "bybit",
      "imtoken",
      "binance",
      "guarda",
      "onekey",
      "backpack",
      "walletconnect"
    ]);
  });

  it("hydrates default wallet metadata with catalog icons for connected button rendering", () => {
    const wallets = createWalletClient({ walletConnectProjectId: "project" }).getWallets();

    for (const wallet of wallets) {
      expect(wallet.metadata.icon, wallet.metadata.id).toMatch(/^data:image\/svg\+xml,/);
    }
  });

  it("connects an injected extension adapter through a wallet-specific provider", async () => {
    const provider = {
      tronWeb: {
        defaultAddress: { base58: "TTokenPocket", hex: "41token" },
        trx: {
          getBlockByNumber: async () => ({ blockID: "00000000000000000000000000000000000000000000000000000000cd8690dc" }),
          signMessageV2: async (message: string) => `tp:${message}`,
          sign: async <TTransaction,>(transaction: TTransaction) => transaction
        }
      },
      request: async () => ({ code: 200 })
    };
    const manager = createWalletClient({
      network: TRON_NILE,
      wallets: [],
      adapters: [
        createInjectedTronAdapter({
          id: "tokenpocket",
          name: "TokenPocket",
          providerPaths: ["tokenpocket.tron"],
          provider: () => provider,
          platforms: ["extension", "mobile"]
        })
      ]
    });

    await expect(manager.connect("tokenpocket")).resolves.toMatchObject({
      account: { address: "TTokenPocket" },
      network: { id: "nile" }
    });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "tp:hello" });
  });

  it("uses wallet-specific injected fallbacks when prominent upstream adapters miss installed extensions", async () => {
    const makeProvider = (address: string) => ({
      tronWeb: {
        defaultAddress: { base58: address },
        trx: {
          signMessageV2: async (message: string) => `${address}:${message}`,
          sign: async <TTransaction,>(transaction: TTransaction) => transaction
        }
      },
      request: async () => ({ code: 200 })
    });
    const tokenPocketProvider = makeProvider("TTokenPocket");
    const okxProvider = makeProvider("TOKX");
    const bitgetProvider = makeProvider("TBitget");
    (globalThis as typeof globalThis & { tokenpocket?: unknown }).tokenpocket = { tron: tokenPocketProvider };
    (globalThis as typeof globalThis & { okxwallet?: unknown }).okxwallet = { tronLink: okxProvider };
    (globalThis as typeof globalThis & { bitkeep?: unknown }).bitkeep = { tronLink: bitgetProvider };

    const manager = createWalletClient({ wallets: ["tokenpocket", "okx", "bitget"] });

    await expect(manager.getWallets().find((wallet) => wallet.metadata.id === "tokenpocket")?.isAvailable?.()).resolves.toBe(true);
    await expect(manager.getWallets().find((wallet) => wallet.metadata.id === "okx")?.isAvailable?.()).resolves.toBe(true);
    await expect(manager.getWallets().find((wallet) => wallet.metadata.id === "bitget")?.isAvailable?.()).resolves.toBe(true);
    await expect(manager.connect("okx")).resolves.toMatchObject({ account: { address: "TOKX" } });
    await manager.disconnect();
    await expect(manager.connect("bitget")).resolves.toMatchObject({ account: { address: "TBitget" } });
  });

  it("uses wallet-specific injected fallbacks for second phase extension wallets", async () => {
    const makeProvider = (address: string) => ({
      tronWeb: {
        defaultAddress: { base58: address },
        trx: {
          signMessageV2: async (message: string) => `${address}:${message}`,
          sign: async <TTransaction,>(transaction: TTransaction) => transaction
        }
      },
      request: async () => ({ code: 200 })
    });
    const gateProvider = makeProvider("TGate");
    const bybitProvider = makeProvider("TBybit");
    const binanceProvider = makeProvider("TBinance");
    const oneKeyProvider = makeProvider("TOneKey");
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = { tron: gateProvider };
    (globalThis as typeof globalThis & { bybitWallet?: unknown }).bybitWallet = { tronLink: bybitProvider };
    (globalThis as typeof globalThis & { binancew3w?: unknown }).binancew3w = { tron: binanceProvider };
    (globalThis as typeof globalThis & { $onekey?: unknown }).$onekey = { tron: oneKeyProvider };

    const manager = createWalletClient({ wallets: ["gate", "bybit", "binance", "onekey"] });

    await expect(manager.getWallets().find((wallet) => wallet.metadata.id === "gate")?.isAvailable?.()).resolves.toBe(true);
    await expect(manager.getWallets().find((wallet) => wallet.metadata.id === "bybit")?.isAvailable?.()).resolves.toBe(true);
    await expect(manager.getWallets().find((wallet) => wallet.metadata.id === "binance")?.isAvailable?.()).resolves.toBe(true);
    await expect(manager.getWallets().find((wallet) => wallet.metadata.id === "onekey")?.isAvailable?.()).resolves.toBe(true);
    await expect(manager.connect("gate")).resolves.toMatchObject({ account: { address: "TGate" } });
    await manager.disconnect();
    await expect(manager.connect("bybit")).resolves.toMatchObject({ account: { address: "TBybit" } });
  });

  it("detects MetaMask from ethereum providers before the upstream adapter leaves loading", async () => {
    (globalThis as typeof globalThis & { ethereum?: unknown }).ethereum = {
      providers: [{ isMetaMask: true }]
    };
    const manager = createWalletClient({ wallets: ["metamask"] });

    await expect(manager.getWallets()[0]?.isAvailable?.()).resolves.toBe(true);
  });

  it("bridges tronweb3 wallet adapter instances into the local adapter contract", async () => {
    const tronweb3Adapter = {
      name: "OKX Wallet",
      url: "https://www.okx.com/web3",
      icon: "data:image/svg+xml,okx",
      readyState: "Found",
      address: null as string | null,
      connected: false,
      connect: async () => {
        tronweb3Adapter.address = "TOKXAddress";
        tronweb3Adapter.connected = true;
      },
      disconnect: async () => {
        tronweb3Adapter.connected = false;
      },
      signMessage: async (message: string) => `okx:${message}`,
      signTransaction: async <TTransaction,>(transaction: TTransaction) => transaction
    };

    const adapter = createTronWeb3AdapterBridge({
      adapter: tronweb3Adapter,
      id: "okx",
      type: "extension",
      platforms: ["extension", "mobile"]
    });
    const manager = createWalletClient({ wallets: [], adapters: [adapter] });

    await expect(manager.connect("okx")).resolves.toMatchObject({
      account: { address: "TOKXAddress" }
    });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "okx:hello" });
    expect(manager.getWallets()[0]?.metadata.platforms).toEqual(["extension", "mobile"]);
  });

  it("exposes a kit-level theme update entrypoint", () => {
    const kit = createWalletKit({ adapters: [createMockAdapter()] });

    expect(typeof kit.setTheme).toBe("function");
    expect(() => kit.setTheme({ themeName: "dark" })).not.toThrow();
  });

  it("refreshes identity and balance into the active session", async () => {
    const kit = createWalletKit({
      adapters: [createMockAdapter()],
      identity: {
        enabled: true,
        resolver: async () => ({ domain: "alice.trx", displayName: "alice.trx" })
      },
      balance: {
        resolver: async () => "42.5"
      }
    });

    await kit.manager.connect("mock");
    await expect(kit.refreshIdentity()).resolves.toMatchObject({ domain: "alice.trx" });
    await expect(kit.refreshBalance()).resolves.toMatchObject({ formatted: "42.5", symbol: "TRX" });

    expect(kit.manager.getSession()?.account.domain).toBe("alice.trx");
    expect(kit.manager.getSession()?.balance?.formatted).toBe("42.5");
  });

  it("refreshes TRX balance from the connected wallet-specific tronWeb by default", async () => {
    (globalThis as Record<string, unknown>).trustwallet = {
      tronLink: {
        tronWeb: {
          trx: {
            getBalance: async (address: string) => (address === "TMockAddress" ? "42500000" : "0")
          }
        }
      }
    };
    (globalThis as Record<string, unknown>).tronWeb = {
      trx: {
        getBalance: async () => "1"
      }
    };

    const kit = createWalletKit({ wallets: [], adapters: [createMockAdapter("trust")] });

    await kit.manager.connect("trust");
    await expect(kit.refreshBalance()).resolves.toMatchObject({
      value: "42500000",
      formatted: "42.5",
      symbol: "TRX"
    });
    expect(kit.manager.getSession()?.balance?.formatted).toBe("42.5");
  });

  it("uses FoxWallet app tronWeb path for default balance lookup", async () => {
    (globalThis as Record<string, unknown>).foxwallet = {
      tronLink: {
        tronWeb: {
          trx: {
            getBalance: async () => 1234567
          }
        }
      }
    };
    const kit = createWalletKit({ wallets: [], adapters: [createMockAdapter("foxwallet")] });

    await kit.manager.connect("foxwallet");
    await expect(kit.refreshBalance()).resolves.toMatchObject({
      value: "1234567",
      formatted: "1.234567",
      symbol: "TRX"
    });
  });
});
