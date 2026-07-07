# Đánh giá: PRODUCT_UX_ADAPTER_PROPOSAL + Review code/UI/UX

Ngày: 2026-07-04
Phạm vi: `Review/PRODUCT_UX_ADAPTER_PROPOSAL.md`, `docs/`, `packages/ui`, `packages/core`, `packages/adapters/*`
Tiêu chí đối chiếu: định vị ngang RainbowKit/ConnectKit/Reown AppKit nhưng TRON-native; UI theme light/dark theo demo.reown.com.

---

## 1. Kết luận nhanh

Bản đề xuất **rất tốt về mặt tài liệu**: định vị đúng, checklist a11y/layout/theme đạt chuẩn sản phẩm, kế hoạch phân pha hợp lý. Kiến trúc `core`/`adapter` đã sạch và bám sát spec.

Nhưng có **khoảng cách lớn giữa tầm nhìn trong đề xuất và code UI hiện tại**. Đề xuất mô tả modal kiểu Reown (featured / all-wallets có search / connecting detail / QR / badges) trong khi modal thực tế chỉ là một **danh sách ví phẳng, một pill trạng thái, không search, không badge, không QR view, không routing màn hình**. Đề xuất nên nêu rõ điều này như một phần "gap analysis", thay vì đọc như dự án greenfield.

Đánh giá tổng thể:

| Hạng mục | Điểm | Ghi chú |
| --- | --- | --- |
| Chất lượng bản đề xuất | 8.5/10 | Toàn diện, đúng hướng; thiếu gap-analysis với code hiện có + vài mâu thuẫn |
| Kiến trúc core/adapter | 8.5/10 | Contract sạch, event/storage/session tốt |
| UI/UX đã hiện thực | 4.5/10 | Mới ở mức "foundation", cách xa mục tiêu Reown |
| Tuân thủ theme Reown | 5/10 | Token-driven, portal-safe tốt; **nhưng chưa có preset `reown-light`/`reown-dark`** dù Reown là benchmark chính |

---

## 2. Đánh giá bản đề xuất

### Điểm mạnh
- Định vị sản phẩm rõ ràng, tách bạch "học concept từ WalletAdapter" vs "không copy trực tiếp".
- Checklist a11y (contrast 4.5:1 / 3:1, focus ring token-driven, icon label, màu không phải chỉ báo trạng thái duy nhất, toast polite live-region) đạt chuẩn fintech thật sự.
- Quy tắc layout ổn định (không nhảy khung khi chuyển view, reserve QR/identity/balance space) đúng trọng tâm.
- Đặt identity ở client, quirks trong adapter — đúng ranh giới kiến trúc.
- Phân pha thực tế, có validation gate mỗi pha.

### Điểm cần sửa trong đề xuất
1. **Mâu thuẫn danh sách `themeName`.** Đề xuất liệt kê `reown-light`, `reown-dark`, `xrpl-inspired` nhưng code (`themes.ts`) và `UI_UX_DECISIONS.md` lại dùng bộ khác (`energy`, `sun`, `graphite`, `neon`, `terminal`...). **Không tồn tại preset `reown-*`** dù Reown là chuẩn tuân thủ đã nêu. Cần thống nhất một nguồn sự thật cho preset và bổ sung đúng `reown-light`/`reown-dark`.
2. **Thiếu gap-analysis với modal hiện tại.** Đề xuất mô tả 5 view + 6 badge nhưng không ghi chú rằng modal hiện chưa có gì trong số đó. Nên thêm mục "trạng thái hiện tại → đích đến" để tránh hiểu nhầm là đã có.
3. **MetaMask lên Phase 1 là rủi ro tải trọng.** Đưa `@metamask/connect-tron` vào cùng lúc với việc dựng search + badges + view routing sẽ làm pha UI đầu tiên quá nặng. Đề xuất đã đánh dấu rủi ro audit — nên tách MetaMask ra sau khi modal Reown-style xong.
4. **Bundle-splitting cho IIFE nên là deliverable Phase 1, không phải "risk".** `CODER_NOTES` ghi rõ `trondomainjs` kéo theo `tronweb`, cộng WalletConnect làm IIFE rất lớn và đây là việc "urgent". Đề xuất mới xếp nó ở mục Risks.
5. **i18n bị bỏ trống.** Spec §12 và ghi chú ConnectKit yêu cầu "localization-ready copy", nhưng type UI hiện tại (`ConnectModalLabels`, `AccountPanelLabels`) chỉ nhận override tĩnh, không có lớp i18n/locale. Đề xuất nên nêu.
6. **Chỉ có QA thủ công cho contrast/a11y.** Với định vị fintech, nên thêm test contrast tự động (mọi preset × light/dark) vào quality gate, không chỉ checklist tay.
7. **Nguồn icon ví chưa có phương án cụ thể** (bundle vs CDN vs catalog registry + license) — mới nêu là rủi ro.

