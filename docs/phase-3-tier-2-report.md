# Báo Cáo Nghiệm Thu Phase 3 — Tier 2
## Đề mục: In-Flow Form Controls, Pointer Isolation & Dialog Single Source of Truth
### Dự án: `shadcn-canvas`

- **Ngày hoàn thành:** 2026-09-18
- **Trạng thái:** Hoàn thành nghiệm thu toàn diện (Full Verification Passed)
- **Quyết định:** **GO — Khóa Tier 2, sẵn sàng chuyển sang Tier 3 (Structural & Layout Primitives: Sheet, Accordion, Tabs, Alert, Table)**
- **Người thực hiện:** Engineering Pair (AI Assistant & Lead Architect)

---

## 1. Đối Chiếu Kết Quả Triển Khai Tier 2 (Task Evaluation)

| Task | Hạng mục công việc | Kết quả thực hiện | Trạng thái |
|:---|:---|:---|:---:|
| **Task 1** | **Thiết Kế & Phân Tích Cơ Chế Cách Ly Pointer Event (Slider Drag vs Canvas Drag)** | Xác định chính xác ngưỡng kéo của canvas ($> 5\text{px}$ di chuyển chuột kích hoạt `d.active = true` trong `Editor.tsx`). Đề xuất giải pháp gọi `e.stopPropagation()` trực tiếp trên `onPointerDown` của `SliderPrimitive.Root` để ngắt nổi bọt sự kiện lên `motion.div`. | **ĐẠT (PASS)** |
| **Task 2** | **Cài đặt Dependencies & Port 6 Form Control Components** | Cài đặt chính thức 6 thư viện Radix: `@radix-ui/react-checkbox`, `@radix-ui/react-switch`, `@radix-ui/react-slider`, `@radix-ui/react-radio-group`, `@radix-ui/react-label`, `@radix-ui/react-avatar`. Port sạch 6 file component vào `components/ui/*` kèm pointer event isolation trên các interactive controls. | **ĐẠT (PASS)** |
| **Task 3** | **Đăng ký Registry Definitions & Tokens** | Đăng ký đầy đủ Zod schema, default props, và cấu trúc component con đệ quy trong `lib/registry/definitions.ts` (đặc biệt `RadioGroup` gồm 2 item con mặc định, `Avatar` gồm `AvatarImage` + `AvatarFallback`). Bổ sung 6 Kind mới vào `Kind`, `KIND_SPEC`, `KIND_ORDER`, và `makeItem` trong `lib/tokens.ts`. | **ĐẠT (PASS)** |
| **Task 4** | **Cập Nhật Hierarchical Renderer & Codegen** | Bổ sung nhánh render đệ quy cho cả 6 linh kiện trong `HierarchicalNodeRenderer.tsx` kèm hỗ trợ `interactive` và `onSelectLayer`. Cập nhật `COMPONENT_MODULE_MAP` trong `lib/codegen.ts` map 1-1 tới các module `@/components/ui/*`. | **ĐẠT (PASS)** |
| **Task 5** | **Kiểm Nghiệm Thực Nghiệm CDP (Slider Drag Isolation & Form Interactivity)** | Kiểm chứng kéo Slider Thumb qua CDP: dịch chuyển Thumb 60px theo phương ngang làm tăng giá trị `50 -> 80`, trong khi Canvas Node hoàn toàn bất động ($dx_{node} = 0.00\text{px}$, $dy_{node} = 0.00\text{px}$). Kiểm chứng click Checkbox, Switch, RadioGroup chuyển đổi `aria-checked` và `data-state` chính xác. | **ĐẠT (PASS)** |
| **Task 6** | **Tài Liệu Hóa Nghiệm Thu & Build Verification** | Tạo artifact `tier-2-form-controls-evidence.md` kèm 5 ảnh chụp đối chứng sắc nét và bảng đo sub-pixel. Chạy `npm run typecheck` và `npm run build` đạt exit code 0. | **ĐẠT (PASS)** |

---

## 2. Phát Hiện Kỹ Thuật Quan Trọng & Bản Chất Kiến Trúc

### 2.1. Bản Chất Xung Đột Pointer Drag & Cơ Chế Cách Ly Triệt Để
- **Rủi ro ban đầu:** `m3e-canvas` sử dụng `motion.div` bọc ngoài mỗi `CanvasNode` để hỗ trợ di chuyển tự do trên không gian 2D vô cực. Khi người dùng bấm giữ chuột và di chuyển vượt qua ngưỡng 5px, canvas chuyển sang chế độ kéo node (`d.active = true`).
- **Thử nghiệm trên `Slider`:** Thanh trượt Radix Slider yêu cầu người dùng bấm vào Thumb và kéo rê trên Track (thường từ 20px đến 150px). Nếu không có cơ chế chặn, sự kiện `pointerdown` sẽ nổi bọt lên container, khiến việc kéo thanh trượt vô tình làm dịch chuyển cả khối component trên canvas.
- **Giải pháp triệt để:** Bằng cách gắn `onPointerDown={(e) => { e.stopPropagation(); onPointerDown?.(e); }}` tại tầng Primitive của `Slider`, `Checkbox`, `Switch`, và `RadioGroup`:
  - Trình duyệt ngắt hoàn toàn chuỗi nổi bọt sự kiện pointer lên `motion.div`.
  - Canvas giữ nguyên trạng thái tĩnh.
  - Radix Slider nắm bắt `pointerId` và xử lý kéo trượt mượt mà trong không gian cục bộ của component.

