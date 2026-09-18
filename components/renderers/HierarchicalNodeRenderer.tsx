"use client";

import React from "react";
import type { ComponentLayer } from "@/lib/registry/types";
import { getComponentDefinition } from "@/lib/registry";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { usePopperZoom } from "./PopperZoomAdapter";
import { cn } from "@/lib/utils";

export interface HierarchicalRendererProps extends React.HTMLAttributes<any> {
  layer: ComponentLayer;
  interactive?: boolean;
  renderMode?: "edit" | "preview";
  selectedLayerId?: string;
  onSelectLayer?: (layerId: string) => void;
  ref?: React.Ref<any>;
}

export function HierarchicalNodeRenderer({
  layer,
  interactive = false,
  renderMode = "edit",
  selectedLayerId,
  onSelectLayer,
  className: incomingClassName,
  onClick: incomingOnClick,
  ref,
  ...restProps
}: HierarchicalRendererProps): React.ReactElement | null {
  const isSelected = selectedLayerId === layer.id;
  const props = (layer.props || {}) as Record<string, any>;

  // Helper render children đệ quy
  const renderChildren = () => {
    if (typeof layer.children === "string") {
      return layer.children;
    }
    if (Array.isArray(layer.children)) {
      if (layer.children.length === 1) {
        const child = layer.children[0];
        return (
          <HierarchicalNodeRenderer
            key={child.id}
            layer={child}
            interactive={interactive}
            renderMode={renderMode}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
          />
        );
      }
      return layer.children.map((child) => (
        <HierarchicalNodeRenderer
          key={child.id}
          layer={child}
          interactive={interactive}
          renderMode={renderMode}
          selectedLayerId={selectedLayerId}
          onSelectLayer={onSelectLayer}
        />
      ));
    }
    return null;
  };

  const handleLayerClick = (e: React.MouseEvent) => {
    if (onSelectLayer) {
      e.stopPropagation();
      onSelectLayer(layer.id);
    }
  };

  // 1. BUTTON
  if (layer.type === "Button") {
    return (
      <Button
        ref={ref}
        variant={props.variant ?? "default"}
        size={props.size ?? "default"}
        className={cn(
          props.className,
          incomingClassName,
          renderMode !== "preview" && !interactive && "pointer-events-none",
          isSelected && "ring-2 ring-blue-500"
        )}
        onClick={(e) => {
          handleLayerClick(e);
          incomingOnClick?.(e);
        }}
        {...restProps}
      >
        {renderChildren()}
      </Button>
    );
  }

  // 2. BADGE
  if (layer.type === "Badge") {
    return (
      <Badge
        variant={props.variant ?? "default"}
        className={cn(props.className, isSelected && "ring-2 ring-blue-500")}
        onClick={handleLayerClick}
      >
        {renderChildren()}
      </Badge>
    );
  }

  // 3. CARD & SUB-COMPONENTS
  if (layer.type === "Card") {
    return (
      <Card
        className={cn("w-full h-full shadow-sm", props.className, isSelected && "ring-2 ring-blue-500")}
        onClick={handleLayerClick}
      >
        {renderChildren()}
      </Card>
    );
  }
  if (layer.type === "CardHeader") {
    return (
      <CardHeader className={cn(props.className, isSelected && "ring-2 ring-blue-500")} onClick={handleLayerClick}>
        {renderChildren()}
      </CardHeader>
    );
  }
  if (layer.type === "CardTitle") {
    return (
      <CardTitle className={cn(props.className, isSelected && "ring-2 ring-blue-500")} onClick={handleLayerClick}>
        {renderChildren()}
      </CardTitle>
    );
  }
  if (layer.type === "CardDescription") {
    return (
      <CardDescription className={cn(props.className, isSelected && "ring-2 ring-blue-500")} onClick={handleLayerClick}>
        {renderChildren()}
      </CardDescription>
    );
  }
  if (layer.type === "CardContent") {
    return (
      <CardContent className={cn(props.className, isSelected && "ring-2 ring-blue-500")} onClick={handleLayerClick}>
        {renderChildren()}
      </CardContent>
    );
  }
  if (layer.type === "CardFooter") {
    return (
      <CardFooter className={cn(props.className, isSelected && "ring-2 ring-blue-500")} onClick={handleLayerClick}>
        {renderChildren()}
      </CardFooter>
    );
  }

  // 4. DIALOG (MULTI-MODE RENDERING)
  if (layer.type === "Dialog") {
    if (renderMode === "edit") {
      // Edit Mode: Bọc trong Dialog open={false} để cấp context cho DialogTrigger mà không mở modal overlay
      return (
        <Dialog open={false}>
          <div
            className={cn(
              "rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50/10 p-4 shadow-sm w-full",
              isSelected && "ring-2 ring-indigo-500"
            )}
            onClick={handleLayerClick}
          >
            <div className="flex items-center justify-between mb-3 border-b pb-2 border-indigo-100">
              <span className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Dialog [Edit Mode]
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Inline Sub-Canvas Artboard</span>
            </div>
            <div className="space-y-3">{renderChildren()}</div>
          </div>
        </Dialog>
      );
    }

    // Preview Mode: Render Radix Dialog thông thường
    return (
      <Dialog defaultOpen={props.defaultOpen} open={props.open}>
        {renderChildren()}
      </Dialog>
    );
  }
  if (layer.type === "DialogTrigger") {
    const singleChild = Array.isArray(layer.children) && layer.children.length > 0 ? layer.children[0] : null;
    return (
      <DialogTrigger asChild>
        {singleChild ? (
          <HierarchicalNodeRenderer
            key={singleChild.id}
            layer={singleChild}
            interactive={interactive}
            renderMode={renderMode}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
          />
        ) : (
          <Button variant="outline">Open Dialog</Button>
        )}
      </DialogTrigger>
    );
  }
  if (layer.type === "DialogContent") {
    return (
      <DialogContent isFrame={renderMode === "edit"} className={props.className}>
        {renderChildren()}
      </DialogContent>
    );
  }
  if (layer.type === "DialogHeader") {
    return <DialogHeader className={props.className}>{renderChildren()}</DialogHeader>;
  }
  if (layer.type === "DialogTitle") {
    return <DialogTitle className={props.className}>{renderChildren()}</DialogTitle>;
  }
  if (layer.type === "DialogDescription") {
    return <DialogDescription className={props.className}>{renderChildren()}</DialogDescription>;
  }
  if (layer.type === "DialogFooter") {
    return <DialogFooter className={props.className}>{renderChildren()}</DialogFooter>;
  }
  if (layer.type === "DialogClose") {
    const singleChild = Array.isArray(layer.children) && layer.children.length > 0 ? layer.children[0] : null;
    return (
      <DialogClose asChild>
        {singleChild ? (
          <HierarchicalNodeRenderer
            key={singleChild.id}
            layer={singleChild}
            interactive={interactive}
            renderMode={renderMode}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
          />
        ) : (
          <Button variant="outline">Close</Button>
        )}
      </DialogClose>
    );
  }

  // 5. POPOVER (VỚI UNIVERSAL POPPER INVARIANT)
  if (layer.type === "Popover") {
    return <Popover defaultOpen={props.defaultOpen}>{renderChildren()}</Popover>;
  }
  if (layer.type === "PopoverTrigger") {
    const singleChild = Array.isArray(layer.children) && layer.children.length > 0 ? layer.children[0] : null;
    return (
      <PopoverTrigger asChild>
        {singleChild ? (
          <HierarchicalNodeRenderer
            key={singleChild.id}
            layer={singleChild}
            interactive={interactive}
            renderMode={renderMode}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
          />
        ) : (
          <Button variant="outline">Open Popover</Button>
        )}
      </PopoverTrigger>
    );
  }
  if (layer.type === "PopoverContent") {
    return <WrappedPopoverContent layer={layer}>{renderChildren()}</WrappedPopoverContent>;
  }

  // 6. SELECT
  if (layer.type === "Select") {
    return (
      <Select defaultValue={props.defaultValue} value={props.value}>
        {renderChildren()}
      </Select>
    );
  }
  if (layer.type === "SelectTrigger") {
    return (
      <SelectTrigger className={props.className}>
        {renderChildren()}
      </SelectTrigger>
    );
  }
  if (layer.type === "SelectValue") {
    return <SelectValue placeholder={props.placeholder ?? "Select an option"} />;
  }
  if (layer.type === "SelectContent") {
    return <SelectContent className={props.className}>{renderChildren()}</SelectContent>;
  }
  if (layer.type === "SelectItem") {
    return (
      <SelectItem value={props.value ?? "option"}>
        {renderChildren()}
      </SelectItem>
    );
  }

  // 7. FORM INPUTS & SEPARATOR
  if (layer.type === "Input") {
    return (
      <Input
        placeholder={props.placeholder}
        type={props.type ?? "text"}
        disabled={props.disabled}
        className={cn(props.className, isSelected && "ring-2 ring-blue-500")}
        onClick={handleLayerClick}
      />
    );
  }
  if (layer.type === "Textarea") {
    return (
      <Textarea
        placeholder={props.placeholder}
        rows={props.rows}
        disabled={props.disabled}
        className={cn(props.className, isSelected && "ring-2 ring-blue-500")}
        onClick={handleLayerClick}
      />
    );
  }
  if (layer.type === "Separator") {
    return <Separator orientation={props.orientation ?? "horizontal"} className={props.className} />;
  }

  // 8. DROPDOWN MENU (VỚI NESTED SUBMENUS & UNIVERSAL POPPER INVARIANT)
  if (layer.type === "DropdownMenu") {
    return (
      <DropdownMenu defaultOpen={props.defaultOpen} open={props.open}>
        {renderChildren()}
      </DropdownMenu>
    );
  }
  if (layer.type === "DropdownMenuTrigger") {
    const singleChild = Array.isArray(layer.children) && layer.children.length > 0 ? layer.children[0] : null;
    return (
      <DropdownMenuTrigger asChild>
        {singleChild ? (
          <HierarchicalNodeRenderer
            key={singleChild.id}
            layer={singleChild}
            interactive={interactive}
            renderMode={renderMode}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
          />
        ) : (
          <Button variant="outline">Options Menu</Button>
        )}
      </DropdownMenuTrigger>
    );
  }
  if (layer.type === "DropdownMenuContent") {
    return <WrappedDropdownMenuContent layer={layer}>{renderChildren()}</WrappedDropdownMenuContent>;
  }
  if (layer.type === "DropdownMenuItem") {
    return (
      <DropdownMenuItem
        disabled={props.disabled}
        className={cn(props.className, isSelected && "ring-2 ring-blue-500")}
        onClick={handleLayerClick}
      >
        {renderChildren()}
      </DropdownMenuItem>
    );
  }
  if (layer.type === "DropdownMenuLabel") {
    return (
      <DropdownMenuLabel className={props.className} onClick={handleLayerClick}>
        {renderChildren()}
      </DropdownMenuLabel>
    );
  }
  if (layer.type === "DropdownMenuSeparator") {
    return <DropdownMenuSeparator className={props.className} />;
  }
  if (layer.type === "DropdownMenuGroup") {
    return <DropdownMenuGroup className={props.className}>{renderChildren()}</DropdownMenuGroup>;
  }
  if (layer.type === "DropdownMenuSub") {
    return (
      <DropdownMenuSub defaultOpen={props.defaultOpen} open={props.open}>
        {renderChildren()}
      </DropdownMenuSub>
    );
  }
  if (layer.type === "DropdownMenuSubTrigger") {
    return (
      <DropdownMenuSubTrigger
        inset={props.inset}
        className={cn(props.className, isSelected && "ring-2 ring-blue-500")}
        onClick={handleLayerClick}
      >
        {renderChildren()}
      </DropdownMenuSubTrigger>
    );
  }
  if (layer.type === "DropdownMenuSubContent") {
    return <WrappedDropdownMenuSubContent layer={layer}>{renderChildren()}</WrappedDropdownMenuSubContent>;
  }

  // 9. TOOLTIP (VỚI UNIVERSAL POPPER INVARIANT)
  if (layer.type === "TooltipProvider") {
    return <TooltipProvider delayDuration={props.delayDuration}>{renderChildren()}</TooltipProvider>;
  }
  if (layer.type === "Tooltip") {
    return (
      <TooltipProvider>
        <Tooltip defaultOpen={props.defaultOpen} open={props.open}>
          {renderChildren()}
        </Tooltip>
      </TooltipProvider>
    );
  }
  if (layer.type === "TooltipTrigger") {
    const singleChild = Array.isArray(layer.children) && layer.children.length > 0 ? layer.children[0] : null;
    return (
      <TooltipTrigger asChild>
        {singleChild ? (
          <HierarchicalNodeRenderer
            key={singleChild.id}
            layer={singleChild}
            interactive={interactive}
            renderMode={renderMode}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
          />
        ) : (
          <Button variant="outline">Hover</Button>
        )}
      </TooltipTrigger>
    );
  }
  if (layer.type === "TooltipContent") {
    return <WrappedTooltipContent layer={layer}>{renderChildren()}</WrappedTooltipContent>;
  }

  // Fallback cho text hoặc HTML tag
  return <span onClick={handleLayerClick}>{renderChildren()}</span>;
}

