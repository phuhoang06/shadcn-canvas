# Phase 3 Tier 2 Implementation Plan: In-Flow Form Controls & Drag Conflict Isolation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mở rộng Phase 3 với 6 linh kiện Form Controls cốt lõi (In-Flow DOM): `Checkbox`, `Switch`, `Slider`, `RadioGroup`, `Label`, và `Avatar`. Giải quyết triệt để rủi ro xung đột Pointer Event giữa thao tác kéo Thumb của `Slider` và thao tác kéo `CanvasNode` trên canvas tự do.

**Architecture:** 
- Next.js 16 (Turbopack), React 19, Radix UI Primitives, Tailwind CSS v4.
- Pointer Event Isolation: Ngăn chặn hiện tượng `pointerdown` trên `Slider.Thumb` và các interactive controls bị nổi bọt (bubble) lên container `motion.div`, tránh kích hoạt nhầm cơ chế kéo node (`d.active = true`) của canvas.
- Hierarchical Renderer: Duyệt đệ quy cây AST cho các component đơn lẻ và component tổ hợp (`RadioGroup` -> `RadioGroupItem`, `Avatar` -> `AvatarImage` + `AvatarFallback`).
- AST Codegen: Tuần tự hóa sạch 100% vào các module `@/components/ui/*` tương ứng.

**Tech Stack:** `@radix-ui/react-checkbox`, `@radix-ui/react-switch`, `@radix-ui/react-slider`, `@radix-ui/react-radio-group`, `@radix-ui/react-label`, `@radix-ui/react-avatar`, Chrome DevTools Protocol (CDP).

---

### Task 1: Thiết Kế & Kiểm Chứng Cơ Chế Cách Ly Pointer Event (Slider Drag vs Canvas Drag)

**Files:**
- Modify: `components/renderers/HierarchicalNodeRenderer.tsx`

- [ ] **Step 1: Phân tích cơ chế bắt sự kiện:** Container `motion.div` trong `M3Node.tsx` gắn `onPointerDown={onPointerDown}` gọi `onItemPointerDown` trong `Editor.tsx`. Bất kỳ `pointermove` nào vượt ngưỡng 5px sẽ kích hoạt kéo node (`d.active = true`).
- [ ] **Step 2: Triển khai Pointer Isolation Wrapper:** Trong `HierarchicalNodeRenderer.tsx`, bổ sung hàm trợ giúp chặn sự kiện nổi bọt `onPointerDown={(e) => { e.stopPropagation(); onSelectLayer?.(layer.id); }}` cho các linh kiện có thao tác drag/input cục bộ.
- [ ] **Step 3: Commit thiết kế:** `git commit -m "feat(renderers): implement pointer event isolation helper for interactive canvas controls"`

---

### Task 2: Cài Đặt Dependencies & Port 6 Form Control Components

**Files:**
- Modify: `package.json`
- Create: `components/ui/checkbox.tsx`
- Create: `components/ui/switch.tsx`
- Create: `components/ui/slider.tsx`
- Create: `components/ui/radio-group.tsx`
- Create: `components/ui/label.tsx`
- Create: `components/ui/avatar.tsx`

- [ ] **Step 1: Cài đặt dependencies mới:**
  `npm install @radix-ui/react-checkbox @radix-ui/react-switch @radix-ui/react-slider @radix-ui/react-radio-group @radix-ui/react-label @radix-ui/react-avatar`
- [ ] **Step 2: Port các components từ `reference/ui-builder/components/ui/`:**
  - `checkbox.tsx`
  - `switch.tsx`
  - `slider.tsx`
  - `radio-group.tsx`
  - `label.tsx`
  - `avatar.tsx`
- [ ] **Step 3: Chạy typecheck:** `npm run typecheck` đảm bảo không có lỗi biên dịch.
- [ ] **Step 4: Commit:** `git commit -m "feat(components): port shadcn form controls (checkbox, switch, slider, radio-group, label, avatar)"`

