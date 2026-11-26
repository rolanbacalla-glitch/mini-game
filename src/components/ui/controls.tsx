"use client";

import * as React from "react";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import * as RadixSwitch from "@radix-ui/react-switch";
import * as RadixTabs from "@radix-ui/react-tabs";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import * as RadixPopover from "@radix-ui/react-popover";
import * as RadixSelect from "@radix-ui/react-select";
import { cn, FOCUS_RING_CLASSES } from "./utils";

/* ---------- Checkbox ---------- */
export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof RadixCheckbox.Root>,
  React.ComponentPropsWithoutRef<typeof RadixCheckbox.Root>
>(({ className, ...props }, ref) => (
  <RadixCheckbox.Root
    ref={ref}
    className={cn(
      "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-xs,4px)]",
      "border border-[var(--border-default)] bg-[var(--bg-surface-recessed)] text-[var(--text-on-action)]",
      "data-[state=checked]:border-[var(--bg-action-primary)] data-[state=checked]:bg-[var(--bg-action-primary)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      FOCUS_RING_CLASSES,
      className
    )}
    {...props}
  >
    <RadixCheckbox.Indicator className="text-xs font-bold leading-none">✓</RadixCheckbox.Indicator>
  </RadixCheckbox.Root>
));
Checkbox.displayName = "Checkbox";

/* ---------- Switch ---------- */
export const Switch = React.forwardRef<
  React.ComponentRef<typeof RadixSwitch.Root>,
  React.ComponentPropsWithoutRef<typeof RadixSwitch.Root>
>(({ className, ...props }, ref) => (
  <RadixSwitch.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-[var(--border-default)]",
      "bg-[var(--bg-surface-recessed)] transition-colors data-[state=checked]:bg-[var(--bg-action-primary)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      FOCUS_RING_CLASSES,
      className
    )}
    {...props}
  >
    <RadixSwitch.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-[var(--text-primary)] shadow transition-transform",
        "translate-x-1 data-[state=checked]:translate-x-6 data-[state=checked]:bg-[var(--text-on-action)]"
      )}
    />
  </RadixSwitch.Root>
));
Switch.displayName = "Switch";

/* ---------- Tabs ---------- */
export const Tabs = RadixTabs.Root;

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof RadixTabs.List>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.List>
>(({ className, ...props }, ref) => (
  <RadixTabs.List
    ref={ref}
    className={cn(
      "inline-flex items-center gap-1 rounded-[var(--radius-md,12px)] border border-[var(--border-default)] bg-[var(--bg-surface-recessed)] p-1",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof RadixTabs.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>
>(({ className, ...props }, ref) => (
  <RadixTabs.Trigger
    ref={ref}
    className={cn(
      "min-h-10 rounded-[var(--radius-sm,8px)] px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors",
      "data-[state=active]:bg-[var(--bg-surface-elevated)] data-[state=active]:text-[var(--text-primary)]",
      FOCUS_RING_CLASSES,
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = RadixTabs.Content;

/* ---------- Tooltip ---------- */
export const TooltipProvider = RadixTooltip.Provider;
export const Tooltip = RadixTooltip.Root;
export const TooltipTrigger = RadixTooltip.Trigger;

export const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof RadixTooltip.Content>,
  React.ComponentPropsWithoutRef<typeof RadixTooltip.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <RadixTooltip.Portal>
    <RadixTooltip.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 rounded-[var(--radius-sm,8px)] border border-[var(--border-default)]",
        "bg-[var(--bg-surface-elevated)] px-3 py-1.5 text-xs text-[var(--text-primary)] shadow-lg",
        className
      )}
      {...props}
    />
  </RadixTooltip.Portal>
));
TooltipContent.displayName = "TooltipContent";

/* ---------- Popover ---------- */
export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;

export const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof RadixPopover.Content>,
  React.ComponentPropsWithoutRef<typeof RadixPopover.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <RadixPopover.Portal>
    <RadixPopover.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-[var(--radius-lg,16px)] border border-[var(--border-default)]",
        "bg-[var(--bg-surface-elevated)] p-4 text-sm text-[var(--text-primary)] shadow-xl",
        FOCUS_RING_CLASSES,
        className
      )}
      {...props}
    />
  </RadixPopover.Portal>
));
PopoverContent.displayName = "PopoverContent";

/* ---------- Select ---------- */
export const Select = RadixSelect.Root;
export const SelectValue = RadixSelect.Value;

export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof RadixSelect.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger>
>(({ className, children, ...props }, ref) => (
  <RadixSelect.Trigger
    ref={ref}
    className={cn(
      "inline-flex min-h-[44px] w-full items-center justify-between gap-2 rounded-[var(--radius-md,12px)]",
      "border border-[var(--border-default)] bg-[var(--bg-surface-recessed)] px-3.5 text-sm text-[var(--text-primary)]",
      "hover:bg-[var(--bg-surface-hover)] disabled:cursor-not-allowed disabled:opacity-50",
      FOCUS_RING_CLASSES,
      className
    )}
    {...props}
  >
    {children}
    <RadixSelect.Icon aria-hidden="true">▾</RadixSelect.Icon>
  </RadixSelect.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  React.ComponentRef<typeof RadixSelect.Content>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Content>
>(({ className, children, ...props }, ref) => (
  <RadixSelect.Portal>
    <RadixSelect.Content
      ref={ref}
      className={cn(
        "z-50 overflow-hidden rounded-[var(--radius-md,12px)] border border-[var(--border-default)]",
        "bg-[var(--bg-surface-elevated)] p-1 text-sm text-[var(--text-primary)] shadow-xl",
        className
      )}
      {...props}
    >
      <RadixSelect.Viewport>{children}</RadixSelect.Viewport>
    </RadixSelect.Content>
  </RadixSelect.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof RadixSelect.Item>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(({ className, children, ...props }, ref) => (
  <RadixSelect.Item
    ref={ref}
    className={cn(
      "relative flex min-h-10 cursor-pointer select-none items-center rounded-[var(--radius-sm,8px)] px-3 text-sm",
      "outline-none data-[highlighted]:bg-[var(--bg-surface-hover)]",
      className
    )}
    {...props}
  >
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
  </RadixSelect.Item>
));
SelectItem.displayName = "SelectItem";
