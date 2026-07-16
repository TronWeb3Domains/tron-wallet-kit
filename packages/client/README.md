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

## Transaction Preview

Use `transactionPreview` to inspect or confirm a human-readable summary before the kit asks the
wallet to sign. The resolver receives the normalized sign request plus a TRON-native default preview
for common helpers such as `transferTrx`, `transferTrc20`, and `triggerSmartContract`.

```ts
const kit = createWalletKit({
  metadata: { name: "My TRON dApp" },
  transactionPreview: async (request, context) => {
    console.log(context.defaultPreview.summary);
    // Return a custom preview, open your own confirmation UI, or throw to cancel.
  }
});
```

## Recent Transactions

Broadcasted transactions are stored per `account + network` and are exposed through
`kit.manager.getTransactions()`. The account panel uses the same list for its recent transaction
view.

```ts
const kit = createWalletKit({
  metadata: { name: "My TRON dApp" },
  useBrowserStorage: true,
  transactionStore: {
    max: 20,
    staleSubmittedMs: 10 * 60 * 1000
  }
});
```

## Status

This package is part of the TRON Wallet Kit beta release line. Use the `beta` npm tag until the stable public release is announced.

## License

MIT
