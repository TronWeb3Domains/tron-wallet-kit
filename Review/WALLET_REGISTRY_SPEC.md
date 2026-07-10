# Spec: Wallet Registry mở — 1 descriptor chuẩn cho mỗi ví

Mục tiêu: **một đối tượng đăng ký (`WalletDescriptor`) duy nhất** mô tả trọn vẹn 1 ví (metadata + icon + cách tích hợp), làm **nguồn sự thật duy nhất**. Kit tự sinh ra cả **catalog UI** lẫn **adapter runtime** từ đó. Thêm ví mới (ngoài các ví `@tronweb3` hỗ trợ) = **push 1 file theo mẫu**, không phải sửa nhiều chỗ.

Bối cảnh: hiện khai báo ví bị **rải 3 nơi** — `core/wallet-registry.ts` (metadata), `ui/wallet-catalog.ts` (catalog), `client` (`injected`/`bridge` config). Gộp về 1 registry. (Ăn khớp với refactor client mục 5b của `IMPLEMENTATION_HANDOFF.md`.)

> **⚠️ QUYẾT ĐỊNH CUỐI (đọc mục 5c `IMPLEMENTATION_HANDOFF.md` trước — ưu tiên hơn mọi mô tả bên dưới):** `WalletDescriptor` **TỰ CHỨA trọn vẹn** (metadata + icon inline + integration) ở **1 chỗ** (`client/src/wallets/entries/<id>.ts`). KHÔNG tách manifest ra `core`, KHÔNG để icon ở `ui`. `ui` **catalog-agnostic**: nhận catalog qua `ui.setCatalog(...)` lúc runtime (client bơm xuống → không reverse-dep). Descriptor là **public API** để bên thứ ba tự đăng ký runtime: `createWalletKit({ wallets: [...builtIn, myWalletDescriptor] })` — không cần sửa kit. Các mục 2–5 dưới đây giữ ý tưởng descriptor/union nhưng **bỏ mọi chỗ nói "manifest ở core" / "icon ở ui riêng" / "3-package"**; đóng góp ví mới = **1 file entry (client) + 1 dòng registry**, icon inline.

> **⚠️ CHIẾN LƯỢC TÍCH HỢP (mặc định = injected, KHÔNG mặc định bridge):** đa số ví TRON theo **chuẩn inject TronLink** (`window.tronWeb` + hook `tron_requestAccounts`, ký `tronWeb.trx.sign/signMessageV2`). ⇒ **`integration:"injected"` là mặc định** cho hầu hết ví (TokenPocket, OKX, Bitget, Trust, imToken, Gate, Foxwallet, Bybit, OneKey, Binance…) → **bỏ import package `@tronweb3`**, kit nhẹ hẳn. `"tronweb3-bridge"` chỉ dùng khi generic không kham nổi; `"custom"` cho ví đặc biệt. **Kit ship ZERO dep `@tronweb3`.** Chia 3 nhóm:
- **Ví inject chuẩn TronLink (đa số)** → `integration:"injected"`, **tự viết**, học provider path/quirk/event từ source @tronweb3 làm tham chiếu (KHÔNG phụ thuộc package). **Generic injected adapter phải implement giao thức `message`-event của TronLink MỘT LẦN** → mọi ví chuẩn tự có onAccountChanged/onNetworkChanged. Provider path mỗi ví **QA thật, đừng đoán** (vd OKX `okxwallet.tronLink`, Bitget `bitkeep`).
- **MetaMask-TRON** (niche, tích hợp không tầm thường): **mặc định KHÔNG kèm**. App cần thì tự cài `@tronweb3/tronwallet-adapter-metamask-tron` và truyền instance qua **bridge** (dep thuộc app).
- **Ledger/hardware**: **ĐƯA VÀO v1** qua bridge — **KHÔNG tự reimplement hardware** (transport/APDU rủi ro cao). Kit ship sẵn **descriptor Ledger** (`integration:"tronweb3-bridge"`, lazy importer `() => import("@tronweb3/tronwallet-adapter-ledger")`); package này khai là **`optional peerDependency`** (không bundle). App cài `@tronweb3/tronwallet-adapter-ledger` → Ledger bật; chưa cài → importer fail êm → Ledger hiện **unavailable/ẩn** (không vỡ). ⇒ "zero **hard** dep @tronweb3" vẫn giữ (peer optional).
- **WalletConnect**: adapter native sẵn có.

