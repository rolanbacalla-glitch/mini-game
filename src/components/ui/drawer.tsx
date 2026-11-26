"use client";

import * as React from "react";
import { cn, FOCUS_RING_CLASSES } from "./utils";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  side?: "left" | "right";
  children: React.ReactNode;
  className?: string;
}

/**
 * Antigravity v3.0 Drawer / Slide-Over Sheet
 * Edge-anchored modal panel with Escape dismissal and reduced-motion safety.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  children,
  className,
}: DrawerProps) {
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--sys-z-modal,300)] flex bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          "relative w-full max-w-md h-full bg-[var(--sys-color-surface-container)] text-[var(--sys-color-text-primary)]",
          "border-[var(--sys-color-border-default)] shadow-2xl p-6 flex flex-col gap-4 overflow-y-auto",
          "transition-transform duration-[260ms] ease-[var(--ease-out-quart)] motion-reduce:transition-none",
          side === "right" ? "ml-auto border-l" : "mr-auto border-r",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-[var(--sys-color-border-default)]">
          <div className="space-y-1">
            <h2 id={titleId} className="text-lg font-bold tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-[var(--sys-color-text-secondary)]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close drawer"
            className={cn(
              "min-w-[40px] min-h-[40px] rounded-xl text-sm font-mono text-[var(--sys-color-text-muted)] hover:text-[var(--sys-color-text-primary)] cursor-pointer",
              FOCUS_RING_CLASSES
            )}
          >
            ×
          </button>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
