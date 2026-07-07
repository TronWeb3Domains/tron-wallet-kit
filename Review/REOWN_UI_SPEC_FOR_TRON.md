# Reown-style UI Spec cho TRON Wallet Kit

Ngày: 2026-07-04
Nguồn: đo trực tiếp `https://demo.reown.com/` bằng trình duyệt (computed styles trong Shadow DOM) + danh sách ví `tronweb3/tronwallet-adapter`.
Mục tiêu: dựng modal đúng "chất" Reown AppKit cho light/dark, **nhưng TRON-native** — bỏ nhấn mạnh multichain, tập trung ví TRON.

> **Làm rõ theo phản hồi (2026-07-04):**
> - **TronLink mặc định đứng đầu** featured; sau đó ~3–4 ví phổ biến; **WalletConnect nằm cuối nhóm featured** (badge `QR CODE`, lối vào chung cho ví mobile). Ban đầu hiện ~5–6 ví rồi mới tới "Search wallet". WalletConnect giữ cả vai trò adapter/transport lẫn hàng hiển thị.
> - **Bỏ toggle "Certified"** trong view search/all-wallets. Reown lọc ví theo danh sách "certified" của họ; TRON kit dùng **catalog ví TRON riêng**, nên không cần bộ lọc chứng thực này — hiển thị thẳng toàn bộ ví TRON hỗ trợ.

> Ghi chú độ tin cậy: **token LIGHT đo trực tiếp** từ demo (authoritative). **Token DARK** theo hệ dark chuẩn của AppKit (dark toggle trên demo không ổn định trong phiên đo) — dùng làm mốc, tinh chỉnh khi QA thực tế.

---

## 0. Execution Discipline / Plan Tuần Tự

> Trạng thái này là bảng điều phối chính cho spec. Không được báo “xong UI/spec” nếu còn mục `TODO` hoặc `PARTIAL` trong phase đang mở. Mỗi phase phải cập nhật trạng thái ngay trong mục này, cập nhật `PROJECT_MEMORY.md`, và nếu có thay đổi chi tiết thì cập nhật `Review/REOWN_UI_SPEC_IMPLEMENTATION_TRACKER.md`.

### Quy tắc làm việc bắt buộc

1. **Không nhảy phase**: chỉ chuyển sang phase kế tiếp khi phase hiện tại đạt `DONE` hoặc có ghi rõ `DEFER` kèm lý do.
2. **Không báo xong theo lát nhỏ**: sau mỗi lát code chỉ được báo “đã hoàn thành mục X của phase Y”, không được gọi chung là hoàn tất spec.
3. **Mỗi phase phải có verification**: tối thiểu `pnpm --filter @tron-wallet-kit/ui typecheck`, `pnpm --filter @tron-wallet-kit/ui test`, và package liên quan (`react`, `client`, `browser`, `examples`) nếu bị ảnh hưởng.
4. **React-first nhưng không quên IIFE**: trong giai đoạn UI nhanh có thể skip browser/IIFE, nhưng phải giữ mục `Browser/IIFE parity` là `TODO` cho tới khi build và smoke chạy thật.
5. **Spec này thắng các pass cũ**: nếu implementation note cũ mâu thuẫn với mục hiện tại, mục hiện tại là nguồn đúng. Ví dụ: QR view **không dùng tabs**, modal **auto-height** trừ all-wallets grid.
6. **Status hợp lệ**: `TODO`, `IN_PROGRESS`, `PARTIAL`, `DONE`, `DEFER`.

### Phase Board

| Phase | Scope | Status | Done khi nào |
| --- | --- | --- | --- |
| P0 | Tracker + kỷ luật spec | DONE | Có bảng phase trong spec, tracker riêng, memory ghi nhận quy trình. |
| P1 | Siết modal Reown cơ bản | DONE | Auto-height đúng, all-wallets grid scroll, spacing gọn theo 1B(a2), hover/link/tap anti-patterns 4E, QR tabs bị bỏ. |
| P2 | QR foundation | DONE | Thêm `qr-code-styling`, giữ `qrcode` fallback, tạo `renderWalletQr()`, connect QR dùng helper chung, Copy link dùng đúng URI, QR mặc định nền trắng scan-safe. |
| P3 | Account panel flow | DONE | WalletButton connected có sub-view `account -> address-qr -> account`, address QR dùng helper chung, copy feedback ổn định, focus/scroll lock cho modal panel. |
| P4 | Loading/skeleton completeness | DONE | Wallet name skeleton, badge reserve, identity/balance skeleton, no layout jump khi async đổi trạng thái. |
| P5 | Inline status + toast controller | DONE | `.twk-status` reserve chỗ dưới list, toast dismiss/autodismiss/status transitions, explorer link, a11y polite. |
| P6 | Network badge + WalletInline | DONE | Network badge đầu list, `createWalletInline()` no-overlay picker dùng chung engine list/connect/qr. |
| P7 | Wallet grouping / mini-icon stack | DEFER | Superseded by product decision: All Wallets stays flat; Extension/Mobile remain metadata only. |
| P8 | Theme/runtime polish | DONE | `kit.setTheme()` đồng bộ modal/button/toast surfaces; self-host Inter Vietnamese subset quyết định `DEFER` tới release asset pass. |
| P9 | QA parity | DONE | React visual smoke captured light/dark/mobile screenshots, reduced-motion CSS verified, uninstalled wallet badges visible, browser/IIFE build passed. Real TronLink/WC wallet QA remains `DEFER` because it needs an installed wallet/manual session. |

### P1 Checklist Chi Tiết (phase đang mở)

| Item | Status | Notes |
| --- | --- | --- |
| Modal width `min(400px, calc(100vw - 32px))` | DONE | Đã có trong CSS. |
| Auto-height cho featured/connecting/error/QR | DONE | Đã bỏ global `.twk-body{height:480px}`. |
| Chỉ all-wallets grid fixed scroll | DONE | `.twk-wallet-grid{height:360px;overflow:auto}`. |
| Header compact `min-height:44px` | DONE | CSS `.twk-header` dùng `min-height:44px`. |
| Body padding compact `8px 20px 12px` | DONE | `.twk-body` dùng padding compact; view con giảm padding dư. |
| Footer compact `8px 16px 10px`, 11px | DONE | `.twk-footer` đã siết font/padding. |
| Connecting spacing icon-title-subtitle-actions-install | DONE | Bỏ center/tall min-height, giảm gap và install row margin. |
| QR view bỏ tabs Mobile/Webapp/Browser | DONE | Markup/CSS tabs đã bị loại; test khóa `not.toContain("twk-qr-tabs")`. |
| Hover không shadow/không layout shift | DONE | Control reset giữ `box-shadow:none`, `transform:none`, fixed min-height/padding, hover chỉ đổi background/color/border. |
| Link không underline mọi trạng thái | DONE | `.twk-link` và `.twk-toast-link` giữ `text-decoration:none` cả hover/focus. |

### Thứ tự thực thi ngay sau bảng này

1. P3 đã hoàn tất: account panel `address-qr` sub-view dùng QR helper chung.
2. P4 đã hoàn tất: loading/skeleton completeness.
3. P5 đã hoàn tất: inline status + toast controller.
4. P6 đã hoàn tất: network badge + WalletInline.
5. P7 đã được supersede: không render wallet grouping/mini-icon stack; All Wallets giữ flat searchable grid.
6. P8 đã hoàn tất: theme/runtime polish.
7. P9 da hoan tat phan automated QA parity; real TronLink/WC QA duoc `DEFER` den manual wallet session.

---

## 1. Giải phẫu modal Reown (đo trực tiếp — light)

| Thành phần | Giá trị đo được |
| --- | --- |
| Card modal | width `356px` (max `400px`), `border-radius: 32px`, bg `#ffffff`, text `#0a0a0a`, padding `4px`, shadow `0 2px 8px rgba(0,0,0,.05)` |
| Header / Title | tiêu đề **canh giữa**, **font-size 16px, weight 400 (chữ thường, KHÔNG đậm)**; header **không có đường kẻ phân vùng nặng** |
| Close / Back | icon nhẹ, **nền trong suốt + không viền + không bo cứng** lúc bình thường; **hover** mới hiện lớp nền tròn nhẹ (`surface-hover`); vùng chạm 40–44px nhưng thị giác nhẹ |
| Wallet row | height `56px`, `border-radius: 16px`, padding `12px`, gap `8px`, nền trong suốt (hover mới fill) |
| Wallet icon | `32×32px`, **`border-radius: 5px`**, **KHÔNG viền** (logo tự có hình) — token `--twk-wallet-icon-radius`, xuyên suốt featured + all-wallets + connecting |
| Row label | color `#202020`, font `13.33px` |
| Search input | `border-radius: 16px`, nền chìm trong container, text `#202020`, có badge đếm `540+` |
| Badge (tag) | `border-radius: 4px`, font ~`11–13px` in hoa, padding `0 4px` |
| Accent | `#0988F0` |
| Font gốc | `KHTeka` (độc quyền Reown) → **thay bằng Inter** cho TRON kit |
| Hệ radius/scale | radius-master `4px`, font-size-master `10px`; các cỡ là bội của master (row 16px = 4×, modal 32px = 8×) |

### Badge — màu đo trực tiếp
| Badge | Nền | Chữ |
| --- | --- | --- |
| `QR CODE` | `rgba(9,136,240,.10)` (accent 10%) | `#0988F0` (accent) |
| `INSTALLED` | `rgba(48,164,107,.20)` | `#30a46b` (green) |
| `MULTICHAIN` | `#e9e9e9` | `#9a9a9a` (gray) |

> Theo yêu cầu: **bỏ badge `MULTICHAIN`** và **bỏ hàng MetaMask multichain**. **TronLink đứng đầu**, WalletConnect ở cuối nhóm featured (badge `QR CODE`). Giữ semantic badge (`INSTALLED`, `QR CODE`, `RECENT`).

### Bố cục featured view (Reown gốc → bản TRON)
Reown gốc: `WalletConnect (QR CODE)` · `MetaMask (MULTICHAIN)` · `TronLink (INSTALLED)` · ô Search `540+` · "or" · Email · Social.

**Bản TRON (đề xuất):** bỏ Email/Social và MetaMask multichain. **TronLink mặc định đứng đầu**, WalletConnect ở cuối nhóm featured. Ban đầu hiện **đúng 5 ví** → rồi tới "Search wallet" cho gọn gàng.
```
Header:   [?]        Connect Wallet        [×]
Featured: TronLink             [INSTALLED]    ← mặc định top (hoặc NOT INSTALLED)
          OKX Wallet           [INSTALLED]    (INSTALLED nếu detect)
          Bitget Wallet        [INSTALLED]
          TokenPocket          [QR CODE]
          WalletConnect        [QR CODE]      ← cuối nhóm featured
Search:   🔍 Search wallet                  [N+]
Footer:   Powered by TRON Wallet Kit
```

### Thứ tự adapter trong featured (trước Search wallet)
Quy tắc sắp xếp initial list (**đúng 5 hàng** rồi tới Search):
1. **TronLink** — mặc định đứng đầu, luôn hiện dù chưa cài (`INSTALLED` nếu detect, ngược lại `NOT INSTALLED` + Install).
2. **3 ví TRON phổ biến** — OKX, Bitget, TokenPocket (đã **bỏ Trust Wallet** để featured gọn 5 hàng). Ví đã cài (`isAvailable()`=true) đẩy lên trước, badge `INSTALLED`; ví mobile badge `QR CODE`.
3. **WalletConnect** — **đứng cuối nhóm featured**, badge `QR CODE` (lối vào chung cho ví mobile).
4. **Recent** (nếu có): ví vừa dùng có thể thay chỗ 1 ví phổ biến (vẫn giữ tổng 5 hàng), badge `RECENT`.
5. **Search wallet** — hàng cuối cùng, hiển thị số ví còn lại `[N+]`, mở view `all-wallets`.

### Điều chỉnh bắt buộc theo screenshot Reown (đối chiếu ảnh)

1. **Header + tiêu đề nhỏ hơn, chữ thường.** Title `font-size: 16px; font-weight: 400;` canh giữa; không in đậm. Bỏ mọi `font-weight: 700`/`600` ở tiêu đề modal. (Code hiện `.twk-title{font-size:18px;font-weight:700}` → sửa thành 16px/400.)
2. **Close/Back nhẹ nhàng.** Mặc định `background: transparent; border: 0;` (bỏ `background:var(--twk-surface-elevated)` + `border` + box 44px viền cứng đang có). Chỉ **hover** mới hiện nền tròn nhẹ:
   ```css
   .twk-close, .twk-back {
     background: transparent; border: 0; border-radius: 999px;
     width: 40px; height: 40px; color: var(--twk-text-muted);
   }
   .twk-close:hover, .twk-back:hover { background: var(--twk-surface-hover); color: var(--twk-text); }
   ```
   Không tạo "phân vùng" ô lớn; header thoáng, không viền/nền mặc định.
3. **Radius icon = 5px (nhẹ), token xuyên suốt.** `--twk-wallet-icon-radius: 5px` (mục 2); mọi icon ví ở featured **và** all-wallets + QR center logo + icon lớn connecting dùng token này. Icon fallback cũng cùng radius. (Không dùng 16px — quá bo.)
4. **Featured đúng 5 ví** (đã bỏ Trust ở trên).
5. **Lớp phủ loading đúng khung, tránh nhảy khung.** Skeleton/overlay loading phải **chiếm đúng vị trí và kích thước ô cuối cùng**, nội dung swap tại chỗ:
   - **QR view:** ô QR `reserve` sẵn `width/height` cố định; lúc chờ URI hiện **skeleton xám cùng kích thước** (đúng như ảnh "QR loading" của Reown), khi có URI thì QR fade-in **trong đúng ô đó** → không đẩy layout.
   - **Connecting view:** icon ví + text + nút Retry giữ khung `min-height` ổn định; chuyển pending → error **không đổi chiều cao**.
   - **All-wallets:** grid giữ chiều cao hàng cố định; ảnh icon loading = nền `surface-muted` cùng ô 16px radius.
   - Dùng `opacity/transform` để fade, **không** animate `width/height`.

**Chi tiết view quan sát thêm từ ảnh (để code đúng):**
- **Connecting** = icon lớn + **spinner tròn XOAY QUANH logo** (vòng loader ôm quanh icon) + "Continue in {ví}" + phụ đề "Accept connection request in the wallet" + nút **Try again**. Nếu ví chưa cài → thêm hàng **"Don't have {ví}? [Get →]"** ở đáy. **KHÔNG dùng "cung/arc" ở đáy icon** (`.twk-connecting-arc` hiện tại sai — xem 1C).
- **Error** = tiêu đề **đỏ** "Connection declined" + mô tả (vd "Connection can be declined if a previous request is still active") + **Try again**. Icon ví có chấm `×` đỏ nhỏ góc dưới.
- **QR ví mobile** (TokenPocket) = QR + **Copy link** + hàng install "Don't have {ví}? [Get →]". QR có **logo ví ở tâm**. **KHÔNG dùng tab Mobile/Webapp/Browser.**
- **QR WalletConnect** = QR generic + logo WC ở tâm + "Scan this QR Code with your phone" + **Copy link** (disabled khi chưa có URI).

