import { describe, it, expect } from "vitest";
import { createDefaultLayer } from "./registry";
import { serializeLayer, generateTsx } from "./codegen";
import { buildPrompt } from "./prompt";
import { Doc } from "./tokens";

describe("New Complex Primitives: Skeleton, Progress, Breadcrumb", () => {
  it("creates default layer for Skeleton", () => {
    const layer = createDefaultLayer("Skeleton");
    expect(layer.type).toBe("Skeleton");
    expect(layer.props?.className).toBe("h-4 w-full");
    const tsx = serializeLayer(layer);
    expect(tsx).toContain("<Skeleton");
  });

  it("creates default layer for Progress", () => {
    const layer = createDefaultLayer("Progress");
    expect(layer.type).toBe("Progress");
    expect(layer.props?.value).toBe(60);
    const tsx = serializeLayer(layer);
    expect(tsx).toContain("<Progress");
    expect(tsx).toContain('value={60}');
  });

  it("creates default hierarchical layer for Breadcrumb", () => {
    const layer = createDefaultLayer("Breadcrumb");
    expect(layer.type).toBe("Breadcrumb");
    expect(Array.isArray(layer.children)).toBe(true);

    const tsx = serializeLayer(layer);
    expect(tsx).toContain("<Breadcrumb>");
    expect(tsx).toContain("<BreadcrumbList>");
    expect(tsx).toContain("<BreadcrumbLink");
    expect(tsx).toContain("<BreadcrumbPage>");
  });

  it("generates correct TSX imports and components", () => {
    const doc: Doc = {
      title: "Primitives App",
      frame: "phone",
      frames: [{ id: "f1", name: "PrimitivesScreen", x: 0, y: 0 }],
      groups: [
        {
          id: "g1",
          x: 20,
          y: 50,
          axis: "x",
          items: [
            {
              id: "item-1",
              kind: "shadcnBreadcrumb",
              label: "",
              icon: null,
              variant: "filled",
              layer: createDefaultLayer("Breadcrumb"),
            },
          ],
        },
        {
          id: "g2",
          x: 20,
          y: 90,
          axis: "x",
          items: [
            {
              id: "item-2",
              kind: "shadcnProgress",
              label: "",
              icon: null,
              variant: "filled",
              layer: createDefaultLayer("Progress"),
            },
          ],
        },
        {
          id: "g3",
          x: 20,
          y: 130,
          axis: "x",
          items: [
            {
              id: "item-3",
              kind: "shadcnSkeleton",
              label: "",
              icon: null,
              variant: "filled",
              layer: createDefaultLayer("Skeleton"),
            },
          ],
        },
      ],
    };

    const tsx = generateTsx(doc, "f1");
    expect(tsx).toContain('from "@/components/ui/breadcrumb"');
    expect(tsx).toContain('from "@/components/ui/progress"');
    expect(tsx).toContain('from "@/components/ui/skeleton"');
    expect(tsx).toContain("<Breadcrumb>");
    expect(tsx).toContain("<Progress");
    expect(tsx).toContain("<Skeleton");

    const prompt = buildPrompt(doc, {}, undefined, "en");
    expect(prompt).toContain("shadcn Breadcrumb navigation path");
    expect(prompt).toContain("shadcn Progress bar");
    expect(prompt).toContain("shadcn Skeleton placeholder");
  });
});
