# @tron-wallet-kit/react

React integration for TRON Wallet Kit. This package provides the ConnectKit-style public API for TRON dapps: provider, connect button, hooks, and theme factories.

## Install

```sh
pnpm add @tron-wallet-kit/react@beta
```

Peer dependency:

```sh
pnpm add react
```

## Quick Start

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
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
});

function App() {
  return (
    <TronKitProvider config={config} theme={lightTheme({ accentColor: "#0988f0" })}>
      <TronConnectButton />
    </TronKitProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
```

`walletConnectProjectId` is optional. If it is omitted, WalletConnect is not shown in the default wallet list.

`metadata` identifies your dApp in WalletConnect and future auth prompts. `appName` still works as a shorthand for `metadata.name`.

## Exports

- `getDefaultConfig`
- `TronKitProvider`
- `TronConnectButton`
- `TronWalletProvider`
- `WalletButton`
- `ConnectModal`
- `AccountPanel`
- `lightTheme`
- `darkTheme`
- `useTronAccount`
- `useTronConnect`
- `useTronDisconnect`
- `useTronBalance`
- `useSignMessage`
- `useTrxName`
- `useConnectModal`
- `useAccountModal`
- `useTronKit`

## Custom UI

```tsx
import { useTronAccount, useTronConnect, useTronDisconnect } from "@tron-wallet-kit/react";

export function CustomWalletControls() {
  const { address, isConnected } = useTronAccount();
  const { openConnectModal } = useTronConnect();
  const { disconnect } = useTronDisconnect();

  if (!isConnected) return <button onClick={openConnectModal}>Connect wallet</button>;
  return <button onClick={disconnect}>{address}</button>;
}
```

## Theme Factories

```tsx
import { darkTheme, lightTheme } from "@tron-wallet-kit/react";

const light = lightTheme({
  accentColor: "#0988f0",
  accentColorForeground: "#ffffff",
  borderRadius: "medium",
  fontStack: "system"
});

const dark = darkTheme({
  accentColor: "#00e5a8",
  borderRadius: "large"
});
```

The factories generate TRON Wallet Kit theme config on top of the `--twk-*` token system.

System-adaptive themes are supported at the provider:

```tsx
<TronKitProvider
  config={config}
  theme={{
    light: lightTheme({ accentColor: "#0988f0" }),
    dark: darkTheme({ accentColor: "#00e5a8" })
  }}
>
  <TronConnectButton />
</TronKitProvider>
```

## Status

This package is part of the TRON Wallet Kit beta release line. Use the `beta` npm tag until the stable public release is announced.

## License

MIT
