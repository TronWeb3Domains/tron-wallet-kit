import { describe, expect, it } from "vitest";
import { WalletKitError } from "@tron-wallet-kit/core";
import { ledgerConnectErrorMessage } from "../src/ledger-errors";

describe("Ledger connection errors", () => {
  it.each([
    ["Ledger device: Incorrect length (0x6700)", "Open the TRON app"],
    ["Failed to open the device", "Close Ledger Live"],
    ["global is not defined", "global is not defined"],
    ["Ledger device: UNKNOWN_ERROR (0x6f00)", "0x6f00"]
  ])("keeps actionable device or runtime details for %s", (message, expected) => {
    const error = new WalletKitError("CONNECTION_FAILED", message);
    expect(ledgerConnectErrorMessage(error, true)).toContain(expected);
    expect(ledgerConnectErrorMessage(error, true)).toContain(message);
  });
});
