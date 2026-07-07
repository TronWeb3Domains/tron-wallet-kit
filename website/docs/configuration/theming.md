# Theming

TRON Wallet Kit uses token-driven themes. Tokens are applied directly to the rendered wallet kit root, so modals and panels still look correct when they are portaled to `document.body`.

## Presets

Current `themeName` values:

- `light`
- `dark`
- `tron`
- `tron-energy`
- `nile`
- `shasta`
- `bandwidth`
- `energy`
- `sun`
- `terminal`
- `highContrast`

Extended playground presets are also available for visual testing:

- `graphite`
- `midnight`
- `ocean`
- `glass`
- `rounded`
- `crisp`
- `soft`
- `neon`
- `minimal`

The default `light` and `dark` presets are the primary polished modal themes. TRON-branded presets such as `tron`, `tron-energy`, `nile`, `shasta`, `bandwidth`, and `energy` are intended for production customization.

## Usage

```ts
import { resolveTheme, createThemeStyleText } from "@tron-wallet-kit/ui";

const theme = resolveTheme({
  themeName: "tron",
  tokens: {
    radius: "16px",
    accent: "#ef4444",
  },
});

const css = createThemeStyleText({ themeName: "tron" }, "[data-twk-root]");
```

## UI Config

```ts
import { createDefaultWalletUiConfig } from "@tron-wallet-kit/ui";

const ui = createDefaultWalletUiConfig({
  mode: "auto",
  themeName: "tron",
  customTheme: {
    radius: "18px",
    walletRadius: "12px",
  },
  walletList: {
    layout: "list",
  },
  accountPanel: {
    showAddressQr: true,
    showRecentTransactions: true,
  },
  toast: true,
});
```

Theme merge order:

```txt
mode/themeName preset -> customTheme
```

The token contract is shared by modal, account panel, QR slot, recent transactions, and toast surfaces.
The current theme tokens include surface, elevated surface, muted surface, hover surface, border, text, muted text, accent, semantic status colors, focus ring, spinner trail, QR foreground/background, and portal scrim blur.