---

## 1B. Chuẩn khung, typography & loading (đối chiếu kit hiện tại — bắt buộc sửa)

**Kit đã đúng:** `.twk-title` 16px/400, token `--twk-wallet-icon-radius`, QR skeleton, các view connecting/error/install/qr-tabs. **Cần sửa 4 nhóm dưới** để hết lộn xộn và nhảy khung.

### a) Chiều cao: CHỈ cố định ở view all-wallets, còn lại AUTO (sửa "cao quá, thừa khoảng trống")
Hiện tại ép `min-height:420px` cho modal + min-height riêng mỗi view (connect-detail `380`, grid `388`, no-wallets `160`) → connecting/error bị kéo cao, thừa khoảng trống xấu (như ảnh).

Chuẩn mới:
- **Width:** `min(400px, calc(100vw - 32px))`.
- **Chiều cao AUTO cho hầu hết view** (featured, connecting, error, qr, account): modal **ôm sát nội dung**. **Bỏ** `min-height:420` của modal và `min-height` của `connect-detail`/`no-wallets`. Không ép khung cao.
- **CHỈ view `all-wallets`:** vùng grid có **chiều cao cố định + cuộn** — `.twk-wallet-grid { height: ~360px; overflow:auto; }` để danh sách ví dài cuộn trong khung, modal không phình vô hạn. Header/search/footer của view này vẫn auto.
- Giữ `max-height: calc(100dvh - 32px)` để không tràn màn hình; view nào lỡ dài thì cuộn.

### a2) Khoảng cách GỌN HƠN NỮA (header/body/footer vẫn quá xa)
Giá trị cụ thể, siết chặt:
- **Header:** `padding: 8px 16px; min-height: 44px` (bỏ 48–64px). Title canh giữa, không thêm margin.
- **Body:** `padding: 8px 20px 12px` (trên chỉ `8px`, dưới `12px`). Bỏ mọi `min-height`/`padding` lớn của view con.
- **Footer:** `padding: 8px 16px 10px; font-size: 11px`. Sát nội dung, không chừa khoảng trắng lớn.
- **Connecting/error:** **bỏ `min-height:380` + `justify-content:center`**. Xếp tự nhiên từ trên, gap: `icon → title 10px → subtitle 4px → nút 16px`. Install row `margin-top: 12–16px` (KHÔNG `margin-top:auto`).
- **QR view (dọn — bỏ tabs, bỏ title body, QR lớn):** thứ tự `QR lớn (fill width) → subtitle (mt 8–10px) → Copy link (mt 12px) → install row (mt 12px)`. **Không** title trong body (đã có ở header), **không** card viền lồng quanh QR, **không** min-height thừa — QR đặt thẳng, bo góc, chiếm gần trọn chiều rộng để dễ quét.
- **Featured:** gap giữa hàng `8px`; footer sát.
- Nguyên tắc: **rhythm dọc nhỏ** (8–16px), không có khối trống >20px giữa các phần.

### b) Chuẩn typography & component (sửa "không có tiêu chuẩn title/subtitle/lỗi/link/nút")
Gộp về **một hệ**, hết cảnh `.twk-title`(16/400) chọi `.twk-detail-title`(18/800):

| Vai trò | Class | Size / Weight | Màu |
| --- | --- | --- | --- |
| Title (mọi view, canh giữa) | `.twk-title` | 16px / **500** | `text` |
| Subtitle (dưới title) | `.twk-subtitle` | 13px / 400 | `text-muted` |
| Body / mô tả (connecting…) | `.twk-detail-subtitle` | 14px / 400 | `text-muted` |
| Nhãn lỗi | `.twk-title[data-tone="danger"]` | 16px / **600** | `danger` |
| Link (Copy link, Get) | `.twk-link` | 13px / 600 | `accent` |
| Nút (action) | `.twk-action` | 14px / 560, min-height 44px | theo variant |
| Badge | `.twk-badge` | 11px / 600 uppercase | theo mục Badge |
| Count / pill | `.twk-count` | 11px / 600 | `text-muted` |

- **Bỏ `.twk-detail-title{font-size:18px;font-weight:800}`** → dùng `.twk-title` (16/500); error dùng cùng class với `data-tone="danger"` (16/600 danger). Nhờ vậy title connecting/error/qr **cùng cỡ** với featured.
- Ngoại lệ có chủ đích: **balance lớn** ở account panel (26px/800) giữ nguyên.
- Spacing chuẩn: header padding `16px`, section padding `16px`, gap nội dung `8–12px`, actions gap `10px`.

### c) Radius icon = 5px
Xem điều chỉnh #3 — `--twk-wallet-icon-radius: 5px`.

### d) Skeleton/overlay loading cho MỌI vùng async (không chỉ QR)
Hiện chỉ có QR skeleton. Bổ sung skeleton **đúng kích thước ô cuối** cho:
- **Wallet grid/featured đang check availability:** ô icon = **skeleton nền `surface-muted`** đúng `56px` (grid)/`32px` (list), radius 5px, shimmer nhẹ; tên ví = thanh skeleton. Khi badge `CHECKING → INSTALLED/NOT INSTALLED` **không nhảy** (badge cũng reserve chỗ).
- **Connecting:** vùng icon + text giữ khung cố định; arc/spinner overlay đúng tâm, không đổi chiều cao khi pending→error.
- **Account panel balance/identity:** trong khi resolve hiện **skeleton chip** đúng kích thước (không để "-" rồi nhảy).
- Tất cả: fade bằng `opacity`, **không animate width/height**; `@media (prefers-reduced-motion)` tắt shimmer.

---

## 1C. Spinner connecting, metadata một nguồn & QR (sửa theo ảnh)

### a) Spinner connecting = vòng xoay QUANH logo
- **Bỏ `.twk-connecting-arc`** (cung `border-bottom` ở đáy icon — sai, xấu như ảnh).
- Thay bằng **vòng spinner tròn bao quanh logo**: một `ring` `position:absolute` bọc ngoài icon `72px` (ví dụ ring `88–96px`), `border: 3px solid var(--twk-spinner-trail); border-top-color: var(--twk-accent); border-radius:999px; animation: twk-spin .9s linear infinite;`. Logo đứng yên ở tâm, vòng quay quanh.
- `@media (prefers-reduced-motion)`: vòng đứng yên (hoặc pulse nhẹ), không quay.
- Áp cho cả connecting của ví injected lẫn WalletConnect (khi đang chờ scan/approve).

### a1) Icon ví KHÔNG viền + status badge dùng SVG, căn đúng góc
- **Bỏ `border` quanh icon ví** ở **mọi nơi**: wallet row (list/featured/all-wallets) và **icon lớn connecting**. Icon chỉ giữ `border-radius: var(--twk-wallet-icon-radius)` (5px) + `overflow:hidden`, **không `border`** (logo tự có nền/hình). Fallback icon (chữ cái) mới cần nền, vẫn không viền.
- **Status badge (× lỗi / ✓ thành công) ở góc icon connecting:** hiện đang **lệch, không vào tâm**. Sửa:
  - Badge là **vòng tròn nhỏ** `20px` `border-radius:999px`, đặt `position:absolute; right:-4px; bottom:-4px` (góc dưới-phải icon), nền theo trạng thái (`danger` cho lỗi, `success` cho ok), viền `2px solid var(--twk-surface)` để tách khỏi icon.
  - **Dùng SVG icon** (× / ✓) **căn tâm** bằng `display:flex; align-items:center; justify-content:center`, kích thước SVG `~11px`. **KHÔNG dùng ký tự text `×`/`✓`** (render lệch, không ổn định giữa font/OS).
  - Icon connecting cần `position:relative` để badge neo đúng; badge luôn nằm gọn trong khung, không tràn/nhảy.

### b) Icon + link "Get" + homepage → NẰM TRONG metadata adapter (một nguồn)
Sửa "lưu icon/link lung tung". Tất cả dữ liệu hiển thị của ví phải đến từ **metadata**, UI **không hardcode**:
- `WalletMetadata` (core) mang đủ: `id`, `name`, `icon`, `homepage`, **`downloadUrl`** (link cho nút **Get** ở install row), `type`, `group`, `description`.
- **Thêm field `downloadUrl`** vào `WalletMetadata` nếu chưa có. Nút "Don't have {ví}? **Get**" dùng `metadata.downloadUrl ?? metadata.homepage`.
- Icon: `adapter.metadata.icon` là nguồn sự thật; catalog-only dùng `walletIcons[id]` (mục 3.1). **Không** để mỗi nơi (modal, button, ví dụ app) tự gán icon/link khác nhau.
- Adapter chưa có (catalog entry) khai trong `wallet-catalog.ts` cùng cấu trúc field như metadata → UI đọc **một** interface duy nhất.

### c) QR view — TO, RÕ, SẠCH (đối chiếu ảnh Reown dark)
Mục tiêu: QR **lớn chiếm gần hết chiều rộng modal**, dễ quét; **không chồng chéo title/nhãn**, không card lồng. Cấu trúc DUY NHẤT:
```
Header:  ‹  WalletConnect  ×      ← tên ví CHỈ ở header (không lặp trong body)
[ QR LỚN — fill width ]
Scan this QR Code with your phone  ← 1 dòng phụ đề duy nhất
[ Copy link ]                       ← (+ Try again khi lỗi)
[ Don't have {ví}? Get ]            ← chỉ khi chưa cài
Footer
```
- **QR lớn:** `.twk-qr-code { width: 100%; max-width: 340px; aspect-ratio: 1/1; margin: 0 auto; border-radius: 16px; }` — trên mobile fill gần trọn chiều rộng. **Bỏ ô 208×208 nhỏ và bỏ card viền lồng** (`qr-card`); QR đặt thẳng trên nền modal, bo góc.
- **Loading:** skeleton nền `surface-muted` **đúng kích thước QR lớn** (không phải 176 nhỏ) trong đúng chỗ; có URI → QR fade-in tại chỗ, không nhảy.
- **QR thật:** render bằng lib (mục 1D), mặc định scan-safe với foreground đen và background trắng trong mọi theme; không có nút đổi theme QR.
- **Center logo** ví/WC: ô ~`56px` (theo QR lớn), `border-radius: var(--twk-wallet-icon-radius)` (5px), nền `surface` + viền — từ `metadata.icon`.
- **KHÔNG title trong body** (tránh chồng chéo — tên ví đã ở header). **KHÔNG tab Mobile/Webapp/Browser.**
- **Phụ đề DUY NHẤT** "Scan this QR Code with your phone" (`.twk-detail-subtitle` 14 muted), 1 dòng, `margin-top 10px`.
- **Copy link** (disabled khi chưa có URI) `margin-top 12px`, canh giữa; **Try again** chỉ hiện khi lỗi; install row chỉ khi ví chưa cài.

### Thư viện tạo QR (quan trọng — hiện TRON đang thiếu)
Kit TRON hiện **chỉ dùng `qrcode`** → ra QR **vuông phẳng, không logo tâm**, không giống Reown/ảnh. XRPL Wallet Kit dùng **2 lib**:
- **`qr-code-styling` (^1.9)** — QR **styled** giống Reown: module bo tròn/chấm, finder bo góc, **logo ở tâm**. → **Thêm lib này cho TRON**, dùng làm QR chính.
- **`qrcode` (^1.5)** — giữ làm **fallback phẳng** (data URL) khi styled lib lỗi hoặc môi trường không có DOM (SSR/IIFE tối giản).

Cấu hình `qr-code-styling` (khớp theme token):
```
type: "svg",
qrOptions: { errorCorrectionLevel: "Q" },        // cao để chèn logo không hỏng
dotsOptions: { type: "rounded", color: var(--twk-qr-foreground) },
cornersSquareOptions: { type: "extra-rounded" },
backgroundOptions: { color: "#ffffff" },                  // luôn nền trắng để dễ quét trên dark/light
image: metadata.icon,                             // logo ví/WC ở tâm (dùng cùng nguồn metadata, mục 1C-b)
imageOptions: { margin: 6, imageSize: 0.28, hideBackgroundDots: true }
```
- **Browser/IIFE:** `qr-code-styling` khá nặng → **nạp động (`dynamic import`) chỉ khi mở QR view**, không gộp vào bundle chính; fallback `qrcode` nhẹ luôn có sẵn.
- Foreground/background QR mặc định là đen/trắng scan-safe; không render `.twk-qr-theme-action`.
- Dùng **một helper `renderWalletQr(value, { logo, light })`** chung cho: QR WalletConnect, QR ví mobile, và Address QR (account panel) — để mọi QR đồng bộ.

> **CAVEAT quan trọng (XRPL `PROJECT_MEMORY`):** QR **styled (dotted/finder bo góc) + logo tâm** có thể làm **URI WalletConnect DÀI quét lỗi** trên một số ví. Vì vậy:
> - Bắt buộc `errorCorrectionLevel: "Q"` hoặc `"H"`, logo tâm **nhỏ (≤28%)**, và **QA quét thực tế** URI WalletConnect trên ví mobile trước khi chốt styled QR.
> - Nếu ví quét lỗi → **fallback QR phẳng `qrcode` không logo** riêng cho **WalletConnect URI**.
> - **Address QR** (chuỗi base58 ngắn) thì styled + logo an toàn, giữ đẹp.
> - Có thể để config `qrStyle: "styled" | "plain"` mặc định styled cho address, plain cho WC URI nếu QA cho thấy cần.

---

## 1D. Wiring WalletConnect QR & Copy link (mô tả code cho ĐÚNG — hiện sai nhiều)

Đọc lại luồng chuẩn từ XRPL Wallet Kit (`modal.ts` + `core/manager.ts` + `client` + adapter WC). TRON đang **không điền URI vào đúng ô QR** và **Copy link sai** vì đứt/nhầm chuỗi dưới đây.

### a) Chuỗi dữ liệu URI — phải đúng thứ tự
```
WC adapter (khi có URI) ──► onQr({ adapterId, uri, deeplink })
   └─ client nối: onQr ──► manager.emitQr(adapterId, uri, deeplink)
        └─ core: emitQr ──► emit("qr", { adapterId, uri, deeplink })
             └─ modal: manager.on("qr", e ──► showQr(e.adapterId, e.uri, e.deeplink))
```
- Adapter WalletConnect **phải** nhận callback `onQr`/`onUri` và gọi **mỗi khi có URI mới**.
- Client **phải** nối `onQr → manager.emitQr(...)` (như `client/index.ts` XRPL).
- Core `emitQr` phát sự kiện `"qr"`. Modal subscribe `"qr"`.
- **Chỉ dùng URI đến từ sự kiện `qr`** — đừng lấy URI kiểu khác, đừng hardcode.

