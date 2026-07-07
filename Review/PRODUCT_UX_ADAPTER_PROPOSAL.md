# TRON Wallet Kit Product, UX, and Adapter Proposal

Date: 2026-07-04

Status: Approved with conditions after `Review/REVIEW_2026-07-04_UX_ADAPTER_PROPOSAL.md`

## Context

TRON Wallet Kit is intended to be a TRON-native wallet kit, not a general wallet aggregator, not a fork of XRPL Wallet Kit, and not a clone of TronWallet Adapter. The project should reuse strong architecture, UI patterns, documentation discipline, and release discipline from XRPL Wallet Kit, while keeping TRON-specific behavior inside TRON adapters and TRON-native APIs.

Recent benchmark references:

- TronWallet Adapter / WalletAdapter docs: useful technical adapter checklist.
- Reown AppKit demo: useful modal UX benchmark only, not a naming/API/brand dependency.
- ConnectKit and RainbowKit: useful polished wallet UX benchmarks.
- XRPL Wallet Kit: internal architecture, UI system, docs, and product quality benchmark.
- TronWallet Adapter adapters directory: source-of-truth for supported wallet scope.

## Review Outcome

The review verdict is approve with conditions.

Accepted direction:

- Product positioning is correct: polished wallet UX similar in quality to mature wallet kits, but TRON-native.
- Architecture boundaries are correct: core stays clean, adapter-specific behavior stays inside adapters, and UI remains token-driven and portal-safe.
- The UI/UX checklist is strong enough for a fintech wallet surface.

Required corrections before implementation:

- Add an explicit current-code gap analysis so the proposal does not read as if the polished multi-view modal already exists.
- Make `light` and `dark` the default high-quality modal themes; do not use third-party brand names in code theme names.
- Treat IIFE bundle splitting and i18n as deliverables, not only risks.
- Add automated contrast testing to the quality gate.
- Keep MetaMask TRON as an early adapter candidate through the TRON adapter package scope, but do not overload the first UI phase with MetaMask adapter implementation.

## Product Positioning

TRON Wallet Kit should match the polish level of Reown AppKit, RainbowKit, and ConnectKit while remaining a TRON-only wallet kit.

The main product differentiation should be:

- TRON-native wallet connection and transaction flows.
- Polished connect modal with wallet search and clear wallet states.
- Strong light, dark, and custom theme support through `themeName`.
- Account panel with address, copy, QR, balance, identity, and transaction feedback.
- Browser/CDN IIFE support for legacy and non-React sites.
- Optional TRX Domains identity resolution using `trondomainjs`.
- Clean adapter architecture where wallet-specific quirks do not leak into core or UI.

WalletAdapter should be treated as a technical reference, not a UX target.

## Adapter Scope

Supported wallets should come from the TRON adapter ecosystem, not from a generic wallet directory.

Source-of-truth for wallet scope:

- `https://github.com/tronweb3/tronwallet-adapter/tree/main/packages/adapters`

Current adapter packages visible in that directory include:

- `tronlink`
- `walletconnect`
- `metamask-tron`
- `okxwallet`
- `tokenpocket`
- `trust`
- `binance`
- `bitkeep`
- `bybit`
- `foxwallet`
- `gatewallet`
- `guarda`
- `imtoken`
- `ledger`
- `onekey`
- `tomowallet`
- `backpack`

Rules:

- Wallet catalog entries must map to TRON-compatible adapters or TRON WalletConnect flows.
- Do not add wallets only because they are popular outside the TRON adapter ecosystem.
- Do not add non-TRON product badges or categories.
- If a wallet has broader non-TRON capabilities, TRON Wallet Kit should still present only the TRON-compatible path.
- Network terminology should use TRON network language such as mainnet, Nile, Shasta, or custom TRON RPC.

## Current Gap Analysis

The current codebase has a solid foundation, but the UI implementation is still below the proposal target. This section is the source of truth for what exists now versus what must be built.

