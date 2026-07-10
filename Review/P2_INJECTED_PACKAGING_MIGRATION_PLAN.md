# P2 Injected Packaging Migration Plan

Date: 2026-07-08

Goal: align default wallet packaging with `WALLET_REGISTRY_SPEC.md`: most TRON extension wallets use the kit's generic injected adapter by default; bridge remains a public interop escape hatch for Ledger, MetaMask-TRON opt-in, and wallets that cannot be handled safely by injected detection.

## Strategy

- Default path: `integration: "injected"` for wallets that expose a TRON provider through wallet-specific globals.
- Bridge path: `integration: "tronweb3-bridge"` only for Ledger/hardware, MetaMask-TRON opt-in, or wallets proven too quirky for generic injected support.
- No package cleanup until real-wallet QA passes for the migrated wallet group.
- Do not accept generic `window.tronLink`, `window.tron`, or `window.tronWeb` unless the selected wallet has an ownership marker or wallet-specific root.
- Keep `ui.walletList` controls unchanged; migration changes runtime integration, not integrator display policy.

## Current State

| Wallet | Current integration | Target integration | QA requirement before switching default | Notes |
| --- | --- | --- | --- | --- |
| TokenPocket | `tronweb3-bridge` | `injected` | Extension connect, address, signMessage, signTransaction; collision test with TronLink installed | Provider roots: `tokenpocket.tron`, `tokenpocket.tronWeb`; avoid generic `tronWeb` unless TP ownership is proven. |
| OKX Wallet | `tronweb3-bridge` | `injected` | Extension connect, address, signMessage, signTransaction | Provider root: `okxwallet.tronLink`. |
| Bitget Wallet | `tronweb3-bridge` | `injected` | Extension connect, address, signMessage, signTransaction; collision test with TronLink installed | Provider helper already exists: `getBitgetInjectedProvider()`. |
| Trust Wallet | `tronweb3-bridge` | `injected` | Extension connect, address, signMessage, signTransaction; collision test with TronLink installed | Provider roots: `trustwallet.tronLink`, `trustwallet.tron`. |
| Gate Wallet | `tronweb3-bridge` | `injected` after phase 1 | Extension connect and signing QA | Provider roots: `gatewallet.tron`, `gatewallet.tronLink`; older request shape may need `eth_requestAccounts`. |
| Bybit Wallet | `tronweb3-bridge` | `injected` after phase 1 | Extension connect and signing QA | Provider root: `bybitWallet.tronLink`. |
| Binance Web3 Wallet | `tronweb3-bridge` | `injected` after phase 1, WC fallback later | Extension connect and signing QA | Upstream has WC fallback; keep WalletConnect behavior separate from injected migration. |
| Guarda | `tronweb3-bridge` | `injected` after phase 1 | Extension connect and signing QA | Provider helper already exists: `getGuardaInjectedProvider()`. |
| OneKey | `tronweb3-bridge` | `injected` after phase 1 | Extension connect and signing QA | Provider roots: `$onekey.tron`, `$onekey.tronLink`. |
| Backpack | `tronweb3-bridge` | `injected` after phase 1 | Extension connect and signing QA | Avoid generic `window.tron` unless `isBackpack` marker is present. |
| SafePal | not present | `injected` | Extension connect and signing QA | SafePal TRON docs expose `window.SafePalHook` + `window.tronWeb`; no upstream tronwallet-adapter package. |
| FoxWallet | `tronweb3-bridge` | `injected` canary | Extension/app connect and signing QA | Upstream adapter is app/mobile-oriented and marks desktop extension unavailable, but provider root is `foxwallet.tronLink`; canary uses generic injected path. |
| imToken | `tronweb3-bridge` | hold | Mobile/app QA required | Mobile-first flow; do not guess desktop extension behavior. |
| MetaMask TRON | `tronweb3-bridge` | opt-in bridge, not default | Dedicated MetaMask TRON QA | Not a generic TRON injected wallet. |
| Ledger | `tronweb3-bridge` | keep bridge optional peer | Real Ledger device QA | Do not reimplement hardware. |

## Phase 0 - Preflight

- Add/confirm tests around `createInjectedTronAdapter`:
  - request method fallback order works for `tron_requestAccounts` then `eth_requestAccounts`.
  - provider-specific roots win over generic globals.
  - missing provider returns unavailable without dynamic import.
  - sign modes `signMessageV2`, `sign`, and `request` remain covered.
