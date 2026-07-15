# Release Checklist

## Per Phase

- [x] Update `PROJECT_MEMORY.md`.
- [x] Update relevant `Review/` notes.
- [x] Run typecheck for touched packages.
- [x] Run tests for touched packages.
- [x] Run build for touched packages.
- [x] Record commands and results.

## Before First Public Release

- [x] Confirm package manager and lockfile.
- [x] Confirm package names.
- [x] Confirm workspace layout.
- [x] Confirm build output formats.
- [x] Confirm browser/CDN IIFE global name.
- [x] Confirm React integration API.
- [x] Confirm Next.js integration API.
- [x] Confirm adapter contracts.
- [x] Confirm theme token contract.
- [ ] Confirm wallet icon brand/source licensing for generated SVG data URIs.
- [x] Confirm docs for HTML legacy/CDN usage.
- [x] Confirm docs for React usage.
- [x] Decide all-in-one browser IIFE vs split adapter browser bundles.
- [x] Confirm changelog/release process.

## Quality Gates

| Gate | Command | Status |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | Passed on 2026-07-08 |
| Unit tests | `pnpm test` | Passed on 2026-07-08 (122 tests passed) |
| Build | `pnpm build` | Passed on 2026-07-08 |
| Lint | `pnpm lint` | Passed on 2026-07-08 |
| Browser smoke | `http://127.0.0.1:5174/react-basic/` browser smoke | Passed on 2026-07-06 for React light/dark/mobile; real-wallet flows still manual |
| UI visual QA | Screenshots in `Review/screenshots/react-basic-p9-*.png` | Passed on 2026-07-06 for automated visual smoke |
| TronLink real-wallet QA | TBD | Pending |
| WalletConnect real-wallet QA | TBD | Pending |
| Client adapter-event sync | `pnpm --filter @tron-wallet-kit/client test` | Mock-tested on 2026-07-03 |
| UI surface foundation | `pnpm --filter @tron-wallet-kit/ui test` | Unit-tested on 2026-07-03 |
| React surface wrappers | `pnpm --filter @tron-wallet-kit/react test` | Server-render tested on 2026-07-03 |
| Workspace test aliases | `vitest.config.ts` | Added on 2026-07-03 so tests resolve package source instead of stale `dist` |
| HTML/CDN docs | `docs/HTML_CDN_USAGE.md` | Drafted on 2026-07-03 with provided WalletConnect project ID |
| React docs | `docs/REACT_USAGE.md` | Drafted on 2026-07-03 with provided WalletConnect project ID |
| Examples typecheck | `pnpm --filter @tron-wallet-kit/examples typecheck` | Passed on 2026-07-03 |
| Examples build | `pnpm --filter @tron-wallet-kit/examples build` | Passed on 2026-07-03 with expected HTML global-script and large WalletConnect chunk warnings |
| Examples dev server smoke | `Invoke-WebRequest` against `/`, `/react-basic/`, `/html-cdn/`, `/vendor/tron-wallet-kit.iife.min.js` | Passed on 2026-07-03 |
| UI QR/toast foundation | `pnpm --filter @tron-wallet-kit/ui test` | Unit-tested on 2026-07-03 |
| Website docs build | `pnpm --filter @tron-wallet-kit/website build` | Passed on 2026-07-03 |
| Full workspace build after website/UI updates | `pnpm build` | Passed on 2026-07-03 with expected WalletConnect/IIFE/chunk and HTML global-script warnings |
| Release readiness full local gate | `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` | Passed on 2026-07-14 |
| Release readiness publish dry-run | `pnpm publish --dry-run --no-git-checks --tag beta` | Passed on 2026-07-14 for all 10 public packages |
| Browser IIFE release size | `Get-ChildItem packages/browser/dist/tron-wallet-kit.iife*.js` | `tron-wallet-kit.iife.js` 3,459,117 bytes; `tron-wallet-kit.iife.min.js` 1,737,483 bytes |
| Public package tarball size check | `pnpm pack --pack-destination $env:TEMP/twk-release-size-check` | Passed on 2026-07-15; browser tarball 4,057,415 bytes, client 193,361 bytes, ui 175,653 bytes |
| Public package manifest audit | Node manifest check | Passed on 2026-07-15: version, exports, types, files, sideEffects, publishConfig, README present for all 10 public packages |
| Examples dev server smoke after QR/toast updates | `Invoke-WebRequest` against `http://127.0.0.1:5174/`, `/react-basic/`, `/html-cdn/`, `/vendor/tron-wallet-kit.iife.min.js` | Passed on 2026-07-03 |
| Website dev server smoke | `Invoke-WebRequest` against `http://127.0.0.1:5176/`, `/docs/introduction`, `/docs/configuration/theming` | Passed on 2026-07-03 |
| TRX Domains identity resolver | `pnpm --filter @tron-wallet-kit/client test` | Mock-tested on 2026-07-03 |
| Identity docs build | `pnpm --filter @tron-wallet-kit/website build` | Passed on 2026-07-03 |
| Full workspace after identity integration | `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` | Passed on 2026-07-03 |
| Identity docs/dev smoke | `Invoke-WebRequest` against `http://127.0.0.1:5176/docs/configuration/identity` | Passed on 2026-07-03 |
| Adapter display metadata | TronLink/WalletConnect adapter tests | Icon/type/group metadata tested on 2026-07-03 |
| Core architecture primitives | `pnpm --filter @tron-wallet-kit/core test` | WalletManager/session/events/transactions mock-tested on 2026-07-03 |
| Architecture phase typecheck | Per-package `pnpm --filter <pkg> typecheck` | Passed on 2026-07-03; root `pnpm typecheck` timed out in this environment |
| Architecture phase tests | `pnpm test` | Passed on 2026-07-03 |
| Architecture phase lint/build | `pnpm lint`, `pnpm build` | Passed on 2026-07-03 |
| Brand-named browser IIFE | `pnpm --filter @tron-wallet-kit/browser build`; VM smoke for `tron-wallet-kit.iife.js` and `tron-wallet-kit.iife.min.js` | Passed on 2026-07-04 |
| Examples on default port 5174 | `Invoke-WebRequest` against `http://127.0.0.1:5174/`, `/react-basic/`, `/html-cdn/`, `/vendor/tron-wallet-kit.iife.min.js` | Passed on 2026-07-04 |
| P9 browser/IIFE parity | `pnpm build`; check `packages/browser/dist/tron-wallet-kit.iife.js` and `tron-wallet-kit.iife.min.js` | Passed on 2026-07-06 |
| Ledger descriptor optional peer | `pnpm --filter @tron-wallet-kit/client test` | Descriptor/catalog tested on 2026-07-08; real-device QA pending |

