import { afterEach, describe, expect, it, vi } from "vitest";
import { TRON_MAINNET, TRON_NILE, type WalletAdapter } from "@tron-wallet-kit/core";
import {
  BUILTIN_WALLET_DESCRIPTORS,
  buildCatalog,
  createInjectedTronAdapter,
  createTronDomainIdentityResolver,
  createTronWeb3AdapterBridge,
  createWalletClient,
  createWalletKit,
  WALLET_ICONS
} from "../src/index";

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

function createMockTronDomainTronWeb(options: {
  reverseOf?: unknown;
  balanceOf?: unknown;
  tokenDomain?: unknown;
  metadataValues?: unknown[];
  neverResolveReverse?: boolean;
} = {}) {
  const calls = {
    at: [] as string[],
    setAddress: [] as string[],
    reverseOf: [] as string[],
    genTokenId: [] as string[],
    getMany: [] as string[][]
  };
  const call = (value: unknown) => ({ call: async () => value });
  const contract = {
    reverseOf: (address: string) => {
      calls.reverseOf.push(address);
      if (options.neverResolveReverse) return { call: () => new Promise(() => undefined) };
      return call(options.reverseOf ?? "alice.trx");
    },
    balanceOf: () => call(options.balanceOf ?? "0"),
    tokenOfOwnerByIndex: () => call("token-1"),
    _tokenURIs: () => call(options.tokenDomain ?? ""),
    genTokenId: (domain: string) => {
      calls.genTokenId.push(domain);
      return call(`token:${domain}`);
    },
    getMany: (keys: string[]) => {
      calls.getMany.push(keys);
      return call(options.metadataValues ?? []);
    }
  };
  return {
    calls,
    tronWeb: {
      setAddress: (address: string) => calls.setAddress.push(address),
      contract: () => ({
        at: async (address: string) => {
          calls.at.push(address);
          return contract;
        }
      })
    }
  };
}

