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

1. **EIP-6963 announcement (authoritative — verified live).** TRON wallets (most are multichain) announce via the standard `eip6963:announceProvider` event with `info.rdns`. Dispatching `eip6963:requestProvider` on the test machine returned **collision-free rdns for all 15 installed wallets**: `org.tronlink.www` (TronLink), `io.gate.wallet`, `com.okex.wallet`, `com.bitget.web3`, `so.onekey.app.wallet`, `com.trustwallet.app`, `com.binance.wallet`, `com.bybit`, `app.backpack`, `com.guarda.wallet`, `io.metamask`, `io.klever`, `com.safepal`/safepal, tokenpocket. (A separate `tip6963` event fired nothing.) **Make EIP-6963 rdns the primary DETECT channel** — it is immune to the bare-global write race below. Use the rdns to know *which* wallet is installed, then use that wallet's private namespace for CONNECT.
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
| **Trust** | `window.trustwallet` (`isTrust`) | **`window.trustwallet` has `request` only — no `tronWeb`, no `.tron`/`.tronLink`** | `tron_requestAccounts` | **weak TRON injection**; may need `window.tronWeb` composer or be WC-only -> verify TRON works at all | [live⚠] |
| **Binance Web3** | `window.binancew3w` | **NO request/tronWeb found at `binancew3w` or `.tron`** | — | **No injected TRON provider at expected paths** -> likely NOT injected-TRON (WC-only?). Do NOT show INSTALLED for TRON connect. | [live⚠] |
| **FoxWallet** | `window.foxwallet` | `window.foxwallet.tronLink` ?? `.tron` | `tron_requestAccounts` | not installed on test machine | [QA] |
| **imToken** | `window.imToken` OR `window.tronWeb?.isImToken` | `window.tronLink` | `tron_requestAccounts` | not installed on test machine | [QA] |
| **MathWallet** | `window.tronWeb?.isMathWallet` (or Math-specific global) — **NOT bare `window.tronLink`** | `window.tronLink` / `window.tron` | `tron_requestAccounts` | **collides with TronLink**; not installed on test machine | [QA-critical] |
| **Coin98** | `window.coin98` | `window.coin98.tron` (composer if request/tronWeb split) | `tron_requestAccounts` / `eth_requestAccounts` | not installed on test machine | [QA] |

Legend of the branch codes gathered live: **R**=`request`, **W**=`tronWeb`, **s**=`trx.sign`, **2**=`signMessageV2`. `RWs2` = full provider. Verified on 2026-07-08 with OKX, Gate, SafePal, Bitget, OneKey, TokenPocket, Trust, Backpack, Binance Web3 installed.

**Key live corrections (this is exactly the "installed but connect fails" mismatch):**

- **Bitget**: use `window.bitkeep` **root** (RWs2); `bitkeep.tron`/`.tronLink` only carry `request` (no `tronWeb`). The old path `bitkeep.tronLink` alone would lack `tronWeb`.
- **Backpack**: `backpack.tron` has `request` but **no `tronWeb`** — the address must come from the request result (or a composer using `window.tronWeb`); the sign path needs QA.
- **Trust**: `window.trustwallet` exposes **only `request`** — no `tronWeb`, no `.tron`/`.tronLink` TRON branch. Trust's TRON injection is minimal; it may be WalletConnect-only. **The kit's current `trustwallet.tronLink`/`.tron` path finds nothing** -> Trust likely shows a broken connect. Verify or move Trust to WC.
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
- **"Trust flips between QR CODE and INSTALLED".** Live: Trust exposes **no TRON provider anywhere** — `window.trustwallet` has `request` only (no `tronWeb`/`.tron`/`.tronLink`), and its EIP-6963 provider reports `providerTron:false, providerTronWeb:false`. The flip comes from a `walletConnectFallback` catalog entry whose async injected probe flaps: namespace-present -> "INSTALLED", provider-resolves-unusable -> WC fallback "QR CODE". Fix: Trust has no injected TRON -> set `integration: "walletconnect"` (or make `detect()` require a usable TRON provider so it deterministically falls to WC). Acceptance: Trust shows a stable **QR CODE** badge, never flipping.

Rule of thumb these two prove: **`detect()` must (a) key on EIP-6963 rdns / a usable-provider check, and (b) be computed once per session and cached.** A badge must never change between renders for the same wallet + same environment.

### Quirky connect notes (expressed as decorators)

```ts
gate    = withPreferInjectedAddress(withEthRequest(standardInjected({ marker: hasGateMarker, providerPaths: ["gatewallet.tron"] })))
safepal = withSignMode(standardInjected({ marker: () => !!window.SafePalHook, provider: safePalComposer }), "sign")
bitget  = standardInjected({ marker: () => !!(window as any).isBitKeep, providerPaths: ["bitkeep.tronLink","tronLink"] })
```

- **Gate**: read `gatewallet.tron.tronWeb.defaultAddress.base58` first; if empty, fire `eth_requestAccounts` and poll `defaultAddress` (its `request` promise can hang). HTTPS only.
- **SafePal**: fire `SafePalHook.request({method:'tron_requestAccounts'})`, then poll `SafePalHook.defaultAddress.base58` / `window.tronWeb.defaultAddress.base58`; sign via `tronWeb.trx.sign` (mode `sign`).
- **Bitget**: standard on `bitkeep.tronLink`; address can lag -> shared `acquireAddress` poll covers it.

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
