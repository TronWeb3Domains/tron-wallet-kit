# Implementation Status 2026-07-07

Companion status for `IMPLEMENTATION_HANDOFF.md`.

## Completed

- P0 core runtime hardening was completed earlier in this session.
- P1 UI i18n/config is done:
  - locale packs: `en`, `vi`
  - app `labels` overrides
  - localized modal, wallet badges, wallet button, account panel, and toast copy
  - modal behavior/branding knobs
  - resolved QR config
  - account panel visible transaction count and explorer config
- P1.5 identity direct contract is done:
  - removed `trondomainjs`
  - direct TRX Domains contract resolver
  - mainnet-only guard
  - multi-TLD preservation
  - metadata enrichment
  - timeout fallback
  - unit tests with mocked TronWeb/contract
- P1.5 UI hardening is done:
  - shared clipboard copy helper with `navigator.clipboard` plus `execCommand` fallback
  - QR copy only shows copied state after a successful copy
  - React account panel copy uses the same helper
  - wallet icon image failure falls back to the wallet initial
  - QR render failures show an error state instead of a blank slot

## Partial

- P3 mechanical client split is complete:
  - `types.ts` owns public client/kit/adapter/identity/balance types
  - `injected/detect.ts` owns injected provider detection and request helpers
  - `injected/registry-map.ts` owns registry-to-config mapping helpers
  - `adapters/injected.ts` owns the injected adapter factory
  - `adapters/bridge.ts` owns bridge adapter factories
  - `adapters/combinators.ts` owns availability-probe and fallback wrappers
  - `adapters/defaults.ts` owns default bridge wallet descriptors/importers
  - `tronweb.ts` owns shared TronWeb and wallet-specific balance provider detection
  - `balance.ts` owns TRX balance resolver and SUN normalization
  - `identity.ts` owns direct TRX Domains resolver
  - `client.ts` owns default adapter assembly and `createWalletClient`
  - `kit.ts` owns `createWalletKit`
  - `index.ts` is now a barrel export
- P3 wallet descriptor registry phase 1 is complete:
  - added `packages/client/src/wallets/types.ts` descriptor union
  - added one descriptor entry per current runtime wallet in `packages/client/src/wallets/entries/`
  - added `packages/client/src/wallets/registry.ts`
  - added `packages/client/src/wallets/build-adapters.ts`
  - `createDefaultAdapters()` now builds default runtime adapters from wallet descriptors
  - removed the older duplicated `adapters/defaults.ts` runtime list
  - exported wallet descriptor APIs from the client barrel

## Pending

- P2 remains code-complete at bridge level but still needs real wallet QA/docs/package decision.
- P3 wallet descriptor registry still needs a later UI/core unification phase if the package boundary is changed or a generated shared manifest is introduced.