- Add cheap availability-probe notes for UI auto-sorting: availability checks must use injected provider roots, not bridge dynamic imports.
- Confirm `WalletDescriptor` entries can carry all needed provider helpers without touching builders.

Status 2026-07-08:

- Done:
  - client test covers `tron_requestAccounts` -> `eth_requestAccounts` fallback.
  - client test covers strict wallet-specific provider roots and rejects generic `tronWeb` bleed-through.
  - client icon generator now accepts SVG/PNG/WEBP so "drop file by wallet id" works for non-SVG source icons too.
- Verified:
  - `pnpm --filter @tron-wallet-kit/client test`
  - `pnpm --filter @tron-wallet-kit/client typecheck`

## Phase 1 - Prominent Extension Wallets

Migrate only after real-wallet QA is green for each row:

1. TokenPocket
   - Change descriptor to `integration: "injected"`.
   - Use TP-owned roots first: `tokenpocket.tron`, `tokenpocket.tronWeb`.
   - Remove broad generic `tronWeb` fallback unless QA proves TP marks ownership safely.
   - Status 2026-07-08: real extension QA passed; descriptor uses injected roots `tokenpocket.tron` and `tokenpocket.tronWeb`; upstream optional package removed from `@tron-wallet-kit/client`.

2. OKX Wallet
   - Change descriptor to `integration: "injected"`.
   - Use `detect.providerPaths: ["okxwallet.tronLink"]`.
   - Status 2026-07-08: real extension QA passed; descriptor uses injected root `okxwallet.tronLink`; upstream optional package removed from `@tron-wallet-kit/client`.

3. Bitget Wallet
   - Change descriptor to `integration: "injected"`.
   - Use `detect.provider: getBitgetInjectedProvider`.
   - Keep provider paths as secondary only if helper needs them.
   - Status 2026-07-08: real extension QA passed after request binding fix; descriptor uses injected helper `getBitgetInjectedProvider()` plus Bitget-owned roots `bitkeep.tronLink` and `bitkeep.tron`; upstream optional package removed from `@tron-wallet-kit/client`.

4. Trust Wallet
   - Change descriptor to `integration: "injected"`.
   - Use `detect.providerPaths: ["trustwallet.tronLink", "trustwallet.tron"]`.
   - Re-run TronLink-vs-Trust collision tests.
   - Status 2026-07-08: real extension QA passed; descriptor uses injected roots `trustwallet.tronLink` and `trustwallet.tron`; upstream optional package removed from `@tron-wallet-kit/client`.

Phase 1 exit criteria:

- All four wallets connect successfully on real extension installs.
- All four return the selected wallet address, not another installed wallet's address.
- All four can sign message and transaction.
- Client typecheck and tests pass.
- Browser/react basic smoke still shows correct icon/status.

## Phase 2 - Secondary Extension Wallets

Migrate in smaller batches:

1. Gate + Bybit
   - Status 2026-07-08: QA accepted; both descriptors use `integration: "injected"` with wallet-owned roots:
     - Gate: `gatewallet.tron`, `gatewallet.tronLink`
     - Bybit: `bybitWallet.tronLink`, `bybitWallet.tron`
   - Upstream optional packages removed from `@tron-wallet-kit/client`.
2. Guarda + OneKey
   - Status 2026-07-08: real extension QA passed; both descriptors use `integration: "injected"` with wallet-owned roots:
     - Guarda: helper `getGuardaInjectedProvider()` plus `guarda.tron`, `guarda`
     - OneKey: `$onekey.tron`, `$onekey.tronLink`
   - Upstream optional packages removed from `@tron-wallet-kit/client`.
3. Binance Web3 Wallet + Backpack
   - Status 2026-07-08: QA accepted; both descriptors use injected integration.
   - Both descriptors use `integration: "injected"` with wallet-owned roots:
     - Binance: helper `getBinanceInjectedProvider()` over `binancew3w.tron`; upstream optional package removed from `@tron-wallet-kit/client`.
     - Backpack: `backpack.tron`, `backpack.tronLink`; upstream optional package removed from `@tron-wallet-kit/client`.
