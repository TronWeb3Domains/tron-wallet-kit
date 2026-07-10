# Bàn giao coder — TRON Wallet Kit (work order tổng hợp)

Tài liệu này là file gốc/mục lục work-order cho coder. Coder đọc file này trước để biết thứ tự ưu tiên, rồi mở spec con tương ứng trong cùng thư mục `Review/` để làm.

Nói gọn với coder: **Đọc `IMPLEMENTATION_HANDOFF.md` trước, làm theo thứ tự P0 -> P3, mỗi mục mở spec tương ứng.**

Cập nhật: 2026-07-07.

---

## 0. Đọc trước khi code (bắt buộc)

- Quy tắc sửa file trong `CLAUDE.md` (mục **Cowork agent editing rules**): re-read trước khi edit, ưu tiên str_replace thay vì rewrite; file trên OneDrive có thể là stub cloud-only → đọc qua để materialize; **verify tail + null-byte** sau mỗi write.
- Hard-rule kit (không được phá):
  - Không private key/seed/secret/WalletConnect `projectId` trong SDK/adapter.
  - Không business/app API trong adapter (XRPDomains/setPrimary/isVerify…).
  - Không DOM/jQuery/React/framework trong adapter.
  - `PROJECT_MEMORY.md` local-only; `docs/` để trống trên GitHub (chỉ sửa bản local).
- Lệnh verify chuẩn (chạy phía **Windows**, không chạy trong sandbox vì mount OneDrive lag):
  ```powershell
  pnpm -r typecheck && pnpm test && pnpm build:browser
  ```

---

## 1. Thứ tự ưu tiên

| Ưu tiên | Hạng mục | Spec | Trạng thái |
| --- | --- | --- | --- |
| **P0** | Core runtime: session · autoReconnect · timeout · recover-return · callback | `CORE_RUNTIME_SPEC.md` | ✅ Code + unit/type/build verify xong 2026-07-07 |
| **P1** | UI i18n (đa ngôn ngữ) + các knob config còn thiếu | `UI_CONFIG_GAPS_SPEC.md` (Phần A) | ⬜ Chưa làm |
| **P1.5** | UI hardening hành vi (copy fallback, img/QR error…) | `UI_CONFIG_GAPS_SPEC.md` (Phần B) | ⬜ Chưa làm (1 mục skeleton-timer đã fix sẵn) |
| **P1.5** | Identity: bỏ `trondomainjs`, gọi thẳng contract (mainnet-only, dùng chung tronWeb) | `IDENTITY_DIRECT_CONTRACT_SPEC.md` | ⬜ Chưa làm |
| **P2** | Bridge `tronwallet-adapter`: QA ví thật + docs + đóng gói | `TRONWALLET_ADAPTER_BRIDGE_SPEC.md` | 🟩 Code Phase 1–2 xong; còn QA/docs |
| **P3** | Tách module `packages/client` (index.ts 1.120 dòng → theo đối tượng) | mục 5b (dưới) | ⬜ Chưa làm — nên làm CHUNG với P1.5 identity |
| **P3** | Wallet Registry mở: descriptor tự chứa + inject catalog runtime (PR 1 file HOẶC runtime plugin) | `WALLET_REGISTRY_SPEC.md` + **quyết định CUỐI ở mục 5c** | ⬜ Chưa làm — đọc 5c TRƯỚC (chốt kiến trúc, bãi bỏ manifest-in-core) |

Lý do thứ tự: Core là nền cho mọi thứ chạy mượt (timeout/treo, ví mobile quay về). i18n là gap lớn nhất phía UI (hiện không đổi ngôn ngữ được). Bridge phần code đã xong, chỉ còn kiểm thử/đóng gói. Refactor client là maintainability — làm khi đụng identity (P1.5) cho đỡ sửa 2 lần.

---

## 2. P0 — Core runtime (`CORE_RUNTIME_SPEC.md`)

