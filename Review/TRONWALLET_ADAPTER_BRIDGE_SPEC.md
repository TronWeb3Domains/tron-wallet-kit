# Spec: Bọc `tronwallet-adapter` (không viết lại 16 adapter)

Mục tiêu: mượn **độ phủ ví + độ chín** của `@tronweb3/tronwallet-adapter` bằng **một bridge duy nhất**, map instance của họ về contract `WalletAdapter` của kit. Catalog entry (OKX, Bitget, TokenPocket, Trust, MetaMask-TRON…) → **kết nối thật**, không tự viết lại.

---

## 0. Nguyên tắc
- **KHÔNG** copy code adapter của họ. Chỉ **wrap runtime instance**.
- Giữ hard-rule của kit: không nhét business logic vào adapter; quirks từng ví do chính adapter của họ lo.
- UI/metadata/icon vẫn dùng `wallet-catalog.ts` + `icons.generated.ts` sẵn có của kit; bridge chỉ cung cấp **kết nối + ký + broadcast + event**.

---

## 1. Package mới
`packages/adapters/tronwallet-bridge` → `@tron-wallet-kit/adapter-tronwallet-bridge`
- `dependencies`: `@tron-wallet-kit/core`.
- `peerDependencies`: `@tronweb3/tronwallet-abstract-adapter` + các `@tronweb3/tronwallet-adapter-<wallet>` mà app dùng (hoặc aggregate `@tronweb3/tronwallet-adapters`), và `tronweb` (để broadcast).
- Không hardcode danh sách ví trong bridge — app truyền instance vào.

---

## 2. Contract nguồn (`@tronweb3/tronwallet-abstract-adapter`)
Bridge map **từ** interface này:
- Props: `name`, `url`, `icon`, `readyState: WalletReadyState` (`Found | NotFound | Loading | Loadable | Unsupported`), `address: string | null`, `connecting`, `state: AdapterState` (`Loading | Disconnect | Connected`).
- Methods: `connect(options?)`, `disconnect()`, `signMessage(message: string)`, `signTransaction(transaction)`, `multiSign(...)`, `switchChain(chainId)`.
- EventEmitter: `connect(address)`, `disconnect()`, `accountsChanged(address, preAddr)`, `chainChanged(chainData)`, `readyStateChanged(state)`, `stateChanged(state)`, `error(err)`. Có `.on/.off`.
- Error classes: `WalletNotFoundError`, `WalletConnectionError`, `WalletSignMessageError`, `WalletSignTransactionError`, `WalletDisconnectedError`, user-reject qua code (map → `USER_REJECTED`).

---

## 3. Bridge API
```ts
export function createTronwalletBridgeAdapter(
  inner: Adapter,                       // instance @tronweb3/... (đã new)
  options: {
    id: string;                          // "okx", "bitget", "tokenpocket"...
    metadata?: Partial<WalletMetadata>;  // override icon/name/downloadUrl từ catalog
    tronWeb?: TronWeb | (() => TronWeb); // để broadcast; hoặc build từ network.rpcUrl
    group?: string; type?: string;
  }
): WalletAdapter
```

### Map cụ thể
- **`metadata`**: `{ id: options.id, name: metadata.name ?? inner.name, icon: metadata.icon ?? inner.icon, homepage: inner.url, downloadUrl: metadata.downloadUrl ?? inner.url, type, group, description }`.
- **`capabilities`**: `{ connect:true, disconnect:true, signMessage: !!inner.signMessage, signTransaction: !!inner.signTransaction, submitTransaction:true, transferTrx:true }`. `multiSign/switchChain` → chỉ thêm capability phụ nếu cần, KHÔNG vào base.
- **`isAvailable()`**: `inner.readyState === "Found" || inner.readyState === "Loadable"`. `NotFound/Unsupported` → false. `Loading` → tuỳ: trả `false` tạm, UI đã có skeleton từ `availability="loading"`.
- **`connect(opts)`**:
  1. wire event listeners (mục 4) TRƯỚC khi connect.
  2. `await inner.connect()` → nếu reject: `throw normalizeError(err)` (user-reject → `USER_REJECTED`, not-found → `WALLET_NOT_FOUND`).
  3. `const address = inner.address` (base58 T-address); nếu rỗng → throw `CONNECTION_FAILED`.
  4. resolve `WalletNetwork` từ `opts.network`/tronWeb chainId (dùng `NetworkRegistry`, mapping chainId như adapter TronLink).
  5. `return { account: { address, network, networkType: network.networkType, activationStatus: "unknown" }, network, raw: inner }`.
