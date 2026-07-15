# @tron-wallet-kit/ui

Token-driven UI foundations for TRON Wallet Kit. This package renders the wallet modal, account panel, wallet button, QR states, toast UI, and theme tokens without depending on a host app CSS selector.

## Install

```sh
pnpm add @tron-wallet-kit/ui@beta
```

## Use This Package When

- You are integrating TRON Wallet Kit into a non-React runtime.
- You need the low-level HTML renderers.
- You are building a custom client package around the shared UI.

Most React dapps should use `@tron-wallet-kit/react`.

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

## Status

This package is part of the TRON Wallet Kit beta release line. Use the `beta` npm tag until the stable public release is announced.

## License

MIT
