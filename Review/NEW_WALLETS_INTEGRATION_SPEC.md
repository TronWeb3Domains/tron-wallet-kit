# Spec: Integrating New TRON Wallets (Math Wallet, Coin98, Klever, Hardware)

Goal: add selected notable TRON wallets beyond the current built-in set using the wallet registry model: one descriptor per wallet. The key rule is to QA the live provider path before committing a descriptor. Do not guess globals.

Related specs: `WALLET_REGISTRY_SPEC.md`, `ADD_NEW_WALLET_GUIDE.md`.

Each new wallet requires:

- `packages/client/src/wallets/entries/<id>.ts`
- `packages/client/src/wallets/icons/<id>.svg`
- one registry entry in `packages/client/src/wallets/registry.ts`

---

## 0. Mandatory Lessons For Injected Wallets

These rules come from Gate Wallet and SafePal QA.

1. Inspect the live provider path on an HTTPS dapp before adding it. Many wallets, including Gate, do not inject on `http://localhost`.
2. Check `Object.keys(window)` and the likely TRON branches, for example `window.<x>.tron?.tronWeb?.defaultAddress?.base58`.
3. `defaultAddress` can populate asynchronously. The kit already has `acquireInjectedAddress`, which polls for the address while the request is running. QA must still cover first connect and reconnect.
4. Some wallets hang when `request()` is called after an account is already exposed. Gate is the known example. Use `preferInjectedAddress: true` only when QA proves this behavior.
5. Confirm the message signing method: `signMessageV2` by default, `sign` for SafePal-style wallets, or request-based signing when required.
6. Prefer TIP-6963-style provider announcements when available, then fall back to explicit `window` paths.
7. Set `requestMethods` from QA data. Common methods are `tron_requestAccounts` and `eth_requestAccounts`. Do not call methods the wallet does not support.

---

## 1. Group A: Injected Wallets

These are high-priority only after live QA confirms provider path, connect, and signing behavior.

### 1.1 Math Wallet

Math Wallet documents a TronWeb-compatible API, so it is likely to behave like a TronLink-family injected wallet.

```ts
export const mathwallet: WalletDescriptor = {
  id: "mathwallet",
  name: "MathWallet",
  integration: "injected",
  homepage: "https://mathwallet.org",
  downloadUrl: "https://mathwallet.org/en-us/",
  platforms: ["extension", "mobile"],
  group: "popular",
  supportsWalletConnect: true,
  detect: { providerPaths: ["tronLink", "tron"] },
  requestMethods: ["tron_requestAccounts"]
};
```

QA requirements:

- Verify whether Math Wallet overwrites `window.tronLink` or `window.tron`.
- If it uses a wallet-specific namespace, add that exact path to `detect.providerPaths`.
- If it can conflict with TronLink, add reliable conflict markers before enabling it in the default catalog.
- Verify `connect`, `signMessage`, and `signTransaction`.

### 1.2 Coin98

Coin98 is a multichain wallet and may expose TRON under `window.coin98.tron`.

```ts
export const coin98: WalletDescriptor = {
  id: "coin98",
  name: "Coin98",
  integration: "injected",
  homepage: "https://coin98.com",
  downloadUrl: "https://coin98.com/wallet",
  platforms: ["extension", "mobile"],
  group: "popular",
  supportsWalletConnect: true,
  detect: { providerPaths: ["coin98.tron", "coin98.tronLink"] },
  requestMethods: ["tron_requestAccounts", "eth_requestAccounts"]
};
```

QA requirements:

- Confirm `window.coin98.tron.request`.
- Confirm where `tronWeb.defaultAddress.base58` is stored.
- If request and TronWeb live on separate branches, add a provider composer in `injected/detect.ts`, following the SafePal/Gate pattern.

If either wallet only supports TRON through WalletConnect, move it to Group B.

---

## 2. Group B: WalletConnect-Routed Wallets

These wallets should route through the existing WalletConnect adapter. They do not need custom adapter code unless QA proves otherwise.

Candidates:

- Klever
- Bitpie
- HTX / Huobi
- Coinhub
- KuCoin / Halo

Example:

```ts
export const klever: WalletDescriptor = {
  id: "klever",
  name: "Klever",
  integration: "walletconnect",
  homepage: "https://klever.io",
  downloadUrl: "https://klever.io/download",
  platforms: ["mobile"],
  group: "more",
  supportsWalletConnect: true,
  mobileDeepLink: { scheme: "klever://" }
};
```

QA requirements:

- Open the wallet modal.
- Select the wallet.
- Scan the QR code or use the deep link.
- Confirm the wallet supports the TRON namespace `tron:0x2b6653dc`.
- Confirm account return and signing.

If a wallet advertises WalletConnect but does not support the TRON namespace, do not enable it as a TRON wallet.

---

## 3. Group C: Hardware Wallets

Candidates:

- Tangem
- Keystone
- Ellipal
- D'CENT

Rules:

- Do not reimplement hardware transport or APDU logic.
- Prefer WalletConnect if the hardware wallet routes through a mobile app.
- If an official TRON adapter exists, use `integration: "tronweb3-bridge"` with a lazy importer and optional peer dependency.
- Keep hardware integrations graceful-unavailable when the optional dependency is not installed.

Ledger remains the reference implementation for this class.

---

## 4. Add-Wallet Checklist

- [ ] QA on HTTPS and record the actual provider path.
- [ ] Choose exactly one integration type: `injected`, `walletconnect`, `tronweb3-bridge`, or `custom`.
- [ ] Add a provider composer only when request and TronWeb live on separate branches.
- [ ] Confirm `requestMethods`.
- [ ] Confirm `signMessageMode`.
- [ ] Set `preferInjectedAddress` only when live QA proves request hangs.
- [ ] Add `entries/<id>.ts`.
- [ ] Add `icons/<id>.svg`.
- [ ] Register the descriptor in `registry.ts`.
- [ ] QA detect, first connect, reconnect, `signMessage`, and `signTransaction`.
- [ ] Run the relevant client typecheck and tests.

---

## 5. Constraints

- Do not guess provider paths.
- Do not add a wallet to the default list until live QA confirms it.
- Use the generic injected adapter for standard TronLink-family wallets.
- Do not create a dedicated adapter package unless the wallet has a truly unique API.
- Do not hardcode WalletConnect project IDs.
- Prioritize Math Wallet and Coin98 only if their injected paths are confirmed.
