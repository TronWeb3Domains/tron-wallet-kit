# Adapter Behavior Notes

## Adapter Boundary

Adapters own wallet-specific connection, capability detection, signing, transaction submission, event handling, and cleanup.

Core owns shared types, normalized errors, adapter contracts, account/session state contracts, and wallet-neutral orchestration.

Adapter source packages live under `packages/adapters/*`. Public package names keep the explicit `adapter-` prefix, while folder names use wallet names such as `tronlink` and `walletconnect`.

## Normalization Targets

| Area | Core Contract | Adapter Responsibility | Status |
| --- | --- | --- | --- |
| Availability | Wallet availability enum/state | Detect provider or session support | Pending |
| Connect | Normalized account/session | Invoke wallet-specific connect flow | Pending |
| Disconnect | Normalized cleanup result | Remove wallet/session listeners | Pending |
| Account change | Normalized event | Map provider events | Pending |
| Network change | Normalized event | Map provider/session chain changes | Pending |
| Balance | TRX balance format | Fetch through wallet/provider/API as appropriate | Pending |
| signMessage | Normalized signature result | Use wallet signing API | Pending |
| signTransaction | Normalized signed transaction | Use wallet signing API | Pending |
| Send TRX | Normalized transaction result | Build/sign/broadcast or delegate to wallet | Pending |
| Errors | Normalized error codes | Map provider-specific errors | Pending |

## TronLink Notes

- Keep `window.tronLink` and `window.tronWeb` assumptions inside the TronLink adapter.
- Detect locked, unavailable, wrong network, and rejected states distinctly where possible.
- Do not expose raw provider objects from core APIs unless explicitly designed.
- Current implementation includes provider resolution for `globalThis.tron`, `globalThis.tronLink`, and `globalThis.tronWeb`.
- Supports legacy `tron_requestAccounts` and TIP-1193-style `eth_requestAccounts`.
- 2026-07-06 hardening:
  - TIP-1193 `window.tron.tronWeb` may be `false` before authorization, so connect must request accounts before requiring `tronWeb`.
  - Legacy TronLink may expose `window.tronLink` and `window.tronWeb` separately; adapter now synthesizes a legacy provider from both globals.
  - Regression coverage now checks delayed TIP-1193 `tronWeb` and legacy global `tronWeb` fallback.
- 2026-07-06 upstream alignment pass after reviewing `tronweb3/tronwallet-adapter` TronLink:
  - TronLink availability is now asynchronous and waits briefly for extension/provider injection before returning `false`, matching the upstream `Loading -> Found/NotFound` idea.
  - `connect()` also waits for provider discovery to reduce races when the user clicks during injection.
  - Keep upstream lessons scoped to discovery/state/event behavior; do not import EVM/multichain assumptions into TRON Wallet Kit core.
- Supports `signMessage` through `tronWeb.trx.signMessageV2`.
- Supports `signTransaction` through `tronWeb.trx.sign`.
- Supports `sendTrx` through `tronWeb.trx.sendTransaction` when available.
- Reads network info from `tronWeb.trx.getBlockByNumber(0)` and maps known chain ids: mainnet `0x2b6653dc`, Shasta `0x94a9059e`, Nile `0xcd8690dc`.
- Listens for TIP-1193 `accountsChanged` and `chainChanged` events when available.
- Tested with mock providers only so far.
- Next implementation step: manual browser QA with TronLink extension, then add any missing edge-case mappings for locked wallet, pending request, and mobile app behavior.

## WalletConnect Notes

- Keep WalletConnect project/session/chain details inside the WalletConnect adapter.
- Expose only normalized account, network, signing, and transaction capabilities to core.
- Current implementation uses `@tronweb3/walletconnect-tron` through a dynamic default factory and supports an injectable `walletFactory` for unit tests.
- Requires `projectId`; `readyState` is `notFound` without it.
- Defaults network to Nile and maps `mainnet`, `shasta`, `nile`, raw chain ids, and `tron:<chainId>` strings into WalletConnect TRON chain ids.
- Supports `onUri` both at adapter construction and per-connect call so UI can render its own QR instead of relying on a walletconnect modal.
- Defaults `allWallets` to `HIDE`, matching upstream guidance for TRON WalletConnect reliability.
- Demo project ID provided by user: `a4109c95d50e5c136cdafaf9fc44c105`. Keep this in docs/examples only; do not hardcode it as an adapter default.
- Supports connect/disconnect, signMessage, signTransaction, account-change events, disconnect events, and half-open session cleanup after failed connection attempts.
- Direct `sendTrx` is intentionally conditional: only works if the underlying wallet object provides `sendTrx` or `sendTransaction`. It is not included in default capabilities.
- Tested with mock WalletConnect wallet only so far.
- Next implementation step: real WalletConnect QA with project id, TokenPocket mobile, QR rendering, and rejected/closed modal flows.
- Browser/CDN all-in-one export now includes WalletConnect factory support, but this makes the IIFE bundle large. Revisit split adapter browser bundles before public release.

## Open Questions

- Which TRON networks are MVP: mainnet only, Nile, Shasta, or configurable?
- Should balance use wallet provider RPC, public fullnode RPC, or adapter-provided client?
- Should send TRX be a core helper plus adapter signing, or adapter-owned end to end for MVP?

## Competitive Notes: TronWallet Adapter

- TronWallet Adapter already has broad adapter coverage and documents wallet-specific capability differences.
- It exposes concepts such as wallet detection, connection, signing, account changes, chain changes, WalletConnect QR URI callbacks, optional security checks, and tested wallet versions.
- TRON Wallet Kit should not try to beat it first by wallet count. MVP should focus on TronLink and WalletConnect quality, normalized adapter behavior, stable UX, and fewer integration footguns.
- Keep a feature matrix from day one so future adapters can be added without blurring core contracts.

## Adapter Priority Recommendation

Based on TronWallet Adapter documentation reviewed on 2026-07-03:

1. Phase 1: TronLink. It has the strongest capability baseline: deeplink, signMessage, signTransaction, multiSign, signTypedData, switchChain, accountsChanged, and reconnect support are documented as supported. It is also the most important TRON wallet for first-run developer trust.
2. Phase 1: WalletConnect. It is required for mobile/QR UX, but should be framed as WalletConnect transport with wallet-specific caveats. TronWallet Adapter notes that TokenPocket currently supports WalletConnect well, while other mobile wallets may have issues.
3. Phase 2: TokenPocket. Strong next target because it supports deeplink, signMessage, signTransaction, accountsChanged, reconnect, and is the best documented WalletConnect mobile target.
4. Phase 2: Trust Wallet or Bitget. Trust Wallet has a strong common capability row; Bitget is widely used and supports signMessage/signTransaction/reconnect but lacks accountsChanged in their matrix.
5. Phase 3: MetaMask TRON, OKX, and Bybit. MetaMask is high-value and present in the TronWallet Adapter repo as `metamask-tron`, but it has caveats such as mnemonic-imported wallets only for TRON network. OKX and Bybit are high-value wallets but have partial/conditional deeplink/accountsChanged behavior, so they should come after the core event/capability model is mature.
6. Phase 3: Binance Wallet. Valuable because it has wallet-specific `signAndSendTransaction()`, but that method should stay outside the common baseline.
7. Later: Ledger, Backpack, OneKey, Guarda, FoxWallet, imToken, GateWallet, Tomo. Add after MVP unless a partner/use case specifically requires them.

