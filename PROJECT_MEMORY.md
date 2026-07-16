# TRON Wallet Kit Project Memory

## Project Goal

Build a dedicated TRON Wallet Kit inspired by XRPL Wallet Kit architecture and discipline, without turning it into a hard XRPL fork or a multi-chain abstraction.

## Core Principles

- TRON Wallet Kit is its own product and package family.
- Reuse architecture, UI patterns, documentation patterns, testing discipline, and release discipline where useful.
- Do not copy XRPL-specific assumptions such as XRP balances, XRPL transaction JSON, TrustLine, NFToken, or Xaman behavior.
- Keep `@tron-wallet-kit/core` clean and wallet-neutral.
- Keep adapter-specific behavior inside each adapter package.
- Keep UI token-driven and portal-safe.
- Avoid host-app CSS selector dependencies because modals may render under `body`.
- Keep modal, account panel, QR, toast, and recent transaction surfaces dimensionally stable.
- Keep default config simple for developers.
- Add advanced config only when it has a clear use case.

## Intended Package Direction

- `@tron-wallet-kit/core`
- `@tron-wallet-kit/ui`
- `@tron-wallet-kit/client`
- `@tron-wallet-kit/browser`
- `@tron-wallet-kit/react`
- `@tron-wallet-kit/next`
- `@tron-wallet-kit/auth`
- `@tron-wallet-kit/adapter-tronlink`
- `@tron-wallet-kit/adapter-walletconnect`

## MVP Target

- TronLink connect
- WalletConnect TRON connect
- Account panel
- Copy address
- Address QR
- TRX balance
- `signMessage`
- `signTransaction`
- Send TRX
- Toast transaction feedback
- Recent transactions foundation
- Browser/CDN IIFE
- React basic integration
- HTML legacy/CDN docs
- Light, dark, and custom themes that work when modal portals to `body`

## Current Repository State

- Checked on 2026-07-03.
- Workspace path: `C:\Users\PC\OneDrive\Develop\VibeCode\TronWalletKit`.
- Git repository is initialized in this folder.
- `docs/TRON_WALLET_KIT_PROJECT_BRIEF.md`, `PROJECT_MEMORY.md`, and the `Review/` baseline files exist.
- Initial package scaffold exists for the full requested package list.

## Decisions Made

- Package manager: `pnpm` 10.13.1.
- Initial monorepo tooling: pnpm workspaces, TypeScript strict, `tsup`, `vitest`, ESLint flat config.
- Initial packages scaffolded: `@tron-wallet-kit/core`, `@tron-wallet-kit/ui`, `@tron-wallet-kit/client`, `@tron-wallet-kit/browser`, `@tron-wallet-kit/react`, `@tron-wallet-kit/next`, `@tron-wallet-kit/auth`, `@tron-wallet-kit/adapter-tronlink`, `@tron-wallet-kit/adapter-walletconnect`.
- Adapter source layout: adapter packages live under `packages/adapters/*`, for example `packages/adapters/tronlink` and `packages/adapters/walletconnect`.
- UI theme foundation should prioritize `themeName` presets plus token overrides. Initial presets: `light`, `dark`, `tron`, `energy`, `sun`, `graphite`, `midnight`, `ocean`, `minimal`, `highContrast`.
- Theme utilities must remain portal-safe by applying CSS variables to the rendered wallet kit root, not relying on host app selectors.
- MVP adapters currently expose contract skeletons only. Real TronLink and WalletConnect behavior still needs implementation and wallet QA.

## Session Log

### 2026-07-03

- Reviewed repository shape.
- Could not read `docs/TRON_WALLET_KIT_PROJECT_BRIEF.md` because it does not exist in the current workspace.
- Created baseline project memory and review files.
- Drafted an initial scaffold plan pending confirmation of package structure, package names, package manager, and scripts.
- Reviewed `walletadapter.org` and noted competitive positioning: TronWallet Adapter is mature with broad wallet coverage, React/Vue packages, WalletConnect, security check hooks, wallet capability matrix, and tested wallet versions. TRON Wallet Kit should differentiate through a cleaner product-level account panel, QR, balance, transaction feedback, recent transaction foundation, portal-safe token-driven UI, browser/CDN-first docs, and stricter separation between core and adapter behavior.
- Compared positioning against ConnectKit and RainbowKit. These are stronger UI/UX benchmarks than TronWallet Adapter: ConnectKit emphasizes a beautiful responsive React wallet connection experience, theming, translations, SIWE, and wagmi standards; RainbowKit emphasizes wallet management, responsive/customizable UI, balance display, network switching, theming, authentication, modal hooks, custom wallet lists, and recent transactions. TRON Wallet Kit should borrow the product polish bar from these kits while staying TRON-native and not depending on EVM assumptions.
- Evaluated potential using XRPL Wallet Kit and TRX Domains as references. XRPL Wallet Kit already positions around adapters, customizable modal, built-in auth, AI-powered adapter development, CDN support, and headless core. TRX Domains can give TRON Wallet Kit a domain identity layer: resolve `.trx` names, show profile/avatar/social identity in account panel, send TRX to names, domain QR/profile surfaces, and domain-aware auth/display. This can be a stronger wedge than competing first on wallet adapter count.
- Read TronWallet Adapter docs and adapter source layout to prioritize adapter order. Recommended order: Phase 1 TronLink + WalletConnect; Phase 2 TokenPocket plus Trust Wallet or Bitget; Phase 3 MetaMask TRON, OKX, Bybit, Binance; later Ledger, Backpack, OneKey, Guarda, FoxWallet, imToken, GateWallet, Tomo. Rationale: start with strongest baseline capability and highest TRON relevance, then expand to mobile/WalletConnect and high-value wallets with partial behavior once the capability model is stable. MetaMask should be a TRON-specific adapter package, not a reason to make core EVM-shaped.
- Started coding Phase 1 foundation after user asked to begin and prioritize `themeName`.
- Added root pnpm workspace, strict TypeScript config, `tsup`, and `vitest`.
- Added `@tron-wallet-kit/core` with TRON-native wallet adapter contracts, account/network/capability types, normalized `WalletKitError`, and capability helpers.
- Added `@tron-wallet-kit/ui` with token-driven theme presets, `resolveTheme`, `getThemeNames`, `createThemeStyleText`, and `applyThemeToElement`.
- Ran `pnpm install`, `pnpm typecheck`, `pnpm test`, and `pnpm build` successfully.
- `pnpm install` warned that the `esbuild` build script was ignored by pnpm approval policy, but `tsup` builds succeeded.
- Created `docs/TRON_WALLET_KIT_PROJECT_BRIEF.md` because the requested brief file was missing.
- Initialized a Git repository.
- Added ESLint flat config and `pnpm lint`.
- Added package shells for `client`, `browser`, `react`, `next`, `auth`, `adapter-tronlink`, and `adapter-walletconnect`.
- `client` now has headless wallet registry/connect/disconnect/sign/sendTrx/recent-transaction foundation.
- `browser` now builds ESM/CJS/IIFE with global name `TronWalletKit`.
- `react` now exposes `TronWalletKitProvider`, `useWalletClient`, and `useWalletState`.
- `auth` now has a TRON sign-in message helper.
- `adapter-tronlink` and `adapter-walletconnect` expose metadata/capabilities and normalized scaffold errors.
- Ran `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` successfully across the workspace.
- `pnpm install` warned that the `sharp` build script was ignored by pnpm approval policy. No current build/test path depends on it.
- Moved adapter source folders from `packages/adapter-tronlink` and `packages/adapter-walletconnect` to `packages/adapters/tronlink` and `packages/adapters/walletconnect`. Public package names remain `@tron-wallet-kit/adapter-tronlink` and `@tron-wallet-kit/adapter-walletconnect`.
- Updated pnpm workspace glob and nested adapter tsconfig paths for the new adapter layout, then reran `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` successfully.
- Implemented the first real TronLink adapter pass. It now resolves injected providers from `globalThis.tron`, `globalThis.tronLink`, or `globalThis.tronWeb`; supports legacy `tron_requestAccounts` and TIP-1193-style `eth_requestAccounts`; normalizes connection/user-rejected/sign/send errors; reads network info from genesis block chain id; supports `signMessage`, `signTransaction`, and `sendTrx`; and listens for TIP-1193 `accountsChanged`/`chainChanged` events when available.
- Added TronLink mock-provider tests for metadata/capabilities, connect/network, sign message, sign transaction, send TRX, and user rejection.
- Ran `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` successfully after the TronLink implementation.
- TronLink still needs manual QA with the real browser extension and mobile/deeplink behavior.
- Reviewed `tronweb3/tronwallet-adapter` adapter implementations and tests before continuing adapter work. Key finding: implementation quality and test depth vary by adapter. TronLink, Ledger, Backpack, abstract, and EVM adapters have deeper tests; many other wallet adapters mostly have smoke tests. WalletConnect has important implementation details but no local unit tests in its adapter package. TRON Wallet Kit should use the upstream implementation as behavior reference, not as code to copy, and should add stronger normalized tests for every adapter we introduce.
- Implemented WalletConnect adapter boundary. It now depends on `@tronweb3/walletconnect-tron`, creates the default wallet through a dynamic import, supports injectable `walletFactory` for tests, maps network names to `tron:<chainId>`, supports custom `onUri`, connect/disconnect, signMessage, signTransaction, wallet event cleanup, account-change handling, disconnect handling, and best-effort cleanup of half-open sessions after failed QR/modal connect flows.
- WalletConnect direct `sendTrx` is supported only when the underlying wallet implementation provides `sendTrx` or `sendTransaction`; it is not advertised as a default capability.
- Added WalletConnect tests for readiness, connect/network, `onUri`, sign message, sign transaction, direct send when available, half-open cleanup, account event, and disconnect event.
- Ran `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` successfully after WalletConnect implementation.
- `pnpm install` warned that `@reown/appkit` build scripts were ignored by pnpm approval policy. Current typecheck/test/build paths still pass.
- Implemented client-side active adapter event subscriptions. `WalletClient` now binds to active adapter `connect`, `disconnect`, `accountsChanged`, `chainChanged`, and `error` events after connect; clears subscriptions on disconnect or wallet switch; and ignores stale events from adapters that are no longer active.
- Added client tests for account change sync, network change sync, active adapter disconnect cleanup, stale adapter event ignoring, and adapter error storage.
- Ran `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm test` successfully after client event sync. Note: do not run `pnpm test` and `pnpm build` concurrently because build cleans package `dist` folders while tests may resolve workspace package exports through `dist`.
- Implemented the first framework-neutral UI surface foundation in `@tron-wallet-kit/ui`. Added token-driven component CSS via `createWalletKitStyles`, portal root creation via `createWalletKitRoot`, connect modal HTML/DOM helpers, and account panel HTML/DOM helpers.
- Connect modal foundation supports wallet ready states, selected/connecting state, unavailable/unsupported labels, close action markup, stable wallet row sizing, alert-safe error area, and escaped wallet text.
- Account panel foundation supports TRON account identity/domain display, network pill, TRX balance slot, copy/copied state, send/disconnect action slots, stable QR slot, and recent transaction rows with normalized pending/success/failed status styling.
- Browser package now re-exports the new UI helpers so CDN/IIFE usage can access the same surface foundation.
- Browser kit now adds `.twk-root`, applies theme tokens, and auto-injects default wallet kit styles through `ensureWalletKitStyles` for simpler CDN/browser defaults.
- Added UI tests for token-only component CSS colors, stable modal/account/QR dimensions, wallet ready state markup, account panel slots, recent transaction markup, and HTML escaping.
- Added React surface wrappers in `@tron-wallet-kit/react`: `ConnectModal` and `AccountPanel`. They reuse the framework-neutral UI HTML helpers through event delegation, inject shared wallet kit styles on the client, and apply theme tokens inline to the rendered `.twk-root`.
- `ConnectModal` now reads registered adapters from `WalletClient`, maps adapter readiness/status into wallet options, calls `client.connect(walletId)`, and exposes `onClose`/`onConnectError` callbacks.
- `AccountPanel` now reads connected state from `WalletClient` by default, supports explicit account/network/balance/QR props, maps recent transactions into UI rows, copies the address through Clipboard API or custom `onCopy`, and calls `client.disconnect()`.
- Added `createThemeStyleProperties` to `@tron-wallet-kit/ui` so framework wrappers can apply the same token contract without duplicating CSS variable mapping.
- Added root `vitest.config.ts` aliases for workspace packages so tests resolve source files instead of stale `dist` output.
- Added React server-render tests for connect modal and account panel wrappers. Added React/ReactDOM dev dependencies for testing.
- Received WalletConnect demo project ID `YOUR_WALLETCONNECT_PROJECT_ID` from the user. It is documented for demos but intentionally not hardcoded into core or adapter defaults.
- Browser/CDN entrypoint now re-exports TronLink and WalletConnect adapter factories and adds `createDefaultBrowserAdapters({ walletConnectProjectId, walletConnectNetwork, walletConnectOnUri })`.
- Added initial HTML/CDN and React usage docs with TronLink + WalletConnect examples using the provided project ID.
- Browser IIFE currently bundles WalletConnect support for convenience and built successfully, but the all-in-one global bundle is large. Before public release, decide whether to keep this all-in-one IIFE or publish separate adapter browser bundles.
- Added runnable examples workspace at `examples/` with Vite:
  - `/` example index.
  - `/react-basic/` React provider/connect modal/account panel example using TronLink and WalletConnect project ID `YOUR_WALLETCONNECT_PROJECT_ID`.
  - `/html-cdn/` vanilla HTML/CDN example using the browser IIFE served from `/vendor/tron-wallet-kit.global.js`.
- Added root `dev:examples` script that runs `pnpm --filter @tron-wallet-kit/examples dev`.
- Examples typecheck and build pass. Build emits expected warnings because the HTML/CDN page intentionally loads a global script and WalletConnect/AppKit dependencies are large.
- Started examples dev server on `http://127.0.0.1:5173/` and smoke-checked `/`, `/react-basic/`, `/html-cdn/`, and `/vendor/tron-wallet-kit.global.js`; all returned HTTP 200.
- Reviewed local XRPL Wallet Kit project at `C:\Users\PC\OneDrive\Develop\VibeCode\xrplWalletKit` and public site `https://xrpdomains.xyz/xrpl-wallet-kit/`. Key patterns to reuse for TRON: config resolver, theme presets/token contract, portal-safe modal/account panel/toast styling, QR states, React wrapper around shared UI foundation, examples, VitePress website docs, release/test discipline, and adapter development docs. Key assumptions to avoid: XRPL sessions, XRP balance, XRPL transaction JSON, Xaman, TrustLine/NFToken behavior, and XRPL explorer/domain API assumptions.
- Added TRON UI config resolver in `@tron-wallet-kit/ui`: `WalletUiConfig`, `resolveWalletUiConfig`, and `createDefaultWalletUiConfig`. This mirrors the XRPL ergonomics while staying TRON-specific.
- Added QR helper `createQrDataUrl(value, options)` using `qrcode`, for TRON address QR and WalletConnect URI QR rendering.
- Added transaction toast foundation: `TransactionToastViewModel`, `createTransactionToastHtml`, and `createTransactionToastContainerHtml`, plus token-driven toast CSS in `createWalletKitStyles`.
- Updated React and HTML/CDN examples to render WalletConnect QR, address QR, and mock transaction toasts.
- Scaffolded VitePress website at `website/` with introduction, quick start, theming, WalletConnect config, React, HTML/CDN, adapter overview, TronLink, WalletConnect, UI API, and client API pages.
- Ran full workspace `pnpm build` after the UI QR/toast and website docs work; it passed on 2026-07-03. Expected warnings remain: browser IIFE is large because WalletConnect/AppKit are bundled, examples chunks exceed 500 KB, and the HTML/CDN example intentionally loads a non-module global script.
- Restarted the examples dev server. Because ports 5173 and 5174 were already occupied, the active TRON examples server is currently `http://127.0.0.1:5175/`. Smoke checks passed for `/`, `/react-basic/`, `/html-cdn/`, and `/vendor/tron-wallet-kit.global.js`.
- Started the TRON docs VitePress dev server at `http://127.0.0.1:5176/` because 5174 is occupied by the XRPL Wallet Kit docs server. Smoke checks passed for `/`, `/docs/introduction`, and `/docs/configuration/theming`.
- Added TRX Domains identity resolution through `trondomainjs` in `@tron-wallet-kit/client`. Identity is opt-in via `identity: { enabled: true }`, enriches `client.state.account.domain` and `displayName`, supports custom `identity.resolver`, and ignores stale async resolutions after account changes.
- Added `trondomainjs` and its required `tronweb` runtime dependency to `@tron-wallet-kit/client`. Browser/CDN now re-exports `createTronDomainIdentityResolver`, but this increases the all-in-one IIFE bundle to about 9.02 MB; split browser bundles should be prioritized before public release.
- Updated `TronWalletKitProvider` so React users can pass full client config such as `identity` directly to the provider.
- Added website identity docs at `/docs/configuration/identity` and updated client/React docs. `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` all passed after the identity integration.
- Current dev servers remain active: examples at `http://127.0.0.1:5175/` and docs at `http://127.0.0.1:5176/`. Smoke checks passed for the identity docs route and examples routes; the global bundle returned HTTP 200 with length `9457975`.
- Reviewed XRPL Wallet Kit organization again after user feedback. Key parity gaps for TRON: no stateful modal/button/toast controllers yet, weaker client kit factory, thinner manager/session/storage model, and adapter metadata was missing icons/groups.
- Added default SVG data-URI icons and richer metadata to TronLink and WalletConnect adapters: `icon`, `homepage`, `type`, `group`, and `description`. Extended core `WalletMetadata` with optional `type`, `group`, and `description`.
- Added adapter tests asserting icon/type/group metadata. Ran adapter/core typecheck, adapter/core tests, and builds for core, TronLink, WalletConnect, and browser successfully. Verified browser global bundle contains the new icon data URIs.
- Read `docs/TRON_WALLET_KIT_ARCHITECTURE_SPEC.md` and started realigning the repo to the specified XRPL Wallet Kit architecture port. The target is now explicit: port XRPL Wallet Kit architecture 1:1, replacing only chain-specific layers and public vocabulary with TRON-native concepts.
- Expanded `@tron-wallet-kit/core` with spec-aligned primitives: `WalletManager`, `WalletEventEmitter`, `WalletNetwork`, default TRON networks (`mainnet`, `nile`, `shasta`), `NetworkRegistry`, storage abstraction, session envelope, `WalletSession`, `WalletTransaction`, signing result types, `submitTransaction`, transaction events, explorer helpers, and TRON method hints.
- Kept a temporary compatibility bridge so existing adapters/client still build: `WalletAdapter.capabilities` accepts both old `Set<WalletCapability>` and new object capabilities, and connect/sign methods normalize both scaffold-era and manager-era result shapes.
- Updated TronLink and WalletConnect adapters to return full `WalletNetwork` objects from core instead of thin `{ name, chainId }` objects.
- Updated React wrapper capability/network mapping for the expanded core contract, and widened UI account-panel `networkName` to `string` for custom TRON networks.
- Added `packages/core/test/manager.test.ts` covering connect/session creation, autoReconnect emitting `session_restored` then `connected`, normalized signMessage, submitTransaction, transaction storage, and `tx_submitted`.
- Verification after architecture phase: `pnpm test` passed, `pnpm lint` passed, `pnpm build` passed. `pnpm typecheck` root timed out in this environment after the change, so every workspace package typecheck was run individually and passed.

## 2026-07-03 Clean Architecture Rebuild

- User confirmed clearing the old scaffold implementation to rebuild against `docs/TRON_WALLET_KIT_ARCHITECTURE_SPEC.md`.
- Replaced the temporary compatibility bridge with a clean spec-era core contract. `@tron-wallet-kit/core` now owns `WalletManager`, network registry, storage/session envelope, event emitter, object capabilities, normalized signing results, `submitTransaction`, `WalletTransaction`, explorer URLs, and TRON method hints.
- Rebuilt TronLink and WalletConnect adapters against the new adapter contract. They now return `ConnectResult`, `SignMessageResult`, `SignTransactionResult`, and `TxResult`; expose object capabilities; keep provider quirks internal; and retain lightweight icon metadata.
- Rebuilt `@tron-wallet-kit/client` as the primary developer entrypoint. `createWalletClient()` returns a `WalletManager`; `createWalletKit()` assembles manager + modal + button + toast and exposes TRON-native helpers: `sendTransaction`, `transferTrx`, `transferTrc10`, `transferTrc20`, `triggerSmartContract`, `freezeBalance`, `unfreezeBalance`, `delegateResource`, `undelegateResource`, and `voteWitness`.
- Rebuilt `@tron-wallet-kit/ui` as a shared token-driven UI/controller foundation with theme presets, QR helper, modal/account panel/toast HTML helpers, and stateful `createWalletModal`, `createWalletButton`, and `createWalletToast` controllers that work when portaled to `body`.
- Rebuilt React/Next bindings around the new kit model. React now exposes `TronWalletProvider`, `useWalletKit`, `useWalletSession`, `useWalletAccount`, `useWalletStatus`, and `useWalletCapabilities`; `TronWalletKitProvider` remains an alias.
- Rebuilt browser/CDN entrypoint around `createBrowserKit()` and `window.TronWalletKit`. HTML/CDN example now uses `kit.manager` and `kit.openModal()` rather than the removed scaffold-era `kit.client`.
- Expanded auth to spec names: `createSignInMessage`, `verifySignIn`, `generateNonce`, and `verifyTronSignature`, while keeping `createAuthMessage` as an alias.
- Updated React and HTML examples to the new APIs. The WalletConnect demo project ID remains `YOUR_WALLETCONNECT_PROJECT_ID` in examples only.
- Quality gates after clean rebuild: `pnpm install`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm lint` all passed. `pnpm build` still warns that the all-in-one browser IIFE/examples include large WalletConnect/AppKit chunks and that the HTML/CDN example intentionally loads a non-module global script.
- Important follow-up: the browser IIFE is still about 9 MB because WalletConnect/AppKit plus identity-related dependencies are bundled into the all-in-one global build. Split browser bundles or optional adapter globals should be prioritized before public release.

## 2026-07-03 Browser IIFE + IIFE Min

- Updated `@tron-wallet-kit/browser` build scripts to emit brand-named browser artifacts: `dist/tron-wallet-kit.iife.js` and `dist/tron-wallet-kit.iife.min.js`.
- Added `scripts/build-browser-iife.mjs` and `scripts/build-browser-iife-min.mjs` because current `tsup` CLI emits IIFE as `index.global.js` by default. The scripts build through tsup, then rename outputs to the desired `tron-wallet-kit.iife*` artifact names.
- Set browser IIFE builds to `--platform browser`; this fixed a smoke failure where `qrcode` was resolving the Node/server branch and trying to dynamically require `fs`.
- Current browser bundle sizes after browser-platform build: `tron-wallet-kit.iife.js` about 7.73 MB and `tron-wallet-kit.iife.min.js` about 3.78 MB.
- HTML/CDN example now uses `/vendor/tron-wallet-kit.iife.min.js` by default, while `/vendor/tron-wallet-kit.iife.js` is still copied for debugging.
- Smoke-tested both IIFE files in a VM-like browser global context: both expose `TronWalletKit.createBrowserKit`, `createWalletKit`, and `createTronLinkAdapter`.
- Verification: `pnpm --filter @tron-wallet-kit/browser build`, browser/examples typecheck, examples build, and `pnpm lint` passed.

## 2026-07-04 Examples Port and Docs Sync

- User requested local examples use port `5174`.
- Updated `@tron-wallet-kit/examples` dev script to `vite --host 127.0.0.1 --port 5174`.
- Updated example Vite middleware and docs to use brand-named browser bundle paths: `/vendor/tron-wallet-kit.iife.js` and `/vendor/tron-wallet-kit.iife.min.js`.
- Updated website quick start, React docs, HTML/CDN docs, and client API docs to reflect the clean `createWalletKit()` / `WalletManager` / React hook APIs and the `5174` local example port.
- Stopped the old XRPL docs process that was occupying `5174`, then ran TRON examples on `http://127.0.0.1:5174/`.
- Restarted the examples server through the official package script after the port/doc sync. Active server: `http://127.0.0.1:5174/`.
- Verification after the restart: `pnpm lint` passed, and smoke checks returned HTTP 200 for `/`, `/react-basic/`, `/html-cdn/`, and `/vendor/tron-wallet-kit.iife.min.js` with bundle length `3961353`.

## 2026-07-04 UI Theme Parity Phase

- Re-read `docs/TRON_WALLET_KIT_ARCHITECTURE_SPEC.md` and local XRPL Wallet Kit UI sources at `C:\Users\PC\OneDrive\Develop\VibeCode\xrplWalletKit\packages\ui\src`.
- Expanded `@tron-wallet-kit/ui` theme presets to: `default`, `light`, `dark`, `tron`, `energy`, `sun`, `graphite`, `midnight`, `ocean`, `glass`, `rounded`, `crisp`, `soft`, `neon`, `terminal`, `minimal`, and `highContrast`.
- Expanded the token contract with `walletRadius`, `surfaceHover`, `backdropBlur`, `focusRing`, `spinnerTrail`, `fallbackIconBackground`, and `fallbackIconColor`.
- Improved dark/light UI polish for modal/account/toast CSS: portal scrim blur, tokenized hover states, visible focus rings, reduced-motion support, mobile safe-area sheet sizing, toast spinner, toast dismiss button, and SVG status/action icons.
- `resolveTheme({ mode: "auto" })` now resolves light/dark from system preference when no explicit `themeName` is supplied.
- Updated React and HTML/CDN examples so the theme picker exposes all presets. Updated website theming docs and UI/UX review notes.
- Rebuilt browser IIFE and synced `examples/public/vendor/tron-wallet-kit.iife.js` and `.min.js`; current minified vendor length is `3966642`.
- Verification: `pnpm --filter @tron-wallet-kit/ui typecheck`, `pnpm --filter @tron-wallet-kit/ui test`, `pnpm --filter @tron-wallet-kit/react typecheck`, `pnpm --filter @tron-wallet-kit/client typecheck`, `pnpm --filter @tron-wallet-kit/examples typecheck`, `pnpm --filter @tron-wallet-kit/browser build`, `pnpm --filter @tron-wallet-kit/examples build`, `pnpm --filter @tron-wallet-kit/website build`, and `pnpm lint` passed.
- Smoke checks on active examples server `http://127.0.0.1:5174/` returned HTTP 200 for `/`, `/react-basic/`, `/html-cdn/`, and `/vendor/tron-wallet-kit.iife.min.js`. VM IIFE smoke confirmed `TronWalletKit.createBrowserKit` and `getThemeNames`.
- Known remaining UI parity work: split `packages/ui/src/index.ts` into XRPL-style `themes/config/modal/button/toast/dom` modules; add full WalletConnect QR/details view controller; strengthen account panel identity/balance lifecycle and visual QA with browser screenshots.

## 2026-07-04 Core/UI Module Split Phase

- User requested rereading the full XRPL Wallet Kit packages and reorganizing TRON packages to avoid everything accumulating in `index.ts`, with strict attention to core and UI maintainability.
- Audited local XRPL Wallet Kit package layout at `C:\Users\PC\OneDrive\Develop\VibeCode\xrplWalletKit\packages`. XRPL core uses small modules (`adapter`, `errors`, `events`, `manager`, `networks`, `storage`, `types`, `utils`, etc.), and XRPL UI separates `types`, `themes`, `config`, `dom`, `modal`, `button`, `toast`, `balance`, `icons`, and locales.
- Refactored `@tron-wallet-kit/core` from one large `src/index.ts` into XRPL-style modules:
  - `src/types.ts`
  - `src/errors.ts`
  - `src/networks.ts`
  - `src/storage.ts`
  - `src/events.ts`
  - `src/adapter.ts`
  - `src/manager.ts`
  - `src/utils.ts`
  - `src/index.ts` barrel export only.
- Refactored the first UI layer out of `@tron-wallet-kit/ui/src/index.ts`:
  - `src/types.ts` owns public UI/theme/view-model types.
  - `src/themes.ts` owns theme presets, CSS variable mapping, `resolveTheme`, `getThemeNames`, and theme style helpers.
  - `src/config.ts` owns `resolveWalletUiConfig` and `createDefaultWalletUiConfig`.
  - `src/index.ts` remains the compatibility barrel plus current surface/controller implementation, reduced from 1094 lines to 705 lines.
- Public imports remain compatible because `@tron-wallet-kit/core` and `@tron-wallet-kit/ui` still re-export the same symbols from their package entrypoints.
- Verification after split:
  - `pnpm --filter @tron-wallet-kit/core typecheck`
  - `pnpm --filter @tron-wallet-kit/core test`
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck`
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect typecheck`
  - `pnpm --filter @tron-wallet-kit/browser typecheck`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm --filter @tron-wallet-kit/browser build`
- Rebuilt and synced browser IIFE vendor files. VM IIFE smoke confirmed `window.TronWalletKit` exposes `createBrowserKit`, `resolveTheme`, and 17 theme presets. Active examples server `http://127.0.0.1:5174/` returned HTTP 200 for `/`, `/react-basic/`, `/html-cdn/`, and `/vendor/tron-wallet-kit.iife.min.js`; current minified vendor length is `3966713`.
- Remaining refactor work: split UI `index.ts` further into `dom`, `modal`, `button`, `toast`, `qr`, and possibly `account-panel` modules; add XRPL-style richer controller behavior after module boundaries are clean.

## 2026-07-04 UI Surface Module Extraction

- Continued the requested "next work" by completing the UI module split so `@tron-wallet-kit/ui/src/index.ts` is now a barrel export only.
- Added focused UI modules:
  - `src/styles.ts` for token-driven CSS generation.
  - `src/dom.ts` for style injection, portal root creation, HTML element creation, and applying theme tokens to portal roots.
  - `src/qr.ts` for QR data URL generation.
  - `src/icons.ts` for shared SVG action/status icons.
  - `src/utils.ts` for escaping and address shortening helpers.
  - `src/modal.ts` for connect modal HTML and `createWalletModal`.
  - `src/button.ts` for `createWalletButton`.
  - `src/toast.ts` for toast HTML and `createWalletToast`.
  - `src/account-panel.ts` for account panel HTML and DOM helper.
- Kept public imports compatible by re-exporting every module from `packages/ui/src/index.ts`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/browser typecheck`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm --filter @tron-wallet-kit/browser build`
- Rebuilt and synced `examples/public/vendor/tron-wallet-kit.iife.js` and `.min.js`. VM IIFE smoke confirmed `createBrowserKit`, `createWalletModal`, and `createAccountPanelHtml`. Active examples server `http://127.0.0.1:5174/` returned HTTP 200 for `/`, `/react-basic/`, `/html-cdn/`, and `/vendor/tron-wallet-kit.iife.min.js`; current minified vendor length is `3966864`.
- Remaining UI parity work is now behavioral rather than structural: WalletConnect QR/details flow, account panel identity/balance lifecycle, toast dismiss/autodismiss controller behavior, focus trap/scroll lock, and visual QA screenshots.

## 2026-07-04 Product UX Adapter Proposal

- Created `Review/PRODUCT_UX_ADAPTER_PROPOSAL.md` as a draft for review before implementation.
- Proposal recommends using WalletAdapter as a technical adapter checklist, while using Reown AppKit, RainbowKit, ConnectKit, and XRPL Wallet Kit as UI/product quality benchmarks.
- Recommended next implementation phase: wallet catalog, featured wallets, all-wallets search grid, status badges, connecting view, WalletConnect QR foundation, and stronger `themeName` presets.
- Adapter priority documented: start with TronLink and WalletConnect, add popular wallets as catalog entries or WalletConnect-routed entries before creating many dedicated native adapters.
- MetaMask should be shown carefully as a multichain route until a stable TRON-native signing and transaction path is confirmed.

## 2026-07-04 MetaMask Connect TRON Proposal Update

- Read `https://github.com/MetaMask/connect-tron` and updated `Review/PRODUCT_UX_ADAPTER_PROPOSAL.md`.
- MetaMask now moves from "multichain catalog only" to an early adapter candidate because `@metamask/connect-tron` exposes a `MetaMaskAdapter` compatible with the tronwallet-adapter interface.
- Proposal now recommends the first adapter implementation wave as TronLink, WalletConnect, and MetaMask, with MetaMask wrapped in `packages/adapters/metamask` after local behavior audit.
- MetaMask audit checklist added: `connect`, `disconnect`, `signMessage`, `signTransaction`, `switchChain`, account changes, chain changes, ready-state events, unavailable state, and the documented `multiSign` limitation.

## 2026-07-04 UI/UX Pro Max Proposal Review

- Applied the local `ui-ux-pro-max` guidance to the product proposal and updated `Review/PRODUCT_UX_ADAPTER_PROPOSAL.md`.
- Added UI review criteria for accessibility, touch targets, layout stability, motion, theme tokens, responsive behavior, wallet grid/search states, QR states, account panel states, and browser/CDN parity.
- Updated `Review/UI_UX_DECISIONS.md` with the same quality gates so future UI implementation phases can be checked against them.

## 2026-07-04 Review Feedback Read: UX Adapter Proposal

- Read `Review/REVIEW_2026-07-04_UX_ADAPTER_PROPOSAL.md`.
- Review verdict: proposal direction is approved conditionally, but it must be grounded with explicit current-code gap analysis before the next UI phase.
- Highest-priority follow-up items from review:
  - wire wallet `isAvailable()` into modal `readyState` and badge rendering
  - add real `reown-light` and `reown-dark` presets and unify theme names across docs/code
  - add modal accessibility basics: focus trap, Escape handling, focus restore, and backdrop close
  - implement modal view routing: featured, all-wallets search, connecting detail, and QR
  - resolve adapter/doc drift for TronLink account/network change events
  - fix account-panel balance fallback that can render `TRX TRX`
  - treat IIFE bundle splitting and i18n as deliverables, not only risks
  - add automated contrast testing for theme presets before production readiness

## 2026-07-04 Proposal Updated From Review

- Updated `Review/PRODUCT_UX_ADAPTER_PROPOSAL.md` according to `Review/REVIEW_2026-07-04_UX_ADAPTER_PROPOSAL.md`.
- Proposal status is now "Approved with conditions" and includes an explicit current-code gap analysis.
- Superseded by `2026-07-04 Proposal Scope Correction: TRON-Only Adapters`: theme work should upgrade the default `light` and `dark` presets, not add third-party brand-named theme presets.
- Added i18n/copy readiness requirements and automated contrast testing as production quality gates.
- Superseded by `2026-07-04 Proposal Scope Correction: TRON-Only Adapters`: MetaMask planning should use the TRON adapter scope `metamask-tron`.
- Revised implementation phases so P0 work starts with wallet readiness wiring, badges, default light/dark polish, account-panel balance fallback, copy a11y feedback, and contrast tests before broader modal routing.

## 2026-07-04 Proposal Scope Correction: TRON-Only Adapters

- Updated `Review/PRODUCT_UX_ADAPTER_PROPOSAL.md` after user clarified the product must avoid third-party brand theme names and generic wallet directory concepts.
- `light` and `dark` are now the default high-quality polished themes; proposal no longer asks for `reown-light` or `reown-dark` code names.
- Adapter scope is now explicitly tied to `https://github.com/tronweb3/tronwallet-adapter/tree/main/packages/adapters`.
- Removed generic non-TRON wallet directory concepts, removed `MULTICHAIN` as a badge/category, and reframed WalletConnect as TRON WalletConnect only.
- MetaMask planning now points to the TRON adapter package scope `metamask-tron`, not a separate outside package as the implementation source.

## 2026-07-04 Theme Name Scope Correction

- Updated `Review/PRODUCT_UX_ADAPTER_PROPOSAL.md` so production `themeName` values stay TRON-branded and do not reference XRPL or third-party products.
- Production theme proposal now centers on `light`, `dark`, `tron`, `tron-energy`, `nile`, `shasta`, `sun`, `bandwidth`, `energy`, `terminal`, and `highContrast`.
- Non-TRON or generic visual experiments such as `glass`, `minimal`, `rounded`, `crisp`, `midnight`, and `ocean` are treated as playground/extended presets rather than primary production theme names.

## 2026-07-04 Read REOWN_UI_SPEC_FOR_TRON

- Read `Review/REOWN_UI_SPEC_FOR_TRON.md` and compared it with `Review/PRODUCT_UX_ADAPTER_PROPOSAL.md`.
- Key accepted UI details from the spec: default `light`/`dark` should absorb measured modal tokens, TronLink should be the first featured wallet, WalletConnect should be the last featured transport row with `QR CODE`, and the certified-wallet toggle should be omitted.
- The spec is mostly aligned with the newer TRON-only proposal, but implementation should avoid code names tied to Reown and should keep catalog/adapter scope limited to `tronwallet-adapter/packages/adapters`.
- Follow-up for implementation: merge the spec's concrete token values, badge tokens, featured ordering, wallet catalog metadata, and modal view routing into Phase 1/2 work.

## 2026-07-04 UI Phase 1: Theme, Badges, Readiness Wiring

- Started coding from `Review/PRODUCT_UX_ADAPTER_PROPOSAL.md` and `Review/REOWN_UI_SPEC_FOR_TRON.md`.
- Updated `@tron-wallet-kit/ui` theme contract with badge tokens and upgraded default `light`/`dark` to the measured polished modal values from the UI spec. Added TRON-oriented theme names: `tron-energy`, `nile`, `shasta`, and `bandwidth`.
- Added shared `packages/ui/src/wallet-options.ts` with `mapAdapterToWalletOption()` so DOM and React surfaces no longer hardcode wallet availability.
- Updated connect modal rows to render semantic `.twk-badge` states: `INSTALLED`, `NOT INSTALLED`, `QR CODE`, `CHECKING`, and `TRON`. WalletConnect/QR-capable wallets can show `QR CODE` without being disabled just because no injected provider is found.
- `createWalletModal()` now refreshes adapter `isAvailable()` asynchronously and re-renders wallet `readyState`.
- Fixed account-panel balance fallback so missing balance renders `-` instead of `TRX TRX`; copy feedback now includes an `aria-live="polite"` screen-reader region.
- Synced React wrapper to use the shared wallet option mapper. Synced HTML/CDN example theme picker, website theming docs, project brief theme list, and UI/UX decisions with the TRON-native theme naming direction.
- Added UI tests for polished light/dark tokens, automated WCAG AA text contrast for production theme presets, badge markup, account-panel copy live region, and missing-balance regression.
- Rebuilt browser IIFE and synced `examples/public/vendor/tron-wallet-kit.iife.js` and `.min.js`. Current minified vendor file length is `3971031` bytes. VM IIFE smoke confirmed `createBrowserKit`, updated theme names, `light` radius `28px`, and `dark` surface `#141414`. HTTP smoke on active examples server returned 200 for `/vendor/tron-wallet-kit.iife.min.js`.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/browser typecheck`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm --filter @tron-wallet-kit/browser build`
  - `pnpm --filter @tron-wallet-kit/website build`