4. FoxWallet + SafePal
   - Status 2026-07-08: FoxWallet is mobile/app-only per official TRON docs; SafePal code canary done; SafePal real extension QA pending.
   - FoxWallet now uses `integration: "injected"` with roots `foxwallet.tronLink` and `foxwallet.tron`, plus `getFoxWalletInjectedProvider()` to merge parent `window.foxwallet.request/tronWeb` when extension variants expose TRON capability there.
   - FoxWallet remains isolated to the `window.foxwallet` namespace to avoid TronLink/Trust/TokenPocket global collisions.
   - FoxWallet platforms are `["mobile"]` and transport is mobile in the registry until Chrome extension TRON support is officially shipped.
   - SafePal added as a built-in injected descriptor using helper `getSafePalInjectedProvider()` over `SafePalHook` + `tronWeb`.
   - SafePal code QA hardened 2026-07-08:
     - no raw `SafePalHook` provider-path fallback in the client descriptor
     - unavailable when `SafePalHook` exists without `tronWeb`
     - connects when `SafePalHook.defaultAddress` is populated after approval
     - supports in-app preconnected sessions with no request method exposed
   - FoxWallet upstream optional package cleanup is blocked on real mobile/app QA; SafePal has no upstream package.

Exit criteria per batch:

- Real extension QA for connect/address/signing.
- Collision QA if wallet exposes shared `tronLink`, `tron`, or `tronWeb`.
- No bundle/runtime dependency on the removed upstream package.

## Phase 3 - Packaging Cleanup

Only after Phase 1 and each Phase 2 batch pass:

- Remove migrated wallet packages from `packages/client/package.json` `optionalDependencies`.
- Keep `@tronweb3/tronwallet-adapter-ledger` as optional peer.
- Keep MetaMask-TRON out of defaults; document app-owned opt-in bridge.
- Update lockfile with `pnpm install --ignore-scripts`.
- Run package verification.

## Phase 4 - Docs and Review Updates

- Update `ADAPTER_BEHAVIOR_NOTES.md` with final per-wallet integration mode.
- Update `TRONWALLET_ADAPTER_BRIDGE_SPEC.md` to state bridge is no longer the default path for injected TRON wallets.
- Update `ADD_NEW_WALLET_GUIDE.md`: first question should prefer injected TRON provider before bridge, unless hardware/MetaMask/custom.
- Update public/local usage docs only when release-docs policy is clarified.

## QA Matrix

For every migrated wallet:

- Installed state badge is correct.
- Connect opens the selected wallet, not another installed wallet.
- User rejection maps to `USER_REJECTED`.
- Missing extension maps to unavailable/not installed without throwing.
- Returned address matches wallet UI.
- `signMessage` works with the configured sign mode.
- `signTransaction` returns a signed transaction object.
- Disconnect clears local session.
- Re-selecting another wallet cancels stale connect/QR/render state.
- All Wallets sort keeps supported/installed wallets at top.

## Recommended Execution Order

1. Phase 0 tests and cheap probe guardrails. Done 2026-07-08.
2. TokenPocket injected descriptor canary. Done 2026-07-08; real extension QA passed.
3. OKX injected descriptor. Done 2026-07-08; real extension QA passed.
4. Bitget injected descriptor. Done 2026-07-08; real extension QA passed after request binding fix.
5. Trust injected descriptor and collision regression. Done 2026-07-08; real extension QA passed.
6. Remove Phase 1 upstream optional deps. Done 2026-07-08.
7. Gate + Bybit injected descriptor canary. Done 2026-07-08; QA accepted.
8. Guarda + OneKey injected descriptor canary. Done 2026-07-08; real extension QA passed.
9. Remove Guarda + OneKey upstream optional deps. Done 2026-07-08.
10. Binance Web3 Wallet + Backpack injected descriptor canary. Done 2026-07-08; QA accepted.
11. Remove Gate/Bybit/Backpack upstream optional deps. Done 2026-07-08.
12. FoxWallet + SafePal injected descriptor canary. Code done 2026-07-08; real extension QA pending.
13. Final package cleanup and docs.

## Commands Per Batch

```powershell
pnpm --filter @tron-wallet-kit/client typecheck
pnpm --filter @tron-wallet-kit/client test
pnpm --filter @tron-wallet-kit/ui test
pnpm --filter @tron-wallet-kit/react test
pnpm --filter @tron-wallet-kit/browser typecheck
pnpm --filter @tron-wallet-kit/examples typecheck
```

Release gate remains:

```powershell
pnpm -r typecheck && pnpm test && pnpm build:browser
```
