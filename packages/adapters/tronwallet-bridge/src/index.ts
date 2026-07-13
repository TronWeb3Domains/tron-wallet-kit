import {
  TRON_MAINNET,
  TRON_NILE,
  TRON_SHASTA,
  WalletKitError,
  type ConnectOptions,
  type ConnectResult,
  type SignMessageResult,
  type SignTransactionResult,
  type SubmitTransactionRequest,
  type TransactionPayload,
  type TxResult,
  type WalletAdapter,
  type WalletAdapterType,
  type WalletCapabilities,
  type WalletMetadata,
  type WalletNetwork,
  type WalletPlatform,
  type WalletSession
} from "@tron-wallet-kit/core";

export type TronwalletBridgeReadyState = "Found" | "NotFound" | "Loading" | "Loadable" | "Unsupported" | string;
export type TronwalletBridgeAdapterState = "Loading" | "Disconnect" | "Connected" | string;

export type TronwalletBridgeInnerAdapter = {
  name: string;
  url?: string;
  icon?: string;
  readyState?: TronwalletBridgeReadyState;
  address?: string | null;
  connecting?: boolean;
  state?: TronwalletBridgeAdapterState;
  connect(options?: unknown): Promise<unknown> | unknown;
  disconnect?(): Promise<void> | void;
  signMessage?(...args: any[]): Promise<string> | string;
  signTransaction?<TTransaction extends TransactionPayload>(transaction: TTransaction): Promise<TTransaction> | TTransaction;
  multiSign?(...args: unknown[]): Promise<unknown> | unknown;
  switchChain?(chainId: string): Promise<unknown> | unknown;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  off?(event: string, listener: (...args: unknown[]) => void): void;
};

export type TronwalletBridgeTronWeb = {
  trx?: {
    getBlockByNumber?(blockNumber: number): Promise<{ blockID?: string }>;
    sendRawTransaction?(transaction: TransactionPayload): Promise<{ txid?: string; txID?: string; transaction?: { txID?: string } }>;
  };
  transactionBuilder?: {
    sendTrx?(to: string, amountSun: number, from?: string): Promise<TransactionPayload>;
  };
};

export type TronwalletBridgeAdapterOptions = {
  id: string;
  metadata?: Partial<WalletMetadata>;
  tronWeb?: TronwalletBridgeTronWeb | (() => TronwalletBridgeTronWeb | undefined);
  group?: string;
  type?: WalletAdapterType;
  platforms?: WalletPlatform[];
  network?: WalletNetwork;
  capabilities?: Partial<WalletCapabilities>;
  signMessageMode?: "string" | "messageObject";
  availabilityTimeoutMs?: number;
};

export type TronwalletBridgeAdapterImporter = () => Promise<TronwalletBridgeInnerAdapter> | TronwalletBridgeInnerAdapter;

export type LazyTronwalletBridgeAdapterOptions = TronwalletBridgeAdapterOptions & {
  importer: TronwalletBridgeAdapterImporter;
};

type EventCleanup = () => void;

