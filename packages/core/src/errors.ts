export class WalletKitError extends Error {
  readonly code: string;
  override readonly cause?: unknown;

  constructor(
    code: string,
    message: string,
    cause?: unknown
  ) {
    super(message);
    this.code = code;
    if (cause !== undefined) this.cause = cause;
    this.name = "WalletKitError";
  }
}

export const WalletKitErrorCode = {
  WALLET_NOT_FOUND: "WALLET_NOT_FOUND",
  WALLET_NOT_AVAILABLE: "WALLET_UNAVAILABLE",
  WALLET_UNSUPPORTED: "WALLET_UNSUPPORTED",
  CONNECTION_FAILED: "CONNECTION_FAILED",
  CONNECTION_REJECTED: "USER_REJECTED",
  REQUEST_TIMEOUT: "REQUEST_TIMEOUT",
  SIGN_FAILED: "SIGN_MESSAGE_FAILED",
  SIGN_REJECTED: "USER_REJECTED",
  SIGN_TRANSACTION_FAILED: "SIGN_TRANSACTION_FAILED",
  INVALID_SIGNATURE: "INVALID_SIGNATURE",
  INVALID_TRANSACTION: "INVALID_TRANSACTION",
  INVALID_TRANSACTION_SIGNATURE: "INVALID_TRANSACTION_SIGNATURE",
  INVALID_TX_RESULT: "INVALID_TX_RESULT",
  SEND_TRANSACTION_FAILED: "SEND_TRANSACTION_FAILED",
  TRANSACTION_EXPIRATION_ERROR: "TRANSACTION_EXPIRATION_ERROR",
  OUT_OF_ENERGY: "OUT_OF_ENERGY",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  NETWORK_ERROR: "NETWORK_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  UNKNOWN_NETWORK: "UNKNOWN_NETWORK",
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
  UNSUPPORTED: "UNSUPPORTED",
  NOT_CONNECTED: "NO_SESSION",
  UNKNOWN: "UNKNOWN_ERROR"
} as const;

export type WalletKitErrorCode = (typeof WalletKitErrorCode)[keyof typeof WalletKitErrorCode];

export type WalletKitErrorCategory =
  | "wallet"
  | "connection"
  | "session"
  | "request"
  | "signing"
  | "transaction"
  | "network"
  | "configuration"
  | "unsupported"
  | "unknown";

export type WalletKitErrorSeverity = "info" | "warning" | "error";

export type WalletKitErrorDefinition = {
  code: string;
  category: WalletKitErrorCategory;
  severity: WalletKitErrorSeverity;
  retryable: boolean;
  title: string;
  message: string;
};

export type WalletKitErrorMessage = {
  title?: string;
  message?: string;
  retryable?: boolean;
};

export type WalletKitErrorMessageCatalog = {
  fallbackTitle?: string;
  fallbackMessage?: string;
  codes?: Partial<Record<string, WalletKitErrorMessage>>;
};

export type WalletKitFormattedError = {
  code: string;
  title: string;
  message: string;
  details?: string;
  category: WalletKitErrorCategory;
  severity: WalletKitErrorSeverity;
  retryable: boolean;
};

const DEFAULT_ERROR_DEFINITION: WalletKitErrorDefinition = {
  code: WalletKitErrorCode.UNKNOWN,
  category: "unknown",
  severity: "error",
  retryable: true,
  title: "Request failed",
  message: "The wallet request failed. Try again."
};