- **`disconnect()`**: gỡ listeners + `await inner.disconnect().catch(()=>{})` (một số ví không disconnect thật — như TronLink; nêu rõ trong copy UI).
- **`restoreSession(session)`** (auto-reconnect): nếu `inner.readyState === "Found"` và `inner.address === session.account.address` → build lại ConnectResult; ngược lại `null` (manager phát `session_stale`).
- **`signMessage(req)`**: `const sig = await inner.signMessage(req.message)` → `return { signatureKind:"signature", signature: sig, proof: sig, raw: sig }`. Reject → throw `SIGN_MESSAGE_FAILED`/`USER_REJECTED`.
- **`signTransaction(req)`**: `const signed = await inner.signTransaction(req.transaction)` → `return { transaction: signed, signedTransaction: signed, signed:true, signature: extractSig(signed), raw: signed }`.
- **`submitTransaction(req)`** (adapter của họ **KHÔNG broadcast** — chỉ ký):
  1. build tx theo `req.methodHint` (transferTrx/transferTrc20/trigger…) bằng `tronWeb` nếu `req.transaction` chưa là tx dựng sẵn.
  2. `const signed = await inner.signTransaction(tx)`.
  3. `const res = await tronWeb.trx.sendRawTransaction(signed)`.
  4. `const hash = res.txid ?? res.txID ?? res.transaction?.txID`; nếu rỗng → throw `SEND_TRANSACTION_FAILED`.
  5. `return { hash, status:"submitted", raw: res }`.

---

## 4. Event forwarding (sửa cả drift TronLink hiện tại)
Adapter của họ phát `accountsChanged/chainChanged/disconnect`. Contract `WalletAdapter` của kit **chưa có kênh event** → thêm callback vào `ConnectOptions` (giống `onUri` đã có):

### 4.1 Core thay đổi nhỏ (`packages/core/src/types.ts`)
```ts
export interface ConnectOptions {
  ... // giữ nguyên
  onUri?: (uri: string) => void;
  onAccountChanged?: (address: string) => void;      // MỚI
  onNetworkChanged?: (network: WalletNetwork) => void; // MỚI
  onDisconnect?: () => void;                           // MỚI
}
```

### 4.2 `WalletManager.connect` truyền callback + emit
Khi gọi `adapter.connect(connectOptions)`, chèn:
```ts
onAccountChanged: (address) => { /* cập nhật session.account.address */ this.events.emit("accountChanged", { session }); },
onNetworkChanged: (network) => { /* cập nhật session.network */ this.events.emit("networkChanged", { session }); },
onDisconnect: () => { void this.disconnect(); }
```
→ Đây cũng là chỗ **fix drift**: TronLink adapter sửa để gọi các callback này thay vì tự nuốt event.

### 4.3 Bridge subscribe → gọi callback
```ts
const onAcc = (addr: string) => opts.onAccountChanged?.(addr);
const onChain = (chain) => opts.onNetworkChanged?.(mapChainToNetwork(chain));
const onDis = () => opts.onDisconnect?.();
inner.on("accountsChanged", onAcc);
inner.on("chainChanged", onChain);
inner.on("disconnect", onDis);
// cleanup trong disconnect(): inner.off(...) cả 3.
```

---

## 5. Wiring ở client (`@tron-wallet-kit/client`)
`createDefaultAdapters` / `createWalletKit`: đăng ký bridge cho ví phổ biến (lazy import để nhẹ bundle):
```ts
import { OkxWalletAdapter } from "@tronweb3/tronwallet-adapter-okxwallet";
adapters.push(createTronwalletBridgeAdapter(new OkxWalletAdapter(), { id: "okx", metadata: catalog.okx, tronWeb }));
// tương tự Bitget, TokenPocket, Trust, imToken, Gate, Fox, Bybit, OneKey, Binance, MetaMask-TRON...
```
- Giữ **adapter WC native hiện tại** của kit (đã lo onUri/QR). Các ví mobile khác nếu chỉ qua WC thì để catalog route qua WC; ví có adapter injected riêng thì dùng bridge.
- `mapAdapterToWalletOption` tự nhặt `isAvailable()` thật → badge INSTALLED/NOT INSTALLED + connect chạy thật.

---

## 6. Bundle / lazy-load
- Mỗi `@tronweb3/tronwallet-adapter-<wallet>` là 1 dep → **dynamic import** khi user chọn ví đó (đặc biệt cho browser IIFE), tránh phình bundle mặc định.
- `tronweb` (cho broadcast) khá nặng → chỉ nạp khi cần submit tx (đã có tiền lệ với identity/trondomainjs).

---

## 7. Test (bọc chính là chỗ để test rẻ)
Unit test bridge với **mock Adapter** (không cần ví thật):
- constructor metadata/capabilities đúng.
- `isAvailable` theo readyState.
- connect success (address), user-reject → throw `USER_REJECTED`.
- signMessage/signTransaction map đúng shape.
- submitTransaction: ký → broadcast (mock tronWeb.sendRawTransaction) → hash.
- event: accountsChanged/chainChanged/disconnect gọi đúng callback; disconnect cleanup listener.
Sau đó QA thật từng ví (connect/sign/scan/deeplink).

---

## 8. Rủi ro / lưu ý
- **Broadcast**: adapter họ chỉ ký; bridge phải broadcast qua `tronWeb` → cần RPC/tronWeb hợp lệ (từ `network.rpcUrl` hoặc app inject).
- **`Loadable`** (mobile chưa cài, deep-link được): map `isAvailable=true` + badge QR/deeplink; desktop injected hiếm gặp.
- **MetaMask-TRON**: chỉ ví import bằng mnemonic mới dùng được TRON (caveat của họ) — nêu trong docs, badge `TRON`.
- **multiSign/switchChain**: để ngoài base contract; expose qua capability phụ nếu app cần.
- **Disconnect TronLink**: chỉ xoá state local — copy UI phải nói đúng (đã có).

