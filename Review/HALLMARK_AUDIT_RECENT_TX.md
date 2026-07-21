# Hallmark audit — Recent transactions & Activity

Date: 2026-07-17. Mode: diagnosis only (`hallmark audit` rubric). Files:
`packages/ui/src/account-panel.ts`, `packages/ui/src/styles.ts`.

## Verdict

The **Activity view** (full list, `createTransactionHistoryPanelHtml` +
`createActivityTransactionRowHtml`) has been redesigned and is **largely slop-free**:
meaningful icon by `kind`/`direction`, structured `title`, signed `amountText`, direction
badge, month grouping, sentence-case labels. Good.

The **compact "Recent transactions"** panel (`createTransactionRowHtml`, the `.twk-tx-*`
styles) was **not** brought along. It is still the generic template row — and now it looks
**inconsistent** with the Activity list one tap away. That mismatch is the slop the eye
catches. Fix = make the compact row a condensed version of the Activity row, and de-slop
its header.

---

## Punch list — compact Recent transactions (the slop)

### HIGH

**H1 — ALL CAPS section header.** `.twk-tx-header` (`styles.ts:1341`) renders
"Recent transactions" with `text-transform: uppercase; letter-spacing: .07em;
font-weight: 650`. Hallmark: never ALL CAPS. → sentence case, normal spacing, weight 500.
(The Activity view already uses sentence case — the compact panel is the outlier.)

**H2 — Meaningless status-dot icon.** `.twk-tx-icon` (`styles.ts:1466`, render
`account-panel.ts:205`) is a 24px circle tinted only by `status` (success/failed/pending)
with a tiny check/x/spinner. It says nothing about *what* the transaction was — the classic
"colored blob" tell. Activity already has meaningful `data-kind`/`data-direction` icons
(`styles.ts:1608`+). → reuse the Activity icon (direction/kind + badge) at a smaller size.

**H3 — Raw monospace hash as the content line.** `.twk-tx-hash` (`styles.ts:1516`, render
`account-panel.ts:206`) shows the truncated tx hash (`mock-178…749999`) in monospace as the
secondary line. Users don't read hashes — this is dev-placeholder slop. → replace with a
human subtitle (counterparty / resource / status), exactly like Activity's `twk-activity-meta`.

**H4 — Free-text label, no amount/direction/token.** The row shows `transaction.label`
("Mock TRX transaction") and, on the right, only a "View ↗" icon or the raw status word
(`account-panel.ts:200-206`). No signed amount, no token, no direction — the opposite of the
Activity row. → show the structured `title` + signed `amountText` (+ date), same model.

### MEDIUM

**M1 — Muddy weight ladder.** `.twk-tx-header` 650, `.twk-tx-count` 700, `.twk-tx-status`
650, `.twk-tx-link` 650 (`styles.ts:1348,1387,1528,1538`). Off-scale weights. → 400/500 only.

**M2 — "View" affordance is a bare external-link glyph.** `.twk-tx-link` shows just an
icon with no hit-label; the whole row is already the link. Redundant/ambiguous. → drop the
separate glyph or move the ↗ next to the date (as Activity does).

### LOW

**L1 — Count pill.** `.twk-tx-count` "9+" tiny 700-weight pill (`styles.ts:1380`) — minor
noise; fine to keep but lighten weight to match.

---

## Residual nits — Activity view (mostly clean)

- **A1 — Amount fallback can render a bare token.** `fallbackActivityAmount`
  (`account-panel.ts:290`) returns just `"TRX"`/`"USDT"`/`"-"` when no `amountText` is set,
  so the right column can show a token with no number. → when there's no amount, show nothing
  (or the status), not a lone ticker.
- **A2 — Dead helper.** `activityIconText` (`account-panel.ts:303`) returns letter glyphs
  ("E"/"B"/"V"/"{}"/"OK") but rows use SVG icons (`activityIconSvg`); it appears unused. →
  remove to avoid confusion.
- **A3 — Contract/approve amount** shows the spender/contract string in the amount slot;
  fine, but confirm it doesn't collide visually with real amounts (tone `muted`).

---

## The fix (one move): unify the two rows

Both surfaces should share **one row model**. Make the compact Recent-transactions row a
**condensed Activity row**:

