# XRPL parity — upgrade plan for TRON Wallet Kit

Date: 2026-07-16. Status: design/backlog spec for Codex.

Source: side-by-side capability inventory of the sibling **XRPL Wallet Kit**
(`../xrplWalletKit`, `@xrpl-wallet-kit/*`, v0.1.9) vs **TRON Wallet Kit**
(`@tron-wallet-kit/*`, v0.1.0-beta.0). Goal: pull over the few things XRPL does better,
without regressing the areas where TRON is already ahead.

## TL;DR

TRON Kit is **ahead of XRPL on the DX / React / theming layer** (built later, per the
ConnectKit masterplan). XRPL is **ahead on breadth and completeness** (docs, a couple of
UX utilities, and code-quality gates). "Upgrade from XRPL" therefore means a short,
targeted list — not a rewrite.

Correction to note: TRON **already has** an SDK-level mobile bottom-sheet
(`packages/ui/src/styles.ts`, `@media (max-width: 480px)` → `align-items: end`, top-only
radius, `env(safe-area-inset-*)`, `100dvh`, button-panel pinned to bottom). This is **not**
a gap; only the breakpoint differs from XRPL (480px vs 640px).

## Comparison matrix

| Area | XRPL | TRON | Verdict |
|---|---|---|---|
| React hooks (account/connect/balance/signMessage/name/modals) | 1 `useWalletKit` context + a few | 9 dedicated hooks | TRON ahead |
| `getDefaultConfig` + `lightTheme`/`darkTheme` factories | no factories | present | TRON ahead |
| CSS-variable token system | inlined per-instance, no `--xwk-*` | `--twk-*` token map | TRON ahead |
| Theme presets | 9 | 21 | TRON ahead |
| Tx runtime (transfer TRX/TRC10/TRC20, freeze, vote, contract) | relies on adapter capability | rich runtime in client | TRON ahead |
| Hosted CI (GitHub Actions) | none (husky only) | `.github/workflows/ci.yml` | TRON ahead |
| Mobile bottom-sheet (SDK CSS) | `@media 640px` | `@media 480px` | parity (raise breakpoint) |
| **Tx preview resolver** (pre-sign human summary) | `WalletTransactionPreviewResolver` | absent | **TRON gap** |
| **Tx history store** (persist + staleness) | `WalletTransactionStore` | recent-tx UI only, no store | **TRON gap** |
| **Auth adapter state machine** | `WalletAuthController` + adapter pattern | low-level msg/verify only | **TRON gap** |
| Docs breadth | ~40 pages (advanced, use-cases, guides, api×6, per-adapter) | ~25 pages, thinner | **TRON gap** |
| Quality gates (knip + jscpd + dependency-cruiser) | `check:quality` | eslint + vitest only | **TRON gap** |
| Vue/Nuxt framework docs | present | absent | optional |
| Standalone adapter packages | 8 wallets | 3 + injected descriptors | **by design** (not a gap) |

---

## P1 upgrades — pull from XRPL

### 1. Transaction preview resolver

**What XRPL has:** `WalletTransactionPreviewResolver` — a host-supplied function
`(txJson) => WalletTransactionPreview { summary, details?, raw? }`, surfaced in the
pre-sign confirmation UI so users read a human-readable summary instead of raw JSON.
Ref: `xrplWalletKit/packages/ui/src/types.ts`, `.../button.ts`.

**TRON action:**
- Add `WalletTransactionPreview` + `TransactionPreviewResolver` types to
  `@tron-wallet-kit/ui` (or client), and a `ui.transactionPreview` config hook.
- Wire it into the sign/confirm path in the transaction runtime
  (`packages/client/src/transactions.ts`) so any `signAndSend*` / `signTransaction`
  can render a preview before the wallet prompt.
- TRON-native default previewers: `transferTrx`, `transferTrc20`, `triggerSmartContract`
  (decode contract + amount + to-address). Fall back to raw JSON when no previewer matches.

**Why:** high UX + security value (user sees what they sign). Directly reused by the
**GasFree** Phase-2 confirmation step (TIP-712 amount/receiver/maxFee/provider). Do this
before GasFree send so both share one preview surface.

### 2. Client-side transaction history store

**What XRPL has:** `WalletTransactionStore` — per `account+network`, capped at `max`
entries, marks `submitted` txs `stale → unknown` after `staleSubmittedMs`, backed by a
pluggable `WalletStorage`. Feeds the account panel's "Recent Transactions".
Ref: `xrplWalletKit/packages/core/src/tx-store.ts`.

**TRON action:**
- Add a `TransactionStore` to `@tron-wallet-kit/core` (or client) with the same shape:
  keyed by account+network, cap, staleness timer, pluggable storage.
