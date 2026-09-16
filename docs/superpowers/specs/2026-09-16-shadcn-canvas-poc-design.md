# Design Spec: shadcn-canvas Phase 1 (POC - Button, Card & Select)

**Date:** 2026-09-16  
**Status:** Calibrated & Approved  
**Approach:** Option A - Adapter Layer with Portal Isolation Testing

---

## 1. Executive Summary & Critical Technical Questions

The objective of Phase 1 is a high-risk-first **Proof of Concept (POC)** that stress-tests the architectural friction between `m3e-canvas` (infinite canvas with CSS transform zoom/pan) and `shadcn/ui` (Tailwind CSS + Radix UI with floating portals).

### 1.1 The Core Deal-Breaker: Portal Positioning under Canvas Zoom/Pan
In `m3e-canvas`, the canvas viewport relies on CSS transforms:
```css
transform: translate(${view.x}px, ${view.y}px) scale(${view.z});
transform-origin: 0 0;
```
Components like Radix `Select`, `Popover`, `Dialog`, and `DropdownMenu` mount their overlay via React Portal into `document.body` by default. Under a CSS-transformed ancestor:
1. `getBoundingClientRect()` calculation in `@floating-ui/react-dom` / Radix Popper uses raw viewport coordinates, leading to **misaligned dropdowns** when `view.z !== 1.0` (e.g. zoom at 50% or 150%).
2. Portaling to `document.body` renders the dropdown at **100% scale**, creating a jarring visual bug where the canvas button is tiny (50% zoom) but the opened menu is massive (100%).
3. Panning the canvas (`view.x`, `view.y`) while a dropdown is open detaches the floating content from the trigger.

### 1.2 The 3 Target Components for Phase 1
- **`Button` (Atomic):** Tests basic Tailwind rendering, sizing variants (`sm`, `default`, `lg`), and the interaction conflict between **canvas node drag/select** vs **child button click**.
- **`Card` (Compound):** Tests structured container layout (`CardHeader`, `CardTitle`, `CardContent`), nested text wrapping, and width/height preset snapping.
- **`Select` (Portal-based Floating Primitive):** **The primary litmus test.** Tests whether Radix Portal can be contained within the canvas zoom container (`<Select.Portal container={canvasRef.current}>`) or if a non-portal / inline mode is necessary.

---

## 2. Go / No-Go Decision Gate

At the end of Phase 1, we execute the **Portal & Zoom Stress Test**:
- Open `Select` at **zoom = 100%**, **zoom = 50%**, and **zoom = 150%**.
- Open `Select` after panning canvas coordinates `(x: 200, y: -150)`.

| Outcome | Assessment | Next Step |
| :--- | :--- | :--- |
| **Pass (Green)** | `Select` content scales synchronously with `view.z` and aligns accurately to trigger. | Proceed directly to Phase 2 (Data Model & Registry). |
| **Fixable (Yellow)** | Default `document.body` portal breaks, but passing canvas frame ref as `container` or using inline content fixes it cleanly. | Document the adapter pattern for all future portal components, then proceed. |
| **Blocker (Red)** | Floating UI completely breaks under CSS transform with no viable container solution. | **STOP.** Do not proceed to Phase 2. Re-architect the canvas zoom engine (e.g. iframe isolation or SVG container) before touching data models. |

---

## 3. High-Level Roadmap & Effort Weighting

| Phase | Description | Effort Weight | Core Strategy |
| :--- | :--- | :---: | :--- |
| **Giai đoạn 1: POC (Hiện tại)** | Test 3 components (`Button`, `Card`, `Select`) + minimal TSX codegen. | 🟢 **Medium** | Focus on the Portal/Transform collision and interaction gating. |
| **Giai đoạn 2: Architecture & Registry** | Chuẩn hóa Data Model & Tích hợp Registry. | 🔴 **High (Nặng nhất)** | **Tái sử dụng & điều chỉnh** Registry (`shadcn-component-definitions.ts`) và Template Serializer của `ui-builder`, gắn thêm tọa độ x/y tự do của canvas thay vì viết mới từ 0. |
| **Giai đoạn 3: Component Library & Prototyping** | Port 30+ components, Multi-screen wiring, Interactive Preview. | 🟡 **Medium-High** | Lắp ráp theo khuôn mẫu đã chuẩn hóa từ Giai đoạn 2. |
| **Giai đoạn 4: Export Engine & Tooling** | Xuất dự án Next.js hoàn chỉnh & AI Vibe-coding prompts. | 🟢 **Low-Medium** | Hoàn thiện UX tải file zip / copy prompt. |

---

## 4. Technical Architecture for Phase 1

### 4.1 Data Model (`lib/tokens.ts`)
```typescript
export type ShadcnButtonProps = {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg";
  label?: string;
};

export type ShadcnCardProps = {
  title: string;
  description?: string;
  content: string;
};

export type ShadcnSelectProps = {
  placeholder?: string;
  options: { label: string; value: string }[];
  defaultValue?: string;
};

export type ShadcnKind = "shadcn_button" | "shadcn_card" | "shadcn_select";
```

### 4.2 Handling Click Conflict on Canvas
In edit mode:
- All child interactive elements (Button, Select trigger) operate under an event-capturing overlay or `pointer-events: none` on the inner component, ensuring clicks select/drag the node.
- Double-clicking or an explicit "Interact / Test" mode enables real clicks to test the Select dropdown and Button states.

### 4.3 Code Generation (`lib/codegen.ts`)
Generates clean React TSX including proper imports from `@/components/ui/button`, `@/components/ui/card`, and `@/components/ui/select`.
