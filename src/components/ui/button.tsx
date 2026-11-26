import * as React from "react";
import { cn, FOCUS_RING_CLASSES } from "./utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--bg-action-primary)] text-[var(--text-on-action)] hover:bg-[var(--bg-action-primary-hover)] border border-transparent",
  secondary:
    "bg-[var(--bg-surface-card)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)]",
  ghost:
    "bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-transparent",
  danger:
    "bg-[var(--bg-feedback-error-subtle)] text-[var(--text-feedback-error)] hover:opacity-90 border border-[var(--border-feedback-error)]",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "min-h-10 px-3 text-xs",
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-11 px-5 text-base",
};

/**
 * M3 Expressive shape-morphing Button (12px resting radius -> 9999px pill on active press)
 * with WCAG 2.2 SC 2.5.8 (>= 40px) hit target and SC 2.4.11 focus ring.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium",
        "rounded-[var(--radius-md,12px)] active:rounded-full transition-[border-radius,background-color,opacity] duration-150",
        "disabled:pointer-events-none disabled:opacity-50",
        "forced-colors:border-[ButtonText]",
        FOCUS_RING_CLASSES,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
