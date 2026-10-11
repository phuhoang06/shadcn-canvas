import { describe, it, expect } from "vitest";
import { Doc, Frame, Item, actionsOf, TAPPABLE, BACK_TARGET } from "./tokens";
import { buildPrompt } from "./prompt";
import { generateTsx, toComponentName } from "./codegen";
import { createDefaultLayer, getComponentDefinition } from "./registry";
import { createTemplateScreen, TEMPLATES } from "./templates";

describe("Robustness Suite: Happy & Unhappy Cases", () => {
  /* ====================================================================
   * 1. SCREEN FLOW & ACTIONS
   * ==================================================================== */
  describe("Screen Flow & Actions", () => {
    // Happy Case 1: Standard navigation link
    it("[Happy] links from Frame A to Frame B and describes transition", () => {
      const f1: Frame = { id: "home", name: "Home", x: 0, y: 0 };
      const f2: Frame = { id: "detail", name: "Detail", x: 600, y: 0 };
      const btn: Item = {
        id: "btn-1",
        kind: "shadcnButton",
        label: "View Detail",
        action: { to: "detail", transition: "slide" },
      };

      const actions = actionsOf(btn);
      expect(actions).toHaveLength(1);
      expect(actions[0].action.to).toBe("detail");
      expect(actions[0].action.transition).toBe("slide");

      const doc: Doc = {
        title: "Test App",
        frame: "phone",
        frames: [f1, f2],
        groups: [{ id: "g1", x: 20, y: 50, axis: "x", items: [btn] }],
      };

      const prompt = buildPrompt(doc, {}, undefined, "en");
      expect(prompt).toContain('opens the "Detail" screen with a slide in from the right');
    });

    // Happy Case 2: System "back" navigation
    it("[Happy] supports system BACK_TARGET navigation", () => {
      const btn: Item = {
        id: "btn-back",
        kind: "shadcnButton",
        label: "Back",
        action: { to: BACK_TARGET, transition: "slideLeft" },
      };

      const doc: Doc = {
        title: "Back App",
        frame: "phone",
        frames: [{ id: "f1", name: "Detail", x: 0, y: 0 }],
        groups: [{ id: "g1", x: 20, y: 50, axis: "x", items: [btn] }],
      };

      const prompt = buildPrompt(doc, {}, undefined, "en");
      expect(prompt).toContain("goes back to the previous screen");
    });

    // Unhappy Case 1: Dangling action target (target frame does not exist)
    it("[Unhappy] safely handles dangling action target without crashing", () => {
      const btn: Item = {
        id: "btn-dangling",
        kind: "shadcnButton",
        label: "Broken Link",
        action: { to: "non-existent-frame-999", transition: "fade" },
      };

      const doc: Doc = {
        title: "Dangling App",
        frame: "phone",
        frames: [{ id: "f1", name: "Only Screen", x: 0, y: 0 }],
        groups: [{ id: "g1", x: 20, y: 50, axis: "x", items: [btn] }],
      };

      // Prompt should not throw and should gracefully omit the broken target description
      expect(() => buildPrompt(doc, {}, undefined, "en")).not.toThrow();
      const prompt = buildPrompt(doc, {}, undefined, "en");
      expect(prompt).not.toContain("non-existent-frame-999");
    });

    // Unhappy Case 2: Empty action target string
    it("[Unhappy] safely handles empty action target", () => {
      const btn: Item = {
        id: "btn-empty",
        kind: "shadcnButton",
        label: "Empty Action",
        action: { to: "", transition: "none" },
      };

      const doc: Doc = {
        title: "Empty Target App",
        frame: "phone",
        frames: [{ id: "f1", name: "Screen 1", x: 0, y: 0 }],
        groups: [{ id: "g1", x: 20, y: 50, axis: "x", items: [btn] }],
      };

      expect(() => buildPrompt(doc, {}, undefined, "en")).not.toThrow();
    });

    // Unhappy Case 3: Self-referencing navigation (loop)
    it("[Unhappy] safely handles self-referencing frame navigation", () => {
      const btn: Item = {
        id: "btn-self",
        kind: "shadcnButton",
        label: "Reload Screen",
        action: { to: "f1", transition: "fade" },
      };

      const doc: Doc = {
        title: "Loop App",
        frame: "phone",
        frames: [{ id: "f1", name: "LoopScreen", x: 0, y: 0 }],
        groups: [{ id: "g1", x: 20, y: 50, axis: "x", items: [btn] }],
      };

      expect(() => buildPrompt(doc, {}, undefined, "en")).not.toThrow();
      const prompt = buildPrompt(doc, {}, undefined, "en");
      expect(prompt).toContain('opens the "LoopScreen" screen');
    });
  });

  /* ====================================================================
   * 2. COMPONENT REGISTRY & PRIMITIVES
   * ==================================================================== */
  describe("Component Registry & Primitives", () => {
    // Happy Case: Standard component creation
    it("[Happy] creates standard layers and returns valid registry definitions", () => {
      const buttonDef = getComponentDefinition("Button");
      expect(buttonDef).toBeDefined();
      expect(buttonDef?.from).toBe("@/components/ui/button");

      const breadcrumbDef = getComponentDefinition("Breadcrumb");
      expect(breadcrumbDef).toBeDefined();
      expect(breadcrumbDef?.from).toBe("@/components/ui/breadcrumb");

      const layer = createDefaultLayer("Breadcrumb");
      expect(layer.type).toBe("Breadcrumb");
      expect(layer.children).toBeInstanceOf(Array);
    });

    // Unhappy Case 1: Unknown component type in createDefaultLayer
    it("[Unhappy] creates fallback layer for unknown component type without throwing", () => {
      const unknownLayer = createDefaultLayer("NonExistentWidget3000", { customProp: "val" });
      expect(unknownLayer).toBeDefined();
      expect(unknownLayer.type).toBe("NonExistentWidget3000");
      expect(unknownLayer.props.customProp).toBe("val");
      expect(unknownLayer.children).toEqual([]);
    });

    // Unhappy Case 2: Querying non-existent component definition
    it("[Unhappy] returns undefined for non-existent registry definitions", () => {
      expect(getComponentDefinition("FakeComponent")).toBeUndefined();
      expect(getComponentDefinition("")).toBeUndefined();
    });
  });

  /* ====================================================================
   * 3. TEMPLATE LIBRARY
   * ==================================================================== */
  describe("Template Library", () => {
    // Happy Case: Creates all templates with valid coordinates
    it.each(["auth", "dashboard", "settings"] as const)(
      "[Happy] creates '%s' template with valid geometry and items",
      (key) => {
        const { frame, groups } = createTemplateScreen(key, 1200, 400);
        expect(frame.x).toBe(1200);
        expect(frame.y).toBe(400);
        expect(groups.length).toBeGreaterThan(0);
        for (const g of groups) {
          expect(g.items.length).toBeGreaterThan(0);
          expect(g.x).toBeGreaterThanOrEqual(1200);
          expect(g.y).toBeGreaterThanOrEqual(400);
        }
      }
    );

    // Unhappy Case: Template with negative start coordinates
    it("[Unhappy] correctly positions template when start coordinates are negative", () => {
      const { frame, groups } = createTemplateScreen("auth", -500, -300);
      expect(frame.x).toBe(-500);
      expect(frame.y).toBe(-300);
      for (const g of groups) {
        expect(g.x).toBeGreaterThanOrEqual(-500);
        expect(g.y).toBeGreaterThanOrEqual(-300);
      }
    });
  });

  /* ====================================================================
   * 4. TSX CODEGEN & ESCAPING
   * ==================================================================== */
  describe("TSX Codegen Robustness", () => {
    // Happy Case: Standard clean TSX codegen
    it("[Happy] generates clean standalone TSX component", () => {
      const doc: Doc = {
        title: "Clean App",
        frame: "phone",
        frames: [{ id: "f1", name: "Checkout Page", x: 0, y: 0 }],
        groups: [
          {
            id: "g1",
            x: 20,
            y: 50,
            axis: "x",
            items: [
              {
                id: "b1",
                kind: "shadcnButton",
                label: "Pay Now",
                variant: "filled",
                layer: createDefaultLayer("Button"),
              },
            ],
          },
        ],
      };

      const tsx = generateTsx(doc, "f1");
      expect(tsx).toContain("export default function CheckoutPage()");
      expect(tsx).toContain('import { Button } from "@/components/ui/button";');
      expect(tsx).toContain("<Button");
    });

    // Unhappy Case 1: Special characters / XSS strings in labels
    it("[Unhappy] properly escapes JSX special characters ({}, <>) to prevent AST syntax errors", () => {
      const doc: Doc = {
        title: "XSS App",
        frame: "phone",
        frames: [{ id: "f1", name: "Security Test", x: 0, y: 0 }],
        groups: [
          {
            id: "g1",
            x: 20,
            y: 50,
            axis: "x",
            items: [
              {
                id: "b1",
                kind: "shadcnButton",
                label: '<script>alert("xss")</script> {variable} <tag>',
                variant: "filled",
              },
            ],
          },
        ],
      };

      const tsx = generateTsx(doc, "f1");
      expect(tsx).toContain("{'<'}script{'>'}");
      expect(tsx).toContain("{'{'}variable{'}'}");
      expect(tsx).not.toContain("<script>");
    });

    // Unhappy Case 2: Frame names with strange characters & numbers
    it("[Unhappy] normalizes unconventional frame names to valid PascalCase identifiers", () => {
      expect(toComponentName("")).toBe("HomeScreen");
      expect(toComponentName("   ")).toBe("HomeScreen");
      expect(toComponentName("home")).toBe("HomeScreen");
      expect(toComponentName("123-numbers-first")).toBe("Screen123NumbersFirst");
      expect(toComponentName("@#$%special---name!!")).toBe("SpecialName");
      expect(toComponentName("user_profile_edit")).toBe("UserProfileEdit");
    });

    // Unhappy Case 3: Requesting codegen for non-existent frame ID
    it("[Unhappy] gracefully falls back when target frameId does not exist in doc", () => {
      const doc: Doc = {
        title: "Fallback Doc",
        frame: "phone",
        frames: [{ id: "f1", name: "First Screen", x: 0, y: 0 }],
        groups: [],
      };

      const tsx = generateTsx(doc, "ghost-frame-id-404");
      expect(tsx).toContain("FallbackDoc");
      expect(tsx).toContain("No components on this screen.");
    });

    // Unhappy Case 4: Totally empty document (0 frames, 0 groups)
    it("[Unhappy] handles completely empty document without crashing", () => {
      const emptyDoc: Doc = {
        title: "",
        frame: "phone",
        frames: [],
        groups: [],
      };

      expect(() => generateTsx(emptyDoc)).not.toThrow();
      const tsx = generateTsx(emptyDoc);
      expect(tsx).toContain("HomeScreen");
      expect(tsx).toContain("No components on this screen.");
    });
  });

  /* ====================================================================
   * 5. AI PROMPT GENERATION EDGE CASES
   * ==================================================================== */
  describe("AI Prompt Edge Cases", () => {
    it("[Happy] appends Next.js & shadcn/ui tech stack guidelines when shadcn components are present", () => {
      const doc: Doc = {
        title: "Modern App",
        frame: "phone",
        frames: [{ id: "f1", name: "Screen 1", x: 0, y: 0 }],
        groups: [
          {
            id: "g1",
            x: 0,
            y: 0,
            axis: "x",
            items: [{ id: "i1", kind: "shadcnButton", label: "Submit" }],
          },
        ],
      };

      const prompt = buildPrompt(doc, {}, undefined, "en");
      expect(prompt).toContain("## Tech Stack & Vibe Coding Guidelines");
      expect(prompt).toContain("Next.js 15+ (App Router)");
      expect(prompt).toContain("shadcn/ui");
    });

    it("[Unhappy] generates prompt without error when title and brief are empty or undefined", () => {
      const doc: Doc = {
        title: "",
        brief: undefined,
        frame: "phone",
        frames: [],
        groups: [],
      };

      expect(() => buildPrompt(doc, {}, undefined, "en")).not.toThrow();
      const prompt = buildPrompt(doc, {}, undefined, "en");
      expect(prompt).toContain("## Layout");
      expect(prompt).toContain("Nothing has been placed on the screen yet.");
    });

    it("[Unhappy] generates prompt across all 4 languages with empty/undefined inputs", () => {
      const doc: Doc = {
        title: "Test",
        frame: "phone",
        frames: [{ id: "f1", name: "", x: 0, y: 0 }],
        groups: [],
      };

      for (const lang of ["en", "ja", "zh", "ko"] as const) {
        expect(() => buildPrompt(doc, {}, undefined, lang)).not.toThrow();
      }
    });
  });
});
