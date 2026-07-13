# Spec: Wallet Adapter Organization — Detect/Connect Separation + Open Strategy

## Problem (current state, from code)

`packages/client/src/injected/detect.ts` has ~30 functions. Every quirky wallet adds bespoke functions into this shared file:

- Per-wallet provider getters: `getGateInjectedProvider`, `getSafePalInjectedProvider`, `getBitgetInjectedProvider`, `getBinanceInjectedProvider`, `getFoxWalletInjectedProvider`, `getGuardaInjectedProvider`, `getMathWalletInjectedProvider` (+ 4 MathWallet helpers).
- Per-wallet markers: `hasGateInjectedMarker`, `hasBitgetInjectedMarker`, `hasSafePalInjectedMarker`.

`InjectedTronAdapterConfig` accumulated per-quirk flags: `requestMethods`, `signMessageMode`, `availabilityTimeoutMs`, `addressTimeoutMs`, `addressSettleMs`, `accountChangeEventNames`, `accountChangeTimeoutMs`, `emptyAddressRetryDelayMs`, `emptyAddressRetryTimeoutMs`, `preferInjectedAddress`. The single generic `createInjectedTronAdapter` branches on all of them.

Consequences:

1. **Detect and connect are coupled.** `getXInjectedProvider` both answers "is it there" and builds the provider used for connect/address. The INSTALLED badge is driven by markers; connect is driven by provider resolution + address acquisition. Two different code paths that can disagree — e.g. Gate: marker present -> INSTALLED, but connect hangs on `eth_requestAccounts`. The list state and the real connect result get out of sync.
2. **Quirks bleed across wallets.** A change to the shared address-acquisition or the generic adapter can break an unrelated wallet.
3. **Closed to third parties.** Adding a quirky wallet requires editing kit-internal `detect.ts`. A runtime-registered custom wallet cannot express its own connect quirks.
4. **Bloat.** ~30 functions and 10 config flags, growing per wallet.

The upstream `tronweb3/tronwallet-adapter` avoids this by making each wallet a self-contained adapter (its own `readyState`/detect + `connect` + `signTransaction`). We diverged into "one generic adapter + flags", which is where the sprawl comes from.

---

## Principles

1. **DETECT is a pure predicate, fully separate from CONNECT.** `detect()` answers only "installed?" from a cheap marker. It never touches connect/address logic. The INSTALLED badge is driven by `detect()` only.
2. **CONNECT is a self-contained strategy that OWNS the wallet's quirks.** `eth_requestAccounts`, slow-address polling, `preferInjectedAddress`, request-hang handling — all live inside that wallet's `connect`, not as flags on a shared adapter.
3. **Shared code = composable utilities, not a branching monolith.** Standard wallets use one factory; quirky wallets compose the same utilities differently.
4. **Open.** The strategy is plain functions on the descriptor, so a third party supplies `detect`/`connect` at runtime without editing the kit.
5. **No cross-wallet bug bleed.** Each wallet's quirks live in its own module; changing wallet A cannot break wallet B.

---

## TronLink priority (default + rank-first)

TronLink is the **reference/default TRON wallet** and must be treated as the top-priority entry:

- **Rank #1 / featured.** TronLink is shown first and marked featured in the catalog, ahead of every
  other wallet. It is the canonical TRON provider (the de-facto `window.tronLink`/`window.tron`
  standard other wallets copy), so it is the safe default for a first-time TRON user.
- **"Evaluated LAST" ≠ deprioritized.** The detection algorithm resolves TronLink *last* **only for
  namespace disambiguation** — branded wallets (OneKey/TokenPocket/…) claim the shared
  `window.tronLink` first so they are not mistaken for TronLink; TronLink then claims the truly-generic
  global. This ordering is about *who owns the contested global*, NOT about display priority. Do not
  read "last" as "lower priority": in ranking/featured, TronLink is **first**.
- **Detect authoritatively via EIP-6963 `org.tronlink.www`.** Because the bare global is contested
  (verified live: OneKey owned `window.tronLink`), TronLink's INSTALLED state comes from its EIP-6963
  rdns, not the bare global — so it reliably shows installed and stays rank-first even with other
  wallets present.

### BUG: TronLink badge stuck "checking → not installed" (root cause + fix)

**Symptom:** with other wallets installed, TronLink's badge shows *checking* then *not installed*,
even though TronLink is installed and works.

**Root cause (traced in code + verified live 2026-07-13):** the async 6963 discovery that WOULD find
TronLink is never consulted for the badge — a synchronous bare-global check runs instead and loses
the namespace write race.

1. **Live:** TronLink announces correctly on `TIP6963:announceProvider` (rdns `org.tronlink.www`,
   `isTronLink:true`). The bare globals are owned by other wallets: `window.tronLink` = OneKey
   (`isOneKey:true`+`isTronLink:true`), `window.tron` = TokenPocket (`isTokenPocket:true`). So any
   bare-global check for TronLink returns **false**.
2. **`adapter-tronlink/src/index.ts`** exposes a **synchronous** `detect()` (line ~121):
   `hasGlobalTronLinkDetectMarker() || providerResolver()` — both are bare-global lookups
   (`window.tronLink`/`window.tron`). With OneKey/TokenPocket owning those globals, `detect()`
   returns **false**. The TIP6963 discovery (`discoverTip6963TronLinkProvider`) lives **only** inside
   the async `isAvailable()` → `waitForProvider()` (line ~260).
3. **`ui/src/modal.ts` `refreshAvailability()` (line ~226)** picks the detector as
   `const detectWallet = adapter.detect ?? adapter.isAvailable;` — i.e. it **prefers the synchronous
   `detect()`** and never calls `isAvailable()` when `detect` exists. So the badge is driven by the
   race-losing bare-global check; the TIP6963 path never runs. `detectWithGrace` retries during a
   grace window but re-calls the same sync `detect()` → still false → **"not installed"**.

