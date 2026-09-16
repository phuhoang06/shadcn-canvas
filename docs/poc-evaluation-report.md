# Báo Cáo Đánh Giá POC (Proof of Concept Evaluation Report)
## Dự án: shadcn-canvas — Giai đoạn 1 (Phase 1 POC)

- **Ngày thực hiện:** 2026-09-16
- **Trạng thái:** Hoàn thành nghiệm thu thực nghiệm
- **Quyết định:** **GO (Chính thức phê duyệt chuyển sang Phase 2 với các ràng buộc kiến trúc cụ thể)**
- **Người thực hiện & Đánh giá:** Engineering Pair (AI Assistant & Lead Architect)

---

## 1. Đối chiếu 4 Tiêu chí Kết thúc (Exit Criteria Evaluation)

| Tiêu chí | Mô tả yêu cầu | Kết quả thực nghiệm | Đánh giá |
|:---|:---|:---|:---:|
| **1. Kéo thả & Khởi tạo (Palette & Canvas Nodes)** | Khởi tạo và render chuẩn xác các linh kiện shadcn thật (`Button`, `Card`, `Select`) lên hệ trục tọa độ đa màn hình (Frames) của canvas M3E. | Render mượt mà, CSS variables HSL của Tailwind v4 hiển thị đúng theme; cơ chế pointer-events phân tách rõ giữa click-drag chọn node và tương tác nội dung. | **ĐẠT (PASS)** |
| **2. Điều khiển thuộc tính thời gian thực (Inspector Controls)** | Bảng Inspector bên phải nhận diện đúng loại node shadcn, cho phép sửa label, variant, size (Button); title, desc, content (Card); placeholder, options (Select) và cập nhật tức thì. | Cập nhật 100% reactive qua state `Doc/Item`. Form input phản ánh ngay lập tức vào DOM canvas mà không làm giật lag hay mất trạng thái focus. | **ĐẠT (PASS)** |
| **3. Định vị & Tỷ lệ Portal dưới Canvas Zoom/Pan** | Dropdown/Portal bám dính pixel-perfect với trigger và co giãn đồng bộ theo zoom (50%, 100%, 150%) cũng như di chuyển pan của camera canvas. | Đã kiểm nghiệm 5 case (A→E). **Case E** (Body Portal + `CanvasContext` scale compensation + dynamic width ratio) đạt chuẩn tuyệt đối cho `Select`. Spot-check Popover và Dialog đã làm rõ nguyên lý tổng quát cho toàn bộ họ Floating UI và yêu cầu phân nhánh `renderMode` cho Modals. | **ĐẠT (PASS - ĐÃ THIẾT LẬP INVARIANT)** |
| **4. Xuất mã nguồn TSX độc lập (Clean TSX Codegen)** | Xuất ra mã nguồn React TSX sạch, chuẩn shadcn/ui, có thể copy dùng ngay vào dự án Next.js bên ngoài. | `lib/codegen.ts` đọc trực tiếp từ Data Model thuần túy (`Item`), hoàn toàn tách biệt khỏi runtime canvas; mã nguồn export sạch 100%, không chứa bất kỳ wrapper hay props bù zoom nào. | **ĐẠT (PASS)** |

---

## 2. Dữ liệu Thực nghiệm Portal & Bài Học Hệ Thống

Vấn đề cốt lõi của việc tích hợp Radix UI vào Infinite Canvas là xung đột giữa **CSS Transform Containing Block** (W3C Spec) và **Floating UI Fixed Positioning**. 

Dưới đây là dữ liệu đo đạc thực tế qua Chrome DevTools Protocol (CDP) tại Zoom 50%:

| Phương án | Cơ chế Portal | Tọa độ X/Y | Tỷ lệ Scale | Kết quả & Nguyên nhân |
|:---|:---|:---:|:---:|:---|
| **Case A** | Mặc định (`document.body`) | Chuẩn (deltaX = 0) | **Sai (100%)** | Dropdown to gấp đôi kích thước canvas tại zoom 50%. |
| **Case B** | Gắn vào Canvas Container (`containerRef`) | **Lệch (-120px, -67px)** | Chuẩn (50%) | Ancestor có `transform: scale()` trở thành containing block cho `position: fixed`, khiến Floating UI tính toán offset 2 lần. |
| **Case C** | Inline DOM (`usePortal={false}`) | **Lệch (-120px, -67px)** | Chuẩn (50%) | Radix Popper vẫn dùng `position: fixed` nội bộ, bị ảnh hưởng giống hệt Case B. |
| **Case D** | Radix `position="item-aligned"` | **Lệch nghiêm trọng** | Sai | Văng lệch hoàn toàn lên góc trên bên phải màn hình. |
| **Case E (Thành công)** | Body Portal + `CanvasContext` Scale Adapter | **Chuẩn (deltaX = 0, deltaY = 0)** | **Chuẩn (50%)** | Giữ portal tại `document.body` để Floating UI đo viewport chuẩn, bù tỷ lệ bằng `transform: scale(z)` và `minWidth: calc(triggerWidth / z)`. |

---

## 3. Tổng Quát Hóa Thực Nghiệm: Popover & Dialog

