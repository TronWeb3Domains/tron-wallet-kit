# Identity

TRON Wallet Kit resolves wallet identity through TRX Domains by using `trondomainjs`.

Identity resolution lives in the client layer. Adapters return TRON addresses; the client can optionally enrich the connected account with a default `.trx` domain and metadata. UI components only render the normalized `account.domain` / `account.displayName` fields.

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
