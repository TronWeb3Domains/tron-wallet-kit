# Hallmark audit — TRON Wallet Kit UI/UX

Date: 2026-07-17. Mode: diagnosis only (no edits), following the `hallmark audit` rubric.

> Note: the Hallmark skill (`nutlope/hallmark`) is a Claude Code skill and is **not loaded
> in this Cowork session**, so this is not the tool's own output. It applies Hallmark's
> published ruleset — Foundations (Type, Colour, Space, Motion, Voice, Layout, Hierarchy,
> Restraint) and the anti-pattern catalogue (#01 purple-gradient hero, #02 Inter as
> display, #03 centred everything, #04 icon-tile feature card, #05 the AI nav) — to the
> actual code. Two surfaces audited: **A. the SDK injected UI** (connect modal, account
> panel, button, toast) and **B. the docs website** (VitePress).

## Verdict

The **SDK UI is close to Hallmark-clean** — real ease-out motion, reduced-motion support,
a token architecture, a semantic colour system, mobile bottom-sheet. Its issues are
*restraint* (too many knobs) and *brand coherence* (ships blue, not TRON red) plus a muddy
weight ladder.

The **docs website is the weak surface**: it's a stock VitePress home template, which
trips three catalogue anti-patterns at once (#05 AI nav, #03 centred template, #04
icon-tile features) and #02 Inter-as-everything. For a product whose pitch is "beautiful
by default / refuses to look generated," the marketing page currently looks generated. Fix
the site first — it's the highest-leverage, most-visible gap.

---

## Ranked punch list

### HIGH

**H1 — The docs home is a stock VitePress template (#03 + #04 + #05 at once).**
`website/index.md` uses `layout: home` with the default hero (centred name + tagline +
brand/alt buttons) and a 6-up `features` grid rendered as VitePress `VPFeature` cards
(rounded rect, icon in a brand-soft coloured square — `custom.css:84` literally styles
`.VPFeature .icon { background: var(--vp-c-brand-soft) }`). The nav is the default
wordmark-left / inline-links / GitHub-right / sticky / hairline-border shape.
*Hallmark:* this is the exact "template page" the skill exists to prevent — the AI nav
(#05), centred-everything (#03), and the icon-tile feature card (#04). Give the home a
genre-appropriate nav archetype, bias the hero layout (asymmetric, not centred), and
replace the uniform icon-tile grid with asymmetric feature blocks that lead with type.

**H2 — Inter as display *and* body, everywhere (#02).**
SDK default font stack is `Inter, "Inter var", ui-sans-serif, system-ui…`
(`themes.ts:3-4`); the website inherits VitePress's Inter with no imported display face
and no pairing. One family doing both jobs is the "template page" type tell.
*Hallmark:* pair a distinctive display face with a refined body (two faces minimum). For
the **site**, add a display face for the hero/H1s. For the **SDK**, a wallet component
shouldn't hard-impose Inter on host dApps — default `--twk-font-family` to `inherit` (adopt
the host's type) and offer an optional display pairing, rather than forcing Inter.

**H3 — Ships blue, not TRON (brand incoherence).**
The default SDK theme accent is `#0988f0` (blue) in both light and dark
(`themes.ts:200,218,208,226`), while the docs brand is TRON red `#ef0027`
(`custom.css:3-4`). Out of the box, the connect button/modal a dApp drops in looks blue —
off-brand for a "TRON-native" kit, and inconsistent with the marketing site.
*Hallmark (Colour — one anchor hue):* make the default accent the TRON red anchor so the
zero-config experience is on-brand and matches the docs. Keep blue as a preset.

### MEDIUM

**M1 — Font-weight ladder is muddy (Hierarchy).**
`styles.ts` uses seven weights: 400, 500, **560**, 600, **650**, 700, 800. Hallmark wants a
weight ladder readable in two seconds (≈display / body / label). The off-scale 560/650 add
noise without a clear role.
*Fix:* collapse to 3–4 intentional steps (e.g. 400 body, 500 label, 600/700 display); drop
560 and 650.

**M2 — Preset sprawl, with duplicates (Restraint).**
21 named theme presets (`themes.ts:6-64`), several near-identical — **`nile` and `ocean`
are byte-for-byte identical**; `energy`/`tron-energy` and `nile`/`ocean` overlap heavily.
Hallmark's restraint principle: consistency comes from removing knobs, not adding them.
*Fix:* cut to a curated set (e.g. `light`, `dark`, `tron`, `tron-energy`, `midnight`,
`minimal`, plus 1–2 accents); delete exact duplicates; let `lightTheme()/darkTheme()`
factories + tokens cover the long tail instead of 21 baked presets.

**M3 — Colour foundation is hex, not OKLCH (Colour).**
All tokens are hex/`rgba` (`themes.ts`), no OKLCH. Hallmark specifies OKLCH palettes so
lightness/chroma stay perceptually even across a ramp. Low functional impact today, but it
makes principled tint/shade generation (and the theme builder's ramps) harder.
*Fix:* express the anchor + neutrals in OKLCH; derive tints via consistent lightness steps.

### LOW

**L1 — Decorative accent gradients on identity/fallback icons.**
`linear-gradient(135deg, var(--twk-accent)…)` and `radial-gradient(circle at 28% 24%…)`
are used for avatar/fallback-icon fills (`styles.ts`). Not the #01 gradient-hero slop
(none present) and acceptable for generated avatars — just confirm no gradient leaks onto
CTAs/pills (Hallmark: solid fill or outline on buttons, single hue).

**L2 — Radius values not a single named scale (Space).**
Across presets radius spans 4/6/8/10/12/14/16/20/24/28px. Each preset is internally
consistent, but `10` breaks the multiple-of-4 rhythm.
*Fix:* snap to a named 4-based scale (4/8/12/16/20/24) if you want strict Hallmark "Space".

---

## What's already Hallmark-clean (keep)

- **Motion:** `cubic-bezier(.25, 1, .5, 1)` (a proper exponential-ish ease-out) and two
  `prefers-reduced-motion` blocks (`styles.ts`) — matches Hallmark Motion exactly.
- **Colour system (docs):** one anchor hue (TRON red) plus a *semantic* spectrum
  (teal/amber/blue/violet/coral, each encoding meaning) with full light/dark
  (`custom.css:9-52`) — this is the right instinct; no gradient hero.
- **No #01 slop:** no purple→pink hero gradient anywhere.
- **Token architecture:** `--twk-*` CSS variables + factories give a clean theming surface.
- **Mobile bottom-sheet:** real sheet treatment (`@media 480px`, safe-area, `100dvh`).

## Suggested order

1. **H1** rebuild the docs home off the stock VitePress template (biggest visible win).
2. **H3** switch default accent to TRON red; **H2** default SDK font to `inherit` + add a
   site display face.
3. **M1/M2** tidy the weight ladder and prune presets (delete `ocean` duplicate).
4. **M3/L1/L2** foundation polish (OKLCH, radius scale) when convenient.

All items are diagnosis only — no code changed. Pair this with a `hallmark redesign` pass
on `website/index.md` when the skill is installed locally.
