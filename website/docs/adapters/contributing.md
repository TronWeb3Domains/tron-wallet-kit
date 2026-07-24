# Contributing wallet adapters

TRON Wallet Kit accepts new wallets through descriptors. A descriptor is the single source for a
wallet's name, icon, supported platforms, detection rules, connect strategy, and catalog metadata.
Keep wallet quirks inside the descriptor so the core and UI stay generic.

## Choose an integration path

| Path | Best for | Ships where |
|---|---|---|
| Built-in descriptor | Popular wallets that should be available to most TRON dApps | `@tron-wallet-kit/client` |
| External descriptor package | Niche, proprietary, or fast-moving wallets | Your package, passed into app config |
| Custom adapter package | Wallets that cannot fit the descriptor strategy | Your package, compatible with core adapter types |

## Built-in descriptor checklist

1. Add `packages/client/src/wallets/entries/<id>.ts`.
2. Add `packages/client/src/wallets/icons/<id>.svg`.
3. Register the descriptor in the wallet registry.
4. Keep detection lightweight. It should answer "is a usable TRON provider likely here?" without
   requesting accounts.
5. Keep connect, address polling, signing quirks, and event mapping inside the descriptor strategy.
6. Add focused unit tests for provider detection, address extraction, collision guards, and signing
   shape when the wallet has custom behavior.
7. Complete live QA on HTTPS before asking for a wallet to be promoted in the recommended list.

## Descriptor example

```ts
import { standardInjected, withAddressPoll } from "@tron-wallet-kit/client";
import type { WalletDescriptor } from "@tron-wallet-kit/client";

export const acme: WalletDescriptor = {
  id: "acme",
  name: "Acme Wallet",
  integration: "injected",
  homepage: "https://acme.example",
  platforms: ["extension"],
  group: "popular",
  supportsWalletConnect: false,
  injected: withAddressPoll(
    standardInjected({
      providerPaths: ["acme.tron"],
      requestMethods: ["tron_requestAccounts", "eth_requestAccounts"],
    }),
    { timeoutMs: 2500, intervalMs: 100 }
  ),
  detect: {
    providerPaths: ["acme.tron"],
    conflictMarkers: ["acme"],
  },
};
```

## Icon policy

- Built-in icons live in `packages/client/src/wallets/icons`.
- The SVG filename must match the wallet id.
- The generated icon catalog converts local SVGs to data URIs for runtime display.
- Only use brand assets that the wallet provider publishes or permits.
- Third-party descriptor packages can provide `icon` directly as a data URI or absolute URL.

## QA requirements

Before a new built-in wallet is promoted, verify:

- installed badge settles correctly after first page load;
- unavailable state is honest when no usable TRON provider exists;
- selecting the wallet never connects through another wallet's global;
- first connect returns the selected wallet's address without requiring refresh;
- `signMessage` and `signTransaction` resolve or reject with normalized errors;
- back, close, disconnect, and timeout clear pending requests;
- docs include any HTTPS, mobile-only, or WalletConnect caveat.

Use the P2 QA checklist in `Review/P2_WALLET_ADAPTER_QA_SIGNOFF.md` for the full manual pass.

## External package example

```ts
import type { WalletDescriptor } from "@tron-wallet-kit/client";

export const acmeWallet: WalletDescriptor = {
  id: "acme",
  name: "Acme Wallet",
  integration: "injected",
  icon: "data:image/svg+xml;base64,...",
  homepage: "https://acme.example",
  platforms: ["extension"],
  injected: {
    detect: () => Boolean((globalThis as any).acme?.tron),
    connect: async () => {
      const [address] = await (globalThis as any).acme.tron.request({
        method: "tron_requestAccounts",
      });

      return { address };
    },
  },
};
```

Apps opt in without forking the kit:

```ts
import { createWalletKit } from "@tron-wallet-kit/client";
import { acmeWallet } from "@acme/tron-wallet-kit-acme";

createWalletKit({
  metadata: { name: "My TRON dApp" },
  wallets: ["tronlink", "okx", acmeWallet],
});
```
