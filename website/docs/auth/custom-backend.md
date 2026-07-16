# Custom Auth Backend

Use `@tron-wallet-kit/auth` to keep the wallet-signing flow explicit while your backend remains in
control of nonce storage, replay protection, and session creation.

## Backend contract

Expose two endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /auth/nonce` | Create and store a one-time nonce for the browser session. |
| `POST /auth/verify` | Verify the signed message, consume the nonce, and create an app session. |

## Nonce endpoint

```ts
import { generateNonce } from "@tron-wallet-kit/auth";

export async function createNonce(sessionId: string) {
  const nonce = generateNonce();
  await db.authNonce.create({
    data: {
      sessionId,
      nonce,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      consumedAt: null,
    },
  });
  return nonce;
}
```

## Verify endpoint

```ts
import { verifySignIn } from "@tron-wallet-kit/auth";

export async function verifySignInRequest(body: {
  address: string;
  message: string;
  proof: string;
  signature?: string;
}) {
  const result = await verifySignIn({
    address: body.address,
    message: body.message,
    proof: body.proof,
    signature: body.signature,
    signatureKind: "signature",
  });

  if (!result.valid) throw new Error(result.reason ?? "Invalid signature");

  const nonce = extractNonce(body.message);
  const stored = await db.authNonce.findUnique({ where: { nonce } });
  if (!stored || stored.consumedAt || stored.expiresAt < new Date()) {
    throw new Error("Invalid nonce");
  }

  await db.authNonce.update({
    where: { nonce },
    data: { consumedAt: new Date() },
  });

  return createAppSession({ address: body.address });
}
```

## Client controller

```ts
import { createTronAuthenticationAdapter, createWalletAuth } from "@tron-wallet-kit/auth";

const auth = createWalletAuth(
  kit.manager,
  createTronAuthenticationAdapter({
    getNonce: () => fetch("/auth/nonce").then((r) => r.text()),
    verify: (input) =>
      fetch("/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }).then((r) => r.json()),
  }),
  {
    domain: window.location.host,
    uri: window.location.origin,
    statement: "Sign in to continue.",
  }
);

const state = await auth.signIn();
```

## Security rules

- Store nonces server-side.
- Make nonces single-use.
- Expire nonces quickly.
- Bind nonces to the browser session or CSRF token.
- Check the signed address matches the connected account you authorize.
- Verify on the server; never trust a client-side `valid` flag.
