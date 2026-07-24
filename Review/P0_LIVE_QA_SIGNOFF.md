# P0 Live QA Sign-Off

Updated: 2026-07-24

This checklist captures the remaining real-wallet work before running a real npm publish. Local typecheck and publish dry-run already passed for `0.1.0`; the items below require browser extensions, mobile wallets, or hardware.

## Environment

- Use HTTPS local or deployed origin for wallets that only inject on secure origins.
- Use TRON mainnet for final publish QA unless a test explicitly says otherwise.
- Use a fresh browser profile for first-connect tests when possible.
- Keep multiple wallet extensions enabled for namespace-collision tests.
- Record wallet version, browser version, account address prefix, result, and any console error.

## Required WalletConnect QA

| Case | Wallet | Steps | Pass criteria | Status |
| --- | --- | --- | --- | --- |
| WC QR connect | Bitget mobile | Open connect modal -> WalletConnect -> scan QR -> approve | Dapp receives correct TRON address; QR modal closes; connected button shows Bitget/connected session metadata when available | Pending |
| WC QR connect | Klever mobile | Open connect modal -> WalletConnect -> scan QR -> approve | Dapp receives correct TRON address; QR modal closes; connected state is stable after reload | Pending |
| WC reject | Any WC wallet | Open WalletConnect QR -> reject/cancel in wallet | Error is formatted, modal does not break layout, stale QR/session is cleared | Pending |
| WC back/close cleanup | Any WC wallet | Open WalletConnect QR -> Back/Close before scan completes | QR callback must not reopen a stale panel after close/back | Pending |

## Required Fixed-Bug Reverification

| Case | Wallet | Steps | Pass criteria | Status |
| --- | --- | --- | --- | --- |
| SafePal connect | SafePal | Connect from featured/all-wallets | Address returned; no false TronLink/TokenPocket takeover | Pending |
| Bitget via WC QR | Bitget mobile | Connect through WalletConnect QR | Address returned; modal closes; account panel works | Pending |
| TronLink multi-wallet | TronLink with other extensions enabled | Enable TronLink plus TokenPocket/Trust/Bybit/OKX as available, then connect TronLink | TronLink remains installed and connects to TronLink provider, not another wallet global | Pending |
| First-connect fresh authorize | Bitget/SafePal | Clear site data/session, connect for the first time | First approval returns address without needing refresh or second click | Pending |

## Required Transaction QA

| Case | Wallet | Steps | Pass criteria | Status |
| --- | --- | --- | --- | --- |
| TRX transfer | TronLink | Build -> sign -> broadcast a small mainnet TRX transfer | Toast shows pending then success/failure accurately; recent transaction entry is correct | Pending |
| TRX transfer | WalletConnect wallet | Build -> sign via WC -> broadcast a small mainnet TRX transfer | Signed tx broadcasts; modal/session remains stable | Pending |
| Sign message reject | TronLink or WC | Start signMessage then reject | Error is normalized; no stuck pending state | Pending |
| Transaction reject | TronLink or WC | Start transaction then reject | Transaction is not recorded as sent; error is formatted and layout remains stable | Pending |

## Optional Hardware QA

| Case | Wallet | Steps | Pass criteria | Status |
| --- | --- | --- | --- | --- |
| Ledger connect | Ledger with TRON app | Install optional peer in test app, connect hardware wallet | Ledger appears as hardware wallet and returns address | Pending |
| Ledger signing | Ledger with TRON app | Test signMessage and signTransaction | Signatures are returned and errors are formatted on rejection | Pending |

## Sign-Off

- Release manager:
- Date:
- Notes:
