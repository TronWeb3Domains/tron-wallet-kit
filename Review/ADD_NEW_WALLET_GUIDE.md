# Guide: Thêm một ví TRON mới (ví dụ SafePal)

Khi có ví TRON mới, **chọn đúng đường tích hợp** theo cây quyết định dưới. Đa số chỉ tốn 1 catalog entry + 1 đăng ký, **không viết adapter từ đầu**.

---

## 1. Cây quyết định (chọn 1 trong 4)

```
Ví mới ──> (1) Có package @tronweb3/tronwallet-adapter-<x> chính thức?
              │  CÓ  → BRIDGE: createLazyTronwalletBridgeAdapter + catalog entry. Zero code adapter.
              │  KHÔNG ↓
           (2) Ví inject kiểu window.tronWeb (TronLink-family: có window.tronWeb + hook .request)?
              │  CÓ  → GENERIC INJECTED: createInjectedTronAdapter + catalog entry. Không cần package/bridge.
              │  KHÔNG ↓
           (3) Ví chỉ hỗ trợ mobile qua WalletConnect?
              │  CÓ  → catalog entry với walletConnectFallback:true, route qua WC adapter sẵn có.
              │  KHÔNG ↓
           (4) Ví có quirk đặc thù nặng (API riêng, không theo tronWeb)?
                 → Viết package adapter riêng packages/adapters/<x>/ (hiếm khi cần).
```

Kiểm tra (1) nhanh: `npm view @tronweb3/tronwallet-adapter-<tên>` — có thì dùng bridge, 404 thì bỏ qua.

---

## 2. SafePal thuộc nhánh (2) — GENERIC INJECTED

Theo docs SafePal (devdocs.safepal.com/Connect-wallet/Web/tron.html):
- **Detect**: `window.SafePalHook && window.tronWeb`
- **Platform**: `window.sfpPlatform` = `"ext"` (PC) | `"iOS"`/`"Android"` (in-app, tự kết nối).
- **Connect**: `await SafePalHook.request({ method: 'tron_requestAccounts' })` → địa chỉ ở `SafePalHook.defaultAddress.base58`.
- **Sign tx / message**: `window.tronWeb.trx.sign(...)`.

⇒ Không có `@tronweb3` package (npm 404) ⇒ **KHÔNG bridge**. Đây đúng dạng `createInjectedTronAdapter` đã có sẵn ở `packages/client`.

### 2.1 Vướng nhỏ: request và tronWeb là 2 global tách rời
`createInjectedTronAdapter` mong 1 object provider vừa có `.request` (để connect) vừa có `.tronWeb` (để ký). SafePal thì `.request` nằm ở `window.SafePalHook`, còn `.tronWeb` ở `window.tronWeb`. Nên **dùng custom `provider` composer** gộp lại (thay vì `providerPaths`):

```ts
import { createInjectedTronAdapter } from "@tron-wallet-kit/client";

const safepalAdapter = createInjectedTronAdapter({
  id: "safepal",
  name: "SafePal",
  icon: safepalIcon,                       // thêm icon vào registry (mục 3)
  homepage: "https://www.safepal.com",
  downloadUrl: "https://www.safepal.com/download",
  platforms: ["extension", "mobile"],
  requestMethods: ["tron_requestAccounts"],
  provider: () => {
    const g = globalThis as any;
    const hook = g.SafePalHook;
    const tronWeb = g.tronWeb;
    if (!hook || !tronWeb) return undefined;              // = detect: window.SafePalHook && window.tronWeb
    return {
      tronWeb,                                            // ký: tronWeb.trx.sign / signMessageV2
      request: (args: { method: string; params?: unknown }) => hook.request(args) // connect
    };
  }
});
```

Vì sao chạy: adapter gọi `requestInjectedAddress(provider, ["tron_requestAccounts"])` → `provider.request({method})`; SafePal không trả address trong result nên rơi xuống fallback `provider.tronWeb?.defaultAddress?.base58` (đã populate sau khi connect). Ký tx qua `tronWeb.trx.sign` — khớp nhánh sẵn có trong `signTransaction`.

