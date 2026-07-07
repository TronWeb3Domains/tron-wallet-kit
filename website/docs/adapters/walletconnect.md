# WalletConnect Adapter

WalletConnect is the primary mobile/QR adapter for the MVP.

```ts
import { createWalletConnectAdapter } from "@tron-wallet-kit/adapter-walletconnect";

const adapter = createWalletConnectAdapter({
  projectId: "a4109c95d50e5c136cdafaf9fc44c105",
  network: "nile",
  onUri(uri) {
    // Render this URI into a QR code.
  },
});
```

Supported foundation:

- Connect.
- Disconnect.
- Account change events.
- `signMessage`.
- `signTransaction`.
- Half-open session cleanup.
- Optional direct TRX sending when the underlying wallet supports it.

Real TokenPocket/mobile QR QA is still pending.