**Vì sao**: core TRON hiện thiếu enforce timeout (có field `timeoutMs` nhưng không dùng), không huỷ connect treo, autoReconnect mong manh, và **không bao giờ gọi `recoverSession`** (ví mobile/deeplink quay về không được bắt).

**Làm gì** (chi tiết + code mẫu trong spec, theo route-map mục 8):
1. `errors.ts`: enum code + factory + `normalizeWalletError` (giữ nguyên literal cũ để không vỡ test).
2. `types.ts`: `ConnectOptions.signal`, `WalletManagerConfig.recoveryRetryDelaysMs`, mở rộng payload event.
3. `manager.ts`: `withTimeout` + AbortController + `cancelPendingConnection`; `connect`/`disconnect` bọc timeout; `parseStoredSession`/`isValidStoredSession` (+TTL, migrate legacy); `autoReconnect` dedup + fallback; `recoverPendingReturnSession`; emit `session_expired`/`connecting{recovering}`/`session_restored{stale}`; `destroy()`.
4. `react`/`next`: gọi `autoReconnect()` lúc mount, `destroy()` lúc unmount.
5. Test 10 case (mục 7 spec).

**Ràng buộc**: timeout connect/sign để **180s** (ví mobile QR/deeplink), không rút ngắn; `autoReconnect` vẫn explicit; mọi session ghi storage phải qua `createStoredSession`.

---

## 3. P1 — UI i18n + config (`UI_CONFIG_GAPS_SPEC.md` Phần A)

**Vì sao**: hiện chỉ `modal.title`/`subtitle` đổi được; ~42 chuỗi còn lại hardcode English; `WalletUiConfig` không có `locale`/`labels` → app tiếng Việt phải fork.

**Làm gì** (route-map mục 8 spec):
1. Tách `src/locales/{en,vi,index}.ts`; `en` = default hiện tại; component import từ `locales/en`. Bộ `vi` đã viết sẵn trong spec (dán vào).
2. Thêm `locale` + `labels` vào `WalletUiConfig`; `resolveLabelPack(locale, overrides)` merge **en(nền) → locale → override app**.
3. Plumb qua `resolveWalletUiConfig` + controllers (`config.labels.*`), badge lấy từ labels.
4. Các knob còn thiếu (mức TB, làm sau i18n): `modal.showCloseButton/closeOnBackdropClick/closeOnSelect/disableAnimations`, branding powered-by toggle, QR size/margin, `accountPanel.maxVisibleTransactions` (đang khai báo mà chưa plumb), explorer override, shortcut theme `accent`/`fontFamily`.
5. Đảm bảo `client`/`react`/`next` không nuốt field mới.

**Ràng buộc**: backward-compat tuyệt đối — không set gì ⇒ y hệt hiện tại (English); English luôn là lớp nền fallback.

---

## 4. P1.5 — UI hardening hành vi (`UI_CONFIG_GAPS_SPEC.md` Phần B)

Đã verify từng dòng. Coder chỉ cần làm 3 mục Should-fix:
1. **`copyToClipboard(text): Promise<boolean>`** — try `navigator.clipboard`, fallback `execCommand`; chỉ set "Copied" khi thành công. Áp cho copy-uri (modal) + copy-address (account panel).
2. **`<img onerror>` fallback** cho icon ví (`createWalletIconHtml`/`createLargeWalletIconHtml`) — tránh ảnh vỡ.
3. **Surface lỗi render QR** (đừng nuốt `.catch(()=>{})`) + CSS trạng thái lỗi.

Nice-to-have (tuỳ nguồn lực): matchMedia listener cho theme auto-mode; `aria-busy`/`aria-live`; RTL; toast pending max-lifetime.

> Đã fix sẵn (không cần làm lại): rò rỉ timer skeleton All Wallets — đã capture + clear trong `destroy()` cả 2 controller.

**Phần B0 trong spec liệt kê những thứ ĐÃ TỐT — đừng đụng**: focus-trap, Escape, khôi phục focus, `destroy()`, responsive, ARIA cơ bản, SSR, export surface.

---