Common adapter acceptance should include ready state, connect/disconnect, signMessage, signTransaction, network, accountsChanged, chainChanged, connect/disconnect events, and reload persistence where the wallet supports it.
Adapter metadata acceptance should include `id`, `name`, `icon`, `homepage`, `type`, `group`, and `description` so the connect modal never falls back to a raw initial unless an app explicitly overrides metadata that way.

## Source Layout Notes: tronweb3/tronwallet-adapter

- Their adapter directory includes `abstract-adapter`, aggregate `adapters`, `tronlink`, `walletconnect`, `tokenpocket`, `bitkeep`, `trust`, `okxwallet`, `bybit`, `binance`, `metamask-tron`, `ledger`, `backpack`, `onekey`, `guarda`, `foxwallet`, `imtoken`, `gatewallet`, and `tomowallet`.
- Their repo also has a separate `evm/` subtree with `abstract-adapter`, `metamask`, `okxwallet`, `trust`, `binance`, and `tronlink`. TRON Wallet Kit should avoid copying this into core; EVM-compatible behavior should remain opt-in adapter/package behavior.
- TronLink README caveat: dApps cannot truly disconnect TronLink; adapter `disconnect()` only clears local state. TRON Wallet Kit UI must phrase disconnect accurately and avoid promising wallet-side revocation.
- TronLink desktop discovery can be asynchronous because TIP-6963 provider discovery may happen before falling back to legacy globals.
- WalletConnect README uses Reown/AppKit options, requires project metadata, defaults network to Nile, supports custom QR via `onUri`, and explicitly does not support `multiSign` or `switchChain`.
- WalletConnect config should probably hide "All Wallets" by default for TRON, mirroring their recommendation that most wallets do not support it well.
- MetaMask TRON README caveat: `multiSign` is not supported yet, and only wallets imported by mnemonic can be used on TRON network.

## Source/Test Review: tronweb3/tronwallet-adapter

Reviewed locally from `https://github.com/tronweb3/tronwallet-adapter/tree/main/packages/adapters` on 2026-07-03 before continuing adapter work.

Test coverage is uneven:

- Deepest tests: `tronlink` has about 29 unit tests, `ledger` about 21, `backpack` about 26, plus abstract/EVM adapter tests.
- Most wallet adapters such as Trust, OKX, Bybit, TokenPocket, BitKeep, Guarda, FoxWallet, imToken, GateWallet, TomoWallet, MetaMask TRON, and Binance have mostly constructor/property smoke tests plus a few targeted edge-case tests.
- `walletconnect` has implementation but no local unit test file in `packages/adapters/walletconnect`.

Implementation families:

- TronLink-like legacy adapters: Trust, OKX, Bybit, BitKeep, Guarda, FoxWallet, imToken, GateWallet, TomoWallet generally follow the same shape: injected wallet object, `tron_requestAccounts`, `tronWeb.defaultAddress.base58`, `tronWeb.trx.sign`, `tronWeb.trx.signMessageV2`, and postMessage/event handling for accounts/network changes.
- TokenPocket is closer to TIP-1193: uses `wallet.tron.request({ method: "eth_requestAccounts" })`, reuses TronLink network helper, and gates auto-connect paths after a security check.
- Backpack is request-style and cleaner for a future generic request-provider abstraction: `tron_requestAccounts`, `tron_signMessage`, `tron_signTransaction`, `tron_switchChain`, `tron_chainId`, `tron_accounts`, plus event listeners.
- WalletConnect wraps `@tronweb3/walletconnect-tron`, requires config/options, maps network to `tron:<chainId>`, supports custom `onUri`, hides "All Wallets" by default/recommendation, and carefully disconnects half-open sessions after aborted connect attempts.
- Binance has native provider plus WalletConnect fallback. Its `signAndSendTransaction()` is native-only; it explicitly throws when connected through WalletConnect fallback.
- MetaMask TRON uses MetaMask multichain API and is not a normal EVM adapter. It requires scope/session selection, encodes sign-message payload, and has safeguards against parallel chain switching.
- Ledger is a separate hardware class of adapter and should not share browser-provider assumptions.

Implications for TRON Wallet Kit:

- Add a small internal adapter test checklist before each new wallet: constructor metadata/capabilities, not-found state, connect success, user rejection, pending request, signMessage, signTransaction, disconnect cleanup, accountsChanged, chainChanged, and wallet-specific capability caveats.
- Prefer extracting local helper utilities only after the second or third similar adapter, not before; the current repo should avoid copying TronWallet Adapter inheritance structure.
- Next adapter after TronLink should be WalletConnect, but it needs tests because upstream has fewer tests there than TronLink.
- If adding TokenPocket/Trust/OKX next, do not assume they are identical to TronLink despite similar code; account/network events and security-gated auto-connect paths differ.

## TRON Wallet Kit Adapter Metadata

- TronLink now includes a default SVG icon generated from `https://walletadapter.org/wallets/TronLink.svg`, homepage, `type: "extension"`, `group: "Extensions"`, and a short description.
- WalletConnect now includes a default SVG icon generated from `https://walletadapter.org/wallets/WalletConnect.svg`, homepage, `type: "walletconnect"`, `group: "Mobile wallets"`, and a short description.
- Adapter icon constants are generated locally by `pnpm icons:wallets` into each adapter package, so adapters do not depend on `@tron-wallet-kit/ui` and the UI does not runtime-hotlink remote assets.
- These icons are data URIs for portability in React, browser/CDN, and docs examples. Keep the generated-source flow before public release and re-check brand asset licensing/quality during release review.

## Clean Contract Rebuild Notes

- Adapters now expose object capabilities from `WalletCapabilities`; do not use `ReadonlySet<WalletCapability>` in new code.
- `connect()` must return `ConnectResult` with normalized `account.address` and a full `WalletNetwork` when known.
- `signMessage()` must return `SignMessageResult` with a non-empty `proof`, `signature`, or `txBlob`; user cancel/reject must throw.
- `signTransaction()` must return `SignTransactionResult` with `signed: true`; do not return successful empty signatures.
- Transaction sending goes through `submitTransaction(request)` with TRON method hints such as `transferTrx` or `generic`. Provider-specific direct-send methods stay inside the adapter.
- TronLink direct disconnect remains local-state cleanup only; dApps cannot revoke TronLink wallet authorization.
- WalletConnect direct TRX submit remains conditional on the underlying wallet implementation exposing `sendTrx` or `sendTransaction`.

