"use client";

import * as React from "react";
import { cn, FOCUS_RING_CLASSES } from "./utils";

export type ToastTone = "info" | "success" | "warning" | "error";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
  timestamp?: string;
}

export interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  className?: string;
}

const TONE_STYLES: Record<ToastTone, string> = {
  info: "border-[var(--sys-color-border-default)]",
  success: "border-[var(--sys-color-feedback-success)]",
  warning: "border-[var(--sys-color-feedback-warning)]",
  error: "border-[var(--sys-color-feedback-error)]",
};

/**
 * Antigravity v3.0 Toast / Notification Stack
 * Non-blocking status alerts with tabular monospace timestamps and ARIA live announcements.
 */
export function ToastStack({ toasts, onDismiss, className }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className={cn(
        "fixed bottom-5 right-5 z-[var(--sys-z-toast,500)] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none",
        className
      )}
    >
      {toasts.map((toast) => {
        const tone = toast.tone ?? "info";
        return (
          <div
            key={toast.id}
            role={tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto liquid-glass-regular rounded-2xl p-4 border shadow-xl flex items-start justify-between gap-3",
              "text-[var(--sys-color-text-primary)] motion-reduce:transition-none",
              TONE_STYLES[tone]
            )}
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold truncate">{toast.title}</span>
                {toast.timestamp && (
                  <span className="font-mono text-[11px] tabular-nums text-[var(--sys-color-text-muted)] shrink-0">
                    {toast.timestamp}
                  </span>
                )}
              </div>
              {toast.description && (
                <p className="text-xs text-[var(--sys-color-text-secondary)] leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label={`Dismiss ${toast.title}`}
              className={cn(
                "min-w-[32px] min-h-[32px] rounded-lg text-xs font-mono text-[var(--sys-color-text-muted)] hover:text-[var(--sys-color-text-primary)] cursor-pointer shrink-0",
                FOCUS_RING_CLASSES
              )}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
