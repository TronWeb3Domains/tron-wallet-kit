# WalletConnect

WalletConnect support lives in `@tron-wallet-kit/adapter-walletconnect`.

```ts
import { createWalletConnectAdapter } from "@tron-wallet-kit/adapter-walletconnect";

const walletConnect = createWalletConnectAdapter({
  projectId: "a4109c95d50e5c136cdafaf9fc44c105",
  network: "nile",
  onUri(uri) {
    console.log("WalletConnect URI:", uri);
  },
});
```

## Notes

- `projectId` is required.
- The adapter defaults to Nile unless you pass another network.
- `onUri` lets your app render its own QR.
- Direct `sendTrx` is supported only when the connected WalletConnect wallet exposes a compatible send method.
- Real-wallet QA is still pending for TokenPocket/mobile flows.
