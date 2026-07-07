# Spec: Wallet Registry mở — 1 descriptor chuẩn cho mỗi ví

Mục tiêu: **một đối tượng đăng ký (`WalletDescriptor`) duy nhất** mô tả trọn vẹn 1 ví (metadata + icon + cách tích hợp), làm **nguồn sự thật duy nhất**. Kit tự sinh ra cả **catalog UI** lẫn **adapter runtime** từ đó. Thêm ví mới (ngoài các ví `@tronweb3` hỗ trợ) = **push 1 file theo mẫu**, không phải sửa nhiều chỗ.

Bối cảnh: hiện khai báo ví bị **rải 3 nơi** — `core/wallet-registry.ts` (metadata), `ui/wallet-catalog.ts` (catalog), `client` (`injected`/`bridge` config). Gộp về 1 registry. (Ăn khớp với refactor client mục 5b của `IMPLEMENTATION_HANDOFF.md`.)

---

## 1. Descriptor: union theo cách tích hợp

`packages/client/src/wallets/types.ts`:
```ts
type WalletPlatform = "extension" | "mobile" | "hardware";

type BaseWalletDescriptor = {
  id: string;                         // "safepal"
  name: string;                       // "SafePal"
  homepage: string;
  downloadUrl?: string;
  platforms: WalletPlatform[];        // ["extension","mobile"]
  group?: "popular" | "hardware" | "more";
  featured?: number;                  // vị trí ưu tiên màn đầu; bỏ trống = chỉ trong "All Wallets"
  description?: string;
  // icon: lấy theo id từ packages/ui/src/wallets/icons/<id>.svg (hoặc icon?: string inline)
  icon?: string;
};

// (A) Ví có adapter chính thức @tronweb3 → bọc bằng bridge
type Tronweb3BridgeDescriptor = BaseWalletDescriptor & {
  integration: "tronweb3-bridge";
  importer: () => Promise<unknown>;              // () => import("@tronweb3/tronwallet-adapter-okxwallet")
  adapterExport?: string;                        // tên export nếu không phải default (vd "OkxWalletAdapter")
  signMessageMode?: "raw" | "messageObject";
  injectedFallback?: InjectedDetect;             // optional: dò injected khi package lỗi/thiếu
};

// (B) Ví inject window.tronWeb (TronLink-family) → generic injected  ← SafePal ở đây
type InjectedDescriptor = BaseWalletDescriptor & {
  integration: "injected";
  detect: InjectedDetect;
  requestMethods?: string[];                     // mặc định ["tron_requestAccounts"]
  signMessageMode?: "signMessageV2" | "sign" | "request"; // cách ký message của ví
};

// (C) Ví chỉ hỗ trợ mobile qua WalletConnect
type WalletConnectDescriptor = BaseWalletDescriptor & {
  integration: "walletconnect";
};

// (D) Ví quirk nặng, API riêng → adapter tự viết (hiếm)
type CustomDescriptor = BaseWalletDescriptor & {
  integration: "custom";
  createAdapter: (ctx: WalletBuildContext) => WalletAdapter;
};

type InjectedDetect = {
  providerPaths?: string[];                      // ["tronLink","tron"] — đường tới object có .request/.tronWeb
  provider?: () => InjectedTronProvider | undefined; // composer cho ca phức tạp (2 global tách rời)
};

export type WalletDescriptor =
  | Tronweb3BridgeDescriptor | InjectedDescriptor | WalletConnectDescriptor | CustomDescriptor;
```

> `integration` là **discriminant**: TypeScript ép mỗi loại khai đủ field cần thiết → dev không thể quên tham số bắt buộc.

---

## 2. Bố cục thư mục (open, 1 file/ví)

