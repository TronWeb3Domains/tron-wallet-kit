# Changelog

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