export function createTronwalletBridgeAdapter(
  inner: TronwalletBridgeInnerAdapter,
  options: TronwalletBridgeAdapterOptions
): WalletAdapter {
  let cleanupEvents: EventCleanup | undefined;
  let connectedNetwork: WalletNetwork | undefined;
  const metadata: WalletMetadata = {
    id: options.metadata?.id ?? options.id,
    name: options.metadata?.name ?? inner.name,
    ...(options.metadata?.icon ?? inner.icon ? { icon: options.metadata?.icon ?? inner.icon } : {}),
    ...(options.metadata?.homepage ?? inner.url ? { homepage: options.metadata?.homepage ?? inner.url } : {}),
    ...(options.metadata?.downloadUrl ?? inner.url ? { downloadUrl: options.metadata?.downloadUrl ?? inner.url } : {}),
    type: options.type ?? options.metadata?.type ?? "extension",
    group: options.group ?? options.metadata?.group ?? "popular",
    platforms: options.platforms ?? options.metadata?.platforms ?? [options.type === "mobile" ? "mobile" : "extension"],
    description: options.metadata?.description ?? "TRON wallet adapter bridged from @tronweb3/tronwallet-adapter.",
    ...options.metadata
  };
  const capabilities: WalletCapabilities = {
    connect: true,
    disconnect: true,
    signMessage: Boolean(inner.signMessage),
    signTransaction: Boolean(inner.signTransaction),
    submitTransaction: true,
    transferTrx: true,
    ...options.capabilities
  };

  const adapter: WalletAdapter = {
    adapterApiVersion: "1.1",
    metadata,
    capabilities,
    detect: () => isTronwalletAdapterAvailable(inner),
    isAvailable: () => isTronwalletAdapterAvailable(inner),
    connect: async (connectOptions: ConnectOptions = {}) => {
      cleanupEvents?.();
      cleanupEvents = subscribeToInnerEvents(inner, connectOptions);
      try {
        await inner.connect(connectOptions.metadata);
        const address = inner.address ?? undefined;
        if (!address) throw new WalletKitError("CONNECTION_FAILED", `${metadata.name} did not return an address after connect.`);
        const network = await resolveNetwork(options, connectOptions.network, connectedNetwork);
        connectedNetwork = network;
        return {
          account: {
            address,
            network,
            networkType: network.networkType,
            activationStatus: "unknown"
          },
          network,
          raw: inner
        };
      } catch (error) {
        cleanupEvents?.();
        cleanupEvents = undefined;
        throw normalizeTronwalletBridgeError(error, "CONNECTION_FAILED", `Failed to connect ${metadata.name}.`);
      }
    },
    disconnect: async () => {
      cleanupEvents?.();
      cleanupEvents = undefined;
      connectedNetwork = undefined;
      await Promise.resolve(inner.disconnect?.()).catch(() => undefined);
    },
    restoreSession: async (session: WalletSession): Promise<ConnectResult | null> => {
      if (!isTronwalletAdapterAvailable(inner)) return null;
      if (!inner.address || inner.address !== session.account.address) return null;
      const network = options.network ?? session.network ?? connectedNetwork ?? TRON_MAINNET;
      connectedNetwork = network;
      return {
        account: {
          ...session.account,
          network,
          networkType: network.networkType
        },
        network,
        session,
        raw: inner
      };
    },
    submitTransaction: async (request: SubmitTransactionRequest): Promise<TxResult> => {
      try {
        if (!inner.signTransaction) throw new WalletKitError("UNSUPPORTED", `${metadata.name} cannot sign transactions.`);
        const tronWeb = resolveTronWeb(options);
        if (!tronWeb?.trx?.sendRawTransaction) {
          throw new WalletKitError("SEND_TRANSACTION_FAILED", "A tronWeb instance with trx.sendRawTransaction is required for bridge submission.");
        }
        const transaction = await buildTransaction(request, tronWeb);
        const signedTransaction = await inner.signTransaction(transaction);
        const raw = await tronWeb.trx.sendRawTransaction(signedTransaction);
        const hash = raw.txid ?? raw.txID ?? raw.transaction?.txID ?? signedTransaction.txID ?? signedTransaction.txid;
        if (!hash) throw new WalletKitError("SEND_TRANSACTION_FAILED", `${metadata.name} broadcast did not return a transaction hash.`, raw);
        return { hash: String(hash), status: "submitted", raw };
      } catch (error) {
        throw normalizeTronwalletBridgeError(error, "SEND_TRANSACTION_FAILED", `Failed to submit transaction with ${metadata.name}.`);
      }
    }
  };

  if (inner.signMessage) {
    adapter.signMessage = async ({ message }): Promise<SignMessageResult> => {
      try {
        const signature = await inner.signMessage!(options.signMessageMode === "messageObject" ? { message } : message);
        if (!signature) throw new WalletKitError("SIGN_MESSAGE_FAILED", `${metadata.name} did not return a signature.`);
        return { signatureKind: "signature", signature, proof: signature, raw: signature };
      } catch (error) {
        throw normalizeTronwalletBridgeError(error, "SIGN_MESSAGE_FAILED", `Failed to sign message with ${metadata.name}.`);
      }
    };
  }

  if (inner.signTransaction) {
    adapter.signTransaction = async ({ transaction }): Promise<SignTransactionResult> => {
      try {
        const signedTransaction = await inner.signTransaction!(transaction);
        if (!signedTransaction) throw new WalletKitError("SIGN_TRANSACTION_FAILED", `${metadata.name} did not return a signed transaction.`);
        const signature = extractSignature(signedTransaction);
        return {
          transaction: signedTransaction,
          signedTransaction,
          signed: true,
          ...(signature ? { signature } : {}),
          raw: signedTransaction
        };
      } catch (error) {
        throw normalizeTronwalletBridgeError(error, "SIGN_TRANSACTION_FAILED", `Failed to sign transaction with ${metadata.name}.`);
      }
    };
  }

  return adapter;
}

