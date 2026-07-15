# TRON Wallet Kit — Website Blueprint (Claude-owned)

Date: 2026-07-15
Owner: **Claude (Cowork)** builds the site content + components under `website/`.
Codex owns the SDK exports the pages consume and the **dev servers** (see §6).

Goal: a docs + demo site in the spirit of RainbowKit/ConnectKit — a developer opens one URL,
sees the connect experience live, and copy-pastes a working integration. Positioning per
`TRON_CONNECTKIT_MASTERPLAN.md`: a polished UX/DX layer, **not** an adapter-standard competitor.

Homepage direction is approved via the hero mockup (nav + hero + live connect button + wallet
modal preview + 3-line snippet + feature grid, TRON-red accent, light/dark).

---

## 1. Stack & structure

- VitePress (already scaffolded at `website/`, dev on `127.0.0.1:5174`).
- Keep default theme + a light custom layer: TRON-red accent (`--vp-c-brand` → `#e24b4a`),
  Inter/system font, rounded controls. A custom home layout for the hero.
- Live UI on doc pages is rendered by a small set of Vue client-only components that mount the
  real kit from the local workspace build (see §4). Must be SSR-safe (`<ClientOnly>`).

Proposed tree under `website/`:

```
website/
  .vitepress/
    config.ts              # nav + sidebar (see §3)
    theme/
      index.ts             # extend default theme, register components
      custom.css           # TRON accent + tokens
      components/
        ConnectDemo.vue     # live TronConnectButton + modal
        ThemeBuilder.vue    # interactive token editor + export
        WalletTable.vue     # catalog table from a data file
        CodeConfig.vue      # renders the current demo config as a snippet
  index.md                 # home (hero, features, CTA) — custom layout
  docs/
    introduction.md
    quick-start.md
    frameworks/{react,next,vanilla,html-cdn}.md
    core/{config,provider,connect-button,hooks}.md
    configuration/{theming,walletconnect,identity,localization}.md
    wallets/{catalog,status,contributing}.md
    transactions/{overview,send-trx,smart-contract,reads}.md
    auth/sign-in-with-tron.md
    troubleshooting.md
    migration-from-tronwallet-adapter.md
    api/{react,client,ui,core}.md
  demo.md                  # deployed public playground page
  data/wallets.ts          # catalog data (id, name, platforms, support level, notes)
```

---

## 2. Page-by-page outline (content Claude will write)

### Home (`index.md`)
Hero (headline, subhead, "Get started" + "Live demo" CTAs, npm line), a **live** `ConnectDemo`,
the 3-line snippet, feature grid (beautiful default / hooks / theming / `.trx` identity /
WalletConnect / lightweight), a "who it's for" line, footer links. Matches the approved mockup.

### Introduction (`docs/introduction.md`)
What it is, the positioning (UX/DX layer on top of TRON wallet patterns; not replacing
`tronweb3/tronwallet-adapter`), when to use it, package map, support levels at a glance.

### Quick start (`docs/quick-start.md`)
Fastest React path: install → `getDefaultConfig` → `TronKitProvider` → `TronConnectButton`. A live
`ConnectDemo` beside the snippet. Link out to per-framework guides.

### Frameworks
- `react.md` — provider, button, hooks, custom UI from hooks, theming hand-off.
- `next.md` — App Router, `"use client"` boundaries, SSR safety, dynamic import of the provider.
- `vanilla.md` — `createTronWalletKit`, `openModal`, session/events, no framework.
- `html-cdn.md` — IIFE `<script>` drop-in (note the `lite` vs `full` bundle), Buffer polyfill.

### Core concepts
- `config.md` — `getDefaultConfig` options (appName, walletConnectProjectId, network, wallets,
  featured/rank, identity, balance, locale).
- `provider.md` — `TronKitProvider` props (config, theme, authenticationAdapter, locale).
- `connect-button.md` — `TronConnectButton` props + `useConnectModal`/`useAccountModal`.
- `hooks.md` — reference for every hook with signatures + examples.

### Configuration
- `theming.md` — token model (`--twk-*`), `lightTheme()/darkTheme()` factories, presets
  (accent/radius/font), + embedded **ThemeBuilder**.
- `walletconnect.md` — obtain/inject `projectId` (never hardcode), network, mobile QR flow,
  required vs optional namespaces note.
- `identity.md` — `.trx` name/avatar resolution, account panel, caching, TLD support.
- `localization.md` — locale/label overrides (en/vi shipped), how to add a locale.

### Wallets
- `catalog.md` — `WalletTable` from `data/wallets.ts`: name, platforms, support level
  (`live`/`beta`/`qa`), detect/connect notes, install links.
- `status.md` — what "installed / checking / not installed / unavailable / QR" mean.
- `contributing.md` — Path A PR / Path B external package (from `WALLET_ADAPTER_ORG_SPEC`).

### Transactions
- `overview.md` — build → sign → broadcast model; why not `contract.method().send()` as primary.
- `send-trx.md`, `smart-contract.md`, `reads.md` (getTransaction/info, resources, balance).

### Auth
- `sign-in-with-tron.md` — `createTronAuthenticationAdapter`, the SIWT message format, modal
  sign-in step, server verify example.

