# Quick start

Get a working connect button in a React app in a few minutes.

## 1. Install

```sh
pnpm add @tron-wallet-kit/react
```

## 2. Wrap your app and drop the button

`getDefaultConfig` gives you sensible defaults — featured wallets, installed-first ordering, `.trx`
identity, and TRX balance. `TronKitProvider` provides them to your tree, and `TronConnectButton`
renders the connect / account UI.

```tsx
import { getDefaultConfig, TronKitProvider, TronConnectButton } from "@tron-wallet-kit/react";

const config = getDefaultConfig({
  appName: "My TRON dApp",
  network: "mainnet",
  // Optional — enables the WalletConnect mobile QR flow.
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

That's it — the button opens the connect modal, connects the wallet, and then shows the account.

::: tip
`walletConnectProjectId` is optional. Without it the kit still works with injected wallets
(TronLink, OKX, Bitget, …); WalletConnect is simply hidden. Get a free project id from the
[WalletConnect Cloud](https://cloud.walletconnect.com/) and inject it via an environment variable —
never hardcode it in source.
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
  return <p>{name ?? address} · {balance?.formatted} TRX</p>;
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

## Next steps

- [React](/docs/frameworks/react) — provider props, button props, and the full hooks reference.
- [WalletConnect](/docs/configuration/walletconnect) — project id and mobile QR.
- [HTML / CDN](/docs/frameworks/html-cdn) — no-build drop-in.
