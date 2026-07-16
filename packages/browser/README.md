# @tron-wallet-kit/browser

Browser/CDN entrypoint for TRON Wallet Kit. This package exposes a single global for HTML and legacy app integrations.

## Install

```sh
pnpm add @tron-wallet-kit/browser@beta
```

## CDN Usage

```html
<script src="https://cdn.jsdelivr.net/npm/@tron-wallet-kit/browser@beta/dist/tron-wallet-kit.iife.min.js"></script>
<script>
  const kit = TronWalletKit.createBrowserKit({
    metadata: {
      name: "My TRON dApp",
      description: "Wallet connection for My TRON dApp",
      url: window.location.origin,
      icons: [window.location.origin + "/icon.png"]
    },
    network: "mainnet",
    walletConnectProjectId: "YOUR_WALLETCONNECT_PROJECT_ID"
  });

  document.querySelector("#connect").addEventListener("click", () => kit.openModal());
</script>
```

The browser package emits:

- `dist/tron-wallet-kit.iife.js`
- `dist/tron-wallet-kit.iife.min.js`

WalletConnect still requires your own WalletConnect Cloud project ID.

For legacy pages, `appName` still works as a shorthand for `metadata.name`.

## Status

This package is part of the TRON Wallet Kit beta release line. Use the `beta` npm tag until the stable public release is announced.

## License

MIT
