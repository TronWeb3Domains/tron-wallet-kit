# HTML / CDN Usage

This guide is for legacy HTML or no-build demos that use the browser IIFE bundle.

## Demo Project ID

Current WalletConnect demo project ID:

```txt
YOUR_WALLETCONNECT_PROJECT_ID
```

WalletConnect project IDs are passed by the app. They are not hardcoded in core or adapter defaults.

## Local Build Demo

After running `pnpm build`, load the browser bundle:

```html
<div id="wallet-root"></div>
<button id="connect-tronlink" type="button">Connect TronLink</button>
<button id="connect-walletconnect" type="button">Connect WalletConnect</button>

<script src="../packages/browser/dist/tron-wallet-kit.iife.min.js"></script>
<script>
  const walletRoot = document.getElementById("wallet-root");
  const kit = TronWalletKit.createBrowserKit({
    root: walletRoot,
    theme: { themeName: "tron" },
    walletConnectProjectId: "YOUR_WALLETCONNECT_PROJECT_ID",
    walletConnectNetwork: "mainnet",
    onWalletConnectUri(uri) {
      console.log("WalletConnect URI:", uri);
    },
  });

  document.getElementById("connect-tronlink").addEventListener("click", async () => {
    await kit.manager.connect("tronlink");
    console.log(kit.manager.getAccount());
  });

  document.getElementById("connect-walletconnect").addEventListener("click", async () => {
    await kit.manager.connect("walletconnect");
    console.log(kit.manager.getAccount());
  });
</script>
```

## Notes

- The all-in-one browser bundle currently includes WalletConnect support for convenience.
- WalletConnect makes the IIFE bundle large. Before public release, decide whether to keep one all-in-one CDN file or publish separate adapter browser bundles.
- For custom QR rendering, use `walletConnectOnUri` and render the URI into the UI QR slot.
- Hardware wallets such as Ledger are optional-peer integrations for app builds. They are not guaranteed to be available from the default CDN/IIFE bundle unless the hosting app bundles the upstream hardware adapter.
