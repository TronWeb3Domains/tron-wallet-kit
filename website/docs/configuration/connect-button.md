# Connect button

The connect button is the one control most apps need: it shows "Connect wallet", opens the modal,
and after connecting switches to the account (avatar, `.trx` name, short address, balance).

## React

```tsx
import { TronConnectButton } from "@tron-wallet-kit/react";

<TronConnectButton label="Connect wallet" showBalance accountStatus="full" />
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `label` | `string` | `"Connect wallet"` | Text before connecting. |
| `showBalance` | `boolean` | `true` | Show TRX balance when connected. |
| `accountStatus` | `"full" \| "avatar" \| "address"` | `"full"` | How the connected account renders. |
| `chainStatus` | `"full" \| "icon" \| "none"` | `"full"` | Network indicator. |
| `accountPanelMode` | `"modal" \| "dropdown"` | `"modal"` | How the account panel opens after a connected button click. |

Prefer building your own? Use the hooks — `useTronConnect().openConnectModal()`,
`useTronAccount()`, `useTronDisconnect()` — and render whatever you like. See
[React](/docs/frameworks/react#hooks).

## Vanilla / browser

`createWalletKit` (or `createBrowserKit`) renders the button into a target element:

```ts
const kit = createWalletKit({
  metadata: { name: "My dApp" },
  connectButton: {
    target: document.querySelector("#connect")!,
    label: "Connect wallet",
    showBalance: true,
  },
  ui: {
    accountPanel: { mode: "modal" },
  },
});
```

You can also drive the modal directly with `kit.openModal()` / `kit.closeModal()` and render your
own trigger.

## Opening the account panel

Once connected, clicking the button opens the account panel (address, copy, QR, balance, `.trx`
name). In React you can also open it programmatically:

```tsx
import { useAccountModal } from "@tron-wallet-kit/react";

const { openAccountModal } = useAccountModal();
```

## See it live

Try the button with different networks, modes, and accents on the [Playground](/docs/playground).
