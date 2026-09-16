# Shadcn Canvas POC (Button & Card) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal, working Proof-of-Concept for `shadcn-canvas` integrating real `shadcn/ui` `Button` and `Card` components into the `m3e-canvas` infinite canvas via an Adapter Layer, with inspector controls and a dedicated React TSX code generator.

**Architecture:** Option A (Adapter Layer) — Preserve the core coordinate canvas engine, zoom/pan, multi-frame, and drag-and-drop systems from `m3e-canvas`. Extend the `Item` data model with optional `shadcnProps`. Delegate rendering of `shadcn_*` items to a new `ShadcnNode` component. Implement an independent `lib/codegen.ts` compiler to serialize canvas items into clean, copyable React TSX.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Radix UI (`@radix-ui/react-slot`), `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `motion` (v13).

## Global Constraints
- Do not modify core canvas geometry math (`H = 56`, `GAP = 3`, etc.) in `lib/tokens.ts` to maintain upstream compatibility.
- Preserve Google attribution in root `NOTICE` file for `material-components-android`.
- All generated code must be valid TypeScript / TSX with standard `@/components/ui/...` imports.
- Zero external runtime script creation in user project directories.

---

### Task 1: Scaffolding Canvas Base & Preserving Attribution

**Files:**
- Create: `NOTICE`
- Copy: `app/*`, `components/*`, `lib/*`, `public/*` from `reference/m3e-canvas/`
- Modify: `package.json`, `tailwind.config.js` (or `app/globals.css`)
- Test: `npm run typecheck`

**Interfaces:**
- Produces: Working Next.js baseline with M3E canvas running on `http://localhost:3000`.

- [ ] **Step 1: Copy Google NOTICE file for legal attribution**
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
Add HSL color variables (`--background`, `--foreground`, `--primary`, `--secondary`, `--card`, etc.) to `app/globals.css`.

- [ ] **Step 5: Verify baseline compiles**
Run: `npm run build` or `npx tsc --noEmit`
Expected: 0 type errors.

- [ ] **Step 6: Commit**
```bash
git add NOTICE app/ components/ lib/ public/ package.json package-lock.json
git commit -m "chore: scaffold baseline canvas from m3e-canvas with attribution"
```

---

### Task 2: Port shadcn/ui Primitives (`Button` & `Card`)

**Files:**
- Create: `lib/utils.ts`
- Create: `components/ui/button.tsx`
- Create: `components/ui/card.tsx`
- Test: `components/ui/button.test.tsx` (or direct node smoke test)

**Interfaces:**
- Produces:
  - `cn(...inputs: ClassValue[]): string`
  - `Button` component with variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and sizes (`default`, `sm`, `lg`, `icon`).
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

- [ ] **Step 1: Create `lib/utils.ts`**
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Port `components/ui/button.tsx`**
Copy and adapt `reference/ui-builder/components/ui/button.tsx` to `components/ui/button.tsx`.

- [ ] **Step 3: Port `components/ui/card.tsx`**
Copy and adapt `reference/ui-builder/components/ui/card.tsx` to `components/ui/card.tsx`.

- [ ] **Step 4: Smoke test components via TypeScript typecheck**
Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**
```bash
git add lib/utils.ts components/ui/button.tsx components/ui/card.tsx
git commit -m "feat(ui): add shadcn button and card components"
```

---

### Task 3: Data Model Extension & `ShadcnNode` Adapter

**Files:**
- Modify: `lib/tokens.ts`
- Create: `components/nodes/ShadcnNode.tsx`
- Modify: `components/M3Node.tsx`
- Modify: `components/PartsPalette.tsx`

**Interfaces:**
- Consumes: `Button`, `Card` from `@/components/ui/*`, `Item` from `@/lib/tokens`.
- Produces:
  - `ShadcnButtonProps`, `ShadcnCardProps`, `ShadcnKind` in `lib/tokens.ts`.
  - `<ShadcnNode item={item} />` renderer.
  - Palette draggable triggers for `shadcn_button` and `shadcn_card`.

- [ ] **Step 1: Extend `lib/tokens.ts` with `ShadcnKind` and `shadcnProps`**
Add:
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

export type ShadcnKind = "shadcn_button" | "shadcn_card";
```
Extend `Kind` or item validator to support `ShadcnKind`.

- [ ] **Step 2: Create `components/nodes/ShadcnNode.tsx`**
Implement the adapter component wrapping `Button` and `Card`.
```typescript
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Item, ShadcnButtonProps, ShadcnCardProps } from "@/lib/tokens";

export function ShadcnNode({ item }: { item: Item }) {
  if (item.kind === "shadcn_button") {
    const props = (item.shadcnProps as ShadcnButtonProps) || {};
    return (
      <div className="w-full flex items-center justify-center p-1 pointer-events-none">
        <Button variant={props.variant || "default"} size={props.size || "default"}>
          {props.label || item.label || "Shadcn Button"}
        </Button>
      </div>
    );
  }
  if (item.kind === "shadcn_card") {
    const props = (item.shadcnProps as ShadcnCardProps) || {
      title: "Card Title",
      description: "Card description text",
      content: "Card content goes here."
    };
    return (
      <div className="w-full p-1 pointer-events-none">
        <Card className="w-full shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">{props.title || item.label}</CardTitle>
            {props.description && <CardDescription className="text-xs">{props.description}</CardDescription>}
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            {props.content}
          </CardContent>
        </Card>
      </div>
    );
  }
  return null;
}
```

- [ ] **Step 3: Integrate `ShadcnNode` into `components/M3Node.tsx`**
In `M3Node.tsx`, check if `item.kind.startsWith("shadcn_")`. If true, delegate rendering to `<ShadcnNode item={item} />`.

- [ ] **Step 4: Add Button & Card to `components/PartsPalette.tsx`**
Add draggable entries for "shadcn Button" and "shadcn Card" in the UI parts palette.

- [ ] **Step 5: Verify build**
Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit**
```bash
git add lib/tokens.ts components/nodes/ShadcnNode.tsx components/M3Node.tsx components/PartsPalette.tsx
git commit -m "feat(canvas): add ShadcnNode adapter and palette support for Button and Card"
```

---

### Task 4: Inspector Controls for shadcn Properties

**Files:**
- Modify: `components/Inspector.tsx`

**Interfaces:**
- Consumes: Selected `Item`, update callback `onUpdateItem(id, updates)`.
- Produces: Form controls for `variant`, `size`, `label` (Button) and `title`, `description`, `content` (Card).

- [ ] **Step 1: Add inspection section for `shadcn_button`**
Render a variant dropdown (`default`, `outline`, `secondary`, `destructive`, `ghost`), size dropdown (`sm`, `default`, `lg`), and label text input.

- [ ] **Step 2: Add inspection section for `shadcn_card`**
Render text inputs for `title`, `description`, and a textarea for `content`.

- [ ] **Step 3: Wire input changes to update `item.shadcnProps`**
Dispatch changes to parent editor state so canvas immediately re-renders with new props.

- [ ] **Step 4: Verify build**
Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**
```bash
git add components/Inspector.tsx
git commit -m "feat(inspector): add property controls for shadcn button and card"
```

---

### Task 5: React TSX Code Generator & Export Modal

**Files:**
- Create: `lib/codegen.ts`
- Create: `components/ExportTsxModal.tsx`
- Modify: `components/Toolbar.tsx`

**Interfaces:**
- Consumes: `Frame`, `Item[]` from canvas state.
- Produces:
  - `generateScreenTsx(frame: Frame, items: Item[]): string`
  - Export Modal with syntax-formatted TSX output and "Copy to Clipboard" button.

- [ ] **Step 1: Implement `lib/codegen.ts`**
```typescript
import { Frame, Item, ShadcnButtonProps, ShadcnCardProps } from "./tokens";

export function generateScreenTsx(frame: Frame, items: Item[]): string {
  const imports = new Set<string>();
  let hasButton = false;
  let hasCard = false;

  items.forEach((item) => {
    if (item.kind === "shadcn_button") hasButton = true;
    if (item.kind === "shadcn_card") hasCard = true;
  });

  const importStatements: string[] = ['"use client";\n', 'import React from "react";'];
  if (hasButton) importStatements.push('import { Button } from "@/components/ui/button";');
  if (hasCard) importStatements.push('import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";');

  const componentName = frame.name ? frame.name.replace(/[^a-zA-Z0-9]/g, "") + "Screen" : "CanvasScreen";

  const jsxElements = items.map((item) => {
    if (item.kind === "shadcn_button") {
      const p = (item.shadcnProps as ShadcnButtonProps) || {};
      const variantAttr = p.variant && p.variant !== "default" ? ` variant="${p.variant}"` : "";
      const sizeAttr = p.size && p.size !== "default" ? ` size="${p.size}"` : "";
      return `      <Button${variantAttr}${sizeAttr}>${p.label || item.label || "Button"}</Button>`;
    }
    if (item.kind === "shadcn_card") {
      const p = (item.shadcnProps as ShadcnCardProps) || { title: "Title", content: "Content" };
      return `      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>${p.title || item.label}</CardTitle>
          ${p.description ? `<CardDescription>${p.description}</CardDescription>` : ""}
        </CardHeader>
        <CardContent>
          <p>${p.content || ""}</p>
        </CardContent>
      </Card>`;
    }
    return `      {/* M3 fallback: ${item.kind} (${item.label}) */}`;
  });

  return `${importStatements.join("\n")}

