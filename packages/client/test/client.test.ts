import { afterEach, describe, expect, it, vi } from "vitest";
import { TRON_MAINNET, TRON_NILE, type WalletAdapter } from "@tron-wallet-kit/core";
import { mapAdapterToWalletOption, mergeWalletOptionsWithCatalog, type WalletOptionViewModel } from "@tron-wallet-kit/ui";
import {
  BUILTIN_WALLET_DESCRIPTORS,
  buildCatalog,
  createInjectedTronAdapter,
  createTronDomainIdentityResolver,
  createTronWeb3AdapterBridge,
  createWalletClient,
  createWalletKit,
  resolveAppMetadata,
  getSharedTronWeb,
  WALLET_ICONS
} from "../src/index";
import { resetWalletProviderDiscoveryForTests } from "../src/injected/eip6963";

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
      account: { address: "T2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", network: TRON_NILE },
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

function installMock6963Provider(rdns: string): void {
  const target = new EventTarget();
  const announce = (eventName: string) => {
    const event = new Event(eventName) as Event & { detail?: unknown };
    event.detail = { info: { rdns }, provider: { request: async () => undefined } };
    target.dispatchEvent(event);
  };
  target.addEventListener("eip6963:requestProvider", () => announce("eip6963:announceProvider"));
  target.addEventListener("TIP6963:requestProvider", () => announce("TIP6963:announceProvider"));
  const globals = globalThis as unknown as Record<string, unknown>;
  globals.addEventListener = target.addEventListener.bind(target);
  globals.removeEventListener = target.removeEventListener.bind(target);
  globals.dispatchEvent = target.dispatchEvent.bind(target);
}

