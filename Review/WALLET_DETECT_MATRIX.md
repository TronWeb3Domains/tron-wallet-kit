# Wallet Detect + Connect Matrix (TRON injected wallets)

> **MERGED — single source of truth is now `WALLET_ADAPTER_ORG_SPEC.md` -> section "Detect + Connect matrix (per-wallet)".** This standalone file is kept only for history; edit the matrix in `WALLET_ADAPTER_ORG_SPEC.md`.

Companion to `WALLET_ADAPTER_ORG_SPEC.md`. Per-wallet reference for how to **detect** (installed?) and **connect** each injected TRON wallet, and how to disambiguate the shared TRON namespace.

Status legend: **[live]** = verified in a real browser during Gate/SafePal debugging; **[QA]** = best-known, must be confirmed live on HTTPS before shipping.

---

## The core problem: TRON namespace collision

TronLink defined the de-facto standard: a wallet injects `window.tronLink`, `window.tron`, and `window.tronWeb`. Many wallets copy this — so several installed wallets **overwrite each other's** `window.tronLink` / `window.tron` / `window.tronWeb`. Detecting "TronLink" by `window.tronLink` alone is unreliable when OKX/TokenPocket/Bitget/Gate are also installed.

Rule: **detect each wallet by its OWN unique marker, and detect TronLink LAST as the generic fallback.** Never let two wallets claim the same provider.

---

## Detection precedence (apply in this order)

1. **TIP-6963 announcements (authoritative).** TRON's multi-provider standard (EIP-6963 equivalent): each wallet dispatches `tip6963:announceProvider` (or the TronLink `tron#initialized` / `tronLink#initialized` events) with an `info.rdns`. If a wallet announces its `rdns`, that is the cleanest, collision-free marker. Prefer it when available.
2. **Unique namespace global.** Most wallets expose a private root: `window.okxwallet`, `window.gatewallet`, `window.SafePalHook`, `window.bitkeep`, `window.foxwallet`, `window.$onekey`, `window.backpack`, `window.coin98`, `window.tokenpocket`, `window.imToken`, `window.trustwallet`, `window.binancew3w`. These do not collide.
3. **Branded flag on the shared object.** Wallets that piggyback on `window.tronLink` / `window.tronWeb` usually stamp a flag: `isTokenPocket`, `isTrust`, `isImToken`, `isMathWallet`, `isBitKeep`, `isGateWallet`. Detect these by the flag, not by the bare object.
4. **TronLink = generic `tronLink` with NO brand flag.** `window.tronLink?.isTronLink === true` (or `window.tron?.isTronLink`) AND none of the branded flags above are set.

`detect()` must be cheap (globals/flags + optional short TIP-6963 listen). No `request()`, no dynamic import.

---

## Per-wallet matrix

| Wallet | detect marker | connect provider (request + tronWeb) | requestMethods | quirks | status |
|---|---|---|---|---|---|
| **TronLink** | `window.tronLink?.isTronLink` (or `window.tron?.isTronLink`) AND no brand flag; TIP-6963 `org.tronlink.www` | `window.tronLink` (has `request` + `tronWeb`) | `tron_requestAccounts` | wait for `tronWeb.ready`; address may lag right after unlock | [live] |
| **TokenPocket** | `window.tokenpocket` OR `window.tronLink?.tronWeb?.isTokenPocket` | `window.tokenpocket.tron` ?? `window.tronLink` | `tron_requestAccounts` | standard | [QA] |
| **OKX** | `window.okxwallet` | `window.okxwallet.tronLink` | `tron_requestAccounts` | standard | [QA] |
| **Bitget** | `window.isBitKeep` OR `window.bitkeep` (also `window.bitgetWallet`) | `window.bitkeep.tronLink` ?? `window.tronLink` | `tron_requestAccounts` | address can lag -> poll (acquireAddress covers it) | [live] |
| **Trust** | `window.trustwallet` OR `window.tronLink?.tronWeb?.isTrust` | `window.trustwallet.tronLink` ?? `.tron` | `tron_requestAccounts` | standard | [QA] |
| **Gate** | `window.gatewallet?.tronLink` (has `isGateWallet`) | `window.gatewallet.tron` | **`eth_requestAccounts`** | **prefer injected address** (request hangs when already exposed); **HTTPS-only injection** | [live] |
| **SafePal** | `window.SafePalHook` | composer: `{ request: SafePalHook.request, tronWeb: window.tronWeb }` | `tron_requestAccounts` | **address populates async -> poll**; signMode **`sign`** | [live] |
| **FoxWallet** | `window.foxwallet` | `window.foxwallet.tronLink` ?? `.tron` | `tron_requestAccounts` | standard | [QA] |
| **imToken** | `window.imToken` OR `window.tronWeb?.isImToken` | `window.tronLink` | `tron_requestAccounts` | standard | [QA] |
| **OneKey** | `window.$onekey` | `window.$onekey.tron` ?? `.tronLink` | `tron_requestAccounts` | standard | [QA] |
| **Backpack** | `window.backpack?.tron` | `window.backpack.tron` ?? `.tronLink` | `tron_requestAccounts` | TRON support is recent — confirm | [QA] |
| **Binance Web3** | `window.binancew3w` | `window.binancew3w.tron` (composer likely) | `tron_requestAccounts` / `eth_requestAccounts` | confirm TRON provider shape | [QA] |
| **MathWallet** | `window.tronWeb?.isMathWallet` (or a Math-specific global) — **NOT bare `window.tronLink`** | `window.tronLink` / `window.tron` | `tron_requestAccounts` | **collides with TronLink** — must key on a Math flag, else it will masquerade as TronLink | [QA-critical] |
| **Coin98** | `window.coin98` | `window.coin98.tron` (composer if request/tronWeb split) | `tron_requestAccounts` / `eth_requestAccounts` | multichain; TRON branch shape varies | [QA] |

