"use client";

import * as React from "react";
import { cn, FOCUS_RING_CLASSES } from "./utils";

export interface DropdownMenuItem {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export interface DropdownMenuProps {
  triggerLabel: string;
  items: DropdownMenuItem[];
  surface?: "glass" | "solid";
  className?: string;
}

/**
 * Antigravity v3.0 Dropdown Menu
 * Accessible WAI-ARIA menu with ArrowUp/ArrowDown/Escape keyboard navigation.
 */
export function DropdownMenu({
  triggerLabel,
  items,
  surface = "glass",
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const item = items[activeIndex];
      if (item && !item.disabled) {
        item.onSelect();
        setOpen(false);
      }
    }
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "min-h-[40px] px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 cursor-pointer",
          "bg-[var(--sys-color-surface-low)] text-[var(--sys-color-text-primary)] border border-[var(--sys-color-border-default)]",
          FOCUS_RING_CLASSES
        )}
      >
        <span>{triggerLabel}</span>
      </button>

      {open && (
        <div
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className={cn(
            "absolute right-0 mt-2 min-w-[200px] p-1.5 rounded-2xl shadow-xl z-[var(--sys-z-popover,400)]",
            "border border-[var(--sys-color-border-default)]",
            surface === "glass"
              ? "liquid-glass-regular"
              : "bg-[var(--sys-color-surface-container)]"
          )}
        >
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => {
                if (item.disabled) return;
                item.onSelect();
                setOpen(false);
              }}
              className={cn(
                "w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-sm flex items-center justify-between cursor-pointer transition-colors motion-reduce:transition-none",
                FOCUS_RING_CLASSES,
                item.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : idx === activeIndex
                    ? "bg-[var(--sys-color-surface-high)] text-[var(--sys-color-text-primary)] font-medium"
                    : "text-[var(--sys-color-text-secondary)] hover:text-[var(--sys-color-text-primary)]"
              )}
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <kbd className="font-mono text-[11px] tabular-nums text-[var(--sys-color-text-muted)]">
                  {item.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
