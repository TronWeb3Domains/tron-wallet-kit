# UI API

Key exports from `@tron-wallet-kit/ui`:

```ts
resolveTheme(config)
getThemeNames()
createThemeStyleText(config, selector)
createThemeStyleProperties(config)
resolveWalletUiConfig(config)
createDefaultWalletUiConfig(config)
createWalletKitStyles(selector)
ensureWalletKitStyles(document)
createConnectModalHtml(viewModel)
createAccountPanelHtml(viewModel)
createQrDataUrl(value, options)
createTransactionToastHtml(viewModel)
createTransactionToastContainerHtml(toasts, position)
```

The UI package is framework-neutral. React and browser/CDN integrations consume this shared foundation.

## QR

```ts
const src = await createQrDataUrl("TXYZ...");
```

## Toast

```ts
const html = createTransactionToastContainerHtml([
  {
    id: "tx-1",
    label: "Transaction submitted",
    status: "pending",
    txHash: "abc...",
  },
]);
```
