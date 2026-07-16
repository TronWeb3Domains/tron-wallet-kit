# Identity

TRON Wallet Kit resolves a wallet's TRX Domains name so the account reads as `alice.trx` instead of a
raw address. Resolution is **mainnet-only** (other networks resolve to no identity, without error) and
reuses the kit's shared TronWeb instance. It's on by default in `getDefaultConfig`.

Identity lives in the client layer: adapters return TRON addresses, and the client optionally enriches
the connected account with its default TRX Domains name (any TLD — `.trx`, `.sun`, `.usdd`, …) plus
metadata. UI renders the normalized `account.domain` / `account.displayName`.

## React

Identity is enabled by `getDefaultConfig`, so the connect button and account panel show the name
automatically. Read it directly with `useTrxName`:

```tsx
import { useTrxName, useTronAccount } from "@tron-wallet-kit/react";

function Profile() {
  const { address } = useTronAccount();
  const { name, avatar } = useTrxName();
  return (
    <span>
      {avatar && <img src={avatar} width={20} alt="" />}
      {name ?? address}
    </span>
  );
}
```

## Configuration

```ts
const config = getDefaultConfig({
  metadata: { name: "My dApp" },
  identity: {
    enabled: true,
    metadataKeys: ["avatar", "website"],
  },
});
```

## Custom resolver

Use a custom resolver when your app already has a TRX Domains cache, a profile API, or a server-side
lookup:

```ts
const config = getDefaultConfig({
  metadata: { name: "My dApp" },
  identity: {
    enabled: true,
    resolver: async (account) => {
      return { domain: "alice.trx", displayName: "alice.trx" };
    },
  },
});
```

## Disable it

```ts
getDefaultConfig({ metadata: { name: "My dApp" }, identity: { enabled: false } });
```
