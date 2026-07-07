# Hướng dẫn & Checklist UI/UX Pro: Thiết kế Premium và Tránh AI Slop

Tài liệu này cung cấp kết quả Audit UI/UX hiện tại của **TRON Wallet Kit** và đưa ra checklist tiêu chuẩn thiết kế cao cấp (Premium/Pro) nhằm nâng cao trải nghiệm thị giác (Wow-factor) và tính mượt mà cho sản phẩm, đồng thời loại bỏ triệt để các vết sạn của mã nguồn và thiết kế sinh bởi AI đại trà (AI Slop).

---

## I. AI Slop trong UI/UX và Mã Nguồn là gì?

**AI Slop (Rác thải AI)** trong phát triển sản phẩm xuất hiện ở hai khía cạnh:

1. **AI Slop trong thiết kế (Design Slop):**
   - Sử dụng các màu sắc mặc định nhàm chán (như màu đỏ tươi `#ff0000`, lam chuẩn `#0000ff`).
   - Thiết kế phẳng dẹt, thiếu chiều sâu lớp (layering), thiếu đổ bóng tinh tế (shadows) và bo góc không cân đối.
   - Giao diện tĩnh lặng, phản hồi tương tác (hover, click) thô sơ hoặc không có micro-animations (hiệu ứng nhỏ tăng tương tác).
   - Bố cục rung giật, kích thước khung thay đổi đột ngột khi chuyển trạng thái (Layout Shift).

2. **AI Slop trong mã nguồn (Code Slop):**
   - Viết CSS lặp đi lặp lại thay vì tối ưu hóa hệ thống Token trung tâm.
   - Comment vô nghĩa, chỉ lặp lại tên hàm hoặc mô tả những dòng code hiển nhiên (ví dụ: `// Set padding to 12px` đặt ngay trên `padding: 12px;`).
   - Tạo ra các file cấu trúc lớn chồng chéo, các helper rời rạc không dùng lại được.
   - Thiếu các bài test kiểm thử tự động, đặc biệt là kiểm thử khả năng tiếp cận và độ tương phản màu sắc.

---

## II. Kết quả Audit UI/UX hiện tại của TronWalletKit

### 1. Hệ thống Preset & Màu sắc (Color & Theming)
- **Ưu điểm:** Hệ thống đã tách biệt Token thành công và mount biến CSS lên `.twk-root` an toàn cho portal. Có 17 preset đa dạng.
- **Nhược điểm cần sửa (Slop Audit):**
  - Một số preset có màu nền và màu viền quá gần nhau (ví dụ: `light` sử dụng nền `#ffffff` và viền `#ececec` tạo ra sự phân tách viền khá mờ nhạt trên màn hình độ sáng cao).
  - Preset `glass` (thủy tinh mờ) cần được kiểm tra kỹ về độ tương phản văn bản để đạt chuẩn WCAG AA (đặc biệt khi hiển thị trên các ứng dụng nền sáng/nền tối đan xen).
  - Tông màu đỏ của TRON trong preset `tron` (`#ef4444`) hơi chói, cần đổi sang màu đỏ sâu, dịu mắt hơn mang lại cảm giác tài chính cao cấp (ví dụ: `#e52424` hoặc `#ec1a2b`).

### 2. Trải nghiệm chuyển cảnh & Micro-animations
- **Ưu điểm:** Skeleton loading hoạt động tốt trên QR code và các vị trí thông tin cá nhân. Đã có vòng quay connecting spinner thông minh.
- **Nhược điểm cần sửa (Slop Audit):**
  - Việc chuyển màn hình từ `featured` (ví dụ nổi bật) sang `all-wallets` (tất cả ví) diễn ra tức thời (instant cut). Điều này tạo cảm giác đứt gãy thị giác.
  - Vòng kết nối của ví đang chạy mượt nhưng thiếu hiệu ứng scale nhẹ khi kết nối thành công hoặc rung lắc nhẹ (shake) khi bị người dùng từ chối (User Rejected).
  - Nút bấm action (`.twk-action`) khi hover chỉ đổi màu nền đơn giản, chưa có hiệu ứng dịch chuyển nhẹ của icon hoặc thay đổi độ bóng.