- Remaining from the merged UI spec: wallet catalog metadata, featured ordering with TronLink first and WalletConnect last, all-wallets search view, connecting detail view, QR view routing, focus trap/Escape/focus restore/backdrop close, and visual QA screenshots.

## 2026-07-04 UI Phase 2: Wallet Catalog, Modal Routing, and A11y

- Implemented a TRON-only wallet catalog in `packages/ui/src/wallet-catalog.ts` with initial display metadata for TronLink, MetaMask TRON route, OKX, Bitget, TokenPocket, Trust, Binance Web3 Wallet, SafePal, Gate, FoxWallet, Bybit, imToken, OneKey, Ledger, and WalletConnect.
- Featured modal ordering is now catalog-driven: TronLink first, WalletConnect last. Catalog-only mobile wallets can point at `adapterId: "walletconnect"` so the UI can route them through the TRON WalletConnect QR transport when that adapter exists.
- Added `packages/ui/src/wallets/icons.generated.ts` as the build-time data-URI icon map. The map is intentionally empty for now; future icon-fetch work should populate it from `https://walletadapter.org/wallets/*.svg` without runtime hotlinking.
- Rebuilt `packages/ui/src/modal.ts` into an explicit view router with `featured`, `all-wallets`, `connecting`, and `qr` views while preserving public helpers `createConnectModalHtml`, `createConnectModalElement`, and `createWalletModal`.
- Added all-wallets search, stable wallet card grid, connecting detail view, QR view rendering, retry action, install/homepage row where available, and shared wallet icon rendering.
- Added modal accessibility behavior to the stateful modal controller: Escape close, backdrop close, focus trap, and focus restore.
- React `ConnectModal` now consumes `mergeWalletOptionsWithCatalog()` and forwards view/search/QR props to the shared UI renderer.
- Updated `Review/REOWN_UI_SPEC_FOR_TRON.md` with the Phase 2 icon/catalog implementation note, including the adapter-first icon rule and no-runtime-hotlink rule.
- Added UI tests for catalog merge/filtering, featured ordering, TRON-only badge language, all-wallets search, connecting detail, QR rendering, and the generated icon hook.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/browser typecheck`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm --filter @tron-wallet-kit/website build`
  - `pnpm --filter @tron-wallet-kit/browser build`
  - `pnpm --filter @tron-wallet-kit/examples build`
- Rebuilt and synced `examples/public/vendor/tron-wallet-kit.iife.js` and `.min.js`. Current minified vendor length is `3986515` bytes. VM IIFE smoke confirmed `TronWalletKit.mergeWalletOptionsWithCatalog`, `createWalletModal`, and featured order `tronlink,metamask,okx,tokenpocket,trust,walletconnect`. Active examples server `http://127.0.0.1:5174/` returned HTTP 200 for `/vendor/tron-wallet-kit.iife.min.js`.
- Remaining from the merged UI spec after Phase 2: populate real wallet icons via a fetch/generate script, visual QA screenshots for light/dark desktop/mobile, richer account panel balance/identity lifecycle, toast autodismiss/dismiss controller refinements, and eventual browser IIFE bundle split.

## 2026-07-04 WalletButton Baseline and React Example Update

- Re-read the updated `Review/REOWN_UI_SPEC_FOR_TRON.md`, especially section 4B for the Connect/Account button requirements.
- Added `WalletButtonViewModel` and `WalletButtonLabels` to `@tron-wallet-kit/ui`.
- Added shared `createWalletButtonHtml()` in `packages/ui/src/button.ts`. It now renders disconnected and connected button states with adapter icon/fallback icon, label, optional balance, chevron, pending transaction dot, size, and variant.
- Updated token-driven CSS in `packages/ui/src/styles.ts` for `.twk-connect-button`, `.twk-button-icon`, `.twk-button-label`, `.twk-button-balance`, `.twk-button-chevron`, and `.twk-button-pending`.
- Added React `WalletButton` in `packages/react/src/index.ts`; it consumes the same shared UI renderer and manager state.
- Updated `examples/react-basic/src/main.tsx` so `http://127.0.0.1:5174/react-basic/` uses `<WalletButton />` from `@tron-wallet-kit/react` instead of a local demo connect button.
- Removed the default modal subtitle "Choose a TRON wallet to continue." by setting the config default subtitle to an empty string and the modal label default to an empty string.
- Updated `createWalletKit()` so DOM `createWalletButton()` inherits the global `ui` theme config instead of resolving a separate theme default.
- Updated `Review/REOWN_UI_SPEC_FOR_TRON.md`, `Review/CODER_NOTES.md`, and `Review/UI_UX_DECISIONS.md` with the WalletButton baseline status and remaining account-panel-controller gap.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/browser typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/react test`
  - `pnpm --filter @tron-wallet-kit/examples build`
  - `pnpm --filter @tron-wallet-kit/ui build`
  - `pnpm --filter @tron-wallet-kit/client build`
  - `pnpm --filter @tron-wallet-kit/react build`
  - `pnpm --filter @tron-wallet-kit/browser build`
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm lint`
- Rebuilt and synced `examples/public/vendor/tron-wallet-kit.iife.js` and `.min.js`. Current local minified vendor length is `3990550` bytes. IIFE smoke confirmed `createWalletButtonHtml`, pending dot markup, and no legacy modal subtitle. Active examples server returned HTTP 200 for `/react-basic/` and `/vendor/tron-wallet-kit.iife.min.js`.
- Remaining from section 4B: connected WalletButton should open/toggle a real account-panel dropdown/modal controller; current baseline still opens the existing connect modal hook.

## 2026-07-05 Icon Fetch, React Account Panel Controller, and Lifecycle

- Added `scripts/fetch-wallet-icons.mjs` and root script `pnpm icons:wallets`.
- The icon script downloads official SVGs from `https://walletadapter.org/wallets/*.svg`, saves source files under `packages/ui/src/wallets/icons/`, and generates `packages/ui/src/wallets/icons.generated.ts` as data URI map for React/IIFE usage without runtime hotlinking.
- Ran `pnpm icons:wallets`; all 12 configured icons were fetched: TronLink, MetaMask, OKX, Bitget, Binance, TokenPocket, Gate, FoxWallet, Bybit, imToken, Tomo, and OneKey.
- Extended core `WalletAccount` with optional identity fields: `domain`, `displayName`, and `avatar`.
- Added opt-in client identity lifecycle:
  - `WalletClientIdentityConfig.cacheTtlMs`
  - cached `refreshIdentity()`
  - `refreshIdentity()` writes domain/displayName/avatar into the active session via `manager.setSession()`.
- Added opt-in client balance lifecycle:
  - `WalletClientBalanceConfig`
  - `TronBalanceResolver`
  - `refreshBalance()` normalizes string/number/session-balance resolver results and writes TRX balance into the active session.
- Upgraded React `WalletButton` connected behavior so clicking a connected button toggles a real account panel instead of opening the connect modal.
- The React account panel controller now uses shared `createAccountPanelHtml`, supports dropdown/modal mode, address QR generation, copy address feedback, disconnect, recent transactions, outside click close, Escape close, identity settle delay, connect-time balance refresh, and scheduled balance refresh after pending transactions.
- Added token-driven CSS for `.twk-button-panel` and `.twk-button-panel-overlay`; dropdown anchors under the button on desktop and becomes a bottom sheet on small screens.
- Saved visual QA screenshots:
  - `Review/screenshots/react-basic-light-modal.png`
  - `Review/screenshots/react-basic-dark-modal.png`
  - `Review/screenshots/react-basic-mobile-light-modal.png`
- Visual QA notes: legacy subtitle count was 0 in light and dark; mobile horizontal overflow was false. Console showed only Vite/React dev messages plus a likely favicon/static 404, not a runtime bundle failure.
- Per user request, browser/IIFE build was intentionally not run in this phase; React/example tests were prioritized for speed.
- Verification:
  - `pnpm icons:wallets`
  - `pnpm --filter @tron-wallet-kit/core typecheck`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/react test`
  - `pnpm --filter @tron-wallet-kit/examples build`
  - `pnpm lint`
- Remaining work: true connected account-panel screenshot with an actual wallet/mock connected runtime, account panel polish toward XRPL parity, full browser/IIFE rebuild later, and bundle splitting.

## 2026-07-05 React Basic Layout, Default Theme Config, and Official SVG Icons

- Updated `examples/react-basic` so the playground uses the kit font stack, starts on `themeName: "default"`, and exposes a few live configuration controls: theme name, button variant, connected account panel mode, show-balance toggle, and recent-transactions toggle.
- Reworked the React Basic screen into clearer sections: `Kit`, `Configuration`, `Tasks`, and `Log`. The Kit section now focuses on the real `<WalletButton />`, open/disconnect controls, session summary, and WalletConnect QR/URI when present.
- Added accessibility labels for the configuration controls so QA/browser automation and screen readers can target the controls reliably.
- Fixed the React example dev entry to reuse the existing React root across Vite hot reloads instead of calling `createRoot()` repeatedly.
- Updated `scripts/fetch-wallet-icons.mjs` to also fetch `WalletConnect.svg` and to generate local adapter icon constants:
  - `packages/adapters/tronlink/src/icon.generated.ts`
  - `packages/adapters/walletconnect/src/icon.generated.ts`
- Updated TronLink and WalletConnect adapters to use those generated SVG data URIs in metadata, replacing the earlier hand-drawn temporary icons.
- Ran `pnpm icons:wallets`; all configured wallet SVGs fetched successfully, including WalletConnect and TronLink.
- Browser QA on `http://127.0.0.1:5174/react-basic/` confirmed:
  - page title and sections render
  - default theme selected initially
  - kit font stack is applied
  - `Open modal` opens the connect modal
  - TronLink and WalletConnect modal entries use `data:image/svg+xml` generated icons
  - changing theme to `dark` updates `color-scheme: dark`
  - desktop and mobile DOM checks report no horizontal overflow
- Screenshot capture through the in-app browser timed out, so no new screenshot artifacts were committed in this session.
- Active examples server is available at `http://127.0.0.1:5174/react-basic/`.
- Verification:
  - `pnpm icons:wallets`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm lint`
- Historical note: Browser/IIFE build was intentionally skipped for this React-first pass per the prior direction; P9 later completed browser/IIFE parity.
- Remaining work: true connected wallet/manual QA with TronLink/WalletConnect, richer account panel visual parity with XRPL Wallet Kit, and later browser/IIFE rebuild after React UI stabilizes.

## 2026-07-05 Reown-style UI Spec Polish

- Continued UI implementation directly from `Review/REOWN_UI_SPEC_FOR_TRON.md`.
- Added `walletIconRadius` to `ThemeTokens` and CSS variables as `--twk-wallet-icon-radius`; wallet icons now use a shared icon radius token across modal rows, all-wallet cards, large detail icons, QR center logos, and wallet button icons.
- Updated UI font token to `Inter, "Inter var", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- Polished modal frame/header toward the measured Reown style:
  - modal width was initially moved toward the measured compact frame
  - title is `16px`
  - header divider removed
  - close/back controls are transparent by default with hover-only circular background
  - touch target remains stable at 40px
- Corrected featured wallet list to the TRON spec: exactly five rows before Search, ordered TronLink, OKX, Bitget, TokenPocket, WalletConnect. WalletConnect stays last; MetaMask and Trust remain searchable catalog entries but are not featured by default.
- Improved QR view:
  - Mobile/Webapp/Browser tabs
  - reserved QR container
  - skeleton placeholder while QR is unavailable
  - center wallet logo slot when QR is rendered
  - Copy link and Try again actions
  - install row when homepage exists
- Improved connecting/error view:
  - stable detail height
  - install row
  - retry action
  - red "Connection declined" state when an error exists
- Reworked account panel visual structure:
  - 118px deterministic avatar hero
  - display name/domain hero
  - address chip
  - balance pill
  - full-width Copy/Explorer/Disconnect actions
  - Explorer action uses the account explorer URL when available
  - QR and recent transaction slots remain stable
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/react test`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm lint`
  - HTTP smoke: `http://127.0.0.1:5174/react-basic/` returned 200
- Browser/IIFE build was not run in this React-first UI polish pass.
- Remaining work: visual screenshot QA after the browser checkpoint is stable, true connected-wallet QA with TronLink and WalletConnect, account-panel QR sub-view navigation, React account panel modal scroll lock/focus trap, and eventual browser/IIFE rebuild.

## 2026-07-05 Section 1B Fixed Frame and Typography Pass

- Re-read `Review/REOWN_UI_SPEC_FOR_TRON.md` section 1B and corrected the UI implementation to match the newer fixed-frame spec.
- Changed default `walletIconRadius` to `5px`, so `light`, `dark`, and inherited presets use the Reown-measured square-ish wallet logo shape.
- Wrapped connect-modal views in `.twk-body` and set the stable desktop frame to `width: min(400px, calc(100vw - 32px))` with `.twk-body { height: 480px; overflow: auto; }`.
- Added the mobile bottom-sheet body rule using `height: min(560px, calc(100dvh - 64px - env(safe-area-inset-top) - env(safe-area-inset-bottom)))`.
- Removed old per-view height pressure from wallet grid, no-wallets, and connecting/QR detail views; views now live inside the same fixed body height to avoid modal jumps.
- Unified modal detail titles around `.twk-title` (`16px/500`), danger title (`16px/600`), detail subtitle (`14px/400`), action (`14px/560`), and badge (`11px/600`).
- Added wallet icon skeleton markup for async availability checking while preserving the same icon slot dimensions.
- Updated `Review/REOWN_UI_SPEC_FOR_TRON.md` implementation notes so they no longer describe the superseded 356px/16px-radius pass as current.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/react test`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - HTTP smoke: `http://127.0.0.1:5174/react-basic/` returned 200
- Historical note: Browser/IIFE build was intentionally skipped for this React-first pass; P9 later completed browser/IIFE parity.
- Remaining work: screenshot polish for light/dark/mobile, true connected-wallet QA with TronLink/WalletConnect, account-panel QR sub-view navigation, React account panel modal scroll lock/focus trap, and eventual browser/IIFE rebuild.

## 2026-07-05 Section 1B/1C Review Correction

- Re-read the updated `Review/REOWN_UI_SPEC_FOR_TRON.md` after user confirmed the review is authoritative.
- Superseded the earlier fixed `.twk-body { height: 480px }` pass. Connect modal now stays `width: min(400px, calc(100vw - 32px))` but uses auto height for featured, connecting, error, QR, and account-style views.
- Only the all-wallets list is fixed/scrolling: `.twk-wallet-grid { height: 360px; overflow: auto; }`, with no-wallets using the same reserved height.
- Compact spacing now matches the review better: header min-height is `56px`, connecting/QR details no longer center inside a tall fixed body, and install rows use normal spacing instead of `margin-top:auto`.
- Removed the old `.twk-connecting-arc` and replaced it with a ring spinner around the large wallet icon via `.twk-connecting-ring`. Error state keeps the icon area stable and adds a danger dot.
- Added `downloadUrl` to core `WalletMetadata`, UI `WalletOptionViewModel`, adapter metadata, and catalog merge/enrich logic. Install rows now use `downloadUrl ?? homepage`.
- Updated the stateful connect modal to keep a `viewStack`; Back from a wallet selected inside all-wallets now returns to all-wallets instead of always returning to featured.
- Updated `Review/REOWN_UI_SPEC_FOR_TRON.md` implementation notes so the current implementation matches the reviewed spec.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/core typecheck`
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck`
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect typecheck`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/react test`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
- Historical note: Browser/IIFE build was intentionally skipped for this React-first pass; P9 later completed browser/IIFE parity.
- Remaining work: styled QR renderer with `qr-code-styling`, account panel `address-qr` sub-view, network badge, WalletInline, wallet grouping, QR light-mode toggle, richer transaction toast controller, inline status/error line, screenshot QA, and real-wallet QA.

## 2026-07-05 Spec Coverage Tracker Added

- User correctly pointed out that multiple sections of `Review/REOWN_UI_SPEC_FOR_TRON.md` were still omitted from implementation.
- Added `Review/REOWN_UI_SPEC_IMPLEMENTATION_TRACKER.md` as the working checklist for spec coverage.
- Tracker maps each spec area to `DONE`, `PARTIAL`, `TODO`, or `DEFER`, including 1B loading skeleton gaps, 1C styled QR, 4B account panel sub-view gaps, 4C missing controls, 4D navigation gaps, and browser/IIFE parity.
- Immediate next implementation order is now documented:
  - shared QR renderer with `qr-code-styling` + `qrcode` fallback
  - account panel `address-qr` sub-view
  - QR light-mode toggle and QR tab adjustment
  - inline status/error line
  - transaction toast controller behavior
  - network badge and WalletInline
  - wallet grouping/mini-icon stack
- Going forward, every UI/spec pass should update this tracker before calling the spec item complete.

## 2026-07-05 Spec Execution Discipline Added

- User asked to tighten discipline around `Review/REOWN_UI_SPEC_FOR_TRON.md` and stop completing one small item while letting other spec items drift.
- Added section `0. Execution Discipline / Sequential Plan` directly into `Review/REOWN_UI_SPEC_FOR_TRON.md`.
- The spec now has a phase board P0-P9:
  - P0 tracker/discipline
  - P1 modal Reown basics
  - P2 QR foundation
  - P3 account panel flow
  - P4 loading/skeleton completeness
  - P5 inline status + toast controller
  - P6 network badge + WalletInline
  - P7 wallet grouping/mini-icon stack
  - P8 theme/runtime polish
  - P9 QA parity
- P1 is explicitly marked `PARTIAL`; the open P1 items are compact header/body/footer spacing, QR tabs removal, anti-pattern CSS/host defense, link hover cleanup, and tests.
- Updated `Review/REOWN_UI_SPEC_IMPLEMENTATION_TRACKER.md` so it points back to the primary phase board and lists P1 completion before QR/account work.
- New rule: do not report a phase as complete unless status is updated in the spec, tracker, memory, and relevant tests/builds pass.

## 2026-07-05 P1 Modal Reown Basics Completed

- Completed P1 from `Review/REOWN_UI_SPEC_FOR_TRON.md` section `0. Execution Discipline / Sequential Plan`.
- Removed QR tabs from `createQrHtml()` and deleted the `.twk-qr-tabs` CSS block. Tests now assert QR markup does not contain tabs and the title appears before the QR slot.
- Compacted modal spacing per 1B(a2):
  - `.twk-header` now uses `min-height:44px`
  - `.twk-body` uses `padding: 8px 20px 12px`
  - `.twk-footer` uses 11px text and compact padding
  - featured wallet list gap is 8px
  - connecting/QR details use compact padding and reduced icon/title/subtitle/action/install spacing
- Added anti-pattern protections from 4E:
  - primary controls use `appearance:none`, `box-shadow:none`, `margin:0`, `transform:none`, stable min-height, and `-webkit-tap-highlight-color: transparent`
  - links/toast links keep `text-decoration:none` on hover/focus
  - hover remains background/color/border-only, with no hover shadow or layout transform
- Removed empty error placeholder height from connect modal; errors render only when present.
- Updated `Review/REOWN_UI_SPEC_FOR_TRON.md` P1 status to `DONE`, and updated `Review/REOWN_UI_SPEC_IMPLEMENTATION_TRACKER.md` to match.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/react test`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - HTTP smoke: `http://127.0.0.1:5174/react-basic/` returned 200
- Next phase: P2 QR foundation (`qr-code-styling`, shared `renderWalletQr()`, WalletConnect QR/copy/light toggle wiring).

## 2026-07-05 P2 QR Foundation Completed

- Completed P2 from `Review/REOWN_UI_SPEC_FOR_TRON.md` section `0. Execution Discipline / Sequential Plan`.
- Added `qr-code-styling` to `@tron-wallet-kit/ui`.
- Reworked `packages/ui/src/qr.ts`:
  - kept `createQrDataUrl()` as the `qrcode` fallback
  - added `renderWalletQr(target, value, options)`
  - `renderWalletQr()` dynamically imports `qr-code-styling`, renders styled SVG QR with rounded dots/corners and optional wallet logo, and falls back to `qrcode` data URL image on failure
  - supports light-mode QR via `options.light`
- Reworked stateful connect modal QR handling:
  - QR event now renders into `[data-twk-qr-code="true"]` using `renderWalletQr()`
  - Copy link still uses the exact stored `qrUri`
  - added `toggle-qr-light` action and `qrLight` view model state
  - kept `qrImageSrc` as a static/fallback path for React/static renderer usage
- Added QR slot CSS for `.twk-qr-code` and `.twk-qr-theme-action`, with stable dimensions, no layout shift, focus ring, and tap-highlight suppression.
- Updated React `ConnectModal` to forward `qrLight`.
- Updated UI tests to assert:
  - `renderWalletQr` is exported
  - QR target/toggle markup exists
  - QR tabs remain removed
  - QR title appears before the QR slot
- Updated `Review/REOWN_UI_SPEC_FOR_TRON.md` P2 status to `DONE`, and updated `Review/REOWN_UI_SPEC_IMPLEMENTATION_TRACKER.md`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/react test`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - HTTP smoke: `http://127.0.0.1:5174/react-basic/` returned 200
- Next phase: P3 account panel `address-qr` sub-view using the shared QR helper.

## 2026-07-06 P3 Account Panel Flow Completed

- Completed P3 from `Review/REOWN_UI_SPEC_FOR_TRON.md` section `0. Execution Discipline / Sequential Plan`.
- Added an account-panel `address-qr` sub-view:
  - account view opens address QR without closing the panel
  - Back returns to account view
  - Close/Escape/outside click closes the panel
  - full address chip wraps safely and Copy uses the same 1.4s `Copied` feedback pattern
- Added `createAddressQrPanelHtml()` in `@tron-wallet-kit/ui` and wired React `WalletButton` to render address QR through shared `renderWalletQr()`.
- Account panel modal mode now body-scroll-locks, traps Tab focus inside the panel, and restores focus when closed.
- Updated `Review/REOWN_UI_SPEC_FOR_TRON.md` and `Review/REOWN_UI_SPEC_IMPLEMENTATION_TRACKER.md` to mark P3/account QR/focus items done.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/react test`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
- Next phase: P4 loading/skeleton completeness.

## 2026-07-06 P4 Loading/Skeleton Completed

- Completed P4 from `Review/REOWN_UI_SPEC_FOR_TRON.md` section `0. Execution Discipline / Sequential Plan`.
- Added stable loading placeholders for wallet availability:
  - wallet icon skeleton
  - wallet name skeleton
  - badge skeleton with reserved width
- Added `identityLoading` and `balanceLoading` to `AccountPanelViewModel`.
- React `WalletButton` now marks identity/balance as loading while `refreshIdentity()` and `refreshBalance()` resolve, then settles skeletons even if a resolver returns no value.
- Account panel identity and balance render stable skeleton chips instead of relying on a temporary `-` value.
- Skeleton shimmer respects `prefers-reduced-motion`.
- Updated `Review/REOWN_UI_SPEC_FOR_TRON.md` and `Review/REOWN_UI_SPEC_IMPLEMENTATION_TRACKER.md` to mark P4/loading items done.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/react test`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
- Next phase: P5 inline status + toast controller.

## 2026-07-06 P5 Inline Status + Toast Controller Completed

- Completed P5 from `Review/REOWN_UI_SPEC_FOR_TRON.md` section `0. Execution Discipline / Sequential Plan`.
- Added `.twk-status` below featured/all-wallets list views so status/error text has reserved space and does not shift the modal.
- `.twk-status` uses `aria-live="polite"` and switches to `role="alert"` with danger tone when showing errors.
- Upgraded `createWalletToast()`:
  - submitted -> confirmed/failed transitions update the same toast by transaction hash/id
  - dismiss buttons remove individual toasts
  - non-pending toasts auto-dismiss using `toast.autoDismissMs`
  - timers are cleared on destroy
- Added tests for toast explorer link, dismiss action, `aria-live`, and pending spinner.
- Updated `Review/REOWN_UI_SPEC_FOR_TRON.md` and `Review/REOWN_UI_SPEC_IMPLEMENTATION_TRACKER.md` to mark P5 done.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/react test`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
- Next phase: P6 network badge + WalletInline.

## 2026-07-06 P6 Network Badge + WalletInline Completed

- Completed P6 from `Review/REOWN_UI_SPEC_FOR_TRON.md` section `0. Execution Discipline / Sequential Plan`.
- Added `networkName` and `networkType` to `ConnectModalViewModel`.
- Featured and all-wallets views render `.twk-network-badge` when network info is supplied.
- Added `createWalletInlineHtml()` and `createWalletInline()`:
  - no overlay
  - uses the same wallet list/search/connect/QR renderer as the modal
  - supports WalletConnect QR/light toggle/copy and all-wallets search
- Added `.twk-inline` and `.twk-network-badge` token-driven CSS.
- Added UI tests for inline picker markup and network badge.
- Repair note: parallel pnpm runs caused a Windows/OneDrive `node_modules` lock and partial dependency tree. Recovered by renaming the broken `node_modules`, running install from the machine pnpm, and deleting the backup with a long-path PowerShell remove. Avoid parallel pnpm commands in this repo.
- Verification:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/examples typecheck`
- Next phase note superseded: P7 wallet grouping / mini-icon stack was later removed by product decision; All Wallets remains flat.

## 2026-07-06 P7 Wallet Grouping Superseded

- Earlier P7 grouping work was superseded by the latest product decision.
- Current implementation keeps All Wallets as one flat searchable grid.
- `showGroup` view-model/config wiring and `.twk-wallet-groups` / mini-stack CSS have been removed.
- Extension/Mobile stays as metadata only through `platforms` and `data-twk-platforms`.
- Added/updated UI tests for flat behavior and absence of grouping markup.
- Verification:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/examples typecheck`
- Next phase: P8 theme/runtime polish.

## 2026-07-06 P8 Theme Runtime Completed

- Completed P8 from `Review/REOWN_UI_SPEC_FOR_TRON.md` section `0. Execution Discipline / Sequential Plan`.
- Added `setTheme(config)` to UI surface interfaces and implementations:
  - `WalletModal`
  - `WalletButton`
  - `WalletToast`
  - `WalletInline`
- Added `kit.setTheme(theme)` in `@tron-wallet-kit/client` to update modal/button/toast surfaces from one app-level entrypoint.
- Added `@tron-wallet-kit/ui` path alias in `packages/client/tsconfig.json` so client typecheck uses current UI source types.
- Self-host Inter Vietnamese subset decision: `DEFER` to release asset pass until approved font files and licensing/source notes are added. Current theme tokens keep Inter-first system stack.
- Verification:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/examples typecheck`
- Next phase: P9 QA parity completed below; remaining wallet QA requires manual TronLink/WalletConnect sessions.

## 2026-07-06 P9 QA Parity Completed

- Completed the automated P9 QA parity pass from `Review/REOWN_UI_SPEC_FOR_TRON.md`.
- Browser smoke ran against `http://127.0.0.1:5174/react-basic/` on port 5174.
- Saved clean visual QA screenshots:
  - `Review/screenshots/react-basic-p9-light.png`
  - `Review/screenshots/react-basic-p9-dark.png`
  - `Review/screenshots/react-basic-p9-mobile.png`
- Browser QA confirmed no legacy subtitle text, no horizontal overflow, visible featured wallet rows, visible mobile modal, and TRON-only badges/states (`NOT INSTALLED`, `QR CODE`, `TRON`).
- Reduced-motion support remains present through `prefers-reduced-motion` animation disabling in `packages/ui/src/styles.ts`.
- Browser/IIFE parity is no longer skipped: workspace build produced `packages/browser/dist/tron-wallet-kit.iife.js` and `packages/browser/dist/tron-wallet-kit.iife.min.js`.
- Verification:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd lint`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd build`
- Known remaining issues after P9:
  - Real TronLink extension QA requires an installed extension/manual approval flow.
  - WalletConnect mobile QR scan QA requires a real mobile wallet/manual device session.
  - Wallet icon/source license note is still needed before public release.
  - Pending connection cancel hook on Back/Close is still not implemented because adapter-level cancel support has not been defined.
- Dev server note: examples dev server remains available at `http://127.0.0.1:5174/react-basic/` for manual review.

## 2026-07-06 REOWN UI Spec Closure Audit

- Re-read `Review/REOWN_UI_SPEC_FOR_TRON.md` after P9 and added a `Spec Closure Audit 2026-07-06` table.
- The spec is now closed for automated React-first UI implementation: P0-P9 are complete.
- Carry-forward items are explicit and no longer hidden as phase work:
  - Real TronLink extension QA: `DEFER` to manual wallet session.
  - WalletConnect mobile QR scan QA: `DEFER` to real mobile wallet scan; plain QR fallback remains the rule if styled WC QR is unreliable.
  - Wallet icon brand/source licensing: `DEFER` to release checklist.
  - Account view inside connect modal: `DEFER`; current connected account UI remains owned by WalletButton account panel.
  - All-wallets scroll restoration, pending connection cancellation, reduced-motion view transitions, and IIFE bundle-size decision are `DEFER` release-hardening items.
- Updated `Review/REOWN_UI_SPEC_IMPLEMENTATION_TRACKER.md`:
  - Light/dark and typography notes now point to P9 screenshots.
  - Identity and balance lifecycle are marked `DONE` for implemented client/React/UI skeleton lifecycle; real data QA remains manual.
  - Icon license/source note is marked `DEFER` and tied to release checklist.
  - Scroll restoration, pending connection cancellation, and reduced-motion view transitions are marked `DEFER` carry-forward items instead of open P9 TODO/PARTIAL work.
- Updated `Review/RELEASE_CHECKLIST.md` with 2026-07-06 quality gate results and wallet icon licensing gate.

## 2026-07-06 Connecting/QR Panel Spec Correction

- Re-read the connecting panel and QR panel sections of `Review/REOWN_UI_SPEC_FOR_TRON.md` after visual feedback.
- Corrected QR panel markup/CSS toward the spec:
  - removed the extra body title from QR view
  - kept wallet name in the modal header only
  - enlarged QR reserve to `max-width: 340px` with `renderWalletQr(... width: 304)`
  - placed the single scan subtitle under the QR
  - kept Copy link disabled until a URI exists and Try again beside it
- Corrected connecting/error panel details:
  - large wallet icon has no border
  - error badge uses SVG instead of a text `x`
  - icon/title/subtitle/action spacing is tighter
- Added/updated UI tests so QR view no longer contains `.twk-view-title` and the scan subtitle appears after the QR block.
- Browser smoke saved `Review/screenshots/react-basic-qr-panel-polish.png`.
- Verification:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react test`

## 2026-07-06 Strict REOWN UI Code Audit Fixes

- Added `Review/REOWN_UI_SPEC_CODE_AUDIT.md` to track code/spec parity after the connecting/QR/network badge feedback.
- Fixed WalletConnect QR URI wiring end-to-end:
  - `ConnectOptions.onUri` added in core
  - modal and inline picker pass `onUri` into `manager.connect`
  - WalletConnect adapter now calls both configured and per-connect URI callbacks
- Browser smoke on `http://127.0.0.1:5174/react-basic/` saved `Review/screenshots/react-basic-qr-wiring-smoke.png`.
- Smoke result confirmed QR renders through `qr-code-styling` (`qrRenderer: "styled"`), SVG is present, skeleton is removed after URI arrives, and no visible `wc:` URI text is rendered in the modal.
- Fixed QR loading state so skeleton sits inside the full `.twk-qr-code` frame.
- Fixed network badge rule: mainnet no longer shows a badge by default; badge is for testnet/custom context.
- Adjusted connecting spinner geometry: 96px ring around 66px logo in a 104px wrapper so the ring does not press into the logo.
- Verification:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/core typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/core test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/adapter-walletconnect typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/adapter-walletconnect test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react test`

## 2026-07-06 QR Scan-Safe Default Correction

- Removed `.twk-qr-theme-action` and the QR theme toggle from connect QR and address QR.
- QR rendering is now always scan-safe by default:
  - QR foreground token defaults to black/dark.
  - QR background token defaults to white, including dark themes.
  - `renderWalletQr()` no longer uses the old `light` option.
- QR loading skeleton now remains inside the full QR frame and has a dedicated shimmer; reduced-motion disables the shimmer.
- Updated UI tests to assert:
  - no `.twk-qr-theme-action`
  - no `toggle-qr-light` / `toggle-address-qr-light`
  - dark theme QR tokens are black on white
- Browser smoke saved `Review/screenshots/react-basic-qr-dark-no-toggle.png`; result confirmed `themeActionCount: 0`, `qrRenderer: "styled"`, white QR background, dark QR color, and no visible `wc:` URI text.
- Verification:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`

## 2026-07-06 QR Active Wallet Routing Correction

- Fixed the QR panel label routing bug where WalletConnect QR could display TokenPocket because TokenPocket appears earlier in the catalog with `adapterId: "walletconnect"`.
- `packages/ui/src/modal.ts` now resolves QR events by preserving the selected/active wallet first, then exact wallet id (`walletconnect`), and only then adapter transport fallback.
- Added a UI regression test where TokenPocket appears before WalletConnect and the QR view must still render WalletConnect header/install CTA.
- Browser QA on `http://127.0.0.1:5174/react-basic/` confirmed clicking WalletConnect renders:
  - title `WalletConnect`
  - QR frame present
  - install CTA `Don't have WalletConnect?`
  - no visible TokenPocket label inside the QR panel
- Verification:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`

## 2026-07-06 Connecting Spinner Shape Correction

- Changed `.twk-connecting-ring` from a circular border spinner to a rounded-square SVG path around the wallet logo.
- Important correction: do not rotate the whole square. The first rounded-square attempt tilted the frame. Current implementation keeps the container/SVG upright and animates only `.twk-connecting-ring-accent` with `stroke-dashoffset`.
- SVG markup uses:
  - `.twk-connecting-ring-svg`
  - `.twk-connecting-ring-trail`
  - `.twk-connecting-ring-accent`
  - `pathLength="240"`
- Added UI regression coverage for the SVG rounded-square connecting ring and scoped the assertion so other pill UI can still use `999px`.
- Browser check loaded `http://127.0.0.1:5174/react-basic/` and confirmed:
  - app is not blank
  - no Vite/framework overlay
  - `.twk-connecting-ring-svg` CSS is present
  - `.twk-connecting-ring-accent` animates
  - `.twk-connecting-ring` itself does not rotate
  - `.twk-connecting-ring` does not use `border-radius: 999px`
- Follow-up polish from visual feedback:
  - removed the gray/trail border entirely
  - only the colored loading stroke remains
  - updated to match Reown's observed loading thumbnail footprint: SVG `viewBox="0 0 110 110"`, `width="110"`, `height="110"`
  - wrapper/ring CSS is now `110px`
  - logo remains 66px centered for a larger gap
  - SVG accent rect now uses `x=8`, `y=8`, `width=94`, `height=94`, `rx=36`
  - accent stroke uses `stroke-width: 3.5` and `stroke-dasharray: 78 162`
  - browser runtime check confirmed no `twk-connecting-ring-trail` CSS, `height/width: 110px`, and no rotating ring container
- Verification:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`

## 2026-07-06 Action Button Standardization

- Read the new `Review/REOWN_UI_SPEC_FOR_TRON.md` section `4F. Action button standard (button system)`.
- Added `packages/ui/src/actions.ts` with `createActionContentHtml(icon, label, state)` so action buttons consistently render:
  - `.twk-action-icon`
  - `.twk-action-label`
  - optional success/busy state
- Added SVG icon helpers in `packages/ui/src/icons.ts` for copy, link, logout, QR, send, and action spinner.
- Updated modal action buttons:
  - Retry = refresh icon + label
  - Copy link = link icon + stable `Copy link` label; after copy it renders check icon for ~1.4s
  - Get/install = external icon + label
- Updated account panel action buttons:
  - Copy/Copied = copy/check icon with success state
  - QR = QR icon
  - Explorer = external icon
  - Send = send icon
  - Disconnect = logout icon
- Updated CSS to match 4F:
  - action base uses surface, border token, wallet radius, min-height 44px
  - icon opacity `.58`; success icon uses `--twk-success` and opacity `1`
  - links remain `text-decoration:none`
  - `twk-action-spin` added and disabled under reduced-motion
- Added WalletButton connected trigger skeleton fields:
  - `identityLoading`
  - `balanceLoading`
  - `.twk-skeleton-name`
  - `.twk-skeleton-balance`
- React `WalletButton` now passes identity/balance loading states into the shared button HTML.
- Kept QR light toggle removed; the scan-safe QR decision supersedes the older 4F table row that mentioned light toggle.
- Verification:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react test`

## 2026-07-06 Adapter Platform Grouping And Tronweb3 Bridge

- Added `WalletPlatform` and `metadata.platforms` in core so adapters can explicitly declare `extension`, `mobile`, or both.
- Updated built-in adapter metadata:
  - TronLink: `platforms: ["extension", "mobile"]`
  - WalletConnect: `platforms: ["mobile"]`
- Updated UI wallet catalog with TRON-only platform grouping from the walletadapter.org wallet reference:
  - extension-capable first: TronLink, TokenPocket, Bitget, OKX, Trust, GateWallet, Bybit, Binance Web3 Wallet, Guarda, MetaMask, OneKey, Backpack
  - mobile/app-capable: TokenPocket, Trust, Binance Web3 Wallet, Bitget, OKX, Bybit, FoxWallet, imToken, Tomo, WalletConnect
  - hardware/manual: Ledger
- Popular wallets now keep their own wallet IDs. WalletConnect fallback is intentionally limited to TokenPocket, Binance, and Trust; OKX/Bitget/Bybit/etc. stay native/bridge-first because the wallet reference marks their WalletConnect signing support as missing or incomplete.
- All Wallets now renders explicit `Extension` and `Mobile` sections when not searching, and each card includes `data-twk-platforms` for future desktop/mobile optimization.
- Added wallet-card skeleton support for All Wallets cards with `readyState: "loading"`:
  - card keeps its stable 116px footprint
  - icon/name skeletons render inside the card
  - loading disabled opacity does not dim the skeleton
