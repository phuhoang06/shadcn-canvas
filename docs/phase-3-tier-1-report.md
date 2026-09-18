# Báo Cáo Nghiệm Thu Phase 3 — Tier 1
## Đề mục: Dialog Unwrapped Frame, DropdownMenu Nested Portals & Tooltip
### Dự án: `shadcn-canvas`

- **Ngày hoàn thành:** 2026-09-18
- **Trạng thái:** Hoàn thành nghiệm thu toàn diện (Full Verification Passed)
- **Quyết định:** **GO — Khóa Tier 1, sẵn sàng chuyển sang Tier 2 (Form Controls: Checkbox, Switch, Slider, RadioGroup, Label, Avatar)**
- **Người thực hiện:** Engineering Pair (AI Assistant & Lead Architect)

---

## 1. Đối Chiếu Kết Quả Triển Khai Tier 1 (Task Evaluation)

| Task | Hạng mục công việc | Kết quả thực hiện | Trạng thái |
|:---|:---|:---|:---:|
| **Task 1** | **Xóa bỏ Mock Lookalike của Dialog bằng Unwrapped Primitive Frame** | Bổ sung prop `isFrame?: boolean` cho `DialogContent`. Khi ở `renderMode === "edit"`, sử dụng `<DialogPrimitive.Content forceMount={true}>` và loại bỏ `DialogPortal`/`DialogOverlay`. Render trực tiếp mã JSX và class Tailwind thật của shadcn trên canvas artboard, bảo toàn nút đóng Close Button và icon Lucide X. | **ĐẠT (PASS)** |
| **Task 2** | **Cài đặt Dependencies & Port Components** | Cài đặt chính thức `@radix-ui/react-dropdown-menu` và `@radix-ui/react-tooltip`. Port sạch các component từ `reference/ui-builder`: `components/ui/dropdown-menu.tsx` và `components/ui/tooltip.tsx`. Hỗ trợ đầy đủ `DropdownMenuSubContent` có Portal. | **ĐẠT (PASS)** |
| **Task 3** | **Đăng ký Registry Definitions & Tokens** | Đăng ký toàn bộ họ component `DropdownMenu` (Root, Trigger, Content, Item, Label, Separator, Sub, SubTrigger, SubContent) và `Tooltip` (Root, Trigger, Content) trong `lib/registry/definitions.ts`. Khởi tạo `defaultChildren` chứa sẵn cấu trúc menu con lồng nhau 2 tầng. Đăng ký `shadcnDropdownMenu` và `shadcnTooltip` trong `lib/tokens.ts`. | **ĐẠT (PASS)** |
| **Task 4** | **Hierarchical Renderer & Codegen Đệ Quy** | Tích hợp nhánh render cho `DropdownMenu` và `Tooltip` trong `HierarchicalNodeRenderer.tsx` sử dụng `usePopperZoom()`. Cập nhật `lib/codegen.ts` tự động import đúng từ `@/components/ui/dropdown-menu` và `@/components/ui/tooltip`. Sinh mã TSX React chuẩn 100%, không rò rỉ bất kỳ thuộc tính canvas/zoom nào. | **ĐẠT (PASS)** |
| **Task 5** | **Kiểm Nghiệm Thực Nghiệm CDP (Headless Chrome)** | Thử nghiệm ma trận zoom cực đoan tại **50%, 20%, và 10%**. Xác nhận menu cấp 1 và menu con cấp 2 đều co dãn chính xác theo tỷ lệ $1 \times zoom$. Không xảy ra hiện tượng double-scaling ($zoom^2$). Submenu bám dính sub-pixel ($dy = 0.00\text{px}$). | **ĐẠT (PASS)** |
| **Task 6** | **Tài Liệu Hóa Thực Nghiệm & Cập Nhật ADR** | Tạo artifact `nested-portal-evidence.md` kèm bảng đo sub-pixel và ảnh chụp màn hình chi tiết. Cập nhật Review Criteria trong `ADR-001-canvas-zoom-portal-adapter.md` sang trạng thái ĐÃ XÁC MINH. | **ĐẠT (PASS)** |

---

## 2. Phát Hiện Kỹ Thuật Quan Trọng & Bản Chất Kiến Trúc

### 2.1. Giải Mã Hiện Tượng Double-Scaling trên Nested Portals
Trước khi triển khai Phase 3, rủi ro lớn nhất được đặt ra là: *Nếu Menu cấp 1 đã bị `scale(zoom)`, thì Submenu Trigger bên trong nó đã bị co lại. Khi Submenu Content (cấp 2) mở ra qua Portal và cũng nhận `scale(zoom)`, liệu nó có bị co dãn 2 lần ($zoom \times zoom$) hay không?*

