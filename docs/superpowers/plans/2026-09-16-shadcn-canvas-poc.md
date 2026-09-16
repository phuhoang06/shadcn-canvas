# Shadcn Canvas POC (Fail-Fast Priority) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (for Task 3-6) or inline execution (for Task 1-2). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Proof-of-Concept testing whether Radix UI portal-based components (`Select`) can scale and align correctly under canvas CSS transform zoom/pan, before implementing `Button`, `Card`, and TSX code generation.

**Architecture:** Option A (Adapter Layer). Task 2 is an **Early Go/No-Go Litmus Test** executed inline to visually confirm:
- **Tiêu chí (a) Tọa độ định vị:** Dropdown bám sát trigger, không lệch x/y ở zoom 50%, 100%, 150% và pan.
- **Tiêu chí (b) Tỷ lệ hiển thị:** Dropdown co giãn kích thước font/padding đồng bộ theo zoom canvas.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Radix UI (`@radix-ui/react-select`, `@radix-ui/react-slot`), `class-variance-authority`, `clsx`, `tailwind-merge`, `motion` (v13).

## Global Constraints
- Preserve Google attribution in `NOTICE`.
- Run Task 1 and Task 2 inline in this session to visually observe portal behavior.
- Stop at Task 2 Go/No-Go gate before proceeding to Task 3.

---

### Task 1: Baseline Scaffolding & Legal Attribution (Inline)

**Files:**
- Create: `NOTICE`
- Copy: `app/*`, `components/*`, `lib/*`, `public/*` from `reference/m3e-canvas/`
- Create: `lib/utils.ts`
- Modify: `package.json`, `app/globals.css`
- Test: `npx tsc --noEmit`

- [ ] **Step 1: Copy Google NOTICE file**
```bash
cp /home/hp/Desktop/shadcn-canvas/reference/m3e-canvas/NOTICE /home/hp/Desktop/shadcn-canvas/NOTICE
```

- [ ] **Step 2: Copy baseline source files from m3e-canvas**
```bash
cp -r /home/hp/Desktop/shadcn-canvas/reference/m3e-canvas/app /home/hp/Desktop/shadcn-canvas/
cp -r /home/hp/Desktop/shadcn-canvas/reference/m3e-canvas/components /home/hp/Desktop/shadcn-canvas/
cp -r /home/hp/Desktop/shadcn-canvas/reference/m3e-canvas/lib /home/hp/Desktop/shadcn-canvas/
cp -r /home/hp/Desktop/shadcn-canvas/reference/m3e-canvas/public /home/hp/Desktop/shadcn-canvas/
```

- [ ] **Step 3: Create `lib/utils.ts` (cn helper)**
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Install dependencies in root project**
```bash
cd /home/hp/Desktop/shadcn-canvas && npm install
```

- [ ] **Step 5: Configure shadcn HSL CSS variables in `app/globals.css`**
Merge shadcn theme variables with M3E global styling.

- [ ] **Step 6: Verify baseline compiles cleanly**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 7: Commit**
```bash
git add NOTICE app/ components/ lib/ public/ package.json package-lock.json
git commit -m "chore: scaffold baseline canvas with attribution and utils"
```

---

### Task 2: Portal & Zoom Litmus Test (Early Go / No-Go Gate) (Inline)

**Files:**
- Create: `components/ui/select.tsx`
- Modify: `app/Editor.tsx` (mount test Select on Frame 1)
- Test: Visual verification on `http://localhost:3000` at 50%, 100%, 150% zoom and pan

- [ ] **Step 1: Port `components/ui/select.tsx` from ui-builder**
Port standard Radix Select. Ensure `SelectContent` exposes `container` prop so it can attach to canvas frame ref or `document.body`.

- [ ] **Step 2: Mount test Select inside Frame 1 on canvas**
Place a test `<Select>` inside the active canvas frame in `app/Editor.tsx`.

- [ ] **Step 3: Start dev server**
Run: `npm run dev`

- [ ] **Step 4: Execute Stress Test across zoom levels**
1. Test default: `Select` with portal to `document.body` vs `Select` with portal to canvas container (`container={frameRef.current}`).
2. Measure:
   - **Tiêu chí (a) Tọa độ định vị:** Có dính sát trigger hay lệch x/y khi zoom 50%, 100%, 150% và pan không?
   - **Tiêu chí (b) Tỷ lệ hiển thị:** Dropdown có scale nhỏ lại 50% hoặc to lên 150% theo camera canvas không?

- [ ] **Step 5: Formal Go / No-Go Decision Checkpoint**
Report visual findings. If PASS / fixable with container ref ➔ Mark GO to Task 3. If FAIL ➔ STOP to re-architect zoom mechanism.

- [ ] **Step 6: Commit**
```bash
git add components/ui/select.tsx app/Editor.tsx
git commit -m "test(canvas): verify Radix Select portal behavior under canvas zoom and pan"
```

---

### Task 3: Port Button & Card + Click vs Drag Interaction (Subagent)

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/card.tsx`
- Modify: `components/ui/button.tsx` (support edit-mode pointer-events gating)

- [ ] **Step 1: Port `button.tsx` and `card.tsx`**
- [ ] **Step 2: Add interaction gating (click-to-select vs click-to-activate)**
- [ ] **Step 3: Verify build**
- [ ] **Step 4: Commit**

---

### Task 4: Data Model Extension & `ShadcnNode` Adapter (Subagent)

**Files:**
- Modify: `lib/tokens.ts`
- Create: `components/nodes/ShadcnNode.tsx`
- Modify: `components/M3Node.tsx`
- Modify: `components/PartsPalette.tsx`

- [ ] **Step 1: Extend `lib/tokens.ts` with `ShadcnButtonProps`, `ShadcnCardProps`, `ShadcnSelectProps`**
- [ ] **Step 2: Create `components/nodes/ShadcnNode.tsx`**
- [ ] **Step 3: Integrate into `M3Node.tsx` and `PartsPalette.tsx`**
- [ ] **Step 4: Verify build and commit**

---

### Task 5: Inspector Controls for All 3 Components (Subagent)

**Files:**
- Modify: `components/Inspector.tsx`

- [ ] **Step 1: Add controls for Button (variant, size, label)**
- [ ] **Step 2: Add controls for Card (title, description, content)**
- [ ] **Step 3: Add controls for Select (placeholder, options)**
- [ ] **Step 4: Verify build and commit**

---

### Task 6: TSX Codegen & Export Modal (Subagent)

**Files:**
- Create: `lib/codegen.ts`
- Create: `components/ExportTsxModal.tsx`
- Modify: `components/Toolbar.tsx`

- [ ] **Step 1: Implement `lib/codegen.ts` for Button, Card, and Select**
- [ ] **Step 2: Implement `components/ExportTsxModal.tsx`**
- [ ] **Step 3: Wire Export button in `components/Toolbar.tsx`**
- [ ] **Step 4: Final verification report & commit**
