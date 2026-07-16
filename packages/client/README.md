# @tron-wallet-kit/client

Headless client orchestration for TRON Wallet Kit. This package composes core wallet management, wallet descriptors, adapters, UI controllers, balance, identity, and transaction helpers.

## Install

```sh
pnpm add @tron-wallet-kit/client@beta
```

## Quick Start

```ts
import { createWalletKit } from "@tron-wallet-kit/client";

const kit = createWalletKit({
  metadata: {
    name: "My TRON dApp",
    description: "Wallet connection for My TRON dApp",
    url: window.location.origin,
    icons: [`${window.location.origin}/icon.png`]
  },
  network: "mainnet",
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  ui: { themeName: "light", toast: true }
});

kit.openModal();
```

If `walletConnectProjectId` is omitted, the WalletConnect adapter is not created.

`metadata` is used by WalletConnect and future auth prompts to identify the dApp. Legacy aliases
(`appName`, `appDescription`, `appUrl`, `appIcons`) are still accepted, but new integrations should
prefer `metadata`.

## Common APIs

- `createWalletKit(config)`
- `createWalletClient(config)`
- `createDefaultAdapters(config)`
- `kit.openModal()`
- `kit.disconnect()`
- `kit.refreshBalance()`
- `kit.refreshIdentity()`
- `kit.signMessage(request)`
- `kit.transferTrx(request)`
- `kit.transferTrc20(request)`
- `kit.triggerSmartContract(request)`

React dapps should normally consume these through `@tron-wallet-kit/react`.

## Status

This package is part of the TRON Wallet Kit beta release line. Use the `beta` npm tag until the stable public release is announced.

## License

MIT