### 2.2. Tái Cấu Trúc Dialog: Đảm Bảo "1 Nguồn Sự Thật" (Single Source of Truth)
- Đóng triệt để lỗ hổng WYSIWYG drift giữa Edit Mode (`isFrame=true`) và Preview Mode (`isFrame=false`):
  - Định nghĩa duy nhất một hằng số lớp giao diện `DIALOG_CONTENT_CLASSES` chuẩn từ template shadcn/ui.
  - Hàm tiện ích `getDialogContentClassNames(isFrame)` thực hiện lọc bỏ động các lớp positioning tuyệt đối (`fixed`, `inset`, `translate`, `top-`, `left-`, `z-`) khi ở chế độ Frame mà không nhân bản chuỗi class.
  - Cả hai chế độ đều chia sẻ chung một cấu trúc JSX (`contentElement`) bao gồm nút đóng `X`, `DialogHeader`, `DialogTitle`, và nội dung con.
  - Đo đạc computed style qua CDP xác nhận: `padding: 24px`, `borderRadius: 8px`, `border: 1px solid rgb(29, 27, 32)` và `boxShadow: shadow-lg` hoàn toàn đồng nhất 100%.

---

## 3. Dữ Liệu Đo Đạc Thực Nghiệm Tóm Tắt (CDP Measurement)

### 3.1. Phép Đo Kéo Slider (Drag Isolation Measurement)
- Khoảng cách kéo chuột thực tế: $\Delta x_{drag} = 60\text{px}$ (vượt xa ngưỡng kích hoạt canvas 5px).

| Chỉ số | Trước thao tác kéo | Sau thao tác kéo | Độ lệch ($\Delta$) | Đánh giá |
|:---|:---:|:---:|:---:|:---:|
| **Canvas Node Tọa Độ ($x, y$)** | $(260.00, 428.00)\text{px}$ | $(260.00, 428.00)\text{px}$ | $dx = 0.00\text{px}, dy = 0.00\text{px}$ | ✅ **ĐỨNG YÊN HOÀN TOÀN** |
| **Slider Thumb Tọa Độ ($x, y$)** | $(350.00, 422.00)\text{px}$ | $(404.00, 422.00)\text{px}$ | $dx = +54.00\text{px}, dy = 0.00\text{px}$ | ✅ **TRƯỢT MƯỢT MÀ** |
| **Slider `aria-valuenow`** | `50` | `80` | $\Delta = +30$ | ✅ **CẬP NHẬT CHUẨN XÁC** |

### 3.2. Chuyển Đổi Trạng Thái Form Controls
- **Checkbox:** Chuyển từ `unchecked` (`aria-checked="false"`) sang `checked` (`aria-checked="true"`), hiển thị icon checkmark trắng nổi trên nền đen.
- **Switch:** Chuyển từ `unchecked` sang `checked`, thumb trượt sang phải ($translate\text{-}x\text{-}5$), nền chuyển sang màu primary.
- **RadioGroup:** Ban đầu Item 1 được chọn. Sau khi click Item 2, Item 2 chuyển sang `checked` và Item 1 tự động chuyển về `unchecked`.
- **Avatar:** Tải và hiển thị ảnh chân dung `@shadcn` tròn hoàn hảo; fallback `CN` sẵn sàng khi ảnh lỗi.

---

## 4. Kiểm Tra Toàn Vẹn Hệ Thống (Verification Evidence)

1. **TypeScript Typecheck:**
   - Lệnh: `npm run typecheck`
   - Kết quả: `0 errors`
2. **Next.js Production Build:**
   - Lệnh: `npm run build`
   - Kết quả: Thành công biên dịch toàn bộ pages và static chunks, exit code `0`.
3. **Mã Nguồn TSX Export:**
   - Xuất mã nguồn TSX từ modal Export trên canvas chứa toàn bộ 6 linh kiện.
   - Nhập khẩu chuẩn xác từ `@/components/ui/*`.
   - Cấu trúc cây component lồng nhau sạch 100%, không rò rỉ bất kỳ canvas runtime props nào.

Bằng chứng hình ảnh đã lưu trữ:
- Ảnh tổng thể & tương tác Form: `tier2-form-controls-detail.png`
- Ảnh kiểm chứng kéo Slider: `tier2-slider-drag-verified.png`
- Ảnh Avatar & Label: `tier2-avatar-label-detail.png`
- Ảnh Export TSX Modal: `tier2-export-tsx.png`
- Artifact chi tiết: `tier-2-form-controls-evidence.md`

---

## 5. Kế Hoạch Bước Tiếp Theo: Phase 3 — Tier 3 (Structural & Layout Primitives)

Với Tier 1 (Popper / Portals) và Tier 2 (In-Flow Form Controls) đã hoàn thành xuất sắc và có bằng chứng đo lường thực nghiệm chặt chẽ, dự án sẵn sàng tiến vào Tier 3:
- **Các components mục tiêu:**
  1. `Sheet` (Viewport Drawer 4 hướng: top, bottom, left, right — kết hợp kiểm chứng Unwrapped Frame tương tự Dialog).
  2. `Accordion` & `AccordionItem` (Collapsible layout).
  3. `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` (Tabbed navigation).
  4. `Alert`, `AlertTitle`, `AlertDescription` (Notification banners).
  5. `Table` (Data table structure: Header, Body, Row, Head, Cell).