describe("client entrypoints", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).tokenpocket;
    delete (globalThis as Record<string, unknown>).okxwallet;
    delete (globalThis as Record<string, unknown>).bitkeep;
    delete (globalThis as Record<string, unknown>).ethereum;
    delete (globalThis as Record<string, unknown>).gatewallet;
    delete (globalThis as Record<string, unknown>).gateWallet;
    delete (globalThis as Record<string, unknown>).GateWallet;
    delete (globalThis as Record<string, unknown>).bybitWallet;
    delete (globalThis as Record<string, unknown>).binancew3w;
    delete (globalThis as Record<string, unknown>).backpack;
    delete (globalThis as Record<string, unknown>).guarda;
    delete (globalThis as Record<string, unknown>).$onekey;
    delete (globalThis as Record<string, unknown>).SafePalHook;
    delete (globalThis as Record<string, unknown>).sfpPlatform;
    delete (globalThis as Record<string, unknown>).trustwallet;
    delete (globalThis as Record<string, unknown>).foxwallet;
    delete (globalThis as Record<string, unknown>).lateWallet;
    delete (globalThis as Record<string, unknown>).tronWeb;
    delete (globalThis as Record<string, unknown>).tronLink;
    delete (globalThis as Record<string, unknown>).isBitKeep;
    delete (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest;
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

  it("refreshes identity and enriches the connected account", async () => {
    const kit = createWalletKit({
      adapters: [createMockAdapter()],
      identity: {
        enabled: true,
        resolver: async () => ({
          domain: "alice.trx",
          displayName: "alice.trx",
          avatar: "https://trxdomains.xyz/avatar.png"
        })
      }
    });

    await kit.manager.connect("mock");
    await expect(kit.refreshIdentity()).resolves.toMatchObject({ domain: "alice.trx" });
    expect(kit.manager.getSession()?.account).toMatchObject({
      address: "TMockAddress",
      domain: "alice.trx",
      displayName: "alice.trx",
      avatar: "https://trxdomains.xyz/avatar.png"
    });
  });

  it("resolves TRX Domains through the direct mainnet contract", async () => {
    const { tronWeb, calls } = createMockTronDomainTronWeb({
      reverseOf: "trxdomains.trx",
      metadataValues: ["https://trxdomains.xyz/avatar.png", ""]
    });
    (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest = tronWeb;

    const resolver = createTronDomainIdentityResolver({ metadataKeys: ["avatar", "website"] });
    const identity = await resolver({ address: "TSFquXZoXtei19kDJ1Sy1YGjznz8gWhfKd" }, { network: TRON_MAINNET, walletId: "mock" });

    expect(identity).toMatchObject({
      domain: "trxdomains.trx",
      displayName: "trxdomains.trx",
      avatar: "https://trxdomains.xyz/avatar.png"
    });
    expect(identity?.website).toBeUndefined();
    expect(calls.setAddress).toEqual(["TSFquXZoXtei19kDJ1Sy1YGjznz8gWhfKd"]);
    expect(calls.genTokenId).toEqual(["trxdomains.trx"]);
  });

  it("falls back to the first owned TRX Domain when no default domain is set", async () => {
    const { tronWeb } = createMockTronDomainTronWeb({
      reverseOf: "",
      balanceOf: "1",
      tokenDomain: "trxdomains.trx"
    });
    (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest = tronWeb;
    const resolver = createTronDomainIdentityResolver({ metadataKeys: [] });

    const identity = await resolver({ address: "TSFquXZoXtei19kDJ1Sy1YGjznz8gWhfKd" }, { network: TRON_MAINNET, walletId: "mock" });

    expect(identity).toMatchObject({
      domain: "trxdomains.trx",
      displayName: "trxdomains.trx"
    });
  });

  it("keeps TRX Domains multi-TLD names unchanged", async () => {
    const { tronWeb, calls } = createMockTronDomainTronWeb({
      reverseOf: "bob.sun",
      metadataValues: []
    });
    (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest = tronWeb;
    const resolver = createTronDomainIdentityResolver({ metadataKeys: ["avatar"] });

    const identity = await resolver({ address: "TMockAddress" }, { network: TRON_MAINNET, walletId: "mock" });

    expect(identity?.domain).toBe("bob.sun");
    expect(identity?.displayName).toBe("bob.sun");
    expect(calls.genTokenId).toEqual(["bob.sun"]);
  });

  it("skips TRX Domains identity outside mainnet without touching the contract", async () => {
    const { tronWeb, calls } = createMockTronDomainTronWeb({ reverseOf: "alice.trx" });
    (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest = tronWeb;
    const resolver = createTronDomainIdentityResolver({ metadataKeys: [] });

    await expect(resolver({ address: "TMockAddress" }, { network: TRON_NILE, walletId: "mock" })).resolves.toBeUndefined();
    expect(calls.at).toEqual([]);
    expect(calls.reverseOf).toEqual([]);
  });

  it("times out slow TRX Domains contract reads without blocking UI", async () => {
    const { tronWeb } = createMockTronDomainTronWeb({ neverResolveReverse: true });
    (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest = tronWeb;
    const resolver = createTronDomainIdentityResolver({ metadataKeys: [], timeoutMs: 5 });

    await expect(resolver({ address: "TMockAddress" }, { network: TRON_MAINNET, walletId: "mock" })).resolves.toBeUndefined();
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
      "safepal",
      "guarda",
      "onekey",
      "backpack",
      "ledger"
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
      "safepal",
      "guarda",
      "onekey",
      "backpack",
      "ledger",
      "walletconnect"
    ]);
  });

  it("keeps built-in wallet descriptors unique and adapter-backed", () => {
    const ids = BUILTIN_WALLET_DESCRIPTORS.map((wallet) => wallet.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
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
      "safepal",
      "guarda",
      "onekey",
      "backpack",
      "ledger",
      "walletconnect"
    ]);
    expect(BUILTIN_WALLET_DESCRIPTORS.every((wallet) => wallet.homepage && wallet.platforms.length > 0)).toBe(true);
  });

  it("ships Ledger as an optional hardware bridge descriptor", () => {
    const manager = createWalletClient({ wallets: ["ledger"] });
    const [ledger] = manager.getWallets();
    const catalog = buildCatalog(BUILTIN_WALLET_DESCRIPTORS);

    expect(ledger?.metadata).toMatchObject({
      id: "ledger",
      name: "Ledger",
      type: "hardware",
      platforms: ["hardware"]
    });
    expect(ledger?.metadata.icon).toBe(WALLET_ICONS.ledger);
    expect(catalog.find((wallet) => wallet.id === "ledger")).toMatchObject({
      id: "ledger",
      group: "hardware",
      transport: "hardware",
      platforms: ["hardware"],
      icon: WALLET_ICONS.ledger
    });
  });

  it("resolves builtin wallet icons from the client generated icon map", () => {
    const catalog = buildCatalog(BUILTIN_WALLET_DESCRIPTORS);

    for (const wallet of BUILTIN_WALLET_DESCRIPTORS) {
      expect(WALLET_ICONS[wallet.id], wallet.id).toMatch(/^data:image\/(?:svg\+xml|png|webp);base64,/);
      expect(catalog.find((item) => item.id === wallet.id)?.icon, wallet.id).toBe(WALLET_ICONS[wallet.id]);
    }
  });

  it("accepts runtime wallet descriptors with inline catalog metadata", async () => {
    const icon = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E";
    const wallet = {
      id: "safepal-test",
      name: "SafePal Test",
      integration: "injected" as const,
      homepage: "https://www.safepal.com",
      downloadUrl: "https://www.safepal.com/download",
      icon,
      platforms: ["extension", "mobile"] as const,
      group: "popular" as const,
      featured: 1,
      requestMethods: ["tron_requestAccounts"],
      signMessageMode: "sign" as const,
      detect: {
        provider: () => ({
          request: async () => ({ code: 200 }),
          tronWeb: {
            defaultAddress: { base58: "TSafePalRuntime" },
            trx: {
              sign: async (payload: string) => `signed:${payload}`
            }
          }
        })
      }
    };

    const manager = createWalletClient({ wallets: [wallet] });
    const catalog = buildCatalog([wallet]);

    expect(manager.getWallets().map((adapter) => adapter.metadata.id)).toEqual(["safepal-test"]);
    expect(catalog).toMatchObject([{ id: "safepal-test", icon, featured: 1 }]);
    await expect(manager.connect("safepal-test")).resolves.toMatchObject({ account: { address: "TSafePalRuntime" } });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ signature: "signed:hello" });
  });

  it("allows default registry wallets to be disabled without removing adapter code", () => {
    expect(createWalletClient({ walletConnectProjectId: "project", disabledWallets: ["trust", "guarda", "walletconnect"] }).getWallets().map((wallet) => wallet.metadata.id)).toEqual([
      "tronlink",
      "tokenpocket",
      "okx",
      "bitget",
      "metamask",
      "gate",
      "foxwallet",
      "bybit",
      "imtoken",
      "binance",
      "safepal",
      "onekey",
      "backpack",
      "ledger"
    ]);
  });

  it("hydrates default wallet metadata with catalog icons for connected button rendering", () => {
    const wallets = createWalletClient({ walletConnectProjectId: "project" }).getWallets();

    for (const wallet of wallets) {
      expect(wallet.metadata.icon, wallet.metadata.id).toMatch(/^data:image\/(?:svg\+xml|png|webp);base64,/);
      expect(typeof wallet.connect, wallet.metadata.id).toBe("function");
    }
  });

  it("keeps TronLink class adapter methods after icon metadata hydration", async () => {
    const manager = createWalletClient({
      wallets: ["tronlink"],
      tronlink: {
        provider: () => ({
          kind: "legacy" as const,
          provider: {
            isTronLink: true,
            ready: true,
            tronWeb: {
              ready: true,
              defaultAddress: { base58: "TTronLinkAddress", hex: "41tronlink" },
              trx: {
                getBlockByNumber: async () => ({ blockID: "000000000000000000000000000000000000000000000000000000002b6653dc" }),
                sign: async <TTransaction,>(transaction: TTransaction) => transaction,
                signMessageV2: async (message: string) => `tronlink:${message}`
              }
            },
            request: async () => ({ code: 200 as const })
          }
        })
      }
    });
    const [wallet] = manager.getWallets();

    expect(wallet?.metadata.icon).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(typeof wallet?.connect).toBe("function");
    await expect(manager.connect("tronlink")).resolves.toMatchObject({ account: { address: "TTronLinkAddress" } });
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

  it("falls back from tron_requestAccounts to eth_requestAccounts for injected extension providers", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "tron_requestAccounts") throw new Error("method not supported");
      if (method === "eth_requestAccounts") return ["TLegacyInjected"];
      return undefined;
    });
    const manager = createWalletClient({
      wallets: [],
      adapters: [
        createInjectedTronAdapter({
          id: "legacy-injected",
          name: "Legacy Injected",
          providerPaths: [],
          provider: () => ({
            request,
            tronWeb: {
              defaultAddress: { base58: "TDefaultShouldNotWin" },
              trx: {
                getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" })
              }
            }
          })
        })
      ]
    });

    await expect(manager.connect("legacy-injected")).resolves.toMatchObject({
      account: { address: "TLegacyInjected" }
    });
    expect(request).toHaveBeenNthCalledWith(1, { method: "tron_requestAccounts" });
    expect(request).toHaveBeenNthCalledWith(2, { method: "eth_requestAccounts" });
  });

  it("does not use generic tronWeb when an injected descriptor declares only wallet-specific roots", async () => {
    (globalThis as Record<string, unknown>).tronWeb = {
      defaultAddress: { base58: "TGenericShouldNotWin" },
      trx: {
        getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" })
      }
    };
    const manager = createWalletClient({
      wallets: [
        {
          id: "strict-injected",
          name: "Strict Injected",
          integration: "injected" as const,
          homepage: "https://example.com",
          platforms: ["extension"] as const,
          detect: { providerPaths: ["strictWallet.tron"] }
        }
      ]
    });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(false);
    await expect(manager.connect("strict-injected")).rejects.toMatchObject({
      code: "WALLET_UNAVAILABLE"
    });
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

    await expect(Promise.resolve(manager.getWallets().find((wallet) => wallet.metadata.id === "tokenpocket")?.isAvailable?.())).resolves.toBe(true);
    await expect(Promise.resolve(manager.getWallets().find((wallet) => wallet.metadata.id === "okx")?.isAvailable?.())).resolves.toBe(true);
    await expect(Promise.resolve(manager.getWallets().find((wallet) => wallet.metadata.id === "bitget")?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("okx")).resolves.toMatchObject({ account: { address: "TOKX" } });
    await manager.disconnect();
    await expect(manager.connect("bitget")).resolves.toMatchObject({ account: { address: "TBitget" } });
  });

  it("reads Bitget addresses from parent tronWeb after a successful request", async () => {
    const request = vi.fn(async () => ({ code: 200 }));
    (globalThis as typeof globalThis & { bitkeep?: unknown }).bitkeep = {
      tronLink: { request },
      tronWeb: {
        defaultAddress: { base58: "TBitgetParent", hex: "41bitget" },
        trx: {
          getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" }),
          getBalance: async () => "123000000"
        }
      }
    };

    const kit = createWalletKit({ wallets: ["bitget"] });

    await expect(kit.manager.connect("bitget")).resolves.toMatchObject({
      account: { address: "TBitgetParent", hexAddress: "41bitget" }
    });
    await expect(kit.refreshBalance()).resolves.toMatchObject({ formatted: "123", symbol: "TRX" });
    expect(request).toHaveBeenCalledWith({ method: "tron_requestAccounts" });
  });

  it("uses global Bitget markers when the extension exposes TronLink-shaped globals", async () => {
    const request = vi.fn(async () => ({ code: 200 }));
    Object.assign(globalThis, {
      isBitKeep: true,
      tronLink: { request },
      tronWeb: {
        defaultAddress: { base58: "TBitgetGlobal" },
        trx: {
          getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" })
        }
      }
    });

    const manager = createWalletClient({ wallets: ["bitget"] });

    await expect(Promise.resolve(manager.getWallets().find((wallet) => wallet.metadata.id === "bitget")?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("bitget")).resolves.toMatchObject({ account: { address: "TBitgetGlobal" } });
  });

  it("does not crash Bitget availability when injected extension getters throw", async () => {
    const bitgetLikeProvider = {
      request: vi.fn(async () => ({ code: 200 })),
      tronWeb: {
        defaultAddress: { base58: "TBitgetSafe" },
        trx: {
          getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" })
        }
      }
    };
    Object.defineProperty(bitgetLikeProvider, "logger", {
      enumerable: true,
      get() {
        throw new TypeError("logger is not a function");
      }
    });
    (globalThis as typeof globalThis & { bitkeep?: unknown }).bitkeep = { tronLink: bitgetLikeProvider };

    const manager = createWalletClient({ wallets: ["bitget"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("bitget")).resolves.toMatchObject({ account: { address: "TBitgetSafe" } });
  });

  it("keeps Bitget injected request bound to the original provider object", async () => {
    const bitgetLikeProvider = {
      logger: {
        debug: vi.fn()
      },
      tronWeb: {
        defaultAddress: { base58: "TBitgetBound" },
        trx: {
          getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" })
        }
      },
      async request(this: { logger?: { debug?: (message: string) => void } }, { method }: { method: string }) {
        this.logger?.debug?.(method);
        return { code: 200 };
      }
    };
    (globalThis as typeof globalThis & { bitkeep?: unknown }).bitkeep = { tronLink: bitgetLikeProvider };

    const manager = createWalletClient({ wallets: ["bitget"] });

    await expect(manager.connect("bitget")).resolves.toMatchObject({ account: { address: "TBitgetBound" } });
    expect(bitgetLikeProvider.logger.debug).toHaveBeenCalledWith("tron_requestAccounts");
  });

  it("uses the Trust-specific injected provider instead of shared TronLink globals", async () => {
    const trustProvider = {
      request: async () => ({ address: "TTrustAddress" }),
      tronWeb: {
        defaultAddress: { base58: "TTrustAddress" },
        trx: {
          getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" })
        }
      }
    };
    const tronLinkProvider = {
      isTronLink: true,
      request: async () => ({ code: 200, message: "ok" }),
      tronWeb: {
        defaultAddress: { base58: "TTronLinkAddress" },
        trx: {
          getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" })
        }
      }
    };
    (globalThis as Record<string, unknown>).trustwallet = { tronLink: trustProvider };
    (globalThis as Record<string, unknown>).tronLink = tronLinkProvider;
    (globalThis as Record<string, unknown>).tronWeb = tronLinkProvider.tronWeb;

    const manager = createWalletClient({ wallets: ["trust"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("trust")).resolves.toMatchObject({ account: { address: "TTrustAddress" } });
  });

  it("uses Guarda tron request with parent tronWeb to resolve an address", async () => {
    const guardaTronWeb = {
      defaultAddress: { base58: "TGuardaDefault" },
      trx: {
        getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" })
      }
    };
    (globalThis as Record<string, unknown>).guarda = {
      tron: {
        request: async ({ method }: { method: string }) => (method === "eth_requestAccounts" ? ["TGuardaAddress"] : [])
      },
      tronWeb: guardaTronWeb
    };

    const manager = createWalletClient({ wallets: ["guarda"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("guarda")).resolves.toMatchObject({ account: { address: "TGuardaAddress" } });
  });

  it("connects FoxWallet through its wallet-specific injected provider", async () => {
    (globalThis as Record<string, unknown>).foxwallet = {
      tronLink: {
        request: async () => ({ code: 200 }),
        tronWeb: {
          defaultAddress: { base58: "TFoxWallet" },
          trx: {
            getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" }),
            signMessageV2: async (message: string) => `fox:${message}`,
            sign: async <TTransaction,>(transaction: TTransaction) => transaction
          }
        }
      }
    };

    const manager = createWalletClient({ wallets: ["foxwallet"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("foxwallet")).resolves.toMatchObject({ account: { address: "TFoxWallet" } });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "fox:hello" });
  });

  it("connects FoxWallet when request or tronWeb live on the parent object", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => (method === "tron_requestAccounts" ? { code: 200 } : undefined));
    (globalThis as Record<string, unknown>).foxwallet = {
      request,
      tronLink: {},
      tronWeb: {
        defaultAddress: { base58: "TFoxWalletParent" },
        trx: {
          getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" }),
          signMessageV2: async (message: string) => `fox-parent:${message}`
        }
      }
    };

    const manager = createWalletClient({ wallets: ["foxwallet"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("foxwallet")).resolves.toMatchObject({ account: { address: "TFoxWalletParent" } });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "fox-parent:hello" });
    expect(request).toHaveBeenCalledWith({ method: "tron_requestAccounts" });
  });

  it("connects SafePal through SafePalHook and the global tronWeb", async () => {
    const request = vi.fn(async () => ({ code: 200 }));
    (globalThis as Record<string, unknown>).SafePalHook = {
      request,
      defaultAddress: { base58: "TSafePalHook", hex: "41safepal" }
    };
    (globalThis as Record<string, unknown>).tronWeb = {
      trx: {
        getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" }),
        sign: async (payload: unknown) => (typeof payload === "string" ? `safepal:${payload}` : payload)
      }
    };

    const manager = createWalletClient({ wallets: ["safepal"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("safepal")).resolves.toMatchObject({ account: { address: "TSafePalHook" } });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "safepal:hello" });
    expect(request).toHaveBeenCalledWith({ method: "tron_requestAccounts" });
  });

  it("does not mark SafePal available without the required tronWeb surface", async () => {
    (globalThis as Record<string, unknown>).SafePalHook = {
      request: vi.fn(async () => ({ code: 200 })),
      defaultAddress: { base58: "TSafePalHookOnly" }
    };

    const manager = createWalletClient({ wallets: ["safepal"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(false);
  });

  it("connects SafePal when defaultAddress is populated after approval", async () => {
    const safePalHook: Record<string, unknown> = {};
    const request = vi.fn(async () => {
      safePalHook.defaultAddress = { base58: "TSafePalAfterApproval", hex: "41after" };
      return { code: 200 };
    });
    safePalHook.request = request;
    (globalThis as Record<string, unknown>).SafePalHook = safePalHook;
    (globalThis as Record<string, unknown>).tronWeb = {
      trx: {
        getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" }),
        sign: async (payload: unknown) => (typeof payload === "string" ? `safepal-late:${payload}` : payload)
      }
    };

    const manager = createWalletClient({ wallets: ["safepal"] });

    await expect(manager.connect("safepal")).resolves.toMatchObject({
      account: { address: "TSafePalAfterApproval", hexAddress: "41after" }
    });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "safepal-late:hello" });
  });

  it("connects SafePal in-app when address is already available and no request method is exposed", async () => {
    (globalThis as Record<string, unknown>).SafePalHook = {
      defaultAddress: { base58: "TSafePalInApp", hex: "41inapp" }
    };
    (globalThis as Record<string, unknown>).sfpPlatform = "iOS";
    (globalThis as Record<string, unknown>).tronWeb = {
      trx: {
        getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" }),
        sign: async (payload: unknown) => (typeof payload === "string" ? `safepal-app:${payload}` : payload)
      }
    };

    const manager = createWalletClient({ wallets: ["safepal"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("safepal")).resolves.toMatchObject({
      account: { address: "TSafePalInApp", hexAddress: "41inapp" }
    });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "safepal-app:hello" });
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
    const binanceProvider = {
      getAccount: vi.fn(async () => ({ address: "TBinance" })),
      getChainId: vi.fn(() => "0x2b6653dc"),
      signMessageV2: vi.fn(async (message: string) => `TBinance:${message}`),
      signTransaction: vi.fn(async <TTransaction,>(transaction: TTransaction) => transaction)
    };
    const oneKeyProvider = makeProvider("TOneKey");
    const backpackProvider = makeProvider("TBackpack");
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = { tron: gateProvider };
    (globalThis as typeof globalThis & { bybitWallet?: unknown }).bybitWallet = { tronLink: bybitProvider };
    (globalThis as typeof globalThis & { binancew3w?: unknown }).binancew3w = { tron: binanceProvider };
    (globalThis as typeof globalThis & { $onekey?: unknown }).$onekey = { tron: oneKeyProvider };
    (globalThis as typeof globalThis & { backpack?: unknown }).backpack = { tron: backpackProvider };

    const manager = createWalletClient({ wallets: ["gate", "bybit", "binance", "onekey", "backpack"] });

    await expect(Promise.resolve(manager.getWallets().find((wallet) => wallet.metadata.id === "gate")?.isAvailable?.())).resolves.toBe(true);
    await expect(Promise.resolve(manager.getWallets().find((wallet) => wallet.metadata.id === "bybit")?.isAvailable?.())).resolves.toBe(true);
    await expect(Promise.resolve(manager.getWallets().find((wallet) => wallet.metadata.id === "binance")?.isAvailable?.())).resolves.toBe(true);
    await expect(Promise.resolve(manager.getWallets().find((wallet) => wallet.metadata.id === "onekey")?.isAvailable?.())).resolves.toBe(true);
    await expect(Promise.resolve(manager.getWallets().find((wallet) => wallet.metadata.id === "backpack")?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("gate")).resolves.toMatchObject({ account: { address: "TGate" } });
    await manager.disconnect();
    await expect(manager.connect("bybit")).resolves.toMatchObject({ account: { address: "TBybit" } });
    await manager.disconnect();
    await expect(manager.connect("binance")).resolves.toMatchObject({ account: { address: "TBinance" } });
    await manager.disconnect();
    await expect(manager.connect("backpack")).resolves.toMatchObject({ account: { address: "TBackpack" } });
  });

  it("merges Gate parent tronWeb when the request provider is nested", async () => {
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = {
      tronLink: {
        request: async () => ({ code: 200 })
      },
      tronWeb: {
        defaultAddress: { base58: "TGateParent", hex: "41gate" },
        trx: {
          signMessageV2: async (message: string) => `gate:${message}`,
          sign: async <TTransaction,>(transaction: TTransaction) => transaction
        }
      }
    };

    const manager = createWalletClient({ wallets: ["gate"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("gate")).resolves.toMatchObject({
      account: { address: "TGateParent", hexAddress: "41gate" }
    });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "gate:hello" });
  });

  it("treats Gate tronLink marker with parent tronWeb as available", async () => {
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = {
      tronLink: {},
      tronWeb: {
        defaultAddress: { base58: "TGateMarker", hex: "41gatemarker" },
        trx: {
          signMessageV2: async (message: string) => `gate-marker:${message}`,
          sign: async <TTransaction,>(transaction: TTransaction) => transaction
        }
      }
    };

    const manager = createWalletClient({ wallets: ["gate"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("gate")).resolves.toMatchObject({
      account: { address: "TGateMarker", hexAddress: "41gatemarker" }
    });
  });

  it("marks Gate available from its upstream installed marker before provider is connect-ready", async () => {
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = {
      tronLink: {}
    };

    const manager = createWalletClient({ wallets: ["gate"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
  });

  it("connects Gate from the documented preferred gatewallet.tronWeb object", async () => {
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = {
      tronWeb: {
        defaultAddress: { base58: "TGateDocs", hex: "41gatedocs" },
        trx: {
          signMessageV2: async (message: string) => `gate-docs:${message}`,
          sign: async <TTransaction,>(transaction: TTransaction) => transaction
        },
        transactionBuilder: {
          sendTrx: async () => ({ txID: "gate-docs-tx" })
        }
      }
    };

    const manager = createWalletClient({ wallets: ["gate"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("gate")).resolves.toMatchObject({
      account: { address: "TGateDocs", hexAddress: "41gatedocs" }
    });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "gate-docs:hello" });
  });

  it("uses Gate injected address directly when it is already exposed", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_requestAccounts") return ["TGateRequested"];
      return undefined;
    });
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = {
      request,
      tronWeb: {
        defaultAddress: { base58: "TGateDefaultShouldNotWin", hex: "41default" },
        trx: {
          signMessageV2: async (message: string) => `gate-requested:${message}`
        }
      }
    };

    const manager = createWalletClient({ wallets: ["gate"] });

    await expect(manager.connect("gate")).resolves.toMatchObject({
      account: { address: "TGateDefaultShouldNotWin", hexAddress: "41default" }
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("waits for Gate to hydrate tronWeb after a first approval request", async () => {
    const gatewallet: Record<string, unknown> = {
      tronWeb: {
        trx: {
          signMessageV2: async (message: string) => `gate-late:${message}`
        }
      }
    };
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_requestAccounts") {
        setTimeout(() => {
          gatewallet.tronWeb = {
            defaultAddress: { base58: "TGateHydrated", hex: "41hydrated" },
            trx: {
              signMessageV2: async (message: string) => `gate-late:${message}`
            }
          };
        }, 10);
        return [];
      }
      return undefined;
    });
    gatewallet.request = request;
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = gatewallet;

    const manager = createWalletClient({ wallets: ["gate"] });

    await expect(manager.connect("gate")).resolves.toMatchObject({
      account: { address: "TGateHydrated", hexAddress: "41hydrated" }
    });
    expect(request).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
  });

  it("reads Gate first approval address from refreshed global paths", async () => {
    const gatewallet: Record<string, unknown> = {
      tron: {
        request: async ({ method }: { method: string }) => {
          if (method === "eth_requestAccounts") {
            setTimeout(() => {
              gatewallet.tronWeb = {
                defaultAddress: "TGateRootString",
                trx: {
                  signMessageV2: async (message: string) => `gate-root:${message}`
                }
              };
            }, 10);
            return { code: 200 };
          }
          return undefined;
        }
      }
    };
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = gatewallet;

    const manager = createWalletClient({ wallets: ["gate"] });

    await expect(manager.connect("gate")).resolves.toMatchObject({
      account: { address: "TGateRootString" }
    });
  });

  it("reads Gate accountAddress responses from the extension request", async () => {
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = {
      tronLink: {},
      tron: {
        request: async ({ method }: { method: string }) => (
          method === "eth_requestAccounts"
            ? { code: 200, accountAddress: "TGateAccountAddress", hex: "41gateaccount" }
            : undefined
        ),
        tronWeb: {
          trx: {
            signMessageV2: async (message: string) => `gate-account:${message}`
          }
        }
      }
    };

    const manager = createWalletClient({ wallets: ["gate"] });

    await expect(manager.connect("gate")).resolves.toMatchObject({
      account: { address: "TGateAccountAddress" }
    });
  });

  it("retries Gate once when the first approval request returns no address", async () => {
    let attempts = 0;
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method !== "eth_requestAccounts") return undefined;
      attempts += 1;
      return attempts === 1 ? { code: 200 } : ["TGateSecondAttempt"];
    });
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = {
      tronLink: {},
      tron: {
        request,
        tronWeb: {
          trx: {
            signMessageV2: async (message: string) => `gate-retry:${message}`
          }
        }
      }
    };

    const manager = createWalletClient({ wallets: ["gate"] });

    await expect(manager.connect("gate")).resolves.toMatchObject({
      account: { address: "TGateSecondAttempt" }
    });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("marks Gate available from camelCase and EIP-6963 Gate markers", async () => {
    (globalThis as typeof globalThis & { gateWallet?: unknown }).gateWallet = {
      tron: {}
    };
    const aliasManager = createWalletClient({ wallets: ["gate"] });

    await expect(Promise.resolve(aliasManager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    delete (globalThis as Record<string, unknown>).gateWallet;

    const eventTarget = new EventTarget();
    const previousAddEventListener = (globalThis as Record<string, unknown>).addEventListener;
    const previousRemoveEventListener = (globalThis as Record<string, unknown>).removeEventListener;
    const previousDispatchEvent = (globalThis as Record<string, unknown>).dispatchEvent;
    (globalThis as Record<string, unknown>).addEventListener = eventTarget.addEventListener.bind(eventTarget);
    (globalThis as Record<string, unknown>).removeEventListener = eventTarget.removeEventListener.bind(eventTarget);
    (globalThis as Record<string, unknown>).dispatchEvent = eventTarget.dispatchEvent.bind(eventTarget);
    const listener = (event: Event) => {
      if (event.type !== "eip6963:requestProvider") return;
      globalThis.dispatchEvent(
        new CustomEvent("eip6963:announceProvider", {
          detail: {
            info: { name: "Gate Wallet", rdns: "io.gate.wallet" },
            provider: {}
          }
        })
      );
    };
    globalThis.addEventListener("eip6963:requestProvider", listener);
    try {
      const eip6963Manager = createWalletClient({ wallets: ["gate"] });
      await expect(Promise.resolve(eip6963Manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    } finally {
      globalThis.removeEventListener("eip6963:requestProvider", listener);
      if (previousAddEventListener) {
        (globalThis as Record<string, unknown>).addEventListener = previousAddEventListener;
      } else {
        delete (globalThis as Record<string, unknown>).addEventListener;
      }
      if (previousRemoveEventListener) {
        (globalThis as Record<string, unknown>).removeEventListener = previousRemoveEventListener;
      } else {
        delete (globalThis as Record<string, unknown>).removeEventListener;
      }
      if (previousDispatchEvent) {
        (globalThis as Record<string, unknown>).dispatchEvent = previousDispatchEvent;
      } else {
        delete (globalThis as Record<string, unknown>).dispatchEvent;
      }
    }
  });

  it("waits briefly for late injected providers when configured", async () => {
    const manager = createWalletClient({
      wallets: [],
      adapters: [
        createInjectedTronAdapter({
          id: "late-injected",
          name: "Late Injected",
          providerPaths: ["lateWallet.tron"],
          availabilityTimeoutMs: 80
        })
      ]
    });
    setTimeout(() => {
      (globalThis as Record<string, unknown>).lateWallet = {
        tron: {
          tronWeb: { defaultAddress: { base58: "TLateInjected" } }
        }
      };
    }, 10);

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    delete (globalThis as Record<string, unknown>).lateWallet;
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
