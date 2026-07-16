---
aside: false
---

# Playground

Try the real connect experience — this button runs the actual kit bundle, detects your installed
wallets, and opens the live connect modal.

<ClientOnly>
  <PlaygroundWidget />
</ClientOnly>

Change the network, mode, or accent above and the button re-renders. On a desktop with a TRON wallet
installed you'll see it connect; on mobile, pick WalletConnect to scan the QR.

## Design your theme

Want to match your brand? The [theme builder](/docs/theme-builder) lets you tune colors, radius,
font, and layout, preview the modal on desktop and mobile, and copy the config.

## What you get

- A connect modal with featured wallets, an all-wallets list, and install / checking / QR states.
- An account panel: copy address, address QR, TRX balance, and `.trx` name.
- Light, dark, and custom themes.
- Build → sign → broadcast transaction helpers.

Ready to integrate? Start with the [Quick start](/docs/quick-start).

::: tip Maintainers
This page loads `public/tron-wallet-kit.iife.min.js` (the browser IIFE) — no npm dependency needed.
After changing the SDK, rebuild `@tron-wallet-kit/browser` and copy the fresh IIFE into
`website/public/`. Set `window.__TWK_WC_PROJECT_ID__` to enable WalletConnect in the playground.
:::
