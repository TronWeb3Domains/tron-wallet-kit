# @tron-wallet-kit/react

React integration for TRON Wallet Kit. This package provides the ConnectKit-style public API for TRON dapps: provider, connect button, hooks, and theme factories.

## Install

```sh
pnpm add @tron-wallet-kit/react@latest
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

`metadata` identifies your dApp in WalletConnect and Sign-In with TRON prompts. `appName` still works as a shorthand for `metadata.name`.

## GasFree

GasFree is optional and appears as a `GasFree` mode switch in the connected account panel. It keeps
the normal wallet session while showing the deterministic GasFree address and USDT balance.

```sh
pnpm add @gasfree/gasfree-sdk
```

```tsx
const config = getDefaultConfig({
  metadata: { name: "My TRON dApp" },
  network: "mainnet",
  gasFree: {
    enabled: true,
    apiBaseUrl: "/api/gasfree"
  }
});
```

`apiBaseUrl` should point to your backend proxy or trusted GasFree provider API. The provider API
requires signed headers, so do not ship API secrets in browser code.

Custom UI can use `useGasFree()`:

```tsx
import { useGasFree } from "@tron-wallet-kit/react";

function GasFreeBadge() {
  const gasFree = useGasFree();
  if (!gasFree.configured) return null;
  return <button onClick={() => gasFree.setMode("gasfree")}>GasFree</button>;
}
```

## Sign-In with TRON

Install the optional auth package and pass an adapter to `TronKitProvider`. The provider shows a
sign-in step after wallet connect and exposes the state through `useTronAuth()`.

```sh
pnpm add @tron-wallet-kit/auth@latest
```

```tsx
import { createTronAuthenticationAdapter } from "@tron-wallet-kit/auth";

const authenticationAdapter = createTronAuthenticationAdapter({
  getNonce: () => fetch("/auth/nonce").then((r) => r.text()),
  verify: (input) =>
    fetch("/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    }).then((r) => r.json())
});

<TronKitProvider
  config={config}
  authenticationAdapter={authenticationAdapter}
  authenticationOptions={{
    domain: window.location.host,
    uri: window.location.origin,
    statement: "Sign in to My TRON dApp"
  }}
>
  <TronConnectButton />
</TronKitProvider>;
```

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
- `useTronAuth`
- `useTrxName`
- `useGasFree`
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

This package is part of the TRON Wallet Kit 0.1.1 release line and is intended for the npm `latest` tag.

## License

MIT
