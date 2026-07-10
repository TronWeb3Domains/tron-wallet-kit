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
  readInjectedAddress,
  readInjectedAddressPayload,
  readInjectedAddressFromPaths,
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
  const resolveProvider = () => {
    try {
      return config.provider?.() ?? getInjectedTronProvider(config.providerPaths);
    } catch {
      return undefined;
    }
  };
  const resolveAvailability = async () => {
    if (resolveProvider()) return true;
    try {
      return Boolean(await config.availabilityProbe?.());
    } catch {
      return false;
    }
  };

  return {
    adapterApiVersion: "1.1",
    metadata,
    capabilities: {
      connect: true,
      disconnect: true,
      signMessage: true,
      signTransaction: true
    },
    isAvailable: async () => {
      if (await resolveAvailability()) return true;
      if (!config.availabilityTimeoutMs || config.availabilityTimeoutMs <= 0) return false;
      return waitForAvailability(resolveAvailability, config.availabilityTimeoutMs);
    },
    connect: async (options: ConnectOptions = {}) => {
      const nextProvider = resolveProvider();
      if (!nextProvider) throw new WalletKitError("WALLET_NOT_FOUND", `${metadata.name} provider was not found.`);
      // Gate & similar (reconnect): request() hangs / re-prompts (code 4000) when the wallet
      // already exposes an account → use the injected address directly, skip request().
      let address = config.preferInjectedAddress ? readInjectedAddress(nextProvider) ?? readInjectedAddressFromPaths(config.providerPaths) : undefined;
      // First-time connect: fire request() to trigger the wallet popup, but DON'T hard-await it
      // (Gate never resolves the promise even after approval). Resolve as soon as EITHER request
      // returns an address OR the wallet populates tronWeb.defaultAddress (polled live). This also
      // covers SafePal, which populates the address slightly after request() resolves.
      if (!address) address = await acquireInjectedAddress(nextProvider, resolveProvider, config);
      if (!address) {
        debugGateAddressFailure(config);
        throw new WalletKitError("CONNECTION_FAILED", `${metadata.name} did not return an address.`);
      }
      const activeProvider = resolveProvider() ?? nextProvider;
      const network = typeof options.network === "object" && options.network ? options.network : await resolveInjectedNetwork(activeProvider, connectedNetwork);
      provider = activeProvider;
      connectedNetwork = network;
      return {
        account: {
          address,
          network,
          networkType: network.networkType,
          activationStatus: "unknown",
          ...(activeProvider.tronWeb?.defaultAddress?.hex ? { hexAddress: activeProvider.tronWeb.defaultAddress.hex } : {})
        },
        network,
        raw: activeProvider
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

const DEFAULT_ADDRESS_TIMEOUT_MS = 60000;
const DEFAULT_ADDRESS_SETTLE_MS = 700;

async function waitForAvailability(resolveAvailability: () => Promise<boolean>, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await delay(100);
    if (await resolveAvailability()) return true;
  }
  return resolveAvailability();
}

// Acquire the account address robustly. Fires request() (to trigger the wallet popup / auth) but
// resolves as soon as EITHER request returns an address OR the live provider populates
// tronWeb.defaultAddress. Some wallets (Gate) never resolve request() even after approval, so we
// must poll the injected address in parallel rather than hard-awaiting the request promise.
async function acquireInjectedAddress(
  nextProvider: InjectedTronProvider,
  resolveProvider: () => InjectedTronProvider | undefined,
  config: InjectedTronAdapterConfig
): Promise<string | undefined> {
  const readLive = () => {
    const address =
      readInjectedAddress(resolveProvider()) ??
      readInjectedAddressFromPaths(config.providerPaths) ??
      readInjectedAddress(nextProvider);
    return typeof address === "string" && address.length > 0 ? address : undefined;
  };
  let userRejected: unknown;
  let requestedAddress: string | undefined;
  let requestSettled = false;
  let requestSettledAt = 0;
  const eventWatcher = watchInjectedAccountEvents(resolveProvider, nextProvider, config);
  // Fire request() in the background — capture an address if it resolves, surface user rejection,
  // but never let a hanging request() block the poll below.
  void requestInjectedAddress(nextProvider, config.requestMethods)
    .then((address) => { requestedAddress = address; })
    .catch((error) => { if (error instanceof WalletKitError && error.code === "USER_REJECTED") userRejected = error; })
    .finally(() => {
      requestSettled = true;
      requestSettledAt = Date.now();
    });

  const immediate = config.preferInjectedAddress ? readLive() : undefined;
  if (immediate) return eventWatcher.close(immediate);
  const deadline = Date.now() + (config.addressTimeoutMs ?? DEFAULT_ADDRESS_TIMEOUT_MS);
  while (Date.now() < deadline) {
    await delay(100);
    if (userRejected) {
      eventWatcher.close(undefined);
      throw userRejected;
    }
    if (requestedAddress) return requestedAddress;
    const eventAddress = eventWatcher.read();
    if (eventAddress) return eventWatcher.close(eventAddress);
    const live = readLive();
    if (live) return eventWatcher.close(live);
    // request settled without an address AND no live address yet → give the wallet a brief grace,
    // then stop (avoids spinning the full timeout when the wallet simply returned nothing).
    if (requestSettled && !requestedAddress) {
      const grace = readLive();
      if (grace) return eventWatcher.close(grace);
      if (Date.now() - requestSettledAt >= (config.addressSettleMs ?? DEFAULT_ADDRESS_SETTLE_MS)) break;
    }
  }
  const fallback = requestedAddress ?? eventWatcher.read() ?? readLive() ?? await retryEmptyAddressRequest(readLive, resolveProvider, nextProvider, config);
  return eventWatcher.close(fallback);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryEmptyAddressRequest(
  readLive: () => string | undefined,
  resolveProvider: () => InjectedTronProvider | undefined,
  nextProvider: InjectedTronProvider,
  config: InjectedTronAdapterConfig
): Promise<string | undefined> {
  if (!config.emptyAddressRetryDelayMs && !config.emptyAddressRetryTimeoutMs) return undefined;
  await delay(config.emptyAddressRetryDelayMs ?? 0);
  const liveBeforeRetry = readLive();
  if (liveBeforeRetry) return liveBeforeRetry;
  const provider = resolveProvider() ?? nextProvider;
  const timeoutMs = config.emptyAddressRetryTimeoutMs ?? 3000;
  try {
    const retryAddress = await withTimeout(requestInjectedAddress(provider, config.requestMethods), timeoutMs);
    return retryAddress ?? readLive();
  } catch (error) {
    if (error instanceof WalletKitError && error.code === "USER_REJECTED") throw error;
    return readLive();
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(undefined), timeoutMs);
    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => clearTimeout(timer));
  });
}

