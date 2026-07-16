# Vanilla connect button — account panel, `.trx` name, balance (SDK fix for Codex)

Found while wiring the website Playground. These are **SDK gaps in the vanilla button**
(`packages/ui/src/button.ts` `createWalletButton`), not website issues. The React `TronConnectButton`
may already handle some of these, but the vanilla/browser button (used by `createBrowserKit`, and
therefore the docs Playground and any HTML/CDN app) does not.

## Symptoms (live)

On the Playground, after a successful connect:
1. The button keeps showing the short address, **not the `.trx` domain**.
2. The **TRX balance is not shown**.
3. Clicking the connected button **re-opens the connect modal** instead of the **account panel**.

## Root cause (in `packages/ui/src/button.ts`)

- `createWalletButton().mount()` wires `root.addEventListener("click", () => options.modal.open())`
  — it **always opens the connect modal**, even when connected. There is no account panel wired.
- The view model sets `connectedLabel = shortenAddress(session.account.address)` and never uses
  `session.account.domain` / `session.account.displayName`, so the `.trx` name never shows.
- `balanceTrx` is only set from `session.balance?.formatted`; nothing triggers a balance refresh on
  connect, so the button shows no balance until something else populates `session.balance`.

## Required fixes

1. **Open the account panel when connected.** The button's click handler should branch on session:
   - disconnected → `modal.open()` (connect modal), as today;
   - connected → open the **account panel** (address, copy, QR, balance, `.trx` name, disconnect).
   The account panel already exists (`packages/ui/src/account-panel.ts`, `.twk-button-panel` /
   `createAccountPanel…`). Wire it into `createWalletButton` (mirror how the React `TronConnectButton`
   opens `useAccountModal`), so the vanilla/browser button gets the same behavior.
2. **Prefer the `.trx` name.** In the button view model, set the connected label to
   `session.account.domain ?? session.account.displayName ?? shortenAddress(address)`.
3. **Show balance reliably.** On `connected` / `session_restored`, trigger the kit's balance refresh
   (or have the button call it) so `session.balance.formatted` is populated and rendered. Respect the
   `connectButton.showBalance` flag.

## Acceptance

- After connect on the Playground (and any HTML/CDN app): the button shows the `.trx` name (or short
  address if none) + TRX balance; clicking it opens the **account panel**, not the connect modal.
- React `TronConnectButton` parity confirmed (same behavior).

## Note for the website

The docs **Theme builder** now renders the modal with `createWalletInline({ manager, ui })` (the
built-in inline controller, `.twk-inline`) — fully interactive and themed, no overlay. The
**Playground** uses `createBrowserKit` with the real connect button, so it will reflect these button
fixes automatically once they land.
