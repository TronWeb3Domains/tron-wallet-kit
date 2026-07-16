# Quick start

Get a working connect button in a React app in a few minutes.

## 1. Install

```sh
pnpm add @tron-wallet-kit/react
```

## 2. Wrap your app and drop the button

`getDefaultConfig` gives you sensible defaults: featured wallets, installed-first ordering, `.trx`
identity, and TRX balance. `TronKitProvider` provides them to your tree, and `TronConnectButton`
renders the connect / account UI.

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
  // Optional: enables the WalletConnect mobile QR flow.
  walletConnectProjectId: import.meta.env.VITE_WC_PROJECT_ID,
});

export function App() {
  return (
    <TronKitProvider config={config}>
      <header>
        <TronConnectButton />
      </header>
      <YourApp />
    </TronKitProvider>
  );
}
```

That's it: the button opens the connect modal, connects the wallet, and then shows the account.

::: tip
`walletConnectProjectId` is optional. Without it the kit still works with injected wallets
(TronLink, OKX, Bitget, and other injected wallets); WalletConnect is simply hidden. Get a free
project id from the [WalletConnect Cloud](https://cloud.walletconnect.com/) and inject it via an
environment variable. Never hardcode it in source.
:::

## 3. Read the account with hooks

Every piece of state is available through hooks, so you can build a fully custom UI:

```tsx
import { useTronAccount, useTronBalance, useTrxName } from "@tron-wallet-kit/react";

function AccountInfo() {
  const { address, isConnected } = useTronAccount();
  const { data: balance } = useTronBalance();
  const { name } = useTrxName();

  if (!isConnected) return <p>Not connected</p>;
  return <p>{name ?? address} - {balance?.formatted} TRX</p>;
}
```

## 4. Theme it (optional)

```tsx
import { lightTheme, darkTheme } from "@tron-wallet-kit/react";

<TronKitProvider config={config} theme={lightTheme({ accentColor: "#ef0027" })}>
  {/* ... */}
</TronKitProvider>
```

See [Theming](/docs/configuration/theming) for dark mode and custom tokens.

## App metadata

`metadata` is shown by WalletConnect and reused by future auth prompts. `appName` still works as a
simple alias for `metadata.name`, but production apps should prefer the full metadata object.

## Next steps

- [React](/docs/frameworks/react) - provider props, button props, and the full hooks reference.
- [App metadata](/docs/configuration/app-metadata) - dApp name, URL, and icon.
- [WalletConnect](/docs/configuration/walletconnect) - project id and mobile QR.
- [CDN / IIFE](/docs/frameworks/cdn-iife) - no-build drop-in.