/**
 * Wrapper PopoverContent ứng dụng Universal Popper Invariant
 */
function WrappedPopoverContent({
  layer,
  children,
}: {
  layer: ComponentLayer;
  children: React.ReactNode;
}) {
  const props = (layer.props || {}) as Record<string, any>;
  const popper = usePopperZoom({
    sideOffset: props.sideOffset,
    alignOffset: props.alignOffset,
  });

  return (
    <PopoverContent
      align={props.align ?? "center"}
      sideOffset={popper.sideOffset}
      style={popper.style}
      className={props.className}
    >
      {children}
    </PopoverContent>
  );
}

/**
 * Wrapper DropdownMenuContent ứng dụng Universal Popper Invariant (Tầng 1)
 */
function WrappedDropdownMenuContent({
  layer,
  children,
}: {
  layer: ComponentLayer;
  children: React.ReactNode;
}) {
  const props = (layer.props || {}) as Record<string, any>;
  const popper = usePopperZoom({
    sideOffset: props.sideOffset,
    alignOffset: props.alignOffset,
  });

  return (
    <DropdownMenuContent
      align={props.align ?? "start"}
      sideOffset={popper.sideOffset}
      style={popper.style}
      className={props.className}
    >
      {children}
    </DropdownMenuContent>
  );
}