## 2026-07-06 Platform Grouping And Optional Tronweb3 Bridge

- Core adapter metadata now supports `platforms?: ("extension" | "mobile")[]`.
- Built-in metadata:
  - TronLink declares both `extension` and `mobile`.
  - WalletConnect declares `mobile`.
- UI catalog is now TRON-only but platform-aware:
  - extension-capable first: TronLink, TokenPocket, Bitget, OKX, Trust, GateWallet, Bybit, Binance Web3 Wallet, Guarda, MetaMask, OneKey, Backpack
  - mobile/app-capable: TokenPocket, Trust, Binance Web3 Wallet, Bitget, OKX, Bybit, FoxWallet, imToken, Tomo, WalletConnect
  - hardware/manual: Ledger
- WalletConnect fallback is limited to wallets documented as viable for WalletConnect flows:
  - TokenPocket, Binance, and Trust can fallback to WalletConnect.
  - OKX, Bybit, FoxWallet, imToken, GateWallet, and TomoWallet should not fallback through WalletConnect because the wallet reference marks those WalletConnect rows as unsupported.
  - Bitget can connect by WalletConnect in the reference, but message/transaction signing are marked unsupported, so the kit keeps it extension/native-bridge first instead of routing the MVP signing flow through WalletConnect.
- Catalog entries keep wallet-specific IDs even when they fallback to WalletConnect transport. This prevents the QR panel from losing the selected wallet identity while still allowing a mobile QR flow.
- `@tron-wallet-kit/client` now exposes `createTronWeb3AdapterBridge()` and `tronweb3Adapters` config. This is intentionally optional:
  - no upstream tronweb3 adapter package is required by default
  - apps can pass real instances such as OKX/TokenPocket/MetaMask TRON adapters when they opt into those packages
  - bridge normalizes connect/signMessage/signTransaction into local `WalletAdapter`
- Do not mark a wallet as fully supported just because it is listed in the catalog. Promotion from catalog/WalletConnect fallback to native support still requires the wallet test checklist.

## 2026-07-06 Extension Adapter Wiring Correction

- `@tron-wallet-kit/client` now creates injected extension adapters by default for TokenPocket, OKX, Bitget, Trust, GateWallet, Bybit, Binance Web3 Wallet, Guarda, OneKey, and Backpack, in addition to TronLink. WalletConnect is still only added when a `walletConnectProjectId` is configured.
- The injected adapter family uses wallet-specific globals such as `tokenpocket.tron`, `okxwallet.tronLink`, `bitkeep.tron`, `gatewallet.tron`, `bybitWallet.tronLink`, `binancew3w.tron`, `$onekey.tron`, and `backpack.tron`. Avoid generic `window.tronWeb` or generic `window.tronLink` in these adapters because those paths cause wallet identity collisions.
- TronLink detection was tightened so TokenPocket-style globals do not get treated as TronLink. The TronLink adapter accepts `window.tron` only when `isTronLink` is present, accepts `window.tronLink` when it has an explicit TronLink marker, and otherwise rejects legacy fallback when generic `window.tron` or known non-TronLink globals are present.
- All Wallets is now intentionally flat. Extension/Mobile stays in `metadata.platforms` and `data-twk-platforms` for future desktop/mobile UX, but the UI no longer renders Extension/Mobile sections or mini-stack grouping.
- Dual-mode wallets with WalletConnect fallback use extension first. If the extension adapter is unavailable and WalletConnect exists, TokenPocket/Binance/Trust can route to `adapterId: "walletconnect"` while preserving the selected wallet identity in the QR panel.
- Current tests cover injected TokenPocket connect/sign mocks, default adapter registration, TronLink false-positive rejection, flat All Wallets markup, and TokenPocket QR fallback identity. Real installed extension QA is still required for each provider path.

## 2026-07-06 Real Wallet Connect Fixes

- Core no longer copies `ConnectResult.raw` into `WalletSession.metadata`. Real wallet providers can contain circular `tronWeb`/event references, so persisting raw provider objects turns a successful connect into a misleading UI error such as `Converting circular structure to JSON`.
- Stored sessions are now created through a JSON-safe copy path before writing to storage. Circular references, functions, symbols, and empty circular shells are removed; bigint values are stringified.
- TronLink legacy detection was tightened again:
  - `window.tron?.isTronLink` is accepted as TIP-1193 TronLink.
  - `window.tronLink?.isTronLink` is accepted as explicit legacy TronLink.
  - generic `window.tron` without `isTronLink` now blocks legacy `window.tronLink` fallback, because TokenPocket-style providers can expose both globals and otherwise overwrite the selected wallet.
- Caveat for QA: if an older TronLink build exposes only generic globals with no marker, it may now show as not installed. That is preferable to silently connecting the wrong wallet; real extension QA should confirm the current TronLink marker behavior.

## 2026-07-06 TronLink Detection Correction With Mixed Extension Globals

- Corrected the TronLink detection caveat after real UI QA showed TronLink as `NOT INSTALLED` while another TRON extension was detected.
- Current TronLink adapter behavior:
  - `window.tron.isTronLink` is accepted as TIP-1193 TronLink.
  - `window.tronLink.isTronLink` is accepted as explicit legacy TronLink.
  - legacy `window.tronLink` is also accepted when it has a request function and a usable TronWeb source from either `tronLink.tronWeb` or separate `window.tronWeb`.
  - nested provider objects from non-TronLink wallets are rejected when they are exposed under known paths such as `tokenpocket.tron`, `okxwallet.tronLink`, `bitkeep.tronLink`, `bybitWallet.tronLink`, `gatewallet.tronLink`, `binancew3w.tronLink`, `backpack.tronLink`, or `$onekey.tronLink`.
- This keeps wallet identity specific:
  - OKX installed should not make TronLink installed.
  - TokenPocket injected globals should not route the TronLink row into TokenPocket.
  - A real separate legacy TronLink injection should still show `INSTALLED` even if OKX or another TRON wallet is also present.
- Added adapter tests for OKX + legacy TronLink coexistence and same-object TokenPocket false-positive rejection.

## 2026-07-06 Tronwallet Adapter Bridge Package

- Added `@tron-wallet-kit/adapter-tronwallet-bridge` to wrap runtime `@tronweb3/tronwallet-adapter`-style instances instead of reimplementing each wallet.
- Bridge boundary:
  - app owns installing and instantiating concrete wallet adapters
  - bridge owns mapping that runtime instance into TRON Wallet Kit `WalletAdapter`
  - catalog/UI still owns wallet names/icons/order/badges
- Bridge event behavior:
  - subscribes to `accountsChanged`, `chainChanged`, and `disconnect`
  - forwards through `ConnectOptions` callbacks
  - cleanup happens before bridge disconnect calls inner `disconnect()`
- Core now handles those callbacks by mutating the active session and emitting manager events.
- Broadcast caveat:
  - tronweb3 wallet adapters sign; bridge needs app-provided `tronWeb` with `trx.sendRawTransaction` to submit transactions.
  - transfer TRX can be built through `tronWeb.transactionBuilder.sendTrx` when available; otherwise callers should pass a ready transaction payload.
