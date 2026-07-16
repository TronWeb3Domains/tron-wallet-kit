# Wallet list

`ui.walletList` controls which wallets appear in the featured modal and in the all-wallets view.
Use it only when the defaults need to be constrained for a specific app.

```ts
const kit = createWalletKit({
  metadata: { name: "My TRON dApp" },
  walletConnectProjectId: import.meta.env.VITE_WC_PROJECT_ID,
  ui: {
    walletList: {
      layout: "card",
      featuredMode: "installed-first",
      featuredWallets: ["tronlink", "tokenpocket", "okx", "walletconnect"],
      wallets: "all",
      disabledWallets: ["experimental-wallet"],
      showUnavailable: true,
      sortAvailableFirst: true,
    },
  },
});
```

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `layout` | `"list" \| "card"` | `"list"` | Featured wallet layout. The compact card UI uses the same wallet metadata. |
| `featuredMode` | `"manual" \| "installed-first" \| "installed-only"` | `"installed-first"` | Controls the featured list strategy. |
| `featuredWallets` | `string[]` | `[]` | Manual or ranked wallet ids. The kit does not cap this list, but keep it short for good UX. |
| `wallets` | `"all" \| string[]` | `"all"` | Restrict the available wallet catalog to specific ids. |
| `disabledWallets` | `string[]` | `[]` | Hide specific wallet ids without changing the registry. |
| `showUnavailable` | `boolean` | `true` | Show wallets that are not detected. QR and hardware wallets remain available when supported. |
| `sortAvailableFirst` | `boolean` | `true` | Sort installed, QR, and hardware-capable wallets before unavailable wallets after detection settles. |
| `featuredLimit` | `number` | `5` | Deprecated compatibility field. Featured wallets are no longer capped by this value. |

## Recommended setup

For most apps, keep `featuredMode: "installed-first"` and let the runtime catalog decide ordering.
Use `featuredWallets` only when a product needs a specific commercial or support policy.

If you want a strict integration list, set `wallets` to the ids you support and use
`disabledWallets` to temporarily remove a wallet without deleting its descriptor.
