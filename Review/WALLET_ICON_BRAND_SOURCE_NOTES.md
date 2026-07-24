# Wallet Icon Brand And Source Notes

Updated: 2026-07-24

## Release Policy

- Wallet icons are used only to identify wallet connection options inside TRON Wallet Kit.
- Wallet names, logos, and trademarks belong to their respective owners.
- Including a wallet icon does not imply endorsement, partnership, certification, or sponsorship.
- Built-in icons are embedded as data URIs during package build/prepack from local files under `packages/client/src/wallets/icons/`.
- Third-party integrations can provide their own `descriptor.icon` as a URL or data URI without changing kit source.
- If a wallet owner requests an icon update or removal, update the local icon file and regenerate `icons.generated.ts`.

## Current Built-In Icon Inventory

| Wallet id | File | Format | Source state | Release note |
| --- | --- | --- | --- | --- |
| `backpack` | `packages/client/src/wallets/icons/backpack.svg` | SVG | Local bundled asset | Brand-owned wallet icon; use only for wallet identification. |
| `binance` | `packages/client/src/wallets/icons/binance.svg` | SVG | Local bundled asset | Brand-owned wallet icon; use only for wallet identification. |
| `bitget` | `packages/client/src/wallets/icons/bitget.svg` | SVG | Local bundled asset, synced from provided project icon folder | Brand-owned wallet icon; use only for wallet identification. |
| `bybit` | `packages/client/src/wallets/icons/bybit.svg` | SVG | Local bundled asset | Brand-owned wallet icon; use only for wallet identification. |
| `foxwallet` | `packages/client/src/wallets/icons/foxwallet.svg` | SVG | Local bundled asset | Brand-owned wallet icon; use only for wallet identification. |
| `gate` | `packages/client/src/wallets/icons/gate.webp` | WEBP | Local bundled asset | Brand-owned wallet icon; use only for wallet identification. |
| `guarda` | `packages/client/src/wallets/icons/guarda.png` | PNG | Local bundled asset, synced from provided project icon folder | Brand-owned wallet icon; use only for wallet identification. |
| `imtoken` | `packages/client/src/wallets/icons/imtoken.svg` | SVG | Local bundled asset | Brand-owned wallet icon; use only for wallet identification. |
| `klever` | `packages/client/src/wallets/icons/klever.jpg` | JPG | Local bundled asset | Brand-owned wallet icon; use only for wallet identification. |
| `ledger` | `packages/client/src/wallets/icons/ledger.svg` | SVG | Local bundled asset | Brand-owned wallet icon; use only for wallet identification. |
| `math` | `packages/client/src/wallets/icons/math.png` | PNG | Local bundled asset | Brand-owned wallet icon; use only for wallet identification. |
| `metamask` | `packages/client/src/wallets/icons/metamask.svg` | SVG | Local bundled asset | Brand-owned wallet icon; use only for wallet identification. |
| `okx` | `packages/client/src/wallets/icons/okx.svg` | SVG | Local bundled asset | Brand-owned wallet icon; use only for wallet identification. |
| `onekey` | `packages/client/src/wallets/icons/onekey.svg` | SVG | Local bundled asset | Brand-owned wallet icon; use only for wallet identification. |
| `safepal` | `packages/client/src/wallets/icons/safepal.png` | PNG | Local bundled asset, synced from provided project icon folder | Brand-owned wallet icon; use only for wallet identification. |
| `tokenpocket` | `packages/client/src/wallets/icons/tokenpocket.svg` | SVG | Local bundled asset | Brand-owned wallet icon; use only for wallet identification. |
| `tronlink` | `packages/client/src/wallets/icons/tronlink.svg` | SVG | Local bundled asset | Brand-owned wallet icon; use only for wallet identification. |
| `trust` | `packages/client/src/wallets/icons/trust.svg` | SVG | Local bundled asset | Brand-owned wallet icon; use only for wallet identification. |
| `walletconnect` | `packages/client/src/wallets/icons/walletconnect.svg` | SVG | Local bundled asset, synced from provided project icon folder | Brand-owned WalletConnect icon; use only for WalletConnect connection identification. |

## Required Checklist For New Icons

- File name must match wallet descriptor id.
- Prefer SVG when available; PNG/JPG/WEBP is acceptable for official assets or when supplied by the wallet owner/project maintainer.
- Keep source dimensions sane and avoid oversized raster assets.
- Do not hotlink wallet logos at runtime.
- Add or update the row in this file when adding a new built-in icon.
- Run `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot` or the relevant client check after icon generation changes.