### 2.2 Caveat cần QA
- **signMessage**: adapter thử `tronWeb.trx.signMessageV2(message)` trước, rồi `tron_signMessage`. Docs SafePal chỉ nêu `tronWeb.trx.sign(message)`. Nếu SafePal **không có** `signMessageV2`, thêm nhánh fallback `tronWeb.trx.sign(message)` cho message (chỉ sửa 1 dòng trong `createInjectedTronAdapter`, dùng chung mọi ví TronLink-family thiếu V2).
- **Mobile in-app**: `sfpPlatform` là iOS/Android thì SafePal tự kết nối; `defaultAddress.base58` có sẵn — `isAvailable()` vẫn true nên OK. Không cần nút "connect" riêng.
- **Broadcast**: nếu app cần submit tx, dùng `tronWeb` dùng chung của kit (mục tronweb.ts) — không phụ thuộc adapter.

---

## 3. Đăng ký để hiện trong danh sách ví (bắt buộc, mọi nhánh)

Bất kể nhánh nào, ví phải có mặt ở 2 nơi:

1. **Registry/metadata + icon**:
   - `packages/core/src/wallet-registry.ts` (hoặc nơi giữ metadata) + icon SVG ở `packages/ui/src/wallets/icons/`.
   - Catalog UI: `packages/ui/src/wallet-catalog.ts` → thêm `TronWalletCatalogItem`:
     ```ts
     { id: "safepal", name: "SafePal", group: "popular",
       homepage: "https://www.safepal.com", downloadUrl: "https://www.safepal.com/download",
       transport: "extension", platforms: ["extension","mobile"],
       walletConnectFallback: false }
     ```
   - Muốn nổi bật ở màn đầu thì thêm id vào `featuredOrder`; không thì nó nằm trong "All Wallets".

2. **Đăng ký adapter** (một trong hai):
   - **App tự truyền**: `createWalletKit({ adapters: [safepalAdapter, ...] })` — nhanh nhất, không đụng kit.
   - **Mặc định trong kit**: thêm vào `createDefaultAdapters` (client) như các ví injected khác (dùng `injectedFallbackFromRegistry` nếu theo pattern registry).

> Badge INSTALLED/NOT INSTALLED tự chạy theo `isAvailable()` (detect provider) — không cần khai thêm.

---

## 4. Vì sao SafePal KHÔNG dùng bridge
`tronwallet-bridge` **bọc instance `@tronweb3/tronwallet-abstract-adapter`**. SafePal không phát hành package đó (npm 404). Có thể tự viết 1 lớp implement interface abstract rồi nhét vào bridge — nhưng công sức bằng đúng việc dùng `createInjectedTronAdapter` sẵn có, nên **không đáng**. Bridge chỉ để mượn adapter chín của `@tronweb3`; ví inject `window.tronWeb` thuần thì đi đường generic injected gọn hơn.

Khi nào SafePal nên chuyển sang bridge: nếu sau này họ **publish** `@tronweb3/tronwallet-adapter-safepalwallet` → đổi sang `createLazyTronwalletBridgeAdapter({ id:"safepal", importer:() => import("@tronweb3/tronwallet-adapter-safepalwallet"), ... })` để hưởng bảo trì upstream.

---

## 5. Checklist thêm ví mới (rút gọn)
- [ ] Xác định nhánh: có `@tronweb3` package? inject `window.tronWeb`? chỉ WC?
- [ ] Bridge (nhánh 1) hoặc `createInjectedTronAdapter` (nhánh 2) hoặc WC-fallback (nhánh 3).
- [ ] Thêm icon + catalog entry + (tuỳ) featuredOrder.
- [ ] Đăng ký adapter (app truyền hoặc default trong client).
- [ ] QA thật: detect / connect / address / signMessage / signTransaction / (mobile in-app).
- [ ] `pnpm -r typecheck && pnpm test && pnpm build:browser` (Windows).
