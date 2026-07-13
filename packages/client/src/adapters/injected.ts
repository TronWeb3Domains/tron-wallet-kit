import { WalletKitError, type ConnectOptions, type TransactionPayload, type WalletAdapter, type WalletMetadata, type WalletNetwork } from "@tron-wallet-kit/core";
import type { InjectedTronAdapterConfig } from "../types";
import {
  createInjectedContext,
  defaultInjectedSignMessage,
  defaultInjectedSignTransaction,
  strategyFromLegacyConfig,
  type InjectedStrategy
} from "./injected-strategy";

export function createInjectedTronAdapter(config: InjectedTronAdapterConfig): WalletAdapter {
  let connectedNetwork: WalletNetwork | undefined;
  let strategyContext: ReturnType<typeof createInjectedContext> | undefined;
  const strategy: InjectedStrategy = config.strategy ?? strategyFromLegacyConfig(config);
  const metadata: WalletMetadata = {
    id: config.id,
    name: config.name,
    ...(config.icon ? { icon: config.icon } : {}),
    ...(config.homepage ? { homepage: config.homepage } : {}),
    ...(config.downloadUrl ?? config.homepage ? { downloadUrl: config.downloadUrl ?? config.homepage } : {}),
    type: "extension",
    group: "popular",
    platforms: config.platforms ?? ["extension"],
    description: `${config.name} TRON browser extension adapter.`,
    ...config.metadata
  };

  const detect = () => Promise.resolve(strategy.detect()).then(Boolean).catch(() => false);

  return {
    adapterApiVersion: "1.1",
    metadata,
    capabilities: {
      connect: true,
      disconnect: true,
      signMessage: true,
      signTransaction: true
    },
    detect,
    isAvailable: async () => {
      if (await detect()) return true;
      if (!config.availabilityTimeoutMs || config.availabilityTimeoutMs <= 0) return false;
      return waitForAvailability(detect, config.availabilityTimeoutMs);
    },
    connect: async (options: ConnectOptions = {}) => {
      const context = createInjectedContext(config, options, connectedNetwork);
      const result = await strategy.connect(context);
      if (!result.address) throw new WalletKitError("CONNECTION_FAILED", `${metadata.name} did not return an address.`);
      const activeProvider = context.getProvider();
      const hexAddress = result.hexAddress ?? activeProvider?.tronWeb?.defaultAddress?.hex;
      const network = typeof options.network === "object" && options.network ? options.network : result.network ?? await context.helpers.resolveNetwork(connectedNetwork);
      connectedNetwork = network;
      strategyContext = createInjectedContext(config, options, connectedNetwork);
      return {
        account: {
          address: result.address,
          network,
          networkType: network.networkType,
          activationStatus: "unknown",
          ...(hexAddress ? { hexAddress } : {})
        },
        network,
        raw: result.raw ?? activeProvider
      };
    },
    disconnect: async () => {
      connectedNetwork = undefined;
      strategyContext = undefined;
    },
    signMessage: async ({ message }) => {
      const context = strategyContext ?? createInjectedContext(config, {}, connectedNetwork);
      const signature = strategy.signMessage
        ? await strategy.signMessage(context, message)
        : await defaultInjectedSignMessage(context, message, config.signMessageMode);
      if (!signature) throw new WalletKitError("SIGN_MESSAGE_FAILED", `${metadata.name} did not return a signature.`);
      return { signatureKind: "signature" as const, signature, proof: signature, raw: signature };
    },
    signTransaction: async ({ transaction }) => {
      const context = strategyContext ?? createInjectedContext(config, {}, connectedNetwork);
      const signedTransaction = strategy.signTransaction
        ? await strategy.signTransaction(context, transaction)
        : await defaultInjectedSignTransaction(context, transaction);
      if (!signedTransaction || typeof signedTransaction !== "object") {
        throw new WalletKitError("SIGN_TRANSACTION_FAILED", `${metadata.name} did not return a signed transaction.`);
      }
      const transactionPayload = signedTransaction as TransactionPayload;
      return { transaction: transactionPayload, signedTransaction: transactionPayload, signed: true, raw: transactionPayload };
    }
  };
}

async function waitForAvailability(resolveAvailability: () => Promise<boolean>, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await delay(100);
    if (await resolveAvailability()) return true;
  }
  return resolveAvailability();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
