# Coder Notes

## Engineering Rules

- Treat TRON Wallet Kit as an independent project.
- Keep core interfaces TRON-specific but wallet-neutral.
- Keep wallet quirks in adapters.
- Prefer small phases with typecheck, tests, and build after each phase.
- Update this file and `PROJECT_MEMORY.md` after each phase.

## Open Inputs Needed

- Real TronLink provider implementation.
- Real WalletConnect/Reown implementation and config shape.
- Docs site tool decision.
- Release tooling decision, likely Changesets.
- Real TRX Domains lookup QA with known addresses/default domains.

## Initial Technical Bias

- TypeScript-first packages.
- Strict core API contracts.
- Adapter capability detection instead of assuming every wallet supports every operation.
- Token-driven UI with CSS variables mounted where the portal renders.
- Minimal config by default, explicit opt-in for advanced network/provider options.

## Current Tooling

- Package manager: `pnpm` 10.13.1.
- Workspace: `packages/*`.
- Build: `tsup` ESM + CJS + DTS.
- Tests: `vitest`.
- Typecheck: `tsc --noEmit`.
- Lint: ESLint flat config with TypeScript rules.
- Run `pnpm test` and `pnpm build` sequentially, not in parallel. Build cleans `dist`, and tests can resolve workspace package exports through `dist`.

## Current Packages

- `@tron-wallet-kit/core`
- `@tron-wallet-kit/ui`
- `@tron-wallet-kit/client`
- `@tron-wallet-kit/browser`
- `@tron-wallet-kit/react`
- `@tron-wallet-kit/next`
- `@tron-wallet-kit/auth`
- `@tron-wallet-kit/adapter-tronlink` at `packages/adapters/tronlink`
- `@tron-wallet-kit/adapter-walletconnect` at `packages/adapters/walletconnect`

## Notes

- Do not introduce XRPL terms into public TRON APIs.
- Avoid leaking TronLink-specific API shapes into core.
- WalletConnect should be implemented as an adapter with explicit TRON chain/session handling.
- Identity resolution belongs in the client layer, not adapters or UI. Current implementation uses `trondomainjs` behind opt-in `identity: { enabled: true }` and writes normalized `account.domain` / `account.displayName`.
- `trondomainjs` requires `tronweb`. The all-in-one browser IIFE now includes those dependencies when identity helpers are exported, making split browser bundles more urgent before release.
- Architecture source of truth: `docs/TRON_WALLET_KIT_ARCHITECTURE_SPEC.md`.
- Current migration rule: keep compatibility with scaffold-era adapters while moving toward spec-era `WalletManager`/session/transaction lifecycle. Do not expand `WalletClient` further as a pseudo-manager; next client work should wrap the core `WalletManager` and expose `createWalletKit()`.
- Core now has full TRON network configs. New adapter/network code should use `TRON_MAINNET`, `TRON_NILE`, `TRON_SHASTA`, or `NetworkRegistry`, not ad hoc `{ name, chainId }` objects.
- Core source is now split into XRPL-style modules: `adapter`, `errors`, `events`, `manager`, `networks`, `storage`, `types`, and `utils`. Keep `packages/core/src/index.ts` as a barrel only.
- UI source is now split into XRPL-style modules: `types`, `themes`, `config`, `styles`, `dom`, `icons`, `utils`, `qr`, `modal`, `button`, `toast`, and `account-panel`. Keep `packages/ui/src/index.ts` as a barrel only.
- Next UI work should improve behavior inside the focused modules rather than re-growing the package entrypoint: WalletConnect QR/details belongs in `modal`/`qr`, account identity and balance lifecycle belongs in `account-panel`/future `balance`, and toast lifecycle belongs in `toast`.
- TronLink detection note: current TronLink docs say `window.tron.tronWeb` can be `false` until authorization. Do not require `tronWeb` before `eth_requestAccounts` on TIP-1193 providers. Legacy docs also allow separate `window.tronLink` + `window.tronWeb`, so keep that fallback inside the TronLink adapter.
- Upstream TronWallet Adapter note: learn from its `readyState/state/connecting/address` lifecycle and async wallet discovery, especially for TronLink. Keep our public core contract TRON-native and avoid carrying upstream EVM/multichain assumptions into core.

## Clean Architecture Rebuild Notes

