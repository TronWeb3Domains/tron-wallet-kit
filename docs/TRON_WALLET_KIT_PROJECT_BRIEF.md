# TRON Wallet Kit Project Brief

## Mission

Build a dedicated wallet kit for the TRON ecosystem with product-grade wallet UX, clean adapter boundaries, and optional TRX Domains identity integration.

TRON Wallet Kit is inspired by the architecture, UI discipline, documentation discipline, testing discipline, and release discipline of XRPL Wallet Kit, but it is not an XRPL fork and not a multi-chain abstraction.

## Positioning

TRON Wallet Kit should feel closer to RainbowKit or ConnectKit in product quality, while staying TRON-native like TronWallet Adapter in wallet behavior.

Primary wedge:

- TRON-native wallet UX.
- Clean adapter contracts.
- Strong theme customization through `themeName` presets and token overrides.
- Browser/CDN and framework integrations.
- Optional `.trx` identity and profile resolution through TRX Domains.

## Non-Goals

- Do not fork XRPL assumptions.
- Do not introduce XRP, XRPL transaction JSON, TrustLine, NFToken, or Xaman concepts.
- Do not shape core around EVM/wagmi/viem concepts.
- Do not make MetaMask support a reason to make core EVM-first.
- Do not hardcode UI colors inside components.
- Do not depend on host app CSS selectors for modal/account-panel themes.

## Package Direction

- `@tron-wallet-kit/core`
- `@tron-wallet-kit/ui`
- `@tron-wallet-kit/client`
- `@tron-wallet-kit/browser`
- `@tron-wallet-kit/react`
- `@tron-wallet-kit/next`
- `@tron-wallet-kit/auth`
- `@tron-wallet-kit/adapter-tronlink`
- `@tron-wallet-kit/adapter-walletconnect`

Future adapters:

- `@tron-wallet-kit/adapter-tokenpocket`
- `@tron-wallet-kit/adapter-trust`
- `@tron-wallet-kit/adapter-bitget`
- `@tron-wallet-kit/adapter-metamask-tron`
- `@tron-wallet-kit/adapter-okx`
- `@tron-wallet-kit/adapter-bybit`
- `@tron-wallet-kit/adapter-binance`

## MVP Scope

- TronLink connect.
- WalletConnect TRON connect.
- Account panel.
- Copy address.
- Address QR.
- TRX balance.
- `signMessage`.
- `signTransaction`.
- Send TRX.
- Toast transaction feedback.
- Recent transactions foundation.
- Browser/CDN IIFE.
- React basic integration.
- HTML legacy/CDN docs.
- Light, dark, and custom themes that work when modal portals to `body`.

## Theme Requirements

Theme customization is a first-class requirement.

- Use `themeName` presets for common visual styles.
- Allow token overrides on every preset.
- Apply tokens to the wallet kit root element so modal portals remain themed.
- Keep layout dimensions stable across loading, empty, error, and connected states.
- Do not rely on host app selectors.

Initial theme names:

- `light`
- `dark`
- `tron`
- `tron-energy`
- `nile`
- `shasta`
- `bandwidth`
- `energy`
- `sun`
- `terminal`
- `highContrast`

## Adapter Priority

Phase 1:

- TronLink.
- WalletConnect.

Phase 2:

- TokenPocket.
- Trust Wallet or Bitget.

Phase 3:

- MetaMask TRON.
- OKX.
- Bybit.
- Binance.

Later:

- Ledger.
- Backpack.
- OneKey.
- Guarda.
- FoxWallet.
- imToken.
- GateWallet.
- TomoWallet.

## Quality Gates

Each phase should run the relevant commands:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Each phase should update:

- `PROJECT_MEMORY.md`
- relevant files under `Review/`
