# Theme builder — layout audit & reorganization (desktop + mobile)

Date: 2026-07-17. Scope: `website/.vitepress/theme/components/ThemeBuilderWidget.vue`.
Diagnosis + proposal; mobile is the priority.

## Current structure

- Root `position:fixed; inset:0` full-screen overlay; sticky topbar (Back + brand); inner `max-width:1400px`.
- Header: title + subtitle (left) vs presets row (right).
- Main: `grid-template-columns: 260px 1fr` — left **controls** (sticky accordion: Display / Connect button / Colors / Radius) + right **preview** (device toggle + stage frame).
- Generated-code block below main.
- Only responsive rule: `@media (max-width:860px){ .tbx-main{ grid-template-columns:1fr } }`.

Desktop is fine — the 2-pane inspector (controls left, preview right) is the right model.

## Findings

### Mobile (priority)

1. **Reversed reading order.** When the grid collapses to one column, **controls stack above the preview**. On a phone you scroll past 4 groups (~14 colour fields, sliders) before the modal preview appears — but a theme builder must show the preview *while* editing.
2. **Nested scrolling.** `.tbx-controls` keeps `position:sticky; max-height:calc(100vh-96px); overflow-y:auto` even at full width → a scroll box inside the page scroll (Hallmark: no nested scrolling).
3. **Fake phone frame overflows.** `.tbx-phone` is a fixed **390px** wide + 10px padding → overflows a ~360–390px viewport; the **740px** tall screen is oversized on a real phone.
4. **Accordion friction.** Four collapsible groups mean repeated expand/collapse; hard to scan on a small screen.
5. **Copy is out of reach.** The "Copy code" action sits at the very bottom, far below the fold after editing.

### Organization (both breakpoints)

6. Presets compete with the title in the header; they belong with the controls (they *are* a control).
7. Group headers, labels were shouty ALL CAPS — already fixed in the Hallmark pass; keep sentence case.
8. Device toggle used emoji — already removed.

## Proposal

### Mobile — four fixed zones (see mockup)

Replace the stacked accordion with a **preview-first, tabbed** layout:

1. **Sticky header** — back + "Theme builder" + a compact Desktop/Mobile device toggle.
2. **Pinned live preview** — a compact modal preview directly under the header, *always visible* while editing (not scrolled away).
3. **Segmented tabs** replace the accordion — `Colors · Display · Button · Radius`; show **one group at a time**, and make this the **only** scroll area (kills the nested-scroll box).
4. **Docked action bar** — "Copy config" (+ a "view code" toggle) pinned to the bottom, always reachable.

This gives a clear mental model: *see result → pick a category → adjust → copy*.

### Mobile — concrete CSS/structure changes

- Under `@media (max-width:860px)` (or a dedicated `520px`):
  - `.tbx-main` → `display:flex; flex-direction:column;` with **preview order before controls** (`.tbx-preview-col{ order:0 }`, `.tbx-controls{ order:1 }`).
  - `.tbx-controls` → drop `position:sticky`, `max-height`, `overflow-y` (no nested scroll); render groups as **tab panels** instead of accordion (a `activeTab` ref; show only the selected group).
  - Make `.tbx-preview-col` (or just the preview card) `position:sticky; top:<topbar>` so it stays in view as the tab panel scrolls.
  - Add a `position:sticky; bottom:0` action bar with Copy.
- **Fix the fake phone frame** on small screens: when the real viewport is a phone, either hide the `.tbx-phone` chrome and preview the bottom-sheet directly, or set `.tbx-phone{ width:min(390px,100%); }` and reduce `.tbx-phone-screen` height to `min(740px, 70vh)` so it fits.

### Desktop — light refinements (optional)

- Move the presets row into the top of the controls inspector (one column owns all controls); keep the title alone in the header.
- Keep the accordion on desktop (fine there), or unify on tabs for consistency with mobile.
- Consider a "Reset all" control near presets.

## Implementation notes

- Add an `activeTab` ref (`"colors" | "display" | "button" | "radius"`) used only at the mobile breakpoint; desktop can keep `collapsed` accordion or reuse tabs.
- Pure template + scoped-CSS change; no change to the kit-render logic (`render()`, `createWalletModal`, watchers).
- Respect the existing bottom-sheet `:deep()` rules for the in-preview mobile modal.
- Verify at 360 / 390 / 768 px; check no horizontal overflow and no nested scroll.

Everything here is diagnosis + plan — no component code changed yet.
