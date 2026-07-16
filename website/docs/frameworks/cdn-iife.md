# CDN / IIFE

No build step required. The browser package ships an IIFE bundle that exposes a global
`TronWalletKit`.

```html
<script src="/vendor/tron-wallet-kit.iife.min.js"></script>
<script>
  const kit = TronWalletKit.createBrowserKit({
    root: document.body,
    metadata: {
      name: "My TRON dApp",
      description: "Wallet connection for My TRON dApp",
      url: window.location.origin,
      icons: [window.location.origin + "/icon.png"],
    },
    theme: { themeName: "tron" },
    walletConnectProjectId: window.__WC_PROJECT_ID__, // inject at runtime, don't hardcode
    walletConnectNetwork: "mainnet",
  });

  document.querySelector("#connect").addEventListener("click", () => kit.openModal());
</script>
```

Inject the WalletConnect project id at runtime (a server template, a global, or a config endpoint).
Never hardcode it in the page source.

## Local example

```sh
pnpm dev:examples
```

Open `https://127.0.0.1:5174/vanilla/`.

::: warning Bundle size
The all-in-one IIFE currently bundles WalletConnect for convenience, which makes it large. A
lighter `lite` build (injected wallets, WalletConnect loaded on demand) alongside the `full` build is
planned before the stable release. For size-sensitive pages, prefer the React package with
tree-shaking, or the upcoming `lite` IIFE.
:::
