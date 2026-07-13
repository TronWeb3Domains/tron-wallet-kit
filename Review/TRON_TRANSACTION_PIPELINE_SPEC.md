# TRON Transaction Pipeline Spec

## Purpose

TRON Wallet Kit should expose transaction APIs that feel familiar to TronWeb and `tronweb3/tronwallet-adapter` users while keeping wallet-specific signing behavior inside adapters.

The public API should let dApp developers migrate from direct TronWeb usage without learning separate flows for injected wallets, WalletConnect, and Ledger.

## Source Behavior To Match

The upstream `tronweb3/tronwallet-adapter` packages generally follow this split:

- Injected wallets such as TronLink, TokenPocket, OKX, and Bitget sign an already-built transaction with `wallet.tronWeb.trx.sign(transaction)`.
- WalletConnect signs by sending a `tron_signTransaction` request through the WalletConnect session.
- Ledger signs `transaction.txID` and `transaction.raw_data_hex` with a TRON derivation path, then attaches the returned signature to `transaction.signature`.

In all cases, the transaction should already be built before it reaches the adapter.

## Architecture Decision

Transaction execution is a three-step pipeline:

1. Build an unsigned TRON transaction in the client/helper layer using TronWeb-compatible names.
2. Sign through `WalletManager.signTransaction()`, letting the active adapter choose the correct wallet-specific signing mechanism.
3. Broadcast through a shared TronWeb/RPC client with `trx.sendRawTransaction()`.

Adapters must not own smart contract building logic. They only connect, sign, disconnect, and expose wallet capability metadata.

## Public API Naming

Prefer TronWeb/tronweb3-compatible names:

- `kit.transactionBuilder.sendTrx(...)`
- `kit.transactionBuilder.triggerSmartContract(...)`
- `kit.signTransaction(transaction)`
- `kit.sendRawTransaction(transaction)`
- `kit.signAndSendTransaction(transaction)`
- `kit.triggerSmartContract(...)`
- `kit.transferTrx(...)`

Object-style request overloads are allowed for developer ergonomics, but positional TronWeb-style signatures should remain available where practical.

## Smart Contract Flow

Preferred kit-managed call:

```ts
await kit.triggerSmartContract({
  contractAddress,
  functionSelector: "buyDomain(string,string)",
  options: {
    callValue: tronWeb.toSun(price),
    feeLimit: 100_000_000
  },
  parameters: [
    { type: "string", value: domain },
    { type: "string", value: tld }
  ],
  issuerAddress: session.account.address,
  description: `Buy ${domain}.${tld}`
});
```

Internal flow:

```ts
const prepared = await tronWeb.transactionBuilder.triggerSmartContract(
  contractAddress,
  functionSelector,
  options,
  parameters,
  issuerAddress
);

const signed = await manager.signTransaction({
  transaction: prepared.transaction,
  methodHint: "triggerSmartContract"
});

const result = await sendRawTransaction(signed.signedTransaction ?? signed.transaction);
```

## Escape Hatch

Direct TronWeb contract calls may be exposed as an advanced escape hatch:

```ts
const tronWeb = await kit.getTronWeb();
const contract = await tronWeb.contract().at(contractAddress);
await contract.buyDomain(domain, tld).send({ callValue });
```

This is convenient for injected wallets, but it is not the primary kit API because it does not reliably cover WalletConnect or Ledger.

## Wallet-Specific Signing

Injected wallet adapter:

```ts
await provider.tronWeb.trx.sign(transaction);
```

WalletConnect adapter:

```ts
await signClient.request({
  chainId,
  topic,
  request: {
    method: "tron_signTransaction",
    params: {
      currentAddress,
      transaction
    }
  }
});
```

Ledger adapter:

```ts
const signature = await ledger.signTransactionHash(path, transaction.txID, transaction.raw_data_hex);
transaction.signature = [signature];
```

## Resource And Governance Scope

Use the same build -> sign -> broadcast pipeline for:

- `freezeBalance`
- `unfreezeBalance`
- `freezeBalanceV2`
- `unfreezeBalanceV2`
- `delegateResource`
- `undelegateResource`
- `vote`
- `withdrawBlockRewards`

These are advanced actions. The first playground pass should expose read-only resource queries before enabling write actions.

## React Basic Test Scope

Add transaction playground sections in this order:

1. TRX transfer: build, sign, sign-and-broadcast.
2. Smart contract: build `triggerSmartContract`, sign, sign-and-broadcast.
3. Transaction status: read transaction / transaction info by hash.
4. Resource read-only: account resources, bandwidth, energy.
5. Advanced resource/governance writes later, guarded by explicit confirmation on mainnet.

## Initial Implementation Phase

Phase 1 should include:

- Client transaction helpers.
- `kit.transactionBuilder.sendTrx`.
- `kit.transactionBuilder.triggerSmartContract`.
- `kit.sendRawTransaction`.
- `kit.signAndSendTransaction`.
- Real `kit.triggerSmartContract` pipeline.
- Client unit tests with mocked TronWeb.

React UI can follow after the client API is stable.

## Error And Language Management

Transaction, wallet, and RPC failures must flow through the shared core error system before they are shown in UI.

- `@tron-wallet-kit/core` owns canonical error codes, category/severity/retry metadata, normalization, and safe formatting.
- UI must render formatted `{ title, message }` output only. It must not render raw adapter/RPC errors, stack traces, local paths, module URLs, or circular-object serialization text into modal panels.
- Runtime copy is language-managed through `WalletKitLabelPack.errors`; integrators can override per-code titles/messages without changing adapter logic.
- Keep raw error data available as `cause` / optional formatted `details` for logs and debugging, but keep modal messages short enough for mobile.
- Add new transaction/resource errors to the core definition table before surfacing the helper in client or React examples.

Current canonical codes include:

| Code | Category | Default UI behavior |
| --- | --- | --- |
| `WALLET_NOT_FOUND` | wallet | Non-retryable configuration/wallet registry issue. |
| `WALLET_UNAVAILABLE` | wallet | Non-retryable unavailable wallet/provider state. |
| `CONNECTION_FAILED` | connection | Retryable wallet connection failure. |
| `USER_REJECTED` | connection | Retryable user-cancelled request. |
| `REQUEST_TIMEOUT` | request | Retryable pending wallet request timeout. |
| `NO_SESSION` | session | Prompt caller to connect first. |
| `SIGN_MESSAGE_FAILED` | signing | Retryable message signing failure. |
| `SIGN_TRANSACTION_FAILED` | signing | Retryable transaction signing failure. |
| `INVALID_SIGNATURE` | signing | Retryable invalid signature proof. |
| `INVALID_TRANSACTION` | transaction | Non-retryable invalid transaction payload. |
| `INVALID_TRANSACTION_SIGNATURE` | transaction | Retryable invalid signed transaction result. |
| `INVALID_TX_RESULT` | transaction | Retryable invalid wallet/RPC transaction result. |
| `SEND_TRANSACTION_FAILED` | transaction | Retryable broadcast failure. |
| `TRANSACTION_EXPIRATION_ERROR` | transaction | Retryable via rebuild/sign/broadcast once. |
| `OUT_OF_ENERGY` | transaction | Non-retryable until account/resource state changes. |
| `INSUFFICIENT_BALANCE` | transaction | Non-retryable until balance changes. |
| `NETWORK_ERROR` | network | Retryable RPC/network failure. |
| `RATE_LIMITED` | network | Retryable after delay or API-key/fullHost change. |
| `UNKNOWN_NETWORK` | network | Non-retryable configuration issue. |
| `CONFIGURATION_ERROR` | configuration | Non-retryable app/runtime configuration issue. |
| `UNSUPPORTED` | unsupported | Non-retryable unsupported wallet action. |
| `UNKNOWN_ERROR` | unknown | Retryable safe fallback. |

---

## Review Addendum (2026-07-08)

The three-step build -> sign -> broadcast architecture is correct and matches upstream `tronweb3/tronwallet-adapter` (verified against its WalletConnect adapter: adapters receive an already-built transaction and only sign; injected wallets sign via `tronWeb.trx.sign`, WalletConnect signs through the session, Ledger attaches a signature). The following gaps must be closed before/while implementing Phase 1.

### 1. One canonical execution path (CRITICAL — resolve first)

The core `WalletManager` currently exposes both `signTransaction()` (adapter signs, kit broadcasts) and `submitTransaction()` (bridge adapter builds/signs/broadcasts internally from a `methodHint`). These are two competing paths.

