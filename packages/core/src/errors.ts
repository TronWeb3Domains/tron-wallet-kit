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
