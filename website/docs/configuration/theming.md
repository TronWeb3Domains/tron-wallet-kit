# Theming

TRON Wallet Kit is token-driven. Tokens are applied to the rendered wallet-kit root, so modals and
panels stay correct even when portaled to `document.body`. In React the easiest path is the
`lightTheme()` / `darkTheme()` factories; under the hood everything resolves to the same `--twk-*`
token set.

## React: theme factories

```tsx
import { lightTheme, darkTheme, TronKitProvider } from "@tron-wallet-kit/react";

<TronKitProvider config={config} theme={lightTheme()}>
  {/* ... */}
</TronKitProvider>
```

`lightTheme(options?)` and `darkTheme(options?)` accept a small, high-level set of knobs:

| Option | Type | Notes |
|---|---|---|
| `accentColor` | `string` | Primary brand color (buttons, highlights). |
| `accentColorForeground` | `string` | Text/icon color on the accent. |
| `borderRadius` | `"none" \| "small" \| "medium" \| "large"` | Corner rounding. |
| `fontStack` | `"system" \| "rounded"` | Font family shortcut. |
| `tokens` | object | Low-level `--twk-*` overrides for anything else. |

```tsx
const brand = lightTheme({
  accentColor: "#ef0027",
  borderRadius: "medium",
  fontStack: "rounded",
});
```

### System light / dark

Pass a `light` / `dark` pair to follow the OS preference:

```tsx
<TronKitProvider config={config} theme={{ light: lightTheme(), dark: darkTheme() }}>
```

## Presets

Beyond the factories, named presets are available via `themeName` (useful in the vanilla/UI API):

- Primary: `light`, `dark`.
- TRON-branded: `tron`, `tron-energy`, `nile`, `shasta`, `bandwidth`, `energy`, `sun`.
- Utility: `terminal`, `highContrast`.

The default `light` and `dark` presets are the polished production themes; the TRON-branded presets
are there for on-brand customization.

## Vanilla / UI config

For non-React apps the UI package exposes the lower-level API:

```ts
import { createDefaultWalletUiConfig } from "@tron-wallet-kit/ui";

const ui = createDefaultWalletUiConfig({
  mode: "auto",
  themeName: "tron",
  accent: "#ef0027",
  fontFamily: "Inter, sans-serif",
  customTheme: { radius: "16px", walletRadius: "12px" },
  accountPanel: { showAddressQr: true, showRecentTransactions: true },
  toast: true,
});
```

Merge order:

```txt
mode / themeName preset  →  accent / fontFamily shortcuts  →  customTheme (token overrides)
```

Use `accent` and `fontFamily` for the common path; use `customTheme` for lower-level token control.
The token contract is shared across modal, account panel, QR slot, recent transactions, and toast:
surface, elevated/muted/hover surface, border, text and muted text, accent, semantic status colors,
focus ring, spinner trail, QR foreground/background, and the portal scrim blur.

## Theme builder

Adjust the accent, radius, font, and mode below, watch the modal preview update, and copy the
exported config straight into your `TronKitProvider`.

<ThemeBuilder />
