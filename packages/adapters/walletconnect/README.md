# @tron-wallet-kit/adapter-walletconnect

WalletConnect adapter for TRON Wallet Kit.

## Install

```sh
pnpm add @tron-wallet-kit/adapter-walletconnect@latest
```

## Usage

Most dapps should pass `walletConnectProjectId` to `@tron-wallet-kit/react` or `@tron-wallet-kit/client`. The adapter is only created when a project ID is present.

Direct usage:

```ts
import { createWalletConnectAdapter } from "@tron-wallet-kit/adapter-walletconnect";

const adapter = createWalletConnectAdapter({
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID",
  network: "mainnet",
  onUri(uri) {
    console.log("WalletConnect URI", uri);
  }
});
```

## Notes

- Uses the TRON WalletConnect namespace.
- Exposes QR URI updates so the kit can render its own QR panel.
- Requires your own WalletConnect Cloud project ID.

## Status

This package is part of the TRON Wallet Kit 0.1.1 release line and is intended for the npm `latest` tag.

## License

MIT