### b) Chọn WalletConnect → vào QR view (loading)
- Click WalletConnect (custom QR mode) → vào **QR view trạng thái `loading`**: spinner "Generating QR…" **trong đúng ô QR reserve** (KHÔNG hiện connect spinner của ví injected).
- Gọi `manager.connect(adapterId)` → adapter tạo session → phát `qr` với URI.

### c) Nhận URI → VẼ QR vào ĐÚNG ô (bug chính)
`showQr(adapterId, uri, deeplink)`:
1. `this.qrUri = uri` (lưu để copy).
2. `qrState = { status:"ready", adapterId, walletName, uri, deeplink }`.
3. render shell QR.
4. **`const el = root.querySelector(".twk-qr-code"); if (el) renderQr(el, uri);`** ← bước code TRON đang thiếu/sai.

`renderQr(container, uri)`:
```
container.replaceChildren();                 // xoá skeleton TRƯỚC
const qr = new QRCodeStyling({
  width: QR_SIZE, height: QR_SIZE, type: "svg",
  data: uri, margin: 4,
  qrOptions: { errorCorrectionLevel: "H" },
  dotsOptions: { type: "dots", color: qrColor, roundSize: true },
  cornersSquareOptions: { type: "extra-rounded", color: qrColor },
  cornersDotOptions: { type: "dot", color: qrColor },
  backgroundOptions: { color: "#ffffff" }
});
qr.append(container);                        // SVG fill 100% ô (aspect-ratio 1/1)
// catch → qrcode.toDataURL(uri) tạo <img>; catch nữa → text URI fallback
```
- `qrColor = themeMode==="dark" && !light ? QR_LIGHT : QR_DARK`. Hằng: `QR_SIZE=304`, `QR_DARK`, `QR_LIGHT`.
- **Nguyên nhân ô QR trống (như ảnh):** vẽ QR khi **chưa có uri**, hoặc **query sai element**, hoặc **không xoá skeleton**. Phải: có `uri` (từ sự kiện `qr`) mới vẽ → vào đúng `.twk-qr-code` → `replaceChildren()` xoá skeleton.

### d) Copy link — copy ĐÚNG URI đang encode
- Nút Copy đọc **cùng `this.qrUri`** đang hiển thị trong QR (KHÔNG chuỗi khác/rỗng). `disabled` khi `!qrUri`.
- `copyQrUri()` → `copyText(this.qrUri)` → feedback "Copied" ~1.5s (`aria-live`).
- **Bug TRON:** Copy link rỗng/sai vì không trỏ về `qrUri` thật. Sửa: luôn copy `qrUri` nhận từ sự kiện `qr`.

### e) Trạng thái, đồng bộ & vòng đời
- Trạng thái trong cùng ô: `loading` → `ready` (QR + Copy + Try again) → `rejected/timeout/error` (message + Try again). Kích thước ổn định (mục 1B/1C).
- **Light-toggle:** vẽ lại `renderQr(el, this.qrUri)` với nền trắng — **cùng URI**.
- **pendingQr:** nếu URI đến trước khi modal mount → lưu `pendingQr`, replay khi mở modal.
- **Guard stale:** bỏ qua sự kiện `qr`/`error` từ adapter không phải request đang chạy (`activeRequestAdapterId`).
- **Try again:** gọi lại `connect` (adapter clear stale session/pairing trước) → chờ URI mới → vẽ lại.

---

## 2. Token contract → `light` / `dark`

**Ghi đè 2 preset `light`/`dark` hiện có** trong `themePresets` (`packages/ui/src/themes.ts`) bằng bộ giá trị dưới đây, đúng hệ token `--twk-*`. Không tạo preset mang tên thương hiệu Reown — chỉ dùng giá trị đo được làm `light`/`dark` mặc định.

### `light` (đo trực tiếp)
```ts
{
  colorScheme: "light",
  fontFamily: 'Inter, "Inter var", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  radius: "28px",          // modal (Reown 32px; 28 mềm hơn cho web nhúng, tùy chọn 32)
  walletRadius: "16px",    // wallet row
  shadow: "0 2px 8px rgba(0,0,0,.05)",
  backdrop: "rgba(0,0,0,.30)",
  backdropBlur: "0px",
  surface: "#ffffff",
  surfaceElevated: "#fbfbfb",
  surfaceMuted: "#f3f3f3",
  surfaceHover: "#f3f3f3",
  border: "#ececec",       // ~ rgba(0,0,0,.05)
  text: "#0a0a0a",
  textMuted: "#9a9a9a",
  accent: "#0988f0",
  accentText: "#ffffff",
  success: "#30a46b",
  warning: "#f3a13f",
  danger: "#e04b4b",
  focusRing: "#0988f0",
  fallbackIconBackground: "#f3f3f3",
  fallbackIconColor: "#202020",
  qrForeground: "#0a0a0a",
  qrBackground: "#ffffff"
}
```

### `dark` (hệ dark chuẩn AppKit — mốc, tinh chỉnh khi QA)
```ts
{
  colorScheme: "dark",
  fontFamily: 'Inter, "Inter var", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  radius: "28px",
  walletRadius: "16px",
  shadow: "0 2px 12px rgba(0,0,0,.44)",
  backdrop: "rgba(0,0,0,.60)",
  backdropBlur: "0px",
  surface: "#141414",        // modal bg
  surfaceElevated: "#1c1c1c",
  surfaceMuted: "#202020",
  surfaceHover: "#242424",
  border: "rgba(255,255,255,.07)",
  text: "#e4e7e7",
  textMuted: "#9a9a9a",
  accent: "#0988f0",
  accentText: "#ffffff",
  success: "#30a46b",
  warning: "#f3a13f",
  danger: "#f25a67",
  focusRing: "#0988f0",
  fallbackIconBackground: "#242424",
  fallbackIconColor: "#e4e7e7",
  qrForeground: "#e4e7e7",
  qrBackground: "#141414"
}
```

### Font mặc định (học theo XRPL Wallet Kit)

**Kiểm chứng trực tiếp `https://xrpdomains.xyz/xrpl-wallet-kit/`:** kit UI **self-host Inter** (woff2, đã subset — **có cả bộ tiếng Việt** `inter-roman-vietnamese`), trang docs/marketing thì dùng Plus Jakarta Sans cho tiêu đề. Reown dùng KHTeka (độc quyền, bỏ). → **Chốt Inter làm font mặc định cho UI kit**, self-host + subset, giống hệt XRPL Wallet Kit.

Vì user/i18n hướng tới tiếng Việt, **bắt buộc kèm subset `vietnamese`** của Inter để hiển thị dấu đúng và không FOUT.

```ts
fontFamily:
  'Inter, "Inter var", ui-sans-serif, system-ui, -apple-system, ' +
  'BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
```

Quy tắc font:
- **Số dư, địa chỉ, tx hash** bật `font-variant-numeric: tabular-nums` để số không nhảy cột; địa chỉ/hash dùng stack mono sẵn có (`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`).
- **Self-host Inter** (woff2, subset `latin` + `latin-ext` + `vietnamese`) cho bản React/IIFE — **không** phụ thuộc Google Fonts lúc runtime (widget nhúng vào site third-party, tránh network dependency + FOUT). Đây đúng cách XRPL Wallet Kit làm. Nếu không nhúng được thì fallback về system stack ở trên (vẫn đẹp, không cần tải).
- Cân nhắc preset thay thế: RainbowKit dùng **SFRounded/system-ui rounded** — có thể thêm 1 token font "rounded" cho preset `tron` nếu muốn cảm giác thân thiện hơn; mặc định vẫn Inter.
- Font là token (`--twk-font-family`), cho phép dev override qua `customTheme.fontFamily`.

### Badge — thêm token mới (dùng chung 2 theme, dựng bằng `color-mix`)
```
--twk-badge-installed-bg  = color-mix(in srgb, var(--twk-success) 20%, transparent)
--twk-badge-installed-fg  = var(--twk-success)
--twk-badge-qr-bg         = color-mix(in srgb, var(--twk-accent) 12%, transparent)
--twk-badge-qr-fg         = var(--twk-accent)
--twk-badge-recent-bg     = color-mix(in srgb, var(--twk-accent) 12%, transparent)
--twk-badge-recent-fg     = var(--twk-accent)
--twk-badge-muted-bg      = var(--twk-surface-muted)
--twk-badge-muted-fg      = var(--twk-text-muted)
```
Badge radius cố định `4px`, `font-size: 11px`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: .02em`, padding `2px 6px`.

**Token radius icon ví** — thêm vào `ThemeTokens` + `cssVariableNames`:
```
--twk-wallet-icon-radius: 5px   // icon ví featured + all-wallets + QR logo (điều chỉnh #3, nhẹ)
```
Áp cho `.twk-wallet-icon` và ô icon trong grid all-wallets; icon fallback dùng cùng token. Giữ badge `4px`, wallet row `--twk-wallet-radius: 16px` như cũ.

> Thống nhất danh sách `themeName`: hợp nhất giữa đề xuất, `UI_UX_DECISIONS.md`, `themes.ts`. `light`/`dark` là 2 preset chuẩn (giá trị đo được ở trên); giữ `tron` làm brand preset (accent đỏ TRON `#ef4444`). **Không dùng tên preset gắn thương hiệu Reown.**

### Danh sách `themeName` (đồng bộ với `PRODUCT_UX_ADAPTER_PROPOSAL.md`)

Preset **production** (phải khớp nhau ở `themes.ts`, docs, examples, proposal):

```
light        // ← mặc định, giá trị đo trực tiếp ở trên
dark         // ← mặc định, hệ dark chuẩn (tinh chỉnh khi QA)
tron         // brand TRON, accent đỏ #ef4444
tron-energy
nile
shasta
sun
bandwidth
energy
terminal
highContrast
```

Preset **playground/mở rộng** (được giữ nếu qua contrast review; docs phải phân biệt rõ với production):

```
default · graphite · glass · minimal · rounded · crisp · soft · neon · midnight · ocean
```

Quy tắc: mọi preset resolve về **cùng token contract**; `mode:auto` → `light`/`dark` theo hệ thống; contrast test tự động chạy cho toàn bộ preset production (primary text ≥4.5:1, secondary ≥3:1, cả badge/action states).

---

## 3. Catalog ví TRON (từ `tronwallet-adapter`)

16 ví hỗ trợ (không tính thư mục hạ tầng `abstract-adapter`, `adapters`, `evm`). **`walletconnect` giữ làm adapter/transport** — không phải một "ví" trong catalog mà là kênh kết nối cho các ví mobile:

| Ví | Nhóm | Transport | Badge mặc định | Phase |
| --- | --- | --- | --- | --- |
| **TronLink** | Extension/Mobile | Injected | INSTALLED / QR | 1 |
| **TokenPocket** | Mobile | QR (TIP-1193) | QR CODE | 2 |
| **OKX Wallet** | Extension/Mobile | Injected | INSTALLED | 2 |
| **Bitget** (bitkeep) | Extension/Mobile | Injected | INSTALLED | 2 |
| **Trust Wallet** | Mobile | QR | QR CODE | 2 |
| Bybit | Extension/Mobile | Injected | INSTALLED | 3 |
| GateWallet | Extension | Injected | INSTALLED | 3 |
| imToken | Mobile | QR | QR CODE | 3 |
| FoxWallet | Mobile | QR | QR CODE | 3 |
| OneKey | Extension/HW | Injected | INSTALLED | 3 |
| Binance Web3 | Mobile | QR/native | QR CODE | 3 |
| TomoWallet | Mobile | QR | QR CODE | later |
| Guarda | Mobile | QR | QR CODE | later |
| Backpack | Extension | Injected (request-style) | INSTALLED | later |
| Ledger | Hardware | USB/transport riêng | — | later |
| MetaMask-TRON | Extension | multichain API | INSTALLED (tuỳ chọn, không badge multichain) | tuỳ chọn |

Quy tắc: ví injected chưa cài → badge `NOT INSTALLED` + hành động Install (mở homepage). Ví mobile → luôn `QR CODE`. **TronLink mặc định đầu featured; WalletConnect là item riêng đứng cuối nhóm featured** (badge `QR CODE`); các ví mobile khác kết nối qua transport WC nhưng vẫn hiện theo tên ví riêng.

Nhóm hiển thị trong all-wallets: **Detected/Installed** trước → **Popular** → **Mobile (QR)** → **Hardware**.

### 3.1 Icon ví — nguồn, vị trí đặt & quy ước (để code hiểu)

**Nguồn icon:** `https://walletadapter.org/wallets/*.svg` (TronWallet Adapter). Map file → adapter id:

| Adapter id | File nguồn |
| --- | --- |
| `tronlink` | `TronLink.svg` |
| `metamask` | `MetaMask.svg` |
| `okx` | `okx.svg` |
| `bitget` | `Bitget.svg` |
| `binance` | `Binance.svg` |
| `tokenpocket` | `TokenPocket.svg` |
| `trust` | `Trust.svg` |
| `gate` | `GateWallet.svg` |
| `foxwallet` | `Fox.svg` |
| `bybit` | `Bybit.svg` |
| `imtoken` | `imToken.svg` |
| `tomo` | `Tomo.svg` |
| `guarda` | `Guarda.svg` |
| `backpack` | `Backpack.svg` |
| `onekey` | `OneKey.svg` |
| `ledger` | `Ledger.svg` |

> Cập nhật 2026-07-06: `trust`, `ledger`, `backpack`, và `guarda` đều đã có SVG trên `walletadapter.org/wallets/*.svg`; không dùng fallback chữ cái cho các ví này nữa.

**Vị trí đặt — 2 tầng, theo đúng ranh giới kiến trúc:**

1. **Icon thuộc adapter (nguồn sự thật):** đặt trong `metadata.icon` của mỗi adapter, dạng **data-URI SVG** — giống pattern hiện có (`TRONLINK_ICON` trong `packages/adapters/tronlink/src/index.ts`). UI/catalog luôn đọc `adapter.metadata.icon` trước. Đây là lý do "icon adapter": mỗi adapter tự mang icon, UI không hardcode.

2. **Icon cho catalog-only wallet (chưa có adapter riêng):** đặt tập trung trong package UI để featured/all-wallets vẫn có icon dù ví chưa có adapter:
   ```
   packages/ui/src/wallets/
     icons/            ← file SVG gốc, tên = <adapter-id>.svg  (tronlink.svg, okx.svg, bitget.svg…)
     icons.generated.ts ← map { [id]: dataUri } sinh từ thư mục icons/ (để IIFE/CDN chạy không cần load asset ngoài)
   wallet-catalog.ts   ← đọc icon theo thứ tự: adapter.metadata.icon ?? walletIcons[id] ?? fallback
   ```

