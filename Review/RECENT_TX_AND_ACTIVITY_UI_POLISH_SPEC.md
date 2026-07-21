# Spec: Recent Transactions & Activity UI/UX Polish

Date: 2026-07-18. Status: Approved.
Scope: `packages/ui` (styles, icons, account-panel templates).

---

## 1. Goal

Remove generic, boxy, or textual layouts that look like "AI Slop" and transition the lists to a clean, premium visual design with status-tinted icons, custom SVG type iconography, rounded interactive rows, and smooth transition states.

---

## 2. Iconography Upgrades (`packages/ui/src/icons.ts`)

Introduce a standard set of premium, high-quality SVG icons in `icons.ts` for all transaction types and directional states:

- **Arrow Down (Incoming)**:
  `export function arrowDownIcon(): string`
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`

- **Arrow Up (Outgoing)**:
  `export function arrowUpIcon(): string`
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`

- **File Check (Approve)**:
  `export function fileCheckIcon(): string`
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="m9 15 2 2 4-4"/></svg>`

- **Lock Closed (Staked/Delegated)**:
  `export function lockClosedIcon(): string`
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`

- **Lock Open (Unstaked/Undelegated)**:
  `export function lockOpenIcon(): string`
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`

- **Vote (Ballot)**:
  `export function voteIcon(): string`
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`

- **Gift (Claim Rewards)**:
  `export function giftIcon(): string`
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>`

- **Code (Contract Call)**:
  `export function codeIcon(): string`
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`

- **Question Mark (Unknown)**:
  `export function questionIcon(): string`
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`

---

## 3. Account Panel Template Updates (`packages/ui/src/account-panel.ts`)

1. **Recent Transactions Row (`createTransactionRowHtml`)**:
   - Change row container to a clickable `<a>` tag if `explorerUrl` exists:
     ```typescript
     if (transaction.explorerUrl) {
       return `<a class="twk-tx-row" href="${escapeAttribute(transaction.explorerUrl)}" target="_blank" rel="noreferrer" ...>...</a>`;
     }
     ```
   - Embed status-specific SVGs inside `.twk-tx-icon` depending on `transaction.status` (`pending`, `failed`, or default/success):
     - `pending`: An animated circle loader SVG.
     - `failed`: A cross SVG.
     - `success`: A checkmark SVG.
   - Separate "View" text button on the right is replaced by the standard externalIcon() in the clickable link wrapper.

2. **Activity List Row (`createActivityTransactionRowHtml`)**:
   - Map `kind` to the new custom SVG helper:
     ```typescript
     function activityIconSvg(kind: TransactionKind): string {
       if (kind === "received" || kind === "receivedToken") return arrowDownIcon();
       if (kind === "sent" || kind === "sentToken") return arrowUpIcon();
       if (kind === "approve") return fileCheckIcon();
       if (kind === "staked" || kind === "delegated") return lockClosedIcon();
       if (kind === "unstaked" || kind === "undelegated") return lockOpenIcon();
       if (kind === "voted") return voteIcon();
       if (kind === "claimedRewards") return giftIcon();
       if (kind === "contractCall") return codeIcon();
       return questionIcon();
     }
     ```
   - Embed `activityIconSvg(kind)` directly inside `.twk-activity-icon`. Remove the plaintext wrapper `<span>${escapeHtml(activityIconText(kind, transaction.token))}</span>`.

---

## 4. Styling Upgrades (`packages/ui/src/styles.ts`)

1. **Recent Transactions (`.twk-tx-row`)**:
   - Remove border separator `border-top: 1px solid var(--twk-border)` from `.twk-tx-row`.
   - Add card-style rounding: `border-radius: 8px`.
   - Adjust spacing: `padding: 8px 10px`, `min-height: 48px`, `gap: 12px`.
   - Add hover state:
     ```css
     ${selector} .twk-tx-row:hover {
       background: var(--twk-surface-hover);
     }
     ```

2. **Transaction Status Icons (`.twk-tx-icon`):**
   - Remove the hardcoded `.twk-tx-icon::after` dot selector entirely.
   - Use dynamic flex alignment:
     ```css
     ${selector} .twk-tx-icon {
       align-items: center;
       align-self: center;
       background: var(--twk-surface-muted);
       border-radius: 999px;
       display: inline-flex;
       height: 24px;
       justify-content: center;
       position: relative;
       width: 24px;
       transition: background-color .15s ease, color .15s ease;
     }
     ```
   - Use soft `color-mix` backgrounds and full-intensity strokes for statuses:
     - `success`: `background: color-mix(in srgb, var(--twk-success) 12%, var(--twk-surface-muted))`, `color: var(--twk-success)`.
     - `failed`: `background: color-mix(in srgb, var(--twk-danger) 12%, var(--twk-surface-muted))`, `color: var(--twk-danger)`.
     - `pending`: `background: color-mix(in srgb, var(--twk-warning) 12%, var(--twk-surface-muted))`, `color: var(--twk-warning)`.

3. **Activity Items (`.twk-activity-icon` & `.twk-activity-row`):**
   - Make row rounded corners and background shifts smooth.
   - Style `.twk-activity-icon` with soft themed colors:
     - Default background: `var(--twk-surface-muted)`, color: `var(--twk-text-muted)`.
     - Incoming (direction `in`): `background: color-mix(in srgb, var(--twk-success) 12%, var(--twk-surface-muted))`, `color: var(--twk-success)`.
     - Outgoing (direction `out`): `background: var(--twk-surface-muted)`, `color: var(--twk-text)`.
     - Stake/Delegate/Governance: `background: color-mix(in srgb, var(--twk-warning) 12%, var(--twk-surface-muted))`, `color: var(--twk-warning)`.
     - Contract/Approve (direction `neutral`): `background: color-mix(in srgb, var(--twk-accent) 12%, var(--twk-surface-muted))`, `color: var(--twk-accent)`.
     - Failed (status `failed`): `background: color-mix(in srgb, var(--twk-danger) 12%, var(--twk-surface-muted))`, `color: var(--twk-danger)`.
