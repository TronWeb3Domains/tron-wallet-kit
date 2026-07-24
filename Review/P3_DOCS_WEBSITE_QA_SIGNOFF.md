# P3 Docs / Website QA Sign-Off

Updated: 2026-07-24

This checklist tracks the documentation and website pass for the "TRON-native ConnectKit" launch path. The public docs live under `website/`; the root `docs/` folder is kept for internal handoff and legacy usage notes.

## Scope

- Make the public website accurate for the current SDK surface.
- Keep URLs clean and stable under VitePress `cleanUrls`.
- Avoid hardcoded secrets, especially WalletConnect project ids.
- Explain wallet support honestly: descriptor presence, installed detection, QR fallback, QA status, and hardware requirements are different things.
- Keep docs English-only for public surfaces.

## Required Pages

| Area | Page | Purpose | Status |
| --- | --- | --- | --- |
| Start | `/docs/introduction` | Product positioning and when to use the kit | Present, needs final copy QA |
| Start | `/docs/quick-start` | Minimal React integration | Present, needs snippet QA |
| Frameworks | `/docs/frameworks/react` | React provider, button, hooks | Present |
| Frameworks | `/docs/frameworks/next` | Next client boundary | Present |
| Frameworks | `/docs/frameworks/vanilla` | Framework-free client usage | Present |
| Frameworks | `/docs/frameworks/cdn-iife` | Browser/CDN IIFE | Present, do not rebuild IIFE unless requested |
| Configuration | `/docs/configuration/app-metadata` | dApp metadata and WalletConnect display | Present |
| Configuration | `/docs/configuration/connect-button` | Button/account panel behavior | Present |
| Configuration | `/docs/configuration/wallet-list` | Featured/all-wallet config | Present |
| Configuration | `/docs/configuration/walletconnect` | QR setup and namespace behavior | Present |
| Configuration | `/docs/configuration/identity` | TRX Domains resolver | Present |
| Configuration | `/docs/configuration/gasfree` | GasFree Phase 1 and provider API | Present |
| Configuration | `/docs/configuration/localization` | English/i18n labels | Present |
| Wallets | `/docs/wallets/catalog` | Supported wallet catalog and support levels | Updated in this pass |
| Adapters | `/docs/adapters/overview` | Integration model | Present |
| Adapters | `/docs/adapters/contributing` | Built-in and third-party wallet contribution workflow | Added in this pass |
| Adapters | `/docs/adapters/tronlink` | TronLink adapter notes | Present |
| Adapters | `/docs/adapters/walletconnect` | WalletConnect adapter notes | Present |
| Transactions | `/docs/transactions/overview` | Transaction helpers and method hints | Present |
| Auth | `/docs/auth/sign-in-with-tron` | SIWT | Present |
| Advanced | `/docs/advanced/headless` | Headless usage | Present |
| Advanced | `/docs/advanced/events-hooks` | Events and hooks | Present |
| Advanced | `/docs/advanced/bundle-performance` | Bundle strategy | Present |
| Reference | `/docs/guides/going-live` | Production checklist | Updated in this pass |
| Reference | `/docs/troubleshooting` | Known wallet/RPC issues | Updated in this pass |
| Reference | `/docs/migration-from-tronwallet-adapter` | Migration guide | Present |
| API reference | `/docs/api/generated` | Generated package export inventory | Added in this pass |

## URL Rules

- Use clean links such as `/docs/frameworks/cdn-iife`, not `/docs/frameworks/cdn-iife.html`.
- Keep browser/CDN docs at `/docs/frameworks/cdn-iife`; do not add a duplicate `/docs/frameworks/html-cdn` route unless a redirect is implemented.
- Do not link to built VitePress `dist` assets from source docs.

## Content Rules

- Public docs must use English copy only.
- Use `metadata` as the primary app identity field; mention legacy app aliases only as compatibility.
- Use `walletConnectProjectId` placeholders or environment variables only.
- Use `network: "mainnet"` for production snippets.
- Describe GasFree as Phase 1 display/provider API support, not a completed gasless transfer sender.
- Describe Ledger as hardware-supported but manual QA/device-dependent.
- Describe WalletConnect as a transport entry, not a wallet brand that users install.

## Manual Website QA

Run against `https://127.0.0.1:5175/` when the website server is requested.

| Check | Pass criteria | Status |
| --- | --- | --- |
| Navigation | Every sidebar/nav link resolves without `.html` rewrite confusion | Pending manual |
| Search | Local search finds WalletConnect, GasFree, TRX Domains, Ledger, and adapter contribution topics | Pending manual |
| Dark mode | Tables, custom badges, callouts, and live widgets remain readable | Pending manual |
| Wallet table | Wallet rows match current descriptor/platform/support policy | Pending manual |
| Theme builder | Desktop/mobile preview remains stable; no browser package rebuild unless explicitly requested | Pending manual |
| Playground | Uses configured WalletConnect project id at runtime only | Pending manual |
| Mobile docs | Sidebar and code blocks do not create horizontal scroll | Pending manual |

## Remaining P3 Work

- Upgrade the generated export inventory to full typedoc-style signatures if the public API grows beyond what the manual API pages can explain.
- Add real live-demo screenshots or short video walkthroughs after P0/P1/P2 QA sign-off.
- Add a deployed demo URL once hosting is ready.
- Expand framework docs with Next App Router and vanilla TypeScript copy-paste examples after npm publish.
