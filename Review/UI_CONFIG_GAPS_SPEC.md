# Spec: Bổ sung cấu hình UI còn thiếu (i18n · theme · modal behavior · QR · branding)

Mục tiêu: mở đủ "núm cấu hình" cho host app dùng kit mà **không phải fork**. Trọng tâm số 1 là **i18n/đa ngôn ngữ** (hiện app KHÔNG thể đổi ngôn ngữ qua config), sau đó là các knob theme/modal/QR/branding còn thiếu.

Phạm vi: `packages/ui` (config + controllers), plumb tiếp qua `client`/`react`/`next`. Không đụng core runtime (đã có spec riêng). Không thêm business logic.

---

## 0. Bảng gap (ưu tiên giảm dần)

| # | Nhóm | Hiện trạng | Mức |
| --- | --- | --- | --- |
| 1 | **i18n / labels** | Chỉ `modal.title`+`subtitle` cấu hình được; ~42 chuỗi còn lại hardcode English trong `modal.ts`/`account-panel.ts`/`button.ts`/`toast.ts`. `WalletUiConfig` **không có** `locale`/`labels`. | 🔴 Cao |
| 2 | Modal behavior | Thiếu `showCloseButton`, `closeOnBackdropClick`, `closeOnSelect`, `disableAnimations` ở config | 🟠 TB |
| 3 | Branding | `poweredBy` hardcode "Powered by TRON Wallet Kit"; `footerText` có nhưng không dùng cho dòng powered-by; không có toggle ẩn | 🟠 TB |
| 4 | QR options | width/margin/logo hardcode (304/4; address 264/8) | 🟡 Thấp |
| 5 | Theme | `customTheme` token-override đã tốt; thiếu: đăng ký **preset đặt tên riêng**, shortcut `accent`/`font` | 🟡 Thấp |
| 6 | Account panel | `maxVisibleTransactions` khai báo nhưng **không plumb**; explorer URL không override được | 🟡 Thấp |
| 7 | UI callbacks | Không có hook UI-level `onOpen/onClose/onWalletSelected` (core đã có event, nhưng UI mở/đóng thì chưa) | 🟡 Thấp |

Phần **đã ổn, giữ nguyên**: themeName (21 preset), mode light/dark/auto + `matchMedia`, `customTheme` override toàn bộ token, walletList (layout/filter/featured/sort), accountPanel toggles (copy/qr/tx/disconnect), toast (position/maxVisible/autoDismiss).

---

## 1. i18n / Labels (ưu tiên cao nhất)

### 1.1 Vấn đề chính xác
- `defaultConnectModalLabels` (modal.ts ~L21-44), `defaultAccountPanelLabels` (account-panel.ts ~L7-21), `defaultWalletButtonLabels` (button.ts ~L7-11), và chuỗi tx trong `toast.ts` — tất cả hardcode English.
- Controller chỉ truyền `labels: { title: config.modal.title, subtitle: config.modal.subtitle }` vào viewModel. `resolveModalBodyModel` merge `{ ...defaultConnectModalLabels, ...viewModel.labels }` → nên **chỉ 2 chuỗi title/subtitle** đổi được; phần còn lại luôn English.
- `resolveWalletUiConfig` (config.ts) **không đụng gì tới labels**.

### 1.2 Thiết kế: `locale` + `labels` trong `WalletUiConfig`
Thêm vào `WalletUiConfig` (types.ts):
```ts
export type WalletKitLocale = "en" | "vi" | (string & {});

export type WalletUiLabels = {
  connectModal?: Partial<ConnectModalLabels>;
  accountPanel?: Partial<AccountPanelLabels>;
  walletButton?: Partial<WalletButtonLabels>;
  toast?: Partial<ToastLabels>;
};

export type WalletUiConfig = {
  // ...giữ nguyên...
  locale?: WalletKitLocale;      // chọn bộ dịch dựng sẵn (en/vi...)
  labels?: WalletUiLabels;       // override từng chuỗi, đè lên locale
};
```

Thứ tự merge (thấp → cao): **default English → locale pack (nếu có) → labels override của app**. Như vậy app có thể: chỉ set `locale:"vi"`, hoặc chỉ override vài chuỗi, hoặc cả hai.

