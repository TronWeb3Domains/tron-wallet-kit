# TronLink

TronLink is the primary extension adapter for the MVP.

```ts
import { createTronLinkAdapter } from "@tron-wallet-kit/adapter-tronlink";

const tronLink = createTronLinkAdapter();
```

Supported foundation:

- Connect.
- Disconnect.
- Account change events.
- Chain change events.
- `signMessage`.
- `signTransaction`.
- `sendTrx`.

Manual browser-extension QA is still required.