## 5. P2 — Bridge (`TRONWALLET_ADAPTER_BRIDGE_SPEC.md`)

> **⚠️ Thay đổi chiến lược (xem `WALLET_REGISTRY_SPEC.md`):** **Kit ship ZERO *hard* dep `@tronweb3`.** Ví chuẩn TronLink → **generic injected tự viết** (học từ @tronweb3, không phụ thuộc package). **Ledger ĐƯA VÀO v1** qua bridge: kit ship sẵn descriptor Ledger (lazy import `@tronweb3/tronwallet-adapter-ledger`), package khai **`optional peerDependency`** — app cài để bật, chưa cài → Ledger unavailable/ẩn êm. **KHÔNG tự reimplement hardware.** WalletConnect dùng adapter native. **MetaMask-TRON** mặc định không kèm (niche) — app bật qua bridge nếu cần (`@tronweb3/tronwallet-adapter-metamask-tron`, cũng optional peer).

Phần code đã xong (đã verify khớp spec): package `@tron-wallet-kit/adapter-tronwallet-bridge`, `createTronwalletBridgeAdapter` + lazy variant, sign+broadcast, event forwarding, test mock. **Còn lại**:
- Bridge = **API interop công khai** (không hard dep `@tronweb3`; ledger + metamask-tron là **optional peer**). **Ledger v1**: ship descriptor + lazy import `@tronweb3/tronwallet-adapter-ledger`; graceful unavailable khi app chưa cài; QA thật với thiết bị Ledger. Docs hướng dẫn app `pnpm add @tronweb3/tronwallet-adapter-ledger` để bật. TokenPocket/OKX/Bitget/Trust chuyển sang injected — QA ở nhánh injected.
- Docs app-side: cách cài + truyền instance + `tronweb3Bridge.tronWeb` để broadcast.
- Quyết định đóng gói trước release: concrete adapter là optional-dep của `client` hay tách preset package.
- (Lưu ý spec cũ ghi giữ Gate/Bybit/Binance/Guarda/OneKey/Backpack dạng injected; code đã gộp vào bridge + `injectedFallback` — **cập nhật lại spec cho khớp code** hoặc xác nhận hướng này.)

---

## 5b. P3 — Tách module `packages/client` (maintainability)

**Vấn đề**: `packages/client/src/index.ts` hiện là **1 file ~1.120 dòng** nhồi ~7 nhóm trách nhiệm khác nhau → khó debug/sửa/test. Cần tách theo đối tượng, giữ `index.ts` chỉ làm **barrel re-export** (public API không đổi).

**Bản đồ concern hiện tại (theo dòng) → file đích**:

| Concern hiện tại (index.ts) | Tách sang |
| --- | --- |
| Public types: `WalletClientConfig`, `WalletKit`, `Transfer*Request`, `TronIdentity*`, `TronBalance*`, `WalletClient*Config`… (L56–252) | `types.ts` |
| `createWalletClient` (WalletManager factory) (L492) | `client.ts` |
| `createWalletKit` (API cấp cao: transfer helpers, `refreshIdentity`/`refreshBalance`, connectButton, glue UI) (L745–851) | `kit.ts` |
| `createDefaultAdapters` + danh sách bridge mặc định (L252–409) | `adapters/default-adapters.ts` |
| `createInjectedTronAdapter` (L279) | `adapters/injected-adapter.ts` |
| `createTronWeb3AdapterBridge(s)` + `createDefaultTronwalletBridgeAdapter` (L351–409) | `adapters/bridge.ts` |
| `createAvailabilityProbeWalletAdapter`, `createFallbackWalletAdapter` (L409–491) | `adapters/combinators.ts` |
| Dò injected provider: `getInjectedTronProvider`, `getPathValue`, `isInjectedTronProvider`, MetaMask/Guarda, `extractInjectedAddress`, `isUserRejected` (L660–738) | `injected/detect.ts` |
| Map registry: `normalizeWalletId`, `walletIconMetadata`, `walletRegistryFields`, `injectedFallbackFromRegistry` (L510–660) | `injected/registry-map.ts` |
| Balance: `createDefaultTrxBalanceResolver`, `normalizeBalance`, `resolveBalanceTronWeb`, `isBalanceTronWeb`, `normalizeSunBalance`, `toBalanceBigInt` (L851–930) | `balance.ts` |
| Identity: `createTronDomainIdentityResolver`, `resolveIdentityResolver`, `normalizeDomain`, … (L940–1120) | `identity.ts` (viết lại theo `IDENTITY_DIRECT_CONTRACT_SPEC.md`) |
| `toThemeConfig` + helper nhỏ (L930) | `utils.ts` |
| **Mới**: provider tronWeb dùng chung (identity + balance + bridge broadcast) | `tronweb.ts` |

