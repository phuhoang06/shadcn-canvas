import { Doc, Frame, Item, frameOfGroup } from "./tokens";

/**
 * Converts a frame name into a valid PascalCase React component name.
 * e.g., "Home" -> "HomeScreen", "home-screen" -> "HomeScreen", "Screen 1" -> "Screen1"
 */
export function toComponentName(name?: string): string {
  if (!name || !name.trim()) return "HomeScreen";
  const words = name
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .split(/[\s_-]+/)
    .filter(Boolean);
  if (words.length === 0) return "HomeScreen";
  let pascal = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  if (/^[0-9]/.test(pascal)) {
    pascal = `Screen${pascal}`;
  }
  if (pascal.toLowerCase() === "home") {
    return "HomeScreen";
  }
  return pascal;
}

/**
 * Escapes characters that have special meaning in JSX text content.
 */
function escapeJsxText(text: string): string {
  return text.replace(/[{}]/g, (m) => `{'${m}'}`);
}

function serializeButton(item: Item): string {
  const variant = item.shadcnProps?.buttonVariant ?? "default";
  const size = item.shadcnProps?.buttonSize ?? "default";
  const label = escapeJsxText(item.label || "Shadcn Button");
  return `      <Button variant="${variant}" size="${size}">\n        ${label}\n      </Button>`;
}

function serializeCard(item: Item): string {
  const title = escapeJsxText(item.shadcnProps?.cardTitle || item.label || "Card Title");
  const description = escapeJsxText(item.shadcnProps?.cardDescription || "Card Description");
  const content = escapeJsxText(item.shadcnProps?.cardContent || "Card Content");
  return [
    "      <Card>",
    "        <CardHeader>",
    `          <CardTitle>${title}</CardTitle>`,
    `          <CardDescription>${description}</CardDescription>`,
    "        </CardHeader>",
    "        <CardContent>",
    `          <p>${content}</p>`,
    "        </CardContent>",
    "      </Card>",
  ].join("\n");
}

function serializeSelect(item: Item): string {
  const options = item.shadcnProps?.selectOptions ?? ["Option 1", "Option 2", "Option 3"];
  const defaultValue = options[0] ?? "";
  const placeholder = escapeJsxText(item.shadcnProps?.selectPlaceholder || item.label || "Select...");
  const optionItems = options
    .map((opt) => `          <SelectItem value="${opt}">${escapeJsxText(opt)}</SelectItem>`)
    .join("\n");

  return [
    `      <Select defaultValue="${defaultValue}">`,
    "        <SelectTrigger>",
    `          <SelectValue placeholder="${placeholder}" />`,
    "        </SelectTrigger>",
    "        <SelectContent>",
    optionItems,
    "        </SelectContent>",
    "      </Select>",
  ].join("\n");
}

function serializeItem(item: Item): string | null {
  switch (item.kind) {
    case "shadcnButton":
      return serializeButton(item);
    case "shadcnCard":
      return serializeCard(item);
    case "shadcnSelect":
      return serializeSelect(item);
    default:
      return null;
  }
}

/**
 * Gathers items for the specified frameId, falling back to the first frame or all items.
 */
export function getFrameAndItems(doc: Doc, frameId?: string): { frame?: Frame; items: Item[] } {
  const targetFrame = frameId
    ? doc.frames.find((f) => f.id === frameId)
    : doc.frames[0];

  if (targetFrame) {
    const frameGroups = doc.groups
      .filter((g) => frameOfGroup(g, doc.frames, {})?.id === targetFrame.id)
      .sort((a, b) => a.y - b.y || a.x - b.x);

    const items = frameGroups.flatMap((g) => g.items);
    if (items.length > 0) {
      return { frame: targetFrame, items };
    }
  }

  // Fallback: if no items found in target frame, or no frames exist, return all items
  const allGroups = [...doc.groups].sort((a, b) => a.y - b.y || a.x - b.x);
  const allItems = allGroups.flatMap((g) => g.items);
  return { frame: targetFrame ?? doc.frames[0], items: allItems };
}

/**
 * Generates idiomatic React TSX for shadcn components contained in a canvas document frame.
 */
export function generateTsx(doc: Doc, frameId?: string): string {
  const { frame, items } = getFrameAndItems(doc, frameId);

  const hasButton = items.some((it) => it.kind === "shadcnButton");
  const hasCard = items.some((it) => it.kind === "shadcnCard");
  const hasSelect = items.some((it) => it.kind === "shadcnSelect");

  const importStatements: string[] = ['import React from "react";'];

  if (hasButton) {
    importStatements.push('import { Button } from "@/components/ui/button";');
  }
  if (hasCard) {
    importStatements.push(
      'import {\n  Card,\n  CardHeader,\n  CardTitle,\n  CardDescription,\n  CardContent,\n} from "@/components/ui/card";'
    );
  }
  if (hasSelect) {
    importStatements.push(
      'import {\n  Select,\n  SelectContent,\n  SelectItem,\n  SelectTrigger,\n  SelectValue,\n} from "@/components/ui/select";'
    );
  }

  const serializedBlocks = items
    .map((it) => serializeItem(it))
    .filter((code): code is string => code !== null);

  const componentName = toComponentName(frame?.name);

  const bodyContent =
    serializedBlocks.length > 0
      ? serializedBlocks.join("\n\n")
      : '      {/* Add shadcn components to this screen to see them exported */}\n      <p className="text-muted-foreground text-sm">No shadcn components on this screen.</p>';

  return [
    importStatements.join("\n"),
    "",
    `export default function ${componentName}() {`,
    "  return (",
    '    <div className="flex flex-col gap-4 p-6">',
    bodyContent,
    "    </div>",
    "  );",
    "}",
    "",
  ].join("\n");
}
