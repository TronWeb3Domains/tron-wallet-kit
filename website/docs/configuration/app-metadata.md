# App metadata

`metadata` identifies your dApp to wallets. It is used by WalletConnect today and is the stable
surface for future auth prompts and verified app UI.

```ts
const kit = createWalletKit({
  metadata: {
    name: "TRX Domains",
    description: "Connect a TRON wallet to manage .trx names.",
    url: "https://trxdomains.xyz",
    icons: ["https://trxdomains.xyz/icon.png"],
  },
  network: "mainnet",
  walletConnectProjectId: import.meta.env.VITE_WC_PROJECT_ID,
});
```

## Fields

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Display name shown in wallet approval screens. |
| `description` | `string` | Short dApp description for wallet prompts. |
| `url` | `string` | Canonical dApp origin or production URL. |
| `icons` | `string[]` | Absolute icon URLs. WalletConnect accepts the first supported icon. |

## Fallbacks

The kit resolves metadata in this order:

| Resolved field | Fallback order |
|---|---|
| `name` | `metadata.name` -> `appName` -> `"TRON dApp"` |
| `description` | `metadata.description` -> `appDescription` -> `"{name} TRON wallet connection"` |
| `url` | `metadata.url` -> `appUrl` -> current origin -> `https://trxdomains.xyz` |
| `icons` | non-empty `metadata.icons` -> `appIcons` -> `[]` |

`appName`, `appDescription`, `appUrl`, and `appIcons` remain supported for compatibility, but new
integrations should use `metadata`.

## React

```tsx
const config = getDefaultConfig({
  metadata: {
    name: "My TRON dApp",
    description: "Wallet connection for My TRON dApp",
    url: window.location.origin,
    icons: [`${window.location.origin}/icon.png`],
  },
  walletConnectProjectId: import.meta.env.VITE_WC_PROJECT_ID,
});
```

## Browser / CDN

```html
<script>
  const kit = TronWalletKit.createBrowserKit({
    metadata: {
      name: "My TRON dApp",
      description: "Wallet connection for My TRON dApp",
      url: window.location.origin,
      icons: [window.location.origin + "/icon.png"],
    },
    walletConnectProjectId: window.__WC_PROJECT_ID__,
  });
</script>
```
