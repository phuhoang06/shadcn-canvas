import type { CanvasNode, ComponentLayer } from "./registry/types";
import { createDefaultLayer, getComponentDefinition } from "./registry";
import type { Item, Kind } from "./tokens";
import { uid } from "./tokens";

/**
 * Khởi tạo một CanvasNode hoàn chỉnh với tọa độ không gian (x, y)
 * và cây ComponentLayer mặc định từ Registry.
 */
export function createCanvasNode(
  type: string,
  pos: { x: number; y: number; w?: number; h?: number; frameId?: string; renderMode?: "edit" | "preview" }
): CanvasNode {
  const layer = createDefaultLayer(type);
  return {
    id: `cnode-${uid()}`,
    frameId: pos.frameId,
    x: pos.x,
    y: pos.y,
    w: pos.w,
    h: pos.h,
    renderMode: pos.renderMode ?? (type === "Dialog" ? "edit" : undefined),
    layer,
  };
}

/**
 * Tìm kiếm một node trong cây ComponentLayer theo id (Duyệt theo chiều sâu DFS)
 */
export function findLayerById(root: ComponentLayer, targetId: string): ComponentLayer | null {
  if (root.id === targetId) return root;
  if (Array.isArray(root.children)) {
    for (const child of root.children) {
      const found = findLayerById(child, targetId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Cập nhật một node cụ thể trong cây ComponentLayer (Immutable update)
 */
export function updateLayerById(
  root: ComponentLayer,
  targetId: string,
  updater: (l: ComponentLayer) => ComponentLayer
): ComponentLayer {
  if (root.id === targetId) {
    return updater(root);
  }
  if (Array.isArray(root.children)) {
    return {
      ...root,
      children: root.children.map((child) => updateLayerById(child, targetId, updater)),
    };
  }
  return root;
}

/**
 * Lấy danh sách toàn bộ các layer trong cây (phẳng hóa để hiển thị trong Tree / Breadcrumb)
 */
export function flattenLayers(
  root: ComponentLayer,
  depth: number = 0
): Array<{ layer: ComponentLayer; depth: number }> {
  const result: Array<{ layer: ComponentLayer; depth: number }> = [{ layer: root, depth }];
  if (Array.isArray(root.children)) {
    for (const child of root.children) {
      result.push(...flattenLayers(child, depth + 1));
    }
  }
  return result;
}

/**
 * Chuyển đổi một CanvasNode sang cấu trúc Item của M3E Canvas để render và tương tác
 */
export function canvasNodeToItem(node: CanvasNode): Item {
  const compType = node.layer.type;
  let kind: Kind = "button";
  
  if (compType === "Button") kind = "shadcnButton";
  else if (compType === "Card") kind = "shadcnCard";
  else if (compType === "Select") kind = "shadcnSelect";

  return {
    id: node.id,
    kind,
    label: (typeof node.layer.children === "string" ? node.layer.children : node.layer.name) || compType,
    icon: null,
    variant: "filled",
    layer: node.layer,
    renderMode: node.renderMode,
  };
}
