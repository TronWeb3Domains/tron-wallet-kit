# GasFree integration — Account Panel "General ↔ GasFree" mode (spec for Codex)

Date: 2026-07-15. Status: design spec.

## Why

GasFree (gasfree.io) lets a TRON user **transfer TRC-20 (USDT) without holding TRX for gas** — a
killer, TRON-native feature (huge in Asia). Adding it as a first-class, well-explained mode in the
account panel is exactly the "TRON-native polish" that differentiates this kit from a raw adapter.
Reference SDK: `@gasfree/gasfree-sdk` (`gasfreeio/gasfree-sdk-js`).

## Concept (from the SDK)

- Every wallet address has a **deterministic GasFree address**, derived **offline** from the user
  address + chain + GasFreeController: `new TronGasFree({ chainId }).generateGasFreeAddress(userAddress)`.
  Users **receive** USDT into this address.
- To send out: sign a **TIP-712 typed-data** message (offline, no gas) built by
  `assembleGasFreeTransactionJson({ token, serviceProvider, user, receiver, value, maxFee, deadline, version, nonce })`
  → `{ domain, types, message }`. Ledger path: `getGasFreeLedgerRawHash({ message })`.
- A **service provider** submits the on-chain tx and deducts the gas fee **in the token** (`maxFee`).
- Balance / nonce / provider list / submit go through the **GasFree provider API** (the SDK is only
  client-side derivation + message assembly).
- chainId: mainnet `0x2b6653dc`, nile `0xcd8690dc`, shasta `0x94a9059e`.

## UX — Account Panel mode switch (the approved direction)

The account panel gains a **mode toggle: General ↔ GasFree**, so the user always has context.

**General mode (default, unchanged):** TRON wallet address, `.trx` name, TRX balance, recent tx.
Add a subtle entry point: a **"GasFree" chip/row** (only when `gasFree.enabled` and mainnet) that
shows the GasFree address exists and switches to GasFree mode on click.

**GasFree mode (display + context only — NO forms):**
- Clear header/context so the user knows the mode changed: a **"GasFree" badge/title** + one-line
  explainer ("Send USDT without TRX for gas").
- Shows the **GasFree address** (copy + QR) — this is the deposit/receive address.
- Shows **USDT balance** of the GasFree address (via the GasFree API).
- A **"← Back to General"** button returns to the normal wallet view (mirrors how TronLink surfaces
  the switch). The two modes never lose the connected session — it's a view switch, not a reconnect.

**Hard boundary — the kit renders NO transaction form.** Like RainbowKit/ConnectKit, the account
panel is connect + display only. It must **not** contain a send form (receiver/amount inputs) by
default, to avoid the user thinking the kit is a wallet that moves their funds. The gasless **send**
is a **primitive** the kit exposes (`useGasFree().transfer` / `kit.gasFree.transfer`, §Phase 2); the
**dApp builds its own send UI** and calls that primitive. Optionally, a prebuilt send widget MAY be
offered later as an explicit **opt-in** (`gasFree.builtInSend: true`, default `false`) for
batteries-included dApps — but it is never on by default and is never part of the account panel.

Design: reuse the existing account-panel tokens/layout; the mode toggle is a segmented control or a
header switch. Keep copy in the i18n label pack (add `gasFree.*` keys — en + zh).

## SDK surface

### Config

```ts
getDefaultConfig({
  appName,
  network: "mainnet",
  gasFree: {
    enabled: true,                       // default false; mainnet-only
    apiBaseUrl: "https://open.gasfree.io/tron", // app-injected; do NOT hardcode a default in the kit
    serviceProvider: "T...",             // provider address (app choice / from API provider list)
    token: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", // default USDT (TRC-20)
    // optional custom controller: gasFreeController, beacon, creationCode
  },
});
```

### Hooks (React)

```ts
useGasFree()  // {
  //   enabled, mode: "general" | "gasfree", setMode(m),
  //   address,            // derived GasFree address (offline)
  //   balance,            // USDT balance of the GasFree address (from API)
  //   isLoading, refresh(),
  //   transfer(req),      // Phase 2 gasless send
  // }
```

### Client (vanilla)

```ts
kit.gasFree.getAddress();        // derive (offline)
await kit.gasFree.getBalance();  // USDT via GasFree API
kit.gasFree.setMode("gasfree");  // drives the account panel view
await kit.gasFree.transfer({ receiver, value });  // Phase 2
```

## `signTypedData` capability (adapter addition — required for Phase 2)

GasFree send needs **TIP-712 typed-data signing**, which the current adapter contract doesn't
expose. Add an optional capability:

- `WalletCapabilities.signTypedData?: boolean` and `adapter.signTypedData?({ domain, types, message })`.
- TronLink supports TIP-712 (`_signTypedData`); wire it. Confirm WalletConnect (`tron_signTypedData`?)
  and each injected wallet; if an adapter lacks it, the kit disables gasless **send** for that wallet
  (receive/derive/balance still work — they need no signing).
- Ledger uses `getGasFreeLedgerRawHash` + `app.signTransactionHash` via the bridge.

## Gasless transfer flow (Phase 2) — a primitive the dApp drives

The kit exposes `transfer()` as a headless primitive. **The dApp owns the send form** (receiver /
amount / token inputs, validation, layout). The kit does the hard parts only: assemble the TIP-712
message, request the signature, relay to the provider, return status/errors. The kit ships no send
form (unless a dApp explicitly opts into a prebuilt widget — see the Hard boundary above).

1. `getAddress()` (offline derive).
2. Fetch from GasFree API: token info, `nonce`, chosen `serviceProvider`, `maxFee`, `deadline`.
3. `assembleGasFreeTransactionJson(...)` → `{ domain, types, message }`.
4. `adapter.signTypedData({ domain, types, message })` — **with a clear confirmation UI** showing
   amount, receiver, `maxFee`, provider (never auto-sign).
5. POST the signed payload to the GasFree API; poll status; surface result via the toast + tx history.
6. All failures map to `WalletKitError` with localized copy.

## Architecture boundary (must hold)

- **Client/app layer only.** GasFree address derivation + API calls live in the client (an optional
  module `@tron-wallet-kit/gasfree` or a `gasFree` runtime, like identity/balance). **Never** put
  GasFree API calls in core or adapters (hard rule). Adapters only gain the generic `signTypedData`.
- **Optional, lazy dependency.** `@gasfree/gasfree-sdk` is lazy-`import()`ed only when `gasFree.enabled`
  — respects the bundle budget.
- **App-injected provider/API config.** `apiBaseUrl` + `serviceProvider` come from the app; the kit
  ships no hardcoded provider (like WalletConnect projectId).
- **Mainnet-first.** Enable on mainnet; other networks resolve to disabled without error (like identity).
- **No secrets.** Kit only derives, builds the message, requests a signature, and relays to the API.

## Phases

- **Phase 1 (low-risk, high-value):** `gasFree.enabled` + derive address + Account Panel **General↔GasFree
  toggle** showing GasFree address (copy/QR) + USDT balance + "Back to General". No signing.
- **Phase 2:** `signTypedData` capability + `transfer()` gasless send **primitive** (headless; dApp
  builds the send form) + a documented confirmation contract. A prebuilt send widget is **opt-in only**
  (`gasFree.builtInSend`, default off), never in the account panel by default.

## Open questions

- Exact GasFree API base + auth (public vs keyed) — confirm from gasfree.io docs before wiring.
- WalletConnect TIP-712 method name/support for TRON.
- Default token: USDT contract per network; allow app override + multi-token later.
- Whether to show GasFree balance in the connect button (probably keep it in the panel only to avoid confusion).
