import { Doc, Frame, Item, frameOfGroup } from "./tokens";
import type { ComponentLayer } from "./registry/types";
import { getComponentDefinition } from "./registry";

/**
 * Converts a frame name into a valid PascalCase React component name.
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

/**
 * Map từ Tên Component sang đường dẫn import trong @/components/ui/
 */
const COMPONENT_MODULE_MAP: Record<string, string> = {
  Button: "@/components/ui/button",
  Badge: "@/components/ui/badge",
  Card: "@/components/ui/card",
  CardHeader: "@/components/ui/card",
  CardFooter: "@/components/ui/card",
  CardTitle: "@/components/ui/card",
  CardDescription: "@/components/ui/card",
  CardContent: "@/components/ui/card",
  Dialog: "@/components/ui/dialog",
  DialogTrigger: "@/components/ui/dialog",
  DialogContent: "@/components/ui/dialog",
  DialogHeader: "@/components/ui/dialog",
  DialogFooter: "@/components/ui/dialog",
  DialogTitle: "@/components/ui/dialog",
  DialogDescription: "@/components/ui/dialog",
  DialogClose: "@/components/ui/dialog",
  Popover: "@/components/ui/popover",
  PopoverTrigger: "@/components/ui/popover",
  PopoverContent: "@/components/ui/popover",
  Select: "@/components/ui/select",
  SelectTrigger: "@/components/ui/select",
  SelectContent: "@/components/ui/select",
  SelectItem: "@/components/ui/select",
  SelectValue: "@/components/ui/select",
  Input: "@/components/ui/input",
  Textarea: "@/components/ui/textarea",
  Separator: "@/components/ui/separator",
  DropdownMenu: "@/components/ui/dropdown-menu",
  DropdownMenuTrigger: "@/components/ui/dropdown-menu",
  DropdownMenuContent: "@/components/ui/dropdown-menu",
  DropdownMenuItem: "@/components/ui/dropdown-menu",
  DropdownMenuLabel: "@/components/ui/dropdown-menu",
  DropdownMenuSeparator: "@/components/ui/dropdown-menu",
  DropdownMenuShortcut: "@/components/ui/dropdown-menu",
  DropdownMenuGroup: "@/components/ui/dropdown-menu",
  DropdownMenuSub: "@/components/ui/dropdown-menu",
  DropdownMenuSubTrigger: "@/components/ui/dropdown-menu",
  DropdownMenuSubContent: "@/components/ui/dropdown-menu",
  Tooltip: "@/components/ui/tooltip",
  TooltipTrigger: "@/components/ui/tooltip",
  TooltipContent: "@/components/ui/tooltip",
  TooltipProvider: "@/components/ui/tooltip",
};

/**
 * Thu thập tất cả các loại component được sử dụng trong cây ComponentLayer
 */
function collectComponentTypes(layer: ComponentLayer, set: Set<string>) {
  set.add(layer.type);
  if (Array.isArray(layer.children)) {
    for (const child of layer.children) {
      collectComponentTypes(child, set);
    }
  }
}

/**
 * Sinh mã JSX đệ quy từ ComponentLayer (Thuần khiết AST, không leak runtime canvas)
 */
export function serializeLayer(layer: ComponentLayer, indent: number = 6): string {
  const pad = " ".repeat(indent);
  const type = layer.type;

  // Lọc và format props
  const propEntries = Object.entries(layer.props || {}).filter(([k, v]) => {
    return v !== undefined && v !== null && k !== "children" && !k.startsWith("__");
  });

  const attrs = propEntries
    .map(([k, v]) => {
      if (typeof v === "boolean") return v ? k : `${k}={false}`;
      if (typeof v === "string") return `${k}="${v}"`;
      return `${k}={${JSON.stringify(v)}}`;
    })
    .join(" ");

  const attrStr = attrs ? ` ${attrs}` : "";

  // Trường hợp children là text
  if (typeof layer.children === "string") {
    return `${pad}<${type}${attrStr}>${escapeJsxText(layer.children)}</${type}>`;
  }

  // Trường hợp children là mảng các component con
  if (Array.isArray(layer.children)) {
    if (layer.children.length === 0) {
      return `${pad}<${type}${attrStr} />`;
    }
    const childrenStr = layer.children
      .map((child) => serializeLayer(child, indent + 2))
      .join("\n");
    return `${pad}<${type}${attrStr}>\n${childrenStr}\n${pad}</${type}>`;
  }

  return `${pad}<${type}${attrStr} />`;
}

