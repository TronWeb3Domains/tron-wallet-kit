# Changelog

## 0.1.1 - 2026-10-29

### Fixed

- Resolve Ledger, GasFree SDK, and shared TronWeb lazy imports in browser bundlers.
- Keep Ledger connection preparation and on-device address verification inside the kit's waiting panel, without extra adapter modals.
- Allow failed bridge imports to retry and preserve actionable Ledger connection error details.
- Recognize modern SafePal extension and in-app providers, prefer message V2 signing when available, and exclude SafePal aliases from TronLink detection.
- Prefer Trust Wallet's authorized mobile provider, including providers without a request method, and use wallet-owned balance providers.
- Serve the website and custom navigation under `/tron-wallet-kit/`.

### Integration Notes

- All 10 public packages use version `0.1.1` and npm tag `latest`.
- The built-in Ledger flow uses the first TRON account and requires on-device address approval. Real-device signing QA remains manual.
- Apps using the legacy Ledger WebHID dependency must apply the compatible base-transport override documented in the client README; workspace overrides do not propagate to npm consumers.
- GasFree remains optional and requires `@gasfree/gasfree-sdk` when enabled.
- Standalone IIFE builds keep optional GasFree, TronWeb, and Ledger modules external; plain HTML pages need the provider API for GasFree or a bundled entrypoint for SDK-dependent features.
- Public TIP-712 typed-data signing and direct SafePal app-opening deeplinks are not included in this patch.

## 0.1.0

Initial public release preparation.

### Added

- TRON-native core wallet manager, session lifecycle, transaction helpers, and error formatting.
- Token-driven connect modal, account panel, QR panel, toast feedback, theme presets, and wallet catalog UI.
- Client package with built-in wallet descriptors and adapter orchestration.
- Injected wallet strategy/decorator model with shared EIP-6963 installed-signal registry.
- TronLink adapter with TRON-specific detection and signing support.
- WalletConnect lite adapter for TRON QR sessions without the heavier appkit dependency.
- Tronweb3 bridge adapter for optional transport/protocol integrations such as Ledger and MetaMask TRON.
- React provider, wallet button, hooks, and examples.
- Browser/CDN IIFE build named `tron-wallet-kit`.

### Release Notes

- Publish with npm tag `latest`.
- WalletConnect requires an app-provided project ID.
- Core release gates passed locally before npm publish.
