import { describe, it, expect } from "vitest";
import { TAPPABLE, actionsOf, Doc, Item, Frame } from "./tokens";
import { buildPrompt } from "./prompt";
import { generateTsx } from "./codegen";

describe("Multi-Frame Screen Flow", () => {
  it("includes shadcn interactive components in TAPPABLE", () => {
    expect(TAPPABLE).toContain("shadcnButton");
    expect(TAPPABLE).toContain("shadcnCard");
    expect(TAPPABLE).toContain("shadcnBadge");
    expect(TAPPABLE).toContain("shadcnAvatar");
  });

  it("extracts action from shadcn items via actionsOf", () => {
    const btn: Item = {
      id: "btn-1",
      kind: "shadcnButton",
      label: "Go to Profile",
      action: { to: "frame-2", transition: "slide" },
    };

    const actions = actionsOf(btn);
    expect(actions).toHaveLength(1);
    expect(actions[0].action.to).toBe("frame-2");
    expect(actions[0].action.transition).toBe("slide");
  });

  it("describes screen transition flow in buildPrompt for shadcn items", () => {
    const frame1: Frame = { id: "frame-1", name: "Home", x: 0, y: 0 };
    const frame2: Frame = { id: "frame-2", name: "Profile", x: 500, y: 0 };

    const doc: Doc = {
      title: "Flow App",
      frame: "phone",
      frames: [frame1, frame2],
      groups: [
        {
          id: "g1",
          x: 20,
          y: 100,
          axis: "x",
          items: [
            {
              id: "btn-1",
              kind: "shadcnButton",
              label: "View Profile",
              action: { to: "frame-2", transition: "slide" },
            },
          ],
        },
      ],
    };

    const prompt = buildPrompt(doc, {}, undefined, "en");
    expect(prompt).toContain("View Profile");
    expect(prompt).toMatch(/Profile/i);
  });

  it("generates clean TSX for framed screen", () => {
    const frame1: Frame = { id: "frame-1", name: "Home Screen", x: 0, y: 0 };
    const doc: Doc = {
      title: "Flow App",
      frame: "phone",
      frames: [frame1],
      groups: [
        {
          id: "g1",
          x: 20,
          y: 100,
          axis: "x",
          items: [
            {
              id: "btn-1",
              kind: "shadcnButton",
              label: "Click Me",
            },
          ],
        },
      ],
    };

    const tsx = generateTsx(doc, "frame-1");
    expect(tsx).toContain("HomeScreen");
    expect(tsx).toContain("Button");
  });
});
