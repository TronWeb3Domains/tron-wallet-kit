# Activity panel redesign — spec for Codex

Date: 2026-07-17. Status: design spec. Scope: the account-panel **Activity** view
(the full list opened from "Recent transactions"). English is the **source language**;
all labels live in the localization label pack (en base + zh).

## Problem (current build)

`packages/ui/src/account-panel.ts` renders each activity row from a single free-text
`transaction.label` (e.g. "Mock TRX transaction") plus a shortened `txHash` in monospace
as the secondary line. Result (see current screenshot): generic titles, a monospace hash
shown too prominently, **no amount, no direction, no token, no type**, mismatched font
sizes, and a highlighted "RECENT TRANSACTIONS" caption. It reads as noisy and unstructured.

## Goal

A clean, modern, simple activity list modeled on TRON's actual transaction structure:
each row states **what happened** (type), **how much** (signed amount + token), **with
whom** (counterparty / resource), **when** (date), and **status** — grouped by month.
Keep the existing visual language (`--twk-*` tokens, current modal/radius/spacing).

## Layout

- Header: back chevron · "Activity" (centered) · close — unchanged.
- Body: month group headings (`July 2026`) in 12px `--twk-text-muted`, sentence case,
  rendered once per month (already have `formatTransactionMonth`).
- Rows under each heading.
- Remove the standalone highlighted "RECENT TRANSACTIONS" caption and the count pill from
  this full view (they belong to the compact panel, not the Activity list).

## Row anatomy

```
[icon 40px + badge]   Title (14px / 500, text)          +1,284.5 TRX  (14px/500, colored)
                      Subtitle (12.5px, text-secondary)  17 Jul  ↗    (12px, text-muted)
```

- **Left icon**: 40px circle. Fill = token/type tint; glyph or token ticker inside.
  A 17px overlay badge (bottom-right, `--twk-surface` ring) shows direction/status:
  `arrow-down-left` = incoming, `arrow-up-right` = outgoing, `loader` = pending,
  `alert-triangle` = failed. Type actions (stake/vote/contract) use a type glyph, no
  direction badge.
- **Middle**: title (localized type) + subtitle (counterparty or resource/status).
- **Right**: signed amount + token on top, date + explorer icon below. Incoming amount
  uses `--twk-success`; outgoing/neutral uses `--twk-text`; failed is struck-through +
  `--twk-text-muted`.
- Row height ~58px, vertical padding 9px, gap 12px, radius 12px, hover `--twk-surface-hover`.
- Whole row is the explorer link target (or a tap-through to a future detail view);
  drop the separate monospace hash line entirely.

Font sizes are fixed (no more drift): title 14/500, subtitle 12.5/400, amount 14/500,
date 12/400. Two weights only (400/500).

## Transaction type → label / icon / direction

Derive `kind` from the TRON contract type / `methodHint` already available at broadcast
(`packages/client/src/transactions.ts` passes `methodHint`). Mapping:

| Kind (contract type) | Title key | Icon | Direction | Amount |
|---|---|---|---|---|
| TransferContract (in) | `received` | token ticker | in (down-left, success) | `+{amt} TRX` |
| TransferContract (out) | `sent` | token ticker | out (up-right) | `−{amt} TRX` |
| TRC20 transfer (in) | `receivedToken` | token ticker | in | `+{amt} {token}` |
| TRC20 transfer (out) | `sentToken` | token ticker | out | `−{amt} {token}` |
| TRC20 approve | `approve` | `ti-file-check` | neutral | spender name (JustLend…) |
| FreezeBalanceV2 | `staked` | `ti-bolt` | neutral | `{amt} TRX` |
| UnfreezeBalanceV2 | `unstaked` | `ti-bolt-off` | neutral | `{amt} TRX` |
| DelegateResource | `delegated` | `ti-share` | neutral | `{amt} TRX` |
| UnDelegateResource | `undelegated` | `ti-share-off` | neutral | `{amt} TRX` |
| VoteWitness | `voted` | `ti-checkbox` | neutral | `{count} votes` |
| WithdrawBalance | `claimedRewards` | `ti-gift` | in | `+{amt} TRX` |
| TriggerSmartContract (other) | `contractCall` | `ti-code` | neutral | contract/method |
| unknown | `unknown` | `ti-file` | neutral | — |

Resource label (`energy` / `bandwidth`) is the subtitle for stake/delegate kinds.
Counterparty subtitle uses `from` / `to` with a shortened address.

## View-model changes

Enrich `RecentTransactionViewModel` (`packages/ui/src/types.ts`) — additive, all optional
so existing callers still compile:

