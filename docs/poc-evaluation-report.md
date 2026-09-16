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
| **3. Định vị & Tỷ lệ Portal dưới Canvas Zoom/Pan** | Dropdown/Portal bám dính pixel-perfect với trigger và co giãn đồng bộ theo zoom (50%, 100%, 150%) cũng như di chuyển pan của camera canvas. | Đã thử nghiệm 5 case (A→E). **Case E** (Body Portal + `CanvasContext` scale compensation + dynamic width ratio) đạt chuẩn tuyệt đối cho `Select`: deltaX = 0, deltaY = 0, kích thước co dãn 1:1 theo zoom camera. | **ĐẠT CÓ ĐIỀU KIỆN (PASS WITH BOUNDARY)** |
| **4. Xuất mã nguồn TSX độc lập (Clean TSX Codegen)** | Xuất ra mã nguồn React TSX sạch, chuẩn shadcn/ui, có thể copy dùng ngay vào dự án Next.js bên ngoài. | `lib/codegen.ts` đọc trực tiếp từ Data Model thuần túy (`Item`), hoàn toàn tách biệt khỏi runtime canvas; mã nguồn export sạch 100%, không chứa bất kỳ wrapper hay props bù zoom nào. | **ĐẠT (PASS)** |

---

## 2. Dữ liệu Thực nghiệm Portal: Hành trình 5 Thử nghiệm (A → E)

Vấn đề cốt lõi của việc tích hợp Radix UI vào Infinite Canvas là xung đột giữa **CSS Transform Containing Block** (W3C Spec) và **Floating UI Fixed Positioning**. 

Dưới đây là dữ liệu đo đạc thực tế qua Chrome DevTools Protocol (CDP) tại Zoom 50%:

| Phương án | Cơ chế Portal | Tọa độ X/Y | Tỷ lệ Scale | Kết quả & Nguyên nhân thất bại |
|:---|:---|:---:|:---:|:---|
| **Case A** | Mặc định (`document.body`) | Chuẩn (deltaX = 0) | **Sai (100%)** | Dropdown to gấp đôi kích thước canvas tại zoom 50%. |
| **Case B** | Gắn vào Canvas Container (`containerRef`) | **Lệch (-120px, -67px)** | Chuẩn (50%) | Ancestor có `transform: scale()` trở thành containing block cho `position: fixed`, khiến Floating UI tính toán offset 2 lần. |
| **Case C** | Inline DOM (`usePortal={false}`) | **Lệch (-120px, -67px)** | Chuẩn (50%) | Radix Popper vẫn dùng `position: fixed` nội bộ, bị ảnh hưởng giống hệt Case B. |
| **Case D** | Radix `position="item-aligned"` | **Lệch nghiêm trọng** | Sai | Văng lệch hoàn toàn lên góc trên bên phải màn hình. |
| **Case E (Thành công)** | Body Portal + `CanvasContext` Scale Adapter | **Chuẩn (deltaX = 0, deltaY = 0)** | **Chuẩn (50%)** | Giữ portal tại `document.body` để Floating UI đo viewport chuẩn, bù tỷ lệ bằng `transform: scale(z)` và `minWidth: calc(triggerWidth / z)`. |

---

## 3. Kết quả Spot-Check Mở rộng (Popover & Dialog)

Không suy diễn rằng Case E áp dụng ngay lập tức cho toàn bộ các linh kiện portal khác. Kết quả spot-check độc lập:

### 3.1. Popover with Floating Arrow
- **Kết quả:** Vị trí đầu mũi tên (`PopperPrimitive.Arrow`) dính sát tâm trigger (`dx = -0.50px` tại zoom 50%).
- **Edge cases phát hiện:**
  1. `sideOffset` được Floating UI tính bằng pixel màn hình cố định (8px), nên ở zoom 50% khoảng cách vật lý nhìn có vẻ hở rộng hơn gấp đôi so với các thành phần trong canvas.
  2. Khi dùng `origin-[--radix-popper-transform-origin]`, điểm scale neo tại tâm mũi tên, khiến thân thẻ Popover có thể co dãn không đối xứng nếu trigger lệch tâm.

