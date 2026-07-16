# Events And Hooks

TRON Wallet Kit exposes both low-level manager events and React hooks. Use manager events for
framework-agnostic integrations, and hooks when you are building React UI.

## Manager events

```ts
const offConnected = kit.manager.on("connected", ({ session }) => {
  console.log(session.account.address);
});

const offSubmitted = kit.manager.on("tx_submitted", ({ transaction }) => {
  console.log(transaction.hash);
});

const offError = kit.manager.on("error", ({ error }) => {
  console.error(error);
});
```

Remove listeners when your app shell unmounts:

```ts
offConnected();
offSubmitted();
offError();
```

## Common events

| Event | Use |
|---|---|
| `connecting` | Wallet request started. |
| `connected` | Session is active. |
| `disconnected` | Session ended. |
| `session_restored` | Stored session was recovered. |
| `accountChanged` | Wallet reported a different account. |
| `networkChanged` | Wallet reported a different network. |
| `signing` | Message or transaction signing started. |
| `signed` | Message or transaction signing finished. |
| `tx_submitted` | Transaction was broadcast and stored. |
| `tx_confirmed` | App marked a transaction confirmed. |
| `tx_failed` | App marked a transaction failed. |
| `error` | Normalized wallet error. |

## React hooks

```tsx
import {
  useTronAccount,
  useTronConnect,
  useTronDisconnect,
  useTronSignMessage,
  useTronWallet,
} from "@tron-wallet-kit/react";

function AccountButton() {
  const account = useTronAccount();
  const { open } = useTronConnect();
  const { disconnect } = useTronDisconnect();

  if (!account) return <button onClick={open}>Connect</button>;
  return <button onClick={disconnect}>{account.address}</button>;
}
```

Use hooks for rendering state; use manager events for analytics, logs, and non-React services.
