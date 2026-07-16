import type { SignMessageResult, WalletManager, WalletSession } from "@tron-wallet-kit/core";
import type { AuthMessageInput, SignInVerificationInput, SignInVerificationResult } from "./index";

export type TronAuthState =
  | { status: "unauthenticated"; session?: WalletSession }
  | { status: "loading"; session: WalletSession }
  | { status: "authenticated"; session: WalletSession; proof: SignInVerificationResult }
  | { status: "error"; session?: WalletSession; error: unknown };

export type TronAuthAdapter = {
  getNonce(input: { session: WalletSession }): Promise<string> | string;
  createMessage?(input: AuthMessageInput & { session: WalletSession }): Promise<string> | string;
  verify(input: SignInVerificationInput & { session: WalletSession }): Promise<SignInVerificationResult> | SignInVerificationResult;
};

export type TronAuthControllerOptions = {
  domain?: string;
  statement?: string;
  uri?: string;
  version?: string;
  chainId?: string;
  expirationTime?: string;
};

export type TronAuthController = {
  getState(): TronAuthState;
  signIn(): Promise<TronAuthState>;
  signOut(): void;
  subscribe(listener: (state: TronAuthState) => void): () => void;
  destroy(): void;
};

export function createTronAuthenticationAdapter(adapter: TronAuthAdapter): TronAuthAdapter {
  return adapter;
}

export function createWalletAuth(manager: WalletManager, adapter: TronAuthAdapter, options: TronAuthControllerOptions = {}): TronAuthController {
  let state: TronAuthState = { status: "unauthenticated", ...(manager.getSession() ? { session: manager.getSession()! } : {}) };
  const listeners = new Set<(state: TronAuthState) => void>();
  const off = [
    manager.on("connected", ({ session }) => setState({ status: "unauthenticated", session })),
    manager.on("session_restored", ({ session }) => setState({ status: "unauthenticated", session })),
    manager.on("disconnected", () => setState({ status: "unauthenticated" })),
    manager.on("session_expired", () => setState({ status: "unauthenticated" })),
    manager.on("session_stale", () => setState({ status: "unauthenticated" }))
  ];
  const setState = (next: TronAuthState) => {
    state = next;
    listeners.forEach((listener) => listener(state));
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    signOut() {
      const session = manager.getSession() ?? undefined;
      setState({ status: "unauthenticated", ...(session ? { session } : {}) });
    },
    destroy() {
      off.forEach((unsubscribe) => unsubscribe());
      listeners.clear();
    },
    async signIn() {
      const session = manager.getSession();
      if (!session) {
        const error = new Error("Wallet is not connected.");
        setState({ status: "error", error });
        return state;
      }
      setState({ status: "loading", session });
      try {
        const nonce = await adapter.getNonce({ session });
        const messageInput: AuthMessageInput & { session: WalletSession } = {
          domain: options.domain ?? resolveDomain(options.uri),
          address: session.account.address,
          nonce,
          issuedAt: new Date().toISOString(),
          session,
          ...(options.statement ? { statement: options.statement } : {}),
          ...(options.uri ? { uri: options.uri } : {}),
          ...(options.version ? { version: options.version } : {}),
          ...((options.chainId ?? session.network.walletConnectChainId ?? session.network.id)
            ? { chainId: options.chainId ?? session.network.walletConnectChainId ?? session.network.id }
            : {}),
          ...(options.expirationTime ? { expirationTime: options.expirationTime } : {})
        };
        const message = adapter.createMessage ? await adapter.createMessage(messageInput) : createDefaultSignInMessage(messageInput);
        const signed = await manager.signMessage({ message });
        const verificationInput = createVerificationInput(session, message, signed);
        const proof = await adapter.verify({ ...verificationInput, session });
        const next: TronAuthState = proof.valid ? { status: "authenticated", session, proof } : { status: "error", session, error: proof.reason ?? "Authentication failed." };
        setState(next);
        return next;
      } catch (error) {
        const next: TronAuthState = { status: "error", session, error };
        setState(next);
        return next;
      }
    }
  };
}

function createDefaultSignInMessage(input: AuthMessageInput): string {
  const lines = [
    `${input.domain} wants you to sign in with your TRON account:`,
    input.address,
    "",
    input.statement ?? "Sign in to continue.",
    "",
    input.uri ? `URI: ${input.uri}` : undefined,
    `Version: ${input.version ?? "1"}`,
    input.chainId ? `Chain ID: ${input.chainId}` : undefined,
    `Nonce: ${input.nonce ?? ""}`,
    `Issued At: ${input.issuedAt ?? new Date().toISOString()}`,
    input.expirationTime ? `Expiration Time: ${input.expirationTime}` : undefined
  ];

  return lines.filter((line): line is string => line !== undefined).join("\n");
}

function createVerificationInput(session: WalletSession, message: string, signed: SignMessageResult): SignInVerificationInput {
  return {
    address: session.account.address,
    message,
    signatureKind: signed.signatureKind,
    proof: signed.proof ?? signed.signature ?? signed.txBlob ?? "",
    ...(signed.signature ? { signature: signed.signature } : {}),
    ...(signed.txBlob ? { txBlob: signed.txBlob } : {}),
    ...(signed.publicKey ? { publicKey: signed.publicKey } : {}),
    raw: signed.raw
  };
}

function resolveDomain(uri: string | undefined): string {
  if (!uri) return "TRON dApp";
  try {
    return new URL(uri).host;
  } catch {
    return uri;
  }
}
