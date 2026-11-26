"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  Sparkles,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import {
  Accordion,
  Alert,
  Badge,
  Button,
  ProgressBar,
} from "@/components/ui";
import {
  formatBritishDate,
  GAMES,
  getTodayKey,
  type GameMeta,
} from "@/lib/games";
import {
  formatDuration,
  loadLoomStats,
  loadPourStats,
  type LoomStats,
  type PourStats,
} from "@/lib/storage";

function LoomPreviewGraphic() {
  const tokens = [
    "var(--tile-emerald-fill)",
    "var(--tile-emerald-fill)",
    "var(--tile-lavender-fill)",
    "var(--tile-lavender-fill)",
    "var(--tile-lavender-fill)",
    "var(--tile-emerald-fill)",
    "var(--tile-ochre-fill)",
    "var(--tile-ochre-fill)",
    "var(--tile-lavender-fill)",
    "var(--tile-terracotta-fill)",
    "var(--tile-emerald-fill)",
    "var(--tile-ochre-fill)",
    "var(--tile-slate-fill)",
    "var(--tile-terracotta-fill)",
    "var(--tile-terracotta-fill)",
    "var(--tile-slate-fill)",
    "var(--tile-ochre-fill)",
    "var(--tile-slate-fill)",
    "var(--tile-slate-fill)",
    "var(--tile-terracotta-fill)",
    "var(--tile-slate-fill)",
    "var(--tile-rose-fill)",
    "var(--tile-rose-fill)",
    "var(--tile-rose-fill)",
    "var(--tile-rose-fill)",
  ];

  return (
    <div className="w-full h-36 rounded-xl bg-[var(--sys-color-surface-low)] border border-[var(--sys-color-border-subtle)] p-3 flex items-center justify-center">
      <div className="grid grid-cols-5 gap-1 w-28 h-28">
        {tokens.map((colour, idx) => {
          const isPeg = idx === 1 || idx === 12 || idx === 23;
          return (
            <div
              key={idx}
              style={{ backgroundColor: colour }}
              className="rounded-[4px] relative flex items-center justify-center"
            >
              {isPeg && (
                <span className="w-2 h-2 rounded-full bg-[var(--sys-color-surface-lowest)] ring-1 ring-[var(--sys-color-border-default)]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyPourPreviewGraphic() {
  return (
    <div className="w-full h-36 rounded-xl bg-[var(--sys-color-surface-low)] border border-[var(--sys-color-border-subtle)] p-3 flex items-center justify-center opacity-80">
      <div
        className="relative w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center"
        style={{ borderColor: "var(--tile-terracotta-fill)" }}
      >
        <div
          className="w-16 h-16 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: "var(--tile-terracotta-fill)" }}
        >
          <div
            className="w-8 h-8 rounded-full opacity-40"
            style={{ backgroundColor: "var(--tile-terracotta-fill)" }}
          />
        </div>
      </div>
    </div>
  );
}

function ChromaCalmPreviewGraphic() {
  const swatches = [
    "var(--tile-emerald-fill)",
    "var(--tile-teal-fill)",
    "var(--tile-slate-fill)",
    "var(--tile-lavender-fill)",
    "var(--tile-rose-fill)",
    "var(--tile-ochre-fill)",
    "var(--tile-terracotta-fill)",
    "var(--tile-rose-fill)",
    "var(--tile-lavender-fill)",
    "var(--tile-slate-fill)",
  ];

  return (
    <div className="w-full h-36 rounded-xl bg-[var(--sys-color-surface-low)] border border-[var(--sys-color-border-subtle)] p-4 flex items-center justify-center opacity-80">
      <div className="grid grid-cols-5 gap-1.5 w-full max-w-[164px]">
        {swatches.map((bg, i) => (
          <div
            key={i}
            style={{ backgroundColor: bg }}
            className="h-9 rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}

function GamePreview({ id }: { id: string }) {
  if (id === "loom-and-latch") return <LoomPreviewGraphic />;
  if (id === "daily-pour") return <DailyPourPreviewGraphic />;
  return <ChromaCalmPreviewGraphic />;
}

export function HubClient() {
  const [todayLabel, setTodayLabel] = useState<string>("");
  const [todayKey, setTodayKey] = useState<string>("");
  const [loomStats, setLoomStats] = useState<LoomStats | null>(null);
  const [pourStats, setPourStats] = useState<PourStats | null>(null);

  useEffect(() => {
    const now = new Date();
    setTodayLabel(formatBritishDate(now));
    setTodayKey(getTodayKey(now));
    setLoomStats(loadLoomStats());
    setPourStats(loadPourStats());
  }, []);

  const todayLoom = todayKey && loomStats ? loomStats.history[todayKey] : undefined;
  const todayPour = todayKey && pourStats ? pourStats.history[todayKey] : undefined;
  const liveGamesCount = GAMES.filter((g) => g.status === "live").length;
  const completedTodayCount = (todayLoom ? 1 : 0) + (todayPour ? 1 : 0);
  const topStreak = Math.max(
    loomStats?.currentStreak ?? 0,
    pourStats?.currentStreak ?? 0
  );
  const totalDaily =
    (loomStats?.totalDailySolved ?? 0) + (pourStats?.totalDailyBrewed ?? 0);
  const totalZen =
    (loomStats?.totalZenSolved ?? 0) + (pourStats?.totalZenBrewed ?? 0);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-10"
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge tone="neutral">
              <Clock className="w-3.5 h-3.5 text-[var(--sys-color-action-primary)]" />
              <span>{todayLabel || "Today's Ritual"}</span>
            </Badge>

            {topStreak > 0 && (
              <Badge tone="success">
                <Flame className="w-3.5 h-3.5" />
                <span className="font-mono tabular-nums">
                  {topStreak}-day streak
                </span>
              </Badge>
            )}

            <Badge tone="accent">Antigravity v3.0</Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--sys-color-text-primary)] max-w-2xl leading-tight">
            Step away for three restorative minutes.
          </h1>
          <p className="mt-3 text-base sm:text-lg text-[var(--sys-color-text-secondary)] max-w-2xl leading-relaxed">
            Small, tactile browser rituals designed to clear mental noise between
            tasks — zero accounts, no punishing timers, and a clean stopping point.
          </p>

          <div className="mt-6 max-w-md">
            <ProgressBar
              value={completedTodayCount}
              max={liveGamesCount}
              label={
                completedTodayCount >= liveGamesCount
                  ? "All daily rituals complete"
                  : `Today's daily rituals (${completedTodayCount} of ${liveGamesCount})`
              }
            />
          </div>
        </motion.section>

        {/* Game Shelf — Solid 5-Step Tonal Cards */}
        <section aria-label="Available coffee-break games">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {GAMES.map((game: GameMeta, index: number) => {
              const isLive = game.status === "live";
              const solvedBadgeText =
                game.id === "loom-and-latch" && todayLoom
                  ? formatDuration(todayLoom.elapsedSeconds)
                  : game.id === "daily-pour" && todayPour
                    ? `${todayPour.extractionPct}%`
                    : null;
              const isSolvedToday = Boolean(solvedBadgeText);

              return (
                <motion.article
                  key={game.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.06 * index,
                    ease: "easeOut",
                  }}
                  className={`tonal-card p-5 flex flex-col justify-between ${
                    isLive
                      ? "hover:border-[var(--sys-color-border-focus)]"
                      : "opacity-80"
                  }`}
                >
                  <div>
                    <GamePreview id={game.id} />

                    <div className="mt-5 flex items-center justify-between gap-2">
                      <span className="font-mono text-xs tabular-nums text-[var(--sys-color-text-muted)]">
                        {game.duration}
                      </span>

                      {isSolvedToday ? (
                        <Badge tone="success">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="font-mono tabular-nums">
                            {solvedBadgeText}
                          </span>
                        </Badge>
                      ) : isLive ? (
                        <Badge tone="accent">
                          <Sparkles className="w-3 h-3" />
                          <span>Daily ready</span>
                        </Badge>
                      ) : (
                        <Badge tone="neutral">{game.statusLabel}</Badge>
                      )}
                    </div>

                    <h2 className="mt-2.5 text-xl font-semibold tracking-tight text-[var(--sys-color-text-primary)]">
                      {game.title}
                    </h2>
                    <p className="mt-1.5 text-sm text-[var(--sys-color-text-secondary)] leading-relaxed">
                      {game.subtitle}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--sys-color-border-subtle)]">
                    {isLive ? (
                      <div className="flex items-center gap-2">
                        <Link href={game.slug} className="flex-1">
                          <Button variant="primary" className="w-full">
                            <span>
                              {isSolvedToday ? "Revisit daily" : "Play daily"}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`${game.slug}?mode=zen`}>
                          <Button variant="secondary">Zen</Button>
                        </Link>
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--sys-color-text-muted)] leading-relaxed">
                        {game.restorativeBenefit}
                      </p>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* Restorative Contract Alert & Expandable Philosophy */}
        <section className="mt-10 space-y-4">
          <Alert tone="info" title="The one-round contract">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-[var(--sys-color-text-secondary)]">
                Every daily puzzle is seeded locally from today&apos;s date, takes
                two to three minutes, and ends cleanly so you can return to work
                refreshed.
              </p>
              {totalDaily + totalZen > 0 && (
                <Badge tone="neutral" className="shrink-0 font-mono tabular-nums">
                  {totalDaily} daily · {totalZen} zen
                </Badge>
              )}
            </div>
          </Alert>

          <Accordion
            items={[
              {
                id: "restorative-design",
                title: "Why three-minute spatial breaks work",
                content:
                  "Grounded in Attention Restoration Theory, light tactile puzzles trigger soft fascination — actively detaching attention from work rumination without taxing executive memory or creating endless scrolling loops.",
              },
              {
                id: "zero-backend",
                title: "Private by default — zero accounts or tracking",
                content:
                  "Your daily seed is computed deterministically in the browser from YYYY-MM-DD, audio is synthesised locally via Web Audio, and streaks are stored purely in your browser's localStorage.",
              },
            ]}
          />
        </section>
      </main>
    </div>
  );
}
