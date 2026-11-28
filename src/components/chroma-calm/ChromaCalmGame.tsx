"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Check,
  Copy,
  Flame,
  HelpCircle,
  Lightbulb,
  Palette,
  RotateCcw,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  ProgressBar,
  Tabs,
  TabsList,
  TabsTrigger,
  ToastStack,
  type ToastItem,
} from "@/components/ui";
import { soundEngine } from "@/lib/audio";
import {
  buildChromaShareCard,
  CHROMA_GRID_SIZE,
  countAlignedMovable,
  generateChromaPuzzle,
  isChromaSolved,
  type ChromaSwatch,
} from "@/lib/chroma-calm/engine";
import { formatShortBritishDate, getTodayKey } from "@/lib/games";
import {
  formatDuration,
  loadChromaStats,
  recordChromaDailyCompletion,
  recordChromaZenCompletion,
  type ChromaStats,
} from "@/lib/storage";

type GameMode = "daily" | "zen";
const TOTAL_MOVABLE = CHROMA_GRID_SIZE * CHROMA_GRID_SIZE - 4;

export function ChromaCalmGame() {
  const searchParams = useSearchParams();
  const initialMode: GameMode =
    searchParams.get("mode") === "zen" ? "zen" : "daily";

  const [mode, setMode] = useState<GameMode>(initialMode);
  const [todayKey] = useState<string>(() => getTodayKey());
  const [zenCounter, setZenCounter] = useState<number>(1);

  const seed = mode === "daily" ? todayKey : `zen-${todayKey}-${zenCounter}`;
  const puzzle = useMemo(() => generateChromaPuzzle(seed), [seed]);

  const [board, setBoard] = useState<ChromaSwatch[]>(puzzle.initialBoard);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [swappingIds, setSwappingIds] = useState<number[]>([]);
  const [hintPair, setHintPair] = useState<[number, number] | null>(null);
  const prefersReducedMotion = Boolean(useReducedMotion());

  const [swaps, setSwaps] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [solved, setSolved] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [stats, setStats] = useState<ChromaStats | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback(
    (title: string, description?: string, tone: ToastItem["tone"] = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const timestamp = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setToasts((prev) => [
        ...prev.slice(-2),
        { id, title, description, tone, timestamp },
      ]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    setBoard(puzzle.initialBoard);
    setSelectedIdx(null);
    setSwappingIds([]);
    setHintPair(null);
    setSwaps(0);
    setElapsedSeconds(0);
    setSolved(false);
    setCopied(false);
  }, [puzzle]);

  useEffect(() => {
    setStats(loadChromaStats());
  }, []);

  // Gentle timer for Daily Ritual
  useEffect(() => {
    if (mode !== "daily" || solved) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mode, solved]);

  // Escape to deselect
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIdx(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const alignedCount = useMemo(() => countAlignedMovable(board), [board]);

  const handleSwatchClick = (index: number) => {
    if (solved) return;
    const swatch = board[index];
    if (swatch.locked) {
      soundEngine.playInvalid();
      return;
    }

    if (selectedIdx === null) {
      setSelectedIdx(index);
      soundEngine.playPickup();
      return;
    }

    if (selectedIdx === index) {
      setSelectedIdx(null);
      return;
    }

    // Swap selectedIdx and index
    const nextBoard = [...board];
    const temp = nextBoard[selectedIdx];
    nextBoard[selectedIdx] = nextBoard[index];
    nextBoard[index] = temp;

    const nextSwaps = swaps + 1;
    setSwappingIds([nextBoard[selectedIdx].targetIndex, nextBoard[index].targetIndex]);
    setBoard(nextBoard);
    setSwaps(nextSwaps);
    setSelectedIdx(null);
    setHintPair(null);

    if (isChromaSolved(nextBoard)) {
      setSolved(true);
      soundEngine.playComplete();

      if (mode === "daily") {
        const shareText = buildChromaShareCard(
          puzzle.palette.name,
          formatShortBritishDate(todayKey),
          nextSwaps,
          formatDuration(elapsedSeconds)
        );
        const updated = recordChromaDailyCompletion({
          dateKey: todayKey,
          paletteName: puzzle.palette.name,
          swaps: nextSwaps,
          elapsedSeconds,
          shareText,
          completedAt: new Date().toISOString(),
        });
        setStats(updated);
        pushToast(
          "Gradient restored",
          `${puzzle.palette.name} · ${nextSwaps} swaps.`,
          "success"
        );
      } else {
        const updated = recordChromaZenCompletion();
        setStats(updated);
        pushToast(
          "Zen gradient restored",
          `${puzzle.palette.name} · ${nextSwaps} swaps.`,
          "success"
        );
      }
      return;
    }

    // Play resonant latch if either swapped swatch landed in its true home
    const landedHome =
      nextBoard[index].targetIndex === index ||
      nextBoard[selectedIdx].targetIndex === selectedIdx;
    if (landedHome) {
      soundEngine.playLatch();
    } else {
      soundEngine.playSnap();
    }
  };

  const handleGentleNudge = () => {
    if (solved) return;
    const misplacedIdx = board.findIndex(
      (s, i) => !s.locked && s.targetIndex !== i
    );
    if (misplacedIdx === -1) return;
    const destIdx = board[misplacedIdx].targetIndex;

    setHintPair([misplacedIdx, destIdx]);
    setSelectedIdx(misplacedIdx);
    soundEngine.playPickup();
    pushToast(
      "Gentle nudge",
      "Swap the two pulsing swatches to bring one home.",
      "info"
    );

    window.setTimeout(() => {
      setHintPair(null);
    }, 2600);
  };

  const handleReset = () => {
    if (swaps === 0) return;
    soundEngine.playClear();
    setBoard(puzzle.initialBoard);
    setSelectedIdx(null);
    setHintPair(null);
    setSwaps(0);
    pushToast("Board reset", "Swatches returned to starting positions.", "info");
  };

  const handleCopyShare = async () => {
    const text = buildChromaShareCard(
      puzzle.palette.name,
      mode === "daily" ? formatShortBritishDate(todayKey) : "Zen Gradient",
      swaps,
      mode === "daily" ? formatDuration(elapsedSeconds) : "Untimed"
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      soundEngine.playPickup();
      pushToast("Result copied", "Ready to share your gradient.", "success");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      pushToast("Copy unavailable", "Clipboard access was blocked.", "warning");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar backHref="/" title="Chroma Calm" />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-16 flex flex-col items-center">
        {/* Mode Switcher & Status Badges */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-5">
          <Tabs value={mode} onValueChange={(v) => setMode(v as GameMode)}>
            <TabsList aria-label="Game mode">
              <TabsTrigger value="daily">Daily Ritual</TabsTrigger>
              <TabsTrigger value="zen">Zen Mode</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2">
            {mode === "daily" ? (
              <>
                <Badge tone="neutral">{formatShortBritishDate(todayKey)}</Badge>
                <Badge tone="accent" className="font-mono tabular-nums">
                  {formatDuration(elapsedSeconds)}
                </Badge>
                {stats && stats.currentStreak > 0 && (
                  <Badge tone="success" className="font-mono tabular-nums">
                    <Flame className="w-3.5 h-3.5" />
                    {stats.currentStreak}
                  </Badge>
                )}
              </>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  soundEngine.playPickup();
                  setZenCounter((n) => n + 1);
                }}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>New palette</span>
              </Button>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="How to play Chroma Calm"
                  className="w-10 px-0"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>How to play Chroma Calm</DialogTitle>
                <DialogDescription>
                  Restore a smooth perceptual OKLCH colour gradient across the 5×5 grid.
                </DialogDescription>
                <ul className="mt-4 space-y-2.5 text-sm text-[var(--sys-color-text-secondary)] list-disc pl-5">
                  <li>
                    The four <strong>corner swatches</strong> (marked with a small dot) are
                    pinned anchors.
                  </li>
                  <li>
                    Click any unlocked swatch, then click another to swap their positions.
                  </li>
                  <li>
                    Listen for the subtle chime when a swatch settles into its harmonious spot.
                  </li>
                </ul>
                <div className="mt-6 flex justify-end">
                  <DialogClose asChild>
                    <Button variant="primary">Got it</Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Palette Header Strip */}
        <div className="w-full tonal-card p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[var(--sys-color-action-primary)]" />
              <h1 className="text-base font-semibold text-[var(--sys-color-text-primary)]">
                {puzzle.palette.name}
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-[var(--sys-color-text-secondary)]">
              {puzzle.palette.subtitle}
            </p>
          </div>

          <Badge tone="neutral" className="font-mono tabular-nums">
            {swaps} swaps
          </Badge>
        </div>

        {/* Harmony Progress Bar */}
        <div className="w-full mb-5">
          <ProgressBar
            value={alignedCount}
            max={TOTAL_MOVABLE}
            label={`Gradient harmony (${alignedCount}/${TOTAL_MOVABLE} swatches)`}
          />
        </div>

        {/* 5×5 OKLCH Swatch Matrix */}
        <div
          onContextMenu={(e) => e.preventDefault()}
          className="w-full max-w-[396px] aspect-square tonal-card-elevated rounded-[24px] p-3.5 sm:p-4 select-none game-touch-surface"
        >
          <LayoutGroup id={`chroma-${seed}`}>
            <div className="grid grid-cols-5 grid-rows-5 gap-2 w-full h-full">
              {board.map((swatch, index) => {
                const isSelected = selectedIdx === index;
                const isSwapping = swappingIds.includes(swatch.targetIndex);
                const isHinted =
                  hintPair !== null &&
                  (hintPair[0] === index || hintPair[1] === index);

                return (
                  <motion.button
                    key={swatch.targetIndex}
                    layout={!prefersReducedMotion}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0.01 }
                        : {
                            layout: {
                              type: "spring",
                              stiffness: 310,
                              damping: 27,
                              mass: 0.8,
                            },
                            scale: {
                              type: "spring",
                              stiffness: 380,
                              damping: 26,
                            },
                          }
                    }
                    animate={
                      isSelected && !prefersReducedMotion
                        ? { scale: 1.07 }
                        : { scale: 1 }
                    }
                    type="button"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={() => handleSwatchClick(index)}
                    aria-label={`Row ${Math.floor(index / CHROMA_GRID_SIZE) + 1}, Column ${(index % CHROMA_GRID_SIZE) + 1}${
                      swatch.locked ? ", pinned anchor corner" : ""
                    }${isSelected ? ", selected" : ""}`}
                    className={`relative rounded-xl transition-shadow flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sys-color-border-focus)] ${
                      swatch.locked ? "cursor-default" : "cursor-pointer"
                    } ${
                      isSelected
                        ? "ring-3 ring-[var(--sys-color-border-focus)] shadow-lg"
                        : isSwapping
                          ? "shadow-md"
                          : ""
                    }`}
                    style={{
                      backgroundColor: swatch.cssColor,
                      zIndex: isSelected ? 30 : isSwapping ? 20 : 1,
                      willChange: "transform",
                    }}
                  >
                    {/* Pinned Corner Anchor Dot */}
                    {swatch.locked && (
                      <span
                        aria-hidden="true"
                        className="w-2 h-2 rounded-full bg-[var(--sys-color-surface-lowest)]/85 shadow-xs"
                      />
                    )}

                    {/* Gentle Nudge Pulse */}
                    {isHinted && (
                      <motion.span
                        initial={{ opacity: 0.4, scale: 0.85 }}
                        animate={{
                          opacity: [0.35, 0.95, 0.35],
                          scale: [0.85, 1.05, 0.85],
                        }}
                        transition={{ duration: 1.0, repeat: Infinity }}
                        className="absolute inset-1 rounded-lg border-2 border-[var(--sys-color-surface-lowest)] pointer-events-none"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </LayoutGroup>
        </div>

        {/* Action Controls */}
        {!solved && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <Button variant="secondary" onClick={handleGentleNudge}>
              <Lightbulb className="w-4 h-4" />
              <span>Nudge</span>
            </Button>

            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={swaps === 0}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </Button>
          </div>
        )}

        {/* Completion Ritual Card */}
        <AnimatePresence>
          {solved && (
            <motion.section
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="mt-6 w-full max-w-[440px] tonal-card p-6 border-[var(--sys-color-feedback-success)] text-center"
            >
              <div className="w-11 h-11 rounded-2xl bg-[var(--sys-color-feedback-success-bg)] text-[var(--sys-color-feedback-success)] flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5" />
              </div>

              <h2 className="text-xl font-semibold text-[var(--sys-color-text-primary)]">
                Harmony restored.
              </h2>
              <p className="mt-1 text-sm text-[var(--sys-color-text-secondary)]">
                {puzzle.palette.name} settled in{" "}
                <span className="font-mono tabular-nums font-medium text-[var(--sys-color-text-primary)]">
                  {swaps}
                </span>{" "}
                swaps
                {mode === "daily" ? (
                  <>
                    {" "}
                    (
                    <span className="font-mono tabular-nums font-medium text-[var(--sys-color-text-primary)]">
                      {formatDuration(elapsedSeconds)}
                    </span>
                    )
                  </>
                ) : null}
                . Your eyes and mind can rest easy.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <Button variant="primary" onClick={handleCopyShare}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied result</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy result</span>
                    </>
                  )}
                </Button>

                {mode === "daily" ? (
                  <Button variant="secondary" onClick={() => setMode("zen")}>
                    <Shuffle className="w-4 h-4" />
                    <span>Try Zen Mode</span>
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => setZenCounter((n) => n + 1)}
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>New Zen palette</span>
                  </Button>
                )}

                <Link href="/">
                  <Button variant="ghost">Back to Hub</Button>
                </Link>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
