# Injected wallets — first-connect returns no address (Bitget, SafePal)

> **MERGED — single source of truth is now `WALLET_ADAPTER_ORG_SPEC.md` → section "First-connect
> returns no address (Bitget, SafePal) — connect fix".** This standalone file is kept only for
> history; implement from the org spec.

**Status:** ready to implement
**Scope:** `packages/client` only
**Symptom (reported):** On Bitget and SafePal, the **first** connect does not return the account
address — the modal keeps spinning and eventually fails with `"<wallet> did not return an
address."`. Closing the modal and clicking Connect a **second** time works. Wallets that already
expose the address (reconnect) always work.

---

## 1. Root cause

On a first-time connect, these wallets populate `tronWeb.defaultAddress` **a moment AFTER**
`request()` resolves — the approval promise settles, then the address lands asynchronously
(SafePal on `window.tronWeb.defaultAddress`, Bitget on `bitkeep.tronWeb.defaultAddress`). The
address-acquisition loop gives up before that async write happens.

Flow in `packages/client/src/adapters/injected.ts` → `acquireInjectedAddress`:

1. `request()` is fired in the background; a poll (`readLive()`) runs every 100ms.
2. When `request()` settles **without** an address, the loop enters the early-break branch:

   ```ts
   // injected.ts (current)
   if (requestSettled && !requestedAddress) {
     const grace = readLive();
     if (grace) return eventWatcher.close(grace);
     if (Date.now() - requestSettledAt >= (config.addressSettleMs ?? DEFAULT_ADDRESS_SETTLE_MS)) break;
   }
   ```

3. It only keeps polling for `addressSettleMs` after settle, then **breaks** and falls back to
   `retryEmptyAddressRequest`.

Why each wallet fails on the first attempt:

- **SafePal** — has **no** `addressSettleMs` configured, so it uses `DEFAULT_ADDRESS_SETTLE_MS =
  700ms`, and has **no** `emptyAddressRetry*` configured, so `retryEmptyAddressRequest` returns
  `undefined` immediately. First-time approval → address arrives later than 700ms after settle →
  loop breaks → no retry → `"SafePal did not return an address."` **This is the exact failure.**
- **Bitget** — `requestMethods: ["eth_requestAccounts", "tron_requestAccounts"]` fires the **EVM**
  method first. On the dual-chain `bitkeep` provider that pops the wrong (EVM) approval and can
  return a `0x…` EVM address, which is then accepted as if it were the TRON account. Even when it
  falls through to `tron_requestAccounts`, the same async-address gap as SafePal applies, and its
  `addressSettleMs: 1800` is still tighter than a real first-time approval round-trip.

Reference (current values in `injected.ts`):

```ts
const DEFAULT_ADDRESS_TIMEOUT_MS = 60000;
const DEFAULT_ADDRESS_SETTLE_MS = 700;
```

---

## 2. Fix

Three changes, all in `packages/client`.

### 2.1 Widen the post-settle poll window — `packages/client/src/adapters/injected.ts`

Raise the default settle window so the async address is caught by the existing poll (no second
popup needed). The poll still returns **as soon as** the address appears — this is a ceiling, not
a fixed wait — and wallets that legitimately return nothing still bail out within the window.

```ts
// was: const DEFAULT_ADDRESS_SETTLE_MS = 700;
const DEFAULT_ADDRESS_SETTLE_MS = 2500;
```

### 2.2 Reject non-TRON addresses — `packages/client/src/adapters/injected.ts`

Guard against a dual-chain wallet handing back an EVM `0x…` address (Bitget when `eth_` is tried).
TRON base58 addresses always start with `T` (0x41 prefix) and are 34 chars.

Add the helper (near `delay` / `withTimeout`):

```ts
// TRON base58 addresses always start with "T" (0x41 prefix) and are 34 chars.
// Reject anything else (e.g. an EVM 0x… address) so it can never be accepted as the account.
const TRON_ADDRESS_PATTERN = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
function isTronAddress(value: unknown): value is string {
  return typeof value === "string" && TRON_ADDRESS_PATTERN.test(value);
}
```

Apply it in two places inside `acquireInjectedAddress`:

```ts
// (a) where the background request result is captured:
void requestInjectedAddress(nextProvider, config.requestMethods)
  .then((address) => { if (isTronAddress(address)) requestedAddress = address; })
  // …unchanged .catch / .finally

// (b) at the end of readLive():
const readLive = () => {
  const address =
    readInjectedAddress(resolveProvider()) ??
    readInjectedAddressFromPaths(config.providerPaths) ??
    readInjectedAddress(nextProvider);
  return isTronAddress(address) ? address : undefined;   // was: address.length > 0 check
};
```

### 2.3 Per-wallet entry tweaks

**`packages/client/src/wallets/entries/bitget.ts`** — try the TRON method first (its injected
provider is TronLink-compatible), and widen the settle window:

```ts
requestMethods: ["tron_requestAccounts", "eth_requestAccounts"], // was eth-first
addressSettleMs: 2500,                                            // was 1800
// emptyAddressRetryDelayMs / emptyAddressRetryTimeoutMs: keep existing
```

**`packages/client/src/wallets/entries/safepal.ts`** — add a settle window + a re-read fallback so
the address is caught on the first attempt:

```ts
detect: { provider: getSafePalInjectedProvider, availabilityProbe: hasSafePalInjectedMarker },
addressSettleMs: 2500,
emptyAddressRetryDelayMs: 300,
emptyAddressRetryTimeoutMs: 3000,
signMessageMode: "sign"
```

> All three fields (`addressSettleMs`, `emptyAddressRetryDelayMs`, `emptyAddressRetryTimeoutMs`)
> are already on `InjectedWalletDescriptor` (`wallets/types.ts`) and threaded through
> `wallets/build-adapters.ts` — no type or plumbing changes needed.

---

## 3. Why this is safe

- The widened settle window is a **ceiling**, not a fixed delay: `readLive()` still resolves the
  instant the address appears, so reconnects (address already exposed) stay instant.
- The TRON-address filter only **rejects** clearly-wrong values (`0x…`); every real base58 `T…`
  address passes unchanged. `readInjectedAddress` already reads `defaultAddress.base58`, so normal
  wallets are unaffected.
- Firing `tron_requestAccounts` first on Bitget avoids the wrong (EVM) approval popup; `eth_`
  remains only as a last-resort fallback and any `0x` it returns is now filtered out.
- Gate is unaffected: it uses `preferInjectedAddress` (immediate read) and its `request()` never
  settles, so the settle-branch never runs.

---

## 4. Acceptance checks

Run on Windows:

```
npm.cmd run typecheck && npm.cmd test && npm.cmd run build
```

Then, on the HTTPS example page, with each extension freshly **un-authorized** (revoke the site so
it is a true first connect):

1. **SafePal** — first Connect returns a `T…` address, modal closes, no reconnect needed.
2. **Bitget** — first Connect pops the TRON approval (not EVM), returns a `T…` address, modal
   closes; verify the address is base58 `T…` (never `0x…`).
3. **Reconnect** both — still instant.
4. **Gate** — unchanged (still connects instantly).
