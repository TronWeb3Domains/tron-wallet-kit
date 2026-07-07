import { describe, expect, it } from "vitest";
import { createAuthMessage } from "../src/index";

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
});
