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
  formatBritishDate,
  GAMES,
  getTodayKey,
  type GameMeta,
} from "@/lib/games";
import {
  formatDuration,
  loadLoomStats,
  type LoomStats,
} from "@/lib/storage";

function LoomPreviewGraphic() {
  return (
    <div className="w-full h-36 rounded-2xl bg-[var(--board-well)] border border-[var(--border-subtle)] p-3 flex items-center justify-center">
      <div className="grid grid-cols-5 gap-1 w-28 h-28">
        {[
          "#2ca884", "#2ca884", "#9d8ff2", "#9d8ff2", "#9d8ff2",
          "#2ca884", "#d9a54c", "#d9a54c", "#9d8ff2", "#d97b59",
          "#2ca884", "#d9a54c", "#5b86b5", "#d97b59", "#d97b59",
          "#5b86b5", "#d9a54c", "#5b86b5", "#5b86b5", "#d97b59",
          "#5b86b5", "#c97b96", "#c97b96", "#c97b96", "#c97b96",
        ].map((colour, idx) => {
          const isPeg = idx === 1 || idx === 12 || idx === 23;
          return (
            <div
              key={idx}
              style={{ backgroundColor: colour }}
              className="rounded-[4px] relative flex items-center justify-center shadow-xs"
            >
              {isPeg && (
                <span className="w-2 h-2 rounded-full bg-white/90 ring-1 ring-black/15" />
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
    <div className="w-full h-36 rounded-2xl bg-[var(--board-well)] border border-[var(--border-subtle)] p-3 flex items-center justify-center opacity-80">
      <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-[#d97b59]/50 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-[#d97b59]/70 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-[#d97b59]/30" />
        </div>
      </div>
    </div>
  );
}

function ChromaCalmPreviewGraphic() {
  return (
    <div className="w-full h-36 rounded-2xl bg-[var(--board-well)] border border-[var(--border-subtle)] p-4 flex items-center justify-center opacity-80">
      <div className="grid grid-cols-5 gap-1.5 w-full max-w-[160px]">
        {[
          "#2ca884", "#4eb598", "#77c2b0", "#a1cde0", "#c8bfff",
          "#3c9a8d", "#63a9a0", "#89b7b9", "#b0c3db", "#b8aef5",
        ].map((hex, i) => (
          <div
            key={i}
            style={{ backgroundColor: hex }}
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
  const [stats, setStats] = useState<LoomStats | null>(null);

  useEffect(() => {
    const now = new Date();
    setTodayLabel(formatBritishDate(now));
    setTodayKey(getTodayKey(now));
    setStats(loadLoomStats());
  }, []);

  const todayRecord = todayKey && stats ? stats.history[todayKey] : undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mb-10 sm:mb-12"
        >
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--ink-muted)]">
              <Clock className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
              {todayLabel || "Today's Ritual"}
            </span>

            {stats && stats.currentStreak > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]">
                <Flame className="w-3.5 h-3.5" />
                {stats.currentStreak}-day streak
              </span>
            )}
          </div>

          <h1 className="font-[family-name:var(--font-plus-jakarta)] text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--ink)] max-w-2xl leading-tight">
            Step away for three restorative minutes.
          </h1>
          <p className="mt-3 text-base sm:text-lg text-[var(--ink-muted)] max-w-2xl leading-relaxed">
            Small, tactile browser rituals designed to clear mental noise between
            tasks — zero accounts, no punishing timers, and a clean stopping point.
          </p>
        </motion.section>

        {/* Game Shelf */}
        <section aria-label="Available coffee-break games">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {GAMES.map((game: GameMeta, index: number) => {
              const isLive = game.status === "live";
              const isSolvedToday =
                game.id === "loom-and-latch" && Boolean(todayRecord);

              return (
                <motion.article
                  key={game.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.08 * index,
                    ease: "easeOut",
                  }}
                  className={`rounded-3xl border p-5 flex flex-col justify-between transition-all ${
                    isLive
                      ? "bg-[var(--surface)] border-[var(--border-subtle)] shadow-[var(--shadow-card)] hover:border-[var(--accent-emerald)]/50"
                      : "bg-[var(--surface)]/65 border-[var(--border-subtle)]/80"
                  }`}
                >
                  <div>
                    <GamePreview id={game.id} />

                    <div className="mt-5 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[var(--ink-muted)]">
                        {game.duration}
                      </span>

                      {isSolvedToday ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Done ({formatDuration(todayRecord!.elapsedSeconds)})
                        </span>
                      ) : isLive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]">
                          <Sparkles className="w-3 h-3" />
                          Daily ready
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-canvas)] text-[var(--ink-muted)]">
                          {game.statusLabel}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-2 font-[family-name:var(--font-plus-jakarta)] text-xl font-semibold text-[var(--ink)]">
                      {game.title}
                    </h2>
                    <p className="mt-1.5 text-sm text-[var(--ink-muted)] leading-relaxed">
                      {game.subtitle}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                    {isLive ? (
                      <div className="flex items-center gap-2">
                        <Link
                          href={game.slug}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--ink)] text-[var(--bg-paper)] hover:opacity-90 transition-opacity"
                        >
                          <span>
                            {isSolvedToday ? "Revisit daily" : "Play daily"}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`${game.slug}?mode=zen`}
                          className="px-3.5 py-2.5 rounded-xl text-sm font-medium border border-[var(--border-subtle)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--border-strong)] transition-colors"
                        >
                          Zen
                        </Link>
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                        {game.restorativeBenefit}
                      </p>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* Restorative Contract Note */}
        <section className="mt-12 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/70 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
            <strong className="font-medium text-[var(--ink)]">
              The one-round contract:
            </strong>{" "}
            Every daily puzzle is seeded locally from today&apos;s date, takes
            two to three minutes, and ends cleanly so you can return to work
            refreshed.
          </p>
          {stats && stats.totalDailySolved + stats.totalZenSolved > 0 && (
            <span className="shrink-0 text-xs font-medium text-[var(--ink-muted)]">
              {stats.totalDailySolved} daily · {stats.totalZenSolved} zen solved
            </span>
          )}
        </section>
      </main>
    </div>
  );
}
