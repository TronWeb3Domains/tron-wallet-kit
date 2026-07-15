# Client API

`@tron-wallet-kit/client` provides the primary developer entrypoints around the core `WalletManager`.

```ts
import { createWalletKit } from "@tron-wallet-kit/client";

const kit = createWalletKit({
  walletConnectProjectId: "YOUR_WALLETCONNECT_PROJECT_ID",
  walletConnectNetwork: "mainnet",
  ui: { themeName: "tron", toast: true },
});

kit.openModal();
await kit.manager.connect("tronlink");
await kit.signMessage("Hello TRON");
await kit.transferTrx({ to: "T...", amountSun: 1_000_000n });
await kit.disconnect();
```

## Manager State

```ts
kit.manager.getSession();
kit.manager.getAccount();
kit.manager.getNetwork();
kit.manager.getTransactions();
```

## Events

```ts
const off = kit.manager.on("connected", ({ session }) => {
  console.log(session.account.address);
});

off();
```

The manager owns connect, disconnect, signing, transaction, storage, and session events.

## Identity

```ts
import { createWalletKit } from "@tron-wallet-kit/client";

const kit = createWalletKit({
  identity: { enabled: true },
});

const identity = await kit.refreshIdentity();
```

Identity is optional and stays outside core. Apps can call `kit.refreshIdentity()` or provide a custom resolver through `identity.resolver`.

For advanced apps, pass `identity.resolver` to use an app-specific cache or API while keeping the UI contract the same.