function watchInjectedAccountEvents(
  resolveProvider: () => InjectedTronProvider | undefined,
  nextProvider: InjectedTronProvider,
  config: InjectedTronAdapterConfig
): { read(): string | undefined; close<T>(value: T): T } {
  const eventNames = config.accountChangeEventNames ?? [];
  const timeoutMs = config.accountChangeTimeoutMs ?? 0;
  let address: string | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const providers = [resolveProvider(), nextProvider].filter(Boolean) as InjectedTronProvider[];
  const subscriptions: Array<{ provider: InjectedTronProvider; eventName: string; listener: (...args: unknown[]) => void }> = [];
  const cleanup = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    while (subscriptions.length > 0) {
      const subscription = subscriptions.pop()!;
      try {
        subscription.provider.off?.(subscription.eventName, subscription.listener);
      } catch {
        // best effort cleanup
      }
      try {
        subscription.provider.removeListener?.(subscription.eventName, subscription.listener);
      } catch {
        // best effort cleanup
      }
    }
  };
  const listener = (...args: unknown[]) => {
    for (const arg of args) {
      const nextAddress = readInjectedAddressPayload(arg);
      if (nextAddress) {
        address = nextAddress;
        cleanup();
        return;
      }
    }
    const live = readInjectedAddress(resolveProvider()) ?? readInjectedAddressFromPaths(config.providerPaths);
    if (live) {
      address = live;
      cleanup();
    }
  };
  for (const provider of providers) {
    if (!provider.on) continue;
    for (const eventName of eventNames) {
      try {
        provider.on(eventName, listener);
        subscriptions.push({ provider, eventName, listener });
      } catch {
        // best effort event subscription
      }
    }
  }
  if (timeoutMs > 0 && subscriptions.length > 0) timer = setTimeout(() => cleanup(), timeoutMs);
  return {
    read: () => address,
    close: (value) => {
      cleanup();
      return value;
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

function debugGateAddressFailure(config: InjectedTronAdapterConfig): void {
  if (config.id !== "gate") return;
  try {
    if (globalThis.localStorage?.getItem("TWK_DEBUG_GATE") !== "1") return;
    const gatewallet = (globalThis as unknown as { gatewallet?: unknown }).gatewallet;
    console.warn("[TRON Wallet Kit] Gate did not return an address", sanitizeDebugValue(gatewallet));
  } catch {
    // debug-only path
  }
}

function sanitizeDebugValue(value: unknown, depth = 0): unknown {
  if (depth > 3) return "[depth]";
  if (typeof value === "function") return "[function]";
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 5).map((entry) => sanitizeDebugValue(entry, depth + 1));
  const output: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).slice(0, 40)) {
    output[key] = sanitizeDebugValue((value as Record<string, unknown>)[key], depth + 1);
  }
  return output;
}
