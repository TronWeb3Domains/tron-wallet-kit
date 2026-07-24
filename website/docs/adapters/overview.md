# Adapters overview

Adapters isolate wallet-specific behavior from the core. Most injected wallets are handled by a
shared strategy, so you rarely write a full adapter — you describe a wallet with a small descriptor.

## How wallets are integrated

| Kind | How | Examples |
|---|---|---|
| Injected wallets | A kit-owned descriptor + `standardInjected` strategy (detect + connect). | TronLink, OKX, TokenPocket, Bitget, Gate, SafePal |
| WalletConnect | The lite `@tron-wallet-kit/adapter-walletconnect` transport. | Klever, Bitget (QR) |
| Hardware / MetaMask | The `tronweb3` bridge, lazy-loaded. | Ledger, MetaMask |

Detection and connection are kept **separate**: `detect()` is a cheap "is it installed?" check, and
`connect()` owns the wallet's quirks. This is what keeps the install badge accurate while quirky
connect logic stays isolated per wallet.

## Contributing a wallet

Two supported paths use the same `WalletDescriptor` shape, so a Path B package can later be
upstreamed as a Path A PR unchanged. The full checklist lives in
[Contributing wallets](/docs/adapters/contributing).

### Path A — PR into the kit (ship as a built-in)

For popular wallets that should be available to every app by default.

1. Add `packages/client/src/wallets/entries/<id>.ts` — one descriptor whose strategy composes
   `standardInjected` + decorators. All quirks (detect + connect + sign) live in this one file.
2. Add `packages/client/src/wallets/icons/<id>.svg` (filename must equal the wallet `id`).
3. Register it in the wallet registry.
4. Complete the PR checklist: HTTPS QA (installed badge, first connect, reconnect, `signMessage`,
   `signTransaction`), recorded provider path, and **no edits outside your entry file**.

Reviewer rule: a new wallet must not touch the shared detect file or the generic adapter — quirks
belong in `entries/<id>.ts`. That is what keeps the kit from bloating.

### Path B — external package (contributor-owned, no kit change)

For niche or proprietary wallets, or when you want your own release cadence. Publish a tiny package
that exports a descriptor:

```ts
import type { WalletDescriptor } from "@tron-wallet-kit/client"; // type-only

export const acme: WalletDescriptor = {
  id: "acme",
  name: "Acme Wallet",
  integration: "injected",
  icon: "data:image/svg+xml;base64,…", // inline, no repo icon file needed
  homepage: "https://acme.example",
  platforms: ["extension"],
  injected: {
    detect: () => Boolean((window as any).acme?.tron),
    connect: async () => {
      const [address] = await (window as any).acme.tron.request({ method: "tron_requestAccounts" });
      return { address };
    },
  },
};
```

Apps opt in at runtime — no fork, no PR:

```ts
import { createWalletKit } from "@tron-wallet-kit/client";
import { acme } from "@acme/twk-tron-wallet";

createWalletKit({ wallets: ["tronlink", "okx", acme] });
```

### Which path?

- Popular wallet, wants default visibility in every app → **Path A** (PR, becomes built-in).
- Niche / proprietary, or wants its own release cadence → **Path B** (external package, app opts in).

## Design boundary

The core package is not an EVM or multi-chain abstraction. Wallets that expose EVM-shaped APIs are
adapted at the edge; the core stays TRON-native.