- Next adapter work should prefer real `@tronweb3` adapter instances through this bridge for OKX/Bitget/TokenPocket/Trust/MetaMask-TRON before adding more handwritten injected adapters.

## 2026-07-06 Prominent Wallets Moved To Tronwallet Bridge

- Default client registration now uses lazy bridge adapters for the first prominent wallet set:
  - `tokenpocket` -> `@tronweb3/tronwallet-adapter-tokenpocket` / `TokenPocketAdapter`
  - `okx` -> `@tronweb3/tronwallet-adapter-okxwallet` / `OkxWalletAdapter`
  - `bitget` -> `@tronweb3/tronwallet-adapter-bitkeep` / `BitKeepAdapter`
  - `trust` -> `@tronweb3/tronwallet-adapter-trust` / `TrustAdapter`
  - `metamask` -> `@tronweb3/tronwallet-adapter-metamask-tron` / `MetaMaskAdapter`
- These wallets are no longer represented by handwritten provider-path injected defaults. That should reduce false-positive/cross-wallet routing such as selecting one wallet row but receiving another wallet's provider.
- MetaMask upstream differs from the abstract adapter shape:
  - `connect()` returns a string address in its type instead of `void`
  - `signMessage()` receives `{ message }`
  - `switchChain()` may return `null`
  - The bridge boundary now tolerates these SDK return shapes; default MetaMask wiring sets `signMessageMode: "messageObject"`.
- Remaining handwritten injected defaults are temporary coverage for lower-priority wallets: Gate, Bybit, Binance Web3 Wallet, Guarda, OneKey, and Backpack.
- Real QA still must validate:
  - installed badge accuracy for each extension
  - connect/cancel/error mapping
  - signMessage and signTransaction behavior
  - no selected-wallet identity drift in the connecting and QR panels
  - broadcast flow when `tronweb3Bridge.tronWeb` is supplied

## 2026-07-06 Installed Detection Fallback For Prominent Wallets

- TokenPocket, OKX, and Bitget now keep their upstream lazy bridge adapters, but each has a wallet-specific injected fallback for installed detection and connect.
- This was added because real UI QA showed false `NOT INSTALLED` states and upstream source inspection confirmed detection mismatches:
  - TokenPocket desktop path can depend on TIP-6963 announcement timing.
  - OKX uses `window.okxwallet.tronLink`.
  - Bitget's support check uses `window.tronLink && window.isBitKeep`, but the adapter also expects `window.bitkeep`.
- Fallback provider paths are intentionally narrow:
  - TokenPocket: `tokenpocket.tron`
  - OKX: `okxwallet.tronLink`
  - Bitget: `bitkeep.tronLink`, `bitkeep.tron`
- Do not add generic `window.tronWeb`, `window.tronLink`, or `window.tron` fallback paths for these wallets. Generic globals caused earlier wallet identity drift.
- Regression coverage now asserts that the default client marks these three wallets available and connects OKX/Bitget to the correct provider when those wallet-specific globals exist.

## 2026-07-06 TronLink / TokenPocket Drift Rule

- TronLink must not claim unmarked legacy `window.tronLink` while TokenPocket globals are present.
- Accepted TronLink paths are now:
  - `window.tron.isTronLink`
  - `window.tronLink.isTronLink`
  - legacy `window.tronLink` only when no known non-TronLink wallet globals are present.
- Explicitly reject top-level `window.tronLink` when it is linked to TokenPocket through:
  - `window.tokenpocket.tron`
  - `window.tokenpocket.tronLink`
  - shared `tronWeb` reference with `window.tokenpocket.tronWeb` or `window.tokenpocket.tron.tronWeb`
- This is stricter than earlier coexistence behavior, but it is safer for wallet identity: installed TokenPocket must not make the TronLink row connect TokenPocket.

## 2026-07-06 MetaMask Availability Caveat

- The old upstream `@tronweb3/tronwallet-adapter-metamask` package is EVM-style and should not be used for this TRON kit.
- Use `@tronweb3/tronwallet-adapter-metamask-tron` for MetaMask TRON support.
- The upstream adapter can start in `readyState: "Loading"` and may wait for wallet initialization.
- Lazy bridge availability now supports `availabilityTimeoutMs` and waits for `readyStateChanged` before deciding installed state.
- Default MetaMask config uses `availabilityTimeoutMs: 3200`.
- MetaMask still needs real QA because TRON support depends on the wallet's TRON-specific behavior and the upstream caveat says only wallets imported by mnemonic can be used on TRON.

## 2026-07-06 Strong TokenPocket Guard

- Real QA still showed TokenPocket could hijack TronLink, likely because TokenPocket exposes top-level `window.tron` with a TronLink-like marker.
- TronLink detection now rejects any top-level provider when:
  - it is the same object as a known non-TronLink provider path, including `tokenpocket.tron`
  - it shares the same `tronWeb` object as `window.tokenpocket.tronWeb` or `window.tokenpocket.tron.tronWeb`
- This rejection applies even if the top-level provider has `isTronLink: true`.
- MetaMask installed-state detection now also probes `window.ethereum.isMetaMask` and `window.ethereum.providers[].isMetaMask`; connect still delegates to the upstream adapter.

## 2026-07-06 Error Display And MetaMask Dev Server Notes

- UI must not render raw provider/import errors in wallet detail panels.
- Dynamic import failures from Vite optimized dependency chunks are normalized to `<Wallet> could not be loaded. Refresh the page and try again.`
- Unavailable/not-found provider errors are normalized to `<Wallet> is not available.`
- Unknown long errors are compacted before rendering so the modal keeps a stable width and avoids horizontal scroll.
- Examples Vite config now prebundles the prominent upstream adapter packages, especially `@tronweb3/tronwallet-adapter-metamask-tron`.
- After changing `optimizeDeps`, restart the examples dev server so Vite rebuilds `node_modules/.vite/deps`.
- MetaMask installed-state can be true from the `ethereum` probe, but connect still depends on the upstream MetaMask adapter loading and the wallet's TRON behavior.

## 2026-07-06 TronLink Ready Signal Rule

- TronLink installed-state should wait up to 5000ms, matching the upstream TronLink adapter default more closely than the earlier short 1200ms window.
- Legacy TronLink may be accepted when it exposes explicit ready signals:
  - `window.tronLink.ready === true`
  - `window.tronLink.tronWeb.ready === true`
  - `window.tronWeb.ready === true`
- These signals are only accepted after rejecting known non-TronLink provider paths and TokenPocket-linked/shared `tronWeb` objects.
- Do not accept generic unmarked `window.tron` again; that caused TokenPocket/TronLink identity drift.

## 2026-07-06 TronLink TIP-6963 Discovery Rule