### 3. Kiểu chữ & Căn chỉnh (Typography & Spacing)
- **Ưu điểm:** Đã sửa lỗi descender clipping (cắt chữ đối với chữ có nét dưới như `g`, `y`).
- **Nhược điểm cần sửa (Slop Audit):**
  - Font chữ đang kế thừa trực tiếp font hệ thống (system-ui). Cần cung cấp cấu hình rõ ràng hơn để host app có thể tự tải và áp dụng các font chữ hình học cao cấp như `Inter`, `Plus Jakarta Sans` hoặc `Outfit`.
  - Khoảng cách giữa các phần trong Connect Modal đôi khi hơi sát (chặt chẽ theo kiểu Reown), dẫn đến việc đọc thông tin bị ngột ngạt trên thiết bị di động.

---

## III. Checklist Thiết kế Theme UI/UX Pro & Premium

Dưới đây là checklist từng bước giúp lập trình viên và thiết kế nâng cấp TronWalletKit lên tiêu chuẩn Premium.

### ⬚ 1. Tối ưu hóa Chiều sâu & Lớp (Layering & Visual Depth)
- [ ] **Hiệu ứng Thủy tinh (Glassmorphism):** Áp dụng `backdrop-filter: blur(16px)` kết hợp với viền trắng bán trong suốt `rgba(255, 255, 255, 0.08)` cho các lớp overlay/modal để tạo sự hòa trộn cao cấp.
- [ ] **Đổ bóng đa lớp (Multi-layered Shadows):** Sử dụng ít nhất 2 tầng đổ bóng cho modal:
  ```css
  box-shadow: 
    0 4px 12px color-mix(in srgb, var(--twk-text) 5%, transparent),
    0 24px 64px color-mix(in srgb, var(--twk-text) 15%, transparent);
  ```
- [ ] **Bo góc nhất quán:** Đảm bảo tỷ lệ bo góc modal (`--twk-radius`) và bo góc thẻ con (`--twk-wallet-radius`) luôn tuân theo tỷ lệ vàng (thường là góc ngoài lớn hơn góc trong từ 4px - 6px để tạo sự đồng tâm thị giác).

### ⬚ 2. Thiết kế Chuyển động Mượt mà (Fluid Motion & Transitions)
- [ ] **Đường cong chuyển động chuyên nghiệp (Easing):** Tuyệt đối không dùng chuyển động tuyến tính (`linear`) hoặc `ease-in-out` mặc định của trình duyệt. Hãy dùng hàm Bezier tùy chỉnh cho cảm giác mượt và có lực đàn hồi:
  ```css
  transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1); /* Out-Quart curve */
  ```
- [ ] **Chuyển cảnh Modal (View Routing Transitions):** Thêm hiệu ứng trượt và mờ dần khi chuyển view bên trong modal:
  - Khi vào màn QR: Trượt từ dưới lên hoặc từ phải sang trái 8px kết hợp với opacity tăng dần từ 0 lên 1.
- [ ] **Phản hồi tương tác (Micro-feedbacks):**
  - **Nút bấm:** Khi nhấn chuột xuống (`:active`), áp dụng `transform: scale(0.97)` để tạo cảm giác bấm vật lý thật.
  - **Sao chép địa chỉ:** Nút copy icon hiển thị dấu check màu xanh lá có hiệu ứng xoay nhẹ 15 độ và phóng to thu nhỏ (pop/scale) trong 150ms.

### ⬚ 3. Trải nghiệm Tương tác Tinh tế (UX Refinements)
- [ ] **Custom Scrollbar cao cấp:** Thay vì thanh cuộn mặc định của hệ điều hành, hãy tùy biến thanh cuộn mỏng, tinh tế trong All-Wallets grid:
  ```css
  .twk-wallet-grid::-webkit-scrollbar { width: 5px; }
  .twk-wallet-grid::-webkit-scrollbar-thumb { 
    background: var(--twk-border); 
    border-radius: 99px; 
  }
  ```
