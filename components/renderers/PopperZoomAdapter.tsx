"use client";

import React from "react";
import { useCanvasZoom } from "@/lib/canvas-context";

export interface PopperZoomOptions {
  sideOffset?: number;
  alignOffset?: number;
  arrowPadding?: number;
  collisionPadding?: number;
}

/**
 * Hook Universal Popper Invariant:
 * Tự động tính toán các giá trị offset nhân với tỷ lệ zoom hiện tại của canvas,
 * đồng thời sinh ra CSS transform scale tương ứng.
 */
export function usePopperZoom(options: PopperZoomOptions = {}) {
  const zoom = useCanvasZoom();

  // Fallback mặc định chuẩn của shadcn/ui: sideOffset = 4
  const sideOffset = (options.sideOffset ?? 4) * zoom;
  const alignOffset = (options.alignOffset ?? 0) * zoom;
  const arrowPadding = (options.arrowPadding ?? 4) * zoom;
  const collisionPadding = (options.collisionPadding ?? 0) * zoom;

  const style: React.CSSProperties = zoom !== 1 ? {
    transform: `scale(${zoom})`,
    transformOrigin: "var(--radix-popper-transform-origin)",
  } : {};

  return {
    zoom,
    sideOffset,
    alignOffset,
    arrowPadding,
    collisionPadding,
    style,
  };
}