### 1.3 Tách default labels ra module `locales/`
Tạo `packages/ui/src/locales/en.ts`, `vi.ts` và `index.ts`:
```ts
// locales/index.ts
import { en } from "./en";
import { vi } from "./vi";
export const BUILTIN_LOCALES = { en, vi } as const;
export type BuiltinLocaleId = keyof typeof BUILTIN_LOCALES;

export type WalletKitLabelPack = {
  connectModal: ConnectModalLabels;
  accountPanel: AccountPanelLabels;
  walletButton: WalletButtonLabels;
  toast: ToastLabels;
};

export function resolveLabelPack(locale?: string, overrides?: WalletUiLabels): WalletKitLabelPack {
  const base = BUILTIN_LOCALES[(locale as BuiltinLocaleId)] ?? BUILTIN_LOCALES.en;
  return {
    connectModal: { ...BUILTIN_LOCALES.en.connectModal, ...base.connectModal, ...overrides?.connectModal },
    accountPanel: { ...BUILTIN_LOCALES.en.accountPanel, ...base.accountPanel, ...overrides?.accountPanel },
    walletButton: { ...BUILTIN_LOCALES.en.walletButton, ...base.walletButton, ...overrides?.walletButton },
    toast:        { ...BUILTIN_LOCALES.en.toast,        ...base.toast,        ...overrides?.toast }
  };
}
```
> English luôn là lớp nền để không bao giờ thiếu key (kể cả pack ngoài thiếu chuỗi mới).

`en.ts` = đúng các default hiện tại (copy y nguyên `defaultConnectModalLabels` + `defaultAccountPanelLabels` + `defaultWalletButtonLabels` + tx strings). `modal.ts`/`account-panel.ts`/`button.ts` **import từ `locales/en`** thay vì khai báo tại chỗ (giữ backward-compat: nếu viewModel.labels undefined thì vẫn dùng en).

### 1.4 Plumb qua `resolveWalletUiConfig`
```ts
// ResolvedWalletUiConfig thêm:
labels: WalletKitLabelPack;

// trong resolveWalletUiConfig:
labels: resolveLabelPack(config.locale, config.labels),
// title/subtitle vẫn ưu tiên modal.title/subtitle nếu app set trực tiếp:
```
Trong controller (`createWalletModal`/`createWalletInline`/`createAccountPanel`), thay `labels: { title, subtitle }` bằng:
```ts
labels: {
  ...config.labels.connectModal,
  title: config.modal.title,        // modal.title vẫn override
  ...(config.modal.subtitle ? { subtitle: config.modal.subtitle } : {})
}
```
Tương tự account panel dùng `config.labels.accountPanel`, button dùng `config.labels.walletButton`, toast dùng `config.labels.toast`.

### 1.5 Toast strings (đang bị bỏ quên)
`toast.ts` hardcode "Transaction submitted/confirmed/failed". Định nghĩa `ToastLabels`:
```ts
export type ToastLabels = {
  txSubmitted: string; txConfirmed: string; txFailed: string;
  viewOnExplorer?: string; dismiss?: string;
};
```
Đưa vào label pack, controller toast nhận từ config.

### 1.6 Danh sách chuỗi cần dịch (đầy đủ)
**ConnectModal (23):** title, subtitle, allWallets, back, close, connecting, continueInWallet, acceptRequest, tryAgain, getWallet, searchWallet, searchPlaceholder, noWalletsFound, poweredBy, unavailable, ready, installed, notInstalled, qrCode, tron, scanQr, dontHave, (+ badge "CHECKING" nếu tách ra — hiện ở `wallet-options.ts`, nên đưa vào labels: `checking`).
**AccountPanel (13):** title, addressTitle, back, close, copy, copied, disconnect, explorer, showQr, lightQr, noTransactions, recentTransactions, qrAlt.
**WalletButton (3):** connect, connecting, openAccount.
**Toast (3-5):** txSubmitted, txConfirmed, txFailed, viewOnExplorer, dismiss.
> Lưu ý: badge INSTALLED/NOT INSTALLED/CHECKING/QR CODE/TRON hiện sinh trong `wallet-options.ts` bằng literal `.toUpperCase()` — chuyển sang lấy từ labels để dịch được (giữ `.toUpperCase()` chỉ cho en, locale khác giữ nguyên chữ).