- Added optional `createTronWeb3AdapterBridge()` and `tronweb3Adapters` client config. This lets apps pass instances from `@tronweb3/tronwallet-adapter-*` packages and wrap them into TRON Wallet Kit's `WalletAdapter` contract without adding those packages as required dependencies.
- Browser smoke on `http://127.0.0.1:5174/react-basic/` confirmed:
  - All Wallets opens with `Extension` and `Mobile` sections
  - wallet cards render with extension-capable wallets first
  - sample cards include `data-twk-platforms`
  - OKX/Bitget keep native adapter ids when no native adapter is registered
  - no framework overlay
- Superseded follow-up: Backpack/Ledger no longer fall back to letter icons after the 2026-07-06 wallet icon sync.
- Verification:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/core typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/adapter-tronlink test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/adapter-walletconnect test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
  - Earlier browser runtime check confirmed `data-twk-platforms`; Extension/Mobile visual sections were later removed by product decision.

## 2026-07-06 Action Button Feedback Stabilization

- Fixed Try again feedback in connecting and QR panels:
  - clicking Retry sets `retryState="busy"` immediately
  - Retry icon changes from refresh to `.twk-action-spin`
  - reconnect starts after a 180ms delay so the button feedback is visible
  - busy state keeps the same `Try again` label and disables the button while active
- Stabilized copy button width:
  - QR copy keeps visible label `Copy link`; copied state only changes the icon to success/check for about 1.4s
  - account copy keeps visible label `Copy`; copied state only changes the icon to success/check
  - screen-reader live status can still announce `Copied`
- Added/updated UI regression coverage for busy Retry and stable copy labels.
- Browser smoke on `http://127.0.0.1:5174/react-basic/` confirmed:
  - page title `TRON Wallet Kit React Example`
  - no framework overlay
  - action icon/label/spinner/busy CSS present
  - known Lit dev-mode warning only
- Verification:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react test`

## 2026-07-06 Wallet Reference Correction

- Re-read `https://walletadapter.org/docs/guide/wallet-reference.html` and corrected the catalog toward extension-first desktop testing.
- Extension-capable wallets in catalog now include TokenPocket, OKX, Bitget, Trust, GateWallet, Bybit, Binance, Guarda, MetaMask, OneKey, and Backpack instead of treating several of them as mobile-only.
- Removed SafePal from the default TRON catalog because it is not part of the walletadapter.org TRON adapter reference list.
- Tightened WalletConnect fallback:
  - keep fallback for TokenPocket, Binance, and Trust
  - do not fallback OKX/Bybit/FoxWallet/imToken/Gate/Tomo through WalletConnect because the reference marks WalletConnect support as unavailable
  - do not fallback Bitget for MVP signing flows because the reference marks WalletConnect message/transaction signing as unsupported
- Updated tests so OKX and Bitget keep their native adapter IDs and TokenPocket is classified as `["extension", "mobile"]`.

## 2026-07-06 Extension Adapters And Flat All Wallets Correction

- Implemented the latest UX correction:
  - Search trigger is now a soft, continuous surface instead of a normal wallet row/card.
  - All Wallets is a single flat searchable grid; no Extension/Mobile sections and no mini-stack grouping.
  - Removed `showGroup` view-model/config wiring plus unused grouping markup/CSS from the UI package.
- Kept Extension/Mobile as metadata only:
  - wallet cards still expose `data-twk-platforms`
  - this preserves future PC/mobile optimization without duplicating wallets in the current All Wallets view
- Wired injected extension adapters in `@tron-wallet-kit/client` for:
  - TokenPocket
  - OKX Wallet
  - Bitget Wallet
  - Trust Wallet
  - GateWallet
  - Bybit Wallet
  - Binance Web3 Wallet
  - Guarda
  - OneKey
  - Backpack
- WalletConnect remains opt-in through `walletConnectProjectId`.
- Dual-mode wallets now prefer extension first, then use WalletConnect QR fallback for TokenPocket/Binance/Trust when the extension is unavailable and WalletConnect exists. The QR panel preserves the selected wallet identity instead of falling back visually to another catalog wallet.
- Tightened TronLink detection so TokenPocket-style globals do not make TronLink appear available or route into the wrong wallet.
- Updated review files:
  - `Review/REOWN_UI_SPEC_FOR_TRON.md`
  - `Review/REOWN_UI_SPEC_IMPLEMENTATION_TRACKER.md`
  - `Review/WALLET_TEST_MATRIX.md`
  - `Review/ADAPTER_BEHAVIOR_NOTES.md`
- Verification passed:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/adapter-tronlink test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react test`
- Browser smoke for this correction was attempted but not completed because the local Playwright Chromium binary is missing:
  - `C:\Users\PC\AppData\Local\ms-playwright\chromium_headless_shell-1200\chrome-headless-shell-win64\chrome-headless-shell.exe`
- Remaining issues:
  - real installed-extension QA is still needed for each injected provider path
  - Trust Wallet provider path may need adjustment after real-wallet QA because walletadapter.org documents generic `window.tron` / `window.tronLink` / `window.tronweb` paths, while the kit intentionally avoids generic paths to prevent wallet identity collisions
  - MetaMask TRON remains catalog/bridge-only because it uses MetaMask's TRON-specific multichain flow, not the generic injected TRON provider shape

## 2026-07-06 Wallet Icon Sync

- Updated `scripts/fetch-wallet-icons.mjs` so the generated icon set includes every current catalog wallet from `https://walletadapter.org/wallets/*.svg`.
- Newly added source SVGs:
  - `trust.svg` from `Trust.svg`
  - `guarda.svg` from `Guarda.svg`
  - `backpack.svg` from `Backpack.svg`
  - `ledger.svg` from `Ledger.svg`
- Re-ran `pnpm icons:wallets`; 17 wallet SVGs were fetched successfully with no skipped icons.
- Regenerated:
  - `packages/ui/src/wallets/icons.generated.ts`
  - `packages/ui/src/wallets/icons/*.svg`
  - adapter icon data URIs for TronLink and WalletConnect
- Added UI regression coverage to assert all catalog wallets have generated `data:image/svg+xml` icons.
- Updated review/spec notes:
  - `Review/REOWN_UI_SPEC_FOR_TRON.md`
  - `Review/REOWN_UI_SPEC_IMPLEMENTATION_TRACKER.md`
  - `Review/WALLET_TEST_MATRIX.md`
  - `Review/CODER_NOTES.md`
- Verification passed:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd icons:wallets`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`

## 2026-07-06 WalletConnect Icon Override And Real Connect Fixes

- Updated `scripts/fetch-wallet-icons.mjs` to prefer the local WalletConnect logo override at `icon/walletconnect.svg`.
- Re-ran `pnpm icons:wallets`; output confirms:
  - `copied walletconnect from C:\Users\PC\OneDrive\Develop\VibeCode\TronWalletKit\icon\walletconnect.svg`
  - all other catalog icons still fetch from `https://walletadapter.org/wallets/*.svg`
- Verified generated WalletConnect icon sync:
  - `packages/ui/src/wallets/icons/walletconnect.svg` matches `icon/walletconnect.svg`
  - `packages/adapters/walletconnect/src/icon.generated.ts` includes the local SVG data URI
- Fixed circular-provider connect failure:
  - `WalletManager.createSession()` no longer stores `ConnectResult.raw` into `session.metadata.raw`
  - `WalletManager.setSession()` writes a JSON-safe session copy to storage
  - circular refs/functions/symbols are stripped from persisted session metadata
  - bigint values in persisted metadata/balance raw are converted to strings
- Added core regression test for a circular raw provider object so successful connect is not converted into a misleading `Connection declined` error.
- Tightened TronLink detection to prevent TokenPocket-style generic globals from being accepted as TronLink:
  - accept `window.tron?.isTronLink`
  - accept `window.tronLink?.isTronLink`
  - reject legacy fallback when generic `window.tron` exists without a TronLink marker
- Added TronLink regression coverage for generic `window.tron + window.tronLink` without marker.
- Verification passed:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd icons:wallets`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/core typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/core test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/adapter-tronlink typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/adapter-tronlink test`
- Remaining real-wallet QA:
  - confirm the current TronLink extension exposes either `window.tron.isTronLink` or `window.tronLink.isTronLink`
  - if a current TronLink build has no marker, add a safer wallet-specific detection path instead of generic fallback

## 2026-07-06 React Basic Mainnet Modal Defaults

- Updated `examples/react-basic/src/main.tsx` for real-wallet testing on `http://127.0.0.1:5174/react-basic/`.
- Defaults changed:
  - account panel mode: `modal`
  - kit network: `mainnet`
  - WalletConnect network: `mainnet`
  - kit panel label: `TRON mainnet`
- Account panel select now lists `modal` before `dropdown` to match the default test path.
- Verification passed:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/examples typecheck`

## 2026-07-06 Label Descender Clipping Fix

- Fixed label/text clipping where letters with descenders such as `g` and `y` could be cut by `overflow: hidden` plus tight `line-height: 1`.
- Updated token-driven UI styles for text-bearing labels:
  - `.twk-action-label`
  - `.twk-button-label`
  - `.twk-button-balance`
  - `.twk-wallet-name`
  - `.twk-address`
  - `.twk-network-badge`
  - `.twk-pill`
  - `.twk-badge`
  - `.twk-domain`
  - `.twk-balance`
  - `.twk-toast-label`
  - `.twk-toast-hash`
- Kept icon/avatar/QR containers clipped because those are intentional image masks.
- Added UI CSS regression assertions for safer label line-height/padding.
- Verification passed:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/examples typecheck`

## 2026-07-06 Account Panel Network Label And Integration Direction

- Read `Review/REOWN_UI_SPEC_FOR_TRON.md` section 4G and code item #19 again before changing code.
- Account Panel no longer renders a network pill/label such as `TRON mainnet` or `Tronmainnet`.
  - Mainnet remains silent in account surfaces.
  - Network context stays in connect/inline picker surfaces, where testnet/custom labels are useful.
- Updated React wiring so `WalletButton` account panel and standalone `AccountPanel` no longer pass session `network.name` into account-panel rendering.
- Added regression coverage:
  - `createAccountPanelHtml()` ignores `networkName` for account panel markup.
  - React account panel render does not include a supplied `networkName`.
- Captured integration direction in `Review/REOWN_UI_SPEC_FOR_TRON.md` and `Review/REOWN_UI_SPEC_IMPLEMENTATION_TRACKER.md`:
  - Balance remains client-owned through `refreshBalance()`, with UI consuming normalized `balanceTrx` / loading states only.
  - Next hardening for balance should add default resolver order: wallet provider `tronWeb.trx.getBalance(address)` first, then configured RPC/TronGrid fallback; convert SUN to TRX in client.
  - TRX Domains remains client-owned through `trondomainjs` and should be mainnet-first/fail-silent by default, with testnet/custom support only through app-supplied resolver/config.
- Verification passed:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client test`
- Note: plain `pnpm --filter ...` from the bundled Codex runtime still trips `ERR_PNPM_IGNORED_BUILDS`; use the user npm pnpm shim path above for this repo until approve-builds is resolved.

## 2026-07-06 Account Panel 4G Layout Pass

- Re-read `Review/REOWN_UI_SPEC_FOR_TRON.md` Account Panel section 4G and corrected the panel structure instead of only tweaking colors.
- Account Panel changes:
  - Modal panel is `width: min(520px)` and `height: min(527px, dvh-48)` by default.
  - Modal panel switches to `height: min(650px, dvh-48)` when recent transactions are present.
  - Dropdown panel keeps the mini-modal behavior: no header, no overlay shadow, `width: min(360px, 100vw-32px)`.
  - Account body now owns scroll/padding instead of rendering recent tx as a detached list outside the account card.
  - Address row now has a muted address chip plus 40px QR icon button.
  - Recent transactions now render as `.twk-tx-section` with header/count/list row structure and are opt-in when empty.
  - Mainnet labels remain suppressed in Account Panel.
- React/example changes:
  - `WalletButton` now accepts `showRecentTransactions`.
  - `examples/react-basic` passes its existing Show recent transactions toggle into `WalletButton`.
- Browser QA:
  - Built `@tron-wallet-kit/ui`, generated a temporary localhost QA fixture, opened it through the in-app Browser, then deleted the temp file and stopped the temporary server.
  - Metrics confirmed modal `520x650` with recent tx, QR action `40x40`, dropdown header `display:none`, recent tx/actions visible inside panel, and no mainnet text.
- Verification passed:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/examples typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui build`

## 2026-07-06 TronLink Detection And Delayed TronWeb Fix

- Investigated the TronLink row showing `NOT INSTALLED` / connect failure around `tronWeb`.
- Browser check in Codex in-app browser found no injected TronLink globals there (`window.tron`, `window.tronLink`, `window.tronWeb` all null), so real extension QA still needs the user's browser.
- Reviewed current TronLink docs:
  - TIP-1193 path injects `window.tron` with `isTronLink`, `request`, and `tronWeb`, but `tronWeb` can be `false` until authorization.
  - Legacy path can expose `window.tronLink` and `window.tronWeb` as separate globals.
- Fixed `@tron-wallet-kit/adapter-tronlink`:
  - `connect()` now requests accounts before requiring `tronWeb`.
  - legacy provider detection now synthesizes a provider from `window.tronLink` + separate `window.tronWeb`.
  - generic non-marker `window.tron` is still rejected to avoid TokenPocket/other wallet overwrites.
- Added regression tests:
  - TIP-1193 provider where `tronWeb` becomes available only after account authorization.
  - legacy `window.tronLink` plus global `window.tronWeb` fallback.
- Verification passed:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/adapter-tronlink typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/adapter-tronlink test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/examples typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/adapter-tronlink build`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client build`

## 2026-07-06 TronWallet Adapter Pattern Alignment For TronLink

- Reviewed `tronweb3/tronwallet-adapter` TronLink and abstract adapter structure.
- Adopted the useful TronLink discovery pattern without importing multichain/EVM assumptions:
  - TronLink availability is now asynchronous.
  - `isAvailable()` waits briefly for provider injection before returning `false`, matching the upstream `Loading -> Found/NotFound` model.
  - `connect()` also waits for provider discovery, reducing races when the user clicks while the extension is still injecting.
  - Default wait is conservative (`1200ms`, `100ms` interval) and configurable through `TronLinkAdapterOptions`.
- React `ConnectModal` wrapper now runs the same availability lifecycle as the DOM modal:
  - initial adapter state is `CHECKING` when `isAvailable` exists.
  - resolved availability updates to `INSTALLED` or `NOT INSTALLED`.
- Added TronLink regression coverage for delayed provider injection.
- Still intentionally deferred:
  - full core-level `readyState/state/connecting` event model
  - `accountsChanged` / `chainChanged` listener cleanup
  - TronLink mobile deeplink options

## 2026-07-06 TronLink Legacy Detection With Other Extensions Installed

- Re-read `Review/REOWN_UI_SPEC_FOR_TRON.md` sections 4D, 4G #2/#4, and code item #19 while investigating the real UI screenshot where TronLink rendered `NOT INSTALLED` although another TRON extension was detected.
- Fixed `@tron-wallet-kit/adapter-tronlink` discovery rules:
  - accept explicit TIP-1193 TronLink only when `window.tron.isTronLink` is present
  - accept explicit legacy TronLink when `window.tronLink.isTronLink` is present
  - accept legacy TronLink shape when `window.tronLink.request()` exists and either `window.tronLink.tronWeb` or separate global `window.tronWeb` has a usable `trx` object
  - do not treat nested non-TronLink providers such as `tokenpocket.tron`, `okxwallet.tronLink`, `bybitWallet.tronLink`, or similar wallet-specific paths as TronLink
- Important nuance: a generic `window.tron` without `isTronLink` still must not become TronLink by itself, but it also must not block a real separate legacy `window.tronLink + window.tronWeb` pair. This prevents OKX/TokenPocket identity collisions while allowing older TronLink injection.
- Added regression coverage:
  - legacy TronLink remains available when another TRON wallet such as OKX is installed
  - TokenPocket-style nested globals are rejected when they are the same provider object
  - generic `window.tron` without a real `window.tronWeb` fallback is rejected
- Verification passed with direct local binaries because bundled-runtime `pnpm` still triggers `ERR_PNPM_IGNORED_BUILDS` before scripts run:
  - `packages/adapters/tronlink> ..\..\..\node_modules\.bin\tsc.CMD --noEmit`
  - `packages/adapters/tronlink> ..\..\..\node_modules\.bin\vitest.CMD run`
  - `packages/adapters/tronlink> ..\..\..\node_modules\.bin\tsup.CMD src/index.ts --format esm,cjs --dts --sourcemap --clean`

## 2026-07-06 Account Panel 4D/4G Discipline Pass

- Re-read the synced spec items in `Review/REOWN_UI_SPEC_FOR_TRON.md`: section 4D, section 4G #2, section 4G #4, and code item #19.
- Tightened Account Panel toward the current spec:
  - default title is now `Connected`
  - hero avatar fallback no longer renders a letter/glyph; it uses the deterministic gradient with a soft center spot
  - account name only renders when identity/domain exists; no fallback address line in the hero
  - address, balance, and QR are grouped in a single `.twk-account-meta-pill`
  - missing balance is hidden instead of rendering `-`
  - Explorer action is hidden by default unless explicitly enabled
  - address QR trigger stays inside the meta pill as a transparent 40px icon button
- Tightened Recent Transactions:
  - account view shows only the top 3 transactions
  - header is no longer a toggle button
  - `View` link appears only when there are more than 3 transactions
  - `View` opens a real `tx-history` sub-view from React `WalletButton`
  - tx-history view has Back/Close and an internally scrollable list
  - transaction rows can link to Tronscan and pending rows include a pulse ring
- Added/updated regression coverage for the above:
  - no fallback account name without TRX Domain/displayName
  - no missing-balance dash
  - Explorer hidden by default
  - top-3 recent tx in account view plus full tx-history sub-view
  - token-driven CSS still rejects hardcoded `#` and `rgba(`
- Verification passed with direct local binaries:
  - `packages/ui> ..\..\node_modules\.bin\tsc.CMD --noEmit`
  - `packages/react> ..\..\node_modules\.bin\tsc.CMD --noEmit`
  - `packages/ui> ..\..\node_modules\.bin\vitest.CMD run`
  - `packages/react> ..\..\node_modules\.bin\vitest.CMD run`
  - `packages/ui> ..\..\node_modules\.bin\tsup.CMD src/index.ts --format esm,cjs --dts --sourcemap --clean`
  - `packages/react> ..\..\node_modules\.bin\tsup.CMD src/index.ts --format esm,cjs --dts --sourcemap --clean`
  - `examples> ..\node_modules\.bin\tsc.CMD --noEmit`

## 2026-07-06 Tronwallet Adapter Bridge Package Phase 1

- Implemented `Review/TRONWALLET_ADAPTER_BRIDGE_SPEC.md` phase 1.
- Core changes:
  - `ConnectOptions` now has `onAccountChanged`, `onNetworkChanged`, and `onDisconnect`.
  - `WalletManager.connect()` injects callbacks into adapters, updates the active session on account/network drift, emits `accountChanged` / `networkChanged`, and routes adapter disconnect events through `manager.disconnect()`.
- New package:
  - `packages/adapters/tronwallet-bridge`
  - package name `@tron-wallet-kit/adapter-tronwallet-bridge`
  - exports `createTronwalletBridgeAdapter()`, `mapChainToNetwork()`, and normalization helpers/types.
  - bridge accepts runtime `@tronweb3/tronwallet-adapter`-style instances; it does not import concrete wallet adapters.
  - supports metadata/capability mapping, readyState, connect/restore, event forwarding/cleanup, signMessage, signTransaction, and submitTransaction by signing then broadcasting through app-provided `tronWeb.trx.sendRawTransaction`.
- Client changes:
  - Existing `createTronWeb3AdapterBridge()` remains for compatibility but now delegates to the new package.
  - `tronweb3Adapters` config now supports a `tronWeb` option for bridge broadcast.
  - Path aliases were added for client downstream packages (`react`, `browser`, `next`, `examples`, tests).
- Dependency note:
  - `@tronweb3/tronwallet-abstract-adapter` and `tronweb` are optional peer deps for the bridge package.
  - Concrete wallet adapter packages remain app-owned and should be passed as runtime instances.
  - Ran `pnpm install --ignore-scripts --config.confirmModulesPurge=false` after an interrupted install removed `.bin`; workspace links and lockfile were restored.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/core typecheck`
  - `pnpm --filter @tron-wallet-kit/adapter-tronwallet-bridge typecheck`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/browser typecheck`
  - `pnpm --filter @tron-wallet-kit/next typecheck`
  - `pnpm --filter @tron-wallet-kit/core test`
  - `pnpm --filter @tron-wallet-kit/adapter-tronwallet-bridge test`
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/react test`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/core build`
  - `pnpm --filter @tron-wallet-kit/adapter-tronwallet-bridge build`
  - `pnpm --filter @tron-wallet-kit/client build`
  - `pnpm --filter @tron-wallet-kit/browser build`
  - `pnpm --filter @tron-wallet-kit/react build`
- Still pending:
  - Real QA with `@tronweb3` OKX, Bitget, TokenPocket, Trust, and MetaMask-TRON instances.
  - Lazy import factories for concrete wallet packages.
  - Docs examples showing app-side install/new adapter instance/pass into `tronweb3Adapters`.

## 2026-07-06 Prominent Tronwallet Adapter Wiring Phase

- Implemented the next step from `Review/TRONWALLET_ADAPTER_BRIDGE_SPEC.md`: default client wiring now registers prominent wallet packages through lazy bridge adapters.
- Added lazy bridge support:
  - `createLazyTronwalletBridgeAdapter()` in `@tron-wallet-kit/adapter-tronwallet-bridge`
  - stable metadata before package load, so UI can render rows without importing wallet SDKs immediately
  - package import happens on `isAvailable()`, `connect()`, restore, or sign/submit calls
  - import failures mark the wallet unavailable and connect maps to a normalized kit error
- Default client now wires these prominent wallets through official `@tronweb3` packages:
  - TokenPocket via `@tronweb3/tronwallet-adapter-tokenpocket`
  - OKX Wallet via `@tronweb3/tronwallet-adapter-okxwallet`
  - Bitget Wallet via `@tronweb3/tronwallet-adapter-bitkeep`
  - Trust Wallet via `@tronweb3/tronwallet-adapter-trust`
  - MetaMask via `@tronweb3/tronwallet-adapter-metamask-tron`
- Removed the handwritten injected defaults for TokenPocket, OKX, Bitget, and Trust to avoid identity/provider collisions. The remaining lower-priority injected fallback wallets stay in place for now: Gate, Bybit, Binance Web3 Wallet, Guarda, OneKey, and Backpack.
- Added MetaMask to default wallet registration. MetaMask uses bridge `signMessageMode: "messageObject"` because its upstream adapter receives `{ message }` instead of a plain string.
- Dependency note:
  - MetaMask was later corrected to `@tronweb3/tronwallet-adapter-metamask-tron`; do not use the EVM-style `@tronweb3/tronwallet-adapter-metamask` package for this kit.
  - Installing the optional wallet adapters pulled in a larger dependency tree; browser IIFE still builds at roughly the previous size class.
- Verification passed:
  - `pnpm install --ignore-scripts --config.confirmModulesPurge=false`
  - `pnpm --filter @tron-wallet-kit/adapter-tronwallet-bridge typecheck`
  - `pnpm --filter @tron-wallet-kit/adapter-tronwallet-bridge test`
  - `pnpm --filter @tron-wallet-kit/adapter-tronwallet-bridge build`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/client build`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/react test`
  - `pnpm --filter @tron-wallet-kit/react build`
  - `pnpm --filter @tron-wallet-kit/browser typecheck`
  - `pnpm --filter @tron-wallet-kit/browser build`
  - `pnpm --filter @tron-wallet-kit/ui test`
- Still pending:
  - Real extension QA on an installed browser environment for TronLink, OKX, TokenPocket, Bitget/BitKeep, Trust, and MetaMask TRON.
  - Decide whether the optional upstream packages should stay under `@tron-wallet-kit/client` or move to a separate preset package before publishing.
  - Add docs showing the default prominent-wallet behavior and how advanced apps pass `tronweb3Bridge.tronWeb` for broadcast.

## 2026-07-06 Prominent Wallet Installed Badge Fix

- Investigated the real upstream adapter source for TokenPocket, OKX Wallet, and Bitget Wallet after UI QA showed these rows as QR/Not Installed while extensions were present.
- Findings:
  - OKX upstream detects `window.okxwallet.tronLink`.
  - TokenPocket upstream waits for TIP-6963 on desktop and may miss or delay installed state even when `window.tokenpocket` is present.
  - Bitget upstream support check uses `window.tronLink && window.isBitKeep`, while its update path reads `window.bitkeep`, so extensions exposing only `window.bitkeep...` can be missed.
- Client fix:
  - default prominent bridge adapters now have wallet-specific injected compatibility fallback for TokenPocket, OKX, and Bitget.
  - fallback detection uses only wallet-specific paths:
    - `tokenpocket.tron`
    - `okxwallet.tronLink`
    - `bitkeep.tronLink`, then `bitkeep.tron`
  - the fallback is wrapped behind the same wallet ID/metadata, so UI badge and connect target remain stable.
  - this preserves the lazy upstream bridge as the primary architecture while avoiding false Not Installed states from upstream detection mismatches.
- Regression added:
  - default client reports these three wallets available when their wallet-specific globals are present.
  - OKX and Bitget connect through their own fallback providers and return the expected address, preventing cross-wallet drift.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/client build`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/react test`
  - `pnpm --filter @tron-wallet-kit/browser typecheck`
  - `pnpm --filter @tron-wallet-kit/browser build`
  - `pnpm --filter @tron-wallet-kit/ui test`
- Still pending:
  - Confirm visually in the browser with the user's installed extensions; this environment cannot see those extension globals directly.

## 2026-07-06 WalletConnect QR And TokenPocket/TronLink Drift Fix

- Fixed WalletConnect QR panel copy:
  - the QR view no longer renders `Don't have WalletConnect? Get` when the active wallet is the generic `walletconnect` adapter.
  - wallet-specific QR fallback rows can still render their own install CTA.
- Tightened TronLink legacy detection again after QA showed TokenPocket installation could make TronLink connect to the wrong provider:
  - `window.tron.isTronLink` and `window.tronLink.isTronLink` are still accepted.
  - top-level legacy `window.tronLink` without a TronLink marker is rejected when it is linked to TokenPocket globals.
  - unmarked legacy TronLink is no longer accepted while known non-TronLink wallet globals are present; this avoids unsafe identity drift.
- Improved MetaMask availability:
  - lazy bridge adapters can now wait briefly for an upstream adapter to leave `readyState: "Loading"` via `readyStateChanged`.
  - default MetaMask wiring uses a 3200ms availability wait to match the upstream `ethereum#initialized` detection window.
- Regression added/updated:
  - TronLink tests cover TokenPocket-linked top-level `tronLink` rejection.
  - TronLink coexistence test now requires an explicit TronLink marker when other wallet globals exist.
  - Bridge tests cover lazy `readyStateChanged` availability wait.
  - UI test now asserts WalletConnect QR does not show the install CTA.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck`
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test`
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink build`
  - `pnpm --filter @tron-wallet-kit/adapter-tronwallet-bridge typecheck`
  - `pnpm --filter @tron-wallet-kit/adapter-tronwallet-bridge test`
  - `pnpm --filter @tron-wallet-kit/adapter-tronwallet-bridge build`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/client build`
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/ui build`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/react test`
  - `pnpm --filter @tron-wallet-kit/browser typecheck`
  - `pnpm --filter @tron-wallet-kit/browser build`
- Still pending:
  - Real browser QA on the user's extension set for TokenPocket + TronLink installed together.
  - MetaMask still needs real connect/sign QA because upstream package is EVM-style and deprecated on npm.

## 2026-07-06 TokenPocket Stronger TronLink Guard And MetaMask Probe

- Follow-up QA still showed TokenPocket could make the TronLink row route to TokenPocket.
- Tightened TronLink detection again:
  - top-level `window.tron` is rejected if it is the same object as any known non-TronLink wallet provider path.
  - top-level `window.tron` is also rejected if it shares `tronWeb` with `window.tokenpocket`.
  - this rejection applies even when the provider has `isTronLink: true`, because TokenPocket-style providers can mimic the TronLink marker.
  - legacy `window.tronLink.isTronLink` is still accepted only when it is not linked to TokenPocket or another known wallet.
- Improved MetaMask installed state:
  - default MetaMask config now has an availability probe that checks `window.ethereum.isMetaMask` and `window.ethereum.providers[].isMetaMask`.
  - the probe only affects installed-state detection; actual connect/sign still goes through the upstream MetaMask adapter.
- Regression added:
  - TokenPocket-linked `window.tron` with `isTronLink: true` must not make TronLink available.
  - MetaMask provider-array detection marks the MetaMask adapter available.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck`
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test`
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink build`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/client build`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm --filter @tron-wallet-kit/browser build`
- Still pending:
  - If TokenPocket still hijacks TronLink after this, capture actual `window.tron`, `window.tronLink`, and `window.tokenpocket` shape from the browser console so the guard can match the real injection shape exactly.

## 2026-07-06 Compact Error UI And Vite Adapter Prebundle

- Fixed modal error rendering after QA showed MetaMask dynamic-import errors overflowing the panel:
  - modal now normalizes connect errors before rendering.
  - dynamic import failures render as `<Wallet> could not be loaded. Refresh the page and try again.`
  - unavailable/not-found errors render as `<Wallet> is not available.`
  - long unknown errors are compacted to 140 characters.
  - detail subtitles now wrap within a fixed max width using `overflow-wrap: anywhere`.
- Fixed token-driven CSS regression:
  - removed a lingering `rgba(...)` border color from wallet rows/cards and replaced it with `color-mix(... var(--twk-border) ...)`.
- Improved examples Vite dev stability:
  - added `optimizeDeps.include` for the five upstream wallet adapter packages.
  - added an alias for `@tron-wallet-kit/adapter-tronwallet-bridge` to the source package in examples.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/adapter-tronwallet-bridge typecheck`
  - `pnpm --filter @tron-wallet-kit/adapter-tronwallet-bridge test`
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/ui build`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/browser build`
- Still pending:
  - Restart the examples dev server so Vite rebuilds optimized dependencies. If MetaMask still fails after restart, inspect the browser network/console error for the optimized adapter chunk.

## 2026-07-06 MetaMask TRON Adapter And TronLink Ready Detection

- Corrected MetaMask wiring after QA showed the wallet was using the EVM flow:
  - replaced optional dependency `@tronweb3/tronwallet-adapter-metamask` with `@tronweb3/tronwallet-adapter-metamask-tron`.
  - updated the default client dynamic import to `@tronweb3/tronwallet-adapter-metamask-tron`.
  - updated examples Vite `optimizeDeps.include` to prebundle the TRON MetaMask adapter package.
  - refreshed `pnpm-lock.yaml`.
- Tightened TronLink installed-state behavior without reopening TokenPocket drift:
  - default TronLink provider wait now matches upstream more closely at 5000ms.
  - legacy TronLink is accepted when `window.tronLink.ready`, `window.tronLink.tronWeb.ready`, or `window.tronWeb.ready` is true.
  - TokenPocket-linked object/tronWeb checks still run before accepting the provider.
- Regression added:
  - ready legacy TronLink remains available even when another TRON wallet global is present.
- Verification passed:
  - `pnpm install`
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test`
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink build`
  - `pnpm --filter @tron-wallet-kit/client build`
  - `pnpm --filter @tron-wallet-kit/browser build`
- Still pending:
  - Examples dev server was restarted on `http://127.0.0.1:5174/react-basic/` with `--force`; real extension QA for TronLink + TokenPocket + MetaMask together is still pending.
  - MetaMask TRON upstream caveat from docs still applies: only wallet imported by mnemonic can be used on TRON network.

## 2026-07-06 TronLink TIP-6963 Discovery

- Read upstream TronLink and TokenPocket adapters:
  - TronLink desktop discovery requests TIP-6963 providers before falling back to legacy `window.tron` / `window.tronLink`.
  - TokenPocket detection is based on `window.tokenpocket`, with mobile/browser support differences documented upstream.
- Fixed local TronLink adapter missing desktop TIP-6963 discovery:
  - added `TIP6963:requestProvider` / `TIP6963:announceProvider` handling.
  - accepts announced providers only when `info.name === "TronLink"` and provider has `isTronLink === true` plus `request()`.
  - legacy detection remains as fallback after the configured timeout.
  - existing TokenPocket-linked provider rejection remains in the legacy path.
- Regression added:
  - TronLink is available and connectable when only a TIP-6963 TronLink provider is announced and no legacy globals exist.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck`
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink build`
  - `pnpm --filter @tron-wallet-kit/client build`
  - `pnpm --filter @tron-wallet-kit/browser build`
- Still pending:
  - Real browser QA with installed TronLink and TokenPocket together. This should now allow TronLink discovery even when legacy globals are polluted by TokenPocket.

## 2026-07-06 Wallet Metadata Icons For Connected Button

- Fixed connected WalletButton missing wallet icons for bridged/injected wallets:
  - UI now exports `getTronWalletCatalogIcon(walletId)` from the wallet catalog.
  - default client bridge metadata now includes catalog icons for TokenPocket, OKX, Bitget, Trust, and MetaMask before lazy upstream package load.
  - default injected wallet metadata now includes catalog icons for Gate, Bybit, Binance Web3 Wallet, Guarda, OneKey, and Backpack.
  - TronLink and WalletConnect continue to provide icons from their adapter packages.
- Regression added:
  - default client wallets, including WalletConnect when configured, must expose `metadata.icon` as an SVG data URI.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/ui build`
  - `pnpm --filter @tron-wallet-kit/client build`
  - `pnpm --filter @tron-wallet-kit/browser build`
- Still pending:
  - Visual QA after reconnecting a real wallet to confirm the connected button shows the wallet logo instead of the generic icon.

## 2026-07-06 Phase 2 Wallet Bridge Expansion

- Added optional upstream adapter packages to `@tron-wallet-kit/client`:
  - `@tronweb3/tronwallet-adapter-bybit`
  - `@tronweb3/tronwallet-adapter-gatewallet`
  - `@tronweb3/tronwallet-adapter-binance`
  - `@tronweb3/tronwallet-adapter-guarda`
  - `@tronweb3/tronwallet-adapter-onekey`
  - `@tronweb3/tronwallet-adapter-backpack`
  - `@tronweb3/tronwallet-adapter-imtoken`
  - `@tronweb3/tronwallet-adapter-foxwallet`
- Default client bridge wiring now includes:
  - Gate Wallet, FoxWallet, Bybit Wallet, imToken, Binance Web3 Wallet, Guarda, OneKey, and Backpack.
- Extension wallets keep narrow injected fallbacks where safe:
  - Gate, Bybit, Binance, Guarda, OneKey, Backpack.
- FoxWallet and imToken are bridge-only for this pass because they need real mobile/app QA.
- Default wallet order now includes `foxwallet` and `imtoken`.
- Examples Vite config prebundles the new upstream adapter packages to reduce dev-server dynamic import failures.
- Regression added:
  - default wallet list includes the new phase 2 wallets.
  - second phase fallback detection marks Gate, Bybit, Binance, and OneKey available and connects to the expected provider.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm --filter @tron-wallet-kit/client build`
  - `pnpm --filter @tron-wallet-kit/browser build`
  - `pnpm --filter @tron-wallet-kit/ui test`
- Packaging note:
  - browser IIFE minified bundle increased to about 5.49 MB after adding the phase 2 upstream packages.
  - Split browser/adapter bundles remain necessary before public release.
- Still pending:
  - Real extension/mobile QA for every phase 2 wallet.
  - Ledger hardware adapter wiring remains out of this batch.

## 2026-07-06 Wallet Platform Audit and TRX Balance Resolver

- Rechecked `walletadapter.org` wallet reference and upstream `tronweb3/tronwallet-adapter` source for Trust/Fox platform assumptions.
- Trust Wallet should remain extension-capable on PC. Upstream docs use `window.trustwallet.tronLink.tronWeb` for TRON actions, with extension/global `window.tronWeb` as a companion path.
- FoxWallet should remain app/mobile-only in our catalog/default wiring for now. The upstream FoxWallet adapter explicitly returns `NotFound` outside mobile browsers; it should not be treated as an extension just because it has a catalog icon.
- Added `createDefaultTrxBalanceResolver()` in `@tron-wallet-kit/client`:
  - enabled by default unless `balance.enabled === false`
  - uses wallet-id-specific `tronWeb.trx.getBalance(address)` paths
  - normalizes SUN into formatted TRX strings
  - supports mapped paths for TronLink, TokenPocket, OKX, Bitget, Trust, GateWallet, FoxWallet, Bybit, imToken, Binance, Guarda, OneKey, and Backpack.
- Added regression tests for:
  - Trust Wallet balance reading from `trustwallet.tronLink.tronWeb`
  - FoxWallet balance reading from `foxwallet.tronLink.tronWeb`
  - avoiding accidental fallback to unrelated generic `tronWeb` in the Trust test.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/client build`
- Still pending:
  - Real wallet QA for balance display, especially extension wallets with different provider injection timing.
  - MetaMask TRON balance path remains unmapped until the TRON-specific adapter exposes a stable TRON balance provider.

## 2026-07-07 Bitget and Guarda Icon Overrides

- Synced the new local wallet icons from `icon/bitget.svg` and `icon/guarda.svg` into the UI wallet icon set.
- Updated `scripts/fetch-wallet-icons.mjs` so Bitget and Guarda are local overrides alongside WalletConnect. Future `pnpm icons:wallets` runs will preserve the project-approved icons instead of refetching those two from `walletadapter.org`.
- Regenerated `packages/ui/src/wallets/icons.generated.ts` and the SVG files under `packages/ui/src/wallets/icons/`.
- Updated the stale UI theme test expectation from `walletIconRadius: 5px` to the current source token `7px`; no visual token source changed in this step.
- Verification passed:
  - `pnpm icons:wallets`
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/client test`

## 2026-07-07 Phase 2 Extension Wallet QA Pass