**Bridge = API interop CÔNG KHAI, không phải hard dependency của kit**: `@tronweb3/tronwallet-adapter-*` (ledger, và metamask-tron nếu app muốn) là **optional peer** — app cài để bật; kit không gánh trong `dependencies`. Bridge cũng là escape hatch cho ví injected quá quirky.

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
  icon?: string;  // builtin: BỎ trống → builder lấy WALLET_ICONS[id] (từ icons/<id>.svg). runtime: truyền URL/data-url.
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
  icons/                 — icon THÔ, tên file = id ví (đổ vào đây)
    tronlink.svg
    safepal.svg
  icons.generated.ts     — codegen: export const WALLET_ICONS = { safepal: "data:image/svg+xml;base64,…" } (= public `walletIcons`)
  registry.ts            — export const WALLETS: WalletDescriptor[] = [ tronlink, tokenpocket, okx, ..., safepal ]
  entries/
    _template.ts         — MẪU để copy
    tronlink.ts … safepal.ts   ← 1 file/ví (BỎ trống icon → auto theo id)
  build-catalog.ts       — WalletDescriptor[] → catalog UI (đẩy xuống ui.setCatalog); icon = descriptor.icon ?? WALLET_ICONS[id]
  build-adapters.ts      — WalletDescriptor[] → adapter runtime (bridge/injected/wc/custom), lazy
scripts/gen-wallet-icons.mjs — quét icons/*.svg → normalize SVG → base64 → sinh icons.generated.ts (chạy ở prebuild/prepack hook)
```
- Mỗi ví = **1 file `entries/`** export descriptor; **`icon` để trống** → builder tự lấy `WALLET_ICONS[id]`.
- **Icon workflow "drop file = id"**: đổ `icons/<id>.svg` (tên = id) → codegen sinh base64 vào `icons.generated.ts`. **Base64 sinh lúc BUILD** (browser không có `fs`); file generated commit repo.
- **Icon KHÔNG ở `ui` nữa**: UI icon-agnostic, icon đến từ catalog runtime. Third-party runtime tự truyền `icon` (URL) inline (không đổ file vào repo).
- Chỉ **icon** dùng codegen; `registry.ts`/entries vẫn khai tay (import tường minh, bundle dự đoán được).

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
Đổ `icons/safepal.svg` (tên = id) + tạo `entries/safepal.ts` (bỏ trống `icon`) + 1 dòng `registry.ts`. Codegen tự đưa icon vào `WALLET_ICONS["safepal"]`. Xong — hiện trong list, badge INSTALLED tự chạy theo detect.

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
2. `packages/client/src/wallets/icons/<id>.svg` — đổ icon thô (tên file = id); codegen tự base64. (Không cần sửa `icons.generated.ts` bằng tay.)
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
- [ ] 1 file `entries/<id>.ts` (bỏ trống `icon`) + `icons/<id>.svg` (tên = id) + 1 dòng `registry.ts`.
- [ ] Chọn đúng `integration`; điền đủ field bắt buộc (TS ép).
- [ ] QA thật: detect / connect / address / signMessage / signTransaction (+ mobile nếu có).
- [ ] `pnpm -r typecheck && pnpm test && pnpm build:browser` xanh.
- [ ] Không thêm dep nặng vào bundle mặc định (ví bridge phải **lazy `importer`**).

---

## 5b. Quyền hiển thị của người tích hợp (GIỮ NGUYÊN khi refactor)

Tách bạch 2 tầng — **đừng gộp**:
- **Descriptor = mặc định của tác giả ví**: `featured?: number` (gợi ý vị trí nổi bật), `group`. Chỉ là *đề xuất*.
- **`ui.walletList` = quyết định của INTEGRATOR** (đã có sẵn trong code, phải giữ):
  - `featuredWallets: string[]` + `featuredLimit` → chọn **ví nổi bật** + thứ tự (đè descriptor). Ưu tiên: `featuredWallets` > `descriptor.featured` > fallback.
  - `wallets: "all" | string[]` (whitelist) / `disabledWallets: string[]` (blacklist) → chọn ví trong **All Wallets**.
  - `showUnavailable`, `sortAvailableFirst`.

⇒ Ví (kể cả runtime-plugin bên thứ ba) chỉ *đề xuất*; **hiện gì ở featured / All Wallets là do integrator quyết** qua `walletList`. Cơ chế chạy ở UI (`applyWalletListConfig` + `getFeaturedWalletOptions`) trên catalog đã inject → khi refactor sang descriptor tự chứa + `setCatalog`, **phải giữ nguyên** `walletList` áp lên catalog runtime. Custom wallet có `id` nên integrator feature/whitelist y như builtin.

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