### 1.7 Bộ `vi` dựng sẵn (ship kèm)
```ts
// locales/vi.ts
export const vi: WalletKitLabelPack = {
  connectModal: {
    title: "Kết nối ví", subtitle: "", allWallets: "Tất cả ví", back: "Quay lại", close: "Đóng",
    connecting: "Đang kết nối", continueInWallet: "Tiếp tục trong", acceptRequest: "Chấp nhận yêu cầu kết nối trong ví",
    tryAgain: "Thử lại", getWallet: "Cài đặt", searchWallet: "Tìm ví", searchPlaceholder: "Tìm ví",
    noWalletsFound: "Không tìm thấy ví TRON", poweredBy: "Cung cấp bởi TRON Wallet Kit",
    unavailable: "Không khả dụng", ready: "Sẵn sàng", installed: "Đã cài", notInstalled: "Chưa cài",
    qrCode: "Mã QR", tron: "TRON", scanQr: "Quét mã QR bằng điện thoại của bạn", dontHave: "Chưa có"
  },
  accountPanel: {
    title: "Đã kết nối", addressTitle: "Địa chỉ", back: "Quay lại", close: "Đóng",
    copy: "Sao chép địa chỉ", copied: "Đã sao chép", disconnect: "Ngắt kết nối", explorer: "Trình duyệt",
    showQr: "QR", lightQr: "QR sáng", noTransactions: "Chưa có giao dịch gần đây",
    recentTransactions: "Giao dịch gần đây", qrAlt: "Mã QR địa chỉ TRON"
  },
  walletButton: { connect: "Kết nối ví", connecting: "Đang kết nối", openAccount: "Mở tài khoản" },
  toast: { txSubmitted: "Đã gửi giao dịch", txConfirmed: "Giao dịch thành công", txFailed: "Giao dịch thất bại", viewOnExplorer: "Xem trên explorer", dismiss: "Đóng" }
};
```

### 1.8 API dùng (host app)
```ts
createWalletKit({ ui: { locale: "vi" } });                  // toàn bộ tiếng Việt
createWalletKit({ ui: { locale: "vi", labels: { connectModal: { title: "Kết nối" } } } }); // vi + tinh chỉnh
createWalletKit({ ui: { labels: { connectModal: { tryAgain: "Retry" } } } });  // en + đổi 1 chuỗi
```
React: đã nhận qua `ui` prop; thêm shortcut optional `locale?` trên provider nếu muốn tiện (map vào `ui.locale`).

---

## 2. Modal behavior config

Thêm vào `WalletUiConfig.modal`:
```ts
modal?: {
  title?; subtitle?; width?; footerText?;   // giữ
  showCloseButton?: boolean;        // default true
  closeOnBackdropClick?: boolean;   // default true
  closeOnSelect?: boolean;          // default true — đóng modal sau connect thành công
  disableAnimations?: boolean;      // default false (vẫn tôn trọng prefers-reduced-motion)
};
```
- `showCloseButton`: hiện đã có ở viewModel (`showCloseButton===false`) nhưng không nối config → nối vào.
- `closeOnBackdropClick`: trong handler `backdrop`/`.twk-overlay`, chỉ `api.close()` khi cờ true.
- `closeOnSelect`: chỗ gọi `api.close()` sau connect (modal.ts ~L281) bọc `if (config.modal.closeOnSelect)`.
- `disableAnimations`: nếu true, không set `data-twk-entering` (hoặc thêm class tắt animation).

---

## 3. Branding

```ts
modal?: { ...; branding?: { showPoweredBy?: boolean; poweredByText?: string } };
```
- `poweredBy` string lấy từ labels (mục 1); `poweredByText` nếu set thì override; `showPoweredBy:false` thì không render dòng footer powered-by.
- Làm rõ quan hệ với `footerText` hiện có (đang là "TRON Wallet Kit"): hợp nhất — `footerText` chính là nội dung powered-by, `showPoweredBy` bật/tắt.

---

## 4. QR options

```ts
qr?: {
  size?: number;              // modal QR, default 304
  addressSize?: number;       // address QR, default 264
  margin?: number;            // default 4
  includeWalletLogo?: boolean;// default true
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
};
```
Chuyền vào `createStyledQrDataUrl`/`renderWalletQr` thay cho số hardcode (modal.ts ~L375/423, react/index.ts address QR). Không bắt buộc, nhưng tránh phải fork khi muốn QR to hơn.

---

## 5. Theme (bổ sung nhẹ)

`customTheme` (token override) đã đủ mạnh — giữ. Bổ sung tiện ích:
```ts
// WalletUiConfig
themeOverrides?: Record<string, Partial<ThemeTokens>>;  // đăng ký preset đặt tên riêng
accent?: string;   // shortcut = customTheme.accent
fontFamily?: string; // shortcut = customTheme.fontFamily
```
- `accent`/`fontFamily`: 90% nhu cầu tuỳ biến chỉ là đổi màu nhấn + font → shortcut đỡ phải học token. Trong `resolveWalletUiConfig` gộp vào `customTheme`.
- `themeOverrides`: cho phép `themeName` trỏ tới preset custom do app khai báo (merge vào `themePresets` lúc resolve). Optional.

---

## 6. Account panel

