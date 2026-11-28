"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Copy,
  Eye,
  Flame,
  HelpCircle,
  Link2,
  Lock,
  RotateCcw,
  Shuffle,
  Sparkles,
  Trophy,
  Zap,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  ToastStack,
  type ToastItem,
} from "@/components/ui";
import { soundEngine } from "@/lib/audio";
import {
  buildCauseEffectShareCard,
  buildShuffledDeck,
  CAUSE_EFFECT_THEMES,
  getCauseEffectTheme,
  getDailyThemeId,
  isValidCauseEffectMatch,
  type CauseEffectThemeId,
  type ChainLinkRecord,
  type DeckCard,
} from "@/lib/cause-and-effect/engine";
import { formatShortBritishDate, getTodayKey } from "@/lib/games";
import {
  formatDuration,
  loadCauseEffectStats,
  recordCauseEffectDailyCompletion,
  recordCauseEffectZenCompletion,
  type CauseEffectStats,
} from "@/lib/storage";

type GameMode = "daily" | "zen";

const TOTAL_PAIRS = 10;
const BASE_MATCH_POINTS = 100;
const CARD_FLIP_ANIMATION_MS = 420;
const CASCADE_REVEAL_MS = 1500;

/**
 * Computes an ergonomic dwell time for text-based memory cards:
 * accounts for the 420ms 3D flip animation plus ~220ms/word reading & spatial encoding
 * (clamped between 2.1s and 2.8s so short titles and full movie quotes are always legible).
 */
function computeMismatchDwellMs(secondCardText: string): number {
  const words = secondCardText.trim().split(/\s+/).filter(Boolean).length;
  const computed = CARD_FLIP_ANIMATION_MS + 1400 + words * 220;
  return Math.min(2800, Math.max(2100, computed));
}