/**
 * Wrapper DropdownMenuSubContent ứng dụng Universal Popper Invariant (Tầng 2 - Nested Portal)
 */
function WrappedDropdownMenuSubContent({
  layer,
  children,
}: {
  layer: ComponentLayer;
  children: React.ReactNode;
}) {
  const props = (layer.props || {}) as Record<string, any>;
  const popper = usePopperZoom({
    sideOffset: props.sideOffset,
    alignOffset: props.alignOffset,
  });

  return (
    <DropdownMenuSubContent
      sideOffset={popper.sideOffset}
      style={popper.style}
      className={props.className}
    >
      {children}
    </DropdownMenuSubContent>
  );
}

/**
 * Wrapper TooltipContent ứng dụng Universal Popper Invariant
 */
function WrappedTooltipContent({
  layer,
  children,
}: {
  layer: ComponentLayer;
  children: React.ReactNode;
}) {
  const props = (layer.props || {}) as Record<string, any>;
  const popper = usePopperZoom({
    sideOffset: props.sideOffset,
    alignOffset: props.alignOffset,
  });

  return (
    <TooltipContent
      side={props.side ?? "top"}
      sideOffset={popper.sideOffset}
      style={popper.style}
      className={props.className}
    >
      {children}
    </TooltipContent>
  );
}
