# UI/UX Decisions

## Principles

- UI is token-driven.
- Modal and overlay surfaces must work when portaled to `body`.
- Do not depend on host app selectors for theme or layout.
- Keep dimensions stable across loading, empty, error, and connected states.
- Avoid hardcoded colors in components.
- Use simple defaults with clear escape hatches.

## Theme Requirements

| Requirement | Status | Notes |
| --- | --- | --- |
| Light theme | Implemented | `light` preset exists |
| Dark theme | Implemented | `dark` preset exists |
| Custom theme | Implemented | `ThemeConfig.tokens` override API exists |
| Portal-safe tokens | Implemented | Tokens can be applied to wallet kit portal root |

## MVP Surfaces

| Surface | Required Behavior | Status |
| --- | --- | --- |
| Connect modal | Lists available wallets and unavailable states | Foundation implemented |
| Account panel | Shows address, balance, copy, QR, disconnect, recent tx foundation | Foundation implemented |
| Copy address | Provides feedback without resizing panel | Foundation implemented |
| Address QR | Stable QR region and fallback/error state | Foundation implemented |
| Toasts | Transaction lifecycle feedback | Foundation implemented |
| Recent transactions | Stable foundation even before full explorer integration | Foundation implemented |

## Decisions

- Initial UI foundation is framework-neutral TypeScript in `@tron-wallet-kit/ui`.
- `themeName` should be a first-class config, not a small afterthought.
- Initial preset names: `light`, `dark`, `tron`, `energy`, `sun`, `graphite`, `midnight`, `ocean`, `minimal`, `highContrast`.
- Current production-oriented preset names: `default`, `light`, `dark`, `tron`, `tron-energy`, `nile`, `shasta`, `bandwidth`, `energy`, `sun`, `terminal`, `highContrast`.
- Current playground/extended preset names: `graphite`, `midnight`, `ocean`, `glass`, `rounded`, `crisp`, `soft`, `neon`, `minimal`.
- Every preset resolves to the same token contract so components can stay token-driven.
- Token overrides remain available through `ThemeConfig.tokens`.
- Portal-safe theme application is supported by applying CSS variables directly to the wallet kit root element.
- React/browser packages should consume this shared theme resolver instead of redefining theme behavior.

## Competitive Notes: TronWallet Adapter

- TronWallet Adapter provides ready-made React buttons and a select-wallet modal.
- TRON Wallet Kit should differentiate by shipping a fuller account experience: balance, QR, copy feedback, transaction toasts, and recent transaction foundation.
- Theme implementation should be more explicit and portal-safe, with tokens applied to the rendered modal root instead of depending on host app selectors.
- Avoid React state sequencing pitfalls in the public API where possible, especially flows that require select now and connect on a later render.

## Competitive Notes: ConnectKit and RainbowKit

- ConnectKit and RainbowKit are closer UI/UX benchmarks than TronWallet Adapter.
- Match their baseline expectations: polished connect button, responsive modal, account state, balance display, customization/theming, localization-ready copy, modal hooks, and strong framework docs.
- RainbowKit's recent transactions model is a useful precedent, but TRON Wallet Kit should normalize TRON transaction hashes/status and avoid Ethereum confirmation assumptions.
- ConnectKit/RainbowKit are EVM/wagmi-centered; TRON Wallet Kit can win by feeling equally polished while using TRON-native account, network, signing, and transaction concepts.

## Implementation Notes

