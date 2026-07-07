# Quick Start

Install the packages you need:

```sh
pnpm add @tron-wallet-kit/react @tron-wallet-kit/adapter-tronlink @tron-wallet-kit/adapter-walletconnect
```

Create adapters:

```ts
import { createTronLinkAdapter } from "@tron-wallet-kit/adapter-tronlink";
import { createWalletConnectAdapter } from "@tron-wallet-kit/adapter-walletconnect";

const adapters = [
  createTronLinkAdapter(),
  createWalletConnectAdapter({
    projectId: "a4109c95d50e5c136cdafaf9fc44c105",
    network: "nile",
  }),
];
```

Use the React provider:

```tsx
import { TronWalletKitProvider, ConnectModal, AccountPanel } from "@tron-wallet-kit/react";

export function App() {
  return (
    <TronWalletKitProvider adapters={adapters}>
      <ConnectModal theme={{ themeName: "tron" }} />
      <AccountPanel theme={{ themeName: "tron" }} balanceTrx="0" />
    </TronWalletKitProvider>
  );
}
```

Run local examples:

```sh
pnpm dev:examples
```

Then open `http://127.0.0.1:5174/`.
