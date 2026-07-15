# TRON Native ConnectKit/RainbowKit Experience - Gap Review

Date: 2026-07-15

Purpose: define what TRON Wallet Kit still needs before it can credibly position itself as a **TRON-native ConnectKit/RainbowKit-style wallet experience**, instead of only another TRON adapter wrapper.

This document is intended for review. It is not a full implementation spec yet.

---

## Positioning

TRON Wallet Kit should not try to replace `tronweb3/tronwallet-adapter` at the adapter-standard layer.

Recommended positioning:

> TRON Wallet Kit is a product-grade wallet connection, account, identity, and transaction UX kit for TRON dApps.

`tronweb3/tronwallet-adapter` remains the stronger ecosystem adapter foundation. TRON Wallet Kit should compete at the **developer/product experience layer**:

- polished connect modal;
- account panel;
- QR/mobile flow;
- light/dark/custom theming;
- wallet status UX;
- `.trx` identity;
- transaction feedback;
- browser/CDN drop-in;
- docs/demo quality.

The closest product target is: **ConnectKit/RainbowKit, but TRON-native.**

---

## Current Strengths

### 1. UI/UX Direction Is Differentiated

The kit already has a product UX direction that `tronweb3/tronwallet-adapter` does not primarily focus on:

- Reown-style wallet modal direction;
- featured wallets + All Wallets;
- installed/checking/unavailable/QR statuses;
- skeleton and QR loading states;
- account panel foundation;
- token-driven theme system;
- light/dark/custom theme names;
- portal-safe CSS variables;
- browser/CDN IIFE target.

Recent UI improvement:

- during wallet detection, order is stable while any wallet is still `loading`;
- after detection settles, installed wallets and QR-capable fallbacks sort to the top in one batched render;
- unavailable wallets fade/disable in place;
- availability render is batched to reduce visual jitter.

### 2. Adapter Strategy Is Becoming Maintainable

The project has moved away from hardcoded per-wallet patches in one shared detect file:

- injected strategy/decorator model exists;
- common injected wallets can be direct kit-owned entries;
- heavy or protocol-specific wallets can be optional bridge adapters;
- WalletConnect is now a lite implementation rather than pulling a large Reown/AppKit stack;
- TronLink 6963 conflict handling has been addressed;
- WalletConnect required/optional namespace fix is implemented.

### 3. Release Foundation Is Mostly Ready

Release readiness work has added:

- root README;
- LICENSE;
- CHANGELOG;
- GitHub Actions CI;
- package READMEs;
- `0.1.0-beta.0` versioning;
- `publishConfig` for public packages;
- package tarball size audit;
- browser IIFE size audit;
- hardcoded WalletConnect project ID removal.

---

## Critical Gaps Before This Can Feel Like ConnectKit/RainbowKit

### Gap 1 - Public Live Demo

Status: missing.

This is the largest product gap.

A ConnectKit/RainbowKit-style product needs a public demo that shows the actual experience before a developer reads long docs.

Minimum demo should include:

- connect modal;
- light/dark/themeName switch;
- custom accent/font preview;
- featured wallets + All Wallets;
- WalletConnect QR flow;
- account panel modal;
- copy address;
- address QR;
- TRX balance;
- `.trx` identity;
- sign message;
- send TRX on testnet;
- transaction feedback/toast;
- recent transaction foundation;
- code snippet for the current configuration.

Recommended demo URL strategy:

- use the available `trxdomains.xyz` domain for public docs/demo;
- keep `react-basic` as local QA playground;
- create a more polished public “Demo” page for external developers.

Acceptance:

- reviewer can open one URL and understand why the kit exists;
- all primary UI states are visible without reading code;
- the demo does not expose a real WalletConnect project ID in source.

---

### Gap 2 - Documentation Depth

Status: scaffold exists, but docs are still thin.

Required docs for credible beta:

- Quick Start React;
- Next.js SSR guide;
- HTML/CDN IIFE guide;
- vanilla TypeScript guide;
- WalletConnect projectId setup;
- supported wallet catalog;
- wallet status meanings;
- themeName and token customization;
- account panel and identity guide;
- transaction pipeline guide;
- troubleshooting guide;
- migration guide from `tronweb3/tronwallet-adapter`;
- adapter contribution guide.

Important troubleshooting topics:

