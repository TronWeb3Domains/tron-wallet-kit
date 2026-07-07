import { describe, expect, it } from "vitest";
import { createTronLinkAdapter } from "../src/index";

function createLegacyProvider() {
  return {
    kind: "legacy" as const,
    provider: {
      ready: true,
      tronWeb: {
        defaultAddress: {
          base58: "TMockAddress",
          hex: "41mock"
        },
        fullNode: { host: "https://api.trongrid.io" },
        solidityNode: { host: "https://api.trongrid.io" },
        eventServer: { host: "https://api.trongrid.io" },
        trx: {
          getBlockByNumber: async () => ({
            blockID: "000000000000000000000000000000000000000000000000000000002b6653dc"
          }),
          sign: async <TTransaction extends Record<string, unknown>>(transaction: TTransaction) => ({
            ...transaction,
            signature: ["signed-transaction"]
          }),
          signMessageV2: async (message: string) => `signed:${message}`,
          sendTransaction: async () => ({ txid: "tx-123" })
        }
      },
      request: async () => ({ code: 200 as const, message: "ok" })
    }
  };
}

function createTronWeb() {
  return createLegacyProvider().provider.tronWeb;
}

describe("TronLinkAdapter", () => {
  it("exposes TronLink metadata and object capabilities", () => {
    const adapter = createTronLinkAdapter();

    expect(adapter.metadata.id).toBe("tronlink");
    expect(adapter.metadata.icon).toMatch(/^data:image\/svg\+xml,/);
    expect(adapter.metadata.homepage).toBe("https://www.tronlink.org/");
    expect(adapter.metadata.type).toBe("extension");
    expect(adapter.capabilities.signTransaction).toBe(true);
    expect(adapter.capabilities.transferTrx).toBe(true);
  });

  it("connects through legacy TronLink and resolves network", async () => {
    const adapter = createTronLinkAdapter({ provider: createLegacyProvider });
    const result = await adapter.connect();

    expect(result.account.address).toBe("TMockAddress");
    expect(result.account.hexAddress).toBe("41mock");
    expect(result.network?.id).toBe("mainnet");
    expect(result.network?.networkType).toBe("MAINNET");
  });

  it("connects through TIP-1193 TronLink when tronWeb appears after authorization", async () => {
    const tronWeb = createTronWeb();
    const provider = {
      kind: "tip1193" as const,
      provider: {
        isTronLink: true,
        tronWeb: false as false | typeof tronWeb,
        request: async () => {
          provider.provider.tronWeb = tronWeb;
          return ["TMockAddress"];
        }
      }
    };
    const adapter = createTronLinkAdapter({ provider: () => provider });

    await expect(adapter.connect()).resolves.toMatchObject({
      account: { address: "TMockAddress" },
      network: { id: "mainnet" }
    });
  });

  it("detects legacy TronLink when tronWeb is injected globally", async () => {
    const globalObject = globalThis as typeof globalThis & {
      tronLink?: unknown;
      tronWeb?: unknown;
    };
    const previousTronLink = globalObject.tronLink;
    const previousTronWeb = globalObject.tronWeb;

    globalObject.tronLink = {
      isTronLink: true,
      request: async () => ({ code: 200 as const, message: "ok" })
    };
    globalObject.tronWeb = createTronWeb();

    try {
      const adapter = createTronLinkAdapter();
      await expect(adapter.isAvailable()).resolves.toBe(true);
      await expect(adapter.connect()).resolves.toMatchObject({
        account: { address: "TMockAddress" },
        network: { id: "mainnet" }
      });
    } finally {
      globalObject.tronLink = previousTronLink;
      globalObject.tronWeb = previousTronWeb;
    }
  });

  it("signs messages and transactions after connect", async () => {
    const adapter = createTronLinkAdapter({ provider: createLegacyProvider });
    await adapter.connect();

    await expect(adapter.signMessage({ message: "hello" })).resolves.toMatchObject({
      signatureKind: "signature",
      proof: "signed:hello"
    });
    await expect(adapter.signTransaction({ transaction: { txID: "tx" } })).resolves.toMatchObject({
      transaction: { txID: "tx", signature: ["signed-transaction"] },
      signature: "signed-transaction",
      signed: true
    });
  });

  it("submits TRX and returns normalized transaction hash", async () => {
    const adapter = createTronLinkAdapter({ provider: createLegacyProvider });
    await adapter.connect();

    await expect(
      adapter.submitTransaction({ methodHint: "transferTrx", transaction: { to: "TReceiver", amountSun: 1n } })
    ).resolves.toMatchObject({
      hash: "tx-123",
      status: "submitted"
    });
  });

  it("normalizes user rejection", async () => {
    const adapter = createTronLinkAdapter({
      provider: () => ({
        ...createLegacyProvider(),
        provider: {
          ...createLegacyProvider().provider,
          request: async () => ({ code: 4001 as const, message: "rejected" })
        }
      })
    });

    await expect(adapter.connect()).rejects.toMatchObject({ code: "USER_REJECTED" });
  });

  it("waits briefly for TronLink provider injection", async () => {
    let available = false;
    const adapter = createTronLinkAdapter({
      checkTimeoutMs: 80,
      checkIntervalMs: 10,
      provider: () => (available ? createLegacyProvider() : undefined)
    });

    setTimeout(() => {
      available = true;
    }, 20);

    await expect(adapter.isAvailable()).resolves.toBe(true);
  });

  it("detects marked legacy TronLink even when another TRON wallet is installed", async () => {
    const globalObject = globalThis as typeof globalThis & {
      tron?: unknown;
      tronLink?: unknown;
      tronWeb?: unknown;
      okxwallet?: unknown;
    };
    const previousTron = globalObject.tron;
    const previousTronLink = globalObject.tronLink;
    const previousTronWeb = globalObject.tronWeb;
    const previousOkxWallet = globalObject.okxwallet;

    globalObject.tron = { request: async () => [], tronWeb: createTronWeb() };
    globalObject.tronLink = {
      isTronLink: true,
      request: async () => ({ code: 200 as const, message: "ok" })
    };
    globalObject.tronWeb = createTronWeb();
    globalObject.okxwallet = { tronLink: createLegacyProvider().provider };

    try {
      const adapter = createTronLinkAdapter({ checkTimeoutMs: 0 });
      await expect(adapter.isAvailable()).resolves.toBe(true);
      await expect(adapter.connect()).resolves.toMatchObject({
        account: { address: "TMockAddress" },
        network: { id: "mainnet" }
      });
    } finally {
      globalObject.tron = previousTron;
      globalObject.tronLink = previousTronLink;
      globalObject.tronWeb = previousTronWeb;
      globalObject.okxwallet = previousOkxWallet;
    }
  });

  it("detects ready legacy TronLink even when another TRON wallet is installed", async () => {
    const globalObject = globalThis as typeof globalThis & {
      tronLink?: unknown;
      tronWeb?: unknown;
      tokenpocket?: unknown;
    };
    const previousTronLink = globalObject.tronLink;
    const previousTronWeb = globalObject.tronWeb;
    const previousTokenPocket = globalObject.tokenpocket;
    const tronWeb = { ...createTronWeb(), ready: true };

    globalObject.tronLink = {
      ready: true,
      request: async () => ({ code: 200 as const, message: "ok" })
    };
    globalObject.tronWeb = tronWeb;
    globalObject.tokenpocket = { tron: createLegacyProvider().provider };

    try {
      const adapter = createTronLinkAdapter({ checkTimeoutMs: 0 });
      await expect(adapter.isAvailable()).resolves.toBe(true);
      await expect(adapter.connect()).resolves.toMatchObject({
        account: { address: "TMockAddress" },
        network: { id: "mainnet" }
      });
    } finally {
      globalObject.tronLink = previousTronLink;
      globalObject.tronWeb = previousTronWeb;
      globalObject.tokenpocket = previousTokenPocket;
    }
  });

  it("detects desktop TronLink through TIP-6963 provider announcement", async () => {
    const previousWindow = (globalThis as typeof globalThis & { window?: unknown }).window;
    const eventTarget = new EventTarget() as EventTarget & {
      tron?: unknown;
      tronLink?: unknown;
      tronWeb?: unknown;
      dispatchEvent(event: Event): boolean;
    };
    const tronWeb = createTronWeb();
    const provider = {
      isTronLink: true,
      tronWeb,
      request: async () => ["TMockAddress"]
    };
    const originalDispatchEvent = eventTarget.dispatchEvent.bind(eventTarget);
    eventTarget.dispatchEvent = (event: Event) => {
      const result = originalDispatchEvent(event);
      if (event.type === "TIP6963:requestProvider") {
        setTimeout(() => {
          originalDispatchEvent(
            new CustomEvent("TIP6963:announceProvider", {
              detail: {
                info: { name: "TronLink" },
                provider
              }
            })
          );
        }, 0);
      }
      return result;
    };
    (globalThis as unknown as Record<string, unknown>).window = eventTarget;

    try {
      const adapter = createTronLinkAdapter({ checkTimeoutMs: 80, checkIntervalMs: 10 });
      await expect(adapter.isAvailable()).resolves.toBe(true);
      await expect(adapter.connect()).resolves.toMatchObject({
        account: { address: "TMockAddress" },
        network: { id: "mainnet" }
      });
    } finally {
      (globalThis as unknown as Record<string, unknown>).window = previousWindow;
    }
  });

  it("does not treat TokenPocket-style globals as TronLink", async () => {
    const globalObject = globalThis as typeof globalThis & {
      tronLink?: unknown;
      tokenpocket?: unknown;
    };
    const previousTronLink = globalObject.tronLink;
    const previousTokenPocket = globalObject.tokenpocket;
    const tokenPocketProvider = createLegacyProvider().provider;

    globalObject.tronLink = tokenPocketProvider;
    globalObject.tokenpocket = { tron: tokenPocketProvider };

    try {
      await expect(createTronLinkAdapter({ checkTimeoutMs: 0 }).isAvailable()).resolves.toBe(false);
    } finally {
      globalObject.tronLink = previousTronLink;
      globalObject.tokenpocket = previousTokenPocket;
    }
  });

  it("does not treat TokenPocket-linked tronLink globals as TronLink", async () => {
    const globalObject = globalThis as typeof globalThis & {
      tronLink?: unknown;
      tokenpocket?: unknown;
    };
    const previousTronLink = globalObject.tronLink;
    const previousTokenPocket = globalObject.tokenpocket;
    const tokenPocketTronWeb = createTronWeb();
    const tokenPocketProvider = {
      request: async () => ({ code: 200 as const, message: "ok" }),
      tronWeb: tokenPocketTronWeb
    };

    globalObject.tronLink = tokenPocketProvider;
    globalObject.tokenpocket = { tronWeb: tokenPocketTronWeb, tron: { tronWeb: tokenPocketTronWeb } };

    try {
      await expect(createTronLinkAdapter({ checkTimeoutMs: 0 }).isAvailable()).resolves.toBe(false);
    } finally {
      globalObject.tronLink = previousTronLink;
      globalObject.tokenpocket = previousTokenPocket;
    }
  });

  it("does not treat TokenPocket-linked tip1193 tron globals as TronLink even with a marker", async () => {
    const globalObject = globalThis as typeof globalThis & {
      tron?: unknown;
      tokenpocket?: unknown;
    };
    const previousTron = globalObject.tron;
    const previousTokenPocket = globalObject.tokenpocket;
    const tokenPocketTronWeb = createTronWeb();
    const tokenPocketProvider = {
      isTronLink: true,
      request: async () => ["TTokenPocket"],
      tronWeb: tokenPocketTronWeb
    };

    globalObject.tron = tokenPocketProvider;
    globalObject.tokenpocket = { tron: tokenPocketProvider, tronWeb: tokenPocketTronWeb };

    try {
      await expect(createTronLinkAdapter({ checkTimeoutMs: 0 }).isAvailable()).resolves.toBe(false);
    } finally {
      globalObject.tron = previousTron;
      globalObject.tokenpocket = previousTokenPocket;
    }
  });

  it("does not treat generic tron globals as legacy TronLink without a TronLink provider path", async () => {
    const globalObject = globalThis as typeof globalThis & {
      tron?: unknown;
      tronLink?: unknown;
    };
    const previousTron = globalObject.tron;
    const previousTronLink = globalObject.tronLink;

    globalObject.tron = { request: async () => [], tronWeb: createLegacyProvider().provider.tronWeb };
    globalObject.tronLink = { request: async () => ({ code: 200 as const, message: "ok" }) };

    try {
      await expect(createTronLinkAdapter({ checkTimeoutMs: 0 }).isAvailable()).resolves.toBe(false);
    } finally {
      globalObject.tron = previousTron;
      globalObject.tronLink = previousTronLink;
    }
  });
});
