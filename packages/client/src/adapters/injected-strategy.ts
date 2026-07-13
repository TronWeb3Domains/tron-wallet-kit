import { TRON_NILE, WalletKitError, type ConnectOptions, type TransactionPayload, type WalletNetwork } from "@tron-wallet-kit/core";
import {
  getInjectedTronProvider,
  readInjectedAddress,
  readInjectedAddressPayload,
  readInjectedAddressFromPaths,
  requestInjectedAddress,
  requestOptionalString,
  resolveInjectedNetwork
} from "../injected/detect";
import { hasAnnouncedWalletRdns } from "../injected/eip6963";
import type { InjectedTronAdapterConfig, InjectedTronProvider } from "../types";

export type InjectedConnectResult = {
  address: string;
  hexAddress?: string;
  network?: WalletNetwork;
  raw?: unknown;
};

export type InjectedEventHandlers = {
  accountsChanged?: (address?: string) => void;
  disconnect?: () => void;
};

export type InjectedHelpers = {
  getProvider: () => InjectedTronProvider | undefined;
  readDefaultAddress: () => string | undefined;
  requestOnce: (method: string, params?: unknown) => Promise<unknown>;
  acquireAddress: (opts?: {
    requestMethods?: readonly string[];
    timeoutMs?: number;
    settleMs?: number;
    preferInjectedAddress?: boolean;
    retryDelayMs?: number;
    retryTimeoutMs?: number;
    accountChangeEventNames?: readonly string[];
    accountChangeTimeoutMs?: number;
  }) => Promise<string | undefined>;
  resolveNetwork: (fallback?: WalletNetwork) => Promise<WalletNetwork>;
};

export type InjectedConnectContext = {
  options: ConnectOptions;
  network?: WalletNetwork | undefined;
  getProvider: () => InjectedTronProvider | undefined;
  helpers: InjectedHelpers;
};

export type InjectedStrategy = {
  detect: () => boolean | Promise<boolean>;
  connect: (ctx: InjectedConnectContext) => Promise<InjectedConnectResult>;
  signMessage?: (ctx: InjectedConnectContext, message: string) => Promise<string | undefined>;
  signTransaction?: (ctx: InjectedConnectContext, transaction: TransactionPayload) => Promise<unknown>;
  subscribe?: (ctx: InjectedConnectContext, handlers: InjectedEventHandlers) => (() => void) | undefined;
};

export type InjectedAcquireAddressDefaults = NonNullable<Parameters<InjectedHelpers["acquireAddress"]>[0]>;

export type InjectedEventDecoratorConfig = {
  accountsChanged?: string | readonly string[];
};

export type StandardInjectedOptions = {
  providerPaths?: readonly string[];
  provider?: () => InjectedTronProvider | undefined;
  rdns?: readonly string[];
  marker?: () => boolean | Promise<boolean>;
  requestMethods?: readonly string[];
  signMessageMode?: InjectedTronAdapterConfig["signMessageMode"];
  addressTimeoutMs?: number;
  addressSettleMs?: number;
  accountChangeEventNames?: readonly string[];
  accountChangeTimeoutMs?: number;
  emptyAddressRetryDelayMs?: number;
  emptyAddressRetryTimeoutMs?: number;
  preferInjectedAddress?: boolean;
};

const DEFAULT_ADDRESS_TIMEOUT_MS = 60000;
const DEFAULT_ADDRESS_SETTLE_MS = 2500;
const TRON_ADDRESS_PATTERN = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

export function standardInjected(opts: StandardInjectedOptions): InjectedStrategy {
  const strategy: InjectedStrategy = {
    detect: async () => {
      if (await hasAnnouncedWalletRdns(opts.rdns).catch(() => false)) return true;
      if (await Promise.resolve(opts.marker?.()).catch(() => false)) return true;
      return Boolean(resolveProvider(opts));
    },
    connect: async (ctx) => {
      const provider = resolveProvider(opts);
      if (!provider) throw new WalletKitError("WALLET_NOT_FOUND", "Provider was not found.");
      const address = await ctx.helpers.acquireAddress(toAcquireOptions(opts));
      if (!address) throw new WalletKitError("CONNECTION_FAILED", "Wallet did not return an address.");
      return { address, ...(provider.tronWeb?.defaultAddress?.hex ? { hexAddress: provider.tronWeb.defaultAddress.hex } : {}), raw: provider };
    }
  };
  if (opts.signMessageMode) {
    strategy.signMessage = (ctx, message) => signInjectedMessage(ctx.getProvider(), message, opts.signMessageMode);
  }
  return strategy;
}

