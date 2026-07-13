# Tiêu Chuẩn Thiết Kế Loading System Cho Wallet Kit (Wallet Kit Loading System Standard)
*Bản đặc tả kỹ thuật và tiêu chuẩn thiết kế hiệu ứng bộ khung xương (Skeleton) & quét sáng (Shimmer) dùng chung cho các phiên bản và hệ sinh thái blockchain của Wallet Kit.*

Tiêu chuẩn này định nghĩa cấu trúc **Loading System** tổng quát cho **Wallet Kit**, tách biệt hoàn toàn khỏi các đặc tính riêng biệt của bất kỳ blockchain đơn lẻ nào (như XRPL, EVM hay TRON). Tiêu chuẩn này thiết lập một tập hợp các thành phần nguyên bản (Skeleton Primitives) có khả năng tái sử dụng cao để các lập trình viên tích hợp các bộ adapter ví mới có thể dễ dàng tuân thủ, mang lại trải nghiệm người dùng nhất quán và chuyên nghiệp (Pro UI/UX).

---

## 1. Các Lớp Primitive của Loading System (Common Skeleton Primitives)

Mọi giao diện hiển thị trạng thái tải trong Wallet Kit đều phải được ghép nối từ các lớp CSS nguyên bản dưới đây. Tiền tố `xwk-` đại diện cho namespace chung của **Wallet Kit**:

*   `.xwk-skeleton`: Lớp cơ sở chứa hiệu ứng quét sáng (Shimmering Wave Animation) sử dụng tăng tốc phần cứng (GPU-accelerated `background-position`).
*   `.xwk-skeleton-circle`: Khung xương dạng tròn (Dùng cho ảnh đại diện Avatar, Logo ví, Status Dot).
*   `.xwk-skeleton-line`: Khung xương dạng đường chữ nhật bo góc nhẹ (Dùng cho các dòng văn bản đơn lẻ như Web3 Domain, Tên ví).
*   `.xwk-skeleton-pill`: Khung xương dạng viên thuốc (Dùng cho Badge trạng thái, Chip địa chỉ, Số dư tài khoản).
*   `.xwk-skeleton-card`: Khung xương dạng hộp lớn (Dùng cho khung chứa mã QR hoặc khung Panel phụ).
*   `.xwk-skeleton-button`: Khung xương dạng nút bấm (Dùng cho các nút hành động).
*   `.xwk-skeleton-row`: Khung xương dạng dòng cấu trúc (Dùng cho Wallet list row, Transaction history row).
*   `.xwk-skeleton-qr`: Khung xương dạng ma trận mã QR (Dùng cho vùng hiển thị QR).
*   `.xwk-connection-bridge`: Cầu nối hoạt họa chấm chạy liên tục (Dùng cho connecting status giữa dApp node và Wallet node).

```css
/* --- BẢN VẼ CSS TIÊU CHUẨN CHO PRIMITIVES --- */

/* 1. Base Shimmer */
.xwk-skeleton {
  background: linear-gradient(
    90deg,
    var(--xwk-surface) 25%,
    var(--xwk-surface-hover) 50%,
    var(--xwk-surface) 75%
  );
  background-size: 200% 100%;
  animation: xwk-shimmer-pulse 1.6s infinite linear;
  border-radius: 4px;
  display: inline-block;
}

@keyframes xwk-shimmer-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 2. Shape Primitives */
.xwk-skeleton-circle {
  border-radius: 999px;
  flex-shrink: 0;
}
.xwk-skeleton-line {
  height: 14px;
  border-radius: 4px;
}
.xwk-skeleton-pill {
  border-radius: 999px;
}
.xwk-skeleton-button {
  border-radius: var(--xwk-wallet-radius);
}
.xwk-skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.xwk-skeleton-qr {
  border-radius: 12px;
  box-sizing: border-box;
}

@media (prefers-reduced-motion: reduce) {
  .xwk-skeleton {
    animation: none !important;
    background: var(--xwk-surface-hover) !important;
  }
}
```

---

## 2. Bản Đồ Áp Dụng Primitives Cho 6 Vùng Chức Năng Hiện Tại (Existing Zones)

### 📌 Zone 1: Nút kết nối ví (Wallet Button - Recovery/Resolving State)
*   **Map Primitive:** `circle` + `line` + `pill`
*   **Đặc tả:** Trong pha phục hồi session tự động khi tải lại trang, nút bấm hiển thị trạng thái tải bằng cách sử dụng vòng tròn `.xwk-skeleton-circle` (`28x28px`) đại diện cho icon ví và một vệt `.xwk-skeleton-pill` (`44x12px` đại diện cho balance) hoặc `.xwk-skeleton-line` (`80x14px` đại diện cho địa chỉ ví). Biểu tượng mũi tên chevron bị ẩn đi.

### 📌 Zone 2: Danh sách ví trong Modal (Wallet Picker List - Extensions Check Phase)
*   **Map Primitive:** `row` + `pill`
*   **Đặc tả:** Khi modal mở và hệ thống đang phát hiện các ví tiện ích khả dụng bất đồng bộ, các badge trạng thái (như "Installed") được biểu thị bằng khung xương dạng viên thuốc `.xwk-skeleton-pill` rộng `54px`, cao `20px` để giữ vị trí tĩnh, tránh làm co giãn danh sách. Khi kiểm tra xong, badge thật sẽ hiện ra bằng hiệu ứng fade transition `0.2s`.

