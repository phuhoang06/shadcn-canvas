import { z } from "zod";
import type { ComponentRegistry, ComponentLayer } from "./types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export const componentRegistry: ComponentRegistry = {
  // ============================================
  // BUTTON & BADGE
  // ============================================
  Button: {
    component: Button,
    schema: z.object({
      className: z.string().optional(),
      variant: z
        .enum(["default", "destructive", "outline", "secondary", "ghost", "link"])
        .default("default"),
      size: z.enum(["default", "sm", "lg", "icon"]).default("default"),
      disabled: z.boolean().optional(),
      type: z.enum(["button", "submit", "reset"]).optional(),
    }),
    from: "@/components/ui/button",
    defaultChildren: "Button",
  },
  Badge: {
    component: Badge,
    schema: z.object({
      className: z.string().optional(),
      variant: z
        .enum(["default", "secondary", "destructive", "outline"])
        .default("default"),
    }),
    from: "@/components/ui/badge",
    defaultChildren: "Badge",
  },

  // ============================================
  // CARD & CARD SUB-COMPONENTS
  // ============================================
  Card: {
    component: Card,
    schema: z.object({
      className: z.string().optional(),
    }),
    from: "@/components/ui/card",
    defaultChildren: [
      {
        id: "card-header",
        type: "CardHeader",
        name: "CardHeader",
        props: {},
        children: [
          {
            id: "card-title",
            type: "CardTitle",
            name: "CardTitle",
            props: {},
            children: "Card Title",
          },
          {
            id: "card-desc",
            type: "CardDescription",
            name: "CardDescription",
            props: {},
            children: "Card Description",
          },
        ],
      },
      {
        id: "card-content",
        type: "CardContent",
        name: "CardContent",
        props: {},
        children: "Card Content goes here.",
      },
      {
        id: "card-footer",
        type: "CardFooter",
        name: "CardFooter",
        props: {},
        children: [
          {
            id: "card-footer-btn",
            type: "Button",
            name: "Button",
            props: { variant: "default" },
            children: "Action",
          },
        ],
      },
    ],
  },
  CardHeader: {
    component: CardHeader,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/card",
    childOf: ["Card"],
    defaultChildren: [],
  },
  CardTitle: {
    component: CardTitle,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/card",
    childOf: ["CardHeader"],
    defaultChildren: "Card Title",
  },
  CardDescription: {
    component: CardDescription,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/card",
    childOf: ["CardHeader"],
    defaultChildren: "Card Description",
  },
  CardContent: {
    component: CardContent,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/card",
    childOf: ["Card"],
    defaultChildren: "Card Content",
  },
  CardFooter: {
    component: CardFooter,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/card",
    childOf: ["Card"],
    defaultChildren: [],
  },

  // ============================================
  // DIALOG (VIEWPORT MODAL)
  // ============================================
  Dialog: {
    component: Dialog,
    schema: z.object({
      defaultOpen: z.boolean().optional(),
      open: z.boolean().optional(),
      modal: z.boolean().optional(),
    }),
    from: "@/components/ui/dialog",
    defaultChildren: [
      {
        id: "dialog-trigger",
        type: "DialogTrigger",
        name: "DialogTrigger",
        props: { asChild: true },
        children: [
          {
            id: "dialog-trigger-btn",
            type: "Button",
            name: "Button",
            props: { variant: "outline" },
            children: "Open Dialog",
          },
        ],
      },
      {
        id: "dialog-content",
        type: "DialogContent",
        name: "DialogContent",
        props: {},
        children: [
          {
            id: "dialog-header",
            type: "DialogHeader",
            name: "DialogHeader",
            props: {},
            children: [
              {
                id: "dialog-title",
                type: "DialogTitle",
                name: "DialogTitle",
                props: {},
                children: "Dialog Title",
              },
              {
                id: "dialog-desc",
                type: "DialogDescription",
                name: "DialogDescription",
                props: {},
                children: "This is a dialog description.",
              },
            ],
          },
          {
            id: "dialog-footer",
            type: "DialogFooter",
            name: "DialogFooter",
            props: {},
            children: [
              {
                id: "dialog-close-btn",
                type: "Button",
                name: "Button",
                props: { variant: "default" },
                children: "Confirm",
              },
            ],
          },
        ],
      },
    ],
  },
  DialogTrigger: {
    component: DialogTrigger,
    schema: z.object({ asChild: z.boolean().optional() }),
    from: "@/components/ui/dialog",
    childOf: ["Dialog"],
    defaultChildren: [],
  },
  DialogContent: {
    component: DialogContent,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/dialog",
    childOf: ["Dialog"],
    defaultChildren: [],
  },
  DialogHeader: {
    component: DialogHeader,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/dialog",
    childOf: ["DialogContent"],
    defaultChildren: [],
  },
  DialogTitle: {
    component: DialogTitle,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/dialog",
    childOf: ["DialogHeader"],
    defaultChildren: "Dialog Title",
  },
  DialogDescription: {
    component: DialogDescription,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/dialog",
    childOf: ["DialogHeader"],
    defaultChildren: "Dialog Description",
  },
  DialogFooter: {
    component: DialogFooter,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/dialog",
    childOf: ["DialogContent"],
    defaultChildren: [],
  },
  DialogClose: {
    component: DialogClose,
    schema: z.object({ asChild: z.boolean().optional() }),
    from: "@/components/ui/dialog",
    childOf: ["DialogContent"],
    defaultChildren: [],
  },

  // ============================================
  // POPOVER (TRIGGER-ANCHORED PORTAL WITH ARROW)
  // ============================================
  Popover: {
    component: Popover,
    schema: z.object({
      defaultOpen: z.boolean().optional(),
      open: z.boolean().optional(),
      modal: z.boolean().optional(),
    }),
    from: "@/components/ui/popover",
    defaultChildren: [
      {
        id: "popover-trigger",
        type: "PopoverTrigger",
        name: "PopoverTrigger",
        props: { asChild: true },
        children: [
          {
            id: "popover-trigger-btn",
            type: "Button",
            name: "Button",
            props: { variant: "outline" },
            children: "Open Popover",
          },
        ],
      },
      {
        id: "popover-content",
        type: "PopoverContent",
        name: "PopoverContent",
        props: {},
        children: "Popover content information.",
      },
    ],
  },
  PopoverTrigger: {
    component: PopoverTrigger,
    schema: z.object({ asChild: z.boolean().optional() }),
    from: "@/components/ui/popover",
    childOf: ["Popover"],
    defaultChildren: [],
  },
  PopoverContent: {
    component: PopoverContent,
    schema: z.object({
      className: z.string().optional(),
      align: z.enum(["start", "center", "end"]).default("center"),
      sideOffset: z.number().default(4),
    }),
    from: "@/components/ui/popover",
    childOf: ["Popover"],
    defaultChildren: [],
  },

  // ============================================
  // SELECT (TRIGGER-ANCHORED DROPDOWN)
  // ============================================
  Select: {
    component: Select,
    schema: z.object({
      defaultValue: z.string().optional(),
      value: z.string().optional(),
      disabled: z.boolean().optional(),
    }),
    from: "@/components/ui/select",
    defaultChildren: [
      {
        id: "select-trigger",
        type: "SelectTrigger",
        name: "SelectTrigger",
        props: { className: "w-[180px]" },
        children: [
          {
            id: "select-value",
            type: "SelectValue",
            name: "SelectValue",
            props: { placeholder: "Select an option" },
            children: [],
          },
        ],
      },
      {
        id: "select-content",
        type: "SelectContent",
        name: "SelectContent",
        props: {},
        children: [
          { id: "select-item-1", type: "SelectItem", name: "SelectItem", props: { value: "option-1" }, children: "Option 1" },
          { id: "select-item-2", type: "SelectItem", name: "SelectItem", props: { value: "option-2" }, children: "Option 2" },
          { id: "select-item-3", type: "SelectItem", name: "SelectItem", props: { value: "option-3" }, children: "Option 3" },
        ],
      },
    ],
  },
  SelectTrigger: {
    component: SelectTrigger,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/select",
    childOf: ["Select"],
    defaultChildren: [],
  },
  SelectValue: {
    component: SelectValue,
    schema: z.object({ placeholder: z.string().optional() }),
    from: "@/components/ui/select",
    childOf: ["SelectTrigger"],
    defaultChildren: [],
  },
  SelectContent: {
    component: SelectContent,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/select",
    childOf: ["Select"],
    defaultChildren: [],
  },
  SelectItem: {
    component: SelectItem,
    schema: z.object({ value: z.string() }),
    from: "@/components/ui/select",
    childOf: ["SelectContent"],
    defaultChildren: "Option",
  },

  // ============================================
  // FORM PRIMITIVES & SEPARATOR
  // ============================================
  Input: {
    component: Input,
    schema: z.object({
      className: z.string().optional(),
      placeholder: z.string().optional(),
      type: z.enum(["text", "email", "password", "number"]).default("text"),
      disabled: z.boolean().optional(),
    }),
    from: "@/components/ui/input",
    defaultChildren: [],
  },
  Textarea: {
    component: Textarea,
    schema: z.object({
      className: z.string().optional(),
      placeholder: z.string().optional(),
      rows: z.number().optional(),
      disabled: z.boolean().optional(),
    }),
    from: "@/components/ui/textarea",
    defaultChildren: [],
  },
  Separator: {
    component: Separator,
    schema: z.object({
      className: z.string().optional(),
      orientation: z.enum(["horizontal", "vertical"]).default("horizontal"),
    }),
    from: "@/components/ui/separator",
    defaultChildren: [],
  },
};
