# Smart Contracts

TRON Wallet Kit exposes `triggerSmartContract` for write calls. The kit builds the transaction with
TronWeb, asks the connected wallet to sign, broadcasts the signed transaction, and records the
submitted hash.

## Execute a contract method

```ts
await kit.triggerSmartContract({
  contractAddress: "TContractAddress...",
  functionSelector: "buyDomain(string,string)",
  parameters: [
    { type: "string", value: "alice" },
    { type: "string", value: "trx" }
  ],
  feeLimit: 100_000_000,
  callValue: 10_000_000,
  description: "Buy alice.trx"
});
```

`callValue` is in SUN and is forwarded to TronWeb transaction options. Use it only when the contract
method expects native TRX.

## WalletConnect and hardware wallets

Your app should call the same kit method for every wallet. Internally:

- injected wallets sign with their injected TRON provider;
- WalletConnect signs via `tron_signTransaction` and the kit broadcasts through TronWeb;
- Ledger signs the transaction hash and the kit broadcasts the signed transaction.

That is why dapps should prefer `kit.triggerSmartContract(...)` over wallet-specific code paths.

## Build, inspect, then send

```ts
const tx = await kit.transactionBuilder.triggerSmartContract({
  contractAddress: "TContractAddress...",
  functionSelector: "vote(uint256)",
  parameters: [{ type: "uint256", value: 3 }],
  feeLimit: 100_000_000
});

const signed = await kit.signTransaction({
  transaction: tx,
  methodHint: "triggerSmartContract"
});

await kit.sendRawTransaction(signed.signedTransaction ?? signed.transaction);
```

This pattern is useful for internal review tools, custom risk checks, or developer consoles.

## Preview customization

```ts
const kit = createWalletKit({
  transactionPreview: {
    resolver: async (_request, context) => {
      if (context.methodHint !== "triggerSmartContract") return;
      return {
        ...context.defaultPreview,
        title: "Contract interaction",
        summary: "Review this TRON smart-contract call before signing."
      };
    }
  }
});
```

Keep the preview short. Put the most important user-facing facts first: contract, method, token,
amount, recipient, and fee limit.
