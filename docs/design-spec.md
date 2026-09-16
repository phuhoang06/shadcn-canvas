# Specification: shadcn-canvas (Deep Fusion)

> **Mục tiêu:** Xây dựng một ứng dụng web mã nguồn mở kết hợp giữa động cơ Canvas tương tác đa màn hình của `m3e-canvas` và hệ thống linh kiện chuẩn mực `shadcn/ui` của `ui-builder`.

---

## 1. Kiến trúc tổng quan (System Architecture)

- **Tên dự án:** `shadcn-canvas`
- **Tech Stack:**
  - **Framework:** Next.js 15+ (App Router), React 19, TypeScript
  - **Styling:** Tailwind CSS, `tailwindcss-animate`, CSS Variables (HSL theme tokens)
  - **Component Primitives:** `@radix-ui/*`, `class-variance-authority` (cva), `clsx`, `tailwind-merge`
  - **Icons:** `lucide-react`
  - **Animation:** `motion` (Framer Motion)
  - **State Management:** LocalStorage persistence, Client-side state

---

## 2. Các phân hệ cốt lõi (Core Modules)

### 2.1. Canvas Engine (`components/canvas/`)
- **Bảng vẽ vô cực (Infinite Canvas):** Hỗ trợ Pan, Zoom, Fit view, Grid snap (4dp/8dp/16dp).
- **Đa màn hình (Multi-Screen Frame System):**
  - Hỗ trợ màn hình Desktop mặc định (`1280 × 800`) và màn hình Mobile (`412 × 892`).
  - Cho phép đặt nhiều màn hình cạnh nhau, di chuyển toàn bộ màn hình hoặc từng linh kiện.
- **Mô phỏng luồng (Interactive Flow & Transitions):**
  - Nối luồng từ linh kiện kích hoạt (Button, Nav item, Card) sang màn hình đích.
  - Hiển thị đường mũi tên kết nối trên canvas.
  - Chế độ **Preview Modal**: Trải nghiệm bấm thử luồng chuyển trang (Slide, Fade, Scale).

### 2.2. Hệ thống linh kiện shadcn (`components/nodes/ShadcnNode.tsx`)
Thay thế hoàn toàn Material 3 bằng các component chuẩn của `shadcn/ui`:
- **Navigation:** `Sidebar` (Dashboard layout), `Navbar`, `Tabs`, `Breadcrumb`.
- **Containers:** `Card` (Header, Title, Description, Content, Footer).
- **Actions:** `Button` (default, destructive, outline, secondary, ghost, link).
- **Data & Tables:** `Table / DataTable` (cột, hàng dữ liệu demo, phân trang).
- **Forms & Inputs:** `Input`, `Textarea`, `Select / DropdownMenu`, `Switch`, `Checkbox`, `Slider`.
- **Feedback & Overlays:** `Dialog`, `Sheet` (drawer trượt từ cạnh), `Badge`, `Avatar`.

### 2.3. Dual Export Engine (Đầu ra Kép)
1. **AI Vibe-Coding Prompt Generator (`lib/prompt.ts`):**
   - Phân tích cấu trúc các màn hình và sinh bản mô tả tự nhiên chuẩn xác:
     *"Build a Next.js App Router application using Tailwind CSS and shadcn/ui. Page 1 includes `<Sidebar>`, `<DataTable>`... Clicking row triggers transition to Page 2..."*
   - Cung cấp prompt hoàn chỉnh để đưa thẳng vào Cursor, Claude Code, Gemini CLI.
2. **React TSX Code Exporter (`lib/codegen.ts`):**
   - Xuất file `.tsx` sạch, chuẩn cấu trúc component React + Tailwind.
   - Kèm theo danh sách lệnh `npx shadcn@latest add <components>` tương ứng.

### 2.4. Khả năng tương tác với AI Agent (`public/agent.md`)
- Hỗ trợ giao thức link nén URL (`#docz=...`).
- AI Agent chạy trong terminal có thể tự động phác thảo bản vẽ và trả về link cho người dùng mở trên trình duyệt.

---

## 3. Cấu trúc thư mục dự án

```
shadcn-canvas/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css          # shadcn/ui color tokens & Tailwind
│   └── Editor.tsx           # Main workspace orchestration
├── components/
│   ├── canvas/              # Infinite canvas, frames, arrows
│   ├── nodes/               # ShadcnNode renderer
│   ├── ui/                  # shadcn/ui component primitives (Button, Card, Table...)
│   ├── panels/              # Inspector, Layers, Theme, Export dialog
│   └── preview/             # Interactive flow simulator
├── lib/
│   ├── tokens.ts            # Layout math, screen presets, component types
│   ├── prompt.ts            # Vibe-coding prompt builder
│   ├── codegen.ts           # React TSX export generator
│   └── share.ts             # Compressed URL encoder/decoder
├── docs/
│   └── design-spec.md
└── reference/               # Original repos (m3e-canvas, ui-builder)
```