- `createThemeStyleText(config, selector)` is intended for browser/CDN and docs examples.
- `applyThemeToElement(element, config)` is intended for modal/account-panel roots, including when portaled to `body`.
- Avoid adding component-local hardcoded colors; add new tokens instead.
- Added first UI surface foundation in `@tron-wallet-kit/ui`: token-driven CSS via `createWalletKitStyles`, portal root creation via `createWalletKitRoot`, connect modal HTML/DOM helpers, and account panel HTML/DOM helpers.
- `ensureWalletKitStyles` owns style-tag injection for browser/CDN usage; `createBrowserKit` now applies `.twk-root`, theme tokens, and default styles automatically.
- Connect modal and account panel currently render framework-neutral HTML/DOM. React integration should wrap these concepts with stateful components later rather than duplicating layout constants.
- Stable dimensions are now encoded for the first surfaces: modal/account panel `min-height: 420px`, wallet rows `min-height: 58px`, buttons `min-height: 44px`, QR slot `168px`, and recent transaction area `min-height: 128px`.
- Component CSS uses `var(--twk-*)` tokens only for color/surface styling. Theme preset color values remain centralized in the token presets.
- React wrappers now reuse UI HTML helpers instead of duplicating markup. This keeps React, browser/CDN, and future docs examples aligned on the same layout and sizing rules.
- React components apply token variables inline on their `.twk-root`, so modal/panel rendering remains portal-safe even when the root is mounted outside the host app tree.
- Examples now include both React and HTML/CDN surfaces. The React example exposes theme switching, WalletConnect URI output, connect modal, account panel, mock recent transaction rows, and sign message action. The HTML/CDN example exercises the global IIFE path and vanilla state rendering.
- XRPL Wallet Kit review confirmed the value of a shared UI engine: modal, account panel, toast, and framework wrappers should continue to consume common UI primitives rather than duplicating layout.
- Added TRON-native UI config resolver with `mode`, `themeName`, `customTheme`, modal, wallet list, account panel, and toast config. This intentionally mirrors XRPL ergonomics without XRPL concepts.
- Added QR helper and toast HTML foundation. QR is now a real generated data URL instead of only a fixed placeholder slot.
- React and HTML/CDN examples now render WalletConnect URI QR, address QR, and mock transaction toast using shared UI helpers.

## XRPL Wallet Kit Parity Gap

- Current TRON UI is still below XRPL Wallet Kit's product surface. XRPL has stateful controllers for modal, account button/panel, QR states, toast lifecycle, focus/scroll lock, identity cache, balance resolver, and transaction feedback. TRON currently has shared HTML helpers plus lightweight React wrappers.
- Next UI phase should introduce stateful `createWalletModal`, `createWalletButton`/account trigger, and `createWalletToast` controllers for TRON instead of continuing to grow examples-only wiring.
- Adapter metadata must always include icon-ready display data. TronLink and WalletConnect now ship default SVG data-URI icons plus `type`, `group`, and `description`; future adapters should follow that baseline.
- Website can remain a structured skeleton until go-live, but docs should not drift from actual package APIs. Keep API/config pages accurate while deferring polish/content depth.

## Clean Rebuild UI Notes

- `@tron-wallet-kit/ui` now includes stateful `createWalletModal`, `createWalletButton`, and `createWalletToast` controllers. They should remain framework-neutral and consume only `WalletManager`, never adapter-private APIs.
- React and browser usage should prefer `createWalletKit()` / `createBrowserKit()` for default modal/button/toast assembly.
- Connect modal wallet status logic must preserve row dimensions across ready, connecting, unavailable, error, and empty states.
- Toast and recent transaction foundations are now implemented; real confirmation polling and richer account-panel state remain future work.
- Theme presets remain first-class through `themeName`. Production-oriented presets now prioritize TRON names: `default`, `light`, `dark`, `tron`, `tron-energy`, `nile`, `shasta`, `bandwidth`, `energy`, `sun`, `terminal`, and `highContrast`; visual playground presets remain available for testing.
- Dark/light polish phase added token coverage for `walletRadius`, `surfaceHover`, `backdropBlur`, `focusRing`, `spinnerTrail`, and fallback wallet icon colors. Component CSS still uses `var(--twk-*)` for visual styling, preserving portal safety.
- `mode: "auto"` now resolves to the current system light/dark preference when no explicit `themeName` is provided.
- Modal/account/toast CSS now includes focus-visible outlines, reduced-motion handling, mobile safe-area sheet sizing, portal scrim blur, tokenized hover states, toast spinner, toast dismiss button, and SVG status/action icons instead of text placeholders.
- React and HTML/CDN examples expose the full theme preset list so manual dark/light/custom testing can happen directly on port `5174`.
- UI implementation is now split into focused modules: `styles`, `dom`, `qr`, `modal`, `button`, `toast`, `account-panel`, `themes`, `config`, `icons`, `utils`, and `types`. The package entrypoint must stay a barrel so public API compatibility remains simple while internals stay debuggable.