export function withRequestMethods(strategy: InjectedStrategy, requestMethods: readonly string[]): InjectedStrategy {
  return withAcquireAddressDefaults(strategy, { requestMethods });
}

export function withEthRequest(strategy: InjectedStrategy): InjectedStrategy {
  return withRequestMethods(strategy, ["eth_requestAccounts"]);
}

export function withPreferInjectedAddress(strategy: InjectedStrategy): InjectedStrategy {
  return withAcquireAddressDefaults(strategy, { preferInjectedAddress: true });
}

export function withAddressPoll(strategy: InjectedStrategy, settleMsOrOptions: number | InjectedAcquireAddressDefaults): InjectedStrategy {
  const defaults = typeof settleMsOrOptions === "number" ? { settleMs: settleMsOrOptions } : settleMsOrOptions;
  return withAcquireAddressDefaults(strategy, defaults);
}

export function withSignMode(strategy: InjectedStrategy, mode: NonNullable<StandardInjectedOptions["signMessageMode"]>): InjectedStrategy {
  return {
    ...strategy,
    signMessage: (ctx, message) => defaultInjectedSignMessage(ctx, message, mode)
  };
}

export function withMarker(strategy: InjectedStrategy, detect: () => boolean | Promise<boolean>): InjectedStrategy {
  return {
    ...strategy,
    detect: async () => Boolean(await Promise.resolve(detect()).catch(() => false)) || Boolean(await Promise.resolve(strategy.detect()).catch(() => false))
  };
}

export function withEvents(strategy: InjectedStrategy, names: InjectedEventDecoratorConfig): InjectedStrategy {
  const accountsChanged = normalizeEventNames(names.accountsChanged);
  return accountsChanged.length > 0 ? withAcquireAddressDefaults(strategy, { accountChangeEventNames: accountsChanged }) : strategy;
}

export function withAcquireAddressDefaults(strategy: InjectedStrategy, defaults: InjectedAcquireAddressDefaults): InjectedStrategy {
  return {
    ...strategy,
    connect: (ctx) => strategy.connect(withAcquireDefaultsContext(ctx, defaults))
  };
}

export function strategyFromLegacyConfig(config: InjectedTronAdapterConfig): InjectedStrategy {
  return standardInjected({
    providerPaths: config.providerPaths,
    ...(config.provider ? { provider: config.provider } : {}),
    ...(config.availabilityProbe ? { marker: config.availabilityProbe } : {}),
    ...(config.requestMethods ? { requestMethods: config.requestMethods } : {}),
    ...(config.signMessageMode ? { signMessageMode: config.signMessageMode } : {}),
    ...(config.addressTimeoutMs ? { addressTimeoutMs: config.addressTimeoutMs } : {}),
    ...(config.addressSettleMs ? { addressSettleMs: config.addressSettleMs } : {}),
    ...(config.accountChangeEventNames ? { accountChangeEventNames: config.accountChangeEventNames } : {}),
    ...(config.accountChangeTimeoutMs ? { accountChangeTimeoutMs: config.accountChangeTimeoutMs } : {}),
    ...(config.emptyAddressRetryDelayMs ? { emptyAddressRetryDelayMs: config.emptyAddressRetryDelayMs } : {}),
    ...(config.emptyAddressRetryTimeoutMs ? { emptyAddressRetryTimeoutMs: config.emptyAddressRetryTimeoutMs } : {}),
    ...(config.preferInjectedAddress ? { preferInjectedAddress: config.preferInjectedAddress } : {})
  });
}

export function createInjectedContext(config: InjectedTronAdapterConfig, options: ConnectOptions, connectedNetwork?: WalletNetwork): InjectedConnectContext {
  const getProvider = () => resolveProvider(config);
  const helpers: InjectedHelpers = {
    getProvider,
    readDefaultAddress: () => readValidAddress(getProvider()) ?? readValidAddressFromPaths(config.providerPaths),
    requestOnce: async (method, params) => getProvider()?.request?.({ method, params }),
    acquireAddress: (opts) => acquireInjectedAddress(getProvider, config.providerPaths, opts),
    resolveNetwork: async (fallback) => {
      const provider = getProvider();
      if (!provider) return fallback ?? connectedNetwork ?? resolveNetworkFallback();
      return resolveInjectedNetwork(provider, fallback ?? connectedNetwork);
    }
  };
  return { options, ...(connectedNetwork ? { network: connectedNetwork } : {}), getProvider, helpers };
}

