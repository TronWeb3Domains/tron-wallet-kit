# TRON Wallet Kit

TRON Wallet Kit is a TRON-native wallet kit for building dapps with a product-grade connect modal, account panel, WalletConnect QR flow, injected wallet support, theming, React bindings, and browser/CDN output.

This project is currently prepared for the first beta release. Use the `beta` npm tag until the public docs, deployed demo, and full real-wallet QA matrix are complete.

## Packages

- `@tron-wallet-kit/core`
- `@tron-wallet-kit/ui`
- `@tron-wallet-kit/client`
- `@tron-wallet-kit/browser`
- `@tron-wallet-kit/react`
- `@tron-wallet-kit/next`
- `@tron-wallet-kit/auth`
- `@tron-wallet-kit/adapter-tronlink`
- `@tron-wallet-kit/adapter-walletconnect`
- `@tron-wallet-kit/adapter-tronwallet-bridge`

## Install

```sh
pnpm add @tron-wallet-kit/react @tron-wallet-kit/client
```

For WalletConnect, pass your own WalletConnect Cloud project ID. The kit does not ship a default project ID.

## React Usage

```tsx
import { createRoot } from "react-dom/client";
import {
  TronKitProvider,
  TronConnectButton,
  getDefaultConfig,
  lightTheme
} from "@tron-wallet-kit/react";

const config = getDefaultConfig({
  appName: "My TRON dApp",
  network: "mainnet",
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
});

function App() {
  return (
    <TronKitProvider config={config} theme={lightTheme()}>
      <TronConnectButton />
    </TronKitProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
```

WalletConnect is optional. If `walletConnectProjectId` is omitted, WalletConnect is hidden from the default wallet list.

## React Hooks

`@tron-wallet-kit/react` also exposes hooks for custom UI:

- `useTronAccount`
- `useTronConnect`
- `useTronDisconnect`
- `useTronBalance`
- `useSignMessage`
- `useTrxName`
- `useConnectModal`
- `useAccountModal`
- `useTronKit`

## Browser/CDN Usage

The browser package emits:

- `dist/tron-wallet-kit.iife.js`
- `dist/tron-wallet-kit.iife.min.js`

```html
<script src="https://cdn.jsdelivr.net/npm/@tron-wallet-kit/browser@beta/dist/tron-wallet-kit.iife.min.js"></script>
```

## Release Status

The first release target is `0.1.0-beta.0` under the npm `beta` tag.

Before promoting to `latest`, the project still needs public docs polish, deployed demo QA, expanded real-wallet QA, and final release notes.

## License

MIT
