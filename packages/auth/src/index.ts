export type AuthMessageInput = {
  domain: string;
  address: string;
  statement?: string;
  uri?: string;
  version?: string;
  chainId?: string;
  nonce?: string;
  issuedAt?: string;
  expirationTime?: string;
};

export type SignInVerificationInput = {
  address: string;
  message: string;
  signatureKind: "signature" | "signedTx";
  proof: string;
  signature?: string;
  txBlob?: string;
  publicKey?: string;
  issuedAt?: string;
  expiresAt?: string;
  statement?: string;
  raw?: unknown;
};

export type SignInVerificationResult = SignInVerificationInput & {
  valid: boolean;
  reason?: string;
};

export type VerifyTronSignatureOptions = {
  verifier?: (input: SignInVerificationInput) => boolean | Promise<boolean>;
};

export function generateNonce(size = 16): string {
  const bytes = new Uint8Array(size);
  globalThis.crypto?.getRandomValues?.(bytes);
  if (bytes.some(Boolean)) return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export function createAuthMessage(input: AuthMessageInput): string {
  return createSignInMessage(input);
}

export function createSignInMessage(input: AuthMessageInput): string {
  const issuedAt = input.issuedAt ?? new Date().toISOString();
  const nonce = input.nonce ?? generateNonce();
  const lines = [
    `${input.domain} wants you to sign in with your TRON account:`,
    input.address,
    "",
    input.statement ?? "Sign in to continue.",
    "",
    input.uri ? `URI: ${input.uri}` : undefined,
    `Version: ${input.version ?? "1"}`,
    input.chainId ? `Chain ID: ${input.chainId}` : undefined,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    input.expirationTime ? `Expiration Time: ${input.expirationTime}` : undefined
  ];

  return lines.filter((line): line is string => line !== undefined).join("\n");
}

export async function verifySignIn(
  input: SignInVerificationInput,
  options: VerifyTronSignatureOptions = {}
): Promise<SignInVerificationResult> {
  if (!input.proof && !input.signature && !input.txBlob) {
    return { ...input, valid: false, reason: "Missing signature proof." };
  }
  if (input.expiresAt && Date.parse(input.expiresAt) < Date.now()) {
    return { ...input, valid: false, reason: "Sign-in proof expired." };
  }
  const valid = await verifyTronSignature(input, options);
  return {
    ...input,
    valid,
    ...(valid ? {} : { reason: "Signature verification failed." })
  };
}

export async function verifyTronSignature(
  input: SignInVerificationInput,
  options: VerifyTronSignatureOptions = {}
): Promise<boolean> {
  if (input.signatureKind !== "signature") return false;
  if (options.verifier) return Boolean(await options.verifier(input));
  return Boolean(input.address && input.message && (input.signature ?? input.proof));
}