- **`maxVisibleTransactions`**: hiện khai báo trong `WalletUiConfig` nhưng **không plumb** — nối vào `accountPanel` để cắt danh sách tx (mặc định 3–5). Kiểm tra chỗ render recent tx đang cắt cứng bao nhiêu và thay bằng giá trị này.
- **Explorer override**: cho `accountPanel.explorerAccountUrl?: string` (template `{address}`) đè `network.explorerAccountUrl` khi app muốn trỏ explorer khác.

---

## 7. UI callbacks (optional, thấp)

```ts
// WalletUiConfig
onModalOpen?: () => void;
onModalClose?: () => void;
onWalletSelected?: (walletId: string) => void;
```
Core đã có event `connected/disconnected/...`; đây chỉ là hook cho hành vi UI (mở/đóng modal, chọn ví) mà core không biết. Gọi trong controller tại điểm open/close/select.

---

## 8. Route-map cho coder

1. **Tách locale**: tạo `src/locales/{en,vi,index}.ts`; `en` = copy đúng default hiện tại; `modal.ts`/`account-panel.ts`/`button.ts`/`toast.ts` import từ `locales/en`; định nghĩa `ToastLabels`, thêm key `checking` + badge labels.
2. **Types**: thêm `locale`, `labels`, và các field mục 2–7 vào `WalletUiConfig` + `ResolvedWalletUiConfig.labels: WalletKitLabelPack`.
3. **config.ts**: `resolveLabelPack(config.locale, config.labels)`; resolve các knob mới với default an toàn (giữ hành vi cũ khi không set).
4. **controllers**: dùng `config.labels.*` thay label cứng; nối `showCloseButton/closeOnBackdropClick/closeOnSelect/disableAnimations/branding/qr`.
5. **wallet-options.ts**: badge lấy từ labels.
6. **client/react/next**: đảm bảo `ui.locale`/`ui.labels` chảy qua (đã nhận `ui` — chỉ cần không nuốt field mới). Thêm shortcut `locale` ở provider nếu muốn.
7. **Docs**: cập nhật `docs/UI_CONFIG_EN.md` + `UI_CONFIG_VI.md` (mục locale/labels/knob mới). Lưu ý repo quy ước `docs/` blank trên GitHub — chỉ sửa bản local.
8. **Test**:
   - `resolveLabelPack`: en mặc định; `vi` đổi chuỗi; override đè locale; key thiếu ở pack ngoài vẫn fallback en.
   - config resolve: default không set = hành vi cũ; `closeOnSelect:false` không đóng; `showCloseButton:false` ẩn nút.
   - render modal với `locale:"vi"` → HTML chứa chuỗi tiếng Việt.
9. Windows-side: `pnpm -r typecheck && pnpm test && pnpm build:browser`.

---

## 9. Ràng buộc

- **Backward-compat tuyệt đối**: không set `locale`/`labels` ⇒ y hệt hiện tại (English). `modal.title/subtitle` vẫn override labels.
- English luôn là lớp nền fallback — không để lọt key rỗng.
- Không nhét business logic; không hardcode màu/chuỗi mới trong component (mọi chuỗi qua labels, mọi màu qua token).
- Ưu tiên làm **mục 1 (i18n)** trước; mục 2–3 sau; 4–7 tuỳ nguồn lực.

---

# Phần B — Rà soát hành vi/chất lượng UI (ngoài config, đã verify từng dòng)

> Đã đọc hết 16 file `packages/ui/src` (~3.970 dòng) + `wallets/`, `wallets/icons/`. Phần này liệt kê những gì **thực sự còn thiếu** (đã xác minh trực tiếp trong code, không suy đoán) để coder không phải audit lại.

## B0. Đã kiểm tra và XÁC NHẬN TỐT — coder KHÔNG cần đụng
- **Focus trap** (Tab/Shift+Tab quẩn trong modal): có, `trapFocus` gọi ở keydown (`modal.ts` ~L361).
- **Escape đóng modal**: có (`modal.ts` ~L357).
- **Khôi phục focus về trigger khi đóng** + focus control đầu khi mở: có (`lastFocusedElement`, `focusPrimaryControl`).
- **`destroy()`**: có ở cả `createWalletModal` và `createWalletInline` — gỡ `removeQrListener`, clear `qrCopyResetTimer`/`retryTimer`, `root.remove()`, `root=null`. (Skeleton timer đã được BỔ SUNG clear trong lần này.)
- **Responsive**: có `@media` mobile + safe-area trong `styles.ts`; touch target chính 44–48px.
- **ARIA cơ bản**: `role="dialog"`, `aria-modal`, `aria-labelledby`, wallet card/row là `<button>` có `aria-label`.
- **SSR**: controller nhận `document` inject; `dom.ts` guard; QR sinh khi mount (không chạy lúc import).
- **Export surface**: `index.ts` dùng `export *` toàn bộ module ⇒ util (`filterWalletOptions`, `getFeaturedWalletOptions`, `getTronWalletCatalogIcon`...) đều đã export. Không thiếu.