```
packages/client/src/wallets/
  types.ts               — WalletDescriptor (mục 1)
  registry.ts            — export const WALLETS: WalletDescriptor[] = [ tronlink, tokenpocket, okx, ..., safepal ]
  entries/
    _template.ts         — MẪU để copy
    tronlink.ts
    tokenpocket.ts
    okx.ts
    bitget.ts
    trust.ts
    metamask.ts
    safepal.ts           ← dev thêm file này
  build-catalog.ts       — WalletDescriptor[] → catalog UI (TronWalletCatalogItem)
  build-adapters.ts      — WalletDescriptor[] → adapter runtime (bridge/injected/wc/custom), lazy
```
- Mỗi ví = **1 file trong `entries/`** export 1 descriptor.
- `registry.ts` import tường minh (giữ tree-shaking/bundle dự đoán được) → thêm ví = thêm 1 dòng import + 1 phần tử mảng.
- Icon để ở `packages/ui/src/wallets/icons/<id>.svg`, resolve theo `id` (hoặc `icon` inline trong descriptor).

---

## 3. Hai builder (thay 3 nơi khai báo rải rác)

`build-adapters.ts`:
```ts
export function buildAdapters(wallets: WalletDescriptor[], ctx: WalletBuildContext): WalletAdapter[] {
  return wallets.filter(w => ctx.enabled(w.id)).map((w) => {
    switch (w.integration) {
      case "tronweb3-bridge":
        return createLazyTronwalletBridgeAdapter({
          id: w.id, metadata: toMeta(w), importer: w.importer, adapterExport: w.adapterExport,
          signMessageMode: w.signMessageMode, injectedFallback: w.injectedFallback, tronWeb: ctx.tronWeb
        });
      case "injected":
        return createInjectedTronAdapter({
          id: w.id, name: w.name, icon: iconOf(w), homepage: w.homepage, downloadUrl: w.downloadUrl,
          platforms: w.platforms, providerPaths: w.detect.providerPaths ?? [], provider: w.detect.provider,
          requestMethods: w.requestMethods, signMessageMode: w.signMessageMode
        });
      case "walletconnect":
        return ctx.walletConnectAdapterFor(w);       // route qua WC adapter sẵn có
      case "custom":
        return w.createAdapter(ctx);
    }
  });
}
```
`build-catalog.ts`: map mỗi descriptor → `TronWalletCatalogItem` (id/name/icon/homepage/downloadUrl/group/platforms/transport/`walletConnectFallback`/`featured`). `featured` sinh ra thứ tự màn đầu (thay `featuredOrder` hardcode).

`client` chỉ còn: `const WALLETS = applyUserOverrides(BUILTIN_WALLETS, config); manager.register(...buildAdapters(WALLETS, ctx)); ui.setCatalog(buildCatalog(WALLETS));`

---

## 4. SafePal = 1 file `entries/safepal.ts`

```ts
import type { WalletDescriptor } from "../types";

export const safepal: WalletDescriptor = {
  id: "safepal",
  name: "SafePal",
  integration: "injected",
  homepage: "https://www.safepal.com",
  downloadUrl: "https://www.safepal.com/download",
  platforms: ["extension", "mobile"],
  group: "popular",
  requestMethods: ["tron_requestAccounts"],
  signMessageMode: "sign",                 // SafePal ký message bằng tronWeb.trx.sign
  detect: {
    // request ở window.SafePalHook, tronWeb ở window.tronWeb → composer gộp lại
    provider: () => {
      const g = globalThis as any;
      if (!g.SafePalHook || !g.tronWeb) return undefined;   // = window.SafePalHook && window.tronWeb
      return { tronWeb: g.tronWeb, request: (a: { method: string; params?: unknown }) => g.SafePalHook.request(a) };
    }
  }
};
```
Thêm `entries/safepal.ts` + `icons/safepal.svg` + 1 dòng trong `registry.ts`. Xong — hiện trong list, badge INSTALLED tự chạy theo detect.

Ví có `@tronweb3` (vd một ví X publish package) thì file entry chỉ khác `integration`:
```ts
export const x: WalletDescriptor = {
  id: "x", name: "X Wallet", integration: "tronweb3-bridge",
  homepage: "...", platforms: ["extension"], group: "popular",
  importer: () => import("@tronweb3/tronwallet-adapter-x")
};
```

---

## 5. Quy trình đóng góp trên GitHub (file tiêu chuẩn)