- Ran rendered QA on `http://127.0.0.1:5174/react-basic/` with the in-app browser.
- Flow checked: React basic page loads -> open wallet modal -> All Wallets -> search Guarda.
- Browser QA results:
  - Page title: `TRON Wallet Kit React Example`.
  - Console warnings/errors: none captured during modal, All Wallets, or Guarda search.
  - All Wallets rendered 17 wallet cards with stable card dimensions around `112x116`.
  - Bitget and Guarda icons render as `data:image/svg+xml` from the generated icon map; Bitget uses the new `512x512` local override and Guarda uses the new local shield icon.
  - Search input filters to Guarda correctly and keeps the card/icon visible.
  - On this machine, extension-native wallets are unavailable because the relevant browser extensions are not installed in the in-app browser profile.
- Observed status model:
  - TokenPocket, Trust, Binance, and WalletConnect show QR-capable routes through WalletConnect fallback where configured.
  - OKX, Bitget, Gate, Bybit, Guarda, Backpack, OneKey, MetaMask, TronLink show unavailable without their installed extension/provider.
  - FoxWallet, imToken, and Tomo remain mobile/app-oriented in the catalog.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/client test`
- Still pending:
  - Real extension QA for Trust, OKX, Bitget, Gate, Bybit, Guarda, Backpack, OneKey, Binance, MetaMask TRON, and TronLink in a browser profile where each extension is actually installed.
  - Real connect/sign/balance tests must be done with wallet extensions because the current in-app browser only proves unavailable/QR/UI states.

## 2026-07-07 Trust Wallet vs TronLink Collision Fix

- Fixed a provider detection collision where Trust Wallet globals could be treated as TronLink, similar to the earlier TokenPocket collision.
- Updated `@tron-wallet-kit/adapter-tronlink` detection:
  - added `trustwallet.tron` and `trustwallet.tronLink` to known non-TronLink provider paths.
  - generalized shared `tronWeb` collision detection across known wallet roots instead of only TokenPocket.
  - a provider marked `isTronLink: true` is still rejected if it is linked to Trust Wallet or another known non-TronLink wallet root.
- Added regression tests for Trust-linked legacy `window.tronLink` and Trust-linked TIP-1193 `window.tron`.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test`
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck`
  - `pnpm --filter @tron-wallet-kit/client test`
- Still pending:
  - Real browser QA with Trust Wallet extension installed together with TronLink extension to confirm actual injection order matches the mocked collision cases.

## 2026-07-07 Adapter Flow Cancellation and Upstream Injection Audit

- Fixed the Trust row routing in `@tron-wallet-kit/client` by adding a Trust-specific injected fallback:
  - `trustwallet.tronLink`
  - `trustwallet.tron`
  - This prevents Trust Wallet clicks from falling through to shared/legacy TronLink globals.
- Fixed stale QR/connect side effects in `@tron-wallet-kit/ui`:
  - modal and inline connect flows now use a monotonically increasing flow id.
  - late QR URI events, QR image rendering, connect errors, and retry timers are ignored after back, close, or selecting another wallet.
  - retry timers are explicitly cleared when a flow is cancelled.
- Fixed Guarda injected fallback shape:
  - upstream Guarda exposes request under `window.guarda.tron`.
  - TRON web helpers can live on parent `window.guarda.tronWeb`.
  - the local fallback now merges `guarda.tron` with parent `guarda.tronWeb` and tries request methods before falling back to `defaultAddress`.
- Added regression tests for:
  - Trust-specific provider winning over shared TronLink globals.
  - Guarda returning address from `eth_requestAccounts` while using parent `tronWeb`.
- Added upstream adapter audit notes in `Review/ADAPTER_BEHAVIOR_NOTES.md` covering platform and injection paths for TronLink, TokenPocket, OKX, Bitget, Trust, Gate, Bybit, Binance, Guarda, OneKey, Backpack, FoxWallet, imToken, and MetaMask TRON.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test`
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck`
- Notes:
  - During recovery, `packages/client/src/index.ts` was restored from Git after a null-byte write issue, then the Trust/Guarda changes were re-applied and verified.
  - Real extension QA is still required for mixed installed-wallet cases: Trust + TronLink, TokenPocket + TronLink, Guarda, Bitget, OKX, Binance, Gate, Bybit, OneKey, Backpack, and MetaMask TRON.

## 2026-07-07 Shared Wallet Registry and Default Wallet Controls

- Added `packages/core/src/wallet-registry.ts` and exported it from `@tron-wallet-kit/core`.
- `TRON_WALLET_REGISTRY` now stores wallet support metadata in one place:
  - `enabled`
  - `platforms`
  - `providerPaths`
  - `conflictMarkers`
  - `mobileDeepLink`
  - `supportsWalletConnect`
  - `upstreamPackage`
- `@tron-wallet-kit/ui` catalog now derives from enabled registry entries instead of repeating wallet platform/homepage/provider assumptions.
- `WalletOptionViewModel` now carries registry metadata forward so future PC/mobile UI can choose extension-first, QR-first, or deep-link-first presentation without adding more hardcoded rules.
- `@tron-wallet-kit/client` default adapter list now comes from `getEnabledTronWalletRegistryItems()`.
- Added `disabledWallets` to `DefaultAdaptersConfig`; a release/app can remove wallets from the generated default adapter list without deleting adapter code.
- Ledger is intentionally present in the registry but `enabled: false`, so the hardware wallet metadata is preserved while the wallet is removed from default All Wallets output until the hardware flow is ready.
- Bridge wallet configs now consume registry metadata through helper functions; importer functions remain adapter-specific because upstream packages expose different class names.
- Added tests for:
  - disabled default wallets in client config.
  - registry metadata flowing into UI wallet options.
  - disabled Ledger no longer appearing in default catalog output.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/core typecheck`
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/core build`
  - `pnpm --filter @tron-wallet-kit/ui build`
  - `pnpm --filter @tron-wallet-kit/client build`
- Note:
  - Previous browser QA memory mentioned 17 wallet cards. With Ledger disabled by registry, default All Wallets should now be rechecked visually with the updated expected count.

## 2026-07-07 Advanced Featured and All Wallets Configuration

- Added advanced wallet list config in `@tron-wallet-kit/ui`:
  - `walletList.featuredLimit`
  - `walletList.featuredWallets`
  - `walletList.wallets`
  - `walletList.disabledWallets`
  - `walletList.showUnavailable`
  - `walletList.sortAvailableFirst`
- UX guardrails:
  - default recommended featured limit remains 5 and renders as the original wallet row list.
  - compact preset uses 9 wallets so compact mode opens as a balanced 3x3 wallet grid.
  - featured config is clamped to max 10.
  - 7-10 featured wallets automatically render as compact 3-column wallet cards instead of full-width rows.
  - WalletConnect remains last in featured when selected.
  - All Wallets can sort available/supported wallets first without changing registry order permanently.
- `ConnectModalViewModel` now accepts `walletList`, and React `ConnectModal` forwards the prop.
- `react-basic` now includes test controls:
  - Featured wallets: 5 recommended, 9 compact, 10 compact max.
  - All wallets: all enabled or core only.
  - Show unavailable wallets toggle.
- Added unit coverage for:
  - featured max clamp.
  - compact featured layout.
  - allowlist + disabled wallet filtering.
  - available/QR wallets sorting above unavailable wallets.
- Added compact featured status indicators:
  - installed: small dot from `--twk-success`.
  - QR: mini QR icon from `--twk-badge-qr-fg` on the neutral badge surface.
  - connecting: existing token-driven spinner.
  - error: token-driven danger indicator.
  - not installed: no indicator, relying on disabled opacity.
- Compact indicators are intentionally icon/dot based, not text badges, to avoid cramped 7-10 wallet layouts.
- Follow-up polish:
  - compact wallet icons increased from 34px to 40px.
  - compact status indicators increased from 16px to 18px.
  - QR transport now takes priority over installed/available state, so WalletConnect shows the QR icon instead of the installed dot.
- QR badge polish:
  - compact wallet icons increased again from 40px to 44px after rendered review.
  - compact status indicators were reduced back to 18px with a 1.5px surface border after the 21px version felt too heavy.
  - installed dot is 8px; QR glyph is 12px and simplified to remain recognizable inside the compact badge.
  - QR compact badge no longer sets `background: var(--twk-badge-qr-bg)` on the badge container; it keeps the neutral surface background and only colors the QR glyph with `--twk-badge-qr-fg`.
  - Rendered QA on `http://127.0.0.1:5174/react-basic/` confirmed WalletConnect uses `data-status="qr"` with a visible QR icon in the 8-wallet compact layout.
- Featured compact mode was refactored to reuse the All Wallets card surface:
  - >6 featured wallets now render as `twk-wallet-card` in a 3-column grid instead of a separate `twk-wallet-compact` button.
  - `twk-wallet-status` is the shared card status indicator for Featured compact and All Wallets cards.
  - Rendered QA confirmed the visible modal has 8 card items, 0 compact items, 3 equal grid columns, and WalletConnect renders as a QR card.
- Default recommended featured wallets remain 5 items in the original row list.
- The compact preset now uses 9 items for a full 3x3 compact grid.
- Browser QA confirmed `react-basic` default opens 5 wallet rows (`data-featured-layout="rows"`), while selecting `9 compact` opens 9 wallet cards (`data-featured-layout="compact"`) with WalletConnect last and QR status.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
- Additional verification after compact indicators:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
- Local server:
  - `http://127.0.0.1:5174/react-basic/` returned HTTP 200 after the changes.

## 2026-07-07 TRX Domains Identity Lifecycle

- `react-basic` now enables identity resolution by default through `identity.enabled: true` and `trondomainjs` config `{ defaultNetwork: "mainnet" }`.
- Added a `Resolve TRX Domains` toggle in the example configuration panel.
- Added an `Identity` metric in the example kit panel so testers can see `domain/displayName` enrichment or the `No domain` fallback.
- The existing React `WalletButton` lifecycle already calls `kit.refreshIdentity()` after connect and ignores stale async results when the account/network changes.
- Added client unit coverage proving `refreshIdentity()` enriches the connected session account with `domain`, `displayName`, and `avatar` from a resolver.
- Browser QA confirmed the React basic route renders the identity metric and the `Resolve TRX Domains` toggle checked by default without console warnings/errors.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`

## 2026-07-07 TRX Domains getDomains Fallback

- Updated `createTronDomainIdentityResolver` so it tries `sdk.getDomain(address)` first, then falls back to `sdk.getDomains(address)` and uses the first normalized domain when no default reverse domain is set.
- Added a test hook for the TRX Domains SDK and unit coverage for the fallback path using `TSFquXZoXtei19kDJ1Sy1YGjznz8gWhfKd -> trxdomains.trx`.
- Normalized the `trondomainjs` config before calling `SDK`, so simple app config such as `{ defaultNetwork: "mainnet" }` still gets the mainnet RPC and contract address.
- Added a compatible SDK fallback for the current `trondomainjs@1.0.8` + `tronweb@6` runtime mismatch where the package throws `TronWeb is not a constructor`; the fallback preserves the same `getDomain`, `getDomains`, and `getMetadatas` API shape.
- Manual lookup through the built client export passed on 2026-07-07:
  - `TSFquXZoXtei19kDJ1Sy1YGjznz8gWhfKd`
  - `trxdomains.trx`
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm --filter @tron-wallet-kit/client build`

## 2026-07-07 Review Handoff Packet

- Clarified `Review/IMPLEMENTATION_HANDOFF.md` as the root work-order entry point for coder handoff.
- The handoff packet should be sent as the full `Review/` spec cluster, not as handoff alone:
  - `IMPLEMENTATION_HANDOFF.md`
  - `CORE_RUNTIME_SPEC.md`
  - `UI_CONFIG_GAPS_SPEC.md`
  - `IDENTITY_DIRECT_CONTRACT_SPEC.md`
  - `TRONWALLET_ADAPTER_BRIDGE_SPEC.md`
  - `WALLET_REGISTRY_SPEC.md`
  - `ADD_NEW_WALLET_GUIDE.md`
- Coder instruction: read `IMPLEMENTATION_HANDOFF.md` first, then work P0 -> P3 and open the spec named by each row.

## 2026-07-07 P0 Core Runtime Hardening

- Implemented P0 from `Review/CORE_RUNTIME_SPEC.md` in `@tron-wallet-kit/core`.
- Added core error helpers:
  - `WalletKitErrorCode`
  - `createWalletError`
  - `normalizeWalletError`
- Added runtime lifecycle support to `WalletManager`:
  - connect timeout with `AbortController`
  - `cancelPendingConnection()`
  - disconnect timeout cleanup
  - sign/submit timeout wrapping
  - autoReconnect dedup guard
  - stored session validation, expiry, and legacy unversioned migration
  - fallback reconnect when adapter has no `restoreSession`
  - pending return recovery through `canRecoverSession` / `recoverSession`
  - `session_expired`, `session_stale.reason`, `session_restored.stale`, and `connecting.recovering`
  - `destroy()` cleanup for SPA unmounts
- Added `ConnectOptions.signal` and `WalletManagerConfig.recoveryRetryDelaysMs`.
- React provider now calls `kit.manager.autoReconnect()` on mount and `kit.manager.destroy()` on unmount.
- Added unit coverage for timeout, cancellation, disconnect timeout, autoReconnect dedup/fallback, session expiry, legacy migration, recover-return, destroy cleanup, and error normalization.
- Updated `Review/IMPLEMENTATION_HANDOFF.md` P0 status and `Review/WALLET_TEST_MATRIX.md`.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/core typecheck`
  - `pnpm --filter @tron-wallet-kit/core test`
  - `pnpm --filter @tron-wallet-kit/react typecheck`
  - `pnpm --filter @tron-wallet-kit/client typecheck`
  - `pnpm --filter @tron-wallet-kit/examples typecheck`
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/react test`
  - `pnpm --filter @tron-wallet-kit/core build`
- Remaining handoff order:
  - P1 UI i18n/config
  - P1.5 UI hardening
  - P1.5 identity direct contract
  - P2 bridge QA/docs
  - P3 client split and wallet registry

## 2026-07-07 P1 UI Config + P1.5 Direct Identity

- Continued the `IMPLEMENTATION_HANDOFF.md` work order after P0.
- Implemented P1 UI i18n/config in `@tron-wallet-kit/ui`:
  - added built-in `en` labels and a backward-compatible `vi` alias plus app-level `labels` overrides
  - plumbed labels into modal, wallet badges, account panel, wallet button, and transaction toast
  - added modal behavior/branding config (`showCloseButton`, `closeOnBackdropClick`, `closeOnSelect`, `disableAnimations`, powered-by text/toggle)
  - added resolved QR config (`size`, `addressSize`, `margin`, `includeWalletLogo`, `errorCorrectionLevel`) and used it in connect QR rendering
  - wired account panel `maxVisibleTransactions` / explorer config support in shared UI models
- Implemented P1.5 direct TRX Domains identity in `@tron-wallet-kit/client`:
  - removed `trondomainjs` from `@tron-wallet-kit/client` dependencies and updated `pnpm-lock.yaml`
  - replaced the SDK resolver with `createTronDomainIdentityResolver()` that calls the TRX Domains contract directly (`reverseOf`, optional first-owned fallback, optional metadata)
  - resolver is mainnet-only, preserves multi-TLD domains exactly, sets wallet address on TronWeb for read-only calls, and times out safely by default
  - added test hook `__tronWalletKitTronWebForTest` and unit coverage for reverse lookup, owned-domain fallback, multi-TLD, non-mainnet skip, and timeout
- Added `Review/IMPLEMENTATION_STATUS_2026-07-07.md` because `IMPLEMENTATION_HANDOFF.md` has legacy mojibake encoding that resisted safe targeted patching.
- P1.5 UI hardening is still partial: copy fallback, wallet image fallback, and QR render error surfacing remain open.
- P3 client module split / wallet descriptor registry was read and assessed but not started; current core registry reduces duplication, but the open descriptor-per-wallet refactor remains a separate mechanical phase.
- Verification passed:
  - `pnpm --filter @tron-wallet-kit/ui typecheck`
  - `pnpm --filter @tron-wallet-kit/ui test`
  - direct `tsc --noEmit` in `packages/client`
  - direct `vitest run` in `packages/client`
  - direct `tsc --noEmit` in `packages/react`
  - direct `tsc --noEmit` in `packages/ui`
  - direct `tsc --noEmit` in `packages/core`
- Note: after removing `trondomainjs`, running PNPM scripts triggered an install/prune path and hit Windows/PNPM build approval/hoist issues (`@reown/appkit` ignored builds and transient unlink errors). Code verification was completed via direct `node_modules/.bin` tools.

## 2026-07-07 P1.5 UI Hardening + P3 Client Split Start

- Completed the remaining P1.5 UI hardening items from `Review/UI_CONFIG_GAPS_SPEC.md`:
  - added shared `copyToClipboard()` in `@tron-wallet-kit/ui`
  - modal QR copy and React account-panel copy now only show copied state after a successful copy
  - clipboard fallback uses a hidden textarea plus `document.execCommand("copy")`
  - wallet icon images now include an `onerror` fallback that removes the broken image and reveals the wallet initial
  - QR render failures now set a visible error slot and message instead of leaving a blank QR area
  - added token-driven CSS for QR render error state and icon fallback visibility
- Started P3 mechanical client split:
  - added `packages/client/src/tronweb.ts` for shared TronWeb loading, test injection, and wallet-specific balance provider detection
  - added `packages/client/src/utils.ts` for `toThemeConfig`
  - `packages/client/src/index.ts` now imports those helpers instead of owning the code inline
- Updated `Review/IMPLEMENTATION_STATUS_2026-07-07.md` and `Review/WALLET_TEST_MATRIX.md`.
- Verification passed:
  - direct `tsc --noEmit` in `packages/ui`
  - direct `vitest run` in `packages/ui` (37 tests)
  - direct `tsc --noEmit` in `packages/react`
  - direct `tsc --noEmit` in `packages/client`
  - direct `vitest run` in `packages/client` (22 tests)
  - direct `tsc --noEmit` in `examples/react-basic`
- Remaining P3 split order:
  - public types
  - injected detect/registry-map
  - adapter bridge/default/combinators
  - balance
  - identity
  - client factory
  - kit factory
  - barrel `index.ts`

## 2026-07-07 P3 Client Split Complete

- Completed the low-risk P3 split order requested after the P1.5 UI hardening pass:
  - public types moved to `packages/client/src/types.ts`
  - injected provider detection/request helpers moved to `packages/client/src/injected/detect.ts`
  - registry-to-config helpers moved to `packages/client/src/injected/registry-map.ts`
  - injected adapter factory moved to `packages/client/src/adapters/injected.ts`
  - bridge adapter factories moved to `packages/client/src/adapters/bridge.ts`
  - availability/fallback wrappers moved to `packages/client/src/adapters/combinators.ts`
  - default tronweb3 bridge wallet descriptors/importers moved to `packages/client/src/adapters/defaults.ts`
  - TRX balance resolver and SUN normalization moved to `packages/client/src/balance.ts`
  - TRX Domains direct contract resolver moved to `packages/client/src/identity.ts`
  - `createDefaultAdapters` and `createWalletClient` moved to `packages/client/src/client.ts`
  - `createWalletKit` moved to `packages/client/src/kit.ts`
  - `packages/client/src/index.ts` is now a barrel export
- Kept behavior unchanged during the split; the work was mechanical and verified after each risky boundary.
- Updated `Review/IMPLEMENTATION_STATUS_2026-07-07.md` and `Review/WALLET_TEST_MATRIX.md`.
- Verification passed:
  - direct `tsc --noEmit` in `packages/client`
  - direct `vitest run` in `packages/client` (22 tests)
  - direct `tsc --noEmit` in `packages/react`
  - direct `tsc --noEmit` in `packages/ui`
  - direct `tsc --noEmit` in `examples/react-basic`
- Remaining P3-adjacent work:
  - descriptor-per-wallet registry from `Review/WALLET_REGISTRY_SPEC.md` is still a separate deeper refactor if needed
  - P2 still needs real-wallet QA/docs/package decisions

## 2026-07-07 Bitget Parent TronWeb Fallback Fix

- Fixed Bitget injected fallback for the real extension shape where the request provider can return `{ code: 200 }` while the selected address lives on parent/global TronWeb:
  - added `getBitgetInjectedProvider()` in `packages/client/src/injected/detect.ts`
  - Bitget default fallback now uses this provider resolver instead of only direct `providerPaths`
  - resolver merges `bitkeep.tronLink` / `bitkeep.tron` with parent `bitkeep.tronWeb`
  - resolver also supports Bitget-marked global `window.tronLink` + `window.isBitKeep` with `window.tronWeb`
  - added `bitkeep.tronWeb` to default TRX balance lookup paths
- Added regression tests for:
  - Bitget request returning `{ code: 200 }` while address/balance come from `bitkeep.tronWeb`
  - Bitget exposing TronLink-shaped globals guarded by `isBitKeep`
- Verification passed:
  - direct `tsc --noEmit` in `packages/client`
  - direct `vitest run` in `packages/client` (24 tests)
  - direct `tsc --noEmit` in `packages/react`
  - direct `tsc --noEmit` in `examples/react-basic`

## 2026-07-07 Git Checkpoint After P2 Extension QA

- User confirmed the phase-2 extension wallet group can connect successfully:
  - TronLink
  - TokenPocket
  - OKX Wallet
  - Bitget Wallet
  - Trust Wallet
  - Binance Web3 Wallet
  - MetaMask TRON
  - Guarda
- Created git commit:
  - `b04261c feat: harden tron wallet kit runtime and ui`

## 2026-07-07 Wallet Descriptor Registry Phase 1

- Decided the deeper descriptor-per-wallet registry is useful, but it should be introduced in phases because `core` and `ui` cannot safely import `client`.
- Implemented phase 1 in `@tron-wallet-kit/client`:
  - added `packages/client/src/wallets/types.ts`
  - added one descriptor file per runtime wallet under `packages/client/src/wallets/entries/`
  - added `_template.ts` for future wallet contributions
  - added `packages/client/src/wallets/registry.ts`
  - added `packages/client/src/wallets/build-adapters.ts`
  - changed `createDefaultAdapters()` to build from descriptors
  - removed the older duplicated `packages/client/src/adapters/defaults.ts`
  - exported wallet descriptor APIs from `packages/client/src/index.ts`
- Kept UI/core catalog unchanged in this phase to avoid reversing package dependencies. A later phase can either move descriptors to a shared package/core-safe manifest or generate core/UI catalog data from client descriptors at build time.
- Verification passed:
  - direct `tsc --noEmit` in `packages/client`
  - direct `vitest run` in `packages/client` (25 tests)
  - direct `tsc --noEmit` in `packages/react`
  - direct `tsc --noEmit` in `packages/ui`
  - direct `tsc --noEmit` in `examples/react-basic`

## 2026-07-07 Wallet Descriptor Registry 5c Runtime Catalog

- Implemented the final 5c architecture direction from `Review/IMPLEMENTATION_HANDOFF.md`:
  - descriptor is the runtime source for adapter + catalog data
  - UI is catalog-agnostic and accepts runtime catalog through config/view model
  - client builds adapters and catalog from the same descriptor list
  - runtime plugin descriptors are accepted in `WalletClientConfig.wallets`
- Added `packages/client/src/wallets/build-catalog.ts`.
- Added public helpers:
  - `defineWallet()`
  - `isWalletDescriptor()`
  - `resolveWalletDescriptors()`
  - `buildCatalog()`
- `createWalletKit()` now builds catalog from descriptors and injects it into `WalletUiConfig.catalog`.
- `createDefaultAdapters()` supports mixed `wallets` arrays: legacy string ids and runtime `WalletDescriptor` objects.
- UI changes:
  - `WalletUiConfig.catalog`
  - `ResolvedWalletUiConfig.catalog`
  - `ConnectModalViewModel.catalog`
  - `mergeWalletOptionsWithCatalog(..., catalog)`
  - descriptor `featured` order is used as default while `ui.walletList.featuredWallets` remains the integrator override.
- React `ConnectModal` forwards runtime catalog to the shared UI merge helper.
- Injected descriptors now support `signMessageMode: "signMessageV2" | "sign" | "request"` so SafePal-style message signing can use `tronWeb.trx.sign(message)`.
- Added client unit coverage for a runtime SafePal-style descriptor with inline icon, catalog build, connect, and signMessage.
- Verification passed:
  - direct `tsc --noEmit` in `packages/ui`
  - direct `tsc --noEmit` in `packages/client`
  - direct `tsc --noEmit` in `packages/react`
  - direct `tsc --noEmit` in `examples/react-basic`
  - direct `vitest run` in `packages/client` (26 tests)
  - direct `vitest run` in `packages/ui` (37 tests)
- Backward compatibility note:
  - legacy `core/wallet-registry.ts` and static UI catalog still exist as fallback for standalone UI rendering, but client-created kits now inject descriptor catalog at runtime.

## 2026-07-07 Wallet Icon Registry Spec Alignment

- Re-read the updated `Review/IMPLEMENTATION_HANDOFF.md` section 5c and `Review/WALLET_REGISTRY_SPEC.md`.
- The specs now match the agreed icon direction:
  - raw wallet SVG files live in `packages/client/src/wallets/icons/<wallet-id>.svg`
  - a prebuild/prepack codegen script generates `packages/client/src/wallets/icons.generated.ts`
  - builtin descriptors can leave `icon` empty and let `buildCatalog()` resolve `descriptor.icon ?? WALLET_ICONS[id]`
  - runtime third-party descriptors still pass `icon` inline as URL/data URI
  - UI must be icon-agnostic and receive icons only through runtime catalog data
- Implemented client-side generated icon map:
  - added `scripts/gen-wallet-icons.mjs`
  - generated `packages/client/src/wallets/icons.generated.ts` from `packages/client/src/wallets/icons/*.svg`
  - root `icons:wallets` now runs the local generator from the checked-in `packages/client/src/wallets/icons/` folder
  - `packages/client` runs the generator on `prebuild` and `prepack`
  - `buildCatalog()` and default adapter metadata now resolve icons from `descriptor.icon ?? WALLET_ICONS[id]`
- Legacy note:
  - `packages/ui/src/wallets/icons.generated.ts` and static UI lookup still exist only as fallback for standalone UI rendering; client-created kits inject descriptor catalog icons at runtime.
- Follow-up bug fix:
  - Hydrating adapter metadata must not clone class adapters with object spread because prototype methods such as `TronLinkAdapter.connect()` are lost.
  - `buildAdapters()` now updates the original adapter metadata and returns the same adapter instance.
  - Added regression coverage that TronLink still exposes `connect()` and can connect after icon hydration.

## 2026-07-07 Remove Legacy UI Icon Lookup

- Removed UI-owned wallet icon lookup from `packages/ui/src/wallet-catalog.ts`.
- Deleted the old `packages/ui/src/wallets/` generated icon assets; UI now remains catalog-agnostic and only renders icons passed on `TronWalletCatalogItem.icon` or adapter metadata.
- `WalletKit` now exposes `catalog`, built by `@tron-wallet-kit/client` from wallet descriptors and `packages/client/src/wallets/icons.generated.ts`.
- React `ConnectModal` now defaults to `props.catalog ?? kit.catalog`, so React surfaces receive the client runtime catalog automatically.
- Browser entrypoint remains routed through `createWalletKit(config)`, so browser kits also receive the client runtime catalog.
- Updated tests:
  - UI tests now assert runtime catalog icons are accepted without static UI icon lookup.
  - React tests assert server-rendered `ConnectModal` receives generated data-URI icons from `kit.catalog`.

## 2026-07-08 P2 Ledger Optional Peer

- Implemented the P2 Ledger direction from `IMPLEMENTATION_HANDOFF.md` and `WALLET_REGISTRY_SPEC.md`.
- Added client descriptor `ledger` with hardware metadata, bridge integration, lazy importer, and generated icon lookup.
- Added `@tronweb3/tronwallet-adapter-ledger` as an optional peer of `@tron-wallet-kit/client`; apps install it to enable Ledger.
- Extended catalog/UI platform typing to support `hardware` transport without hardcoding UI behavior.
- Added docs/checklist notes for install-to-enable behavior and real-device QA.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test` passed with 29 tests.
- Remaining:
  - Real Ledger QA with a physical device and TRON app open.
  - The older non-Ledger `@tronweb3` optional dependencies still need a separate packaging decision to fully satisfy the "zero hard bridge deps by default" strategy.

## 2026-07-08 Handoff Re-read

- Re-read `Review/IMPLEMENTATION_HANDOFF.md` after the new updates.
- Key active priorities from the handoff:
  - P1: UI i18n and missing UI config knobs remain open.
  - P1.5: copy fallback, wallet icon image fallback, and QR render error surfacing remain open.
  - P1.5 identity: replace `trondomainjs` with direct mainnet contract resolver using shared tronWeb.
  - P2: keep bridge as public interop, ship Ledger as optional peer, move TokenPocket/OKX/Bitget/Trust toward injected QA, and avoid hard `@tronweb3` dependencies in default kit packaging.
  - P3: continue client modularization, with identity/balance/tronweb extraction as the next natural step.
- Noted process constraints:
  - Do not commit `PROJECT_MEMORY.md`.
  - Treat `docs/` as local-only until release/public-docs policy is clarified.

## 2026-07-08 Wallet Registry Spec Re-read

- Re-read `Review/WALLET_REGISTRY_SPEC.md`.
- Confirmed the current direction:
  - `WalletDescriptor` is the single source for metadata, icon, and integration.
  - Builtin icons live in `packages/client/src/wallets/icons/<id>.svg` and are generated into `icons.generated.ts`.
  - UI must stay catalog-agnostic and receive catalog data at runtime from client/kit.
  - Runtime third-party wallets should use the same descriptor shape and can pass inline icon URLs/data URIs.
  - Integrator display control stays in `ui.walletList`; descriptor `featured` is only a suggestion.
- Gap noted:
  - The desired strategy is default injected integration for most TRON wallets, with bridge reserved for Ledger, MetaMask-TRON opt-in, and special cases.
  - Current code still has bridge/optional dependency wiring for several prominent extension wallets from earlier phases; this needs a controlled follow-up migration to injected descriptors and packaging cleanup.

## 2026-07-08 P2 Injected Packaging Migration Plan

- Added `Review/P2_INJECTED_PACKAGING_MIGRATION_PLAN.md`.
- Migration plan:
  - Phase 0: add/confirm injected adapter tests and cheap availability-probe guardrails.
  - Phase 1: migrate TokenPocket, OKX, Bitget, and Trust to `integration: "injected"` only after real extension QA.
  - Phase 2: migrate Gate/Bybit, Guarda/OneKey, Binance/Backpack in smaller batches.
  - Hold FoxWallet/imToken until mobile/app QA.
  - Keep Ledger on optional-peer bridge; keep MetaMask TRON opt-in bridge.
  - Remove upstream optional dependencies only after the matching injected batch passes QA.

## 2026-07-08 P2 Phase 0 Guardrails

- Added client tests before migrating bridge wallets to injected:
  - injected providers fall back from `tron_requestAccounts` to `eth_requestAccounts`.
  - injected descriptors with only wallet-specific roots do not accept generic `window.tronWeb`.
- Extended `scripts/gen-wallet-icons.mjs` to generate data URIs from SVG, PNG, and WEBP wallet icon files.
- Regenerated `packages/client/src/wallets/icons.generated.ts`; 18 icons are now emitted.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test` passed with 31 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.

## 2026-07-08 TokenPocket Injected Canary

- Converted TokenPocket descriptor from `tronweb3-bridge` to `injected`.
- Detection now uses TokenPocket-owned roots only:
  - `tokenpocket.tron`
  - `tokenpocket.tronWeb`
- Removed generic `tronWeb` fallback from TokenPocket detection to avoid wallet-global collisions.
- Kept `@tronweb3/tronwallet-adapter-tokenpocket` in `packages/client/package.json` optional dependencies until real extension QA passes.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test` passed with 31 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
- Pending:
  - Real TokenPocket extension QA with TronLink also installed.

## 2026-07-08 OKX Injected Canary

- Converted OKX Wallet descriptor from `tronweb3-bridge` to `injected`.
- Detection now uses the OKX-owned root `okxwallet.tronLink`.
- Kept `@tronweb3/tronwallet-adapter-okxwallet` in `packages/client/package.json` optional dependencies until real extension QA passes.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test` passed with 31 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
- Pending:
  - Real OKX extension QA.

## 2026-07-08 Bitget Injected Canary

- Converted Bitget Wallet descriptor from `tronweb3-bridge` to `injected`.
- Detection keeps `getBitgetInjectedProvider()` and Bitget-owned roots:
  - `bitkeep.tronLink`
  - `bitkeep.tron`
- Existing tests still cover parent `bitkeep.tronWeb` address resolution and `window.isBitKeep` global-marker behavior.
- Kept `@tronweb3/tronwallet-adapter-bitkeep` in `packages/client/package.json` optional dependencies until real extension QA passes.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test` passed with 31 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
- Pending:
  - Real Bitget extension QA with TronLink also installed.

## 2026-07-08 React Basic StrictMode Modal Fix

- Investigated `http://127.0.0.1:5174/react-basic/` after user reported an error.
- Browser findings:
  - Page loaded with no Vite/runtime error overlay.
  - Console only showed Lit dev-mode warnings.
  - Modal DOM had duplicated featured wallet rows under React StrictMode.
- Fix:
  - Added `destroy()` to `WalletKit`.
  - `createWalletKit().destroy()` now destroys button, toast, modal, manager, and clears identity cache.
  - `TronWalletProvider` now keeps internally-created kit stable and calls full kit destroy on unmount.
- Verification:
  - Browser reload/open modal showed 5 featured wallet rows, not 10.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react test` passed with 3 tests.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 31 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.

## 2026-07-08 Bitget Injected Getter Safety

- Fixed user-reported browser error:
  - `Uncaught TypeError: e.logger is not a function`
  - stack pointed at Bitget provider probing in `packages/client/src/injected/detect.ts`.
- Root cause:
  - Bitget/injected wallet provider objects can be proxy-like and expose throwing getters.
  - Spreading the provider in `getBitgetInjectedProvider()` executed those getters during `isAvailable()`.
- Fix:
  - Added safe property reads in injected detection.
  - Replaced provider object spread with selective clone of `request` and `tronWeb`.
  - Wrapped `createInjectedTronAdapter` provider resolution so `isAvailable()` returns false instead of crashing when a probe throws.
- Added regression test with a Bitget-like provider containing an enumerable throwing `logger` getter.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test` passed with 32 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - Browser reload/open modal on `http://127.0.0.1:5174/react-basic/` showed no app console errors.

## 2026-07-08 Bitget Injected Request Binding

- User reported Bitget connect still failed with `Connection declined e.logger is not a function`.
- Root cause:
  - The previous safe clone copied `request` as a bare function.
  - Bitget's injected request implementation can depend on `this.logger`, so calling the detached function loses provider context.
- Fix:
  - `cloneInjectedProvider()` now binds `request` to the original provider object.
- Added regression test for a Bitget-like provider whose `request()` reads `this.logger`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test` passed with 33 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.

## 2026-07-08 Trust Injected Canary

- Converted Trust Wallet descriptor from `tronweb3-bridge` to `injected`.
- Detection now uses Trust-owned roots:
  - `trustwallet.tronLink`
  - `trustwallet.tron`
- Existing Trust-vs-TronLink collision regression still passes.
- Kept `@tronweb3/tronwallet-adapter-trust` in `packages/client/package.json` optional dependencies until real extension QA passes.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test` passed with 33 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
- Pending:
  - Real Trust extension QA with TronLink also installed.

## 2026-07-08 Phase 1 Cleanup + Gate/Bybit Injected Canary

- User confirmed Phase 1 real-wallet QA passed.
- Removed upstream optional packages for the QA'd injected wallets from `@tron-wallet-kit/client`:
  - `@tronweb3/tronwallet-adapter-tokenpocket`
  - `@tronweb3/tronwallet-adapter-okxwallet`
  - `@tronweb3/tronwallet-adapter-bitkeep`
  - `@tronweb3/tronwallet-adapter-trust`
- Ran `pnpm install --ignore-scripts`; package manager removed 4 packages and updated `pnpm-lock.yaml`.
- Converted Gate Wallet descriptor from `tronweb3-bridge` to `injected`.
  - Detection roots: `gatewallet.tron`, `gatewallet.tronLink`.
- Converted Bybit Wallet descriptor from `tronweb3-bridge` to `injected`.
  - Detection roots: `bybitWallet.tronLink`, `bybitWallet.tron`.
- Updated `Review/P2_INJECTED_PACKAGING_MIGRATION_PLAN.md` and `Review/ADAPTER_BEHAVIOR_NOTES.md` with Phase 1 cleanup and Gate/Bybit canary status.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 33 tests.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
- Pending:
  - Real Gate extension QA for installed state, connect/address, signMessage, signTransaction, and collision behavior.
  - Real Bybit extension QA for installed state, connect/address, signMessage, signTransaction, and collision behavior.
  - Only after Gate/Bybit QA passes, remove `@tronweb3/tronwallet-adapter-gatewallet` and `@tronweb3/tronwallet-adapter-bybit` from optional dependencies.

## 2026-07-08 Guarda/OneKey Injected Canary

- Converted Guarda descriptor from `tronweb3-bridge` to `injected`.
  - Detection uses `getGuardaInjectedProvider()` plus roots `guarda.tron` and `guarda`.
  - Hardened `getGuardaInjectedProvider()` to avoid object-spreading injected provider proxies and to bind `request` to the original provider.
- Converted OneKey descriptor from `tronweb3-bridge` to `injected`.
  - Detection roots: `$onekey.tron`, `$onekey.tronLink`.
