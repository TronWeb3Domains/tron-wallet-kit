# Manager API

`WalletManager` is the headless core session manager. Most apps use it through `createWalletKit`,
but adapter authors and custom shells can use it directly.

```ts
import { WalletManager, TRON_MAINNET } from "@tron-wallet-kit/core";

const manager = new WalletManager({
  metadata: { name: "My TRON dApp" },
  network: TRON_MAINNET,
  adapters: [adapter],
});
```

## Sessions

```ts
await manager.connect("tronlink");
const session = manager.getSession();
await manager.disconnect();
```

`autoReconnect()` restores a stored session when `autoReconnect: true` and storage are configured.

## Signing

```ts
await manager.signMessage({ message: "hello" });
await manager.signTransaction({ transaction, methodHint: "transferTrx" });
```

## Transactions

```ts
manager.addTransaction({ hash, status: "submitted", methodHint: "transferTrx" });
manager.updateTransaction(hash, "confirmed");
const recent = manager.getTransactions(10);
```

Transactions are stored per `account + network` when a storage adapter is available.

## Events

```ts
const off = manager.on("connected", ({ session }) => {
  console.log(session.account.address);
});

off();
```

See [Events and hooks](/docs/advanced/events-hooks) for the common event list.
