import { describe, expect, it } from "vitest";
import { MemoryWalletStorage, TRON_MAINNET, WalletManager, type WalletAdapter } from "../src/index";

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
});