export const WALLET_KIT_ERROR_DEFINITIONS: Record<string, WalletKitErrorDefinition> = {
  WALLET_NOT_FOUND: {
    code: WalletKitErrorCode.WALLET_NOT_FOUND,
    category: "wallet",
    severity: "error",
    retryable: false,
    title: "Wallet not found",
    message: "This wallet is not registered in the current wallet kit configuration."
  },
  WALLET_UNAVAILABLE: {
    code: WalletKitErrorCode.WALLET_NOT_AVAILABLE,
    category: "wallet",
    severity: "warning",
    retryable: false,
    title: "Wallet unavailable",
    message: "This wallet is not available in the current browser."
  },
  WALLET_UNSUPPORTED: {
    code: WalletKitErrorCode.WALLET_UNSUPPORTED,
    category: "unsupported",
    severity: "warning",
    retryable: false,
    title: "Wallet unsupported",
    message: "This wallet does not support the requested TRON action."
  },
  CONNECTION_FAILED: {
    code: WalletKitErrorCode.CONNECTION_FAILED,
    category: "connection",
    severity: "error",
    retryable: true,
    title: "Connection failed",
    message: "The wallet connection failed. Try again."
  },
  USER_REJECTED: {
    code: WalletKitErrorCode.CONNECTION_REJECTED,
    category: "connection",
    severity: "info",
    retryable: true,
    title: "Connection declined",
    message: "The request was cancelled in the wallet."
  },
  REQUEST_TIMEOUT: {
    code: WalletKitErrorCode.REQUEST_TIMEOUT,
    category: "request",
    severity: "warning",
    retryable: true,
    title: "Request timed out",
    message: "The wallet did not respond in time. Try again."
  },
  NO_SESSION: {
    code: WalletKitErrorCode.NOT_CONNECTED,
    category: "session",
    severity: "warning",
    retryable: false,
    title: "Wallet not connected",
    message: "Connect a TRON wallet before continuing."
  },
  SIGN_MESSAGE_FAILED: {
    code: WalletKitErrorCode.SIGN_FAILED,
    category: "signing",
    severity: "error",
    retryable: true,
    title: "Signing failed",
    message: "The wallet could not sign the message."
  },
  SIGN_TRANSACTION_FAILED: {
    code: WalletKitErrorCode.SIGN_TRANSACTION_FAILED,
    category: "signing",
    severity: "error",
    retryable: true,
    title: "Transaction signing failed",
    message: "The wallet could not sign the transaction."
  },
  INVALID_SIGNATURE: {
    code: WalletKitErrorCode.INVALID_SIGNATURE,
    category: "signing",
    severity: "error",
    retryable: true,
    title: "Invalid signature",
    message: "The wallet returned an invalid signature."
  },
  INVALID_TRANSACTION: {
    code: WalletKitErrorCode.INVALID_TRANSACTION,
    category: "transaction",
    severity: "error",
    retryable: false,
    title: "Invalid transaction",
    message: "The transaction payload is invalid."
  },
  INVALID_TRANSACTION_SIGNATURE: {
    code: WalletKitErrorCode.INVALID_TRANSACTION_SIGNATURE,
    category: "transaction",
    severity: "error",
    retryable: true,
    title: "Invalid transaction signature",
    message: "The wallet did not return a valid signed transaction."
  },
  INVALID_TX_RESULT: {
    code: WalletKitErrorCode.INVALID_TX_RESULT,
    category: "transaction",
    severity: "error",
    retryable: true,
    title: "Invalid transaction result",
    message: "The wallet returned an invalid transaction result."
  },
  SEND_TRANSACTION_FAILED: {
    code: WalletKitErrorCode.SEND_TRANSACTION_FAILED,
    category: "transaction",
    severity: "error",
    retryable: true,
    title: "Transaction failed",
    message: "The transaction could not be broadcast to the TRON network."
  },
  TRANSACTION_EXPIRATION_ERROR: {
    code: WalletKitErrorCode.TRANSACTION_EXPIRATION_ERROR,
    category: "transaction",
    severity: "warning",
    retryable: true,
    title: "Transaction expired",
    message: "The transaction expired before it was broadcast. Rebuild and sign it again."
  },
  OUT_OF_ENERGY: {
    code: WalletKitErrorCode.OUT_OF_ENERGY,
    category: "transaction",
    severity: "warning",
    retryable: false,
    title: "Not enough energy",
    message: "The account does not have enough TRON energy for this transaction."
  },
  INSUFFICIENT_BALANCE: {
    code: WalletKitErrorCode.INSUFFICIENT_BALANCE,
    category: "transaction",
    severity: "warning",
    retryable: false,
    title: "Insufficient balance",
    message: "The account balance is not enough for this transaction."
  },
  NETWORK_ERROR: {
    code: WalletKitErrorCode.NETWORK_ERROR,
    category: "network",
    severity: "error",
    retryable: true,
    title: "Network error",
    message: "The TRON network request failed. Check the RPC endpoint and try again."
  },
  RATE_LIMITED: {
    code: WalletKitErrorCode.RATE_LIMITED,
    category: "network",
    severity: "warning",
    retryable: true,
    title: "Rate limited",
    message: "The TRON RPC endpoint is rate limiting requests. Try again shortly."
  },
  UNKNOWN_NETWORK: {
    code: WalletKitErrorCode.UNKNOWN_NETWORK,
    category: "network",
    severity: "error",
    retryable: false,
    title: "Unknown network",
    message: "The selected TRON network is not supported by this configuration."
  },
  CONFIGURATION_ERROR: {
    code: WalletKitErrorCode.CONFIGURATION_ERROR,
    category: "configuration",
    severity: "error",
    retryable: false,
    title: "Configuration error",
    message: "The wallet kit configuration is incomplete or invalid."
  },
  UNSUPPORTED: {
    code: WalletKitErrorCode.UNSUPPORTED,
    category: "unsupported",
    severity: "warning",
    retryable: false,
    title: "Unsupported action",
    message: "This wallet does not support the requested action."
  },
  UNKNOWN_ERROR: DEFAULT_ERROR_DEFINITION
};