- Icon: the Activity `data-kind`/`data-direction` icon + badge, at ~28px (vs Activity's 40px).
- Line 1: structured `title` (e.g. "Received", "Sent USDT", "Staked TRX").
- Line 2: `subtitle` (counterparty / resource / status) — **not** a hash.
- Right: signed `amountText` (success tone for incoming) + optional date; the row is the link.
- Header: sentence case "Recent transactions", weight 500, no letter-spacing; keep the
  "Activity" text button to open the full list.

Concretely: refactor `createTransactionRowHtml` to delegate to the Activity row builder
(shared partial) with a `compact` flag driving size, and retire the `.twk-tx-icon` status-dot
and `.twk-tx-hash` mono line. This removes the slop *and* makes the panel and the full
Activity list visually consistent — the same fix, one code path.

All diagnosis only — no code changed. The target style already exists in the Activity view
and in `Review/ACTIVITY_PANEL_REDESIGN_SPEC.md`.

---

## Hallmark redesign — presentation direction (keep the agreed panel structure)

Goal: make both surfaces **more beautiful and more effective** without touching the panel's
locked structure. What stays fixed: the account panel's `header → hero (avatar/identity/meta
pill) → Recent section → actions` order; the full Activity view's `back/close header →
month-grouped scroll list`. Only the **row presentation, header casing, amounts, empty state,
and time format** change. One shared row model drives both (compact = condensed Activity row).

### Design principles

1. **Amount is the hero.** In effective wallet UIs the signed amount is the anchor of each
   row. Right-aligned, `font-variant-numeric: tabular-nums`, weight 500:
   incoming `var(--twk-success)`, outgoing/neutral `var(--twk-text)`, failed
   `var(--twk-text-muted)` + strikethrough. Tabular numerals make every row's amount and time
   line up vertically — the single biggest "engineered, not generated" upgrade.
2. **Icon carries meaning.** Token mark (TRX/USDT) when known + a small direction badge
   (down-left in / up-right out); kind glyph for stake/vote/approve/contract. Never the
   status-only dot. Keep the subtle 12%-tint backgrounds already in `styles.ts` (restraint) —
   success tint for in, neutral for out, warning for stake, accent for contract/vote/approve.
3. **Four-quadrant rhythm.** Left = title (what) + subtitle (who/context); right = amount
   (how much) + time (when). A clean read in one glance, no hashes in the flow.
4. **Type ladder, two weights only.** Title 14/500, subtitle 12.5/400 `--twk-text-muted`,
   amount 14/500 tabular, time 12/400 muted. Retire the 650/700 weights (M1).
5. **Quiet status.** Confirmed → no chip (time only). Pending → small warning spinner badge +
   "Pending". Failed → danger badge + dim row. Never surface raw status words like
   "submitted"/"unknown".
6. **Addresses, not hashes.** Subtitle shows the shortened counterparty (`From TJ2f…4kLm`) in
   the body font — reserve monospace for the address chip only, never a whole line.
7. **Time that's readable.** Compact panel → **relative** ("2m ago", "1h ago", "Yesterday");
   full Activity → keep month groups + absolute date (`17 Jul`). Relative time is faster to
   parse in the 3-row compact glanceable view.
8. **Inviting empty state.** Replace "No recent transactions" (apology) with an invitation:
   a faint activity glyph + "Your activity will show up here." (Hallmark empty-state rule.)
9. **Dense-list restraint.** Rows are hover-highlighted, not floating cards; keep radius but
   let the row background stay transparent until hover (`--twk-surface-hover`). Optional:
   ultra-faint hairline between rows in the full Activity list for scannability.
10. **Motion.** New/most-recent row does a subtle fade+rise on mount with the existing
    `cubic-bezier(.25,1,.5,1)`; pending spinner as-is. All under `prefers-reduced-motion`.

### Size hierarchy — Recent is intentionally smaller than Activity

Feedback from review: the redesign text felt slightly large, and the Recent-transactions
block read as heavy/rough next to the rest of the account panel. Fix by making **Recent a
deliberately condensed, secondary "peek"** and **Activity the full-size primary list** — same
row model, two distinct scales. Recent should sit *below* the identity/balance hero in visual
weight (it is supporting content, not the headline), while Activity (its own full screen) can
breathe at the larger scale. This size step is what stops the compact block from looking crude.

### Concrete presentation spec (maps to existing tokens)

| Element | Compact row (Recent — smaller) | Activity row (full) | Token |
|---|---|---|---|
| Icon size | **26–28px** | 40px | reuse `.twk-activity-icon` at two sizes |
| Direction badge | **13px** | 17px | `.twk-activity-badge` |
| Title | **13 / 500** | 14 / 500 | `--twk-text` |
| Subtitle | **11.5 / 400** | 12.5 / 400 | `--twk-text-muted` |
| Amount | **13 / 500** tabular | 14 / 500 tabular | success / text / muted by direction |
| Time | relative, **11.5 / 400** | absolute `17 Jul`, 12 / 400 | `--twk-text-muted` |
| Row height / padding | **~40px, 6px 8px** | ~58px, 9px 8px | `.twk-tx-row` vs `.twk-activity-row` |
| Row gap | **8px** | 12px | — |
| Section header | "Recent transactions" **12.5 / 500** sentence case + "Activity ›" | "Activity" title (h2) | — |

Rule of thumb: every text size in the compact row is **one step below** its Activity
counterpart (~1px), the icon is ~30% smaller, and vertical padding is tighter — so Recent
reads as a compact summary and never competes with the identity name / balance pill above it.
Keep the same tokens, colours, tabular numerals, and meaningful icons — only the scale differs.

### Amount formatting helper (effective + tidy)

Add a small formatter so amounts read cleanly: thousands separators (`1,284.5`), trim trailing
zeros, cap decimals per token (USDT 2, TRX up to 6 trimmed), prefix sign by direction
(`+` / `−`). Feed it into `amountText`; keep the raw value for the explorer link. This alone
removes most of the "raw data dump" feel.

### What this does NOT change

- Panel structure, section order, the account card, the actions row, the Activity back/close
  header, month grouping, the scroll fade-masks — all untouched.
- Kit render/logic (`createWalletModal`, watchers, `manager.getTransactions()`), types beyond
  the already-added `kind/direction/title/amountText`.

### Before → after (compact panel)

- Before: `● grey-dot  Mock TRX transaction / mock-178…749999            View ↗`
- After: `⤵ TRX  Received / From TNaR…9xQc                    +1,284.5 TRX · 2m ago`

Net effect: the compact panel stops looking like a debug log and starts looking like a wallet —
and becomes visually identical in language to the full Activity list (one row model, two sizes).

---

## Activity refinement — add a focal point, kill the sprawl (from live review)

Live-review feedback on the shipped Activity screen: it feels **spread thin (dàn trải) with no
focal point** — titles and amounts are the same weight, rows are tall, and the right column
repeats "Jul 18 ↗" on every line. Every element has equal visual weight, so the eye never lands.

### Root causes (observed in the screenshot)

1. **No size contrast.** Title (~15) and amount (~15) are near-equal → nothing dominates.
2. **Rows too tall / too airy** → vertical sprawl; the list reads as loose cards, not a list.
3. **Big horizontal void** between the text cluster and the far-right cluster → content drifts apart.
4. **Repeated per-row date + ↗** — "Jul 18 ↗" on all seven rows (same day) is pure noise and
   adds to the spread feeling.
5. **Over-long technical subtitles** — "TRC20 transfer from TSender…7N…" competes with the title
   (which already says "Received USDD").

### Fixes — make the amount column the anchor

1. **Amount = the single hero.** Bump amount to **15 / 600**, `tabular-nums`, right-aligned so
   all amounts share **one clean vertical edge** — that column becomes the focal point. Keep
   direction colour (success in, text out/neutral, muted+strike failed). Everything else steps
   down: title **13.5–14 / 500**, subtitle **12 / 400 muted**.
2. **Collapse dates into day-group headers.** Group by **day** ("Today", "Yesterday", else
   "Jul 18") as a small muted header; **remove the per-row date entirely**. Repeated dates
   vanish, the right column is now just the amount → far stronger anchor.
3. **Trim subtitles.** Drop the "TRC20 transfer from/to" boilerplate — the title carries the
   type. Show just **"From TSender…7N4m" / "To TReceiver…2Zp9"**, "Energy", "2 SR candidates",
   "triggerSmartContract". Shorter = the title and amount lead.
4. **Tighten rows ~30%.** Row padding `7px 6px`, min-height ~50px, icon **34px** (from 40),
   gap 11px. A cohesive scannable list instead of spaced-out blocks.
5. **↗ on hover only.** The whole row is the explorer link; show the external-link glyph on
   row hover (or drop it) instead of a persistent blue mark on every line — removes repeated
   accent noise.
6. **Status, quiet and inline.** Confirmed → nothing (amount only). Pending → a small warning
   dot + "Pending" where the amount would be (contract/no-amount rows). Failed → danger + dim.

### Revised Activity spec (supersedes the earlier Activity sizes)

| Element | Value |
|---|---|
| Row | padding `7px 6px`, min-height ~50px, gap 11px, hover `--twk-surface-hover` |
| Icon | 34px + 15px direction badge |
| Title | 13.5–14 / 500 `--twk-text` |
| Subtitle | 12 / 400 `--twk-text-muted`, single line, trimmed (no protocol boilerplate) |
| Amount (hero) | **15 / 600**, `tabular-nums`, right-aligned single column; success / text / muted |
| Date | **day-group header only** (`Today` · `Jul 18`), never per row |
| Explorer ↗ | hover-only |

Net effect: one bold, aligned amount column gives the screen its focal point; day-grouped dates
and trimmed subtitles remove the repetition; tighter rows pull the list together. The compact
Recent panel keeps its one-step-smaller scale (icon 27, amount 13/600) but follows the same
rules — amount as anchor, no per-row date.

---

## CHOSEN DIRECTION — Option A "lined ledger" (paste-ready for Codex)

Decision (2026-07-17, from live review): the floating rounded-hover rows read as **disconnected
(rời rạc)**. Adopt **Option A**: thread the rows onto **hairline dividers inside one bordered
container** — the classic wallet-history ledger — instead of per-row rounded cards. Rejected
Option B (a bordered block per day) as too many nested frames. Also fix the right column so it is
**only ever an amount or a single status chip** (never a bare ticker or a struck word).

Owner: Codex (SDK). After applying, **rebuild `@tron-wallet-kit/browser` and copy the fresh
`tron-wallet-kit.iife.min.js` into `website/public/`** so the docs preview reflects it.

### 1. `packages/ui/src/styles.ts` — full Activity ledger

- `.twk-activity-list` → make it the ledger frame, remove inter-row gap:
  `display:grid; gap:0; border:1px solid var(--twk-border); border-radius:12px; overflow:hidden;`
- `.twk-activity-row` → flush rows joined by hairlines (drop the per-row radius):
  `border-radius:0; border-bottom:1px solid var(--twk-border); padding:10px 14px; min-height:50px;`
  keep grid `34px minmax(0,1fr) minmax(82px,auto)`, gap 11px. Add `.twk-activity-row:last-child { border-bottom:0; }`
- `.twk-activity-month` → a subheader row inside the frame:
  `padding:9px 14px 8px; border-bottom:1px solid var(--twk-border); font-size:12px;` (a double
  hairline at a day boundary is fine as a group separator).
- Keep the `.twk-activity-scroll` mask-fades; they sit outside the framed list.

### 2. `.twk-tx-section` (compact Recent) — same hairlines, no double frame

The section is already a bordered card, so **don't** add a second border to its list:
- `.twk-tx-section .twk-activity-list { border:0; border-radius:0; gap:0; }`
- `.twk-tx-section .twk-activity-row { border-radius:0; border-bottom:1px solid var(--twk-border); padding:8px 12px; }`
  and `.twk-tx-section .twk-activity-row:last-child { border-bottom:0; }`
- Keep the compact scale (icon 28, title 13/500, amount 13/600).

### 3. Right column = amount OR one status chip (both views)

Add a status-chip style:

```
${selector} .twk-activity-status {
  align-self:center; border-radius:999px; font-size:12px; font-weight:500;
  line-height:1.2; padding:2px 9px; white-space:nowrap;
}
${selector} .twk-activity-status[data-status="pending"] {
  background: color-mix(in srgb, var(--twk-warning) 14%, transparent); color: var(--twk-warning);
}
${selector} .twk-activity-status[data-status="failed"] {
  background: color-mix(in srgb, var(--twk-danger) 14%, transparent); color: var(--twk-danger);
}
${selector} .twk-tx-section .twk-activity-status { font-size:11px; padding:1px 8px; }
```

### 4. `packages/ui/src/account-panel.ts` — right-column render rules

In `createActivityTransactionRowHtml`, replace the current `right`/`amountText` logic with:

- Compute `amountText` from `transaction.amountText` only (no ticker/`-` fallback — see §5).
- **If `amountText` is present** → render `<span class="twk-activity-amount" …>` as today.
- **Else if status is `pending` or `failed`** → render
  `<span class="twk-activity-status" data-status="…">${labels.pending|failed}</span>` (the chip).
- **Else** → render nothing (empty right cell).
- **Approve** rows: set `amountText` to the allowance (e.g. `"1,000 USDT"`) with `amountTone:"muted"`
  so it reads as a plain number, not a signed amount; drop the duplicate "Allowance …" from the
  subtitle (subtitle can show the spender or be empty).
- **Failed** rows: keep the red icon badge + (optional) red subtitle "Failed", but **do not**
  strike a non-amount word. `text-decoration:line-through` on `.twk-activity-amount[data-status="failed"]`
  stays — it only ever applies to a real amount now.
- Title for a failed contract is just `"Contract"` (not "Contract failed") — the chip/badge carries
  the failure; don't triple-encode it.

### 5. `fallbackActivityAmount` — stop emitting bare tickers

Change it to return an **empty string** when there is no real amount (currently it returns the
token ticker or `"-"`). The chip logic in §4 then fills pending/failed; everything else shows an
empty right cell. This is what removes the stray "USDT" / struck "Contract" in the right column.

### Acceptance

- Right column is a clean single edge: a tabular amount **or** a pill chip, nothing else.
- Rows are one continuous ledger (hairlines), no floating rounded cards.
- Compact panel = same ledger at the smaller scale, inside its existing card (no double border).
- `pnpm typecheck && pnpm test` green; browser bundle rebuilt into `website/public/`.

---

## Implementation status — 2026-07-18

Status: **implemented in code; pending visual QA**.

Implemented:

- Compact Recent rows now share the Activity row renderer with compact density.
- Section header casing/weight is normalized.
- Raw hashes and standalone `View` controls were removed from compact rows.
- Full Activity now uses the selected **lined ledger** direction: one bordered list frame, hairline row separators, no floating rounded row cards.
- Compact Recent uses the same ledger language inside the existing recent card, without adding a second outer frame.
- Right column is normalized:
  - numeric/quantity text renders as `.twk-activity-amount`;
  - pending/failed rows without an amount render a quiet `.twk-activity-status` chip;
  - bare tickers/words such as `TRX`, `USDT`, `Contract`, and `-` are no longer emitted as fallback amount UI.
- Failed contract rows can keep their specific subtitle, e.g. `Reverted by contract`, instead of forcing every failed row to duplicate `Failed` in both subtitle and chip.
- Client transaction metadata was cleaned so common method hints no longer emit bare ticker/placeholder `amountText` when no real amount is known.
- Browser IIFE was rebuilt and copied into `website/public/` and `examples/public/vendor/`.

Verification run:

- `pnpm --filter @tron-wallet-kit/ui typecheck`
- `pnpm --filter @tron-wallet-kit/ui test -- --run --reporter=dot`
- `pnpm --filter @tron-wallet-kit/client typecheck`
- `pnpm --filter @tron-wallet-kit/client test -- --run --reporter=dot`
- `pnpm --filter @tron-wallet-kit/client build`
- `pnpm --filter @tron-wallet-kit/ui build`
- `pnpm --filter @tron-wallet-kit/browser build`
- `pnpm --filter @tron-wallet-kit/website build`
- `pnpm --filter @tron-wallet-kit/examples build`

Known remaining items:

- Needs browser visual QA in light/dark/mobile to confirm the ledger density feels right.
- Amount formatter helper for raw numeric payloads remains a follow-up; current UI safely accepts already formatted `amountText`.
