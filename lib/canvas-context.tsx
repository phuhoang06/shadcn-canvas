"use client";

import * as React from "react";

export interface CanvasContextValue {
  zoom: number;
  isCanvas: boolean;
}

const CanvasContext = React.createContext<CanvasContextValue>({
  zoom: 1,
  isCanvas: false,
});

export const CanvasProvider = CanvasContext.Provider;

export function useCanvasZoom(): number {
  return React.useContext(CanvasContext).zoom;
}

export function useCanvasContext(): CanvasContextValue {
  return React.useContext(CanvasContext);
}
