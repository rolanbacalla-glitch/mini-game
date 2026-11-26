import * as React from "react";
import { cn, FOCUS_RING_CLASSES } from "./utils";

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  errorText?: string;
}

/**
 * WCAG 2.2 AA Accessible Form Field Input.
 * Programmatically associates <label htmlFor>, helper text, and polite live error feedback.
 */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ id, label, helperText, errorText, required, className, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    const isInvalid = Boolean(errorText);

    const describedBy = [helperText ? helperId : null, isInvalid ? errorId : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-[13px] font-semibold text-[var(--text-secondary)]"
        >
          {label}
          {required ? (
            <span aria-hidden="true" className="ms-1 text-[var(--text-feedback-error)]">
              *
            </span>
          ) : null}
        </label>

        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={isInvalid || undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy || undefined}
          aria-errormessage={isInvalid ? errorId : undefined}
          className={cn(
            "min-h-[44px] w-full rounded-[var(--radius-md,12px)] px-3.5 text-sm",
            "bg-[var(--bg-surface-recessed)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
            "border transition-colors",
            isInvalid
              ? "border-[var(--border-feedback-error)] bg-[var(--bg-feedback-error-subtle)]"
              : "border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "forced-colors:border-[FieldText]",
            FOCUS_RING_CLASSES,
            className
          )}
          {...props}
        />

        {helperText ? (
          <p id={helperId} className="text-xs text-[var(--text-muted)]">
            {helperText}
          </p>
        ) : null}

        <p
          id={errorId}
          role="status"
          aria-live="polite"
          className={cn(
            "text-xs font-medium text-[var(--text-feedback-error)]",
            !isInvalid && "sr-only"
          )}
        >
          {errorText ?? ""}
        </p>
      </div>
    );
  }
);
FormField.displayName = "FormField";
