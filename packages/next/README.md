# @tron-wallet-kit/next

Next.js helpers for TRON Wallet Kit. This package is reserved for SSR-safe App Router integration and client-boundary helpers.

## Install

```sh
pnpm add @tron-wallet-kit/next@beta
```

## Guidance

Wallet detection must run only in the browser. In Next.js App Router, put wallet UI behind a client component:

```tsx
"use client";

import { TronKitProvider, TronConnectButton, getDefaultConfig } from "@tron-wallet-kit/react";

const config = getDefaultConfig({
  appName: "My TRON dApp",
  network: "mainnet",
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
});

export function WalletBoundary() {
  return (
    <TronKitProvider config={config}>
      <TronConnectButton />
    </TronKitProvider>
  );
}
```

Do not read `window`, `document`, injected wallet providers, or WalletConnect browser APIs from Server Components.

## Status

This package is part of the TRON Wallet Kit beta release line. Use the `beta` npm tag until the stable public release is announced.

## License

MIT