describe("client entrypoints", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).tokenpocket;
    delete (globalThis as Record<string, unknown>).okxwallet;
    delete (globalThis as Record<string, unknown>).bitkeep;
    delete (globalThis as Record<string, unknown>).bitget;
    delete (globalThis as Record<string, unknown>).bitgetWallet;
    delete (globalThis as Record<string, unknown>).BitgetWallet;
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
    delete (globalThis as Record<string, unknown>).mathwallet;
    delete (globalThis as Record<string, unknown>).mathWallet;
    delete (globalThis as Record<string, unknown>).MathWallet;
    delete (globalThis as Record<string, unknown>).isBitKeep;
    delete (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest;
    delete (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).addEventListener;
    delete (globalThis as Record<string, unknown>).removeEventListener;
    delete (globalThis as Record<string, unknown>).dispatchEvent;
    resetWalletProviderDiscoveryForTests();
  });

  it("creates a WalletManager with registered adapters", async () => {
    const manager = createWalletClient({ adapters: [createMockAdapter()] });

    await expect(manager.connect("mock")).resolves.toMatchObject({
      account: { address: "T2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
      network: { id: "nile" }
    });
    expect(manager.getAccount()?.address).toBe("T2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
  });

  it("resolves app metadata with metadata preferred over legacy aliases", () => {
    expect(
      resolveAppMetadata({
        metadata: {
          name: "TRX Domains",
          description: "Primary description",
          url: "https://trxdomains.xyz",
          icons: [" https://trxdomains.xyz/icon.png "]
        },
        appName: "Legacy App",
        appDescription: "Legacy description",
        appUrl: "https://legacy.example",
        appIcons: ["https://legacy.example/icon.png"]
      })
    ).toEqual({
      name: "TRX Domains",
      description: "Primary description",
      url: "https://trxdomains.xyz",
      icons: ["https://trxdomains.xyz/icon.png"]
    });
  });

  it("uses legacy app metadata aliases when metadata is not provided", () => {
    expect(
      resolveAppMetadata({
        appName: "Legacy TRON App",
        appDescription: "Legacy wallet connection",
        appUrl: "https://legacy.example",
        appIcons: ["https://legacy.example/icon.png"]
      })
    ).toEqual({
      name: "Legacy TRON App",
      description: "Legacy wallet connection",
      url: "https://legacy.example",
      icons: ["https://legacy.example/icon.png"]
    });
  });

  it("creates a kit with TRON-native transaction helpers", async () => {
    (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest = {
      trx: {
        sendRawTransaction: async (transaction: Record<string, unknown>) => ({ txid: transaction.txID ?? "broadcast-hash" })
      },
      transactionBuilder: {
        sendTrx: async (to: string, amountSun: number, from?: string) => ({
          txID: "trx-built-hash",
          raw_data_hex: "raw",
          to,
          amountSun,
          from
        })
      },
      setAddress: () => undefined,
      contract: () => ({ at: async () => ({}) })
    };
    const kit = createWalletKit({ adapters: [createMockAdapter()] });

    await kit.manager.connect("mock");
    await expect(kit.signMessage("hello")).resolves.toMatchObject({ proof: "signed:hello" });
    await expect(kit.sendTransaction({ txID: "tx" })).resolves.toMatchObject({ hash: "tx" });
    await expect(kit.transferTrx({ to: "T3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", amountSun: 1n })).resolves.toMatchObject({
      hash: "trx-built-hash"
    });
    expect(kit.manager.getTransactions()[0]?.methodHint).toBe("transferTrx");
  });

  it("resolves transaction previews before signing and sending", async () => {
    const previews: string[] = [];
    (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest = {
      trx: {
        sendRawTransaction: async (transaction: Record<string, unknown>) => ({ txid: transaction.txID ?? "preview-hash" })
      },
      transactionBuilder: {
        sendTrx: async (to: string, amountSun: number, from?: string) => ({
          txID: "preview-trx-hash",
          raw_data_hex: "raw",
          to,
          amountSun,
          from
        }),
        triggerSmartContract: async () => ({
          result: { result: true },
          transaction: {
            txID: "preview-contract-hash",
            contractAddress: "T4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            functionSelector: "transfer(address,uint256)"
          }
        })
      },
      setAddress: () => undefined,
      contract: () => ({ at: async () => ({}) })
    };
    const kit = createWalletKit({
      adapters: [createMockAdapter()],
      transactionPreview: async (_request, context) => {
        previews.push(`${context.methodHint}:${context.defaultPreview.summary}`);
      }
    });

    await kit.manager.connect("mock");
    await kit.transferTrx({ to: "T3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", amountSun: 1_500_000 });
    await kit.triggerSmartContract({
      contractAddress: "T4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      functionSelector: "transfer(address,uint256)",
      parameters: []
    });

    expect(previews).toEqual([
      "transferTrx:Transfer 1.5 TRX to T3AAAA...AAAAAA.",
      "triggerSmartContract:Call transfer(address,uint256)."
    ]);
  });

  it("cancels transaction signing when preview confirmation is rejected", async () => {
    const adapter = createMockAdapter();
    const signTransaction = vi.fn(adapter.signTransaction);
    const kit = createWalletKit({
      adapters: [{ ...adapter, signTransaction }],
      transactionPreview: {
        confirm: async () => false
      }
    });

    await kit.manager.connect("mock");
    await expect(kit.signAndSendTransaction({ txID: "cancelled-hash" })).rejects.toMatchObject({ code: "USER_REJECTED" });
    expect(signTransaction).not.toHaveBeenCalled();
  });

  it("builds, signs, and broadcasts triggerSmartContract transactions", async () => {
    const calls = {
      triggerSmartContract: [] as unknown[][]
    };
    (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest = {
      trx: {
        sendRawTransaction: async (transaction: Record<string, unknown>) => ({ txID: transaction.txID })
      },
      transactionBuilder: {
        triggerSmartContract: async (...args: unknown[]) => {
          calls.triggerSmartContract.push(args);
          return {
            result: { result: true },
            transaction: {
              txID: "contract-hash",
              raw_data_hex: "raw-contract"
            }
          };
        }
      },
      setAddress: () => undefined,
      contract: () => ({ at: async () => ({}) })
    };
    const kit = createWalletKit({ adapters: [createMockAdapter()] });

    await kit.manager.connect("mock");
    await expect(
      kit.triggerSmartContract({
        contractAddress: "T4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        function: "buyDomain(string,string)",
        options: { feeLimit: 100_000_000 },
        parameter: [
          { type: "string", value: "alice" },
          { type: "string", value: "trx" }
        ],
        description: "Buy alice.trx"
      })
    ).resolves.toMatchObject({ hash: "contract-hash" });

    expect(calls.triggerSmartContract[0]).toEqual([
      "T4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "buyDomain(string,string)",
      { feeLimit: 100_000_000 },
      [
        { type: "string", value: "alice" },
        { type: "string", value: "trx" }
      ],
      "T2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    ]);
    expect(kit.manager.getTransactions()[0]).toMatchObject({
      hash: "contract-hash",
      methodHint: "triggerSmartContract"
    });
  });

  it("applies a default feeLimit and retries once when a built transaction expires", async () => {
    const calls = {
      triggerSmartContract: [] as unknown[][],
      sendRawTransaction: [] as Array<Record<string, unknown>>
    };
    (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest = {
      trx: {
        sendRawTransaction: async (transaction: Record<string, unknown>) => {
          calls.sendRawTransaction.push(transaction);
          if (calls.sendRawTransaction.length === 1) {
            return { result: false, code: "TRANSACTION_EXPIRATION_ERROR", message: "Transaction expired" };
          }
          return { result: true, txid: transaction.txID };
        }
      },
      transactionBuilder: {
        triggerSmartContract: async (...args: unknown[]) => {
          calls.triggerSmartContract.push(args);
          return {
            result: { result: true },
            transaction: {
              txID: `contract-hash-${calls.triggerSmartContract.length}`,
              raw_data_hex: "raw-contract"
            }
          };
        }
      },
      setAddress: () => undefined,
      contract: () => ({ at: async () => ({}) })
    };
    const kit = createWalletKit({ adapters: [createMockAdapter()] });

    await kit.manager.connect("mock");
    await expect(
      kit.triggerSmartContract({
        contractAddress: "T4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        functionSelector: "buyDomain(string,string)",
        parameters: []
      })
    ).resolves.toMatchObject({ hash: "contract-hash-2" });

    expect(calls.triggerSmartContract).toHaveLength(2);
    expect(calls.triggerSmartContract[0]?.[2]).toEqual({ feeLimit: 100_000_000 });
    expect(calls.sendRawTransaction).toHaveLength(2);
  });

  it("rejects failed broadcast results without treating the unsigned txID as success", async () => {
    (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest = {
      trx: {
        sendRawTransaction: async () => ({ result: false, code: "OUT_OF_ENERGY", message: "OUT_OF_ENERGY" })
      },
      setAddress: () => undefined,
      contract: () => ({ at: async () => ({}) })
    };
    const kit = createWalletKit({ adapters: [createMockAdapter()] });

    await kit.manager.connect("mock");
    await expect(kit.sendRawTransaction({ txID: "unsigned-fallback" })).rejects.toMatchObject({
      code: "OUT_OF_ENERGY"
    });
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
      address: "T2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      domain: "alice.trx",
      displayName: "alice.trx",
      avatar: "https://trxdomains.xyz/avatar.png"
    });
  });

  it("merges concurrent identity and balance refreshes into the latest session", async () => {
    let resolveIdentity: ((value: { domain: string; displayName: string }) => void) | undefined;
    let resolveBalance: ((value: string) => void) | undefined;
    const identityPromise = new Promise<{ domain: string; displayName: string }>((resolve) => {
      resolveIdentity = resolve;
    });
    const balancePromise = new Promise<string>((resolve) => {
      resolveBalance = resolve;
    });
    const kit = createWalletKit({
      adapters: [createMockAdapter()],
      identity: {
        enabled: true,
        resolver: async () => identityPromise
      },
      balance: {
        resolver: async () => balancePromise
      }
    });

    await kit.manager.connect("mock");
    const identityRefresh = kit.refreshIdentity();
    const balanceRefresh = kit.refreshBalance();
    resolveBalance?.("42");
    await expect(balanceRefresh).resolves.toMatchObject({ formatted: "42", symbol: "TRX" });
    resolveIdentity?.({ domain: "alice.trx", displayName: "Alice" });
    await expect(identityRefresh).resolves.toMatchObject({ domain: "alice.trx" });

    expect(kit.getSession()).toMatchObject({
      account: { domain: "alice.trx", displayName: "Alice" },
      balance: { formatted: "42", symbol: "TRX" }
    });
  });

  it("deduplicates concurrent identity refresh requests", async () => {
    let calls = 0;
    let resolveIdentity: ((value: { domain: string; displayName: string }) => void) | undefined;
    const identityPromise = new Promise<{ domain: string; displayName: string }>((resolve) => {
      resolveIdentity = resolve;
    });
    const kit = createWalletKit({
      adapters: [createMockAdapter()],
      identity: {
        enabled: true,
        resolver: async () => {
          calls += 1;
          return identityPromise;
        }
      }
    });

    await kit.manager.connect("mock");
    const first = kit.refreshIdentity();
    const second = kit.refreshIdentity();
    resolveIdentity?.({ domain: "alice.trx", displayName: "Alice" });

    await expect(first).resolves.toMatchObject({ domain: "alice.trx" });
    await expect(second).resolves.toMatchObject({ domain: "alice.trx" });
    expect(calls).toBe(1);
  });

  it("cooldowns identity refresh after rate limit errors", async () => {
    let calls = 0;
    const kit = createWalletKit({
      adapters: [createMockAdapter()],
      identity: {
        enabled: true,
        resolver: async () => {
          calls += 1;
          throw new Error("429 Too Many Requests");
        }
      }
    });

    await kit.manager.connect("mock");
    await expect(kit.refreshIdentity()).resolves.toBeUndefined();
    await expect(kit.refreshIdentity()).resolves.toBeUndefined();
    expect(calls).toBe(1);
  });

  it("does not cache a missing identity result from the first refresh", async () => {
    let calls = 0;
    const kit = createWalletKit({
      adapters: [createMockAdapter()],
      identity: {
        enabled: true,
        resolver: async () => {
          calls += 1;
          return calls === 1 ? undefined : { domain: "retry.trx", displayName: "retry.trx" };
        }
      }
    });

    await kit.manager.connect("mock");
    await expect(kit.refreshIdentity()).resolves.toBeUndefined();
    await expect(kit.refreshIdentity()).resolves.toMatchObject({ domain: "retry.trx" });
    expect(calls).toBe(2);
    expect(kit.getSession()?.account.domain).toBe("retry.trx");
  });

  it("does not pin the first test identity TronWeb as the shared instance", async () => {
    const first = createMockTronDomainTronWeb({ reverseOf: "first.trx" }).tronWeb;
    const second = createMockTronDomainTronWeb({ reverseOf: "second.trx" }).tronWeb;
    (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest = first;
    await expect(getSharedTronWeb(undefined, TRON_MAINNET, "tronlink")).resolves.toBe(first);

    (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest = second;
    await expect(getSharedTronWeb(undefined, TRON_MAINNET, "trust")).resolves.toBe(second);
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

    const identity = await resolver({ address: "T2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }, { network: TRON_MAINNET, walletId: "mock" });

    expect(identity?.domain).toBe("bob.sun");
    expect(identity?.displayName).toBe("bob.sun");
    expect(calls.genTokenId).toEqual(["bob.sun"]);
  });

  it("skips TRX Domains identity outside mainnet without touching the contract", async () => {
    const { tronWeb, calls } = createMockTronDomainTronWeb({ reverseOf: "alice.trx" });
    (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest = tronWeb;
    const resolver = createTronDomainIdentityResolver({ metadataKeys: [] });

    await expect(resolver({ address: "T2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }, { network: TRON_NILE, walletId: "mock" })).resolves.toBeUndefined();
    expect(calls.at).toEqual([]);
    expect(calls.reverseOf).toEqual([]);
  });

  it("times out slow TRX Domains contract reads without blocking UI", async () => {
    const { tronWeb } = createMockTronDomainTronWeb({ neverResolveReverse: true });
    (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest = tronWeb;
    const resolver = createTronDomainIdentityResolver({ metadataKeys: [], timeoutMs: 5 });

    await expect(resolver({ address: "T2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }, { network: TRON_MAINNET, walletId: "mock" })).resolves.toBeUndefined();
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
      "math",
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
      "math",
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
      "klever",
      "math",
      "binance",
      "safepal",
      "guarda",
      "onekey",
      "backpack",
      "ledger",
      "walletconnect"
    ]);
    expect(BUILTIN_WALLET_DESCRIPTORS.every((wallet) => wallet.homepage && wallet.platforms.length > 0)).toBe(true);
    expect(BUILTIN_WALLET_DESCRIPTORS.find((wallet) => wallet.id === "klever")).toMatchObject({ integration: "walletconnect", supportsWalletConnect: true });
    expect(BUILTIN_WALLET_DESCRIPTORS.find((wallet) => wallet.id === "math")).toMatchObject({
      integration: "injected",
      supportsWalletConnect: true
    });
  });

  it("enables Klever as a WalletConnect-routed catalog wallet without a duplicate adapter", () => {
    const manager = createWalletClient({ walletConnectProjectId: "project" });
    const adapterIds = manager.getWallets().map((wallet) => wallet.metadata.id);
    const catalog = buildCatalog(BUILTIN_WALLET_DESCRIPTORS);
    const wallets = mergeWalletOptionsWithCatalog(
      manager.getWallets().map((wallet): WalletOptionViewModel => ({
        id: wallet.metadata.id,
        adapterId: wallet.metadata.id,
        name: wallet.metadata.name,
        readyState: "found",
        ...(wallet.metadata.type ? { transport: wallet.metadata.type } : {}),
        capabilities: wallet.capabilities.connect && wallet.metadata.id === "walletconnect" ? ["qr"] : []
      })),
      undefined,
      catalog
    );
    const klever = wallets.find((wallet) => wallet.id === "klever");

    expect(adapterIds).not.toContain("klever");
    expect(adapterIds).toContain("walletconnect");
    expect(catalog.find((wallet) => wallet.id === "klever")).toMatchObject({
      id: "klever",
      transport: "extension",
      supportsWalletConnect: true,
      icon: WALLET_ICONS.klever
    });
    expect(klever).toMatchObject({
      id: "klever",
      adapterId: "walletconnect",
      readyState: "found",
      transport: "qr",
      available: true,
      badge: { label: "QR CODE", tone: "qr" }
    });
  });

  it("enables MathWallet as a TronWeb-compatible injected wallet", async () => {
    (globalThis as Record<string, unknown>).mathwallet = {
      isMathWallet: true,
      tronLink: {
        request: async () => ({ code: 200 }),
        tronWeb: {
          defaultAddress: { base58: "T5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", hex: "41math" },
          trx: {
            getBlockByNumber: async () => ({ blockID: "000000000000000000000000000000000000000000000000000000002b6653dc" }),
            signMessageV2: async (message: string) => `math:${message}`,
            sign: async <TTransaction,>(transaction: TTransaction) => transaction
          }
        }
      }
    };
    const manager = createWalletClient({ wallets: ["math"], walletConnectProjectId: "project" });
    const adapterIds = manager.getWallets().map((wallet) => wallet.metadata.id);
    const catalog = buildCatalog(BUILTIN_WALLET_DESCRIPTORS);

    expect(adapterIds).toEqual(["math"]);
    expect(catalog.find((wallet) => wallet.id === "math")).toMatchObject({
      id: "math",
      name: "MathWallet",
      transport: "extension",
      supportsWalletConnect: true,
      icon: WALLET_ICONS.math
    });
    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("math")).resolves.toMatchObject({ account: { address: "T5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", hexAddress: "41math" } });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "math:hello" });
  });

  it("does not mark MathWallet installed from generic tronLink globals", async () => {
    (globalThis as Record<string, unknown>).tronLink = {
      request: async () => ({ code: 200 }),
      tronWeb: {
        defaultAddress: { base58: "T6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", hex: "41tronlink" },
        trx: {
          getBlockByNumber: async () => ({ blockID: "000000000000000000000000000000000000000000000000000000002b6653dc" }),
          signMessageV2: async (message: string) => `tronlink:${message}`,
          sign: async <TTransaction,>(transaction: TTransaction) => transaction
        }
      }
    };

    const manager = createWalletClient({ wallets: ["math"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(false);
  });

  it("ships Ledger as a default hardware bridge descriptor", async () => {
    const manager = createWalletClient({ wallets: ["ledger"] });
    const [ledger] = manager.getWallets();
    const catalog = buildCatalog(BUILTIN_WALLET_DESCRIPTORS);
    const packageJson = await import("../package.json", { with: { type: "json" } });

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
    expect(packageJson.default.dependencies).toHaveProperty("@tronweb3/tronwallet-adapter-ledger");
    expect(packageJson.default.peerDependencies ?? {}).not.toHaveProperty("@tronweb3/tronwallet-adapter-ledger");
  });

  it("keeps OneKey availability probing on-demand to avoid cross-wallet provider conflicts", () => {
    const manager = createWalletClient({ wallets: ["onekey"] });
    const [onekey] = manager.getWallets();

    expect(onekey?.metadata).toMatchObject({
      id: "onekey",
      availabilityMode: "on-demand"
    });
  });

  it("resolves builtin wallet icons from the client generated icon map", () => {
    const catalog = buildCatalog(BUILTIN_WALLET_DESCRIPTORS);

    for (const wallet of BUILTIN_WALLET_DESCRIPTORS) {
      expect(WALLET_ICONS[wallet.id], wallet.id).toMatch(/^data:image\/(?:svg\+xml|png|jpeg|webp);base64,/);
      const catalogItem = catalog.find((item) => item.id === wallet.id);
      if (wallet.enabled === false) {
        expect(catalogItem, wallet.id).toBeUndefined();
      } else {
        expect(catalogItem?.icon, wallet.id).toBe(WALLET_ICONS[wallet.id]);
      }
    }
  });

  it("keeps wallet catalog data in client descriptors instead of the deprecated core registry", () => {
    const catalog = buildCatalog(BUILTIN_WALLET_DESCRIPTORS);

    expect(catalog.find((wallet) => wallet.id === "tronlink")).toMatchObject({
      name: "TronLink",
      transport: "extension",
      platforms: ["extension", "mobile"]
    });
    expect(catalog.find((wallet) => wallet.id === "trust")).toMatchObject({
      supportsWalletConnect: true
    });
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
            defaultAddress: { base58: "T7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
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
    await expect(manager.connect("safepal-test")).resolves.toMatchObject({ account: { address: "T7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
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
      "math",
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

  it("hydrates descriptor catalog metadata onto wallet adapters for UI mapping", () => {
    const wallets = createWalletClient({ walletConnectProjectId: "project" }).getWallets();
    const trust = wallets.find((wallet) => wallet.metadata.id === "trust");
    const binance = wallets.find((wallet) => wallet.metadata.id === "binance");
    const walletConnect = wallets.find((wallet) => wallet.metadata.id === "walletconnect");

    expect(trust?.metadata.catalog).toMatchObject({
      conflictMarkers: ["trustwallet"],
      supportsWalletConnect: true
    });
    expect(binance?.metadata.catalog).toMatchObject({
      providerPaths: ["binancew3w.tron"],
      conflictMarkers: ["binancew3w"],
      supportsWalletConnect: true
    });
    expect(walletConnect?.metadata.catalog).toMatchObject({ supportsWalletConnect: true });
    expect(mapAdapterToWalletOption(trust as WalletAdapter, false)).toMatchObject({
      supportsWalletConnect: true
    });
    expect(trust?.metadata.catalog?.providerPaths).toBeUndefined();
    expect(mapAdapterToWalletOption(trust as WalletAdapter, false).providerPaths).toBeUndefined();
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
              defaultAddress: { base58: "T8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", hex: "41tronlink" },
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
    await expect(manager.connect("tronlink")).resolves.toMatchObject({ account: { address: "T8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
  });

  it("connects an injected extension adapter through a wallet-specific provider", async () => {
    const provider = {
      tronWeb: {
        defaultAddress: { base58: "T9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", hex: "41token" },
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
      account: { address: "T9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
      network: { id: "nile" }
    });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "tp:hello" });
  });

  it("falls back from tron_requestAccounts to eth_requestAccounts for injected extension providers", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "tron_requestAccounts") throw new Error("method not supported");
      if (method === "eth_requestAccounts") return ["TAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"];
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
              defaultAddress: { base58: "TBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
              trx: {
                getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" })
              }
            }
          })
        })
      ]
    });

    await expect(manager.connect("legacy-injected")).resolves.toMatchObject({
      account: { address: "TAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }
    });
    expect(request).toHaveBeenNthCalledWith(1, { method: "tron_requestAccounts" });
    expect(request).toHaveBeenNthCalledWith(2, { method: "eth_requestAccounts" });
  });

  it("does not use generic tronWeb when an injected descriptor declares only wallet-specific roots", async () => {
    (globalThis as Record<string, unknown>).tronWeb = {
      defaultAddress: { base58: "TCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
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

    await expect(Promise.resolve(manager.getWallets()[0]?.detect?.())).resolves.toBe(false);
    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(false);
    await expect(manager.connect("strict-injected")).rejects.toMatchObject({
      code: "WALLET_NOT_FOUND"
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
    const tokenPocketProvider = makeProvider("T9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    const okxProvider = makeProvider("TDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    const bitgetProvider = makeProvider("TEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    (globalThis as typeof globalThis & { tokenpocket?: unknown }).tokenpocket = { tron: tokenPocketProvider };
    (globalThis as typeof globalThis & { okxwallet?: unknown }).okxwallet = { tronLink: okxProvider };
    (globalThis as typeof globalThis & { bitkeep?: unknown }).bitkeep = { tronLink: bitgetProvider };

    const manager = createWalletClient({ wallets: ["tokenpocket", "okx", "bitget"] });

    await expect(Promise.resolve(manager.getWallets().find((wallet) => wallet.metadata.id === "tokenpocket")?.isAvailable?.())).resolves.toBe(true);
    await expect(Promise.resolve(manager.getWallets().find((wallet) => wallet.metadata.id === "okx")?.isAvailable?.())).resolves.toBe(true);
    await expect(Promise.resolve(manager.getWallets().find((wallet) => wallet.metadata.id === "bitget")?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("okx")).resolves.toMatchObject({ account: { address: "TDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
    await manager.disconnect();
    await expect(manager.connect("bitget")).resolves.toMatchObject({ account: { address: "TEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
  });

  it("reads Bitget addresses from parent tronWeb after a successful request", async () => {
    const request = vi.fn(async () => ({ code: 200 }));
    (globalThis as typeof globalThis & { bitkeep?: unknown }).bitkeep = {
      tronLink: { request },
      tronWeb: {
        defaultAddress: { base58: "TFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", hex: "41bitget" },
        trx: {
          getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" }),
          getBalance: async () => "123000000"
        }
      }
    };

    const kit = createWalletKit({ wallets: ["bitget"] });

    await expect(kit.manager.connect("bitget")).resolves.toMatchObject({
      account: { address: "TFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", hexAddress: "41bitget" }
    });
    await expect(kit.refreshBalance()).resolves.toMatchObject({ formatted: "123", symbol: "TRX" });
    expect(request).not.toHaveBeenCalled();
  });

  it("uses Bitget installed markers without a connect-ready provider", async () => {
    (globalThis as Record<string, unknown>).bitkeep = {};

    const manager = createWalletClient({ wallets: ["bitget"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.detect?.())).resolves.toBe(true);
    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("bitget")).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });
  });

  it("accepts Bitget eth_requestAccounts when the extension returns the TRON address there", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => (method === "eth_requestAccounts" ? ["TGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"] : undefined));
    (globalThis as typeof globalThis & { bitkeep?: unknown }).bitkeep = {
      tronLink: {
        request,
        tronWeb: {
          trx: {
            getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" })
          }
        }
      }
    };

    const manager = createWalletClient({ wallets: ["bitget"] });

    await expect(manager.connect("bitget")).resolves.toMatchObject({ account: { address: "TGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
    expect(request).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
  });

  it("uses global Bitget markers when the extension exposes TronLink-shaped globals", async () => {
    const request = vi.fn(async () => ({ code: 200 }));
    Object.assign(globalThis, {
      isBitKeep: true,
      tronLink: { request },
      tronWeb: {
        defaultAddress: { base58: "THAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
        trx: {
          getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" })
        }
      }
    });

    const manager = createWalletClient({ wallets: ["bitget"] });

    await expect(Promise.resolve(manager.getWallets().find((wallet) => wallet.metadata.id === "bitget")?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("bitget")).resolves.toMatchObject({ account: { address: "THAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
  });

  it("does not crash Bitget availability when injected extension getters throw", async () => {
    const bitgetLikeProvider = {
      request: vi.fn(async () => ({ code: 200 })),
      tronWeb: {
        defaultAddress: { base58: "TJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
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
    await expect(manager.connect("bitget")).resolves.toMatchObject({ account: { address: "TJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
  });

  it("keeps Bitget injected request bound to the original provider object", async () => {
    const bitgetLikeProvider = {
      logger: {
        debug: vi.fn()
      },
      tronWeb: {
        trx: {
          getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" })
        }
      },
      async request(this: { logger?: { debug?: (message: string) => void }; tronWeb?: { defaultAddress?: { base58: string } } }, { method }: { method: string }) {
        this.logger?.debug?.(method);
        this.tronWeb = { ...this.tronWeb, defaultAddress: { base58: "TKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } };
        return { code: 200 };
      }
    };
    (globalThis as typeof globalThis & { bitkeep?: unknown }).bitkeep = { tronLink: bitgetLikeProvider };

    const manager = createWalletClient({ wallets: ["bitget"] });

    await expect(manager.connect("bitget")).resolves.toMatchObject({ account: { address: "TKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
    expect(bitgetLikeProvider.logger.debug).toHaveBeenCalledWith("eth_requestAccounts");
  });

  it("uses the Trust-specific injected provider instead of shared TronLink globals", async () => {
    const trustProvider = {
      request: async () => ({ address: "TLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }),
      tronWeb: {
        defaultAddress: { base58: "TLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
        trx: {
          getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" })
        }
      }
    };
    const tronLinkProvider = {
      isTronLink: true,
      request: async () => ({ code: 200, message: "ok" }),
      tronWeb: {
        defaultAddress: { base58: "T8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
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
    await expect(manager.connect("trust")).resolves.toMatchObject({ account: { address: "TLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
  });

  it("uses Guarda tron request with parent tronWeb to resolve an address", async () => {
    const guardaTronWeb = {
      defaultAddress: { base58: "TMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
      trx: {
        getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" })
      }
    };
    (globalThis as Record<string, unknown>).guarda = {
      tron: {
        request: async ({ method }: { method: string }) => (method === "eth_requestAccounts" ? ["TNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"] : [])
      },
      tronWeb: guardaTronWeb
    };

    const manager = createWalletClient({ wallets: ["guarda"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("guarda")).resolves.toMatchObject({ account: { address: "TNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
  });

  it("connects FoxWallet through its wallet-specific injected provider", async () => {
    (globalThis as Record<string, unknown>).foxwallet = {
      tronLink: {
        request: async () => ({ code: 200 }),
        tronWeb: {
          defaultAddress: { base58: "TPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
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
    await expect(manager.connect("foxwallet")).resolves.toMatchObject({ account: { address: "TPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "fox:hello" });
  });

  it("connects FoxWallet when request or tronWeb live on the parent object", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => (method === "tron_requestAccounts" ? { code: 200 } : undefined));
    (globalThis as Record<string, unknown>).foxwallet = {
      request,
      tronLink: {},
      tronWeb: {
        defaultAddress: { base58: "TQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
        trx: {
          getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" }),
          signMessageV2: async (message: string) => `fox-parent:${message}`
        }
      }
    };

    const manager = createWalletClient({ wallets: ["foxwallet"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("foxwallet")).resolves.toMatchObject({ account: { address: "TQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "fox-parent:hello" });
    expect(request).toHaveBeenCalledWith({ method: "tron_requestAccounts" });
  });

  it("connects SafePal through SafePalHook and the global tronWeb", async () => {
    const request = vi.fn(async () => ({ code: 200 }));
    (globalThis as Record<string, unknown>).SafePalHook = {
      request,
      defaultAddress: { base58: "TRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", hex: "41safepal" }
    };
    (globalThis as Record<string, unknown>).tronWeb = {
      trx: {
        getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" }),
        sign: async (payload: unknown) => (typeof payload === "string" ? `safepal:${payload}` : payload)
      }
    };

    const manager = createWalletClient({ wallets: ["safepal"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("safepal")).resolves.toMatchObject({ account: { address: "TRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "safepal:hello" });
    expect(request).toHaveBeenCalledWith({ method: "tron_requestAccounts" });
  });

  it("prefers SafePalHook-owned address over an empty foreign global tronWeb address", async () => {
    const request = vi.fn(async () => ({ code: 200 }));
    (globalThis as Record<string, unknown>).SafePalHook = {
      request,
      defaultAddress: { base58: "TRBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB", hex: "41safepalhook" },
      tronWeb: {
        defaultAddress: { base58: "TRBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB", hex: "41safepalhook" },
        trx: {
          getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "2b6653dc" }),
          sign: async (payload: unknown) => (typeof payload === "string" ? `safepal-hook:${payload}` : payload)
        }
      }
    };
    (globalThis as Record<string, unknown>).tronWeb = {
      defaultAddress: { base58: false, hex: false },
      trx: {
        getBlockByNumber: async () => ({ blockID: "0".repeat(56) + "94a9059e" }),
        sign: async (payload: unknown) => (typeof payload === "string" ? `foreign:${payload}` : payload)
      }
    };

    const manager = createWalletClient({ wallets: ["safepal"] });

    await expect(manager.connect("safepal")).resolves.toMatchObject({
      account: { address: "TRBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB", hexAddress: "41safepalhook" },
      network: { id: "mainnet" }
    });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "safepal-hook:hello" });
  });

  it("marks SafePal installed from SafePalHook even before tronWeb is ready", async () => {
    (globalThis as Record<string, unknown>).SafePalHook = {
      request: vi.fn(async () => ({ code: 200 })),
      defaultAddress: { base58: "TSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }
    };

    const manager = createWalletClient({ wallets: ["safepal"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.detect?.())).resolves.toBe(true);
    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("safepal")).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });
  });

  it("connects SafePal when defaultAddress is populated after approval", async () => {
    const safePalHook: Record<string, unknown> = {};
    const request = vi.fn(async () => {
      safePalHook.defaultAddress = { base58: "TTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", hex: "41after" };
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
      account: { address: "TTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", hexAddress: "41after" }
    });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "safepal-late:hello" });
  });

  it("connects SafePal in-app when address is already available and no request method is exposed", async () => {
    (globalThis as Record<string, unknown>).SafePalHook = {
      defaultAddress: { base58: "TUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", hex: "41inapp" }
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
      account: { address: "TUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", hexAddress: "41inapp" }
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
    const gateProvider = {
      ...makeProvider("TVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
      request: vi.fn(async ({ method }: { method: string }) => (
        method === "eth_requestAccounts" ? ["TVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"] : undefined
      )),
      on: vi.fn(),
      off: vi.fn()
    };
    const bybitProvider = makeProvider("TWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    const binanceProvider = {
      getAccount: vi.fn(async () => ({ address: "TXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" })),
      getChainId: vi.fn(() => "0x2b6653dc"),
      signMessageV2: vi.fn(async (message: string) => `TBinance:${message}`),
      signTransaction: vi.fn(async <TTransaction,>(transaction: TTransaction) => transaction)
    };
    const oneKeyProvider = makeProvider("TYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    const backpackProvider = makeProvider("TZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = { tronLink: {}, tron: gateProvider };
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
    await expect(manager.connect("gate")).resolves.toMatchObject({ account: { address: "TVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
    await manager.disconnect();
    await expect(manager.connect("bybit")).resolves.toMatchObject({ account: { address: "TWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
    await manager.disconnect();
    await expect(manager.connect("binance")).resolves.toMatchObject({ account: { address: "TXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
    await manager.disconnect();
    await expect(manager.connect("backpack")).resolves.toMatchObject({ account: { address: "TZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
  });

  it("composes Backpack request provider with global tronWeb when the branch omits tronWeb", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => (
      method === "tron_requestAccounts" ? ["TbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"] : undefined
    ));
    (globalThis as typeof globalThis & { backpack?: unknown; tronWeb?: unknown }).backpack = {
      tron: { request }
    };
    (globalThis as typeof globalThis & { tronWeb?: unknown }).tronWeb = {
      defaultAddress: { base58: "TbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", hex: "41backpack" },
      trx: {
        signMessageV2: async (message: string) => `backpack:${message}`,
        sign: async <TTransaction,>(transaction: TTransaction) => transaction
      }
    };

    const manager = createWalletClient({ wallets: ["backpack"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("backpack")).resolves.toMatchObject({
      account: { address: "TbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", hexAddress: "41backpack" }
    });
    expect(request).toHaveBeenCalledWith({ method: "tron_requestAccounts", params: undefined });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "backpack:hello" });
  });

  it("marks Gate available from its upstream installed marker before provider is connect-ready", async () => {
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = {
      tronLink: {}
    };

    const manager = createWalletClient({ wallets: ["gate"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
  });

  it("connects Gate through the lightweight injected extension shape", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => (
      method === "eth_requestAccounts" ? ["TaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"] : undefined
    ));
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = {
      tronLink: {},
      tron: {
        request,
        on: vi.fn(),
        off: vi.fn(),
        tronWeb: {
          trx: {
            signMessageV2: async (message: string) => `gate-injected:${message}`,
            sign: async <TTransaction,>(transaction: TTransaction) => transaction
          },
          transactionBuilder: {
            sendTrx: async () => ({ txID: "gate-official-tx" })
          }
        }
      }
    };

    const manager = createWalletClient({ wallets: ["gate"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
    await expect(manager.connect("gate")).resolves.toMatchObject({
      account: { address: "TaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }
    });
    expect(request).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "gate-injected:hello" });
  });

  it("uses Gate injected request result when both request and defaultAddress are present", async () => {
    const request = vi.fn(async () => ["TbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"]);
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = {
      tronLink: {},
      tron: {
        request,
        on: vi.fn(),
        off: vi.fn(),
        tronWeb: {
          defaultAddress: { base58: "TcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
          trx: {
            signMessageV2: async (message: string) => `gate-connected:${message}`,
            sign: async <TTransaction,>(transaction: TTransaction) => transaction
          }
        }
      }
    };

    const manager = createWalletClient({ wallets: ["gate"] });

    await expect(manager.connect("gate")).resolves.toMatchObject({
      account: { address: "TbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }
    });
    expect(request).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
    await expect(manager.signMessage("hello")).resolves.toMatchObject({ proof: "gate-connected:hello" });
  });

  it("connects Gate when the address hydrates after an empty approval response", async () => {
    const gateTron = {
      request: vi.fn(async ({ method }: { method: string }) => {
        if (method !== "eth_requestAccounts") return undefined;
        setTimeout(() => {
          gateTron.tronWeb.defaultAddress = { base58: "TdAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" };
        }, 10);
        return { code: 200 };
      }),
      on: vi.fn(),
      off: vi.fn(),
      tronWeb: {
        defaultAddress: null as { base58: string } | null,
        trx: {
          signMessageV2: async (message: string) => `gate-hydrated:${message}`,
          sign: async <TTransaction,>(transaction: TTransaction) => transaction
        }
      }
    };
    (globalThis as typeof globalThis & { gatewallet?: unknown }).gatewallet = {
      tronLink: {},
      tron: gateTron
    };

    const manager = createWalletClient({ wallets: ["gate"] });

    await expect(manager.connect("gate")).resolves.toMatchObject({
      account: { address: "TdAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }
    });
    expect(gateTron.request).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
  });

  it("does not mark Gate installed from OneKey or generic ethereum markers", async () => {
    (globalThis as typeof globalThis & { $onekey?: unknown }).$onekey = {
      tron: {
        request: vi.fn(),
        tronWeb: { defaultAddress: { base58: "TYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } }
      }
    };
    (globalThis as typeof globalThis & { ethereum?: unknown }).ethereum = {
      providers: [
        { info: { name: "OneKey", rdns: "so.onekey.wallet" }, isOneKey: true },
        { info: { name: "Gate Wallet", rdns: "io.gate.wallet" }, request: vi.fn() }
      ]
    };
    (globalThis as typeof globalThis & { gateWallet?: unknown }).gateWallet = {
      tron: {}
    };
    const manager = createWalletClient({ wallets: ["gate", "onekey"] });

    await expect(Promise.resolve(manager.getWallets().find((wallet) => wallet.metadata.id === "gate")?.isAvailable?.())).resolves.toBe(false);
    await expect(Promise.resolve(manager.getWallets().find((wallet) => wallet.metadata.id === "onekey")?.isAvailable?.())).resolves.toBe(true);
  }, 8000);

  it("does not mark Trust installed from namespace-only desktop globals", async () => {
    (globalThis as typeof globalThis & { trustwallet?: unknown }).trustwallet = {
      tron: {},
      tronLink: {}
    };
    const manager = createWalletClient({ wallets: ["trust"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(false);
  });

  it("marks Trust installed only when a usable TRON provider exists", async () => {
    (globalThis as typeof globalThis & { trustwallet?: unknown }).trustwallet = {
      tron: {
        request: vi.fn(),
        tronWeb: {
          defaultAddress: { base58: "TgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
          trx: {}
        }
      }
    };
    const manager = createWalletClient({ wallets: ["trust"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
  });

  it("does not mark Binance installed from namespace-only globals", async () => {
    (globalThis as typeof globalThis & { binancew3w?: unknown }).binancew3w = {
      tron: {}
    };
    const manager = createWalletClient({ wallets: ["binance"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(false);
  });

  it("marks Binance installed only when the TRON account API exists", async () => {
    (globalThis as typeof globalThis & { binancew3w?: unknown }).binancew3w = {
      tron: {
        getAccount: vi.fn(async () => ({ address: "ThAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }))
      }
    };
    const manager = createWalletClient({ wallets: ["binance"] });

    await expect(Promise.resolve(manager.getWallets()[0]?.isAvailable?.())).resolves.toBe(true);
  });

  it("uses shared 6963 rdns discovery as an installed signal without enabling Trust desktop false positives", async () => {
    installMock6963Provider("com.okex.wallet");
    const manager = createWalletClient({ wallets: ["okx", "trust"] });
    const okx = manager.getWallets().find((wallet) => wallet.metadata.id === "okx");
    const trust = manager.getWallets().find((wallet) => wallet.metadata.id === "trust");

    await expect(Promise.resolve(okx?.isAvailable?.())).resolves.toBe(true);
    await expect(Promise.resolve(trust?.isAvailable?.())).resolves.toBe(false);
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
          tronWeb: { defaultAddress: { base58: "TeAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } }
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
        tronweb3Adapter.address = "TfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
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
      account: { address: "TfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }
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
            getBalance: async (address: string) => (address === "T2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" ? "42500000" : "0")
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

  it("falls back to shared RPC TronWeb when injected balance provider is not ready", async () => {
    (globalThis as Record<string, unknown>).__tronWalletKitTronWebForTest = {
      trx: {
        getBalance: async (address: string) => (address === "T2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" ? "99000000" : "0")
      },
      setAddress: () => undefined,
      contract: () => ({ at: async () => ({}) })
    };
    const kit = createWalletKit({ adapters: [createMockAdapter()] });

    await kit.manager.connect("mock");
    await expect(kit.refreshBalance()).resolves.toMatchObject({ formatted: "99", symbol: "TRX" });
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