- Updated `Review/P2_INJECTED_PACKAGING_MIGRATION_PLAN.md` and `Review/ADAPTER_BEHAVIOR_NOTES.md`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test` passed with 33 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
- Pending:
  - Real Guarda extension QA for installed state, connect/address, signMessage, signTransaction, and collision behavior.
  - Real OneKey extension QA for installed state, connect/address, signMessage, signTransaction, and collision behavior.
  - Only after Guarda/OneKey QA passes, remove `@tronweb3/tronwallet-adapter-guarda` and `@tronweb3/tronwallet-adapter-onekey` from optional dependencies.

## 2026-07-08 Guarda/OneKey Cleanup + Binance/Backpack Injected Canary

- User confirmed Guarda/OneKey real-wallet QA passed.
- Removed upstream optional packages for the QA'd injected wallets from `@tron-wallet-kit/client`:
  - `@tronweb3/tronwallet-adapter-guarda`
  - `@tronweb3/tronwallet-adapter-onekey`
- Ran `pnpm install --ignore-scripts`; package manager removed 2 packages and updated `pnpm-lock.yaml`.
- Converted Binance Web3 Wallet descriptor from `tronweb3-bridge` to `injected`.
  - Detection roots: `binancew3w.tron`, `binancew3w.tronLink`.
  - Kept `supportsWalletConnect: true` as metadata for later mobile/UI optimization.
- Converted Backpack descriptor from `tronweb3-bridge` to `injected`.
  - Detection roots: `backpack.tron`, `backpack.tronLink`.
- Extended client regression coverage so Backpack is included in the second-phase injected wallet test.
- Updated `Review/P2_INJECTED_PACKAGING_MIGRATION_PLAN.md` and `Review/ADAPTER_BEHAVIOR_NOTES.md`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test` passed with 33 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
- Pending:
  - Real Binance Web3 Wallet extension QA for installed state, connect/address, signMessage, signTransaction, and collision behavior.
  - Real Backpack extension QA for installed state, connect/address, signMessage, signTransaction, and collision behavior.
  - Only after Binance/Backpack QA passes, remove `@tronweb3/tronwallet-adapter-binance` and `@tronweb3/tronwallet-adapter-backpack` from optional dependencies.

## 2026-07-08 Binance Extension Detection Fix

- User reported Binance Web3 Wallet extension was not detected after the injected canary.
- Inspected the installed upstream `@tronweb3/tronwallet-adapter-binance` package.
  - Upstream checks `window.binancew3w.tron`.
  - The Binance provider is not TIP-1193-shaped; it exposes methods like `getAccount`, `getChainId`, `signMessageV2`, and `signTransaction`.
- Added `getBinanceInjectedProvider()` in `packages/client/src/injected/detect.ts`.
  - Maps `getAccount()` to account request methods.
  - Maps `getChainId()` into the kit's network resolver path.
  - Maps `signMessageV2()` and `signTransaction()` into the injected adapter's signing surface.
- Updated Binance descriptor to use `getBinanceInjectedProvider()` instead of plain provider-path probing.
- Updated client tests to cover a Binance-style injected provider and connect through it.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 33 tests.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
- Pending:
  - Re-QA Binance installed badge and connect flow in `react-basic`.

## 2026-07-08 Binance Cleanup After QA

- User confirmed Binance Web3 Wallet QA passed after the injected helper fix.
- Removed `@tronweb3/tronwallet-adapter-binance` from `@tron-wallet-kit/client` optional dependencies.
- Ran `pnpm install --ignore-scripts`; package manager removed 75 packages because Binance upstream pulled its own WalletConnect/Reown dependency tree.
- Updated `Review/P2_INJECTED_PACKAGING_MIGRATION_PLAN.md` and `Review/ADAPTER_BEHAVIOR_NOTES.md`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test` passed with 33 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
- Pending:
  - Backpack remains the next QA target in this batch.
  - Gate/Bybit cleanup is still blocked until real QA confirmation.
  - FoxWallet/imToken remain hold items because they are mobile/app-browser oriented.

## 2026-07-08 Backpack/Bybit/Gate Cleanup After QA

- User confirmed Backpack and Bybit QA passed; Gate extension was not installed but user accepted temporary QA status.
- Removed upstream optional packages for the accepted injected wallets from `@tron-wallet-kit/client`:
  - `@tronweb3/tronwallet-adapter-backpack`
  - `@tronweb3/tronwallet-adapter-bybit`
  - `@tronweb3/tronwallet-adapter-gatewallet`
- Ran `pnpm install --ignore-scripts`; package manager removed 3 packages and updated `pnpm-lock.yaml`.
- Updated `Review/P2_INJECTED_PACKAGING_MIGRATION_PLAN.md` and `Review/ADAPTER_BEHAVIOR_NOTES.md`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test` passed with 33 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
- Remaining optional upstream wallet packages in client:
  - `@tronweb3/tronwallet-adapter-foxwallet` and `@tronweb3/tronwallet-adapter-imtoken` remain hold items for mobile/app-browser QA.
  - `@tronweb3/tronwallet-adapter-metamask-tron` remains opt-in/special-case pending final packaging decision.
  - Ledger remains an optional peer, not an optional dependency.

## 2026-07-08 FoxWallet Extension Canary + SafePal Built-in

- Rechecked FoxWallet upstream adapter package.
  - The package README and types use `window.foxwallet.tronLink`.
  - The current upstream adapter is app/mobile-oriented and marks non-mobile browser contexts as not found, so it is unsuitable as the default desktop extension path.
- Converted FoxWallet descriptor from `tronweb3-bridge` to `injected`.
  - Detection root: `foxwallet.tronLink`.
  - Platforms now include `extension` and `mobile`.
  - Kept `@tronweb3/tronwallet-adapter-foxwallet` in optional dependencies until real FoxWallet extension/app QA passes.
- Added SafePal as a built-in wallet descriptor.
  - New file: `packages/client/src/wallets/entries/safepal.ts`.
  - Detection uses `getSafePalInjectedProvider()` over `window.SafePalHook` and `window.tronWeb`.
  - SafePal supports extension/mobile metadata and `supportsWalletConnect: true`.
  - SafePal icon was already present in `packages/client/src/wallets/icons/safepal.png`.
- Synchronized legacy/core fallback metadata:
  - `packages/core/src/wallet-registry.ts` now includes SafePal.
  - FoxWallet registry metadata now includes both extension and mobile platforms.
  - `packages/client/src/tronweb.ts` includes SafePal balance/identity path via global `tronWeb`.
- Added client regression coverage:
  - FoxWallet injected connect/sign through `window.foxwallet.tronLink`.
  - SafePal connect/sign through `SafePalHook` + global `tronWeb`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 35 tests.
  - `pnpm --filter @tron-wallet-kit/core typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
- Pending:
  - Real FoxWallet extension QA to decide whether to remove upstream optional package.
  - Real SafePal extension QA for installed badge, connect/address, signMessage, and signTransaction.

## 2026-07-08 FoxWallet Activation Resolver Tightening

- Followed up on real UI QA where FoxWallet still did not become active.
- Added `getFoxWalletInjectedProvider()` in `packages/client/src/injected/detect.ts`.
  - Detects only inside `window.foxwallet` to avoid collisions with TronLink, Trust, TokenPocket, or generic `window.tronWeb`.
  - Accepts `foxwallet.tronLink`, `foxwallet.tron`, and parent-level `foxwallet.request/tronWeb` variants.
  - Merges parent `request` or `tronWeb` into child provider roots when the extension splits capability across objects.
- Updated `packages/client/src/wallets/entries/foxwallet.ts`.
  - Provider paths are now `foxwallet.tronLink` and `foxwallet.tron`.
  - Descriptor uses the dedicated FoxWallet resolver.
- Added client regression coverage for parent-level FoxWallet `request/tronWeb`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 36 tests.
- Pending:
  - Real FoxWallet extension QA. If it is still inactive, capture the provider shape from `window.foxwallet` so we can add the exact variant instead of broadening into unsafe globals.

## 2026-07-08 FoxWallet Desktop Extension Reclassification

- User confirmed FoxWallet still does not become active in desktop QA.
- Rechecked FoxWallet official TRON docs.
  - Their TRON docs state TRON is currently supported only in the FoxWallet mobile app and Chrome extension support is coming soon.
  - Their provider docs still describe the app provider as `window.foxwallet.tronLink`.
- Reclassified FoxWallet metadata back to mobile/app-only until FoxWallet ships TRON Chrome extension support.
  - `packages/client/src/wallets/entries/foxwallet.ts` now has `platforms: ["mobile"]` plus FoxWallet deep link metadata.
  - `packages/core/src/wallet-registry.ts` now uses `transport: "mobile"` and `platforms: ["mobile"]` for FoxWallet.
  - Kept `getFoxWalletInjectedProvider()` for FoxWallet mobile in-app browser compatibility.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 36 tests.
  - `pnpm --filter @tron-wallet-kit/core typecheck` passed.
- Pending:
  - Do not expect FoxWallet desktop extension to show installed/active for TRON until FoxWallet official docs change.

## 2026-07-08 SafePal Injected QA Hardening

- Continued P2 QA with SafePal after FoxWallet was reclassified as mobile-only.
- Rechecked SafePal official TRON docs.
  - Installed check is `window.SafePalHook && window.tronWeb`.
  - Platform is `window.sfpPlatform` (`"ext"` on PC extension, `"iOS"`/`"Android"` in SafePal app).
  - Extension connect uses `SafePalHook.request({ method: "tron_requestAccounts" })`, then reads `SafePalHook.defaultAddress.base58`.
  - Signing uses `tronWeb.trx.sign(...)`.
- Hardened `getSafePalInjectedProvider()`:
  - requires both `SafePalHook` and `tronWeb`
  - removes raw `SafePalHook` provider-path fallback from the SafePal client descriptor
  - re-reads `SafePalHook.defaultAddress` after approval
  - normalizes `tronWeb.defaultAddress` from either global `tronWeb` or `SafePalHook.defaultAddress`
  - supports SafePal in-app sessions where address is already available and no request method is exposed
- Added client regression tests:
  - SafePal is unavailable with only `SafePalHook`
  - SafePal connects when `defaultAddress` appears after approval
  - SafePal in-app preconnected mode connects without `request`
- Browser QA on `http://127.0.0.1:5174/react-basic/`:
  - page loaded with no framework overlay
  - All Wallets modal rendered and included SafePal
  - only Lit dev-mode warnings were present
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 39 tests.
  - `pnpm --filter @tron-wallet-kit/core typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
- Pending:
  - Real SafePal extension QA for installed badge, connect/address, signMessage, signTransaction, and balance.

## 2026-07-08 WalletConnect QR Panel + Dev Server Stabilization

- Investigated user report that WalletConnect QR was not displayed in the correct modal position and local dev appeared to hang.
- Findings:
  - `@tron-wallet-kit/adapter-walletconnect` does not render a WalletConnect/Reown modal; it only uses `@tronweb3/walletconnect-tron` to create a session and emit the `wc:` URI.
  - `@walletconnect/modal` is not installed.
  - `@tronweb3/walletconnect-tron` does pull `@reown/appkit` / `@reown/appkit-ui` transitively, including `qrcode@1.5.3`, even though the kit does not use that modal UI.
  - `@tron-wallet-kit/ui` still needs `qrcode` as a non-DOM/SSR fallback because `qr-code-styling` requires `window`.
- UI QR changes:
  - WalletConnect QR panel now uses a stable square QR frame up to 340px.
  - QR code, SVG/canvas/img, and skeleton now fill the same reserved square to avoid position shift.
  - Removed transparent QR background usage in modal rendering so dark theme still gets a white QR scan surface.
  - Kept `qr-code-styling` as the primary browser renderer and `qrcode` as fallback only.
- Dev server fix:
  - Removed stale `optimizeDeps.include` entries from `examples/vite.config.ts`.
  - The old include list referenced many `@tronweb3` packages that are no longer dependencies after injected migration, causing Vite dependency optimization failures and the appearance of a hanging server.
  - Restarted examples server successfully on `http://127.0.0.1:5174/`; log reports Vite ready in about 2.5s.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect test` passed with 7 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `git diff --check` passed for touched files with only Windows LF/CRLF warnings.
- Pending:
  - Real browser visual QA for the WalletConnect modal QR panel with a live URI after the user reloads `react-basic`.
  - Future optional optimization: consider a direct WalletConnect implementation to avoid `@reown/appkit` transitive UI weight from `@tronweb3/walletconnect-tron`.

## 2026-07-08 WalletConnect QR Modal Auto-Close Fix

- User reloaded `react-basic` and confirmed the WalletConnect URI/preview appeared outside the kit, but the kit QR modal closed right after the QR URI returned.
- Root cause:
  - Portal modal `connectWallet()` applied `config.modal.closeOnSelect` after `manager.connect()` resolved for every wallet.
  - WalletConnect/QR flows can resolve or progress after emitting the URI, and the QR panel must remain visible for scan/copy/retry instead of being treated like a direct extension selection.
- Fix:
  - `packages/ui/src/modal.ts` now classifies QR flows up front (`capabilities.includes("qr")`, `transport: "walletconnect" | "qr"`, or `id: "walletconnect"`).
  - `closeOnSelect` still closes direct extension connect success.
  - QR flows no longer auto-close the portal modal on connect resolution; the user must close/back intentionally.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `http://127.0.0.1:5174/react-basic/` returned 200 with title `TRON Wallet Kit React Example`.
- Pending:
  - User real-browser QA that WalletConnect QR now remains in the modal after the URI appears.

## 2026-07-08 WalletConnect QR Sticky Flow Guard

- User still saw the WalletConnect QR modal close after the QR URI loaded, which meant the first portal-only `closeOnSelect` guard was not strict enough for every rendered controller path.
- Fix:
  - Added an `activeConnectIsQrFlow` sticky guard to both portal modal and inline modal controllers.
  - QR flow is now identified up front by wallet capability/transport/id and reinforced again when a `qr` event arrives.
  - When `manager.connect()` resolves for a QR flow, the UI re-renders the QR view instead of closing or falling back to a direct extension success path.
  - Back, close, and switching wallet flows still cancel the pending QR state by incrementing `connectFlowId` and clearing active QR state.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
- Pending:
  - User real-browser QA on `http://127.0.0.1:5174/react-basic/` that WalletConnect QR remains open after URI emission and external QR preview update.

## 2026-07-08 WalletConnect QR Provider-Safe Preview Fix

- Follow-up QA still reproduced the modal disappearing after the external WalletConnect URI preview appeared.
- Additional root cause:
  - The React basic example stored `walletConnectUri` in `ExampleApp`, which wraps `TronWalletProvider`.
  - When WalletConnect emitted a URI, the parent state update could re-render/remount the provider subtree in dev/Strict mode and leave the portal modal hidden while the external compact QR preview appeared.
  - The WalletConnect adapter also called the configured external `onUri` callback before the per-connect `options.onUri` used by the modal flow.
- Fix:
  - `packages/adapters/walletconnect/src/index.ts` now calls `options.onUri` first, then the configured adapter callback, so the active modal flow receives the URI before external app callbacks run.
  - `examples/react-basic/src/main.tsx` no longer sets WalletConnect URI state above `TronWalletProvider`; the preview subscribes to `kit.manager.on("qr")` inside `ExampleWorkspace`.
  - `packages/ui/src/modal.ts` keeps QR flows sticky for both portal and inline controllers and blocks non-forced auto-close for active WalletConnect QR flows.
  - Rebuilt `@tron-wallet-kit/ui` and `@tron-wallet-kit/adapter-walletconnect` dist outputs so package exports and dev source stay aligned.
- Verification:
  - Browser QA on `http://127.0.0.1:5174/react-basic/`: Open modal -> WalletConnect -> URI preview appears -> modal remains visible with `data-twk-view="qr"`, QR image rendered, Copy link/Try again visible, no console errors.
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect test` passed with 7 tests.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui build` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect build` passed.
- Pending:
  - User manual scan QA with a real mobile WalletConnect wallet.

## 2026-07-08 Gate Injected Detector Hardening

- Continued P2 extension QA pass for Gate Wallet after the user said Gate is available for testing.
- In-app Codex browser cannot see real wallet extensions, so local visual QA cannot prove installed state for Gate; user real-browser QA is still required.
- Hardened Gate detection:
  - Added `getGateInjectedProvider()` in `packages/client/src/injected/detect.ts`.
  - Gate now composes from `window.gatewallet.tron`, `window.gatewallet.tronLink`, or parent `window.gatewallet`.
  - If `tronWeb` lives on parent `window.gatewallet`, the detector merges it into the nested request provider.
  - `packages/client/src/wallets/entries/gate.ts` now uses the custom Gate provider composer while keeping Gate-owned provider paths.
  - Balance/identity TronWeb resolver now also checks `gatewallet.tronWeb`.
- Added regression coverage for nested Gate request provider + parent `tronWeb.defaultAddress`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 40 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client build` passed.
  - `git diff --check` passed for touched files with only Windows LF/CRLF warnings.
- Dev server:
  - `http://127.0.0.1:5174/react-basic/` remains served by PID 1848.
- Pending:
  - User real-browser QA for Gate installed badge, connect/address, balance, signMessage, signTransaction, and disconnect/reconnect.

## 2026-07-08 Gate Disabled-State Follow-Up

- User reported Gate still appeared disabled in the connect UI.
- Checked upstream `@tronweb3/tronwallet-adapter-gatewallet` source:
  - Gate support check is `window.gatewallet && window.gatewallet.tronLink`.
  - Gate extension uses `eth_requestAccounts`; Gate app uses `tron_requestAccounts`.
  - Upstream polls because Gate provider injection can arrive after page/modal initialization.
- Fix:
  - Added optional `availabilityTimeoutMs` for injected descriptors/adapters.
  - Gate descriptor sets `availabilityTimeoutMs: 1500`, so availability can wait briefly for late injection instead of freezing as `NOT INSTALLED`.
  - Gate descriptor now requests `eth_requestAccounts` before `tron_requestAccounts`.
  - Gate detector treats `gatewallet.tronLink` plus parent `gatewallet.tronWeb` as available, matching Gate's support marker while still avoiding generic globals.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 42 tests.
  - `pnpm --filter @tron-wallet-kit/client build` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `git diff --check` passed for touched files with only Windows LF/CRLF warnings.
- Pending:
  - User should reload `http://127.0.0.1:5174/react-basic/` in the browser with Gate installed and re-check the Gate badge/connect flow.

## 2026-07-08 Gate Installed Marker Probe

- User reported Gate still did not show `INSTALLED`.
- Root cause refinement:
  - A Gate install marker can be present as `window.gatewallet.tronLink` even before a full connect-ready provider exposes `request` or `tronWeb`.
  - The previous detector still required a provider-like object, so the UI could keep Gate as unavailable even when the extension marker existed.
- Fix:
  - Added `availabilityProbe` to injected wallet descriptors/adapters.
  - Gate now uses `hasGateInjectedMarker()` as an installed-state probe while keeping `getGateInjectedProvider()` for connect/sign provider resolution.
  - Availability polling checks both provider resolution and the installed marker.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/client build` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `git diff --check` passed for touched files with only Windows LF/CRLF warnings.
- Pending:
  - User real-browser QA that Gate now shows `INSTALLED`; if not, inspect which global Gate exposes in that browser.

## 2026-07-08 Gate Reverted To Upstream Bridge

- User reported Gate still did not show installed after the injected marker probe.
- Re-read upstream GateWallet adapter package and treated it as a special case:
  - upstream uses a wallet-specific state machine and delayed readiness checks
  - extension connect path uses `window.gatewallet.tron` with `eth_requestAccounts`
  - support marker can be `window.gatewallet.tronLink`
  - app path uses `window.gatewallet.tronLink` with `tron_requestAccounts`
- Decision:
  - Reverted Gate descriptor from injected-only back to `tronweb3-bridge`.
  - Re-added `@tronweb3/tronwallet-adapter-gatewallet` as an optional dependency.
  - Kept injected fallback and `availabilityProbe` as backup, but primary runtime now uses the official Gate adapter.
  - Increased Gate bridge availability wait to 5000ms to match delayed injection behavior better.
- Verification:
  - `pnpm install --ignore-scripts` completed and lockfile updated.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/client build` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `git diff --check` passed for touched files with only Windows LF/CRLF warnings.
  - Restarted dev server on `http://127.0.0.1:5174/react-basic/`, PID 15140.
- Pending:
  - User reload QA for Gate installed badge/connect using the official upstream bridge path.

## 2026-07-08 Gate Multi-Chain Marker Probe

- User reported Gate still rendered as `Gate Wallet: Unavailable`.
- Added broader Gate installed marker detection while keeping Gate-specific scope:
  - `window.gatewallet`
  - `window.gateWallet`
  - `window.GateWallet`
  - EIP-1193 provider flags such as `isGateWallet` / `isGate`
  - EIP-6963 `announceProvider` info with Gate-like `name` or `rdns`
- Rationale:
  - Gate Wallet is multi-chain and may announce as an EVM-style extension before its TRON provider is ready.
  - The UI installed badge should use the installed marker, while connect still relies on the official Gate bridge/injected TRON provider.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 44 tests.
  - `pnpm --filter @tron-wallet-kit/client build` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `git diff --check` passed for touched files with only Windows LF/CRLF warnings.
  - Restarted dev server on `http://127.0.0.1:5174/react-basic/`, PID 10332.
- Pending:
  - If Gate still reports unavailable, collect actual browser globals because the known upstream/global/EIP marker set did not match the installed extension.

## 2026-07-08 Gate Runtime Diagnostics Panel

- User reported Gate still was not detected after upstream bridge, injected fallback, global aliases, EIP-1193, and EIP-6963 marker probes.
- Added a temporary `Gate diagnostics` panel to `examples/react-basic/src/main.tsx`.
  - Refreshes every second.
  - Shows summarized `window.gatewallet`, `window.gateWallet`, `window.GateWallet`, and `window.ethereum/providers` Gate markers.
  - Avoids dumping circular provider objects by summarizing keys/booleans only.
- Verification:
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `git diff --check` passed for the example file with only Windows LF/CRLF warning.
  - Restarted dev server on `http://127.0.0.1:5174/react-basic/`, PID 7296.
- Pending:
  - User should copy the `Gate diagnostics` panel output so the actual injected shape can be mapped.

## 2026-07-08 Gate Diagnostics Result

- User provided `Gate diagnostics` output from `react-basic`:
  - `window.gatewallet`: `null`
  - `window.gateWallet`: `null`
  - `window.GateWallet`: `null`
  - `window.ethereum`: `{}`
- Conclusion:
  - The current page does not receive a Gate TRON provider or useful Gate EVM marker.
  - With this runtime shape, `Gate Wallet: Unavailable` is correct behavior from the kit and upstream bridge.
  - The issue is likely outside the kit detection path: extension not injecting on `127.0.0.1`, site access disabled for the extension, Gate extension not unlocked/active for this page, or current Gate extension build not exposing TRON provider on desktop.
- Pending:
  - Confirm Gate extension site access for `http://127.0.0.1:5174`.
  - If Gate still does not inject, keep Gate as unavailable or move it to WalletConnect/mobile fallback until Gate desktop TRON injection can be observed.

## 2026-07-08 Gate Manual Browser Probe

- User asked to manually call the upstream Gate checks in browser:
  - `supportGateWallet() => !!(window.gatewallet && window.gatewallet.tronLink)`
  - `isInGateApp() => /GateApp/i.test(userAgent) || !!(window.gatewallet?.tronLink && !window.gatewallet.tron)`
- Ran the checks in Codex in-app browser at `http://127.0.0.1:5174/react-basic/`.
- Result:
  - `supportGateWallet`: `false`
  - `isInGateApp`: `false`
  - `window.gatewallet`: `null`
  - `window.gateWallet`: `null`
  - `window.GateWallet`: `null`
  - `window.ethereum`: `null`
  - EIP-6963 announcements: `[]`
- Conclusion:
  - Codex in-app browser has no Gate extension injection, so it cannot verify the real Gate extension path.
  - The upstream adapter logic would also return unavailable in this browser because `supportGateWallet()` is false.
  - Further Gate debugging must happen in the user's extension-enabled browser or via a visible diagnostic panel/output copied from that browser.

## 2026-07-08 Gate Official Wallet API Tron Docs

- User pointed to the official Gate Wallet API docs: `https://gateweb3.gitbook.io/wallet-api`.
- Read the English Tron page markdown: `https://gateweb3.gitbook.io/wallet-api/en/tron-tronweb-tronlink-style.md`.
- Important difference from old upstream adapter marker:
  - Official Tron docs list available objects in priority order:
    - `window.gatewallet.tronWeb`
    - `window.gatewallet.tron`
    - `window.gatewallet.tronLink`
  - Example builds/signs/broadcasts through `window.gatewallet.tronWeb`.
- Fix:
  - Updated Gate injected fallback provider paths to include `gatewallet.tronWeb` first.
  - Added client regression coverage for the documented preferred `window.gatewallet.tronWeb` object.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 45 tests.
  - `pnpm --filter @tron-wallet-kit/client build` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `git diff --check` passed for touched files with only Windows LF/CRLF warnings.
  - Restarted dev server on `http://127.0.0.1:5174/react-basic/`, PID 18424.
- Pending:
  - User QA in browser with Gate extension; if diagnostic still shows `gatewallet: null`, the docs path also cannot be used because Gate is not injecting any `window.gatewallet` object.

## 2026-07-08 Gate HTTPS Dev Server Requirement

- User confirmed the root cause with direct cross-origin testing:
  - `https://walletadapter.org` receives `window.gatewallet` with `.tron` and `.tronLink`, and Gate connects successfully.
  - `http://127.0.0.1:5174` receives `window.gatewallet === undefined`.
  - Gate Wallet does not inject `window.gatewallet` on `http://` localhost; it requires `https://`.
- Conclusion:
  - Gate detection/adapter code was not the root bug.
  - Gate extension QA must use HTTPS dev origin or deployed/tunneled HTTPS.
  - TronLink/Bitget can inject on HTTP localhost, which made Gate look like a kit-specific bug.
- Fix:
  - Added `@vitejs/plugin-basic-ssl` to the examples package.
  - Added `pnpm --filter @tron-wallet-kit/examples dev:https`.
  - `examples/vite.config.ts` enables Basic SSL when Vite mode is `https` or `TWK_EXAMPLES_HTTPS=true`.
  - Gate injected fallback now explicitly prioritizes `eth_requestAccounts` before `tron_requestAccounts`, matching Gate extension behavior.
- Verification:
  - `pnpm install --ignore-scripts` completed and lockfile updated.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 45 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client build` passed.
  - `pnpm --filter @tron-wallet-kit/examples build` passed.
  - `git diff --check` passed for touched files with only Windows LF/CRLF warnings.
  - `curl.exe -k -I https://127.0.0.1:5174/react-basic/ --max-time 10` returned `HTTP/1.1 200 OK`.
- Pending:
  - User should open `https://127.0.0.1:5174/react-basic/` and accept the local dev certificate warning if prompted, then QA Gate installed/connect.

## 2026-07-08 Gate Back To Injected

- User asked whether Gate can return to injected after confirming the root cause was HTTP-origin injection policy.
- Decision:
  - Yes. Gate is back to `integration: "injected"`.
  - The official upstream Gate adapter package is no longer needed for the default client path.
  - Removed `@tronweb3/tronwallet-adapter-gatewallet` from `@tron-wallet-kit/client` optional dependencies and lockfile.
- Gate injected descriptor:
  - provider paths: `gatewallet.tronWeb`, `gatewallet.tron`, `gatewallet.tronLink`
  - provider composer: `getGateInjectedProvider`
  - availability probe: `hasGateInjectedMarker`
  - request order: `eth_requestAccounts`, then `tron_requestAccounts`
  - availability wait: `5000ms`
- Verification:
  - `pnpm install --ignore-scripts` completed and removed one package.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 45 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client build` passed.
  - `pnpm --filter @tron-wallet-kit/examples build` passed with existing bundle-size warnings only.
  - `git diff --check` passed for touched files with only Windows LF/CRLF warnings.
  - Restarted HTTPS dev server; `curl.exe -k -I https://127.0.0.1:5174/react-basic/ --max-time 10` returned `HTTP/1.1 200 OK`.
- Pending:
  - User QA Gate injected on `https://127.0.0.1:5174/react-basic/`.

## 2026-07-08 Gate/Bitget QA Isolation

- User reported that first page load auto-connected Bitget and clicking Gate looked like it was confused with Bitget.
- Fixes:
  - `react-basic` now passes `autoReconnect={false}` explicitly.
  - `react-basic` uses a new storage key: `react-basic-session-v2`, so old saved Bitget sessions are ignored during wallet QA.
  - Gate provider composer now binds parent `gatewallet.request` onto child/provider surfaces when the child only exposes `tronWeb`.
  - Added regression coverage that Gate must prefer `eth_requestAccounts` over a prefilled `gatewallet.tronWeb.defaultAddress`, preventing silent connect with a stale/default address.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 46 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client build` passed.
  - `git diff --check` passed for touched files with only Windows LF/CRLF warnings.
  - Restarted HTTPS dev server; `curl.exe -k -I https://127.0.0.1:5174/react-basic/ --max-time 10` returned `HTTP/1.1 200 OK`.
- Pending:
  - User QA Gate on HTTPS after a hard reload. If Bitget still appears connected, clear `tron-wallet-kit:react-basic-session-v2` from localStorage and report the Gate diagnostics output.

## 2026-07-08 All Wallets UI Polish

- User requested UI fixes against `Review/UI_CONFIG_GAPS_SPEC.md` section 2c and supplied screenshots for the All Wallets skeleton/search and QR install row.
- Fixes:
  - All Wallets search is now a full-width form group with the search icon on the right, instead of a detached icon tile on the left.
  - Initial All Wallets skeleton wallet cards reserve centered icon/name placeholders so the loading grid no longer reads as left-shifted inside cards.
  - Featured-view All wallets trigger now uses a sentence-case label in English and the wallet-count badge shrinks to fit its text instead of reserving a wide pill.
  - QR/connecting install row is slimmer, token-driven, and closer to the requested "Don't have ...? Get" treatment, with a smaller Get action.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
  - `pnpm --filter @tron-wallet-kit/ui build` passed.
  - `curl.exe -k -I https://127.0.0.1:5174/react-basic/ --max-time 10` returned `HTTP/1.1 200 OK`.
  - `git diff --check -- packages/ui/src/modal.ts packages/ui/src/styles.ts` passed with only Windows LF/CRLF warnings.
- Notes:
  - In-app browser validation timed out on local HTTPS twice, so screenshot proof was not captured in this session.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` timed out twice before completion; no error output was produced.

## 2026-07-08 Search Field Focus Polish

- User reported the All Wallets search input showing an unwanted blue inner focus/hover outline.
- Fix:
  - Disabled the native/focus-visible outline on `.twk-wallet-search-input` so the full search form group keeps the intended single-frame visual treatment.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `git diff --check -- packages/ui/src/styles.ts` passed with only Windows LF/CRLF warnings.
  - `curl.exe -k -I https://127.0.0.1:5174/react-basic/ --max-time 10` returned `HTTP/1.1 200 OK`.

## 2026-07-08 All Wallets Search Focus Preservation

- User reported that typing into All Wallets search moved focus to the close button, showing the close-button focus ring.
- Root cause:
  - The search input handler re-rendered the modal via `root.innerHTML`, replacing the focused input, then the generic focus routine could move focus to another control.
- Fix:
  - Modal and inline wallet controllers now call `render({ preserveSearchFocus: true })` for search input events.
  - After re-render, the new `.twk-wallet-search-input` is focused with `preventScroll` and its selection range is restored.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
  - `git diff --check -- packages/ui/src/modal.ts packages/ui/src/styles.ts` passed with only Windows LF/CRLF warnings.
  - `curl.exe -k -I https://127.0.0.1:5174/react-basic/ --max-time 10` returned `HTTP/1.1 200 OK`.

## 2026-07-08 UI Config 2c Re-read

- Re-read `Review/UI_CONFIG_GAPS_SPEC.md` section 2c, including 2c.1 and 2c.2, after the user noted many new proposals.
- Key deltas vs current implementation:
  - `walletList.layout` should officially be `"list" | "card"` with `"grid"` only as a backward-compatible alias.
  - Current UI still auto-switches featured into card/compact mode when `featuredWallets.length > 6`; spec says layout must only follow `walletList.layout`.
  - Current config still treats `featuredLimit` as active; spec says no visible cap, keep `featuredLimit` only as deprecated/no-op compatibility.
  - Need `featuredMode: "manual" | "installed-first" | "installed-only"`, defaulting to `installed-first`.
  - Featured resolver must be installed-aware and rank-aware: installed group first, then TRON rank/descriptor `featured`, then fallback ordering.
  - WalletConnect should move to top only when dynamic modes detect zero installed wallets; manual mode must not reorder.
  - Featured wallet area should become a fixed/max-height scroll viewport with overflow fade; All Wallets trigger stays outside that scroll area.
  - All Wallets sorting remains controlled by `sortAvailableFirst`, separate from `featuredMode`.
  - Mobile behavior needs platform-aware branching: desktop extension, mobile in-app, and mobile browser/deeplink/WC-first are different cases.
- Implementation note:
  - The current code is not fully aligned with 2c yet; this should be handled as a focused migration, with tests for layout aliasing, featured modes, zero-installed WalletConnect ordering, and All Wallets config separation.

## 2026-07-08 UI Config 2c Desktop Migration

- Implemented the desktop/testable portion of `Review/UI_CONFIG_GAPS_SPEC.md` section 2c.
- Changes:
  - `WalletListLayout` now supports `"list" | "card"` with `"grid"` retained as a backward-compatible alias that resolves to `"card"`.
  - Added `featuredMode: "manual" | "installed-first" | "installed-only"` with default `"installed-first"`.
  - `featuredLimit` remains in types/config only as deprecated compatibility; featured rendering no longer uses it as a visible cap.
  - Featured resolver now supports:
    - manual ordering from `featuredWallets` without installed reordering,
    - installed-first ordering with installed extension wallets first and TRON rank after,
    - installed-only ordering,
    - WalletConnect fallback/top behavior when no extension wallet is installed in dynamic modes.
  - Featured and All Wallets now both respect `walletList.layout`.
  - Featured wallets render in a fixed scroll viewport with fade mask; the All wallets trigger is outside that viewport.
  - Wallet row markup now also carries `data-twk-platforms`, matching card metadata.
  - `react-basic` now exposes UI controls for wallet layout, featured mode, manual featured preset, All Wallets preset, and unavailable wallet visibility.
- Deferred:
  - Mobile platform-aware resolver/deeplink branching from 2c.2 is still pending; this change intentionally focuses on desktop extension QA.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui build` passed.
  - `curl.exe -k -I https://127.0.0.1:5174/react-basic/ --max-time 10` returned `HTTP/1.1 200 OK`.

## 2026-07-08 Search Layout And TronLink Availability Stabilization

- User reported:
  - TronLink availability was intermittent and slower to leave loading than other wallets.
  - Search results stretched to fill the wallet viewport height when few results matched.
  - Focus could still jump from search to the close button during search.
- Fixes:
  - Wallet result grid now uses `align-content: start` and `grid-auto-rows: max-content`, keeping row/card heights stable during search filtering.
  - Modal and inline render paths now snapshot active search focus before any render, then restore the new search input and caret after render. This covers async availability renders, not just direct input events.
  - TronLink descriptor now sets a shorter default `checkTimeoutMs: 800` while still allowing app config override via `config.tronlink`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 46 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `git diff --check -- packages/ui/src/modal.ts packages/ui/src/styles.ts packages/client/src/wallets/entries/tronlink.ts` passed with only Windows LF/CRLF warnings.
  - `curl.exe -k -I https://127.0.0.1:5174/react-basic/ --max-time 10` returned `HTTP/1.1 200 OK`.

## 2026-07-08 Close Focus Ring Hardening

- User reported that some operations still triggered a visible focus ring on the close button in the connect modal.
- Root cause:
  - The modal primary-focus helper used one broad `querySelector()` containing `[data-twk-action='close']`.
  - Browser `querySelector()` returns the first matching element in DOM order, and the header close button appears before wallet rows/search body controls.
  - Availability refreshes and view renders could therefore programmatically focus close and show the tokenized focus ring even when the user did not tab to it.
- Fix:
  - Modal and inline panels now include an invisible `tabindex="-1"` panel focus target.
  - Primary focus no longer includes close/back/wallet/action buttons as a broad fallback.
  - Search input remains the only preserved control across render, with caret restore.
  - Non-search view transitions focus the panel target; normal async refresh renders do not move focus.
  - Panel focus outline is explicitly suppressed while keyboard focus rings remain for actual interactive controls.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui build` passed.
  - `git diff --check -- packages/ui/src/modal.ts packages/ui/src/styles.ts packages/ui/test/theme.test.ts` passed with only Windows LF/CRLF warnings.
  - `curl.exe -k -I https://127.0.0.1:5174/react-basic/ --max-time 10` returned `HTTP/1.1 200 OK`.
- Browser note:
  - In-app browser validation could not proceed because the local HTTPS dev server uses a self-signed certificate and Browser Use blocked `ERR_CERT_AUTHORITY_INVALID`; no safety interstitial was bypassed.

## 2026-07-08 UI Config 2c Featured Cap And Overflow Fix

- User pointed out a spec-breaking bug in `packages/ui/src/config.ts`:
  - `featuredWallets` was sliced to `FEATURED_MAX_LIMIT` 10 during config resolution.
  - This silently dropped integrator-provided wallet IDs after the 10th item and contradicted UI config 2c, where featured wallets should render all configured entries.
- Fixes:
  - Removed the `featuredWallets.slice(0, 10)` behavior.
  - Removed the max-cap concept from config resolution. `featuredLimit` remains normalized only as deprecated/backward-compatible config data and does not cap visible wallets.
  - Featured wallet grid now uses content-sized `height: auto` plus `max-height: min(360px, 52vh)` instead of a hard fixed height, so small featured lists do not create empty scroll boxes.
  - Featured fade masks now depend on measured overflow state via `data-overflow="bottom" | "top" | "both"` and are absent when the list does not overflow.
  - Added focus/scroll handling so keyboard focus inside the featured scroller calls `scrollIntoView({ block: "nearest" })`.
- Regression coverage:
  - `resolveWalletUiConfig()` preserves 11 configured featured wallet IDs even when `featuredLimit` is set lower.
  - `installed-first` with zero installed extension wallets puts WalletConnect first.
  - CSS asserts featured scroller uses max-height and data-overflow fade states rather than fixed height/fade always-on.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 37 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui build` passed.
  - `curl.exe -k -I https://127.0.0.1:5174/react-basic/ --max-time 10` returned `HTTP/1.1 200 OK`.

## 2026-07-08 UI Config 2c.2 Mobile Platform-Aware Lists

- User confirmed the desktop featured cap/overflow fix was OK and asked to continue.
- Implemented the next 2c.2 step from `Review/UI_CONFIG_GAPS_SPEC.md`:
  - Added `WalletEnvironment` typing and `resolveWalletEnvironment()` in UI.
  - Runtime modal/inline controllers now classify the browser as:
    - `desktop-extension`
    - `mobile-in-app`
    - `mobile-browser`
  - Environment detection uses cheap UA/touch + known injected TRON globals and does not import adapters.
  - Static `createConnectModalHtml()` remains desktop-default unless a `walletEnvironment` is provided, preserving SSR/test behavior.
