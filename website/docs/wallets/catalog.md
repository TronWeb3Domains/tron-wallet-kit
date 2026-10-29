# Wallet catalog

The wallets TRON Wallet Kit knows about, how each one connects, and its support level. The connect
modal can show installed, QR, hardware, and unavailable states depending on your `walletList`
configuration. Use the support level as a release signal, not as a guarantee that every wallet is
available in every browser.

## Support levels

<span class="twk-badge live">live</span> verified with the real wallet for the primary flow. &nbsp;
<span class="twk-badge beta">beta</span> built in, but still needs broader device/collision QA. &nbsp;
<span class="twk-badge qa">qa</span> descriptor exists, but keep it out of strict production lists until verified.

<WalletTable />

::: trx TRON namespace note
Many TRON wallets inject into shared `window.tronLink`, `window.tron`, or `window.tronWeb` globals,
so several installed wallets can overwrite each other. The kit detects each wallet by its own marker
or collision-free 6963 announcement where available, then keeps connect quirks inside the selected
wallet descriptor. See [Troubleshooting](/docs/troubleshooting) for "not installed" and namespace
collision cases.
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

Adding a brand-new wallet as a first party or a third party is covered in
[Adapters overview](/docs/adapters/overview) and [Contributing wallets](/docs/adapters/contributing).

## SafePal and Trust Mobile

SafePal supports the extension provider `window.safepalTronProvider` and the in-app provider
`window.safepalwallet.tron`, alongside legacy `SafePalHook` integrations. Modern providers use
`signMessageV2`; legacy hooks retain their existing `sign` behavior. Provider detection never
requests account access.

Trust Wallet uses `window.trustwallet.tron` in its mobile dApp browser and
`window.trustwallet.tronLink` in the desktop extension. The mobile provider may already expose
an authorized address without a `request` method. Open the site inside Trust Wallet to test this
flow; jumping from an external browser does not guarantee TRON provider injection.

These provider paths have automated coverage; extension/device approval and account switching
still require real-wallet QA. Direct SafePal app-opening deeplinks are not part of this update;
open the site in the wallet's dApp browser or use WalletConnect.

## Typed Data

The kit currently exposes message and transaction signing, not a public `signTypedData` API.
Upstream imToken support alone does not enable TIP-712 signing through the kit. Do not pass typed
data to `signMessage` as a substitute.

## Production gating

For a production dApp, keep your `featuredWallets` list short and live-test each featured wallet on
your production origin. Wallets marked `beta` or `qa` can still be enabled for internal testing, but
should not be the only way a user can connect.

WalletConnect is a transport entry. After a mobile wallet connects, the connected account UI may use
the wallet metadata returned by the session when the wallet provides it.
