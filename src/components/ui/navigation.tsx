"use client";

import * as React from "react";
import { cn, FOCUS_RING_CLASSES } from "./utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Antigravity v3.0 Pagination
 * Keyboard-accessible page controls with 40px touch targets and tabular numerals.
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className={cn("inline-flex items-center gap-1.5", className)}>
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={cn(
          "min-h-[40px] px-3 rounded-xl text-xs font-medium border border-[var(--sys-color-border-default)]",
          "bg-[var(--sys-color-surface-low)] text-[var(--sys-color-text-primary)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
          FOCUS_RING_CLASSES
        )}
      >
        Previous
      </button>

      {pages.map((page) => {
        const active = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onPageChange(page)}
            className={cn(
              "min-w-[40px] min-h-[40px] px-2.5 rounded-xl text-xs font-mono tabular-nums font-semibold cursor-pointer transition-colors motion-reduce:transition-none",
              FOCUS_RING_CLASSES,
              active
                ? "bg-[var(--sys-color-action-primary)] text-[var(--sys-color-text-on-action)]"
                : "bg-[var(--sys-color-surface-low)] text-[var(--sys-color-text-secondary)] border border-[var(--sys-color-border-default)] hover:text-[var(--sys-color-text-primary)]"
            )}
          >
            {page}
          </button>
        );
      })}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={cn(
          "min-h-[40px] px-3 rounded-xl text-xs font-medium border border-[var(--sys-color-border-default)]",
          "bg-[var(--sys-color-surface-low)] text-[var(--sys-color-text-primary)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
          FOCUS_RING_CLASSES
        )}
      >
        Next
      </button>
    </nav>
  );
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Antigravity v3.0 Breadcrumbs
 * Semantic hierarchical navigation with aria-current="page" on the terminal crumb.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--sys-color-text-secondary)]">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5">
              {idx > 0 && (
                <span aria-hidden="true" className="text-[var(--sys-color-text-muted)]">
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "font-medium",
                    isLast ? "text-[var(--sys-color-text-primary)] font-semibold" : ""
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className={cn(
                    "hover:text-[var(--sys-color-text-primary)] underline-offset-4 hover:underline rounded-sm px-0.5",
                    FOCUS_RING_CLASSES
                  )}
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
