# Sign-In with TRON

Prove a user controls a TRON address by having them sign a message — the TRON equivalent of
"Sign-In with Ethereum". `@tron-wallet-kit/auth` gives you the message builder and a server-side
verifier; the wallet does the signing through the kit.

```sh
pnpm add @tron-wallet-kit/auth
```

## The flow

1. User connects their wallet.
2. Server issues a one-time **nonce**.
3. Client builds a sign-in message and asks the wallet to sign it.
4. Server verifies the signature and starts a session.

## Client

```ts
import { createSignInMessage } from "@tron-wallet-kit/auth";
import { useTronAccount, useSignMessage } from "@tron-wallet-kit/react";

async function signIn(address: string) {
  const nonce = await fetch("/auth/nonce").then((r) => r.text());

  const message = createSignInMessage({
    address,
    domain: window.location.host,
    uri: window.location.origin,
    statement: "Sign in to My dApp",
    nonce,
  });

  const { signMessage } = useSignMessage();
  const { signature } = await signMessage(message);

  await fetch("/auth/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, signature, address }),
  });
}
```

In a vanilla app, use `kit.signMessage(message)` instead of the hook.

## Controller

`createWalletAuth` wraps nonce, message creation, wallet signing, and backend verification in a
small state machine.

```ts
import { createTronAuthenticationAdapter, createWalletAuth } from "@tron-wallet-kit/auth";

const authAdapter = createTronAuthenticationAdapter({
  getNonce: async () => fetch("/auth/nonce").then((r) => r.text()),
  verify: async (input) =>
    fetch("/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }).then((r) => r.json()),
});

const auth = createWalletAuth(kit.manager, authAdapter, {
  domain: window.location.host,
  uri: window.location.origin,
  statement: "Sign in to My dApp",
});

const state = await auth.signIn();
```

The state is one of `unauthenticated`, `loading`, `authenticated`, or `error`. Subscribe to it when
you need to drive custom UI.

## Server

```ts
import { generateNonce, verifySignIn } from "@tron-wallet-kit/auth";

// GET /auth/nonce — store it against the session/cookie
export function nonce() {
  const value = generateNonce();
  // persist `value` so you can check it in verify
  return value;
}

// POST /auth/verify
export async function verify(body: { message: string; signature: string; address: string }) {
  const result = await verifySignIn({
    message: body.message,
    signature: body.signature,
    address: body.address,
  });

  if (!result.valid) throw new Error("Invalid signature");
  // check the nonce inside `message` matches the one you issued, then start a session
  return result;
}
```

## Message format

`createSignInMessage` produces a human-readable message containing the domain, address, statement,
URI, and nonce, so the user sees exactly what they're signing. Always bind the nonce to the user's
session and reject a message whose nonce you didn't issue (or that you've already consumed) to
prevent replay.

::: warning
Verify on the server, never trust a client-side "valid" flag. Treat the nonce as single-use.
:::