**Cấu trúc đích**:
```
packages/client/src/
  index.ts            — chỉ re-export (barrel), public API giữ nguyên
  types.ts
  client.ts           — createWalletClient
  kit.ts              — createWalletKit
  tronweb.ts          — getSharedTronWeb() (1 instance, dùng chung)
  balance.ts
  identity.ts
  utils.ts
  adapters/{default-adapters,injected-adapter,bridge,combinators}.ts
  injected/{detect,registry-map}.ts
```

**Synergy — làm CHUNG với P1.5**: bản viết lại identity (`identity.ts`) và `tronweb.ts` dùng chung trùng khít với refactor này. Nên **làm identity + tách module một lượt** để tránh sửa file 2 lần. `balance.ts` hiện cũng tự dựng tronWeb riêng (`resolveBalanceTronWeb`) → gộp về `tronweb.ts` dùng chung luôn.

**Ràng buộc refactor (bắt buộc)**:
- **Thuần cơ học, KHÔNG đổi hành vi**: chỉ di chuyển code + sửa import; không đổi logic, không đổi signature public.
- `index.ts` giữ đúng bộ `export` như cũ (barrel) → app import không vỡ.
- Làm **từng bước, commit/verify từng module** (file 1.120 dòng trên OneDrive: KHÔNG rewrite cả file một lần — cắt từng khối sang file mới, xoá khối cũ, chạy typecheck). Xem quy tắc file lớn/OneDrive ở mục 0.
- Sau mỗi module tách: `pnpm --filter @tron-wallet-kit/client typecheck && pnpm test` phải xanh.
- Không đụng `core`/`ui`/`adapters` khác — chỉ nội bộ `client`.

**Gợi ý thứ tự tách (ít rủi ro → nhiều)**: `types.ts` → `utils.ts` → `injected/*` → `adapters/*` → `balance.ts` + `tronweb.ts` → `identity.ts` (kèm P1.5) → `client.ts` → `kit.ts` → dọn `index.ts` thành barrel.

### 5b.1 Đối chiếu XRPL Wallet Kit — CHÚ Ý hướng tổ chức khác nhau
Hai kit đang tổ chức khác nhau, **KHÔNG bê nguyên XRPL sang TRON**. Bảng dưới để coder hiểu cái nào cố ý giữ khác, cái nào cần hội tụ:

