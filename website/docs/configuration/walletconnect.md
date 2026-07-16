# WalletConnect

WalletConnect gives mobile wallets a QR / deep-link connection. It is optional: the kit works with
injected wallets without it, but enabling it unlocks Klever, Bitget, and other mobile wallets.

## 1. Get a project id

Create a free project at the [WalletConnect Cloud](https://cloud.walletconnect.com/) and copy its
**project id**.

::: warning Never hardcode the project id
Inject it from an environment variable. Do not commit it to source or ship it inside a published
package.
:::

## 2. Pass it to the kit

```tsx
const config = getDefaultConfig({
  metadata: {
    name: "My TRON dApp",
    description: "Wallet connection for My TRON dApp",
    url: window.location.origin,
    icons: [`${window.location.origin}/icon.png`],
  },
  network: "mainnet",
  walletConnectProjectId: import.meta.env.VITE_WC_PROJECT_ID,
});
```

That's all: WalletConnect now appears in the connect modal with a QR flow. Omit the id and it is
simply hidden.

The `metadata` object is passed to WalletConnect so the wallet can show the correct dApp name, URL,
and icon during approval.

## Network

WalletConnect follows the kit `network` (`mainnet` by default). Override only if you need a different
WalletConnect chain:

```tsx
getDefaultConfig({
  metadata: { name: "My TRON dApp" },
  network: "mainnet",
  walletConnectNetwork: "mainnet",
});
```

## Rendering your own QR

If you do not use the default modal, capture the URI and render your own QR:

```ts
import { createWalletConnectAdapter } from "@tron-wallet-kit/adapter-walletconnect";

const walletConnect = createWalletConnectAdapter({
  projectId: process.env.WC_PROJECT_ID!,
  network: "mainnet",
  appMetadata: {
    name: "My TRON dApp",
    description: "Wallet connection for My TRON dApp",
    url: window.location.origin,
    icons: [`${window.location.origin}/icon.png`],
  },
  onUri(uri) {
    // render `uri` as a QR, or deep-link on mobile
  },
});
```

## How the session is negotiated

The kit requests a **minimal required namespace**: only `tron_signTransaction`. It puts
`tron_signMessage` plus the `accountsChanged` / `chainChanged` events in the **optional** namespace.
This is deliberate: a wallet must reject a proposal it cannot fully satisfy, and some TRON wallets
do not implement every method. Keeping the required set minimal is what makes the QR work across the
widest range of wallets.

::: trx Bundle note
The WalletConnect transport is loaded only when a user picks a WalletConnect wallet, so it does not
weigh down apps that only use injected wallets.
:::

If a specific wallet approves in-app but the dApp still reports "cancelled", see
[Troubleshooting](/docs/troubleshooting#walletconnect-cancelled-in-the-wallet).