Notes on the address branch: the "connect provider" column is the object that carries `.request` and `.tronWeb`. When those live on **different** globals (SafePal: request on `SafePalHook`, tronWeb on `window.tronWeb`), use a `provider` composer (see `standardInjected({ provider })`).

---

## Detection algorithm (avoid double-claim)

Resolve wallets in this fixed order and stop at the first match per provider object:

```
for each installed candidate:
  1. if wallet announced via TIP-6963 with its rdns -> that wallet.           // authoritative
  2. else if its unique namespace global exists -> that wallet.               // okxwallet, gatewallet, ...
  3. else if its brand flag is set on tronLink/tronWeb -> that wallet.        // isTokenPocket, isTrust, ...
TronLink is evaluated LAST:
  4. tronLink/tron present AND isTronLink AND no brand flag from (2)/(3) -> TronLink.
```

Because each wallet's `detect()` keys on its OWN marker, order only matters for the shared `window.tronLink`: any branded wallet (TokenPocket/Trust/imToken/MathWallet/Bitget) claims it first; TronLink only claims a truly-generic `tronLink`. This is what prevents "OKX installed but TronLink shows installed" and vice-versa.

MathWallet is the one real risk: if it overwrites `window.tronLink` with `isTronLink=true` and NO Math flag, it is indistinguishable from TronLink — do not enable it in the default catalog until a reliable Math marker is confirmed live.

---

## Connect notes for the quirky wallets

- **Gate**: `detect` = `window.gatewallet?.tronLink`. `connect` = read `gatewallet.tron.tronWeb.defaultAddress.base58` first (prefer-injected); if empty, fire `eth_requestAccounts` and poll `defaultAddress` (its `request` promise can hang). Only injects on HTTPS.
- **SafePal**: `detect` = `window.SafePalHook`. `connect` = fire `SafePalHook.request({method:'tron_requestAccounts'})`, then poll `SafePalHook.defaultAddress.base58` / `window.tronWeb.defaultAddress.base58` (address arrives after the promise). `signMessage` via `tronWeb.trx.sign` (mode `sign`, not `signMessageV2`).
- **Bitget**: `detect` = `window.isBitKeep`. `connect` = standard on `bitkeep.tronLink`; address can lag -> the shared `acquireAddress` poll covers it. Confirm whether it needs `eth_` vs `tron_requestAccounts` live.

In the new architecture (`WALLET_ADAPTER_ORG_SPEC.md`), each of these is:
```ts
gate    = withPreferInjectedAddress(withEthRequest(standardInjected({ marker: hasGateMarker, providerPaths: ["gatewallet.tron"] })))
safepal = withSignMode(standardInjected({ marker: () => !!window.SafePalHook, provider: safePalComposer }), "sign")
bitget  = standardInjected({ marker: () => !!(window as any).isBitKeep, providerPaths: ["bitkeep.tronLink","tronLink"] })
```

---

## Live verification snippet (run per wallet on an HTTPS page)

```js
const g = window;
({
  // unique namespaces
  okxwallet: typeof g.okxwallet, gatewallet: typeof g.gatewallet, SafePalHook: typeof g.SafePalHook,
  bitkeep: typeof g.bitkeep, isBitKeep: !!g.isBitKeep, foxwallet: typeof g.foxwallet,
  $onekey: typeof g.$onekey, backpack: typeof g.backpack, coin98: typeof g.coin98,
  tokenpocket: typeof g.tokenpocket, imToken: typeof g.imToken, trustwallet: typeof g.trustwallet,
  binancew3w: typeof g.binancew3w,
  // shared + flags
  tronLink: !!g.tronLink, tronLink_isTronLink: g.tronLink?.isTronLink,
  tronWeb_flags: { isTokenPocket: g.tronWeb?.isTokenPocket, isTrust: g.tronWeb?.isTrust, isImToken: g.tronWeb?.isImToken, isMathWallet: g.tronWeb?.isMathWallet },
  addr: g.tronWeb?.defaultAddress?.base58,
})
```

Record the result into the wallet's `entries/<id>.ts` marker + provider path. Never ship a marker that hasn't shown up in this snippet on a real install.

---

## Recommendation

1. Make **TIP-6963 the primary detection** path (collision-free) with the namespace/flag matrix as fallback — this is the durable fix for the "namespace too broad" problem.
2. Every wallet's `detect()` keys on its **own** marker; TronLink is the generic fallback evaluated last.
3. Hold MathWallet (and any wallet that overwrites bare `window.tronLink` with no distinct flag) out of the default catalog until a reliable marker is confirmed live.
4. Fill the `[QA]` rows by running the snippet with each extension installed before enabling them.