---

### Task 3: Đăng Ký Registry Definitions & Tokens Cho 6 Linh Kiện

**Files:**
- Modify: `lib/registry/definitions.ts`
- Modify: `lib/tokens.ts`

- [ ] **Step 1: Định nghĩa Schema & Default Children trong `lib/registry/definitions.ts`:**
  - `Checkbox`: checked, defaultChecked, disabled.
  - `Switch`: checked, defaultChecked, disabled.
  - `Slider`: defaultValue, min, max, step, disabled.
  - `RadioGroup` & `RadioGroupItem`: defaultValue, value, disabled.
  - `Label`: children, htmlFor.
  - `Avatar`, `AvatarImage`, `AvatarFallback`: src, alt, fallback text.
- [ ] **Step 2: Cập nhật Tokens trong `lib/tokens.ts`:**
  - Bổ sung `shadcnCheckbox`, `shadcnSwitch`, `shadcnSlider`, `shadcnRadioGroup`, `shadcnLabel`, `shadcnAvatar` vào `Kind`, `KIND_SPEC`, `KIND_ORDER`, và `makeItem`.
- [ ] **Step 3: Commit:** `git commit -m "feat(registry): register definitions and tokens for form control components"`

---

### Task 4: Cập Nhật Hierarchical Renderer & Codegen

**Files:**
- Modify: `components/renderers/HierarchicalNodeRenderer.tsx`
- Modify: `lib/codegen.ts`

- [ ] **Step 1: Thêm nhánh render đệ quy cho cả 6 linh kiện** trong `HierarchicalNodeRenderer.tsx` với đầy đủ xử lý `interactive` và `onSelectLayer`.
- [ ] **Step 2: Cập nhật `lib/codegen.ts`:** Khai báo mapping module tương ứng cho 6 file components mới.
- [ ] **Step 3: Kiểm tra build:** `npm run typecheck` và `npm run build`.
- [ ] **Step 4: Commit:** `git commit -m "feat(renderers): add recursive rendering and codegen for tier 2 form controls"`

---

### Task 5: Kiểm Nghiệm Thực Nghiệm CDP (Slider Drag vs Canvas Drag Isolation)

**Files:**
- Test via Chrome DevTools Protocol (CDP)
- Create artifact: `tier-2-form-controls-evidence.md`

- [ ] **Step 1: Test tương tác Slider Thumb qua CDP:**
  - Giả lập `pointerdown` trên Slider Thumb, kéo chuột 50px theo trục hoành (`pointermove`), sau đó `pointerup`.
  - Đo tọa độ của `CanvasNode` trước và sau thao tác: xác nhận Node **không bị di chuyển** ($dx_{node} = 0.00\text{px}$).
  - Đo vị trí của Thumb: xác nhận Slider value đã cập nhật thành công.
- [ ] **Step 2: Test Checkbox, Switch, RadioGroup:** Bấm thử nghiệm qua sự kiện click và ghi nhận thay đổi DOM `data-state` / `aria-checked`.
- [ ] **Step 3: Chụp ảnh màn hình đối chứng và lập bảng dữ liệu trong `tier-2-form-controls-evidence.md`.**
- [ ] **Step 4: Commit tài liệu:** `git commit -m "test(cdp): verify slider drag isolation and form control interactivity"`

---

### Task 6: Báo Cáo Nghiệm Thu Tier 2 & Verification Sign-Off

**Files:**
- Create: `docs/phase-3-tier-2-report.md`

- [ ] **Step 1: Soạn thảo báo cáo nghiệm thu `docs/phase-3-tier-2-report.md`.**
- [ ] **Step 2: Chạy full verification:** `npm run typecheck && npm run build` đạt exit code 0.
- [ ] **Step 3: Commit:** `git commit -m "docs(phase3): add tier-2 evaluation report and form control verification"`
