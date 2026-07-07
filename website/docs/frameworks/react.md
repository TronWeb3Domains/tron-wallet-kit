# React

The React package provides provider/hooks and current MVP surfaces.

```tsx
import {
  TronWalletProvider,
  ConnectModal,
  AccountPanel,
  useWalletKit,
  useWalletSession,
  useWalletAccount,
  useWalletStatus,
  useWalletCapabilities,
} from "@tron-wallet-kit/react";
```

## Components

- `TronWalletProvider`
- `TronWalletKitProvider` alias
- `ConnectModal`
- `AccountPanel`

## Hooks

- `useWalletKit()`
- `useWalletSession()`
- `useWalletAccount()`
- `useWalletStatus()`
- `useWalletCapabilities()`

## Local Example

```sh
pnpm dev:examples
```

Open `http://127.0.0.1:5174/react-basic/`.