| Area | Current state | Target state | Priority |
| --- | --- | --- | --- |
| Connect modal | One flat wallet list with one status pill | Multi-view polished modal: featured, all-wallets search, connecting detail, QR | P0 |
| Wallet availability | UI mapping currently does not fully expose adapter availability/ready state | `isAvailable()` feeds `readyState`, badges, disabled states, install/retry affordances | P0 |
| Wallet search | Not implemented | Searchable all-wallets grid with stable layout | P0 |
| Badges | Basic status text only | `INSTALLED`, `NOT INSTALLED`, `QR CODE`, `RECENT`, `COMING SOON`, `UNAVAILABLE` (`TRON` optional for MetaMask) | P0 |
| Modal a11y | Focus-visible CSS exists, but no complete focus trap/Escape/focus restore flow | Keyboard-complete modal with focus trap, Escape close, focus restore, backdrop close | P0 |
| Default light/dark themes | Existing presets are token-driven, but the default `light` and `dark` themes still need to match the new modal target | Upgrade `light` and `dark` directly and align proposal/docs/code | P0 |
| Account panel | Stronger than modal; supports address, QR, balance, domain/displayName fields, recent tx foundation | Fix balance fallback, add screen-reader copy feedback, wire real identity/balance lifecycle | P1 |
| TronLink events | Review found doc/code drift around account/network change forwarding | Either implement event forwarding or correct adapter notes | P1 |
| Transaction lifecycle | Submit/update foundation exists, but confirmation polling is not complete | Add submitted/confirmed/failed/unknown lifecycle | P1 |
| Browser IIFE | Functional but large because optional heavy features can be bundled together | Split optional WalletConnect/identity/tronweb-heavy paths before public release | P1 |
| i18n | Static label overrides exist, but no locale layer | Add locale-ready copy contract for modal/account/toast | P1 |
| Contrast QA | Manual checklist exists | Add automated contrast checks for theme presets | P1 |

## What To Reuse From WalletAdapter

Recommended to reuse conceptually:

- Wallet readiness states:
  - installed
  - loadable
  - not detected
  - unsupported
- Adapter capabilities:
  - connect
  - disconnect
  - signMessage
  - signTransaction
  - sendTransaction
  - WalletConnect QR support where applicable
- Adapter events:
  - connect
  - disconnect
  - accountChanged
  - networkChanged
  - error
- Adapter package separation and provider detection discipline.
- Wallet metadata: name, icon, homepage, download URL, platform support, capabilities.

Recommended not to copy directly:

- Basic UI model.
- React-only assumptions.
- Select-wallet-now, connect-after-render sequencing if it makes the public API less ergonomic.
- Any implementation detail that assumes WalletAdapter package structure.

## UX Direction

The modal should follow a polished wallet-kit structure while remaining original and TRON-branded.

Connect / Account button (was missing; ported from XRPL Wallet Kit `packages/ui/src/button.ts` — see `Review/REOWN_UI_SPEC_FOR_TRON.md` §4B):

- One `WalletButton` handles both the Connect trigger and the connected Account trigger.
- States: `disconnected` (label "Connect Wallet", opens modal), `connecting`, `connected` (adapter icon + TRX Domain or short address + optional TRX balance + chevron + pending-tx dot, opens account panel).
- Sizes `sm|md|lg` (44/46/50px), variants `default|pill|minimal`.
- Account panel in `dropdown` or `modal` mode with hero avatar, address + QR, balance chip, activation warning, collapsible recent transactions, and copy/explorer/disconnect actions.
- Focus trap, Escape, click-outside, scroll lock, reduced-motion; identity via `trondomainjs`, explorer via Tronscan. TronLink disconnect must be described as local-only.

Recommended modal views:

- `featured`: first screen showing ~5-6 wallets then Search. Order: **TronLink first (default)** → 3-4 popular TRON wallets (OKX, Bitget, TokenPocket, Trust) → **WalletConnect at the end of the featured group** → `Search wallet`. MetaMask TRON is not in the default featured list until its adapter is audited.
- `all-wallets`: searchable wallet grid with wallet icons and status badges. No third-party "certified" filter; the catalog is the TRON adapter scope.
- `connecting`: detail screen showing the selected wallet icon, progress state, retry action, and install action when needed.
- `qr`: QR view for mobile connection (WalletConnect transport, shown per wallet).
- `account`: connected account panel.

