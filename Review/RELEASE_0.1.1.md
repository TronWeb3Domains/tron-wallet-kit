# TRON Wallet Kit v0.1.1

Patch release for browser module loading, Ledger connection UX, SafePal/Trust provider compatibility,
and website subpath deployment. All 10 public packages are versioned together at `0.1.1` under `latest`.

## Changes

- Fix browser-resolvable lazy imports for Ledger, GasFree SDK, and shared TronWeb.
- Keep Ledger preparation and address approval in the kit's panel, without stacking upstream modals.
- Retry failed bridge imports and preserve actionable device error messages.
- Add modern SafePal extension/in-app providers and message V2 signing, preserving legacy hook support.
- Prevent SafePal aliases from being mistaken for TronLink.
- Prefer Trust's authorized mobile provider and wallet-owned balance instances.
- Deploy website/docs under `/tron-wallet-kit/`, including custom navigation links.
- Update package READMEs, wallet catalog, and integration troubleshooting.

## Integration Notes

- Ledger uses the first TRON account and verifies its address on-device. The upstream legacy
  WebHID package needs the scoped base-transport override in the client README. This workspace
  applies it, but consuming npm apps must configure it themselves.
- GasFree is optional. Bundler apps need `@gasfree/gasfree-sdk` for local derivation. Plain HTML/CDN
  users should configure a backend provider API for both address and balance; the IIFE keeps
  optional SDK and TronWeb modules external.
- The standalone IIFE also leaves the Ledger SDK external. Hardware connections require a
  bundled entrypoint or browser-resolvable adapter module.
- TIP-712 typed-data signing and direct SafePal app-opening deeplinks are not included.
- Automated tests and browser mocks do not replace real-wallet/device approval and signing QA.
- The installed production/peer dependency tree still reports security advisories. In this
  workspace, all five critical advisories affect the auto-installed Next.js 16.2.10 peer;
  Next.js itself is not bundled in this kit's package tarballs. Deployment projects must audit
  their own dependency versions. This patch does not claim a clean dependency security audit.

## Validation

Release checks: lint, workspace typecheck, workspace tests, workspace build (including browser/IIFE,
examples, and website), package tarball audit, and browser bundle smoke checks.
All 219 unit tests passed. Knip, clone detection threshold, and dependency-cycle checks also passed.