- Wallet list behavior:
  - Desktop keeps extension/hardware wallets and WalletConnect; mobile-only wallets are hidden.
  - Mobile browser keeps mobile-capable wallets and WalletConnect; extension-only wallets are hidden.
  - Mobile browser `installed-first` puts WalletConnect first, then all mobile-capable wallets sorted by TRON rank/name.
  - Mobile browser `showUnavailable:false` no longer hides mobile-capable wallets just because injected detection is impossible in normal mobile browsers.
- Regression coverage:
  - Desktop environment hides mobile-only wallets but keeps WalletConnect.
  - Mobile browser hides extension-only wallets but keeps mobile-capable unavailable wallets.
  - Mobile browser featured list puts WalletConnect first.
  - Environment detection distinguishes desktop, mobile browser, and mobile in-app.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 39 tests.
  - `pnpm --filter @tron-wallet-kit/ui build` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.

## 2026-07-08 Ledger Desktop Visibility

- User clarified that Ledger should also be enabled on PC.
- Findings:
  - Client descriptor already treated Ledger as `platforms: ["hardware"]`.
  - Core fallback wallet registry still had Ledger `enabled: false` and `platforms: ["extension"]`, so static/UI fallback catalog could omit or misclassify Ledger.
- Fixes:
  - Enabled Ledger in `packages/core/src/wallet-registry.ts`.
  - Normalized Ledger registry platforms to `["hardware"]`.
  - Added UI regression coverage that desktop platform filtering keeps Ledger while mobile browser filtering hides Ledger.
- Verification:
  - `pnpm --filter @tron-wallet-kit/core typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test` passed with 39 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test` passed with 46 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.

## 2026-07-10 Gate First-Connect And Reviewer Gaps

- User asked to restart the local server, commit the latest work, and check Gate first-connect hanging before `Gate Wallet did not return an address`.
- Server:
  - Restarted examples server on HTTPS for Gate extension testing.
  - Confirmed `https://127.0.0.1:5174/react-basic/` returns `HTTP/1.1 200 OK`.
- Gate injected adapter fix:
  - Added `addressSettleMs` to injected wallet descriptors/config.
  - Gate now uses `addressTimeoutMs: 15000` and `addressSettleMs: 4000`.
  - Injected address acquisition no longer waits the full 60s after a request settles without an address; it waits a wallet-specific settle window for `tronWeb.defaultAddress` hydration.
  - Preserved request-account priority for normal injected wallets; only descriptors with `preferInjectedAddress` shortcut existing injected addresses.
  - Added regression coverage for Gate first approval where `eth_requestAccounts` returns empty first and `gatewallet.tronWeb.defaultAddress` is hydrated shortly after.
- Reviewer gaps:
  - Verified core timeout cancellation was already wired for connect/sign/submit timeout branches.
  - Moved `WALLET_STORAGE_VERSION` into core types and reused it in manager/tests to avoid version drift.
  - Verified `@tronweb3/tronwallet-adapter-imtoken`, Ledger, and MetaMask TRON are optional peer dependencies in `packages/client/package.json`; no dead foxwallet package dependency remains.
  - Removed orphan `tomo.svg` from client wallet icons and regenerated `icons.generated.ts`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 47 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/core typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/core test -- --run` passed with 18 tests.

## 2026-07-10 Gate First-Connect Address Shape Follow-Up

- User reported Gate first connect still failed with `Gate Wallet did not return an address`.
- Root cause refinement:
  - The previous poll only read cloned provider `tronWeb.defaultAddress.base58`.
  - Gate can hydrate address on refreshed global paths after approval, and the address shape may be `defaultAddress` as a string/object or wallet/provider fields such as `address`/`selectedAddress`.
- Fixes:
  - Added `readInjectedAddress()` and `readInjectedAddressFromPaths()` in injected detection.
  - Injected adapter now polls fresh provider paths every loop instead of relying only on the cloned provider reference.
  - Address extraction now accepts arrays, strings, `{ address }`, `{ base58 }`, `{ selectedAddress }`, and nested `{ defaultAddress }`.
  - Added regression coverage for Gate first approval where `gatewallet.tronWeb.defaultAddress` appears after an empty request response.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 48 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.

## 2026-07-10 Gate Request accountAddress Follow-Up

- User reported Gate first connect still failed with `Gate Wallet did not return an address`.
- Read upstream `@tronweb3/tronwallet-adapter-gatewallet@1.1.0`:
  - Extension uses `window.gatewallet.tron`.
  - Connect method calls `eth_requestAccounts`.
  - The response type can include `accountAddress` and `hex`, not only an array.
- Fixes:
  - Address extraction now accepts `accountAddress` and nested `accounts`.
  - Added regression coverage for Gate returning `{ code: 200, accountAddress, hex }`.
  - Added gated debug logging for Gate failures when `localStorage.TWK_DEBUG_GATE = "1"` so runtime provider shape can be inspected without noisy production logs.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 49 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.

## 2026-07-10 Gate Empty Address Retry

- User reported Gate still failed on first connect and suggested delaying then calling connect/request a second time.
- Fix:
  - Added optional injected adapter retry config:
    - `emptyAddressRetryDelayMs`
    - `emptyAddressRetryTimeoutMs`
  - Gate enables a scoped recovery path:
    - `addressSettleMs: 800`
    - `emptyAddressRetryDelayMs: 300`
    - `emptyAddressRetryTimeoutMs: 3000`
  - When the first Gate request resolves without an address, the adapter waits briefly, rereads live provider paths, then calls `eth_requestAccounts` once more with its own timeout.
  - The retry is Gate-scoped via descriptor config and does not affect other injected wallets.
- Regression coverage:
  - Added test for Gate first request returning `{ code: 200 }`, second request returning `["TGateSecondAttempt"]`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 50 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.

## 2026-07-10 Gate AccountsChanged Recovery

- User reported Gate still returned `Gate Wallet did not return an address` after the empty-address retry.
- Hypothesis from upstream Gate adapter:
  - Gate extension may complete authorization through provider events while request returns no usable address.
  - Our cloned provider previously dropped `on/off/removeListener`, so the injected adapter could not observe `accountsChanged`.
- Fixes:
  - `InjectedTronProvider` now includes optional `on`, `off`, and `removeListener`.
  - `cloneInjectedProvider()` preserves those event APIs.
  - Gate descriptor now subscribes during connect to `accountsChanged`, `accountChanged`, and `connect` for up to 5s.
  - Injected connect now resolves from account-change event payloads while request/live polling continues in parallel.
  - Event listeners are cleaned up on success, timeout, fallback, or rejection.
- Regression coverage:
  - Added test for Gate request returning `{ code: 200 }` while `accountsChanged` emits `["TGateEventAddress"]`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 51 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.

## 2026-07-10 Gate Provider Internal updateStatus Error

- User observed Gate extension console error:
  - `Uncaught TypeError: R.updateStatus is not a function`
  - Location: `gt-window-provider.js` / `internalBridgeListener`
- Assessment:
  - The error is inside Gate's injected provider, but our previous workaround may have triggered it by subscribing to non-upstream events (`accountChanged`, `connect`) and by retrying `eth_requestAccounts`.
  - Upstream Gate adapter only listens to `accountsChanged` and does not call request twice.
- Fix:
  - Gate descriptor now only subscribes to `accountsChanged`.
  - Removed Gate's second request retry by clearing `emptyAddressRetry*` config.
  - Increased `addressSettleMs` to 5000 so the adapter waits/polls for `tronWeb.defaultAddress` after the single approval request.
  - Updated regression test to assert a single request followed by live address hydration.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 51 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.

## 2026-07-10 Gate Upstream Adapter Bridge Pivot

- User confirmed Gate still logs `Uncaught TypeError: R.updateStatus is not a function` from Gate's injected `gt-window-provider.js` even after reducing custom event/retry behavior.
- Decision:
  - Stop using the custom injected connect path for Gate Wallet.
  - Gate descriptor now uses `integration: "tronweb3-bridge"` and imports the official `@tronweb3/tronwallet-adapter-gatewallet`.
  - Keep `hasGateInjectedMarker` as a lightweight availability probe so the UI can still show installed from Gate-owned markers before the upstream adapter is constructed.
- Upstream behavior captured in tests:
  - Desktop extension shape is `window.gatewallet.tronLink` for support detection and `window.gatewallet.tron` for connect.
  - Desktop extension connect uses `eth_requestAccounts` and expects an address array.
  - Already-connected sessions reuse `gatewallet.tron.tronWeb.defaultAddress.base58`.
  - Gate in-app uses `tron_requestAccounts` and then reads `tronLink.tronWeb.defaultAddress.base58`.
- Cleanup:
  - Removed obsolete Gate custom injected regression tests and replaced them with upstream bridge tests.
  - Added `@tronweb3/tronwallet-adapter-gatewallet` as an optional peer dependency of `@tron-wallet-kit/client`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 45 tests and no skipped tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.

## 2026-07-10 Gate + OneKey Conflict Root Cause

- User found the Gate `R.updateStatus is not a function` error only appears when OneKey is enabled.
- Root cause:
  - Gate installed-state probe was too broad.
  - It checked `window.ethereum/providers`, camelCase `window.gateWallet`, and dispatched EIP-6963 provider discovery.
  - With OneKey/multi-chain extensions enabled, these probes can touch competing provider surfaces and make Gate appear installed or active without the upstream Gate marker.
- Fix:
  - Narrowed `hasGateInjectedMarker()` to the official upstream support check: `window.gatewallet && window.gatewallet.tronLink`.
  - Removed Gate's ethereum-provider and EIP-6963 availability fallbacks.
  - Added regression coverage: OneKey plus generic ethereum markers must not mark Gate installed when `window.gatewallet.tronLink` is absent.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 45 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.

## 2026-07-10 OneKey On-Demand Availability Mitigation

- User confirmed Gate still conflicts when the OneKey extension is enabled, and Gate connects immediately after OneKey is disabled.
- Root cause refinement:
  - Even strict Gate detection is not enough if the modal auto-probes OneKey while Gate is present.
  - OneKey is a multi-chain extension; touching its injected provider during the modal availability sweep can still trigger cross-wallet provider side effects before the user clicks OneKey.
- Fix:
  - Added `WalletMetadata.availabilityMode?: "auto" | "on-demand"`.
  - Added descriptor-level `availabilityMode`.
  - Marked OneKey as `availabilityMode: "on-demand"`.
  - Modal availability refresh now skips `isAvailable()` for on-demand wallets and treats them as selectable until the user explicitly clicks that wallet.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 46 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 39 tests.

## 2026-07-10 Gate Back to Injected + Modal Auto Retry

- User confirmed the Gate issue is not solved by `tronweb3-bridge` or injected alone; disabling OneKey still makes Gate connect immediately.
- Decision:
  - Reverted Gate Wallet to the lightweight injected descriptor.
  - Removed `@tronweb3/tronwallet-adapter-gatewallet` from client optional peer dependencies and lockfile.
  - Keep Gate strict availability marker: `window.gatewallet.tronLink`.
- Gate injected behavior:
  - Provider composer: `getGateInjectedProvider()`.
  - Provider paths: `gatewallet.tron`, `gatewallet.tronLink`, `gatewallet.tronWeb`.
  - Request method: `eth_requestAccounts`.
  - Address timeout: 5000ms.
  - Settle window: 900ms.
  - Event watch: `accountsChanged` for up to 5000ms.
- UI mitigation:
  - Connect modal now auto-retries one time after a short delay for extension connect failures that look transient (`CONNECTION_FAILED`, `REQUEST_TIMEOUT`, "did not return an address", "request connect error", timeout).
  - Auto retry does not run for QR/WalletConnect, not-installed/unavailable errors, or user rejection/cancel.
  - This mimics the manual "Try again" second click path without asking the user to close/reopen the panel.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 46 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 39 tests.

## 2026-07-10 Gate Double Prompt Follow-Up

- User observed Gate appeared to be called twice on the first connect attempt.
- Root cause:
  - The modal-level auto retry was still enabled for Gate.
  - Gate injected adapter already calls `eth_requestAccounts` once and waits for address hydration/events; modal retry can trigger a second Gate prompt/request after the first failure path.
- Fix:
  - `shouldAutoRetryConnect()` now excludes Gate (`wallet.id === "gate"` or `adapterId === "gate"`).
  - Gate can still use the manual Try again button, but the modal will not silently call Gate twice on the first attempt.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 46 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 39 tests.

## 2026-07-10 Gate First Approval Hydration Window

- User reported the first Gate connect still fails with `Gate Wallet did not return an address`, but after page refresh clicking connect succeeds.
- Interpretation:
  - Gate authorization likely succeeds on the first request, but the injected address is hydrated after the previous short settle window.
  - Refresh works because the address is already persisted/exposed by the extension.
- Fix:
  - Do not add a second request/prompt.
  - Increase Gate's injected address wait window:
    - `addressTimeoutMs: 15000`
    - `addressSettleMs: 8000`
  - Gate still uses one `eth_requestAccounts` call, then polls fresh `gatewallet.tron`, `gatewallet.tronLink`, and `gatewallet.tronWeb` paths plus `accountsChanged`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 46 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.

## 2026-07-10 Ledger Default Hardware Support

- User clarified Ledger is a hardware wallet and must be supported by default.
- Previous state:
  - Ledger descriptor/catalog existed by default.
  - The concrete upstream Ledger adapter package was only an optional peer, so integrators had to install it separately.
- Fix:
  - Moved `@tronweb3/tronwallet-adapter-ledger` into `@tron-wallet-kit/client` dependencies.
  - Removed Ledger from client peer dependencies / peer dependency meta.
  - Kept the descriptor as a lazy `tronweb3-bridge` importer so Ledger code only loads when the Ledger adapter is actually used.
  - Updated client regression test to assert Ledger is a default hardware bridge descriptor backed by a dependency, not an optional peer.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 46 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.

## 2026-07-10 Ledger Hardware UI State

- User reported Ledger still showed `NOT INSTALLED`.
- Root cause:
  - UI readiness mapping reused extension semantics: `isAvailable() === false` became `readyState: "notFound"` and badge `NOT INSTALLED`.
  - For a hardware wallet, missing device/app state is not an extension install state.
- Fix:
  - Hardware wallets now remain selectable even when readiness is `notFound`.
  - Hardware badge is `HARDWARE`.
  - Hardware wallets are not counted as installed-first extension wallets, so Ledger does not unexpectedly jump into featured installed slots.
  - Desktop filtering keeps Ledger; mobile browser filtering still hides hardware wallets.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 40 tests.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 46 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.

## 2026-07-10 Featured Installed-First Actionable Wallets

- User requested the featured installed-first list to remove `NOT INSTALLED` entries; QR-capable wallets may replace those slots.
- Fix:
  - `installed-first` now shows installed extension wallets first.
  - Remaining featured slots are filled only by actionable fallbacks.
  - Bucket order is installed extension wallets, then WalletConnect, then QR-capable wallet fallbacks, then hardware wallets such as Ledger, then loading entries.
  - WalletConnect is a required actionable entry in `installed-first` when present; the list capacity expands to keep it after installed wallets instead of slicing it off.
  - Recommended order is only a sort hint inside each bucket; it must not make a non-actionable recommended wallet appear in featured.
  - Pure unavailable extension wallets such as `okx`/`bitget` in a not-installed state stay available in All Wallets but no longer occupy featured installed-first slots.
  - Manual `featuredWallets` remains unchanged and still respects the integrator's explicit ordering/list.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 40 tests.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.

## 2026-07-10 Featured And All Wallets Panel Polish

- User reported the featured footer/status area felt too tall and All Wallets felt like a larger jump from Featured.
- Fix:
  - Reduced idle `.twk-status` spacer from 32px to a compact 12px while keeping danger/error status at 32px.
  - Reduced footer vertical padding so "Powered by TRON Wallet Kit" sits closer to the All wallets trigger.
  - Changed wallet grids to content-sized height with shared max-height, making Featured and All Wallets feel closer in vertical rhythm.
  - All Wallets now participates in the same top/bottom overflow fade system as Featured via `data-scope="all"`.
  - All Wallets renders the same powered-by footer as Featured, still honoring `showPoweredBy: false`, to keep panel height rhythm stable between views.
  - View transition now uses a subtle opacity + vertical/scale motion and respects reduced motion.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 40 tests.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.

## 2026-07-10 Modal View Builder Split

- Returned to the technical-debt list from review.
- First low-risk UI refactor:
  - Extracted modal body/view HTML builders from `packages/ui/src/modal.ts` into `packages/ui/src/modal-views.ts`.
  - Moved connecting/QR/all-wallets/featured markup helpers, wallet icon/name/badge rendering, network/status/footer helpers, active wallet resolution, QR event wallet resolution, and connect error normalization into the view module.
  - Kept controller lifecycle, connect flow state, QR rendering side effects, timers, focus, and scroll overflow logic in `modal.ts`.
  - `modal.ts` line count reduced from about 1230 to about 947; this prepares the next pass to unify `createWalletModal` and `createWalletInline`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 40 tests.

## 2026-07-10 Current Docs Cleanup

- Reviewed the reviewer note about stale client dead code/docs.
- Findings:
  - `walletRegistryFields` and `injectedFallbackFromRegistry` no longer exist in current client source, so there was no live export to remove.
  - Current operational docs still had adapter-era React examples, external-domain-SDK identity wording, and outdated Ledger optional wording.
- Fix:
  - Updated `docs/REACT_USAGE.md` to use `@tron-wallet-kit/client`, `createWalletKit()`, `TronWalletProvider`, and `WalletButton`.
  - Updated website quick start and identity docs to the same kit/provider flow.
  - Updated coder notes and wallet test matrix to describe direct TRX Domains contract identity.
  - Removed external domain SDK naming from current docs; historical specs/reviews remain unchanged.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 40 tests.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 46 tests.

## 2026-07-10 Shared Wallet Modal Controller

- Continued the UI controller debt item.
- Fix:
  - Replaced the duplicated `createWalletModal` and `createWalletInline` controller bodies with a shared internal `createWalletController()`.
  - Public APIs remain unchanged:
    - `createWalletModal()` exposes `open`, `close`, `mount`, `setTheme`, `destroy`.
    - `createWalletInline()` exposes `mount`, `setTheme`, `destroy`.
  - Mode-specific behavior remains explicit:
    - Portal modal owns backdrop close, Escape, focus trap, hidden/open state, focus restore, and `closeOnSelect`.
    - Inline controller mounts into a required target and keeps connect flows visible without portal close behavior.
  - Shared lifecycle now owns availability refresh, all-wallets skeleton timer, search focus preservation, QR URI/copy/render flow, retry handling, wallet selection, and overflow fade updates.
  - `packages/ui/src/modal.ts` line count dropped from about 947 after the view split to about 658.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 40 tests.

## 2026-07-10 Shared UI Wallet Kind Helpers

- Continued the helper-duplication debt item.
- Fix:
  - Added `packages/ui/src/wallet-kinds.ts` as the shared UI helper for WalletConnect, QR-capable wallets, QR fallback wallets, hardware wallets, mobile-capable wallets, and inferred platforms.
  - Updated `wallet-catalog.ts`, `wallet-options.ts`, and `modal-views.ts` to use the shared helpers instead of local QR/hardware/platform checks.
  - Remaining badge text builders still exist in multiple modules, but their underlying wallet classification now comes from one place.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 40 tests.

## 2026-07-10 Shared UI Wallet Badge Builder

- Continued the UI helper cleanup after the shared controller and wallet-kind pass.
- Fix:
  - Added `packages/ui/src/wallet-badges.ts` as the single helper for wallet badge labels and tones.
  - Replaced the duplicated adapter badge, catalog badge, QR fallback badge, and modal fallback badge logic in `wallet-options.ts`, `wallet-catalog.ts`, and `modal-views.ts`.
  - Preserved existing visible labels and tones: QR CODE, INSTALLED, CHECKING, NOT INSTALLED, UNAVAILABLE, TRON, and HARDWARE.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 40 tests.

## 2026-07-10 Runtime Wallet Catalog Boundary

- Continued the single-source wallet metadata cleanup.
- Fix:
  - Made `packages/ui/src/wallet-catalog.ts` catalog-agnostic by removing its import of `core/TRON_WALLET_REGISTRY`.
  - Kept `TRON_WALLET_CATALOG` as an empty deprecated fallback for compatibility; real catalog data now comes from `@tron-wallet-kit/client` descriptors through `buildCatalog()`.
  - Removed `TronWalletRegistryId` from `DefaultAdaptersConfig.wallets`; config now accepts string ids or `WalletDescriptor` objects without depending on the legacy core registry type.
  - Marked `packages/core/src/wallet-registry.ts` exports as legacy/deprecated compatibility data so future UI/client work does not rebuild against it.
  - Updated UI tests to pass a runtime catalog fixture for catalog-specific behavior.
- Verification:
  - `pnpm --filter @tron-wallet-kit/core typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 40 tests.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 46 tests.

## 2026-07-10 Wallet Registry Validation And Klever Staging

- Continued registry hygiene after moving wallet catalog ownership to client descriptors.
- Fix:
  - Added `scripts/validate-wallet-registry.mjs` and root script `pnpm wallets:validate`.
  - Validator checks descriptor id/filename alignment, duplicate ids, registry imports, missing icons, duplicate icon ids, and orphan icons.
  - Updated `scripts/gen-wallet-icons.mjs` to support `.jpg` and `.jpeg` icons in addition to SVG/PNG/WebP.
  - Added `packages/client/src/wallets/entries/klever.ts` as a staged descriptor with `enabled: false`, matching the copied `packages/client/src/wallets/icons/klever.jpg`.
  - Regenerated `packages/client/src/wallets/icons.generated.ts`; generated icon count is now 18.
- Notes:
  - Klever is not shown in default adapters/catalog while disabled. Enable only after provider paths or WalletConnect QA are confirmed.
- Verification:
  - `pnpm icons:wallets` generated 18 icons.
  - `pnpm wallets:validate` passed with 18 descriptors and 18 icons.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 46 tests.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 40 tests.

## 2026-07-10 Klever WalletConnect Catalog Enablement

- Tried the new Klever wallet entry from the descriptor registry.
- Decision:
  - Enabled `klever` as a catalog wallet routed through the singleton WalletConnect adapter.
  - Did not add a guessed injected provider path because public Klever docs found so far confirm TRON wallet support, extension/mobile availability, and Klever Connect SDK docs, but not a TRON injected provider global.
- Fix:
  - Removed `enabled: false` from `packages/client/src/wallets/entries/klever.ts`.
  - Kept `integration: "walletconnect"` and `supportsWalletConnect: true`.
  - Updated `build-adapters.ts` so only the real `walletconnect` descriptor creates a WalletConnect adapter. Wallet-specific WalletConnect entries such as Klever remain catalog-only and route through the existing singleton adapter.
  - Updated `build-catalog.ts` so non-singleton WalletConnect-routed wallets keep their platform transport in the raw catalog, then become QR-routed only when the WalletConnect adapter is present during UI catalog merge.
  - Added client coverage proving Klever does not create a duplicate adapter and resolves to `adapterId: "walletconnect"` with `QR CODE` when WalletConnect is configured.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm wallets:validate` passed with 18 descriptors and 18 icons.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 47 tests.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 40 tests.

## 2026-07-10 WalletConnect QR Session Wallet Metadata

- Fixed WalletConnect-routed wallet UX after QR approval.
- Issues:
  - QR connect could resolve successfully while the modal stayed open on the QR panel.
  - Connected button/account surfaces used the transport adapter metadata, so every WalletConnect-routed wallet displayed the WalletConnect icon instead of the selected wallet icon.
- Fix:
  - `WalletManager.connect()` now carries `ConnectOptions.metadata` into the active session before persistence sanitization.
  - `createWalletModal()` passes selected catalog wallet metadata (`walletId`, `walletName`, `walletIcon`) when connecting through any adapter, including the WalletConnect singleton.
  - QR success now closes the modal with a completed-flow close instead of returning to the QR view.
  - Added `resolveSessionWalletMetadata()` in UI and used it from DOM `createWalletButton()` and React `WalletButton()` so selected wallet icon/name win over transport adapter metadata.
- Verification:
  - `pnpm --filter @tron-wallet-kit/core typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/core test -- --run` passed with 19 tests.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 41 tests.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 47 tests.
  - `pnpm wallets:validate` passed with 18 descriptors and 18 icons.

## 2026-07-10 Stable Balance And Identity Refresh Merge

- Fixed intermittent balance/identity display after connect and account changes.
- Root cause:
  - `refreshBalance()` and `refreshIdentity()` captured the same initial session snapshot and wrote results back asynchronously.
  - Whichever refresh finished last could overwrite fields written by the other refresh, so balance or identity appeared to flicker or disappear.
  - React `WalletButton` also kept local identity/balance state across account changes until the next refresh settled.
- Fix:
  - `refreshBalance()` and `refreshIdentity()` now re-read the current session before writing and only merge into it when adapter, address, and network still match the original refresh target.
  - Refresh context now uses the connected session network and the selected catalog wallet id from `session.metadata.walletId` when present.
  - React `WalletButton` resets local identity and balance state from the current session at the start of each account/network lifecycle.
  - Added a regression test where balance resolves before identity; final session must keep both values.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 48 tests.

## 2026-07-10 First Identity Refresh Retry

- Follow-up fix for identity still being flaky on first connect.
- Root cause:
  - `refreshIdentity()` cached `undefined` results for the full identity cache TTL. If the first TRX Domains lookup returned empty because provider/contract was not ready yet, later refreshes reused the miss and did not retry.
  - The TRX Domains resolver could also keep a rejected contract promise from an early contract load failure.
- Fix:
  - Identity cache now stores successful identities only; misses can be retried.
  - TRX Domains contract promise is cleared when contract creation rejects, allowing later calls to recover.
  - React `WalletButton` now retries initial identity refresh twice with short delays when the first lookup returns no identity.
  - Added regression coverage for a first missing identity result followed by a successful retry.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 49 tests.

## 2026-07-10 RPC-Scoped Identity TronWeb

- Follow-up fix for identity still not appearing reliably on first connect.
- Root cause:
  - TRX Domains identity resolution was allowed to use wallet-injected `tronWeb` and cache that instance as shared state.
  - On first connect, injected provider readiness can lag behind the session, so identity could bind to an unstable provider.
  - The test override path also cached the first override as shared state, revealing the same class of stale TronWeb pinning.
- Fix:
  - `getSharedTronWeb()` now uses a network RPC/fullHost-scoped TronWeb cache for identity.
  - It no longer chooses wallet-injected `tronWeb` for identity resolution; injected provider lookup remains for balance.
  - Test override TronWeb is returned directly and never pinned into shared cache.
  - Added regression coverage proving the first test TronWeb instance is not pinned.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 50 tests.

## 2026-07-10 Reviewer Follow-Up: Balance Fallback And UI Config Gaps

- Closed reviewer follow-up items 3, 4, and 5.
- Balance:
  - Default TRX balance resolver now tries the wallet-specific injected `tronWeb` first, then falls back to RPC-scoped shared TronWeb when the injected balance provider is not ready.
  - Added client coverage for fallback balance lookup through `__tronWalletKitTronWebForTest`.
- UI config:
  - Added theme shortcuts `accent` and `fontFamily` to `ThemeConfig` / `WalletUiConfig`.
  - Added modal lifecycle callbacks `modal.onModalOpen` and `modal.onModalClose`.
  - Exposed resolved UI config from `createWalletKit()` as `kit.uiConfig`.
  - React `WalletButton` now respects `kit.uiConfig.accountPanel.mode`, `maxVisibleTransactions`, and `explorerAccountUrl`, with prop-level overrides.
- Docs/status:
  - Updated theming docs for shortcut merge order.
  - Updated handoff/tracker status to reflect direct-contract identity and completed config knobs.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 51 tests.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 42 tests.
  - `pnpm --filter @tron-wallet-kit/react test -- --run` passed with 3 tests.

## 2026-07-11 Codebase English Text Cleanup

- User clarified the English-only cleanup should apply to the codebase/runtime surface only, not Review/docs material.
- Converted the backward-compatible `vi` UI locale pack to English fallback labels so runtime UI no longer emits Vietnamese copy.
- Updated UI locale tests to assert English output for `locale: "vi"` compatibility mode.
- Rebuilt the browser package and refreshed the example public IIFE snapshots.
- Restored tracked Review documentation changes; Review/docs files may remain Vietnamese by design.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 42 tests.
  - `pnpm --filter @tron-wallet-kit/browser build` passed.

## 2026-07-11 UI/UX Pro Theming Checklist Review

- Re-read `Review/UI_UX_PRO_THEMING_CHECKLIST.md` against the current UI source.
- Findings:
  - Already covered: token-driven portal-safe theme variables, polished light/dark defaults, TRON accent on `tron`, production theme contrast tests, focus rings, touch target minimums, reduced-motion handling, QR skeleton/scan-safe QR background, view-enter animation, no hover shadow, and modular UI source split.
  - Still worth closing: auto theme mode does not listen to live `prefers-color-scheme` changes; contrast tests only cover production presets and do not cover playground presets such as `glass`; some extended presets still use older raw accent values; custom scrollbar polish is not implemented; success/error micro-feedback animation remains basic.
- No code changes were made from this review pass beyond documenting the findings.

## 2026-07-11 All-Zones Skeleton UX Checklist Review

- Read `docs/ALL_ZONES_SKELETON_UX_CHECKLIST.md` and mapped it against current TRON Wallet Kit UI zones.
- Applicability:
  - The primitive idea applies well, but the namespace should stay `twk-*`, not `xwk-*`.
  - Already covered: wallet button identity/balance skeletons, wallet picker loading rows/cards, badge loading reserve, QR frame skeleton, account panel identity/balance skeletons, reduced-motion skeleton disabling.
  - Partially covered: recent transactions have rows but no dedicated fetching skeleton state; QR skeleton exists but does not implement the laser scanline effect; connecting screen uses the approved Reown-style spinner around wallet logo instead of the two-node connection bridge.
  - Not applicable now: transaction preview/confirmation skeleton until the kit owns a transaction preview panel.
- Recommendation: extract reusable `twk-skeleton-*` primitive classes only where they reduce duplication, then close gaps for recent transaction fetching and optional QR scanline polish.

## 2026-07-11 All-Zones Skeleton UX Implementation

- Implemented the low-risk parts of `docs/ALL_ZONES_SKELETON_UX_CHECKLIST.md` in `@tron-wallet-kit/ui`.
- Added reusable skeleton primitive classes under the existing namespace:
  - `twk-skeleton-circle`
  - `twk-skeleton-line`
  - `twk-skeleton-pill`
  - `twk-skeleton-card`
  - `twk-skeleton-button`
  - `twk-skeleton-row`
  - `twk-skeleton-qr`
- Refactored existing wallet button, wallet picker, QR, account identity, and balance loading markup to use the primitive classes while preserving existing sizes and behavior.
- Added `AccountPanelViewModel.transactionsLoading` and recent transaction skeleton rows for account panel/history loading states.
- Kept the approved Reown-style connecting spinner; did not implement the two-node connection bridge.
- Rebuilt and synced browser IIFE snapshots into `examples/public/vendor`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/browser build` timed out after building non-min IIFE, then `pnpm --filter @tron-wallet-kit/browser build:iife:min` passed.

## 2026-07-11 TRON Transaction Pipeline Phase 1

- Added `Review/TRON_TRANSACTION_PIPELINE_SPEC.md` before coding to make the transaction architecture easy to review later.
- Decision:
  - Match TronWeb/tronweb3 naming where practical: `transactionBuilder.sendTrx`, `transactionBuilder.triggerSmartContract`, `signTransaction`, `sendRawTransaction`, `signAndSendTransaction`, `triggerSmartContract`.
  - Keep transaction building in the client/helper layer.
  - Keep wallet-specific signing in adapters:
    - injected wallets sign with injected `tronWeb.trx.sign` / provider request fallback,
    - WalletConnect signs with `tron_signTransaction`,
    - Ledger signs `txID` + `raw_data_hex` and attaches `signature`.
  - Broadcast through shared TronWeb/RPC using `trx.sendRawTransaction`.
- Implemented client transaction runtime:
  - `kit.transactionBuilder.sendTrx(...)`
  - `kit.transactionBuilder.triggerSmartContract(...)`
  - `kit.getTronWeb()`
  - `kit.sendRawTransaction(...)`
  - `kit.signAndSendTransaction(...)`
  - real `kit.triggerSmartContract(...)` build -> sign -> broadcast pipeline
  - `kit.transferTrx(...)` now builds, signs, and broadcasts instead of depending on adapter-specific submit support.
- Updated `react-basic` with a Transactions panel for:
  - building a TRX transfer transaction,
  - signing/sending TRX,
  - building a smart contract transaction,
  - signing/executing a smart contract transaction.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 52 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples build` passed.
  - `pnpm --filter @tron-wallet-kit/client build` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser build` passed and refreshed the example public IIFE bundles.

## 2026-07-11 TRON Transaction Pipeline Review Addendum

- Re-read `Review/TRON_TRANSACTION_PIPELINE_SPEC.md` after the reviewer addendum.
- Closed the Phase 1 gaps that affect the canonical client path:
  - `signTransaction` + kit-side `sendRawTransaction` remains the canonical path for `transferTrx`, `transferTrc20`, and `triggerSmartContract`.
  - Added build-late execution through `signAndSendBuiltTransaction()` so kit-built transactions are created immediately before signing.
  - Added rebuild -> re-sign -> re-broadcast once when broadcast fails with `TRANSACTION_EXPIRATION_ERROR` or an expired-message result.
  - Added broadcast failure detection for `result: false`; failed broadcasts now reject instead of falling back to the unsigned transaction `txID`.
  - Added default contract `feeLimit` of `100_000_000` SUN when omitted, while preserving caller override.
  - Added shared TronWeb configuration via `config.tronWeb.fullHost`, `config.tronWeb.apiKey`, and `config.tronWeb.headers`.
  - `transferTrc20()` now builds via `triggerSmartContract("transfer(address,uint256)")` instead of sending a raw method-hint payload to adapters.
- Remaining scope:
  - Legacy resource/governance helpers still need a Stake 2.0 builder phase before they should be exposed in the playground.
  - `adapter.submitTransaction()` remains available for direct adapter/legacy use, but the kit transaction helpers no longer use it for the main path.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 54 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client build` passed.
  - `pnpm --filter @tron-wallet-kit/examples build` passed.
  - `pnpm --filter @tron-wallet-kit/browser build` passed.

## 2026-07-11 Core Error Codes And UI Error Localization

- Added a professional shared error system in `@tron-wallet-kit/core`:
  - canonical error code definitions with category, severity, retryability, title, and message metadata;
  - expanded wallet/signing/transaction/network/configuration codes including `SIGN_TRANSACTION_FAILED`, `INVALID_TRANSACTION`, `SEND_TRANSACTION_FAILED`, `TRANSACTION_EXPIRATION_ERROR`, `OUT_OF_ENERGY`, `INSUFFICIENT_BALANCE`, `NETWORK_ERROR`, `RATE_LIMITED`, and `CONFIGURATION_ERROR`;
  - `formatWalletError()` for short user-facing UI messages and optional sanitized details;
  - safer `normalizeWalletError()` detection for user rejection, unavailable wallets, dynamic import failures, expired transactions, energy/balance failures, rate limits, and network/RPC failures.
- Added UI language management for errors:
  - `WalletKitLabelPack.errors` / `WalletUiLabels.errors`;
  - deep merge for per-code locale overrides;
  - English runtime catalog for both `en` and compatibility `vi` locale packs.
- Updated connect modal error rendering:
  - controller formats adapter errors before storing UI state;
  - detail panels and featured/all-wallet status render safe formatted messages;
  - dynamic adapter import failures no longer expose Vite module paths or long URLs in the modal.
- Updated `Review/TRON_TRANSACTION_PIPELINE_SPEC.md` with the canonical error/language management section and error code table.
- Verification:
  - `pnpm --filter @tron-wallet-kit/core typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/core test -- --run` passed with 20 tests.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 54 tests.
  - `pnpm --filter @tron-wallet-kit/core build` passed.
  - `pnpm --filter @tron-wallet-kit/ui build` passed.
  - `pnpm --filter @tron-wallet-kit/client build` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples build` passed.
  - `pnpm --filter @tron-wallet-kit/browser build` passed.
  - Source runtime scan `rg -n "[À-ỹ]" packages examples scripts --glob "!**/dist/**" --glob "!**/node_modules/**" --glob "!examples/public/vendor/**"` returned no matches.

## 2026-07-11 React Basic Strict No-Auto-Reconnect Guard

- Investigated intermittent Bitget auto-connect reports in `react-basic` while `autoReconnect={false}` was set.
- Confirmed `react-basic` disables `autoReconnect`, but still uses browser storage with `storageKey="react-basic-session-v2"`, so stale sessions can remain in localStorage.
- Hardened React provider behavior:
  - `TronWalletProvider` now calls `manager.autoReconnect()` only when `kit.manager.config.autoReconnect` is enabled.
  - Added optional `clearStoredSessionOnAutoReconnectDisabled` provider prop for demos/apps that want strict no-autoconnect behavior while still using browser storage.
  - Enabled `clearStoredSessionOnAutoReconnectDisabled` in `examples/react-basic`.
- Added `WalletManager.clearStoredSession()` for explicit cached-session cleanup without disconnecting a current wallet provider.
- Added core regression coverage proving `autoReconnect=false` does not restore and `clearStoredSession()` removes cached sessions.
- Verification:
  - `pnpm --filter @tron-wallet-kit/core typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/core test -- --run` passed with 21 tests.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.

## 2026-07-12 Browser WalletConnect Packaging Split Phase 1

- Audited WalletConnect packaging:
  - `@tron-wallet-kit/adapter-walletconnect` is a TRON Wallet Kit wrapper, but its default factory imports `@tronweb3/walletconnect-tron`.
  - `@tronweb3/walletconnect-tron` pulls `@reown/appkit`, `@walletconnect/sign-client`, `@walletconnect/universal-provider`, and related utilities.
  - The old browser IIFE bundled WalletConnect into the core file because `@tron-wallet-kit/client` statically imported `@tron-wallet-kit/adapter-walletconnect` and `@tron-wallet-kit/browser` re-exported it.