| Vùng | XRPL | TRON hiện tại | Quyết định cho TRON |
| --- | --- | --- | --- |
| Độ dày client | mỏng (`index.ts` 406 dòng, chỉ factory + wiring) | dày (1.120 dòng, ôm mọi thứ) | **Hội tụ**: thin client bằng tách module (mục 5b). |
| Identity/balance resolver | ở package **`ui`** (dùng `fetch` nhẹ) | ở **`client`** | **GIỮ ở `client`** (chỉ tách file). Lý do: resolver TRON dùng `tronWeb` (nặng) → nhét vào `ui` headless sẽ phình `ui` + kéo dep. Divergence này **cố ý, đúng cho TRON**. |
| Dò injected provider | phân tán **per-adapter** | tập trung ở `client` | Ngắn hạn **giữ tập trung** (`injected/*`) vì nhiều ví TRON pattern `window.X` giống nhau (DRY). Dài hạn khi bridge `@tronweb3` tiếp quản → chuyển dần về per-adapter. Ghi chú, chưa đổi vội. |
| Session enrichment (activation/status) | ở **core** (`enrichSession`/`resolveActivationStatus`, tự động mỗi connect) | **thiếu** ở core | **Hội tụ**: đẩy về core — đã nằm trong `CORE_RUNTIME_SPEC.md` (P0). Client/UI không tự enrich rời rạc. |
| tronWeb dùng chung | (XRPL dùng RPC ws, không cần) | balance tự dựng riêng, identity tự dựng riêng | **Hội tụ nội bộ TRON**: 1 `tronweb.ts` dùng chung (identity + balance + bridge broadcast). |
| Bridge/combinator adapter | không có | có (`createFallback*`, `createAvailabilityProbe*`, bridge) | Giữ — đặc thù TRON (bọc `@tronweb3`). Chỉ tách sang `adapters/`. |

**Tinh thần**: TRON không cần "core dày như XRPL" ở mọi chỗ (TRON không có reserve/activation kiểu XRPL), nhưng **client đang gánh quá nhiều** → tách module + đẩy enrichment/timeout/reconnect về core (P0) là hướng đúng. Resolver giữ ở client là divergence hợp lý vì dep `tronWeb`, đừng bê sang `ui`.

### 5c. Wallet Registry — quyết định CUỐI: descriptor tự chứa + inject catalog runtime

> Bãi bỏ hướng "manifest tách ở core" (bên dưới, đánh dấu ~~lỗi thời~~). Lý do: bắt ví ngoài khai báo mà phải đụng 3 package (metadata→core, icon→ui, integration→client) là **không khả thi cho đóng góp mở** — xé lẻ 1 ví ra 3 chỗ, và không cho phép bên thứ ba tự đăng ký từ app của họ.

**Nguyên nhân gốc**: manifest-in-core chỉ để `ui` **đọc catalog TĨNH**. Nhưng nếu `ui` **nhận catalog lúc RUNTIME** (client bơm xuống) thì không cần manifest ở core, và cũng hết reverse-dep (không ai import ngược; client — lớp trên — đẩy data xuống ui).

**Chốt kiến trúc (cuối)**:
- **1 ví = 1 `WalletDescriptor` TỰ CHỨA trọn vẹn**: `metadata + icon (SVG/data-url inline) + integration (importer/detect/signMessageMode)`. Ở **1 chỗ duy nhất** — không xé lẻ.
- **`ui` catalog-agnostic**: expose API `setCatalog(entries)`; render từ data bơm vào lúc runtime; KHÔNG giữ wallet data/icon tĩnh. Giữ `ui ← core`, không đụng client.
- **`client`** đọc danh sách descriptor → `buildAdapters()` nạp manager + `buildCatalog()` bơm xuống `ui`. `client ← ui` (hợp lệ). **Không reverse-dep, không manifest-in-core.**

**Phục vụ CẢ HAI kiểu "ví khác chủ động thêm"** (dùng chung 1 shape descriptor):
1. **PR vào repo kit**: push **đúng 1 file** `client/src/wallets/entries/<id>.ts` (đủ metadata + icon + integration) + 1 dòng `registry.ts`. Không đụng core/ui.
2. **Runtime plugin, KHÔNG sửa kit**: bên thứ ba tự dựng descriptor và truyền vào — `createWalletKit({ wallets: [...builtIn, myWalletDescriptor] })`. Kit không cần biết trước ví đó. (Đây là "mở" thật sự.)

**Kiểm chứng không reverse-dep**:
- `client`: đọc entries (local) → `buildCatalog()` → `ui.setCatalog(...)`. ✅ `client←ui`.
- `ui`: nhận catalog runtime, render. Không import wallet data. ✅ `ui←core` giữ nguyên.
- `core`/`adapters`: không phụ thuộc `client`/`ui`. ✅

