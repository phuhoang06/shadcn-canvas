import type React from "react";
import { type ComponentType as ReactComponentType, type ReactNode } from "react";
import { type ZodObject, type ZodSchema } from "zod";

export type PropValue =
  | ReactNode
  | Record<string, any>
  | any[]
  | string
  | number
  | boolean
  | null
  | undefined;

export type ComponentProps<TProps extends Record<string, PropValue> = Record<string, PropValue>> = TProps;

/**
 * Cấu trúc DOM Tree phân cấp của UI-Builder cho từng component.
 * Children có thể là mảng component con, string text, hoặc null.
 */
export interface ComponentLayer<TProps extends Record<string, PropValue> = Record<string, PropValue>> {
  id: string;
  name?: string;
  type: string;
  props: ComponentProps<TProps>;
  children: ComponentLayer[] | string;
}

export type FieldConfigItem = {
  description?: React.ReactNode;
  inputProps?: Record<string, any>;
  label?: string;
  fieldType?: string | ReactComponentType<any>;
  [key: string]: any;
};

export type FieldConfigFunction = (layer: ComponentLayer) => FieldConfigItem;

export interface RegistryEntry<T extends ReactComponentType<any> = ReactComponentType<any>> {
  component?: T;
  schema: ZodObject<any> | ZodSchema<any>;
  from?: string;
  isFromDefaultExport?: boolean;
  defaultProps?: Record<string, any>;
  defaultChildren?: ComponentLayer[] | string;
  fieldOverrides?: Record<string, FieldConfigFunction>;
  childOf?: string[];
  skipEditorWrapper?: boolean;
}

export type ComponentRegistry = Record<string, RegistryEntry>;

/**
 * Tầng Spatial Wrapper kết hợp hệ tọa độ M3E Canvas với ComponentLayer của UI-Builder.
 */
export interface CanvasNode {
  id: string;
  frameId?: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  renderMode?: "edit" | "preview";
  layer: ComponentLayer;
}