### 📌 Zone 3: Màn hình quét mã QR (QR Code Screen - URI Fetching Phase)
*   **Map Primitive:** `qr` + `line` + `button`
*   **Đặc tả:** Khi đang chờ lấy chuỗi kết nối (URI) để dựng mã QR, hiển thị khung xương ma trận `.xwk-skeleton-qr`.
    *   **Hiệu ứng quét laser (Laser Scanline):** Chèn một vệt laser chạy dọc (.xwk-qr-scanline) di chuyển liên tục từ trên xuống dưới trên khối QR skeleton:
      ```css
      .xwk-qr-scanline {
        position: absolute;
        height: 3px;
        width: 100%;
        background: linear-gradient(90deg, transparent, var(--xwk-accent), transparent);
        animation: xwk-laser-sweep 2s infinite ease-in-out;
      }
      ```
    *   Hiển thị `.xwk-skeleton-line` cho phần hiển thị chip địa chỉ ví và `.xwk-skeleton-button` cho nút sao chép (Copy) phía dưới.

### 📌 Zone 4: Màn hình chờ kết nối ví (Loading Connection State)
*   **Map Primitive:** `circle` + `connection-bridge`
*   **Đặc tả:** Biểu thị luồng truyền tải kết nối giữa dApp và Ví bằng 2 vòng tròn `.xwk-skeleton-circle` đại diện cho hai node và cầu nối chấm chạy liên tục `.xwk-connection-bridge` ở giữa.
    *   **Xử lý phòng vệ thiếu Logo dApp:** Khi dApp không cấu hình logo hoặc tải ảnh lỗi, áp dụng 3 mức fallback:
        1.  *Favicon Auto-resolution:* Thử nạp favicon của website qua `window.location.origin + "/favicon.ico"`.
        2.  *Initial Text Fallback:* Hiển thị chữ cái đầu tiên của `appName` (viết hoa) trên nền gradient của màu accent.
        3.  *Default Web Globe Icon:* Sử dụng SVG quả địa cầu Web3 tiêu chuẩn:
            ```html
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            ```

### 📌 Zone 5: Khung hình đại diện (Account Panel Avatar - Resolving Phase)
*   **Map Primitive:** `circle`
*   **Đặc tả:** Trong lúc dApp đang gọi API phân giải ảnh đại diện NFT/Web3 Profile của tài khoản, phần tử chứa ảnh đại diện phải hiển thị vòng tròn `.xwk-skeleton-circle` khít 100%.

### 📌 Zone 6: Danh sách lịch sử giao dịch (Recent Transactions - Fetching State)
*   **Map Primitive:** `row` + `circle` + `line`
*   **Đặc tả:** Khi đang tải danh sách lịch sử giao dịch từ blockchain/ledger, hiển thị tạm thời 3 dòng `.xwk-skeleton-row` nhấp nháy đồng bộ, mỗi dòng chứa một `.xwk-skeleton-circle` (`24x24px` cho trạng thái icon) và hai `.xwk-skeleton-line` mô phỏng mô tả và hash giao dịch.

---

## 3. Các Vùng Dự Phòng Cho Mở Rộng Hệ Sinh Thái (Reserved Expansion Zones)

Để đảm bảo tiêu chuẩn này có thể mở rộng cho mọi phiên bản Wallet Kit (ví dụ như tích hợp EVM Smart Contracts hay các chuỗi khác), hai vùng chức năng dự phòng sau được định nghĩa sẵn:

### 📌 Zone 7 (Reserved): Xem Trước & Phê Duyệt Giao Dịch (Transaction Preview / Confirmation)
*   **Kịch bản áp dụng:** Khi người dùng chuẩn bị ký các giao dịch chuyển token, tương tác hợp đồng thông minh (Smart Contract), cấp quyền token (Token Approvals), hoặc tạo NFT. dApp cần hiển thị thông số trước khi mở ví.
*   **Map Primitive:** `card` + `row` + `line`
*   **Checklist Thiết kế:**
    - [ ] **Transaction Card Skeleton:** Dựng một khung `.xwk-skeleton-card` đại diện cho khu vực hiển thị số tiền chính và loại giao dịch.
    - [ ] **Metadata Rows:** Phía dưới hiển thị 3 dòng `.xwk-skeleton-row` chứa các `.xwk-skeleton-line` để giữ chỗ cho các thông tin:
      * *Tài khoản nhận / Tương tác (Destination / Contract)*
      * *Phí mạng lưới ước tính (Estimated Gas / Network Fee)*
      * *Dữ liệu đính kèm (Memo / Payload Data)*
      * *Nguồn ví thực thi (Execution Wallet)*

### 📌 Zone 8 (Reserved): Phân Giải Đăng Ký Định Danh (Identity / Profile Resolution)
*   **Kịch bản áp dụng:** Khi tài khoản đã kết nối và hệ thống đang chạy song song các API để phân giải hồ sơ Web3 nâng cao (Web3 Domains, ENS, email liên kết, verified badge, và metadata của tài khoản).
*   **Map Primitive:** `circle` + `line` + `pill`
*   **Checklist Thiết kế:**
    - [ ] **Verified Status Placeholder:** Hiển thị một vệt `.xwk-skeleton-pill` nhỏ cạnh tên tài khoản đại diện cho các biểu tượng verified hoặc trạng thái tên miền.
    - [ ] **Metadata lines:** Hiển thị 2 vệt `.xwk-skeleton-line` có chiều rộng so le đại diện cho các dòng mô tả hồ sơ liên kết (Twitter handle, email) giúp bố cục cân bằng tự nhiên trong khi tải dữ liệu.