---

## 3. Review code — UI (khoảng cách lớn nhất)

### Modal (`packages/ui/src/modal.ts`)
- **Danh sách ví phẳng, một view duy nhất.** Không có: ô tìm kiếm, view `all-wallets`, màn `connecting` chi tiết (retry/install), view `qr`, badge (`INSTALLED`/`WALLETCONNECT`/`MULTICHAIN`/`COMING SOON`...). Chỉ có một pill `Ready/Connecting/Unavailable`. Đây là mức dưới xa mục tiêu Reown và thấp hơn cả độ chín của account panel.
- **Wiring trạng thái ví bị đứt (nghiêm trọng).** `mapAdapterToWalletOption` hardcode `available: true` và **không bao giờ set `readyState`**, dù adapter có `isAvailable()` và `manager.connect` đã dùng nó. Hệ quả: modal không thể hiển thị đúng "đã cài / chưa cài / không khả dụng". Cần gọi `isAvailable()` khi render và map sang `readyState`.
- **Thiếu quản lý focus/bàn phím** dù đề xuất yêu cầu: không có focus trap, không lắng nghe phím `Escape`, không trả focus khi đóng. CSS có `focus-visible` outline nhưng chưa đủ.
- **Click backdrop không đóng modal.** Handler chỉ đóng khi bấm nút close hoặc chọn ví. Reown đóng khi click nền — nên bổ sung (có xét dismissible).
- Không có `role="dialog"` scrim tách biệt cho phần lỗi (đã có `role="alert"` — tốt).

### Account panel (`account-panel.ts`) — nền tảng tốt
- Có address, copy (đổi nhãn Copy→Copied), QR slot ổn định, balance, disconnect, recent tx, `displayName`/`domain` sẵn cho `trondomainjs`. Đúng hướng.
- **Bug nhỏ balance fallback:** khi không có `balanceTrx`, `balance` fallback về `account.network?.nativeAsset` (= "TRX") rồi template thêm " TRX" → render **"TRX TRX"**. Nên fallback về `-` hoặc bỏ hậu tố khi đã là ký hiệu.
- Copy chưa có phản hồi cho screen reader (chỉ đổi text nhãn, nên thêm `aria-live`).

### Theme (`themes.ts`, `dom.ts`)
- Token-driven, portal-safe qua set biến inline lên `.twk-root` — đúng spec, đây là điểm mạnh.
- **Chưa có `reown-light`/`reown-dark`** — mâu thuẫn trực tiếp với tiêu chí "UI kit tuân thủ demo.reown.com". Light default accent `#2563eb`, dark `#38bdf8` gần Reown nhưng không phải bộ token Reown thật; nên thêm 2 preset riêng khớp surface/radius/accent của Reown.
- Dùng `color-mix()`, `dvh`, `env(safe-area)`, `backdrop-filter` không có `-webkit-` fallback → cần xác định sàn trình duyệt hỗ trợ (đặc biệt cho web legacy/CDN là đối tượng đã nêu).
- **Rủi ro contrast ở preset `glass`** (surface `rgba(255,255,255,.5)` + text `#172033` trên nền mờ) — chính đề xuất khuyến cáo tránh glass quá trong. Cần đo lại hoặc gắn cảnh báo.