export function createLazyTronwalletBridgeAdapter(options: LazyTronwalletBridgeAdapterOptions): WalletAdapter {
  let innerPromise: Promise<TronwalletBridgeInnerAdapter> | undefined;
  let adapter: WalletAdapter | undefined;
  const metadata: WalletMetadata = {
    id: options.metadata?.id ?? options.id,
    name: options.metadata?.name ?? options.id,
    ...(options.metadata?.icon ? { icon: options.metadata.icon } : {}),
    ...(options.metadata?.homepage ? { homepage: options.metadata.homepage } : {}),
    ...(options.metadata?.downloadUrl ?? options.metadata?.homepage ? { downloadUrl: options.metadata.downloadUrl ?? options.metadata.homepage } : {}),
    type: options.type ?? options.metadata?.type ?? "extension",
    group: options.group ?? options.metadata?.group ?? "popular",
    platforms: options.platforms ?? options.metadata?.platforms ?? [options.type === "mobile" ? "mobile" : "extension"],
    description: options.metadata?.description ?? "TRON wallet adapter loaded from @tronweb3/tronwallet-adapter on demand.",
    ...options.metadata
  };
  const capabilities: WalletCapabilities = {
    connect: true,
    disconnect: true,
    signMessage: true,
    signTransaction: true,
    submitTransaction: true,
    transferTrx: true,
    ...options.capabilities
  };

  const loadInner = async (): Promise<TronwalletBridgeInnerAdapter> => {
    innerPromise ??= Promise.resolve(options.importer());
    return innerPromise;
  };

  const load = async (): Promise<WalletAdapter> => {
    const inner = await loadInner();
    adapter ??= createTronwalletBridgeAdapter(inner, {
      ...options,
      metadata
    });
    return adapter;
  };

  return {
    adapterApiVersion: "1.1",
    metadata,
    capabilities,
    detect: async () => {
      if (!adapter) return false;
      return Boolean(await Promise.resolve(adapter.detect?.()).catch(() => false));
    },
    isAvailable: async () => {
      try {
        const inner = await loadInner();
        await waitForInnerReadyState(inner, options.availabilityTimeoutMs ?? 0);
        const loaded = await load();
        return Boolean(await loaded.isAvailable?.());
      } catch {
        return false;
      }
    },
    connect: async (connectOptions: ConnectOptions = {}) => {
      try {
        return await (await load()).connect(connectOptions);
      } catch (error) {
        throw normalizeTronwalletBridgeError(error, "CONNECTION_FAILED", `Failed to connect ${metadata.name}.`);
      }
    },
    disconnect: async () => {
      await adapter?.disconnect?.();
      adapter = undefined;
    },
    restoreSession: async (session: WalletSession) => {
      try {
        return (await load()).restoreSession?.(session) ?? null;
      } catch {
        return null;
      }
    },
    signMessage: async (request) => {
      const loaded = await load();
      if (!loaded.signMessage) throw new WalletKitError("UNSUPPORTED", `${metadata.name} cannot sign messages.`);
      return loaded.signMessage(request);
    },
    signTransaction: async (request) => {
      const loaded = await load();
      if (!loaded.signTransaction) throw new WalletKitError("UNSUPPORTED", `${metadata.name} cannot sign transactions.`);
      return loaded.signTransaction(request);
    },
    submitTransaction: async (request) => {
      const loaded = await load();
      if (!loaded.submitTransaction) throw new WalletKitError("UNSUPPORTED", `${metadata.name} cannot submit transactions.`);
      return loaded.submitTransaction(request);
    }
  };
}

export function isTronwalletAdapterAvailable(inner: TronwalletBridgeInnerAdapter): boolean {
  return inner.readyState === "Found" || inner.readyState === "Loadable";
}

function waitForInnerReadyState(inner: TronwalletBridgeInnerAdapter, timeoutMs: number): Promise<void> {
  if (timeoutMs <= 0) return Promise.resolve();
  if (inner.readyState !== "Loading") return Promise.resolve();
  if (!inner.on || !inner.off) {
    return new Promise((resolve) => globalThis.setTimeout(resolve, timeoutMs));
  }
  const on = inner.on.bind(inner);
  const off = inner.off.bind(inner);
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timer);
      off("readyStateChanged", onReadyStateChanged);
      resolve();
    };
    const onReadyStateChanged = () => done();
    const timer = globalThis.setTimeout(done, timeoutMs);
    on("readyStateChanged", onReadyStateChanged);
  });
}

export function normalizeTronwalletBridgeError(error: unknown, fallbackCode: string, fallbackMessage: string): WalletKitError {
  if (error instanceof WalletKitError) return error;
  const name = getErrorString(error, "name");
  const message = getErrorString(error, "message") ?? fallbackMessage;
  const code = getErrorCode(error);
  if (isDynamicImportError(message)) return new WalletKitError(fallbackCode, fallbackMessage, error);
  if (isUserRejectedError(code, message)) return new WalletKitError("USER_REJECTED", message, error);
  if (name === "WalletNotFoundError") return new WalletKitError("WALLET_NOT_FOUND", message, error);
  if (name === "WalletDisconnectedError") return new WalletKitError("NO_SESSION", message, error);
  if (name === "WalletSignMessageError") return new WalletKitError("SIGN_MESSAGE_FAILED", message, error);
  if (name === "WalletSignTransactionError") return new WalletKitError("SIGN_TRANSACTION_FAILED", message, error);
  if (name === "WalletConnectionError") return new WalletKitError("CONNECTION_FAILED", message, error);
  return new WalletKitError(fallbackCode, message, error);
}