function withAcquireDefaultsContext(ctx: InjectedConnectContext, defaults: InjectedAcquireAddressDefaults): InjectedConnectContext {
  return {
    ...ctx,
    helpers: {
      ...ctx.helpers,
      acquireAddress: (opts) => ctx.helpers.acquireAddress({ ...opts, ...defaults })
    }
  };
}

function normalizeEventNames(value: string | readonly string[] | undefined): readonly string[] {
  if (!value) return [];
  return typeof value === "string" ? [value] : value;
}

export async function defaultInjectedSignMessage(ctx: InjectedConnectContext, message: string, mode?: InjectedTronAdapterConfig["signMessageMode"]): Promise<string | undefined> {
  return signInjectedMessage(ctx.getProvider(), message, mode);
}

export async function defaultInjectedSignTransaction(ctx: InjectedConnectContext, transaction: TransactionPayload): Promise<unknown> {
  const provider = ctx.getProvider();
  const signedTransaction =
    (normalizeSignedTransaction(await provider?.tronWeb?.trx?.sign?.(transaction)) as TransactionPayload | undefined) ??
    ((await provider?.request?.({ method: "tron_signTransaction", params: { transaction } })) as TransactionPayload | undefined);
  return signedTransaction;
}

export function isTronAddress(value: unknown): value is string {
  return typeof value === "string" && TRON_ADDRESS_PATTERN.test(value);
}

function resolveProvider(opts: Pick<StandardInjectedOptions, "provider" | "providerPaths">): InjectedTronProvider | undefined {
  try {
    return opts.provider?.() ?? getInjectedTronProvider(opts.providerPaths ?? []);
  } catch {
    return undefined;
  }
}

async function acquireInjectedAddress(
  resolveProvider: () => InjectedTronProvider | undefined,
  providerPaths: readonly string[],
  opts: Parameters<InjectedHelpers["acquireAddress"]>[0] = {}
): Promise<string | undefined> {
  const initialProvider = resolveProvider();
  if (!initialProvider) return undefined;
  const readLive = () => readValidAddress(resolveProvider()) ?? readValidAddressFromPaths(providerPaths) ?? readValidAddress(initialProvider);
  let userRejected: unknown;
  let requestedAddress: string | undefined;
  let requestSettled = false;
  let requestSettledAt = 0;
  const eventWatcher = watchInjectedAccountEvents(resolveProvider, initialProvider, providerPaths, opts.accountChangeEventNames, opts.accountChangeTimeoutMs);
  const immediate = opts.preferInjectedAddress ? readLive() : undefined;
  if (immediate) return eventWatcher.close(immediate);

  void requestInjectedAddress(initialProvider, opts.requestMethods)
    .then((address) => {
      if (isTronAddress(address)) requestedAddress = address;
    })
    .catch((error) => {
      if (error instanceof WalletKitError && error.code === "USER_REJECTED") userRejected = error;
    })
    .finally(() => {
      requestSettled = true;
      requestSettledAt = Date.now();
    });

  const deadline = Date.now() + (opts.timeoutMs ?? DEFAULT_ADDRESS_TIMEOUT_MS);
  while (Date.now() < deadline) {
    await delay(100);
    if (userRejected) {
      eventWatcher.close(undefined);
      throw userRejected;
    }
    if (requestedAddress) return eventWatcher.close(requestedAddress);
    const eventAddress = eventWatcher.read();
    if (eventAddress) return eventWatcher.close(eventAddress);
    const live = readLive();
    if (live) return eventWatcher.close(live);
    if (requestSettled && !requestedAddress) {
      const grace = readLive();
      if (grace) return eventWatcher.close(grace);
      if (Date.now() - requestSettledAt >= (opts.settleMs ?? DEFAULT_ADDRESS_SETTLE_MS)) break;
    }
  }
  const fallback = requestedAddress ?? eventWatcher.read() ?? readLive() ?? await retryEmptyAddressRequest(readLive, resolveProvider, initialProvider, opts);
  return eventWatcher.close(fallback);
}

