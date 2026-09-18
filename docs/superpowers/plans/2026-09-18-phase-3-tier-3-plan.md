# Phase 3 Tier 3 Implementation Plan: Structural & Layout Primitives

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mở rộng Phase 3 với 5 nhóm linh kiện Bố cục & Cấu trúc (Structural & Layout Primitives): `Sheet` (Viewport Drawer 4 hướng kèm Unwrapped Frame), `Accordion` (Collapsible sections), `Tabs` (Tabbed navigation), `Alert` (Context banners), và `Table` (Data grid). Áp dụng triệt để nguyên tắc **Uncontrolled Standalone Invariant** (`defaultValue`, `defaultOpen`) cho `Accordion`, `Tabs`, và `Sheet`.

**Architecture:**
- Next.js 16 (Turbopack), React 19, Radix UI Primitives, Tailwind CSS v4.
- **Sheet Multi-Mode Unwrapped Frame:** Kế thừa kiến trúc từ Dialog: `isFrame=true` render trực tiếp `SheetPrimitive.Content forceMount={true}` trên canvas artboard không qua Portal/Overlay, trích xuất class động từ một nguồn sự thật duy nhất cho cả 4 hướng (`top`, `bottom`, `left`, `right`).
- **Uncontrolled Interactive Invariants:** Chuẩn hóa tự động trong AST Codegen:
  - `Tabs`: `defaultValue` cho active tab
  - `Accordion`: `defaultValue` cho expanded item
  - `Sheet`: `defaultOpen` cho initial drawer state
- **AST Codegen:** Tuần tự hóa sạch 100% vào `@/components/ui/*` mà không rò rỉ bất kỳ thuộc tính runtime canvas nào.

**Tech Stack:** `@radix-ui/react-accordion`, `@radix-ui/react-tabs`, `@radix-ui/react-dialog` (có sẵn), Lucide Icons, Chrome DevTools Protocol (CDP).

---

### Task 1: Cài Đặt Dependencies Cần Thiết Cho Tier 3

**Files:**
- Modify: `package.json`

- [x] **Step 1: Xin phép cài đặt 2 packages mới:** `@radix-ui/react-accordion` và `@radix-ui/react-tabs` (lưu ý: `@radix-ui/react-dialog` cho `Sheet` đã được cài đặt từ Phase 2).
- [x] **Step 2: Chạy cài đặt:** `npm install @radix-ui/react-accordion @radix-ui/react-tabs`.
- [x] **Step 3: Commit:** `git commit -m "chore(deps): install radix accordion and tabs for phase 3 tier 3"`

---

### Task 2: Port 5 Components Vào `components/ui/*`

**Files:**
- Create: `components/ui/sheet.tsx`
- Create: `components/ui/accordion.tsx`
- Create: `components/ui/tabs.tsx`
- Create: `components/ui/alert.tsx`
- Create: `components/ui/table.tsx`

- [x] **Step 1: Port `components/ui/sheet.tsx`:**
  - Tích hợp `isFrame?: boolean` cho `SheetContent`.
  - Định nghĩa hàm `getSheetContentClassNames(side, isFrame)` trích xuất từ cva `sheetVariants`, loại bỏ động `fixed`, `inset-`, `z-50` khi `isFrame=true`.
  - Cung cấp `forceMount={isFrame ? true : undefined}` và loại bỏ `SheetPortal`/`SheetOverlay` ở Edit Mode.
- [x] **Step 2: Port `components/ui/accordion.tsx`:**
  - `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`.
