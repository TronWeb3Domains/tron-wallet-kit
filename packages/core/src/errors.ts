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
  CONNECTION_FAILED: "CONNECTION_FAILED",
  CONNECTION_REJECTED: "USER_REJECTED",
  REQUEST_TIMEOUT: "REQUEST_TIMEOUT",
  SIGN_FAILED: "SIGN_MESSAGE_FAILED",
  SIGN_REJECTED: "USER_REJECTED",
  UNSUPPORTED: "UNSUPPORTED",
  NOT_CONNECTED: "NO_SESSION",
  UNKNOWN: "UNKNOWN_ERROR"
} as const;

export type WalletKitErrorCode = (typeof WalletKitErrorCode)[keyof typeof WalletKitErrorCode];

export const createWalletError = {
  walletNotFound: (adapterId: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.WALLET_NOT_FOUND, `Unknown wallet adapter: ${adapterId}`, cause),
  walletNotAvailable: (name: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.WALLET_NOT_AVAILABLE, `${name} provider is not available`, cause),
  connectionRejected: (name: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.CONNECTION_REJECTED, `${name} connection was rejected`, cause),
  connectionFailed: (name: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.CONNECTION_FAILED, `Failed to connect ${name}`, cause),
  requestTimeout: (message: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.REQUEST_TIMEOUT, message, cause),
  notConnected: () => new WalletKitError(WalletKitErrorCode.NOT_CONNECTED, "No wallet is connected"),
  unsupported: (message: string, cause?: unknown) => new WalletKitError(WalletKitErrorCode.UNSUPPORTED, message, cause),
  unknown: (cause?: unknown) => new WalletKitError(WalletKitErrorCode.UNKNOWN, cause instanceof Error ? cause.message : String(cause), cause)
};

export function normalizeWalletError(error: unknown): WalletKitError {
  if (error instanceof WalletKitError) return error;
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  if (/reject|denied|cancel|closed|4001/.test(normalized)) return createWalletError.connectionRejected("Wallet", error);
  if (/timeout|timed out/.test(normalized)) return createWalletError.requestTimeout(message, error);
  if (/not available|not installed|not found/.test(normalized)) return createWalletError.walletNotAvailable("Wallet", error);
  return createWalletError.unknown(error);
}
