"use client";

import * as React from "react";
import { cn } from "./utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: "sm" | "md" | "lg" | "full";
}

const ROUNDED_MAP = {
  sm: "rounded-md",
  md: "rounded-xl",
  lg: "rounded-2xl",
  full: "rounded-full",
};

/**
 * Antigravity v3.0 Skeleton
 * Recessed tonal placeholder (--sys-color-surface-lowest) with reduced-motion safety.
 */
export function Skeleton({ rounded = "md", className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-[var(--sys-color-surface-lowest)] border border-[var(--sys-color-border-subtle,var(--sys-color-border-default))] animate-pulse motion-reduce:animate-none",
        ROUNDED_MAP[rounded],
        className
      )}
      {...props}
    />
  );
}

export interface ProgressBarProps {
  value?: number;
  max?: number;
  label?: string;
  indeterminate?: boolean;
  className?: string;
}

/**
 * Antigravity v3.0 Progress Bar
 * Determinate or indeterminate progress indicator with tabular monospace readout and ARIA progressbar semantics.
 */
export function ProgressBar({
  value = 0,
  max = 100,
  label,
  indeterminate = false,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const pct = max > 0 ? Math.round((clamped / max) * 100) : 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--sys-color-text-secondary)]">{label}</span>
          {!indeterminate && (
            <span className="font-mono tabular-nums font-semibold text-[var(--sys-color-text-primary)]">
              {pct}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label ?? "Progress"}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : clamped}
        className="h-2.5 w-full rounded-full bg-[var(--sys-color-surface-lowest)] border border-[var(--sys-color-border-default)] overflow-hidden"
      >
        <div
          className={cn(
            "h-full rounded-full bg-[var(--sys-color-action-primary)] transition-[width] duration-[220ms] ease-[var(--ease-out-quart)] motion-reduce:transition-none",
            indeterminate && "w-1/3 animate-pulse motion-reduce:animate-none"
          )}
          style={indeterminate ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