export default function ${componentName}() {
  return (
    <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto">
${jsxElements.join("\n\n")}
    </div>
  );
}
`;
}
```

- [ ] **Step 2: Create `components/ExportTsxModal.tsx`**
Modal displaying the TSX code in a `<pre><code>` block with copy feedback.

- [ ] **Step 3: Add "Export TSX" action in `components/Toolbar.tsx`**
Clicking the button opens the modal for the currently selected or primary frame.

- [ ] **Step 4: Verify build**
Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**
```bash
git add lib/codegen.ts components/ExportTsxModal.tsx components/Toolbar.tsx
git commit -m "feat(codegen): implement TSX code generator and Export Modal"
```

---

### Task 6: Verification & Measurement Report

**Files:**
- Create: `docs/poc-evaluation-report.md`

**Interfaces:**
- Produces: Concrete measurement report detailing actual time, lines of code changed, friction points, and recommendations for Phase 2.

- [ ] **Step 1: End-to-end browser testing**
Run: `npm run dev`
Verify:
1. Dragging Button & Card onto canvas.
2. Changing props in Inspector.
3. Clicking "Export TSX" and copying code.
4. Testing copied TSX in a standalone Next.js project.

- [ ] **Step 2: Measure codebase friction**
Record:
- Number of M3E files modified.
- Sizing/drag-drop edge cases observed.
- Code generation limitations (e.g. nested layout handling).

- [ ] **Step 3: Write evaluation report to `docs/poc-evaluation-report.md`**
Summarize real data for the user.

- [ ] **Step 4: Commit**
```bash
git add docs/poc-evaluation-report.md
git commit -m "docs: add POC evaluation report and architectural friction findings"
```
