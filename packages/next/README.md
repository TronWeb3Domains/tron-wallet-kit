# @tron-wallet-kit/next

Next.js helpers for TRON Wallet Kit. This package is reserved for SSR-safe App Router integration and client-boundary helpers.

## Install

```sh
pnpm add @tron-wallet-kit/next@latest
```

## Guidance

Wallet detection must run only in the browser. In Next.js App Router, put wallet UI behind a client component:

```tsx
"use client";

import { TronKitProvider, TronConnectButton, getDefaultConfig } from "@tron-wallet-kit/react";

const config = getDefaultConfig({
  metadata: {
    name: "My TRON dApp",
    description: "Wallet connection for My TRON dApp",
    url: "https://my-tron-app.example",
    icons: ["https://my-tron-app.example/icon.png"]
  },
  network: "mainnet",
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  gasFree: {
    enabled: true,
    apiBaseUrl: "/api/gasfree"
  }
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

For GasFree, keep provider API signing in a Route Handler or backend service. Client Components should
point `gasFree.apiBaseUrl` to that same-origin route, not to code that exposes API secrets in the
browser bundle.

## Status

This package is part of the TRON Wallet Kit 0.1.1 release line and is intended for the npm `latest` tag.

## License

MIT
