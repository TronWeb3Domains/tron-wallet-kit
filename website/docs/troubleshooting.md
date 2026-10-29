# Troubleshooting

Common wallet issues on TRON and how the kit handles them.

## TronLink shows "not installed" on a multi-wallet browser

TRON wallets inject into shared `window.tronLink`, `window.tron`, and `window.tronWeb` globals. The
wallet whose content script runs last can own the shared global, even when the user selected a
different wallet.

The kit detects TronLink through its wallet-specific provider path and collision-free 6963 signal
where available, not the bare shared global alone. If TronLink appears to flap between checking and
not installed, verify that your app is using the current descriptor registry and is not overriding
the TronLink provider resolver.

## "Not installed" vs "unavailable"

- **Not installed** means no usable provider was detected for that wallet.
- **Unavailable** means the wallet exists but cannot serve a TRON connection in this browser context.

The modal only marks a wallet installed when a usable TRON provider is present, not merely when a
namespace object exists.

## Trust or Binance is installed but not shown as installed

Trust Wallet and Binance Web3 Wallet can expose top-level namespace objects even when the current
browser context does not provide a usable TRON provider. The kit intentionally avoids treating those
namespaces as installed by themselves. This prevents a false positive where the UI says a wallet is
installed but connect cannot return a TRON address.

If your QA environment proves a new provider path for either wallet, add it to that wallet's
descriptor and record the path in the P2 wallet QA notes.

Trust's mobile in-app provider is `trustwallet.tron` and may have no `request` method. The kit
reads its authorized address directly and keeps using its own `tronWeb` for signing and balance.
Open the dApp inside Trust Wallet; an external browser-to-app jump may not inject a TRON provider.

SafePal extension and in-app providers are `safepalTronProvider` and `safepalwallet.tron`.
Legacy `SafePalHook` is also supported. Modern providers use `signMessageV2` for messages.

## WalletConnect: "cancelled in the wallet"

If you scan the WalletConnect QR, approve in your wallet, and still get "The request was cancelled in
the wallet", the wallet's WalletConnect layer may have rejected the session because it could not
satisfy the requested namespace.

The kit requests a minimal required namespace, only `tron_signTransaction`, and puts
`tron_signMessage` plus events in optional namespaces. If you build a custom WalletConnect adapter,
keep the required set minimal and put extra methods or events in `optionalNamespaces`.

When a wallet connects through WalletConnect, the connected button may show the wallet's own session
metadata when the wallet provides it. If the wallet omits metadata, the UI falls back to the generic
WalletConnect transport icon.

## First connect returns no address, then retry works

Some wallets populate the account address a moment after the approval promise resolves. The kit polls
the live provider through a settle window and reads the wallet's own objects, so the address can be
captured on the first attempt.

If you wrap the adapters yourself, give the address poll a generous settle window and read the
address from the wallet's own `tronWeb` or hook rather than the shared `window.tronWeb`.

## Gate Wallet only injects on HTTPS

Gate injects its provider on secure origins. Use `https://127.0.0.1:5174/react-basic/` or a deployed
HTTPS origin during development.

## Ledger does not appear as installed

Ledger is hardware-supported, not an injected extension. It should be offered as a hardware-capable
wallet on desktop, but a real connection still needs:

- the built-in Ledger adapter dependency (included with `@tron-wallet-kit/client`);
- a Ledger device connected and unlocked;
- the TRON app open on the device;
- a desktop browser with WebHID support, such as Chrome or Edge, on HTTPS or localhost;
- browser device permissions granted after selecting Ledger in the device chooser.

Close Ledger Live or other applications using the device before retrying. The built-in flow uses
the first TRON account (index `0`, path `44'/195'/0'/0/0`) and asks you to verify its address on the
device. It stays in the kit's connecting panel without opening another Ledger modal. Rejecting
verification does not connect the wallet. If loading the adapter fails, refresh the page and retry.

The browser connects directly to the hardware device through WebHID. Ledger Live is not required.
The kit displays the preparation instructions; the browser displays the device chooser.

### Failure after choosing the device

The panel displays device error details instead of hiding them behind a generic connection hint.
If it reports `Class constructor Transport cannot be invoked without 'new'`, the legacy WebHID
package `6.27.1` has resolved an incompatible newer base transport. This workspace pins the base
transport for that package only. Applications using the npm packages must apply the same override
in their root `package.json`:

```json
{
  "pnpm": {
    "overrides": {
      "@ledgerhq/hw-transport-webhid@6.27.1>@ledgerhq/hw-transport": "6.27.1"
    }
  }
}
```

Reinstall dependencies and restart the dev server with `--force` to refresh Vite's optimized modules.
For npm, use a nested `overrides` entry for `@ledgerhq/hw-transport-webhid@6.27.1` with
`"@ledgerhq/hw-transport": "6.27.1"`.

## TronGrid rate limits

If balance, identity, or transaction reads fail intermittently, you may be hitting TronGrid's
anonymous rate limit. Configure an API key in your TronWeb or RPC settings for production traffic.

## Mobile browser vs in-app browser

A wallet's in-app browser injects a provider directly, while a normal mobile browser usually needs
WalletConnect. If a wallet connects inside its own app but not in Chrome or Safari, use
WalletConnect for the mobile-browser case.

Still stuck? Open an issue with the wallet name, platform, browser, extension or app version, and
whether the test used an extension, WalletConnect, or the wallet's in-app browser.