- Upstream TronLink desktop detection requests `TIP6963:requestProvider` and listens for `TIP6963:announceProvider` before using legacy globals.
- Local TronLink adapter now mirrors that discovery boundary at a smaller scale:
  - dispatch request event during provider wait.
  - accept announced provider only when `detail.info.name === "TronLink"`.
  - require the announced provider to expose `isTronLink === true` and `request()`.
  - return that provider as a TIP-1193 TronLink provider.
- This should resolve cases where modern TronLink is installed but not exposed through reliable legacy globals.
- TokenPocket should continue to use wallet-specific paths (`window.tokenpocket`, `tokenpocket.tron`) and must not be treated as TronLink merely because generic globals exist.

## 2026-07-06 Metadata Icon Rule

- Every default wallet adapter should expose `metadata.icon` before connect.
- Modal wallet rows can merge icons from the UI catalog, but connected button/account surfaces read the active adapter metadata directly.
- Bridge adapters must receive catalog icons in their stable lazy metadata because upstream wallet packages are not loaded at initial render.
- Injected fallback adapters must also receive catalog icons at config time.
- Default adapter icons now resolve from the client wallet registry: `descriptor.icon ?? WALLET_ICONS[id]` in `packages/client/src/wallets/icons.generated.ts`. UI no longer owns wallet icon lookup.

## 2026-07-06 Phase 2 Bridge Wallets

- Added lazy tronweb3 bridge wiring for:
  - Bybit Wallet via `@tronweb3/tronwallet-adapter-bybit` / `BybitWalletAdapter`
  - Gate Wallet via `@tronweb3/tronwallet-adapter-gatewallet` / `GateWalletAdapter`
  - Binance Web3 Wallet via `@tronweb3/tronwallet-adapter-binance` / `BinanceWalletAdapter`
  - Guarda via `@tronweb3/tronwallet-adapter-guarda` / `GuardaAdapter`
  - OneKey via `@tronweb3/tronwallet-adapter-onekey` / `OneKeyAdapter`
  - Backpack via `@tronweb3/tronwallet-adapter-backpack` / `BackpackAdapter`
  - imToken via `@tronweb3/tronwallet-adapter-imtoken` / `ImTokenAdapter`
  - FoxWallet via `@tronweb3/tronwallet-adapter-foxwallet` / `FoxWalletAdapter`
- Extension-oriented wallets keep narrow injected fallbacks where we already had wallet-specific global paths:
  - Gate: `gatewallet.tron`, `gatewallet.tronLink`
  - Bybit: `bybitWallet.tronLink`, `bybitWallet.tron`
  - Binance: `binancew3w.tron`, `binancew3w.tronLink`
  - Guarda: `guarda`
  - OneKey: `$onekey.tron`, `$onekey.tronLink`
  - Backpack: `backpack.tron`, `backpack.tronLink`
- FoxWallet and imToken are bridge-only for now because they are primarily mobile/app flows and need real device QA before adding any fallback assumptions.
- Ledger remains intentionally out of the default bridge set until the hardware connection flow is designed and tested.
- Known packaging issue: adding more upstream adapters increases the all-in-one browser IIFE size; split optional adapter bundles remain a release blocker before public go-live.

## 2026-07-06 Wallet Platform Audit and Default TRX Balance

- Rechecked upstream `tronwallet-adapter` docs/source before changing wallet platform assumptions:
  - Trust Wallet is a PC extension path in the upstream adapter and wallet reference. Its provider is wallet-specific through `window.trustwallet.tronLink`, with `window.tronWeb` as an extension/global companion path.
  - FoxWallet should stay app/mobile-only for now. The upstream adapter explicitly sets `NotFound` outside mobile browsers, even though the app provider shape is `window.foxwallet.tronLink`.
  - Wallet reference marks FoxWallet and imToken WalletConnect support as unavailable, so they should not inherit QR fallback just because they are mobile wallets.
- Added a default TRX balance resolver at the client layer. If `balance.enabled !== false` and no custom resolver is supplied, `refreshBalance()` now resolves wallet-specific `tronWeb.trx.getBalance(address)` paths and normalizes SUN to formatted TRX.
- Balance provider paths are keyed by wallet id to avoid provider/global collisions:
  - Trust: `trustwallet.tronLink.tronWeb`, then `tronWeb`
  - FoxWallet: `foxwallet.tronLink.tronWeb`
  - Other mapped paths include TronLink, TokenPocket, OKX, Bitget, GateWallet, Bybit, imToken, Binance, Guarda, OneKey, and Backpack.
  - MetaMask TRON is not mapped until the TRON-specific adapter exposes a stable balance provider path.

## 2026-07-07 Trust Wallet vs TronLink Global Collision

- Trust Wallet can expose TRON globals that look close to legacy TronLink, especially through `window.trustwallet.tronLink` and shared `tronWeb` references.
- The TronLink adapter now treats `trustwallet.tron` and `trustwallet.tronLink` as known non-TronLink provider paths.
- The prior TokenPocket-only shared `tronWeb` guard is now generalized across known wallet roots, including Trust. If `window.tronLink.tronWeb` or marked `window.tron.tronWeb` is the same object as a known wallet provider, TronLink must report unavailable instead of connecting to that wallet.
- Regression tests cover:
  - Trust-linked `window.tronLink`
  - Trust-linked TIP-1193 `window.tron` even when `isTronLink: true`

## 2026-07-07 Upstream Adapter Platform and Injection Audit

Source checked: `tronweb3/tronwallet-adapter` adapter directory on GitHub and the installed `@tronweb3/tronwallet-adapter-*` packages under local `node_modules`.