**Quy ước tên:** luôn dùng **adapter id viết thường** (`tronlink`, `okx`, `bitget`, `tokenpocket`, `trust`, `gate`, `foxwallet`, `bybit`, `imtoken`, `tomo`, `guarda`, `backpack`, `onekey`, `ledger`, `binance`, `metamask`). File SVG, biến trong `icons.generated.ts`, và `catalog[i].id` phải trùng id này.

**Script build (do dev chạy, không hardcode hotlink):**
```
scripts/fetch-wallet-icons.mjs
  - tải các SVG từ bảng nguồn ở trên về packages/ui/src/wallets/icons/<id>.svg
  - tối ưu (svgo) rồi sinh packages/ui/src/wallets/icons.generated.ts (id -> data URI)
  - chạy thủ công khi cập nhật bộ ví; KHÔNG hotlink trực tiếp walletadapter.org lúc runtime
```

> Lưu ý license (khớp Phase 3 của proposal): đây là brand asset của từng ví; nhúng làm data-URI trong bundle cần rà điều khoản sử dụng logo trước khi public release. Ghi rõ nguồn trong `wallet-catalog.ts`.

**Cập nhật triển khai Phase 2 (2026-07-04):**

- Đã thêm `packages/ui/src/wallet-catalog.ts` làm catalog TRON-only cho featured/search/all-wallets; catalog đọc icon theo thứ tự `adapter.metadata.icon` -> `walletIcons[id]` -> fallback chữ cái.
- Đã thêm `packages/ui/src/wallets/icons.generated.ts` làm điểm cắm build-time cho data-URI SVG. File này hiện đang rỗng để không hotlink runtime; phase icon-fetch tiếp theo sẽ sinh nội dung từ `https://walletadapter.org/wallets/*.svg`.
- Adapter thật vẫn phải tự mang icon trong `metadata.icon`. Catalog icon chỉ dành cho ví hiển thị trong UI khi chưa có adapter riêng hoặc khi ví đi qua WalletConnect QR.
- Không dùng tên/badge/nhóm `MULTICHAIN`, không dùng danh sách ví generic ngoài phạm vi TRON adapter. WalletConnect trong UI là transport TRON QR, không phải chứng nhận ví đa chain.

---

## 4. Cấu trúc view modal (routing)

Nâng modal hiện tại (1 danh sách phẳng) thành máy trạng thái view, **giữ khung kích thước ổn định**:

1. `featured` — 3–4 ví nổi bật (TronLink + ví đang detect) + ô Search + đếm số ví còn lại.
2. `all-wallets` — grid/list có **ô tìm kiếm** lọc theo tên; nhóm Installed→Popular→Mobile→Hardware; icon + badge. **KHÔNG có toggle "Certified"** (khác Reown): danh sách là catalog ví TRON, không lọc theo chứng thực Reown. Ô search chỉ lọc theo tên/nhóm.
3. `connecting` — màn chi tiết: icon ví lớn, spinner, "Continue in {ví}", nút **Retry**, nút **Install** (nếu chưa cài), nút Back.
4. `qr` — QR cho ví mobile (transport WC ẩn tên), URI copy fallback, vùng QR `≥ 200×200` reserve sẵn.
5. `account` — panel tài khoản (đã có nền tảng tốt).

Chuyển view: forward trượt sang trái, back trượt phải (transform+opacity 150–300ms, tôn trọng `prefers-reduced-motion`). Khung modal giữ `width 360px`, `min-height` ổn định để không nhảy.

---

## 4B. Connect / Account button (học từ XRPL Wallet Kit)

Đây là phần đề xuất trước đây còn thiếu. Đo trực tiếp từ `packages/ui/src/button.ts` của XRPL Wallet Kit — port sang TRON, đổi chain-specific (XRP→TRX, xrpl.org→Tronscan, XRP Domains→TRX Domains/`trondomainjs`).

### Button — 2 trạng thái
Một component `WalletButton` xử lý cả nút Connect lẫn nút Account (khi đã kết nối):

| Trạng thái | Nội dung nút |
| --- | --- |
| `disconnected` | icon ví generic + label **"Connect Wallet"**. Click → **mở connect modal**. |
| `connecting` | label **"Connecting"**. |
| `connected` | icon adapter + **tên hiển thị** (TRX Domain `name.trx` nếu có, ngược lại địa chỉ rút gọn `T4x…abcd`) + **(balance TRX)** tuỳ chọn + **chevron** + **chấm pending** nếu có tx đang chờ. Click → **mở/đóng account panel**. |

### Token kích thước button (đo được)
```
root:      inline-block, font-size 14px, position relative (để anchor dropdown)
button:    min-height  sm 44px · md 46px · lg 50px
           padding 0 12px 0 10px, gap 8px, font-weight 560, radius = walletRadius
           background = surface; hover = surfaceHover; transition 160ms; white-space nowrap
variant:   default (nền surface) · pill (radius 999px) · minimal (border trong suốt)
icon:      28×28, radius 10px, có border  (fallback = chữ cái đầu hoặc SVG ví)
label:     font-size 13px, weight 560, max-width 220px (mobile ~150px), ellipsis
balance:   màu muted, dạng "(123 TRX)"; loading = spinner 13px; chưa kích hoạt = "(chưa kích hoạt)"
chevron:   26×26 tròn, chỉ hiện khi connected + showChevron + accountPanel
pending:   chấm accent 9px ở góc icon khi có tx submitted
```

### Options (map sang `WalletButtonOptions`)
`label, showAdapterIcon, showChevron, showWeb3Name(→showTrxDomain), fallbackToAddress, copyAddress, showAddressQr, showRecentTransactions, maxVisibleTransactions, explorer, disconnect, accountPanel, accountPanelMode('modal'|'dropdown'), showBalance, size('sm'|'md'|'lg'), variant('default'|'pill'|'minimal'), themeMode, themeName, customTheme, identityResolver, balanceResolver, formatAddress, explorerUrl, onIdentityChange, onBalanceChange, language, messages`.

### Account panel — 2 chế độ
- **`dropdown`**: neo dưới nút, `width min(360px, 100vw-32px)`, padding 18px; mobile (≤520px) tự chuyển thành **bottom sheet** full-width.
- **`modal`**: overlay giữa màn, `width min(520px)`, `height min(527px)` (hoặc `650px` khi bật recent tx); mobile = bottom sheet, bo góc trên, `dvh` + safe-area.

Nội dung panel:
- **Hero avatar** 118px: avatar identity nếu có, ngược lại **gradient deterministic từ địa chỉ** (hash → 1 trong 6 cặp màu) — tạo "mặt" tài khoản nhận diện được.
- **Account name** 21px/650 (TRX Domain hoặc địa chỉ rút gọn).
- **Address chip** + nút **QR địa chỉ** (mở sub-view QR có nút Back).
- **Balance chip** (pill 42px) / cảnh báo **"chưa kích hoạt"** khi tài khoản unfunded.
- **Recent transactions**: section thu gọn được (animation `grid-template-rows`), mỗi hàng: icon trạng thái (pending spinner / confirmed / failed / unknown) + label + `hash · thời gian tương đối` + link Tronscan. Đếm `9+`.
- **Actions** full-width 46px: **Copy address** (đổi icon + "Copied" 1.4s), **Explorer** (Tronscan), **Disconnect** (spinner ~450ms). *Lưu ý TronLink: disconnect chỉ xoá state local, không revoke ví — copy phải nói đúng.*
- **Address QR sub-view**: QR 304px + address chip mono + Copy.

### Hành vi & a11y (bắt buộc)
- **Focus trap** trong panel modal (Tab vòng), **Escape** đóng, **pointerdown ra ngoài** đóng, **scroll lock** khi mở modal, trả focus khi đóng.
- Identity resolver có **cache + settle timer ~260ms** chống nháy; dùng `trondomainjs` (TRX Domains) thay XRP Domains, chỉ chạy trên mainnet, fail non-blocking, TTL ~10 phút.
- Balance resolver: refresh khi `connected/accountChanged/networkChanged` và sau tx (`scheduleBalanceRefresh [1600, 4000]ms`); không poll liên tục.
- `prefers-reduced-motion`: tắt animation/spinner.
- Mọi target ≥44px; focus ring token `--twk-accent`.

### Theme — tham chiếu TOÀN CỤC theo lựa chọn ban đầu (bắt buộc)

> **Sửa pitfall của XRPL Wallet Kit:** button ở đó tự resolve theme riêng và mặc định `themeMode:"light"` — dễ lệch với modal. TRON kit phải có **một nguồn theme duy nhất**.

- Theme (`themeName` / `mode` / `customTheme`) khai báo **một lần** ở cấp kit khi khởi tạo (`createWalletKit({ ui: { themeName, mode, customTheme } })`). **Modal, WalletButton, account panel, toast, QR đều đọc chung** resolved theme đó — không surface nào tự đặt default theme riêng.
- `WalletButton` **không** mặc định `themeMode:"light"`. Nếu không truyền theme riêng → **kế thừa theme toàn cục**. Các option theme trên button chỉ là **override tuỳ chọn** (hiếm dùng), không phải nguồn mặc định.
- `mode:"auto"` phải resolve **đồng bộ cho tất cả surface** cùng lúc (cùng nghe `prefers-color-scheme`); đổi theme runtime (`kit.setTheme(...)`) cập nhật mọi surface.
- **Portal-safe:** account panel (portal ra `body`) và modal phải nhận `--twk-*` resolved **áp trực tiếp lên root portal** (`applyThemeToElement`), không kế thừa từ selector app hay `:root`.
- Kỹ thuật: client giữ một `ResolvedTheme` chung, truyền xuống controller khi tạo (`createWalletModal`, `createWalletButton`, `createWalletToast` nhận cùng `theme`); khi theme đổi thì broadcast re-render tất cả.

## 4C. Panel còn thiếu (bổ sung từ XRPL Wallet Kit)

Rà `xrplWalletKit/packages/ui` — các surface sau **chưa có trong spec TRON**, cần bổ sung. (Xác nhận: spinner connecting của XRPL là ring `96px` quanh icon `66px` → đúng như mục 1C.)

### a) Network badge (đầu wallet list)
- Hàng `.twk-network-row` canh phải, `min-height 22px`, hiển thị **badge mạng hiện tại** ở đầu danh sách ví.
- Pill `font 10px/560`, dot `6px` + nhãn in hoa ≤10 ký tự:
  - **Mainnet** = vàng gold: light `bg #fef3c7 / border #fde68a / text #92400e`; dark `bg rgba(245,158,11,.12) / border .20 / text #fbbf24`.
  - **Nile / Shasta (testnet)** = tông amber/blue nhạt (phân biệt mainnet), nhãn `NILE`/`SHASTA`.
  - **Custom** = `CUSTOM`.
- TRON: đọc `manager.getNetwork()`; nếu có nhiều network cấu hình → cho click badge để **switch network** (tuỳ chọn), không thì chỉ hiển thị.

### b) WalletInline (picker nhúng, không overlay)
- Bản picker **mount thẳng vào 1 element** (`createWalletInline({ target })`) — **không scrim, không close**, render cùng state `list/connect/qr` inline.
- Dùng chung engine với modal (cùng list/connect/qr + theme). Cho phép nhúng chọn ví trực tiếp vào 1 khu vực trang, không cần popup.
- API: `createWalletInline(options).mount(target)`; `destroy()`.

### c) Wallet group + mini-icon stack
**Superseded 2026-07-06:** không triển khai grouping trong All Wallets. Lý do: danh sách phẳng dễ hiểu hơn, tránh trùng lặp ví giữa Extension/Mobile và đúng phản hồi sản phẩm hiện tại. Extension/Mobile chỉ còn là metadata (`platforms`, `data-twk-platforms`) để tối ưu PC/mobile sau này.

### d) QR scan-safe background (quét dễ ở dark theme)
- Không render nút `.twk-qr-theme-action`.
- QR luôn dùng nền trắng và foreground đen trong connect QR/address QR để dễ quét ở cả light và dark theme.
- QR card `min-height ~386px` (mobile 358, nhỏ 320), `width min(332px)`; có `qr-help` dưới + `qr-fallback` khi render lỗi; hàng action **Copy link + Try again** (`grid auto-fit`).

### e) Transaction toast (đầy đủ)
- `WalletToast` cố định `bottom-right|left|center`, stack `column-reverse` gap 10px, `min-width 330px` desktop, full-width mobile.
- Mỗi toast: icon `32px` (submitted = spinner accent / confirmed = check success / failed = × error / unknown = ? muted) + body (label + hash mono) + link explorer (Tronscan) + nút dismiss `44px`.
- Auto-dismiss `confirmed/failed` sau N ms; `submitted` giữ đến khi có kết quả. `role=status` polite, không cướp focus. Nhãn từ locale (i18n).

### f) Inline status / error line (trong list)
- `.twk-status` `role=status aria-live=polite` dưới grid ví: hiện hint đang kết nối (màu accent) hoặc **lỗi dạng box** (`.twk-status.twk-error`: viền + nền + màu danger, wrap an toàn). **Reserve chỗ**, không đẩy layout.

## 4D. Flow & điều hướng (back-stack) — Connect, Account Panel, Address QR

### a) Back-stack modal connect (QUAN TRỌNG — giữ trạng thái flow)
Modal giữ **một ngăn xếp view** (`viewStack: View[]`). Vào view mới → `push`; **Back** → `pop` về đúng view trước. Nút Back chỉ hiện khi `stack.length > 1`; title = view hiện tại.

Điểm khác của TRON (5 ví nổi bật + Search all → All Wallets):

```
featured ──(click ví)──────────► connecting/qr ──Back──► featured
featured ──(Search all)────────► all-wallets
all-wallets ──(click ví)───────► connecting/qr ──Back──► all-wallets   ← BẮT BUỘC (không về featured)
all-wallets ──Back────────────► featured
qr/connecting ──Back──────────► view đã mở nó (featured HOẶC all-wallets)
× (close) ─────────────────────► reset stack + đóng
```

- Khi ở **all-wallets** chọn ví rồi vào connecting/qr, **Back phải trả về all-wallets** (giữ cả ô search + vị trí cuộn nếu được), KHÔNG nhảy về featured.
- Kỹ thuật: mỗi lần mở connecting/qr, lưu `origin = currentView`; Back đọc `origin` từ stack thay vì hard-code về featured.
- Lỗi kết nối (Connection declined) vẫn ở connecting view; Back vẫn về `origin`.

### b) Account Panel flow (đã kết nối) — hoàn thiện
Trigger = WalletButton (trạng thái connected). Mở account panel (`dropdown` hoặc `modal`). Panel có **3 sub-view** với back riêng:

```
account (chính) ──(nút QR trong pill)──► address-qr ──Back──► account
account ──(link "View ›" ở recent tx)──► tx-history ──Back──► account
account ──(Disconnect)─────────────────► đóng panel + về disconnected
account ──(× / click ngoài / Esc)──────► đóng panel
```

