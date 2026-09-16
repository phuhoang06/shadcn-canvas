# Design Spec: shadcn-canvas Phase 1 (POC - Button & Card)

**Date:** 2026-09-16  
**Status:** Approved for Implementation  
**Approach:** Option A - Adapter Layer (Preserves M3E Core, Minimal Surface Friction)

---

## 1. Executive Summary & Goals

The objective of Phase 1 is to build a minimal, high-fidelity **Proof of Concept (POC)** that verifies the core technical hypotheses of combining `m3e-canvas` and `shadcn/ui` before committing to a full refactor.

### 1.1 Goals
1. **Component Rendering in Canvas:** Render real `Button` and `Card` components from `shadcn/ui` (Tailwind CSS v3/v4 + Radix) inside M3E's coordinate and drag-drop canvas without layout collapse or event bubbling interference.
2. **Inspector Property Editing:** Allow editing shadcn-specific props in the canvas Inspector panel:
   - **Button:** `variant` (`default`, `outline`, `secondary`, `destructive`, `ghost`, `link`), `size` (`default`, `sm`, `lg`), `label`.
   - **Card:** `title`, `description`, `content`.
3. **AST / JSX Code Generation:** Implement an initial `lib/codegen.ts` compiler that turns canvas frame items into valid, copy-pasteable Next.js / React TSX with proper component imports and Tailwind layout styles.
4. **Architectural Friction Measurement:** Quantify exact touch points in the M3E codebase, measure build/render overhead, and evaluate developer ergonomics.
5. **Legal & Attribution Compliance:** Retain MIT licenses and Google's `NOTICE` file credit for `material-components-android`.

### 1.2 Non-Goals for Phase 1
- Full porting of all 40+ shadcn components (deferred to Phase 3).
- Complete eradication of Material 3 math/tokens from the canvas engine (deferred to Phase 2).
- Dynamic nested component hierarchies (cards inside cards).
- Complex custom theme token generators.

---

## 2. Architecture & Data Model

### 2.1 File & Directory Structure
```
shadcn-canvas/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css                # Tailwind base + shadcn HSL CSS variables
│   └── Editor.tsx                 # Adapted M3E canvas editor
├── components/
│   ├── ui/                        # Authentic shadcn/ui primitives
│   │   ├── button.tsx
│   │   └── card.tsx
│   ├── nodes/
│   │   └── ShadcnNode.tsx         # Adapter component rendering shadcn in canvas
│   ├── M3Node.tsx                 # Existing canvas renderer with delegation to ShadcnNode
│   └── Inspector.tsx              # Extended property panel
├── lib/
│   ├── tokens.ts                  # Extended Item type with shadcnProps
│   ├── codegen.ts                 # React TSX AST/string code generator
│   └── utils.ts                   # clsx + twMerge helper (cn)
├── NOTICE                         # Google credit preserved
├── LICENSE                        # MIT
└── docs/
    └── superpowers/specs/2026-09-16-shadcn-canvas-poc-design.md
```

### 2.2 Data Model Extensions (`lib/tokens.ts`)

Instead of breaking existing M3 types, we introduce an adapter extension to `Item`:

```typescript
export type ShadcnButtonProps = {
  variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size: "default" | "sm" | "lg";
  label: string;
};

export type ShadcnCardProps = {
  title: string;
  description?: string;
  content: string;
};

export type ShadcnKind = "shadcn_button" | "shadcn_card";

export interface Item {
  // Existing fields retained for canvas positioning & backwards compatibility:
  id: string;
  kind: Kind | ShadcnKind;
  label: string;
  // ... existing fields ...
  
  // Adapter extension:
  shadcnProps?: ShadcnButtonProps | ShadcnCardProps;
}
```

### 2.3 Rendering Pipeline (`components/nodes/ShadcnNode.tsx`)

`M3Node.tsx` delegates any item whose `kind` starts with `shadcn_` to `ShadcnNode`:

```typescript
export function ShadcnNode({ item }: { item: Item }) {
  if (item.kind === "shadcn_button") {
    const props = item.shadcnProps as ShadcnButtonProps;
    return (
      <Button variant={props.variant} size={props.size}>
        {props.label || item.label}
      </Button>
    );
  }
  if (item.kind === "shadcn_card") {
    const props = item.shadcnProps as ShadcnCardProps;
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
          {props.description && <CardDescription>{props.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p>{props.content}</p>
        </CardContent>
      </Card>
    );
  }
  return null;
}
```

### 2.4 TSX Code Generator (`lib/codegen.ts`)

A dedicated code serializer translates frames and groups into a clean React component:

1. **Imports Analysis:** Scans frame items; if `shadcn_button` is present, adds `import { Button } from "@/components/ui/button"`. If `shadcn_card` is present, adds `import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"`.
2. **Layout Wrapper:** Generates a parent container using Tailwind CSS flex/grid layout matching the frame's dimensions and orientation.
3. **Component Generation:**
   - Emits `<Button variant="..." size="...">...</Button>`
   - Emits `<Card>...<CardHeader>...<CardTitle>...</CardTitle></CardHeader><CardContent>...</CardContent></Card>`
4. **Formatting:** Outputs clean, indented JSX with no canvas-specific artifacts (`dp`, `snap`, `m3-colors`).

---

## 3. Verification & Acceptance Criteria

| Criteria | Verification Method | Expected Result |
| :--- | :--- | :--- |
| **Dependencies & Build** | `npm run build` | Zero TypeScript errors, clean Next.js build. |
| **Canvas Palette** | Visual test in browser | "Shadcn Button" and "Shadcn Card" appear in Parts Palette. |
| **Drag & Snapping** | Dragging nodes onto Frame | Nodes position correctly, follow frame bounds, snap to grid. |
| **Inspector Controls** | Selecting Button/Card | Inspector updates variant/size/labels; edits immediately reflect on canvas. |
| **TSX Export** | Clicking "Export TSX" | Dialog opens with syntax-highlighted React code and a "Copy" button. |
| **Code Usability** | Copying code to a fresh page | Code compiles and renders identically in a standard shadcn project. |
| **Attribution** | `ls -la NOTICE` | Google `material-components-android` credit preserved. |

---

## 4. Risks & Mitigations

1. **Tailwind CSS vs Canvas Coordinates:**
   - *Risk:* Tailwind's standard box-sizing and padding might conflict with M3E's strict pixel bounding boxes (`H = 56`).
   - *Mitigation:* In `ShadcnAdapterNode`, normalize sizing using explicit wrapper constraints or standard Tailwind classes (`h-auto w-full`).
2. **Mouse Event Interception:**
   - *Risk:* Radix Button click events might intercept canvas selection / drag gestures.
   - *Mitigation:* Ensure canvas drag handlers operate at the wrapper layer with `pointer-events: none` on children during edit mode, or standard event bubbling control.
