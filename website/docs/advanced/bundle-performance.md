# Bundle Performance

TRON Wallet Kit is designed to keep the common injected-wallet path light while still supporting
WalletConnect and hardware wallets.

## Recommended setup

```ts
const kit = createWalletKit({
  metadata: { name: "My TRON dApp" },
  wallets: ["tronlink", "okx", "tokenpocket", "bitget", "walletconnect"],
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
});
```

Keep the initial featured wallet list short. Use All Wallets for the full catalog.

## WalletConnect

WalletConnect is included in the default bundle path when you provide `walletConnectProjectId`.
If your app does not need QR/mobile wallets, omit the project id and remove `walletconnect` from
your selected wallet list.

## Browser/IIFE

For no-build integrations, use the IIFE build:

```html
<script src="/vendor/tron-wallet-kit.iife.min.js"></script>
```

The IIFE is convenient for legacy pages. For modern apps, prefer package imports so your bundler can
tree-shake unused framework code.

## Icons

Wallet icons are generated from local descriptor assets and embedded as data URIs. Add a new icon by
placing an SVG with the wallet id in the package icon directory and regenerating the catalog.

## QA checklist

- Verify the connect modal opens quickly with no installed wallet.
- Verify installed wallets sort to the top after detection without abrupt layout shifts.
- Verify WalletConnect QR still renders after minification.
- Verify browser/CDN examples after rebuilding the IIFE.
