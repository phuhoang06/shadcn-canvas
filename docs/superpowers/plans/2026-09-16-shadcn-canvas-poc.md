# Shadcn Canvas POC (Button, Card & Select) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Proof-of-Concept for `shadcn-canvas` integrating 3 representative components (`Button` - atomic, `Card` - compound, and `Select` - portal-based floating primitive) to definitively answer whether Radix portals work under canvas zoom/pan CSS transforms, resolve click-vs-drag interaction conflicts, and establish minimal TSX code generation.

**Architecture:** Option A (Adapter Layer) — Keep the `m3e-canvas` zoom/pan engine. Extend `Item` with `shadcnProps`. Delegate rendering to `ShadcnNode`. For portal-based components (`Select`), test mounting via `<Select.Portal container={...}>` into the transformed canvas frame vs `document.body`. Provide a Go/No-Go decision gate based on zoom test results.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Radix UI (`@radix-ui/react-slot`, `@radix-ui/react-select`), `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `motion` (v13).

## Global Constraints
- Do not modify core canvas geometry math in `lib/tokens.ts`.
- Retain Google attribution in `NOTICE` for `material-components-android`.
- All generated code must be clean, valid TSX matching standard shadcn/ui syntax.
- Zero temporary script files in project folders.

---

### Task 1: Baseline Scaffolding & Legal Attribution

**Files:**
- Create: `NOTICE`
- Copy: `app/*`, `components/*`, `lib/*`, `public/*` from `reference/m3e-canvas/`
- Modify: `package.json`, `app/globals.css`
- Test: `npm run typecheck`

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

- [ ] **Step 3: Install dependencies**
```bash
cd /home/hp/Desktop/shadcn-canvas && npm install
```

- [ ] **Step 4: Configure Tailwind CSS variables for shadcn in `app/globals.css`**
Add HSL color variables (`--background`, `--foreground`, `--primary`, `--secondary`, `--card`, `--popover`, etc.) to `app/globals.css`.

- [ ] **Step 5: Verify baseline compiles**
Run: `npx tsc --noEmit`
Expected: 0 type errors.

- [ ] **Step 6: Commit**
```bash
git add NOTICE app/ components/ lib/ public/ package.json package-lock.json
git commit -m "chore: scaffold baseline canvas from m3e-canvas with attribution"
```

---

### Task 2: Port shadcn/ui Primitives (`Button`, `Card`, `Select`)

**Files:**
- Create: `lib/utils.ts`
- Create: `components/ui/button.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/select.tsx`
- Test: `npx tsc --noEmit`

- [ ] **Step 1: Create `lib/utils.ts`**
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Port `components/ui/button.tsx` from ui-builder**
Copy `reference/ui-builder/components/ui/button.tsx` to `components/ui/button.tsx`.

- [ ] **Step 3: Port `components/ui/card.tsx` from ui-builder**
Copy `reference/ui-builder/components/ui/card.tsx` to `components/ui/card.tsx`.

- [ ] **Step 4: Port `components/ui/select.tsx` from ui-builder**
Copy and adapt `reference/ui-builder/components/ui/select.tsx` to `components/ui/select.tsx`. Ensure `SelectContent` exposes a configurable `container` or can attach to parent context.

- [ ] **Step 5: Typecheck verification**
Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit**
```bash
git add lib/utils.ts components/ui/button.tsx components/ui/card.tsx components/ui/select.tsx
git commit -m "feat(ui): add shadcn button, card, and select primitives"
```

---

### Task 3: Data Model Extension & `ShadcnNode` with Portal Support

**Files:**
- Modify: `lib/tokens.ts`
- Create: `components/nodes/ShadcnNode.tsx`
- Modify: `components/M3Node.tsx`
- Modify: `components/PartsPalette.tsx`

- [ ] **Step 1: Extend `lib/tokens.ts`**
Define `ShadcnButtonProps`, `ShadcnCardProps`, `ShadcnSelectProps`, and `ShadcnKind = "shadcn_button" | "shadcn_card" | "shadcn_select"`. Add `shadcnProps?: ShadcnButtonProps | ShadcnCardProps | ShadcnSelectProps` to `Item`.

- [ ] **Step 2: Implement `components/nodes/ShadcnNode.tsx`**
Implement adapter rendering for `Button`, `Card`, and `Select`.
Address click vs drag conflict: in canvas edit mode, wrap the element with drag-selection handles or pass `interactive?: boolean`.

- [ ] **Step 3: Integrate into `M3Node.tsx`**
Delegate items with `kind.startsWith("shadcn_")` to `<ShadcnNode item={item} />`.

- [ ] **Step 4: Add Button, Card, and Select to `components/PartsPalette.tsx`**
Add draggable palette items under a new "shadcn/ui" category.

- [ ] **Step 5: Verify build**
Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit**
```bash
git add lib/tokens.ts components/nodes/ShadcnNode.tsx components/M3Node.tsx components/PartsPalette.tsx
git commit -m "feat(canvas): add ShadcnNode adapter supporting button, card, and select"
```

---

### Task 4: Inspector Controls for All 3 Components

**Files:**
- Modify: `components/Inspector.tsx`

- [ ] **Step 1: Add Button controls**
Controls for variant (`default`, `outline`, `destructive`, `secondary`, `ghost`), size (`default`, `sm`, `lg`), and label.

- [ ] **Step 2: Add Card controls**
Controls for title, description, and content text.

- [ ] **Step 3: Add Select controls**
Controls for placeholder and options list (add/edit option label & value).

- [ ] **Step 4: Verify build**
Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**
```bash
git add components/Inspector.tsx
git commit -m "feat(inspector): add property controls for button, card, and select"
```

---

### Task 5: React TSX Code Generator & Export Modal

**Files:**
- Create: `lib/codegen.ts`
- Create: `components/ExportTsxModal.tsx`
- Modify: `components/Toolbar.tsx`

- [ ] **Step 1: Implement `lib/codegen.ts`**
Generate valid TSX with proper imports from `@/components/ui/button`, `@/components/ui/card`, and `@/components/ui/select`. Format clean JSX layout.

- [ ] **Step 2: Implement `components/ExportTsxModal.tsx`**
Display formatted TSX in a syntax block with a "Copy Code" button.

- [ ] **Step 3: Add "Export TSX" button to `components/Toolbar.tsx`**
Wire button to open the Export Modal for the active screen.

- [ ] **Step 4: Verify build**
Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**
```bash
git add lib/codegen.ts components/ExportTsxModal.tsx components/Toolbar.tsx
git commit -m "feat(codegen): implement TSX generator for button, card, and select"
```

---

### Task 6: The Portal & Zoom Stress Test & Go/No-Go Decision Gate

**Files:**
- Create: `docs/poc-evaluation-report.md`

- [ ] **Step 1: Run dev server**
```bash
cd /home/hp/Desktop/shadcn-canvas && npm run dev
```

- [ ] **Step 2: Execute Portal & Zoom Stress Test**
1. Add `Select` to a frame on the canvas.
2. Test opening `Select` dropdown at:
   - Zoom = 100%
   - Zoom = 50%
   - Zoom = 150%
   - After panning canvas to (200px, -150px).
3. Document whether dropdown misaligns or fails to scale with the canvas.
4. If misaligned, test passing canvas frame container ref as `container` prop to `Select.Portal`.

- [ ] **Step 3: Test Click vs Drag Selection on Button**
Verify node selection vs button click behavior.

- [ ] **Step 4: Formal Go / No-Go Decision Gate Report**
Record findings in `docs/poc-evaluation-report.md`.
Determine if Phase 2 can proceed or if canvas transform architecture requires adjustment.

- [ ] **Step 5: Commit**
```bash
git add docs/poc-evaluation-report.md
git commit -m "docs: complete Phase 1 POC stress test and evaluation report"
```
