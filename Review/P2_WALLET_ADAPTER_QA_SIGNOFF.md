# P2 Wallet / Adapter QA Sign-Off

Updated: 2026-07-24

This is the execution checklist for P2 wallet and adapter QA. It separates UI availability detection from real connect/sign behavior so the kit does not regress into wallet-by-wallet hardcoding.

## QA Principle

- The wallet list may show `INSTALLED`, `QR`, `HARDWARE`, or unavailable from lightweight detection only.
- Real wallet connect, account resolution, signing, and transaction behavior must run on demand after the user selects a wallet.
- A wallet is not promoted to a recommended/default featured slot until real QA passes on the intended platform.
- Namespace-only globals are not enough for TRON installed state. Trust and Binance must expose a usable TRON provider before they count as installed.
- WalletConnect is a transport entry, not a specific wallet brand. When wallet metadata is returned by a connected mobile wallet, the connected button/account panel should prefer that wallet metadata over the generic WalletConnect icon when safely available.

## Test Environment

- Primary app: `https://127.0.0.1:5174/react-basic/`.
- Use HTTPS for Gate and any wallet that does not inject on HTTP origins.
- Use TRON mainnet for final QA unless the case explicitly requires a testnet.
- Use a clean browser profile for first-connect and autoconnect checks.
- Use a multi-wallet profile for collision checks.
- Record wallet extension/app version, browser, OS, account prefix, network, result, and console errors.
- Do not require a browser/IIFE rebuild for this P2 pass unless the target is explicitly the browser package.

## Wallet Groups

| Group | Wallets | Goal |
| --- | --- | --- |
| Core extension | TronLink, TokenPocket, OKX Wallet, Bitget Wallet | Must remain stable with multiple TRON wallet extensions installed. |
| Popular extension | Trust Wallet, Binance Web3 Wallet, SafePal, Gate Wallet, Bybit Wallet, Backpack, OneKey, Guarda, MathWallet | Verify provider detection, connect path, and collision behavior before promotion. |
| WalletConnect mobile | WalletConnect, Klever Wallet, mobile fallbacks where supported | Verify QR session lifecycle, metadata, signing, and cleanup. |
| Bridge/custom | MetaMask TRON, imToken, FoxWallet | Keep visible only when the configured bridge/provider path is actually usable. |
| Hardware | Ledger | Supported on desktop, but sign-off requires a real Ledger device and optional peer installed in the test app. |

## P2 Execution Order

1. **Startup and installed detection**
   - Load React Basic with no wallet connected.
   - Confirm installed wallets settle without staying in `checking`.
   - Confirm unsupported wallets fade or sort calmly without abrupt layout jumps.
   - Confirm installed/supporting QR/hardware wallets appear before purely unavailable wallets in recommended areas.

2. **Provider collision pass**
   - Test TronLink while TokenPocket, Trust, Bybit, OneKey, and OKX are enabled where available.
   - Test TokenPocket while TronLink is enabled.
   - Test Trust while TronLink is enabled.
   - Test Gate while OneKey is enabled and disabled.
   - Pass criteria: the selected wallet returns its own address or fails cleanly; it must not silently connect through another wallet.

3. **Extension connect pass**
   - For each extension wallet, run first connect after clearing site data.
   - Then disconnect and connect again without refresh.
   - Reload and confirm no unwanted autoconnect when React Basic disables autoconnect.
   - Pass criteria: connected address is correct, button/account panel show wallet icon, balance refresh starts, and no stale connecting panel remains.

4. **Signing and transaction pass**
   - Run `signMessage` approve and reject.
   - Run `signTransaction` approve and reject with a small safe payload.
   - Run a small TRX send only from a funded QA wallet.
   - Pass criteria: errors are normalized, pending requests are canceled on timeout/close, toasts close correctly, and recent activity shows the expected pending/success/failed state.

5. **WalletConnect QR pass**
   - Scan WalletConnect QR with Bitget and Klever first.
   - Test approve, reject, QR back, QR close, and connect another wallet while QR is still loading.
   - Pass criteria: the QR panel stays open until a real session is resolved or canceled, closes on successful connect, clears stale callbacks, and does not label namespace mismatch as user cancellation.

