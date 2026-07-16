# @tron-wallet-kit/core

Core contracts, wallet manager, storage, network registry, transaction types, and normalized errors for TRON Wallet Kit.

## Install

```sh
pnpm add @tron-wallet-kit/core@beta
```

## Use This Package When

- You are building a custom wallet adapter.
- You need the headless `WalletManager`.
- You need shared types such as `WalletAdapter`, `WalletSession`, `WalletNetwork`, `WalletKitError`, or transaction result types.

Most dapps should start with `@tron-wallet-kit/react` or `@tron-wallet-kit/client` instead.

## Core Concepts

- `WalletAdapter`: the adapter contract implemented by injected, WalletConnect, hardware, or custom wallets.
- `WalletManager`: registers adapters, connects, disconnects, signs, stores sessions, and emits wallet events.
- `WalletKitError`: normalized error class used across core, client, and UI.
- `NetworkRegistry`: resolves TRON mainnet, Nile, Shasta, or custom network configs.
- `WalletKitAppMetadata`: dApp identity (`name`, `description`, `url`, `icons`) shared by client, WalletConnect, and auth-facing flows.

## App Metadata

Core owns the shared metadata type so adapters and clients can agree on one dApp identity shape:

```ts
import type { WalletKitAppMetadata } from "@tron-wallet-kit/core";

const metadata: WalletKitAppMetadata = {
  name: "My TRON dApp",
  description: "Wallet connection for My TRON dApp",
  url: "https://my-tron-app.example",
  icons: ["https://my-tron-app.example/icon.png"]
};
```

Most apps should pass this through `@tron-wallet-kit/client` or `@tron-wallet-kit/react` rather than
constructing `WalletManager` directly. Legacy `appName` still works as a shorthand for
`metadata.name`.

## Minimal Manager Example

```ts
import { WalletManager, TRON_MAINNET } from "@tron-wallet-kit/core";

const manager = new WalletManager({
  metadata: { name: "My TRON dApp" },
  network: TRON_MAINNET,
  adapters: [myAdapter]
});

const session = await manager.connect("my-wallet");
```

## Transaction Store

`WalletManager` keeps recent transactions per `account + network`. When a storage adapter is
provided, submitted transactions are persisted and restored with the session.

```ts
const manager = new WalletManager({
  storage,
  transactionStore: {
    max: 20,
    staleSubmittedMs: 10 * 60 * 1000
  },
  adapters: [myAdapter]
});
```

Submitted transactions older than `staleSubmittedMs` are reported as `unknown` until your app updates
them to `confirmed` or `failed`.

## Status

This package is part of the TRON Wallet Kit beta release line. Use the `beta` npm tag until the stable public release is announced.

## License

MIT