Recommended badges (single unified set, see `Review/REOWN_UI_SPEC_FOR_TRON.md`):

- `INSTALLED`
- `NOT INSTALLED`
- `QR CODE`
- `RECENT`
- `COMING SOON`
- `UNAVAILABLE`

`TRON` may be used as an optional secondary badge for MetaMask TRON after audit. Do not use a `WALLETCONNECT` or `MULTICHAIN` badge; WalletConnect wallets use `QR CODE`.

Recommended layout rules:

- Stable modal dimensions between states.
- No layout jump when switching between featured, search, QR, and connecting views.
- Wallet icons are always visible, with tokenized fallback icons.
- Search input and wallet grid should work in both light and dark modes.
- Modal theme must remain correct when portaled to `body`.
- Component colors must come from theme tokens, not host CSS selectors or hardcoded component colors.

## UI/UX Pro Max Review Criteria

This proposal should be evaluated against the `ui-ux-pro-max` critical and high-priority checks before implementation. The wallet kit UI is a product component embedded into third-party sites, so it needs stronger polish and resilience than a basic demo modal.

### Product Type

TRON Wallet Kit UI should be treated as a fintech/developer-tool hybrid:

- Fintech expectations: trust, clarity, careful transaction feedback, accessible contrast, and clear error recovery.
- Developer-tool expectations: simple defaults, predictable configuration, strong docs, and easy debugging.
- Consumer-wallet expectations: fast connect flow, recognizable wallet logos, mobile-friendly QR/deep-link behavior, and minimal friction.

### Visual Style Direction

Recommended style:

- Minimal, high-trust fintech surface.
- Polished wallet modal structure for familiarity.
- TRON-accented brand moments through tokens, icons, and primary action color.
- No decorative gradients, blobs, or oversized marketing UI inside wallet surfaces.
- Strong light/dark parity, designed together instead of dark mode being an inversion.

Avoid:

- One-note blue/purple palette across every surface.
- Hardcoded component colors.
- Emoji or inconsistent icon styles.
- Overly transparent glass surfaces that reduce contrast.
- Card-inside-card composition.

### Accessibility Requirements

Required before marking UI production-ready:

- Primary text contrast: at least 4.5:1 in light and dark themes.
- Secondary text contrast: at least 3:1 in light and dark themes.
- Every icon-only button has an accessible label.
- Wallet rows, wallet cards, close, back, retry, copy, QR, and disconnect controls are keyboard reachable.
- Focus ring is visible and token-driven.
- Color is never the only indicator of state; badges or text must clarify installed, unavailable, pending, success, or error states.
- Toasts use polite live-region behavior and must not steal focus.
- Escape closes dismissible modal states.
- Back behavior is predictable in multi-view modal states.

### Touch And Interaction Requirements

Required interaction baseline:

- Interactive targets are at least 44 x 44 px.
- Wallet rows/cards give pressed or active feedback within 100 ms.
- Async connect/sign/send actions disable duplicate triggers and show progress.
- Retry and install actions are visible on failure or unavailable states.
- Disabled states are semantic and visually distinct.
- The modal does not rely on hover-only interactions.

### Layout And Responsive Requirements

Required layout baseline:

- Modal uses stable width, min-height, max-height, and internal scroll rules.
- Switching between featured, all-wallets, connecting, and QR views must not cause surprising layout jumps.
- Search input, wallet grid, QR area, and account panel reserve fixed or predictable space.
- No horizontal scroll on 375 px mobile width.
- Mobile uses safe-area-aware spacing and `dvh`-friendly sizing.
- Wallet grid supports long wallet names through truncation with full label available through title/accessible name.
- Recent transactions and identity/balance loading states reserve space to prevent cumulative layout shift.

### Motion Requirements

Recommended motion:

