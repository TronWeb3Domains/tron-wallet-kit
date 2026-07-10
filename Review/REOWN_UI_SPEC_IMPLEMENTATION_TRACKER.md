# REOWN_UI_SPEC_FOR_TRON Implementation Tracker

Date: 2026-07-05
Source of truth: `Review/REOWN_UI_SPEC_FOR_TRON.md`

This tracker exists because the spec is larger than a single UI polish pass. Do not mark a section complete unless the code, tests, and memory/spec notes are updated.

Primary phase board now lives directly in `Review/REOWN_UI_SPEC_FOR_TRON.md` section `0. Execution Discipline / Plan Tuần Tự`. This file is the detailed checklist mirror; update both when status changes.

## Legend

- `DONE`: implemented and verified by tests/typecheck or smoke.
- `PARTIAL`: useful foundation exists, but spec behavior is incomplete.
- `TODO`: not implemented.
- `DEFER`: intentionally later, with reason.

## 1. Modal Reown Anatomy

| Item | Status | Notes |
| --- | --- | --- |
| TRON-only copy, no multichain/certified framing | DONE | Modal/catalog avoids `MULTICHAIN` and certified toggle. |
| TronLink first, WalletConnect last in featured | DONE | `getFeaturedWalletOptions()` enforces order. |
| Featured list has 5 wallets before Search | DONE | Current order: TronLink, OKX, Bitget, TokenPocket, WalletConnect. |
| Light/dark measured token baseline | DONE | `light`/`dark` presets updated and P9 browser screenshots captured. |
| Wallet icon radius 5px token | DONE | `walletIconRadius: "5px"`. |
| Header close/back transparent by default | DONE | CSS uses transparent close/back controls. |

## 1B. Frame, Typography, Loading

| Item | Status | Notes |
| --- | --- | --- |
| Modal width `min(400px, calc(100vw - 32px))` | DONE | `styles.ts`. |
| Auto height for featured/connecting/error/QR/account-style views | DONE | Earlier fixed body pass was superseded; `.twk-body` no longer has global 480px height. |
| Only all-wallets grid fixed and scrollable | DONE | `.twk-wallet-grid { height: 360px; overflow: auto; }`. |
| Compact header and detail spacing | DONE | P1 compact pass set 44px header, compact body/footer/detail spacing. Visual screenshot QA remains in P9. |
| Unified typography title/subtitle/action/badge | DONE | Tests cover style text; P9 visual QA captured light/dark/mobile states. |
| Wallet icon skeleton during availability check | DONE | Icon, wallet name, and badge skeletons now render while `readyState` is loading. |
| Account panel identity/balance skeleton | DONE | Account panel supports `identityLoading` and `balanceLoading` skeleton chips. |

## 1C. Spinner, Metadata, QR

| Item | Status | Notes |
| --- | --- | --- |
| Remove `.twk-connecting-arc` | DONE | Replaced by `.twk-connecting-ring`. |
| Spinner ring around logo | DONE | CSS ring wraps large icon. |
| Error dot on wallet icon | DONE | `twk-connecting-error-dot`. |
| Add `downloadUrl` to `WalletMetadata` | DONE | Core/UI/adapters/catalog path supports it. |
| Install row uses `downloadUrl ?? homepage` | DONE | Modal connecting and QR views use this fallback. |
| QR large scan-safe slot + skeleton | DONE | QR slot uses the large scan-safe frame with matching skeleton; old small/card QR layout is superseded. |
| QR action row Copy link + Try again | DONE | Existing QR view covers this. |
| Remove tabs if final spec says "QR chuẩn (KHÔNG tabs)" | DONE | QR tabs markup/CSS removed; test asserts absence. |
| `qr-code-styling` primary renderer | DONE | `renderWalletQr()` dynamically imports `qr-code-styling` and falls back to `qrcode`. |
| Keep `qrcode` fallback | DONE | Existing helper is fallback foundation. |
| Shared `renderWalletQr()` for connect QR + address QR | DONE | Connect QR and React WalletButton address QR both use the shared helper. |
| QR light-mode toggle removed | DONE | QR now stays black-on-white scan-safe in every theme; no `.twk-qr-theme-action` is rendered. |

## 2. Token Contract And Theme Names

| Item | Status | Notes |
| --- | --- | --- |
| Default `light` and `dark`, no Reown-branded names | DONE | Theme names avoid Reown naming. |
| TRON-oriented theme names | DONE | Current presets include `tron`, `tron-energy`, `nile`, `shasta`, etc. |
| Self-host Inter/Vietnamese subset | DEFER | Decision made: defer to release asset pass until approved font files/licensing notes exist. |
| Portal-safe theme application | DONE | Roots receive `--twk-*` variables. |
| Runtime `kit.setTheme()` updates every surface | DONE | Client `kit.setTheme()` updates modal/button/toast roots; UI surfaces expose `setTheme()`. |

## 3. TRON Wallet Catalog And Icons

| Item | Status | Notes |
| --- | --- | --- |
| TRON-only catalog from tronwallet-adapter scope | DONE | `wallet-catalog.ts`. |
| Mobile/Extension platform metadata | DONE | Wallet metadata/catalog expose `platforms`; All Wallets stays flat and cards keep `data-twk-platforms` for future PC/mobile optimization. |
| Popular wallet fallback routing | DONE | Popular mobile wallets keep wallet-specific IDs and can fallback through WalletConnect when no native adapter is registered. |
| Icon script downloads SVGs and generates data URI map | DONE | `scripts/fetch-wallet-icons.mjs`. |
| Adapter metadata icon is source of truth | DONE | TronLink/WalletConnect carry generated icons. |
| Catalog-only icon fallback | DONE | `icons.generated.ts` now includes all 17 catalog icons fetched from `walletadapter.org/wallets/*.svg`. |
| License/source note before public release | DEFER | Release checklist now tracks wallet icon brand/source licensing before golive; not required for local UI iteration. |

