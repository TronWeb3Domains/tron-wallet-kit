# @tron-wallet-kit/ui

Token-driven UI foundations for TRON Wallet Kit. This package renders the wallet modal, account panel, GasFree account mode, wallet button, QR states, toast UI, and theme tokens without depending on a host app CSS selector.

## Install

```sh
pnpm add @tron-wallet-kit/ui@beta
```

## Use This Package When

- You are integrating TRON Wallet Kit into a non-React runtime.
- You need the low-level HTML renderers.
- You are building a custom client package around the shared UI.

Most React dapps should use `@tron-wallet-kit/react`.

## Runtime Catalog Input

The UI package is catalog-agnostic. Wallet icons, names, platform metadata, and WalletConnect support
come from the client runtime catalog, not from hardcoded UI lists. This keeps third-party wallets and
custom descriptors out of the UI package.

```ts
import { createWalletModal } from "@tron-wallet-kit/ui";

const modal = createWalletModal({
  manager,
  ui: {
    catalog: [
      {
        id: "custom-wallet",
        name: "Custom Wallet",
        icon: "https://example.com/wallet.svg",
        platforms: ["extension"]
      }
    ]
  }
});
```

## Main Exports

- `createWalletModal`
- `createWalletButton`
- `createWalletToast`
- `createConnectModalHtml`
- `createAccountPanelHtml`
- `createWalletButtonHtml`
- `resolveWalletUiConfig`
- `resolveTheme`
- `createThemeStyleText`
- `createThemeStyleProperties`

## Theming

The UI is driven by `--twk-*` CSS variables. Theme presets include `light`, `dark`, `tron`, `tron-energy`, `nile`, `shasta`, `bandwidth`, `energy`, `sun`, `graphite`, `midnight`, `ocean`, `glass`, `rounded`, `crisp`, `soft`, `neon`, `terminal`, `minimal`, and `highContrast`.

## Account Panel

`createAccountPanelHtml` supports the current connected wallet, `.trx` identity, TRX balance, address
QR, recent transactions, and the optional GasFree mode. When GasFree is configured, the General panel
renders a compact `GasFree` action in the header; selecting it switches the same account panel to the
GasFree address/balance view.

App metadata is not configured in this package. Pass metadata to `@tron-wallet-kit/client` or
`@tron-wallet-kit/react`; the UI receives the wallet/session data it needs from the manager and
runtime catalog.

## Status

This package is part of the TRON Wallet Kit beta release line. Use the `beta` npm tag until the stable public release is announced.

## License

MIT
