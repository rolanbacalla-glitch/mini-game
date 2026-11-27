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
  Anchor,
  ArrowDown,
  Bot,
  Cat,
  Check,
  Coffee,
  Copy,
  Croissant,
  Fish,
  Flame,
  HelpCircle,
  Moon,
  RotateCcw,
  Star,
  Sun,
  Trophy,
  Undo2,
  Users,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  ToastStack,
  type ToastItem,
} from "@/components/ui";
import { soundEngine } from "@/lib/audio";
import {
  buildConnect4ShareCard,
  checkBoardResult,
  chooseBotColumn,
  COLS,
  createEmptyBoard,
  createSeededRng,
  dropPiece,
  EMBLEM_PAIRS,
  getDailyEmblemPair,
  getDropRow,
  getEmblemPairById,
  ROWS,
  type Board,
  type Difficulty,
  type EmblemPair,
  type EmblemPairId,
  type EmblemSpec,
  type MoveRecord,
  type OpponentMode,
  type Player,
} from "@/lib/connect-4/engine";
import { formatShortBritishDate, getTodayKey } from "@/lib/games";
import {
  formatDuration,
  loadDailyFourStats,
  recordDailyFourDailyCompletion,
  recordDailyFourZenCompletion,
  type DailyFourStats,
} from "@/lib/storage";

type GameMode = "daily" | "zen";

function EmblemIcon({
  iconKey,
  className,
  strokeWidth = 2.25,
}: {
  iconKey: EmblemSpec["iconKey"];
  className?: string;
  strokeWidth?: number;
}) {
  switch (iconKey) {
    case "coffee":
      return <Coffee className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
    case "croissant":
      return <Croissant className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
    case "cat":
      return <Cat className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
    case "fish":
      return <Fish className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
    case "sun":
      return <Sun className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
    case "moon":
      return <Moon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
    case "star":
      return <Star className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
    case "anchor":
      return <Anchor className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
}

/**
 * Pure non-colour tactile token disc:
 * - Player 1: Smooth raised alabaster/ivory disc with solid outer rim & dark engraved icon.
 * - Player 2: Matte deep charcoal-ink disc with grooved dashed inner collar & knockout icon.
 */
function TactileDisc({
  player,
  pair,
  size = "board",
  isWinning = false,
  winOrder = 0,
  isDimmed = false,
  isLatest = false,
  reducedMotion = false,
}: {
  player: Player;
  pair: EmblemPair;
  size?: "board" | "preview" | "badge";
  isWinning?: boolean;
  winOrder?: number;
  isDimmed?: boolean;
  isLatest?: boolean;
  reducedMotion?: boolean;
}) {
  const spec = player === 1 ? pair.p1 : pair.p2;
  const isP1 = player === 1;

  const sizeClasses =
    size === "badge"
      ? "w-9 h-9"
      : size === "preview"
        ? "w-8 h-8 sm:w-9 sm:h-9"
        : "w-full h-full";

  const iconClasses =
    size === "badge"
      ? "w-4 h-4"
      : size === "preview"
        ? "w-4 h-4 sm:w-[18px] sm:h-[18px]"
        : "w-[54%] h-[54%]";

  const cascadeDelay = 0.16 + winOrder * 0.095;
  const animateWin = isWinning && size === "board" && !reducedMotion;

  return (
    <motion.div
      animate={
        animateWin
          ? {
              scale: [1, 1.13, 1.04],
              rotate: [0, -5, 3, 0],
              opacity: 1,
            }
          : {
              scale: isWinning && size === "board" ? 1.04 : 1,
              rotate: 0,
              opacity: isDimmed ? 0.38 : 1,
            }
      }
      transition={
        animateWin
          ? {
              duration: 0.52,
              delay: cascadeDelay,
              ease: [0.22, 1, 0.36, 1],
            }
          : {
              duration: 0.28,
              delay: isDimmed && !reducedMotion ? 0.14 : 0,
              ease: "easeOut",
            }
      }
      className={`relative rounded-full flex items-center justify-center select-none ${sizeClasses} ${
        isP1
          ? "bg-[var(--sys-color-surface-lowest)] text-[var(--sys-color-text-primary)] border-2 border-[var(--sys-color-text-primary)] shadow-[inset_0_2px_0_var(--sys-specular-top),0_2px_5px_rgba(0,0,0,0.10)]"
          : "bg-[var(--sys-color-text-primary)] text-[var(--sys-color-surface-lowest)] border-2 border-[var(--sys-color-text-primary)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.22),0_2px_5px_rgba(0,0,0,0.12)]"
      } ${
        isWinning
          ? "ring-2 ring-offset-2 ring-[var(--sys-color-text-primary)] ring-offset-[var(--sys-color-surface-container)] z-20"
          : ""
      }`}
    >
      {/* Expanding monochrome ripple halo on each winning disc in sequence */}
      {animateWin && (
        <>
          <motion.span
            aria-hidden="true"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: [0.85, 1.44], opacity: [0.75, 0] }}
            transition={{
              duration: 0.62,
              delay: cascadeDelay + 0.02,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="pointer-events-none absolute -inset-1 rounded-full border-2 border-[var(--sys-color-text-primary)]"
          />
          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: [0.3, 0.72, 0.3], scale: [1, 1.07, 1] }}
            transition={{
              duration: 2.6,
              delay: cascadeDelay + 0.55,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -inset-[5px] rounded-full border border-dashed border-[var(--sys-color-text-primary)]/70"
          />
        </>
      )}

      {/* Player 1 tactile smooth inner bevel ring */}
      {isP1 && size === "board" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[3px] rounded-full border border-[var(--sys-color-text-primary)]/18"
        />
      )}

      {/* Player 2 tactile grooved dashed collar — unmistakable without colour */}
      {!isP1 && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-full border-dashed border-[var(--sys-color-surface-lowest)]/55 ${
            size === "badge"
              ? "inset-[3px] border"
              : "inset-[3px] sm:inset-[4px] border-[1.5px]"
          }`}
        />
      )}

      <motion.span
        animate={
          animateWin
            ? { scale: [1, 1.22, 1] }
            : { scale: 1 }
        }
        transition={
          animateWin
            ? {
                duration: 0.44,
                delay: cascadeDelay + 0.06,
                ease: [0.22, 1, 0.36, 1],
              }
            : { duration: 0.15 }
        }
        className="relative z-10 flex items-center justify-center w-full h-full"
      >
        <EmblemIcon
          iconKey={spec.iconKey}
          className={iconClasses}
          strokeWidth={size === "badge" ? 2.2 : 2.35}
        />
      </motion.span>

      {/* Subtle latest-move corner notch indicator */}
      {isLatest && !isWinning && size === "board" && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
            isP1
              ? "bg-[var(--sys-color-text-primary)] border-[var(--sys-color-surface-container)]"
              : "bg-[var(--sys-color-surface-lowest)] border-[var(--sys-color-text-primary)]"
          }`}
        />
      )}
    </motion.div>
  );
}