---

## 9. Lộ trình
1. Core: thêm 3 callback vào `ConnectOptions` + emit trong `manager.connect` (fix luôn drift TronLink).
2. `packages/adapters/tronwallet-bridge`: `createTronwalletBridgeAdapter` + normalizeError + mapChainToNetwork + broadcast.
3. Test bridge với mock.
4. Client: đăng ký bridge cho 5 ví đầu (OKX, Bitget, TokenPocket, Trust, MetaMask-TRON) — biến catalog entry thành thật.
5. Mở rộng dần các ví còn lại + lazy-load.

---

## Implementation Update 2026-07-06 - Bridge Package Phase 1

- Completed route-map items 1-3 and the compatibility part of item 4:
  - Core `ConnectOptions` now includes `onAccountChanged`, `onNetworkChanged`, and `onDisconnect`.
  - `WalletManager.connect()` injects callbacks that update the active session, emit `accountChanged` / `networkChanged`, and route adapter disconnect events through `manager.disconnect()`.
  - Added `packages/adapters/tronwallet-bridge` as `@tron-wallet-kit/adapter-tronwallet-bridge`.
  - Bridge exposes `createTronwalletBridgeAdapter(inner, options)` and accepts runtime instances only; it does not import or hardcode wallet-specific `@tronweb3` adapter packages.
  - Bridge maps metadata/capabilities/readyState, connect/restore, signMessage, signTransaction, submitTransaction via `tronWeb.trx.sendRawTransaction`, chainId-to-network mapping, error normalization, and `.on/.off` event forwarding.
  - Client keeps backward-compatible `createTronWeb3AdapterBridge()` / `tronweb3Adapters` config, but the implementation now delegates to the bridge package.
- Kept peer deps light:
  - `@tronweb3/tronwallet-abstract-adapter` and `tronweb` are optional peer deps.
  - Concrete wallet packages stay app-owned; apps pass already-created instances into the bridge.
- Tests added:
  - bridge metadata/capability/readyState mapping
  - connect/restore
  - user rejection normalization
  - signMessage/signTransaction mapping
  - sign + broadcast submitTransaction
  - accountsChanged/chainChanged/disconnect forwarding and cleanup
  - known chainId mapping
- Still pending:
  - Real `@tronweb3` wallet package QA for OKX, Bitget, TokenPocket, Trust, MetaMask-TRON.
  - Lazy import factory for concrete wallet packages in client/browser.
  - Docs showing app-side installation and instantiation examples.

## Implementation Update 2026-07-06 - Prominent Wallet Lazy Wiring

- Completed route-map item 4 for the first prominent wallet set and the lazy-load part of item 5.
- Bridge package changes:
  - added `createLazyTronwalletBridgeAdapter(options)`
  - lazy adapter exposes stable metadata/capabilities before loading a concrete package
  - importer runs on availability/connect/restore/sign/submit calls
  - importer failure returns unavailable from `isAvailable()` and normalizes connect failure through kit errors
  - bridge boundary now tolerates upstream adapter methods returning non-void values for `connect()` and `switchChain()`
  - added `signMessageMode: "messageObject"` support for SDKs like MetaMask that receive `{ message }`
- Client default registration now lazy-imports these packages:
  - `@tronweb3/tronwallet-adapter-tokenpocket`
  - `@tronweb3/tronwallet-adapter-okxwallet`
  - `@tronweb3/tronwallet-adapter-bitkeep`
  - `@tronweb3/tronwallet-adapter-trust`
  - `@tronweb3/tronwallet-adapter-metamask`
- Default wallet list now includes `metamask`.
- Handwritten injected defaults were removed for TokenPocket, OKX, Bitget, and Trust. These should now use the official upstream packages through the bridge.
- The remaining injected defaults are intentionally temporary: Gate, Bybit, Binance Web3 Wallet, Guarda, OneKey, Backpack.
- Verification passed for bridge/client/react/examples/browser/ui; browser IIFE still builds.
- Still pending:
  - real installed-extension QA for all five prominent bridge wallets
  - docs explaining default lazy wallet packages and `tronweb3Bridge.tronWeb` for broadcast
  - packaging decision before release: keep concrete adapter packages as optional deps of client, or split them into a preset package

## Implementation Update 2026-07-08 - Ledger Optional Peer

- Added Ledger as the first hardware wallet descriptor in the client registry.
- Ledger uses bridge integration with a lazy importer for `@tronweb3/tronwallet-adapter-ledger`.
- `@tron-wallet-kit/client` declares the Ledger package as an optional peer dependency so apps can install it to enable Ledger without making the kit bundle it by default.
- UI/catalog metadata now supports `hardware` platform and transport values.
- Graceful-unavailable behavior remains owned by the lazy bridge adapter: importer failure maps to unavailable/connect failure without breaking other wallets.
- Real-device QA is pending and must be done with a Ledger device plus the TRON app open.
