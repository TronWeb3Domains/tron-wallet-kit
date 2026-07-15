# Migration from tronwallet-adapter

If your dApp already uses `@tronweb3/tronwallet-adapter`, you don't have to throw it away. TRON Wallet
Kit is a **UX layer on top** — it adopts the same wallet ecosystem and even uses the tronweb3 bridge
for hardware and MetaMask. This guide maps common patterns so you can switch the connect experience
with minimal churn.

## What changes

- The connect modal, wallet list, and account panel come from the kit — you delete your custom UI.
- Wallet selection, detection, and session handling move into the kit config.
- Signing and sending go through the kit's hooks / client instead of a raw adapter instance.

## Provider setup

```tsx
// Before — tronwallet-adapter + your own modal
const adapters = [new TronLinkAdapter(), new WalletConnectAdapter({ ... })];
// ...custom React context, modal, and connect logic...

// After — TRON Wallet Kit
import { getDefaultConfig, TronKitProvider, TronConnectButton } from "@tron-wallet-kit/react";

const config = getDefaultConfig({ appName: "My dApp", walletConnectProjectId: WC });

<TronKitProvider config={config}>
  <TronConnectButton />
</TronKitProvider>;
```

## Common operations

| tronwallet-adapter | TRON Wallet Kit |
|---|---|
| `adapter.connect()` / your modal | `TronConnectButton`, or `useTronConnect().openConnectModal()` |
| `adapter.address` | `useTronAccount().address` |
| `adapter.connected` | `useTronAccount().isConnected` |
| `adapter.disconnect()` | `useTronDisconnect().disconnect()` |
| `adapter.signMessage(msg)` | `useSignMessage().signMessage(msg)` |
| `adapter.signTransaction(tx)` | kit client `signTransaction(tx)` |
| manual adapter list | `getDefaultConfig({ wallets: [...] })` |

## Wallets that still use tronweb3 under the hood

Ledger and MetaMask connect through the tronweb3 bridge inside the kit — you don't import their
adapters yourself, the kit lazy-loads them. So the pieces of the adapter ecosystem that are genuinely
hard (hardware transport, the MetaMask TRON path) keep working, wrapped in the kit's UI.

## Keeping your own logic

If you have app-specific logic on top of an adapter (custom RPC, analytics, bespoke tx building), you
can still access the underlying kit and TronWeb via `useTronKit()` and the client's transaction
helpers — the kit doesn't lock you out of the low level.
