import { describe, it, expect } from "vitest";
import {
  Doc,
  Frame,
  Item,
  Group,
  actionsOf,
  TAPPABLE,
  BACK_TARGET,
  frameOfGroup,
  PHONE_W,
  PHONE_H,
  DESKTOP_W,
  DESKTOP_H,
} from "./tokens";
import { buildPrompt } from "./prompt";
import { generateTsx, toComponentName } from "./codegen";
import {
  createDefaultLayer,
  getComponentDefinition,
  listAvailableComponents,
} from "./registry";
import { createTemplateScreen, TEMPLATES } from "./templates";
import { shareable, readShareHash, hasShareHash } from "./share";
import { isProject, projectFileName } from "./project";
import {
  hexToRgb,
  rgbToHex,
  luminance,
  onColorFor,
  schemeFromSeed,
  tone,
} from "./color";
import { isSecureUrl, hasKey, providerSpec, DEFAULT_AI } from "./ai";

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

    // Happy Case 3: Toast notification action
    it("[Happy] supports toast notification actions", () => {
      const btn: Item = {
        id: "btn-toast",
        kind: "shadcnButton",
        label: "Add to Cart",
        action: { to: "Added to cart successfully!", type: "toast" },
      };

      const actions = actionsOf(btn);
      expect(actions).toHaveLength(1);
      expect(actions[0].action.type).toBe("toast");
      expect(actions[0].action.to).toBe("Added to cart successfully!");
    });

    // Happy Case 4: External web URL action
    it("[Happy] supports external web URL actions", () => {
      const btn: Item = {
        id: "btn-url",
        kind: "shadcnButton",
        label: "Visit Docs",
        action: { to: "https://ui.shadcn.com", type: "url" },
      };

      const actions = actionsOf(btn);
      expect(actions).toHaveLength(1);
      expect(actions[0].action.type).toBe("url");
      expect(actions[0].action.to).toBe("https://ui.shadcn.com");
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

    it("[Happy] creates Button with ProMax variants (gradient, success, warning, glow)", () => {
      for (const variant of ["gradient", "success", "warning", "glow"] as const) {
        const layer = createDefaultLayer("Button", { variant });
        expect(layer.props.variant).toBe(variant);
      }
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
    it.each(["auth", "dashboard", "settings", "ecommerce", "pricing", "chat"] as const)(
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

  /* ====================================================================
   * 6. SHARE & SERIALIZATION EDGE CASES
   * ==================================================================== */
  describe("Share & Serialization Edge Cases", () => {
    it("[Unhappy] readShareHash returns null on corrupted base64 in docz", async () => {
      const res = await readShareHash("#docz=!!!invalid_base64_symbols!!!");
      expect(res).toBeNull();
    });

    it("[Unhappy] readShareHash returns null on truncated/damaged compressed stream", async () => {
      const res = await readShareHash("#docz=YWJjZGVmZw");
      expect(res).toBeNull();
    });

    it("[Unhappy] readShareHash returns null on malformed JSON in doc param", async () => {
      const res = await readShareHash("#doc={bad-json:broken");
      expect(res).toBeNull();
    });

    it("[Unhappy] readShareHash returns null on valid JSON that fails isProject validation", async () => {
      const res = await readShareHash('#doc={"title":"Test","notAProject":true}');
      expect(res).toBeNull();
    });

    it("[Unhappy] readShareHash returns null when no doc hash parameter exists", async () => {
      expect(await readShareHash("")).toBeNull();
      expect(await readShareHash("#")).toBeNull();
      expect(await readShareHash("#view=preview")).toBeNull();
      expect(await readShareHash("#page=2")).toBeNull();
    });

    it("[Edge] shareable strips base64 data URIs and javascript: URLs from items but preserves https://", () => {
      const doc: Doc = {
        title: "Security Image App",
        frame: "phone",
        frames: [],
        groups: [
          {
            id: "g1",
            x: 0,
            y: 0,
            axis: "x",
            items: [
              {
                id: "i1",
                kind: "image",
                label: "Base64 Image",
                src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
              },
              {
                id: "i2",
                kind: "image",
                label: "XSS Image",
                src: "javascript:alert('xss')",
              },
              {
                id: "i3",
                kind: "image",
                label: "Remote CDN Image",
                src: "https://example.com/photo.png",
              },
            ],
          },
        ],
      };

      const sanitized = shareable(doc);
      expect(sanitized.groups[0].items[0].src).toBeUndefined();
      expect(sanitized.groups[0].items[1].src).toBeUndefined();
      expect(sanitized.groups[0].items[2].src).toBe("https://example.com/photo.png");
    });

    it("[Edge] shareable strips noteHistory from frames and items", () => {
      const doc: Doc = {
        title: "History App",
        frame: "phone",
        frames: [
          {
            id: "f1",
            name: "Screen",
            x: 0,
            y: 0,
            note: "Active note",
            noteHistory: ["Previous note draft 1", "Previous note draft 2"],
          },
        ],
        groups: [
          {
            id: "g1",
            x: 0,
            y: 0,
            axis: "x",
            items: [
              {
                id: "i1",
                kind: "button",
                label: "Click",
                note: "Button note",
                noteHistory: ["Button old note"],
              },
            ],
          },
        ],
      };

      const sanitized = shareable(doc);
      expect((sanitized.frames[0] as any).noteHistory).toBeUndefined();
      expect((sanitized.groups[0].items[0] as any).noteHistory).toBeUndefined();
      expect(sanitized.frames[0].note).toBe("Active note");
    });

    it("[Edge] hasShareHash returns true only when #doc= or #docz= is present", () => {
      expect(hasShareHash("#doc=1")).toBe(true);
      expect(hasShareHash("#docz=1")).toBe(true);
      expect(hasShareHash("docz=1")).toBe(true);
      expect(hasShareHash("#")).toBe(false);
      expect(hasShareHash("")).toBe(false);
      expect(hasShareHash("#unrelated=xyz")).toBe(false);
    });
  });

  /* ====================================================================
   * 7. PROJECT SCHEMA & DESERIALIZATION EDGE CASES
   * ==================================================================== */
  describe("Project Schema & Deserialization Edge Cases", () => {
    it("[Unhappy] isProject rejects primitives and non-record values", () => {
      expect(isProject(null)).toBe(false);
      expect(isProject(undefined)).toBe(false);
      expect(isProject("string")).toBe(false);
      expect(isProject(12345)).toBe(false);
      expect(isProject(true)).toBe(false);
      expect(isProject([])).toBe(false);
    });

    it("[Unhappy] isProject rejects projects with non-finite group coordinates (NaN, Infinity)", () => {
      const docWithNan = {
        title: "Test",
        frames: [],
        groups: [
          {
            id: "g1",
            x: NaN,
            y: 0,
            axis: "x",
            items: [{ id: "i1", kind: "button", label: "A", icon: null, variant: "filled" }],
          },
        ],
      };
      expect(isProject(docWithNan)).toBe(false);

      const docWithInfinity = {
        title: "Test",
        frames: [],
        groups: [
          {
            id: "g1",
            x: 0,
            y: Infinity,
            axis: "x",
            items: [{ id: "i1", kind: "button", label: "A", icon: null, variant: "filled" }],
          },
        ],
      };
      expect(isProject(docWithInfinity)).toBe(false);
    });

    it("[Unhappy] isProject rejects groups with invalid axis or empty items array", () => {
      const docEmptyItems = {
        title: "Test",
        frames: [],
        groups: [{ id: "g1", x: 0, y: 0, axis: "x", items: [] }],
      };
      expect(isProject(docEmptyItems)).toBe(false);

      const docInvalidAxis = {
        title: "Test",
        frames: [],
        groups: [
          {
            id: "g1",
            x: 0,
            y: 0,
            axis: "z" as any,
            items: [{ id: "i1", kind: "button", label: "A", icon: null, variant: "filled" }],
          },
        ],
      };
      expect(isProject(docInvalidAxis)).toBe(false);
    });

    it("[Unhappy] isProject rejects items with unknown kinds or unsupported variants", () => {
      const docBadKind = {
        title: "Test",
        frames: [],
        groups: [
          {
            id: "g1",
            x: 0,
            y: 0,
            axis: "x",
            items: [{ id: "i1", kind: "maliciousTag" as any, label: "A", icon: null, variant: "filled" }],
          },
        ],
      };
      expect(isProject(docBadKind)).toBe(false);

      const docBadVariant = {
        title: "Test",
        frames: [],
        groups: [
          {
            id: "g1",
            x: 0,
            y: 0,
            axis: "x",
            items: [{ id: "i1", kind: "button", label: "A", icon: null, variant: "superSpecial" as any }],
          },
        ],
      };
      expect(isProject(docBadVariant)).toBe(false);
    });

    it("[Unhappy] isProject rejects items with non-finite corner radii (NaN)", () => {
      const docBadCorners = {
        title: "Test",
        frames: [],
        groups: [
          {
            id: "g1",
            x: 0,
            y: 0,
            axis: "x",
            items: [
              {
                id: "i1",
                kind: "button",
                label: "A",
                icon: null,
                variant: "filled",
                corners: { tl: NaN, tr: 0, bl: 0, br: 0 } as any,
              },
            ],
          },
        ],
      };
      expect(isProject(docBadCorners)).toBe(false);
    });

    it("[Edge] projectFileName sanitizes reserved OS file characters into clean name", () => {
      const doc = {
        title: 'my/illegal:name*with?chars"and<arrows>|pipe',
        frame: "phone",
        frames: [],
        groups: [],
      } as Doc;
      const fname = projectFileName(doc);
      expect(fname).toBe("m3e-canvas my illegal name with chars and arrows pipe.json");

      expect(projectFileName({ title: "   ", frame: "phone", frames: [], groups: [] } as Doc)).toBe("m3e-canvas.json");
    });
  });

  /* ====================================================================
   * 8. COLOR ENGINE & PALETTE BOUNDARY CASES
   * ==================================================================== */
  describe("Color Engine & Palette Boundary Cases", () => {
    it("[Unhappy] hexToRgb returns null for malformed or non-6-digit hex strings", () => {
      expect(hexToRgb("")).toBeNull();
      expect(hexToRgb("not-a-color")).toBeNull();
      expect(hexToRgb("#fff")).toBeNull();
      expect(hexToRgb("#12345678")).toBeNull();
      expect(hexToRgb("#gggggg")).toBeNull();
    });

    it("[Unhappy] onColorFor gracefully defaults to black (#000000) on invalid hex input", () => {
      expect(onColorFor("invalid")).toBe("#000000");
      expect(onColorFor("")).toBe("#000000");
    });

    it("[Unhappy] luminance gracefully handles invalid hex by returning 0", () => {
      expect(luminance("corrupted")).toBe(0);
      expect(luminance("")).toBe(0);
    });

    it("[Edge] rgbToHex clamps out-of-gamut RGB values (<0 or >255)", () => {
      expect(rgbToHex(-50, -100, -255)).toBe("#000000");
      expect(rgbToHex(300, 999, 10000)).toBe("#FFFFFF");
      expect(rgbToHex(100, 150, 200)).toBe("#6496C8");
    });

    it("[Edge] schemeFromSeed falls back to default purple when given invalid seed hex", () => {
      const palette = schemeFromSeed("not-a-hex", "Fallback Test");
      expect(palette.key).toBe("custom");
      expect(palette.label).toBe("Fallback Test");
      expect(palette.primary).toMatch(/^#[0-9A-F]{6}$/i);
      expect(palette.surface).toMatch(/^#[0-9A-F]{6}$/i);
      expect(palette.error).toBe("#B3261E");
    });

    it("[Edge] tone safely computes extreme luminance values (L=0 black, L=100 white)", () => {
      expect(tone(0, 0, 0)).toBe("#000000");
      expect(tone(100, 0, 0)).toBe("#FFFFFF");
    });
  });

  /* ====================================================================
   * 9. ADVANCED CODEGEN & AST INVARIANTS
   * ==================================================================== */
  describe("Advanced Codegen & AST Invariants", () => {
    it("[Unhappy] generateTsx handles layer with empty/null children without error", () => {
      const item: Item = {
        id: "b1",
        kind: "shadcnButton",
        label: "Empty",
        variant: "filled",
        layer: {
          id: "l1",
          type: "Button",
          props: { variant: "outline" },
          children: [],
        },
      };
      const doc: Doc = {
        title: "App",
        frame: "phone",
        frames: [{ id: "f1", name: "Screen", x: 0, y: 0 }],
        groups: [{ id: "g1", x: 0, y: 0, axis: "x", items: [item] }],
      };
      const tsx = generateTsx(doc, "f1");
      expect(tsx).toContain("<Button");
      expect(tsx).toContain('variant="outline"');
    });

    it("[Edge] generateTsx serializes deeply nested component hierarchy cleanly", () => {
      const nestedCardLayer = createDefaultLayer("Card");
      nestedCardLayer.children = [
        {
          id: "hdr-1",
          type: "CardHeader",
          props: {},
          children: [
            {
              id: "ttl-1",
              type: "CardTitle",
              props: {},
              children: [
                {
                  id: "bdg-1",
                  type: "Badge",
                  props: { variant: "secondary" },
                  children: "VIP Member",
                },
              ],
            },
          ],
        },
      ];

      const item: Item = {
        id: "c1",
        kind: "shadcnCard",
        label: "VIP Card",
        variant: "filled",
        layer: nestedCardLayer,
      };

      const doc: Doc = {
        title: "Nested App",
        frame: "phone",
        frames: [{ id: "f1", name: "Profile", x: 0, y: 0 }],
        groups: [{ id: "g1", x: 0, y: 0, axis: "x", items: [item] }],
      };

      const tsx = generateTsx(doc, "f1");
      expect(tsx).toContain("<Card");
      expect(tsx).toContain("<CardHeader");
      expect(tsx).toContain("<CardTitle");
      expect(tsx).toContain("<Badge");
      expect(tsx).toContain("VIP Member");
      expect(tsx).toContain('import { Badge } from "@/components/ui/badge";');
      expect(tsx).toContain('import { Card, CardHeader, CardTitle } from "@/components/ui/card";');
    });

    it("[Edge] generateTsx deduplicates imports when multiple items use the same component", () => {
      const items: Item[] = [
        { id: "b1", kind: "shadcnButton", label: "Btn 1", layer: createDefaultLayer("Button") },
        { id: "b2", kind: "shadcnButton", label: "Btn 2", layer: createDefaultLayer("Button") },
        { id: "b3", kind: "shadcnButton", label: "Btn 3", layer: createDefaultLayer("Button") },
        { id: "bg1", kind: "shadcnBadge", label: "Badge 1", layer: createDefaultLayer("Badge") },
        { id: "bg2", kind: "shadcnBadge", label: "Badge 2", layer: createDefaultLayer("Badge") },
      ];

      const doc: Doc = {
        title: "Dedupe App",
        frame: "phone",
        frames: [{ id: "f1", name: "List", x: 0, y: 0 }],
        groups: [{ id: "g1", x: 0, y: 0, axis: "x", items }],
      };

      const tsx = generateTsx(doc, "f1");
      const buttonImportCount = (tsx.match(/import \{ Button \} from "@\/components\/ui\/button";/g) || []).length;
      const badgeImportCount = (tsx.match(/import \{ Badge \} from "@\/components\/ui\/badge";/g) || []).length;

      expect(buttonImportCount).toBe(1);
      expect(badgeImportCount).toBe(1);
    });

    it("[Edge] generateTsx handles multi-frame document and extracts only items in target frame", () => {
      const f1: Frame = { id: "home-frame", name: "Home", x: 0, y: 0 };
      const f2: Frame = { id: "settings-frame", name: "Settings", x: 600, y: 0 };

      const homeLayer = createDefaultLayer("Button");
      homeLayer.children = "Home Button Action";
      const homeItem: Item = {
        id: "btn-home",
        kind: "shadcnButton",
        label: "Home Button Action",
        layer: homeLayer,
      };
      const settingsLayer = createDefaultLayer("Button");
      settingsLayer.children = "Settings Toggle Action";
      const settingsItem: Item = {
        id: "btn-settings",
        kind: "shadcnButton",
        label: "Settings Toggle Action",
        layer: settingsLayer,
      };

      const doc: Doc = {
        title: "Multi Screen App",
        frame: "phone",
        frames: [f1, f2],
        groups: [
          { id: "g-home", x: 50, y: 50, axis: "x", items: [homeItem] },
          { id: "g-settings", x: 650, y: 50, axis: "x", items: [settingsItem] },
        ],
      };

      const homeTsx = generateTsx(doc, "home-frame");
      expect(homeTsx).toContain("export default function HomeScreen()");
      expect(homeTsx).toContain("Home Button Action");
      expect(homeTsx).not.toContain("Settings Toggle Action");

      const settingsTsx = generateTsx(doc, "settings-frame");
      expect(settingsTsx).toContain("export default function Settings()");
      expect(settingsTsx).toContain("Settings Toggle Action");
      expect(settingsTsx).not.toContain("Home Button Action");
    });

    it("[Edge] generateTsx safely escapes unicode, quotes, and emoji characters in labels", () => {
      const specialItem: Item = {
        id: "b-spec",
        kind: "shadcnButton",
        label: '🚀 "VIP Deal" <50% OFF> & {Save} 💎',
        variant: "filled",
      };

      const doc: Doc = {
        title: "Emoji App",
        frame: "phone",
        frames: [{ id: "f1", name: "Promo", x: 0, y: 0 }],
        groups: [{ id: "g1", x: 0, y: 0, axis: "x", items: [specialItem] }],
      };

      const tsx = generateTsx(doc, "f1");
      expect(tsx).toContain("🚀");
      expect(tsx).toContain("{'<'}50% OFF{'>'}");
      expect(tsx).toContain("{'{'}Save{'}'}");
      expect(tsx).not.toContain("<50% OFF>");
    });
  });

  /* ====================================================================
   * 10. AI HELPER & PROMPT EDGE CASES
   * ==================================================================== */
  describe("AI Helper & Prompt Edge Cases", () => {
    it("[Unhappy] isSecureUrl rejects insecure remote HTTP URLs but permits localhost and HTTPS", () => {
      expect(isSecureUrl("http://api.openai.com/v1")).toBe(false);
      expect(isSecureUrl("http://my-remote-ai.internal:8000")).toBe(false);
      expect(isSecureUrl("https://api.openai.com/v1")).toBe(true);
      expect(isSecureUrl("http://localhost:11434")).toBe(true);
      expect(isSecureUrl("http://127.0.0.1:8000")).toBe(true);
      expect(isSecureUrl("http://[::1]:8080")).toBe(true);
    });

    it("[Unhappy] hasKey requires key for remote servers but allows local servers without key", () => {
      expect(
        hasKey({ provider: "openai", baseUrl: "https://api.openai.com/v1", model: "gpt-4", key: "" })
      ).toBe(false);
      expect(
        hasKey({ provider: "openai", baseUrl: "https://api.openai.com/v1", model: "gpt-4", key: "sk-123" })
      ).toBe(true);
      expect(
        hasKey({ provider: "openai", baseUrl: "http://localhost:11434", model: "llama3", key: "" })
      ).toBe(true);
    });

    it("[Unhappy] providerSpec returns default provider when given an unknown provider key", () => {
      const fallback = providerSpec("unknown-ai" as any);
      expect(fallback).toBeDefined();
      expect(fallback.key).toBe("openai");
    });

    it("[Edge] buildPrompt formats 4-directional swipe gestures without crashing", () => {
      const f1: Frame = {
        id: "f1",
        name: "Main",
        x: 0,
        y: 0,
        swipe: { left: "f2", right: "f3", up: "f4", down: "f5" },
      };
      const f2: Frame = { id: "f2", name: "Feed", x: 500, y: 0 };
      const f3: Frame = { id: "f3", name: "Menu", x: -500, y: 0 };
      const f4: Frame = { id: "f4", name: "Search", x: 0, y: -900 };
      const f5: Frame = { id: "f5", name: "Notifications", x: 0, y: 900 };

      const doc: Doc = {
        title: "Swipe App",
        frame: "phone",
        frames: [f1, f2, f3, f4, f5],
        groups: [],
      };

      for (const lang of ["en", "ja", "zh", "ko"] as const) {
        expect(() => buildPrompt(doc, {}, undefined, lang)).not.toThrow();
        const prompt = buildPrompt(doc, {}, undefined, lang);
        expect(prompt).toContain("Feed");
        expect(prompt).toContain("Menu");
      }
    });

    it("[Edge] buildPrompt handles all transition variants without error", () => {
      const transitions = ["slide", "slideLeft", "slideUp", "slideDown", "fade", "instant", "none"] as const;

      for (const tr of transitions) {
        const item: Item = {
          id: `btn-${tr}`,
          kind: "shadcnButton",
          label: `Go with ${tr}`,
          action: { to: "target-frame", transition: tr },
        };

        const doc: Doc = {
          title: "Transition App",
          frame: "phone",
          frames: [
            { id: "source", name: "Source", x: 0, y: 0 },
            { id: "target-frame", name: "Target", x: 600, y: 0 },
          ],
          groups: [{ id: "g1", x: 50, y: 50, axis: "x", items: [item] }],
        };

        expect(() => buildPrompt(doc, {}, undefined, "en")).not.toThrow();
        const p = buildPrompt(doc, {}, undefined, "en");
        expect(p).toContain("Target");
      }
    });
  });

  /* ====================================================================
   * 11. CANVAS GEOMETRY & HIT-TESTING EDGE CASES
   * ==================================================================== */
  describe("Canvas Geometry & Hit-Testing Edge Cases", () => {
    it("[Unhappy] frameOfGroup returns undefined when group center is outside all frames", () => {
      const f: Frame = { id: "f1", name: "Screen", x: 0, y: 0 };
      const g: Group = {
        id: "g-far",
        x: 5000,
        y: 5000,
        axis: "x",
        items: [{ id: "i1", kind: "button", label: "Far", icon: null, variant: "filled" }],
      };

      expect(frameOfGroup(g, [f], {})).toBeUndefined();
    });

    it("[Unhappy] frameOfGroup returns undefined when frames array is empty", () => {
      const g: Group = {
        id: "g1",
        x: 10,
        y: 10,
        axis: "x",
        items: [{ id: "i1", kind: "button", label: "Here", icon: null, variant: "filled" }],
      };

      expect(frameOfGroup(g, [], {})).toBeUndefined();
    });

    it("[Edge] frameOfGroup matches correctly against desktop frame dimensions", () => {
      const deskFrame: Frame = {
        id: "f-desk",
        name: "Desktop Screen",
        x: 1000,
        y: 0,
        w: DESKTOP_W,
        h: DESKTOP_H,
      };

      const g: Group = {
        id: "g-desk",
        x: 1800,
        y: 500,
        axis: "x",
        items: [{ id: "i1", kind: "button", label: "Desktop Button", icon: null, variant: "filled" }],
      };

      const matched = frameOfGroup(g, [deskFrame], {});
      expect(matched).toBeDefined();
      expect(matched?.id).toBe("f-desk");
    });

    it("[Edge] actionsOf and TAPPABLE handle items with no actions or non-tappable kinds", () => {
      const noActionItem: Item = {
        id: "i-none",
        kind: "shadcnButton",
        label: "Static",
        action: undefined,
        actions: { "slot-a": undefined as any },
      };
      expect(actionsOf(noActionItem)).toEqual([]);

      // Verify TAPPABLE set contains interactive kinds and excludes static/non-tappable kinds
      expect(TAPPABLE.includes("divider")).toBe(false);
      expect(TAPPABLE.includes("loadingIndicator")).toBe(false);
      expect(TAPPABLE.includes("shadcnButton")).toBe(true);
      expect(TAPPABLE.includes("shadcnCard")).toBe(true);
      expect(TAPPABLE.includes("shadcnBadge")).toBe(true);
      expect(TAPPABLE.includes("shadcnAvatar")).toBe(true);
    });

    it("[Edge] listAvailableComponents includes all new primitives and existing registry types", () => {
      const list = listAvailableComponents();
      expect(list).toContain("Breadcrumb");
      expect(list).toContain("Skeleton");
      expect(list).toContain("Progress");
      expect(list).toContain("Button");
      expect(list).toContain("Card");
      expect(list).toContain("Dialog");
      expect(list).toContain("Select");
      expect(list).toContain("Table");
      expect(list.length).toBeGreaterThanOrEqual(15);
    });

    it("[Unhappy] createTemplateScreen gracefully handles unknown template key by falling back to settings", () => {
      const res = createTemplateScreen("unsupported" as any, 100, 100);
      expect(res.frame).toBeDefined();
      expect(res.groups.length).toBeGreaterThan(0);
      expect(res.frame.x).toBe(100);
      expect(res.frame.y).toBe(100);
    });
  });
});