- Micro-interactions: 150-300 ms.
- Use opacity and transform, not width/height animation.
- Forward navigation into wallet detail should feel spatially connected.
- Back navigation should reverse the direction.
- Respect `prefers-reduced-motion`.
- Loading animation should not block interaction outside the active operation.

### Theme Requirements

Required theme behavior:

- All visual styling uses semantic `--twk-*` tokens.
- Portal root receives resolved CSS variables directly.
- `themeName` presets cover both product styles and practical testing modes.
- Light and dark variants must be reviewed separately.
- Focus, hover, pressed, disabled, error, success, warning, and QR states must exist in every theme.
- Custom themes should override tokens without requiring host CSS selectors.

### Recommended UI QA Checklist

Before each UI phase is considered complete:

1. Test light and dark modal on desktop.
2. Test light and dark modal at 375 px mobile width.
3. Test keyboard-only connect flow.
4. Test reduced-motion.
5. Test long wallet names and unavailable wallet states.
6. Test WalletConnect QR state with reserved QR dimensions.
7. Test account panel with unresolved identity, resolved TRX Domains identity, balance loading, and balance error.
8. Confirm no text overlaps or button labels overflow.
9. Confirm no component depends on host CSS selectors.
10. Confirm browser/CDN IIFE renders the same surfaces as React.
11. Run automated contrast checks for every production theme preset.

## ThemeName Priority

`themeName` should be a first-class developer option and a visible product feature.

Theme source-of-truth requirement:

- `themes.ts`, UI docs, examples, and this proposal must list the same production presets.
- The default `light` and `dark` presets must carry the high-quality modal look from the start; do not create brand-named presets based on third-party products.
- Experimental presets may exist, but docs should clearly distinguish production presets from playground presets.

Recommended production theme names:

- `light`
- `dark`
- `tron`
- `tron-energy`
- `nile`
- `shasta`
- `sun`
- `bandwidth`
- `energy`
- `terminal`
- `highContrast`

Existing playground or extended presets that may remain available after contrast review:

- `default`
- `graphite`
- `glass`
- `minimal`
- `rounded`
- `crisp`
- `soft`
- `neon`
- `midnight`
- `ocean`

Example target API:

```ts
createTronWalletKit({
  themeName: "dark",
  mode: "auto",
  customTheme: {
    accent: "#00E5FF"
  }
});
```

Theme requirements:

- All presets must resolve to the same token contract.
- `mode: "auto"` should resolve to system light or dark preference unless `themeName` explicitly defines the full look.
- Portal roots must receive CSS variables directly.
- Custom token overrides must work without depending on host application CSS.
- Automated contrast tests should validate primary text, secondary text, borders, badges, and action states for production presets.

## i18n And Copy Readiness

The UI currently supports static label overrides, but the target product needs a locale-ready copy layer.

Requirements:

- Modal, account panel, toast, QR, install, retry, error, and transaction copy must come from a shared labels/locale contract.
- Default English copy should remain simple and developer-friendly.
- Vietnamese or other locales should be possible without rewriting components.
- Dynamic values such as wallet names, domains, balances, and hashes must be interpolated safely.
- Screen-reader-only copy should be part of the labels contract where needed.

## Adapter Priority

### Adapter Wave A: Foundation

1. TronLink
2. WalletConnect

TronLink and WalletConnect remain the minimum viable adapters for a TRON-native wallet kit. They should stay the first implementation wave because the next UI phase already includes substantial modal routing, search, badge, QR, a11y, and theme work.

### Adapter Wave B: Early MetaMask TRON Track

MetaMask TRON should move into the early adapter track after the modal foundation is in place. The TRON adapter ecosystem includes `metamask-tron`, so implementation should start from that adapter scope instead of inventing a new integration.

MetaMask adapter research notes:

- Source: `https://github.com/tronweb3/tronwallet-adapter/tree/main/packages/adapters/metamask-tron`
- Adapter package scope: `metamask-tron`
- Expected interface support to audit:
  - `connect`
  - `disconnect`
  - `signMessage`
  - `signTransaction`
  - TRON network switching where supported by the adapter
  - adapter state and ready state
  - account, TRON network, ready-state, state, and error events