- **account (chính):** hero avatar (identity avatar HOẶC gradient deterministic từ địa chỉ) → account name (TRX Domain `name.trx` hoặc địa chỉ rút gọn) → address chip + nút QR → balance chip (hoặc cảnh báo "chưa kích hoạt") → recent tx (thu gọn được) → actions **Copy / Explorer(Tronscan) / Disconnect** (full-width 46px).
- Mở address-qr **giữ panel mở**; Back về account chính (không đóng panel).
- Copy: đổi icon + "Copied" 1.4s, `aria-live`.
- Disconnect: spinner ~450ms; copy phải nói rõ TronLink chỉ xoá state local (không revoke ví).

### c) AddressQRCode (sub-view + dùng lại được)
- QR của **địa chỉ TRON base58**, dùng **cùng component QR** với connect (nhất quán): slot reserve, skeleton khi render, nền trắng scan-safe, `qr-fallback` text khi lỗi.
- Dưới QR: **address chip mono** (full, wrap `overflow-wrap:anywhere`) + nút **Copy** (feedback + aria-live).
- Header address-qr: nút **Back** (về account) + title "Address" + Close.
- Có thể mở **độc lập** (từ nút QR trên account) hoặc như bước trong panel — cùng một renderer.

### d) Nguyên tắc chung điều hướng
- Mọi view giữ **kích thước khung theo mục 1B** (auto, trừ all-wallets grid cố định) — chuyển view mượt, không nhảy.
- Chuyển view: forward trượt trái / back trượt phải (opacity+transform 150–300ms, tôn trọng reduced-motion).
- Focus: vào view mới focus phần tử đầu; Back trả focus hợp lý; Esc đóng ở mọi view dismissible; focus trap trong modal.
- Trạng thái async (connecting/qr/balance) không reset khi chỉ chuyển sub-view; huỷ đúng cách khi Back/Close (cancel pending connection).

## 4E. Quy tắc bắt buộc / anti-patterns (học từ XRPL Wallet Kit `PROJECT_MEMORY`)

Những điều XRPL Wallet Kit đã nhấn mạnh **PHẢI tránh** — áp dụng cho toàn bộ control của TRON kit:

1. **Hover KHÔNG đổi layout / KHÔNG nhảy.** Giữ nguyên `border-width`, `padding`, `min-height`, `transform`, `box-shadow` qua các trạng thái hover/active/busy. Chỉ đổi **background** (hoặc opacity) nhẹ. Không dùng hiệu ứng "lift"/scale/đổ bóng động.
2. **KHÔNG hover shadow.** Bỏ mọi `box-shadow` khi hover trên nút, wallet row, action, link. **Wallet row = nền mềm, không viền, không shadow**; hover chỉ đổi `background: var(--twk-surface-hover)` (light → đậm hơn, dark → sáng hơn) để icon/text **không xê dịch**.
3. **Link KHÔNG gạch chân.** `text-decoration: none` ở **mọi trạng thái kể cả hover** — áp cho toast "View", explorer link, "Copy link", "Get". (Anh đã nhấn mạnh bỏ gạch chân.)
4. **`-webkit-tap-highlight-color: transparent`** cho các control chính (tránh overlay tap native iOS/Android gây chớp/nhảy).
5. **Host-CSS defense.** Mọi control (close/back, wallet row, action, QR/Retry, toast dismiss/link) reset `appearance:none; box-sizing:border-box; font:inherit; line-height; margin:0; outline; overflow; transform:none; width/flex` để CSS global (Bootstrap…) không gây nhảy — **nhưng không đổi kích thước khung modal**.
6. **Copy KHÔNG có state trung gian "Copying…".** Dùng guard `copyInProgress`, render **một lần** sang "Copied" (1.4s) → nút không nhảy 2 lần.
7. **KHÔNG ép fixed height chung mọi view.** Giữ tỉ lệ theo nội dung (chỉ `all-wallets` grid cuộn) — khớp mục 1B; ép mọi view về một khung làm UI mất cân đối.
8. **Dropdown account panel = mini modal.** Không header "Connected", không nút close, không overlay, **không shadow**; dùng cùng token radius/border/spacing với modal.
9. **`prefers-reduced-motion`:** tắt transition/animation/spinner.
10. **Footer text (`TRON Wallet Kit`) không phải chuỗi dịch i18n.**
11. **Icon ví KHÔNG viền** (list + connecting); chỉ bo góc + overflow hidden. **Mọi icon trạng thái (status badge ×/✓, tick, close, copy…) dùng SVG** căn tâm bằng flex — **không dùng ký tự text** (×/✓) vì render lệch/không ổn định giữa font & OS.

## 4F. Chuẩn nút action (button system) — đọc lại XRPL connect/account button

### Cấu trúc & quy tắc chung (mọi nút action đều theo)
- **Cấu trúc:** `‹svg icon› + ‹span label›`, `gap: 8px`. **Icon SVG luôn nhạt hơn text**: `svg { opacity: .58 }`; label màu `text`, `14px / 560`.
- **Base CSS:** nền `surface`, `border: 1px solid` (actionBorder nhạt), `border-radius: var(--twk-wallet-radius)`, `min-height: 44–46px`, **no shadow**, **hover chỉ đổi background** (không viền/transform/shadow), `text-decoration: none`, focus ring `--twk-accent`, `-webkit-tap-highlight-color: transparent`.
- **Trạng thái khi nhấn = ĐỔI ICON SVG (không đổi kích thước nút):**
  - **Copy** → thành công: icon `copy` → **`check` màu `success` (opacity 1)** + label "Copied" ~1.4s rồi trở lại. (Không có state "Copying…".)
  - **Try again / async** → icon → **spinner quay** (`twk-action-spin`); nút `disabled` trong lúc chạy (`cursor: wait`, **giữ opacity** — không mờ/nhảy).
  - **Disconnect** busy → icon `logout` → **spinner** + label "Disconnecting".
- **Mọi icon là SVG** (~16–17px), **không dùng glyph text** (×/✓) — khớp 4E #11.
- Icon-only (back/close/qr-trigger/dismiss/light-toggle): **nền trong suốt, không viền**, hover mới hiện nền tròn nhẹ, vùng chạm 40–44px, SVG ~17px căn tâm bằng flex.

### Danh sách nút cần có trong kit

| Nút | Vị trí | Icon mặc định | Icon khi nhấn | Nhãn (default → active) | Hành vi |
| --- | --- | --- | --- | --- | --- |
| **Copy address** | account panel, address-qr | `copy` | `check` (success) | Copy → **Copied** | copy địa chỉ base58, reset 1.4s |
| **Copy link (URI)** | QR view | `link` | `check` (success) | Copy link → **Copied** | copy `qrUri` (mục 1D) |
| **Try again** | connecting/QR lỗi | `refresh` | `spinner` | Try again | retry connect (clear stale trước) |
| **Get (install)** | install row | `external`/arrow | — | Get | mở `metadata.downloadUrl` |
| **Disconnect** | account panel | `logout` | `spinner` | Disconnect → **Disconnecting** | ngắt kết nối (~450ms) |
| **Explorer / View** | account panel, tx row, toast | `external` | — | Explorer / View | mở Tronscan (`text-decoration:none`) |
| **Open wallet** (deeplink, optional) | QR view | `external` | — | Open | mở deeplink ví mobile |
| **Address QR** (icon-only) | address chip | `qr` | — | *(aria-label)* | mở view address-qr |
| **Recent tx toggle** | account panel | `chevron` | chevron xoay | *(header section)* | mở/gập danh sách tx |
| **QR light toggle** (icon-only) | QR view | `sun/moon` | — | *(aria-pressed)* | đổi QR nền sáng/tối |
| **Back** (icon-only) | header | `chevron-left` | — | *(aria-label)* | pop back-stack (mục 4D) |
| **Close** (icon-only) | header | `close` (SVG) | — | *(aria-label)* | đóng modal/panel |
| **Toast dismiss** (icon-only) | toast | `close` (SVG) | — | *(aria-label)* | đóng 1 toast |

### Connect / Account trigger (WalletButton) — hướng mới nhất từ XRPL
- **Disconnected:** `‹wallet icon› Connect Wallet`. Click → mở modal.
- **Connecting:** label "Connecting".
- **Connected:** `‹adapter icon› ‹name›  (‹balance›)  ‹chevron›` + **pending dot** khi có tx đang chờ.
- **MỚI — skeleton khi đang resolve:** trong lúc resolve identity/balance, hiện **skeleton shimmer** (`.twk-skeleton-name` ~132×24, `.twk-skeleton-balance` ~80×18) thay vì để trống/nhảy. (XRPL vừa thêm — áp cho TRON.)
- **MỚI — tx submitted pulse:** hàng tx `submitted` có **vòng pulse** quanh status icon (`twk-pulse-ring`) cho tới khi confirmed/failed.
- Size `sm/md/lg` (44/46/50), variant `default/pill/minimal`; nút giữ layout ổn định qua hover/active/busy (mục 4E).

## 4G. Spec tổ chức chi tiết (bám XRPL Wallet Kit → cho TRON)

Số đo lấy trực tiếp từ `xrplWalletKit/packages/ui/src/button.ts`. Áp các quy tắc đã chốt: icon **không viền** (1C-a1), radius icon **5px**, **no hover shadow** (4E), **SVG icons** (4F), QR **to** (1C-c). Chain-specific đổi: **TRX/SUN, Tronscan, TRX Domains (`trondomainjs`), địa chỉ base58 T-address**.

### 1) Connect / Account Button (`WalletButton`)
**Tổ chức:** `root (inline-block, font 14px, position:relative)` → `button.twk-account-button`.
- **Kích thước:** `min-height` sm `44` / md `46` / lg `50`; `padding: 0 12px 0 10px`; `gap: 8px`; `font-weight: 560`; `border-radius: var(--twk-wallet-radius)` (pill → `999px`); nền `surface`; hover `surface-hover`; **no shadow, no transform**.
- **3 trạng thái:**
  - `disconnected`: `‹wallet icon 28px› Connect Wallet`. Click → mở modal.
  - `connecting`: label "Connecting".
  - `connected`: `‹adapter icon› ‹pending-dot?› ‹label› ‹(balance)?› ‹chevron?›`. Click → toggle account panel.
- **Phần tử con:** icon `28px` radius `5px` **không viền**; **pending-dot** `9px` accent (`margin-left:-13px;margin-right:4px`, viền 2px = nền nút) khi có tx submitted; `label` `13px/560` max `220px` (mobile `min(150px,100vw-140px)`) ellipsis; `balance` màu muted dạng `(123 TRX)`; `chevron` `26px` tròn.
- **Skeleton khi resolve:** `.twk-skeleton-name` `132×24`, `.twk-skeleton-balance` `80×18` (shimmer) thay vì để trống/nhảy.
- **TRON:** label connected = **TRX Domain `name.trx`** nếu có, ngược lại địa chỉ rút gọn `T4x…abcd`; balance = TRX (từ SUN /1e6); unfunded → "(chưa kích hoạt)".
- **Options:** `label, showAdapterIcon, showChevron, showTrxDomain, fallbackToAddress, showBalance, accountPanel, accountPanelMode, size, variant, themeMode/themeName/customTheme` (theme kế thừa toàn cục, mục 4B).

