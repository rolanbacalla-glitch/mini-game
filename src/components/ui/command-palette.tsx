"use client";

import * as React from "react";
import { cn, FOCUS_RING_CLASSES } from "./utils";

export interface CommandItem {
  id: string;
  label: string;
  group?: string;
  shortcut?: string;
  keywords?: string[];
  onSelect: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * Antigravity v3.0 Command Palette (⌘K)
 * Floating Z-Level 2 frosted-glass overlay with full keyboard navigation (ArrowUp/Down, Enter, Esc).
 */
export function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = "Type a command or search…",
  emptyMessage = "No matching commands found.",
  className,
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group?.toLowerCase().includes(q) ||
        item.keywords?.some((kw) => kw.toLowerCase().includes(q))
    );
  }, [items, query]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  React.useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0
      );
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      filtered[activeIndex].onSelect();
      onOpenChange(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[var(--sys-z-popover,400)] flex items-start justify-center pt-[14vh] px-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          "liquid-glass-regular w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden",
          "border border-[var(--sys-color-border-default)] text-[var(--sys-color-text-primary)]",
          "motion-reduce:transition-none",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--sys-color-border-default)]">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Search commands"
            className="w-full min-h-[40px] bg-transparent text-sm text-[var(--sys-color-text-primary)] placeholder:text-[var(--sys-color-text-muted)] outline-none"
          />
          <kbd className="font-mono text-[11px] tabular-nums px-2 py-1 rounded-md border border-[var(--sys-color-border-default)] text-[var(--sys-color-text-muted)]">
            ESC
          </kbd>
        </div>

        <ul role="listbox" aria-label="Command results" className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-xs text-[var(--sys-color-text-muted)]">
              {emptyMessage}
            </li>
          ) : (
            filtered.map((item, idx) => {
              const active = idx === activeIndex;
              return (
                <li key={item.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      item.onSelect();
                      onOpenChange(false);
                    }}
                    className={cn(
                      "w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center justify-between text-left text-sm cursor-pointer transition-colors motion-reduce:transition-none",
                      FOCUS_RING_CLASSES,
                      active
                        ? "bg-[var(--sys-color-action-primary)] text-[var(--sys-color-text-on-action)] font-semibold"
                        : "text-[var(--sys-color-text-primary)] hover:bg-[var(--sys-color-surface-high)]"
                    )}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <kbd className="font-mono text-[11px] tabular-nums opacity-80">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
