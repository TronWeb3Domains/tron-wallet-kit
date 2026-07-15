# TRON Wallet Kit — Release Readiness Checklist

Audited 2026-07-13. Verdict: **beta** — the adapter core is solid (4 live connect bugs fixed, WC
namespace, 6963 detection, first-connect), but public release is blocked on legal/release
engineering, QA breadth, and the DX layer (docs / demo / theme builder). Ship first as
`0.1.0-beta.0` under the npm `beta` tag, not `latest`.

Legend: `[ ]` todo · `[~]` partial · `[x]` done.

---

## Repo snapshot (what exists today)

- `[x]` Monorepo: core, ui, client, browser, react, next, auth, adapters/{tronlink, walletconnect, tronwallet-bridge}.
- `[x]` VitePress site under `website/` (introduction, quick-start, adapters, api, configuration/theming, frameworks) — **scaffolded but thin**.
- `[x]` Examples: `examples/react-basic`, `examples/html-cdn`, vanilla `examples/index.html`.
- `[x]` Root `README`, `LICENSE`, `.github/workflows` (CI).
- `[x]` Versions prepared at `0.1.0-beta.0`.
- `[ ]` Deployed live demo, interactive theme builder — **missing**.

---

## P0 — blockers before ANY public release

### Legal / packaging
- `[x]` Add a **LICENSE** file (MIT) at the repo root.
- `[x]` Root `README.md` (what it is, install, minimal usage, links to docs/demo).
- `[x]` Per-package `README` + verify `package.json` `exports`, `types`, `files`, `sideEffects` for tree-shaking.
- `[x]` Bump versions `0.0.0` → `0.1.0-beta.0`; add `CHANGELOG.md`; configure npm publish (access, `publishConfig`, provenance).
- `[x]` Confirm no secrets / no hardcoded WalletConnect `projectId` in any published package (project hard rule).

### CI / quality gate
- `[x]` Add CI (`.github/workflows`) running `lint + typecheck + test + build` on every PR.
- `[x]` `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` are green locally.
- `[x]` Bundle/package-size check recorded for all public package tarballs; browser IIFE sizes recorded separately.

### Correctness / QA sign-off (on real devices, HTTPS)
- `[ ]` Re-verify the 4 fixed connect bugs live: **SafePal** connect, **Bitget via WC QR**, **TronLink** on a multi-wallet machine, **first-connect** (Bitget/SafePal fresh authorize).
- `[ ]` One **real mainnet transaction** end-to-end (build → sign → broadcast) via at least TronLink + one WC wallet.
- `[ ]` Wallet catalog gating: ship only `[live]`-verified wallets; hold `[QA]` ones (FoxWallet, imToken, MathWallet, Coin98, Backpack sign-path) behind a flag or off by default.
- `[x]` WalletConnect default network `nile` → **mainnet**.
- `[ ]` SSR / Next safety: guard every `window` / `globalThis` / provider access so server render does not throw.

---

## P1 — needed for a credible launch (the DX layer)

### Docs site (VitePress — currently sparse)
- `[ ]` Getting started per framework: **React, Next, vanilla TS, HTML/CDN** (copy-paste runnable).
- `[ ]` Configuration reference: **i18n/locales, theme tokens (`--twk-*`), featured/rank, wallet enable/disable**.
- `[ ]` **WalletConnect setup**: how to obtain and inject `projectId`, network selection, mobile QR flow.
- `[ ]` Wallet catalog page: supported wallets, platforms, detection/connect notes, status badges.
- `[ ]` Adapter contract + **contribution guide** (Path A PR / Path B external package) from `WALLET_ADAPTER_ORG_SPEC`.
- `[ ]` Troubleshooting page (namespace collision, "not installed", WC "cancelled in wallet", first-connect).
- `[ ]` API reference (typedoc) generated from the public types.

### Visual live demo (deployed)
- `[ ]` Deploy a demo site: real connect flow, all shipped wallets, **light/dark theme switch**, account panel, and a **testnet transaction** demo.
- `[ ]` Link the demo from the docs home and README.

### Theme builder
- `[ ]` Interactive token editor → live preview → **export config / `--twk-*` CSS variables**. (Today only a static `configuration/theming.md`.)

---

## P2 — post-launch

- `[ ]` More wallets (fill `[QA]` rows after live QA), MathWallet promotion.
- `[ ]` More examples (Next app router, Vue), plus GIF/video walkthroughs.
- `[ ]` Additional i18n locales.
- `[ ]` Opt-in analytics / telemetry for adoption insight.
- `[ ]` Finish migration cleanup: remove legacy flat injected config once policy is decided (`strategyFromLegacyConfig`, `toInjectedConfig`, flat quirk fields).
- `[ ]` Harden `acquireInjectedAddress` ordering (prefer a found address over a late secondary rejection) for multi-method injected wallets.

