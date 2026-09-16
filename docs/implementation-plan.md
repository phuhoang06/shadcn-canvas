# shadcn-canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng ứng dụng web `shadcn-canvas` tại `/home/hp/Desktop/shadcn-canvas`, hợp nhất động cơ Canvas tương tác đa màn hình của `m3e-canvas` với hệ thống linh kiện chuẩn `shadcn/ui` của `ui-builder`.

**Architecture:** Next.js App Router với Tailwind CSS, Radix UI primitives, Lucide Icons. Canvas quản lý danh sách màn hình (Frames) và linh kiện (Items) trong một JSON document, render các component shadcn bằng `ShadcnNode`, hỗ trợ nối luồng tương tác và xuất ra cả AI Prompt lẫn React TSX code.

**Tech Stack:** Next.js 15+, React 19, Tailwind CSS, Lucide React, Radix UI, Framer Motion (`motion/react`).

---

### Task 1: Scaffolding Base Project & Dependencies
**Files:**
- Create: `/home/hp/Desktop/shadcn-canvas/package.json`
- Create: `/home/hp/Desktop/shadcn-canvas/tsconfig.json`
- Create: `/home/hp/Desktop/shadcn-canvas/next.config.ts`
- Create: `/home/hp/Desktop/shadcn-canvas/postcss.config.mjs`
- Create: `/home/hp/Desktop/shadcn-canvas/app/globals.css`
- Create: `/home/hp/Desktop/shadcn-canvas/app/layout.tsx`

- [ ] **Step 1: Tạo `package.json`** với đầy đủ dependencies từ cả 2 dự án.
- [ ] **Step 2: Cấu hình `tsconfig.json` và `next.config.ts`** với path alias `@/*`.
- [ ] **Step 3: Cấu hình `app/globals.css`** chứa toàn bộ CSS variables HSL của shadcn/ui.
- [ ] **Step 4: Chạy `npm install`** để cài đặt thư viện.

---

### Task 2: Tích hợp thư viện Component Primitives của shadcn/ui
**Files:**
- Copy từ `reference/ui-builder/components/ui/` sang `/home/hp/Desktop/shadcn-canvas/components/ui/`:
  - `button.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, `table.tsx`, `dialog.tsx`, `sheet.tsx`, `tabs.tsx`, `badge.tsx`, `avatar.tsx`, `switch.tsx`, `checkbox.tsx`, `slider.tsx`, `dropdown-menu.tsx`, `select.tsx`, `separator.tsx`.
- Create: `/home/hp/Desktop/shadcn-canvas/lib/utils.ts` (chứa hàm `cn`).

- [ ] **Step 1: Tạo `lib/utils.ts`** với `clsx` và `tailwind-merge`.
- [ ] **Step 2: Sao chép các component core của shadcn** từ `reference/ui-builder`.
- [ ] **Step 3: Kiểm tra biên dịch TypeScript (`npx tsc --noEmit`)** đảm bảo không lỗi kiểu dữ liệu.

---

### Task 3: Chuyển đổi Tokens & Geometry cho Canvas
**Files:**
- Create: `/home/hp/Desktop/shadcn-canvas/lib/tokens.ts`
  - Định nghĩa kích thước mặc định: `DESKTOP_W = 1280, DESKTOP_H = 800`, `PHONE_W = 412, PHONE_H = 892`.
  - Định nghĩa danh sách các `Kind`: `button`, `card`, `table`, `sidebar`, `navbar`, `input`, `select`, `dialog`, `badge`, `tabs`, `avatar`, `switch`, `checkbox`.

- [ ] **Step 1: Viết `lib/tokens.ts`** với đầy đủ định nghĩa kiểu `Item`, `Frame`, `Document`.
- [ ] **Step 2: Viết logic căn chỉnh tự động (Tidy)** phù hợp với lưới 16dp của web desktop.

---

### Task 4: Xây dựng Canvas Node Renderer (`ShadcnNode.tsx`)
**Files:**
- Create: `/home/hp/Desktop/shadcn-canvas/components/nodes/ShadcnNode.tsx`
- Replace logic vẽ Material 3 cũ bằng các component React shadcn thật.

- [ ] **Step 1: Viết hàm render linh kiện Button & Badge** (hỗ trợ variants: default, destructive, outline, secondary, ghost).
- [ ] **Step 2: Viết hàm render Card** (với Header, Title, Content linh hoạt).
- [ ] **Step 3: Viết hàm render Form Controls** (Input, Textarea, Select, Switch, Checkbox).
- [ ] **Step 4: Viết hàm render Desktop Sidebar & Navbar** (tự động điều chỉnh khi đổi kích thước màn hình).
- [ ] **Step 5: Viết hàm render DataTable / Table** với dữ liệu mẫu trực quan.

---

### Task 5: Xây dựng Workspace & Giao diện Canvas (`app/Editor.tsx` & `app/page.tsx`)
**Files:**
- Create: `/home/hp/Desktop/shadcn-canvas/app/Editor.tsx`
- Create: `/home/hp/Desktop/shadcn-canvas/app/page.tsx`
- Create: `/home/hp/Desktop/shadcn-canvas/components/panels/PartsPalette.tsx` (Thanh chọn linh kiện bên trái)
- Create: `/home/hp/Desktop/shadcn-canvas/components/panels/Inspector.tsx` (Bảng chỉnh sửa thuộc tính bên phải)

- [ ] **Step 1: Xây dựng Canvas Board** (hỗ trợ Pan, Zoom, tạo màn hình Desktop/Mobile mới).
- [ ] **Step 2: Tích hợp PartsPalette** chứa danh mục các linh kiện shadcn để kéo thả.
- [ ] **Step 3: Tích hợp Inspector** cho phép đổi variant nút, nhãn chữ, màu sắc, target liên kết trang.
- [ ] **Step 4: Tích hợp Preview Mode** cho phép click vào nút để trượt/fade sang màn hình đích.

---

### Task 6: Triển khai Dual Export Engine (Prompt & TSX Code)
**Files:**
- Create: `/home/hp/Desktop/shadcn-canvas/lib/prompt.ts`
- Create: `/home/hp/Desktop/shadcn-canvas/lib/codegen.ts`
- Create: `/home/hp/Desktop/shadcn-canvas/components/panels/ExportModal.tsx`

- [ ] **Step 1: Viết `lib/prompt.ts`** để chuyển đổi toàn bộ frames & items thành prompt tiếng Anh/Việt chuẩn cho Cursor / Claude Code.
- [ ] **Step 2: Viết `lib/codegen.ts`** để xuất mã nguồn React TSX sạch gồm các import `shadcn/ui` và JSX layout.
- [ ] **Step 3: Tích hợp `ExportModal`** có 2 tab: "Copy Vibe Prompt" và "Copy React TSX Code".

---

### Task 7: Kiểm thử toàn diện & Khởi chạy ứng dụng
- [ ] **Step 1: Chạy `npm run build`** để kiểm tra tính toàn vẹn của mã nguồn.
- [ ] **Step 2: Chạy `npm run dev`** và xác nhận giao diện hoạt động mượt mà tại `http://localhost:3000`.
- [ ] **Step 3: Báo cáo kết quả và bàn giao cho người dùng.**
