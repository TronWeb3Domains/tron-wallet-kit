# @tron-wallet-kit/adapter-tronwallet-bridge

Bridge runtime `@tronweb3/tronwallet-adapter` instances into TRON Wallet Kit.

## Install

```sh
pnpm add @tron-wallet-kit/adapter-tronwallet-bridge@latest
```

## Usage

This package is for wallets where the official `tronweb3/tronwallet-adapter` implementation should remain the source of truth, such as hardware wallets or special bridge wallets.

```ts
import { createTronwalletBridgeAdapter } from "@tron-wallet-kit/adapter-tronwallet-bridge";

const adapter = createTronwalletBridgeAdapter({
  adapter: officialTronwalletAdapter,
  metadata: {
    id: "ledger",
    name: "Ledger"
  }
});
```

## Notes

- Keeps TRON Wallet Kit aligned with the official TRON wallet adapter ecosystem.
- Lets the UI/catalog layer provide icons, status, grouping, and QR/account UX.
- Use built-in descriptors from `@tron-wallet-kit/client` when possible.

## Status

This package is part of the TRON Wallet Kit 0.1.1 release line and is intended for the npm `latest` tag.

## License

MIT
