# Wallet Test Matrix

## Scope

Track expected wallet behavior for MVP and future adapters.

## Wallets

| Wallet | Package | Connect | Address | Balance | signMessage | signTransaction | Send TRX | Network Handling | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TronLink | `@tron-wallet-kit/adapter-tronlink` | Mock-tested + generic collision guarded | Mock-tested | Pending | Mock-tested | Mock-tested | Mock-tested | Mock-tested | MVP wallet; needs real extension QA; generic TokenPocket-style globals are rejected |
| WalletConnect TRON | `@tron-wallet-kit/adapter-walletconnect` | Mock-tested | Mock-tested | Pending | Mock-tested | Mock-tested | Conditional | Mock-tested | MVP wallet; needs real WalletConnect/TokenPocket QA |
| TokenPocket | injected extension adapter or tronweb3 bridge | Extension wired + QR fallback tested | Mock-foundation | Default resolver path mapped | Mock-tested via injected adapter | Mock-tested via injected adapter | Backlog | Mock-tested | Extension/Mobile metadata; strongest WalletConnect mobile target |
| Trust Wallet | injected extension adapter or tronweb3 bridge | Extension wired + QR fallback foundation | Backlog | Default resolver mock-tested | Backlog | Backlog | Backlog | Backlog | Extension PC path confirmed from upstream docs; mobile path is WalletConnect fallback only |
| Bitget | injected extension adapter or tronweb3 bridge | Extension wired | Backlog | Pending | Backlog | Backlog | Backlog | Backlog | Extension/Mobile metadata; WalletConnect signing unsupported in reference |
| OKX Wallet | injected extension adapter or tronweb3 bridge | Extension wired | Backlog | Pending | Backlog | Backlog | Backlog | Backlog | Extension/Mobile metadata; WalletConnect unsupported in reference |
| Bybit Wallet | tronweb3 bridge + injected fallback | Bridge wired + fallback mock-tested | Mock-tested via fallback | Pending | Mock foundation | Mock foundation | Backlog | Mock foundation | Extension/Mobile metadata; needs real extension/mobile QA |
| Binance Wallet | tronweb3 bridge + injected fallback | Bridge wired + fallback mock-tested | Mock-tested via fallback | Pending | Mock foundation | Mock foundation | Backlog | Mock foundation | Extension/Mobile metadata; wallet-specific signAndSendTransaction still needs real QA |
| MetaMask TRON | `@tron-wallet-kit/adapter-metamask-tron` or tronweb3 bridge | Catalog wired | Backlog | Backlog | Backlog | Backlog | Backlog | Backlog | Extension group; keep separate from core EVM assumptions |
| Backpack | tronweb3 bridge + injected fallback | Bridge wired | Backlog | Pending | Backlog | Backlog | Backlog | Backlog | Extension metadata; SVG icon generated; real QA pending |
| OneKey | tronweb3 bridge + injected fallback | Bridge wired + fallback mock-tested | Mock-tested via fallback | Pending | Mock foundation | Mock foundation | Backlog | Mock foundation | Extension metadata; real QA pending |
| Ledger | tronweb3 bridge candidate | Catalog wired | Backlog | Backlog | Backlog | Backlog | Backlog | Backlog | Hardware/manual flow; SVG icon generated |
| GateWallet | tronweb3 bridge + injected fallback | Bridge wired + fallback mock-tested | Mock-tested via fallback | Pending | Mock foundation | Mock foundation | Backlog | Mock foundation | Extension metadata; real QA pending |
| Guarda | tronweb3 bridge + injected fallback | Bridge wired | Backlog | Pending | Backlog | Backlog | Backlog | Backlog | Extension metadata; real QA pending |
| FoxWallet | tronweb3 bridge | Bridge wired | Backlog | Default resolver mock-tested | Backlog | Backlog | Backlog | Backlog | App/mobile-only in upstream adapter; PC extension should not be shown as installed |
| imToken | tronweb3 bridge | Bridge wired | Backlog | Backlog | Backlog | Backlog | Backlog | Backlog | Mobile/app group; real QA pending |
| TomoWallet | tronweb3 bridge candidate | Native/bridge first | Backlog | Backlog | Backlog | Backlog | Backlog | Backlog | Mobile/app group; WalletConnect unsupported in reference |

## Cross-Wallet Cases

