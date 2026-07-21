# @tron-wallet-kit/browser

Browser/CDN entrypoint for TRON Wallet Kit. This package exposes a single global for HTML and legacy app integrations.

## Install

```sh
pnpm add @tron-wallet-kit/browser@latest
```

## CDN Usage

```html
<script src="https://cdn.jsdelivr.net/npm/@tron-wallet-kit/browser@latest/dist/tron-wallet-kit.iife.min.js"></script>
<script>
  const kit = TronWalletKit.createBrowserKit({
    metadata: {
      name: "My TRON dApp",
      description: "Wallet connection for My TRON dApp",
      url: window.location.origin,
      icons: [window.location.origin + "/icon.png"]
    },
    network: "mainnet",
    walletConnectProjectId: "YOUR_WALLETCONNECT_PROJECT_ID",
    gasFree: {
      enabled: true,
      apiBaseUrl: "/api/gasfree"
    }
  });

  document.querySelector("#connect").addEventListener("click", () => kit.openModal());
</script>
```

The browser package emits:

- `dist/tron-wallet-kit.iife.js`
- `dist/tron-wallet-kit.iife.min.js`

WalletConnect still requires your own WalletConnect Cloud project ID.

For legacy pages, `appName` still works as a shorthand for `metadata.name`.

GasFree is optional. If enabled in a browser/CDN page, route `apiBaseUrl` through your backend proxy
so provider API secrets never appear in page source. The browser bundle can show the GasFree account
panel mode, address copy/QR, and USDT balance when the provider API or resolver is configured.

## Status

This package is part of the TRON Wallet Kit 0.1.0 release line and is intended for the npm `latest` tag.

## License

MIT
