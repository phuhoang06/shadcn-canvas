"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Item, Palette, onToken } from "@/lib/tokens";
import { HierarchicalNodeRenderer } from "@/components/renderers/HierarchicalNodeRenderer";

export interface ShadcnNodeProps {
  item: Item;
  palette: Palette;
  interactive?: boolean;
}

export function ShadcnNode({ item, palette: _palette, interactive }: ShadcnNodeProps) {
  // Ưu tiên render Cây phân cấp ComponentLayer của Hybrid Model
  if (item.layer) {
    return (
      <HierarchicalNodeRenderer
        layer={item.layer}
        interactive={interactive}
        renderMode={item.renderMode ?? "edit"}
      />
    );
  }

  switch (item.kind) {
    case "shadcnButton":
      return (
        <Button
          variant={item.shadcnProps?.buttonVariant ?? "default"}
          size={item.shadcnProps?.buttonSize ?? "default"}
          interactive={interactive}
          style={item.fill ? { background: _palette[item.fill], color: onToken(item.fill, _palette) } : undefined}
        >
          {item.label || "Shadcn Button"}
        </Button>
      );

    case "shadcnCard":
      return (
        <Card className="w-full h-full shadow-md">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-semibold">
              {item.shadcnProps?.cardTitle || item.label || "Card Title"}
            </CardTitle>
            <CardDescription className="text-xs">
              {item.shadcnProps?.cardDescription || "Card Description"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-sm">
            {item.shadcnProps?.cardContent || "Card Content"}
          </CardContent>
        </Card>
      );

    case "shadcnSelect":
      return (
        <Select defaultValue={item.shadcnProps?.selectOptions?.[0]}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={item.shadcnProps?.selectPlaceholder || item.label || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {(item.shadcnProps?.selectOptions ?? ["Option 1", "Option 2", "Option 3"]).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    default:
      return null;
  }
}
