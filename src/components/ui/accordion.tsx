"use client";

import * as React from "react";
import { cn, FOCUS_RING_CLASSES } from "./utils";

export interface AccordionItemData {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItemData[];
  defaultOpenId?: string;
  className?: string;
}

/**
 * Antigravity v3.0 Accordion
 * Solid Z-Level 1 tonal container with WAI-ARIA disclosure bindings and reduced-motion safety.
 */
export function Accordion({ items, defaultOpenId, className }: AccordionProps) {
  const [openId, setOpenId] = React.useState<string | null>(defaultOpenId ?? null);

  return (
    <div
      className={cn(
        "rounded-2xl bg-[var(--sys-color-surface-low)] border border-[var(--sys-color-border-default)] divide-y divide-[var(--sys-color-border-default)] overflow-hidden",
        className
      )}
    >
      {items.map((item) => {
        const isOpen = openId === item.id;
        const panelId = `accordion-panel-${item.id}`;
        const buttonId = `accordion-trigger-${item.id}`;

        return (
          <div key={item.id}>
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className={cn(
                "w-full min-h-[44px] px-4 py-3 flex items-center justify-between text-left text-sm font-semibold text-[var(--sys-color-text-primary)] cursor-pointer hover:bg-[var(--sys-color-surface-high)] transition-colors motion-reduce:transition-none",
                FOCUS_RING_CLASSES
              )}
            >
              <span>{item.title}</span>
              <span className="font-mono text-xs tabular-nums text-[var(--sys-color-text-muted)]">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="px-4 pb-4 pt-1 text-sm text-[var(--sys-color-text-secondary)] leading-relaxed"
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