- Compatibility bridge has been removed. Do not reintroduce scaffold-era `WalletClient` state, Set capabilities, `sendTrx` as the primary public API, or adapter event contracts as public core assumptions.
- `WalletManager` is now the lifecycle owner. `@tron-wallet-kit/client` wraps it with `createWalletClient()` and `createWalletKit()` plus TRON-native transaction helpers.
- Package exports point to `dist`; after changing exported package types, rebuild foundational packages before relying on downstream workspace imports.
- Clean rebuild verification on 2026-07-03: `pnpm install`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm lint` passed.
- Browser package now emits both debug and minified brand-named IIFE bundles: `tron-wallet-kit.iife.js` and `tron-wallet-kit.iife.min.js`. Keep IIFE builds on `--platform browser`; otherwise `qrcode` can resolve its Node branch and break browser/CDN execution with dynamic `fs` require.

## 2026-07-04 UI Phase 1 Implementation Notes

- `PRODUCT_UX_ADAPTER_PROPOSAL` and `REOWN_UI_SPEC_FOR_TRON` are now active implementation inputs.
- Default `light` and `dark` themes have absorbed the measured polished modal token values directly; do not add third-party brand-named theme presets.
- Current TRON-oriented production theme names include `light`, `dark`, `tron`, `tron-energy`, `nile`, `shasta`, `bandwidth`, `energy`, `sun`, `terminal`, and `highContrast`.
- `mapAdapterToWalletOption()` in `packages/ui/src/wallet-options.ts` is the shared adapter-to-UI mapping. Use it from DOM, browser, and React surfaces instead of hardcoding `available: true`.
- Connect modal rows now use semantic `.twk-badge` states rather than the old ready/unavailable pill. WalletConnect/QR-capable rows should show `QR CODE` even if no injected provider is found.
- Account panel missing balance now renders `-`, not `TRX TRX`, and copy feedback has a polite live region.
- UI tests include automated text contrast coverage for production theme presets.

## 2026-07-04 UI Phase 2 Implementation Notes

- `packages/ui/src/wallet-catalog.ts` is the TRON-only wallet display catalog. Keep it scoped to wallets from the TronWallet Adapter adapter set and TRON WalletConnect routing; do not introduce generic multichain directory concepts.
- Featured wallet order is now catalog-driven: TronLink first, WalletConnect last. Catalog-only mobile wallets may route through `adapterId: "walletconnect"` when that adapter is registered.
- Modal routing now supports `featured`, `all-wallets`, `connecting`, and `qr` views in `packages/ui/src/modal.ts`.
- Modal a11y now includes Escape close, backdrop close, focus trap, and focus restore.
- Wallet icons now live under `packages/client/src/wallets/icons/<id>.svg`; run `pnpm icons:wallets` to regenerate `packages/client/src/wallets/icons.generated.ts`. UI must stay icon-agnostic and receive icons through the runtime catalog injected by client.
- React `ConnectModal` now consumes the same catalog merge path as the DOM modal.

## 2026-07-04 WalletButton Baseline Notes

- `REOWN_UI_SPEC_FOR_TRON` section 4B is now active for button/account-panel work.
- Added shared `createWalletButtonHtml()` and React `WalletButton`. Use these instead of local demo connect buttons.
- Modal subtitle default is now empty; do not reintroduce "Choose a TRON wallet to continue" unless explicitly configured by a host app.
- `createWalletKit()` now passes global `ui` theme into `createWalletButton()` so button and modal theme stay aligned.
- Remaining button parity: connected button should open a real account-panel dropdown/modal controller. Current baseline still opens the existing modal hook.

## 2026-07-05 WalletButton Account Panel + Icon Fetch Notes

- Added `scripts/fetch-wallet-icons.mjs` and root script `pnpm icons:wallets`.
- The local icon generator reads checked-in SVGs from `packages/client/src/wallets/icons/` and generates `packages/client/src/wallets/icons.generated.ts` data URIs. Do not add wallet icons to `packages/ui`.
- Ran `pnpm icons:wallets` successfully; 17 icons were fetched.
- Current generated wallet icon set: WalletConnect, TronLink, MetaMask, OKX, Bitget, Binance, TokenPocket, Trust, GateWallet, FoxWallet, Bybit, imToken, Tomo, Guarda, Backpack, OneKey, and Ledger.
- WalletConnect has a local override at `icon/walletconnect.svg`; `pnpm icons:wallets` copies this file instead of fetching `WalletConnect.svg` remotely, then regenerates both UI catalog data URI and adapter metadata icon.
- React `WalletButton` now toggles a real account panel when connected. The panel uses shared `createAccountPanelHtml`, supports copy/disconnect actions, outside click close, Escape close, address QR, recent transaction rows, and dropdown/modal mode.
- Client lifecycle now supports opt-in identity cache and opt-in balance resolver. `refreshIdentity()` writes `domain/displayName/avatar` into the active session; `refreshBalance()` writes normalized TRX balance into the active session.
- Browser/IIFE build intentionally skipped for this phase per user request; React/example tests were prioritized.