## B1. Cần sửa (verified) — mức Should-fix
1. **Copy dùng clipboard không có fallback/không check kết quả** — `modal.ts` ~L334 và ~L606: `void ...navigator.clipboard?.writeText(uri)` rồi set trạng thái "copied" **bất kể** thành công. Ở context không bảo mật (http) hoặc bị chặn quyền, `clipboard` undefined ⇒ không copy nhưng vẫn báo "Copied". Account panel copy address cũng cùng kiểu.
   - Fix: helper `copyToClipboard(text): Promise<boolean>` — thử `navigator.clipboard.writeText` trong try/catch, fallback `textarea + document.execCommand("copy")`; chỉ set trạng thái "copied" khi trả `true`, ngược lại giữ nguyên (hoặc toast lỗi).
2. **Icon ví `<img>` không có onerror fallback** — `modal.ts` ~L872/879 (`createWalletIconHtml`/`createLargeWalletIconHtml`): nếu URL icon 404 sẽ hiện ảnh vỡ. (Càng lộ sau khi bỏ nền tile `:has(img)`.)
   - Fix: thêm `onerror` ẩn `<img>` và hiện fallback chữ cái (hoặc set `data-broken` + CSS). Vì HTML là string, có thể `onerror="this.remove()"` rồi để chữ cái fallback ở dưới, hoặc gắn listener sau render.
3. **Lỗi render QR bị nuốt im lặng** — `renderQrIntoRoot().catch(() => {})` (`modal.ts` ~L428): khi QR fail chỉ set `dataset` mà không báo UI ⇒ user thấy ô trống.
   - Fix: set `errorMessage`/trạng thái lỗi + `render()` lại, kèm CSS cho `.twk-qr-code[data-twk-qr-renderer="error"]` (viền dashed danger + nút thử lại đã có sẵn).

## B2. Nice-to-have (verified thiếu, không chặn release)
4. **Theme auto-mode không phản ứng real-time** — `themes.ts` `resolveMode` gọi `matchMedia` 1 lần lúc resolve, **không** add listener. Modal mở lại thì resolve đúng, nhưng Button/Inline "auto" đang hiển thị sẽ **không tự đổi** khi user đổi theme hệ điều hành.
   - Fix (optional): ở `mount()` add `matchMedia("(prefers-color-scheme: dark)")` change listener → `applyThemeToElement` lại; gỡ trong `destroy()`.
5. **RTL/dir**: không hỗ trợ; toàn dùng physical properties (left/right). Nếu cần thị trường RTL mới làm — convert sang logical props (`inline-start/end`) + `dir`.
6. **Toast pending không auto-dismiss** — `toast.ts`: trạng thái `pending` không hẹn giờ tắt (đúng ý đồ), nhưng nếu tx treo mãi thì toast ở lại. Có nút X đóng tay rồi; cân nhắc max-lifetime ~30s cho pending.
7. **`aria-busy` cho trạng thái loading** (connecting panel, skeleton, identity/balance): thiếu `aria-busy="true"` + vùng `aria-live` để screen-reader biết đang xử lý. A11y polish.

## B3. Đã xử lý trong lần rà này
- **Rò rỉ timer skeleton All Wallets** (do lần thêm skeleton trước để lại): timer 600ms không được capture/clear. **Đã fix**: capture `allWalletsTimer` + clear trong `destroy()` ở cả hai controller. (Không cần coder làm lại.)

## B4. Route-map phần B
1. `copyToClipboard` helper + áp cho copy-uri (modal) và copy-address (account panel) — mục B1.1.
2. `<img onerror>` fallback + (nếu cần) CSS `data-broken` — B1.2.
3. QR error surface + CSS trạng thái lỗi — B1.3.
4. (optional) matchMedia auto-mode listener — B2.4.
5. (optional) aria-busy/aria-live — B2.7.
6. Test: copy ở context không có clipboard → không báo "Copied"; img lỗi → fallback chữ; (auto-mode) đổi OS theme → đổi giao diện.
7. Windows-side: `pnpm -r typecheck && pnpm test && pnpm build:browser`.

> Kết luận: UI **đủ chắc để gửi coder**. Phần A (i18n + config) là chính; phần B chỉ còn vài hardening nhỏ (copy fallback, img/QR error, auto-mode). Không có lỗi chặn.