- [x] **Step 3: Port `components/ui/tabs.tsx`:**
  - `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
- [x] **Step 4: Port `components/ui/alert.tsx`:**
  - `Alert`, `AlertTitle`, `AlertDescription` với variant `default` và `destructive`.
- [x] **Step 5: Port `components/ui/table.tsx`:**
  - `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`.
- [x] **Step 6: Kiểm tra typecheck:** `npm run typecheck`.
- [x] **Step 7: Commit:** `git commit -m "feat(components): port tier 3 layout primitives (sheet, accordion, tabs, alert, table)"`

---

### Task 3: Đăng Ký Registry Definitions & Tokens Cho 5 Nhóm Linh Kiện

**Files:**
- Modify: `lib/registry/definitions.ts`
- Modify: `lib/tokens.ts`

- [x] **Step 1: Đăng ký Schemas & Default Children trong `lib/registry/definitions.ts`:**
  - `Sheet`: `side` (top/bottom/left/right), `defaultOpen`, `open`. Default children: `SheetTrigger` + `SheetContent` (kèm Header, Title, Description, Footer, Close).
  - `Accordion`: `type` ("single" | "multiple"), `collapsible`, `defaultValue`. Default children: 2 `AccordionItem` (Item 1 & Item 2 kèm Trigger + Content).
  - `Tabs`: `defaultValue`. Default children: `TabsList` (2 `TabsTrigger`) + 2 `TabsContent`.
  - `Alert`: `variant` ("default" | "destructive"). Default children: `AlertTitle` + `AlertDescription`.
  - `Table`: Default children: `TableHeader` (Row + Head) + `TableBody` (Row + Cells).
- [x] **Step 2: Cập nhật Tokens trong `lib/tokens.ts`:**
  - Bổ sung `shadcnSheet`, `shadcnAccordion`, `shadcnTabs`, `shadcnAlert`, `shadcnTable` vào `Kind`, `KIND_SPEC`, `KIND_ORDER`, và `makeItem`.
- [x] **Step 3: Commit:** `git commit -m "feat(registry): register definitions and tokens for tier 3 layout components"`

---

### Task 4: Cập Nhật Hierarchical Renderer, Codegen & SchemaInspector

**Files:**
- Modify: `components/renderers/HierarchicalNodeRenderer.tsx`
- Modify: `lib/codegen.ts`
- Modify: `components/inspector/SchemaInspector.tsx`

- [x] **Step 1: Hierarchical Renderer:** Bổ sung nhánh render đệ quy cho cả 5 nhóm component trong `HierarchicalNodeRenderer.tsx` với đầy đủ xử lý `interactive`, `renderMode` ("edit" vs "preview" cho Sheet), `selectedLayerId`.
- [x] **Step 2: AST Codegen:**
  - Cập nhật `COMPONENT_MODULE_MAP` cho tất cả các sub-components mới trong `lib/codegen.ts`.
  - Áp dụng chuẩn hóa uncontrolled invariant: map `value` -> `defaultValue` cho `Accordion` và `Tabs`, map `open` -> `defaultOpen` cho `Sheet`.
- [x] **Step 3: SchemaInspector:** Bổ sung trường cấu hình cho `Sheet` (chọn hướng `side`, toggle mode edit/preview), `Accordion` (defaultValue, collapsible), `Tabs` (defaultValue), `Alert` (variant).
- [x] **Step 4: Kiểm tra build:** `npm run typecheck` và `npm run build`.
- [x] **Step 5: Commit:** `git commit -m "feat(renderers): add recursive rendering, uncontrolled codegen and inspector for tier 3"`

---

### Task 5: Kiểm Nghiệm Thực Nghiệm CDP (Interactivity & Visual Verification)

**Files:**
- Test via Chrome DevTools Protocol (CDP)
- Create artifact: `tier-3-layout-primitives-evidence.md`

- [x] **Step 1: Kiểm chứng Sheet Multi-Mode:**
  - Đối chứng computedStyle side-by-side của `SheetContent` ở Edit Mode (`isFrame=true`) vs Preview Mode (`isFrame=false`, open).
  - Kiểm tra các hướng `side="right"` và `side="bottom"`.
- [x] **Step 2: Kiểm chứng Accordion Interactivity:**
  - Click AccordionTrigger Item 2 via CDP: xác nhận panel 2 mở ra (`data-state="open"`), panel 1 đóng lại (`data-state="closed"`).
- [x] **Step 3: Kiểm chứng Tabs Switching:**
  - Click TabsTrigger Tab 2 via CDP: xác nhận TabsContent 2 hiển thị và TabsContent 1 ẩn đi.
- [x] **Step 4: Kiểm chứng Alert & Table:**
  - Render Alert (default & destructive) và Table đầy đủ dữ liệu hàng/cột.
- [x] **Step 5: Chụp ảnh màn hình đối chứng và xuất TSX Export:**
  - Xác nhận TSX xuất chuẩn `defaultValue`, `defaultOpen`, không rò rỉ canvas props.
- [x] **Step 6: Commit tài liệu:** `git commit -m "test(cdp): verify tier 3 layout primitives interactivity and uncontrolled codegen"`

---

### Task 6: Báo Cáo Nghiệm Thu Tier 3 & Toàn Diện Phase 3

**Files:**
- Create: `docs/phase-3-tier-3-report.md`

- [x] **Step 1: Soạn thảo báo cáo nghiệm thu `docs/phase-3-tier-3-report.md`.**
- [x] **Step 2: Chạy full verification:** `npm run typecheck && npm run build` đạt exit code 0.
- [x] **Step 3: Commit:** `git commit -m "docs(phase3): add tier-3 evaluation report and layout primitives sign-off"`
