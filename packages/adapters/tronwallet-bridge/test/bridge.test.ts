import { describe, expect, it } from "vitest";
import { TRON_MAINNET, WalletKitError, type ConnectOptions, type TransactionPayload } from "@tron-wallet-kit/core";
import { createLazyTronwalletBridgeAdapter, createTronwalletBridgeAdapter, mapChainToNetwork, type TronwalletBridgeInnerAdapter } from "../src/index";

class MockTronwalletAdapter implements TronwalletBridgeInnerAdapter {
  name = "Mock Tronwallet";
  url = "https://wallet.example";
  icon = "data:image/svg+xml,%3Csvg%3E%3C/svg%3E";
  readyState = "Found";
  address: string | null = "TMockAddress";
  listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  connectedWith: unknown;
  disconnected = false;
  rejectConnect = false;

  async connect(options?: unknown): Promise<void> {
    this.connectedWith = options;
    if (this.rejectConnect) {
      const error = new Error("User rejected request");
      (error as Error & { code?: number }).code = 4001;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.disconnected = true;
  }

  async signMessage(message: string): Promise<string> {
    return `signed:${message}`;
  }

  async signTransaction<TTransaction extends TransactionPayload>(transaction: TTransaction): Promise<TTransaction> {
    return { ...transaction, signature: ["tx-signature"] };
  }

  on(event: string, listener: (...args: unknown[]) => void): void {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);
  }

  off(event: string, listener: (...args: unknown[]) => void): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((listener) => listener(...args));
  }
}

