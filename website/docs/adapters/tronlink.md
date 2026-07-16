# TronLink adapter

Most apps never touch this directly — `getDefaultConfig` / `createWalletKit` include TronLink
already. Use the adapter package only when you compose adapters manually.

```ts
import { createTronLinkAdapter } from "@tron-wallet-kit/adapter-tronlink";

const tronLink = createTronLinkAdapter();
```

Capabilities: connect, disconnect, account-change and chain-change events, `signMessage`,
`signTransaction`, and TRX sending.

## Detection on a multi-wallet browser

TronLink shares the `window.tronLink` / `window.tron` globals with other wallets, so on a machine
with several wallets installed the bare global may be owned by a different wallet. The adapter
detects TronLink through its collision-free **6963 announcement** (`org.tronlink.www`) and caches the
result, so it reports installed reliably regardless of who owns the global.

::: tip
If TronLink shows "not installed" while other wallets are present, see
[Troubleshooting](/docs/troubleshooting#tronlink-shows-not-installed-on-a-multi-wallet-browser).
:::