function isDynamicImportError(message: string): boolean {
  return /dynamically imported module|importing a module script failed|failed to fetch|cannot find module/i.test(message);
}

function subscribeToInnerEvents(inner: TronwalletBridgeInnerAdapter, options: ConnectOptions): EventCleanup | undefined {
  if (!inner.on || !inner.off) return undefined;
  const onAccount = (address: unknown) => {
    if (typeof address === "string" && address) options.onAccountChanged?.(address);
  };
  const onChain = (chain: unknown) => {
    options.onNetworkChanged?.(mapChainToNetwork(chain));
  };
  const onDisconnect = () => {
    options.onDisconnect?.();
  };

  inner.on("accountsChanged", onAccount);
  inner.on("chainChanged", onChain);
  inner.on("disconnect", onDisconnect);
  return () => {
    inner.off?.("accountsChanged", onAccount);
    inner.off?.("chainChanged", onChain);
    inner.off?.("disconnect", onDisconnect);
  };
}

function resolveTronWeb(options: TronwalletBridgeAdapterOptions): TronwalletBridgeTronWeb | undefined {
  return typeof options.tronWeb === "function" ? options.tronWeb() : options.tronWeb;
}

async function resolveNetwork(
  options: TronwalletBridgeAdapterOptions,
  requested: ConnectOptions["network"],
  fallback: WalletNetwork | undefined
): Promise<WalletNetwork> {
  if (typeof requested === "object" && requested) return requested;
  const tronWeb = resolveTronWeb(options);
  const block = await tronWeb?.trx?.getBlockByNumber?.(0).catch(() => undefined);
  const network = mapChainToNetwork(block?.blockID ? `0x${block.blockID.slice(-8)}` : undefined);
  if (network.id !== "unknown") return network;
  return options.network ?? fallback ?? TRON_MAINNET;
}

export function mapChainToNetwork(chain: unknown): WalletNetwork {
  const chainId = normalizeChainId(chain);
  if (chainId === "0x2b6653dc" || chainId === "tron:0x2b6653dc") return { ...TRON_MAINNET };
  if (chainId === "0x94a9059e" || chainId === "tron:0x94a9059e") return { ...TRON_SHASTA };
  if (chainId === "0xcd8690dc" || chainId === "tron:0xcd8690dc") return { ...TRON_NILE };
  return {
    id: "unknown",
    name: "TRON Unknown",
    family: "tron",
    networkType: "CUSTOM",
    nativeAsset: "TRX",
    nativeAssetDecimals: 6,
    rpcUrl: ""
  };
}

function normalizeChainId(chain: unknown): string | undefined {
  if (typeof chain === "string") return chain.toLowerCase();
  if (!chain || typeof chain !== "object") return undefined;
  const record = chain as Record<string, unknown>;
  const chainId = record.chainId ?? record.chainID ?? record.id;
  return typeof chainId === "string" ? chainId.toLowerCase() : undefined;
}

async function buildTransaction(request: SubmitTransactionRequest, tronWeb: TronwalletBridgeTronWeb): Promise<TransactionPayload> {
  if (request.methodHint === "transferTrx" && !("raw_data" in request.transaction) && tronWeb.transactionBuilder?.sendTrx) {
    const to = String(request.transaction.to ?? "");
    const amountSun = Number(request.transaction.amountSun ?? request.transaction.amount ?? 0);
    const from = request.account?.address;
    return tronWeb.transactionBuilder.sendTrx(to, amountSun, from);
  }
  return request.transaction;
}

function extractSignature(transaction: TransactionPayload): string | undefined {
  const signature = transaction.signature;
  if (Array.isArray(signature) && typeof signature[0] === "string") return signature[0];
  return typeof signature === "string" ? signature : undefined;
}

function getErrorString(error: unknown, key: "name" | "message"): string | undefined {
  return error && typeof error === "object" && key in error ? String((error as Record<string, unknown>)[key]) : undefined;
}

function getErrorCode(error: unknown): string | number | undefined {
  return error && typeof error === "object" && "code" in error ? ((error as { code?: string | number }).code) : undefined;
}

function isUserRejectedError(code: string | number | undefined, message: string): boolean {
  return code === 4001 || code === "4001" || code === "USER_REJECTED" || /reject|denied|cancel/i.test(message);
}