## Ledger Hardware QA

- [ ] Install `@tronweb3/tronwallet-adapter-ledger` in a test app.
- [ ] Confirm Ledger appears with hardware metadata and icon.
- [ ] Confirm missing optional peer does not break kit startup or other wallet connections.
- [ ] Connect with a real Ledger device and the TRON app open.
- [ ] Test `signMessage`.
- [ ] Test `signTransaction`.
- [ ] Test `submitTransaction` with `tronweb3Bridge.tronWeb` configured.

## Release Notes

- `0.1.0-beta.0` release preparation started on 2026-07-14.
- Root `LICENSE`, `README.md`, `CHANGELOG.md`, package READMEs, CI workflow, beta versions, and package publish metadata have been added.
- Full local gates passed on 2026-07-14: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- Package publish dry-runs passed on 2026-07-14 for all public packages with `pnpm publish --dry-run --no-git-checks --tag beta`.
- Public package manifest audit passed on 2026-07-15 for all 10 public packages: version, exports, types, files, sideEffects, publishConfig, and README are present.
- Public package tarball size check passed on 2026-07-15 for all 10 public packages.
- Browser IIFE release size recorded on 2026-07-15: unminified 3,459,117 bytes; minified 1,737,483 bytes.
- Public stable release is still not ready; publish first with npm tag `beta` after live WalletConnect QA.
