# React

The `@tron-wallet-kit/react` package gives you a provider, a connect button, and hooks. It is the
recommended way to use the kit in a React app.

```sh
pnpm add @tron-wallet-kit/react
```

## Provider + button

Wrap your app in `TronKitProvider` and drop a `TronConnectButton` anywhere inside it.

```tsx
import { getDefaultConfig, TronKitProvider, TronConnectButton } from "@tron-wallet-kit/react";

const config = getDefaultConfig({
  metadata: {
    name: "My TRON dApp",
    description: "Wallet connection for My TRON dApp",
    url: window.location.origin,
    icons: [`${window.location.origin}/icon.png`],
  },
  network: "mainnet",
  walletConnectProjectId: import.meta.env.VITE_WC_PROJECT_ID, // optional
});

export function App() {
  return (
    <TronKitProvider config={config}>
      <TronConnectButton />
    </TronKitProvider>
  );
}
```

### `getDefaultConfig(options)`

Returns a ready-to-use config with sensible defaults (featured wallets, installed-first ordering,
account modal, toast, `.trx` identity, TRX balance).

| Option | Type | Default | Notes |
|---|---|---|---|
| `metadata` | `{ name?, description?, url?, icons? }` | `{ name: "TRON dApp" }` | App identity shown in WalletConnect and future auth prompts. |
| `network` | `"mainnet" \| "shasta" \| "nile"` | `"mainnet"` | Active TRON network. |
| `walletConnectProjectId` | `string` | — | Enables the WalletConnect QR flow. Omit to hide WC. |
| `walletConnectNetwork` | `string` | follows `network` | Override the WC chain if needed. |
| `ui`, `identity`, `balance`, … | — | — | Any `createWalletKit` option is accepted and merged. |

`appName` is still accepted as a shorthand for `metadata.name`.

### `TronKitProvider` props

| Prop | Type | Notes |
|---|---|---|
| `config` | `WalletClientConfig` | From `getDefaultConfig` (or a hand-built config). |
| `theme` | `ThemeConfig` | From `lightTheme()` / `darkTheme()`. Optional. |
| `kit` | `WalletKit` | Provide an existing kit instead of `config`. |
| `authenticationAdapter` | `TronAuthAdapter` | Optional Sign-In with TRON adapter. Shows a sign-in step after wallet connect. |
| `authenticationOptions` | `TronAuthControllerOptions` | Domain, URI, statement, and chain options for the sign-in message. |
| `children` | `ReactNode` | Your app. |

### `TronConnectButton` props

| Prop | Type | Notes |
|---|---|---|
| `label` | `string` | Text before connecting. |
| `showBalance` | `boolean` | Show TRX balance when connected. |
| `accountStatus` | `"full" \| "avatar" \| "address"` | How the connected account renders. |
| `chainStatus` | `"full" \| "icon" \| "none"` | Network indicator. |

## Hooks

Everything the button shows is available as a hook, so you can build a fully custom UI.

| Hook | Returns |
|---|---|
| `useTronAccount()` | `{ address?, account, session, status, isConnected, isConnecting, displayName? }` |
| `useTronConnect()` | `{ wallets, connect(walletId?), openConnectModal, closeConnectModal, status }` |
| `useTronDisconnect()` | `{ disconnect() }` |
| `useConnectModal()` | `{ openConnectModal(), closeConnectModal() }` |
| `useAccountModal()` | `{ accountModalOpen, openAccountModal(), closeAccountModal() }` |
| `useTronBalance()` | `{ balance, data, isLoading, refresh() }` |
| `useTrxName()` | `{ name, avatar, isLoading }` — `.trx` identity |
| `useSignMessage()` | `{ signMessage(message), data, error, isPending }` |
| `useTronAuth()` | SIWT state plus `signIn()` / `signOut()` when auth is configured |
| `useTronKit()` | the underlying `WalletKit` instance |

## Sign-In with TRON

Pass an authentication adapter to `TronKitProvider` to show a sign-in step after the user connects a
wallet. The provider uses `createWalletAuth` internally and also exposes the same state through
`useTronAuth()`.

```tsx
import { createTronAuthenticationAdapter } from "@tron-wallet-kit/auth";
import { TronKitProvider, TronConnectButton } from "@tron-wallet-kit/react";

const authenticationAdapter = createTronAuthenticationAdapter({
  getNonce: () => fetch("/auth/nonce").then((r) => r.text()),
  verify: (input) =>
    fetch("/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    }).then((r) => r.json())
});

export function App() {
  return (
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
    </TronKitProvider>
  );
}
```

### Custom connect UI (hooks only)

```tsx
import { useTronAccount, useTronConnect, useTronDisconnect } from "@tron-wallet-kit/react";

function ConnectControl() {
  const { isConnected, displayName } = useTronAccount();
  const { openConnectModal } = useTronConnect();
  const { disconnect } = useTronDisconnect();

  if (!isConnected) return <button onClick={openConnectModal}>Connect wallet</button>;
  return <button onClick={disconnect}>{displayName}</button>;
}
```

### Sign a message

```tsx
import { useSignMessage } from "@tron-wallet-kit/react";

function SignButton() {
  const { signMessage, isPending } = useSignMessage();
  return (
    <button disabled={isPending} onClick={() => signMessage("Hello TRON")}>
      Sign message
    </button>
  );
}
```

## Theming

```tsx
import { lightTheme } from "@tron-wallet-kit/react";

<TronKitProvider config={config} theme={lightTheme({ accentColor: "#ef0027" })}>
  {/* ... */}
</TronKitProvider>
```

See [Theming](/docs/configuration/theming) for dark mode, presets, and custom tokens.

## Next.js

`TronKitProvider` and the hooks are client-side. In the App Router, put them in a `"use client"`
component and mount it below your layout. A dedicated Next guide is coming.

## Local example

```sh
pnpm dev:examples
```

Open `https://127.0.0.1:5174/react-basic/` when using the HTTPS dev mode, or
`http://127.0.0.1:5174/react-basic/` for wallets that allow HTTP localhost.
