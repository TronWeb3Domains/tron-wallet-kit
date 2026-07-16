---
layout: home

hero:
  name: TRON Wallet Kit
  text: The best way to connect a TRON wallet
  tagline: A beautiful, ready-to-use wallet experience for TRON dApps. Connect, sign, and transact in three lines.
  actions:
    - theme: brand
      text: Get started
      link: /docs/quick-start
    - theme: alt
      text: Live Playground
      link: /docs/playground
    - theme: alt
      text: Introduction
      link: /docs/introduction

features:
  - title: Beautiful by default
    details: A polished connect modal and account panel that look great with zero configuration.
  - title: Three-line integration
    details: getDefaultConfig, TronKitProvider, TronConnectButton — wrap your app and drop the button.
  - title: React hooks
    details: useTronAccount, useTronConnect, useTronBalance, useTrxName — build any custom UI you want.
  - title: Themeable
    details: Light, dark, and custom themes via lightTheme / darkTheme and CSS token overrides.
  - title: .trx identity
    details: Resolves TRON domain names and avatars for a friendlier account experience.
  - title: WalletConnect built in
    details: Mobile QR flow, loaded only when needed — TronLink, OKX, Bitget, Klever, and more.
---

## Three lines to a great connect experience

```tsx
import { getDefaultConfig, TronKitProvider, TronConnectButton } from "@tron-wallet-kit/react";

const config = getDefaultConfig({ metadata: { name: "My TRON dApp" } });

export function App() {
  return (
    <TronKitProvider config={config}>
      <TronConnectButton />
    </TronKitProvider>
  );
}
```

TRON Wallet Kit is a product-grade wallet UX layer for TRON — think ConnectKit or RainbowKit, but
TRON-native. It sits on top of the TRON wallet ecosystem (and `tronweb3/tronwallet-adapter` for
hardware and MetaMask), so you focus on your dApp, not wallet plumbing.
