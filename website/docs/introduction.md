# Introduction

TRON Wallet Kit is a product-grade **wallet connection and account UX kit for TRON dApps**. It gives
you a polished connect modal, an account panel, `.trx` identity, WalletConnect QR, theming, and
transaction helpers — the same kind of experience ConnectKit and RainbowKit brought to Ethereum,
but TRON-native.

## What it is (and isn't)

It is a **UX and developer-experience layer**. It sits on top of the TRON wallet ecosystem and uses
`tronweb3/tronwallet-adapter` under the hood for the heavier cases (Ledger, MetaMask). It is **not**
a replacement for that adapter standard — if you already use it, you can adopt this kit for the UI
without throwing away your integration.

You get:

- a connect modal with featured wallets, an "all wallets" list, and install / checking / QR states;
- an account panel with copy address, address QR, TRX balance, and `.trx` name;
- React components and hooks, a framework-agnostic client, and a browser / CDN build;
- light, dark, and custom themes;
- build → sign → broadcast transaction helpers.

## Packages

| Package | Purpose |
|---|---|
| `@tron-wallet-kit/react` | React provider, `TronConnectButton`, and hooks. Start here for React. |
| `@tron-wallet-kit/client` | Framework-agnostic kit (`createWalletKit`) for vanilla apps. |
| `@tron-wallet-kit/browser` | IIFE bundle for plain CDN / script-tag drop-in. |
| `@tron-wallet-kit/core` | Headless wallet contracts, session, and errors. |
| `@tron-wallet-kit/ui` | DOM modal, account panel, and theme tokens (no framework). |
| `@tron-wallet-kit/adapter-*` | TronLink, WalletConnect, and the tronweb3 bridge. |

## Wallet support levels

The catalog labels each wallet so the modal never promises something it can't deliver:

<span class="twk-badge live">live</span> verified with the real wallet, shown by default. &nbsp;
<span class="twk-badge beta">beta</span> expected to work, still under QA. &nbsp;
<span class="twk-badge qa">qa</span> descriptor exists, hidden until verified.

## Next steps

- [Quick start](/docs/quick-start) — a working React integration in a few minutes.
- [React](/docs/frameworks/react) — provider, button, and hooks in depth.
- [Theming](/docs/configuration/theming) — light, dark, and custom themes.
- [WalletConnect](/docs/configuration/walletconnect) — project id and mobile QR.
