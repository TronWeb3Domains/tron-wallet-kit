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

## Status

This package is part of the TRON Wallet Kit beta release line. Use the `beta` npm tag until the stable public release is announced.

## License

MIT
