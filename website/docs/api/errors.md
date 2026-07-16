# Errors

TRON Wallet Kit normalizes wallet, network, signing, and transaction failures into a compact error
shape that is safe to show in UI.

```ts
import {
  WalletKitError,
  WalletKitErrorCode,
  formatWalletError,
  normalizeWalletError,
} from "@tron-wallet-kit/core";

try {
  await kit.signMessage("Hello TRON");
} catch (error) {
  const formatted = formatWalletError(error);
  console.log(formatted.title, formatted.message, formatted.code);
}
```

## Format

`formatWalletError(error)` returns:

```ts
type WalletKitFormattedError = {
  code: string;
  title: string;
  message: string;
  details?: string;
  category:
    | "wallet"
    | "connection"
    | "session"
    | "request"
    | "signing"
    | "transaction"
    | "network"
    | "configuration"
    | "unsupported"
    | "unknown";
  severity: "info" | "warning" | "error";
  retryable: boolean;
};
```

By default, long provider messages are sanitized and shortened so they do not break the modal layout.

## Common codes

| Code | Meaning |
|---|---|
| `WALLET_UNAVAILABLE` | The wallet provider is not available in the current browser. |
| `USER_REJECTED` | The user cancelled or rejected the wallet request. |
| `REQUEST_TIMEOUT` | The wallet did not respond in time. |
| `NO_SESSION` | An action requires a connected wallet session. |
| `SIGN_MESSAGE_FAILED` | The wallet could not sign a message. |
| `SIGN_TRANSACTION_FAILED` | The wallet could not sign a transaction. |
| `SEND_TRANSACTION_FAILED` | The transaction could not be broadcast. |
| `INVALID_TRANSACTION` | The transaction request is missing or invalid. |
| `OUT_OF_ENERGY` | The account does not have enough TRON energy. |
| `INSUFFICIENT_BALANCE` | The account balance is not enough. |
| `RATE_LIMITED` | The RPC endpoint is rate limiting requests. |
| `CONFIGURATION_ERROR` | The kit or adapter configuration is invalid. |

## Custom UI copy

Pass message overrides when formatting:

```ts
const formatted = formatWalletError(error, {
  messages: {
    codes: {
      USER_REJECTED: {
        title: "Request cancelled",
        message: "Open your wallet and approve the request to continue.",
      },
    },
  },
});
```

Keep adapter errors in logs and show `formatted.title` / `formatted.message` to users.