export function CauseEffectGame() {
  const searchParams = useSearchParams();
  const initialMode: GameMode =
    searchParams.get("mode") === "zen" ? "zen" : "daily";

  const [todayKey] = useState<string>(() => getTodayKey());
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [themeId, setThemeId] = useState<CauseEffectThemeId>(() =>
    getDailyThemeId(getTodayKey())
  );
  const [shuffleNonce, setShuffleNonce] = useState<number>(1);
  const prefersReducedMotion = Boolean(useReducedMotion());

  const activeTheme = useMemo(() => getCauseEffectTheme(themeId), [themeId]);

  const deckSeed = useMemo(() => {
    if (mode === "daily") {
      return `cause-effect:${todayKey}:${themeId}`;
    }
    return `cause-effect:zen:${todayKey}:${themeId}:${shuffleNonce}`;
  }, [mode, todayKey, themeId, shuffleNonce]);

  const [cards, setCards] = useState<DeckCard[]>(() =>
    buildShuffledDeck(themeId, `cause-effect:${todayKey}:${themeId}`)
  );
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [lockedPairIds, setLockedPairIds] = useState<string[]>([]);
  const [mismatchUids, setMismatchUids] = useState<string[]>([]);
  const [mismatchShakeActive, setMismatchShakeActive] =
    useState<boolean>(false);
  const [mismatchDwellMs, setMismatchDwellMs] = useState<number>(2200);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [cascadeRevealing, setCascadeRevealing] = useState<boolean>(false);
  const [cascadeCount, setCascadeCount] = useState<number>(0);

  const [score, setScore] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [consecutiveMatches, setConsecutiveMatches] = useState<number>(0);
  const [longestChain, setLongestChain] = useState<number>(0);
  const [chainTimeline, setChainTimeline] = useState<ChainLinkRecord[]>([]);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [stats, setStats] = useState<CauseEffectStats | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const timersRef = useRef<number[]>([]);
  const mismatchCloseTimerRef = useRef<number | null>(null);
  const mismatchShakeTimerRef = useRef<number | null>(null);
  const mismatchAllowSkipAtRef = useRef<number>(0);
  const timelineEndRef = useRef<HTMLDivElement | null>(null);

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearMismatchTimers = useCallback(() => {
    if (mismatchCloseTimerRef.current !== null) {
      window.clearTimeout(mismatchCloseTimerRef.current);
      timersRef.current = timersRef.current.filter(
        (t) => t !== mismatchCloseTimerRef.current
      );
      mismatchCloseTimerRef.current = null;
    }
    if (mismatchShakeTimerRef.current !== null) {
      window.clearTimeout(mismatchShakeTimerRef.current);
      timersRef.current = timersRef.current.filter(
        (t) => t !== mismatchShakeTimerRef.current
      );
      mismatchShakeTimerRef.current = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    clearMismatchTimers();
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, [clearMismatchTimers]);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

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
    setStats(loadCauseEffectStats());
  }, []);

  // Reset board cleanly whenever seed/theme/mode changes
  useEffect(() => {
    clearAllTimers();
    setCards(buildShuffledDeck(themeId, deckSeed));
    setFlippedUids([]);
    setLockedPairIds([]);
    setMismatchUids([]);
    setMismatchShakeActive(false);
    setIsResolving(false);
    setCascadeRevealing(false);
    setCascadeCount(0);
    setScore(0);
    setMoves(0);
    setConsecutiveMatches(0);
    setLongestChain(0);
    setChainTimeline([]);
    setElapsedSeconds(0);
    setHasStarted(false);
    setCompleted(false);
    setShowWinModal(false);
    setCopied(false);
  }, [themeId, deckSeed, clearAllTimers]);

  // Gentle elapsed timer starts on first flip and stops on completion
  useEffect(() => {
    if (!hasStarted || completed) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [hasStarted, completed]);

  // Keep latest chain link scrolled cleanly into view inside timeline container
  useEffect(() => {
    if (chainTimeline.length > 0 && timelineEndRef.current) {
      timelineEndRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "nearest",
      });
    }
  }, [chainTimeline.length, prefersReducedMotion]);

  const lockedPairSet = useMemo(
    () => new Set(lockedPairIds),
    [lockedPairIds]
  );

  // Displayed multiplier: 1x at start or after a miss, climbs 2x, 3x, 4x... on consecutive matches
  const activeMultiplier = Math.max(1, consecutiveMatches);
  // Progress toward next 3x Cascade Reveal trigger (0, 1, 2, or 3)
  const cascadeMeterStep =
    consecutiveMatches === 0
      ? 0
      : consecutiveMatches % 3 === 0
        ? 3
        : consecutiveMatches % 3;

  const isShowingMismatch = mismatchUids.length === 2;

  const handleRestart = useCallback(() => {
    clearAllTimers();
    soundEngine.playClear();
    if (mode === "zen") {
      setShuffleNonce((n) => n + 1);
    } else {
      setCards(buildShuffledDeck(themeId, deckSeed));
      setFlippedUids([]);
      setLockedPairIds([]);
      setMismatchUids([]);
      setMismatchShakeActive(false);
      setIsResolving(false);
      setCascadeRevealing(false);
      setCascadeCount(0);
      setScore(0);
      setMoves(0);
      setConsecutiveMatches(0);
      setLongestChain(0);
      setChainTimeline([]);
      setElapsedSeconds(0);
      setHasStarted(false);
      setCompleted(false);
      setShowWinModal(false);
      setCopied(false);
    }
  }, [clearAllTimers, mode, themeId, deckSeed]);

  const handlePlayAgain = useCallback(() => {
    setShowWinModal(false);
    if (mode === "daily") {
      setMode("zen");
      setShuffleNonce((n) => n + 1);
    } else {
      setShuffleNonce((n) => n + 1);
    }
    soundEngine.playClear();
  }, [mode]);

  const handleCardFlip = useCallback(
    (card: DeckCard) => {
      if (completed || cascadeRevealing) return;
      if (lockedPairSet.has(card.pairId)) return;

      // Smart early-continue: if two mismatched cards are currently pausing open for reading
      // and the player taps another face-down card after the flip completes, immediately close
      // the mismatched pair and open the newly tapped card so brisk players never feel stuck.
      if (mismatchUids.length === 2) {
        if (mismatchUids.includes(card.uid)) return;
        if (performance.now() < mismatchAllowSkipAtRef.current) return;

        clearMismatchTimers();
        setMismatchUids([]);
        setMismatchShakeActive(false);
        setIsResolving(false);
        soundEngine.playPickup();
        setFlippedUids([card.uid]);
        return;
      }

      if (isResolving) return;
      if (flippedUids.includes(card.uid)) return;
      if (flippedUids.length >= 2) return;

      if (!hasStarted) {
        setHasStarted(true);
      }

      soundEngine.playPickup();

      const nextFlipped = [...flippedUids, card.uid];
      setFlippedUids(nextFlipped);

      if (nextFlipped.length < 2) return;

      // Second card flipped — evaluate pair
      const firstCard = cards.find((c) => c.uid === nextFlipped[0]);
      if (!firstCard) return;

      const nextMoves = moves + 1;
      setMoves(nextMoves);
      setIsResolving(true);

      if (isValidCauseEffectMatch(firstCard, card)) {
        const nextStreak = consecutiveMatches + 1;
        const pointsEarned = BASE_MATCH_POINTS * nextStreak;
        const nextScore = score + pointsEarned;
        const nextLongest = Math.max(longestChain, nextStreak);
        const nextLocked = [...lockedPairIds, card.pairId];
        const causeCard = firstCard.role === "cause" ? firstCard : card;
        const effectCard = firstCard.role === "effect" ? firstCard : card;

        const newLink: ChainLinkRecord = {
          pairId: card.pairId,
          cause: causeCard.text,
          effect: effectCard.text,
          multiplier: nextStreak,
          pointsEarned,
          step: nextLocked.length,
        };

        setScore(nextScore);
        setConsecutiveMatches(nextStreak);
        setLongestChain(nextLongest);
        setLockedPairIds(nextLocked);
        setChainTimeline((prev) => [...prev, newLink]);
        setFlippedUids([]);

        const isBoardComplete = nextLocked.length >= TOTAL_PAIRS;

        if (isBoardComplete) {
          soundEngine.playComplete();
          setCompleted(true);
          setIsResolving(false);

          const shareText = buildCauseEffectShareCard({
            dateLabel: formatShortBritishDate(todayKey),
            themeTitle: activeTheme.title,
            score: nextScore,
            moves: nextMoves,
            longestChain: nextLongest,
            durationLabel: formatDuration(elapsedSeconds),
          });

          const updatedStats =
            mode === "daily"
              ? recordCauseEffectDailyCompletion({
                  dateKey: todayKey,
                  themeId,
                  score: nextScore,
                  moves: nextMoves,
                  longestChain: nextLongest,
                  elapsedSeconds,
                  shareText,
                  completedAt: new Date().toISOString(),
                })
              : recordCauseEffectZenCompletion(nextScore);

          setStats(updatedStats);

          scheduleTimeout(() => {
            setShowWinModal(true);
          }, 520);
          return;
        }

        soundEngine.playLatch();

        // Cascade Bonus Mechanic: reaching 3x (and subsequent 3x milestones) flashes remaining unmatched Cause cards for 1.5s
        if (nextStreak >= 3 && nextStreak % 3 === 0) {
          scheduleTimeout(() => {
            setCascadeRevealing(true);
            setCascadeCount((c) => c + 1);
            soundEngine.playRotate();
            pushToast(
              `Cascade Reveal (${nextStreak}x Chain!)`,
              "Remaining Cause cards flashed for 1.5 seconds.",
              "success"
            );

            scheduleTimeout(() => {
              setCascadeRevealing(false);
              setIsResolving(false);
            }, CASCADE_REVEAL_MS);
          }, 300);
        } else {
          scheduleTimeout(() => {
            setIsResolving(false);
          }, 220);
        }
      } else {
        // Mismatch: let the 2nd card finish its 420ms flip cleanly before nudging,
        // then hold both open for 2.1s–2.8s (scaled to phrase length) so players can read & memorise.
        const dwellMs = computeMismatchDwellMs(card.text);
        setMismatchDwellMs(dwellMs);
        setMismatchUids(nextFlipped);
        setMismatchShakeActive(false);
        setConsecutiveMatches(0);
        mismatchAllowSkipAtRef.current =
          performance.now() + CARD_FLIP_ANIMATION_MS;

        mismatchShakeTimerRef.current = scheduleTimeout(() => {
          mismatchShakeTimerRef.current = null;
          soundEngine.playInvalid();
          setMismatchShakeActive(true);
        }, CARD_FLIP_ANIMATION_MS);

        mismatchCloseTimerRef.current = scheduleTimeout(() => {
          mismatchCloseTimerRef.current = null;
          setFlippedUids([]);
          setMismatchUids([]);
          setMismatchShakeActive(false);
          setIsResolving(false);
        }, dwellMs);
      }
    },
    [
      completed,
      cascadeRevealing,
      lockedPairSet,
      mismatchUids,
      clearMismatchTimers,
      isResolving,
      flippedUids,
      hasStarted,
      cards,
      moves,
      consecutiveMatches,
      score,
      longestChain,
      lockedPairIds,
      todayKey,
      activeTheme.title,
      elapsedSeconds,
      mode,
      themeId,
      scheduleTimeout,
      pushToast,
    ]
  );

  const shareText = useMemo(
    () =>
      buildCauseEffectShareCard({
        dateLabel: formatShortBritishDate(todayKey),
        themeTitle: activeTheme.title,
        score,
        moves,
        longestChain,
        durationLabel: formatDuration(elapsedSeconds),
      }),
    [todayKey, activeTheme.title, score, moves, longestChain, elapsedSeconds]
  );

  const handleCopyShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      pushToast(
        "Copied summary",
        "Ready to share your cascading chain.",
        "success"
      );
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      pushToast(
        "Could not copy",
        "Clipboard access is restricted in this browser.",
        "error"
      );
    }
  }, [shareText, pushToast]);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar backHref="/" title="Cause & Effect" />

      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 pt-3 pb-6 flex flex-col">
        {/* Compact Unified Command & Telemetry Bar (fits full game above the fold on desktop) */}
        <section
          aria-label="Game controls and status"
          className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 pb-2.5 border-b border-[var(--sys-color-border-subtle)]"
        >
          {/* Left: Mode Switcher + Theme Dropdown */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Tabs value={mode} onValueChange={(v) => setMode(v as GameMode)}>
              <TabsList aria-label="Game mode">
                <TabsTrigger value="daily" className="min-h-9 px-2.5 text-xs sm:text-sm">
                  Daily
                </TabsTrigger>
                <TabsTrigger value="zen" className="min-h-9 px-2.5 text-xs sm:text-sm">
                  Free Play
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="w-[235px] sm:w-[275px]">
              <Select
                value={themeId}
                onValueChange={(value) =>
                  setThemeId(value as CauseEffectThemeId)
                }
              >
                <SelectTrigger
                  aria-label="Select card deck theme"
                  className="min-h-[40px] text-xs sm:text-sm"
                >
                  <SelectValue placeholder="Choose a theme" />
                </SelectTrigger>
                <SelectContent>
                  {CAUSE_EFFECT_THEMES.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right: Live Unboxed Telemetry + Streak + Help */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--sys-color-text-muted)] leading-none">
                  Score
                </p>
                <p className="mt-0.5 font-mono text-base sm:text-lg font-semibold tabular-nums leading-tight text-[var(--sys-color-text-primary)]">
                  {score.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--sys-color-text-muted)] leading-none">
                  Moves
                </p>
                <p className="mt-0.5 font-mono text-base sm:text-lg font-semibold tabular-nums leading-tight text-[var(--sys-color-text-primary)]">
                  {moves}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--sys-color-text-muted)] leading-none">
                  Chain
                </p>
                <p
                  className={`mt-0.5 font-mono text-base sm:text-lg font-semibold tabular-nums leading-tight ${
                    consecutiveMatches >= 3
                      ? "text-[var(--card-cause-accent)]"
                      : "text-[var(--sys-color-text-primary)]"
                  }`}
                >
                  {activeMultiplier}x
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--sys-color-text-muted)] leading-none">
                  Pairs
                </p>
                <p className="mt-0.5 font-mono text-base sm:text-lg font-semibold tabular-nums leading-tight text-[var(--sys-color-text-primary)]">
                  {lockedPairIds.length}/{TOTAL_PAIRS}
                </p>
              </div>
              <div className="hidden md:block">
                <p className="text-[10px] uppercase tracking-wider text-[var(--sys-color-text-muted)] leading-none">
                  Time
                </p>
                <p className="mt-0.5 font-mono text-base sm:text-lg font-semibold tabular-nums leading-tight text-[var(--sys-color-text-secondary)]">
                  {formatDuration(elapsedSeconds)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {stats && stats.currentStreak > 0 && (
                <Badge tone="success" className="font-mono tabular-nums">
                  <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{stats.currentStreak}d</span>
                </Badge>
              )}

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="How to play Cause & Effect"
                    className="px-2"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span className="sr-only sm:not-sr-only sm:inline">
                      Rules
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>Cause &amp; Effect: Cascading Chains</DialogTitle>
                  <DialogDescription>
                    Pair asymmetrical Cause and Effect cards across a 4×5 grid to
                    build unbroken multiplier chains.
                  </DialogDescription>
                  <div className="mt-4 space-y-3 text-sm text-[var(--sys-color-text-secondary)] leading-relaxed">
                    <p>
                      <strong className="text-[var(--sys-color-text-primary)]">
                        1. Asymmetrical pairs:
                      </strong>{" "}
                      Every pair combines one amber{" "}
                      <span className="font-mono text-xs font-semibold text-[var(--card-cause-accent)]">
                        CAUSE
                      </span>{" "}
                      card with its matching teal{" "}
                      <span className="font-mono text-xs font-semibold text-[var(--card-effect-accent)]">
                        EFFECT
                      </span>{" "}
                      card. Matched pairs stay face-up and locked on the board.
                    </p>
                    <p>
                      <strong className="text-[var(--sys-color-text-primary)]">
                        2. Comfortable reading pace:
                      </strong>{" "}
                      Mismatched cards stay face-up for over 2 seconds so you
                      can read and memorise their positions—or tap another
                      face-down card right away to continue faster.
                    </p>
                    <p>
                      <strong className="text-[var(--sys-color-text-primary)]">
                        3. Cascade Multiplier &amp; 3x Reveal:
                      </strong>{" "}
                      Consecutive matches multiply points (1x, 2x, 3x…).
                      Reaching a 3x Chain Streak triggers a 1.5-second flash
                      showing all remaining unmatched Cause cards on the grid.
                    </p>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <DialogClose asChild>
                      <Button variant="primary">Got it</Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        {/* Main 2-Column Viewport-Fitted Arena: 4×5 Card Grid + Chain Tracker Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-stretch lg:h-[calc(100dvh-176px)] lg:min-h-[450px] lg:max-h-[600px]">
          {/* Focal Anchor: Viewport-Fit 4×5 Card Grid (zero-scroll on desktop) */}
          <section
            aria-label="4 by 5 Cause and Effect card grid"
            className="tonal-card p-2.5 sm:p-3.5 game-touch-surface relative flex flex-col justify-between min-h-0"
          >
            {/* Non-shifting Cascade Reveal Floating Banner (overlays top edge cleanly) */}
            <AnimatePresence>
              {cascadeRevealing && (
                <motion.div
                  key={`cascade-banner-${cascadeCount}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="absolute inset-x-3 top-3 z-20 rounded-xl border-2 px-3.5 py-2 shadow-lg overflow-hidden pointer-events-none"
                  style={{
                    backgroundColor: "var(--card-cause-bg)",
                    borderColor: "var(--card-cause-border)",
                  }}
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--card-cause-accent)]">
                      <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>
                        Cascade Reveal ({consecutiveMatches}x Chain) — Memorise
                        remaining Cause cards!
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums text-[var(--card-cause-accent)]">
                      1.5s
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full rounded-full bg-[var(--sys-color-surface-canvas)]/40 overflow-hidden">
                    <motion.div
                      initial={{ scaleX: 1 }}
                      animate={{ scaleX: 0 }}
                      transition={{
                        duration: CASCADE_REVEAL_MS / 1000,
                        ease: "linear",
                      }}
                      style={{
                        transformOrigin: "left center",
                        backgroundColor: "var(--card-cause-border)",
                      }}
                      className="h-full w-full"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 4×5 Responsive Grid: 4×5 on mobile, 5×4 viewport-fitted rows on desktop */}
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-rows-4 gap-2 sm:gap-2.5 flex-1 min-h-0">
              {cards.map((card, idx) => {
                const isLocked = lockedPairSet.has(card.pairId);
                const isSelected = flippedUids.includes(card.uid);
                const isMismatch = mismatchUids.includes(card.uid);
                const isCascadePeek =
                  cascadeRevealing && !isLocked && card.role === "cause";
                const isFaceUp = isLocked || isSelected || isCascadePeek;
                const isCause = card.role === "cause";

                return (
                  <motion.div
                    key={card.uid}
                    animate={
                      isMismatch && mismatchShakeActive && !prefersReducedMotion
                        ? { x: [0, -4, 4, -2, 2, 0] }
                        : { x: 0 }
                    }
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    className="card-3d-scene min-h-[96px] sm:min-h-[106px] lg:min-h-0 h-full"
                  >
                    <button
                      type="button"
                      onClick={() => handleCardFlip(card)}
                      disabled={
                        isLocked ||
                        cascadeRevealing ||
                        (isResolving && mismatchUids.length !== 2)
                      }
                      aria-pressed={isFaceUp}
                      aria-label={
                        isFaceUp
                          ? `${isCause ? "Cause" : "Effect"} card: ${card.text}${
                              isLocked ? " (Locked)" : ""
                            }`
                          : `Hidden card ${idx + 1}`
                      }
                      className="w-full h-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sys-color-action-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sys-color-surface-lowest)] cursor-pointer disabled:cursor-default group"
                    >
                      <div
                        className={`card-3d-inner ${
                          isFaceUp ? "is-flipped" : ""
                        }`}
                      >
                        {/* Face-Down Card Back */}
                        <div className="card-3d-face rounded-xl bg-[var(--sys-color-surface-low)] border border-[var(--sys-color-border-subtle)] group-hover:border-[var(--sys-color-border-focus)] group-hover:bg-[var(--sys-color-surface-container)] transition-colors p-1.5 sm:p-2 flex flex-col items-center justify-center">
                          <div className="w-full h-full rounded-lg border border-dashed border-[var(--sys-color-border-subtle)] flex flex-col items-center justify-center gap-1">
                            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--sys-color-surface-lowest)] border border-[var(--sys-color-border-subtle)] flex items-center justify-center text-[var(--sys-color-text-muted)] group-hover:text-[var(--sys-color-text-primary)] transition-colors">
                              <Link2
                                className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                            </span>
                            <span className="font-mono text-[9px] sm:text-[10px] tabular-nums text-[var(--sys-color-text-muted)]">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                          </div>
                        </div>

                        {/* Face-Up Card Front */}
                        <div
                          className="card-3d-face card-3d-front rounded-xl border-2 px-1.5 py-1.5 sm:px-2.5 sm:py-2 flex flex-col justify-between overflow-hidden relative transition-shadow"
                          style={{
                            backgroundColor: isCause
                              ? "var(--card-cause-bg)"
                              : "var(--card-effect-bg)",
                            borderColor: isCause
                              ? "var(--card-cause-border)"
                              : "var(--card-effect-border)",
                            boxShadow: isLocked
                              ? isCause
                                ? "0 0 0 1px var(--card-cause-border), 0 0 14px -4px var(--card-cause-border)"
                                : "0 0 0 1px var(--card-effect-border), 0 0 14px -4px var(--card-effect-border)"
                              : isCascadePeek
                                ? "0 0 0 2px var(--card-cause-border)"
                                : undefined,
                          }}
                        >
                          {/* Top Role Badge */}
                          <div className="flex items-center justify-between gap-1 shrink-0">
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-mono text-[8.5px] sm:text-[9.5px] font-semibold uppercase tracking-wider leading-none"
                              style={{
                                backgroundColor: isCause
                                  ? "var(--card-cause-badge-bg)"
                                  : "var(--card-effect-badge-bg)",
                                color: isCause
                                  ? "var(--card-cause-accent)"
                                  : "var(--card-effect-accent)",
                              }}
                            >
                              {isCause ? (
                                <Zap
                                  className="w-2.5 h-2.5 shrink-0"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Sparkles
                                  className="w-2.5 h-2.5 shrink-0"
                                  aria-hidden="true"
                                />
                              )}
                              <span>{isCause ? "CAUSE" : "EFFECT"}</span>
                            </span>

                            {isCascadePeek && (
                              <Eye
                                className="w-3 h-3 shrink-0"
                                style={{ color: "var(--card-cause-accent)" }}
                                aria-hidden="true"
                              />
                            )}
                          </div>

                          {/* Card Prompt Text — wide & crisp for fast reading */}
                          <div className="my-auto py-0.5 flex items-center justify-center">
                            <p className="text-[10.5px] sm:text-xs font-medium leading-tight sm:leading-snug text-center text-[var(--sys-color-text-primary)] break-words">
                              {card.text}
                            </p>
                          </div>

                          {/* Bottom Status Footer */}
                          <div className="h-3.5 flex items-center justify-center shrink-0">
                            {isLocked ? (
                              <span
                                className="inline-flex items-center gap-0.5 font-mono text-[8.5px] sm:text-[9px] font-semibold uppercase tracking-wider leading-none"
                                style={{
                                  color: isCause
                                    ? "var(--card-cause-accent)"
                                    : "var(--card-effect-accent)",
                                }}
                              >
                                <Lock
                                  className="w-2.5 h-2.5 shrink-0"
                                  aria-hidden="true"
                                />
                                <span>LOCKED</span>
                              </span>
                            ) : (
                              <span className="font-mono text-[8.5px] uppercase tracking-wider text-[var(--sys-color-text-muted)] leading-none">
                                {isCause
                                  ? activeTheme.causeLabel
                                  : activeTheme.effectLabel}
                              </span>
                            )}
                          </div>

                          {/* Subtle reading-time countdown hairline on mismatched cards */}
                          {isMismatch && !prefersReducedMotion && (
                            <motion.div
                              key={`dwell-${card.uid}-${moves}`}
                              initial={{ scaleX: 1 }}
                              animate={{ scaleX: 0 }}
                              transition={{
                                duration: mismatchDwellMs / 1000,
                                ease: "linear",
                              }}
                              style={{
                                transformOrigin: "left center",
                                backgroundColor: isCause
                                  ? "var(--card-cause-border)"
                                  : "var(--card-effect-border)",
                              }}
                              className="absolute inset-x-0 bottom-0 h-[3px] opacity-75"
                            />
                          )}
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Compact Legend, Reading Hint & Action Controls Underneath Grid */}
            <div className="mt-2.5 pt-2.5 border-t border-[var(--sys-color-border-subtle)] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--sys-color-text-secondary)]">
                {isShowingMismatch ? (
                  <span className="text-[var(--sys-color-text-primary)] font-medium">
                    Not a match — memorise positions, or tap another card to
                    continue.
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-sm border"
                        style={{
                          backgroundColor: "var(--card-cause-bg)",
                          borderColor: "var(--card-cause-border)",
                        }}
                      />
                      <span>Cause ({activeTheme.causeLabel})</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-sm border"
                        style={{
                          backgroundColor: "var(--card-effect-bg)",
                          borderColor: "var(--card-effect-border)",
                        }}
                      />
                      <span>Effect ({activeTheme.effectLabel})</span>
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {mode === "zen" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRestart}
                  >
                    <Shuffle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>New shuffle</span>
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRestart}
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Restart</span>
                  </Button>
                )}

                {completed && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowWinModal(true)}
                  >
                    <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Summary</span>
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* Right Sidebar: Chain Tracker + Self-Scrolling Chain Timeline (matches board height) */}
          <aside className="flex flex-col gap-3 min-h-0">
            {/* Chain Multiplier & Cascade Meter Card */}
            <div className="tonal-card p-3.5 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[var(--sys-color-text-primary)]">
                  Chain Tracker
                </h2>
                <span
                  className="font-mono text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor:
                      consecutiveMatches >= 3
                        ? "var(--card-cause-badge-bg)"
                        : "var(--sys-color-surface-low)",
                    color:
                      consecutiveMatches >= 3
                        ? "var(--card-cause-accent)"
                        : "var(--sys-color-text-primary)",
                  }}
                >
                  {activeMultiplier}x multiplier
                </span>
              </div>

              <p className="mt-1 text-xs text-[var(--sys-color-text-secondary)] leading-snug">
                {consecutiveMatches === 0
                  ? "Match consecutive pairs to multiply points. Hit 3x for a Cascade Reveal."
                  : consecutiveMatches < 3
                    ? `${3 - consecutiveMatches} more consecutive ${
                        3 - consecutiveMatches === 1 ? "match" : "matches"
                      } to flash remaining Cause cards.`
                    : `Cascade active! Next match earns ${(
                        BASE_MATCH_POINTS *
                        (consecutiveMatches + 1)
                      ).toLocaleString()} pts.`}
              </p>

              {/* 3-Step Cascade Progress Pips */}
              <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map((step) => {
                  const filled = cascadeMeterStep >= step;
                  return (
                    <div
                      key={step}
                      className="rounded-lg border px-2 py-1 text-center transition-colors"
                      style={{
                        backgroundColor: filled
                          ? "var(--card-cause-bg)"
                          : "var(--sys-color-surface-low)",
                        borderColor: filled
                          ? "var(--card-cause-border)"
                          : "var(--sys-color-border-subtle)",
                      }}
                    >
                      <span
                        className="font-mono text-[11px] font-semibold tabular-nums"
                        style={{
                          color: filled
                            ? "var(--card-cause-accent)"
                            : "var(--sys-color-text-muted)",
                        }}
                      >
                        {step === 3 ? "3x Reveal" : `${step}x`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2.5">
                <ProgressBar
                  value={lockedPairIds.length}
                  max={TOTAL_PAIRS}
                  label={`${lockedPairIds.length} of ${TOTAL_PAIRS} pairs locked`}
                />
              </div>

              <div className="mt-2.5 pt-2 border-t border-[var(--sys-color-border-subtle)] flex items-center justify-between text-xs text-[var(--sys-color-text-muted)]">
                <span>Longest chain</span>
                <span className="font-mono font-semibold tabular-nums text-[var(--sys-color-text-primary)]">
                  {longestChain > 0 ? `${longestChain}x` : "—"}
                </span>
              </div>
            </div>

            {/* Sequential Chain Timeline Card (scrolls internally on desktop) */}
            <div className="tonal-card p-3.5 flex flex-col flex-1 min-h-[180px] lg:min-h-0">
              <div className="flex items-center justify-between gap-2 mb-2.5 shrink-0">
                <h2 className="text-sm font-semibold text-[var(--sys-color-text-primary)]">
                  Chain Timeline
                </h2>
                <span className="font-mono text-xs tabular-nums text-[var(--sys-color-text-muted)]">
                  {chainTimeline.length}/{TOTAL_PAIRS}
                </span>
              </div>

              {chainTimeline.length === 0 ? (
                <div className="flex-1 rounded-xl border border-dashed border-[var(--sys-color-border-subtle)] bg-[var(--sys-color-surface-low)] px-3 py-5 flex flex-col items-center justify-center text-center">
                  <Link2
                    className="w-5 h-5 text-[var(--sys-color-text-muted)] mb-1.5"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-[var(--sys-color-text-secondary)]">
                    Flip two cards to forge the first link in your chain.
                  </p>
                </div>
              ) : (
                <ol
                  aria-label="Matched pairs timeline"
                  className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1"
                >
                  <AnimatePresence initial={false}>
                    {chainTimeline.map((link, idx) => (
                      <motion.li
                        key={link.pairId}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        {idx > 0 && (
                          <div className="flex justify-center py-0.5 text-[var(--sys-color-text-muted)]">
                            <ArrowDown
                              className="w-3 h-3"
                              aria-hidden="true"
                            />
                          </div>
                        )}
                        <div className="rounded-xl bg-[var(--sys-color-surface-low)] border border-[var(--sys-color-border-subtle)] px-2.5 py-2">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--sys-color-text-muted)]">
                              Pair {link.step}
                            </span>
                            <span className="font-mono text-[11px] font-semibold tabular-nums text-[var(--card-cause-accent)]">
                              +{link.pointsEarned} ({link.multiplier}x)
                            </span>
                          </div>
                          <div className="text-xs leading-snug text-[var(--sys-color-text-primary)] flex flex-col gap-0.5">
                            <span className="font-medium text-[var(--card-cause-accent)]">
                              {link.cause}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[var(--card-effect-accent)]">
                              <ArrowRight
                                className="w-3 h-3 shrink-0"
                                aria-hidden="true"
                              />
                              <span>{link.effect}</span>
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                  <div ref={timelineEndRef} />
                </ol>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Celebratory Win State Summary Modal */}
      <Dialog open={showWinModal} onOpenChange={setShowWinModal}>
        <DialogContent>
          <div className="flex items-center gap-3">
            <span
              className="w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "var(--card-cause-bg)",
                borderColor: "var(--card-cause-border)",
                color: "var(--card-cause-accent)",
              }}
            >
              <Trophy className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <DialogTitle>Chain Complete!</DialogTitle>
              <DialogDescription>{activeTheme.title}</DialogDescription>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[var(--sys-color-surface-low)] border border-[var(--sys-color-border-subtle)] p-3.5">
              <p className="text-[11px] uppercase tracking-wider text-[var(--sys-color-text-muted)]">
                Total Score
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--sys-color-text-primary)]">
                {score.toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl bg-[var(--sys-color-surface-low)] border border-[var(--sys-color-border-subtle)] p-3.5">
              <p className="text-[11px] uppercase tracking-wider text-[var(--sys-color-text-muted)]">
                Longest Chain
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--card-cause-accent)]">
                {longestChain}x
              </p>
            </div>

            <div className="rounded-xl bg-[var(--sys-color-surface-low)] border border-[var(--sys-color-border-subtle)] p-3.5">
              <p className="text-[11px] uppercase tracking-wider text-[var(--sys-color-text-muted)]">
                Total Moves
              </p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[var(--sys-color-text-primary)]">
                {moves}
              </p>
            </div>

            <div className="rounded-xl bg-[var(--sys-color-surface-low)] border border-[var(--sys-color-border-subtle)] p-3.5">
              <p className="text-[11px] uppercase tracking-wider text-[var(--sys-color-text-muted)]">
                Time
              </p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[var(--sys-color-text-primary)]">
                {formatDuration(elapsedSeconds)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleCopyShare}>
                {copied ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
                <span>{copied ? "Copied" : "Copy result"}</span>
              </Button>
              <Link href="/">
                <Button variant="ghost">Back to hub</Button>
              </Link>
            </div>

            <Button variant="primary" onClick={handlePlayAgain}>
              <Shuffle className="w-4 h-4" aria-hidden="true" />
              <span>Play Again</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