- TronLink with multi-wallet namespace conflicts;
- Gate Wallet requires HTTPS injection in some environments;
- WalletConnect QR approved but dApp not connected;
- WalletConnect namespace incompatibility;
- `not installed` vs `unavailable`;
- TronGrid API key / rate-limit symptoms;
- first-connect edge cases;
- mobile browser vs in-app browser behavior.

Acceptance:

- a developer can integrate React and HTML/CDN without reading source code;
- a wallet provider can understand how to add an adapter or descriptor;
- common QA failures have documented causes and recovery paths.

---

### Gap 3 - Transaction Playground

Status: transaction architecture is specified, but playground is not complete.

To be TRON-native, the kit must go beyond connect/signMessage.

Needed in `react-basic` and docs:

1. TRX transfer:
   - build;
   - sign;
   - sign-and-broadcast.

2. Smart contract:
   - `triggerSmartContract`;
   - sign;
   - broadcast;
   - example for domain purchase or test contract call.

3. Transaction status:
   - read transaction by hash;
   - read transaction info by hash.

4. Resource read-only:
   - bandwidth;
   - energy;
   - account resources.

5. Advanced resource/governance later:
   - freeze/unfreeze V2;
   - delegate/undelegate resource;
   - vote;
   - withdraw rewards.

Architecture requirement:

- build transaction in client/helper layer;
- sign through active adapter;
- broadcast through shared TronWeb/RPC;
- do not rely on direct `contract.method().send()` as the primary path because that does not uniformly cover injected wallets, WalletConnect, and Ledger.

Acceptance:

- one real end-to-end transaction works through TronLink;
- one WalletConnect wallet can sign/broadcast a transaction;
- transaction errors use the shared `WalletKitError` formatting and do not break UI panels.

---

### Gap 4 - Wallet QA Matrix And Gating

Status: many wallets are integrated or partially tested, but product-facing support levels need stricter gating.

The wallet catalog should separate:

- `live`: verified with real extension/wallet;
- `beta`: expected to work but needs more QA;
- `hidden` / `qa`: descriptor exists but not shown by default.

Recommended initial `live` target:

- TronLink;
- TokenPocket;
- OKX Wallet;
- Bitget Wallet;
- Trust Wallet through correct supported path;
- Binance Web3 Wallet if real TRON path is confirmed;
- WalletConnect with at least Klever and Bitget QR QA;
- MetaMask TRON if bridge path is stable;
- Ledger only after real-device QA.

Should stay `qa` until proven:

- FoxWallet;
- MathWallet;
- imToken;
- Coin98;
- any wallet whose extension detection is namespace-only or unverified.

Acceptance:

- the public modal does not claim unsupported wallets are ready;
- default featured list prioritizes wallets that actually work;
- reviewer can map each wallet to evidence in `WALLET_TEST_MATRIX.md` or `WALLET_DETECT_MATRIX.md`.

---

### Gap 5 - Theme Builder / Visual Customizer

Status: theme system exists, builder is missing.

The kit has a strong theme foundation:

- `themeName`;
- light/dark;
- token-driven CSS variables;
- accent/font shortcut;
- custom tokens.

Missing product layer:

- interactive theme builder page;
- live preview of connect modal/account panel/button;
- copy exported config;
- copy CSS variable override;
- compare light/dark output.

Recommended builder features:

- select `themeName`;
- adjust accent;
- adjust radius;
- adjust font family;
- switch light/dark;
- preview modal states:
  - featured;
  - All Wallets;
  - QR;
  - connecting;
  - account panel;
- export:

```ts
ui: {
  themeName: "tron",
  accent: "#0988f0",
  fontFamily: "Inter, sans-serif"
}
```

Acceptance:

- a developer can visually customize the kit without reading token docs first;
- exported config can be pasted into React example and work.

---

### Gap 6 - SSR / Next Safety And Framework Polish

Status: Next package exists; release checklist still marks SSR/Next safety as open.

Needs:

- audit all public React/Next entry points for server render safety;
- no top-level `window`, `document`, `navigator`, provider access;
- no dynamic provider detection during SSR;
- clear Next App Router example;
- `"use client"` guidance;
- hydration-safe WalletButton/Provider examples.

Acceptance:

- Next example builds;
- server render does not throw;
- docs explicitly show where client boundaries are required.

---

### Gap 7 - Release Trust Layer

Status: package release prep is mostly complete, but actual beta should wait for QA sign-off.

Remaining before `0.1.0-beta.0` publish:

