# Quick Start

Install the packages you need:

```sh
pnpm add @tron-wallet-kit/react @tron-wallet-kit/client
```

Create the wallet kit:

```ts
import { createWalletKit } from "@tron-wallet-kit/client";

const kit = createWalletKit({
  walletConnect: {
    projectId: "a4109c95d50e5c136cdafaf9fc44c105",
  },
  identity: { enabled: true },
});
```

Use the React provider:

```tsx
import { TronWalletProvider, WalletButton } from "@tron-wallet-kit/react";

export function App() {
  return (
    <TronWalletProvider kit={kit} ui={{ themeName: "tron" }}>
      <WalletButton accountPanelMode="modal" />
    </TronWalletProvider>
  );
}
```

Run local examples:

```sh
pnpm dev:examples
```

Then open `http://127.0.0.1:5174/react-basic/`.