| Wallet | Upstream package | Primary platform | Injected/provider path | Connect request shape | Mobile/deep-link / WalletConnect note |
| --- | --- | --- | --- | --- | --- |
| TronLink | `tronlink` | Extension + TronLink app | `window.tronLink`; legacy `window.tron` only when `isTronLink`; mobile may pair `window.tronLink` with `window.tronWeb` | desktop uses `eth_requestAccounts`; mobile/modern path can use `tron_requestAccounts` | Deep link via `tronlinkoutside://pull.activity`; broad globals make collision guards mandatory |
| TokenPocket | `tokenpocket` | Extension + mobile app | desktop `window.tokenpocket.tron`; mobile can use `window.tokenpocket.tronWeb` / `window.tronWeb`; TIP-6963 provider support exists | desktop uses `eth_requestAccounts`; provider state reads `tronWeb.defaultAddress.base58` | Deep link via `tpdapp://open`; must not be routed through TronLink globals |
| OKX Wallet | `okxwallet` | Extension + OKX app | `window.okxwallet.tronLink` | `tron_requestAccounts` | Deep link `okx://wallet/dapp/url?...`; keep extension fallback path narrow |
| Bitget Wallet / BitKeep | `bitkeep` | Extension + mobile app | mobile `window.bitkeep.tronLink` + `window.bitkeep.tronWeb`; extension support probe also checks `window.tronLink && window.isBitKeep` | desktop uses `wallet.tron.request({ method: "tron_requestAccounts" })`; address from wallet/global `tronWeb` | Deep link `https://bkcode.vip?action=dapp&url=...`; generic `window.tronLink` must be paired with Bitget marker before using |
| Trust Wallet | `trust` | Extension + Trust app | `window.trustwallet.tronLink` | `tron_requestAccounts` | Deep link `https://link.trustwallet.com/open_url?...`; must use Trust-specific fallback before TronLink |
| Gate Wallet | `gatewallet` | Extension + Gate app | extension `window.gatewallet.tron`; Gate app `window.gatewallet.tronLink` | extension uses `eth_requestAccounts`; Gate app uses `tron_requestAccounts` | Deep link to Gate Web3; fallback should prefer app/extension-specific root, not generic globals |
| Bybit Wallet | `bybit` | Extension + Bybit app | `window.bybitWallet.tronLink` | `tron_requestAccounts` | Deep link through Bybit app URL; extension fallback path is wallet-specific |
| Binance Web3 Wallet | `binance` | Extension + mobile / WC-capable upstream | `window.binancew3w.tron`; support probe also checks `window.isBinance` | extension uses provider; upstream can instantiate `WalletConnectAdapter` when no injected provider | This is a true mixed adapter: extension first, WalletConnect fallback only through upstream Binance config |
| Guarda | `guarda` | Extension | root `window.guarda`; request object is `window.guarda.tron`; TRON web helper can be parent `window.guarda.tronWeb` | `window.guarda.tron.request({ method: "eth_requestAccounts" })` returns array address | Needs custom local fallback that merges `guarda.tron` with parent `guarda.tronWeb`; generic injected fallback can miss address |
| OneKey | `onekey` | Extension | `window.$onekey.tron` | `tron_requestAccounts` | Extension-focused |
| Backpack | `backpack` | Extension | `window.backpack.tron`; fallback `window.tron` only when `isBackpack` | `tron_requestAccounts`; chain via `tron_chainId` | Needs wallet-specific fallback; avoid generic `window.tron` unless `isBackpack` |
| FoxWallet | `foxwallet` | Mobile app first | `window.foxwallet.tronLink` inside mobile browser | `tron_requestAccounts` | Deep link `foxwallet://dapp?...`; upstream marks NotFound outside mobile, so keep bridge-only/mobile for now |
| imToken | `imtoken` | Mobile app first | `window.imToken` + `window.tronWeb` | address from `window.tronWeb.defaultAddress.base58`; no request call in connect path | Deep link `imtokenv2://navigate/DappView?...`; keep mobile/app route, no extension assumption |
| MetaMask TRON | `metamask-tron` | Extension + MetaMask mobile webview | `window.ethereum` MetaMask provider; TRON handled through MetaMask TRON adapter/snap flow, not TRON `tronWeb` injection | adapter-specific MetaMask request flow | Do not display as generic EVM connect; only expose TRON-capable adapter behavior and normalized errors |

Implementation implications:

- Default featured extension QA should prioritize wallet-specific roots: TronLink, TokenPocket, OKX, Bitget, Trust, Gate, Bybit, Binance, Guarda, OneKey, Backpack, MetaMask TRON.
- Mobile-first routes should stay separate from generic WalletConnect: FoxWallet and imToken are app/deep-link adapters, not automatic QR fallback wallets.
- WalletConnect remains the common QR route; Binance is the only checked upstream adapter here that explicitly embeds `WalletConnectAdapter` as an adapter-level fallback.
- Collision policy: never accept generic `window.tronLink`, `window.tron`, or `window.tronWeb` for a wallet row unless the selected wallet's own root or marker proves ownership.
- For connect cancellation, UI must treat QR URI generation, QR image rendering, retry timers, and late connect errors as flow-scoped side effects; stale side effects are ignored after back, close, or selecting another wallet.

## 2026-07-07 Shared Wallet Registry

- Added `TRON_WALLET_REGISTRY` in `@tron-wallet-kit/core` as the source of truth for supported TRON wallet metadata.
- Registry fields:
  - `enabled`: controls whether the wallet appears in default catalog/list generation.
  - `platforms`: `extension`, `mobile`, or both.
  - `providerPaths`: wallet-specific injected paths.
  - `conflictMarkers`: provider markers used to reason about global collisions.
  - `mobileDeepLink`: scheme/template metadata for future mobile-first UI.
  - `supportsWalletConnect`: explicit QR/WC fallback eligibility, not inferred from being mobile.
  - `upstreamPackage`: upstream adapter package reference for maintenance.
- UI catalog now derives from enabled registry entries and only adds presentation-specific values such as badges/icons.
- Client default adapter creation now derives the default wallet id list from enabled registry entries and supports `disabledWallets` for release/app-level opt-out without deleting adapter code.
- Ledger is kept in the registry with `enabled: false`; this preserves metadata for a future hardware phase while removing it from the default All Wallets list.
- Bridge adapter configs now consume registry name/homepage/platform/provider-path metadata. Importer functions remain adapter-specific by design because each upstream package has different class exports.

## 2026-07-07 Advanced Wallet List Configuration

- Added advanced `walletList` controls at the UI config layer:
  - `featuredLimit`: default 5, clamped to 1-10.
  - `featuredWallets`: explicit featured wallet id order, clamped to 10.
  - `wallets`: `all` or an allowlist for All Wallets/default rendered list.
  - `disabledWallets`: display-level denylist.
  - `showUnavailable`: hide unavailable wallets when false.
  - `sortAvailableFirst`: defaults true so installed/supported wallets float to the top of All Wallets.
- Featured UX rule:
  - 1-6 wallets render as full rows.
  - 7-10 wallets render as compact 3-column wallet cards to avoid an overlong row list.
  - WalletConnect stays last in featured when present.
- React surfaces now forward `walletList` through `ConnectModalProps`.
- `react-basic` exposes presets for 5 recommended, 9 compact, and 10 compact max, plus All Wallets preset and unavailable-wallet toggle.
- Compact grid status indicators:
  - text badges are intentionally hidden in compact featured cards.
  - installed uses a small dot from `--twk-success`.
  - QR uses a mini QR icon with `--twk-badge-qr-fg` on the neutral badge surface.
  - connecting uses the existing spinner styled by token variables.
  - error uses `--twk-danger` with token-driven foreground/background.
  - not installed has no dot/icon; disabled opacity communicates unavailable state.
- Compact polish:
  - Featured compact mode reuses the All Wallets `twk-wallet-card` surface in a 3-column grid instead of maintaining a separate compact button.
  - Default recommended featured wallets remain 5 row items.
  - The compact preset uses 9 items so compact mode is a balanced 3x3 grid.
  - wallet icons follow the All Wallets card sizing.
  - shared card status indicators are 18px with a 1.5px neutral surface border so installed dots do not overpower wallet icons.
  - installed dots are 8px.
  - QR glyphs render at 12px and use a simplified SVG shape so the badge reads as QR at small size.
  - QR status keeps the neutral badge surface instead of applying `--twk-badge-qr-bg` to the badge container; only the glyph uses `--twk-badge-qr-fg`.
  - QR transport has priority over installed state, so WalletConnect renders the QR icon.

