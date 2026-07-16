# Localization

The connect modal, account panel, and toasts read every string from a label pack, so you can switch
language or override individual strings without touching the components.

## Built-in locales

English (`en`) and Simplified Chinese (`zh`) ship with the kit — Chinese is a first-class locale
given how widely TRON is used across Chinese-speaking communities. Pick one through the UI config:

```ts
const config = getDefaultConfig({
  metadata: { name: "My dApp" },
  ui: { locale: "zh" },
});
```

## Overriding individual strings

Pass `labels` to change specific text while keeping the rest of the chosen locale:

```ts
getDefaultConfig({
  metadata: { name: "My dApp" },
  ui: {
    locale: "en",
    labels: {
      connectModal: {
        title: "Choose your wallet",
        installed: "Ready",
      },
    },
  },
});
```

Overrides are merged over the locale, so you only specify what changes.

## Adding a language

Provide a full label pack as `labels` (starting from a built-in as a base) and set a matching
`locale` id. Contributions of new built-in locales are welcome — mirror the shape of the `en` pack.

```ts
import { en } from "@tron-wallet-kit/ui";

getDefaultConfig({
  metadata: { name: "My dApp" },
  ui: {
    locale: "fr",
    labels: {
      ...en,
      connectModal: { ...en.connectModal, title: "Choisissez un portefeuille" },
    },
  },
});
```

::: trx No hardcoded strings
Because the UI never hardcodes copy, error and status messages are localized too — a rejected
signature or a "not installed" badge shows in the active language, never a raw code.
:::