| Case | Expected Result | Status |
| --- | --- | --- |
| Wallet unavailable | Adapter reports unavailable with actionable UI state | UI foundation tested |
| User rejects connection | Error is normalized and UI remains stable | Pending |
| Duplicate/pending connection request | Error is normalized and no stuck connecting state remains | Pending |
| Default TRX balance | Kit reads wallet-specific `tronWeb.trx.getBalance(address)` and normalizes SUN to TRX | Mock-tested for Trust and FoxWallet paths |
| User switches account | Client state updates without stale address | Pending |
| User switches network | Network state updates or unsupported state is shown | Pending |
| Sign message rejected | Error is normalized and toast/panel recovers | Pending |
| Transaction rejected | Error is normalized and recent transaction is not marked sent | Pending |
| Transaction submitted | Toast shows pending/success/failure path | Pending |
| Modal portal to `body` | Theme tokens still apply | Theme/CSS foundation tested |
| Disconnect after aborted connection | Half-open session/listeners are cleaned up | Pending |
| Circular wallet provider after connect | Successful connect is not reported as declined because raw provider objects are not persisted | Unit-tested on 2026-07-06 |

## Client State Cases

| Case | Expected Result | Status |
| --- | --- | --- |
| Active adapter emits `accountsChanged` | Client account updates | Mock-tested |
| Active adapter emits `chainChanged` | Client network updates | Mock-tested |
| Active adapter emits `disconnect` | Client clears account, network, active wallet, and subscriptions | Mock-tested |
| Previous adapter emits after wallet switch | Client ignores stale event | Mock-tested |
| Active adapter emits `error` | Client stores error without forced disconnect | Mock-tested |

## Manual QA Viewports

| Surface | Desktop | Mobile | Notes |
| --- | --- | --- | --- |
| Connect modal | Pending | Pending | Stable dimensions required |
| Account panel | Pending | Pending | Must not jump on loading/error |
| QR address view | Pending | Pending | Stable square QR region |
| Toasts | Pending | Pending | Avoid layout shifts |
| Recent transactions | Pending | Pending | Stable row heights |

## UI Foundation Cases

| Case | Expected Result | Status |
| --- | --- | --- |
| Connect modal CSS | Uses token variables and stable modal/list dimensions | Unit-tested |
| Connect modal wallet states | Shows connecting, unavailable, unsupported/loading/ready states without resizing rows | Unit-tested |
| All Wallets flat wallet grid | Renders a flat searchable grid, no Extension/Mobile section duplication, while cards keep `data-twk-platforms` metadata | Unit-tested on 2026-07-06 |
| All Wallets wallet-card skeleton | Loading cards keep stable card size with icon/name skeletons | Unit-tested |
| Account panel shell | Shows identity, balance, copy state, QR slot, and recent transaction rows | Unit-tested |
| Untrusted wallet/display text | Escaped before rendering HTML helpers | Unit-tested |
| React connect modal wrapper | Renders registered adapters with shared UI markup and theme variables | Server-render tested |
| React account panel wrapper | Renders identity, balance, QR, and transaction rows with shared UI markup | Server-render tested |
| QR helper | Generates QR data URLs for TRON addresses and WalletConnect URIs | Unit-tested |
| Toast foundation | Renders token-driven pending/success/failed transaction toast markup | Unit-tested |
| React example QR/toast smoke | React basic route loads after QR/toast integration | Browser smoke passed on 2026-07-03 |
| HTML/CDN example QR/toast smoke | HTML/CDN route and browser global bundle load after QR/toast integration | Browser smoke passed on 2026-07-03 |
| TRX Domains identity resolver | Enriches connected account with `.trx` domain/displayName and ignores stale async lookups after account changes | Mock-tested on 2026-07-03 |
| TRX Domains real lookup | Known wallet address resolves to expected default domain through `trondomainjs` | Pending |
| Core manager lifecycle | Connect/session/sign/submit/autoReconnect events with `session_restored` then `connected` | Unit-tested |
| Clean adapter result shapes | TronLink and WalletConnect return `ConnectResult`, `SignMessageResult`, `SignTransactionResult`, and `TxResult` | Mock-tested |
| React hooks | Provider and shared UI surfaces render with new kit hooks | Server-render tested |
| Browser/CDN clean API | HTML/CDN example uses `createBrowserKit`, `kit.manager`, and `kit.openModal` | Build-tested |
