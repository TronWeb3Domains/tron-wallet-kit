# Payments

Use the client helpers for simple payment flows. They all pass through the same preview -> sign ->
broadcast pipeline, so injected wallets, WalletConnect, Ledger, and bridged wallets keep one
consistent integration surface.

## TRX payments

TRX amounts are expressed in SUN. One TRX is `1_000_000` SUN.

```ts
await kit.transferTrx({
  to: "TReceiverAddress...",
  amountSun: 1_000_000n,
  description: "Pay 1 TRX"
});
```

For checkout forms, validate the receiver and amount before calling the kit. The kit handles wallet
signing and broadcasting, but your app still owns product validation such as cart amount, order id,
and recipient account.

## TRC-20 payments

Use `transferTrc20` for token transfers such as USDT. Amounts are token base units; USDT on TRON
uses 6 decimals, so `25_000_000n` means `25 USDT`.

```ts
await kit.transferTrc20({
  contractAddress: "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj",
  to: "TReceiverAddress...",
  amount: 25_000_000n,
  feeLimit: 100_000_000,
  description: "Pay 25 USDT"
});
```

Set a clear `description`; it appears in transaction previews and recent transaction history.

## Build first

When you need to show a custom review page before the wallet prompt, build the transaction first.

```ts
const tx = await kit.transactionBuilder.sendTrx(
  "TReceiverAddress...",
  1_000_000n,
  kit.getSession()?.account.address
);

// Show your own order review here.
const result = await kit.signAndSendTransaction({
  transaction: tx,
  methodHint: "transferTrx"
});
```

## UX checklist

- Show amounts in human units, but send base units to the kit.
- Keep `transactionPreview` enabled unless your app has its own confirmation screen.
- Use `useBrowserStorage` if recent transaction history should survive reloads.
- Catch `USER_REJECTED`, `REQUEST_TIMEOUT`, and `SEND_TRANSACTION_FAILED` for checkout recovery.
