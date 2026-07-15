# Troubleshooting

Common wallet issues on TRON and how the kit handles them.

## TronLink shows "not installed" on a multi-wallet browser

TRON wallets inject into the shared `window.tronLink` / `window.tron` globals, so whichever wallet's
content script runs last "owns" them. On a machine with OneKey (or others) installed, `window.tronLink`
can belong to a different wallet, and a naive check would report TronLink as missing.

The kit detects TronLink through its collision-free **6963 announcement** (`org.tronlink.www`) rather
than the bare global, so it shows installed regardless of who owns `window.tronLink`. If you see it
flapping, make sure you're on the current version and that detection isn't being overridden by a
custom provider resolver.

## "Not installed" vs "unavailable"

- **Not installed** — no usable provider was detected for that wallet.
- **Unavailable** — the wallet exists but can't serve a TRON connection here (for example a
  desktop-only build, or a wallet that only supports TRON in its mobile in-app browser).

The modal only marks a wallet installed when a **usable TRON provider** is present — not merely when a
namespace object exists — so "installed" always means "connectable".

## WalletConnect: "cancelled in the wallet"

If you scan the WalletConnect QR, approve in your wallet, and still get "The request was cancelled in
the wallet", the wallet's WalletConnect layer rejected the session because it couldn't satisfy the
requested namespace. The kit requests a **minimal required namespace** (only `tron_signTransaction`),
with everything else optional, precisely to avoid this. If you build a custom WalletConnect adapter,
keep the required set minimal and put extra methods/events in `optionalNamespaces`.

## First connect returns no address (then works on retry)

Some wallets (SafePal, Bitget) populate the account address a moment **after** the approval promise
resolves. The kit polls the live provider through a settle window and reads the wallet's own objects,
so the address is captured on the first attempt. If you wrap the adapters yourself, give the address
poll a generous settle window and read the address from the wallet's own `tronWeb` / hook rather than
the shared `window.tronWeb`.

## Gate Wallet only injects on HTTPS

Gate injects its provider on secure origins. Use `https://` (or `http://localhost` where the wallet
allows it) during development, not a plain `http://` LAN address.

## TronGrid rate limits

If balance or transaction reads fail intermittently, you may be hitting TronGrid's anonymous rate
limit. Configure an API key in your `tronWeb` / RPC settings for production traffic.

## Mobile browser vs in-app browser

A wallet's in-app browser injects a provider directly (connect works inline), while a normal mobile
browser needs WalletConnect. If a wallet connects inside its own app but not in Chrome/Safari,
that's expected — use WalletConnect for the mobile-browser case.

Still stuck? Open an issue with the wallet name, platform, and whether it's an extension or the
wallet's in-app browser.
