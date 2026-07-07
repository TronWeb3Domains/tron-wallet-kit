import { describe, expect, it, vi } from "vitest";
import { MemoryWalletStorage, TRON_MAINNET, WalletKitError, WalletManager, normalizeWalletError, type WalletAdapter, type WalletSession } from "../src/index";

function createAdapter(): WalletAdapter {
  return {
    metadata: {
      id: "mock",
      name: "Mock Wallet",
      type: "extension"
    },
    capabilities: {
      connect: true,
      disconnect: true,
      signMessage: true,
      signTransaction: true,
      submitTransaction: true
    },
    connect: async (options) => ({
      account: {
        address: "TMockAddress",
        ...(typeof options.network === "object" && options.network ? { network: options.network } : {})
      }
    }),
    restoreSession: async (session) => ({ account: session.account, network: session.network, session }),
    disconnect: async () => undefined,
    signMessage: async ({ message }) => ({
      signatureKind: "signature",
      signature: `signed:${message}`,
      proof: `signed:${message}`
    }),
    signTransaction: async ({ transaction }) => ({
      transaction: {
        ...transaction,
        signature: ["tx-signature"]
      },
      signature: "tx-signature",
      signed: true
    }),
    submitTransaction: async () => ({ hash: "tx-123" })
  };
}

function createStoredSession(overrides: Partial<WalletSession> = {}): WalletSession {
  return {
    id: "mock:TStoredAddress",
    adapterId: "mock",
    walletName: "Mock Wallet",
    account: { address: "TStoredAddress" },
    network: TRON_MAINNET,
    connectedAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides
  };
}

