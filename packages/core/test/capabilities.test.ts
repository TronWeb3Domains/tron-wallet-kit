import { describe, expect, it } from "vitest";
import { NetworkRegistry, TRON_MAINNET, TRON_NILE, WalletManager, type WalletAdapter } from "../src/index";

describe("core primitives", () => {
  it("resolves default TRON networks", () => {
    const registry = new NetworkRegistry();

    expect(registry.resolve("mainnet")).toEqual(TRON_MAINNET);
    expect(registry.resolve("nile")).toEqual(TRON_NILE);
  });

  it("reads object capabilities from registered adapters", () => {
    const adapter: WalletAdapter = {
      metadata: { id: "mock", name: "Mock" },
      capabilities: { connect: true, signMessage: true },
      connect: async () => ({ account: { address: "TMock" } })
    };
    const manager = new WalletManager({ adapters: [adapter] });

    expect(manager.can("connect", "mock")).toBe(true);
    expect(manager.can("signTransaction", "mock")).toBe(false);
  });
});
