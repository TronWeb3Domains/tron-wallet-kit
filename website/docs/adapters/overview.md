# Adapter Overview

Adapters isolate wallet-specific behavior from core.

Current MVP adapters:

- `@tron-wallet-kit/adapter-tronlink`
- `@tron-wallet-kit/adapter-walletconnect`

Planned next adapters:

- TokenPocket
- Trust Wallet
- Bitget
- MetaMask TRON
- OKX
- Bybit
- Binance

The core package should not become an EVM or multi-chain abstraction just because some wallets expose EVM-shaped APIs.
