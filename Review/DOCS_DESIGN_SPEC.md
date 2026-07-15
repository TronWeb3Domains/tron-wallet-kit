# TRON Wallet Kit — Docs Design Spec

Date: 2026-07-15. Owner: Claude. Applies to the VitePress site under `website/`.

Direction (approved): clean, reading-first, generous whitespace, flat (no gradients/heavy
shadows), full light/dark parity. Brand = TRON red. A restrained **"TRON spectrum"** of supporting
hues that **encode meaning** (not decoration) — colorful but disciplined, unlike a rainbow-gradient
site. Sentence case everywhere. Two font weights (400 / 500).

## 1. Color tokens

Brand primary (both modes anchored on TRON red):

| Token | Light | Dark |
|---|---|---|
| brand (primary) | `#EF0027` | `#FF4D5E` |
| brand-hover | `#D0001F` | `#FF6673` |

Spectrum — each hue carries a fixed meaning:

| Meaning | Hue | Light | Dark |
|---|---|---|---|
| success / installed | teal | `#0CA678` | `#2FD19E` |
| beta / warning | amber | `#E8920C` | `#F6B54A` |
| info / tip | blue | `#3B82F6` | `#5C9DFF` |
| accent2 / code keyword | violet | `#7C6BF0` | `#9A8BFF` |
| featured / highlight | coral | `#FF6A3D` | `#FF7E52` |

Surfaces / text / border:

| Token | Light | Dark |
|---|---|---|
| page bg | `#FFFFFF` | `#0E0F12` |
| surface (card/alt) | `#F7F7F8` | `#17181C` |
| text primary | `#1A1A1E` | `#F2F2F4` |
| text secondary | `#6B6B72` | `#9A9AA2` |
| border | `#ECECEF` | `#26272C` |

Rule: text on a colored chip uses the **darkest shade of that same hue** (light) or a light shade
(dark) — never plain black/white. Every color must pass a "readable on near-black?" check in dark.

## 2. VitePress variable mapping (`custom.css`)

Map the tokens onto VitePress theme vars so the default theme adopts the brand automatically:

- `--vp-c-brand-1/2/3` → brand + hover + darker.
- `--vp-c-brand-soft` → red tint for hover backgrounds.
- Custom vars for the spectrum: `--twkd-teal`, `--twkd-amber`, `--twkd-blue`, `--twkd-violet`,
  `--twkd-coral` (light values under `:root`, dark under `.dark`).
- Code block theme tuned to the spectrum (keywords = violet, strings = teal).
- Home hero name uses the brand; buttons use brand fill + soft outline.

## 3. Components & conventions

- **Wallet tier badges** (pill): `live` = teal, `beta` = amber, `qa` = neutral gray. Component
  `WalletTable.vue` renders these from `data/wallets.ts`.
- **Callouts**: reuse VitePress custom containers — `::: tip` (blue), `::: warning` (amber),
  `::: danger` (brand red), plus a custom `::: trx` (teal) for TRON-specific notes. Left accent bar
  in the hue, tinted background, no rounded single-side border.
- **Code blocks**: dark surface in both modes for contrast; syntax colors from the spectrum.
- **Cards / feature grid**: `surface` bg, hairline border, 12px radius, a small hue icon per card.
- **Live component embeds** (`ConnectDemo`, `ThemeBuilder`) sit on a `surface` panel with padding so
  they don't float; wrapped in `<ClientOnly>`.
- Icons: inline SVG or a light icon set; keep decorative icons `aria-hidden`.

## 4. Typography & layout

- Font: Inter (or system stack) for UI/body; monospace for code. Body 16px / line-height 1.7.
- Headings h1 22 / h2 18 / h3 16, weight 500. Sentence case; no terminal punctuation on headings.
- Standard VitePress reading width; embed live components where a picture beats prose.

## 5. Accessibility

- WCAG AA contrast for text on brand/spectrum chips in both modes.
- Dark mode is mandatory and tested for every colored element.
- Focus rings visible; interactive live components keyboard-operable.

## 6. Do / don't

- Do: use color to encode meaning (tier, callout type, syntax). Keep pages calm and spacious.
- Don't: rainbow-gradient hero, more than one accent per section, colored text on colored fills,
  hardcoded hex in page content (use theme vars / component classes).