- On every broadcast (`sendRawTransaction` / `signAndSend*`), record the tx; on confirm,
  update status; expose the list to the account panel's recent-tx view (which today has
  the UI but no durable source) and to the toast.
- Reuse the existing `WalletStorage` abstraction used for sessions (versioned envelope).

**Why:** the account panel already renders "Recent" but has no persistent source; this
closes the loop and gives correct pending/stale/confirmed states across reloads.

### 3. Elevate `@tron-wallet-kit/auth` to a RainbowKit-style adapter

**What XRPL has:** `createWalletAuth(manager, adapter, options)` →
`WalletAuthController` state machine (`unauthenticated | loading | authenticated | error`)
driving nonce → message → sign → verify, with a pluggable `WalletAuthAdapter`
(`getNonce`, `createMessage`, `verify`) and separate `SignatureVerifier`.
Refs: `xrplWalletKit/packages/auth/src/{auth,message,nonce,verifiers}.ts`.

**TRON action (already documented, not built):** implement `createTronAuthenticationAdapter`
+ an auth controller in `@tron-wallet-kit/auth` (masterplan §2.4). Keep the existing
SIWT message/verify primitives underneath. Add the "Sign in" step to the connect modal
when an auth adapter is present (authenticated / unauthenticated / loading states).
Add docs `auth/custom-backend.md` + `auth/nextjs.md` mirroring XRPL.

**Why:** SIWT is a headline masterplan feature; today only low-level helpers exist.

---

## P2 upgrades — completeness

### 4. Docs breadth to XRPL parity

TRON docs are ~25 pages vs XRPL ~40. Add, mirroring XRPL's IA:
- **Advanced:** `advanced/headless.md`, `advanced/events-hooks.md`,
  `advanced/bundle-performance.md` (and optionally `ai-development.md`).
- **Use-cases:** `use-cases/payments.md`, `use-cases/dex-amm.md` (+ TRON-relevant ones,
  e.g. USDT transfers / GasFree once shipped).
- **Guides:** `guides/going-live.md`, `guides/migration.md` (fold in the existing
  `migration-from-tronwallet-adapter.md`).
- **API reference:** expand beyond `client/ui/errors` to cover manager, modal, inline,
  toast (XRPL has 6 api pages).
- **Per-adapter pages:** one page per shipped adapter/wallet (XRPL has 9).
- Fill the **Next.js SSR guide** (`frameworks/next.md`) — currently a nav stub.

### 5. Add code-quality gates

TRON has CI but lacks the static-quality trifecta XRPL runs:
- `knip` (unused code/deps), `jscpd` (duplicate code), `dependency-cruiser`
  (forbid circular deps across `packages`).
- Wire a `check:quality` script and add it as a CI step. Config templates exist in
  `xrplWalletKit/{knip.json,.jscpd.json,.dependency-cruiser.cjs}`.

### 6. Raise the mobile bottom-sheet breakpoint

`packages/ui/src/styles.ts` uses `@media (max-width: 480px)`; many phones are wider in
landscape / large-screen portrait. Raise to ~600–640px (XRPL uses 640px) so the
bottom-sheet treatment applies on more devices. Low-risk CSS-only change.

### 7. (Optional) Vue/Nuxt support

XRPL documents Vue + Nuxt. Only pursue if TRON wants that audience — the DOM-based client
already works inside Vue (the docs site itself proves it). If pursued, ship a Vue example
+ `frameworks/vue.md` / `frameworks/nuxt.md`.

---

## Explicitly NOT doing (by design)

- **More standalone adapter packages.** TRON intentionally uses injected-detection
  descriptors + the `tronwallet-bridge` for heavy/protocol wallets, per the masterplan
  ("don't compete on wallet-list length"). Adding 8 XRPL-style adapter packages would
  contradict the positioning. Keep the bridge + descriptor model.

## Suggested sequencing

1. **P1.1 (tx preview)** first — it's a prerequisite/shared surface for GasFree Phase 2.
2. **P1.2 (tx store)** — completes the account-panel recent-tx loop.
3. **P1.3 (auth adapter)** — unblocks the SIWT masterplan feature.
4. **P2.4 (docs)** in parallel (Claude/Cowork owns website per the ownership split).
5. **P2.5 / P2.6** (quality gates, breakpoint) — quick, low-risk, any time.
6. **P2.7 (Vue/Nuxt)** — only if the audience justifies it.

These P1 items are independent of the connect-core QA gates in `RELEASE_READINESS.md`;
they target `0.1.0 → 0.2.0`, not the beta blocker set.
