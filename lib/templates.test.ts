import { describe, it, expect } from "vitest";
import { TEMPLATES, createTemplateScreen } from "./templates";
import { generateTsx } from "./codegen";
import { buildPrompt } from "./prompt";
import { Doc } from "./tokens";

describe("Template / Preset Library", () => {
  it("provides list of available templates", () => {
    expect(TEMPLATES).toHaveLength(6);
    expect(TEMPLATES.map((t) => t.key)).toEqual([
      "auth",
      "dashboard",
      "settings",
      "ecommerce",
      "pricing",
      "chat",
    ]);
  });

  it("creates valid auth screen with inputs, checkbox, card, and button", () => {
    const { frame, groups } = createTemplateScreen("auth", 100, 200);
    expect(frame.name).toBe("Login");
    expect(frame.x).toBe(100);
    expect(frame.y).toBe(200);
    expect(groups.length).toBeGreaterThan(0);

    const doc: Doc = {
      title: "Auth Template Test",
      frame: "phone",
      frames: [frame],
      groups,
    };

    const tsx = generateTsx(doc, frame.id);
    expect(tsx).toContain("Login");
    expect(tsx).toContain("Button");
    expect(tsx).toContain("Input");
    expect(tsx).toContain("Checkbox");

    const prompt = buildPrompt(doc, {}, undefined, "en");
    expect(prompt).toContain("Welcome back");
  });

  it("creates valid dashboard screen with breadcrumb, metrics, and table", () => {
    const { frame, groups } = createTemplateScreen("dashboard", 0, 0);
    expect(frame.name).toBe("Dashboard");

    const doc: Doc = {
      title: "Dashboard Template Test",
      frame: "phone",
      frames: [frame],
      groups,
    };

    const tsx = generateTsx(doc, frame.id);
    expect(tsx).toContain("Dashboard");
    expect(tsx).toContain("Breadcrumb");
    expect(tsx).toContain("Table");

    const prompt = buildPrompt(doc, {}, undefined, "en");
    expect(prompt).toContain("Dashboard");
  });

  it("creates valid settings screen with avatar, inputs, switches, and button", () => {
    const { frame, groups } = createTemplateScreen("settings", 0, 0);
    expect(frame.name).toBe("Settings");

    const doc: Doc = {
      title: "Settings Template Test",
      frame: "phone",
      frames: [frame],
      groups,
    };

    const tsx = generateTsx(doc, frame.id);
    expect(tsx).toContain("Settings");
    expect(tsx).toContain("Avatar");
    expect(tsx).toContain("Switch");
    expect(tsx).toContain("Button");
  });

  it("creates valid ecommerce product screen with sale badges and CTA buttons", () => {
    const { frame, groups } = createTemplateScreen("ecommerce", 0, 0);
    expect(frame.name).toBe("Product Detail");
    expect(groups.length).toBeGreaterThanOrEqual(4);

    const doc: Doc = {
      title: "Ecommerce Template Test",
      frame: "phone",
      frames: [frame],
      groups,
    };

    const tsx = generateTsx(doc, frame.id);
    expect(tsx).toContain("ProductDetail");
    expect(tsx).toContain("Breadcrumb");
    expect(tsx).toContain("Badge");
    expect(tsx).toContain("Button");
  });

  it("creates valid pricing plans screen with tiered cards", () => {
    const { frame, groups } = createTemplateScreen("pricing", 0, 0);
    expect(frame.name).toBe("Pricing Plans");
    expect(groups.length).toBeGreaterThanOrEqual(4);

    const doc: Doc = {
      title: "Pricing Template Test",
      frame: "phone",
      frames: [frame],
      groups,
    };

    const tsx = generateTsx(doc, frame.id);
    expect(tsx).toContain("PricingPlans");
    expect(tsx).toContain("Card");
    expect(tsx).toContain("Button");
  });

  it("creates valid chat messenger screen with avatar and message cards", () => {
    const { frame, groups } = createTemplateScreen("chat", 0, 0);
    expect(frame.name).toBe("Messenger Chat");
    expect(groups.length).toBeGreaterThanOrEqual(3);

    const doc: Doc = {
      title: "Chat Template Test",
      frame: "phone",
      frames: [frame],
      groups,
    };

    const tsx = generateTsx(doc, frame.id);
    expect(tsx).toContain("MessengerChat");
    expect(tsx).toContain("Avatar");
    expect(tsx).toContain("Card");
    expect(tsx).toContain("Input");
    expect(tsx).toContain("Button");
  });
});
