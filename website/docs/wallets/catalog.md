# Wallet catalog

The wallets TRON Wallet Kit knows about, how each one connects, and its support level. The connect
modal only shows wallets that are ready, so users never see a wallet that can't actually connect.

## Support levels

<span class="twk-badge live">live</span> verified with the real wallet — shown by default. &nbsp;
<span class="twk-badge beta">beta</span> expected to work, still under QA — shown but flagged. &nbsp;
<span class="twk-badge qa">qa</span> descriptor exists — hidden until verified.

<WalletTable />

::: trx TRON namespace note
Many TRON wallets inject into the shared `window.tronLink` / `window.tron` globals, so several
installed wallets can overwrite each other. The kit detects each wallet by its own marker (and by
the collision-free 6963 announcement) rather than the bare global, then falls back to TronLink last.
See [Troubleshooting](/docs/troubleshooting) for the "not installed" and namespace-collision cases.
:::

## Enabling and disabling wallets

Pass an explicit list, or disable specific wallets, through the config:

```ts
const config = getDefaultConfig({
  metadata: { name: "My dApp" },
  // Only these, in this order:
  wallets: ["tronlink", "okx", "tokenpocket", "walletconnect"],
  // Or keep the defaults but hide some:
  // disabledWallets: ["binance"],
});
```

Adding a brand-new wallet (as a first party or a third party) is covered in the adapter
[Overview](/docs/adapters/overview).
