# REOWN UI Spec Code Audit

Date: 2026-07-06
Scope: strict pass after visual feedback on connecting panel, QR panel, and network badge behavior.

## Audit Result

| Spec area | Code area | Status | Notes |
| --- | --- | --- | --- |
| Featured wallet order | `packages/ui/src/wallet-catalog.ts`, `packages/ui/src/modal.ts` | PASS | TronLink first, WalletConnect transport last before Search. |
| Network badge | `packages/ui/src/modal.ts#createNetworkBadgeHtml` | FIXED | Mainnet no longer renders the network badge by default; testnet/custom can render. |
| Connecting spinner around logo | `packages/ui/src/styles.ts`, `packages/ui/src/modal.ts` | FIXED | Ring now follows Reown's loading-thumbnail footprint: no-trail `110x110` SVG rounded-square accent stroke around a 66px logo; radius is `36`, the container stays upright, and only the accent stroke animates with `stroke-dashoffset`. Error badge uses SVG instead of text. |
| Connecting/error install row | `packages/ui/src/modal.ts`, `packages/ui/src/styles.ts` | PASS | Uses metadata `downloadUrl ?? homepage`; no UI hardcode. |
| QR loading skeleton | `packages/ui/src/modal.ts`, `packages/ui/src/styles.ts` | FIXED | Loading state now keeps `.twk-qr-code` wrapper and full-size skeleton in the QR frame; skeleton has its own shimmer and respects reduced motion. |
| QR renderer | `packages/ui/src/qr.ts`, `packages/ui/src/modal.ts`, `packages/core/src/types.ts`, `packages/adapters/walletconnect/src/index.ts` | FIXED | Modal now passes `onUri` through `manager.connect`; WalletConnect composes configured and per-connect URI callbacks; browser smoke confirmed `qr-code-styling` renderer. |
| QR visual hierarchy | `packages/ui/src/modal.ts`, `packages/ui/src/styles.ts`, `packages/ui/src/themes.ts` | FIXED | No body title in QR view, wallet name stays in header, QR is 304px inside a 340px reserve, subtitle sits below QR, URI text is not rendered, QR is always black on white for scan reliability. |
| QR active wallet routing | `packages/ui/src/modal.ts`, `packages/ui/test/theme.test.ts` | FIXED | QR events now preserve the clicked wallet when multiple catalog wallets share `adapterId: "walletconnect"`; exact WalletConnect no longer falls through to TokenPocket. |
| QR copy behavior | `packages/ui/src/modal.ts` | PASS | Copy link is disabled until URI exists and reads controller state instead of visible URI text. |
| Theme portal safety | `packages/ui/src/dom.ts`, `packages/ui/src/modal.ts`, `packages/ui/src/button.ts`, `packages/ui/src/toast.ts` | PASS | Surfaces receive token variables on their own roots. |
| WalletButton account panel | `packages/react/src/index.ts`, `packages/ui/src/account-panel.ts` | PASS | Dropdown/modal panel, address QR sub-view, focus trap, scroll lock, identity/balance skeletons. |
| Real TronLink manual QA | External wallet | DEFER | Requires installed extension and approval/rejection testing. |
| WalletConnect mobile scan QA | External mobile wallet | DEFER | Requires mobile scan of long WC URI; fallback rule remains plain QR without logo if scan reliability fails. |
| Pending connection cancel | Core/UI adapter behavior | DEFER | Core exposes optional `cancelPendingConnection`; modal wiring waits for adapter cancellation standardization. |
| IIFE bundle size | Browser package | DEFER | Functional but large; split adapter globals decision remains release hardening. |

## Browser Smoke

- Route: `http://127.0.0.1:5174/react-basic/`
- Screenshot: `Review/screenshots/react-basic-qr-wiring-smoke.png`
- Observed:
  - `qrRenderer: "styled"`
  - QR SVG present
  - QR skeleton removed after URI arrives
  - no visible `wc:` URI text inside modal
  - no `.twk-qr-theme-action` or QR theme toggle
  - QR background is white in dark theme
  - no body title in QR view
  - WalletConnect QR panel title/install CTA remain WalletConnect even when TokenPocket appears earlier with the same WalletConnect adapter transport
  - mainnet network badge count is 0

## Verification

- `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/core typecheck`
- `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/core test`
- `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
- `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
- `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/adapter-walletconnect typecheck`
- `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/adapter-walletconnect test`
- `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client typecheck`
- `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
- `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react test`