6. **Ledger pass**
   - Install the optional Ledger peer in a test app.
   - Connect a real Ledger with the TRON app open.
   - Test account, signMessage, signTransaction, and rejection.
   - Pass criteria: Ledger appears as hardware-supported on desktop and missing optional peer never breaks the rest of the kit.

## Wallet QA Matrix

| Wallet | Integration | Platforms | Installed detection gate | Connect/sign QA | P2 status |
| --- | --- | --- | --- | --- | --- |
| TronLink | custom adapter | Extension, mobile | Adapter-local provider/TIP-1193, not foreign `tronWeb` | Connect, signMessage, signTransaction, send TRX | Needs live multi-wallet reverify |
| TokenPocket | injected strategy | Extension, mobile | TokenPocket-specific provider/markers | Connect and sign through injected provider | Needs live reverify |
| OKX Wallet | injected strategy | Extension, mobile | OKX TRON provider/rdns | Connect and sign through injected provider | Needs live reverify |
| Bitget Wallet | injected strategy | Extension, mobile | Bitget provider/rdns without unwanted autoconnect | Connect and sign through injected provider; WC mobile as separate path | Needs live reverify |
| Trust Wallet | injected strategy | Extension, mobile | Usable `trustwallet.tronLink` or `trustwallet.tron`, not namespace-only | Connect and sign only when TRON provider exists | QA-critical |
| Binance Web3 Wallet | injected strategy | Extension, mobile | `binancew3w.tron` with account/sign API, not namespace-only | Connect and sign through Binance TRON account API | QA-critical |
| SafePal | injected strategy | Extension, mobile | SafePal hook/provider, not foreign global `tronWeb` | First-connect and sign after approval | Needs live reverify |
| Gate Wallet | injected strategy | Extension | `gatewallet.tronLink` on HTTPS origin | First-connect with and without OneKey enabled | QA-critical |
| Bybit Wallet | injected strategy | Extension, mobile | Bybit provider/rdns, avoid TronLink takeover | Connect and sign through selected provider | QA-critical |
| Backpack | injected strategy | Extension | Backpack TRON branch or composed provider | Connect and sign through selected provider | QA-critical |
| OneKey | injected strategy | Extension | OneKey provider/rdns | Connect and sign; verify it does not poison Gate/TronLink | QA-critical |
| Guarda | injected strategy | Extension | Guarda provider/rdns | Connect and sign; confirm address is returned | QA-critical |
| MathWallet | injected strategy | Extension, mobile | Math marker/provider only, not generic `tronLink` | Live extension connect and sign | QA-critical before promotion |
| MetaMask TRON | tronweb3 bridge | Extension | TRON bridge available, not EVM-only MetaMask | Connect and sign through MetaMask TRON bridge | QA-critical |
| Klever Wallet | WalletConnect | Extension, mobile | QR/mobile transport | WalletConnect QR approve/reject/sign | Needs live WC reverify |
| WalletConnect | WalletConnect | Mobile | Always QR transport when configured | QR session lifecycle and connected wallet metadata | Needs live reverify |
| Ledger | tronweb3 bridge | Hardware | Hardware-supported desktop entry | Real Ledger device connect/sign | Manual hardware QA pending |
| FoxWallet | injected strategy | Mobile | Mobile/app marker only; desktop extension must not false-positive | Hold until real provider path is known | Hold |
| imToken | tronweb3 bridge | Mobile | Bridge/mobile only | Hold until real mobile/bridge QA | Hold |

## Pass Criteria Per Wallet

- **Detection:** installed badge is correct after first page load and after a short late-injection window.
- **Isolation:** selecting the wallet never returns another wallet's address.
- **Session:** connected button shows wallet icon, account, balance state, and opens the account panel.
- **Events:** account/network/disconnect events update only the active wallet session.
- **Errors:** rejection, unavailable provider, timeout, and namespace mismatch show short formatted English messages.
- **Cleanup:** back/close/disconnect cancels pending connect/sign/QR work.
- **Docs:** any wallet-specific caveat is reflected in the wallet catalog or troubleshooting docs before promotion.

## Current P2 Status

- Descriptor registry and strategy-driven metadata are in place.
- Core/custom collision fixes exist for TronLink, SafePal, and WalletConnect namespace behavior.
- Real QA is still required before promoting MathWallet or broadening default featured slots.
- Ledger support is cataloged but still requires a real-device sign-off.
- Trust and Binance should stay guarded: namespace-only detection is not a TRON installed pass.
