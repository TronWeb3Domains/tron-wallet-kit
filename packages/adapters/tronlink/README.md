# @tron-wallet-kit/adapter-tronlink

TronLink adapter for TRON Wallet Kit.

## Install

```sh
pnpm add @tron-wallet-kit/adapter-tronlink@latest
```

## Usage

Most dapps do not need to import this package directly; `@tron-wallet-kit/client` includes TronLink through the built-in wallet descriptor catalog.

Direct usage:

```ts
import { createWalletKit } from "@tron-wallet-kit/client";
import { createTronLinkAdapter } from "@tron-wallet-kit/adapter-tronlink";

const kit = createWalletKit({
  adapters: [createTronLinkAdapter()]
});
```

## Notes

- Detects the TronLink injected provider in the browser.
- Handles delayed provider injection and provider contention with other TRON extensions.
- Designed for TRON only; this is not a multi-chain adapter.

## Status

This package is part of the TRON Wallet Kit 0.1.1 release line and is intended for the npm `latest` tag.

## License

MIT