**Fix (make TronLink's install detection race-proof; do NOT rely on the bare global):**

- **Primary — cache a one-shot 6963 probe in the adapter.** On adapter construction (and again at the
  start of each `refreshAvailability`), kick off the 6963 discovery **once** and cache the announced
  provider. Have the **synchronous `detect()` return `true` if the cached 6963 provider exists**, OR
  the bare-global marker passes. The modal's `detectWithGrace` already retries within
  `DETECT_FALSE_GRACE_MS`, so the announce (resolves in a few ms) flips a retry to `true` → INSTALLED.
  Cache the result for the session so the badge does not flap.
- **Probe BOTH 6963 channels.** `discoverTip6963TronLinkProvider` currently listens only on
  `TIP6963:announceProvider` (uppercase) — correct for TronLink, but the shared detect layer should
  dispatch/listen on **both** `TIP6963:*` and `eip6963:*` (see Detection precedence §1) so one code
  path serves every wallet.
- **Do not pass a custom `provider` resolver to `createTronLinkAdapter`** unless you also handle 6963:
  `waitForProvider` **skips** `discoverTip6963TronLinkProvider` when `hasCustomProviderResolver` is
  true (line ~259). The client entry currently forwards `config.tronlink` options — if an app sets
  `tronlink.provider`, discovery is disabled and this bug returns.
- **Companion (modal rule):** when an adapter exposes both `detect` and `isAvailable`, a first-pass
  sync `detect()===false` should fall through to `isAvailable()` **within the grace window** (not
  instead of it). This keeps the cheap path fast while letting the authoritative async 6963 result
  settle the badge. Aligns with "detect must be computed once per session and cached".

**Acceptance:** with OneKey + TokenPocket (or any wallet owning `window.tronLink`/`window.tron`) also
installed, TronLink shows **INSTALLED** on every reload, rank-first, with no "not installed" flip.

---

## Integration boundary — build direct vs reuse tronweb3

Decision (confirmed with maintainer): **do not route common injected wallets through
`@tronweb3/tronwallet-adapter`.** Reuse upstream only where it removes real, complex protocol work.

| Category | Approach | Why |
|---|---|---|
| **Common injected wallets** (TronLink, OKX, TokenPocket, Gate, Bitget, SafePal, OneKey, FoxWallet, …) | **Direct** — kit-owned `standardInjected` + decorators | Each is a few lines; a per-wallet adapter dependency bloats the bundle, adds a second connect path, and inherits upstream's flaky detect. |
| **Ledger / hardware** | **Reuse `@tronweb3` adapter via the bridge** (optional peer dep, lazy-loaded) | Hardware transport/protocol is complex and not worth reimplementing. |
| **MetaMask-TRON** | **Reuse `@tronweb3` adapter via the bridge** (optional peer dep, lazy-loaded) | MetaMask injects no TRON provider; the upstream snap/adapter handles the MetaMask↔TRON path. |
| **WalletConnect** | **Own LITE implementation (self-written), NOT tronweb3's WC adapter** | tronweb3's WC adapter pulls `@reown/appkit` + a large dependency tree → **build-size bloat**. The kit ships a minimal WC client with only what TRON signing needs. |

**Detection is ALWAYS kit-owned, regardless of category.** Never rely on `@tronweb3` `readyState` for
install detection: its `TronLinkAdapter` reads the bare `window.tronLink` and reproduces the exact
namespace-collision bugs verified live (TronLink shows "not installed" when OneKey owns the global;
Trust flip). The kit's EIP-6963 + usable-provider detect is authoritative for all wallets, including
the ones whose connect/sign is delegated to a tronweb3 bridge adapter.

Rule of thumb: **reuse tronweb3 for the transport/protocol, never for detection, and never when it
drags in a heavy dependency tree the kit can replace with a lite module (WalletConnect).**

---

## New descriptor shape (injected)

Replace the flag-bag with a strategy object:

```ts
type InjectedStrategy = {
  // "Is it installed?" — cheap marker only. No request(), no dynamic import, no address logic.
  detect: () => boolean | Promise<boolean>;
  // Get an address. Owns ALL of this wallet's connect quirks.
  connect: (ctx: InjectedConnectContext) => Promise<InjectedConnectResult>;
  signMessage?: (ctx: InjectedConnectContext, message: string) => Promise<string>;
  signTransaction?: (ctx: InjectedConnectContext, tx: unknown) => Promise<unknown>;
  // Optional live account/network/disconnect events. Returns an unsubscribe fn.
  subscribe?: (ctx: InjectedConnectContext, handlers: InjectedEventHandlers) => () => void;
};

type InjectedConnectContext = {
  network: WalletNetwork;
  getProvider: () => InjectedTronProvider | undefined;   // live re-resolve each call
  helpers: InjectedHelpers;                              // shared building blocks (below)
};

type InjectedConnectResult = { address: string; network?: WalletNetwork; raw?: unknown };
```

Descriptor:

```ts
{ id, name, integration: "injected", icon?, homepage, platforms, group?, featured?, injected: InjectedStrategy }
```

Shared helpers (the ONLY place the tricky logic lives, reused by every strategy):

```ts
type InjectedHelpers = {
  readDefaultAddress: () => string | undefined;                       // provider.tronWeb.defaultAddress.base58
  requestOnce: (method: string, params?: unknown) => Promise<unknown>;
  // Fire request() to trigger the popup, then resolve as soon as request returns an address OR
  // the live provider populates defaultAddress. Handles slow-address (SafePal) and hang (Gate).
  acquireAddress: (opts?: { requestMethods?: string[]; timeoutMs?: number }) => Promise<string | undefined>;
  resolveNetwork: (fallback?: WalletNetwork) => Promise<WalletNetwork>;
};
```

---

## Standard strategy (covers most wallets, zero bespoke code)

```ts
export function standardInjected(opts: {
  providerPaths: string[];                 // e.g. ["okxwallet.tronLink"]
  marker?: () => boolean;                  // default: a provider exists at providerPaths
  requestMethods?: string[];               // default ["tron_requestAccounts"]
  signMessageMode?: "signMessageV2" | "sign" | "request";
}): InjectedStrategy;
```

Standard entry — one line, no shared-file edits:

```ts
export const okx: WalletDescriptor = {
  id: "okx", name: "OKX Wallet", integration: "injected", homepage: "...", platforms: ["extension"],
  injected: standardInjected({ providerPaths: ["okxwallet.tronLink"] })
};
```

`standardInjected` builds `detect` (marker/provider-present) and `connect` (`acquireAddress` with the given methods) from the shared helpers. Standard wallets never touch `detect.ts`.

---

## Quirky wallets — quirk isolated in the wallet's own file

Each quirky wallet's file contains its WHOLE story (detect + connect + sign). The generic adapter and `detect.ts` never grow.

### Gate (marker installed; connect prefers injected address, else eth_requestAccounts + poll)

```ts
// entries/gate.ts
export const gate: WalletDescriptor = {
  id: "gate", name: "Gate Wallet", integration: "injected", homepage: "...", platforms: ["extension"],
  injected: {
    detect: () => hasGateMarker(),                       // pure: window.gatewallet?.tronLink present
    connect: async (ctx) => {
      const existing = ctx.helpers.readDefaultAddress(); // Gate exposes address; request() hangs
      if (existing) return { address: existing };
      const address = await ctx.helpers.acquireAddress({ requestMethods: ["eth_requestAccounts"] });
      if (!address) throw new WalletKitError("CONNECTION_FAILED", "Gate did not return an address.");
      return { address };
    },
    signMessage: (ctx, m) => ctx.getProvider()!.tronWeb!.trx!.signMessageV2!(m),
  }
};
function hasGateMarker(): boolean { /* window.gatewallet?.tronLink */ }
```

### SafePal (slow address; sign via `trx.sign`)

```ts
// entries/safepal.ts
injected: {
  detect: () => hasSafePalMarker(),
  connect: (ctx) => ctx.helpers.acquireAddress().then((a) => ({ address: a! })), // acquire polls the late address
  signMessage: (ctx, m) => ctx.getProvider()!.tronWeb!.trx!.sign!(m) as Promise<string>,
}
```

### Bitget (own namespace)

```ts
injected: standardInjected({ providerPaths: ["bitkeep.tronLink", "tronLink"], marker: hasBitgetMarker })
```

The eth_requestAccounts / slow-address / prefer-injected quirks are **inside each wallet's connect**, not flags on a shared adapter.

---

## Generic adapter becomes a thin orchestrator

`createInjectedTronAdapter(descriptor)`:

- `isAvailable = () => descriptor.injected.detect()`  (+ optional short EIP-6963 wait handled inside `detect`).
- `connect = async (opts) => normalize(await descriptor.injected.connect(buildCtx(opts)))`.
- `signMessage = descriptor.injected.signMessage ?? defaultSignMessage(helpers)`.
- `signTransaction = descriptor.injected.signTransaction ?? defaultSignTransaction(helpers)`.

No quirk flags on the adapter. `detect.ts` keeps ONLY generic utilities (`getInjectedTronProvider`, `requestInjectedAddress`, `acquireAddress`, `extractInjectedAddress`, `resolveInjectedNetwork`) + the `standardInjected` factory. Every `getXInjectedProvider` / `hasXMarker` moves into its wallet's entry file.

---

## Status-vs-connect fix (explicit)

- The INSTALLED badge is driven **only** by `detect()` — a cheap, near-synchronous marker check. Fast and accurate; no skeleton lag from importing adapters or awaiting a request.
- Connect failures surface as **connect errors** and never change availability. A wallet may be INSTALLED yet connect-quirky — that is correct, and detect/connect can no longer share a bug because they are different functions.
- `detect()` must NOT trigger `request()` or a bridge dynamic import (keep the cheap-probe rule). Only globals/markers, plus an optional short EIP-6963 listen.

---

## Open for third parties (same shape as builtin)

```ts
createWalletKit({ wallets: [...builtIn, {
  id: "acme", name: "Acme", integration: "injected", icon: "data:...",
  injected: {
    detect: () => Boolean((window as any).acme?.tron),
    connect: async () => {
      const [address] = await (window as any).acme.tron.request({ method: "tron_requestAccounts" });
      return { address };
    },
  }
}]});
```

No kit edit, no PR. Quirky third-party wallets express their quirks in their own `connect`.

---

## Migration (incremental, keep working)

1. Add `InjectedStrategy`, `InjectedConnectContext`, `InjectedHelpers`, and `standardInjected()`. Implement `helpers` by wrapping existing `acquireInjectedAddress` / `requestInjectedAddress` / `getInjectedTronProvider` / `resolveInjectedNetwork`.
2. Convert `createInjectedTronAdapter` to call the strategy. Provide a compatibility shim that maps the OLD `InjectedTronAdapterConfig` (flags) to a `standardInjected(...)` strategy so nothing breaks during migration.
3. Move each wallet's `getX`/`hasXMarker`/quirk from `detect.ts` into its `entries/<id>.ts` as a strategy, one wallet at a time, QA each (detect badge + first connect + reconnect + sign).
4. Once all wallets are migrated, delete the per-quirk flags from `InjectedTronAdapterConfig` and the per-wallet functions from `detect.ts`.
5. Final `detect.ts` = generic utilities + `standardInjected` only.

Do this after the current wallet bugs (Gate/SafePal) are settled; run `pnpm --filter @tron-wallet-kit/client typecheck && pnpm test` after each wallet is moved.

---

## Constraints

- `detect()` is cheap and side-effect-free; never triggers `request()` or a dynamic import.
- Each wallet is self-contained: detect + connect + sign live in one place (its entry).
- The generic injected adapter has ZERO per-wallet branching.
- Builtin and runtime third-party wallets use the exact same `injected: InjectedStrategy` shape.
- Keep backward compatibility during migration via the old-config -> `standardInjected` shim.

---

## Code organization: composition over inheritance

Entries are **plain descriptor objects, never subclasses**. Share behavior with a factory + composable decorators, not an abstract base class.

Why composition (not `entries extends BaseWallet`):

- **Open to third-party runtime plugins.** A plain object can be passed into `createWalletKit({ wallets: [...] })`. Inheritance would force third parties to import and extend a kit-internal class (heavy coupling + kit-version lock-in).
- **Quirks are orthogonal.** SafePal needs slow-address + sign-mode; Gate needs prefer-injected + eth-request. Single inheritance forces one linear chain; composition stacks unrelated quirks cleanly.
- **No fragile base class.** Changing a base class breaks every subclass — exactly the "change wallet A, break wallet B" we want to avoid. Decorators isolate each wallet.

Building blocks:

```ts
// Base strategy (composition, not inheritance).
export function standardInjected(opts: {
  providerPaths?: string[];
  provider?: () => InjectedTronProvider | undefined;   // composer for split request/tronWeb (SafePal)
  marker?: () => boolean;                              // custom install detection
  requestMethods?: string[];
}): InjectedStrategy;

// Decorators: (strategy) => strategy. PURE — return a new object, never mutate the input.
export const withEthRequest = (s: InjectedStrategy): InjectedStrategy => ...;             // use eth_requestAccounts
export const withPreferInjectedAddress = (s: InjectedStrategy): InjectedStrategy => ...;  // read defaultAddress first, skip request() (Gate)
export const withSignMode = (s: InjectedStrategy, mode: "signMessageV2" | "sign" | "request"): InjectedStrategy => ...;
export const withAddressPoll = (s: InjectedStrategy, ms: number): InjectedStrategy => ...;  // tune late-address window (acquireAddress polls by default)
export const withMarker = (s: InjectedStrategy, detect: () => boolean): InjectedStrategy => ...;
export const withEvents = (s: InjectedStrategy, names: { accountsChanged?: string; chainChanged?: string; disconnect?: string }): InjectedStrategy => ...;
```

Entries compose only what they need:

```ts
export const okx = { id: "okx", ..., injected: standardInjected({ providerPaths: ["okxwallet.tronLink"] }) };

export const gate = { id: "gate", ..., injected:
  withPreferInjectedAddress(withEthRequest(standardInjected({ providerPaths: ["gatewallet.tron","gatewallet.tronLink"], marker: hasGateMarker }))) };

export const safepal = { id: "safepal", ..., injected:
  withSignMode(standardInjected({ provider: safePalComposer }), "sign") };
```

An OOP base **class** is allowed ONLY internally at the adapter/state-machine layer (`createInjectedTronAdapter`, e.g. a `readyState`/`state` machine like tronweb3). It is never something entries extend or import.

---

## Contributing a wallet via GitHub (third party)

Two supported paths. Both use the identical `WalletDescriptor` + `InjectedStrategy` shape, so a Path B package can later be upstreamed as a Path A PR unchanged.

### Path A — PR into the kit repo (ship as a built-in)

For popular wallets that should be available to all apps by default.

1. Fork the repo.
2. Add `packages/client/src/wallets/entries/<id>.ts` — one descriptor whose strategy composes `standardInjected` + decorators. **All quirks (detect + connect + sign) live in this one file.**
3. Add `packages/client/src/wallets/icons/<id>.svg` (filename == `id`).
4. Add one import + one array element in `packages/client/src/wallets/registry.ts`.
5. Complete the PR template checklist: HTTPS QA (installed badge, first connect, reconnect, `signMessage`, `signTransaction`), recorded provider path, and **no edits outside your entry file** (no `detect.ts` / generic-adapter changes).

CI validates: `id` unique; `id == filename == icon name`; descriptor passes a zod schema; `detect()` performs no `request()`/dynamic import; typecheck + tests pass.

Hard rule for reviewers: a new wallet must NOT touch `detect.ts` or the generic adapter. If quirks appear in shared files, ask the contributor to move them into `entries/<id>.ts`. This is what keeps the kit from bloating.

### Path B — External package (contributor-owned, no kit change)

For niche/proprietary wallets, or when the contributor wants to control release cadence.

Publish a tiny package on GitHub/npm (e.g. `@acme/twk-tron-wallet`) that exports a descriptor:

```ts
import type { WalletDescriptor } from "@tron-wallet-kit/client"; // type-only dev/peer dep

export const acme: WalletDescriptor = {
  id: "acme",
  name: "Acme Wallet",
  integration: "injected",
  icon: "data:image/svg+xml;base64,...",   // inline; no repo icon file needed
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

Apps opt in at runtime — no kit fork, no PR:

```ts
import { createWalletKit } from "@tron-wallet-kit/client";
import { acme } from "@acme/twk-tron-wallet";

createWalletKit({ wallets: ["tronlink", "okx", acme] });
```

The package depends on `@tron-wallet-kit/client` only for the `WalletDescriptor` type (dev/peer, no runtime coupling). The icon travels inline via `descriptor.icon`. This is the most open path.

### Which path?

- Popular wallet, wants default visibility in every app -> **Path A** (PR, becomes built-in).
- Niche/proprietary, or wants its own release cadence -> **Path B** (external package, app opts in).

---

## Detect + Connect matrix (per-wallet)

This is the concrete per-wallet data for the `detect()` / `connect()` split above. Status: **[live]** = verified in a real browser during Gate/SafePal debugging; **[QA]** = best-known, confirm live on HTTPS before shipping.

### The namespace collision problem

TronLink set the de-facto standard: a wallet injects `window.tronLink`, `window.tron`, `window.tronWeb`. Many wallets copy this, so several installed wallets **overwrite each other's** shared objects. Detecting "TronLink" by `window.tronLink` alone is unreliable when OKX/TokenPocket/Bitget/Gate are also installed.

Rule: **each wallet's `detect()` keys on its OWN unique marker; TronLink is evaluated LAST as the generic fallback.** Never let two wallets claim the same provider.

### Detection precedence (apply in this order)

1. **6963 announcement (authoritative — verified live).** Wallets announce a provider with `info.rdns` via a 6963 request/announce handshake. **Two channels exist and BOTH must be probed** (verified live 2026-07-13):
   - `eip6963:announceProvider` (lowercase, the EVM/EIP standard) → most multichain wallets: `io.gate.wallet`, `com.okex.wallet`, `com.bitget.web3`, `so.onekey.app.wallet`, `com.trustwallet.app`, `com.binance.wallet`, `com.bybit`, `app.backpack`, `com.guarda.wallet`, `io.metamask`, `io.klever`, `com.safepal`, tokenpocket. **TronLink is NOT on this channel.**
   - `TIP6963:announceProvider` (**uppercase**, the TRON TIP-6963 channel) → **this is where TronLink announces**, with `info.rdns === "org.tronlink.www"`, `info.name === "TronLink"`, `provider.isTronLink === true`. (Earlier notes that put `org.tronlink.www` on the lowercase `eip6963` channel were wrong — corrected here.)

   So the detect layer must **dispatch both `eip6963:requestProvider` and `TIP6963:requestProvider`, and listen on both `eip6963:announceProvider` and `TIP6963:announceProvider`**, then merge results by rdns. This 6963 rdns is immune to the bare-global write race below; use it to know *which* wallet is installed, then use that wallet's private namespace for CONNECT.
2. **Unique namespace global.** `window.okxwallet`, `window.gatewallet`, `window.SafePalHook`, `window.bitkeep`, `window.foxwallet`, `window.$onekey`, `window.backpack`, `window.coin98`, `window.tokenpocket`, `window.imToken`, `window.trustwallet`, `window.binancew3w` — these do not collide.
3. **Branded flag on the shared object.** `isTokenPocket`, `isTrust`, `isImToken`, `isMathWallet`, `isBitKeep`, `isGateWallet` on `window.tronLink`/`window.tronWeb`.
4. **TronLink = generic `tronLink` with NO brand flag.** `window.tronLink?.isTronLink === true` (or `window.tron?.isTronLink`) AND none of the branded flags from (2)/(3).

`detect()` stays cheap (globals/flags + optional short TIP-6963 listen). No `request()`, no dynamic import.

### Per-wallet matrix

| Wallet | detect marker | connect provider (request + tronWeb) | requestMethods | quirks | status |
|---|---|---|---|---|---|
| **TronLink** | **EIP-6963 `org.tronlink.www`** (authoritative); else `window.tronLink?.isTronLink` AND **no other brand flag** (`!isOneKey && !isBitKeep && ...`) | `window.tronLink` (RWs2) **only if not owned by another wallet** | `tron_requestAccounts` | **contested global** — see race note below; prefer EIP-6963 | [live⚠] |
| **MetaMask** | `window.ethereum.isMetaMask` AND EIP-6963 `io.metamask`; **but NO TRON provider injected** (`ethereum.tron` absent) | none injected | — | **NOT injected-TRON** -> use `@tronweb3/tronwallet-adapter-metamask-tron` via **bridge** (optional peer). Never treat as injected. | [live✓] |
| **OKX** | `window.okxwallet` (`isOkxWallet`/`isOKExWallet`) | `window.okxwallet.tronLink` (RWs2) | `tron_requestAccounts` | standard; `signMessageV2` | [live✓] |
| **Gate** | `window.gatewallet` (`isGateWallet`) | `window.gatewallet.tron` (RWs2) | **`eth_requestAccounts`** | **prefer injected address** (request hangs when already exposed); **HTTPS-only injection** | [live✓] |
| **SafePal** | `window.SafePalHook` | `window.SafePalHook` itself (has `request` + `tronWeb` + `defaultAddress`) | `tron_requestAccounts` | **address async -> poll**; signMode **`sign`** | [live✓] |
| **OneKey** | `window.$onekey` | `window.$onekey.tron` (RWs2) — NOT `.tronLink` (absent) | `tron_requestAccounts` | standard | [live✓] |
| **TokenPocket** | `window.tokenpocket` | `window.tokenpocket.tron` (RWs2) | `tron_requestAccounts` | standard | [live✓] |
| **Bitget** | `window.isBitKeep` OR `window.bitkeep` (also `window.bitgetWallet`) | **`window.bitkeep` root** (RWs2) — its `.tron`/`.tronLink` have `request` but **no `tronWeb`** | `tron_requestAccounts` | tronWeb is on the root, not the `.tron` branch | [live✓] |
| **Backpack** | `window.backpack` (`isBackpack`) | `window.backpack.tron` has `request` but **no `tronWeb`** -> address from request result / composer with `window.tronWeb` | `tron_requestAccounts` | **needs QA**: no tronWeb on `.tron`; verify sign path | [live⚠] |
| **Trust** | EIP-6963 `com.trustwallet.app` announces **EVM-only** (`hasTron:false, hasTronWeb:false`); `window.trustwallet` keys = `[isTrust, isTrustWallet, isMetaMask, ton, cosmos, solana, bitcoin, request…]` — **no `.tron` branch** | none in the extension | — | **Desktop extension: NO injected TRON → use WalletConnect.** `window.trustwallet.tron` does **not** exist (verified live 2026-07-13). Trust injects TRON only in its **mobile in-app browser** (TronLink-compatible `window.tron`), never the extension. | [live✓] |
| **Binance Web3** | `window.binancew3w` | **NO request/tronWeb found at `binancew3w` or `.tron`** | — | **No injected TRON provider at expected paths** -> likely NOT injected-TRON (WC-only?). Do NOT show INSTALLED for TRON connect. | [live⚠] |
| **FoxWallet** | `window.foxwallet` | `window.foxwallet.tronLink` ?? `.tron` | `tron_requestAccounts` | not installed on test machine | [QA] |
| **imToken** | `window.imToken` OR `window.tronWeb?.isImToken` | `window.tronLink` | `tron_requestAccounts` | not installed on test machine | [QA] |
| **MathWallet** | `window.tronWeb?.isMathWallet` (or Math-specific global) — **NOT bare `window.tronLink`** | `window.tronLink` / `window.tron` | `tron_requestAccounts` | **collides with TronLink**; not installed on test machine | [QA-critical] |
| **Coin98** | `window.coin98` | `window.coin98.tron` (composer if request/tronWeb split) | `tron_requestAccounts` / `eth_requestAccounts` | not installed on test machine | [QA] |

Legend of the branch codes gathered live: **R**=`request`, **W**=`tronWeb`, **s**=`trx.sign`, **2**=`signMessageV2`. `RWs2` = full provider. Verified on 2026-07-08 with OKX, Gate, SafePal, Bitget, OneKey, TokenPocket, Trust, Backpack, Binance Web3 installed.

**Key live corrections (this is exactly the "installed but connect fails" mismatch):**

- **Bitget**: use `window.bitkeep` **root** (RWs2); `bitkeep.tron`/`.tronLink` only carry `request` (no `tronWeb`). The old path `bitkeep.tronLink` alone would lack `tronWeb`.
- **Backpack**: `backpack.tron` has `request` but **no `tronWeb`** — the address must come from the request result (or a composer using `window.tronWeb`); the sign path needs QA.
- **Trust**: **the desktop extension injects NO TRON provider** (verified live 2026-07-13). `window.trustwallet` exposes `request` + `isTrust`/`isTrustWallet`/`isMetaMask` and sub-providers `ton`/`cosmos`/`solana`/`bitcoin` — but **no `tron`**, and its EIP-6963 provider (`com.trustwallet.app`) reports `hasTron:false, hasTronWeb:false`. `window.trustwallet.tron` does not exist. The `window.tron` seen on the test machine (with an address) is **TokenPocket's** (`isTokenPocket:true`), not Trust. → In the kit, **Trust must resolve to WalletConnect** on desktop. The `window.trustwallet.tron` path referenced elsewhere is Trust's **mobile in-app browser** API (mobile injects a TronLink-compatible `window.tron`); do not rely on it for the extension. If Trust ships an extension TRON provider in a future version, re-run the live snippet and only then add an injected path.
- **Binance Web3**: `window.binancew3w` exists (so a naive marker => INSTALLED) but there is **NO TRON request/tronWeb** at the expected paths. If the kit marks Binance INSTALLED off the namespace, connect will fail. `detect()` for Binance must require an actual TRON provider, not just the namespace.
- **SafePal**: `window.SafePalHook` itself now carries `request` + `tronWeb` + `defaultAddress` — can use `SafePalHook` directly (composer with `window.tronWeb` still a safe fallback).

**Lesson reinforced:** `detect()` must confirm a **usable TRON provider** (a branch with `request` and reachable `tronWeb`/address), not merely that the namespace object exists. Binance/Trust prove that "namespace present" != "TRON connectable".

### The bare-global write race (root cause of flaky detection) — verified live

On the test machine with 15 wallets installed, `window.tronLink` currently reports **both `isTronLink: true` AND `isOneKey: true`** (version `2.2.71` = OneKey's). So **OneKey overwrote `window.tronLink` and kept `isTronLink: true` for compatibility** — real TronLink lost the write race. `window.tron` carries no identifying flag; `window.tronWeb` is generic (trongrid).

Consequence: whichever wallet's content script runs last owns `window.tronLink`/`tron`/`tronWeb`. Detecting or connecting TronLink off the bare global is **non-deterministic per page load** — this is the "chậm chờn" (flaky/slow) behavior. Multiple wallets also stamp `isTronLink: true` on their own copies, so `isTronLink` alone does not mean "TronLink".

Fix:

1. **Detect via EIP-6963 rdns** (`org.tronlink.www`) — authoritative, race-free.
2. When falling back to `window.tronLink`, require `isTronLink === true` **AND** the absence of every other brand flag (`!isOneKey && !isBitKeep && !isTokenPocket && ...`). If a brand flag is present, it is that wallet, not TronLink.
3. For CONNECT, wallets with a private namespace use it (never the bare global). TronLink has no private namespace, so it must use the EIP-6963-announced provider or the brand-flag-guarded `window.tronLink`.

### Detection algorithm (avoid double-claim)

```
for each installed candidate, in this order:
  1. announced via EIP-6963 with its rdns      -> that wallet   (authoritative, race-free)
  2. its unique namespace global exists        -> that wallet   (okxwallet, gatewallet, ...)
  3. its brand flag set on tronLink/tronWeb    -> that wallet   (isTokenPocket, isTrust, ...)
TronLink evaluated LAST:
  4. tronLink present AND isTronLink AND NO other brand flag (isOneKey/isBitKeep/...) -> TronLink
```

Since each wallet keys on its own marker, order only matters for the shared `window.tronLink`: any branded wallet claims it first; TronLink only claims a truly-generic `tronLink`. This prevents "OKX installed but TronLink shows installed" and vice-versa.

**MathWallet is the one real risk**: if it overwrites `window.tronLink` with `isTronLink=true` and no Math flag, it is indistinguishable from TronLink — keep it out of the default catalog until a reliable Math marker is confirmed live.

### Worked cases (live QA — acceptance criteria)

Two reported bugs, both explained by the two rules above (EIP-6963 detect + require a usable provider), plus a third rule: **detect result must be stable, computed once and cached — not recomputed and flapping across renders.**

- **"TronLink shows not installed" (flaky).** Live: `window.tronLink` is owned by OneKey (flags `isTronLink` + `isOneKey`, version 2.2.71). But EIP-6963 announces `org.tronlink.www` (a `request`-capable provider; no `.tron`/`.tronWeb` on it). Fix: **detect TronLink via EIP-6963 `org.tronlink.www`** (installed regardless of who owns the bare global); **connect** via that provider's `request` + `window.tronWeb`. Acceptance: with OneKey + TronLink both installed, TronLink shows INSTALLED on every reload.
- **"Trust flips between QR CODE and INSTALLED".** Live (verified 2026-07-13): the Trust **extension** exposes **no TRON provider anywhere** — `window.trustwallet` has `request` + EVM/`ton`/`cosmos`/`solana`/`bitcoin` but **no `tron`**, its EIP-6963 provider reports `hasTron:false, hasTronWeb:false`, and there is no Trust-owned `window.tron`/`tronWeb` (the `window.tron` with an address belongs to TokenPocket). The flip comes from a `walletConnectFallback` catalog entry whose async injected probe races: namespace-present (`window.trustwallet`) → "INSTALLED", provider-resolves-unusable → WC fallback "QR CODE". Two fixes, both needed: (1) Trust's `detect()` must require a **usable TRON provider** — the mere presence of `window.trustwallet` is not enough — so it deterministically falls to WC; (2) the detect result must be **computed once per session and cached** so it cannot flap. Acceptance: Trust shows a stable **QR CODE** (WalletConnect) badge on the desktop extension, never flipping. (Mobile in-app browser, where Trust injects `window.tron`, would satisfy the usable-provider check and show INSTALLED — same rule, different environment.)

Rule of thumb these two prove: **`detect()` must (a) key on EIP-6963 rdns / a usable-provider check, and (b) be computed once per session and cached.** A badge must never change between renders for the same wallet + same environment.

### Quirky connect notes (expressed as decorators)

```ts
gate    = withPreferInjectedAddress(withEthRequest(standardInjected({ marker: hasGateMarker, providerPaths: ["gatewallet.tron"] })))
safepal = withSignMode(standardInjected({ marker: () => !!window.SafePalHook, provider: safePalComposer }), "sign")
bitget  = standardInjected({ marker: () => !!(window as any).isBitKeep, providerPaths: ["bitkeep.tronLink","tronLink"] })
// Trust: desktop extension has NO injected TRON → WalletConnect. (Mobile in-app browser injects
// window.tron; a usable-provider detect handles both environments with one rule.)
trust   = { integration: "walletconnect" /* + optional injected detect on window.tron for mobile */ }
```

- **Gate**: read `gatewallet.tron.tronWeb.defaultAddress.base58` first; if empty, fire `eth_requestAccounts` and poll `defaultAddress` (its `request` promise can hang). HTTPS only.
- **SafePal**: fire `SafePalHook.request({method:'tron_requestAccounts'})`, then poll `SafePalHook.defaultAddress.base58` / `window.tronWeb.defaultAddress.base58`; sign via `tronWeb.trx.sign` (mode `sign`).
- **Bitget**: standard on `bitkeep.tronLink`; address can lag -> shared `acquireAddress` poll covers it.
- **Trust**: **desktop extension → WalletConnect** (no injected TRON; verified live). `detect()` for an injected Trust path must require a **usable TRON provider** (`isUsableTronProvider(window.tron)` with an `isTrust`/`com.trustwallet.app` attribution), which is only satisfied in Trust's **mobile in-app browser**. On the desktop extension that check fails → the kit shows WalletConnect. Do **not** point Trust at `window.trustwallet.tron` (it does not exist). `isUsableTronProvider = (p) => !!(p && typeof p.request === "function" && (p.tronWeb || p.defaultAddress))`.

### Live verification snippet (run per wallet on HTTPS)

```js
const g = window;
({
  okxwallet: typeof g.okxwallet, gatewallet: typeof g.gatewallet, SafePalHook: typeof g.SafePalHook,
  bitkeep: typeof g.bitkeep, isBitKeep: !!g.isBitKeep, foxwallet: typeof g.foxwallet,
  $onekey: typeof g.$onekey, backpack: typeof g.backpack, coin98: typeof g.coin98,
  tokenpocket: typeof g.tokenpocket, imToken: typeof g.imToken, trustwallet: typeof g.trustwallet, binancew3w: typeof g.binancew3w,
  tronLink: !!g.tronLink, tronLink_isTronLink: g.tronLink?.isTronLink,
  tronWeb_flags: { isTokenPocket: g.tronWeb?.isTokenPocket, isTrust: g.tronWeb?.isTrust, isImToken: g.tronWeb?.isImToken, isMathWallet: g.tronWeb?.isMathWallet },
  addr: g.tronWeb?.defaultAddress?.base58,
})
```

Record the result into the wallet's `entries/<id>.ts` marker + provider path. Never ship a marker that has not shown up in this snippet on a real install. Fill the `[QA]` rows this way before enabling those wallets.

---

## First-connect returns no address (Bitget, SafePal) — connect fix

**Symptom (reported):** on Bitget and SafePal the **first** connect returns no address — the modal
spins, then fails with `"<wallet> did not return an address."`. Closing and clicking Connect a
**second** time works. Wallets that already expose the address (reconnect) always work.

This belongs to the CONNECT layer (it does not affect the INSTALLED badge). It is the concrete
tuning for the shared `acquireAddress` helper referenced above.

### Root cause

On a first-time connect these wallets populate `tronWeb.defaultAddress` **a moment AFTER**
`request()` resolves — the approval promise settles, then the address lands asynchronously
(SafePal on `window.tronWeb.defaultAddress`, Bitget on `bitkeep.tronWeb.defaultAddress`). The
address-acquisition loop gives up before that async write happens.

In `packages/client/src/adapters/injected.ts` → `acquireInjectedAddress`, once `request()` settles
**without** an address the loop enters an early-break branch and only keeps polling `readLive()`
for `addressSettleMs` (default `DEFAULT_ADDRESS_SETTLE_MS = 700ms`) before breaking:

```ts
if (requestSettled && !requestedAddress) {
  const grace = readLive();
  if (grace) return eventWatcher.close(grace);
  if (Date.now() - requestSettledAt >= (config.addressSettleMs ?? DEFAULT_ADDRESS_SETTLE_MS)) break;
}
```

Why each wallet fails on the first attempt:

- **SafePal** — has **no** `addressSettleMs` (→ 700ms) and **no** `emptyAddressRetry*`, so
  `retryEmptyAddressRequest` returns `undefined` immediately. First-time approval → address arrives
  later than 700ms after settle → loop breaks → no retry → `"SafePal did not return an address."`
  **This is the exact failure.**
- **Bitget** — `requestMethods: ["eth_requestAccounts", "tron_requestAccounts"]` fires the **EVM**
  method first, which pops the wrong (EVM) approval on the dual-chain `bitkeep` provider and can
  return a `0x…` EVM address that is then accepted as the account. Even falling through to
  `tron_requestAccounts`, the same async-address gap applies and `addressSettleMs: 1800` is still
  tighter than a real first-time approval round-trip.

### Fix (three changes, `packages/client` only)

1. **Widen the post-settle poll window** — `adapters/injected.ts`:
   `const DEFAULT_ADDRESS_SETTLE_MS = 2500;` (was `700`). This is a **ceiling, not a fixed wait** —
   `readLive()` still resolves the instant the address appears, so reconnects stay instant; wallets
   that genuinely return nothing still bail within the window.

2. **Reject non-TRON addresses** — `adapters/injected.ts`. TRON base58 addresses always start with
   `T` (0x41 prefix) and are 34 chars; reject anything else so a stray EVM `0x…` (Bitget when `eth_`
   is tried first) can never be accepted:

   ```ts
   const TRON_ADDRESS_PATTERN = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
   function isTronAddress(value: unknown): value is string {
     return typeof value === "string" && TRON_ADDRESS_PATTERN.test(value);
   }
   ```

   Apply it (a) where the background request result is captured
   (`.then((address) => { if (isTronAddress(address)) requestedAddress = address; })`) and (b) at the
   end of `readLive()` (`return isTronAddress(address) ? address : undefined;`).

3. **Per-wallet entry tweaks:**
   - `wallets/entries/bitget.ts`: `requestMethods: ["tron_requestAccounts", "eth_requestAccounts"]`
     (TRON first — its injected provider is TronLink-compatible; `eth_` stays as last-resort
     fallback and any `0x` it returns is filtered out), `addressSettleMs: 2500` (was `1800`).
   - `wallets/entries/safepal.ts`: add `addressSettleMs: 2500`, `emptyAddressRetryDelayMs: 300`,
     `emptyAddressRetryTimeoutMs: 3000`.

   All three fields already exist on `InjectedWalletDescriptor` (`wallets/types.ts`) and are threaded
   through `wallets/build-adapters.ts` — no type/plumbing changes needed.

> When the detect/connect refactor above lands, this same tuning lives inside each wallet's
> `connect` strategy (SafePal's late-address poll, Bitget's TRON-first + address filter) via the
> shared `acquireAddress` helper — not as flags on a generic adapter.

### Why safe

- Gate is unaffected: it uses `preferInjectedAddress` (immediate read) and its `request()` never
  settles, so the settle-branch never runs.
- The TRON-address filter only rejects clearly-wrong `0x…` values; every real `T…` address passes.

### Acceptance checks

Run on Windows: `npm.cmd run typecheck && npm.cmd test && npm.cmd run build`. Then on the HTTPS
example page, with each extension freshly **un-authorized** (true first connect):

1. **SafePal** — first Connect returns a `T…` address, modal closes, no reconnect.
2. **Bitget** — first Connect pops the **TRON** approval (not EVM), returns a `T…` address (never
   `0x…`), modal closes.
3. **Reconnect** both — still instant. **Gate** — unchanged.

---

## Implementation status (audited against current code — 2026-07-13)

Snapshot of how much of this spec has landed in code, so the coder can see what's left. Legend:
✅ done & correct · 🟡 partial / cleanup owed · ❌ not started.

### ✅ Done & correct

- **Detect/connect separation via `InjectedStrategy`** — `packages/client/src/adapters/injected-strategy.ts`
  implements `InjectedStrategy` (detect/connect/signMessage/signTransaction/subscribe), the
  `standardInjected` factory, `InjectedHelpers` (getProvider / readDefaultAddress / acquireAddress /
  resolveNetwork), and a backward-compat shim `strategyFromLegacyConfig`. Matches the "New descriptor
  shape" + "Standard strategy" sections.
- **Thin generic adapter** — `adapters/injected.ts` now resolves `config.strategy ?? strategyFromLegacyConfig(config)`
  and delegates connect/sign to the strategy. No per-quirk branching in the adapter. Matches
  "Generic adapter becomes a thin orchestrator".
- **First-connect fix (Bitget/SafePal)** — baked into `injected-strategy.ts`:
  `DEFAULT_ADDRESS_SETTLE_MS = 2500`, `isTronAddress` filter applied to the request result, `readLive`,
  the empty-address retry, and the account-change event payload. Bitget entry uses
  `["tron_requestAccounts","eth_requestAccounts"]` + settle/retry; SafePal has settle/retry +
  `signMessageMode:"sign"`. Matches the first-connect section.
- **Per-wallet self-containment** — provider getters moved out of the shared `injected/detect.ts` into
  each entry (`entries/bitget.ts`, `safepal.ts`, `trust.ts`, …); `detect.ts` keeps only shared
  utilities. Matches "quirk isolated in the wallet's own file".
- **Integration boundary** — MetaMask (`entries/metamask.ts`) and Ledger (`entries/ledger.ts`) are
  `integration:"tronweb3-bridge"` with lazy `import()` of the `@tronweb3/…` adapters. WalletConnect is
  the kit's **own lite package** (`packages/adapters/walletconnect`) whose only dep is
  `@walletconnect/sign-client` — **no `@reown/appkit`, no ethers**. Exactly matches the "Integration
  boundary" table.
- **Trust → usable-provider guard** — `entries/trust.ts` `asUsableTrustProvider` requires `request` or
  `tronWeb.trx`; on the desktop extension it returns `undefined` → detect false → WalletConnect
  (`supportsWalletConnect:true`). Behaviour matches the Trust decision.
- **TronLink priority (ranking)** — `entries/tronlink.ts` has `featured:1`, `group:"featured"`.

### ❌ Not started — the two items tied to the live TronLink flakiness

- **TronLink "checking → not installed" bug is NOT fixed.** The refactor is injected-layer only.
  TronLink is `integration:"custom"` → the `@tron-wallet-kit/adapter-tronlink` package, whose
  synchronous `detect()` still loses the bare-global write race, and `ui/src/modal.ts` still uses
  `adapter.detect ?? adapter.isAvailable` (prefers the race-losing sync path). Apply the fix in the
  "BUG: TronLink badge stuck" section (cache a one-shot 6963 probe; `detect()` returns true from the
  cache; probe both 6963 channels; don't pass a custom `provider` resolver that disables discovery).
- **6963 detection not unified.** Injected `detect` is still marker / bare-global only — no
  `eip6963:*` + `TIP6963:*` rdns probe. Contested-namespace wallets (and TronLink) are therefore not
  race-proof. Implement the dual-channel 6963 probe from "Detection precedence §1" as the shared,
  cached primary detect for every wallet.

### 🟡 Cleanup owed (migration half-finished — spec step 4)

- **Duplicated quirk declarations.** Every injected entry declares its quirks **twice**: once inside
  `injected: standardInjected({…})` and again as legacy flat fields on the descriptor
  (`requestMethods`, `addressSettleMs`, `emptyAddressRetry*`, `preferInjectedAddress`, plus a separate
  `detect:{…}`). Because the adapter uses `config.strategy ?? legacy`, the flat fields are dead when
  `injected` is present. Finish migration step 4: **drop the flat per-quirk fields**, keep the single
  `injected` strategy as the source of truth. Keep only `detect.providerPaths` (still read at
  connect-time for the `readLive` fallback in `createInjectedContext`). Trim `toInjectedConfig` in
  `build-adapters.ts` accordingly.
- **Trust `providerPaths` inaccurate.** `entries/trust.ts` lists `["trustwallet.tronLink","trustwallet.tron"]`,
  which do **not** exist (verified live). Harmless thanks to the usable-provider guard, but misleading —
  drop them and let Trust resolve to WalletConnect on desktop.

### Suggested order

1. TronLink badge fix + dual-channel 6963 detect (fixes the visible flakiness).
2. Finish migration step 4 (remove duplicated flat flags) once wallets are verified on the strategy path.
3. Tidy Trust `providerPaths`.

### Addendum - current status after follow-up implementation

This addendum supersedes the stale "TronLink checking -> not installed bug is NOT fixed" note above.

#### Newly done

- **TronLink badge flakiness is now addressed in code.**
  - `packages/adapters/tronlink/src/index.ts` starts and caches a one-shot 6963 discovery.
  - TronLink discovery listens and dispatches both `TIP6963:*` and lowercase `eip6963:*`.
  - `detect()` returns true when the cached `org.tronlink.www` provider exists, so it no longer depends only on contested bare globals.
  - `waitForProvider()` can use the cached 6963 provider, and the adapter can connect with `globalThis.tronWeb` when the announced provider does not expose embedded `tronWeb`.
  - `packages/ui/src/modal.ts` now has a bounded first-render async fallback to `isAvailable()` when fast `detect()` returns false.
  - Regression coverage exists in `packages/adapters/tronlink/test/tronlink.test.ts`.
- **Backpack request/tronWeb split is covered.**
  - `packages/client/src/wallets/entries/backpack.ts` now owns a Backpack-specific provider resolver.
  - The resolver composes `backpack.tron` / `backpack.tronLink` with `globalThis.tronWeb` when the branch exposes `request` but omits `tronWeb`.
  - Regression coverage exists in `packages/client/test/client.test.ts`.
- **Trust and Binance namespace-only protection remains correct.**
  - Trust requires a usable TRON provider and therefore resolves to WalletConnect on desktop extension when no TRON branch exists.
  - Binance requires the TRON account API and is not marked installed from `window.binancew3w` alone.
- **Trust desktop `providerPaths` cleanup is done.**
  - `entries/trust.ts` no longer advertises non-existent desktop paths `trustwallet.tronLink` / `trustwallet.tron`.
  - Trust keeps `supportsWalletConnect:true` and `conflictMarkers:["trustwallet"]`; its injected detect remains provider-based only.
- **Built-in duplicate flat quirk fields are reduced.**
  - Bitget, Gate, SafePal, and MathWallet now keep request/settle/sign quirks inside `injected: standardInjected({ ... })`.
  - Their dead flat descriptor duplicates (`requestMethods`, `addressSettleMs`, `emptyAddressRetry*`, `preferInjectedAddress`, `signMessageMode`) were removed from the built-in entries.
  - The legacy fields and `strategyFromLegacyConfig` still exist in the public/internal types for backward compatibility with non-migrated/custom paths.

#### Still open

- **Shared 6963 registry is still not implemented for every wallet.** TronLink has focused race-proof 6963 handling; the generic injected layer still mostly relies on wallet-local markers / provider resolvers.
- **Migration cleanup is still partially owed.** Built-in entry-level duplicate flat quirk declarations are reduced, but `InjectedTronAdapterConfig`, `InjectedWalletDescriptor` legacy fields, `strategyFromLegacyConfig`, and `toInjectedConfig` compatibility plumbing still remain until the public migration policy is decided.
- **Decorator helpers are not extracted yet.** Behaviors are currently expressed through `standardInjected()` options and wallet-local resolvers rather than public composable helpers such as `withEthRequest`, `withPreferInjectedAddress`, and `withAddressPoll`.
- **MathWallet remains QA-critical.** It is marker-gated and does not claim generic `tronLink`, but it still needs live extension QA before being promoted in any recommended/default featured list.

#### Connect-correctness risks found live (2026-07-13)

Two connect-path issues verified in a real browser with several TRON wallets installed (OneKey owns
`window.tronLink`; another wallet owns `window.tronWeb`). Both are separate from the now-fixed badge
detection — the badge can read INSTALLED while connect still fails or binds the wrong wallet's data.

1. **SafePal — connect fails with "Connection failed" even after the popup is approved, when another
   wallet owns `window.tronWeb`.** ROOT CAUSE (verified live): `getSafePalInjectedProvider`
   (`packages/client/src/wallets/entries/safepal.ts`) builds the provider's `tronWeb` from the
   **global** `window.tronWeb`, and `createSafePalTronWeb` computes
   `defaultAddress = window.tronWeb.defaultAddress ?? hook.defaultAddress`. On a multi-wallet machine
   `window.tronWeb.defaultAddress` is a **truthy but empty** object (`{hex:false, base58:false}`), so
   `??` **never** falls back to `hook.defaultAddress`. SafePal writes the connected address to its OWN
   objects — `SafePalHook.defaultAddress` / `SafePalHook.tronWeb.defaultAddress` (live-confirmed
   `SafePalHook.tronWeb !== window.tronWeb`) — so the provider keeps polling the wrong, permanently
   empty tronWeb; `acquireAddress` times out → `CONNECTION_FAILED "did not return an address"` → UI
   "The wallet connection failed. Try again." This is exactly the reported symptom: SafePal's popup
   appears, approval succeeds, connect still fails.
   FIX: source SafePal's `tronWeb` + address from **SafePalHook itself**: prefer `SafePalHook.tronWeb`
   over `window.tronWeb`, and select the `defaultAddress` whose `base58` is a **non-empty string**
   (never `??` on a truthy-empty object). Concretely `getSafePalInjectedProvider` should use
   `hook.tronWeb ?? window.tronWeb`, and resolve the address as the first valid `T…` among
   [`hook.defaultAddress.base58`, `hook.tronWeb.defaultAddress.base58`, the `request` result].

2. **TronLink (6963 `tip1193`) — hex/network, and the address in an edge case, can come from a foreign
   wallet's `window.tronWeb`.** The 6963-announced TronLink provider carries **no embedded `tronWeb`**
   (live: `hasTronWeb:false`); `getProviderTronWeb` (`packages/adapters/tronlink/src/index.ts`) falls
   back to `globalThis.tronWeb`, which on a multi-wallet machine is owned by another wallet (e.g.
   TokenPocket, address `TT9w…`). Consequences: `hexAddress = tronWeb.defaultAddress.hex` is the
   foreign wallet's hex (mismatched with TronLink's base58); `resolveNetwork` reads the foreign
   tronWeb; and if `eth_requestAccounts` returns empty, `requestAddress` falls back to
   `globalThis.tronWeb.defaultAddress.base58` = the foreign address. The base58 address is normally
   correct (from TronLink's own `request`), but the hex/network binding is not.
   FIX: for a `tip1193` TronLink provider without embedded `tronWeb`, do **not** use `globalThis.tronWeb`
   when that global is owned by another wallet (`isKnownNonTronLinkProvider` / brand flag). Take the
   address strictly from TronLink's `request` result; derive `tronWeb`/hex/network only from a
   TronLink-owned tronWeb, otherwise omit `hexAddress` and resolve the network via a neutral RPC.

#### Updated suggested order

1. Decide whether to keep or break backward compatibility for legacy flat injected config fields.
2. Extract decorator helpers after registry/flag cleanup.
3. Consider whether TronLink should eventually reuse the shared client 6963 registry or keep its adapter-local 6963 flow.
4. Run live QA for MathWallet before promoting it in any recommended/default featured list.

#### Follow-up implementation status

- **SafePal connect fix is done.**
  - `packages/client/src/wallets/entries/safepal.ts` now prefers `SafePalHook.tronWeb` / `SafePalHook.defaultAddress` over `window.tronWeb`.
  - The default address selection now requires a non-empty `base58`, so a truthy-but-empty foreign global default address does not block the SafePal hook fallback.
  - Regression coverage: `packages/client/test/client.test.ts` verifies SafePal connects and signs when global `tronWeb.defaultAddress` is foreign/empty.
- **TronLink `tip1193` foreign `window.tronWeb` guard is done.**
  - `packages/adapters/tronlink/src/index.ts` no longer falls back to a known foreign global `window.tronWeb` for TIP-1193 address/hex/network.
  - TIP-1193 connect takes the address from the provider request result; if no TronLink-owned tronWeb is available, it omits `hexAddress` and resolves network from explicit fallback/mainnet.
  - Regression coverage: `packages/adapters/tronlink/test/tronlink.test.ts` verifies TokenPocket-owned global tronWeb does not leak hex/network into a TronLink TIP-1193 connection.
- **Shared 6963 installed-signal registry is done for injected strategies.**
  - `packages/client/src/injected/eip6963.ts` dispatches/listens on both `eip6963:*` and `TIP6963:*`, caches announced rdns values, and exposes `hasAnnouncedWalletRdns()`.
  - `standardInjected({ rdns })` checks the cached 6963 signal before marker/provider fallback.
  - RDNs are wired for OKX, Bitget, Gate, SafePal, OneKey, Bybit, Backpack, and Guarda.
  - Trust and Binance intentionally do not use rdns installed signals because their desktop announcements/namespaces are not sufficient proof of an injected TRON provider.