### 2) Account Panel
**Hai chế độ:**
- **`dropdown`** (mini modal dưới nút): `width: min(360px, 100vw-32px)`, `min-width: 320px`, `padding: 18px`, `position:absolute; right:0; top:100%; margin-top:10px`; **no header "Connected", no close, no overlay, no shadow** (4E #8). Mobile ≤520px → **fixed bottom sheet** full-width, safe-area.
- **`modal`** (overlay giữa): `width: min(520px)`, `height: min(527px, dvh-48)` (hoặc `min(650px)` khi bật recent tx), `grid-rows: auto minmax(0,1fr)`; header `44/1fr/44` `padding:8px 18px` title `16/500` center + Back(khi ở address-qr)/Close; body `padding:22px 28px 28px`, cuộn khi có tx.

**Header:** title = **"Connected"** (không phải "Account"); Back (khi ở sub-view) / Close. Panel có **3 sub-view: `account` ↔ `address-qr` ↔ `tx-history`** (mỗi cái Back về account).

**Nội dung view `account` (thứ tự dọc, canh giữa) — LAYOUT MỚI NHẤT:**

1. **Hero avatar** `118px` tròn (dropdown `104px`; with-tx `126px`):
   - Có avatar identity → **ảnh** tròn `object-fit:cover`.
   - Không có → **gradient sinh từ địa chỉ (KHÔNG chữ/glyph):** `radial-gradient(circle at 58% 38%, spot, transparent 0 22%, transparent 23%)` chồng `linear-gradient(160deg, from, to)`, hash địa chỉ → 1/6 bộ `[from,to,spot]`; bên trong **một chấm tròn trắng mờ ~50px** (`rgba(255,255,255,.18)`) căn giữa. **KHÔNG vẽ chữ "T".**

2. **Account name** `21/650` (dropdown `18`) — **CHỈ hiện khi có TRX Domain** (`name.trx`); đang resolve → **skeleton name**; **KHÔNG có domain → KHÔNG hiện dòng name** (bỏ hẳn, không fallback địa chỉ ở đây vì địa chỉ đã nằm trong pill bên dưới).

3. **Meta pill — GỘP `[địa chỉ · balance · QR]` vào MỘT chip** (`.twk-account-meta-pill`): `inline-flex; background: surface; border: 1px; border-radius: 14px; min-height: 44px; padding: 2px 4px 2px 12px; gap: 8px; font: 13/560`:
   - `.twk-pill-address` — địa chỉ rút gọn, **mono, màu muted**, ellipsis.
   - `.twk-pill-divider` — vạch dọc `1px × 18px` opacity `.8` (chỉ khi có cả address + balance).
   - `.twk-pill-balance` — **balance màu `text` (nổi bật)** "`123.45 TRX`"; đang load → **skeleton**; ẩn khi `!showBalance`/chưa có số (KHÔNG "-").
   - `.twk-address-qr-trigger` — nút `40px` **trong suốt**, icon `qr` 17px, hover nền nhẹ → mở `address-qr`.
   - → chính là hàng `r3H41K…n9jE │ 2.0707 XRP │ [QR]` trong ảnh. **Bỏ** address chip riêng + balance meta-row riêng của bản cũ.

4. **Warning "chưa kích hoạt"** box `54px` — chỉ khi `showBalance` + `unfunded` (thay cho balance trong pill).

5. **Recent transactions** (mục 4).

6. **Actions** (mục 4F): **Copy** (luôn) · **Explorer** (ẩn mặc định `explorer:false`, Tronscan) · **Disconnect** (luôn, local-only).

**Hành vi:** disconnect spinner ~450ms; Esc/click-ngoài/× đóng; focus trap (modal). **TRON:** disconnect chỉ xoá state local; explorer = Tronscan theo network.

### 3) Address QR (sub-view của Account Panel)
**Tổ chức:** `address-qr-content` grid gap `14px` căn giữa; header có **Back** (về account) + title "Address" + Close.
- **QR địa chỉ:** dùng **cùng component QR** với connect (mục 1C-c/1D) — **QR to** (`width:100%; max-width:340px; aspect-ratio:1/1; border-radius:16px; margin:0 auto`), **không viền card lồng**, có **skeleton** khi render + **light-mode toggle**; encode **địa chỉ base58 T-address**; center logo có thể là logo TRON/ví.
- **Address chip** mono `12px/520`, `overflow-wrap:anywhere`, radius `12px`, full width, wrap an toàn (địa chỉ TRON ~34 ký tự).
- **Copy** (icon `copy`→`check` success, "Copied").
- **Fallback** text địa chỉ khi render QR lỗi.
- Mở từ nút QR trên account; Back giữ panel mở (mục 4D).

### 4) Recent Transactions Panel — LAYOUT MỚI NHẤT (top 3 + View →)
**Tổ chức:** `section.twk-tx-section` nền `surface`, border nhạt, `radius: var(--twk-wallet-radius)`.
- **Header (KHÔNG còn là nút toggle):** `.twk-tx-header` `min-height:34px`, `10px/650 uppercase letter-spacing:.07em` = "RECENT TRANSACTIONS" + **count pill** (`16px`, min-width `18px`, "9+") + **link `View ›`** (`.twk-tx-header-link`: accent `11/650` + chevron-right `13px`, `text-decoration:none`, `margin-left:auto`). **Link chỉ hiện khi có > 3 giao dịch** → mở **sub-view tx-history đầy đủ**.
- **List trong panel:** hiển thị **tối đa 3 hàng gần nhất** (bỏ collapse grid-rows của bản cũ — không gập nữa).
- **Row:** `grid: 24px minmax(0,1fr) auto`, `min-height:42px`, gap `8px`, padding `7px 10px`, `border-top` nhạt (row đầu none):
  - **Status icon** `24px` tròn (SVG): `submitted` = accent + **pulse ring** (`twk-pulse-ring`); `confirmed` = success ✓; `failed` = error ×; `unknown` = muted ?.
  - **Main:** label `12/600` ("Đã gửi/Đã xác nhận/Thất bại/Không rõ") + `hash rút gọn · thời gian tương đối` (`11px mono`).
  - **Link "View" per-row** (`.twk-tx-link`) accent + icon `external` → **Tronscan**.
- **Full history sub-view** (`.twk-tx-history-view`, state `historyOpen`): mở bằng `View ›`; danh sách đầy đủ (≥10), `list-inner { max-height: 468px; overflow: auto }`; header có **Back** về `account`. → Account panel có **3 sub-view: account ↔ address-qr ↔ tx-history**.
- **Empty:** box `.twk-tx-empty` "Chưa có giao dịch".
- **Data:** `maxVisibleTransactions`; lọc theo `account.address` + `network.id`; sort `confirmedAt ?? failedAt ?? submittedAt` giảm dần.
- **TRON:** hash = TronTxID (64 hex); vòng đời `submitted → confirmed/failed/unknown` (spec §16); hết retry → `unknown` + link Tronscan. Opt-in `showRecentTransactions`; khi bật panel cao thêm nhưng **không đè hero/actions** (cuộn nội bộ).

## 5. Việc code cụ thể (packages/ui)

1. **Ghi đè preset `light`/`dark`** trong `themes.ts` bằng bộ giá trị mục 2 (không thêm tên preset gắn thương hiệu Reown); `mode:auto` resolve về `light`/`dark` theo hệ thống.
2. **Wiring `readyState`:** trong `modal.ts > mapAdapterToWalletOption`, gọi `adapter.isAvailable()` → set `readyState: found|notFound` và render badge `INSTALLED/NOT INSTALLED/QR CODE`. (Hiện đang hardcode `available:true`.)
3. **View routing:** tách `modal.ts` thành state `view` (`featured|all-wallets|connecting|qr|account`) + render theo view; giữ HTML helper hiện có.
4. **Search:** thêm input lọc ví ở view `all-wallets` (nhóm + truncate tên dài + accessible name đầy đủ). **Không thêm toggle "Certified"** — chỉ lọc theo tên/nhóm trên catalog TRON.
5. **Badge component:** thêm `.twk-badge` dùng token mục 2; bỏ pill "Ready/Unavailable" text thuần.
6. **A11y:** focus trap trong modal, phím `Escape` đóng, click backdrop đóng, trả focus khi đóng.
7. **Catalog + icon:** thêm `wallet-catalog.ts` (metadata 16 ví: id, name, icon, homepage, group, transport, defaultBadge). Icon resolve theo thứ tự `adapter.metadata.icon ?? walletIcons[id] ?? fallback`; icon adapter là nguồn sự thật (data-URI trong metadata), catalog-only dùng `packages/ui/src/wallets/icons.generated.ts`. Xem mục **3.1** cho nguồn/vị trí/script.
8. **Card radius/token:** map `.twk-modal` dùng `--twk-radius` (28–32px), row `--twk-wallet-radius` (16px), icon `8px` cố định, badge `4px`.
9. **WalletButton controller** (mục 4B): nút Connect/Account 3 trạng thái (disconnected/connecting/connected), variant `default/pill/minimal`, size `sm/md/lg`, chevron + pending dot + balance; account panel `dropdown|modal` với hero avatar gradient, address+QR, balance chip, recent tx thu gọn, actions copy/explorer/disconnect; focus trap + Escape + click-outside + scroll lock; identity qua `trondomainjs`, balance TRX, explorer Tronscan. Port từ `xrplWalletKit/packages/ui/src/button.ts`.
10. **Theme dùng chung 1 nguồn:** client resolve theme một lần từ `ui` config ban đầu, truyền cùng `ResolvedTheme` cho `createWalletModal`/`createWalletButton`/`createWalletToast`; button **không** tự default `themeMode:"light"` mà kế thừa toàn cục; áp `--twk-*` trực tiếp lên mọi portal root; `kit.setTheme()` re-render tất cả surface. (Xem mục 4B → Theme toàn cục.)
11. **Điều chỉnh theo screenshot Reown** (mục "Điều chỉnh bắt buộc"): `.twk-close`/`.twk-back` nền trong suốt + không viền, hover mới hiện nền tròn nhẹ; featured đúng 5 ví; connecting/error có install row "Don't have {ví}? Get" và error title đỏ; QR có logo ví ở tâm. **BỎ tab Mobile/Webapp/Browser.**
19. **Tổ chức 4 component** (mục 4G): dựng theo số đo XRPL — **Connect Button** (3 state, size/variant, pending dot, skeleton name/balance, TRX Domain/balance TRX); **Account Panel** (title "Connected"; avatar gradient + chấm trắng mờ **KHÔNG chữ "T"**; **meta pill GỘP `[địa chỉ · balance · QR]`**; **name chỉ hiện khi có domain**, không domain thì bỏ hẳn dòng name; balance trong pill **ẩn khi không có, không "-"**; **Explorer ẩn mặc định**; recent tx top-3 + **link "View ›"** mở **tx-history sub-view**; 3 sub-view account↔address-qr↔tx-history; nút theo 4F; disconnect local-only); **Address QR** (dùng chung QR to + light toggle, address chip mono, copy, fallback); **Recent Transactions** (header toggle + count, collapse grid-rows, row status SVG + pulse submitted, "View"→Tronscan, empty state, opt-in, cuộn nội bộ). Đổi chain: TRX/SUN, Tronscan, base58, TronTxID.
18. **Chuẩn nút action** (mục 4F): mọi nút = `svg icon (opacity .58) + label`; base nền surface + border nhạt + radius wallet + min-height 44–46 + no shadow + hover chỉ đổi bg + `text-decoration:none`. Feedback **đổi icon SVG**: copy→check(success) "Copied" 1.4s, try again/disconnect→spinner (disabled, giữ opacity). Icon-only (back/close/qr/dismiss/light) nền trong suốt hover-bg. Dựng đủ bộ nút theo bảng. Connect button thêm **skeleton name/balance** khi resolve + **pulse ring** cho tx submitted (hướng mới XRPL).
17. **Wiring WalletConnect QR & Copy link** (mục 1D — SỬA GẤP): nối đúng chuỗi `WC adapter onQr → client manager.emitQr → core emit("qr") → modal.on("qr") → showQr`. `showQr`: lưu `qrUri=uri`, render shell, rồi `renderQr(root.querySelector(".twk-qr-code"), uri)` — **có URI mới vẽ**, `replaceChildren()` xoá skeleton, `QRCodeStyling({data:uri,width:304,ecl:"H"})` append vào đúng ô. **Copy link đọc chính `qrUri`** (disabled khi rỗng). Xử lý loading/ready/rejected/timeout/error trong cùng ô, light-toggle vẽ lại cùng URI, pendingQr replay, guard stale adapter, Try again clear stale + chờ URI mới.
16. **Quy tắc/anti-patterns** (mục 4E): hover chỉ đổi background (giữ nguyên border/padding/min-height/transform/shadow — **không nhảy**); **bỏ mọi hover shadow**; **link `text-decoration:none`** mọi trạng thái (bỏ gạch chân); `-webkit-tap-highlight-color:transparent`; host-CSS defense mọi control; copy render một lần "Copied" (không "Copying…"); không ép fixed height chung; dropdown panel = mini modal không shadow/overlay; reduced-motion tắt animation. **QR caveat:** test quét URI WalletConnect với styled QR, fallback QR phẳng không logo cho WC URI nếu quét lỗi.
15. **Flow & back-stack** (mục 4D): modal giữ `viewStack`, Back `pop` về đúng origin — **all-wallets → chọn ví → connecting/qr → Back về all-wallets** (không về featured), giữ ô search/scroll; lỗi kết nối vẫn ở connecting, Back về origin. Account panel 2 sub-view (account ↔ address-qr) với Back riêng, mở address-qr giữ panel mở. AddressQR dùng lại component QR (skeleton + light toggle + fallback + copy). Huỷ pending connection khi Back/Close.
14. **Panel bổ sung** (mục 4C): **network badge** đầu list (testnet/custom; mainnet mặc định ẩn); **`createWalletInline`** picker nhúng không overlay; **wallet group + mini-icon stack đã supersede** để All Wallets giữ flat grid; **QR nền trắng scan-safe** cho dark/light theme; **transaction toast** đầy đủ (submitted/confirmed/failed/unknown, dismiss, explorer Tronscan, i18n); **inline status/error line** `role=status` reserve chỗ.
13. **Spinner + metadata + QR** (mục 1C): **bỏ `.twk-connecting-arc`**, thay bằng **vòng spinner quay quanh logo** (ring 88–96px, border-top accent, `twk-spin`). **Bỏ border quanh icon ví** (list + connecting). **Status badge ×/✓** = vòng tròn 20px `right:-4px;bottom:-4px`, viền 2px surface, **SVG căn tâm bằng flex** (không dùng text ×/✓), icon cha `position:relative`. **Thêm `downloadUrl` vào `WalletMetadata`**; nút Get dùng `metadata.downloadUrl ?? homepage`; icon + link đọc từ metadata/catalog, **không hardcode ở UI**. **QR chuẩn (TO, sạch, KHÔNG tabs, KHÔNG title body):** QR lớn `width:100%; max-width:340px; aspect-ratio:1/1; margin:0 auto; border-radius:16px` đặt thẳng trên nền (bỏ card viền lồng + ô 208 nhỏ); skeleton cùng kích thước QR lớn khi chờ URI; center logo ~56px; chỉ 1 phụ đề "Scan this QR Code..."; Copy link (disabled khi chưa URI) + Try again khi lỗi + install row; spacing dọc gọn (QR → subtitle mt8–10 → Copy mt12). **QR lib:** thêm **`qr-code-styling`** (QR styled bo tròn + logo tâm giống Reown) làm QR chính, giữ **`qrcode`** làm fallback; nạp động khi mở QR view; fg/bg + light-toggle theo token; logo tâm từ `metadata.icon`; dùng chung helper `renderWalletQr()` cho cả WalletConnect QR, QR ví mobile và Address QR.
12. **Chuẩn khung + typography + loading** (mục 1B): **width `min(400px)`**; **chiều cao AUTO** cho featured/connecting/error/qr/account (bỏ `min-height:420` modal + `min-height` connect-detail/no-wallets), **CHỈ `.twk-wallet-grid` cố định `height:~360px;overflow:auto`**. **Gọn khoảng cách như Reown**: header `48–56px`, bỏ `justify-content:center` + `min-height:380` ở connecting/error, install row `margin-top:20–24px` (không `auto`). **Gộp typography 1 hệ**: bỏ `.twk-detail-title{18/800}`, dùng `.twk-title{16/500}` + `data-tone=danger` cho lỗi; chuẩn hoá subtitle/body/link/action/badge/count theo bảng. **`--twk-wallet-icon-radius:5px`**. **Skeleton mọi vùng async**: grid/list icon (56/32px, radius 5px, nền muted, shimmer), badge reserve chỗ CHECKING→INSTALLED, balance/identity chip skeleton; fade opacity, reduced-motion tắt shimmer.

---

## 6. QA checklist (bắt buộc trước khi coi UI xong)
Light + dark trên desktop và mobile 375px · keyboard-only connect · reduced-motion · tên ví dài · ví chưa cài (badge NOT INSTALLED + Install) · view QR reserve kích thước · account panel: identity chưa resolve / đã resolve `.trx` / balance loading/lỗi · không nhảy khung khi đổi view · IIFE/CDN render giống React.
---

## Implementation Update 2026-07-04 - WalletButton baseline

- Added shared `createWalletButtonHtml()` in `packages/ui/src/button.ts` for disconnected/connected button markup.
- Added React `WalletButton` wrapper in `packages/react/src/index.ts`; `examples/react-basic` now renders this kit button instead of a local demo button.
- Added token-driven button CSS for icon, label, balance, chevron, pending dot, size, and variant.
- `createWalletKit()` now passes the global `ui` theme into the DOM `createWalletButton()` so the button does not resolve a separate light default.
- Modal subtitle default is now empty; `react-basic` also passes `modal: { subtitle: "" }`, so "Choose a TRON wallet to continue." is not shown.
- Remaining from section 4B: connected button should open/toggle a real account-panel dropdown/modal controller; current baseline still opens the connect modal through the existing kit modal hook until the account-panel controller is upgraded.

---

## Implementation Update 2026-07-05 - Icons + React Account Controller

- Added and ran `scripts/fetch-wallet-icons.mjs`; generated `packages/ui/src/wallets/icons.generated.ts` and source SVGs under `packages/ui/src/wallets/icons/`.
- React `WalletButton` now toggles a real shared account panel when connected, with dropdown/modal mode, copy, disconnect, QR, recent transactions, outside click close, and Escape close.
- Added identity/balance lifecycle foundation in `@tron-wallet-kit/client`: cached `refreshIdentity()` writes TRX Domain/display name/avatar into session; opt-in `balance.resolver` lets `refreshBalance()` write TRX balance into session.
- Historical note: visual QA screenshots were captured for React light/dark/mobile modal states in `Review/screenshots/`; Browser/IIFE rebuild was skipped in that pass but later completed in P9.

## Implementation Update 2026-07-05 - Reown-style UI Polish Pass

- Added `walletIconRadius` to the theme token contract and mapped it to `--twk-wallet-icon-radius`; wallet icons now use the shared icon radius token across rows, cards, large icons, QR center logo, and button icons.
- Updated the default font token to include `Inter, "Inter var", ... Roboto` per the spec.
- Adjusted modal styling closer to the measured Reown frame: stable 400px max frame with a fixed `.twk-body`, light header, no heavy header divider, transparent close/back buttons by default, hover-only circular surface, stable 40px hit area.
- Changed featured order to exactly five entries before Search: TronLink, OKX, Bitget, TokenPocket, WalletConnect. WalletConnect remains last; MetaMask and Trust are no longer featured by default.
- Added QR-view visual structure from the spec: Mobile/Webapp/Browser tabs, reserved QR size, skeleton placeholder, wallet logo center slot, Copy link action, retry action, and install row when homepage exists.
- Improved connecting/error view with stable detail height, install row, retry button, and red "Connection declined" title when an error exists.
- Reworked account panel presentation toward the spec: 118px deterministic avatar/identity hero, address chip, balance pill, full-width actions, Explorer action when the network exposes an account explorer URL, QR reserve, and recent transaction slot.
- Verification passed: `pnpm --filter @tron-wallet-kit/ui typecheck`, `pnpm --filter @tron-wallet-kit/ui test`, `pnpm --filter @tron-wallet-kit/react typecheck`, `pnpm --filter @tron-wallet-kit/react test`, `pnpm --filter @tron-wallet-kit/examples typecheck`, `pnpm typecheck`, `pnpm test`, `pnpm lint`. React example route `http://127.0.0.1:5174/react-basic/` returned HTTP 200.
- Historical note: at this point the full visual screenshot pass, real-wallet QA, account-panel QR sub-view, focus trap/scroll lock, and browser/IIFE rebuild were still open; P3-P9 and the closure audit supersede this note.

## Implementation Update 2026-07-05 - Section 1B/1C Review Correction

- Treated the reviewed spec as authoritative and superseded the earlier fixed `.twk-body { height: 480px }` implementation note.
- Connect modal now keeps `width: min(400px, calc(100vw - 32px))` but uses auto height for featured, connecting, error, QR, and account-style content.
- Only the all-wallets grid is fixed/scrolling: `.twk-wallet-grid { height: 360px; overflow: auto; }`, with a matching no-wallets state height.
- Header/detail spacing is more compact: header min-height is `56px`, connecting/QR detail no longer uses a tall centered min-height, and install rows use normal `margin-top` instead of `auto`.
- Removed the old `.twk-connecting-arc` markup/style and replaced it with `.twk-connecting-ring`, a spinner ring around the large wallet logo. Error state reserves the same icon area and adds a small danger dot.
- Added `downloadUrl` to `WalletMetadata` and `WalletOptionViewModel`; adapter metadata and catalog entries can provide it, and install rows use `downloadUrl ?? homepage`.
- Stateful modal navigation now uses a view stack. `featured -> all-wallets -> wallet -> connecting/qr -> Back` returns to `all-wallets` instead of hard-coding Back to featured.
- Verification passed: `pnpm --filter @tron-wallet-kit/ui typecheck`, `pnpm --filter @tron-wallet-kit/ui test`, `pnpm --filter @tron-wallet-kit/core typecheck`, `pnpm --filter @tron-wallet-kit/adapter-tronlink typecheck`, `pnpm --filter @tron-wallet-kit/adapter-walletconnect typecheck`, `pnpm --filter @tron-wallet-kit/react typecheck`, `pnpm --filter @tron-wallet-kit/react test`, `pnpm --filter @tron-wallet-kit/examples typecheck`.
- Historical note: Browser/IIFE build was skipped for this React-first pass, then completed in P9.

## Implementation Update 2026-07-06 - P3 Account Panel Flow Completed

- Completed P3 from section `0. Execution Discipline / Plan Tuần Tự`.
- Added an account-panel address QR sub-view with `account -> address-qr -> account` navigation, Back/Close controls, full address chip, Copy feedback, and reusable QR rendering. Later correction removed the QR theme toggle in favor of always-white scan-safe QR background.
- Address QR now reuses the shared `renderWalletQr()` helper, keeping connect QR and address QR rendering behavior aligned.
- React `WalletButton` now renders address QR dynamically into the reserved QR target and keeps the account panel open while switching sub-views.
- Account panel modal mode now scroll-locks `body`, traps Tab focus inside the panel, closes with Escape/outside click, and restores focus when closed.
- Verification passed: `pnpm --filter @tron-wallet-kit/ui typecheck`, `pnpm --filter @tron-wallet-kit/ui test`, `pnpm --filter @tron-wallet-kit/react typecheck`, `pnpm --filter @tron-wallet-kit/react test`, `pnpm --filter @tron-wallet-kit/examples typecheck`.
- Next phase: P4 loading/skeleton completeness.

## Implementation Update 2026-07-06 - P4 Loading/Skeleton Completed

- Completed P4 from section `0. Execution Discipline / Plan Tuần Tự`.
- Wallet rows/cards now render stable skeleton placeholders for wallet icon, wallet name, and badge while availability is `loading`.
- Badges reserve width so `CHECKING -> INSTALLED/NOT INSTALLED/QR CODE` does not resize wallet rows.
- Account panel view model now supports `identityLoading` and `balanceLoading`; the React WalletButton lifecycle sets those states while TRX Domain identity and TRX balance resolve.
- Account panel identity and balance render stable token-driven skeleton chips instead of swapping through a bare `-`.
- Skeleton shimmer is disabled under `prefers-reduced-motion`.
- Verification passed: `pnpm --filter @tron-wallet-kit/ui typecheck`, `pnpm --filter @tron-wallet-kit/ui test`, `pnpm --filter @tron-wallet-kit/react typecheck`, `pnpm --filter @tron-wallet-kit/react test`, `pnpm --filter @tron-wallet-kit/examples typecheck`.
- Next phase: P5 inline status + toast controller.

## Implementation Update 2026-07-06 - P5 Inline Status + Toast Controller Completed

- Completed P5 from section `0. Execution Discipline / Plan Tuần Tự`.
- Added `.twk-status` reserved status line under featured/all-wallets list views with `aria-live="polite"` and danger alert behavior for errors.
- Transaction toast controller now updates an existing toast by transaction hash/id instead of duplicating submitted -> confirmed/failed transitions.
- Toast dismiss buttons now remove individual toasts.
- Non-pending toasts auto-dismiss through the resolved `toast.autoDismissMs` config; pending toasts remain until a final status arrives.
- Toast explorer links and `aria-live="polite"` container remain covered by tests.
- Verification passed: `pnpm --filter @tron-wallet-kit/ui typecheck`, `pnpm --filter @tron-wallet-kit/ui test`, `pnpm --filter @tron-wallet-kit/react typecheck`, `pnpm --filter @tron-wallet-kit/react test`, `pnpm --filter @tron-wallet-kit/examples typecheck`.
- Next phase: P6 network badge + WalletInline.

## Implementation Update 2026-07-06 - P6 Network Badge + WalletInline Completed

- Completed P6 from section `0. Execution Discipline / Plan Tuần Tự`.
- Added `networkName` and `networkType` to the connect view model.
- Modal and inline picker now render a token-driven `.twk-network-badge` at the top of featured/all-wallets views when network info is supplied.
- Added `createWalletInlineHtml()` and `createWalletInline()` as a no-overlay wallet picker that reuses the same wallet list/search/connect/QR rendering path as the modal.
- Added `.twk-inline` and `.twk-network-badge` styles.
- Added UI tests for inline picker markup and network badge rendering.
- Verification passed using machine pnpm (`C:\Users\PC\AppData\Roaming\npm\pnpm.cmd`) after repairing a pnpm/node_modules lock caused by parallel pnpm runs: `--filter @tron-wallet-kit/ui typecheck`, `--filter @tron-wallet-kit/ui test`, `--filter @tron-wallet-kit/react typecheck`, `--filter @tron-wallet-kit/react test`, `--filter @tron-wallet-kit/examples typecheck`.
- Next phase note superseded: P7 wallet grouping / mini-icon stack was later removed by product decision; All Wallets remains flat.

## Implementation Update 2026-07-06 - P7 Wallet Grouping Superseded

- Earlier P7 grouping work was removed after product review.
- Current decision: All Wallets stays flat; no `showGroup`, no `.twk-wallet-groups`, no mini-icon stack.
- Extension/Mobile remains metadata only through wallet `platforms` and card `data-twk-platforms`.
- Next phase remains P8 theme/runtime polish history.

## Implementation Update 2026-07-06 - P8 Theme Runtime Completed

- Completed P8 from section `0. Execution Discipline / Plan Tuần Tự`.
- Added `setTheme(config)` to `WalletModal`, `WalletButton`, `WalletToast`, and `WalletInline`.
- Added kit-level `setTheme(theme)` in `@tron-wallet-kit/client` to update mounted modal/button/toast surfaces through one entrypoint.
- Added `@tron-wallet-kit/ui` source path alias to `@tron-wallet-kit/client` typecheck config so workspace typechecking uses current UI source declarations.
- Self-host Inter Vietnamese subset decision: `DEFER` to release asset pass because the repo does not yet include approved font assets/licensing notes; current token stack remains Inter-first with system fallback.
- Verification passed using machine pnpm: `--filter @tron-wallet-kit/ui typecheck`, `--filter @tron-wallet-kit/ui test`, `--filter @tron-wallet-kit/client typecheck`, `--filter @tron-wallet-kit/client test`, `--filter @tron-wallet-kit/react typecheck`, `--filter @tron-wallet-kit/react test`, `--filter @tron-wallet-kit/examples typecheck`.
- Next phase: P9 QA parity completed below.

## Implementation Update 2026-07-06 - P9 QA Parity Completed

- Completed P9 automated QA parity from section `0. Execution Discipline / Plan Tuan Tu`.
- Captured clean React browser screenshots:
  - `Review/screenshots/react-basic-p9-light.png`
  - `Review/screenshots/react-basic-p9-dark.png`
  - `Review/screenshots/react-basic-p9-mobile.png`
- Browser smoke on `http://127.0.0.1:5174/react-basic/` verified visible featured wallet rows, no legacy subtitle text, no horizontal overflow, visible mobile modal, and uninstalled/QR/TRON badges.
- Reduced-motion support was verified in `packages/ui/src/styles.ts` through the `prefers-reduced-motion` block disabling animation.
- Browser/IIFE parity passed through workspace build output:
  - `packages/browser/dist/tron-wallet-kit.iife.js`
  - `packages/browser/dist/tron-wallet-kit.iife.min.js`
- Verification passed:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd lint`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd build`
- Real TronLink extension QA and WalletConnect mobile QR scan QA remain `DEFER` because they require an installed wallet/manual device session.

## Spec Closure Audit 2026-07-06

This spec is closed for automated React-first UI implementation. P0-P9 are complete, with the external/manual items below carried forward explicitly instead of hidden inside the phase board.

| Area | Status | Carry-forward rule |
| --- | --- | --- |
| React light/dark/mobile visual QA | DONE | Screenshots are stored in `Review/screenshots/react-basic-p9-light.png`, `react-basic-p9-dark.png`, and `react-basic-p9-mobile.png`. |
| Browser/IIFE parity | DONE | `pnpm build` produced `packages/browser/dist/tron-wallet-kit.iife.js` and `packages/browser/dist/tron-wallet-kit.iife.min.js`. |
| Real TronLink extension QA | DEFER | Requires installed TronLink and manual approval/rejection/account-change checks. Do this before public release or adapter hardening. |
| WalletConnect mobile QR scan QA | DEFER | Requires a real mobile wallet scan of long WalletConnect URI; if styled QR fails, fallback WC URI QR to plain `qrcode` without center logo. |
| Wallet icon brand/source licensing | DEFER | Release checklist now tracks generated SVG data-URI license/source confirmation before golive. |
| Account view inside connect modal | DEFER | Connected account UI currently belongs to `WalletButton` account panel. Do not add a connect-modal account route unless product flow requires it. |
| Preserve all-wallets scroll on Back | DEFER | Search state is preserved; scroll restoration can be added when all-wallets list becomes large enough to feel painful. |
| Cancel pending connection on Back/Close | DEFER | Core has optional `cancelPendingConnection`; wire modal/client cancellation when adapter behavior is standardized. |
| Reduced-motion view transitions | DEFER | Spinner/toast/skeleton reduced motion exists; directional view transition animation is not implemented yet. |
| IIFE bundle size | DEFER | All-in-one browser bundle works but remains large; decide split adapter globals vs convenience bundle before release. |

Next implementation should move out of this spec and use `Review/REOWN_UI_SPEC_IMPLEMENTATION_TRACKER.md` plus `Review/RELEASE_CHECKLIST.md` for carry-forward items.

## Implementation Update 2026-07-06 - Connecting/QR Panel Spec Correction

- Re-opened the connecting and QR panel sections after visual feedback.
- QR panel now follows section 1B/1C more closely:
  - removed the extra body title from QR view
  - keeps the wallet name only in the modal header
  - uses a large responsive QR reserve (`max-width: 340px`, renderer width `304px`)
  - places the single subtitle under the QR
  - keeps Copy link disabled until a URI exists and Try again beside it
- Connecting/error panel polish:
  - large wallet icon no longer has a border
  - error badge now uses an inline SVG icon instead of a text `×`
  - spacing around icon/title/subtitle/actions is tighter and closer to the spec
- Browser smoke captured `Review/screenshots/react-basic-qr-panel-polish.png` from `http://127.0.0.1:5174/react-basic/`.
- Verification passed:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react test`

## Implementation Update 2026-07-06 - Strict Code Audit Fixes

- Added `Review/REOWN_UI_SPEC_CODE_AUDIT.md` as the code/spec checklist for this UI pass.
- Fixed WalletConnect QR URI wiring:
  - `ConnectOptions` now supports `onUri`
  - modal/inline connect passes `onUri` into `manager.connect`
  - WalletConnect adapter calls both configured and per-connect URI callbacks
- Browser smoke confirmed QR renders through `qr-code-styling` (`qrRenderer: "styled"`) and produces SVG in the modal.
- QR loading now keeps the full `.twk-qr-code` frame with skeleton instead of rendering a loose skeleton.
- QR view no longer renders visible `wc:` URI text; Copy link reads controller state.
- QR subtitle now uses "Scan this QR Code with your phone" for WalletConnect/mobile QR wallets.
- Mainnet network badge is hidden by default; the network badge is reserved for testnet/custom network context.
- Spinner ring was adjusted to avoid sitting too close to the wallet logo.
- Verification passed for core, UI, WalletConnect adapter, client, and React packages; see `Review/REOWN_UI_SPEC_CODE_AUDIT.md`.

## Implementation Update 2026-07-06 - QR Scan-Safe Default

- Removed `.twk-qr-theme-action` from connect QR and address QR; QR no longer has a theme toggle.
- QR foreground/background tokens now default to black on white so dark themes still render scan-safe QR codes.
- `renderWalletQr()` no longer accepts/uses the old `light` option.
- QR loading skeleton now fills the QR frame and has its own shimmer animation; reduced-motion disables it.
- Dark-mode browser smoke saved `Review/screenshots/react-basic-qr-dark-no-toggle.png` and confirmed:
  - `themeActionCount: 0`
  - `qrRenderer: "styled"`
  - `qrBackground: rgb(255, 255, 255)`
  - `qrColor: rgb(17, 24, 39)`
  - no visible `wc:` URI text

## Implementation Update 2026-07-06 - QR Active Wallet Routing Correction

- Fixed a WalletConnect catalog edge case where QR events could show TokenPocket labels for WalletConnect and other wallets sharing the same WalletConnect adapter transport.
- QR event resolution now preserves the current selected/active wallet first, then exact wallet id (`walletconnect`), and only then falls back to adapter transport matching.
- Added regression coverage for `TokenPocket` appearing before exact `WalletConnect` in the wallet list while QR view still renders WalletConnect header and install CTA.
- Browser QA on `http://127.0.0.1:5174/react-basic/` confirmed clicking WalletConnect opens a QR panel with:
  - header `WalletConnect`
  - install CTA `Don't have WalletConnect?`
  - no visible TokenPocket label in the QR panel

## Implementation Update 2026-07-06 - Connecting Spinner Shape Correction

- Updated the connecting spinner to follow a rounded-square path around the wallet logo instead of a circular ring.
- Corrected the first rounded-square attempt because rotating the whole square made the frame visibly tilt.
- `.twk-connecting-ring` now renders an SVG rounded-rect trail plus an accent rounded-rect; the ring container stays upright and only `stroke-dashoffset` animates.
- Added regression coverage so the connecting ring does not return to a rotating container or `border-radius: 999px`.
- Browser check loaded `http://127.0.0.1:5174/react-basic/` and confirmed the CSS contract:
  - `.twk-connecting-ring-svg` exists
  - `.twk-connecting-ring-accent` animates
  - `.twk-connecting-ring` itself does not animate with `twk-spin`
  - no `border-radius: 999px` on `.twk-connecting-ring`

## Implementation Update 2026-07-06 - Connecting Spinner No-Trail Polish

- Removed the gray/trail border from the connecting spinner; only the colored loading stroke remains.
- Increased the path spacing around the logo by using a larger rounded rect (`x=4`, `y=4`, `width=88`, `height=88`) in the `96x96` SVG.
- Set spinner radius to `rx="36"` for the smoother rounded-square feel requested in the visual reference.
- Updated the accent stroke to `stroke-width: 3.5` and `stroke-dasharray: 78 162`.
- Browser runtime check on `http://127.0.0.1:5174/react-basic/` confirmed:
  - no `twk-connecting-ring-trail` CSS
  - accent stroke CSS exists
  - ring container still does not rotate
  - app loads without framework overlay

## Implementation Update 2026-07-06 - Reown Loading Thumbnail Footprint

- Matched Reown's observed loading thumbnail footprint more closely:
  - SVG `viewBox="0 0 110 110"`
  - SVG `width="110"` and `height="110"`
  - wrapper/ring CSS `110px`
  - logo remains 66px centered for a larger gap
  - accent rect uses `x=8`, `y=8`, `width=94`, `height=94`, `rx=36`
- Browser runtime check on `http://127.0.0.1:5174/react-basic/` confirmed:
  - `height: 110px`
  - `width: 110px`
  - no trail CSS
  - accent stroke exists
  - ring container does not rotate

## Implementation Update 2026-07-06 - Action Button Standardization

- Read the new section `4F. Chuẩn nút action (button system)` and applied the shared action-button contract.
- Added shared action content helper so action buttons render `SVG icon + label` consistently:
  - `twk-action-icon`
  - `twk-action-label`
  - `twk-action-spin`
- Standardized modal actions:
  - Retry uses refresh SVG + label, and switches the icon to the action spinner during retry feedback
  - Copy link uses link SVG + stable `Copy link` label, then check SVG with success state for ~1.4s after copy
  - Get/install uses external SVG + label
- Standardized account actions:
  - Copy address uses copy SVG; copied state uses check SVG with success state
  - Address QR uses QR SVG
  - Explorer uses external SVG
  - Send uses send SVG
  - Disconnect uses logout SVG
- Updated action CSS:
  - base background `surface`
  - border token
  - radius `walletRadius`
  - icon opacity `.58`
  - success icon opacity `1` and success color
  - link actions keep `text-decoration:none`
  - reduced motion disables action spinner
- Added WalletButton connected trigger skeleton support for identity/balance loading:
  - `.twk-skeleton-name`
  - `.twk-skeleton-balance`
- Kept QR light-toggle removed because the newer scan-safe QR decision supersedes the older table row.
- Verification passed:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react test`
  - Browser runtime check on `http://127.0.0.1:5174/react-basic/` confirmed action icon/label/spinner CSS and no framework overlay.

## Implementation Update 2026-07-06 - Action Button Feedback Stabilization

- Fixed retry click feedback for connecting and QR panels:
  - Retry now sets `retryState="busy"` before reconnecting
  - the Retry icon changes from refresh to `.twk-action-spin`
  - reconnect is delayed by 180ms so the user can perceive the button feedback
  - busy Retry remains the same label and disables the button while feedback is active
- Stabilized copy action dimensions:
  - QR `Copy link` keeps the visible `Copy link` label in copied state
  - account-panel copy keeps the visible `Copy` label in copied state
  - copied state changes only the icon to check/success, while the screen-reader live label can still announce `Copied`
- Added regression coverage for:
  - Retry busy state rendering `data-busy="true" disabled`
  - Retry busy state rendering `.twk-action-spin`
  - QR copied state keeping `Copy link` while showing success icon state
- Verification passed:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react test`
- Browser runtime smoke on `http://127.0.0.1:5174/react-basic/` confirmed:
  - app loads with title `TRON Wallet Kit React Example`
  - no framework/Vite overlay
  - `.twk-action-icon`, `.twk-action-label`, `.twk-action-spin`, and `.twk-action[data-busy="true"]` CSS are present
  - only known dev warning observed: Lit dev-mode warning from Vite dependencies

## Implementation Update 2026-07-06 - Extension Adapters And Flat All Wallets

- Added explicit Mobile/Extension metadata for wallet metadata and catalog entries.
- Product correction: All Wallets must remain a single flat searchable grid, with no Extension/Mobile section duplication and no mini-stack grouping.
- Removed `showGroup` runtime wiring plus `.twk-wallet-groups` / `.twk-mini-stack` CSS/markup from the UI implementation.
- Wallet cards still expose `data-twk-platforms` so future PC/mobile presentation can optimize without reworking adapter metadata.
- Search trigger was softened to match the reference: a muted, continuous row that suggests there are more wallets rather than another normal wallet item.
- Popular wallets are wired conservatively from the walletadapter.org wallet reference:
  - native/default adapters remain TronLink and WalletConnect
  - injected extension adapters now exist by default for TokenPocket, OKX, Bitget, Trust, GateWallet, Bybit, Binance, Guarda, OneKey, and Backpack
  - extension-capable wallets are prioritized for desktop testing: TronLink, TokenPocket, OKX, Bitget, Trust, GateWallet, Bybit, Binance, Guarda, MetaMask, OneKey, Backpack
  - WalletConnect fallback is limited to TokenPocket, Binance, and Trust because the reference marks OKX/Bybit/FoxWallet/imToken/Gate/Tomo WalletConnect support as unavailable and Bitget signing support as unavailable
  - dual-mode wallets use extension first, then QR fallback when the extension is unavailable and WalletConnect is configured
  - optional tronweb3 adapter instances can be passed through client bridge config for native adapter behavior
- Tightened TronLink detection so TokenPocket-style globals do not make TronLink appear installed or route into the wrong wallet.
- Added All Wallets wallet-card skeleton behavior:
  - `readyState: "loading"` renders icon/name skeletons inside the card
  - the card footprint remains stable at the existing wallet-card dimensions
  - loading disabled cards do not get visually dimmed
- Browser smoke for this pass was not completed because the local Playwright Chromium binary is missing at `C:\Users\PC\AppData\Local\ms-playwright\chromium_headless_shell-1200\chrome-headless-shell-win64\chrome-headless-shell.exe`.
- Verification passed:
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/ui test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/client test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/adapter-tronlink test`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react typecheck`
  - `C:\Users\PC\AppData\Roaming\npm\pnpm.cmd --filter @tron-wallet-kit/react test`
- Known follow-up: some newly listed catalog wallets still need generated SVG icons before release.

## Implementation Update 2026-07-06 - Account Panel Network And Identity/Balance Integration

- Account Panel must not show a `TRON mainnet` / `Tronmainnet` label. Mainnet is the default context and should stay silent in the account surface; testnet/custom network labels belong to connect/inline wallet picker context only.
- `WalletButton` and standalone React `AccountPanel` no longer pass session `network.name` into account-panel rendering.
- Regression coverage now asserts that even when `networkName` is provided to `createAccountPanelHtml()`, the account panel does not render a network pill.
- Balance integration direction:
  - UI/account panel only consumes normalized `balanceTrx`, `balanceLoading`, and future unfunded/error state.
  - Client owns `refreshBalance()` and writes normalized TRX balance into session.
  - Current implementation supports opt-in `balance.resolver`; next implementation should add a default resolver order of wallet provider `tronWeb.trx.getBalance(address)` first, then configured RPC/TronGrid fallback, converting SUN to TRX in client.
  - Balance failures remain non-blocking by default and keep the existing skeleton/previous balance stable.
- TRX Domains integration direction:
  - Identity stays client-owned through `identity: { enabled: true }` and `createTronDomainIdentityResolver()`.
  - `trondomainjs` should be treated as mainnet-first identity; testnet/custom networks should skip by default unless an app supplies a custom resolver/config.
  - Resolved identity writes `domain`, `displayName`, `avatar`, and metadata into session; UI only renders resolved values and loading skeletons.
  - Real `.trx` lookup QA remains required with a known wallet/domain before golive.

## Implementation Update 2026-07-06 - Account Panel 4G Layout Pass

- Reworked Account Panel toward section 4G:
  - modal panel keeps `width: min(520px)` and now uses `height: min(527px, dvh-48)` normally, switching to `height: min(650px, dvh-48)` when recent transactions are present.
  - dropdown panel behaves as a mini modal: no header, no overlay shadow, `width: min(360px, 100vw-32px)`.
  - account body has its own scroll/padding instead of stacking card/list regions outside the panel.
  - address row now uses a muted address chip plus a 40px QR icon button instead of a full-width QR action in the actions list.
  - recent transactions now render as `.twk-tx-section` with header/count/list rows, and are opt-in when empty.
  - account panel still suppresses mainnet labels.
- React `WalletButton` now accepts and forwards `showRecentTransactions`; `react-basic` passes its existing toggle into the kit button.
- Browser visual QA fixture on localhost confirmed:
  - modal `520 x 650` with recent tx
  - QR action `40 x 40`
  - dropdown header display `none`
  - recent tx and actions visible inside panel
  - no mainnet text in Account Panel

## Implementation Update 2026-07-06 - TronLink ReadyState Correction

- Follow-up from visual QA screenshot where the featured TronLink row still showed `NOT INSTALLED` while OKX showed `INSTALLED`.
- Re-read and preserved the relevant expectations from:
  - section 4D flow/back-stack
  - section 4G #2 Account Panel
  - section 4G #4 Recent Transactions
  - code item #19 component organization
- Fixed adapter-side availability instead of masking the UI badge:
  - TronLink `readyState` can now resolve to installed for legacy `window.tronLink + window.tronWeb` even when another TRON extension such as OKX is also present.
  - generic `window.tron` without `isTronLink` is still not enough to mark TronLink installed.
  - known nested non-TronLink provider paths remain rejected so the TronLink row does not route into TokenPocket/OKX.
- Added regression tests covering mixed-extension globals and TokenPocket false-positive rejection.
- Verification passed:
  - `packages/adapters/tronlink> ..\..\..\node_modules\.bin\tsc.CMD --noEmit`
  - `packages/adapters/tronlink> ..\..\..\node_modules\.bin\vitest.CMD run`
  - `packages/adapters/tronlink> ..\..\..\node_modules\.bin\tsup.CMD src/index.ts --format esm,cjs --dts --sourcemap --clean`

## Implementation Update 2026-07-06 - 4D / 4G #2 / #4 / Code #19 Follow-up

- Re-checked the synced requirements and corrected the remaining Account Panel gaps instead of only changing the TronLink badge.
- Account Panel section 4G #2:
  - title is `Connected`
  - fallback avatar no longer uses any letter/glyph
  - identity/name row only renders when a TRX Domain/displayName exists
  - address, balance, and QR are grouped into `.twk-account-meta-pill`
  - missing balance is hidden, not rendered as `-`
  - Explorer is hidden by default and requires an explicit enable flag
- Recent Transactions section 4G #4:
  - account view renders max 3 rows
  - header is static, no old collapse/toggle behavior
  - `View` appears only when total transactions > 3
  - `View` opens `tx-history` sub-view with Back/Close and internal scroll
  - row-level Tronscan link is supported when `explorerUrl` exists
  - pending rows have a pulse ring
- Flow section 4D / code #19:
  - React `WalletButton` account panel now has 3 sub-views: `account -> address-qr -> account` and `account -> tx-history -> account`
  - address QR still renders via the shared QR target
  - close/back reset returns to account view
- Verification passed:
  - `packages/ui> ..\..\node_modules\.bin\tsc.CMD --noEmit`
  - `packages/react> ..\..\node_modules\.bin\tsc.CMD --noEmit`
  - `packages/ui> ..\..\node_modules\.bin\vitest.CMD run`
  - `packages/react> ..\..\node_modules\.bin\vitest.CMD run`
  - `packages/ui> ..\..\node_modules\.bin\tsup.CMD src/index.ts --format esm,cjs --dts --sourcemap --clean`
  - `packages/react> ..\..\node_modules\.bin\tsup.CMD src/index.ts --format esm,cjs --dts --sourcemap --clean`
  - `examples> ..\node_modules\.bin\tsc.CMD --noEmit`
