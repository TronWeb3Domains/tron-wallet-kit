# TRON Wallet Kit — "ConnectKit/RainbowKit for TRON" Master Spec & Phase Plan

Date: 2026-07-15
Status: implementation spec (supersedes the open questions in `TRON_NATIVE_CONNECTKIT_GAP_REVIEW.md`).

## 0. Positioning (locked)

TRON Wallet Kit is **not** a competitor to `tronweb3/tronwallet-adapter` at the adapter-standard
layer. It is a **product-grade wallet UX + DX kit for TRON dApps** — "ConnectKit/RainbowKit, but
TRON-native." We win on: a beautiful connect/account experience, dead-simple integration, smooth
UX, and great docs/demo — **not** on the longest wallet list.

Consequences that must hold across every phase:

- Keep `tronweb3/tronwallet-adapter` as the foundation for heavy/protocol wallets (Ledger, MetaMask
  bridge). Never reimplement the adapter standard.
- Ship a **migration path from `tronwallet-adapter`** (adopt existing users, don't fight them).
- The moat is **DX ergonomics + polish**, specified in §2. Treat it as product, not sugar.

## 1. Ownership split

| Workstream | Owner | Notes |
|---|---|---|
| SDK: API surface, hooks, theming API, tx helpers, SIWT, wallet gating, bundle diet, SSR | **Codex (coder)** | All `packages/*` code + tests. |
| **Website, docs content, live demo page, theme builder UI** | **Claude (Cowork)** | Prioritized here per request — broader coverage + better UI. Built under `website/` + demo app. |
| Live device QA (real wallets, real tx) | **You (Redstone)** | Sign-off gates in `RELEASE_READINESS.md`. |

Claude delivers the `website/` VitePress content, the deployed demo page, and the interactive
theme-builder page. Codex delivers the SDK primitives those pages consume. The two integrate at the
public API surface in §2 — so §2 must land before the demo/docs can be finalized.

---

## 2. DX North-Star (the product moat) — SDK spec

Design goal: **a React dApp integrates in ~3 lines and it looks great with zero config**, exactly
like RainbowKit. Everything below is the target public surface; it should **wrap the existing
`createWalletKit` / `@tron-wallet-kit/client`**, not replace the core.

### 2.1 Minimal config + provider + button (React)

```tsx
import { getDefaultConfig, TronKitProvider, TronConnectButton } from "@tron-wallet-kit/react";

const config = getDefaultConfig({
  appName: "My TRON dApp",
  walletConnectProjectId: import.meta.env.VITE_WC_PROJECT_ID, // optional; WC hidden if absent
  network: "mainnet",            // "mainnet" | "shasta" | "nile"
});

export function App() {
  return (
    <TronKitProvider config={config} theme={lightTheme()}>
      <TronConnectButton />
      <YourApp />
    </TronKitProvider>
  );
}
```

- `getDefaultConfig()` returns a config with **sensible defaults**: featured wallets, installed-first
  ordering, recent-wallet memory, `.trx` identity on, balance on, English locale.
- `TronConnectButton` mirrors RainbowKit's `ConnectButton`: shows "Connect Wallet" → after connect
  shows avatar/`.trx` name/short address + balance; opens the account modal on click. Must accept
  props: `label`, `showBalance`, `accountStatus` ("full" | "avatar" | "address"), `chainStatus`.
- Vanilla/HTML entry stays `createTronWalletKit({...})` returning the existing `WalletKit` object
  (`openModal/closeModal/disconnect/getSession/...`).

### 2.2 React hooks (wagmi/RainbowKit-style)

Ship these from `@tron-wallet-kit/react`. Each is a thin subscription over the core manager/session.

```ts
useTronAccount()   // { address, hexAddress, isConnected, isConnecting, status, walletId, network }
useTronConnect()   // { connect(walletId?), connectors, isPending, error }
useTronDisconnect()// { disconnect }
useTronBalance({ address? })   // { data, isLoading, refetch }  (TRX + optional TRC20 later)
useSignMessage()   // { signMessage(message), isPending, data, error }
useTrxName({ address? })       // { name, avatar, isLoading }  — .trx identity (ENS-equivalent)
useConnectModal()  // { openConnectModal, connectModalOpen }
useAccountModal()  // { openAccountModal, accountModalOpen }
useTronKit()       // low-level: the underlying WalletKit instance/config
```

Acceptance: a dApp can build a fully custom connect UI **using only hooks** (no default modal), the
way wagmi allows. The default `TronConnectButton`/modal are built on the same hooks.

### 2.3 Theming API (RainbowKit-style, on top of the `--twk-*` tokens)

Do **not** force developers to learn CSS variables first. Provide theme factories:

```ts
import { lightTheme, darkTheme } from "@tron-wallet-kit/react";

const theme = lightTheme({
  accentColor: "#0988f0",
  accentColorForeground: "#ffffff",
  borderRadius: "medium",      // "none" | "small" | "medium" | "large"
  fontStack: "rounded",        // "system" | "rounded"
});

// system-adaptive:
<TronKitProvider theme={{ light: lightTheme(), dark: darkTheme() }}>
```

- Theme factories return a resolved `--twk-*` token map; the interactive theme builder (Claude, §7)
  is just a UI that produces the same object + a copy-paste snippet.
- Keep `themeName` presets ("tron", etc.) working; factories layer on top.

### 2.4 Sign-In With TRON (SIWT) — first-class auth

Elevate `@tron-wallet-kit/auth` to a RainbowKit-style authentication adapter:

```ts
import { createTronAuthenticationAdapter } from "@tron-wallet-kit/auth";

const authAdapter = createTronAuthenticationAdapter({
  getNonce: async () => (await fetch("/nonce")).text(),
  createMessage: ({ nonce, address }) => buildSiwtMessage({ nonce, address, domain, uri }),
  verify: async ({ message, signature }) => (await postJson("/verify", { message, signature })).ok,
  signOut: async () => { await fetch("/logout"); },
});

<TronKitProvider config={config} authenticationAdapter={authAdapter}>
```

- Modal shows a "Sign in" step after connect when an auth adapter is present (authenticated /
  unauthenticated / loading states), like RainbowKit.
- Provide a documented default SIWT message format (domain, address, statement, uri, nonce, issuedAt).

### 2.5 Error / empty / edge states as product

These are first-class, not afterthoughts. Every state must have designed copy + visual:

- No wallet installed → CTA to install / show QR fallback.
- Connecting / approve-in-wallet / rejected / timed out.
- Wrong network / unsupported network (offer switch when possible).
- WC "cancelled in wallet" surfaced with the real cause (namespace) in a dev-only detail.
- Locked wallet / no account.
- All copy flows through the i18n label system (no raw stack/module strings ever shown).

### 2.6 Bundle budget (make CDN drop-in credible)

Current browser IIFE min is **1.74 MB** — too heavy for a "drop-in" story (RainbowKit/ConnectKit
are ~hundreds of kB). Budgets:

- React path (`core + ui + react`, tree-shaken, **WC lazy-loaded**): target **≤ 150 kB gzip**.
- WalletConnect + its transport: **dynamically imported** only when the user picks a WC wallet.
- Adapters (`tronweb3` bridge for Ledger/MetaMask): **lazy `import()`** already — keep out of the base.
- Ship two IIFE builds: **`lite`** (injected + WC lazy, target ≤ 250 kB min) and **`full`**.
- Record sizes in CI and fail if a budget regresses.

### 2.7 Migration guide from `tronwallet-adapter`

A code-level shim + doc so existing dApps switch with minimal churn: map common
`tronwallet-adapter` usage (adapters list, `select`, `connect`, `signTransaction`) to the kit's
config + hooks. This reinforces "we sit on top, we don't replace."

---

## 3. Transaction helpers (SDK spec)

Build → sign → broadcast, uniform across injected / WC / Ledger (never rely on
`contract.method().send()` as the primary path).

- `kit.transferTrx / transferTrc10 / transferTrc20 / triggerSmartContract` (exist — verify + test).
- `kit.transactionBuilder.*` (build only), `signTransaction`, `sendRawTransaction`,
  `signAndSendTransaction` (exist — verify).
- Read helpers: `getTransaction(hash)`, `getTransactionInfo(hash)`, account resources
  (bandwidth/energy), balance. Add if missing.
- All errors use `WalletKitError`; UI panels never break on a failed tx.
- Governance/resource writes (freeze/vote/delegate) are **P2**, not beta-blocking.

Acceptance: one real end-to-end TRX transfer via **TronLink**, and one via a **WC wallet**, on
mainnet; a smart-contract `triggerSmartContract` example (e.g. a test contract / domain purchase).

---

## 4. Wallet QA matrix & gating (SDK spec)

Three support levels surfaced in the catalog:

- `live` — verified with the real wallet; shown by default.
- `beta` — expected to work, needs more QA; shown but flagged.
- `qa`/`hidden` — descriptor exists, **off by default**.

Beta `live` target: TronLink, TokenPocket, OKX, Bitget, WalletConnect (Klever + Bitget QR verified),
Trust via correct path (desktop = WC). `beta`: MetaMask (bridge), Binance Web3 (if real TRON path
confirmed). `qa/hidden`: FoxWallet, MathWallet, imToken, Coin98, Backpack sign-path, Ledger (until
real-device QA). The public modal must never claim an unverified wallet is ready. Evidence maps to
`WALLET_ADAPTER_ORG_SPEC.md` detect/connect matrix.

---

## 5. SSR / Next safety (SDK spec)

- No top-level `window`/`document`/`navigator`/provider access in any React/Next entry.
- Detection runs only on the client; provide `"use client"` guidance + a Next App Router example.
- Acceptance: Next example builds and server-renders without throwing; docs mark client boundaries.

---

## 6. Website & Docs — **Claude-owned** (priority)

Built under `website/` (VitePress). Claude authors content + custom components; Codex only exposes
the public API the snippets use. Information architecture:

- **Home**: one-liner positioning, live connect button demo embed, "3-line" snippet, links to demo.
- **Getting started**: React, Next (SSR), vanilla TS, HTML/CDN — each copy-paste runnable.
- **Core concepts**: config (`getDefaultConfig`), provider, connect button, hooks reference.
- **Theming**: token model, theme factories, + link to the **Theme Builder** page.
- **Wallets**: catalog with support levels, platforms, detect/connect notes, status-badge meanings.
- **WalletConnect**: obtaining/injecting `projectId`, network, mobile QR flow.
- **Identity**: `.trx` name/avatar resolution and the account panel.
- **Transactions**: build → sign → broadcast, read helpers, error handling.
- **SIWT**: authentication adapter guide.
- **Troubleshooting**: namespace collision / "not installed" vs "unavailable" / WC "cancelled in
  wallet" / Gate HTTPS injection / first-connect / TronGrid rate limits / mobile vs in-app browser.
- **Migration** from `tronwallet-adapter`.
- **Contributing a wallet** (Path A PR / Path B external package) from `WALLET_ADAPTER_ORG_SPEC`.
- **API reference** (typedoc-generated from public types).

Acceptance: a developer integrates React and HTML/CDN **without reading source**; a wallet vendor
can add an adapter from the docs alone.

## 7. Live demo + Theme builder — **Claude-owned**

- **Demo/playground** (deploy target `trxdomains.xyz`): connect modal, theme + accent/font switch,
  featured + All Wallets, WC QR, account panel (copy address, address QR, TRX balance, `.trx`
  identity), sign message, send TRX on testnet, tx toast/feedback, and a **live code snippet** of the
  current config. No real WC projectId in source (use env). Keep `react-basic` as the local QA
  playground; the deployed demo is the polished public one.
- **Theme builder**: pick `themeName`, adjust accent/radius/font, toggle light/dark, preview modal
  states (featured / All Wallets / QR / connecting / account panel), and **export** the config object
  + `--twk-*` overrides. Emits exactly the object `lightTheme()/darkTheme()` accept.

Acceptance: a reviewer opens **one URL** and understands why the kit exists; all primary UI states
visible without reading code; a developer customizes the theme visually and pastes the export into a
React app and it works.

---

## 8. Phase plan

Each phase lists Owner and exit criteria. Phases 1–2 (API + theming) unblock the Claude
website/demo work, so they run first; docs/demo build in parallel once the API is frozen.

### Phase 0 — Freeze beta base — Owner: Codex  *(mostly done)*
Commit release-readiness + UI transition work; `pnpm lint/typecheck/test/build` green; record state
in `PROJECT_MEMORY.md`. Exit: clean beta branch, dry-run publish passes.

### Phase 1 — DX API surface + hooks — Owner: Codex  **(unblocks docs/demo)**
Implement §2.1 `getDefaultConfig` + `TronKitProvider` + `TronConnectButton`; §2.2 hooks;
`useConnectModal`/`useAccountModal`. Exit: 3-line React integration works with zero theme config;
a fully custom connect UI can be built from hooks only; unit tests for hooks/provider.

### Phase 2 — Theming API — Owner: Codex
Implement §2.3 `lightTheme()/darkTheme()` factories + presets over `--twk-*`; system light/dark.
Exit: factory output drives the modal; snapshot tests for token maps.

---

## 2026-07-15 Implementation Status

### Phase 1 — SDK API Surface

Status: partially implemented.

Done:

- Added `getDefaultConfig` in `@tron-wallet-kit/react`.
- Added `TronKitProvider` wrapper over the existing `TronWalletProvider`.
- Added `TronConnectButton` wrapper over the existing wallet button renderer.
- Added hooks:
  - `useTronKit`;
  - `useTronAccount`;
  - `useTronConnect`;
  - `useTronDisconnect`;
  - `useTronBalance`;
  - `useSignMessage`;
  - `useTrxName`;
  - `useConnectModal`;
  - `useAccountModal`.
- Kept backward-compatible exports:
  - `TronWalletProvider`;
  - `WalletButton`;
  - `ConnectModal`;
  - `AccountPanel`.
- Added React tests for `getDefaultConfig`, `TronKitProvider`, `TronConnectButton`, and theme factory exports.
- Added a hook-driven custom UI test covering:
  - `useTronAccount`;
  - `useTronConnect`;
  - `useTronDisconnect`;
  - `useTronBalance`;
  - `useSignMessage`;
  - `useTrxName`;
  - `useConnectModal`;
  - `useAccountModal`.

Verified:

- `pnpm --filter @tron-wallet-kit/react typecheck`
- `pnpm --filter @tron-wallet-kit/react test -- --run --reporter=dot` (8 tests)
- `pnpm --filter @tron-wallet-kit/react build`
- `pnpm --filter @tron-wallet-kit/examples typecheck`

Still open:

- Confirm `useAccountModal` behavior in the live `react-basic` example.
- Add custom-connect-UI example that uses hooks only.
- `examples/react-basic` now uses `getDefaultConfig`, `TronKitProvider`, `TronConnectButton`, and `useTronKit` while retaining its existing QA controls.

### Phase 2 — Theme Factories

Status: started.

Done:

- Added `lightTheme()` and `darkTheme()` factory exports.
- Added shortcuts:
  - `accentColor`;
  - `accentColorForeground`;
  - `borderRadius`;
  - `fontStack`;
  - direct `tokens` override.
- Added provider support for system-adaptive themes:
  - `theme={{ light: lightTheme(), dark: darkTheme() }}`;
  - React-rendered `WalletButton`, `ConnectModal`, and `AccountPanel` inherit the provider theme unless a local `theme` prop is passed.
- Added token-map tests for `lightTheme()` / `darkTheme()` shortcut output via `createThemeStyleProperties`.
- Updated the website theme builder to export snippets that match the SDK API:
  - fixed light mode: `lightTheme({...})`;
  - fixed dark mode: `darkTheme({...})`;
  - system mode: `{ light: lightTheme({...}), dark: darkTheme({...}) }`;
  - includes `accentColorForeground`.

Still open:

- Live visual QA of the website theme builder in browser.

### Phase 3 — Website & Docs — Owner: **Claude**  **(priority)**
Author the full IA in §6 under `website/`. Exit: React + HTML/CDN quick-starts runnable from docs
alone; all pages present; API reference generated.

### Phase 4 — Live demo + Theme builder — Owner: **Claude** (site) + Codex (tx helpers/hooks)
Build + deploy §7. Exit: single public URL shows all primary states + code snippet; theme builder
exports working config.

### Phase 5 — Transaction helpers/playground — Owner: Codex
§3 verify/complete helpers + read APIs; wire into demo. Exit: real mainnet TRX tx via TronLink + one
WC wallet; smart-contract example; errors via `WalletKitError`.

### Phase 6 — Wallet QA gating — Owner: Codex (+ your device QA)
§4 support levels + default catalog. Exit: no false "installed"; default featured = working wallets;
evidence mapped to the detect/connect matrix.

### Phase 7 — Bundle diet — Owner: Codex
§2.6 lazy-load WC/adapters; `lite` + `full` IIFE; CI size budgets. Exit: React path ≤ 150 kB gzip;
budgets enforced in CI.

### Phase 8 — SIWT first-class — Owner: Codex + Claude (docs)
§2.4 authentication adapter + modal sign-in step. Exit: demo shows sign-in flow; SIWT guide in docs.

### Phase 9 — SSR/Next safety + Next example — Owner: Codex
§5. Exit: Next App Router example builds + server-renders; client boundaries documented.

### Phase 10 — Beta publish → Stable
Beta: after Phases 0–1 + live QA sign-off (4 bug re-verify + 1 real tx) → publish `0.1.0-beta.0`
(`beta` tag). Stable `0.1.0` (`latest`): after Phases 3–7 (demo + docs + gating + bundle) land.

---

## 9. Definition of Done ("TRON-native ConnectKit/RainbowKit")

- 3-line React integration; great zero-config look; hooks allow fully custom UIs.
- Public demo shows connect / account / theme / QR / identity / transaction; single URL.
- React, Next, HTML/CDN docs copy-paste runnable; migration + contribution guides present.
- Theme builder exports working config.
- Wallet support levels explicit + QA-backed; no false "installed".
- WC QR works with ≥ 2 real TRON wallets; TronLink stable on a multi-wallet browser.
- Account panel: address, copy, QR, balance, `.trx` identity — reliable.
- Tx helpers: build → sign → broadcast for TRX + contract calls.
- React path bundle ≤ 150 kB gzip; errors short + localized.
- SIWT available; Next SSR-safe.
- Published under npm `beta`, then `latest` with demo + docs linked.

---

## 10. Non-goals (do not prioritize before demo/docs/tx QA)

Many more wallets; deep perfection refactors; analytics; many i18n locales; staking/voting writes;
replacing `tronweb3/tronwallet-adapter`. Product trust comes from a polished, working experience —
not the longest wallet list.
