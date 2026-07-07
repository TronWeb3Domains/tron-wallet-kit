# Introduction

TRON Wallet Kit is a dedicated wallet kit for TRON dApps. It borrows architecture and release discipline from XRPL Wallet Kit, but it does not carry XRPL assumptions into TRON.

The current MVP focuses on:

- TronLink connect.
- WalletConnect TRON connect.
- Account panel.
- Copy address.
- Address QR.
- TRX balance slot.
- `signMessage`.
- `signTransaction`.
- Send TRX foundation.
- Transaction toast foundation.
- Recent transactions foundation.
- React and HTML/CDN examples.
- Token-driven light, dark, and custom themes.

## Design Rules

- Core stays wallet-neutral.
- Wallet-specific behavior lives in adapters.
- UI is token-driven and portal-safe.
- Modal, QR, account panel, toast, and recent transaction rows keep stable dimensions.
- Defaults stay simple; advanced config exists only where useful.