### Troubleshooting (`docs/troubleshooting.md`)
Namespace collision / TronLink "not installed" on multi-wallet browsers; Gate HTTPS injection;
WC "cancelled in wallet" (namespace mismatch, not user cancel); "not installed" vs "unavailable";
first-connect (Bitget/SafePal); TronGrid API key / rate limits; mobile vs in-app browser.

### Migration (`docs/migration-from-tronwallet-adapter.md`)
Side-by-side: `tronwallet-adapter` usage → kit config + hooks. Emphasize "sits on top".

### API reference (`docs/api/*`)
Typedoc-generated from public types for `react`, `client`, `ui`, `core`. Codex wires the typedoc
build; Claude curates intros + examples.

### Demo (`demo.md`)
The deployed public playground (also usable locally): connect modal, theme + accent/font switch,
featured + All Wallets, WC QR, account panel (copy address, address QR, TRX balance, `.trx`
identity), sign message, send TRX on testnet, tx toast, and a **live config snippet**. No real WC
projectId in source — read from env.

---

## 3. VitePress nav + sidebar (replace current `config.ts`)

Nav: Docs · Wallets · Theme · Demo · GitHub. Sidebar groups: Guide (Introduction, Quick start,
Frameworks), Core (Config, Provider, Connect button, Hooks), Configuration (Theming, WalletConnect,
Identity, Localization), Wallets (Catalog, Status, Contributing), Transactions, Auth (Sign-In With
TRON), Reference (Troubleshooting, Migration, API). The current `Examples` external link →
`http://127.0.0.1:5173/` stays for local dev; production points to the deployed demo.

---

## 4. Custom components Claude will build (client-only, SSR-safe)

- `ConnectDemo.vue` — mounts the real `TronKitProvider` + `TronConnectButton` from the workspace
  build so the docs show the live experience. Wrapped in `<ClientOnly>`; WC projectId from env,
  omitted if absent (WC simply hidden).
- `ThemeBuilder.vue` — controls for themeName / accent / radius / font / light-dark; live preview of
  modal states; **export** the config object + `--twk-*` overrides (copy button). Emits exactly what
  `lightTheme()/darkTheme()` accept.
- `WalletTable.vue` — renders `data/wallets.ts` with support-level badges.
- `CodeConfig.vue` — turns the current demo/theme selection into a copy-paste snippet.

Dependency: these import the built local packages. Requires the workspace to be built first (§6).

---

## 5. Design direction

- TRON-red accent `#e24b4a` (works light/dark), neutral surfaces, rounded controls, generous
  whitespace, flat (no gradients/shadows). Sentence case everywhere. Dark-mode parity mandatory.
- Homepage hero = the approved mockup. Doc pages = standard VitePress reading width with live
  component embeds where a picture beats prose.

---

## 6. Running the site locally — **instructions for Codex**

The docs/demo import the built workspace packages, so build first, then run the servers.

```powershell
# 1. install + build all packages (produces dist/ the site imports)
pnpm install
pnpm build

# 2a. docs site (VitePress) — http://127.0.0.1:5174/
pnpm --filter website dev
#   (script: vitepress dev --host 127.0.0.1 --port 5174)

# 2b. examples / live demo app (Vite) — http://127.0.0.1:5173/
pnpm --filter <examples-package-name> dev
#   the repo already exposes:  npm.cmd run dev:vanilla  (127.0.0.1:5173)
#   run whichever example the demo page links to.
```

Notes for Codex:
- **Add the kit as a website dependency** so live embeds (`ConnectDemo`, `ThemeBuilder`) can import
  it: add `"@tron-wallet-kit/react": "workspace:*"` to `website/package.json` and `pnpm install`.
  Until this lands, the docs pages render fine (they are markdown), but the live component embeds are
  deferred. Claude has written all the markdown pages that do NOT need the SDK.
- Keep **both** servers up while Claude iterates: `5174` (docs) and `5173` (examples/demo).
- Rebuild the changed package (`pnpm --filter @tron-wallet-kit/react build`) when the SDK surface
  changes so the site's live components pick it up. OneDrive file-watching can lag — a dev restart
  is the reliable refresh.
- Expose an env var for the WalletConnect projectId used only by the local demo (e.g.
  `VITE_WC_PROJECT_ID` / `WEBSITE_WC_PROJECT_ID`); **never commit a real id**. If unset, WC is
  hidden and the rest of the site still works.
- The site depends on Phase 1–2 SDK exports (`getDefaultConfig`, `TronKitProvider`,
  `TronConnectButton`, hooks, `lightTheme/darkTheme`). Until those land, Claude builds pages against
  the current `createWalletKit` surface and swaps to the new API when ready.
- Please confirm the exact examples package name/script so the demo nav link and these commands
  match (`dev:vanilla` at `5173` is assumed).

---

## 7. Build order for the website workstream

1. Codex: confirm dev servers run (`5174` docs, `5173` examples) and expose the demo WC env var.
2. Claude: custom theme layer + home hero + Introduction + Quick start (against current API).
3. Claude: Frameworks + Core concepts + Configuration pages; wire `ConnectDemo`.
4. Claude: `ThemeBuilder` + Wallets catalog + Troubleshooting + Migration.
5. Claude: Transactions + Auth pages once tx helpers/SIWT land.
6. Claude + Codex: deploy demo (`trxdomains.xyz`), link from README/home.