## UI/UX Pro Max Proposal Criteria

- Product UI should be treated as a fintech/developer-tool hybrid: trusted transaction surfaces plus simple developer defaults.
- Reown-style wallet selection is acceptable as a UX benchmark, but TRON Wallet Kit must keep original token-driven styling and TRON-native account behavior.
- Required UI quality gates: 4.5:1 primary text contrast, visible focus rings, keyboard navigation, icon button labels, 44 px touch targets, no hover-only interactions, no horizontal mobile scroll, and reduced-motion support.
- Modal states must reserve stable dimensions for featured wallets, all-wallets search, connecting detail, WalletConnect QR, account panel, toasts, and recent transactions.
- Theme work must continue to be portal-safe: resolved `--twk-*` tokens are applied directly to wallet kit roots, not inherited from host selectors.
- Before implementation completion, test light/dark desktop, light/dark 375 px mobile, keyboard-only flow, reduced motion, long wallet names, unavailable wallets, QR state, identity loading/error states, and browser/CDN parity.

## 2026-07-04 Phase 1 UI Spec Implementation

- Began implementing the merged `PRODUCT_UX_ADAPTER_PROPOSAL` and `REOWN_UI_SPEC_FOR_TRON`.
- Default `light` and `dark` now use the measured polished modal token values directly instead of adding third-party brand-named theme presets.
- Added TRON-oriented theme names `tron-energy`, `nile`, `shasta`, and `bandwidth`.
- Added semantic badge tokens and `.twk-badge` styling for installed, QR, recent, muted, and TRON states.
- Modal wallet rows now render semantic badges and share adapter-to-wallet-option mapping with React.
- Account panel now avoids duplicated `TRX` fallback text and exposes copy feedback through a polite live region.

## 2026-07-04 Phase 2 UI Routing and Catalog

- Connect modal now has explicit TRON wallet views: `featured`, `all-wallets`, `connecting`, and `qr`.
- Featured view uses a catalog-driven order with TronLink first and WalletConnect last; WalletConnect is treated as a TRON QR transport row, not as a generic multichain badge/category.
- All-wallets view includes a token-driven search input and stable three-column wallet grid with catalog-only entries.
- Connecting and QR views reserve stable centered content regions so switching views does not collapse the modal.
- Modal accessibility now includes visible focus rings, Escape close, backdrop close, focus trap, and restoring focus to the previously active element on close.
- Wallet icon resolution is adapter-first: `adapter.metadata.icon`, then generated catalog data URI, then fallback initial. Runtime hotlinking is intentionally avoided.

## 2026-07-04 WalletButton Baseline

- The React example now uses the wallet kit `WalletButton` surface instead of a local demo button.
- `WalletButton` supports disconnected and connected markup with token-driven icon, label, balance, chevron, pending dot, size, and variant.
- Button theme must come from the same global `ui` config as modal/toast/account surfaces; no separate light default.
- Modal subtitle is empty by default to match the compact Reown-style TRON modal header.
- Remaining UX work: connected WalletButton should toggle/open the account panel controller rather than only opening the connect modal.

## 2026-07-05 Account Button Controller

- React `WalletButton` connected state now toggles a real token-driven account panel using shared account panel markup.
- Account panel dropdown is anchored below the button on desktop and becomes a fixed bottom sheet on small screens.
- Panel interactions now include copy address feedback, disconnect, Escape close, and outside click close.
- Identity and balance lifecycle are non-blocking: identity waits briefly to avoid flicker, balance refreshes on connect and after pending transactions.
- Visual QA screenshots were saved for React light modal, dark modal, and mobile light modal in `Review/screenshots/`.