```ts
kind?: TransactionKind;          // "received" | "sent" | "approve" | "staked" | ...
direction?: "in" | "out" | "neutral";
title?: string;                  // pre-localized title (renderer falls back to `label`)
subtitle?: string;               // counterparty / resource / status line
amountText?: string;             // pre-formatted signed amount incl. token, e.g. "+50 USDT"
amountTone?: "in" | "out" | "muted";
token?: string;                  // "TRX" | "USDT" | ...
```

The formatter (client or ui) builds `title`/`subtitle`/`amountText` from `kind` + amount +
token + counterparty using the label pack, so the renderer stays pure. Keep `label` as the
raw fallback only.

## States

- **Pending**: subtitle = `activity.pending` in `--twk-warning`; overlay badge = spinner.
- **Failed**: subtitle = `activity.failed` in `--twk-danger`; amount struck-through, row
  slightly dimmed; overlay badge = alert-triangle.
- **Confirmed**: no status word needed; date + explorer only.
- Keep skeleton rows for the loading state (already present).

## Localization (English source → label pack)

Add a new `activity` group to `WalletKitLabelPack` (`packages/ui/src/types.ts`) and to the
built-in packs. **English is the source of truth** (`packages/ui/src/locales/en.ts`); `zh`
mirrors it (`packages/ui/src/locales/zh.ts`). `{...}` are interpolation placeholders — add a
tiny `formatLabel(template, vars)` helper (replace `{key}`) since the current packs are
plain strings. The dead `vi.ts` stays out of scope (unregistered).

English base (`en.ts`):

```ts
activity: {
  title: "Activity",
  empty: "No activity yet",
  received: "Received",
  sent: "Sent",
  receivedToken: "Received {token}",
  sentToken: "Sent {token}",
  approve: "Approve {token}",
  staked: "Staked TRX",
  unstaked: "Unstaked TRX",
  delegated: "Delegated {resource}",
  undelegated: "Undelegated {resource}",
  voted: "Voted",
  claimedRewards: "Claimed rewards",
  contractCall: "Contract",
  unknown: "Transaction",
  from: "From {address}",
  to: "To {address}",
  energy: "Energy",
  bandwidth: "Bandwidth",
  votes: "{count} votes",
  pending: "Pending",
  failed: "Failed",
  confirmed: "Confirmed",
  view: "View",
}
```

Simplified Chinese (`zh.ts`):

```ts
activity: {
  title: "活动记录",
  empty: "暂无活动",
  received: "收款",
  sent: "转账",
  receivedToken: "收到 {token}",
  sentToken: "发送 {token}",
  approve: "授权 {token}",
  staked: "质押 TRX",
  unstaked: "解除质押 TRX",
  delegated: "代理 {resource}",
  undelegated: "取消代理 {resource}",
  voted: "投票",
  claimedRewards: "领取奖励",
  contractCall: "合约调用",
  unknown: "交易",
  from: "来自 {address}",
  to: "发送至 {address}",
  energy: "能量",
  bandwidth: "带宽",
  votes: "{count} 票",
  pending: "待确认",
  failed: "失败",
  confirmed: "已确认",
  view: "查看",
}
```

Keep the existing `accountPanel.recentTransactions` / `accountPanel.noTransactions` for the
compact panel; `activity.title` / `activity.empty` are for the full view. Document the new
keys in `website/docs/configuration/localization.md`.

## Where to implement

- `packages/ui/src/types.ts` — extend `RecentTransactionViewModel`, add `TransactionKind`
  and the `activity` label group to `WalletKitLabelPack`.
- `packages/ui/src/account-panel.ts` — rewrite `createActivityTransactionRowHtml` to the
  new anatomy (icon+badge / title+subtitle / amount+date); keep month grouping; drop the
  monospace-hash secondary line.
- `packages/ui/src/styles.ts` — new `.twk-activity-*` rules (icon circle, overlay badge,
  amount tones), reuse tokens; respect the existing `@media (max-width: 480px)` bottom-sheet.
- `packages/ui/src/locales/{en,zh}.ts` — add the `activity` group; add `formatLabel`.
- `packages/client/src/transactions.ts` — populate `kind`/`direction`/`amount`/`token`/
  counterparty when recording a transaction (from contract type / `methodHint`), so the UI
  gets structured data instead of a free-text label.

## Out of scope (later)

- A per-transaction **detail view** (tap a row → full breakdown: hash, block, fee/energy,
  from/to, contract, raw). Design separately; this spec covers the list only.
- Indexer-backed history (incoming txs the app didn't broadcast). Current store only knows
  transactions it recorded; a TronGrid/indexer feed can enrich the list later.
