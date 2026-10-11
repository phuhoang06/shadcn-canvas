"use client";

import React, { useState } from "react";
import type { Item, Palette } from "@/lib/tokens";
import type { ComponentLayer } from "@/lib/registry/types";
import { flattenLayers, updateLayerById, findLayerById } from "@/lib/hybrid-model";
import { getComponentDefinition } from "@/lib/registry";
import { Field, Section, Segmented, Toggle } from "@/components/ui";

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
        {/* 1. MULTI-MODE SWITCH CHO DIALOG / SHEET */}
        {(rootLayer.type === "Dialog" || item.kind === "shadcnDialog" || rootLayer.type === "Sheet" || item.kind === "shadcnSheet") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: p.primary, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.primary }} />
              {rootLayer.type === "Sheet" || item.kind === "shadcnSheet" ? "Sheet Render Mode" : "Dialog Render Mode"}
            </div>
            <Segmented<"edit" | "preview">
              options={[
                { key: "edit", label: "Edit (Inline)" },
                { key: "preview", label: "Preview (Overlay)" },
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
                <option value="default">default (Primary)</option>
                <option value="gradient">✨ gradient (ProMax)</option>
                <option value="success">🟢 success (Emerald)</option>
                <option value="warning">🟠 warning (Amber)</option>
                <option value="glow">🌟 glow (Accent Shadow)</option>
                <option value="destructive">destructive (Danger)</option>
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

          {/* Checkbox Controls */}
          {activeLayer.type === "Checkbox" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Toggle
                label="Default Checked"
                on={!!(activeProps.defaultChecked ?? activeProps.checked)}
                onChange={(v) => {
                  handlePropChange("defaultChecked", v);
                  if ("checked" in activeProps) {
                    handlePropChange("checked", undefined);
                  }
                }}
                p={p}
              />
              <Toggle
                label="Disabled"
                on={!!activeProps.disabled}
                onChange={(v) => handlePropChange("disabled", v)}
                p={p}
              />
            </div>
          )}

          {/* Switch Controls */}
          {activeLayer.type === "Switch" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Toggle
                label="Default Checked"
                on={!!(activeProps.defaultChecked ?? activeProps.checked)}
                onChange={(v) => {
                  handlePropChange("defaultChecked", v);
                  if ("checked" in activeProps) {
                    handlePropChange("checked", undefined);
                  }
                }}
                p={p}
              />
              <Toggle
                label="Disabled"
                on={!!activeProps.disabled}
                onChange={(v) => handlePropChange("disabled", v)}
                p={p}
              />
            </div>
          )}

          {/* Slider Controls */}
          {activeLayer.type === "Slider" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Min</div>
                  <Field
                    value={String(activeProps.min ?? 0)}
                    onChange={(v) => handlePropChange("min", Number(v) || 0)}
                    placeholder="0"
                    p={p}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Max</div>
                  <Field
                    value={String(activeProps.max ?? 100)}
                    onChange={(v) => handlePropChange("max", Number(v) || 100)}
                    placeholder="100"
                    p={p}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Step</div>
                  <Field
                    value={String(activeProps.step ?? 1)}
                    onChange={(v) => handlePropChange("step", Number(v) || 1)}
                    placeholder="1"
                    p={p}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Default Value</div>
                  <Field
                    value={String(activeProps.defaultValue?.[0] ?? 50)}
                    onChange={(v) => handlePropChange("defaultValue", [Number(v) || 0])}
                    placeholder="50"
                    p={p}
                  />
                </div>
              </div>
              <Toggle
                label="Disabled"
                on={!!activeProps.disabled}
                onChange={(v) => handlePropChange("disabled", v)}
                p={p}
              />
            </div>
          )}

          {/* RadioGroup Controls */}
          {activeLayer.type === "RadioGroup" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Default Value</div>
              <Field
                value={activeProps.defaultValue ?? "option-1"}
                onChange={(v) => handlePropChange("defaultValue", v)}
                placeholder="option-1"
                p={p}
              />
              <Toggle
                label="Disabled"
                on={!!activeProps.disabled}
                onChange={(v) => handlePropChange("disabled", v)}
                p={p}
              />
            </div>
          )}

          {/* RadioGroupItem Controls */}
          {activeLayer.type === "RadioGroupItem" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Value</div>
              <Field
                value={activeProps.value ?? ""}
                onChange={(v) => handlePropChange("value", v)}
                placeholder="e.g. option-1"
                p={p}
              />
              <Toggle
                label="Disabled"
                on={!!activeProps.disabled}
                onChange={(v) => handlePropChange("disabled", v)}
                p={p}
              />
            </div>
          )}

          {/* AvatarImage Controls */}
          {activeLayer.type === "AvatarImage" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Image URL (src)</div>
              <Field
                value={activeProps.src ?? ""}
                onChange={(v) => handlePropChange("src", v)}
                placeholder="https://..."
                p={p}
              />
              <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Alt Text</div>
              <Field
                value={activeProps.alt ?? ""}
                onChange={(v) => handlePropChange("alt", v)}
                placeholder="@shadcn"
                p={p}
              />
            </div>
          )}

          {/* SheetContent Side Selector */}
          {activeLayer.type === "SheetContent" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Side (Drawer Edge)</div>
              <Segmented<"top" | "bottom" | "left" | "right">
                options={[
                  { key: "top", label: "Top" },
                  { key: "bottom", label: "Bottom" },
                  { key: "left", label: "Left" },
                  { key: "right", label: "Right" },
                ]}
                value={activeProps.side ?? "right"}
                onChange={(s) => handlePropChange("side", s)}
                p={p}
              />
            </div>
          )}

          {/* Accordion Controls */}
          {activeLayer.type === "Accordion" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Type</div>
              <Segmented<"single" | "multiple">
                options={[
                  { key: "single", label: "Single" },
                  { key: "multiple", label: "Multiple" },
                ]}
                value={activeProps.type ?? "single"}
                onChange={(t) => {
                  handlePropChange("type", t);
                  if (t === "multiple") {
                    const current = activeProps.defaultValue;
                    const nextVal = Array.isArray(current)
                      ? current
                      : current
                      ? [String(current)]
                      : ["item-1"];
                    handlePropChange("defaultValue", nextVal);
                  } else {
                    const current = activeProps.defaultValue;
                    const nextVal = Array.isArray(current)
                      ? current[0] ?? "item-1"
                      : current ?? "item-1";
                    handlePropChange("defaultValue", nextVal);
                  }
                }}
                p={p}
              />
              {(activeProps.type ?? "single") === "single" && (
                <Toggle
                  label="Collapsible"
                  on={activeProps.collapsible ?? true}
                  onChange={(v) => handlePropChange("collapsible", v)}
                  p={p}
                />
              )}
              <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>
                Default Value {(activeProps.type ?? "single") === "multiple" ? "(comma-separated)" : ""}
              </div>
              <Field
                value={
                  Array.isArray(activeProps.defaultValue)
                    ? activeProps.defaultValue.join(", ")
                    : activeProps.defaultValue ?? ""
                }
                onChange={(v) => {
                  if ((activeProps.type ?? "single") === "multiple") {
                    const arr = v.split(",").map((s) => s.trim()).filter(Boolean);
                    handlePropChange("defaultValue", arr);
                  } else {
                    handlePropChange("defaultValue", v);
                  }
                }}
                placeholder={(activeProps.type ?? "single") === "multiple" ? "item-1, item-2" : "item-1"}
                p={p}
              />
            </div>
          )}

          {/* AccordionItem Controls */}
          {activeLayer.type === "AccordionItem" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Value (Identifier)</div>
              <Field
                value={activeProps.value ?? ""}
                onChange={(v) => handlePropChange("value", v)}
                placeholder="e.g. item-1"
                p={p}
              />
            </div>
          )}

          {/* Tabs Controls */}
          {activeLayer.type === "Tabs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Default Value (Active Tab)</div>
              <Field
                value={activeProps.defaultValue ?? "account"}
                onChange={(v) => handlePropChange("defaultValue", v)}
                placeholder="account"
                p={p}
              />
            </div>
          )}

          {/* TabsTrigger & TabsContent Controls */}
          {(activeLayer.type === "TabsTrigger" || activeLayer.type === "TabsContent") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Value (Tab Identifier)</div>
              <Field
                value={activeProps.value ?? ""}
                onChange={(v) => handlePropChange("value", v)}
                placeholder="e.g. account"
                p={p}
              />
            </div>
          )}

          {/* Alert Controls */}
          {activeLayer.type === "Alert" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant }}>Variant</div>
              <Segmented<"default" | "destructive">
                options={[
                  { key: "default", label: "Default" },
                  { key: "destructive", label: "Destructive" },
                ]}
                value={activeProps.variant ?? "default"}
                onChange={(v) => handlePropChange("variant", v)}
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