**Lưu ý triển khai**:
- **Icon** (workflow "drop file = id"):
  - Thư mục thô **`client/src/wallets/icons/<id>.svg`** (tên file = id ví) — nơi đổ icon vào.
  - **Prebuild codegen** `scripts/gen-wallet-icons.mjs` quét thư mục → normalize SVG → base64 data-url → sinh **`client/src/wallets/icons.generated.ts`**: `export const WALLET_ICONS: Record<string,string> = { safepal: "data:image/svg+xml;base64,…" }`. Gắn vào `prebuild`/`prepack` hook (contributor không chạy tay). **Base64 sinh lúc BUILD, không runtime** (browser không có `fs`). File generated commit vào repo (cũng là public export `walletIcons`).
  - Builder resolve `descriptor.icon ?? WALLET_ICONS[descriptor.id]` → **builtin bỏ trống `icon`, auto theo id**; **third-party runtime** truyền `icon` (URL) inline vì không đổ file vào repo.
  - **UI icon-agnostic**: BỎ `packages/ui/src/wallets/icons/` + mọi lookup icon trong ui; icon đến từ catalog runtime (`<img src=dataUrl>`); fallback chữ cái generic vẫn ở ui.
  - Chỉ codegen cho **icon** (để có "push đúng file"); descriptor entries vẫn khai tay, không codegen.
- `WalletDescriptor` + `defineWallet()` phải là **public API** của `client` (để runtime-plugin dùng). `wallets?: WalletDescriptor[]` trong `WalletClientConfig` = builtin ∪ custom.
- "Static manifest dùng chung" (nếu cần cho website/docs) = **artifact GENERATE ra từ entries**, không phải nguồn khai báo → không ép ai split.
- Bridge integration vẫn **lazy importer** (không static import `@tronweb3` vào bundle mặc định).

**→ Sửa `WALLET_REGISTRY_SPEC.md`**: bỏ split manifest/integration; `WalletDescriptor` tự chứa; thêm mục "runtime plugin registration" + `ui.setCatalog`. Mục 5 (đóng góp) đổi lại: **1 file entry (client) + 1 dòng registry**, icon inline — không còn 3-package.

<details><summary>~~Hướng cũ (Phase 2, đã bãi bỏ): manifest tách ở core~~</summary>

~~Static manifest (data) ở `core/src/wallets/manifest.ts`; integration ở `client/entries`; icon ở `ui`. Bãi bỏ vì xé lẻ 1 ví ra 3 package → không khả thi cho đóng góp ngoài.~~
</details>

---

## 6. Definition of done (chung)

- `pnpm -r typecheck && pnpm test && pnpm build:browser` xanh trên Windows.
- Không thêm test đỏ; giữ toàn bộ test cũ xanh.
- Không phá backward-compat (app không đổi config vẫn chạy như cũ).
- Mỗi file sau khi sửa: verify tail + không null-byte (đặc biệt file lớn `modal.ts`/`styles.ts` trên OneDrive).
- Không commit `PROJECT_MEMORY.md`; không đẩy nội dung vào `docs/` public.

## 7. Danh sách spec đính kèm
- `IMPLEMENTATION_HANDOFF.md` — đọc trước, là điểm vào/mục lục work-order.
- `CORE_RUNTIME_SPEC.md` — P0.
- `UI_CONFIG_GAPS_SPEC.md` — P1 (Phần A) + P1.5 (Phần B).
- `IDENTITY_DIRECT_CONTRACT_SPEC.md` — P1.5 (bỏ trondomainjs, gọi contract mainnet-only, tronWeb dùng chung).
- `TRONWALLET_ADAPTER_BRIDGE_SPEC.md` — P2 (code xong, còn QA/docs).
- `WALLET_REGISTRY_SPEC.md` — P3 (descriptor mở, gộp khai báo ví, quy trình push ví mới).
- `ADD_NEW_WALLET_GUIDE.md` — hướng dẫn thêm ví (cây quyết định bridge/injected/WC + ví dụ SafePal).