## 2026-07-08 Ledger Optional Peer Notes

- Ledger is represented by a client wallet descriptor with id `ledger`, group `hardware`, platforms `["hardware"]`, and bridge integration.
- The descriptor uses a lazy importer for `@tronweb3/tronwallet-adapter-ledger`; the package is an optional peer of `@tron-wallet-kit/client`, not a bundled hard dependency.
- App-side enablement:

```sh
pnpm add @tronweb3/tronwallet-adapter-ledger
```

- If the optional package is missing or cannot load, the bridge keeps Ledger gracefully unavailable instead of breaking the wallet kit or other wallets.
- Ledger real-device QA is still required: device connected, TRON app open, connect, signMessage, signTransaction, and submitTransaction when `tronweb3Bridge.tronWeb` is configured.

## 2026-07-08 P2 Injected Packaging Migration Plan

- Added detailed migration plan in `Review/P2_INJECTED_PACKAGING_MIGRATION_PLAN.md`.
- Direction:
  - migrate TokenPocket, OKX, Bitget, and Trust from bridge to injected after real extension QA.
  - migrate Gate, Bybit, Binance, Guarda, OneKey, and Backpack in later smaller batches.
  - keep FoxWallet/imToken on hold until mobile/app QA.
  - keep Ledger as optional-peer bridge and MetaMask TRON as opt-in bridge.
- Do not remove upstream optional dependencies until the corresponding injected wallet batch passes real-wallet QA.
- Phase 0 guardrail follow-up:
  - Added injected method fallback coverage for `tron_requestAccounts` -> `eth_requestAccounts`.
  - Added strict provider-root coverage to prevent generic `tronWeb` from satisfying wallet-specific injected descriptors.
  - Extended client icon codegen to support SVG, PNG, and WEBP source icons.
- TokenPocket canary:
  - `packages/client/src/wallets/entries/tokenpocket.ts` now uses `integration: "injected"`.
  - Detection is restricted to TokenPocket-owned roots: `tokenpocket.tron` and `tokenpocket.tronWeb`.
  - Broad generic `tronWeb` fallback was removed to avoid global collision with other installed wallets.
  - Real extension QA passed; `@tronweb3/tronwallet-adapter-tokenpocket` was removed from `@tron-wallet-kit/client` optional dependencies.
- OKX canary:
  - `packages/client/src/wallets/entries/okx.ts` now uses `integration: "injected"`.
  - Detection is restricted to `okxwallet.tronLink`.
  - Real extension QA passed; `@tronweb3/tronwallet-adapter-okxwallet` was removed from `@tron-wallet-kit/client` optional dependencies.
- Bitget canary:
  - `packages/client/src/wallets/entries/bitget.ts` now uses `integration: "injected"`.
  - Detection keeps `getBitgetInjectedProvider()` so parent `bitkeep.tronWeb` and `window.isBitKeep` global-marker cases still work.
  - Provider paths are restricted to Bitget-owned roots: `bitkeep.tronLink` and `bitkeep.tron`.
  - Real extension QA passed after request binding fix; `@tronweb3/tronwallet-adapter-bitkeep` was removed from `@tron-wallet-kit/client` optional dependencies.

## 2026-07-08 React StrictMode Modal Lifecycle Fix

- `react-basic` showed duplicated wallet rows in the modal DOM after React StrictMode remounts.
- Root cause: `TronWalletProvider` recreated/mounted a kit too eagerly and only destroyed `manager`, leaving modal/toast/button DOM controllers behind.
- Fix:
  - `WalletKit` now exposes `destroy()`.
  - `createWalletKit().destroy()` tears down button, toast, modal, manager, and identity cache.
  - `TronWalletProvider` keeps an internally-created kit stable and destroys the full kit on unmount.
- Browser QA confirmed modal rows are back to one visible list of 5 featured wallets on `http://127.0.0.1:5174/react-basic/`.

## 2026-07-08 Bitget Injected Getter Safety

- User reported `Uncaught TypeError: e.logger is not a function` from Bitget injected probing.
- Root cause: a wallet injected object can expose throwing getters/proxy fields; spreading the provider during availability checks executes those getters.
- Fix:
  - Bitget detection now uses safe property reads.
  - Injected provider cloning copies only `request` and `tronWeb` instead of object-spreading extension provider proxies.
  - Generic injected path lookup also ignores throwing getters.
  - `createInjectedTronAdapter().isAvailable()` cannot crash the modal when a provider probe throws.
- Added client regression coverage for a Bitget-like provider with an enumerable throwing `logger` getter.
- Follow-up connect fix:
- Bitget can also throw `e.logger is not a function` during connect if `request` is copied off the injected provider and loses its original `this`.
  - Cloned injected providers now bind `request` to the source provider object.
  - Added regression coverage for a Bitget-like request method that reads `this.logger`.

## 2026-07-08 Trust Injected Canary

- `packages/client/src/wallets/entries/trust.ts` now uses `integration: "injected"`.
- Detection is restricted to Trust-owned roots: `trustwallet.tronLink` and `trustwallet.tron`.
- Existing regression coverage confirms Trust-specific provider wins over shared TronLink globals.
- Real extension QA passed; `@tronweb3/tronwallet-adapter-trust` was removed from `@tron-wallet-kit/client` optional dependencies.

## 2026-07-08 Gate + Bybit Injected Canary

- Phase 1 cleanup:
  - Removed the already-QA'd TokenPocket/OKX/Bitget/Trust upstream packages from `packages/client/package.json` optional dependencies.
  - Ran `pnpm install --ignore-scripts` to update the lockfile.
- Gate Wallet:
  - Gate is now `integration: "injected"` after confirming the earlier failure was caused by Gate not injecting on HTTP localhost.
  - `@tronweb3/tronwallet-adapter-gatewallet` is no longer required for the default client path.
  - Detection remains restricted to Gate-owned roots: `gatewallet.tronWeb`, `gatewallet.tron`, and `gatewallet.tronLink`.
  - Official Gate Wallet API Tron docs prefer `window.gatewallet.tronWeb`, then `window.gatewallet.tron`, then `window.gatewallet.tronLink`.
  - `getGateInjectedProvider()` handles nested `gatewallet.tron` / `gatewallet.tronLink` request providers and can merge parent `gatewallet.tronWeb`.
  - Balance/identity TronWeb lookup also checks `gatewallet.tronWeb`.
  - Disabled-state follow-up:
    - Gate extension does not inject `window.gatewallet` on `http://127.0.0.1`; Gate QA must use an HTTPS origin.
    - Examples now include `pnpm --filter @tron-wallet-kit/examples dev:https` for Gate desktop extension testing.
    - Upstream Gate support is based on `window.gatewallet && window.gatewallet.tronLink`.
    - Gate can inject asynchronously, so the injected descriptor uses a longer availability wait (`availabilityTimeoutMs: 5000`).
    - Gate extension prefers `eth_requestAccounts` before `tron_requestAccounts`.
    - Gate connect must call request accounts before trusting a prefilled `gatewallet.tronWeb.defaultAddress`; parent `gatewallet.request` is merged into child/provider surfaces for this reason.
    - Gate uses an `availabilityProbe` (`hasGateInjectedMarker`) so the UI can show installed from the upstream marker even before the connect provider is fully shaped.
    - Follow-up probe also checks camelCase aliases, Gate EIP-1193 flags, and EIP-6963 announced provider info because Gate is a multi-chain extension.
