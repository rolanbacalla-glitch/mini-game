"use client";

import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { cn, FOCUS_RING_CLASSES } from "./utils";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

export const DialogContent = React.forwardRef<
  React.ComponentRef<typeof RadixDialog.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Content>
>(({ className, children, ...props }, ref) => (
  <RadixDialog.Portal>
    <RadixDialog.Overlay className="fixed inset-0 z-[var(--sys-z-modal-backdrop,400)] bg-black/50 backdrop-blur-sm" />
    <RadixDialog.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-[var(--sys-z-modal,450)] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2",
        "rounded-[var(--radius-xl,24px)] border border-[var(--border-default)]",
        "bg-[var(--bg-surface-elevated)] p-6 text-[var(--text-primary)] shadow-2xl",
        "forced-colors:border-[CanvasText]",
        FOCUS_RING_CLASSES,
        className
      )}
      {...props}
    >
      {children}
    </RadixDialog.Content>
  </RadixDialog.Portal>
));
DialogContent.displayName = "DialogContent";

export const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof RadixDialog.Title>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Title>
>(({ className, ...props }, ref) => (
  <RadixDialog.Title
    ref={ref}
    className={cn("text-lg font-semibold text-[var(--text-primary)]", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof RadixDialog.Description>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Description>
>(({ className, ...props }, ref) => (
  <RadixDialog.Description
    ref={ref}
    className={cn("mt-1.5 text-sm text-[var(--text-secondary)]", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";
