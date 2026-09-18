# shadcn-canvas 🎨

> **Spatial Visual UI Canvas for Real shadcn/ui & Radix UI Primitives with Clean TSX Codegen**

`shadcn-canvas` kết hợp kiến trúc canvas 2D zoom/pan tự do của `m3e-canvas` với các linh kiện UI production-ready của **shadcn/ui** (xây dựng trên Radix UI Primitives và Tailwind CSS v4). Người dùng có thể kéo thả, phóng to thu nhỏ từ 10% đến 200%, cấu hình thuộc tính động (props), và xuất mã nguồn React TSX sạch 100% không rò rỉ bất kỳ thuộc tính runtime nào của canvas.

---

## 🚀 Các Tính Năng & Kiến Trúc Cốt Lõi

### 1. Universal Popper Zoom Invariant (ADR-001)
Khi canvas zoom (ví dụ $20\%$ hoặc $50\%$), các popper portal của Radix UI (`Popover`, `Select`, `DropdownMenu`, `Tooltip`) mount trực tiếp vào `document.body` ngoài cây biến đổi CSS (`transform: scale(z)`).
- **Giải pháp:** [`PopperZoomAdapter`](components/renderers/PopperZoomAdapter.tsx) bù trừ tọa độ anchor và scale:
  $$\text{scale} = \text{zoom}, \quad \text{transformOrigin} = \text{direction-anchored}$$
  $$\text{sideOffset} = \text{rawSideOffset} \times \text{zoom}$$
- **Zero Double-Scaling:** DropdownMenu lồng nhau (Submenu) và Tooltip hoạt động ổn định ở mọi mức zoom từ $10\%$ đến $200\%$ mà không bị nhân đôi ma trận transform.

### 2. Unwrapped Primitive Frame (ADR-002: Dialog & Sheet)
Các linh kiện modal/drawer (`Dialog`, `Sheet`) hỗ trợ 2 chế độ hiển thị song song từ **1 nguồn sự thật duy nhất (Single Source of Truth)**:
- **Edit Mode (`renderMode="edit"`):** Render dạng khung artboard nội dòng (Inline Sub-Canvas Artboard) bằng `<DialogPrimitive.Content forceMount={true}>` / `<SheetPrimitive.Content forceMount={true}>` không kích hoạt Portal hoặc Backdrop Overlay. Các class định vị viewport (`fixed`, `inset-`, `z-50`) được lọc bỏ động bằng [`getDialogContentClassNames`](components/ui/dialog.tsx) và [`getSheetContentClassNames`](components/ui/sheet.tsx), giữ nguyên 100% style hiển thị với **0.00% style drift**.
- **Preview Mode (`renderMode="preview"`):** Kích hoạt portal overlay và hiệu ứng trượt/mở modal tiêu chuẩn của Radix UI.

### 3. Pointer Event Isolation (Slider Drag vs Canvas Pan)
Ngăn chặn xung đột giữa tương tác kéo thả canvas (ngưỡng di chuyển chuột $> 5\text{px}$) và thao tác kéo trượt của linh kiện (như `Slider` Thumb):
- Áp dụng `onPointerDown={(e) => e.stopPropagation()}` trên các điều khiển tương tác (`Slider`, `Checkbox`, `Switch`, `RadioGroup`, `TabsTrigger`, `AccordionTrigger`).

### 4. Uncontrolled Standalone Invariants & Type-Aware Codegen
Mã nguồn React TSX xuất bản từ canvas được tối ưu để hoạt động độc lập ngay khi dán vào project mới:
- Tự động chuẩn hóa state kiểm soát sang uncontrolled:
  - `checked` $\rightarrow$ `defaultChecked` (`Checkbox`, `Switch`)
  - `open` $\rightarrow$ `defaultOpen` (`Dialog`, `Sheet`)
  - `value` $\rightarrow$ `defaultValue` (`Tabs`, `RadioGroup`)
- **Type-Aware Accordion Normalization:**
  - `type="single"` $\rightarrow$ `defaultValue="item-1"` (chuỗi đơn)
  - `type="multiple"` $\rightarrow$ `defaultValue={["item-1", "item-2"]}` (mảng chuỗi)
- Loại bỏ hoàn toàn các thuộc tính runtime canvas (`isFrame`, node IDs, selection state).

---

## 📦 Danh Mục Linh Kiện Đã Hoàn Thành (Component Coverage)

Dự án đã hoàn thành đầy đủ **3 Phases** với 15+ nhóm linh kiện cốt lõi:

