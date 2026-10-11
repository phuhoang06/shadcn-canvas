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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";

export const componentRegistry: ComponentRegistry = {
  // ============================================
  // BUTTON & BADGE
  // ============================================
  Button: {
    component: Button,
    schema: z.object({
      className: z.string().optional(),
      variant: z
        .enum([
          "default",
          "destructive",
          "outline",
          "secondary",
          "ghost",
          "link",
          "gradient",
          "success",
          "warning",
          "glow",
        ])
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

  // ============================================
  // DROPDOWN MENU (NESTED PORTALS)
  // ============================================
  DropdownMenu: {
    component: DropdownMenu,
    schema: z.object({
      defaultOpen: z.boolean().optional(),
      open: z.boolean().optional(),
      modal: z.boolean().optional(),
    }),
    from: "@/components/ui/dropdown-menu",
    defaultChildren: [
      {
        id: "dropdown-trigger",
        type: "DropdownMenuTrigger",
        name: "DropdownMenuTrigger",
        props: { asChild: true },
        children: [
          {
            id: "dropdown-btn",
            type: "Button",
            name: "Button",
            props: { variant: "outline" },
            children: "Options Menu",
          },
        ],
      },
      {
        id: "dropdown-content",
        type: "DropdownMenuContent",
        name: "DropdownMenuContent",
        props: { sideOffset: 4 },
        children: [
          {
            id: "dd-label",
            type: "DropdownMenuLabel",
            name: "DropdownMenuLabel",
            props: {},
            children: "Actions",
          },
          {
            id: "dd-item-1",
            type: "DropdownMenuItem",
            name: "DropdownMenuItem",
            props: {},
            children: "Profile",
          },
          {
            id: "dd-item-2",
            type: "DropdownMenuItem",
            name: "DropdownMenuItem",
            props: {},
            children: "Settings",
          },
          {
            id: "dd-sep-1",
            type: "DropdownMenuSeparator",
            name: "DropdownMenuSeparator",
            props: {},
            children: [],
          },
          {
            id: "dd-sub-1",
            type: "DropdownMenuSub",
            name: "DropdownMenuSub",
            props: {},
            children: [
              {
                id: "dd-sub-trigger",
                type: "DropdownMenuSubTrigger",
                name: "DropdownMenuSubTrigger",
                props: {},
                children: "More Tools",
              },
              {
                id: "dd-sub-content",
                type: "DropdownMenuSubContent",
                name: "DropdownMenuSubContent",
                props: { sideOffset: 2 },
                children: [
                  {
                    id: "dd-sub-item-1",
                    type: "DropdownMenuItem",
                    name: "DropdownMenuItem",
                    props: {},
                    children: "Nested Action 1",
                  },
                  {
                    id: "dd-sub-item-2",
                    type: "DropdownMenuItem",
                    name: "DropdownMenuItem",
                    props: {},
                    children: "Nested Action 2",
                  },
                ],
              },
            ],
          },
          {
            id: "dd-sep-2",
            type: "DropdownMenuSeparator",
            name: "DropdownMenuSeparator",
            props: {},
            children: [],
          },
          {
            id: "dd-item-3",
            type: "DropdownMenuItem",
            name: "DropdownMenuItem",
            props: {},
            children: "Logout",
          },
        ],
      },
    ],
  },
  DropdownMenuTrigger: {
    component: DropdownMenuTrigger,
    schema: z.object({ asChild: z.boolean().optional() }),
    from: "@/components/ui/dropdown-menu",
    childOf: ["DropdownMenu"],
    defaultChildren: [],
  },
  DropdownMenuContent: {
    component: DropdownMenuContent,
    schema: z.object({
      className: z.string().optional(),
      sideOffset: z.number().optional(),
      align: z.enum(["start", "center", "end"]).optional(),
    }),
    from: "@/components/ui/dropdown-menu",
    childOf: ["DropdownMenu"],
    defaultChildren: [],
  },
  DropdownMenuItem: {
    component: DropdownMenuItem,
    schema: z.object({
      className: z.string().optional(),
      disabled: z.boolean().optional(),
    }),
    from: "@/components/ui/dropdown-menu",
    childOf: ["DropdownMenuContent", "DropdownMenuSubContent", "DropdownMenuGroup"],
    defaultChildren: "Menu Item",
  },
  DropdownMenuLabel: {
    component: DropdownMenuLabel,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/dropdown-menu",
    childOf: ["DropdownMenuContent", "DropdownMenuSubContent"],
    defaultChildren: "Label",
  },
  DropdownMenuSeparator: {
    component: DropdownMenuSeparator,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/dropdown-menu",
    childOf: ["DropdownMenuContent", "DropdownMenuSubContent"],
    defaultChildren: [],
  },
  DropdownMenuSub: {
    component: DropdownMenuSub,
    schema: z.object({}),
    from: "@/components/ui/dropdown-menu",
    childOf: ["DropdownMenuContent"],
    defaultChildren: [],
  },
  DropdownMenuSubTrigger: {
    component: DropdownMenuSubTrigger,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/dropdown-menu",
    childOf: ["DropdownMenuSub"],
    defaultChildren: "Sub Menu",
  },
  DropdownMenuSubContent: {
    component: DropdownMenuSubContent,
    schema: z.object({
      className: z.string().optional(),
      sideOffset: z.number().optional(),
    }),
    from: "@/components/ui/dropdown-menu",
    childOf: ["DropdownMenuSub"],
    defaultChildren: [],
  },

  // ============================================
  // TOOLTIP (TRIGGER-ANCHORED POPPER)
  // ============================================
  Tooltip: {
    component: Tooltip,
    schema: z.object({
      defaultOpen: z.boolean().optional(),
      open: z.boolean().optional(),
      delayDuration: z.number().optional(),
    }),
    from: "@/components/ui/tooltip",
    defaultChildren: [
      {
        id: "tooltip-trigger",
        type: "TooltipTrigger",
        name: "TooltipTrigger",
        props: { asChild: true },
        children: [
          {
            id: "tooltip-btn",
            type: "Button",
            name: "Button",
            props: { variant: "outline" },
            children: "Hover me",
          },
        ],
      },
      {
        id: "tooltip-content",
        type: "TooltipContent",
        name: "TooltipContent",
        props: { sideOffset: 4 },
        children: "Helpful tooltip information",
      },
    ],
  },
  TooltipTrigger: {
    component: TooltipTrigger,
    schema: z.object({ asChild: z.boolean().optional() }),
    from: "@/components/ui/tooltip",
    childOf: ["Tooltip"],
    defaultChildren: [],
  },
  TooltipContent: {
    component: TooltipContent,
    schema: z.object({
      className: z.string().optional(),
      sideOffset: z.number().optional(),
      side: z.enum(["top", "right", "bottom", "left"]).optional(),
    }),
    from: "@/components/ui/tooltip",
    childOf: ["Tooltip"],
    defaultChildren: "Tooltip text",
  },
  TooltipProvider: {
    component: TooltipProvider,
    schema: z.object({ delayDuration: z.number().optional() }),
    from: "@/components/ui/tooltip",
    defaultChildren: [],
  },

  // ============================================
  // FORM CONTROLS (PHASE 3 TIER 2)
  // ============================================
  Checkbox: {
    component: Checkbox,
    schema: z.object({
      checked: z.boolean().optional(),
      defaultChecked: z.boolean().optional(),
      disabled: z.boolean().optional(),
      className: z.string().optional(),
    }),
    from: "@/components/ui/checkbox",
  },
  Switch: {
    component: Switch,
    schema: z.object({
      checked: z.boolean().optional(),
      defaultChecked: z.boolean().optional(),
      disabled: z.boolean().optional(),
      className: z.string().optional(),
    }),
    from: "@/components/ui/switch",
  },
  Slider: {
    component: Slider,
    schema: z.object({
      defaultValue: z.array(z.coerce.number()).optional(),
      min: z.coerce.number().optional(),
      max: z.coerce.number().optional(),
      step: z.coerce.number().optional(),
      disabled: z.boolean().optional(),
      className: z.string().optional(),
    }),
    from: "@/components/ui/slider",
  },
  RadioGroup: {
    component: RadioGroup,
    schema: z.object({
      defaultValue: z.string().optional(),
      disabled: z.boolean().optional(),
      className: z.string().optional(),
    }),
    from: "@/components/ui/radio-group",
    defaultChildren: [
      {
        id: "radio-item-1",
        type: "RadioGroupItem",
        name: "RadioGroupItem",
        props: { value: "option-1" },
        children: [],
      },
      {
        id: "radio-item-2",
        type: "RadioGroupItem",
        name: "RadioGroupItem",
        props: { value: "option-2" },
        children: [],
      },
    ],
  },
  RadioGroupItem: {
    component: RadioGroupItem,
    schema: z.object({
      value: z.string(),
      disabled: z.boolean().optional(),
      className: z.string().optional(),
    }),
    from: "@/components/ui/radio-group",
    childOf: ["RadioGroup"],
    defaultChildren: [],
  },
  Label: {
    component: Label,
    schema: z.object({
      htmlFor: z.string().optional(),
      className: z.string().optional(),
    }),
    from: "@/components/ui/label",
    defaultChildren: "Label Text",
  },
  Avatar: {
    component: Avatar,
    schema: z.object({
      className: z.string().optional(),
    }),
    from: "@/components/ui/avatar",
    defaultChildren: [
      {
        id: "avatar-img",
        type: "AvatarImage",
        name: "AvatarImage",
        props: {
          src: "https://github.com/shadcn.png",
          alt: "@shadcn",
        },
        children: [],
      },
      {
        id: "avatar-fallback",
        type: "AvatarFallback",
        name: "AvatarFallback",
        props: {},
        children: "CN",
      },
    ],
  },
  AvatarImage: {
    component: AvatarImage,
    schema: z.object({
      src: z.string(),
      alt: z.string().optional(),
      className: z.string().optional(),
    }),
    from: "@/components/ui/avatar",
    childOf: ["Avatar"],
    defaultChildren: [],
  },
  AvatarFallback: {
    component: AvatarFallback,
    schema: z.object({
      className: z.string().optional(),
    }),
    from: "@/components/ui/avatar",
    childOf: ["Avatar"],
    defaultChildren: "CN",
  },

  // ============================================
  // STRUCTURAL & LAYOUT (PHASE 3 TIER 3)
  // ============================================
  Sheet: {
    component: Sheet,
    schema: z.object({
      defaultOpen: z.boolean().optional(),
      open: z.boolean().optional(),
    }),
    from: "@/components/ui/sheet",
    defaultChildren: [
      {
        id: "sheet-trig",
        type: "SheetTrigger",
        name: "SheetTrigger",
        props: { asChild: true },
        children: [
          {
            id: "sheet-btn",
            type: "Button",
            name: "Button",
            props: { variant: "outline" },
            children: "Open Sheet",
          },
        ],
      },
      {
        id: "sheet-cnt",
        type: "SheetContent",
        name: "SheetContent",
        props: { side: "right" },
        children: [
          {
            id: "sheet-hdr",
            type: "SheetHeader",
            name: "SheetHeader",
            props: {},
            children: [
              {
                id: "sheet-title",
                type: "SheetTitle",
                name: "SheetTitle",
                props: {},
                children: "Edit Profile",
              },
              {
                id: "sheet-desc",
                type: "SheetDescription",
                name: "SheetDescription",
                props: {},
                children: "Make changes to your profile here. Click save when you're done.",
              },
            ],
          },
          {
            id: "sheet-ftr",
            type: "SheetFooter",
            name: "SheetFooter",
            props: {},
            children: [
              {
                id: "sheet-save-btn",
                type: "Button",
                name: "Button",
                props: {},
                children: "Save changes",
              },
            ],
          },
        ],
      },
    ],
  },
  SheetTrigger: {
    component: SheetTrigger,
    schema: z.object({
      asChild: z.boolean().optional(),
    }),
    from: "@/components/ui/sheet",
    childOf: ["Sheet"],
    defaultChildren: [],
  },
  SheetContent: {
    component: SheetContent,
    schema: z.object({
      side: z.enum(["top", "bottom", "left", "right"]).optional(),
      className: z.string().optional(),
    }),
    from: "@/components/ui/sheet",
    childOf: ["Sheet"],
    defaultChildren: [],
  },
  SheetHeader: {
    component: SheetHeader,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/sheet",
    childOf: ["SheetContent"],
    defaultChildren: [],
  },
  SheetFooter: {
    component: SheetFooter,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/sheet",
    childOf: ["SheetContent"],
    defaultChildren: [],
  },
  SheetTitle: {
    component: SheetTitle,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/sheet",
    childOf: ["SheetHeader"],
    defaultChildren: "Sheet Title",
  },
  SheetDescription: {
    component: SheetDescription,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/sheet",
    childOf: ["SheetHeader"],
    defaultChildren: "Sheet description goes here.",
  },
  SheetClose: {
    component: SheetClose,
    schema: z.object({ asChild: z.boolean().optional() }),
    from: "@/components/ui/sheet",
    childOf: ["SheetContent", "SheetFooter"],
    defaultChildren: [],
  },

  Accordion: {
    component: Accordion,
    schema: z.object({
      type: z.enum(["single", "multiple"]).default("single"),
      collapsible: z.boolean().optional(),
      defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
      className: z.string().optional(),
    }),
    from: "@/components/ui/accordion",
    defaultChildren: [
      {
        id: "acc-item-1",
        type: "AccordionItem",
        name: "AccordionItem",
        props: { value: "item-1" },
        children: [
          {
            id: "acc-trig-1",
            type: "AccordionTrigger",
            name: "AccordionTrigger",
            props: {},
            children: "Is it accessible?",
          },
          {
            id: "acc-cnt-1",
            type: "AccordionContent",
            name: "AccordionContent",
            props: {},
            children: "Yes. It adheres to the WAI-ARIA design pattern.",
          },
        ],
      },
      {
        id: "acc-item-2",
        type: "AccordionItem",
        name: "AccordionItem",
        props: { value: "item-2" },
        children: [
          {
            id: "acc-trig-2",
            type: "AccordionTrigger",
            name: "AccordionTrigger",
            props: {},
            children: "Is it styled?",
          },
          {
            id: "acc-cnt-2",
            type: "AccordionContent",
            name: "AccordionContent",
            props: {},
            children: "Yes. It comes with default styles that match the other components.",
          },
        ],
      },
    ],
  },
  AccordionItem: {
    component: AccordionItem,
    schema: z.object({
      value: z.string(),
      className: z.string().optional(),
    }),
    from: "@/components/ui/accordion",
    childOf: ["Accordion"],
    defaultChildren: [],
  },
  AccordionTrigger: {
    component: AccordionTrigger,
    schema: z.object({
      className: z.string().optional(),
    }),
    from: "@/components/ui/accordion",
    childOf: ["AccordionItem"],
    defaultChildren: "Accordion Trigger",
  },
  AccordionContent: {
    component: AccordionContent,
    schema: z.object({
      className: z.string().optional(),
    }),
    from: "@/components/ui/accordion",
    childOf: ["AccordionItem"],
    defaultChildren: "Accordion Content",
  },

  Tabs: {
    component: Tabs,
    schema: z.object({
      defaultValue: z.string().optional(),
      className: z.string().optional(),
    }),
    from: "@/components/ui/tabs",
    defaultChildren: [
      {
        id: "tabs-list",
        type: "TabsList",
        name: "TabsList",
        props: {},
        children: [
          {
            id: "tab-trig-1",
            type: "TabsTrigger",
            name: "TabsTrigger",
            props: { value: "account" },
            children: "Account",
          },
          {
            id: "tab-trig-2",
            type: "TabsTrigger",
            name: "TabsTrigger",
            props: { value: "password" },
            children: "Password",
          },
        ],
      },
      {
        id: "tab-cnt-1",
        type: "TabsContent",
        name: "TabsContent",
        props: { value: "account" },
        children: "Make changes to your account here.",
      },
      {
        id: "tab-cnt-2",
        type: "TabsContent",
        name: "TabsContent",
        props: { value: "password" },
        children: "Change your password here.",
      },
    ],
  },
  TabsList: {
    component: TabsList,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/tabs",
    childOf: ["Tabs"],
    defaultChildren: [],
  },
  TabsTrigger: {
    component: TabsTrigger,
    schema: z.object({
      value: z.string(),
      className: z.string().optional(),
    }),
    from: "@/components/ui/tabs",
    childOf: ["TabsList"],
    defaultChildren: "Tab",
  },
  TabsContent: {
    component: TabsContent,
    schema: z.object({
      value: z.string(),
      className: z.string().optional(),
    }),
    from: "@/components/ui/tabs",
    childOf: ["Tabs"],
    defaultChildren: "Tab content",
  },

  Alert: {
    component: Alert,
    schema: z.object({
      variant: z.enum(["default", "destructive"]).default("default"),
      className: z.string().optional(),
    }),
    from: "@/components/ui/alert",
    defaultChildren: [
      {
        id: "alert-title",
        type: "AlertTitle",
        name: "AlertTitle",
        props: {},
        children: "Heads up!",
      },
      {
        id: "alert-desc",
        type: "AlertDescription",
        name: "AlertDescription",
        props: {},
        children: "You can add components to your app using the cli.",
      },
    ],
  },
  AlertTitle: {
    component: AlertTitle,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/alert",
    childOf: ["Alert"],
    defaultChildren: "Alert Title",
  },
  AlertDescription: {
    component: AlertDescription,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/alert",
    childOf: ["Alert"],
    defaultChildren: "Alert Description",
  },

  Table: {
    component: Table,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/table",
    defaultChildren: [
      {
        id: "table-hdr",
        type: "TableHeader",
        name: "TableHeader",
        props: {},
        children: [
          {
            id: "table-row-h",
            type: "TableRow",
            name: "TableRow",
            props: {},
            children: [
              { id: "th-1", type: "TableHead", name: "TableHead", props: {}, children: "Invoice" },
              { id: "th-2", type: "TableHead", name: "TableHead", props: {}, children: "Status" },
              { id: "th-3", type: "TableHead", name: "TableHead", props: {}, children: "Amount" },
            ],
          },
        ],
      },
      {
        id: "table-bdy",
        type: "TableBody",
        name: "TableBody",
        props: {},
        children: [
          {
            id: "table-row-1",
            type: "TableRow",
            name: "TableRow",
            props: {},
            children: [
              { id: "td-1-1", type: "TableCell", name: "TableCell", props: {}, children: "INV001" },
              { id: "td-1-2", type: "TableCell", name: "TableCell", props: {}, children: "Paid" },
              { id: "td-1-3", type: "TableCell", name: "TableCell", props: {}, children: "$250.00" },
            ],
          },
          {
            id: "table-row-2",
            type: "TableRow",
            name: "TableRow",
            props: {},
            children: [
              { id: "td-2-1", type: "TableCell", name: "TableCell", props: {}, children: "INV002" },
              { id: "td-2-2", type: "TableCell", name: "TableCell", props: {}, children: "Pending" },
              { id: "td-2-3", type: "TableCell", name: "TableCell", props: {}, children: "$150.00" },
            ],
          },
        ],
      },
    ],
  },
  TableHeader: {
    component: TableHeader,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/table",
    childOf: ["Table"],
    defaultChildren: [],
  },
  TableBody: {
    component: TableBody,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/table",
    childOf: ["Table"],
    defaultChildren: [],
  },
  TableFooter: {
    component: TableFooter,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/table",
    childOf: ["Table"],
    defaultChildren: [],
  },
  TableRow: {
    component: TableRow,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/table",
    childOf: ["Table", "TableHeader", "TableBody", "TableFooter"],
    defaultChildren: [],
  },
  TableHead: {
    component: TableHead,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/table",
    childOf: ["TableRow"],
    defaultChildren: "Header",
  },
  TableCell: {
    component: TableCell,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/table",
    childOf: ["TableRow"],
    defaultChildren: "Cell",
  },
  TableCaption: {
    component: TableCaption,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/table",
    childOf: ["Table"],
    defaultChildren: "A list of recent invoices.",
  },

  // ============================================
  // SKELETON & PROGRESS
  // ============================================
  Skeleton: {
    component: Skeleton,
    schema: z.object({
      className: z.string().optional(),
    }),
    from: "@/components/ui/skeleton",
    defaultProps: {
      className: "h-4 w-full",
    },
    defaultChildren: [],
  },
  Progress: {
    component: Progress,
    schema: z.object({
      className: z.string().optional(),
      value: z.number().optional(),
      max: z.number().optional(),
    }),
    from: "@/components/ui/progress",
    defaultProps: {
      value: 60,
    },
    defaultChildren: [],
  },

  // ============================================
  // BREADCRUMB
  // ============================================
  Breadcrumb: {
    component: Breadcrumb,
    schema: z.object({
      className: z.string().optional(),
    }),
    from: "@/components/ui/breadcrumb",
    defaultChildren: [
      {
        id: "bc-list-1",
        name: "BreadcrumbList",
        type: "BreadcrumbList",
        props: {},
        children: [
          {
            id: "bc-item-1",
            name: "BreadcrumbItem",
            type: "BreadcrumbItem",
            props: {},
            children: [
              {
                id: "bc-link-1",
                name: "BreadcrumbLink",
                type: "BreadcrumbLink",
                props: { href: "#" },
                children: "Home",
              },
            ],
          },
          {
            id: "bc-sep-1",
            name: "BreadcrumbSeparator",
            type: "BreadcrumbSeparator",
            props: {},
            children: [],
          },
          {
            id: "bc-item-2",
            name: "BreadcrumbItem",
            type: "BreadcrumbItem",
            props: {},
            children: [
              {
                id: "bc-page-1",
                name: "BreadcrumbPage",
                type: "BreadcrumbPage",
                props: {},
                children: "Dashboard",
              },
            ],
          },
        ],
      },
    ],
  },
  BreadcrumbList: {
    component: BreadcrumbList,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/breadcrumb",
    childOf: ["Breadcrumb"],
    defaultChildren: [],
  },
  BreadcrumbItem: {
    component: BreadcrumbItem,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/breadcrumb",
    childOf: ["BreadcrumbList"],
    defaultChildren: [],
  },
  BreadcrumbLink: {
    component: BreadcrumbLink,
    schema: z.object({ href: z.string().optional(), className: z.string().optional() }),
    from: "@/components/ui/breadcrumb",
    childOf: ["BreadcrumbItem"],
    defaultChildren: "Link",
  },
  BreadcrumbPage: {
    component: BreadcrumbPage,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/breadcrumb",
    childOf: ["BreadcrumbItem"],
    defaultChildren: "Page",
  },
  BreadcrumbSeparator: {
    component: BreadcrumbSeparator,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/breadcrumb",
    childOf: ["BreadcrumbList"],
    defaultChildren: [],
  },
  BreadcrumbEllipsis: {
    component: BreadcrumbEllipsis,
    schema: z.object({ className: z.string().optional() }),
    from: "@/components/ui/breadcrumb",
    childOf: ["BreadcrumbItem"],
    defaultChildren: [],
  },
};
