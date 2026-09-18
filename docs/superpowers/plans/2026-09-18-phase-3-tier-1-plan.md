# Phase 3 Tier 1 Implementation Plan: Dialog Unwrapped Frame, DropdownMenu Nested Portals & Tooltip

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Giải quyết dứt điểm nợ kỹ thuật Dialog lookalike mock bằng Unwrapped Primitive Frame; cài đặt và kiểm nghiệm thực nghiệm rủi ro kiến trúc số 1 của Phase 3 là `DropdownMenu` với Nested Portals (portal lồng trong portal) dưới các mức zoom cực đoan; tích hợp `Tooltip` theo Universal Popper Invariant.

**Architecture:** 
- Next.js 16 (Turbopack), React 19, Radix UI Primitives, Tailwind CSS v4.
- Unwrapped Primitive Content cho Dialog: bỏ qua `DialogPortal` và `DialogOverlay`, chuyển CSS fixed sang relative khi render ở Edit Mode để dùng 100% markup thật.
- Nested Portal Scale Handler: kiểm chứng và áp dụng Universal Popper Invariant (`(offset ?? 4) * zoom`, `scale(zoom)`) cho cả menu cấp 1 (`DropdownMenuContent`) và menu con cấp 2 (`DropdownMenuSubContent`), đo đạc chống double-scaling.
- Codegen: tuần tự hóa đệ quy sạch 100% vào `@/components/ui/dropdown-menu` và `@/components/ui/tooltip`.

**Tech Stack:** Next.js 16, React 19, Radix UI (`@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip`, `@radix-ui/react-dialog`), Chrome DevTools Protocol (CDP).

---

### Task 1: Refactor Dialog sang Unwrapped Primitive Frame (Xóa bỏ Mock Lookalike)

**Files:**
- Modify: `components/ui/dialog.tsx`
- Modify: `components/renderers/HierarchicalNodeRenderer.tsx`

- [x] **Step 1: Mở rộng `components/ui/dialog.tsx`** hỗ trợ prop `isFrame?: boolean` trên `DialogContent`. Khi `isFrame === true`, chỉ render `<DialogPrimitive.Content>` với class `relative grid w-full gap-4 border bg-background p-6 shadow-sm rounded-lg` mà KHÔNG bọc `<DialogPortal>` hay `<DialogOverlay>`.
- [x] **Step 2: Cập nhật `HierarchicalNodeRenderer.tsx`** tại nhánh `layer.type === "DialogContent" && renderMode === "edit"`: thay thế thẻ `div` mock lookalike bằng `<DialogContent isFrame={true} className={props.className}>{renderChildren()}</DialogContent>`.
- [x] **Step 3: Chạy typecheck và kiểm tra CDP** tại `http://localhost:3000` để xác nhận Dialog Edit Mode render chuẩn xác với markup của Radix DialogContent thật.
- [x] **Step 4: Commit thay đổi:** `git commit -m "refactor(dialog): implement unwrapped primitive frame removing lookalike mock"`

---

### Task 2: Cài đặt Dependencies & Port Components (`DropdownMenu` & `Tooltip`)

**Files:**
- Modify: `package.json` (cần user xác nhận trước khi chạy `npm install`)
- Create: `components/ui/dropdown-menu.tsx`
- Create: `components/ui/tooltip.tsx`

- [x] **Step 1: Cài đặt dependencies mới:**
  `npm install @radix-ui/react-dropdown-menu @radix-ui/react-tooltip` (sau khi user đồng ý).
- [x] **Step 2: Port `dropdown-menu.tsx`** từ `reference/ui-builder/components/ui/dropdown-menu.tsx`. Tích hợp `usePopperZoom()` vào `DropdownMenuContent` và `DropdownMenuSubContent`.
- [x] **Step 3: Port `tooltip.tsx`** từ `reference/ui-builder/components/ui/tooltip.tsx`. Tích hợp `usePopperZoom()` vào `TooltipContent`.
- [x] **Step 4: Chạy `npm run typecheck`** đảm bảo không có lỗi biên dịch.
- [x] **Step 5: Commit thay đổi:** `git commit -m "feat(components): port dropdown-menu and tooltip with popper zoom adapters"`

