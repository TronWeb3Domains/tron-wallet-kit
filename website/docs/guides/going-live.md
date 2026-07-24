# Going Live

Use this checklist before shipping a production TRON dApp integration.

## Wallet configuration

- Set `metadata.name`, `metadata.description`, `metadata.url`, and `metadata.icons`.
- Use a production WalletConnect project id.
- Keep featured wallets under the configured design limit.
- Test every featured extension wallet on the production origin.
- Test WalletConnect from at least one mobile wallet.

## Network and RPC

- Use `network: "mainnet"` for production.
- Configure TronGrid or your own RPC endpoint if you need stable balance and identity reads.
- Avoid relying on extension-injected TronWeb for server-critical reads.

## Identity and balance

- Enable TRX Domains only when your app needs reverse identity.
- Add a TronGrid API key or custom resolver if public rate limits affect the UX.
- Keep balance failures non-blocking unless your flow requires the balance.

## Transactions

- Use transaction preview for any value-moving operation.
- Show clear receiver, amount, token, contract, and fee limit before signing.
- Store recent transactions and handle stale submitted entries.
- Branch on `WalletKitError.code`, not raw wallet error text.

## UI

- Test light, dark, and custom themes.
- Test portal-to-body rendering.
- Test mobile bottom sheet behavior on large phones.
- Test account panel, address QR, copy address, and disconnect.
- Test GasFree mode if enabled: header chip, general-wallet return, address QR, and fallback states.
- Test recent transactions and Activity with mixed transaction types, pending, failed, and confirmed rows.
- Keep the internal product UI sign-off checklist in sync with `Review/P1_PRODUCT_UI_QA_CHECKLIST.md`.

## Release gates

Run at least:

```sh
pnpm typecheck
pnpm test
pnpm --filter @tron-wallet-kit/website build
```

Before npm publish, also run the P0 live wallet checklist in `Review/P0_LIVE_QA_SIGNOFF.md`.
