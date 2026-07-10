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
## 2026-07-08 WalletConnect QR Panel Stabilization

- WalletConnect QR must be rendered by TRON Wallet Kit UI, not by a WalletConnect/Reown modal.
- The QR panel uses one stable square frame:
  - `.twk-qr-slot.twk-qr-large` reserves a fixed square area up to 340px.
  - `.twk-qr-code`, QR image/svg/canvas, and `.twk-qr-skeleton` fill the same square to prevent layout shift.
  - QR background stays token-driven through `--twk-qr-background`, defaulting to white for dark-mode scan reliability.
- `qr-code-styling` is the primary browser renderer for styled QR codes.
- `qrcode` remains only as a non-DOM/SSR fallback for `createQrDataUrl()` because `qr-code-styling` requires `window`.
- QR flows such as WalletConnect must not auto-close when `manager.connect()` resolves. `closeOnSelect` still applies to direct extension connect flows, but QR panels stay visible so the user can scan/copy/retry until they intentionally close, go back, or select another wallet.
- The QR sticky guard must be applied to both portal and inline controllers. It is set when a QR-capable wallet is selected and reinforced when the manager emits a `qr` event, so late WalletConnect promise resolution cannot collapse or close the QR panel.
- React examples or host apps that display an external WalletConnect URI preview should subscribe to `manager.on("qr")` inside the wallet provider boundary. Avoid storing QR preview state in a parent component that wraps `TronWalletProvider`, because that can remount portal controllers in dev/Strict mode and hide the active QR modal.
- WalletConnect adapters must invoke the per-connect `options.onUri` before any configured external `onUri` callback so active UI flow state updates before app-level preview/log callbacks run.

## 2026-07-08 All Wallets And Install Row Polish

- All Wallets search is treated as a single full-width form group. The search icon lives inside the field on the right to match the compact wallet-selection pattern and reduce visual fragmentation.
- All Wallets loading skeleton cards must center their icon and name placeholders within the same footprint as real wallet cards.
- The featured-view All wallets trigger stays visually lighter than wallet cards. Its count indicator is a compact badge sized by text content, not a fixed-width pill.
- QR/connecting install rows use a muted token-driven surface with a smaller Get action so the row feels like secondary help, not a primary wallet action.

## 2026-07-08 UI Config 2c Desktop Behavior

- Wallet list layout is explicit. `walletList.layout:"list"` renders rows in both Featured and All Wallets; `walletList.layout:"card"` renders three-column cards in both places. The older `"grid"` value is an alias for `"card"`.
- Featured behavior is mode-driven:
  - `manual` respects `featuredWallets` ordering without installed reordering.
  - `installed-first` puts installed extension wallets first, then TRON-ranked recommended wallets.
  - `installed-only` shows installed extension wallets, falling back to WalletConnect when none are installed.
- Featured wallets live in a fixed scroll viewport with a fade mask. The All wallets trigger stays outside that viewport so it remains visible.
- `react-basic` exposes these knobs directly so desktop extension QA can switch modes without code edits.
- Mobile browser/in-app branching from the spec remains a separate implementation step.

## 2026-07-08 Search Stability And TronLink Availability

- Search filtering must preserve card/row footprint. Sparse results align to the top and must not stretch vertically to fill the modal scroll area.
- Async modal renders, including wallet availability refreshes, must preserve the active search input and caret instead of falling through to the default focus target.
- TronLink availability probing should use a short default timeout so the row does not visually lag behind other injected wallets. Apps can still override the timeout when they need a longer TIP-6963/provider wait window.

## 2026-07-08 Modal Focus Discipline

- The close button must never be used as the modal's primary programmatic focus target. DOM order places close before the wallet body, so broad `querySelector()` focus fallback can accidentally create a visible close-button ring after render.
- Modal and inline wallet panels own an invisible `tabindex="-1"` focus target. Non-search renders focus the panel only on view transitions; ordinary availability refreshes should not move focus.
- Search is the only control whose focus and caret are preserved across render because typing replaces the input node.
- Keyboard users still get tokenized focus rings when they intentionally tab to close/back/action/wallet controls.

## 2026-07-08 Featured Wallet Overflow Rules

- Integrator-provided `walletList.featuredWallets` must not be capped by UI config. `featuredLimit` remains only as a deprecated compatibility value and must not affect visible rendering.
- Featured wallet containers use content-sized height plus `max-height`; small lists must not render an empty 360px scroll box.
- Featured fade masks are data-driven and appear only when the measured container overflows. Scroll position determines bottom/top/both fade states.
- Focused wallet items inside the featured scroller should use `scrollIntoView({ block: "nearest" })` so keyboard Tab navigation does not hide the focused row behind the fade.

## 2026-07-08 Mobile Platform-Aware Wallet Lists

- Runtime modal/inline controllers classify wallet UX environment as `desktop-extension`, `mobile-in-app`, or `mobile-browser` from cheap browser signals.
- Static HTML rendering defaults to desktop behavior for SSR/test stability; runtime controllers pass the detected environment into wallet list resolution.
- Desktop lists keep extension/hardware wallets plus WalletConnect; Ledger is a PC hardware wallet and must remain visible on desktop.
- Mobile lists keep mobile-capable wallets plus WalletConnect; hardware wallets such as Ledger are hidden from normal mobile browser lists.
- Mobile browser mode treats installed-first differently from desktop: WalletConnect is shown first, then mobile-capable wallets sorted by TRON rank/name. Extension-only wallets are hidden.
- On mobile browser, `showUnavailable:false` must not hide mobile-capable launch/WC wallets merely because no injected provider exists.

## 2026-07-10 Featured Installed-First Actionability

- Featured installed-first is an actionable surface, not a full wallet directory.
- Desktop featured installed-first must not show pure `NOT INSTALLED` extension wallets.
- Bucket order is installed extensions first, then WalletConnect, then QR-capable wallet fallbacks, then hardware wallets, then loading entries.
- WalletConnect must remain visible after installed wallets when available, even if the installed-wallet group is already larger than the default featured count.
- Recommended order only sorts wallets inside a bucket; it must not decide visibility ahead of actionable state.
- Not-installed extension wallets remain discoverable in All Wallets, where directory/search behavior is expected.
- Manual featured configuration still follows the integrator's explicit list, even if that list includes unavailable wallets.

## 2026-07-10 Featured And All Wallets Rhythm

- Empty/idle status space should be compact; reserve larger vertical space only for visible danger/error copy.
- Featured footer should sit visually close to the All wallets trigger, not create a second large empty block.
- All Wallets should render the same powered-by footer as Featured unless `showPoweredBy:false`; the repeated footer stabilizes perceived panel height during view transitions.
- Featured and All Wallets should share the same wallet-grid max-height rhythm to reduce perceived panel jumping.
- All Wallets uses the same token-driven top/bottom fade overflow affordance as Featured.
- View changes should use a subtle opacity/translate/scale transition and must respect `prefers-reduced-motion`.