**Thực nghiệm trên CDP chứng minh: Hoàn toàn KHÔNG bị double-scaling.**
- **Nguyên nhân cốt lõi:**
  1. Trong Radix UI, cả `DropdownMenuContent` và `DropdownMenuSubContent` đều dùng `<DropdownMenuPrimitive.Portal>` để đưa DOM node ra trực tiếp `document.body`. Hai menu này là anh em ngang hàng (siblings) trong DOM root, hoàn toàn không lồng CSS transform vào nhau.
  2. Floating UI tính toán tọa độ neo bằng `SubTrigger.getBoundingClientRect()`. Bounding box này trên viewport màn hình **vốn đã được scale theo zoom** (ví dụ: ở zoom 0.5, chiều cao đo được là 16px thay vì 32px).
  3. Floating UI đặt wrapper của SubContent tại đúng tọa độ mép phải của SubTrigger đã scale.
  4. SubContent nhận `transform: scale(zoom)` từ `usePopperZoom()` với gốc tọa độ `transformOrigin: "0px 0px"` (hoặc `--radix-popper-transform-origin`). Vì SubContent xuất phát từ `document.body` (scale = 1.0), nó chỉ nhận đúng 1 lần co dãn theo $zoom$.
  5. Kết quả: Tỷ lệ co dãn thực tế của SubContent đo được là $0.5000$ (tại zoom 50%), $0.2000$ (tại zoom 20%), và $0.1000$ (tại zoom 10%). Nếu bị double-scaling, các tỷ lệ này sẽ lần lượt là $0.25$, $0.04$, và $0.01$.

### 2.2. Unwrapped Primitive Frame cho Dialog
- Thay vì sử dụng một thẻ `div` giả lập làm mock lookalike trong Edit Mode, `DialogContent` hiện hỗ trợ prop `isFrame?: boolean`.
- Khi `isFrame === true`:
  - Component trực tiếp dùng `<DialogPrimitive.Content forceMount={true}>`.
  - Không bọc `DialogPortal` và `DialogOverlay`.
  - CSS chuyển từ `fixed left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2` sang `relative grid w-full`.
  - Nút đóng (Close Button với icon `X`) cùng toàn bộ styling border/background/shadow chính thống của shadcn được bảo toàn 100%.

---

## 3. Dữ Liệu Đo Đạc Thực Nghiệm Tóm Tắt

| Zoom Level | Level 1 Scale | Level 2 Scale | $dy$ Alignment (Submenu vs SubTrigger) | Double-Scale Detected? |
|:---:|:---:|:---:|:---:|:---:|
| **50%** | $0.5000$ | $0.5000$ | $0.00\text{px}$ | ❌ Không |
| **20%** | $0.2000$ | $0.2000$ | $0.00\text{px}$ | ❌ Không |
| **10%** | $0.1000$ | $0.1000$ | $0.00\text{px}$ | ❌ Không |

Bằng chứng hình ảnh chi tiết đã lưu trữ:
- Chi tiết Submenu Zoom 50%: `phase3-dropdown-50-detail.png`
- Toàn cảnh Zoom 50%: `phase3-dropdown-50.png`
- Toàn cảnh Zoom 20%: `phase3-dropdown-20.png`
- Toàn cảnh Zoom 10%: `phase3-dropdown-10.png`
- Tooltip Zoom 75%: `phase3-tooltip-detail.png`

---

## 4. Kiểm Tra Toàn Vẹn Hệ Thống (Verification Evidence)

1. **TypeScript Typecheck:**
   - Lệnh: `npm run typecheck`
   - Kết quả: `0 errors`
2. **Next.js Production Build:**
   - Lệnh: `npm run build`
   - Kết quả: Thành công biên dịch toàn bộ pages và static chunks, exit code `0`.
3. **Mã nguồn TSX Export:**
   - Xác nhận cây AST tuần tự hóa đệ quy sạch 100% cho cả Dialog Unwrapped Frame, DropdownMenu (kèm Submenu lồng nhau), và Tooltip.
   - 0% rò rỉ coordinate hay canvas runtime properties.

---

## 5. Kế Hoạch Bước Tiếp Theo: Phase 3 — Tier 2 (Form Controls)

Với nền tảng Nested Portals và Universal Popper Invariant đã được chứng minh hoàn toàn ổn định trên thực nghiệm, sẵn sàng bước vào Tier 2:
- **Các components cần port:**
  1. `Checkbox` (`@radix-ui/react-checkbox`)
  2. `Switch` (`@radix-ui/react-switch`)
  3. `Slider` (`@radix-ui/react-slider`)
  4. `RadioGroup` (`@radix-ui/react-radio-group`)
  5. `Label` (`@radix-ui/react-label`)
  6. `Avatar` (`@radix-ui/react-avatar`)
- **Đặc điểm kiến trúc:** Nhóm In-Flow Form Controls (không sử dụng Portal ngoài), tập trung vào tương tác form state và codegen thuộc tính checked/value.