/**
 * Fallback cho các item Phase 1 cũ (chưa có layer)
 */
function serializeFallbackItem(item: Item): string | null {
  if (item.kind === "shadcnButton") {
    const variant = item.shadcnProps?.buttonVariant ?? "default";
    const size = item.shadcnProps?.buttonSize ?? "default";
    const label = escapeJsxText(item.label || "Shadcn Button");
    return `      <Button variant="${variant}" size="${size}">\n        ${label}\n      </Button>`;
  }
  if (item.kind === "shadcnCard") {
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
  if (item.kind === "shadcnSelect") {
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
  return null;
}

/**
 * Lấy danh sách item thuộc frame chỉ định
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
    return { frame: targetFrame, items };
  }

  const allItems = doc.groups.flatMap((g) => g.items);
  return { frame: undefined, items: allItems };
}

/**
 * Sinh toàn bộ file mã nguồn React TSX hoàn chỉnh cho Frame
 */
export function generateTsx(doc: Doc, frameId?: string): string {
  const { frame, items } = getFrameAndItems(doc, frameId);
  const componentName = toComponentName(frame?.name ?? doc.title);

  // Thu thập các linh kiện được sử dụng
  const usedComponentTypes = new Set<string>();

  const componentJsxBlocks: string[] = [];

  for (const item of items) {
    if (item.layer) {
      collectComponentTypes(item.layer, usedComponentTypes);
      componentJsxBlocks.push(serializeLayer(item.layer, 6));
    } else {
      const fallback = serializeFallbackItem(item);
      if (fallback) {
        if (item.kind === "shadcnButton") usedComponentTypes.add("Button");
        if (item.kind === "shadcnCard") {
          usedComponentTypes.add("Card");
          usedComponentTypes.add("CardHeader");
          usedComponentTypes.add("CardTitle");
          usedComponentTypes.add("CardDescription");
          usedComponentTypes.add("CardContent");
        }
        if (item.kind === "shadcnSelect") {
          usedComponentTypes.add("Select");
          usedComponentTypes.add("SelectTrigger");
          usedComponentTypes.add("SelectValue");
          usedComponentTypes.add("SelectContent");
          usedComponentTypes.add("SelectItem");
        }
        componentJsxBlocks.push(fallback);
      }
    }
  }

  // Gom nhóm import theo đường dẫn module
  const moduleToTypesMap = new Map<string, Set<string>>();
  for (const type of usedComponentTypes) {
    const mod = COMPONENT_MODULE_MAP[type];
    if (mod) {
      if (!moduleToTypesMap.has(mod)) {
        moduleToTypesMap.set(mod, new Set());
      }
      moduleToTypesMap.get(mod)!.add(type);
    }
  }

  const importStatements: string[] = [];
  for (const [mod, types] of moduleToTypesMap.entries()) {
    const sortedTypes = Array.from(types).sort().join(", ");
    importStatements.push(`import { ${sortedTypes} } from "${mod}";`);
  }

  const importsCode = importStatements.length > 0 ? `${importStatements.join("\n")}\n\n` : "";

  const bodyContent =
    componentJsxBlocks.length > 0
      ? componentJsxBlocks.join("\n\n")
      : '      <div className="p-8 text-center text-muted-foreground">\n        No components on this screen.\n      </div>';

  return `import React from "react";
${importsCode}export default function ${componentName}() {
  return (
    <div className="w-full min-h-screen bg-background text-foreground p-6 flex flex-col gap-6">
${bodyContent}
    </div>
  );
}
`;
}