export const createWalletError = {
  walletNotFound: (adapterId: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.WALLET_NOT_FOUND, `Unknown wallet adapter: ${adapterId}`, cause),
  walletNotAvailable: (name: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.WALLET_NOT_AVAILABLE, `${name} provider is not available`, cause),
  connectionRejected: (name: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.CONNECTION_REJECTED, `${name} connection was rejected`, cause),
  connectionFailed: (name: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.CONNECTION_FAILED, `Failed to connect ${name}`, cause),
  requestTimeout: (message: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.REQUEST_TIMEOUT, message, cause),
  notConnected: () => new WalletKitError(WalletKitErrorCode.NOT_CONNECTED, "No wallet is connected"),
  signMessageFailed: (name: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.SIGN_FAILED, `${name} could not sign the message`, cause),
  signTransactionFailed: (name: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.SIGN_TRANSACTION_FAILED, `${name} could not sign the transaction`, cause),
  sendTransactionFailed: (message = "Transaction broadcast failed", cause?: unknown) => new WalletKitError(WalletKitErrorCode.SEND_TRANSACTION_FAILED, message, cause),
  invalidTransaction: (message: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.INVALID_TRANSACTION, message, cause),
  configuration: (message: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.CONFIGURATION_ERROR, message, cause),
  network: (message: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.NETWORK_ERROR, message, cause),
  unsupported: (message: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.UNSUPPORTED, message, cause),
  unknown: (cause?: unknown) => new WalletKitError(WalletKitErrorCode.UNKNOWN, cause instanceof Error ? cause.message : String(cause), cause)
};

export function normalizeWalletError(error: unknown): WalletKitError {
  if (error instanceof WalletKitError) return error;
  const message = extractWalletErrorMessage(error);
  const code = extractWalletErrorCode(error);
  const normalized = message.toLowerCase();
  if (code === "4001" || code === "USER_REJECTED" || /reject|rejected|denied|cancel|cancelled|closed|4001/.test(normalized)) return createWalletError.connectionRejected("Wallet", error);
  if (/timeout|timed out/.test(normalized)) return createWalletError.requestTimeout(message, error);
  if (/not available|not installed|not found|provider was not found|provider is not available/.test(normalized)) return createWalletError.walletNotAvailable("Wallet", error);
  if (/dynamically imported module|importing a module script failed|failed to fetch dynamically/i.test(message)) return createWalletError.configuration("Wallet adapter bundle could not be loaded.", error);
  if (/transaction_expiration_error|transaction expired|\bexpired\b/.test(normalized)) return new WalletKitError(WalletKitErrorCode.TRANSACTION_EXPIRATION_ERROR, message, error);
  if (/out_of_energy|not enough energy|energy is not enough|bandwidth/.test(normalized)) return new WalletKitError(WalletKitErrorCode.OUT_OF_ENERGY, message, error);
  if (/insufficient balance|balance is not enough|account balance/i.test(message)) return new WalletKitError(WalletKitErrorCode.INSUFFICIENT_BALANCE, message, error);
  if (/rate limit|too many requests|\b429\b/.test(normalized)) return new WalletKitError(WalletKitErrorCode.RATE_LIMITED, message, error);
  if (/network error|failed to fetch|fetch failed|econn|etimedout|rpc|node error/.test(normalized)) return createWalletError.network(message, error);
  if (code && WALLET_KIT_ERROR_DEFINITIONS[code]) return new WalletKitError(code, message, error);
  return createWalletError.unknown(error);
}

export function formatWalletError(error: unknown, options: { messages?: WalletKitErrorMessageCatalog; includeDetails?: boolean; maxDetailLength?: number } = {}): WalletKitFormattedError {
  const normalized = normalizeWalletError(error);
  const definition = WALLET_KIT_ERROR_DEFINITIONS[normalized.code] ?? { ...DEFAULT_ERROR_DEFINITION, code: normalized.code };
  const override = options.messages?.codes?.[normalized.code];
  const detail = sanitizeWalletErrorMessage(normalized.message, options.maxDetailLength ?? 160);
  const message = override?.message ?? definition.message ?? options.messages?.fallbackMessage ?? DEFAULT_ERROR_DEFINITION.message;
  const title = override?.title ?? definition.title ?? options.messages?.fallbackTitle ?? DEFAULT_ERROR_DEFINITION.title;

  return {
    code: normalized.code,
    title,
    message,
    ...(options.includeDetails && detail && detail !== message ? { details: detail } : {}),
    category: definition.category,
    severity: definition.severity,
    retryable: override?.retryable ?? definition.retryable
  };
}

export function sanitizeWalletErrorMessage(message: string, maxLength = 160): string {
  const compact = message
    .replace(/https?:\/\/\S+/g, "[url]")
    .replace(/[A-Z]:\\[^\s]+/gi, "[path]")
    .replace(/\s+/g, " ")
    .trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, Math.max(0, maxLength - 3))}...`;
}

function extractWalletErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "number" || typeof error === "boolean" || error == null) return String(error);
  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const direct = record.message ?? record.error ?? record.reason ?? record.shortMessage;
    if (typeof direct === "string" && direct.trim()) return direct;
    if (typeof record.result === "string" && record.result.trim()) return record.result;
    try {
      return JSON.stringify(record);
    } catch {
      return Object.prototype.toString.call(error);
    }
  }
  return String(error);
}

function extractWalletErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const value = (error as { code?: unknown }).code;
  if (typeof value === "string" || typeof value === "number") return String(value);
  return undefined;
}
