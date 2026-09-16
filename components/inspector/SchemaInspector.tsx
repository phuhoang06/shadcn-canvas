"use client";

import React, { useState } from "react";
import type { Item, Palette } from "@/lib/tokens";
import type { ComponentLayer } from "@/lib/registry/types";
import { flattenLayers, updateLayerById, findLayerById } from "@/lib/hybrid-model";
import { getComponentDefinition } from "@/lib/registry";
import { Field, Section, Segmented } from "@/components/ui";

export interface SchemaInspectorProps {
  item: Item;
  onChange: (patch: Partial<Item>) => void;
  palette: Palette;
}

export function SchemaInspector({ item, onChange, palette: p }: SchemaInspectorProps) {
  const rootLayer = item.layer;
  if (!rootLayer) return null;

  const flat = flattenLayers(rootLayer);
  const [activeId, setActiveId] = useState<string>(rootLayer.id);

  // Tìm layer đang được chọn
  const activeLayer = findLayerById(rootLayer, activeId) || rootLayer;
  const activeDef = getComponentDefinition(activeLayer.type);
  const activeProps = (activeLayer.props || {}) as Record<string, any>;

  // Helper cập nhật prop cho layer đang chọn
  const handlePropChange = (propKey: string, value: any) => {
    const updatedRoot = updateLayerById(rootLayer, activeLayer.id, (l) => ({
      ...l,
      props: {
        ...l.props,
        [propKey]: value,
      },
    }));
    onChange({ layer: updatedRoot });
  };

  // Helper cập nhật children text (nếu là chuỗi)
  const handleTextChange = (text: string) => {
    const updatedRoot = updateLayerById(rootLayer, activeLayer.id, (l) => ({
      ...l,
      children: text,
    }));
    onChange({ layer: updatedRoot, label: text });
  };

  return (
    <Section id="schema-inspector" icon="tune" title="Component Tree & Schema" p={p}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* 1. MULTI-MODE SWITCH CHO DIALOG / MODAL */}
        {(rootLayer.type === "Dialog" || item.kind === "shadcnDialog") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: p.primary, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.primary }} />
              Dialog Render Mode
            </div>
            <Segmented<"edit" | "preview">
              options={[
                { key: "edit", label: "Edit (Inline)" },
                { key: "preview", label: "Preview (Modal)" },
              ]}
              value={item.renderMode ?? "edit"}
              onChange={(mode) => onChange({ renderMode: mode })}
              p={p}
            />
          </div>
        )}

        {/* 2. LAYER TREE BREADCRUMB / SELECTOR */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: p.onSurfaceVariant }}>Select Layer in Tree</div>
          <select
            value={activeLayer.id}
            onChange={(e) => setActiveId(e.target.value)}
            style={{
              width: "100%",
              height: 36,
              padding: "0 8px",
              borderRadius: 8,
              border: `1px solid ${p.outlineVariant}`,
              background: p.surfaceContainerHigh,
              color: p.onSurface,
              fontSize: 13,
              outline: "none",
              cursor: "pointer",
            }}
          >
            {flat.map(({ layer, depth }) => (
              <option key={layer.id} value={layer.id}>
                {"\u00A0\u00A0".repeat(depth)} {layer.type} ({layer.id})
              </option>
            ))}
          </select>
        </div>

        {/* 3. DYNAMIC PROPS FORM CHO ACTIVE LAYER */}
        <div style={{ padding: 8, borderRadius: 8, background: p.surfaceContainerLow, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: p.onSurface, borderBottom: `1px solid ${p.outlineVariant}`, paddingBottom: 4 }}>
            Configuring: <span style={{ color: p.primary }}>{activeLayer.type}</span>
          </div>

          {/* Sửa text nếu children là chuỗi */}
          {typeof activeLayer.children === "string" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Text Content</div>
              <Field
                value={activeLayer.children}
                onChange={handleTextChange}
                placeholder="Text label"
                p={p}
                icon="title"
              />
            </div>
          )}

          {/* Variant Selector */}
          {(activeLayer.type === "Button" || activeLayer.type === "Badge") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Variant</div>
              <select
                value={activeProps.variant ?? "default"}
                onChange={(e) => handlePropChange("variant", e.target.value)}
                style={{
                  width: "100%",
                  height: 34,
                  padding: "0 8px",
                  borderRadius: 6,
                  border: `1px solid ${p.outlineVariant}`,
                  background: p.surfaceContainerHigh,
                  color: p.onSurface,
                  fontSize: 13,
                }}
              >
                <option value="default">default</option>
                <option value="destructive">destructive</option>
                <option value="outline">outline</option>
                <option value="secondary">secondary</option>
                <option value="ghost">ghost</option>
                <option value="link">link</option>
              </select>
            </div>
          )}

          {/* Size Selector */}
          {activeLayer.type === "Button" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Size</div>
              <Segmented<"default" | "sm" | "lg" | "icon">
                options={[
                  { key: "default", label: "md" },
                  { key: "sm", label: "sm" },
                  { key: "lg", label: "lg" },
                  { key: "icon", label: "icon" },
                ]}
                value={activeProps.size ?? "default"}
                onChange={(s) => handlePropChange("size", s)}
                p={p}
              />
            </div>
          )}

          {/* Popover Align Selector */}
          {activeLayer.type === "PopoverContent" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Align</div>
              <Segmented<"start" | "center" | "end">
                options={[
                  { key: "start", label: "Start" },
                  { key: "center", label: "Center" },
                  { key: "end", label: "End" },
                ]}
                value={activeProps.align ?? "center"}
                onChange={(al) => handlePropChange("align", al)}
                p={p}
              />
            </div>
          )}

          {/* Custom Tailwind className */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Tailwind ClassName</div>
            <Field
              value={activeProps.className ?? ""}
              onChange={(cn) => handlePropChange("className", cn)}
              placeholder="e.g. w-full text-red-500"
              p={p}
              icon="style"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
