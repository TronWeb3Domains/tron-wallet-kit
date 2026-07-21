# @tron-wallet-kit/client

Headless client orchestration for TRON Wallet Kit. This package composes core wallet management, wallet descriptors, adapters, UI controllers, balance, identity, GasFree, and transaction helpers.

## Install

```sh
pnpm add @tron-wallet-kit/client@latest
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
- `kit.gasFree.getAddress()`
- `kit.gasFree.getBalance()`
- `kit.gasFree.setMode(mode)`
- `kit.signMessage(request)`
- `kit.transferTrx(request)`
- `kit.transferTrc20(request)`
- `kit.triggerSmartContract(request)`

React dapps should normally consume these through `@tron-wallet-kit/react`.

## GasFree

GasFree Phase 1 is an account-panel mode for showing a deterministic GasFree address and USDT
balance. It is display-only; the kit does not render a send form.

Install the optional SDK when you enable GasFree:

```sh
pnpm add @gasfree/gasfree-sdk
```

For production browser apps, point `apiBaseUrl` at a same-origin backend proxy that signs GasFree
provider API requests. The official provider account endpoint is `GET /api/v1/address/{accountAddress}`.

```ts
const kit = createWalletKit({
  metadata: { name: "My TRON dApp" },
  network: "mainnet",
  gasFree: {
    enabled: true,
    apiBaseUrl: "/api/gasfree"
  }
});

kit.gasFree.setMode("gasfree");
const gasFreeAddress = await kit.gasFree.getAddress();
const gasFreeBalance = await kit.gasFree.getBalance();
```

If your app cannot configure a provider API during local QA, use the opt-in on-chain TRC-20 balance
resolver:

```ts
import { createTrc20GasFreeBalanceResolver } from "@tron-wallet-kit/client";

const kit = createWalletKit({
  metadata: { name: "My TRON dApp" },
  network: "mainnet",
  gasFree: {
    enabled: true,
    balanceResolver: createTrc20GasFreeBalanceResolver()
  }
});
```

Do not place a GasFree API secret in browser code. Use a backend proxy or `apiHeaders` backed by a
server-side signer.

## Transaction Preview

Use `transactionPreview` to inspect or confirm a human-readable summary before the kit asks the
wallet to sign. `createWalletKit` shows the built-in confirmation dialog by default in browser
contexts; pass `ui.transactionPreview.enabled: false` to disable it.

```ts
const kit = createWalletKit({
  metadata: { name: "My TRON dApp" },
  transactionPreview: {
    resolver: async (request, context) => {
      console.log(context.defaultPreview.summary);
      // Return a custom preview or leave the default TRON-native summary in place.
    },
    confirm: async (preview) => {
      // Return false to cancel before the wallet prompt opens.
      return window.confirm(preview.summary);
    }
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

This package is part of the TRON Wallet Kit 0.1.0 release line and is intended for the npm `latest` tag.

## License

MIT
