# Modal And Toast API

`createWalletKit` mounts modal and toast controllers for vanilla/browser flows. React apps usually
use `TronConnectButton`, `ConnectModal`, and `AccountPanel` instead.

## Modal

```ts
kit.openModal();
kit.closeModal();
```

The modal handles:

- Featured wallet list.
- All Wallets search.
- Installed, QR, and unavailable states.
- Connecting panel.
- WalletConnect QR panel.
- Account panel integration through the connect button.

## Toast

Enable toast UI with:

```ts
const kit = createWalletKit({
  metadata: { name: "My TRON dApp" },
  ui: { toast: true },
});
```

Toasts listen to wallet lifecycle and transaction events. Keep user-facing errors short by using the
normalized `WalletKitError` formatting from the kit.

## Theme updates

```ts
kit.setTheme({ themeName: "dark" });
kit.setTheme({ themeName: "tron", accentColor: "#ef0027" });
```

Theme changes propagate to modal, account panel, button, and toast controllers.
