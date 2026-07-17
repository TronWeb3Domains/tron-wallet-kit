# Transactions

TRON Wallet Kit sends transactions with a uniform **build → sign → broadcast** flow that works the
same across injected wallets, WalletConnect, and the tronweb3 bridge. You call a helper, the active
wallet signs, and the kit broadcasts through the shared TronWeb — you don't wire a wallet-specific
send path per adapter.

## Transfers

See [Payments](/docs/use-cases/payments) for checkout-oriented TRX and TRC-20 examples.

```ts
// TRX (amount in SUN, 1 TRX = 1_000_000 SUN)
await kit.transferTrx({ to: "T...", amountSun: 1_000_000n });

// TRC-20
await kit.transferTrc20({
  contractAddress: "T...",   // token contract
  to: "T...",
  amount: 25_000_000n,       // token base units
});

// TRC-10
await kit.transferTrc10({ tokenId: "1002000", to: "T...", amount: 100n });
```

## Smart contracts

See [Smart contracts](/docs/use-cases/smart-contracts) for contract execution patterns across
injected wallets, WalletConnect, and hardware wallets.

```ts
await kit.triggerSmartContract({
  contractAddress: "T...",
  function: "transfer(address,uint256)",
  parameters: [
    { type: "address", value: "T..." },
    { type: "uint256", value: 1_000_000 },
  ],
  feeLimit: 100_000_000,
});
```

Need finer control? Build first, then sign and send:

```ts
const tx = await kit.transactionBuilder.triggerSmartContract("T...", "vote(uint256)", {}, [
  { type: "uint256", value: 3 },
]);
const signed = await kit.signTransaction(tx);
await kit.sendRawTransaction(signed.transaction);
```

## Preview before signing

`transactionPreview` shows a clear summary before the wallet prompt opens. Browser kits use the
built-in confirmation dialog by default, while apps can still customize the preview or replace the
confirmation decision.

```ts
const kit = createWalletKit({
  metadata: { name: "My TRON dApp" },
  transactionPreview: {
    resolver: async (_request, context) => {
      const preview = context.defaultPreview;
      console.log(preview.title, preview.summary, preview.details);
    },
    confirm: async (preview) => {
      // Returning false cancels before the wallet receives a signing request.
      return preview.title !== "Transaction";
    }
  },
});
```

Set `ui.transactionPreview.enabled` to `false` if the app owns its own confirmation UI.

## Sign vs send

| Method | What it does |
|---|---|
| `signMessage(msg)` | Sign a string message. |
| `signTransaction(tx)` | Sign a built transaction (no broadcast). |
| `sendTransaction(tx)` | Broadcast a signed transaction. |
| `sendRawTransaction(tx)` | Broadcast a raw signed transaction. |
| `signAndSendTransaction(tx)` | Sign and broadcast in one call. |

## Recent transactions

Broadcasted transactions are stored per connected `account + network`. The account panel reads this
same store for its Recent Transactions section.

```ts
const kit = createWalletKit({
  metadata: { name: "My TRON dApp" },
  useBrowserStorage: true,
  transactionStore: {
    max: 20,
    staleSubmittedMs: 10 * 60 * 1000
  }
});
```

Submitted entries older than `staleSubmittedMs` become `unknown` until the app confirms or fails
them with the manager transaction lifecycle.

## Resources and governance

See [Resources and governance](/docs/use-cases/resources-governance) for product guidance around
freeze, delegate, undelegate, and vote flows.

```ts
await kit.freezeBalance({ amountSun: 1_000_000n, resource: "ENERGY" });
await kit.delegateResource({ amountSun: 1_000_000n, resource: "ENERGY", to: "T..." });
await kit.voteWitness({ votes: [{ witnessAddress: "T...", voteCount: 3 }] });
```

## Errors

Every failure surfaces as a `WalletKitError` with a short, localized message — a rejected signature,
a timeout, or a broadcast failure won't leak raw stack traces into your UI. Catch and branch on
`error.code` (for example `USER_REJECTED`, `REQUEST_TIMEOUT`).

```ts
try {
  await kit.transferTrx({ to: "T...", amountSun: 1_000_000n });
} catch (err) {
  if (err.code === "USER_REJECTED") {
    // user declined in the wallet
  }
}
```
