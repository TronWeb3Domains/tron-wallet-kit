# App Metadata And XRPL Parity Proposal

Date: 2026-07-16

Implementation status: Phase 1, Phase 2 examples, website docs, and package README pass completed on 2026-07-16.

## Objective

Bring TRON Wallet Kit's app identity configuration closer to XRPL Wallet Kit while keeping TRON-specific behavior clean and adapter-owned.

The immediate target is to add a first-class `metadata` config object that identifies the dApp across WalletConnect, auth prompts, browser/CDN usage, docs, and future wallet UX surfaces.

## XRPL Kit Pattern Observed

XRPL Wallet Kit uses `metadata` as the preferred configuration surface:

```ts
createWalletKit({
  metadata: {
    name: "My XRPL App",
    description: "Wallet connection for My XRPL App",
    url: window.location.origin,
    icons: [`${window.location.origin}/icon.png`],
  },
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
});
```

It still accepts legacy aliases:

- `appName`
- `appDescription`
- `appUrl`
- `appIcons`

XRPL resolves a normalized metadata object once, then passes it to WalletConnect through `createWalletConnectMetadata(appMetadata)`.

## Current TRON Kit State

TRON Wallet Kit currently exposes:

- `appName` on `WalletClientConfig`;
- `ConnectOptions.appName`;
- WalletConnect adapter option `appMetadata?: Record<string, unknown>`;
- WalletConnect internal normalization for `{ name, description, url, icons }`.

Gap: there is no first-class `metadata` object in the client config, no centralized resolver, and docs teach `appName` as the primary API.

## Proposed API

Add:

```ts
export type WalletKitAppMetadata = {
  name?: string;
  description?: string;
  url?: string;
  icons?: string[];
};
```

Extend `WalletClientConfig` and `WalletManagerConfig`:

```ts
type WalletClientConfig = {
  metadata?: WalletKitAppMetadata;

  /** @deprecated Prefer metadata.name. */
  appName?: string;
  /** @deprecated Prefer metadata.description. */
  appDescription?: string;
  /** @deprecated Prefer metadata.url. */
  appUrl?: string;
  /** @deprecated Prefer metadata.icons. */
  appIcons?: string[];
};
```

Resolution rule:

```ts
name = metadata.name ?? appName ?? "TRON dApp"
description = metadata.description ?? appDescription ?? `${name} TRON wallet connection`
url = metadata.url ?? appUrl ?? current origin ?? "https://trxdomains.xyz"
icons = non-empty metadata.icons ?? appIcons ?? []
```

## Where Metadata Should Flow

1. `createWalletClient(config)`
   - Resolve metadata once.
   - Pass `appName: metadata.name` to `WalletManager` for legacy connect options.

2. `createDefaultAdapters(config)`
   - Pass resolved metadata into `buildAdapters`.
   - For WalletConnect descriptor/adapter, set `appMetadata`.

3. `@tron-wallet-kit/adapter-walletconnect`
   - Keep `appMetadata` but type it as `WalletKitAppMetadata` or equivalent normalized metadata.
   - Ensure `normalizeWalletConnectMetadata()` keeps the WalletConnect icon fallback.

4. React `getDefaultConfig`
   - Accept `metadata`.
   - Keep `appName` as alias for current callers.
   - If only `appName` is passed, synthesize `metadata.name`.

5. Browser/CDN
   - Examples should use `metadata`.
   - Keep `appName` working for legacy HTML.

6. Auth package
   - Future Sign-In with TRON should prefer `metadata.name` and `metadata.url` for default domain/URI prompts.

## Suggested Developer Usage

```ts
const config = getDefaultConfig({
  metadata: {
    name: "TRX Domains",
    description: "Connect a TRON wallet to manage .trx names.",
    url: "https://trxdomains.xyz",
    icons: ["https://trxdomains.xyz/icon.png"],
  },
  network: "mainnet",
  walletConnectProjectId: import.meta.env.VITE_WC_PROJECT_ID,
});
```

Legacy compatibility:

```ts
getDefaultConfig({
  appName: "TRX Domains",
  network: "mainnet",
});
```

## Benefits

