import {
  WalletKitError,
  type ConnectOptions,
  type TransactionPayload,
  type WalletAdapter,
  type WalletMetadata,
  type WalletNetwork
} from "@tron-wallet-kit/core";
import {
  getInjectedTronProvider,
  requestInjectedAddress,
  requestOptionalString,
  resolveInjectedNetwork
} from "../injected/detect";
import type { InjectedTronAdapterConfig, InjectedTronProvider } from "../types";

export function createInjectedTronAdapter(config: InjectedTronAdapterConfig): WalletAdapter {
  let provider: InjectedTronProvider | undefined;
  let connectedNetwork: WalletNetwork | undefined;
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
  const resolveProvider = () => config.provider?.() ?? getInjectedTronProvider(config.providerPaths);

  return {
    adapterApiVersion: "1.1",
    metadata,
    capabilities: {
      connect: true,
      disconnect: true,
      signMessage: true,
      signTransaction: true
    },
    isAvailable: () => Boolean(resolveProvider()),
    connect: async (options: ConnectOptions = {}) => {
      const nextProvider = resolveProvider();
      if (!nextProvider) throw new WalletKitError("WALLET_NOT_FOUND", `${metadata.name} provider was not found.`);
      const address = await requestInjectedAddress(nextProvider, config.requestMethods);
      if (!address) throw new WalletKitError("CONNECTION_FAILED", `${metadata.name} did not return an address.`);
      const network = typeof options.network === "object" && options.network ? options.network : await resolveInjectedNetwork(nextProvider, connectedNetwork);
      provider = nextProvider;
      connectedNetwork = network;
      return {
        account: {
          address,
          network,
          networkType: network.networkType,
          activationStatus: "unknown",
          ...(nextProvider.tronWeb?.defaultAddress?.hex ? { hexAddress: nextProvider.tronWeb.defaultAddress.hex } : {})
        },
        network,
        raw: nextProvider
      };
    },
    disconnect: async () => {
      provider = undefined;
      connectedNetwork = undefined;
    },
    signMessage: async ({ message }) => {
      const activeProvider = provider ?? resolveProvider();
      if (!activeProvider) throw new WalletKitError("NO_SESSION", `${metadata.name} is not connected.`);
      const signature = await signInjectedMessage(activeProvider, message, config.signMessageMode);
      if (!signature) throw new WalletKitError("SIGN_MESSAGE_FAILED", `${metadata.name} did not return a signature.`);
      return { signatureKind: "signature" as const, signature, proof: signature, raw: signature };
    },
    signTransaction: async ({ transaction }) => {
      const activeProvider = provider ?? resolveProvider();
      if (!activeProvider) throw new WalletKitError("NO_SESSION", `${metadata.name} is not connected.`);
      const signedTransaction =
        (normalizeSignedTransaction(await activeProvider.tronWeb?.trx?.sign?.(transaction)) as TransactionPayload | undefined) ??
        ((await activeProvider.request?.({ method: "tron_signTransaction", params: { transaction } })) as TransactionPayload | undefined);
      if (!signedTransaction) throw new WalletKitError("SIGN_TRANSACTION_FAILED", `${metadata.name} did not return a signed transaction.`);
      return { transaction: signedTransaction, signedTransaction, signed: true, raw: signedTransaction };
    }
  };
}

async function signInjectedMessage(provider: InjectedTronProvider, message: string, mode?: InjectedTronAdapterConfig["signMessageMode"]): Promise<string | undefined> {
  if (mode === "sign") return normalizeSignature(await provider.tronWeb?.trx?.sign?.(message));
  if (mode === "request") return requestOptionalString(provider, "tron_signMessage", { message });
  if (mode === "signMessageV2") return normalizeSignature(await provider.tronWeb?.trx?.signMessageV2?.(message));
  return (
    normalizeSignature(await provider.tronWeb?.trx?.signMessageV2?.(message)) ??
    (await requestOptionalString(provider, "tron_signMessage", { message })) ??
    normalizeSignature(await provider.tronWeb?.trx?.sign?.(message))
  );
}

function normalizeSignature(signature: unknown): string | undefined {
  return typeof signature === "string" && signature.length > 0 ? signature : undefined;
}

function normalizeSignedTransaction(transaction: unknown): TransactionPayload | undefined {
  return typeof transaction === "object" && transaction !== null ? (transaction as TransactionPayload) : undefined;
}
