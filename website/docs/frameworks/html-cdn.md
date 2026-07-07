# HTML / CDN

The browser package builds an IIFE global named `TronWalletKit`.

```html
<script src="/vendor/tron-wallet-kit.iife.min.js"></script>
<script>
  const kit = TronWalletKit.createBrowserKit({
    root: document.body,
    theme: { themeName: "tron" },
    walletConnectProjectId: "a4109c95d50e5c136cdafaf9fc44c105",
    walletConnectNetwork: "nile",
  });
</script>
```

The local HTML/CDN example exercises this path:

```sh
pnpm dev:examples
```

Open `http://127.0.0.1:5174/html-cdn/`.

::: warning Bundle size
The current all-in-one IIFE includes WalletConnect dependencies for convenience. Split adapter bundles should be considered before public release.
:::