---

## 4. Review code — core & adapter (mạnh, nhưng có drift)

### Điểm mạnh
- Contract adapter sạch, `capabilities` là object (không còn Set), event đầy đủ, `WalletStorage` trừu tượng, session envelope có `version`.
- `manager.connect` phát `connecting`→`connected`; `autoReconnect` phát `session_restored` **và** `connected` — đúng quy tắc spec §8.
- `submitTransaction` kiểm tra hash rỗng, chuẩn hóa lỗi.

### Vấn đề cần lưu ý
1. **Adapter TronLink không đăng ký event listener nào.** `ADAPTER_BEHAVIOR_NOTES.md` khẳng định "Listens for TIP-1193 `accountsChanged` and `chainChanged`", nhưng `src/index.ts` **không có** `addEventListener`/forward event. Hệ quả: `accountChanged`/`networkChanged` sẽ không bao giờ phát ra. Đây là **drift giữa doc và code** — cần sửa code hoặc đính chính doc.
2. **Vòng đời xác nhận giao dịch chưa có.** Spec §16 yêu cầu `tx_submitted → light confirmation → tx_confirmed/tx_failed/unknown`. `manager` có `updateTransaction()` nhưng **không có nơi nào gọi polling**; trạng thái `unknown` chưa xử lý. Đúng như ghi chú "future work", nhưng vẫn là thiếu so với spec.
3. **TronLink `submitTransaction` nhánh generic chỉ ký, không broadcast.** Với methodHint ≠ `transferTrx`, code `signTransaction` rồi đọc `txID` và trả `status: "submitted"` — nhưng **chưa broadcast** (`sendRawTransaction`). Trả "submitted" cho tx mới ký có thể sai lệch. Cần broadcast rồi mới coi là submitted.
4. WalletConnect adapter chưa review sâu ở đây; theo notes vẫn thiếu unit test — cần bổ sung trước release (upstream cũng thiếu test chỗ này).

---

## 5. Khuyến nghị ưu tiên (thứ tự thực thi)

1. **Nối `isAvailable()` → `readyState` trong modal** và render badge `INSTALLED/UNAVAILABLE` (fix wiring — rẻ, tác động lớn).
2. **Thêm preset `reown-light` / `reown-dark`** khớp token Reown; thống nhất danh sách `themeName` giữa đề xuất, `UI_UX_DECISIONS.md` và `themes.ts`.
3. **Bổ sung a11y modal:** focus trap + `Escape` + trả focus + click backdrop để đóng.
4. **Dựng view routing modal** (featured → all-wallets có search → connecting detail → qr) trên nền HTML helper hiện có, giữ khung kích thước ổn định.
5. **Sửa drift adapter:** TronLink đăng ký/emit `accountChanged`/`networkChanged`, hoặc đính chính `ADAPTER_BEHAVIOR_NOTES`.
6. **Fix bug balance "TRX TRX"** và thêm `aria-live` cho copy feedback.
7. **Broadcast thật trong `submitTransaction` generic**; thêm polling xác nhận + trạng thái `unknown`.
8. **Tách IIFE bundle** (identity/tronweb/walletconnect optional) trước public release; thêm test contrast tự động vào quality gate.

---

## 6. Đánh giá bản đề xuất — một câu

Đề xuất đáng để "approve có điều kiện": chấp nhận định hướng và checklist, nhưng bổ sung (a) preset Reown thật + thống nhất themeName, (b) mục gap-analysis so với modal hiện tại, (c) nâng bundle-split và i18n từ "risk" lên deliverable, trước khi bước vào pha UI.
