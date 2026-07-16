# WalletConnect adapter

The mobile / QR transport. Most apps enable it just by passing `walletConnectProjectId` to the
config — see [WalletConnect setup](/docs/configuration/walletconnect). Use the adapter package
directly only when composing adapters by hand.

```ts
import { createWalletConnectAdapter } from "@tron-wallet-kit/adapter-walletconnect";

const adapter = createWalletConnectAdapter({
  projectId: process.env.WC_PROJECT_ID!,
  network: "mainnet",
  onUri(uri) {
    // render this URI into your own QR, or deep-link on mobile
  },
});
```

Capabilities: connect, disconnect, account-change events, `signMessage`, `signTransaction`,
half-open session cleanup, and direct TRX sending when the connected wallet supports it.

## Lite by design

This adapter uses only `@walletconnect/sign-client` — no `@reown/appkit` or heavy dependency tree —
so it stays small, and the kit loads it only when a user actually picks a WalletConnect wallet.

## Namespace negotiation

The proposal requires a **minimal namespace** (only `tron_signTransaction`) and marks
`tron_signMessage` plus the account/chain events as optional. This maximizes compatibility: a wallet
must reject a proposal it can't fully satisfy, and not every TRON wallet implements every method.

::: warning
If a wallet approves the QR but the dApp reports "cancelled", it's usually a namespace mismatch, not
a real cancellation — see [Troubleshooting](/docs/troubleshooting#walletconnect-cancelled-in-the-wallet).
:::