Dev muốn thêm ví mới **push đúng 3 thứ**:
1. `packages/client/src/wallets/entries/<id>.ts` — 1 descriptor (copy `_template.ts`).
2. `packages/ui/src/wallets/icons/<id>.svg` — icon (ưu tiên SVG; PNG data-URL cũng được).
3. Thêm 1 dòng vào `packages/client/src/wallets/registry.ts` (import + push vào `WALLETS`).

`_template.ts` (mẫu bắt buộc, có comment hướng dẫn chọn `integration`):
```ts
import type { WalletDescriptor } from "../types";
/**
 * 1) Có @tronweb3/tronwallet-adapter-<id>?  → integration:"tronweb3-bridge" + importer
 * 2) Inject window.tronWeb (TronLink-family)? → integration:"injected" + detect
 * 3) Chỉ mobile qua WalletConnect?           → integration:"walletconnect"
 * 4) Quirk nặng?                             → integration:"custom" + createAdapter
 */
export const myWallet: WalletDescriptor = {
  id: "mywallet", name: "My Wallet", integration: "injected",
  homepage: "https://...", downloadUrl: "https://...",
  platforms: ["extension"], group: "popular",
  detect: { providerPaths: ["myWalletTron", "tron"] }
};
```

**PR checklist** (đưa vào `.github/PULL_REQUEST_TEMPLATE` hoặc `CONTRIBUTING.md`):
- [ ] 1 file `entries/<id>.ts` + icon `<id>.svg` + 1 dòng `registry.ts`.
- [ ] Chọn đúng `integration`; điền đủ field bắt buộc (TS ép).
- [ ] QA thật: detect / connect / address / signMessage / signTransaction (+ mobile nếu có).
- [ ] `pnpm -r typecheck && pnpm test && pnpm build:browser` xanh.
- [ ] Không thêm dep nặng vào bundle mặc định (ví bridge phải **lazy `importer`**).

---

## 6. Validate (giữ registry sạch khi mở PR)
- **JSON Schema / zod** cho phần tĩnh của descriptor (id unique, name, homepage URL hợp lệ, platforms hợp lệ, icon tồn tại) → chạy trong CI + test `registry.test.ts` (duyệt `WALLETS`, assert từng entry).
- Lint: `id` phải khớp tên file + tên icon; `featured` không trùng số; bridge entry phải có `importer` là dynamic import (không static).

---

## 7. Backward-compat & tích hợp refactor
- Giữ export cũ (`createDefaultAdapters`, `createInjectedTronAdapter`, catalog cũ) làm **wrapper** đọc từ registry, để app hiện tại không vỡ.
- Làm **chung với mục 5b (tách client)**: `wallets/` chính là module "adapters/injected/catalog" gộp lại đúng tinh thần đó. `build-adapters.ts` dùng `tronweb.ts` dùng chung (mục P1.5).
- `signMessageMode` cho injected: mở rộng `createInjectedTronAdapter` để tôn trọng mode (`signMessageV2` | `sign` | `request`) thay vì hardcode — fix luôn ca SafePal thiếu `signMessageV2`.

---

## 8. Route-map
1. `wallets/types.ts` (descriptor union) + `_template.ts`.
2. `build-catalog.ts` + `build-adapters.ts`; `createInjectedTronAdapter` nhận `signMessageMode`.
3. Chuyển các ví hiện có (tronlink/tokenpocket/okx/bitget/trust/metamask + injected/bridge) thành `entries/*.ts`; `registry.ts` gom lại.
4. `client` đọc registry qua 2 builder; giữ export cũ làm wrapper.
5. `entries/safepal.ts` + icon (ví mẫu đầu tiên "ngoài @tronweb3").
6. `registry.test.ts` + CI validate; `CONTRIBUTING.md` + PR template.
7. Windows: `pnpm -r typecheck && pnpm test && pnpm build:browser`.

## 9. Ràng buộc
- Registry là **nguồn sự thật duy nhất**; không khai trùng ở core/ui/client nữa (giữ wrapper tương thích).
- Bridge entry **bắt buộc lazy `importer`** — không static import ví @tronweb3 vào bundle mặc định.
- Không private key/secret/projectId trong descriptor.
- Thêm ví = thêm file, **không sửa builder** (trừ khi thêm `integration` mới).
