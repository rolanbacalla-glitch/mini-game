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
  Bot,
  Check,
  Copy,
  Crown,
  Flame,
  HelpCircle,
  RotateCcw,
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
  applySingleStep,
  BOARD_SIZE,
  buildDraughtsShareCard,
  chooseDraughtsMove,
  cloneBoard,
  countPieces,
  createInitialBoard,
  evaluateOutcome,
  getLegalMoves,
  isPlayableSquare,
  type Coord,
  type DraughtsBoard,
  type DraughtsMove,
  type OpponentMode,
  type Piece,
  type Player,
} from "@/lib/draughts/engine";
import { formatShortBritishDate, getTodayKey } from "@/lib/games";
import {
  formatDuration,
  loadDraughtsStats,
  recordDraughtsDailyCompletion,
  recordDraughtsZenCompletion,
  type DraughtsStats,
} from "@/lib/storage";

type GameMode = "daily" | "zen";

interface TurnSnapshot {
  board: DraughtsBoard;
  currentPlayer: Player;
  quietPlies: number;
  turns: number;
  lastMoveFrom: Coord | null;
  lastMoveTo: Coord | null;
}

interface ActiveChain {
  /** Current position of the piece mid-chain */
  piecePos: Coord;
  /** Remaining legal complete moves from this point onward (stepIndex tracks next hop) */
  remainingMoves: DraughtsMove[];
  stepIndex: number;
  /** Snapshot taken before this human turn started so undo stays clean */
  turnStartSnapshot: TurnSnapshot;
}

const FILE_LABELS = ["a", "b", "c", "d", "e", "f", "g", "h"];

function DraughtsDisc({
  piece,
  isSelected,
  isMustCapture,
  isWinnerPiece,
  winOrder,
  layoutPrefix,
  size = "board",
  reducedMotion = false,
}: {
  piece: Piece;
  isSelected?: boolean;
  isMustCapture?: boolean;
  isWinnerPiece?: boolean;
  winOrder?: number;
  layoutPrefix?: number;
  size?: "board" | "badge";
  reducedMotion?: boolean;
}) {
  const isP1 = piece.player === 1;
  const animateWin = Boolean(isWinnerPiece && size === "board" && !reducedMotion);
  const cascadeDelay = 0.14 + (winOrder ?? 0) * 0.065;

  const sizeClass = size === "badge" ? "w-9 h-9" : "w-[82%] h-[82%]";

  return (
    <motion.div
      layoutId={
        size === "board" && !reducedMotion
          ? `${layoutPrefix ?? 0}-${piece.id}`
          : undefined
      }
      transition={{
        layout: {
          type: "spring",
          stiffness: 430,
          damping: 32,
          mass: 0.85,
        },
        duration: 0.45,
        delay: animateWin ? cascadeDelay : 0,
      }}
      animate={
        animateWin
          ? { scale: [1, 1.12, 1.03] }
          : isSelected
            ? { scale: 1.07, y: -2 }
            : { scale: 1, y: 0 }
      }
      className={`relative rounded-full flex items-center justify-center select-none pointer-events-none ${sizeClass} ${
        isP1
          ? "bg-[var(--sys-color-surface-lowest)] text-[var(--sys-color-text-primary)] border-2 border-[var(--sys-color-text-primary)] shadow-[inset_0_2px_0_var(--sys-specular-top),0_3px_6px_rgba(0,0,0,0.16)]"
          : "bg-[var(--sys-color-text-primary)] text-[var(--sys-color-surface-lowest)] border-2 border-[var(--sys-color-text-primary)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.28),0_3px_6px_rgba(0,0,0,0.18)]"
      } ${
        isSelected
          ? "ring-2 ring-offset-2 ring-[var(--sys-color-border-focus)] ring-offset-[var(--sys-color-surface-high)] z-20"
          : ""
      }`}
    >
      {/* Celebratory ripple halo on winning pieces */}
      {animateWin && (
        <motion.span
          aria-hidden="true"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: [0.85, 1.42], opacity: [0.7, 0] }}
          transition={{
            duration: 0.6,
            delay: cascadeDelay,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="pointer-events-none absolute -inset-1 rounded-full border-2 border-[var(--sys-color-text-primary)]"
        />
      )}

      {/* Subtle mandatory-capture collar indicator */}
      {isMustCapture && !isSelected && size === "board" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[4px] rounded-full border-2 border-dashed border-[var(--sys-color-text-primary)]/75"
        />
      )}

      {/* Player 1 smooth concentric wood-turn bevel */}
      {isP1 && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-full border border-[var(--sys-color-text-primary)]/20 ${
            size === "badge" ? "inset-[3px]" : "inset-[4px]"
          }`}
        />
      )}

      {/* Player 2 grooved dashed collar (non-colour tactile texture) */}
      {!isP1 && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-full border-dashed border-[var(--sys-color-surface-lowest)]/55 ${
            size === "badge" ? "inset-[3px] border" : "inset-[4px] border-[1.5px]"
          }`}
        />
      )}

      {/* Crown emblem for promoted Kings */}
      {piece.king ? (
        <motion.span
          initial={reducedMotion ? false : { scale: 0.5, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 20 }}
          className="relative z-10 flex items-center justify-center"
        >
          <Crown
            className={size === "badge" ? "w-4 h-4" : "w-[54%] h-[54%]"}
            strokeWidth={2.3}
            aria-hidden="true"
          />
        </motion.span>
      ) : (
        /* Subtle central tactile dimple for uncrowned men */
        <span
          aria-hidden="true"
          className={`rounded-full ${
            size === "badge" ? "w-2.5 h-2.5" : "w-[26%] h-[26%]"
          } ${
            isP1
              ? "border border-[var(--sys-color-text-primary)]/35 bg-[var(--sys-color-surface-low)]"
              : "border border-[var(--sys-color-surface-lowest)]/45 bg-transparent"
          }`}
        />
      )}
    </motion.div>
  );
}

