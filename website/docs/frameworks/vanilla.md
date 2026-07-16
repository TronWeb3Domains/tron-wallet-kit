# Vanilla TypeScript

No framework required. `@tron-wallet-kit/client` renders the connect modal and account panel into the
DOM, so you can use it from plain TypeScript or any framework.

```sh
pnpm add @tron-wallet-kit/client
```

## Create the kit and mount a button

```ts
import { createWalletKit } from "@tron-wallet-kit/client";

const kit = createWalletKit({
  metadata: {
    name: "My TRON dApp",
    description: "Wallet connection for My TRON dApp",
    url: window.location.origin,
    icons: [`${window.location.origin}/icon.png`],
  },
  network: "mainnet",
  walletConnectProjectId: import.meta.env.VITE_WC_PROJECT_ID, // optional
  connectButton: {
    target: document.querySelector("#connect")!,
    label: "Connect wallet",
    showBalance: true,
  },
});
```

The button renders itself, opens the modal, and switches to the account view once connected. You can
also drive the modal yourself:

```ts
kit.openModal();
kit.closeModal();
await kit.disconnect();
```

## React to session changes

```ts
const off = kit.manager.on("connected", ({ session }) => {
  console.log("connected:", session.account.address);
});

kit.manager.on("disconnected", () => console.log("disconnected"));

// later
off();
```

## Read the current state

```ts
const session = kit.getSession();
if (session) {
  console.log(session.account.address, session.balance?.formatted);
}
```

## Sign and transact

```ts
await kit.signMessage("Hello TRON");
await kit.transferTrx({ to: "T...", amountSun: 1_000_000n });
```

## Clean up

```ts
kit.destroy(); // removes the button, modal, and listeners
```

## Theming

Pass a `ui` config with a theme name or tokens:

```ts
createWalletKit({
  metadata: { name: "My dApp" },
  ui: { themeName: "tron", accent: "#ef0027", toast: true },
});
```

See [Theming](/docs/configuration/theming) for the full token set. For the React component API, see
the [React](/docs/frameworks/react) guide; for a no-build `<script>` drop-in, see
[CDN / IIFE](/docs/frameworks/cdn-iife).
