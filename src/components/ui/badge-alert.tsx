import * as React from "react";
import { cn } from "./utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "accent" | "success" | "warning" | "error";
}

const badgeTones: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral:
    "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]",
  accent:
    "bg-[var(--bg-action-primary-subtle)] text-[var(--bg-action-primary)] border-[var(--border-focus-ring)]",
  success:
    "bg-[var(--bg-surface-card)] text-[var(--text-feedback-success)] border-[var(--text-feedback-success)]",
  warning:
    "bg-[var(--bg-surface-card)] text-[var(--text-feedback-warning)] border-[var(--text-feedback-warning)]",
  error:
    "bg-[var(--bg-feedback-error-subtle)] text-[var(--text-feedback-error)] border-[var(--border-feedback-error)]",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums",
        badgeTones[tone],
        className
      )}
      {...props}
    />
  );
}

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "info" | "success" | "warning" | "error";
  title?: string;
}

const alertTones: Record<NonNullable<AlertProps["tone"]>, string> = {
  info: "bg-[var(--bg-surface-card)] text-[var(--text-primary)] border-[var(--border-default)]",
  success:
    "bg-[var(--bg-surface-card)] text-[var(--text-feedback-success)] border-[var(--text-feedback-success)]",
  warning:
    "bg-[var(--bg-surface-card)] text-[var(--text-feedback-warning)] border-[var(--text-feedback-warning)]",
  error:
    "bg-[var(--bg-feedback-error-subtle)] text-[var(--text-feedback-error)] border-[var(--border-feedback-error)]",
};

export function Alert({ tone = "info", title, className, children, ...props }: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[var(--radius-lg,16px)] border p-4 text-sm",
        alertTones[tone],
        className
      )}
      {...props}
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}
