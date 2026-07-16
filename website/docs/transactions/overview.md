# Transactions

TRON Wallet Kit sends transactions with a uniform **build → sign → broadcast** flow that works the
same across injected wallets, WalletConnect, and the tronweb3 bridge. You call a helper, the active
wallet signs, and the kit broadcasts through the shared TronWeb — you don't wire a wallet-specific
send path per adapter.

## Transfers

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

## Sign vs send

| Method | What it does |
|---|---|
| `signMessage(msg)` | Sign a string message. |
| `signTransaction(tx)` | Sign a built transaction (no broadcast). |
| `sendTransaction(tx)` | Broadcast a signed transaction. |
| `sendRawTransaction(tx)` | Broadcast a raw signed transaction. |
| `signAndSendTransaction(tx)` | Sign and broadcast in one call. |

## Resources and governance

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
