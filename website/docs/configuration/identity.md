# Identity

TRON Wallet Kit resolves wallet identity from TRX Domains by calling the TRX Domains smart contract directly — no `trondomainjs` dependency. Resolution is **mainnet-only** (other networks resolve to no identity, without error) and reuses the kit's shared TronWeb instance.

Identity resolution lives in the client layer. Adapters return TRON addresses; the client can optionally enrich the connected account with the wallet's default TRX Domains name (any TLD — `.trx`, `.sun`, `.usdd`, …) and metadata. UI components only render the normalized `account.domain` / `account.displayName` fields.

## React

```tsx
import { TronWalletKitProvider, AccountPanel } from "@tron-wallet-kit/react";

export function App() {
  return (
    <TronWalletKitProvider adapters={adapters} identity={{ enabled: true }}>
      <AccountPanel theme={{ themeName: "tron" }} />
    </TronWalletKitProvider>
  );
}
```

## Client

```ts
import { createWalletClient } from "@tron-wallet-kit/client";

const client = createWalletClient({
  adapters,
  identity: {
    enabled: true,
    metadataKeys: ["avatar", "website"],
  },
});
```

## Custom Resolver

```ts
const client = createWalletClient({
  adapters,
  identity: {
    enabled: true,
    resolver: async (account) => {
      return { domain: "alice.trx", displayName: "alice.trx" };
    },
  },
});
```

Use a custom resolver when an app already has a TRX Domains cache, profile API, or server-side lookup.
