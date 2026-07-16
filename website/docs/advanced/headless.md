# Headless Usage

Use the client package when you want TRON Wallet Kit behavior without the default React components.
This is the right mode for custom design systems, Vue/Svelte apps, embedded widgets, and product
flows that need wallet state but own every pixel.

```ts
import { createWalletKit } from "@tron-wallet-kit/client";

const kit = createWalletKit({
  metadata: { name: "My TRON dApp" },
  network: "mainnet",
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  useBrowserStorage: true,
});

kit.openModal();
```

## What the kit still owns

- Wallet registry and installed detection.
- TronLink, injected wallets, WalletConnect, and hardware bridge wiring.
- Session storage and auto reconnect.
- Balance and identity refresh helpers.
- Transaction build, sign, broadcast, preview, and recent transaction store.
- Modal, toast, and account panel controllers if you choose to mount them.

## What your app owns

- Layout and routing.
- Custom buttons and account surfaces.
- Server-side auth/session handling.
- Business-specific transaction confirmation copy.

## Minimal custom button

```ts
const button = document.querySelector("#connect")!;

button.addEventListener("click", () => {
  if (kit.getSession()) {
    // Open your own account surface or use kit.button if mounted.
    return;
  }
  kit.openModal();
});

kit.manager.on("connected", ({ session }) => {
  button.textContent = session.account.domain ?? session.account.address;
});
```

## Cleanup

Destroy the kit when your shell unmounts:

```ts
kit.destroy();
```