## 4. Modal Routing

| Item | Status | Notes |
| --- | --- | --- |
| Featured view | DONE | Implemented. |
| All-wallets search view | DONE | Implemented. |
| Connecting view | DONE | Implemented with ring spinner. |
| QR view | DONE | Connect QR uses shared render target/helper, scan-safe white QR surface, copy link, and fallback path. Address QR reuse is tracked under account panel flow. |
| Account view inside modal | DEFER | Account panel currently separate via WalletButton, not connect modal route. |
| View stack back behavior | DONE | Stateful modal now uses `viewStack`. |
| Preserve all-wallets search/scroll on Back | DEFER | Search state is preserved; scroll restoration is release-hardening for larger wallet lists. |
| Cancel pending connection on Back/Close | DEFER | Core has optional `cancelPendingConnection`; modal/client wiring waits for standardized adapter cancellation behavior. |

## 4B. Connect / Account Button

| Item | Status | Notes |
| --- | --- | --- |
| WalletButton disconnected/connecting/connected | DONE | Shared UI + React wrapper. |
| Action button icon+label standard | DONE | `twk-action` content now uses shared SVG icon + label structure across modal/account actions. Retry has busy spinner feedback; copy actions keep stable visible labels and change icon state only. |
| WalletButton identity/balance skeleton trigger | DONE | Connected trigger now supports `identityLoading` and `balanceLoading` skeleton name/balance slots. |
| All Wallets wallet-card skeleton | DONE | Loading wallet cards keep stable card footprint and render icon/name skeleton blocks. |
| Dropdown/modal account panel | DONE | React WalletButton supports dropdown and modal panel modes. 4G layout pass now gives modal `520x527/650-with-recent`, dropdown mini-modal hides header/no shadow, body scroll is internal, address QR is a 40px chip action, and recent tx is an opt-in section. |
| Identity lifecycle via TRX Domains direct contract | DONE | Client lifecycle, React refresh, account-panel loading skeleton, and settled display states are implemented. Direction is mainnet-first TRX Domains through RPC-scoped TronWeb; testnet/custom should skip unless custom resolver/config is supplied. Real-domain QA remains manual. |
| Balance lifecycle | DONE | Resolver foundation, React refresh, loading skeleton, and settled TRX display states are implemented. Next hardening: default resolver order provider `tronWeb.trx.getBalance(address)` then configured RPC/TronGrid fallback, SUN -> TRX in client. Real RPC/balance QA remains manual. |
| Account panel network label | DONE | Account Panel no longer renders `TRON mainnet`/network pills; network context remains in connect/inline picker surfaces only. |
| Account panel copy/explorer/disconnect | DONE | Actions are full-width 46px rows under hero/meta/recent tx, with address QR separated into the address chip row. |
| Account panel QR sub-view | DONE | React WalletButton supports `account -> address-qr -> account`, with Back/Close controls. |
| Account panel focus trap/scroll lock | DONE | Modal account panel now traps Tab, locks body scroll, closes by Escape/outside click, and restores focus. |

## 4C. Missing Panels And Controls

| Item | Status | Notes |
| --- | --- | --- |
| Network badge at top of wallet list | DONE | Featured/all-wallets views render `.twk-network-badge` when network info is provided. |
| `createWalletInline()` no-overlay picker | DONE | Inline picker reuses the shared wallet list/search/connect/QR render path without overlay. |
| Wallet group + mini-icon stack | DEFER | Superseded by product decision: All Wallets must remain flat to avoid duplicate/confusing wallet presentation. `showGroup` markup/CSS was removed. |
| QR light-mode toggle removed | DONE | Removed for connect QR and address QR; scan-safe QR background remains white in light/dark themes. |
| Transaction toast full controller/autodismiss | DONE | Controller supports update-by-hash, dismiss, auto-dismiss, explorer link, and polite live region. |
| Inline status/error line under wallet grid | DONE | `.twk-status` reserves space under featured/all-wallets lists. |

## 4D. Flow And Navigation

| Item | Status | Notes |
| --- | --- | --- |
| Connect modal back-stack | DONE | `viewStack` implemented in stateful modal. |
| Back from all-wallet wallet detail returns all-wallets | DONE | Covered by push/pop flow. |
| Account panel account -> address-qr -> account | DONE | Implemented in React WalletButton controller. |
| Address QR reusable renderer | DONE | `createAddressQrPanelHtml()` and `renderWalletQr()` cover the sub-view and rendering target. |
| Reduced-motion transitions | DEFER | Spinner/toast/skeleton reduced motion exists; directional view transitions are release-hardening. |

## 5. Code-Specific Checklist

| Item | Status | Notes |
| --- | --- | --- |
| ReadyState wiring | DONE | Adapter availability refresh maps to readyState. |
| Badge component | DONE | Semantic badge classes/tokens exist. |
| A11y focus trap/Escape/backdrop close in modal | DONE | Connect modal supports basics. |
| Browser/IIFE parity after UI stabilizes | DONE | Full workspace build passed and produced `tron-wallet-kit.iife.js` plus `tron-wallet-kit.iife.min.js`; React browser smoke on port 5174 captured light/dark/mobile screenshots. |

## Immediate Next Implementation Order

1. Manual QA with real TronLink extension and WalletConnect mobile session.
2. Add wallet icon/source license note before public release.
3. Implement cancel hook for pending connection on Back/Close when adapter APIs support it.
