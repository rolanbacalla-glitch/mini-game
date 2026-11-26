"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Coffee, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { soundEngine } from "@/lib/audio";
import {
  Breadcrumbs,
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";

interface TopBarProps {
  backHref?: string;
  backLabel?: string;
  title?: string;
}

export function TopBar({ backHref, title }: TopBarProps) {
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
    <header className="sticky top-0 z-[var(--sys-z-sticky,100)] w-full px-4 sm:px-6 pt-3">
      <div className="max-w-5xl mx-auto liquid-glass-regular rounded-2xl px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group shrink-0"
          >
            <span className="w-9 h-9 rounded-xl bg-[var(--sys-color-bg-action-primary-subtle)] text-[var(--sys-color-action-primary)] flex items-center justify-center border border-[var(--sys-color-border-focus)]/25 group-hover:scale-105 transition-transform">
              <Coffee className="w-4 h-4" />
            </span>
            <span className="font-semibold tracking-tight text-sm sm:text-base text-[var(--sys-color-text-primary)]">
              Coffee Break
            </span>
          </Link>

          {backHref && title && (
            <div className="hidden sm:block pl-3 border-l border-[var(--sys-color-border-subtle)]">
              <Breadcrumbs
                items={[
                  { label: "Hub", href: backHref },
                  { label: title },
                ]}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleToggleMute}
                aria-label={
                  muted ? "Unmute sound effects" : "Mute sound effects"
                }
                className="w-10 px-0"
              >
                {muted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {muted ? "Unmute sound effects" : "Mute sound effects"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleTheme}
                aria-label={
                  theme === "dark"
                    ? "Switch to Alabaster Light theme"
                    : "Switch to Obsidian Dark theme"
                }
                className="gap-1.5"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4" />
                    <span className="hidden sm:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    <span className="hidden sm:inline">Dark</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {theme === "dark"
                ? "Switch to Alabaster Light"
                : "Switch to Obsidian Dark"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
