import type { TronwalletBridgeInnerAdapter } from "@tron-wallet-kit/adapter-tronwallet-bridge";
import type { LedgerAdapterConfig } from "@tronweb3/tronwallet-adapter-ledger";
import type { WalletDescriptor } from "../types";

const LEDGER_ADAPTER_PACKAGE = "@tronweb3/tronwallet-adapter-ledger";

type LedgerAdapterConstructor = new (config: LedgerAdapterConfig) => TronwalletBridgeInnerAdapter;

type LedgerAdapterModule = {
  LedgerAdapter?: LedgerAdapterConstructor;
  LedgerWalletAdapter?: LedgerAdapterConstructor;
  default?: LedgerAdapterConstructor;
};

export const ledger: WalletDescriptor = {
  id: "ledger",
  name: "Ledger",
  integration: "tronweb3-bridge",
  homepage: "https://www.ledger.com/",
  downloadUrl: "https://support.ledger.com/",
  platforms: ["hardware"],
  group: "hardware",
  availabilityTimeoutMs: 1200,
  importer: async () => {
    const scope = globalThis as typeof globalThis & { Buffer?: unknown };
    if (!scope.Buffer) {
      const { Buffer } = await import("buffer");
      scope.Buffer = Buffer;
    }
    const module = (await import("@tronweb3/tronwallet-adapter-ledger")) as LedgerAdapterModule;
    const Adapter = module.LedgerAdapter ?? module.LedgerWalletAdapter ?? module.default;
    if (!Adapter) throw new Error(`${LEDGER_ADAPTER_PACKAGE} did not export a Ledger adapter.`);
    return new Adapter({
      // Keep the full waiting flow in the kit while verifying the address on-device.
      beforeConnect: () => undefined,
      accountNumber: 1,
      selectAccount: async ({ accounts, ledgerUtils }) => {
        const account = accounts[0];
        if (!account) throw new Error("Ledger did not return its first TRON account.");
        const verified = await ledgerUtils.getAddress(account.index, true);
        if (verified.address !== account.address) throw new Error("Ledger address verification did not match the selected account.");
        return account;
      },
      openUrlWhenWalletNotFound: false
    });
  }
};
