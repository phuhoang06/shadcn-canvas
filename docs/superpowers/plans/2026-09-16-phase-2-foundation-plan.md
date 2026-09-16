# Phase 2 Implementation Plan: Foundation & Hybrid Data Model

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai Mô hình Hybrid Data Model, tích hợp Thư viện Registry định nghĩa linh kiện từ `ui-builder`, hỗ trợ `renderMode` cho Viewport Modals (Dialog), và nâng cấp Schema-Driven Inspector cùng Recursive TSX Codegen.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Radix UI, Zod.

---

### Task 1: Scaffolding Component Registry & Core Types
**Files:**
- Create: `lib/registry/types.ts`
- Create: `lib/registry/definitions.ts` (tích hợp từ `reference/ui-builder`)
- Create: `lib/registry/index.ts` (lookup helpers & default builders)
- Modify: `package.json` (kiểm tra dependencies Zod)

- [ ] **Step 1: Cài đặt hoặc đảm bảo Zod có trong package.json**
- [ ] **Step 2: Port `types.ts` từ `ui-builder` sang `lib/registry/types.ts`**
- [ ] **Step 3: Port `shadcn-component-definitions.ts` sang `lib/registry/definitions.ts`**
- [ ] **Step 4: Viết helper functions: `getDefinition(type)`, `createDefaultLayer(type)`**
- [ ] **Step 5: Kiểm tra biên dịch TypeScript (`npm run typecheck`)**

---

### Task 2: Triển Khai Hybrid Data Model Trên Canvas
**Files:**
- Modify: `lib/tokens.ts` (bổ sung kiểu `CanvasNode` và liên kết với `ComponentLayer`)
- Create: `lib/hybrid-model.ts` (chuyển đổi hai chiều giữa Canvas Spatial State và Component Tree)
- Test: Unit test xác nhận bảo toàn tọa độ `x, y` và cây `children`

- [ ] **Step 1: Định nghĩa `CanvasNode` với `id`, `x`, `y`, `w`, `h`, `renderMode`, `layer`**
- [ ] **Step 2: Mở rộng `Doc` để quản lý danh sách `nodes: CanvasNode[]` song song với `groups` cũ**
- [ ] **Step 3: Viết logic tạo node mới từ registry type (ví dụ `createNode('card', { x: 100, y: 100 })`)**
- [ ] **Step 4: Kiểm tra biên dịch TypeScript**

---

### Task 3: Universal Popper Invariant & Recursive Component Renderer
**Files:**
- Create: `components/renderers/PopperZoomAdapter.tsx` (tự động nhân `zoom` vào mọi offset pixel)
- Create: `components/renderers/HierarchicalNodeRenderer.tsx` (duyệt cây đệ quy `layer.children`)
- Modify: `components/nodes/ShadcnNode.tsx` (chuyển sang dùng Hierarchical Renderer)

- [ ] **Step 1: Xây dựng `PopperZoomAdapter` đọc `zoom` từ `useCanvasZoom()` và nhân vào `sideOffset`, `alignOffset`, `arrowPadding`**
- [ ] **Step 2: Xây dựng `HierarchicalNodeRenderer` render đệ quy các tầng component của shadcn**
- [ ] **Step 3: Tích hợp logic phân nhánh `renderMode`: render inline flat artboard khi `edit` và modal khi `preview`**
- [ ] **Step 4: Xác nhận hiển thị trên canvas ở 50%, 100%, 150% và zoom cực đoan 20%**

---

### Task 4: Schema-Driven Inspector Engine
**Files:**
- Create: `components/inspector/SchemaInspector.tsx`
- Modify: `components/Inspector.tsx` (kết nối với Schema Inspector khi chọn `CanvasNode`)

- [ ] **Step 1: Viết generator sinh form controls dựa trên Zod Schema (`z.string()`, `z.enum()`, `z.boolean()`)**
- [ ] **Step 2: Bổ sung bộ chọn Layer trong cây (Tree Breadcrumb) để người dùng chọn sửa component con (ví dụ: click vào Card để chọn sửa CardTitle)**
- [ ] **Step 3: Thêm switch điều khiển `renderMode` cho các component Modal (Dialog)**
- [ ] **Step 4: Kiểm tra phản ứng trực tiếp khi thay đổi giá trị thuộc tính**

---

### Task 5: Recursive TSX Codegen Engine
**Files:**
- Modify: `lib/codegen.ts` (nâng cấp duyệt cây đệ quy)
- Modify: `components/ExportModal.tsx`

- [ ] **Step 1: Viết hàm đệ quy `generateLayerTsx(layer: ComponentLayer, indent: number): string`**
- [ ] **Step 2: Tự động tổng hợp và nhóm các câu lệnh `import { ... } from "@/components/ui/..."`**
- [ ] **Step 3: Đảm bảo kiểm tra ranh giới kiến trúc: Tuyệt đối không leak tọa độ `x, y`, `renderMode` hay wrapper zoom**
- [ ] **Step 4: Thử nghiệm xuất TSX cho Card lồng Button và Dialog**

---

### Task 6: Kiểm Thử Toàn Diện & Nghiệm Thu Phase 2
- [ ] **Step 1: Chạy `npm run typecheck` và `npm run build`**
- [ ] **Step 2: Kiểm thử tự động trên Chrome CDP (tạo, sửa props, đổi mode Dialog, xuất TSX)**
- [ ] **Step 3: Viết báo cáo nghiệm thu Phase 2 (`docs/phase-2-evaluation-report.md`)**
