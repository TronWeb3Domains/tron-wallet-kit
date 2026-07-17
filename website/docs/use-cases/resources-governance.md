# Resources and Governance

TRON resource and governance operations are exposed as client helpers so apps do not need to build
raw transaction JSON for common flows.

## Freeze and unfreeze

Use `freezeBalance` when the user wants ENERGY or BANDWIDTH. Amounts are in SUN.

```ts
await kit.freezeBalance({
  amountSun: 100_000_000n,
  resource: "ENERGY",
  description: "Freeze 100 TRX for ENERGY"
});

await kit.unfreezeBalance({
  amountSun: 100_000_000n,
  resource: "ENERGY",
  description: "Unfreeze 100 TRX from ENERGY"
});
```

## Delegate resources

Delegation sends resource capacity to another account while the connected account remains the owner.

```ts
await kit.delegateResource({
  to: "TReceiverAddress...",
  amountSun: 50_000_000n,
  resource: "ENERGY",
  description: "Delegate ENERGY"
});

await kit.undelegateResource({
  to: "TReceiverAddress...",
  amountSun: 50_000_000n,
  resource: "ENERGY",
  description: "Undelegate ENERGY"
});
```

## Vote for witnesses

```ts
await kit.voteWitness({
  votes: [
    { witnessAddress: "TWitnessAddress...", voteCount: 3 },
    { witnessAddress: "TAnotherWitness...", voteCount: 2 }
  ],
  description: "Vote for TRON witnesses"
});
```

## Product guidance

- Treat resource and vote actions like high-impact transactions.
- Keep `transactionPreview` enabled and use clear descriptions.
- Show the connected account, target account, resource type, and amount before signing.
- Do not hide wallet errors; show the normalized title/message from `WalletKitError`.
- For advanced dashboards, combine these helpers with `kit.getTronWeb()` for read-only account
  resource data.