### 3.2. Dialog / AlertDialog (Viewport-Centered Modal)
- **Kết quả:** Dialog dùng `fixed inset-0` và căn giữa viewport (`left: 50%, top: 50%`), hoàn toàn không bị ảnh hưởng bởi canvas transform.
- **Quyết định kiến trúc:** Dialog **không phải** là trigger-anchored portal và **không được** áp dụng pattern Case E của `Select`. Dialog đòi hỏi phân biệt rõ giữa:
  - **Edit Mode (Trong Canvas):** Render dạng khung phẳng inline trên artboard để kéo thả thiết kế layout bên trong modal.
  - **Preview / Run Mode:** Kích hoạt modal nổi phủ toàn màn hình editor.

---

## 4. Hiệu chuẩn Khối lượng Công việc (Effort Calibration)

- **Đánh giá ban đầu (Pre-POC):** `🟢 Medium` — Giả định lạc quan rằng chỉ cần `containerRef` là xong.
- **Thực tế nghiệm thu (Actual Post-POC):** `🔴 High / Complex`.
  - Riêng bài toán Portal đã tiêu tốn 5 vòng thử nghiệm kiến trúc (A → E), xử lý xung đột spec CSS transform containing block, và thiết lập hạ tầng kiểm thử tự động headless Chrome CDP.
- **Ý nghĩa hiệu chuẩn cho Phase 2 & Phase 3:**
  1. **Không tự viết `ComponentRegistry` từ đầu:** Việc tự sinh parser, schema validation và metadata cho hơn 40 component shadcn là một cái bẫy công số khổng lồ. BẮT BUỘC tái sử dụng registry và schema có sẵn từ `reference/ui-builder`.
  2. **Phân loại Component Kiến trúc rõ ràng:**
     - *Nhóm 1: In-Flow DOM* (Button, Card, Input, Table, Badge, Avatar...): Dễ (`🟢 Low`), áp dụng trực tiếp Adapter `ShadcnNode`.
     - *Nhóm 2: Trigger-Anchored Portals* (Select, Popover, Tooltip, HoverCard...): Trung bình (`🟡 Medium`), dùng kiến trúc Case E với context scale.
     - *Nhóm 3: Viewport & Overlay Modals* (Dialog, Sheet, Drawer): Phức tạp (`🔴 High`), cần kiến trúc Inline Sub-Canvas Frame cho chế độ soạn thảo.

---

## 5. Ranh giới Kiến trúc Codegen (Codegen Architectural Boundary)

- **Quy tắc bất biến:** `lib/codegen.ts` đọc dữ liệu **duy nhất** từ Data Model thuần túy (`Item`), đại diện cho ý định thiết kế (Design Intent).
- **Ranh giới:** Tuyệt đối không để bất kỳ thuộc tính điều phối canvas nào (`CanvasContext`, `zoom`, `interactive`, wrapper CSS) rò rỉ vào chuỗi sinh mã TSX. 
- **Bằng chứng:** Mã nguồn sinh ra cho Button, Card và Select trong Phase 1 hoàn toàn thuần khiết và tương thích 100% với một dự án Next.js shadcn chuẩn.

---

## 6. Quyết định Chính thức (Official Go / No-Go Sign-Off)

### Quyết định: **GO (Phê duyệt triển khai Phase 2)**

**Điều kiện tiên quyết cho Phase 2:**
1. Khóa chặt data model và tái sử dụng registry schema của `ui-builder`.
2. Ghi nhận kiến trúc Case E vào kho tri thức kỹ thuật (`ADR` trong Obsidian Vault) với đầy đủ phạm vi và giới hạn thực nghiệm.

*Ký duyệt bởi: AI Assistant & Lead Technical Architect*  
*Thời điểm: 2026-09-16*
