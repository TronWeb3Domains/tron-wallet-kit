# Identity

TRON Wallet Kit resolves wallet identity from TRX Domains by calling the TRX Domains smart contract directly. Resolution is **mainnet-only** (other networks resolve to no identity, without error) and reuses the kit's shared TronWeb instance.

Identity resolution lives in the client layer. Adapters return TRON addresses; the client can optionally enrich the connected account with the wallet's default TRX Domains name (any TLD — `.trx`, `.sun`, `.usdd`, …) and metadata. UI components only render the normalized `account.domain` / `account.displayName` fields.

## React

```tsx
import { createWalletKit } from "@tron-wallet-kit/client";
import { TronWalletProvider, WalletButton } from "@tron-wallet-kit/react";

const kit = createWalletKit({
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

## Client

```ts
import { createWalletKit } from "@tron-wallet-kit/client";

const kit = createWalletKit({
  identity: {
    enabled: true,
    metadataKeys: ["avatar", "website"],
  },
});
```

## Custom Resolver

```ts
const kit = createWalletKit({
  identity: {
    enabled: true,
    resolver: async (account) => {
      return { domain: "alice.trx", displayName: "alice.trx" };
    },
  },
});
```

Use a custom resolver when an app already has a TRX Domains cache, profile API, or server-side lookup.
