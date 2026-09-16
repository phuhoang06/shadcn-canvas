export * from "./types";
export * from "./definitions";

import { componentRegistry } from "./definitions";
import type { ComponentLayer, RegistryEntry } from "./types";

export function getComponentDefinition(type: string): RegistryEntry | undefined {
  return componentRegistry[type];
}

export function getComponentSchema(type: string) {
  return componentRegistry[type]?.schema;
}

export function listAvailableComponents(): string[] {
  return Object.keys(componentRegistry);
}

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Tạo một ComponentLayer hoàn chỉnh với cây con mặc định (Default Children Tree).
 * Tự động cấp ID duy nhất cho từng node trong cây con.
 */
export function createDefaultLayer(type: string, customProps?: Record<string, any>): ComponentLayer {
  const entry = componentRegistry[type];
  if (!entry) {
    return {
      id: generateId(type.toLowerCase()),
      type,
      props: customProps ?? {},
      children: [],
    };
  }

  // Clone children deeply and assign new IDs
  function cloneChildren(
    children: ComponentLayer[] | string | undefined
  ): ComponentLayer[] | string {
    if (!children) return [];
    if (typeof children === "string") return children;
    if (Array.isArray(children)) {
      return children.map((c) => ({
        id: generateId(c.type.toLowerCase()),
        name: c.name,
        type: c.type,
        props: { ...c.props },
        children: cloneChildren(c.children),
      }));
    }
    return [];
  }

  return {
    id: generateId(type.toLowerCase()),
    name: type,
    type,
    props: { ...customProps },
    children: cloneChildren(entry.defaultChildren),
  };
}