---

## Recommended release sequence

1. Close **P0** → publish **`0.1.0-beta.0`** on the npm `beta` tag (early adopters, no `latest`).
2. In parallel build the **deployed demo** + flesh out **docs** → publish **`0.1.0`** (`latest`) with demo + docs linked.
3. Add the **theme builder** + expand the live-verified wallet set → **`0.2.0`**.

---

## Out of scope note

`docs/` in the repo is intentionally minimal on GitHub (public docs live in `website/`). Keep the
authoritative user docs in the VitePress site; the `Review/*.md` specs remain internal design docs.

---

## Implementation update - 2026-07-14

Release target corrected to **`0.1.0-beta.0`** because TRON Wallet Kit has not been published to npm yet.

### Closed for beta packaging

- `[x]` Root `LICENSE` file added with MIT text.
- `[x]` Root `README.md` added with package list, install command, React usage, browser/CDN usage, and beta status.
- `[x]` Root `CHANGELOG.md` added for `0.1.0-beta.0`.
- `[x]` GitHub Actions CI added at `.github/workflows/ci.yml` running install, lint, typecheck, test, and build.
- `[x]` Workspace/package versions bumped from `0.0.0` to `0.1.0-beta.0`.
- `[x]` Public packages now include `publishConfig: { access: "public", provenance: true, tag: "beta" }`.
- `[x]` Per-package README files added for npm package pages.
- `[x]` Hardcoded WalletConnect project ID removed from docs and examples; snippets now use placeholders or runtime env/config.
- `[x]` WalletConnect default network changed from Nile to mainnet.

### Closed after local verification

- `[x]` Full local gate passed after release edits:
  - `pnpm lint`;
  - `pnpm typecheck`;
  - `pnpm test`;
  - `pnpm build`.
- `[x]` `pnpm publish --dry-run --no-git-checks --tag beta` passed for all public packages:
  - `@tron-wallet-kit/core`;
  - `@tron-wallet-kit/ui`;
  - `@tron-wallet-kit/adapter-tronlink`;
  - `@tron-wallet-kit/adapter-tronwallet-bridge`;
  - `@tron-wallet-kit/adapter-walletconnect`;
  - `@tron-wallet-kit/client`;
  - `@tron-wallet-kit/browser`;
  - `@tron-wallet-kit/react`;
  - `@tron-wallet-kit/next`;
  - `@tron-wallet-kit/auth`.
- `[x]` Browser package dry-run confirms `tron-wallet-kit.iife.js` and `tron-wallet-kit.iife.min.js` are included in the tarball.
- `[x]` Client package tarball check confirms pnpm rewrites internal `workspace:*` dependencies to `0.1.0-beta.0`.
- `[x]` Public package tarball size check completed:
  - `tron-wallet-kit-adapter-tronlink-0.1.0-beta.0.tgz`: 24,550 bytes;
  - `tron-wallet-kit-adapter-tronwallet-bridge-0.1.0-beta.0.tgz`: 11,844 bytes;
  - `tron-wallet-kit-adapter-walletconnect-0.1.0-beta.0.tgz`: 21,612 bytes;
  - `tron-wallet-kit-auth-0.1.0-beta.0.tgz`: 4,074 bytes;
  - `tron-wallet-kit-browser-0.1.0-beta.0.tgz`: 4,057,415 bytes;
  - `tron-wallet-kit-client-0.1.0-beta.0.tgz`: 193,361 bytes;
  - `tron-wallet-kit-core-0.1.0-beta.0.tgz`: 59,911 bytes;
  - `tron-wallet-kit-next-0.1.0-beta.0.tgz`: 2,354 bytes;
  - `tron-wallet-kit-react-0.1.0-beta.0.tgz`: 23,129 bytes;
  - `tron-wallet-kit-ui-0.1.0-beta.0.tgz`: 175,653 bytes.
- `[x]` Browser IIFE size recorded:
  - `tron-wallet-kit.iife.js`: 3,459,117 bytes;
  - `tron-wallet-kit.iife.min.js`: 1,737,483 bytes.

### Still required before running real `pnpm publish --tag beta`

- `[ ]` Live QA WalletConnect QR with at least Bitget and Klever after the namespace fix.
- `[ ]` Decide whether to commit or discard `Review/INJECTED_FIRST_CONNECT_FIX_SPEC.md`.