async function retryEmptyAddressRequest(
  readLive: () => string | undefined,
  resolveProvider: () => InjectedTronProvider | undefined,
  initialProvider: InjectedTronProvider,
  opts: Parameters<InjectedHelpers["acquireAddress"]>[0] = {}
): Promise<string | undefined> {
  if (!opts.retryDelayMs && !opts.retryTimeoutMs) return undefined;
  await delay(opts.retryDelayMs ?? 0);
  const liveBeforeRetry = readLive();
  if (liveBeforeRetry) return liveBeforeRetry;
  try {
    const retryAddress = await withTimeout(requestInjectedAddress(resolveProvider() ?? initialProvider, opts.requestMethods), opts.retryTimeoutMs ?? 3000);
    return isTronAddress(retryAddress) ? retryAddress : readLive();
  } catch (error) {
    if (error instanceof WalletKitError && error.code === "USER_REJECTED") throw error;
    return readLive();
  }
}

function watchInjectedAccountEvents(
  resolveProvider: () => InjectedTronProvider | undefined,
  initialProvider: InjectedTronProvider,
  providerPaths: readonly string[],
  eventNames: readonly string[] = [],
  timeoutMs = 0
): { read(): string | undefined; close<T>(value: T): T } {
  let address: string | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const providers = [resolveProvider(), initialProvider].filter(Boolean) as InjectedTronProvider[];
  const subscriptions: Array<{ provider: InjectedTronProvider; eventName: string; listener: (...args: unknown[]) => void }> = [];
  const cleanup = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    while (subscriptions.length > 0) {
      const subscription = subscriptions.pop()!;
      try {
        subscription.provider.off?.(subscription.eventName, subscription.listener);
      } catch {}
      try {
        subscription.provider.removeListener?.(subscription.eventName, subscription.listener);
      } catch {}
    }
  };
  const listener = (...args: unknown[]) => {
    for (const arg of args) {
      const nextAddress = readInjectedAddressPayload(arg);
      if (isTronAddress(nextAddress)) {
        address = nextAddress;
        cleanup();
        return;
      }
    }
    const live = readValidAddress(resolveProvider()) ?? readValidAddressFromPaths(providerPaths);
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
      } catch {}
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

async function signInjectedMessage(provider: InjectedTronProvider | undefined, message: string, mode?: InjectedTronAdapterConfig["signMessageMode"]): Promise<string | undefined> {
  if (!provider) return undefined;
  if (mode === "sign") return normalizeSignature(await provider.tronWeb?.trx?.sign?.(message));
  if (mode === "request") return requestOptionalString(provider, "tron_signMessage", { message });
  if (mode === "signMessageV2") return normalizeSignature(await provider.tronWeb?.trx?.signMessageV2?.(message));
  return (
    normalizeSignature(await provider.tronWeb?.trx?.signMessageV2?.(message)) ??
    (await requestOptionalString(provider, "tron_signMessage", { message })) ??
    normalizeSignature(await provider.tronWeb?.trx?.sign?.(message))
  );
}

function readValidAddress(provider?: InjectedTronProvider): string | undefined {
  const address = readInjectedAddress(provider);
  return isTronAddress(address) ? address : undefined;
}

function readValidAddressFromPaths(providerPaths: readonly string[]): string | undefined {
  const address = readInjectedAddressFromPaths(providerPaths);
  return isTronAddress(address) ? address : undefined;
}

function normalizeSignature(signature: unknown): string | undefined {
  return typeof signature === "string" && signature.length > 0 ? signature : undefined;
}

function normalizeSignedTransaction(transaction: unknown): TransactionPayload | undefined {
  return typeof transaction === "object" && transaction !== null ? (transaction as TransactionPayload) : undefined;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function resolveNetworkFallback(): WalletNetwork {
  return TRON_NILE;
}

function toAcquireOptions(opts: StandardInjectedOptions): Parameters<InjectedHelpers["acquireAddress"]>[0] {
  return {
    ...(opts.requestMethods ? { requestMethods: opts.requestMethods } : {}),
    ...(opts.addressTimeoutMs ? { timeoutMs: opts.addressTimeoutMs } : {}),
    ...(opts.addressSettleMs ? { settleMs: opts.addressSettleMs } : {}),
    ...(opts.preferInjectedAddress ? { preferInjectedAddress: opts.preferInjectedAddress } : {}),
    ...(opts.emptyAddressRetryDelayMs ? { retryDelayMs: opts.emptyAddressRetryDelayMs } : {}),
    ...(opts.emptyAddressRetryTimeoutMs ? { retryTimeoutMs: opts.emptyAddressRetryTimeoutMs } : {}),
    ...(opts.accountChangeEventNames ? { accountChangeEventNames: opts.accountChangeEventNames } : {}),
    ...(opts.accountChangeTimeoutMs ? { accountChangeTimeoutMs: opts.accountChangeTimeoutMs } : {})
  };
}