| Nhóm Linh Kiện | Các Thành Phần Hỗ Trợ | Chế Độ & Tính Năng Nổi Bật |
| :--- | :--- | :--- |
| **Phase 1: Foundation POC** | `Button`, `Card` (Header, Title, Description, Content, Footer), `Badge` | Variant CVA, Click vs Drag Threshold ($> 5\text{px}$). |
| **Phase 2: Core Primitives** | `Dialog` (Trigger, Content, Header, Title, Description, Footer, Close), `Popover`, `Select`, `Input`, `Textarea`, `Separator` | Unwrapped Frame cho Dialog, Popper Zoom Adapter, Hierarchical Layer Tree, Schema Inspector. |
| **Phase 3 Tier 1: Portals** | `DropdownMenu` (Trigger, Content, Item, Label, Separator, Sub, SubTrigger, SubContent), `Tooltip` | Universal Popper Invariant cho nested portals (2 tầng submenu), kiểm nghiệm ở 50%, 20%, 10% zoom. |
| **Phase 3 Tier 2: Form Controls** | `Checkbox`, `Switch`, `Slider`, `RadioGroup` (Item), `Label`, `Avatar` (Image, Fallback) | Pointer Isolation cho Slider, chuẩn hóa `defaultChecked`, đối chứng computedStyle Dialog 2 chiều. |
| **Phase 3 Tier 3: Layout & Structure**| `Sheet` (Trigger, Content 4 hướng, Header, Title, Description, Footer, Close), `Accordion` (Item, Trigger, Content), `Tabs` (List, Trigger, Content), `Alert` (Title, Description), `Table` (Header, Body, Row, Head, Cell, Caption) | Unwrapped Frame cho Sheet 4 hướng (`top`, `bottom`, `left`, `right`), Type-Aware Accordion Codegen, WAI-ARIA disclosure toggle. |

---

## 🛠 Hướng Dẫn Cài Đặt & Phát Triển

### Yêu Cầu Môi Trường
- Node.js $\ge 18$ (Đã kiểm nghiệm hoàn hảo trên Node v24 LTS).
- npm $\ge 9$.

### Cài Đặt & Chạy Ứng Dụng
```bash
# 1. Clone repository
git clone https://github.com/phuhoang06/shadcn-canvas.git
cd shadcn-canvas

# 2. Cài đặt dependencies
npm install

# 3. Chạy server phát triển (Next.js 16 Turbopack)
npm run dev
# Mở trình duyệt tại: http://localhost:3000
```

### Kiểm Tra Hệ Thống & Build Production
```bash
# Kiểm tra TypeScript typecheck
npm run typecheck

# Build phiên bản production
npm run build
```

---

## 📚 Thư Viện Tài Liệu, Báo Cáo & Bằng Chứng Thực Nghiệm

Toàn bộ quá trình phát triển tuân thủ nghiêm ngặt quy trình kỹ thuật thực chứng (Empirical Verification via Chrome DevTools Protocol):

### Báo Cáo Nghiệm Thu Từng Giai Đoạn (Milestone Reports)
- [Phase 1 POC Evaluation Report](docs/poc-evaluation-report.md)
- [Phase 2 Foundation Evaluation Report](docs/phase-2-evaluation-report.md)
- [Phase 3 Tier 1 Report: Trigger-Anchored Portals](docs/phase-3-tier-1-report.md)
- [Phase 3 Tier 2 Report: In-Flow Form Controls & Dialog Side-by-Side](docs/phase-3-tier-2-report.md)
- [Phase 3 Tier 3 Report: Structural & Layout Primitives](docs/phase-3-tier-3-report.md)

### Bằng Chứng Thực Nghiệm Chi Tiết & Ảnh Chụp Trình Duyệt (Evidence)
- [Tier 3 Evidence: Sheet 0% Drift, Accordion & Tabs CDP Tests](docs/evidence/tier-3-layout-primitives-evidence.md)
- [Tier 2 Evidence: Dialog ComputedStyle & Slider Drag Isolation](docs/evidence/tier-2-form-controls-evidence.md)
- [Tier 1 Evidence: Nested Dropdown Portals Extreme Zoom 10-50%](docs/evidence/nested-portal-evidence.md)
- [Thư mục ảnh chụp thực nghiệm CDP](docs/evidence/images/)

### Kế Hoạch Triển Khai & Thiết Kế Kiến Trúc (Specs & Plans)
- [Phase 3 Tier 3 Implementation Plan](docs/superpowers/plans/2026-09-18-phase-3-tier-3-plan.md)
- [Phase 3 Tier 2 Implementation Plan](docs/superpowers/plans/2026-09-18-phase-3-tier-2-plan.md)
- [Phase 3 Tier 1 Implementation Plan](docs/superpowers/plans/2026-09-18-phase-3-tier-1-plan.md)
- [Phase 2 Foundation Design Specification](docs/superpowers/specs/2026-09-16-phase-2-foundation-design.md)
- [Dự Thảo Thiết Kế Tổng Thể](docs/design-spec.md)
- [Kế Hoạch Thực Thi Tổng Thể](docs/implementation-plan.md)

---

## 🧭 Lộ Trình & Hướng Dẫn Cho Người Tiếp Tục Phát Triển

Dự án hiện đã hoàn tất nền tảng vững chắc và toàn bộ 3 tầng linh kiện cơ bản của Phase 3. Các đầu việc tiếp theo có thể triển khai:
1. **Multi-Frame Screen Flow:** Mở rộng liên kết giữa nhiều Frame trên canvas (ví dụ: chuyển từ HomeScreen sang ProfileScreen khi click Button/Item).
2. **Additional Complex Primitives:** Tích hợp `Calendar` / `DatePicker`, `Command` palette, `Carousel`.
3. **Template Library:** Bổ sung các preset màn hình mẫu (Authentication screens, Dashboard cards, Settings forms).
4. **Interactive Figma / Code Sync:** Tích hợp tính năng đồng bộ 2 chiều (Bidirectional Code-to-Canvas AST parser).