describe("WalletManager", () => {
  it("connects adapters and stores a normalized TRON session", async () => {
    const manager = new WalletManager({ adapters: [createAdapter()] });
    const session = await manager.connect("mock", { network: TRON_MAINNET });

    expect(session.account.address).toBe("TMockAddress");
    expect(session.account.network?.id).toBe("mainnet");
    expect(manager.getSession()?.walletName).toBe("Mock Wallet");
  });

  it("does not persist circular raw provider objects after connect", async () => {
    const storage = new MemoryWalletStorage();
    const circularProvider: Record<string, unknown> = { name: "provider" };
    circularProvider.tronWeb = { provider: circularProvider };
    const adapter: WalletAdapter = {
      ...createAdapter(),
      connect: async (options) => ({
        account: {
          address: "TCircular",
          ...(typeof options.network === "object" && options.network ? { network: options.network } : {})
        },
        raw: circularProvider,
        session: {
          metadata: {
            safe: "yes",
            provider: circularProvider
          }
        }
      })
    };
    const manager = new WalletManager({ adapters: [adapter], storage });

    await expect(manager.connect("mock", { network: TRON_MAINNET })).resolves.toMatchObject({
      account: { address: "TCircular" }
    });
    const stored = await storage.getItem("session");

    expect(stored).toContain('"safe":"yes"');
    expect(stored).not.toContain("tronWeb");
    expect(manager.getSession()?.metadata).not.toHaveProperty("raw");
  });

  it("emits connected after session_restored during autoReconnect", async () => {
    const storage = new MemoryWalletStorage();
    const first = new WalletManager({ adapters: [createAdapter()], storage });
    await first.connect("mock", { network: TRON_MAINNET });

    const second = new WalletManager({
      adapters: [createAdapter()],
      autoReconnect: true,
      storage
    });
    const events: string[] = [];
    second.on("session_restored", () => events.push("session_restored"));
    second.on("connected", () => events.push("connected"));

    await second.autoReconnect();

    expect(events).toEqual(["session_restored", "connected"]);
  });

  it("normalizes signing and transaction lifecycle events", async () => {
    const manager = new WalletManager({ adapters: [createAdapter()] });
    await manager.connect("mock", { network: TRON_MAINNET });
    const txEvents: string[] = [];
    manager.on("tx_submitted", ({ transaction }) => txEvents.push(transaction.hash));

    await expect(manager.signMessage({ message: "hello" })).resolves.toMatchObject({
      signatureKind: "signature",
      proof: "signed:hello"
    });
    await expect(manager.submitTransaction({ transaction: { raw_data: {} } })).resolves.toEqual({
      hash: "tx-123"
    });

    expect(manager.getTransactions()[0]?.hash).toBe("tx-123");
    expect(txEvents).toEqual(["tx-123"]);
  });

  it("forwards adapter account, network, and disconnect callbacks into manager state", async () => {
    let onAccountChanged: ((address: string) => void) | undefined;
    let onNetworkChanged: ((network: typeof TRON_MAINNET) => void) | undefined;
    let onDisconnect: (() => void) | undefined;
    const adapter: WalletAdapter = {
      ...createAdapter(),
      connect: async (options) => {
        onAccountChanged = options.onAccountChanged;
        onNetworkChanged = options.onNetworkChanged;
        onDisconnect = options.onDisconnect;
        return {
          account: {
            address: "TInitialAddress",
            ...(typeof options.network === "object" && options.network ? { network: options.network } : {})
          }
        };
      }
    };
    const manager = new WalletManager({ adapters: [adapter], network: TRON_MAINNET });
    const events: string[] = [];
    manager.on("accountChanged", ({ session }) => events.push(`account:${session!.account.address}`));
    manager.on("networkChanged", ({ session }) => events.push(`network:${session!.network.id}`));
    manager.on("disconnected", () => events.push("disconnect"));

    await manager.connect("mock");
    onAccountChanged?.("TNextAddress");
    onNetworkChanged?.({ ...TRON_MAINNET, id: "custom", name: "Custom", networkType: "CUSTOM" });
    onDisconnect?.();

    expect(manager.getSession()?.account.address).toBe("TNextAddress");
    expect(manager.getSession()?.network.id).toBe("custom");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(manager.getSession()).toBeNull();
    expect(events).toEqual(["account:TNextAddress", "network:custom", "disconnect"]);
  });

  it("times out a pending connect and resets for a later connect", async () => {
    const timeoutAdapter: WalletAdapter = {
      ...createAdapter(),
      connect: async () => new Promise(() => undefined)
    };
    const manager = new WalletManager({ adapters: [timeoutAdapter] });

    await expect(manager.connect("mock", { timeoutMs: 5 })).rejects.toMatchObject({ code: "REQUEST_TIMEOUT" });
    await expect(manager.connect("mock", { timeoutMs: 50 })).rejects.toMatchObject({ code: "REQUEST_TIMEOUT" });
  });

  it("cancels a pending connection when another wallet is selected", async () => {
    let firstSignal: AbortSignal | undefined;
    let cancelled = false;
    const first: WalletAdapter = {
      ...createAdapter(),
      metadata: { id: "first", name: "First Wallet" },
      connect: async (options) => {
        firstSignal = options.signal;
        return new Promise((_, reject) => {
          options.signal?.addEventListener("abort", () => reject(new Error("cancelled")));
        });
      },
      cancelPendingConnection: async () => {
        cancelled = true;
      }
    };
    const second: WalletAdapter = {
      ...createAdapter(),
      metadata: { id: "second", name: "Second Wallet" }
    };
    const manager = new WalletManager({ adapters: [first, second] });
    const staleReasons: string[] = [];
    manager.on("session_stale", ({ reason }) => {
      if (reason) staleReasons.push(reason);
    });

    const firstConnect = manager.connect("first").catch((error) => error);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await expect(manager.connect("second")).resolves.toMatchObject({ adapterId: "second" });
    const firstError = await firstConnect;

    expect(firstSignal?.aborted).toBe(true);
    expect(cancelled).toBe(true);
    expect(firstError).toMatchObject({ code: "USER_REJECTED" });
    expect(staleReasons).toContain("connection_cancelled");
  });

  it("clears local state when disconnect times out", async () => {
    vi.useFakeTimers();
    const adapter: WalletAdapter = {
      ...createAdapter(),
      disconnect: async () => new Promise(() => undefined)
    };
    const manager = new WalletManager({ adapters: [adapter] });
    const staleReasons: string[] = [];
    manager.on("session_stale", ({ reason }) => {
      if (reason) staleReasons.push(reason);
    });
    await manager.connect("mock");

    const disconnect = manager.disconnect();
    await vi.advanceTimersByTimeAsync(2_000);
    await disconnect;
    vi.useRealTimers();

    expect(manager.getSession()).toBeNull();
    expect(manager.getTransactions()).toEqual([]);
    expect(staleReasons).toContain("disconnect_timeout");
  });

  it("deduplicates concurrent autoReconnect calls", async () => {
    const storage = new MemoryWalletStorage();
    const first = new WalletManager({ adapters: [createAdapter()], storage });
    await first.connect("mock", { network: TRON_MAINNET });
    let restoreCount = 0;
    const adapter: WalletAdapter = {
      ...createAdapter(),
      restoreSession: async (session) => {
        restoreCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 0));
        return { account: session.account, network: session.network, session };
      }
    };
    const manager = new WalletManager({ adapters: [adapter], autoReconnect: true, storage });

    const firstReconnect = manager.autoReconnect();
    const secondReconnect = manager.autoReconnect();
    await expect(Promise.all([firstReconnect, secondReconnect])).resolves.toHaveLength(2);

    expect(restoreCount).toBe(1);
  });

  it("restores a stale cached session when an adapter has no restoreSession", async () => {
    const storage = new MemoryWalletStorage();
    const session = createStoredSession();
    await storage.setItem("session", JSON.stringify({ version: 1, session, updatedAt: Date.now() }));
    const { restoreSession: _restoreSession, ...adapterWithoutRestore } = createAdapter();
    const adapter: WalletAdapter = {
      ...adapterWithoutRestore,
      isAvailable: async () => true
    };
    const manager = new WalletManager({ adapters: [adapter], autoReconnect: true, storage });
    const restored: boolean[] = [];
    manager.on("session_restored", ({ stale }) => restored.push(Boolean(stale)));

    await expect(manager.autoReconnect()).resolves.toMatchObject({ account: { address: "TStoredAddress" } });

    expect(restored).toEqual([true]);
  });

  it("expires invalid or stale stored sessions", async () => {
    const storage = new MemoryWalletStorage();
    await storage.setItem("session", JSON.stringify({ version: 1, session: createStoredSession({ expiresAt: Date.now() - 1 }), updatedAt: Date.now() }));
    const manager = new WalletManager({ adapters: [createAdapter()], autoReconnect: true, storage });
    let expired = 0;
    manager.on("session_expired", () => {
      expired += 1;
    });

    await expect(manager.autoReconnect()).resolves.toBeNull();

    expect(expired).toBe(1);
    expect(await storage.getItem("session")).toBeNull();
  });

  it("migrates a legacy unversioned stored session", async () => {
    const storage = new MemoryWalletStorage();
    await storage.setItem("session", JSON.stringify(createStoredSession()));
    const manager = new WalletManager({ adapters: [createAdapter()], autoReconnect: true, storage });

    await expect(manager.autoReconnect()).resolves.toMatchObject({ account: { address: "TStoredAddress" } });
  });

  it("recovers pending return sessions when no stored session exists", async () => {
    let attempts = 0;
    const adapter: WalletAdapter = {
      ...createAdapter(),
      canRecoverSession: async () => true,
      recoverSession: async () => {
        attempts += 1;
        return attempts === 2 ? { account: { address: "TRecoveredAddress" }, network: TRON_MAINNET } : null;
      }
    };
    const manager = new WalletManager({ adapters: [adapter], autoReconnect: true, recoveryRetryDelaysMs: [0, 0] });
    const connecting: boolean[] = [];
    manager.on("connecting", ({ recovering }) => connecting.push(Boolean(recovering)));

    await expect(manager.autoReconnect()).resolves.toMatchObject({ account: { address: "TRecoveredAddress" } });

    expect(attempts).toBe(2);
    expect(connecting).toEqual([true]);
  });

  it("emits stale after exhausted recovery attempts", async () => {
    const adapter: WalletAdapter = {
      ...createAdapter(),
      recoverSession: async () => null
    };
    const manager = new WalletManager({ adapters: [adapter], autoReconnect: true, recoveryRetryDelaysMs: [0, 0] });
    const stale: Array<{ reason?: string; attempts?: number }> = [];
    manager.on("session_stale", (payload) => stale.push(payload));

    await expect(manager.autoReconnect()).resolves.toBeNull();

    expect(stale).toContainEqual({ reason: "recover_unavailable", attempts: 2 });
  });

  it("removes listeners and cancels pending work on destroy", async () => {
    let cancelCount = 0;
    const adapter: WalletAdapter = {
      ...createAdapter(),
      connect: async () => new Promise(() => undefined),
      cancelPendingConnection: async () => {
        cancelCount += 1;
      }
    };
    const manager = new WalletManager({ adapters: [adapter] });
    const connected = vi.fn();
    manager.on("connected", connected);

    void manager.connect("mock");
    await new Promise((resolve) => setTimeout(resolve, 0));
    manager.destroy();
    manager.events.emit("connected", { session: createStoredSession() });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(cancelCount).toBe(1);
    expect(connected).not.toHaveBeenCalled();
  });

  it("normalizes common wallet errors", () => {
    expect(normalizeWalletError(new Error("User rejected request"))).toMatchObject({ code: "USER_REJECTED" });
    expect(normalizeWalletError(new Error("request timed out"))).toMatchObject({ code: "REQUEST_TIMEOUT" });
    expect(normalizeWalletError(new Error("wallet not installed"))).toMatchObject({ code: "WALLET_UNAVAILABLE" });
    expect(normalizeWalletError(new WalletKitError("CUSTOM", "Custom"))).toMatchObject({ code: "CUSTOM" });
  });
});
