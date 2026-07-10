# React Usage

This guide shows the current React MVP shape with TronLink and WalletConnect.

## Install Packages

```sh
pnpm add @tron-wallet-kit/react @tron-wallet-kit/adapter-tronlink @tron-wallet-kit/adapter-walletconnect
```

## Provider Setup

```tsx
import { TronWalletKitProvider, ConnectModal, AccountPanel } from "@tron-wallet-kit/react";
import { createTronLinkAdapter } from "@tron-wallet-kit/adapter-tronlink";
import { createWalletConnectAdapter } from "@tron-wallet-kit/adapter-walletconnect";

const adapters = [
  createTronLinkAdapter(),
  createWalletConnectAdapter({
    projectId: "a4109c95d50e5c136cdafaf9fc44c105",
    network: "nile",
    onUri(uri) {
      console.log("WalletConnect URI:", uri);
    },
  }),
];

export function App() {
  return (
    <TronWalletKitProvider adapters={adapters} identity={{ enabled: true }}>
      <ConnectModal theme={{ themeName: "tron" }} />
      <AccountPanel
        theme={{ themeName: "tron" }}
        balanceTrx="0"
        showSendButton
      />
    </TronWalletKitProvider>
  );
}
```

## Current Surface Notes

- `ConnectModal` renders registered adapters from `WalletClient`.
- `AccountPanel` reads connected account state from `WalletClient` and displays `account.domain` when identity resolution is enabled.
- Identity resolution uses `trondomainjs` through the client layer, not adapters or UI.
- Address QR can use `createQrDataUrl(address)`.
- Transaction toast markup is available through `createTransactionToastContainerHtml`.
- WalletConnect real-wallet QA still needs TokenPocket/mobile testing with the project ID above.

## Optional Ledger Support

Ledger is shipped as a wallet descriptor, but the hardware adapter package is not bundled as a hard dependency. Install the upstream package in the app when Ledger should be enabled:

```sh
pnpm add @tronweb3/tronwallet-adapter-ledger
```

If the package is not installed, Ledger remains gracefully unavailable and the rest of the wallet list continues to work. Real-device QA still requires a Ledger device with the TRON app open.