- commit current release readiness and UI transition work;
- live QA WalletConnect QR with Bitget and Klever;
- one real transaction end-to-end;
- wallet icon brand/source licensing note;
- decide whether to keep/discard `Review/INJECTED_FIRST_CONNECT_FIX_SPEC.md`;
- verify package tarballs after final build;
- publish with npm `beta` tag only.

Acceptance:

- `pnpm lint`;
- `pnpm typecheck`;
- `pnpm test`;
- `pnpm build`;
- `pnpm publish --dry-run --tag beta`;
- manual QA evidence recorded.

---

## Recommended Product Roadmap

### Phase A - Commit And Stabilize Current Beta Base

Goal: freeze current package state before adding more product work.

Tasks:

- commit release readiness files;
- commit UI soft availability transition;
- keep `Review/INJECTED_FIRST_CONNECT_FIX_SPEC.md` separate unless intentionally accepted;
- rerun full workspace gates.

Output:

- clean beta branch;
- current implementation recorded in `PROJECT_MEMORY.md`.

---

### Phase B - Public Demo + React Playground Upgrade

Goal: make the kit understandable without reading source.

Tasks:

- upgrade `react-basic` into a proper playground;
- add transaction sections;
- add theme switch/config preview;
- add identity/balance visibility;
- add WalletConnect QR QA controls;
- deploy public demo.

Output:

- demo URL;
- screenshot set for review;
- manual QA notes.

---

### Phase C - Docs For Beta

Goal: make integration self-serve.

Tasks:

- quick start;
- React;
- Next;
- HTML/CDN;
- WalletConnect;
- theming;
- wallet catalog;
- identity;
- transaction pipeline;
- troubleshooting;
- migration from `tronweb3/tronwallet-adapter`.

Output:

- reviewable docs site;
- README links updated.

---

### Phase D - Wallet QA Gating

Goal: show only wallets that deserve product trust.

Tasks:

- classify wallets into `live`, `beta`, `qa/hidden`;
- update default catalog/featured behavior accordingly;
- record QA matrix evidence;
- run multi-wallet conflict tests.

Output:

- stable wallet catalog;
- fewer false “installed” states;
- predictable first-connect behavior.

---

### Phase E - Beta Publish

Goal: publish a credible `0.1.0-beta.0`.

Tasks:

- full local gates;
- package dry-run;
- live QR QA;
- live transaction QA;
- publish under npm `beta` tag;
- tag release.

Output:

- npm beta release;
- public demo/docs;
- changelog.

---

### Phase F - Stable Readiness

Goal: move from beta to `0.1.0 latest`.

Tasks:

- theme builder;
- Next App Router example;
- broader wallet QA;
- transaction playground polish;
- docs videos/GIFs;
- API reference generation.

Output:

- stable launch candidate.

---

## What Not To Prioritize Yet

Do not prioritize these before demo/docs/transaction QA:

- adding many more wallets;
- deep refactor for perfection;
- analytics;
- many i18n locales;
- advanced staking/voting writes;
- replacing `tronweb3/tronwallet-adapter` as an adapter standard.

Reason: product trust will come first from a polished, working TRON dApp experience, not from the longest wallet list.

---

## Reviewer Questions

Please review these decisions:

1. Is the positioning correct: UX kit on top of TRON wallet patterns, not a direct replacement for `tronweb3/tronwallet-adapter`?
2. Should `0.1.0-beta.0` ship before the public demo, or should demo be a hard blocker?
3. Which wallets should be `live` by default for beta?
4. Should Ledger be shown by default before real-device QA?
5. Is the browser/CDN IIFE size acceptable for beta, given the convenience goal?
6. Should transaction playground be required before beta publish, or only before stable?

---

## Proposed Definition Of Done For "TRON-native ConnectKit/RainbowKit Experience"

The project can claim this positioning when:

- a public demo shows connect/account/theme/QR/identity/transaction flows;
- React, Next, and HTML/CDN docs are copy-paste runnable;
- wallet support levels are explicit and QA-backed;
- WalletConnect QR works with at least two real TRON wallets;
- TronLink works on a multi-wallet browser without flapping;
- account panel shows address, copy, QR, balance, and `.trx` identity reliably;
- transaction helpers support build -> sign -> broadcast for TRX and smart contract calls;
- errors are short, localized through labels, and do not expose raw stack/module/circular details;
- npm beta release is published with clear beta status.

