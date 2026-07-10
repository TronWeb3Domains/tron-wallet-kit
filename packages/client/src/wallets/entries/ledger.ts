import type { TronwalletBridgeInnerAdapter } from "@tron-wallet-kit/adapter-tronwallet-bridge";
import type { WalletDescriptor } from "../types";

const LEDGER_ADAPTER_PACKAGE = "@tronweb3/tronwallet-adapter-ledger";

type LedgerAdapterModule = {
  LedgerAdapter?: new () => TronwalletBridgeInnerAdapter;
  LedgerWalletAdapter?: new () => TronwalletBridgeInnerAdapter;
  default?: new () => TronwalletBridgeInnerAdapter;
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
    const module = (await import(/* @vite-ignore */ LEDGER_ADAPTER_PACKAGE)) as LedgerAdapterModule;
    const Adapter = module.LedgerAdapter ?? module.LedgerWalletAdapter ?? module.default;
    if (!Adapter) throw new Error(`${LEDGER_ADAPTER_PACKAGE} did not export a Ledger adapter.`);
    return new Adapter();
  }
};
