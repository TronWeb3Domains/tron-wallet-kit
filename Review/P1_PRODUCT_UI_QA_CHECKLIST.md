# P1 Product UI QA Checklist

Updated: 2026-07-24

This checklist covers the product-facing UI pass after the `0.1.0` release prep. It is meant to be executed against `examples/react-basic` first, then the website playground/theme builder. Keep this file English-only because it can be shared with external reviewers.

## Test Surfaces

| Surface | URL | Purpose | Status |
| --- | --- | --- | --- |
| React Basic | `https://127.0.0.1:5174/react-basic/` | Fast SDK/UI integration QA | Pending visual QA |
| Website | `https://127.0.0.1:5175/` | Public docs, playground, theme builder QA | Pending visual QA |

## Required View Matrix

| View | Light desktop | Dark desktop | Mobile sheet | Notes |
| --- | --- | --- | --- | --- |
| Connect wallet featured list | Pending | Pending | Pending | Installed/support status must settle without abrupt layout jump. |
| All wallets | Pending | Pending | Pending | Search stays full width; cards keep stable dimensions; top/bottom fade appears only when overflowing. |
| Connecting panel | Pending | Pending | Pending | Logo spinner must not overlap the wallet icon; retry button state stays stable. |
| WalletConnect QR | Pending | Pending | Pending | QR area keeps skeleton/white scan-safe region; close/back cancels stale QR callbacks. |
| Connected account panel | Pending | Pending | Pending | Opens account panel instead of connect modal; identity/balance settle without text clipping. |
| Address QR | Pending | Pending | Pending | Header controls remain visible; QR and copy action do not overflow. |
| GasFree mode | Pending | Pending | Pending | GasFree appears as a header mode switch; panel keeps avatar/identity parity with general wallet. |
| Recent transactions card | Pending | Pending | Pending | Compact rows use smaller typography and no heavy separators. |
| Activity panel | Pending | Pending | Pending | Rows align vertically, no native scrollbar, top/bottom fades communicate scroll. |
| Transaction preview dialog | Pending | Pending | Pending | Human summary is readable before wallet prompt; cancel returns cleanly. |
| Auth prompt | Pending | Pending | Pending | Optional SIWT prompt does not trap or overlap account panel actions. |

## UX Acceptance Criteria

- No horizontal scroll at 375 px, 430 px, or 480 px viewport widths.
- Touch/click targets are at least 44 px; small visual chips may use expanded hit areas.
- Icon-only controls have accessible labels.
- Focus ring is visible but does not jump to close buttons during search/input.
- Text with descenders such as `g`, `y`, and `p` is not clipped.
- Loading skeletons reserve the same footprint as final content.
- View transitions are calm and respect reduced-motion settings.
- Dark mode uses token-driven colors and keeps text/icons legible.
- Portal rendering does not depend on host app selectors.

## Manual Capture Checklist

Capture screenshots after a clean page load:

1. Featured connect list, light desktop.
2. Featured connect list, dark desktop.
3. All wallets with a search term, light and dark.
4. WalletConnect QR loading and rendered QR.
5. Account panel general state with identity and balance.
6. Account panel GasFree state.
7. Activity panel with mixed mock transactions.
8. Mobile bottom sheet connect and account states.

## Current P1 Status

- Product UI has strong component coverage but still needs live screenshot sign-off after the GasFree, Activity, Account Panel, and release-doc changes.
- Website playground and theme builder should be smoke-tested after browser/IIFE is intentionally rebuilt for a publish or demo pass.
- Browser/IIFE rebuild is not required for this checklist unless the test target is the website public IIFE.