- Bybit Wallet:
  - `packages/client/src/wallets/entries/bybit.ts` now uses `integration: "injected"`.
  - Detection is restricted to Bybit-owned roots: `bybitWallet.tronLink` and `bybitWallet.tron`.
  - Real extension QA passed; `@tronweb3/tronwallet-adapter-bybit` was removed from `@tron-wallet-kit/client` optional dependencies.

## 2026-07-08 Guarda + OneKey Injected Canary

- Guarda:
  - `packages/client/src/wallets/entries/guarda.ts` now uses `integration: "injected"`.
  - Detection uses `getGuardaInjectedProvider()` plus Guarda-owned roots: `guarda.tron` and `guarda`.
  - `getGuardaInjectedProvider()` no longer object-spreads the injected provider; it safe-reads fields and binds `request` to the source provider, matching the Bitget proxy-safety pattern.
- OneKey:
  - `packages/client/src/wallets/entries/onekey.ts` now uses `integration: "injected"`.
  - Detection is restricted to OneKey-owned roots: `$onekey.tron` and `$onekey.tronLink`.
- Real extension QA passed; `@tronweb3/tronwallet-adapter-guarda` and `@tronweb3/tronwallet-adapter-onekey` were removed from `@tron-wallet-kit/client` optional dependencies.

## 2026-07-08 Binance + Backpack Injected Canary

- Phase 2 cleanup:
  - Removed the already-QA'd Guarda/OneKey upstream packages from `packages/client/package.json` optional dependencies.
  - Ran `pnpm install --ignore-scripts` to update the lockfile.
- Binance Web3 Wallet:
  - `packages/client/src/wallets/entries/binance.ts` now uses `integration: "injected"`.
  - Detection uses `getBinanceInjectedProvider()` and is restricted to Binance-owned root `binancew3w.tron`.
  - Binance's extension provider is not TIP-1193-shaped; the helper maps `getAccount`, `getChainId`, `signMessageV2`, and `signTransaction` into the kit's injected provider shape.
  - Kept `supportsWalletConnect: true` as metadata for later mobile/UI optimization; the default extension path is injected.
  - Real extension QA passed; `@tronweb3/tronwallet-adapter-binance` was removed from `@tron-wallet-kit/client` optional dependencies.
- Backpack:
  - `packages/client/src/wallets/entries/backpack.ts` now uses `integration: "injected"`.
  - Detection is restricted to Backpack-owned roots: `backpack.tron` and `backpack.tronLink`.
  - Real extension QA passed; `@tronweb3/tronwallet-adapter-backpack` was removed from `@tron-wallet-kit/client` optional dependencies.

## 2026-07-08 FoxWallet + SafePal Injected Canary

- FoxWallet:
  - Upstream `@tronweb3/tronwallet-adapter-foxwallet` is app/mobile-oriented and its current adapter marks non-mobile browser contexts as not found, even though the provider shape is `window.foxwallet.tronLink`.
  - FoxWallet official TRON docs also state that TRON is currently mobile-app only and Chrome extension support is coming soon.
  - `packages/client/src/wallets/entries/foxwallet.ts` now uses `integration: "injected"` with roots `foxwallet.tronLink` and `foxwallet.tron`.
  - Detection uses `getFoxWalletInjectedProvider()` so extension variants that place `request` or `tronWeb` on parent `window.foxwallet` can still become active without falling back to generic `window.tronLink` or `window.tronWeb`.
  - Platforms are mobile-only for now, so desktop extension UI should not expect FoxWallet to become installed/active until FoxWallet ships TRON extension support.
  - Keep `@tronweb3/tronwallet-adapter-foxwallet` in optional dependencies until real FoxWallet mobile/app QA is accepted.
- SafePal:
  - Added built-in descriptor `packages/client/src/wallets/entries/safepal.ts`.
  - SafePal has no upstream tronwallet-adapter package in this project; descriptor uses generic injected integration.
  - SafePal TRON docs expose `window.SafePalHook` for `tron_requestAccounts` and `window.tronWeb` for signing/balance, so client now has `getSafePalInjectedProvider()`.
  - The client descriptor intentionally does not use raw `providerPaths: ["SafePalHook"]`; SafePal must go through the composer so `isAvailable()` requires both `SafePalHook` and `tronWeb` and cannot mark a hook-only object as installed.
  - `getSafePalInjectedProvider()` now re-reads `SafePalHook.defaultAddress` after `tron_requestAccounts`, supports SafePal in-app sessions where no request method is exposed, and keeps message signing on `tronWeb.trx.sign(message)`.
  - SafePal icon already exists in `packages/client/src/wallets/icons/safepal.png` and resolves through generated client icon catalog.

## 2026-07-08 WalletConnect QR Dependency Audit

- `@tron-wallet-kit/adapter-walletconnect` does not render or open a WalletConnect/Reown modal. It only creates a WalletConnect TRON session and forwards the `wc:` URI through `onUri`.
- The kit modal owns QR rendering through `@tron-wallet-kit/ui`.
- Dependency audit:
  - `@walletconnect/modal` is not present.
  - `@tronweb3/walletconnect-tron` currently pulls `@reown/appkit` and `@reown/appkit-ui` transitively, including a transitive `qrcode@1.5.3`, even though this kit does not use their modal UI.
  - Keep this as a future optimization candidate: replacing `@tronweb3/walletconnect-tron` with a direct WalletConnect core/universal-provider implementation could reduce UI/modal-related transitive weight, but it is a larger adapter rewrite and should not be mixed into QR layout fixes.
# 2026-07-10 Gate first-connect note

- Gate extension must be tested on HTTPS (`https://127.0.0.1:5174/react-basic/` in local dev), because the provider may not inject on plain HTTP origins.
- Gate uses injected integration with `preferInjectedAddress`, `addressTimeoutMs: 15000`, and `addressSettleMs: 4000`.
- First approval can return from `eth_requestAccounts` before `gatewallet.tronWeb.defaultAddress` is hydrated. The injected adapter now polls the live provider during the settle window and resolves once the address appears, avoiding the close-and-connect-again path.
- Follow-up: Gate may hydrate the address on refreshed global paths rather than the cloned provider object, and may expose the value as `defaultAddress` string/object, `address`, `base58`, or `selectedAddress`. The injected adapter now normalizes those shapes and rereads configured provider paths while settling.