- Implemented Phase 1 split:
  - Added `packages/client/src/adapters/walletconnect-lazy.ts`.
  - `createWalletClient({ walletConnectProjectId })` still registers a WalletConnect-capable adapter, but it is now a lightweight lazy proxy.
  - The lazy proxy first uses `globalThis.TronWalletKitWalletConnect.createWalletConnectAdapter` for CDN/addon usage, then falls back to a dynamic package import for module builds.
  - Removed runtime static WalletConnect import from `packages/client/src/wallets/build-adapters.ts`.
  - Moved `@tron-wallet-kit/adapter-walletconnect` from client dependencies to optional peer dependency.
  - Removed WalletConnect runtime export from the default browser entry.
  - Added `packages/browser/src/walletconnect.ts` as a separate addon entry.
  - Added browser addon build scripts:
    - `tron-wallet-kit.walletconnect.iife.js`
    - `tron-wallet-kit.walletconnect.iife.min.js`
  - Updated HTML/CDN example to include the WalletConnect addon after the core IIFE.
  - Updated Vite example middleware to serve the addon files.
- Browser size result:
  - Core `tron-wallet-kit.iife.min.js` is now `1,277,255` bytes.
  - WalletConnect addon `tron-wallet-kit.walletconnect.iife.min.js` is `2,613,077` bytes.
  - Previous core IIFE min was about `3.89 MB`, so extension-only/browser-core users no longer pay the WalletConnect/Reown cost.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 55 tests.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser build` passed and generated core + WalletConnect addon IIFE bundles.
  - `pnpm install --lockfile-only` passed.
  - `pnpm --filter @tron-wallet-kit/client build` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples build` passed.

## 2026-07-12 Browser WalletConnect Single IIFE Lite Pivot

- Superseded the previous WalletConnect addon split after product decision:
  - keep the easy CDN developer experience with one `tron-wallet-kit.iife.js` / `tron-wallet-kit.iife.min.js` file;
  - avoid the large `@tronweb3/walletconnect-tron` dependency instead of shipping a separate addon.
- Reworked `@tron-wallet-kit/adapter-walletconnect`:
  - removed `@tronweb3/walletconnect-tron`;
  - added direct `@walletconnect/sign-client` usage;
  - implemented a lightweight WalletConnect TRON session wrapper for `connect`, `disconnect`, `checkConnectStatus`, `tron_signMessage`, and `tron_signTransaction`;
  - preserved existing public config fields such as `projectId`, `network`, `relayUrl`, `metadata`, `appMetadata`, `onUri`, and compatibility no-op `allWallets`.
- Reverted browser/client packaging to one bundle:
  - client statically imports `createWalletConnectAdapter` again;
  - browser exports WalletConnect adapter from the default entry;
  - removed `packages/browser/src/walletconnect.ts` and separate WalletConnect IIFE build scripts;
  - removed HTML/CDN addon script tag and Vite addon middleware.
- Browser size result after lite pivot:
  - `packages/browser/dist/tron-wallet-kit.iife.js`: `3,437,478` bytes.
  - `packages/browser/dist/tron-wallet-kit.iife.min.js`: `1,729,753` bytes.
  - This keeps one-file CDN usage while avoiding the previous combined core + WalletConnect addon size.
- Verification:
  - `pnpm install` passed after lockfile dependency update.
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect test -- --run` passed with 7 tests.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 54 tests.
  - `pnpm --filter @tron-wallet-kit/browser build` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.

## 2026-07-12 WalletConnect SignClient Vite Dev Resolution Fix

- Fixed Vite dev import-analysis resolution for the source-alias examples setup:
  - `examples/vite.config.ts` aliases `@tron-wallet-kit/adapter-walletconnect` directly to `packages/adapters/walletconnect/src/index.ts`;
  - Vite resolves bare imports from the example app context, so `@walletconnect/sign-client` also needs to be declared in `examples/package.json`.
- Added `@walletconnect/sign-client` to `examples` dependencies and ran `pnpm install` to create the `examples/node_modules/@walletconnect/sign-client` junction.
- Verification:
  - `pnpm install --lockfile-only` passed.
  - `pnpm install` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples build` passed.

## 2026-07-12 React Basic HTTPS Blank Screen Check

- Investigated `https://127.0.0.1:5174/react-basic/` blank screen after WalletConnect SignClient changes.
- Found the dev server on port `5174` was an old Node process started on `2026-07-10`, before the dependency/link update.
- Restarted the examples HTTPS dev server on port `5174`.
- Verified server responses:
  - `https://127.0.0.1:5174/react-basic/` returns `200 OK`.
  - WalletConnect source now resolves `@walletconnect/sign-client` through Vite prebundle `/node_modules/.vite/deps/@walletconnect_sign-client.js`.
- In-app browser automation cannot open the HTTPS page because the local certificate is self-signed and reports `ERR_CERT_AUTHORITY_INVALID`.
- Verified with Chrome headless plus `--ignore-certificate-errors` that the React app renders successfully:
  - root contains the `React Basic` workspace;
  - wallet button shows `Connect Wallet`;
  - configuration and log panels render;
  - initial log shows `Ready.`.

## 2026-07-12 TronLink First Load Availability Stabilization

- Investigated intermittent TronLink `NOT INSTALLED` on first page load.
- Root cause found in client wallet descriptor:
  - `packages/client/src/wallets/entries/tronlink.ts` overrode the adapter default `checkTimeoutMs` from `5000ms` down to `800ms`;
  - TronLink extension injection can arrive after 800ms on cold page load, so the UI could mark it `notFound` before the provider was injected.
- Fixed descriptor to use `createTronLinkAdapter(config.tronlink)`, preserving adapter default timeout and allowing integrators to override when needed.
- Added TronLink adapter regression test for delayed provider injection shortly after page load.
- Verification:
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test -- --run` passed with 18 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 54 tests.

## 2026-07-12 MathWallet Catalog Addition

- Added MathWallet to the built-in wallet registry with id `math`.
- Used existing `packages/client/src/wallets/icons/math.png`; regenerated `icons.generated.ts`.
- Integration mode is `walletconnect` for now:
  - Math Wallet is shown in catalog/all-wallet UI and routes through the shared WalletConnect adapter when `walletConnectProjectId` is configured;
  - no dedicated injected adapter is enabled yet because Math Wallet TRON extension provider paths still need live QA to avoid generic `tronLink`/`tron` conflicts.
- Updated client tests:
  - built-in descriptor list includes `math`;
  - MathWallet catalog entry has icon metadata and `supportsWalletConnect`;
  - MathWallet does not create a duplicate adapter and resolves to the shared `walletconnect` adapter in UI merge.
- Verification:
  - `pnpm icons:wallets` generated 19 wallet icons.
  - `pnpm wallets:validate` passed with 19 wallet descriptors and 19 icons.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 55 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser build` passed and vendor IIFE files were refreshed.

## 2026-07-12 MathWallet Injected Integration Update

- Re-read `Review/NEW_WALLETS_INTEGRATION_SPEC.md`.
- Updated MathWallet from WalletConnect-routed catalog-only entry to injected integration per spec:
  - `integration: "injected"`;
  - `detect.providerPaths: ["tronLink", "tron"]`;
  - `requestMethods: ["tron_requestAccounts"]`;
  - kept `supportsWalletConnect: true` so UI can still use QR fallback when extension is not detected and WalletConnect is configured.
- Updated client tests:
  - MathWallet is included in the default adapter list without requiring `walletConnectProjectId`;
  - descriptor asserts injected config and request method;
  - added MathWallet connect/signMessage coverage through a TronWeb-compatible injected provider.
- Verification:
  - `pnpm wallets:validate` passed with 19 descriptors and 19 icons.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 55 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser build` passed and vendor IIFE files were refreshed.

## 2026-07-12 MathWallet Injected Detection Hardening

- Read MathWallet TRON docs and the `mathwallet/math-trxjs` samples:
  - official samples use a TronWeb-compatible `window.tronWeb` surface;
  - they do not document a unique extension namespace that can safely distinguish MathWallet from TronLink-family wallets.
- Fixed the built-in MathWallet descriptor to avoid generic `tronLink` / `tron` provider paths.
- Added `getMathWalletInjectedProvider()`:
  - accepts explicit Math namespaces such as `mathwallet`, `mathWallet`, or `MathWallet`;
  - accepts generic `tronLink`, `tron`, or `tronWeb` only when a Math-specific marker/name is present;
  - avoids marking MathWallet installed from another wallet's injected provider.
- Added Math roots to TronLink's known non-TronLink conflict guard so MathWallet-linked providers are not treated as TronLink.
- Updated tests:
  - MathWallet connect/sign coverage now uses a Math namespace instead of generic `tronLink`;
  - added regression coverage proving generic `tronLink` does not make MathWallet available;
  - added TronLink regression coverage for MathWallet-linked `tronLink` globals.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 56 tests.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test -- --run` passed with 19 tests.
  - `pnpm wallets:validate` passed with 19 descriptors and 19 icons.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.

## 2026-07-12 TronLink Availability Fast Path

- Investigated slow TronLink loading after first-load stabilization.
- Root cause:
  - `TronLinkAdapter.waitForProvider()` waited for TIP-6963 discovery to finish before polling legacy globals;
  - when TronLink injects through legacy `window.tronLink`, UI availability could wait up to `checkTimeoutMs` even though the provider was already present or appeared shortly after page load.
- Fixed `waitForProvider()` to run TIP-6963 discovery and legacy polling in parallel:
  - immediate provider still returns synchronously;
  - legacy provider resolves as soon as polling sees it;
  - TIP-6963 provider still works when announced first;
  - timeout behavior remains intact for first-load stability.
- Added regression coverage proving legacy availability does not wait for the TIP-6963 timeout.
- Verification:
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test -- --run` passed with 20 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 56 tests.

## 2026-07-12 Featured Wallet Loading Row Hardening

- Investigated a featured-list visual issue where the first TronLink row rendered as a blank skeleton bar while availability was still loading.
- Updated featured list row rendering so a loading wallet remains identifiable:
  - shows the real wallet icon/name;
  - shows a muted `Checking` badge;
  - avoids full-row blank skeletons in the recommended wallet list.
- Kept skeleton rendering available for card/loading surfaces where explicit skeleton blocks are expected.
- Updated UI regression coverage to assert loading featured wallets remain visible instead of blank.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.

## 2026-07-13 Passive Modal Availability And WalletConnect Return Hardening

- Investigated page-load reports where Bitget/SafePal could be touched before the user opened the connect modal.
- Root cause:
  - `createWalletKit()` mounts the modal root immediately;
  - `createWalletController.mount()` called `refreshAvailability()` even when the modal was hidden;
  - this probed all injected adapters on page load instead of waiting for explicit user interaction.
- Fixed modal mount behavior:
  - hidden modal roots no longer refresh wallet availability on page load;
  - availability refresh still runs when the modal is opened;
  - inline picker mode still refreshes on mount because it is visible UI.
- Hardened pending QR/connect cleanup:
  - `cancelConnectionFlow()` now asks the manager to cancel the pending adapter request;
  - WalletConnect adapter implements `cancelPendingConnection()`.
- Hardened the lightweight WalletConnect adapter:
  - after QR URI emission, `connect()` races `approval()` with polling the SignClient session store;
  - this covers wallets that show scan/approval success while the approval promise is delayed or missed;
  - session address extraction now scans all namespaces, not only `namespaces.tron`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect test -- --run` passed with 7 tests.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 56 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.

## 2026-07-13 Connect First-Click And WalletConnect Cancel Hotfix

- User reported three live issues still present after the previous passive availability change:
  - first connect click could still open Bitget;
  - TronLink stayed `Checking` and then became `NOT INSTALLED` even though it is the primary wallet;
  - WalletConnect approved successfully in the wallet but dapp showed `The request was cancelled in the wallet.`
- Fixed featured modal availability behavior:
  - deferred featured-view availability probes for Bitget and SafePal;
  - these wallets no longer get touched during first open/recommended-list refresh;
  - All wallets can still probe them when the user explicitly enters the full wallet list.
- Fixed TronLink priority detection:
  - removed the overly broad rule that rejected legacy `window.tronLink` just because other TRON wallets were also installed;
  - retained nested/linked-provider conflict guards so TokenPocket/Trust/Math-linked `tronLink` providers are still rejected.
- Fixed WalletConnect false cancellation:
  - removed the adapter-level `connectAttemptId` mismatch rejection after `wallet.connect()` resolves;
  - manager-level pending-flow checks still prevent stale sessions from being accepted after user cancellation.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test -- --run` passed with 20 tests.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect test -- --run` passed with 7 tests.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 56 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.

## 2026-07-13 Bitget And SafePal Passive Installed Markers

- User reported Bitget/SafePal should not remain in `Checking`, and Bitget connect could show `Connection failed`.
- Added side-effect-free installed marker probes:
  - Bitget: checks clear Bitget/BitKeep globals without calling wallet request APIs;
  - SafePal: checks `SafePalHook` / `sfpPlatform` without requiring a ready `tronWeb` surface.
- Updated Bitget descriptor behavior:
  - availability can resolve from marker globals;
  - connect prefers already-injected addresses when present;
  - request order tries `eth_requestAccounts` before `tron_requestAccounts`;
  - delayed/empty address handling has a longer settle window and one retry.
- Updated featured modal availability:
  - Bitget/SafePal no longer stay as `loading` in the recommended list;
  - the UI uses passive marker checks there instead of calling adapter availability probes.
- Added regression coverage for:
  - Bitget marker-only installed detection;
  - Bitget `eth_requestAccounts` address return;
  - SafePal marker-only installed detection.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 58 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.

## 2026-07-13 TronLink Installed Marker Hardening

- User reported TronLink regressed back to `Checking` and then `Not Installed`.
- Root cause:
  - featured modal still depended on `TronLinkAdapter.isAvailable()`;
  - `isAvailable()` waited for a fully resolved provider, so slow TronLink injection could settle false even though the extension marker existed.
- Updated TronLink adapter:
  - `isAvailable()` now first checks side-effect-free installed markers;
  - marker check accepts explicit `isTronLink` providers and ready legacy `tronLink`/`tronWeb` surfaces;
  - existing guards still reject TokenPocket/Trust/Math-linked providers so TronLink does not claim another wallet.
- Added regression coverage proving a ready legacy marker resolves availability immediately.
- Verification:
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test -- --run` passed with 21 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 58 tests.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 43 tests.

## 2026-07-13 TronLink Request-Only Legacy Detection Fix

- User reported TronLink still showed `Not Installed`; the previous marker hardening remained too strict.
- Root cause:
  - the adapter required `ready` / usable `tronWeb` for unmarked legacy `window.tronLink`;
  - real TronLink can expose `window.tronLink.request` first and hydrate `window.tronWeb` only after `tron_requestAccounts`.
- Fixed TronLink detection:
  - unmarked `window.tronLink.request` is now accepted as TronLink when it is not nested/linked to a known non-TronLink wallet namespace;
  - generic `window.tron` that is explicitly not TronLink still blocks false positives;
  - legacy provider hydrates `tronWeb` from `globalThis.tronWeb` again after request approval.
- Added regression coverage for request-only legacy TronLink install/connect.
- Verification:
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test -- --run` passed with 22 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 58 tests.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 43 tests.

## 2026-07-13 Wallet Detection And Connect-Ready Separation

- User requested a structural fix because wallet-specific patches were causing regressions across other wallets.
- Established the adapter contract:
  - `detect()` is side-effect-free and only drives UI list installed/detected state;
  - `connect()` is the on-demand phase that may call wallet request APIs and handle provider/address timing;
  - `isAvailable()` is retained for restore/legacy compatibility but is no longer the UI list source of truth.
- Updated core:
  - added optional `WalletAdapter.detect()`;
  - `WalletManager.connect()` no longer preflights `adapter.isAvailable()` before explicit user connect.
- Updated adapters/UI:
  - injected adapters expose `detect()` from provider paths / marker probes without request calls;
  - TronLink, WalletConnect, bridge, probe, and fallback adapters expose/forward `detect()`;
  - connect modal availability refresh prefers `detect()` and only falls back to `isAvailable()` for legacy adapters.
- Added regression coverage:
  - manager does not call `isAvailable()` before connect;
  - marker-only Bitget/SafePal detection remains separate from connect-ready provider availability;
  - existing TronLink conflict and request-only tests remain locked.
- Updated `Review/ADAPTER_BEHAVIOR_NOTES.md` with the detection vs connect-ready rule.
- Verification:
  - `pnpm --filter @tron-wallet-kit/core typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronwallet-bridge typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/core test -- --run` passed with 22 tests.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 58 tests.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test -- --run` passed with 22 tests.

## 2026-07-13 Wallet Detect Context Binding Hotfix

- User reported all wallets showed `Checking` and installed wallets were not detected after the detect/connect separation.
- Root cause:
  - the connect modal extracted `adapter.detect` / `adapter.isAvailable` into a standalone function and called it without the adapter context;
  - class adapters such as TronLink rely on `this`, so detached method calls throw and UI availability falls back to failed/loading states.
- Fixed modal availability refresh:
  - calls `detectWallet.call(adapter)` so both class methods and closure-based adapters work.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 58 tests.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test -- --run` passed with 22 tests.

## 2026-07-13 Wallet Detection Stability Window

- User reported installed state still flickered: TronLink/Trust could show QR/not installed first and then switch to installed.
- Root cause:
  - wallet globals can hydrate after the modal's first render;
  - a first false detection could trigger WalletConnect QR fallback for wallets that support QR, then a later detection changed the same wallet to installed.
- Updated modal detection behavior:
  - first false detection is not accepted immediately;
  - the modal polls briefly before marking a wallet not found;
  - once a wallet is detected as found in the current modal session, it is not downgraded to not found/QR by later transient false results.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 58 tests.

## 2026-07-13 TronLink Loose UI Detect Marker

- User reported TronLink still went from `Checking` to `Not Installed`.
- Updated TronLink's `detect()` only:
  - UI detection now accepts a bare `window.tronLink` object as installed when it is not nested/linked to a known non-TronLink wallet namespace;
  - this covers TronLink extension states where `request`, `ready`, or `tronWeb` are hydrated later;
  - connect/provider resolution remains separate and still requires the real request/provider path when the user clicks.
- Added regression coverage for `window.tronLink = {}` returning `adapter.detect() === true`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test -- --run` passed with 23 tests.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 58 tests.

## 2026-07-13 Modal Availability Cache Reset On Open

- User reported TronLink still showed `Checking` then `Not Installed`.
- Additional root cause:
  - modal availability state could cache a previous `false`;
  - reopening the modal then skipped the first-detect grace path because the wallet was no longer considered first-time detection.
- Updated modal open behavior:
  - `refreshAvailability({ resetTransient: true })` runs when opening the modal;
  - prior `false` / `loading` states are reset to `loading` and rechecked with the grace window;
  - prior `true` states remain sticky and are not downgraded.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 58 tests.

## 2026-07-13 TronLink TronWeb-Only Detect Marker

- User reported TronLink still showed `Checking` then `Not Installed` after cache reset and loose `tronLink` detection.
- Added another TronLink UI detect marker:
  - if `window.tronWeb` is usable and not linked to a known non-TronLink wallet namespace, `TronLinkAdapter.detect()` returns true;
  - this covers TronLink environments that expose `tronWeb` before `tronLink` or before `tronLink.request`.
- Added regression coverage for:
  - global `tronWeb`-only detection;
  - Trust-linked global `tronWeb` not being claimed as TronLink.
- Verification:
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test -- --run` passed with 25 tests.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 58 tests.

## 2026-07-13 TronLink Bybit Global Conflict Fix

- User provided browser console evidence that Bybit injects provider code around the same time TronLink reports it will overwrite the current TronWeb instance.
- Root cause:
  - TronLink detect/provider rules rejected TronLink if `window.tron` existed and was not marked `isTronLink`;
  - Bybit can own generic `window.tron` while TronLink still owns a separate `window.tronLink`.
- Fixed TronLink rules:
  - a separate `window.tronLink` object is accepted if it is not nested/linked to a known non-TronLink wallet namespace;
  - non-TronLink `window.tron` only blocks the fallback case where TronLink is inferred from `window.tronWeb` alone.
- Added regression coverage for Bybit generic `window.tron` not hiding a separate TronLink provider.
- Updated `Review/ADAPTER_BEHAVIOR_NOTES.md` with the Bybit conflict rule.
- Verification:
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test -- --run` passed with 26 tests.
  - `pnpm --filter @tron-wallet-kit/client test -- --run` passed with 58 tests.

## 2026-07-13 Injected Strategy Migration Start

- Read `Review/WALLET_ADAPTER_ORG_SPEC.md` and aligned the implementation direction:
  - common injected wallets stay kit-owned/direct;
  - `@tronweb3` bridge is reserved for complex transports like Ledger and MetaMask TRON;
  - WalletConnect remains the local lite implementation;
  - detect must stay cheap/side-effect-free and connect quirks must live in wallet strategy code.
- Preserved the previous `tronweb3-bridge-experiment` branch with commit `fd63419` for size comparison only.
- Created migration branch `codex/injected-strategy-migration` from checkpoint `109d17c`.
- Added the first strategy layer:
  - `InjectedStrategy`
  - `InjectedConnectContext`
  - `InjectedHelpers`
  - `standardInjected()`
  - legacy config -> strategy shim
- Converted `createInjectedTronAdapter` from a monolithic flag-driven adapter into a thin strategy orchestrator while keeping backward compatibility for old descriptors.
- Converted initial wallet entries to `injected: standardInjected(...)`:
  - OKX Wallet
  - TokenPocket
  - OneKey
  - Gate Wallet
  - SafePal
  - Bitget Wallet
- Moved first-connect tuning into wallet strategy options:
  - SafePal: wider address settle window and retry;
  - Bitget: TRON-first request order, wider settle window, strict TRON address filtering;
  - Gate: eth request + long address poll settings remain scoped to Gate strategy.
- Updated client test fixtures to use TRON-shaped 34-character base58 addresses so strict TRON address filtering can be tested realistically.
- Removed the explicit Gate special-case from UI modal auto-retry logic; Gate behavior now belongs to its adapter strategy.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` passed with 58 tests.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run --reporter=dot` passed with 43 tests.
- Remaining migration work:
  - move per-wallet provider getters/markers out of `injected/detect.ts` into each `entries/<id>.ts`;
  - convert remaining injected wallets to strategy descriptors;
  - replace `detect` catalog shim with explicit strategy/catalog metadata;
  - implement EIP-6963/rDNS detect priority for TronLink and other wallets;
  - update Trust/Binance desktop behavior per spec so namespace-only objects do not show as TRON installed.

## 2026-07-13 Injected Strategy Migration Follow-Up

- Continued the `Review/WALLET_ADAPTER_ORG_SPEC.md` migration on branch `codex/injected-strategy-migration`.
- Moved wallet-specific injected provider composers and detect markers out of `packages/client/src/injected/detect.ts` into their own wallet entry files:
  - Bitget Wallet
  - Gate Wallet
  - SafePal
  - Guarda
  - FoxWallet
  - Binance Web3 Wallet
  - MathWallet
- Converted remaining simple injected entries to explicit `standardInjected(...)` descriptors:
  - Bybit Wallet
  - Backpack
  - Trust Wallet
- `packages/client/src/injected/detect.ts` is now limited to generic injected helpers and MetaMask probing. This reduces hidden wallet-specific hardcode in shared detect code and keeps per-wallet quirks closer to metadata/strategy.
- Tightened TronLink TIP-6963 discovery:
  - accepts `rdns: "org.tronlink.www"` as the authoritative TronLink provider signal;
  - keeps name fallback only when `rdns` is absent;
  - ignores providers that announce `name: "TronLink"` with a different `rdns`.
- Added TronLink regression coverage for non-TronLink `rdns` announcements.
- Verification:
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test -- --run --reporter=dot` passed with 27 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` passed with 58 tests.
- Remaining migration work:
  - replace the UI/client detect catalog shim with strategy-derived catalog metadata;
  - update Trust/Binance desktop semantics so namespace-only globals do not imply usable TRON injection;
  - decide whether TronLink needs broader EIP-6963 cache/listener support beyond on-demand discovery;
  - continue reducing duplicate metadata between core registry, UI catalog, and client descriptors.

## 2026-07-13 TronLink Detect With Competing Generic Tron Global

- User reported TronLink still showed `Checking` then `Not Installed`.
- Root cause found in `hasGlobalTronLinkDetectMarker()`:
  - when another wallet such as Bybit owns `window.tron`, the detect code returned `false` before checking a separate `window.tronLink` install marker;
  - this broke the UI-only detect case where TronLink has injected a marker but has not hydrated the full request/tronWeb provider yet.
- Fixed the detect order:
  - explicit `window.tron` TronLink marker still wins;
  - explicit/separate `window.tronLink` marker is checked before generic `window.tron` blocks fallback;
  - generic non-TronLink `window.tron` only blocks the weaker `tronWeb`-only fallback path.
- Added regression coverage for:
  - `window.tron` owned by Bybit;
  - `window.tronLink = {}` present as the TronLink install marker;
  - `adapter.detect()` must return true so UI does not downgrade to `Not Installed`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test -- --run --reporter=dot` passed with 28 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` passed with 58 tests.

## 2026-07-13 Strategy-Derived Catalog Metadata + Trust/Binance Strict Detect

- Implemented the next migration step from `Review/WALLET_ADAPTER_ORG_SPEC.md`.
- Added `WalletMetadata.catalog` in core so UI-facing catalog metadata can travel with each adapter instead of relying on UI static catalog hardcode.
- Added descriptor-derived catalog hydration in the client:
  - `buildCatalogItem()` now builds a single catalog item from a wallet descriptor;
  - `buildCatalog()` reuses `buildCatalogItem()`;
  - `buildAdapters()` hydrates adapter metadata with descriptor-derived `catalog` metadata.
- Updated UI wallet mapping:
  - `mapAdapterToWalletOption()` now copies `featured`, `providerPaths`, `conflictMarkers`, `mobileDeepLink`, and `supportsWalletConnect` from `adapter.metadata.catalog`.
- Added descriptor-level `providerPaths` and `conflictMarkers` fields for wallet metadata that may be independent from the actual connect strategy.
- Tightened Trust Wallet detection:
  - namespace-only `window.trustwallet` / empty `trustwallet.tron` no longer marks Trust as installed;
  - Trust is installed only when a usable TRON provider exists.
- Tightened Binance Web3 Wallet detection:
  - namespace-only `window.binancew3w.tron` no longer marks Binance as installed;
  - Binance is installed only when the TRON account API exists.
- Added regression coverage for:
  - descriptor catalog metadata hydration onto adapters;
  - UI option mapping from `adapter.metadata.catalog`;
  - Trust namespace-only false;
  - Trust usable provider true;
  - Binance namespace-only false;
  - Binance usable account API true.
- Verification:
  - `pnpm --filter @tron-wallet-kit/core typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` passed with 63 tests.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run --reporter=dot` passed with 43 tests.

## 2026-07-13 Core Registry + UI Fallback Catalog Cleanup

- Continued the metadata single-source cleanup.
- Replaced the old hardcoded `packages/core/src/wallet-registry.ts` metadata list with an empty compatibility shim:
  - public types/functions still exist for pre-1.0 imports;
  - core no longer duplicates supported wallet catalog metadata;
  - runtime catalog data now lives in client wallet descriptors and `buildCatalog()`.
- Updated UI config so it no longer imports `TRON_WALLET_CATALOG` as the default catalog source:
  - default catalog is now a local empty runtime catalog;
  - `TRON_WALLET_CATALOG` remains exported only for backward compatibility and is still empty.
- Added tests:
  - core registry compatibility shim returns empty results;
  - client descriptor catalog remains the source for TronLink/Trust metadata.
- Verification:
  - `pnpm --filter @tron-wallet-kit/core typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/core test -- --run --reporter=dot` passed with 23 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` passed with 64 tests.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run --reporter=dot` passed with 43 tests.

## 2026-07-13 TronLink 6963 Cached Detect + Modal Async Fallback

- Re-read the updated `Review/WALLET_ADAPTER_ORG_SPEC.md`, especially the new TronLink badge section.
- Root issue addressed:
  - UI preferred `adapter.detect()` over `adapter.isAvailable()`;
  - TronLink `detect()` was synchronous and bare-global based;
  - TIP-6963 discovery lived only in `isAvailable()`, so the authoritative `org.tronlink.www` path was skipped for badges.
- Updated TronLink adapter:
  - starts one-shot 6963 discovery on construction and caches the discovered provider;
  - `detect()` returns true from the cached 6963 provider;
  - `waitForProvider()` uses the cached 6963 provider before/alongside bare globals;
  - discovery now listens/dispatches both `TIP6963:*` and lowercase `eip6963:*`;
  - TIP-6963 connect can use global `tronWeb` when the announced provider does not expose `tronWeb`.
- Updated modal availability:
  - fast `detect()` remains the first path;
  - when `detect()` is false on first render and `isAvailable()` exists, the modal now allows a bounded async fallback during the grace window;
  - this lets TronLink 6963 discovery settle without making all missing wallets wait for long adapter timeouts.
- Added TronLink regression coverage for:
  - cached TIP-6963 discovery making sync `detect()` stable;
  - lowercase `eip6963:*` discovery;
  - TIP-6963 provider without `tronWeb` connecting via global `tronWeb`.
- Spec items still not fully closed:
  - the old `InjectedTronAdapterConfig` flag plumbing remains for backward compatibility;
  - decorator helpers like `withEthRequest` / `withPreferInjectedAddress` are not yet extracted as public composable utilities;
  - a generic shared 6963 registry for all wallets is not implemented yet; current 6963 support is focused on TronLink.
- Verification:
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test -- --run --reporter=dot` passed with 31 tests.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run --reporter=dot` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` passed with 64 tests.
  - `pnpm --filter @tron-wallet-kit/core typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/core test -- --run --reporter=dot` passed with 23 tests.

## 2026-07-13 WALLET_ADAPTER_ORG_SPEC Rerun + Backpack Provider Composer

- Re-read `Review/WALLET_ADAPTER_ORG_SPEC.md` after the latest reviewer additions.
- Confirmed already-implemented items:
  - TronLink remains rank-first while detect uses cached 6963 discovery instead of contested bare globals;
  - Trust desktop extension no longer resolves namespace-only as TRON installed;
  - Binance Web3 no longer resolves namespace-only as TRON installed;
  - client descriptors now drive runtime catalog metadata instead of the old core/UI duplicate fallback lists.
- Closed one remaining per-wallet matrix gap for Backpack:
  - `backpack.tron` can expose `request` without `tronWeb`;
  - `packages/client/src/wallets/entries/backpack.ts` now owns a Backpack-specific provider resolver;
  - the resolver composes the Backpack branch with `globalThis.tronWeb` when needed, keeping the quirk inside the wallet entry instead of the generic adapter.
- Added regression coverage:
  - Backpack can connect when its provider branch only has `request`;
  - Backpack uses the composed global `tronWeb` for `hexAddress` and `signMessage`.
- Spec items still not fully closed:
  - the old `InjectedTronAdapterConfig` flag plumbing remains for backward compatibility;
  - decorator helpers such as `withEthRequest`, `withPreferInjectedAddress`, and `withAddressPoll` are still represented through `standardInjected()` options, not exported composable utilities;
  - shared 6963 registry for every wallet is not implemented yet; current authoritative 6963 handling is focused on TronLink;
  - MathWallet stays marker-gated and does not claim generic `tronLink`, but still needs live extension QA before being promoted in any recommended list.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` passed with 65 tests.

## 2026-07-13 WALLET_ADAPTER_ORG_SPEC Status Addendum

- Updated the end of `Review/WALLET_ADAPTER_ORG_SPEC.md` with an implementation-status addendum for reviewer handoff.
- The addendum clarifies that the older "TronLink checking -> not installed bug is NOT fixed" note is stale:
  - TronLink 6963 cached detect is now implemented;
  - modal first-render async availability fallback is implemented;
  - Backpack request/tronWeb split is implemented;
  - Trust/Binance namespace-only guards remain correct.
- The addendum keeps the remaining gaps visible:
  - shared 6963 registry for all wallets;
  - duplicate legacy flat quirk fields;
  - Trust `providerPaths` cleanup;
  - decorator helper extraction;
  - MathWallet live QA before recommendation.
- No test run was needed because this was a documentation/status update only.

## 2026-07-13 WALLET_ADAPTER_ORG_SPEC Remaining Items Cleanup

- Closed two smaller remaining items from the `WALLET_ADAPTER_ORG_SPEC.md` implementation-status addendum.
- Trust cleanup:
  - removed misleading desktop `providerPaths` (`trustwallet.tronLink`, `trustwallet.tron`) from `packages/client/src/wallets/entries/trust.ts`;
  - Trust now keeps `supportsWalletConnect:true`, `conflictMarkers:["trustwallet"]`, and provider-based injected detect only.
- Built-in duplicate flat quirk cleanup:
  - removed dead flat descriptor duplicates from Bitget, Gate, SafePal, and MathWallet entries;
  - quirks now live in `injected: standardInjected({ ... })` for those built-ins;
  - legacy descriptor/config fields remain in types and adapter plumbing for backward compatibility.
- Updated client tests so they assert the new Trust catalog behavior and no longer expect MathWallet flat `requestMethods`.
- Updated the spec addendum to mark Trust path cleanup and built-in duplicate flat-field reduction as done.
- Remaining items:
  - shared cached 6963 registry for all rdns-announcing wallets;
  - public decorator helper extraction;
  - decision on whether/when to remove legacy flat config fields;
  - MathWallet live QA before recommendation.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` passed with 65 tests.

## 2026-07-13 Shared 6963 Registry + Connect-Path Fixes

- Implemented the next items from the latest `Review/WALLET_ADAPTER_ORG_SPEC.md` tail section.
- Shared injected 6963 installed-signal registry:
  - added `packages/client/src/injected/eip6963.ts`;
  - dispatches/listens on both `eip6963:*` and `TIP6963:*`;
  - caches announced rdns values per session;
  - `standardInjected({ rdns })` checks rdns before marker/provider fallback;
  - wired rdns for OKX, Bitget, Gate, SafePal, OneKey, Bybit, Backpack, and Guarda;
  - intentionally did not wire Trust/Binance rdns to avoid desktop EVM-only / namespace-only false installed states.
- SafePal connect fix:
  - `packages/client/src/wallets/entries/safepal.ts` now prefers `SafePalHook.tronWeb` and `SafePalHook.defaultAddress`;
  - only treats a default address as selected when it has a non-empty base58 address;
  - avoids being blocked by a foreign global `window.tronWeb.defaultAddress = { base58:false, hex:false }`.
- TronLink TIP-1193 connect fix:
  - `packages/adapters/tronlink/src/index.ts` no longer uses a known foreign global `window.tronWeb` for TIP-1193 fallback data;
  - address comes from the TIP-1193 request result;
  - when no TronLink-owned tronWeb exists, `hexAddress` is omitted and network resolves from explicit fallback/mainnet.
- Updated `Review/WALLET_ADAPTER_ORG_SPEC.md` follow-up implementation status accordingly.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` passed with 67 tests.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-tronlink test -- --run --reporter=dot` passed with 32 tests.

## 2026-07-13 Wallet Card Skeleton + Initial Scrollbar UI Fix

- Fixed wallet card loading skeleton shape:
  - wallet icon skeletons now use `twk-skeleton-icon`;
  - `twk-skeleton-icon` uses `border-radius: var(--twk-wallet-icon-radius)`;
  - card/list wallet icon skeletons now match the real rectangular wallet icon shape instead of rendering as circles.
- Fixed initial modal scrollbar:
  - `.twk-body` now uses `overflow: hidden`;
  - wallet lists continue to manage scroll through `.twk-wallet-grid`, preserving overflow/fade behavior while avoiding the unwanted body scrollbar on initial render.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run --reporter=dot` passed with 43 tests.

## 2026-07-13 Injected Strategy Decorator Helpers

- Continued the remaining `WALLET_ADAPTER_ORG_SPEC.md` cleanup after the shared 6963 and UI fixes.
- Added public composable injected strategy helpers in `packages/client/src/adapters/injected-strategy.ts`:
  - `withRequestMethods`;
  - `withEthRequest`;
  - `withPreferInjectedAddress`;
  - `withAddressPoll`;
  - `withSignMode`;
  - `withMarker`;
  - `withEvents`;
  - `withAcquireAddressDefaults`.
- Exported the helpers through `packages/client/src/index.ts` for third-party wallet descriptors.
- Refactored built-in wallet entries to use decorators:
  - Bitget: request methods, address poll, prefer injected address;
  - Gate: eth request, address poll, account-change events;
  - SafePal: address poll and sign mode;
  - Backpack and MathWallet: TRON request method.
- Kept Gate off `withPreferInjectedAddress` because regression coverage expects request result to win when request and defaultAddress are both available.
- Updated `Review/WALLET_ADAPTER_ORG_SPEC.md` so decorator helpers are no longer marked as not extracted.
- Decided legacy flat injected config policy:
  - keep fields for backward compatibility;
  - mark flat quirk fields as deprecated in `packages/client/src/types.ts` and `packages/client/src/wallets/types.ts`;
  - built-ins should continue using strategy/decorator composition instead of flat fields.
- Decided TronLink 6963 ownership:
  - keep TronLink 6963 discovery inside `@tron-wallet-kit/adapter-tronlink`;
  - do not import client shared 6963 registry into the adapter package because that would create a dependency direction problem;
  - client shared 6963 registry remains for injected descriptor strategies.
- Remaining items:
  - optional broader decorator migration for purely-standard entries;
  - MathWallet live QA before recommendation.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` passed with 67 tests.

## 2026-07-13 QR Panel Error/Footer Spacing

- Adjusted WalletConnect/QR panel spacing:
  - QR view now renders with `twk-qr-detail`;
  - QR error uses `data-scope="qr"` so spacing can be tuned independently from other errors;
  - QR error gets a larger top margin and top padding so it no longer touches the copy/retry buttons;
  - QR detail gets extra bottom padding so WalletConnect QR loading/action footer feels less cramped.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run --reporter=dot` passed with 43 tests.

## 2026-07-13 WalletConnect Namespace Compatibility Fix

