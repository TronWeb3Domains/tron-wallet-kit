# @tron-wallet-kit/auth

Authentication message helpers for TRON Wallet Kit. This package contains Sign-In With TRON oriented utilities for nonce/message/signature flows.

## Install

```sh
pnpm add @tron-wallet-kit/auth@latest
```

## Use This Package When

- You need a stable message format for wallet-based login.
- You want to verify TRON wallet signatures on your auth backend.
- You are preparing a SIWT-style flow to integrate with `@tron-wallet-kit/react`.

The authentication adapter surface is still evolving. Keep backend verification explicit and do not treat this package as a complete auth server.

## App Metadata Alignment

Use the same app identity you pass to `@tron-wallet-kit/client`:

```ts
const metadata = {
  name: "My TRON dApp",
  description: "Wallet connection for My TRON dApp",
  url: "https://my-tron-app.example",
  icons: ["https://my-tron-app.example/icon.png"]
};
```

For Sign-In with TRON flows, prefer `metadata.name` for human-readable prompts and `metadata.url`
for the domain / URI context. This keeps WalletConnect approval screens and auth messages describing
the same dApp.

## Typical Flow

```ts
import { createSignInMessage } from "@tron-wallet-kit/auth";

const message = createSignInMessage({
  domain: new URL(metadata.url).host,
  address,
  statement: `Sign in to ${metadata.name}`,
  uri: metadata.url,
  nonce,
  issuedAt: new Date().toISOString()
});
```

## Controller Flow

For client-side orchestration, use `createWalletAuth(manager, adapter)`. The controller exposes a
small state machine: `unauthenticated`, `loading`, `authenticated`, and `error`.

```ts
import { createTronAuthenticationAdapter, createWalletAuth } from "@tron-wallet-kit/auth";

const authAdapter = createTronAuthenticationAdapter({
  getNonce: async () => fetch("/auth/nonce").then((r) => r.text()),
  verify: async (input) =>
    fetch("/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    }).then((r) => r.json())
});

const auth = createWalletAuth(kit.manager, authAdapter, {
  domain: new URL(metadata.url).host,
  uri: metadata.url,
  statement: `Sign in to ${metadata.name}`
});

const state = await auth.signIn();
```

## Status

This package is part of the TRON Wallet Kit 0.1.0 release line and is intended for the npm `latest` tag.

## License

MIT
