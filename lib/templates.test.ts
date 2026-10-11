import { describe, it, expect } from "vitest";
import { TEMPLATES, createTemplateScreen } from "./templates";
import { generateTsx } from "./codegen";
import { buildPrompt } from "./prompt";
import { Doc } from "./tokens";

describe("Template / Preset Library", () => {
  it("provides list of available templates", () => {
    expect(TEMPLATES).toHaveLength(3);
    expect(TEMPLATES.map((t) => t.key)).toEqual(["auth", "dashboard", "settings"]);
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
});
