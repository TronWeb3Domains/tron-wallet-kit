# React Usage

This guide shows the current React MVP shape with the default TRON wallet registry.

## Install Packages

```sh
pnpm add @tron-wallet-kit/react @tron-wallet-kit/client
```

## Provider Setup

```tsx
import { createWalletKit } from "@tron-wallet-kit/client";
import { TronWalletProvider, WalletButton } from "@tron-wallet-kit/react";

const kit = createWalletKit({
  walletConnect: {
    projectId: "YOUR_WALLETCONNECT_PROJECT_ID",
  },
  identity: { enabled: true },
});

export function App() {
  return (
    <TronWalletProvider kit={kit} ui={{ themeName: "tron" }}>
      <WalletButton />
    </TronWalletProvider>
  );
}
```

## Current Surface Notes

- `WalletButton` opens the shared connect modal and connected account panel.
- The connect modal renders the default client wallet registry plus any app-supplied wallet config.
- Account state displays `account.domain` when identity resolution is enabled.
- Identity resolution calls the TRX Domains smart contract directly through the shared/lazy TronWeb path; there is no external domain SDK runtime dependency.
- Address QR can use `createQrDataUrl(address)`.
- Transaction toast markup is available through `createTransactionToastContainerHtml`.
- WalletConnect requires an app-owned project ID. Use `VITE_WALLETCONNECT_PROJECT_ID` or another runtime configuration source in examples and apps.

## Ledger Support

Ledger is shipped as a default hardware wallet descriptor and the upstream Ledger adapter package is included by `@tron-wallet-kit/client`. Real-device QA still requires a Ledger device with the TRON app open.
