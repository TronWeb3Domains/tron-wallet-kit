# TRON Wallet Kit

TRON Wallet Kit is a TRON-native wallet kit for building dapps with a product-grade connect modal, account panel, WalletConnect QR flow, injected wallet support, GasFree account mode, theming, React bindings, and browser/CDN output.

This project is prepared for the first stable package line, `0.1.0`, published under the npm `latest` tag.

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

GasFree is optional. If you enable it, install the SDK too:

```sh
pnpm add @gasfree/gasfree-sdk
```

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
  metadata: {
    name: "My TRON dApp",
    description: "Wallet connection for My TRON dApp",
    url: window.location.origin,
    icons: [`${window.location.origin}/icon.png`]
  },
  network: "mainnet",
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  gasFree: {
    enabled: true,
    apiBaseUrl: "/api/gasfree"
  }
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

`gasFree.apiBaseUrl` should point to a same-origin proxy or trusted provider API. Do not ship a GasFree API secret in frontend code. Without `apiBaseUrl`, the kit can still derive the GasFree address locally, but provider API data such as assets and submit eligibility is not available.

`metadata` identifies your dApp in WalletConnect and future auth prompts. `appName` is still accepted
as a simple alias for `metadata.name`, but production integrations should prefer `metadata`.

Themes can be static or system-adaptive:

```tsx
<TronKitProvider
  config={config}
  theme={{ light: lightTheme(), dark: darkTheme() }}
>
  <TronConnectButton />
</TronKitProvider>
```

## React Hooks

`@tron-wallet-kit/react` also exposes hooks for custom UI:

- `useTronAccount`
- `useTronConnect`
- `useTronDisconnect`
- `useTronBalance`
- `useSignMessage`
- `useTrxName`
- `useGasFree`
- `useConnectModal`
- `useAccountModal`
- `useTronKit`

## Browser/CDN Usage

The browser package emits:

- `dist/tron-wallet-kit.iife.js`
- `dist/tron-wallet-kit.iife.min.js`

```html
<script src="https://cdn.jsdelivr.net/npm/@tron-wallet-kit/browser@latest/dist/tron-wallet-kit.iife.min.js"></script>
```

## Release Status

The first release target is `0.1.0` under the npm `latest` tag.

Before publishing to npm, run the release quality gates, npm dry-run, and real-wallet QA checklist.

## License

MIT