- Decision: **`signTransaction()` + kit-side broadcast is the canonical pipeline.** It works uniformly for injected, WalletConnect, and Ledger, and keeps building/broadcasting out of adapters (per the hard rules).
- Action: deprecate or restrict `adapter.submitTransaction()` — keep it only for wallets that genuinely must broadcast themselves, and never as the default path. The bridge adapter's `submitTransaction` should not be reachable through `kit.sendRawTransaction`/`signAndSendTransaction`.
- Consequence: `methodHint` is no longer needed for signing (the transaction is already built). Keep it only as an optional logging/analytics tag, or drop it. Do not imply the adapter builds from `methodHint`.

### 2. Transaction expiration handling (CRITICAL)

A TRON transaction expires roughly 60s after it is built (`ref_block` + `expiration`). If the user approves slowly in the wallet, the transaction expires before broadcast and `sendRawTransaction` fails with a `TRANSACTION_EXPIRATION_ERROR` / "Transaction expired" result.

- Build the transaction **immediately before signing**, not early.
- On broadcast, detect expiration in the result (`code === "TRANSACTION_EXPIRATION_ERROR"` or message contains "expired") and **rebuild + re-sign + re-broadcast once** before surfacing the error.
- Expose the raw broadcast result (`result.raw`) so callers can inspect `code`/`txid`.

### 3. Broadcast RPC reliability

Broadcast (and identity/balance) go through the shared TronWeb instance against TronGrid. Without an API key, TronGrid rate-limits — this is the same cause as the balance "loading" hang seen on localhost.

- Allow injecting a `TRON-PRO-API-KEY` and/or a custom `fullHost` into the shared TronWeb (`tronweb.ts`).
- Surface broadcast/network errors explicitly (do not swallow); a failed broadcast must reject `sendRawTransaction`/`signAndSendTransaction`, not hang.
- Reuse the single shared TronWeb (identity + balance + broadcast) — do not create per-call instances.

### 4. Staking uses Stake 2.0 (freeze V2)

TRON mainnet migrated to Stake 2.0. `freezeBalance` / `unfreezeBalance` (v1) are deprecated on mainnet.

- Primary builders must be `freezeBalanceV2` / `unfreezeBalanceV2` / `delegateResource` / `undelegateResource` / `withdrawExpireUnfreeze`.
- The `kit.freezeBalance` / `kit.unfreezeBalance` public methods should map to the V2 builders. Only keep v1 if a real need appears, and mark it explicitly.

### 5. Default `feeLimit` for contract calls

`triggerSmartContract` and TRC20 transfers require a `feeLimit`. If omitted, the transaction can fail with `OUT_OF_ENERGY`.

- Apply a sensible default `feeLimit` (e.g. `100_000_000` SUN = 100 TRX) when the caller does not provide one, and always allow override via the request (`TransferTrc20Request.feeLimit`, `TriggerSmartContractRequest.feeLimit`/`options.feeLimit`).

### 6. Owner / from address

Builders must always receive the connected account as owner:

- `sendTrx(to, amount, from?)` — default `from` to `session.account.address`.
- `triggerSmartContract(...)` — default `issuerAddress` to `session.account.address`.
- Do not rely on the shared TronWeb's `defaultAddress` for the owner — pass it explicitly from the session.

### 7. Sign-result normalization

Ensure `SignTransactionResult.signedTransaction` is the full signed transaction object (with the `signature` array), ready for `sendRawTransaction`, for every adapter type:

- Injected / WalletConnect return the full signed transaction.
- Ledger returns the transaction with `signature` attached.
- The core normalization must produce a consistent `signedTransaction` in all three cases; `sendRawTransaction(signed.signedTransaction ?? signed.transaction)` must receive a broadcastable object.

### WalletConnect param note

The `tron_signTransaction` example params in "Wallet-Specific Signing" are illustrative. The real request shape lives inside `@tronweb3/walletconnect-tron` (the kit's WC adapter delegates to it). Do not hardcode the param names in kit code — go through the adapter/lib.

### Updated Phase 1 acceptance

In addition to the existing Phase 1 list, Phase 1 is not done until:

- `signTransaction` + kit-broadcast is the only path used by `sendRawTransaction`/`signAndSendTransaction` (item 1).
- Expiration rebuild-once is implemented and unit-tested (item 2).
- Broadcast failures reject (never hang) and API-key/fullHost injection exists (item 3).
- Default `feeLimit` applied for contract calls (item 5).
- Owner address is passed from the session, not inferred (item 6).