- Proposed TRON Wallet Kit treatment:
  - create a dedicated `packages/adapters/metamask` wrapper after audit
  - keep MetaMask-specific quirks inside that adapter
  - mark it as `TRON via MetaMask` or `MetaMask TRON` in UI copy if needed
  - use `TRON` as the product badge

### Adapter Wave C: Additional TRON Adapters Or Wallet Catalog Entries

Prioritize adapters from the TRON adapter package list:

1. OKX Wallet
2. Bitget Wallet
3. TokenPocket
4. Trust Wallet
5. SafePal
6. Binance Web3 Wallet
7. imToken
8. Bybit Wallet
9. Gate Wallet
10. FoxWallet
11. OneKey
12. Ledger

Some of these may initially be represented as catalog entries routed through the TRON WalletConnect adapter instead of dedicated native adapters.

### MetaMask Position

MetaMask should now be treated as an early TRON-supported wallet candidate through the TRON adapter scope.

Recommended approach:

- Add MetaMask TRON to the featured wallet list alongside WalletConnect and TronLink after audit.
- Create a dedicated adapter wrapper around the TRON `metamask-tron` adapter behavior after verifying package behavior locally.
- Keep MetaMask-specific TRON network/provider behavior isolated in `packages/adapters/metamask`.
- Badge MetaMask as `TRON`.
- Test `connect`, `signMessage`, `signTransaction`, TRON network switching where supported, account changes, disconnect, and unavailable states before marking it production-ready.

## Identity And TRX Domains

Identity should be an optional extension point, not hardcoded into core.

Recommended direction:

- Use `trondomainjs` for TRX Domains resolution.
- Surface resolved names in account panel, recent transaction rows, and copy/share views.
- Keep resolver failures non-blocking.
- Cache resolved identity with a short TTL.
- Keep raw address available at all times.

This is a strong differentiation versus generic wallet adapters because it creates a TRON-specific account experience, not only a connection abstraction.

## Proposed Implementation Phases

### Phase 1: Proposal Corrections And UI Foundation Wiring

Deliverables:

- Wire adapter `isAvailable()` into modal `readyState`.
- Render `INSTALLED`, `NOT INSTALLED`, `QR CODE`, and `RECENT` badges from wallet metadata/state (no `WALLETCONNECT`/`MULTICHAIN` badge).
- Fix account-panel balance fallback so missing balance cannot render `TRX TRX`.
- Add screen-reader feedback for copy actions.
- Upgrade the default `light` and `dark` presets and align theme lists across proposal, UI docs, examples, and `themes.ts`.
- Add automated contrast tests for production theme presets.

Validation:

- UI typecheck.
- UI tests.
- Theme contrast test.
- Examples typecheck.
- Browser/CDN smoke.

### Phase 2: Polished Modal Routing And A11y

Deliverables:

- Add modal view routing: `featured`, `all-wallets`, `connecting`, and `qr`.
- Add wallet catalog model and featured wallet list.
- Add all-wallets searchable grid.
- Add connecting detail screen with retry/install affordances.
- Add TRON WalletConnect QR view with reserved dimensions.
- Add focus trap, Escape handling, focus restore, and backdrop close.
- Keep modal dimensions stable between states.

Validation:

- UI typecheck.
- UI tests for view routing, search, badges, QR, and keyboard flow.
- Light/dark desktop visual QA.
- Light/dark 375 px mobile visual QA.
- Reduced-motion check.
- Browser/CDN IIFE smoke.

### Phase 3: Adapter Readiness And Metadata

Deliverables:

- Normalize adapter `readyState`.
- Normalize adapter metadata, icons, install URLs, and capabilities.
- Ensure TronLink and WalletConnect expose consistent capabilities.
- Resolve TronLink event/doc drift: implement account/network event forwarding or correct notes.
- Add catalog entries only for wallets in the TRON adapter package scope before creating many dedicated native adapters.
- Decide wallet icon sourcing policy: bundled assets, local data URIs, or audited registry with license notes.

Validation:

- Core typecheck and tests.
- Adapter typechecks.
- Wallet detection tests where possible.
- Adapter behavior notes update.

### Phase 4: MetaMask TRON Adapter Audit And Wrapper

Deliverables:

- Audit the TRON `metamask-tron` adapter locally.
- Add `packages/adapters/metamask` wrapper if audit passes.
- Verify `connect`, `disconnect`, `signMessage`, `signTransaction`, TRON network switching where supported, account changes, network changes, ready-state changes, and unavailable state.
- Add MetaMask to featured wallets only after behavior is verified.

Validation:

- Adapter typecheck.
- Adapter unit tests.
- Manual browser test where possible.
- Update wallet test matrix.

### Phase 5: Account Panel Identity And Balance Lifecycle

Deliverables:

- Add optional identity resolver using `trondomainjs`.
- Surface resolved TRX Domains identity in account panel.
- Add balance loading, success, and error states.
- Keep raw address visible or accessible.
- Keep resolver failures non-blocking.
- Add recent transaction state placeholders with stable layout.

Validation:

- Core/client/UI typecheck.
- Identity resolver tests or mocked tests.
- Account panel UI tests.
- Portal theme check.

### Phase 6: Transaction UX And Confirmation Lifecycle

Deliverables:

- `signMessage`.
- `signTransaction`.
- `send TRX`.
- Transaction toast submitted/success/error states.
- Recent transaction rows.
- Light confirmation polling with `tx_confirmed`, `tx_failed`, and `unknown`.
- Broadcast real signed transactions before marking generic submissions as `submitted`.

Validation:

- Adapter behavior notes.
- Transaction test matrix updates.
- UI and client tests.
- Manual test with testnet wallet where possible.

### Phase 7: Browser Bundle Splitting, i18n, Docs, And Examples

Deliverables:

- Split browser/IIFE bundles so optional TRON WalletConnect, identity, and tronweb-heavy paths do not make the default browser build unnecessarily large.
- Add locale-ready labels contract for modal, account panel, toast, QR, install, retry, and errors.
- React basic example.
- HTML CDN/IIFE example.
- Theme gallery with default `light` and `dark` as the primary polished themes.
- Adapter docs.
- TRON WalletConnect setup docs.
- MetaMask TRON docs if wrapper ships.
- TRX Domains identity docs.

Validation:

- Website build.
- Examples build.
- Browser IIFE smoke for default and optional bundles.
- Docs API consistency check.

## Main Risks

- MetaMask TRON support should be audited carefully because `metamask-tron` exists in the TRON adapter ecosystem, but TRON Wallet Kit still needs to verify package behavior, TRON network behavior, event semantics, and browser compatibility before marking the adapter production-ready.
- MetaMask should not block the first polished modal foundation phase.
- TRON WalletConnect, `trondomainjs`, and tronweb-heavy code can make the all-in-one browser IIFE large; bundle splitting is now a deliverable, not only a risk.
- Too many dedicated adapters too early can slow product UX work.
- Wallet icon sourcing must be handled carefully to avoid unreliable hotlinks or licensing issues; Phase 3 must define a concrete icon policy.
- UI must not depend on host app CSS because modal roots can portal to `body`.
- Existing code/document drift must be resolved before release notes or public docs imply capabilities that are not wired in code.

## Recommendation

Proceed with a corrected UI-first path:

1. First close the P0 gap items: wallet readiness wiring, badges, upgraded default `light`/`dark`, account-panel balance fallback, copy a11y feedback, and contrast tests.
2. Then build polished modal routing: featured, all-wallets search, connecting detail, and QR, with focus trap/Escape/focus restore/backdrop close.
3. Keep the first adapter implementation wave focused on TronLink and WalletConnect while UI foundation lands.
4. Audit `metamask-tron` and wrap it as the next early adapter after the modal foundation is stable.
5. Treat bundle splitting and i18n as required product deliverables before public release.

This gives the project a sharper product identity: technical adapter quality from the TRON adapter ecosystem, polished wallet UX, and TRON-specific identity/account value through TRX Domains.
