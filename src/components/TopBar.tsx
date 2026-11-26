"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Coffee, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { soundEngine } from "@/lib/audio";

interface TopBarProps {
  backHref?: string;
  backLabel?: string;
  title?: string;
}

export function TopBar({ backHref, backLabel = "Hub", title }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(soundEngine.isMuted());
  }, []);

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
    if (!next) {
      soundEngine.playPickup();
    }
  };

  return (
    <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--border-strong)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </Link>
        ) : (
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-xl bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)] flex items-center justify-center border border-[var(--accent-emerald)]/20 group-hover:scale-105 transition-transform">
              <Coffee className="w-4 h-4" />
            </span>
            <span className="font-[family-name:var(--font-plus-jakarta)] font-semibold tracking-tight text-base text-[var(--ink)]">
              Coffee Break
            </span>
          </Link>
        )}

        {title && (
          <span className="hidden sm:inline-block text-sm font-medium text-[var(--ink-muted)] pl-2 border-l border-[var(--border-subtle)]">
            {title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleMute}
          aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
          title={muted ? "Unmute sound effects" : "Mute sound effects"}
          className="w-9 h-9 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--border-strong)] flex items-center justify-center transition-colors cursor-pointer"
        >
          {muted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
          title={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
          className="w-9 h-9 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--border-strong)] flex items-center justify-center transition-colors cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}