export function DraughtsGame() {
  const searchParams = useSearchParams();
  const initialMode: GameMode =
    searchParams.get("mode") === "zen" ? "zen" : "daily";

  const [mode, setMode] = useState<GameMode>(initialMode);
  const [todayKey] = useState<string>(() => getTodayKey());

  const [opponentMode, setOpponentMode] = useState<OpponentMode>("bot");

  const [board, setBoard] = useState<DraughtsBoard>(() => createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [selectedSquare, setSelectedSquare] = useState<Coord | null>(null);
  const [activeChain, setActiveChain] = useState<ActiveChain | null>(null);

  const [lastMoveFrom, setLastMoveFrom] = useState<Coord | null>(null);
  const [lastMoveTo, setLastMoveTo] = useState<Coord | null>(null);
  const [quietPlies, setQuietPlies] = useState<number>(0);
  const [turns, setTurns] = useState<number>(0);
  const [undoStack, setUndoStack] = useState<TurnSnapshot[]>([]);

  const [botThinking, setBotThinking] = useState<boolean>(false);
  const [animatingBot, setAnimatingBot] = useState<boolean>(false);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [matchNonce, setMatchNonce] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [stats, setStats] = useState<DraughtsStats | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const recordedMatchRef = useRef<number>(0);
  const botTimersRef = useRef<number[]>([]);

  const activeOpponent: OpponentMode = mode === "daily" ? "bot" : opponentMode;

  const latestStateRef = useRef({
    board,
    quietPlies,
    turns,
    lastMoveFrom,
    lastMoveTo,
  });
  latestStateRef.current = {
    board,
    quietPlies,
    turns,
    lastMoveFrom,
    lastMoveTo,
  };

  const prefersReducedMotion = Boolean(useReducedMotion());

  const clearBotTimers = useCallback(() => {
    for (const id of botTimersRef.current) {
      window.clearTimeout(id);
    }
    botTimersRef.current = [];
  }, []);

  const outcome = useMemo(
    () =>
      activeChain
        ? { winner: null, reason: null }
        : evaluateOutcome(board, currentPlayer, quietPlies),
    [activeChain, board, currentPlayer, quietPlies]
  );
  const isFinished = outcome.winner !== null;

  const legalMoves = useMemo(() => {
    if (isFinished || animatingBot) return [];
    if (activeChain) return activeChain.remainingMoves;
    return getLegalMoves(board, currentPlayer);
  }, [activeChain, animatingBot, board, currentPlayer, isFinished]);

  const hasMandatoryCapture = useMemo(
    () => legalMoves.length > 0 && legalMoves[0].captured.length > 0,
    [legalMoves]
  );

  const movableOrigins = useMemo(() => {
    const set = new Set<string>();
    if (activeChain) {
      set.add(`${activeChain.piecePos.row},${activeChain.piecePos.col}`);
      return set;
    }
    for (const m of legalMoves) {
      set.add(`${m.from.row},${m.from.col}`);
    }
    return set;
  }, [activeChain, legalMoves]);

  // Valid next landing squares for the currently selected piece (step-by-step for chains)
  const validNextTargets = useMemo(() => {
    const map = new Map<
      string,
      {
        to: Coord;
        captured: Coord | null;
        matchingMoves: DraughtsMove[];
      }
    >();

    if (!selectedSquare) return map;
    const stepIdx = activeChain ? activeChain.stepIndex : 0;

    for (const move of legalMoves) {
      const originMatches = activeChain
        ? true
        : move.from.row === selectedSquare.row &&
          move.from.col === selectedSquare.col;
      if (!originMatches) continue;

      const stepDest = move.path[stepIdx];
      if (!stepDest) continue;
      const key = `${stepDest.row},${stepDest.col}`;
      const existing = map.get(key);
      if (existing) {
        existing.matchingMoves.push(move);
      } else {
        map.set(key, {
          to: stepDest,
          captured: move.captured[stepIdx] ?? null,
          matchingMoves: [move],
        });
      }
    }

    return map;
  }, [activeChain, legalMoves, selectedSquare]);

  const pieceCounts = useMemo(() => countPieces(board), [board]);
  const p1Total = pieceCounts.p1Men + pieceCounts.p1Kings;
  const p2Total = pieceCounts.p2Men + pieceCounts.p2Kings;
  const capturedByP1 = 12 - p2Total;
  const capturedByP2 = 12 - p1Total;

  // Ordered winning pieces for celebratory ripple wave
  const winnerPieceOrder = useMemo(() => {
    const map = new Map<string, number>();
    if (outcome.winner !== 1 && outcome.winner !== 2) return map;
    let idx = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = board[r][c];
        if (cell && cell.player === outcome.winner) {
          map.set(cell.id, idx++);
        }
      }
    }
    return map;
  }, [board, outcome.winner]);

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

  const resetBoard = useCallback(
    (playAudio = false) => {
      clearBotTimers();
      if (playAudio) soundEngine.playClear();
      setBoard(createInitialBoard());
      setCurrentPlayer(1);
      setSelectedSquare(null);
      setActiveChain(null);
      setLastMoveFrom(null);
      setLastMoveTo(null);
      setQuietPlies(0);
      setTurns(0);
      setUndoStack([]);
      setBotThinking(false);
      setAnimatingBot(false);
      setElapsedSeconds(0);
      setCopied(false);
      setMatchNonce((n) => n + 1);
    },
    [clearBotTimers]
  );

  useEffect(() => {
    setStats(loadDraughtsStats());
    return () => clearBotTimers();
  }, [clearBotTimers]);

  useEffect(() => {
    resetBoard(false);
  }, [mode, resetBoard]);

  // Gentle elapsed timer (pauses once finished)
  useEffect(() => {
    if (isFinished) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isFinished, matchNonce]);

  // Persist stats & play victory chime when match finishes
  useEffect(() => {
    if (!isFinished || recordedMatchRef.current === matchNonce) return;
    recordedMatchRef.current = matchNonce;

    if (
      outcome.winner === 1 ||
      (activeOpponent === "local" && outcome.winner === 2)
    ) {
      soundEngine.playComplete();
    } else if (outcome.winner === "draw") {
      soundEngine.playLatch();
    }

    if (mode === "daily") {
      if (outcome.winner === 1 || outcome.winner === "draw") {
        const resultType = outcome.winner === 1 ? "win" : "draw";
        const outcomeLabel =
          resultType === "win" ? "Won the board" : "Honourable draw";
        const shareText = buildDraughtsShareCard({
          dateLabel: formatShortBritishDate(todayKey),
          outcomeLabel,
          turns,
          capturedByP1,
          capturedByP2,
          durationLabel: formatDuration(elapsedSeconds),
        });

        const updated = recordDraughtsDailyCompletion({
          dateKey: todayKey,
          outcome: resultType,
          turns,
          elapsedSeconds,
          shareText,
          completedAt: new Date().toISOString(),
        });
        setStats(updated);
        pushToast(
          resultType === "win" ? "Daily Draughts won" : "Daily Draughts drawn",
          `${turns} turns · ${formatDuration(elapsedSeconds)}.`,
          "success"
        );
      }
    } else {
      const updated = recordDraughtsZenCompletion();
      setStats(updated);
    }
  }, [
    activeOpponent,
    capturedByP1,
    capturedByP2,
    elapsedSeconds,
    isFinished,
    matchNonce,
    mode,
    outcome.winner,
    pushToast,
    todayKey,
    turns,
  ]);

  // Execute Bot turn with smooth step-by-step animation for multi-jump chains.
  // Reads latest board state via ref so stepping through hops does not re-run cleanup.
  useEffect(() => {
    if (activeOpponent !== "bot" || currentPlayer !== 2 || isFinished) {
      return;
    }

    let cancelled = false;
    setBotThinking(true);

    const thinkTimer = window.setTimeout(() => {
      if (cancelled) return;

      const snapshot = latestStateRef.current;
      const chosen = chooseDraughtsMove(snapshot.board, 2, "advanced");
      setBotThinking(false);

      if (cancelled || !chosen) return;

      const snapshotBeforeBot: TurnSnapshot = {
        board: cloneBoard(snapshot.board),
        currentPlayer: 2,
        quietPlies: snapshot.quietPlies,
        turns: snapshot.turns,
        lastMoveFrom: snapshot.lastMoveFrom,
        lastMoveTo: snapshot.lastMoveTo,
      };

      const movingPiece = snapshot.board[chosen.from.row][chosen.from.col];
      const wasKing = Boolean(movingPiece?.king);
      const isProgressMove = chosen.captured.length > 0 || !wasKing;

      setAnimatingBot(true);
      setSelectedSquare(null);
      setUndoStack((prev) => [...prev, snapshotBeforeBot]);

      // Step through each hop cleanly so player sees multi-captures unfold
      let runningBoard = cloneBoard(snapshot.board);
      let prevCoord = chosen.from;

      chosen.path.forEach((dest, stepIdx) => {
        const cap = chosen.captured[stepIdx] ?? null;
        const stepFrom = prevCoord;
        const stepResult = applySingleStep(runningBoard, stepFrom, dest, cap);
        runningBoard = stepResult.board;
        const boardSnapshotForStep = cloneBoard(runningBoard);
        const promotedOnStep = stepResult.promoted;
        prevCoord = dest;

        const isLastStep = stepIdx === chosen.path.length - 1;
        const stepTimer = window.setTimeout(() => {
          if (cancelled) return;

          setBoard(boardSnapshotForStep);
          setLastMoveFrom(stepIdx === 0 ? chosen.from : stepFrom);
          setLastMoveTo(dest);

          if (promotedOnStep) {
            soundEngine.playLatch();
          } else if (cap) {
            soundEngine.playTokenDrop(4);
          } else {
            soundEngine.playSnap();
          }

          if (isLastStep) {
            setTurns((t) => t + 1);
            setQuietPlies((q) => (isProgressMove ? 0 : q + 1));
            setCurrentPlayer(1);
            setAnimatingBot(false);
          }
        }, stepIdx * 280);

        botTimersRef.current.push(stepTimer);
      });
    }, 340);

    botTimersRef.current.push(thinkTimer);

    return () => {
      cancelled = true;
      clearBotTimers();
      setBotThinking(false);
      setAnimatingBot(false);
    };
  }, [activeOpponent, clearBotTimers, currentPlayer, isFinished, matchNonce]);

  const canHumanInteract =
    !isFinished &&
    !botThinking &&
    !animatingBot &&
    (activeOpponent === "local" || currentPlayer === 1);

  const handleSquareClick = (row: number, col: number) => {
    if (!canHumanInteract || !isPlayableSquare(row, col)) return;

    const targetKey = `${row},${col}`;
    const targetOption = validNextTargets.get(targetKey);

    // 1. Clicking a highlighted destination executes the slide or jump hop
    if (selectedSquare && targetOption) {
      const turnSnapshot: TurnSnapshot = activeChain
        ? activeChain.turnStartSnapshot
        : {
            board: cloneBoard(board),
            currentPlayer,
            quietPlies,
            turns,
            lastMoveFrom,
            lastMoveTo,
          };

      const movingPiece = board[selectedSquare.row][selectedSquare.col];
      const wasKing = Boolean(movingPiece?.king);
      const { board: nextBoard, promoted } = applySingleStep(
        board,
        selectedSquare,
        targetOption.to,
        targetOption.captured
      );

      if (promoted) {
        soundEngine.playLatch();
      } else if (targetOption.captured) {
        soundEngine.playTokenDrop(4);
      } else {
        soundEngine.playSnap();
      }

      setBoard(nextBoard);
      setLastMoveFrom(selectedSquare);
      setLastMoveTo(targetOption.to);

      const nextStepIdx = (activeChain ? activeChain.stepIndex : 0) + 1;
      const continuingMoves = targetOption.matchingMoves.filter(
        (m) => m.path.length > nextStepIdx
      );

      if (continuingMoves.length > 0) {
        // Multi-jump chain continues with the same piece locked in
        setSelectedSquare(targetOption.to);
        setActiveChain({
          piecePos: targetOption.to,
          remainingMoves: continuingMoves,
          stepIndex: nextStepIdx,
          turnStartSnapshot: turnSnapshot,
        });
      } else {
        // Complete turn
        const isProgress = Boolean(targetOption.captured) || !wasKing;
        setUndoStack((prev) => [...prev, turnSnapshot]);
        setSelectedSquare(null);
        setActiveChain(null);
        setTurns((t) => t + 1);
        setQuietPlies((q) => (isProgress ? 0 : q + 1));
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      }
      return;
    }

    // Mid-chain: keep the jumping piece locked until chain completes
    if (activeChain) {
      soundEngine.playInvalid();
      return;
    }

    // 2. Selecting / deselecting one of the current player's movable pieces
    const clickedPiece = board[row][col];
    if (clickedPiece && clickedPiece.player === currentPlayer) {
      if (
        selectedSquare &&
        selectedSquare.row === row &&
        selectedSquare.col === col
      ) {
        setSelectedSquare(null);
        return;
      }

      if (!movableOrigins.has(targetKey)) {
        soundEngine.playInvalid();
        if (hasMandatoryCapture) {
          pushToast(
            "Forced capture",
            "In Draughts, you must take an available jump.",
            "info"
          );
        }
        return;
      }

      soundEngine.playPickup();
      setSelectedSquare({ row, col });
      return;
    }

    // Clicking an empty non-target square clears selection
    if (selectedSquare) {
      setSelectedSquare(null);
    }
  };

  const handleUndo = () => {
    if (botThinking || animatingBot) return;

    // If mid-chain, revert straight back to the start of this turn
    if (activeChain) {
      const snap = activeChain.turnStartSnapshot;
      soundEngine.playPickup();
      setBoard(snap.board);
      setCurrentPlayer(snap.currentPlayer);
      setQuietPlies(snap.quietPlies);
      setTurns(snap.turns);
      setLastMoveFrom(snap.lastMoveFrom);
      setLastMoveTo(snap.lastMoveTo);
      setSelectedSquare(null);
      setActiveChain(null);
      return;
    }

    if (undoStack.length === 0) return;

    // In bot mode, unwind back to Player 1's most recent turn
    let targetIdx = undoStack.length - 1;
    if (activeOpponent === "bot") {
      while (targetIdx > 0 && undoStack[targetIdx].currentPlayer === 2) {
        targetIdx--;
      }
    }

    const snap = undoStack[targetIdx];
    soundEngine.playPickup();
    setBoard(snap.board);
    setCurrentPlayer(snap.currentPlayer);
    setQuietPlies(snap.quietPlies);
    setTurns(snap.turns);
    setLastMoveFrom(snap.lastMoveFrom);
    setLastMoveTo(snap.lastMoveTo);
    setUndoStack(undoStack.slice(0, targetIdx));
    setSelectedSquare(null);
    setActiveChain(null);
  };

  const outcomeTitle = useMemo(() => {
    if (outcome.winner === "draw") return "Match drawn (40-move rule).";
    if (outcome.winner === 1) {
      return activeOpponent === "bot" ? "You won the board." : "Player 1 wins!";
    }
    if (outcome.winner === 2) {
      return activeOpponent === "bot" ? "Draughts Bot wins." : "Player 2 wins!";
    }
    return "";
  }, [activeOpponent, outcome.winner]);

  const outcomeDetail = useMemo(() => {
    if (outcome.reason === "captured-all") return "All opposing pieces cleared";
    if (outcome.reason === "no-moves") return "Opponent trapped with no legal moves";
    if (outcome.reason === "draw-rule") return "40 moves without capture or advance";
    return "";
  }, [outcome.reason]);

  const handleCopyShare = async () => {
    const shareText = buildDraughtsShareCard({
      dateLabel:
        mode === "daily" ? formatShortBritishDate(todayKey) : "Free Play",
      outcomeLabel: outcomeTitle.replace(/\.$/, ""),
      turns,
      capturedByP1,
      capturedByP2,
      durationLabel:
        mode === "daily" ? formatDuration(elapsedSeconds) : "Untimed",
    });

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      soundEngine.playPickup();
      pushToast("Summary copied", "Ready to paste your match result.", "success");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      pushToast("Copy unavailable", "Clipboard access was blocked.", "warning");
    }
  };

  const p1Label = activeOpponent === "bot" ? "You" : "Player 1";
  const p2Label = activeOpponent === "bot" ? "Draughts Bot" : "Player 2";

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar backHref="/" title="Draughts" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-16">
        {/* Top Mode Switcher & Clean Unboxed Metadata */}
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
                  aria-label="How to play Draughts"
                  className="w-10 px-0 shrink-0"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>How to play Draughts</DialogTitle>
                <DialogDescription>
                  Classic English Draughts with forced captures and crowned kings.
                </DialogDescription>
                <ul className="mt-4 space-y-2.5 text-sm text-[var(--sys-color-text-secondary)] list-disc pl-5">
                  <li>
                    <strong>Diagonal movement:</strong> Smooth ivory discs move
                    diagonally forward on the shaded squares; grooved charcoal
                    discs move down from the top.
                  </li>
                  <li>
                    <strong>Forced captures:</strong> If a jump is available, you
                    must take it. Multi-jump chains continue automatically until
                    no more jumps remain.
                  </li>
                  <li>
                    <strong>Crowned Kings:</strong> Reaching the far back row
                    crowns a piece with a Crown icon, allowing diagonal moves
                    and captures both forward and backward.
                  </li>
                  <li>
                    <strong>Winning:</strong> Capture all opposing discs or trap
                    your opponent with no legal moves remaining.
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
          {/* Focal Anchor: Tactile 8x8 Draughts Board */}
          <section
            aria-label="Draughts 8 by 8 board"
            className="flex flex-col items-center w-full"
          >
            {/* Quiet Contextual Turn Prompt */}
            <div className="w-full max-w-[540px] flex items-center justify-between mb-2.5 px-1 text-xs text-[var(--sys-color-text-secondary)]">
              <span className="font-medium text-[var(--sys-color-text-primary)]">
                {isFinished
                  ? outcomeTitle
                  : botThinking || animatingBot
                    ? "Draughts Bot is thinking…"
                    : activeChain
                      ? "Multi-jump active — tap the next highlighted square"
                      : hasMandatoryCapture
                        ? "Forced capture — choose a highlighted piece to jump"
                        : `${currentPlayer === 1 ? p1Label : p2Label}'s turn`}
              </span>
              <span className="font-mono tabular-nums text-[var(--sys-color-text-muted)]">
                Turn {turns + 1}
              </span>
            </div>

            <div
              className="w-full max-w-[540px] game-touch-surface"
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Architectural Matte Board Frame */}
              <div className="rounded-[20px] sm:rounded-[24px] bg-[var(--sys-color-surface-container)] border border-[var(--sys-color-border-subtle)] p-2 sm:p-3.5 shadow-[0_14px_34px_-18px_rgba(0,0,0,0.22)]">
                <div className="grid grid-cols-8 grid-rows-8 aspect-square w-full overflow-hidden rounded-[12px] sm:rounded-[14px] border border-[var(--sys-color-border-subtle)]">
                  {Array.from({ length: BOARD_SIZE }).map((_, row) =>
                    Array.from({ length: BOARD_SIZE }).map((__, col) => {
                      const playable = isPlayableSquare(row, col);
                      const cell = board[row][col];
                      const sqKey = `${row},${col}`;

                      const isSelected =
                        selectedSquare !== null &&
                        selectedSquare.row === row &&
                        selectedSquare.col === col;

                      const targetOption = validNextTargets.get(sqKey);
                      const isTarget = Boolean(targetOption);
                      const isCaptureTarget = Boolean(targetOption?.captured);

                      const isMustCapturePiece =
                        canHumanInteract &&
                        hasMandatoryCapture &&
                        movableOrigins.has(sqKey) &&
                        cell?.player === currentPlayer;

                      const isLastSquare =
                        (lastMoveFrom?.row === row && lastMoveFrom?.col === col) ||
                        (lastMoveTo?.row === row && lastMoveTo?.col === col);

                      const winOrder = cell
                        ? winnerPieceOrder.get(cell.id)
                        : undefined;
                      const isWinnerPiece = winOrder !== undefined;

                      const canClick =
                        canHumanInteract &&
                        playable &&
                        (isTarget ||
                          (cell !== null && cell.player === currentPlayer));

                      const coordLabel = `${FILE_LABELS[col]}${BOARD_SIZE - row}`;

                      return (
                        <button
                          key={sqKey}
                          type="button"
                          draggable={false}
                          disabled={!playable || !canHumanInteract}
                          onContextMenu={(e) => e.preventDefault()}
                          onClick={() => handleSquareClick(row, col)}
                          aria-label={`Square ${coordLabel}${
                            cell
                              ? `, ${cell.player === 1 ? p1Label : p2Label} ${
                                  cell.king ? "King" : "disc"
                                }`
                              : ""
                          }${
                            isCaptureTarget
                              ? ", jump capture destination"
                              : isTarget
                                ? ", legal move destination"
                                : ""
                          }`}
                          className={`relative aspect-square flex items-center justify-center transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--sys-color-border-focus)] ${
                            playable
                              ? isLastSquare
                                ? "bg-[var(--sys-color-bg-surface-active)]"
                                : "bg-[var(--sys-color-surface-high)]"
                              : "bg-[var(--sys-color-surface-lowest)]"
                          } ${canClick ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {/* Subtle edge rank/file labels on desktop */}
                          {col === 0 && (
                            <span
                              aria-hidden="true"
                              className="hidden sm:block pointer-events-none absolute top-0.5 left-1 font-mono text-[9px] leading-none text-[var(--sys-color-text-muted)]/70"
                            >
                              {BOARD_SIZE - row}
                            </span>
                          )}
                          {row === BOARD_SIZE - 1 && (
                            <span
                              aria-hidden="true"
                              className="hidden sm:block pointer-events-none absolute bottom-0.5 right-1 font-mono text-[9px] leading-none text-[var(--sys-color-text-muted)]/70"
                            >
                              {FILE_LABELS[col]}
                            </span>
                          )}

                          {/* Legal Destination Indicator (Non-colour geometric target) */}
                          {isTarget && !cell && (
                            <motion.span
                              initial={prefersReducedMotion ? false : { scale: 0.6, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.14 }}
                              aria-hidden="true"
                              className={`pointer-events-none rounded-full flex items-center justify-center ${
                                isCaptureTarget
                                  ? "w-[58%] h-[58%] border-2 border-[var(--sys-color-text-primary)] bg-[var(--sys-color-surface-lowest)]/75"
                                  : "w-[36%] h-[36%] border-2 border-dashed border-[var(--sys-color-text-primary)]/70 bg-[var(--sys-color-surface-lowest)]/60"
                              }`}
                            >
                              {isCaptureTarget && (
                                <span className="w-[38%] h-[38%] rounded-full bg-[var(--sys-color-text-primary)]" />
                              )}
                            </motion.span>
                          )}

                          {/* Tactile Monochrome Draughts Disc */}
                          {cell && (
                            <DraughtsDisc
                              piece={cell}
                              isSelected={isSelected}
                              isMustCapture={isMustCapturePiece}
                              isWinnerPiece={isWinnerPiece}
                              winOrder={winOrder}
                              layoutPrefix={matchNonce}
                              reducedMotion={prefersReducedMotion}
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Post-Match Outcome Strip */}
            <AnimatePresence>
              {isFinished && (
                <motion.section
                  key="draughts-summary"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.01 : 0.28,
                    delay: prefersReducedMotion ? 0 : 0.32,
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
                        duration: prefersReducedMotion ? 0.01 : 0.4,
                        delay: prefersReducedMotion ? 0 : 0.38,
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
                        {outcomeDetail} ·{" "}
                        <span className="font-mono tabular-nums">{turns}</span>{" "}
                        turns ·{" "}
                        <span className="font-mono tabular-nums">
                          {formatDuration(elapsedSeconds)}
                        </span>
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
                          <span>Copy result</span>
                        </>
                      )}
                    </Button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </section>

          {/* Side Rail: Match Ledger & Controls */}
          <aside
            aria-label="Draughts match ledger and controls"
            className="w-full space-y-5 game-touch-surface"
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Player Ledger */}
            <div className="tonal-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-sm font-semibold text-[var(--sys-color-text-primary)]">
                  Match ledger
                </h1>
                <span className="text-xs font-mono tabular-nums text-[var(--sys-color-text-muted)]">
                  {p1Total + p2Total} on board
                </span>
              </div>

              <div className="space-y-2">
                {/* Player 1 */}
                <div
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-colors ${
                    !isFinished && currentPlayer === 1
                      ? "bg-[var(--sys-color-surface-low)] border-[var(--sys-color-text-primary)]"
                      : "bg-transparent border-[var(--sys-color-border-subtle)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <DraughtsDisc
                      piece={{ id: "legend-p1", player: 1, king: pieceCounts.p1Kings > 0 }}
                      size="badge"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--sys-color-text-primary)] truncate">
                        {p1Label} · Ivory
                      </div>
                      <div className="text-xs text-[var(--sys-color-text-muted)] font-mono tabular-nums">
                        {p1Total} left
                        {pieceCounts.p1Kings > 0
                          ? ` · ${pieceCounts.p1Kings} king${pieceCounts.p1Kings > 1 ? "s" : ""}`
                          : ""}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[var(--sys-color-text-secondary)] shrink-0">
                    +{capturedByP1}
                  </span>
                </div>

                {/* Player 2 */}
                <div
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-colors ${
                    !isFinished && currentPlayer === 2
                      ? "bg-[var(--sys-color-surface-low)] border-[var(--sys-color-text-primary)]"
                      : "bg-transparent border-[var(--sys-color-border-subtle)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <DraughtsDisc
                      piece={{ id: "legend-p2", player: 2, king: pieceCounts.p2Kings > 0 }}
                      size="badge"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--sys-color-text-primary)] truncate">
                        {p2Label} · Charcoal
                      </div>
                      <div className="text-xs text-[var(--sys-color-text-muted)]">
                        {botThinking || animatingBot ? (
                          "Thinking…"
                        ) : (
                          <span className="font-mono tabular-nums">
                            {p2Total} left
                            {pieceCounts.p2Kings > 0
                              ? ` · ${pieceCounts.p2Kings} king${pieceCounts.p2Kings > 1 ? "s" : ""}`
                              : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[var(--sys-color-text-secondary)] shrink-0">
                    +{capturedByP2}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[var(--sys-color-border-subtle)] flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUndo}
                  disabled={
                    (undoStack.length === 0 && !activeChain) ||
                    botThinking ||
                    animatingBot
                  }
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

            {/* Free Play Settings */}
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
              </div>
            )}

            {/* Quiet Rules Reminder */}
            <div className="tonal-card p-4 text-xs text-[var(--sys-color-text-secondary)] space-y-1.5 leading-relaxed">
              <div className="font-semibold text-[var(--sys-color-text-primary)]">
                English Draughts rules
              </div>
              <p>
                Captures are mandatory. Reach the back rank to crown a{" "}
                <strong className="font-medium text-[var(--sys-color-text-primary)]">
                  King
                </strong>{" "}
                that moves in all four diagonal directions.
              </p>
            </div>

            {/* Quiet Footer Navigation */}
            <div className="flex items-center justify-between px-1 text-xs text-[var(--sys-color-text-muted)]">
              <span>Tap a disc, then a target</span>
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
