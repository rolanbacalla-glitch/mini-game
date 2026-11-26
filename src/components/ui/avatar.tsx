"use client";

import * as React from "react";
import { cn } from "./utils";

export type AvatarStatus = "online" | "busy" | "away" | "offline";

export interface AvatarProps {
  src?: string;
  alt: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
  status?: AvatarStatus;
  className?: string;
}

const SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const STATUS_CLASSES: Record<AvatarStatus, string> = {
  online: "bg-[var(--sys-color-feedback-success)]",
  busy: "bg-[var(--sys-color-feedback-error)]",
  away: "bg-[var(--sys-color-feedback-warning)]",
  offline: "bg-[var(--sys-color-text-muted)]",
};

/**
 * Antigravity v3.0 Avatar
 * Accessible image avatar with automatic initials fallback and optional semantic status indicator.
 */
export function Avatar({
  src,
  alt,
  initials,
  size = "md",
  status,
  className,
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const fallback =
    initials ??
    alt
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "rounded-full overflow-hidden inline-flex items-center justify-center font-mono font-semibold",
          "bg-[var(--sys-color-surface-container)] text-[var(--sys-color-text-primary)] border border-[var(--sys-color-border-default)]",
          SIZE_CLASSES[size]
        )}
      >
        {src && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span aria-label={alt}>{fallback}</span>
        )}
      </span>
      {status && (
        <span
          aria-label={`Status: ${status}`}
          className={cn(
            "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--sys-color-surface-canvas)]",
            STATUS_CLASSES[status]
          )}
        />
      )}
    </span>
  );
}

export interface AvatarGroupProps {
  avatars: Omit<AvatarProps, "size">[];
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Antigravity v3.0 Avatar Group
 * Stacked avatar cluster with tabular monospace overflow counter (+N).
 */
export function AvatarGroup({ avatars, max = 4, size = "md", className }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - visible.length;

  return (
    <div className={cn("inline-flex items-center -space-x-2", className)}>
      {visible.map((avatar, idx) => (
        <Avatar
          key={`${avatar.alt}-${idx}`}
          {...avatar}
          size={size}
          className="ring-2 ring-[var(--sys-color-surface-canvas)] rounded-full"
        />
      ))}
      {overflow > 0 && (
        <span
          aria-label={`${overflow} more users`}
          className={cn(
            "rounded-full inline-flex items-center justify-center font-mono tabular-nums font-semibold",
            "bg-[var(--sys-color-surface-high)] text-[var(--sys-color-text-primary)] border border-[var(--sys-color-border-default)] ring-2 ring-[var(--sys-color-surface-canvas)]",
            SIZE_CLASSES[size]
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