- WalletConnect shows the real dApp name, URL, and icon instead of generic kit defaults.
- Docs become closer to XRPL Wallet Kit and easier for existing XRPL Kit users to migrate mentally.
- App identity becomes reusable for auth, wallet prompts, and future verified app surfaces.
- Keeps `appName` simple for beginner config while giving production apps a proper metadata object.

## Missing Areas Compared With XRPL Kit

### P0 - App Metadata

Status: missing as first-class config.

Recommendation:

- Add `metadata` config and resolver.
- Keep legacy aliases.
- Add tests for fallback order and WalletConnect payload.

### P1 - README / Docs Parity

TRON docs currently teach `appName`.

Recommendation:

- Update README, client README, React docs, Browser/CDN docs, website quick start, and WalletConnect docs to prefer `metadata`.
- Keep a small "legacy aliases" section.

### P2 - Package README Completeness

XRPL package READMEs are more complete for client/next/auth/browser usage.

Recommendation:

- Add or expand package READMEs for:
  - `@tron-wallet-kit/core`
  - `@tron-wallet-kit/ui`
  - `@tron-wallet-kit/client`
  - `@tron-wallet-kit/react`
  - `@tron-wallet-kit/next`
  - `@tron-wallet-kit/browser`
  - `@tron-wallet-kit/auth`

### P2 - Transaction Docs Depth

TRON has richer chain-specific transaction helpers than XRPL:

- TRX transfer
- TRC10
- TRC20
- smart contract trigger
- freeze / unfreeze
- delegate / undelegate resource
- vote witness

Recommendation:

- Keep these in TRON docs as a strength.
- Add examples showing injected wallet vs WalletConnect behavior at a high level without forcing app developers to branch manually.

### P2 - Recent Transactions And Account Panel Docs

XRPL docs mention recent transaction wiring more explicitly.

Recommendation:

- Add TRON docs for `manager.addTransaction`, automatic helper-recorded transactions, and account panel transaction history.

### P3 - Migration Guide From tronweb3 Adapter

TRON already has walletadapter.org/tronweb3 parity work.

Recommendation:

- Expand migration docs with:
  - wallet ids;
  - injected vs WalletConnect behavior;
  - transaction helper equivalents;
  - metadata config example.

## Implementation Plan

### Phase 1 - Core/Client Metadata Resolver

Files:

- `packages/core/src/types.ts`
- `packages/client/src/types.ts`
- `packages/client/src/client.ts`
- `packages/client/src/wallets/build-adapters.ts`
- `packages/adapters/walletconnect/src/index.ts`

Tasks:

- Add `WalletKitAppMetadata`.
- Add `metadata`, `appDescription`, `appUrl`, `appIcons`.
- Implement `resolveAppMetadata(config)`.
- Pass resolved metadata to WalletConnect `appMetadata`.
- Pass `metadata.name` as manager `appName`.
- Tests:
  - metadata preferred over aliases;
  - aliases still work;
  - default metadata uses origin/trxdomains fallback;
  - WalletConnect receives metadata.

### Phase 2 - React / Browser API

Files:

- `packages/react/src/index.ts`
- `packages/browser/src/index.ts`
- examples.

Tasks:

- Make `getDefaultConfig({ metadata })` valid.
- Keep `appName` compatibility.
- Update examples to prefer metadata.

Status: completed on 2026-07-16.

### Phase 3 - Docs

Files:

- root `README.md`
- package READMEs
- website docs:
  - quick start
  - client API
  - React
  - CDN / IIFE
  - WalletConnect
  - configuration page for app metadata

Tasks:

- Teach `metadata` first.
- Add legacy alias note.
- Explain WalletConnect display name/icon behavior.

Status: completed on 2026-07-16 for root README, client/react/browser/next/core/ui/auth package README files, website quick start, client API, framework pages, WalletConnect, and App metadata page.

## Acceptance Criteria

- Existing `appName` integrations compile and behave unchanged.
- New `metadata` config compiles in client, React, browser/CDN examples.
- WalletConnect SignClient init receives normalized `{ name, description, url, icons }`.
- `metadata.icons` empty array falls back safely without breaking QR flow.
- Docs no longer present `appName` as the production-preferred config.
- Tests cover resolver and WalletConnect propagation.

## Recommended Priority

Do Phase 1 first. It is low risk, unlocks correct WalletConnect/app identity, and gives docs a stable API to document.