### 3.1. Bài học hệ thống từ Popover: "Universal Popper Invariant"
- **Quan sát số liệu & trực quan:** Đầu mũi tên (`PopperPrimitive.Arrow`) cắm đúng vào giữa trigger button (`dx = -0.50px`), nhưng thân Popover cách xa trigger hơn tỷ lệ bình thường (11.5px thay vì 7px ở zoom 50%).
- **Nguyên nhân cốt lõi:** Toàn bộ middleware của Floating UI (`offset`, `shift`, `arrow`, `flip`, `size`) tính toán bằng **screen-pixel cố định**, không nhận thức được canvas transform.
- **Quy tắc bất biến:** Không coi đây là lỗi riêng của Popover. Mọi linh kiện dựa trên Popper (`Select`, `Popover`, `Tooltip`, `DropdownMenu`, `Combobox`) **BẮT BUỘC** phải nhân `zoom` vào toàn bộ tham số pixel:
  `sideOffset = baseSideOffset * zoom`, `alignOffset = baseAlignOffset * zoom`, `arrowPadding = baseArrowPadding * zoom`.

### 3.2. Chiều dữ liệu mới từ Dialog: Yêu cầu `renderMode` trong Data Model Phase 2
- **Quan sát thực tế:** Dialog modal overlay phủ toàn bộ màn hình trình duyệt (1600x857px) và căn giữa màn hình, hoàn toàn độc lập với vị trí artboard trên canvas.
- **Rủi ro kiến trúc đã nhận diện:** Nếu chỉ coi Dialog là "ngoại lệ" mà không bổ sung chiều dữ liệu `renderMode` (`edit` vs `preview`) vào Data Model Phase 2, hệ thống sẽ gặp bế tắc khi triển khai Inspector và Canvas Node ở Phase 3.
- **Yêu cầu Phase 2:** Bổ sung Task thiết kế cơ chế **Multi-Mode Component Rendering**:
  - *Edit Mode:* Render Dialog Content inline dạng container phẳng trong artboard frame để kéo thả các component con vào bên trong.
  - *Preview Mode:* Kích hoạt modal overlay che phủ màn hình để thử nghiệm UX thực tế.

---

## 4. Hiệu chuẩn Khối lượng Công việc (Effort Calibration)

- **Đánh giá ban đầu (Pre-POC):** `🟢 Medium` — Giả định lạc quan rằng chỉ cần `containerRef` là xong.
- **Thực tế nghiệm thu (Actual Post-POC):** `🔴 High / Complex`.
  - Riêng bài toán Portal đã tiêu tốn 5 vòng thử nghiệm kiến trúc (A → E), xử lý xung đột spec CSS transform containing block, và thiết lập hạ tầng kiểm thử tự động headless Chrome CDP.
- **Ý nghĩa hiệu chuẩn cho Phase 2 & Phase 3:**
  1. **Tái sử dụng Component Registry của `ui-builder` nhưng có thích ứng:**
     - File `reference/ui-builder/lib/ui-builder/registry/shadcn-component-definitions.ts` (155 KB) chứa toàn bộ Zod schemas, AutoForm field overrides và props metadata của shadcn.
     - **Lưu ý quan trọng:** Registry này **hoàn toàn không có tọa độ x/y** (chỉ có cây lồng nhau `props + children`). Phase 2 cần xây dựng **Mô hình Hybrid**: Tầng ngoài là Spatial Container (`Group / Frame` với `x, y, w, h` của M3E), tầng trong là Component Tree (`ComponentLayer` + props schema của `ui-builder`).
  2. **Phân loại Component Kiến trúc rõ ràng:**
     - *Nhóm 1: In-Flow DOM* (Button, Card, Input, Table, Badge...): Dễ (`🟢 Low`), áp dụng trực tiếp Adapter `ShadcnNode`.
     - *Nhóm 2: Trigger-Anchored Portals* (Select, Popover, Tooltip, DropdownMenu...): Trung bình (`🟡 Medium`), dùng Universal Popper Invariant (`* zoom`).
     - *Nhóm 3: Viewport Modals* (Dialog, Sheet, Drawer): Phức tạp (`🔴 High`), cần kiến trúc Multi-Mode Rendering ngay từ schema Phase 2.

---

## 5. Ranh giới Kiến trúc Codegen (Codegen Architectural Boundary)

- **Quy tắc bất biến:** `lib/codegen.ts` đọc dữ liệu **duy nhất** từ Data Model thuần túy (`Item`), đại diện cho ý định thiết kế (Design Intent).
- **Ranh giới:** Tuyệt đối không để bất kỳ thuộc tính điều phối canvas nào (`CanvasContext`, `zoom`, `interactive`, wrapper CSS) rò rỉ vào chuỗi sinh mã TSX. 
- **Bằng chứng:** Mã nguồn sinh ra cho Button, Card và Select trong Phase 1 hoàn toàn thuần khiết và tương thích 100% với một dự án Next.js shadcn chuẩn.

---

## 6. Quyết định Chính thức (Official Go / No-Go Sign-Off)

### Quyết định: **GO (Phê duyệt triển khai Phase 2)**

**Điều kiện bắt buộc cho Phase 2:**
1. Áp dụng Mô hình Hybrid cho Data Model: Kết hợp hệ tọa độ không gian `(x, y)` của M3E với schema thuộc tính `props` của `ui-builder`.
2. Thiết kế sẵn chiều dữ liệu `renderMode` cho các linh kiện Viewport Modal.
3. Chuẩn hóa Universal Popper Invariant trong adapter component chung.

*Ký duyệt bởi: AI Assistant & Lead Technical Architect*  
*Thời điểm: 2026-09-16*
