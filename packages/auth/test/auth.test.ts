import { describe, expect, it } from "vitest";
import { TRON_MAINNET, WalletManager, type WalletAdapter } from "@tron-wallet-kit/core";
import { createAuthMessage, createTronAuthenticationAdapter, createWalletAuth } from "../src/index";

function createAdapter(): WalletAdapter {
  return {
    metadata: { id: "mock", name: "Mock Wallet" },
    capabilities: { connect: true, signMessage: true },
    connect: async () => ({
      account: { address: "TAuthAddress", network: TRON_MAINNET },
      network: TRON_MAINNET
    }),
    signMessage: async ({ message }) => ({
      signatureKind: "signature",
      signature: `signed:${message}`,
      proof: `signed:${message}`
    })
  };
}

describe("createAuthMessage", () => {
  it("creates a TRON sign-in message", () => {
    const message = createAuthMessage({
      domain: "example.com",
      address: "TExample",
      nonce: "nonce-1",
      issuedAt: "2026-07-03T00:00:00.000Z",
    });

    expect(message).toContain("TRON account");
    expect(message).toContain("TExample");
    expect(message).toContain("Nonce: nonce-1");
  });

  it("runs nonce, message, sign, and verify through the auth controller", async () => {
    const manager = new WalletManager({ adapters: [createAdapter()], network: TRON_MAINNET });
    await manager.connect("mock");
    const adapter = createTronAuthenticationAdapter({
      getNonce: () => "nonce-2",
      verify: async (input) => ({
        ...input,
        valid: input.proof.includes("nonce-2")
      })
    });
    const controller = createWalletAuth(manager, adapter, {
      domain: "example.com",
      uri: "https://example.com",
      statement: "Sign in"
    });
    const states: string[] = [];
    controller.subscribe((state) => states.push(state.status));

    const result = await controller.signIn();

    expect(result.status).toBe("authenticated");
    expect(states).toEqual(["unauthenticated", "loading", "authenticated"]);
    if (result.status === "authenticated") {
      expect(result.proof.message).toContain("Nonce: nonce-2");
      expect(result.proof.address).toBe("TAuthAddress");
    }
  });

  it("reports an error when signing in without a connected wallet", async () => {
    const manager = new WalletManager({ adapters: [createAdapter()], network: TRON_MAINNET });
    const controller = createWalletAuth(manager, {
      getNonce: () => "nonce",
      verify: async (input) => ({ ...input, valid: true })
    });

    await expect(controller.signIn()).resolves.toMatchObject({ status: "error" });
  });
});