- [ ] **Tương tác Scrim & Backdrop:** Hỗ trợ click vào vùng trống (scrim) bên ngoài để đóng modal với hiệu ứng thu nhỏ modal nhẹ (`scale(1) -> scale(0.95)`) cùng lúc với hiệu ứng mờ dần của lớp phủ.
- [ ] **Mobile Touch Optimization:** Hỗ trợ vùng chạm (touch target) tối thiểu 44px x 44px trên thiết bị di động, tắt hoàn toàn màu xanh mặc định khi tap bằng `-webkit-tap-highlight-color: transparent`.

### ⬚ 4. Phòng tránh AI Slop trong Mã nguồn CSS
- [ ] **Không sử dụng mã màu thô (Hardcoded Hex/RGB):** Mọi màu sắc trong giao diện phải đi qua hệ thống CSS Variables (`var(--twk-*)`). Điều này cho phép thay đổi giao diện theo thời gian thực mà không làm vỡ các preset.
- [ ] **Tránh lặp lại thuộc tính (Dry CSS):** Gom nhóm các thuộc tính dùng chung cho control (như `appearance: none`, `outline: none`, `user-select: none`) vào các class gốc tiện ích thay vì khai báo lại trong từng class nút bấm.
- [ ] **Viết Test tự động cho độ tương phản (A11y/Contrast Tests):** Tiếp tục duy trì và mở rộng bài test kiểm tra tỷ lệ tương phản WCAG AA (> 4.5:1 cho text nhỏ, > 3.0:1 cho text lớn) trên mọi theme preset mới được cập nhật.

---

## IV. Đề xuất Tối ưu hóa Thẩm mỹ cho các Preset Hiện tại

Dưới đây là một số tinh chỉnh cụ thể giúp nâng cấp hệ thống preset trong [themes.ts](file:///c:/Users/PC/OneDrive/Develop/VibeCode/TronWalletKit/packages/ui/src/themes.ts) lên mức tối đa:

| Preset Name | Hiện trạng | Đề xuất tối ưu hóa thẩm mỹ |
| --- | --- | --- |
| **`light`** | Nền `#ffffff`, Viền `#ececec`, Accent `#0988f0` | Tăng tương phản viền bằng cách đổi màu viền sang `#e4e4e7` (tông xám kẽm trung tính). Đổi màu accent sang xanh dương hoàng gia sâu sắc hơn như `#1068eb` hoặc `#0f62fe`. |
| **`dark`** | Nền `#141414`, Viền `#272727`, Accent `#38bdf8` | Thay đổi màu nền sang đen sâu sapphire dải rộng như `#0a0b0d` kết hợp đổ bóng mờ ảo tông xanh tím đen để tạo cảm giác không gian vũ trụ. |
| **`tron`** | Nền `#151515`, Accent đỏ `#ef4444` | Đổi màu accent đỏ sang `#ec1a2b` (màu đỏ thương hiệu chính thức của TRON). Thêm viền phát sáng mờ màu đỏ nhạt khi focus. |
| **`tron-energy`** | Nền `#071b17`, Accent xanh `#00e5a8` | Đổi màu nền xanh đậm hơn hoặc chuyển dần sang gradient xanh đen mờ để tạo cảm giác năng lượng cuồn cuộn. |
| **`glass`** | Viền mờ nhạt | Đặt `backdrop-filter: blur(20px)` và viền sáng hơn để nổi bật trên mọi nền ứng dụng, tăng độ mờ của scrim để text bên trong luôn nổi bật đạt tỉ lệ tương phản tối thiểu. |

---

## V. Kế hoạch Hành động (Action Plan) cho Đợt Review Tiếp theo

1. **Bước 1 (Lập trình):** Cải thiện hiệu ứng chuyển cảnh (CSS transition) khi chuyển giữa màn hình chọn ví và màn hình QR/Connecting.
2. **Bước 2 (Kiểm định):** Chạy công cụ kiểm thử contrast tự động và chụp lại bộ screenshots trên các ví dụ thực tế.
3. **Bước 3 (Đóng gói):** Tinh chỉnh các tham số trong `themes.ts` theo đề xuất tối ưu hóa ở Mục IV.
