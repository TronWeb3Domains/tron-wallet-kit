# Next.js Auth

This page shows a minimal App Router pattern for Sign-In with TRON. The wallet signs in the browser;
your route handlers issue and verify nonces.

## Client component

```tsx
"use client";

import { createTronAuthenticationAdapter, createWalletAuth } from "@tron-wallet-kit/auth";
import { useTronKit } from "@tron-wallet-kit/react";

export function SignInButton() {
  const kit = useTronKit();

  async function signIn() {
    const auth = createWalletAuth(
      kit.manager,
      createTronAuthenticationAdapter({
        getNonce: () => fetch("/api/auth/nonce").then((r) => r.text()),
        verify: (input) =>
          fetch("/api/auth/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(input),
          }).then((r) => r.json()),
      }),
      {
        domain: window.location.host,
        uri: window.location.origin,
        statement: "Sign in to My TRON dApp",
      }
    );

    const state = await auth.signIn();
    if (state.status !== "authenticated") throw new Error("Sign-in failed");
  }

  return <button onClick={signIn}>Sign in</button>;
}
```

## Nonce route

```ts
// app/api/auth/nonce/route.ts
import { generateNonce } from "@tron-wallet-kit/auth";

export async function GET() {
  const nonce = generateNonce();
  // Store nonce in your session, database, or encrypted cookie.
  return new Response(nonce, {
    headers: { "content-type": "text/plain" },
  });
}
```

## Verify route

```ts
// app/api/auth/verify/route.ts
import { verifySignIn } from "@tron-wallet-kit/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await verifySignIn({
    address: body.address,
    message: body.message,
    proof: body.proof,
    signature: body.signature,
    signatureKind: body.signatureKind,
  });

  if (!result.valid) {
    return Response.json({ valid: false, reason: result.reason }, { status: 401 });
  }

  // Check and consume the nonce from `body.message` before creating a session.
  return Response.json({ valid: true, address: result.address });
}
```

## SSR boundaries

- Keep wallet UI in client components.
- Keep nonce storage and signature verification in route handlers or server actions.
- Do not import browser-only wallet kit modules from server components.
- Pass `metadata` consistently to the kit and to auth copy.