---

### Task 3: Đăng ký Registry Definitions & Tokens cho DropdownMenu & Tooltip

**Files:**
- Modify: `lib/registry/definitions.ts`
- Modify: `lib/tokens.ts`

- [x] **Step 1: Cấu hình Registry Definitions (`lib/registry/definitions.ts`):**
  - Thêm `DropdownMenu` (root), `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`.
  - Khởi tạo `defaultChildren` của DropdownMenu chứa sẵn 1 Submenu lồng nhau (để có thể test ngay nested portal).
  - Thêm `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`.
- [x] **Step 2: Cập nhật Tokens (`lib/tokens.ts`):**
  - Bổ sung `"shadcnDropdownMenu"` và `"shadcnTooltip"` vào `Kind`, `KIND_SPEC`, `KIND_ORDER`, và `makeItem`.
- [x] **Step 3: Commit thay đổi:** `git commit -m "feat(registry): add dropdown-menu and tooltip component definitions"`

---

### Task 4: Cập nhật Hierarchical Renderer & Codegen

**Files:**
- Modify: `components/renderers/HierarchicalNodeRenderer.tsx`
- Modify: `lib/codegen.ts`

- [x] **Step 1: Viết logic render đệ quy cho DropdownMenu** trong `HierarchicalNodeRenderer.tsx` hỗ trợ trigger, content, sub-trigger, sub-content.
- [x] **Step 2: Viết logic render đệ quy cho Tooltip** trong `HierarchicalNodeRenderer.tsx`.
- [x] **Step 3: Bổ sung mapping module imports** trong `lib/codegen.ts` cho `@/components/ui/dropdown-menu` và `@/components/ui/tooltip`.
- [x] **Step 4: Chạy `npm run typecheck` và `npm run build`** đảm bảo export TSX sạch.
- [x] **Step 5: Commit thay đổi:** `git commit -m "feat(renderers): recursive rendering and codegen for dropdown-menu and tooltip"`

---

### Task 5: Thực nghiệm Đo đạc CDP: Kiểm nghiệm Rủi ro Nested Portals & Invariant

**Files:**
- Test via headless Chrome CDP
- Create artifact: `nested-portal-evidence.md`

- [x] **Step 1: Test DropdownMenu cấp 1 dưới Zoom 50% & 20%:** Đo độ lệch tọa độ ($dx, dy$) và kích thước scale.
- [x] **Step 2: Test Submenu cấp 2 (Nested Portal) dưới Zoom 50% & 20% & 10%:**
  - Hover/click vào SubTrigger để kích hoạt SubContent.
  - Đo đạc bounding box của SubContent:
    - Xác minh có bị double-scaling ($zoom \times zoom$) hay không?
    - Xác minh mép trái của SubContent có bám chuẩn mép phải của SubTrigger không?
- [x] **Step 3: Chụp ảnh màn hình đối chứng và lập bảng số liệu sub-pixel trong `nested-portal-evidence.md`.**
- [x] **Step 4: Lưu trữ và phân tích dữ liệu thực nghiệm.**

---

### Task 6: Báo cáo Nghiệm thu Tier 1 & Cập nhật ADR

**Files:**
- Create: `docs/phase-3-tier-1-report.md`
- Modify: `/home/hp/Documents/ObsidianVault/Knowledge/ADR/ADR-001-canvas-zoom-portal-adapter.md` (ghi nhận kết quả kiểm nghiệm Review Criteria cho DropdownMenu)

- [x] **Step 1: Viết báo cáo nghiệm thu `docs/phase-3-tier-1-report.md`** đối chiếu các tiêu chí kết thúc của Tier 1.
- [x] **Step 2: Cập nhật Review Criteria trong ADR-001** với kết quả thực nghiệm của DropdownMenu.
- [x] **Step 3: Chạy full verification (`npm run typecheck && npm run build`)** kết thúc với exit code 0.
- [x] **Step 4: Commit:** `git commit -m "docs(phase3): add tier-1 evaluation report and nested portal findings"`