export function Connect4Game() {
  const searchParams = useSearchParams();
  const initialMode: GameMode =
    searchParams.get("mode") === "zen" ? "zen" : "daily";

  const [mode, setMode] = useState<GameMode>(initialMode);
  const [todayKey] = useState<string>(() => getTodayKey());
  const dailyPair = useMemo(() => getDailyEmblemPair(todayKey), [todayKey]);

  const [emblemPairId, setEmblemPairId] = useState<EmblemPairId>(dailyPair.id);
  const pair = useMemo(() => getEmblemPairById(emblemPairId), [emblemPairId]);

  const [opponentMode, setOpponentMode] = useState<OpponentMode>("bot");
  const [difficulty, setDifficulty] = useState<Difficulty>("clever");

  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [keyboardCol, setKeyboardCol] = useState<number>(3);
  const [usingKeyboard, setUsingKeyboard] = useState<boolean>(false);
  const [botThinking, setBotThinking] = useState<boolean>(false);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [matchNonce, setMatchNonce] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [stats, setStats] = useState<DailyFourStats | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const recordedMatchRef = useRef<number>(0);

  const activeOpponent: OpponentMode = mode === "daily" ? "bot" : opponentMode;
  const activeDifficulty: Difficulty = mode === "daily" ? "clever" : difficulty;

  const prefersReducedMotion = Boolean(useReducedMotion());

  const result = useMemo(() => checkBoardResult(board), [board]);
  const isFinished = result.winner !== null;
  const lastMove = history.length > 0 ? history[history.length - 1] : null;

  // Order winning cells so the celebratory ripple sweeps cleanly from the winning drop end
  const orderedWinningCells = useMemo(() => {
    const cells = result.winningCells;
    if (cells.length < 4) return cells;
    if (lastMove) {
      const lastCell = cells[cells.length - 1];
      if (lastCell[0] === lastMove.row && lastCell[1] === lastMove.col) {
        return [...cells].reverse();
      }
    }
    return cells;
  }, [lastMove, result.winningCells]);

  const winningOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    orderedWinningCells.forEach(([r, c], idx) => {
      map.set(`${r},${c}`, idx);
    });
    return map;
  }, [orderedWinningCells]);

  const p1Count = useMemo(
    () => history.filter((m) => m.player === 1).length,
    [history]
  );
  const p2Count = useMemo(
    () => history.filter((m) => m.player === 2).length,
    [history]
  );

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

  const resetBoard = useCallback((playAudio = false) => {
    if (playAudio) soundEngine.playClear();
    setBoard(createEmptyBoard());
    setCurrentPlayer(1);
    setHistory([]);
    setHoveredCol(null);
    setBotThinking(false);
    setElapsedSeconds(0);
    setCopied(false);
    setMatchNonce((n) => n + 1);
  }, []);

  // Load persisted Daily Four stats on mount
  useEffect(() => {
    setStats(loadDailyFourStats());
  }, []);

  // Reset board cleanly when switching between Daily and Free Play
  useEffect(() => {
    resetBoard(false);
  }, [mode, resetBoard]);

  // Gentle elapsed timer (pauses once match ends)
  useEffect(() => {
    if (isFinished) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isFinished, matchNonce]);

  const commitMove = useCallback(
    (col: number, player: Player) => {
      const dropped = dropPiece(board, col, player);
      if (!dropped) {
        soundEngine.playInvalid();
        return;
      }

      const { board: nextBoard, row } = dropped;
      const nextHistory = [...history, { row, col, player }];
      const nextResult = checkBoardResult(nextBoard);

      setBoard(nextBoard);
      setHistory(nextHistory);

      if (nextResult.winner !== null) {
        if (
          nextResult.winner === 1 ||
          (activeOpponent === "local" && nextResult.winner === 2)
        ) {
          soundEngine.playComplete();
        } else if (nextResult.winner === "draw") {
          soundEngine.playLatch();
        } else {
          soundEngine.playTokenDrop(row);
        }
      } else {
        soundEngine.playTokenDrop(row);
        setCurrentPlayer(player === 1 ? 2 : 1);
      }
    },
    [activeOpponent, board, history]
  );

  // Persist stats when a match finishes
  useEffect(() => {
    if (!isFinished || recordedMatchRef.current === matchNonce) return;
    recordedMatchRef.current = matchNonce;

    const totalMoves = history.length;

    if (mode === "daily") {
      if (result.winner === 1 || result.winner === "draw") {
        const outcome = result.winner === 1 ? "win" : "draw";
        const outcomeLabel =
          outcome === "win"
            ? `Won with ${pair.p1.name}`
            : "Honourable draw";
        const shareText = buildConnect4ShareCard({
          dateLabel: formatShortBritishDate(todayKey),
          pair,
          board,
          winningCells: result.winningCells,
          outcomeLabel,
          moves: totalMoves,
          durationLabel: formatDuration(elapsedSeconds),
        });

        const updated = recordDailyFourDailyCompletion({
          dateKey: todayKey,
          outcome,
          moves: totalMoves,
          elapsedSeconds,
          emblemPairId: pair.id,
          shareText,
          completedAt: new Date().toISOString(),
        });
        setStats(updated);
        pushToast(
          outcome === "win" ? "Daily match won" : "Daily match drawn",
          `${totalMoves} moves · ${formatDuration(elapsedSeconds)}.`,
          "success"
        );
      }
    } else {
      const updated = recordDailyFourZenCompletion();
      setStats(updated);
    }
  }, [
    board,
    elapsedSeconds,
    history.length,
    isFinished,
    matchNonce,
    mode,
    pair,
    pushToast,
    result.winner,
    result.winningCells,
    todayKey,
  ]);

  // Bot turn execution with realistic, calm pause
  useEffect(() => {
    if (activeOpponent !== "bot" || currentPlayer !== 2 || isFinished) {
      setBotThinking(false);
      return;
    }

    setBotThinking(true);
    const delayMs = 420;
    const timer = window.setTimeout(() => {
      const rng =
        mode === "daily"
          ? createSeededRng(`daily-four::${todayKey}::m${history.length}::n${matchNonce}`)
          : Math.random;
      const botCol = chooseBotColumn(board, 2, activeDifficulty, rng);
      setBotThinking(false);
      if (botCol !== -1) {
        commitMove(botCol, 2);
      }
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [
    activeDifficulty,
    activeOpponent,
    board,
    commitMove,
    currentPlayer,
    history.length,
    isFinished,
    matchNonce,
    mode,
    todayKey,
  ]);

  const canHumanDrop =
    !isFinished && !botThinking && (activeOpponent === "local" || currentPlayer === 1);

  const handleColumnSelect = useCallback(
    (col: number) => {
      if (!canHumanDrop) return;
      if (getDropRow(board, col) === -1) {
        soundEngine.playInvalid();
        return;
      }
      commitMove(col, currentPlayer);
    },
    [board, canHumanDrop, commitMove, currentPlayer]
  );

  // Keyboard accessibility: 1–7 to drop directly, Left/Right arrows + Enter/Space
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLButtonElement
      ) {
        return;
      }
      if (!canHumanDrop) return;

      if (e.key >= "1" && e.key <= "7") {
        e.preventDefault();
        const col = Number(e.key) - 1;
        setUsingKeyboard(true);
        setKeyboardCol(col);
        handleColumnSelect(col);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setUsingKeyboard(true);
        setKeyboardCol((c) => (c - 1 + COLS) % COLS);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setUsingKeyboard(true);
        setKeyboardCol((c) => (c + 1) % COLS);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setUsingKeyboard(true);
        handleColumnSelect(keyboardCol);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canHumanDrop, handleColumnSelect, keyboardCol]);

  const handleUndo = () => {
    if (history.length === 0 || botThinking) return;
    // In bot mode, pop back to Player 1's turn (undo bot + player move)
    let stepsToUndo = 1;
    if (activeOpponent === "bot") {
      if (lastMove?.player === 2 && history.length >= 2) {
        stepsToUndo = 2;
      } else {
        stepsToUndo = 1;
      }
    }

    const nextHistory = history.slice(0, history.length - stepsToUndo);
    const rebuilt = createEmptyBoard();
    for (const move of nextHistory) {
      rebuilt[move.row][move.col] = move.player;
    }

    soundEngine.playPickup();
    setBoard(rebuilt);
    setHistory(nextHistory);
    setCurrentPlayer(
      nextHistory.length === 0
        ? 1
        : nextHistory[nextHistory.length - 1].player === 1
          ? 2
          : 1
    );
  };

  const outcomeTitle = useMemo(() => {
    if (result.winner === "draw") return "Honourable draw.";
    if (result.winner === 1) {
      return activeOpponent === "bot"
        ? `You connected four ${pair.p1.name.toLowerCase()}s.`
        : `${pair.p1.name} wins!`;
    }
    if (result.winner === 2) {
      return activeOpponent === "bot"
        ? `Bot connected four ${pair.p2.name.toLowerCase()}s.`
        : `${pair.p2.name} wins!`;
    }
    return "";
  }, [activeOpponent, pair.p1.name, pair.p2.name, result.winner]);

  const handleCopyShare = async () => {
    const shareText = buildConnect4ShareCard({
      dateLabel:
        mode === "daily" ? formatShortBritishDate(todayKey) : "Free Play",
      pair,
      board,
      winningCells: result.winningCells,
      outcomeLabel: outcomeTitle.replace(/\.$/, ""),
      moves: history.length,
      durationLabel:
        mode === "daily" ? formatDuration(elapsedSeconds) : "Untimed",
    });

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      soundEngine.playPickup();
      pushToast("Symbol grid copied", "Zero-colour board ready to paste.", "success");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      pushToast("Copy unavailable", "Clipboard access was blocked.", "warning");
    }
  };

  const activePreviewCol = canHumanDrop
    ? hoveredCol !== null
      ? hoveredCol
      : usingKeyboard
        ? keyboardCol
        : null
    : null;

  const previewLandingRow =
    activePreviewCol !== null ? getDropRow(board, activePreviewCol) : -1;

  // Winning line SVG coordinates & flourish anchor points (0..700 x 0..600)
  const winningLineCoords = useMemo(() => {
    if (orderedWinningCells.length < 4) return null;
    const first = orderedWinningCells[0];
    const last = orderedWinningCells[orderedWinningCells.length - 1];
    const x1 = (first[1] + 0.5) * 100;
    const y1 = (first[0] + 0.5) * 100;
    const x2 = (last[1] + 0.5) * 100;
    const y2 = (last[0] + 0.5) * 100;
    return {
      x1,
      y1,
      x2,
      y2,
      midX: (x1 + x2) / 2,
      midY: (y1 + y2) / 2,
      nodes: orderedWinningCells.map(([r, c]) => ({
        x: (c + 0.5) * 100,
        y: (r + 0.5) * 100,
      })),
    };
  }, [orderedWinningCells]);

  const p1Label = activeOpponent === "bot" ? "You" : "Player 1";
  const p2Label = activeOpponent === "bot" ? "Barista Bot" : "Player 2";

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar backHref="/" title="Connect 4" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-16">
        {/* Top Mode Bar & Clean Unboxed Metadata */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as GameMode)}>
            <TabsList aria-label="Game mode">
              <TabsTrigger value="daily">Daily Match</TabsTrigger>
              <TabsTrigger value="zen">Free Play</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-[var(--sys-color-text-secondary)]">
              <span>
                {mode === "daily" ? formatShortBritishDate(todayKey) : "Untimed"}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-[var(--sys-color-text-primary)] font-medium">
                {formatDuration(elapsedSeconds)}
              </span>
              {mode === "daily" && stats && stats.currentStreak > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[var(--sys-color-feedback-success)] font-medium">
                    <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                    {stats.currentStreak}-day streak
                  </span>
                </>
              )}
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="How to play Connect 4"
                  className="w-10 px-0 shrink-0"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>How to play Connect 4</DialogTitle>
                <DialogDescription>
                  Classic four-in-a-row designed to work completely without colour.
                </DialogDescription>
                <ul className="mt-4 space-y-2.5 text-sm text-[var(--sys-color-text-secondary)] list-disc pl-5">
                  <li>
                    <strong>Connect four:</strong> Drop engraved discs into any of
                    the 7 columns to align four matching emblems horizontally,
                    vertically, or diagonally.
                  </li>
                  <li>
                    <strong>Zero-colour clarity:</strong> Player 1 plays smooth
                    raised ivory discs; Player 2 plays grooved charcoal discs with
                    a dashed inner collar — distinct by icon silhouette, luminance,
                    and rim geometry.
                  </li>
                  <li>
                    <strong>Switch emblems anytime:</strong> Pick Café, Critters,
                    Celestial, or Tactile icons in the side panel without losing
                    your board.
                  </li>
                  <li>
                    <strong>Controls:</strong> Tap any column on mobile, click on
                    desktop, or use keys{" "}
                    <kbd className="font-mono px-1.5 py-0.5 rounded bg-[var(--sys-color-surface-low)] border border-[var(--sys-color-border-subtle)] text-xs">
                      1
                    </kbd>
                    –
                    <kbd className="font-mono px-1.5 py-0.5 rounded bg-[var(--sys-color-surface-low)] border border-[var(--sys-color-border-subtle)] text-xs">
                      7
                    </kbd>
                    .
                  </li>
                </ul>
                <div className="mt-6 flex justify-end">
                  <DialogClose asChild>
                    <Button variant="primary">Play</Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main 2-Column Tabletop Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 lg:gap-8 items-start">
          {/* Focal Anchor: Tactile 7x6 Connect 4 Board */}
          <section
            aria-label="Connect Four game board"
            className="flex flex-col items-center w-full"
          >
            <div
              className="w-full max-w-[540px] game-touch-surface"
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Overhead Drop Preview Rail */}
              <div
                aria-hidden="true"
                className="grid grid-cols-7 gap-1.5 sm:gap-2.5 px-3 sm:px-4 mb-2 h-10 sm:h-11 items-end"
              >
                {Array.from({ length: COLS }).map((_, col) => {
                  const isActive = activePreviewCol === col && previewLandingRow !== -1;
                  return (
                    <div
                      key={col}
                      className="flex flex-col items-center justify-end h-full"
                    >
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            key={`preview-${currentPlayer}`}
                            initial={{ opacity: 0, y: -6, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.9 }}
                            transition={{ duration: 0.14 }}
                            className="flex flex-col items-center"
                          >
                            <TactileDisc
                              player={currentPlayer}
                              pair={pair}
                              size="preview"
                            />
                            <ArrowDown className="w-3 h-3 mt-0.5 text-[var(--sys-color-text-muted)]" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Architectural Matte Tabletop Frame */}
              <div
                className="relative rounded-[22px] sm:rounded-[26px] bg-[var(--sys-color-surface-container)] border border-[var(--sys-color-border-subtle)] p-2.5 sm:p-4 shadow-[0_14px_34px_-18px_rgba(0,0,0,0.22)]"
                onMouseLeave={() => setHoveredCol(null)}
              >
                {/* 7x6 Slot Matrix */}
                <div className="relative grid grid-cols-7 gap-1.5 sm:gap-2.5">
                  {Array.from({ length: ROWS }).map((_, row) =>
                    Array.from({ length: COLS }).map((__, col) => {
                      const cell = board[row][col];
                      const isColumnHovered = activePreviewCol === col;
                      const isLandingTarget =
                        isColumnHovered && previewLandingRow === row && cell === 0;
                      const winOrder = winningOrderMap.get(`${row},${col}`);
                      const isWinningCell = winOrder !== undefined;
                      const isDimmed =
                        result.winner !== null &&
                        result.winner !== "draw" &&
                        !isWinningCell;
                      const isLatest =
                        lastMove !== null &&
                        lastMove.row === row &&
                        lastMove.col === col;
                      const colFull = getDropRow(board, col) === -1;
                      const dropTargetRow = getDropRow(board, col);

                      const ownerName =
                        cell === 1
                          ? pair.p1.name
                          : cell === 2
                            ? pair.p2.name
                            : "empty";

                      return (
                        <button
                          key={`${row}-${col}`}
                          type="button"
                          draggable={false}
                          disabled={!canHumanDrop || colFull}
                          onContextMenu={(e) => e.preventDefault()}
                          onPointerEnter={(e) => {
                            if (e.pointerType === "mouse") {
                              setUsingKeyboard(false);
                              setHoveredCol(col);
                            }
                          }}
                          onFocus={() => {
                            setUsingKeyboard(true);
                            setKeyboardCol(col);
                          }}
                          onClick={() => handleColumnSelect(col)}
                          aria-label={`Column ${col + 1}, Row ${row + 1}, ${ownerName}${
                            canHumanDrop && !colFull
                              ? `. Drop ${
                                  currentPlayer === 1 ? pair.p1.name : pair.p2.name
                                } in row ${dropTargetRow + 1}`
                              : ""
                          }`}
                          className={`group relative aspect-square min-w-[40px] min-h-[40px] rounded-full p-[3px] sm:p-1 flex items-center justify-center transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sys-color-border-focus)] ${
                            canHumanDrop && !colFull
                              ? "cursor-pointer"
                              : "cursor-default"
                          } ${
                            isColumnHovered && canHumanDrop && !colFull
                              ? "bg-[var(--sys-color-bg-surface-active)]"
                              : "bg-[var(--sys-color-surface-canvas)]"
                          } shadow-[inset_0_2px_5px_rgba(0,0,0,0.12)]`}
                        >
                          {/* Landing target ghost silhouette */}
                          {isLandingTarget && (
                            <span
                              aria-hidden="true"
                              className="w-full h-full rounded-full border-2 border-dashed border-[var(--sys-color-text-muted)]/60 flex items-center justify-center opacity-45 pointer-events-none"
                            >
                              <EmblemIcon
                                iconKey={
                                  currentPlayer === 1
                                    ? pair.p1.iconKey
                                    : pair.p2.iconKey
                                }
                                className="w-[48%] h-[48%] text-[var(--sys-color-text-primary)]"
                                strokeWidth={2}
                              />
                            </span>
                          )}

                          {/* Dropped Tactile Disc with Gravity Spring */}
                          {cell !== 0 && (
                            <motion.div
                              key={`disc-${matchNonce}-${row}-${col}`}
                              initial={{
                                y: -(row + 1.15) * 58,
                                opacity: 0.92,
                              }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 360,
                                damping: 24,
                                mass: 0.85,
                              }}
                              className="w-full h-full pointer-events-none"
                            >
                              <TactileDisc
                                player={cell}
                                pair={pair}
                                size="board"
                                isWinning={isWinningCell}
                                winOrder={winOrder ?? 0}
                                isDimmed={isDimmed}
                                isLatest={isLatest}
                                reducedMotion={prefersReducedMotion}
                              />
                            </motion.div>
                          )}
                        </button>
                      );
                    })
                  )}

                  {/* Choreographed Geometric Alignment Line & Monochrome Flourish on 4-in-a-Row */}
                  <AnimatePresence>
                    {winningLineCoords && (
                      <motion.svg
                        key={`win-line-${matchNonce}`}
                        viewBox="0 0 700 600"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pointer-events-none absolute inset-0 w-full h-full z-30 overflow-visible"
                      >
                        {/* Soft contrast halo rail */}
                        <motion.line
                          x1={winningLineCoords.x1}
                          y1={winningLineCoords.y1}
                          x2={winningLineCoords.x2}
                          y2={winningLineCoords.y2}
                          stroke="var(--sys-color-surface-lowest)"
                          strokeWidth="13"
                          strokeLinecap="round"
                          initial={{
                            pathLength: prefersReducedMotion ? 1 : 0,
                            opacity: 0,
                          }}
                          animate={{ pathLength: 1, opacity: 0.88 }}
                          transition={{
                            duration: prefersReducedMotion ? 0.01 : 0.44,
                            delay: prefersReducedMotion ? 0 : 0.16,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        />

                        {/* Primary dashed architectural line */}
                        <motion.line
                          x1={winningLineCoords.x1}
                          y1={winningLineCoords.y1}
                          x2={winningLineCoords.x2}
                          y2={winningLineCoords.y2}
                          stroke="var(--sys-color-text-primary)"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray="11 9"
                          initial={{
                            pathLength: prefersReducedMotion ? 1 : 0,
                            opacity: 0,
                          }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{
                            duration: prefersReducedMotion ? 0.01 : 0.46,
                            delay: prefersReducedMotion ? 0 : 0.18,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        />

                        {/* Staggered anchor rings blooming at each winning disc centre */}
                        {winningLineCoords.nodes.map((node, idx) => (
                          <motion.circle
                            key={`win-node-${idx}`}
                            cx={node.x}
                            cy={node.y}
                            r="9"
                            fill="var(--sys-color-surface-lowest)"
                            stroke="var(--sys-color-text-primary)"
                            strokeWidth="3.5"
                            initial={{
                              scale: prefersReducedMotion ? 1 : 0,
                              opacity: 0,
                            }}
                            animate={{
                              scale: prefersReducedMotion ? 1 : [0, 1.25, 1],
                              opacity: 1,
                            }}
                            transition={{
                              duration: prefersReducedMotion ? 0.01 : 0.34,
                              delay: prefersReducedMotion
                                ? 0
                                : 0.2 + idx * 0.095,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{
                              transformBox: "fill-box",
                              transformOrigin: "center",
                            }}
                          />
                        ))}

                        {/* Subtle restrained monochrome celebration ticks radiating from midpoint */}
                        {!prefersReducedMotion &&
                          [
                            { dx: -46, dy: -38, r: 4.5, hollow: false },
                            { dx: 52, dy: -32, r: 5.5, hollow: true },
                            { dx: -56, dy: 24, r: 5, hollow: true },
                            { dx: 48, dy: 34, r: 4, hollow: false },
                            { dx: 6, dy: -52, r: 4, hollow: false },
                            { dx: -10, dy: 50, r: 5, hollow: true },
                          ].map((spark, idx) => (
                            <motion.circle
                              key={`flourish-${idx}`}
                              cx={winningLineCoords.midX}
                              cy={winningLineCoords.midY}
                              r={spark.r}
                              fill={
                                spark.hollow
                                  ? "var(--sys-color-surface-lowest)"
                                  : "var(--sys-color-text-primary)"
                              }
                              stroke="var(--sys-color-text-primary)"
                              strokeWidth={spark.hollow ? 2.5 : 0}
                              initial={{
                                x: 0,
                                y: 0,
                                scale: 0.3,
                                opacity: 0,
                              }}
                              animate={{
                                x: spark.dx,
                                y: spark.dy,
                                scale: [0.3, 1.05, 0.65],
                                opacity: [0, 0.85, 0],
                              }}
                              transition={{
                                duration: 0.82,
                                delay: 0.34 + idx * 0.035,
                                ease: [0.16, 1, 0.3, 1],
                              }}
                              style={{
                                transformBox: "fill-box",
                                transformOrigin: "center",
                              }}
                            />
                          ))}
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </div>

                {/* Column Numbers Rail (Desktop Keyboard Cue) */}
                <div
                  aria-hidden="true"
                  className="hidden sm:grid grid-cols-7 gap-2.5 mt-2.5 px-1 text-center"
                >
                  {Array.from({ length: COLS }).map((_, col) => (
                    <span
                      key={col}
                      className={`font-mono text-[11px] tabular-nums transition-colors ${
                        activePreviewCol === col
                          ? "text-[var(--sys-color-text-primary)] font-semibold"
                          : "text-[var(--sys-color-text-muted)]"
                      }`}
                    >
                      {col + 1}
                    </span>
                  ))}
                </div>
              </div>

              {/* Subtle Tabletop Weighted Stand Base */}
              <div
                aria-hidden="true"
                className="mx-auto w-[92%] h-2.5 rounded-b-xl bg-[var(--sys-color-surface-high)] border-x border-b border-[var(--sys-color-border-subtle)]"
              />
            </div>

            {/* Post-Match Outcome Strip (Sequenced smoothly after the winning line highlight) */}
            <AnimatePresence>
              {isFinished && (
                <motion.section
                  key="match-summary"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.01 : 0.28,
                    delay:
                      prefersReducedMotion || result.winner === "draw"
                        ? 0
                        : 0.45,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="mt-6 w-full max-w-[540px] tonal-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      initial={{ scale: prefersReducedMotion ? 1 : 0.72 }}
                      animate={{
                        scale: prefersReducedMotion ? 1 : [0.72, 1.1, 1],
                      }}
                      transition={{
                        duration: prefersReducedMotion ? 0.01 : 0.42,
                        delay:
                          prefersReducedMotion || result.winner === "draw"
                            ? 0
                            : 0.52,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="w-10 h-10 rounded-xl bg-[var(--sys-color-surface-low)] border border-[var(--sys-color-border-subtle)] flex items-center justify-center shrink-0 text-[var(--sys-color-text-primary)]"
                    >
                      <Trophy className="w-5 h-5" aria-hidden="true" />
                    </motion.div>
                    <div>
                      <h2 className="text-base font-semibold text-[var(--sys-color-text-primary)]">
                        {outcomeTitle}
                      </h2>
                      <p className="mt-0.5 text-xs text-[var(--sys-color-text-secondary)]">
                        <span className="font-mono tabular-nums">
                          {history.length}
                        </span>{" "}
                        moves ·{" "}
                        <span className="font-mono tabular-nums">
                          {formatDuration(elapsedSeconds)}
                        </span>{" "}
                        · {pair.p1.name} vs {pair.p2.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => resetBoard(true)}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Play again</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyShare}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy grid</span>
                        </>
                      )}
                    </Button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </section>

          {/* Side Rail: Player Ledger, Emblem Picker & Controls */}
          <aside
            aria-label="Match ledger and controls"
            className="w-full space-y-5 game-touch-surface"
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Player Turn Ledger */}
            <div className="tonal-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-sm font-semibold text-[var(--sys-color-text-primary)]">
                  Match ledger
                </h1>
                <span className="text-xs font-mono tabular-nums text-[var(--sys-color-text-muted)]">
                  {history.length} / {ROWS * COLS} discs
                </span>
              </div>

              <div className="space-y-2">
                {/* Player 1 Row */}
                <div
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-colors ${
                    !isFinished && currentPlayer === 1
                      ? "bg-[var(--sys-color-surface-low)] border-[var(--sys-color-text-primary)]"
                      : "bg-transparent border-[var(--sys-color-border-subtle)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TactileDisc player={1} pair={pair} size="badge" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--sys-color-text-primary)] truncate">
                        {p1Label} · {pair.p1.name}
                      </div>
                      <div className="text-xs text-[var(--sys-color-text-muted)]">
                        {result.winner === 1
                          ? "Winner · 4 connected"
                          : !isFinished && currentPlayer === 1
                            ? "Your turn · smooth disc"
                            : "Smooth ivory disc"}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[var(--sys-color-text-secondary)] shrink-0">
                    {p1Count}
                  </span>
                </div>

                {/* Player 2 Row */}
                <div
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-colors ${
                    !isFinished && currentPlayer === 2
                      ? "bg-[var(--sys-color-surface-low)] border-[var(--sys-color-text-primary)]"
                      : "bg-transparent border-[var(--sys-color-border-subtle)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TactileDisc player={2} pair={pair} size="badge" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--sys-color-text-primary)] truncate">
                        {p2Label} · {pair.p2.name}
                      </div>
                      <div className="text-xs text-[var(--sys-color-text-muted)]">
                        {result.winner === 2
                          ? "Winner · 4 connected"
                          : botThinking
                            ? "Thinking…"
                            : !isFinished && currentPlayer === 2
                              ? "Active turn · grooved disc"
                              : "Grooved charcoal disc"}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[var(--sys-color-text-secondary)] shrink-0">
                    {p2Count}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[var(--sys-color-border-subtle)] flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUndo}
                  disabled={history.length === 0 || botThinking}
                  className="flex-1"
                >
                  <Undo2 className="w-4 h-4" />
                  <span>Undo</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => resetBoard(true)}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>New game</span>
                </Button>
              </div>
            </div>

            {/* Emblem Pair Selector (Switch anytime, zero colour needed) */}
            <div className="tonal-card p-4">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-[var(--sys-color-text-primary)]">
                  Emblem set
                </h2>
                <p className="text-xs text-[var(--sys-color-text-muted)] mt-0.5">
                  Shape &amp; texture pairs — zero colour cues.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {EMBLEM_PAIRS.map((item) => {
                  const selected = item.id === emblemPairId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playPickup();
                        setEmblemPairId(item.id);
                      }}
                      aria-pressed={selected}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sys-color-border-focus)] ${
                        selected
                          ? "bg-[var(--sys-color-surface-low)] border-[var(--sys-color-text-primary)] text-[var(--sys-color-text-primary)]"
                          : "bg-transparent border-[var(--sys-color-border-subtle)] text-[var(--sys-color-text-secondary)] hover:bg-[var(--sys-color-surface-low)]"
                      }`}
                    >
                      <span className="text-xs font-medium whitespace-nowrap">
                        {item.label}
                      </span>
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <span className="w-5 h-5 rounded-full bg-[var(--sys-color-surface-lowest)] border border-[var(--sys-color-text-primary)] text-[var(--sys-color-text-primary)] flex items-center justify-center">
                          <EmblemIcon
                            iconKey={item.p1.iconKey}
                            className="w-3 h-3"
                            strokeWidth={2.2}
                          />
                        </span>
                        <span className="w-5 h-5 rounded-full bg-[var(--sys-color-text-primary)] text-[var(--sys-color-surface-lowest)] flex items-center justify-center">
                          <EmblemIcon
                            iconKey={item.p2.iconKey}
                            className="w-3 h-3"
                            strokeWidth={2.2}
                          />
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Free Play Options (Opponent & Difficulty) */}
            {mode === "zen" && (
              <div className="tonal-card p-4 space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--sys-color-text-primary)] mb-2">
                    Opponent
                  </h2>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--sys-color-surface-low)] border border-[var(--sys-color-border-subtle)]">
                    <button
                      type="button"
                      onClick={() => {
                        if (opponentMode !== "bot") {
                          setOpponentMode("bot");
                          resetBoard(true);
                        }
                      }}
                      className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                        opponentMode === "bot"
                          ? "bg-[var(--sys-color-surface-lowest)] text-[var(--sys-color-text-primary)] shadow-xs"
                          : "text-[var(--sys-color-text-secondary)] hover:text-[var(--sys-color-text-primary)]"
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>vs Bot</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (opponentMode !== "local") {
                          setOpponentMode("local");
                          resetBoard(true);
                        }
                      }}
                      className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                        opponentMode === "local"
                          ? "bg-[var(--sys-color-surface-lowest)] text-[var(--sys-color-text-primary)] shadow-xs"
                          : "text-[var(--sys-color-text-secondary)] hover:text-[var(--sys-color-text-primary)]"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>2 Players</span>
                    </button>
                  </div>
                </div>

                {opponentMode === "bot" && (
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--sys-color-text-primary)] mb-2">
                      Bot skill
                    </h2>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--sys-color-surface-low)] border border-[var(--sys-color-border-subtle)]">
                      {(["gentle", "clever", "master"] as Difficulty[]).map(
                        (lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => {
                              soundEngine.playPickup();
                              setDifficulty(lvl);
                            }}
                            className={`min-h-[38px] px-2 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer whitespace-nowrap ${
                              difficulty === lvl
                                ? "bg-[var(--sys-color-surface-lowest)] text-[var(--sys-color-text-primary)] shadow-xs"
                                : "text-[var(--sys-color-text-secondary)] hover:text-[var(--sys-color-text-primary)]"
                            }`}
                          >
                            {lvl}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quiet Navigation Footer Link */}
            <div className="flex items-center justify-between px-1 text-xs text-[var(--sys-color-text-muted)]">
              <span className="hidden sm:inline">Keys 1–7 or ← → to play</span>
              <span className="sm:hidden">Tap any column to drop</span>
              <Link
                href="/"
                className="font-medium text-[var(--sys-color-text-secondary)] hover:text-[var(--sys-color-text-primary)] underline-offset-4 hover:underline"
              >
                Back to Hub
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