- Checked `Review/WALLET_ADAPTER_ORG_SPEC.md` against current code and found the WalletConnect namespace fix was still open.
- Updated `packages/adapters/walletconnect/src/index.ts`:
  - default `requiredNamespaces.tron.methods` now includes only `tron_signTransaction`;
  - `requiredNamespaces.tron.events` is empty by default;
  - `optionalNamespaces.tron.methods` now carries `tron_signMessage`;
  - `optionalNamespaces.tron.events` now carries `accountsChanged` and `chainChanged`;
  - WalletConnect errors are no longer treated as user cancellation merely because the message contains `rejected`.
- Added regression coverage in `packages/adapters/walletconnect/test/walletconnect.test.ts` for:
  - minimal required namespace + optional capabilities;
  - namespace-style proposal rejection not being mislabeled as `USER_REJECTED`.
- Updated `Review/WALLET_ADAPTER_ORG_SPEC.md` follow-up status so reviewers see the WalletConnect namespace fix as done.
- Verification:
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect test -- --run --reporter=dot` passed with 9 tests.

## 2026-07-14 Release Readiness P0 Beta Prep

- Read `Review/RELEASE_READINESS.md` and corrected release target back to `0.1.0-beta.0` because this project has not been published to npm yet.
- Added release foundation:
  - root `LICENSE` with MIT text;
  - root `README.md`;
  - root `CHANGELOG.md`;
  - `.github/workflows/ci.yml`;
  - per-package README files for npm package pages.
- Bumped root, public packages, examples, and website package versions from `0.0.0` to `0.1.0-beta.0`.
- Added package `publishConfig` for public packages:
  - `access: "public"`;
  - `provenance: true`;
  - `tag: "beta"`.
- Removed the hardcoded WalletConnect project ID from docs and examples:
  - React example now reads `import.meta.env.VITE_WALLETCONNECT_PROJECT_ID`;
  - HTML/CDN example now reads `window.WALLETCONNECT_PROJECT_ID`;
  - docs now use `YOUR_WALLETCONNECT_PROJECT_ID`.
- Changed WalletConnect default network from Nile to mainnet and updated related docs snippets.
- Remaining before beta publish:
  - live QA WalletConnect QR with Bitget and Klever.
- Verification:
  - `pnpm install --lockfile-only` passed.
  - `pnpm lint` passed.
  - `pnpm typecheck` passed.
  - `pnpm test` passed.
  - `pnpm build` passed.
  - `pnpm publish --dry-run --no-git-checks --tag beta` passed for all 10 public packages.
  - `pnpm pack` check for `@tron-wallet-kit/client` confirmed internal `workspace:*` dependencies are rewritten to `0.1.0-beta.0` in the tarball.

## 2026-07-15 Release Readiness Checklist Sync

- Continued `Review/RELEASE_READINESS.md` work after confirming this project has never been published to npm.
- Synced the top-level P0 checklist in `Review/RELEASE_READINESS.md` with the implementation status:
  - root README, LICENSE, CI, versions, package READMEs, publish metadata, secret cleanup, local gates, browser IIFE size, and WalletConnect mainnet default are now marked done;
  - real-wallet QA items remain open.
- Updated `Review/RELEASE_CHECKLIST.md`:
  - first public release checklist now marks completed package manager, names, workspace layout, build formats, IIFE global, React/Next APIs, adapter contracts, theme tokens, HTML/CDN docs, React docs, all-in-one IIFE decision, and changelog process;
  - wallet icon brand/source licensing remains open;
  - added release readiness gates for full local checks, publish dry-run, browser IIFE size, and public package manifest audit.
- Ran a manifest audit across all 10 public packages:
  - `version`, `exports`, `types`, `files`, `sideEffects`, `publishConfig`, and README are present.
- Recorded browser IIFE sizes:
  - `tron-wallet-kit.iife.js`: 3,459,117 bytes;
  - `tron-wallet-kit.iife.min.js`: 1,737,483 bytes.
- Ran `pnpm pack --pack-destination $env:TEMP/twk-release-size-check` for all 10 public packages:
  - adapter-tronlink: 24,550 bytes;
  - adapter-tronwallet-bridge: 11,844 bytes;
  - adapter-walletconnect: 21,612 bytes;
  - auth: 4,074 bytes;
  - browser: 4,057,415 bytes;
  - client: 193,361 bytes;
  - core: 59,911 bytes;
  - next: 2,354 bytes;
  - react: 23,129 bytes;
  - ui: 175,653 bytes.

## 2026-07-15 Wallet Availability Soft Transition

- Improved connect modal wallet detection UX so the first detect pass does not make wallet cards jump abruptly.
- Updated featured wallet selection:
  - ranked featured slots remain stable during detection;
  - unavailable featured wallets stay visible instead of being removed immediately;
  - unavailable wallets can fade/disable in place, which avoids grid/list reflow.
- Updated wallet list sorting:
  - while any wallet is still `loading`, the UI keeps source order instead of re-sorting available wallets to the top;
  - after detection settles, installed wallets and QR-capable fallbacks sort to the top in one batched render;
  - explicit hidden-unavailable flows can still filter/sort.
- Added `data-availability` to wallet row/card markup for `available`, `checking`, `unavailable`, and `qr` states.
- Added token-driven CSS fade for unavailable wallets:
  - reduced opacity;
  - subtle grayscale;
  - no layout-affecting animation.
- Batched availability re-renders in the modal controller to avoid one DOM rebuild per wallet detect result.
- Added a subtle wallet item settle animation for the final order update, with reduced-motion support.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run --reporter=dot` passed with 43 tests.

## 2026-07-15 TRON Native ConnectKit Gap Review

- Added `Review/TRON_NATIVE_CONNECTKIT_GAP_REVIEW.md` as a reviewer-facing product gap review.
- The document positions TRON Wallet Kit as a TRON-native ConnectKit/RainbowKit-style UX layer rather than a direct replacement for `tronweb3/tronwallet-adapter`.
- It summarizes current strengths and the main gaps:
  - public live demo;
  - deeper docs/DX;
  - transaction playground;
  - wallet QA gating;
  - theme builder;
  - SSR/Next polish;
  - release trust layer.
- It proposes phased roadmap A-F from current beta stabilization through public demo, docs, wallet QA, beta publish, and stable readiness.
- It includes reviewer questions and a proposed definition of done for claiming the ConnectKit/RainbowKit-style positioning.

## 2026-07-15 ConnectKit Masterplan Phase 1 API

- Started implementing `Review/TRON_CONNECTKIT_MASTERPLAN.md` in the SDK layer.
- Added ConnectKit-style React API in `@tron-wallet-kit/react`:
  - `getDefaultConfig`;
  - `TronKitProvider`;
  - `TronConnectButton`;
  - `useTronKit`;
  - `useTronAccount`;
  - `useTronConnect`;
  - `useTronDisconnect`;
  - `useTronBalance`;
  - `useSignMessage`;
  - `useTrxName`;
  - `useConnectModal`;
  - `useAccountModal`.
- Added theme factories:
  - `lightTheme`;
  - `darkTheme`;
  - shortcut support for `accentColor`, `accentColorForeground`, `borderRadius`, `fontStack`, and direct token overrides.
- Kept old React API intact:
  - `TronWalletProvider`;
  - `WalletButton`;
  - `ConnectModal`;
  - `AccountPanel`.
- Updated `WalletButton` with optional controlled account-panel state so `useAccountModal` and `TronConnectButton` can open the account modal without breaking uncontrolled legacy usage.
- Updated docs/readmes:
  - root README now uses `getDefaultConfig` + `TronKitProvider` + `TronConnectButton`;
  - expanded README content for `react`, `client`, `core`, `ui`, `browser`, `next`, `auth`, `adapter-tronlink`, `adapter-walletconnect`, and `adapter-tronwallet-bridge`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react test -- --run --reporter=dot` passed with 5 tests.
- Remaining:
  - finish Phase 2 snapshot tests for generated token maps;
  - expand hook tests beyond SSR/static render;
  - add transaction/read helper docs once API names are finalized;
  - later run full workspace `lint/typecheck/test/build` before release commit.

## 2026-07-15 ConnectKit Masterplan Phase 2 Theme Follow-up

- Committed the beta release/docs/ConnectKit API snapshot:
  - commit `adb9e80` (`chore: prepare beta release docs and connectkit api`).
- Started website dev server:
  - `http://127.0.0.1:5174/`;
  - verified HTTP status `200`.
- Added system-adaptive provider theme support:
  - `theme={{ light: lightTheme(), dark: darkTheme() }}`;
  - provider theme now flows to React-rendered `WalletButton`, `ConnectModal`, and `AccountPanel`;
  - local `theme` props still override provider theme.
- Updated `examples/react-basic` to use the masterplan API:
  - `getDefaultConfig`;
  - `TronKitProvider`;
  - `TronConnectButton`;
  - `useTronKit`.
- Updated root and React README with adaptive theme snippets.
- Updated `Review/TRON_CONNECTKIT_MASTERPLAN.md` implementation status.
- Verification:
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react test -- --run --reporter=dot` passed with 6 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react build` passed.
  - `pnpm --filter @tron-wallet-kit/website build` passed.
  - `http://127.0.0.1:5174/docs/frameworks/react` returned HTTP 200.
- Remaining:
  - run live QA on `examples/react-basic`;
  - add deeper hook state-transition tests;
  - add token-map snapshot tests;
  - run full workspace gates before the next release commit.

## 2026-07-15 Local HTTPS Server Split

- Standardized local dev ports:
  - examples/test app: `https://127.0.0.1:5174/react-basic/`;
  - website/docs: `https://127.0.0.1:5175/`.
- Updated examples dev scripts to use `--strictPort` so the test app cannot silently move to another port.
- Updated website dev script to port `5175` with `--strictPort`.
- Added `@vitejs/plugin-basic-ssl` to the website dev dependencies and VitePress config so website dev runs over HTTPS.
- Restarted local servers:
  - examples listener: `127.0.0.1:5174`;
  - website listener: `127.0.0.1:5175`.
- Verification:
  - `curl.exe -k -I https://127.0.0.1:5174/react-basic/` returned `HTTP/1.1 200 OK`.
  - `curl.exe -k -I https://127.0.0.1:5175/` returned `HTTP/1.1 200 OK`.

## 2026-07-15 ConnectKit Masterplan Hook And Theme Tests

- Continued `Review/TRON_CONNECTKIT_MASTERPLAN.md` SDK work.
- Added React contract tests for hook-driven custom UI:
  - connects a mock wallet with no default built-in adapters;
  - renders account status/address/name/balance from hooks;
  - verifies `useTronConnect`, `useTronDisconnect`, `useConnectModal`, `useAccountModal`, and `useSignMessage` are available for custom UI.
- Added theme factory token-map tests:
  - `lightTheme` shortcut output for accent, accent foreground, radius, and color scheme;
  - `darkTheme` shortcut output for accent, radius, token override, and color scheme.
- Updated `Review/TRON_CONNECTKIT_MASTERPLAN.md` implementation status:
  - Phase 1 now records hook-driven UI test coverage;
  - Phase 2 now records token-map test coverage.
- Verification:
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react test -- --run --reporter=dot` passed with 8 tests.
  - `pnpm --filter @tron-wallet-kit/react build` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
- Remaining:
  - live QA `useAccountModal` / account panel behavior in `react-basic`;
  - add a visible custom-connect-UI example if needed for docs/demo;
  - align future website theme builder output with the factory input shape;
  - run full workspace gates before the next commit.

## 2026-07-15 Theme Builder API Alignment

- Continued Phase 2 theming work from `Review/TRON_CONNECTKIT_MASTERPLAN.md`.
- Updated `website/.vitepress/theme/components/ThemeBuilder.vue`:
  - added `accentColorForeground`;
  - changed default mode to `system`;
  - export snippet now matches the React SDK API;
  - fixed light mode exports `lightTheme({...})`;
  - fixed dark mode exports `darkTheme({...})`;
  - system mode exports `{ light: lightTheme({...}), dark: darkTheme({...}) }` for `TronKitProvider`.
- Updated website theming docs to describe the three output modes.
- Updated local demo links to the split HTTPS setup:
  - example app: `https://127.0.0.1:5174/react-basic/`;
  - website remains `https://127.0.0.1:5175/`.
- Updated `Review/TRON_CONNECTKIT_MASTERPLAN.md` implementation status.
- Verification:
  - `pnpm --filter @tron-wallet-kit/website build` passed.
  - `curl.exe -k -I https://127.0.0.1:5175/docs/configuration/theming` returned `HTTP/1.1 200 OK`.
  - `curl.exe -k -I https://127.0.0.1:5174/react-basic/` returned `HTTP/1.1 200 OK`.
- Remaining:
  - browser visual QA of the theme builder;
  - live QA of account modal behavior in `react-basic`;
  - full workspace gates before commit.

## 2026-07-15 Vanilla Button Account Panel Fix

- Reviewed `Review/VANILLA_BUTTON_ACCOUNT_PANEL_FIX.md` and confirmed the diagnosis:
  - `packages/ui/src/button.ts` always opened the connect modal on click;
  - connected label ignored `session.account.domain` / `displayName`;
  - vanilla/browser button had no account-detail refresh hook for balance/identity.
- Updated `packages/ui/src/button.ts`:
  - disconnected click still opens the connect modal;
  - connected click toggles the account panel instead of reopening the connect modal;
  - account panel supports copy address, address QR, recent transaction/history view, and disconnect;
  - connected label now prefers `domain ?? displayName ?? shortenAddress(address)`;
  - button can show balance skeleton while account details refresh.
- Updated `packages/client/src/kit.ts`:
  - extracted `refreshBalance` and `refreshIdentity` as reusable functions;
  - passed `refreshAccountDetails` into the vanilla button controller;
  - respected `connectButton.showBalance`.
- Rebuilt browser IIFE and copied the new bundles into `examples/public/vendor`:
  - `tron-wallet-kit.iife.js`;
  - `tron-wallet-kit.iife.min.js`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run --reporter=dot` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/browser build` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
- Remaining:
  - live QA in the website Playground / HTML-CDN flow after connecting a real wallet;
  - verify `.trx` and balance appear once refresh completes;
  - verify connected click opens account panel in vanilla/browser button.

## 2026-07-15 Connected Button Chevron And Website Identity Config

- Re-checked the reviewer feedback against the real code paths instead of assuming one button implementation:
  - React `TronConnectButton` already uses `WalletButton` and account panel logic;
  - vanilla/browser `createWalletButton` is the controller used by website Vue/VitePress demos;
  - website demos were missing `identity: { enabled: true }`.
- Updated React `TronConnectButton`:
  - connected chevron now defaults to visible even when `chainStatus="none"`;
  - `chainStatus` remains available for future network-display behavior but no longer hides the account dropdown affordance.
- Added regression coverage:
  - connected `TronConnectButton` with hidden chain status still renders the chevron;
  - connected button still shows session identity/display name and TRX balance.
- Updated website demo/playground config:
  - enabled `.trx` identity resolution in `ConnectDemo.vue`;
  - enabled `.trx` identity resolution in `PlaygroundWidget.vue`;
  - kept `connectButton.showBalance: true`.
- Rebuilt browser IIFE and copied refreshed bundles to:
  - `examples/public/vendor/`;
  - `website/public/`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react test -- --run --reporter=dot` passed with 9 tests.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run --reporter=dot` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/browser typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser build` passed.
  - `pnpm --filter @tron-wallet-kit/website build` passed.
- Remaining:
  - live QA on `https://127.0.0.1:5174/react-basic/` after connecting a real wallet;
  - live QA on `https://127.0.0.1:5175/` / playground to confirm `.trx`, balance, chevron, and connected-click account panel behavior.

## 2026-07-15 Account Panel Modal Default And Wallet Layout Type Cleanup

- Fixed connected-button behavior across React and browser/vanilla paths:
  - React `WalletButton` now handles connected account-panel toggling before any custom `onClick`, so connected clicks do not fall back into connect flow.
  - Browser/vanilla `createWalletButton` now supports `accountPanelMode`.
  - `createWalletKit` passes `ui.accountPanel.mode` into the browser/vanilla button.
  - Default remains modal because `resolveWalletUiConfig().accountPanel.mode` defaults to `modal`; only `inline` maps to dropdown.
- Fixed website playground runtime:
  - kept `.trx` identity enabled;
  - changed the IIFE cache key so the website reloads the updated bundle instead of an older cached script.
- Cleaned SDK type mismatch:
  - removed `"grid"` from `WalletListLayout`;
  - removed `"grid"` alias handling in config and modal view normalization;
  - updated tests to use `"card"`.
- Mobile sheet breakpoint:
  - raised modal/sheet breakpoint from `420px` to `480px` to cover large phones.
- Rebuilt browser IIFE and copied refreshed bundles to:
  - `examples/public/vendor/`;
  - `website/public/`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run --reporter=dot` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/react test -- --run --reporter=dot` passed with 9 tests.
  - `pnpm --filter @tron-wallet-kit/browser build` passed.
  - `pnpm --filter @tron-wallet-kit/website build` passed.
  - `curl.exe -k -I https://127.0.0.1:5174/react-basic/` returned `HTTP/1.1 200 OK`.
  - `curl.exe -k -I https://127.0.0.1:5175/` returned `HTTP/1.1 200 OK`.
- Remaining:
  - live browser QA with a real connected wallet to confirm account panel opens as modal on React Basic and website playground;
  - live website `.trx` check after connecting an address with reverse identity.

## 2026-07-15 Connected Click Regression And Identity Rate Limit Guard

- Followed up on the connected-button regression introduced around `Review/VANILLA_BUTTON_ACCOUNT_PANEL_FIX.md`.
- React button:
  - synchronized account-panel mode resolution across render, body-lock/focus, and keyboard-trap effects;
  - default mode now consistently follows `kit.uiConfig.accountPanel.mode`, which defaults to `modal`.
- Client identity refresh:
  - added in-flight de-duplication per `network:address`, so concurrent `refreshIdentity()` calls share one resolver request;
  - added rate-limit cooldown when resolver errors include `429`, `Too Many Requests`, or `rate limit`;
  - kept normal missing identity results uncached so a later retry can still resolve a newly available `.trx`;
  - clears identity in-flight and cooldown maps on `kit.destroy()`.
- Added client tests:
  - concurrent identity refreshes call the resolver once;
  - rate-limited identity refresh enters cooldown and avoids immediate duplicate calls.
- Rebuilt browser IIFE and copied refreshed bundles to:
  - `examples/public/vendor/`;
  - `website/public/`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` passed with 69 tests.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react test -- --run --reporter=dot` passed with 9 tests.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run --reporter=dot` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser build` passed.
  - `pnpm --filter @tron-wallet-kit/website build` passed.
  - `curl.exe -k -I https://127.0.0.1:5174/react-basic/` returned `HTTP/1.1 200 OK`.
  - `curl.exe -k -I https://127.0.0.1:5175/` returned `HTTP/1.1 200 OK`.
- Remaining:
  - live QA: after connecting, click the connected button and confirm account panel opens as modal, not the connect wallet modal;
  - live QA: `.trx` should stop spamming Trongrid under repeated renders; if Trongrid already rate-limited the browser/IP, wait for cooldown or test with a TronGrid API key.

## 2026-07-15 Connected Flow Guards And WalletConnect Project ID Defaults

- Fixed follow-up connected flow regressions:
  - React `WalletButton` connected clicks now stop propagation/default before toggling the account panel, so a connected click cannot fall through to the connect modal branch.
  - Browser/vanilla `createWalletButton` connected clicks now apply the same event guard before toggling the account panel.
  - `createWalletModal.open()` now refreshes wallet availability only when transitioning from hidden to visible, avoiding in-modal state resets while a connecting/QR panel is already open.
- Filled WalletConnect project ID fallback `a4109c95d50e5c136cdafaf9fc44c105` in:
  - React Basic example;
  - HTML CDN example;
  - website connect demo;
  - website playground;
  - website theme builder.
- Theme builder flow:
  - uses the same WalletConnect project ID fallback;
  - sets `modal.closeOnSelect: false` so selecting/connecting a wallet does not immediately collapse back to the wallet list during preview flows;
  - bumped the browser bundle cache key for local QA.
- Rebuilt browser IIFE and copied refreshed bundles to:
  - `examples/public/vendor/`;
  - `website/public/`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react test -- --run --reporter=dot` passed with 9 tests.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run --reporter=dot` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` passed with 69 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/browser build` passed.
  - `pnpm --filter @tron-wallet-kit/website build` passed.
  - `curl.exe -k -I https://127.0.0.1:5174/react-basic/` returned `HTTP/1.1 200 OK`.
  - `curl.exe -k -I https://127.0.0.1:5175/` returned `HTTP/1.1 200 OK`.
- Remaining:
  - live QA with a real connected wallet is still required because the regression depends on wallet extension state;
  - if a tab keeps showing the old connected-click behavior, hard refresh the React Basic and website tabs to invalidate cached dev/IIFE bundles.

## 2026-07-15 React Basic Connected Click Live Session Guard

- Followed up after live QA still showed `react-basic` connected click reopening the connect flow.
- Hardened React `WalletButton` click handling:
  - reads `kit.manager.getSession()` at click-time;
  - uses that live session for copy/account-panel branching;
  - prevents stale React render/event closures from falling through to `kit.openModal()` while the manager is already connected.
- Removed the default `AccountModalContext` controlled-state path from `WalletButton`:
  - `WalletButton` now uses local open state by default;
  - it only becomes controlled when an integrator explicitly passes `accountPanelOpen`;
  - this prevents provider/context re-renders from resetting the connected button flow back to the connect modal.
- Follow-up hardening:
  - removed the default `setAccountModalOpen` side effect from `WalletButton.setAccountOpen`;
  - `TronConnectButton` now forwards account panel state to context only when `accountPanelOpen` is explicitly controlled;
  - this prevents a connected button click from re-rendering the whole provider tree and clearing the visible connected state.
- Restarted the examples HTTPS dev server on `5174`:
  - old listener was stopped;
  - new listener is active on `127.0.0.1:5174`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react test -- --run --reporter=dot` passed with 9 tests.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `curl.exe -k -I https://127.0.0.1:5174/react-basic/` returned `HTTP/1.1 200 OK`.
  - confirmed Vite serves the new React source containing `accountOpen = props.accountPanelOpen ?? uncontrolledAccountOpen` and `liveSession = kit.manager.getSession()`.
  - confirmed Vite serves the follow-up source where default `setAccountOpen` only calls `setUncontrolledAccountOpen` and does not call `setAccountModalOpen`.
- Remaining:
  - live QA with the actual wallet extension: after connected, clicking the connect button should open the account panel modal and must not reopen the wallet list.

## 2026-07-15 Theme Builder Connected Flow Fix

- Fixed website theme builder preview flow:
  - the preview connect button now uses the real `createWalletButton` controller instead of static `createWalletButtonHtml`;
  - the button is mounted against the same kit manager and modal controller as the preview modal;
  - after wallet connect succeeds, the modal closes and the button re-renders to connected state;
  - clicking the connected preview button now opens the account panel through the real button controller.
- Extended `createWalletButton` controller options:
  - added `size`;
  - added `variant`;
  - controller render passes both through to `createWalletButtonHtml`.
- Theme builder modal behavior:
  - changed preview modal `closeOnSelect` back to `true`, because a successful connect should return control to the connect button/account button state.
- Rebuilt and copied browser IIFE bundles to:
  - `examples/public/vendor/`;
  - `website/public/`.
- Restarted website dev server:
  - `https://127.0.0.1:5175/` is active.
- Verification:
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/ui test -- --run --reporter=dot` passed with 43 tests.
  - `pnpm --filter @tron-wallet-kit/website build` passed.
  - `pnpm --filter @tron-wallet-kit/browser build` passed.
  - `curl.exe -k -I https://127.0.0.1:5175/` returned `HTTP/1.1 200 OK`.
  - `curl.exe -k -I https://127.0.0.1:5174/react-basic/` returned `HTTP/1.1 200 OK`.
- Remaining:
  - live QA with a real extension wallet in the theme builder: connect should close the connecting panel and update the preview button to connected.

## 2026-07-15 Theme Builder Mobile Sheet And Inline Account Panel

- Fixed theme builder mobile preview behavior:
  - mobile preview connect modal is forced to dock as a bottom sheet inside the phone frame;
  - mobile `modalmount` now covers the full phone frame instead of only the area below the preview button;
  - preview button stays on its own layer above the mobile modal mount.
- Follow-up for blank mobile preview:
  - forced the mobile phone frame to use block layout instead of flex for the overlay layer;
  - gave mobile `modalmount`, nested `.twk-root`, and `.twk-overlay` explicit absolute `inset: 0`, width, height, and min-height;
  - kept the preview button on a higher z-index layer while the modal layer fills the full phone screen.
- Fixed mobile account panel behavior:
  - when the theme builder device mode is `mobile`, the preview connect button uses `accountPanelMode: "dropdown"`;
  - this keeps account panel inline inside the preview instead of opening a second modal/popup over an already inline/mobile modal preview.
- Follow-up for account panel presentation:
  - theme builder preview button now uses `accountPanelMode: "dropdown"` on both desktop and mobile so account panel does not open as a popup modal in the preview;
  - mobile dropdown panel is positioned absolute below the button so it no longer pushes/jumps the button position;
  - mobile modal sheet override now forces the rendered `.twk-modal` display box inside the phone frame.
- Follow-up for button jump:
  - theme builder `.tbx-btnwrap` now has stable `min-height` and `position: relative`;
  - dropdown account panel is absolutely positioned under the button for both desktop and mobile preview;
  - this prevents account panel open/close from changing the button wrapper height and moving the connected button.
- Follow-up for mobile bottom-sheet account panel:
  - mobile preview now overrides the account panel to bottom-sheet positioning regardless of dropdown/modal mode;
  - mobile `.tbx-btnwrap` and nested `.twk-root` are static so the panel anchors to the phone frame instead of the button wrapper;
  - mobile account panel uses `bottom: 0`, full-width, top-rounded sheet styling and no longer pushes the button.
- Follow-up for address QR sub-view:
  - theme-builder preview overrides dropdown header hiding for `data-twk-account-view="address-qr"` and `tx-history`;
  - back and close controls now remain visible in QR/history sub-views even though the normal account summary dropdown hides its header.
- Follow-up for broken QR header layout:
  - corrected the theme-builder QR/history header override to restore the kit's flex header layout;
  - back/title/close now use `display: flex`, centered header main area, and original spacing instead of a raw grid override.
- Verification:
  - `pnpm --filter @tron-wallet-kit/website build` passed.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `curl.exe -k -I https://127.0.0.1:5175/` returned `HTTP/1.1 200 OK`.
- Remaining:
  - visual QA in the live theme builder mobile mode to confirm the sheet is visually docked to the bottom and connected account panel stays inline.

## 2026-07-15 Website Docs Route And API Alignment

- Audited VitePress docs against current kit APIs and route behavior.
- Renamed the public no-build browser docs route:
  - old route file `website/docs/frameworks/html-cdn.md` removed;
  - new route file `website/docs/frameworks/cdn-iife.md` added;
  - internal website links now point to `/docs/frameworks/cdn-iife` to avoid `html` slug rewrite confusion.
- Added missing docs pages already referenced by sidebar:
  - `website/docs/configuration/wallet-list.md`;
  - `website/docs/api/errors.md`.
- Updated docs to match current kit configuration:
  - `connect-button.md` now documents React `accountPanelMode` and vanilla `ui.accountPanel.mode`;
  - `client.md` now documents current `WalletKit` modal/session helpers, transaction helpers, and canonical `functionSelector` usage;
  - `quick-start.md`, `vanilla.md`, and `introduction.md` now reference the CDN / IIFE route and use clean ASCII copy.
- Verification:
  - `rg -n "html-cdn|/docs/frameworks/html|HTML / CDN|\.html" website -g "*.md" -g "*.ts" -g "*.vue"` returned no matches;
  - `pnpm --filter @tron-wallet-kit/website build` passed;
  - `curl.exe -k -I https://127.0.0.1:5175/docs/frameworks/cdn-iife` returned `HTTP/1.1 200 OK`.
- Remaining:
  - root-level `docs/HTML_CDN_USAGE.md` still uses the legacy title, but it is not a VitePress route; revisit when cleaning legacy docs.

## 2026-07-16 XRPL Kit App Metadata Parity Proposal

- Audited `C:\Users\PC\OneDrive\Develop\VibeCode\xrplWalletKit` for app metadata patterns.
- Key XRPL pattern:
  - `metadata: { name, description, url, icons }` is the preferred config;
  - legacy aliases `appName`, `appDescription`, `appUrl`, `appIcons` remain supported;
  - normalized metadata flows into WalletConnect/AppKit.
- TRON Kit current gap:
  - public config primarily exposes `appName`;
  - WalletConnect adapter has `appMetadata`, but client does not resolve/pass a first-class app metadata object centrally.
- Added proposal file:
  - `Review/APP_METADATA_AND_XRPL_PARITY_PROPOSAL.md`.
- Recommended next implementation:
  - add `WalletKitAppMetadata`;
  - add metadata resolver in client;
  - pass normalized metadata to WalletConnect;
  - keep `appName` and alias fields for compatibility;
  - update React/browser examples and docs to prefer `metadata`.

## 2026-07-16 App Metadata Implementation

- Implemented first-class app metadata support:
  - added `WalletKitAppMetadata` in core;
  - added `metadata`, `appDescription`, `appUrl`, and `appIcons` compatibility fields to manager/client config;
  - `WalletManager` now falls back to `metadata.name` when `appName` is not provided.
- Added client metadata resolver:
  - `packages/client/src/app-metadata.ts`;
  - resolution order matches proposal: metadata fields first, legacy aliases second, safe defaults last.
- WalletConnect metadata flow:
  - `createDefaultAdapters()` resolves metadata once;
  - `buildAdapters()` passes normalized metadata to the WalletConnect adapter as `appMetadata`;
  - WalletConnect adapter/factory types now use `WalletKitAppMetadata`;
  - SignClient init receives the dApp `name`, `description`, `url`, and `icons`.
- React integration:
  - `getDefaultConfig()` now accepts metadata-only config;
  - `appName` remains supported as a shorthand alias.
- Docs updated:
  - root README;
  - `packages/client/README.md`;
  - `packages/browser/README.md`;
  - website quick start, client API, WalletConnect, React/Next/Vanilla/CDN guides;
  - added `website/docs/configuration/app-metadata.md`;
  - sidebar now includes Configuration -> App metadata.
- Verification:
  - `pnpm --filter @tron-wallet-kit/core typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` passed with 71 tests.
  - `pnpm --filter @tron-wallet-kit/react typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/react test -- --run --reporter=dot` passed with 9 tests.
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/adapter-walletconnect test -- --run --reporter=dot` passed with 10 tests.
  - `pnpm --filter @tron-wallet-kit/website build` passed.
  - `curl.exe -k -I https://127.0.0.1:5175/docs/configuration/app-metadata` returned `HTTP/1.1 200 OK`.
- Remaining:
  - examples still use `appName` in a few local test/demo configs; they continue to work as alias, but can be migrated in a later docs/examples cleanup.

## 2026-07-16 App Metadata Follow-up

- Continued `Review/APP_METADATA_AND_XRPL_PARITY_PROPOSAL.md`.
- Completed remaining Phase 2 / P2 docs work:
  - `examples/react-basic` now uses `metadata` in `getDefaultConfig`;
  - `examples/html-cdn` now passes `metadata` to `createBrowserKit`;
  - `packages/react/README.md` and `packages/next/README.md` now teach `metadata` first;
  - `packages/core/README.md` documents `WalletKitAppMetadata` and direct `WalletManager` usage;
  - `packages/ui/README.md` documents catalog-agnostic UI and clarifies metadata belongs in client/react;
  - `packages/auth/README.md` documents using the same metadata for Sign-In with TRON prompts.
- Rerun checks:
  - `rg -n "appName:|appDescription:|appUrl:|appIcons:" examples packages/react/README.md packages/next/README.md packages/core/README.md packages/ui/README.md packages/auth/README.md packages/client/README.md packages/browser/README.md README.md website -g "*.md" -g "*.ts" -g "*.tsx" -g "*.html"` returned no matches.
  - `pnpm --filter @tron-wallet-kit/examples typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/auth typecheck` passed.

## 2026-07-16 XRPL Parity Upgrade Plan Review

- Read new backlog spec:
  - `Review/XRPL_PARITY_UPGRADE_PLAN.md`.
- Main conclusions:
  - TRON Kit is already ahead of XRPL on React hooks, default config, theme factories, token-driven theming, theme presets, transaction runtime, CI, and mobile bottom-sheet baseline.
  - XRPL still has useful features to port selectively:
    - transaction preview resolver before wallet prompts;
    - durable transaction history store for recent transactions;
    - higher-level auth adapter/controller state machine;
    - broader docs;
    - static quality gates with `knip`, `jscpd`, and `dependency-cruiser`;
    - larger mobile bottom-sheet breakpoint.
- Suggested implementation order from the spec:
  - P1.1 transaction preview;
  - P1.2 transaction store;
  - P1.3 auth adapter/controller;
  - P2 docs;
  - P2 quality gates and breakpoint;
  - optional Vue/Nuxt docs/examples later.

## 2026-07-16 XRPL Parity P1.1 Transaction Preview Runtime

- Committed baseline before implementation:
  - commit `51eaa30` (`chore: checkpoint app metadata and parity docs`).
- Implemented first step of `Review/XRPL_PARITY_UPGRADE_PLAN.md` P1.1:
  - added `WalletTransactionPreview`;
  - added `TransactionPreviewResolver`;
  - added `transactionPreview` to `WalletClientConfig`;
  - wired preview resolution before `manager.signTransaction()` in the client transaction runtime.
- Added default preview builders for:
  - `transferTrx`;
  - `transferTrc20`;
  - `triggerSmartContract`;
  - raw fallback transactions.
- Added client regression coverage:
  - preview resolver runs before signing;
  - resolver receives TRON-native default summaries for TRX transfer and smart-contract call.
- Docs updated:
  - `packages/client/README.md`;
  - `website/docs/api/client.md`;
  - `website/docs/transactions/overview.md`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` passed with 72 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
- Remaining:
  - build kit-owned confirmation UI/modal surface on top of the runtime hook;
  - proceed to P1.2 durable transaction history store.

## 2026-07-16 XRPL Parity P1.2 Transaction History Store

- Implemented `Review/XRPL_PARITY_UPGRADE_PLAN.md` P1.2:
  - added `WalletTransactionStore` in core;
  - added `WALLET_TRANSACTION_STORAGE_VERSION`;
  - added `WalletTransactionStoreOptions`;
  - wired `WalletManager` to hydrate recent transactions per `account + network`;
  - persisted transaction changes after add/update;
  - kept existing synchronous `addTransaction`, `updateTransaction`, and `getTransactions` APIs intact.
- Store behavior:
  - caps entries with `transactionStore.max`;
  - marks stale `submitted` entries as `unknown` after `transactionStore.staleSubmittedMs`;
  - uses the same `WalletStorage` abstraction as sessions;
  - account panel already reads `manager.getTransactions()`, so restored transactions flow into the Recent Transactions UI.
- Docs updated:
  - `packages/core/README.md`;
  - `packages/client/README.md`;
  - `website/docs/transactions/overview.md`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/core typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/core test -- --run --reporter=dot` passed with 25 tests.
  - `pnpm --filter @tron-wallet-kit/client typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` passed with 72 tests.
- Remaining:
  - proceed to P1.3 auth adapter/controller.

## 2026-07-16 XRPL Parity P1.3 Auth Controller

- Implemented `Review/XRPL_PARITY_UPGRADE_PLAN.md` P1.3 first layer:
  - added `createTronAuthenticationAdapter`;
  - added `createWalletAuth`;
  - added auth state machine types: `unauthenticated`, `loading`, `authenticated`, `error`;
  - kept existing SIWT message/verify primitives intact.
- Controller behavior:
  - requires an active `WalletManager` session;
  - calls adapter `getNonce`;
  - builds or delegates message creation;
  - signs through `manager.signMessage`;
  - verifies through adapter `verify`;
  - exposes `getState`, `signIn`, `signOut`, and `subscribe`.
- Docs updated:
  - `packages/auth/README.md`;
  - `website/docs/auth/sign-in-with-tron.md`.
- Verification:
  - `pnpm --filter @tron-wallet-kit/auth typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/auth test -- --run --reporter=dot` passed with 3 tests.
  - `pnpm --filter @tron-wallet-kit/auth build` passed.
  - `pnpm --filter @tron-wallet-kit/website build` passed.
- Remaining:
  - wire optional sign-in step into connect modal when an auth adapter is provided;
  - add custom backend and Next.js auth docs if needed.

## 2026-07-16 XRPL Parity P2.4 Docs Breadth Pass

- Started `Review/XRPL_PARITY_UPGRADE_PLAN.md` P2.4 docs breadth work.
- Added Advanced docs:
  - `website/docs/advanced/headless.md`;
  - `website/docs/advanced/events-hooks.md`;
  - `website/docs/advanced/bundle-performance.md`.
- Added guide:
  - `website/docs/guides/going-live.md`.
- Expanded API reference:
  - `website/docs/api/manager.md`;
  - `website/docs/api/modal-toast.md`.
- Updated VitePress sidebar to expose the new pages.
- Verification:
  - `pnpm --filter @tron-wallet-kit/website build` passed.
- Remaining:
  - deeper per-wallet adapter pages;
  - optional use-case pages;
  - deeper Next.js/auth backend guides.

## 2026-07-16 XRPL Parity P2.5 Quality Gates And P2.6 Breakpoint

- Implemented `Review/XRPL_PARITY_UPGRADE_PLAN.md` P2.5:
  - added `knip.json`;
  - added `.jscpd.json`;
  - added `.dependency-cruiser.cjs`;
  - added root scripts `quality:knip`, `quality:jscpd`, `quality:deps`, and `check:quality`;
  - added CI `Quality gates` step running `pnpm check:quality`.
- Gate behavior:
  - dependency-cruiser checks runtime circular dependencies;
  - jscpd checks duplicate code against the configured threshold;
  - knip currently runs with `--no-exit-code` as a baseline report because the repo has existing unused/dead-code findings to clean separately.
- Implemented P2.6:
  - raised UI mobile bottom-sheet breakpoint from `480px` to `640px`.
- Verification:
  - `pnpm check:quality` passed.
  - `pnpm --filter @tron-wallet-kit/ui typecheck` passed.
  - `pnpm --filter @tron-wallet-kit/website build` passed.
- Remaining:
  - clean knip baseline findings and make it blocking later;
  - optional Vue/Nuxt docs/examples remain deferred.