describe("tronwallet bridge adapter", () => {
  it("maps metadata, capabilities, and readyState", async () => {
    const inner = new MockTronwalletAdapter();
    const adapter = createTronwalletBridgeAdapter(inner, {
      id: "okx",
      metadata: { name: "OKX Wallet" }
    });

    expect(adapter.metadata).toMatchObject({
      id: "okx",
      name: "OKX Wallet",
      homepage: "https://wallet.example",
      downloadUrl: "https://wallet.example",
      type: "extension"
    });
    expect(adapter.capabilities.signMessage).toBe(true);
    expect(adapter.capabilities.signTransaction).toBe(true);
    expect(await adapter.isAvailable?.()).toBe(true);

    inner.readyState = "NotFound";
    expect(await adapter.isAvailable?.()).toBe(false);
  });

  it("connects and restores a session from the wrapped adapter", async () => {
    const inner = new MockTronwalletAdapter();
    const adapter = createTronwalletBridgeAdapter(inner, { id: "mock" });

    const result = await adapter.connect({ network: TRON_MAINNET, metadata: { app: "test" } });

    expect(inner.connectedWith).toEqual({ app: "test" });
    expect(result.account.address).toBe("TMockAddress");
    expect(result.network?.id).toBe("mainnet");
    await expect(
      adapter.restoreSession?.({
        id: "mock:TMockAddress",
        adapterId: "mock",
        walletName: "Mock",
        account: result.account,
        network: TRON_MAINNET,
        connectedAt: 1,
        updatedAt: 1
      })
    ).resolves.toMatchObject({ account: { address: "TMockAddress" } });
  });

  it("normalizes user rejection", async () => {
    const inner = new MockTronwalletAdapter();
    inner.rejectConnect = true;
    const adapter = createTronwalletBridgeAdapter(inner, { id: "mock" });

    await expect(adapter.connect({ network: TRON_MAINNET })).rejects.toMatchObject({ code: "USER_REJECTED" });
  });

  it("maps signMessage and signTransaction results", async () => {
    const inner = new MockTronwalletAdapter();
    const adapter = createTronwalletBridgeAdapter(inner, { id: "mock" });

    await expect(adapter.signMessage?.({ message: "hello" })).resolves.toMatchObject({
      signatureKind: "signature",
      signature: "signed:hello",
      proof: "signed:hello"
    });
    await expect(adapter.signTransaction?.({ transaction: { txID: "tx" } })).resolves.toMatchObject({
      signed: true,
      signature: "tx-signature",
      transaction: { txID: "tx", signature: ["tx-signature"] }
    });
  });

  it("signs then broadcasts transactions through tronWeb", async () => {
    const inner = new MockTronwalletAdapter();
    const sent: TransactionPayload[] = [];
    const adapter = createTronwalletBridgeAdapter(inner, {
      id: "mock",
      tronWeb: {
        trx: {
          sendRawTransaction: async (transaction) => {
            sent.push(transaction);
            return { txid: "tx-123" };
          }
        }
      }
    });

    await expect(adapter.submitTransaction?.({ transaction: { txID: "unsigned" } })).resolves.toMatchObject({
      hash: "tx-123",
      status: "submitted"
    });
    expect(sent[0]).toMatchObject({ txID: "unsigned", signature: ["tx-signature"] });
  });

  it("forwards events and cleans listeners on disconnect", async () => {
    const inner = new MockTronwalletAdapter();
    const adapter = createTronwalletBridgeAdapter(inner, { id: "mock" });
    const events: string[] = [];
    const options: ConnectOptions = {
      network: TRON_MAINNET,
      onAccountChanged: (address) => events.push(`account:${address}`),
      onNetworkChanged: (network) => events.push(`network:${network.id}`),
      onDisconnect: () => events.push("disconnect")
    };

    await adapter.connect(options);
    inner.emit("accountsChanged", "TNextAddress");
    inner.emit("chainChanged", { chainId: "0xcd8690dc" });
    inner.emit("disconnect");
    await adapter.disconnect?.();
    inner.emit("accountsChanged", "TAfterCleanup");

    expect(events).toEqual(["account:TNextAddress", "network:nile", "disconnect"]);
    expect(inner.disconnected).toBe(true);
  });

  it("maps known TRON chain IDs", () => {
    expect(mapChainToNetwork("0x2b6653dc").id).toBe("mainnet");
    expect(mapChainToNetwork({ chainId: "0x94a9059e" }).id).toBe("shasta");
    expect(mapChainToNetwork({ chainId: "0xcd8690dc" }).id).toBe("nile");
    expect(mapChainToNetwork("0x0").id).toBe("unknown");
  });

  it("loads wrapped adapters lazily and keeps metadata stable before load", async () => {
    const inner = new MockTronwalletAdapter();
    let importCount = 0;
    const adapter = createLazyTronwalletBridgeAdapter({
      id: "okx",
      metadata: { name: "OKX Wallet", homepage: "https://www.okx.com/web3" },
      importer: async () => {
        importCount += 1;
        return inner;
      }
    });

    expect(adapter.metadata).toMatchObject({
      id: "okx",
      name: "OKX Wallet",
      homepage: "https://www.okx.com/web3"
    });
    expect(importCount).toBe(0);
    await expect(adapter.isAvailable?.()).resolves.toBe(true);
    await expect(adapter.connect({ network: TRON_MAINNET })).resolves.toMatchObject({
      account: { address: "TMockAddress" }
    });
    expect(importCount).toBe(1);
  });

  it("marks lazy adapters unavailable when the wallet package cannot be loaded", async () => {
    const adapter = createLazyTronwalletBridgeAdapter({
      id: "missing",
      metadata: { name: "Missing Wallet" },
      importer: async () => {
        throw new Error("Cannot find package");
      }
    });

    await expect(adapter.isAvailable?.()).resolves.toBe(false);
    await expect(adapter.connect({ network: TRON_MAINNET })).rejects.toMatchObject({ code: "CONNECTION_FAILED" });
  });

  it("waits briefly for lazy adapters to leave Loading before checking availability", async () => {
    const inner = new MockTronwalletAdapter();
    inner.readyState = "Loading";
    const adapter = createLazyTronwalletBridgeAdapter({
      id: "metamask",
      metadata: { name: "MetaMask" },
      availabilityTimeoutMs: 50,
      importer: async () => inner
    });

    const availablePromise = adapter.isAvailable?.();
    setTimeout(() => {
      inner.readyState = "Found";
      inner.emit("readyStateChanged", "Found");
    }, 10);

    await expect(availablePromise).resolves.toBe(true);
  });

  it("requires tronWeb for broadcast", async () => {
    const adapter = createTronwalletBridgeAdapter(new MockTronwalletAdapter(), { id: "mock" });

    await expect(adapter.submitTransaction?.({ transaction: { txID: "tx" } })).rejects.toBeInstanceOf(WalletKitError);
    await expect(adapter.submitTransaction?.({ transaction: { txID: "tx" } })).rejects.toMatchObject({
      code: "SEND_TRANSACTION_FAILED"
    });
  });
});
