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
  ArrowUpDown,
  Cat,
  Check,
  Copy,
  Flame,
  Ghost,
  HelpCircle,
  RotateCcw,
  Squirrel,
  Trophy,
  Turtle,
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
  applyChessMove,
  BOARD_SIZE,
  buildChessShareCard,
  CHESS_CHARACTERS,
  chooseChessMove,
  cloneState,
  computeCapturedAndMaterial,
  createInitialChessState,
  evaluateChessOutcome,
  getChessCharacterById,
  getLegalChessMoves,
  getPositionKey,
  isDarkSquare,
  isInCheck,
  PIECE_GLYPHS,
  PIECE_NAMES,
  type ChessCharacter,
  type ChessCharacterId,
  type ChessMove,
  type ChessPiece,
  type ChessPlayer,
  type ChessState,
  type Coord,
  type OpponentMode,
  type PromotionType,
} from "@/lib/chess/engine";
import { formatShortBritishDate, getTodayKey } from "@/lib/games";
import {
  formatDuration,
  loadChessStats,
  recordChessDailyCompletion,
  recordChessZenCompletion,
  type ChessStats,
} from "@/lib/storage";

type GameMode = "daily" | "zen" | "2p";

interface TurnSnapshot {
  state: ChessState;
  lastMoveFrom: Coord | null;
  lastMoveTo: Coord | null;
  turns: number;
  positionCounts: Record<string, number>;
}

interface PendingPromotion {
  from: Coord;
  to: Coord;
  options: ChessMove[];
}

const FILE_LABELS = ["a", "b", "c", "d", "e", "f", "g", "h"];
const PROMOTION_ORDER: PromotionType[] = ["q", "r", "b", "n"];

function CharacterIcon({
  iconKey,
  className,
  strokeWidth = 2.2,
}: {
  iconKey: ChessCharacter["iconKey"];
  className?: string;
  strokeWidth?: number;
}) {
  switch (iconKey) {
    case "ghost":
      return <Ghost className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
    case "cat":
      return <Cat className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
    case "squirrel":
      return <Squirrel className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
    case "turtle":
      return <Turtle className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
}

/**
 * Tactile Monochrome Chess Piece Token — mirrors the Draughts Ivory & Grooved Charcoal
 * disc language so players immediately feel the exact theme familiarity.
 */
function ChessToken({
  piece,
  isSelected,
  isInCheckKing,
  isWinnerPiece,
  winOrder,
  size = "board",
  reducedMotion = false,
}: {
  piece: ChessPiece;
  isSelected?: boolean;
  isInCheckKing?: boolean;
  isWinnerPiece?: boolean;
  winOrder?: number;
  size?: "board" | "badge";
  reducedMotion?: boolean;
}) {
  const isP1 = piece.player === 1;
  const animateWin = Boolean(isWinnerPiece && size === "board" && !reducedMotion);
  const cascadeDelay = 0.14 + (winOrder ?? 0) * 0.055;

  const sizeClass = size === "badge" ? "w-9 h-9" : "w-[84%] h-[84%]";
  const glyphSizeClass =
    size === "badge"
      ? "text-[20px]"
      : piece.type === "p"
        ? "text-[20px] sm:text-[26px]"
        : "text-[23px] sm:text-[30px]";

  return (
    <motion.div
      transition={
        reducedMotion
          ? { duration: 0.01 }
          : {
              type: "spring",
              stiffness: 380,
              damping: 26,
              delay: animateWin ? cascadeDelay : 0,
            }
      }
      animate={
        animateWin
          ? { scale: [1, 1.12, 1.03] }
          : isSelected
            ? { scale: 1.08, y: -3 }
            : { scale: 1, y: 0 }
      }
      className={`relative rounded-full flex items-center justify-center select-none pointer-events-none ${sizeClass} ${
        isP1
          ? "bg-[var(--piece-white-bg)] text-[var(--piece-white-fg)] border-2 border-[var(--piece-white-border)] shadow-[inset_0_2px_0_rgba(255,255,255,0.85),0_3px_6px_rgba(0,0,0,0.22)]"
          : "bg-[var(--piece-black-bg)] text-[var(--piece-black-fg)] border-2 border-[var(--piece-black-border)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.38),0_3px_6px_rgba(0,0,0,0.28)]"
      } ${
        isSelected
          ? "ring-2 ring-offset-2 ring-[var(--sys-color-border-focus)] ring-offset-[var(--board-square-dark)] shadow-[0_10px_20px_-6px_rgba(0,0,0,0.34)]"
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

      {/* Subtle tactile double-ring warning collar when King is in check */}
      {isInCheckKing && size === "board" && (
        <motion.span
          aria-hidden="true"
          animate={
            reducedMotion
              ? { opacity: 0.9 }
              : { scale: [1, 1.1, 1], opacity: [0.65, 1, 0.65] }
          }
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -inset-[5px] rounded-full border-2 border-dashed border-[var(--sys-color-text-primary)]"
        />
      )}

      {/* White piece smooth concentric wood-turn bevel */}
      {isP1 && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-full border border-[var(--piece-white-inner)] ${
            size === "badge" ? "inset-[3px]" : "inset-[3px] sm:inset-[4px]"
          }`}
        />
      )}

      {/* Black piece grooved dashed collar (non-colour tactile texture) */}
      {!isP1 && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-full border-dashed border-[var(--piece-black-inner)] ${
            size === "badge"
              ? "inset-[3px] border"
              : "inset-[3px] sm:inset-[4px] border-[1.5px]"
          }`}
        />
      )}

      {/* Crisp Monochrome Staunton Chess Piece Glyph */}
      <span
        aria-hidden="true"
        className={`relative z-10 leading-none font-normal translate-y-[0.5px] ${glyphSizeClass}`}
      >
        {PIECE_GLYPHS[piece.type]}
      </span>
    </motion.div>
  );
}

export function ChessGame() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const initialMode: GameMode =
    modeParam === "2p" ? "2p" : modeParam === "zen" ? "zen" : "daily";

  const [mode, setMode] = useState<GameMode>(initialMode);
  const [todayKey] = useState<string>(() => getTodayKey());

  // Fun character opponent selector — defaults to Pip (strongest hidden engine)
  const [characterId, setCharacterId] = useState<ChessCharacterId>("ghost");
  const activeCharacter = useMemo(
    () => getChessCharacterById(characterId),
    [characterId]
  );

  const [chessState, setChessState] = useState<ChessState>(() =>
    createInitialChessState()
  );
  const [positionCounts, setPositionCounts] = useState<Record<string, number>>(
    () => {
      const init = createInitialChessState();
      return { [getPositionKey(init)]: 1 };
    }
  );
  const [selectedSquare, setSelectedSquare] = useState<Coord | null>(null);
  const [pendingPromotion, setPendingPromotion] =
    useState<PendingPromotion | null>(null);

  const [lastMoveFrom, setLastMoveFrom] = useState<Coord | null>(null);
  const [lastMoveTo, setLastMoveTo] = useState<Coord | null>(null);
  const [movingPieceIds, setMovingPieceIds] = useState<string[]>([]);
  const [turns, setTurns] = useState<number>(0);
  const [undoStack, setUndoStack] = useState<TurnSnapshot[]>([]);

  // White (1 / Ivory) always moves first. Player chooses whether to move first (White) or second (Black).
  const [humanSide, setHumanSide] = useState<ChessPlayer>(1);
  // In 2-Player mode, choose whether Player 1 or Player 2 moves first as White (Ivory).
  const [whiteOwnerIn2P, setWhiteOwnerIn2P] = useState<1 | 2>(1);

  const [botThinking, setBotThinking] = useState<boolean>(false);
  const [manualFlipped, setManualFlipped] = useState<boolean>(false);
  const [autoFlip, setAutoFlip] = useState<boolean>(false);
  const [twoPlayerScore, setTwoPlayerScore] = useState<{
    p1: number;
    p2: number;
    draws: number;
  }>({ p1: 0, p2: 0, draws: 0 });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [matchNonce, setMatchNonce] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [stats, setStats] = useState<ChessStats | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const recordedMatchRef = useRef<number>(0);

  const activeOpponent: OpponentMode = mode === "2p" ? "local" : "bot";
  const botSide: ChessPlayer = humanSide === 1 ? 2 : 1;
  const currentPlayer = chessState.turn;
  const isBoardFlipped =
    mode === "2p"
      ? autoFlip
        ? currentPlayer === 2
        : manualFlipped
      : humanSide === 2;

  const latestStateRef = useRef({
    chessState,
    lastMoveFrom,
    lastMoveTo,
    turns,
    positionCounts,
    characterId,
  });
  latestStateRef.current = {
    chessState,
    lastMoveFrom,
    lastMoveTo,
    turns,
    positionCounts,
    characterId,
  };

  const prefersReducedMotion = Boolean(useReducedMotion());

  const currentRepetition = useMemo(() => {
    const key = getPositionKey(chessState);
    return positionCounts[key] ?? 1;
  }, [chessState, positionCounts]);

  const outcome = useMemo(
    () => evaluateChessOutcome(chessState, currentRepetition),
    [chessState, currentRepetition]
  );
  const isFinished = outcome.winner !== null;

  const kingInCheck = useMemo(
    () => !isFinished && isInCheck(chessState.board, currentPlayer),
    [chessState.board, currentPlayer, isFinished]
  );

  const legalMoves = useMemo(() => {
    if (isFinished) return [];
    return getLegalChessMoves(chessState);
  }, [chessState, isFinished]);

  // Valid target squares for the currently selected piece
  const validTargets = useMemo(() => {
    const map = new Map<string, ChessMove[]>();
    if (!selectedSquare) return map;
    for (const m of legalMoves) {
      if (
        m.from.row === selectedSquare.row &&
        m.from.col === selectedSquare.col
      ) {
        const key = `${m.to.row},${m.to.col}`;
        const existing = map.get(key);
        if (existing) existing.push(m);
        else map.set(key, [m]);
      }
    }
    return map;
  }, [legalMoves, selectedSquare]);

  const movableOrigins = useMemo(() => {
    const set = new Set<string>();
    for (const m of legalMoves) {
      set.add(`${m.from.row},${m.from.col}`);
    }
    return set;
  }, [legalMoves]);

  const materialInfo = useMemo(
    () => computeCapturedAndMaterial(chessState.board),
    [chessState.board]
  );

  // Ordered winning pieces for celebratory ripple wave on checkmate
  const winnerPieceOrder = useMemo(() => {
    const map = new Map<string, number>();
    if (outcome.winner !== 1 && outcome.winner !== 2) return map;
    let idx = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = chessState.board[r][c];
        if (cell && cell.player === outcome.winner) {
          map.set(cell.id, idx++);
        }
      }
    }
    return map;
  }, [chessState.board, outcome.winner]);

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
    const fresh = createInitialChessState();
    setChessState(fresh);
    setPositionCounts({ [getPositionKey(fresh)]: 1 });
    setSelectedSquare(null);
    setPendingPromotion(null);
    setLastMoveFrom(null);
    setLastMoveTo(null);
    setMovingPieceIds([]);
    setTurns(0);
    setUndoStack([]);
    setBotThinking(false);
    setElapsedSeconds(0);
    setCopied(false);
    setMatchNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    setStats(loadChessStats());
  }, []);

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

  const commitMove = useCallback(
    (move: ChessMove, snapshotSource?: TurnSnapshot) => {
      const snap: TurnSnapshot = snapshotSource ?? {
        state: cloneState(latestStateRef.current.chessState),
        lastMoveFrom: latestStateRef.current.lastMoveFrom,
        lastMoveTo: latestStateRef.current.lastMoveTo,
        turns: latestStateRef.current.turns,
        positionCounts: { ...latestStateRef.current.positionCounts },
      };

      const nextState = applyChessMove(snap.state, move);
      const nextKey = getPositionKey(nextState);
      const nextCounts = {
        ...snap.positionCounts,
        [nextKey]: (snap.positionCounts[nextKey] ?? 0) + 1,
      };

      const givesCheck = isInCheck(nextState.board, nextState.turn);

      if (move.promotion || move.isCastle) {
        soundEngine.playLatch();
      } else if (move.captured) {
        soundEngine.playTokenDrop(4);
      } else if (givesCheck) {
        soundEngine.playLatch();
      } else {
        soundEngine.playSnap();
      }

      const movedIds: string[] = [];
      const movedPiece = nextState.board[move.to.row][move.to.col];
      if (movedPiece) movedIds.push(movedPiece.id);
      if (move.isCastle) {
        const rookCol = move.isCastle === "kingside" ? 5 : 3;
        const rookPiece = nextState.board[move.to.row][rookCol];
        if (rookPiece) movedIds.push(rookPiece.id);
      }

      setUndoStack((prev) => [...prev, snap]);
      setChessState(nextState);
      setPositionCounts(nextCounts);
      setLastMoveFrom(move.from);
      setLastMoveTo(move.to);
      setMovingPieceIds(movedIds);
      setTurns(snap.turns + 1);
      setSelectedSquare(null);
      setPendingPromotion(null);
    },
    []
  );

  // Persist stats & play victory chime when match finishes
  useEffect(() => {
    if (!isFinished || recordedMatchRef.current === matchNonce) return;
    recordedMatchRef.current = matchNonce;

    const humanWon =
      activeOpponent === "bot"
        ? outcome.winner === humanSide
        : outcome.winner === 1 || outcome.winner === 2;

    if (humanWon) {
      soundEngine.playComplete();
    } else if (outcome.winner === "draw") {
      soundEngine.playLatch();
    }

    if (mode === "daily") {
      if (outcome.winner === humanSide || outcome.winner === "draw") {
        const resultType = outcome.winner === humanSide ? "win" : "draw";
        const outcomeLabel =
          resultType === "win"
            ? `Checkmated ${activeCharacter.name} as ${humanSide === 1 ? "White" : "Black"}`
            : "Honourable draw";
        const shareText = buildChessShareCard({
          dateLabel: formatShortBritishDate(todayKey),
          outcomeLabel,
          moves: turns,
          capturedByWhite: materialInfo.capturedByWhite.length,
          capturedByBlack: materialInfo.capturedByBlack.length,
          durationLabel: formatDuration(elapsedSeconds),
        });

        const updated = recordChessDailyCompletion({
          dateKey: todayKey,
          outcome: resultType,
          moves: turns,
          elapsedSeconds,
          shareText,
          completedAt: new Date().toISOString(),
        });
        setStats(updated);
        pushToast(
          resultType === "win" ? "Daily Chess won" : "Daily Chess drawn",
          `${turns} moves · ${formatDuration(elapsedSeconds)}.`,
          "success"
        );
      }
    } else if (mode === "2p") {
      const winningHuman =
        outcome.winner === 1
          ? whiteOwnerIn2P
          : outcome.winner === 2
            ? whiteOwnerIn2P === 1
              ? 2
              : 1
            : null;
      setTwoPlayerScore((prev) => ({
        p1: prev.p1 + (winningHuman === 1 ? 1 : 0),
        p2: prev.p2 + (winningHuman === 2 ? 1 : 0),
        draws: prev.draws + (outcome.winner === "draw" ? 1 : 0),
      }));
    } else {
      const updated = recordChessZenCompletion();
      setStats(updated);
    }
  }, [
    activeCharacter.name,
    activeOpponent,
    elapsedSeconds,
    humanSide,
    isFinished,
    matchNonce,
    materialInfo.capturedByBlack.length,
    materialInfo.capturedByWhite.length,
    mode,
    outcome.winner,
    pushToast,
    todayKey,
    turns,
    whiteOwnerIn2P,
  ]);

  // Execute Bot turn cleanly using latest state ref (plays White if human chose Black, or Black if human chose White)
  useEffect(() => {
    if (activeOpponent !== "bot" || currentPlayer !== botSide || isFinished) {
      return;
    }

    let cancelled = false;
    setBotThinking(true);

    const thinkTimer = window.setTimeout(() => {
      if (cancelled) return;
      const snapshot = latestStateRef.current;
      const chosen = chooseChessMove(snapshot.chessState, snapshot.characterId);
      setBotThinking(false);

      if (cancelled || !chosen) return;
      commitMove(chosen, {
        state: cloneState(snapshot.chessState),
        lastMoveFrom: snapshot.lastMoveFrom,
        lastMoveTo: snapshot.lastMoveTo,
        turns: snapshot.turns,
        positionCounts: { ...snapshot.positionCounts },
      });
    }, 340);

    return () => {
      cancelled = true;
      window.clearTimeout(thinkTimer);
      setBotThinking(false);
    };
  }, [activeOpponent, botSide, commitMove, currentPlayer, isFinished, matchNonce]);

  const handleSelectHumanSide = (nextSide: ChessPlayer) => {
    if (nextSide === humanSide) return;
    soundEngine.playPickup();
    setHumanSide(nextSide);
    resetBoard(false);
  };

  const handleSelectWhiteOwnerIn2P = (owner: 1 | 2) => {
    if (owner === whiteOwnerIn2P) return;
    soundEngine.playPickup();
    setWhiteOwnerIn2P(owner);
    resetBoard(false);
  };

  const canHumanInteract =
    !isFinished &&
    !botThinking &&
    !pendingPromotion &&
    (activeOpponent === "local" || currentPlayer === humanSide);

  const canUndo =
    !botThinking &&
    (Boolean(pendingPromotion) ||
      (activeOpponent === "local"
        ? undoStack.length > 0
        : undoStack.some((s) => s.state.turn === humanSide)));

  const handleSquareClick = (row: number, col: number) => {
    if (!canHumanInteract) return;

    const sqKey = `${row},${col}`;
    const targetMoves = validTargets.get(sqKey);

    // 1. Clicking a valid destination executes the move (or opens promotion picker)
    if (selectedSquare && targetMoves && targetMoves.length > 0) {
      if (targetMoves.length > 1 && targetMoves[0].promotion) {
        soundEngine.playPickup();
        setPendingPromotion({
          from: selectedSquare,
          to: { row, col },
          options: targetMoves,
        });
        return;
      }
      commitMove(targetMoves[0]);
      return;
    }

    // 2. Selecting / deselecting one of the current player's pieces
    const clickedPiece = chessState.board[row][col];
    if (clickedPiece && clickedPiece.player === currentPlayer) {
      if (
        selectedSquare &&
        selectedSquare.row === row &&
        selectedSquare.col === col
      ) {
        setSelectedSquare(null);
        return;
      }

      if (!movableOrigins.has(sqKey)) {
        soundEngine.playInvalid();
        if (kingInCheck) {
          pushToast(
            "King in check",
            "Choose a move that protects or moves your King.",
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
    if (botThinking) return;
    if (pendingPromotion) {
      setPendingPromotion(null);
      return;
    }
    if (undoStack.length === 0) return;

    // In bot mode, unwind back to the human's most recent turn
    let targetIdx = undoStack.length - 1;
    if (activeOpponent === "bot") {
      while (targetIdx > 0 && undoStack[targetIdx].state.turn === botSide) {
        targetIdx--;
      }
      if (undoStack[targetIdx].state.turn !== humanSide) return;
    }

    const snap = undoStack[targetIdx];
    const changedIds: string[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const prevCell = snap.state.board[r][c];
        const currCell = chessState.board[r][c];
        if (prevCell && prevCell.id !== currCell?.id) {
          changedIds.push(prevCell.id);
        }
      }
    }

    soundEngine.playPickup();
    setChessState(snap.state);
    setPositionCounts(snap.positionCounts);
    setLastMoveFrom(snap.lastMoveFrom);
    setLastMoveTo(snap.lastMoveTo);
    setMovingPieceIds(changedIds);
    setTurns(snap.turns);
    setUndoStack(undoStack.slice(0, targetIdx));
    setSelectedSquare(null);
    setPendingPromotion(null);
  };

  const whiteLabel =
    activeOpponent === "bot"
      ? humanSide === 1
        ? "You"
        : activeCharacter.name
      : whiteOwnerIn2P === 1
        ? "Player 1"
        : "Player 2";
  const blackLabel =
    activeOpponent === "bot"
      ? humanSide === 2
        ? "You"
        : activeCharacter.name
      : whiteOwnerIn2P === 1
        ? "Player 2"
        : "Player 1";

  const outcomeTitle = useMemo(() => {
    if (outcome.winner === "draw") {
      if (outcome.reason === "stalemate") return "Draw by stalemate.";
      if (outcome.reason === "insufficient-material")
        return "Draw · insufficient material.";
      if (outcome.reason === "threefold") return "Draw by repetition.";
      return "Draw by 50-move rule.";
    }
    if (outcome.winner === 1) {
      if (activeOpponent === "bot") {
        return humanSide === 1
          ? "Checkmate — you win."
          : `Checkmate — ${activeCharacter.name} wins.`;
      }
      return `${whiteLabel} wins!`;
    }
    if (outcome.winner === 2) {
      if (activeOpponent === "bot") {
        return humanSide === 2
          ? "Checkmate — you win."
          : `Checkmate — ${activeCharacter.name} wins.`;
      }
      return `${blackLabel} wins!`;
    }
    return "";
  }, [
    activeCharacter.name,
    activeOpponent,
    blackLabel,
    humanSide,
    outcome.reason,
    outcome.winner,
    whiteLabel,
  ]);

  const outcomeDetail = useMemo(() => {
    if (outcome.reason === "checkmate") return "King has no escape";
    if (outcome.reason === "stalemate") return "No legal moves remaining";
    if (outcome.reason === "insufficient-material")
      return "Neither side can force mate";
    if (outcome.reason === "threefold") return "Position repeated three times";
    if (outcome.reason === "fifty-move") return "50 moves without capture or pawn move";
    return "";
  }, [outcome.reason]);

  const handleCopyShare = async () => {
    const shareText = buildChessShareCard({
      dateLabel:
        mode === "daily"
          ? formatShortBritishDate(todayKey)
          : mode === "2p"
            ? "2 Players"
            : "Free Play",
      outcomeLabel: outcomeTitle.replace(/\.$/, ""),
      moves: turns,
      capturedByWhite: materialInfo.capturedByWhite.length,
      capturedByBlack: materialInfo.capturedByBlack.length,
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

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar backHref="/" title="Chess" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-16">
        {/* Top Mode Switcher & Clean Unboxed Metadata */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as GameMode)}>
            <TabsList aria-label="Game mode">
              <TabsTrigger value="daily">Daily Match</TabsTrigger>
              <TabsTrigger value="zen">Free Play</TabsTrigger>
              <TabsTrigger value="2p" className="inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                <span>2 Players</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-[var(--sys-color-text-secondary)]">
              <span>
                {mode === "daily"
                  ? formatShortBritishDate(todayKey)
                  : mode === "2p"
                    ? "Pass & Play"
                    : "Untimed"}
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
                  aria-label="How to play Chess"
                  className="w-10 px-0 shrink-0"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>How to play Chess</DialogTitle>
                <DialogDescription>
                  Full-rules chess on the tactile monochrome 8×8 board.
                </DialogDescription>
                <ul className="mt-4 space-y-2.5 text-sm text-[var(--sys-color-text-secondary)] list-disc pl-5">
                  <li>
                    <strong>White always moves first:</strong> Smooth ivory
                    tokens play as White and grooved charcoal tokens play as
                    Black. Choose whether to move first as White or second as
                    Black above the board.
                  </li>
                  <li>
                    <strong>Complete rules:</strong> Includes castling, en passant
                    captures, pawn promotion, check highlights, stalemate, and
                    checkmate detection.
                  </li>
                  <li>
                    <strong>Table partners:</strong> Switch between Pip, Milo,
                    Hazel, and Barnaby in the side panel, or play Pass &amp; Play
                    with two players on the same device.
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

        {/* Main 2-Column Tabletop Arena (Identical structure to Draughts) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 lg:gap-8 items-start">
          {/* Focal Anchor: Tactile 8x8 Chess Board */}
          <section
            aria-label="Chess 8 by 8 board"
            className="flex flex-col items-center w-full"
          >
            {/* First-Move / Side Choice Bar — White Always Moves First */}
            <div className="w-full max-w-[540px] flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
              <span className="text-xs text-[var(--sys-color-text-secondary)]">
                White always moves first
              </span>

              {activeOpponent === "bot" ? (
                <div
                  role="group"
                  aria-label="Choose whether to move first as White or second as Black"
                  className="inline-flex items-center p-0.5 rounded-xl bg-[var(--sys-color-surface-container)] border border-[var(--sys-color-border-subtle)]"
                >
                  <button
                    type="button"
                    aria-pressed={humanSide === 1}
                    onClick={() => handleSelectHumanSide(1)}
                    className={`min-h-[32px] px-2.5 py-1 rounded-[10px] text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--sys-color-border-focus)] ${
                      humanSide === 1
                        ? "bg-[var(--sys-color-surface-lowest)] text-[var(--sys-color-text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                        : "text-[var(--sys-color-text-secondary)] hover:text-[var(--sys-color-text-primary)]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="w-4 h-4 rounded-full bg-[var(--piece-white-bg)] text-[var(--piece-white-fg)] border border-[var(--piece-white-border)] flex items-center justify-center text-[10px] leading-none"
                    >
                      {PIECE_GLYPHS.k}
                    </span>
                    <span>Move first · White</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={humanSide === 2}
                    onClick={() => handleSelectHumanSide(2)}
                    className={`min-h-[32px] px-2.5 py-1 rounded-[10px] text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--sys-color-border-focus)] ${
                      humanSide === 2
                        ? "bg-[var(--sys-color-surface-lowest)] text-[var(--sys-color-text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                        : "text-[var(--sys-color-text-secondary)] hover:text-[var(--sys-color-text-primary)]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="w-4 h-4 rounded-full bg-[var(--piece-black-bg)] text-[var(--piece-black-fg)] border border-[var(--piece-black-border)] flex items-center justify-center text-[10px] leading-none"
                    >
                      {PIECE_GLYPHS.k}
                    </span>
                    <span>Move second · Black</span>
                  </button>
                </div>
              ) : (
                <div
                  role="group"
                  aria-label="Choose which player moves first as White"
                  className="inline-flex items-center p-0.5 rounded-xl bg-[var(--sys-color-surface-container)] border border-[var(--sys-color-border-subtle)]"
                >
                  <button
                    type="button"
                    aria-pressed={whiteOwnerIn2P === 1}
                    onClick={() => handleSelectWhiteOwnerIn2P(1)}
                    className={`min-h-[32px] px-2.5 py-1 rounded-[10px] text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--sys-color-border-focus)] ${
                      whiteOwnerIn2P === 1
                        ? "bg-[var(--sys-color-surface-lowest)] text-[var(--sys-color-text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                        : "text-[var(--sys-color-text-secondary)] hover:text-[var(--sys-color-text-primary)]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="w-4 h-4 rounded-full bg-[var(--piece-white-bg)] text-[var(--piece-white-fg)] border border-[var(--piece-white-border)] flex items-center justify-center text-[10px] leading-none"
                    >
                      {PIECE_GLYPHS.k}
                    </span>
                    <span>Player 1 · White</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={whiteOwnerIn2P === 2}
                    onClick={() => handleSelectWhiteOwnerIn2P(2)}
                    className={`min-h-[32px] px-2.5 py-1 rounded-[10px] text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--sys-color-border-focus)] ${
                      whiteOwnerIn2P === 2
                        ? "bg-[var(--sys-color-surface-lowest)] text-[var(--sys-color-text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                        : "text-[var(--sys-color-text-secondary)] hover:text-[var(--sys-color-text-primary)]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="w-4 h-4 rounded-full bg-[var(--piece-white-bg)] text-[var(--piece-white-fg)] border border-[var(--piece-white-border)] flex items-center justify-center text-[10px] leading-none"
                    >
                      {PIECE_GLYPHS.k}
                    </span>
                    <span>Player 2 · White</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quiet Contextual Turn Prompt */}
            <div className="w-full max-w-[540px] flex items-center justify-between mb-2.5 px-1 text-xs text-[var(--sys-color-text-secondary)]">
              <span className="font-medium text-[var(--sys-color-text-primary)]">
                {isFinished
                  ? outcomeTitle
                  : pendingPromotion
                    ? "Choose a piece to promote your pawn"
                    : botThinking
                      ? `${activeCharacter.name} is thinking…`
                      : kingInCheck
                        ? `Check — ${currentPlayer === 1 ? whiteLabel : blackLabel}'s King is under attack`
                        : activeOpponent === "bot" && currentPlayer === humanSide
                          ? `Your turn · ${humanSide === 1 ? "White" : "Black"}`
                          : `${currentPlayer === 1 ? whiteLabel : blackLabel}'s turn · ${currentPlayer === 1 ? "White" : "Black"}`}
              </span>
              <span className="font-mono tabular-nums text-[var(--sys-color-text-muted)]">
                Move {chessState.fullMoveNumber}
              </span>
            </div>

            {/* Inline Pawn Promotion Picker */}
            <AnimatePresence>
              {pendingPromotion && (
                <motion.div
                  key="promo-picker"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="w-full max-w-[540px] mb-3 tonal-card p-3 flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="text-xs font-medium text-[var(--sys-color-text-primary)] pl-1">
                    Promote pawn to:
                  </span>
                  <div className="flex items-center gap-2">
                    {PROMOTION_ORDER.map((promoType) => {
                      const matched = pendingPromotion.options.find(
                        (m) => m.promotion === promoType
                      );
                      if (!matched) return null;
                      return (
                        <button
                          key={promoType}
                          type="button"
                          onClick={() => commitMove(matched)}
                          aria-label={`Promote to ${PIECE_NAMES[promoType]}`}
                          className="min-w-[44px] min-h-[44px] px-2.5 py-1.5 rounded-xl border border-[var(--sys-color-border-subtle)] bg-[var(--sys-color-surface-low)] hover:border-[var(--sys-color-text-primary)] transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="text-xl leading-none text-[var(--sys-color-text-primary)]">
                            {PIECE_GLYPHS[promoType]}
                          </span>
                          <span className="hidden sm:inline text-xs font-medium text-[var(--sys-color-text-primary)]">
                            {PIECE_NAMES[promoType]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className="w-full max-w-[540px] game-touch-surface"
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Architectural Matte Board Frame — Exact Draughts Board Theme */}
              <div className="rounded-[20px] sm:rounded-[24px] bg-[var(--sys-color-surface-container)] border border-[var(--sys-color-border-subtle)] p-2 sm:p-3.5 shadow-[0_14px_34px_-18px_rgba(0,0,0,0.22)]">
                <div className="relative aspect-square w-full rounded-[12px] sm:rounded-[14px] border border-[var(--sys-color-border-subtle)]">
                  {/* Layer 1: Interactive 8×8 Checkerboard Grid */}
                  <div className="grid grid-cols-8 grid-rows-8 w-full h-full overflow-hidden rounded-[12px] sm:rounded-[14px]">
                    {Array.from({ length: BOARD_SIZE }).map(
                      (_, displayRowIdx) => {
                        const row = isBoardFlipped
                          ? BOARD_SIZE - 1 - displayRowIdx
                          : displayRowIdx;
                        return Array.from({ length: BOARD_SIZE }).map(
                          (__, displayColIdx) => {
                            const col = isBoardFlipped
                              ? BOARD_SIZE - 1 - displayColIdx
                              : displayColIdx;
                            const darkSq = isDarkSquare(row, col);
                            const cell = chessState.board[row][col];
                            const sqKey = `${row},${col}`;

                            const targetMoves = validTargets.get(sqKey);
                            const isTarget = Boolean(
                              targetMoves && targetMoves.length > 0
                            );
                            const isCaptureTarget = Boolean(
                              targetMoves && targetMoves[0].captured !== null
                            );

                            const isLastSquare =
                              (lastMoveFrom?.row === row &&
                                lastMoveFrom?.col === col) ||
                              (lastMoveTo?.row === row &&
                                lastMoveTo?.col === col);

                            const canClick =
                              canHumanInteract &&
                              (isTarget ||
                                (cell !== null &&
                                  cell.player === currentPlayer));

                            const coordLabel = `${FILE_LABELS[col]}${BOARD_SIZE - row}`;

                            return (
                              <button
                                key={sqKey}
                                type="button"
                                draggable={false}
                                disabled={!canHumanInteract}
                                onContextMenu={(e) => e.preventDefault()}
                                onClick={() => handleSquareClick(row, col)}
                                aria-label={`Square ${coordLabel}${
                                  cell
                                    ? `, ${cell.player === 1 ? whiteLabel : blackLabel} ${
                                        PIECE_NAMES[cell.type]
                                      }`
                                    : ""
                                }${
                                  isCaptureTarget
                                    ? ", capture destination"
                                    : isTarget
                                      ? ", legal move destination"
                                      : ""
                                }`}
                                className={`relative aspect-square flex items-center justify-center transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--sys-color-border-focus)] ${
                                  isLastSquare
                                    ? "bg-[var(--sys-color-bg-action-primary-subtle)]"
                                    : darkSq
                                      ? "bg-[var(--board-square-dark)]"
                                      : "bg-[var(--board-square-light)]"
                                } ${canClick ? "cursor-pointer" : "cursor-default"}`}
                              >
                                {/* Subtle edge rank/file labels on desktop */}
                                {displayColIdx === 0 && (
                                  <span
                                    aria-hidden="true"
                                    className="hidden sm:block pointer-events-none absolute top-0.5 left-1 font-mono text-[9px] leading-none text-[var(--sys-color-text-muted)]/70"
                                  >
                                    {BOARD_SIZE - row}
                                  </span>
                                )}
                                {displayRowIdx === BOARD_SIZE - 1 && (
                                  <span
                                    aria-hidden="true"
                                    className="hidden sm:block pointer-events-none absolute bottom-0.5 right-1 font-mono text-[9px] leading-none text-[var(--sys-color-text-muted)]/70"
                                  >
                                    {FILE_LABELS[col]}
                                  </span>
                                )}

                                {/* Legal Quiet / En Passant Destination Indicator */}
                                {isTarget && !cell && (
                                  <motion.span
                                    initial={
                                      prefersReducedMotion
                                        ? false
                                        : { scale: 0.6, opacity: 0 }
                                    }
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.14 }}
                                    aria-hidden="true"
                                    className={`pointer-events-none rounded-full flex items-center justify-center ${
                                      isCaptureTarget
                                        ? "w-[58%] h-[58%] border-2 border-[var(--sys-color-text-primary)] bg-[var(--sys-color-surface-lowest)]/75"
                                        : "w-[34%] h-[34%] border-2 border-dashed border-[var(--sys-color-text-primary)]/70 bg-[var(--sys-color-surface-lowest)]/60"
                                    }`}
                                  >
                                    {isCaptureTarget && (
                                      <span className="w-[38%] h-[38%] rounded-full bg-[var(--sys-color-text-primary)]" />
                                    )}
                                  </motion.span>
                                )}
                              </button>
                            );
                          }
                        );
                      }
                    )}
                  </div>

                  {/* Layer 2: GPU-Composited Piece Overlay Layer (zero clipping, silky 60/120fps transform glide) */}
                  <div
                    key={`pieces-${matchNonce}-${isBoardFlipped ? "f" : "n"}`}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-10"
                  >
                    <AnimatePresence initial={false}>
                      {chessState.board.flatMap((rowArr, row) =>
                        rowArr.flatMap((cell, col) => {
                          if (!cell) return [];
                          const displayRow = isBoardFlipped
                            ? BOARD_SIZE - 1 - row
                            : row;
                          const displayCol = isBoardFlipped
                            ? BOARD_SIZE - 1 - col
                            : col;
                          const sqKey = `${row},${col}`;

                          const isSelected =
                            selectedSquare !== null &&
                            selectedSquare.row === row &&
                            selectedSquare.col === col;

                          const targetMoves = validTargets.get(sqKey);
                          const isCaptureRingTarget = Boolean(
                            targetMoves && targetMoves.length > 0
                          );

                          const isKingCheckedHere =
                            kingInCheck &&
                            cell.player === currentPlayer &&
                            cell.type === "k";

                          const winOrder = winnerPieceOrder.get(cell.id);
                          const isWinnerPiece = winOrder !== undefined;
                          const isMovingPiece = movingPieceIds.includes(
                            cell.id
                          );

                          return [
                            <motion.div
                              key={cell.id}
                              initial={false}
                              animate={{
                                x: `${displayCol * 100}%`,
                                y: `${displayRow * 100}%`,
                                scale: 1,
                                opacity: 1,
                              }}
                              exit={
                                prefersReducedMotion
                                  ? {
                                      opacity: 0,
                                      transition: { duration: 0.01 },
                                    }
                                  : {
                                      scale: 0.48,
                                      opacity: 0,
                                      transition: {
                                        duration: 0.18,
                                        ease: [0.4, 0, 1, 1],
                                      },
                                    }
                              }
                              transition={
                                prefersReducedMotion
                                  ? { duration: 0.01 }
                                  : {
                                      x: {
                                        type: "spring",
                                        stiffness: 290,
                                        damping: 27,
                                        mass: 0.78,
                                      },
                                      y: {
                                        type: "spring",
                                        stiffness: 290,
                                        damping: 27,
                                        mass: 0.78,
                                      },
                                      scale: { duration: 0.18 },
                                      opacity: { duration: 0.18 },
                                    }
                              }
                              style={{
                                zIndex: isSelected
                                  ? 40
                                  : isMovingPiece
                                    ? 30
                                    : 10,
                                willChange: "transform",
                              }}
                              className="absolute top-0 left-0 w-[12.5%] h-[12.5%] flex items-center justify-center pointer-events-none"
                            >
                              {isCaptureRingTarget && (
                                <motion.span
                                  initial={
                                    prefersReducedMotion
                                      ? false
                                      : { scale: 0.82, opacity: 0 }
                                  }
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.14 }}
                                  className="pointer-events-none absolute inset-[3px] rounded-full border-2 border-[var(--sys-color-text-primary)] z-20"
                                />
                              )}
                              <ChessToken
                                piece={cell}
                                isSelected={isSelected}
                                isInCheckKing={isKingCheckedHere}
                                isWinnerPiece={isWinnerPiece}
                                winOrder={winOrder}
                                reducedMotion={prefersReducedMotion}
                              />
                            </motion.div>,
                          ];
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Post-Match Outcome Strip */}
            <AnimatePresence>
              {isFinished && (
                <motion.section
                  key="chess-summary"
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
                        moves ·{" "}
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

          {/* Side Rail: Match Ledger, Character Partner Picker & Controls */}
          <aside
            aria-label="Chess match ledger and controls"
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
                  {materialInfo.whiteCount + materialInfo.blackCount} on board
                </span>
              </div>

              <div className="space-y-2">
                {/* White (Ivory — Always Moves First) */}
                <div
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-colors ${
                    !isFinished && currentPlayer === 1
                      ? "bg-[var(--sys-color-surface-low)] border-[var(--sys-color-text-primary)]"
                      : "bg-transparent border-[var(--sys-color-border-subtle)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {activeOpponent === "bot" && botSide === 1 ? (
                      <span className="relative w-9 h-9 rounded-full bg-[var(--piece-white-bg)] text-[var(--piece-white-fg)] border-2 border-[var(--piece-white-border)] shadow-[inset_0_2px_0_rgba(255,255,255,0.85)] flex items-center justify-center shrink-0">
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-[3px] rounded-full border border-[var(--piece-white-inner)]"
                        />
                        <CharacterIcon
                          iconKey={activeCharacter.iconKey}
                          className="w-4 h-4 relative z-10"
                        />
                      </span>
                    ) : (
                      <ChessToken
                        piece={{ id: "legend-w", player: 1, type: "k" }}
                        size="badge"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--sys-color-text-primary)] truncate">
                        {whiteLabel} · White
                      </div>
                      <div className="text-xs text-[var(--sys-color-text-muted)] truncate">
                        {activeOpponent === "bot" &&
                        botSide === 1 &&
                        botThinking ? (
                          "Thinking…"
                        ) : materialInfo.capturedByWhite.length > 0 ? (
                          <span className="tracking-tight text-[var(--sys-color-text-secondary)]">
                            {materialInfo.capturedByWhite
                              .map((t) => PIECE_GLYPHS[t])
                              .join("")}
                          </span>
                        ) : (
                          <span className="font-mono tabular-nums">
                            {materialInfo.whiteCount} pieces · Moves 1st
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {materialInfo.whiteAdvantage > 0 && (
                    <span className="font-mono text-xs tabular-nums text-[var(--sys-color-text-secondary)] shrink-0">
                      +{materialInfo.whiteAdvantage}
                    </span>
                  )}
                </div>

                {/* Black (Charcoal — Moves Second) */}
                <div
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-colors ${
                    !isFinished && currentPlayer === 2
                      ? "bg-[var(--sys-color-surface-low)] border-[var(--sys-color-text-primary)]"
                      : "bg-transparent border-[var(--sys-color-border-subtle)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {activeOpponent === "bot" && botSide === 2 ? (
                      <span className="relative w-9 h-9 rounded-full bg-[var(--piece-black-bg)] text-[var(--piece-black-fg)] border-2 border-[var(--piece-black-border)] flex items-center justify-center shrink-0">
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-[3px] rounded-full border border-dashed border-[var(--piece-black-inner)]"
                        />
                        <CharacterIcon
                          iconKey={activeCharacter.iconKey}
                          className="w-4 h-4 relative z-10"
                        />
                      </span>
                    ) : (
                      <ChessToken
                        piece={{ id: "legend-b", player: 2, type: "k" }}
                        size="badge"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--sys-color-text-primary)] truncate">
                        {blackLabel} · Black
                      </div>
                      <div className="text-xs text-[var(--sys-color-text-muted)] truncate">
                        {activeOpponent === "bot" &&
                        botSide === 2 &&
                        botThinking ? (
                          "Thinking…"
                        ) : materialInfo.capturedByBlack.length > 0 ? (
                          <span className="tracking-tight text-[var(--sys-color-text-secondary)]">
                            {materialInfo.capturedByBlack
                              .map((t) => PIECE_GLYPHS[t])
                              .join("")}
                          </span>
                        ) : (
                          <span className="font-mono tabular-nums">
                            {materialInfo.blackCount} pieces · Moves 2nd
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {materialInfo.whiteAdvantage < 0 && (
                    <span className="font-mono text-xs tabular-nums text-[var(--sys-color-text-secondary)] shrink-0">
                      +{Math.abs(materialInfo.whiteAdvantage)}
                    </span>
                  )}
                </div>
              </div>

              {/* Head-to-head session score in 2-Player mode */}
              {mode === "2p" && (
                <div className="pt-2 border-t border-[var(--sys-color-border-subtle)] flex items-center justify-between gap-2 text-xs">
                  <span className="text-[var(--sys-color-text-muted)]">
                    Series
                  </span>
                  <div className="flex items-center gap-2.5 font-mono tabular-nums text-[var(--sys-color-text-primary)]">
                    <span>P1 {twoPlayerScore.p1}</span>
                    {twoPlayerScore.draws > 0 && (
                      <span className="text-[var(--sys-color-text-muted)]">
                        · {twoPlayerScore.draws}D
                      </span>
                    )}
                    <span className="text-[var(--sys-color-text-muted)]">—</span>
                    <span>{twoPlayerScore.p2} P2</span>
                    {twoPlayerScore.p1 +
                      twoPlayerScore.p2 +
                      twoPlayerScore.draws >
                      0 && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playPickup();
                          setTwoPlayerScore({ p1: 0, p2: 0, draws: 0 });
                        }}
                        className="ml-1 font-sans text-[11px] text-[var(--sys-color-text-muted)] hover:text-[var(--sys-color-text-primary)] underline underline-offset-2 cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[var(--sys-color-border-subtle)] flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUndo}
                  disabled={!canUndo}
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

            {/* Fun Cartoon Character Partner Selector (Zero difficulty labels — mirrors Connect 4 Emblem Set) */}
            {activeOpponent === "bot" && (
              <div className="tonal-card p-4">
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-[var(--sys-color-text-primary)]">
                    Table partner
                  </h2>
                  <p className="text-xs text-[var(--sys-color-text-muted)] mt-0.5">
                    Pick a character to play across the board.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {CHESS_CHARACTERS.map((char) => {
                    const selected = char.id === characterId;
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playPickup();
                          setCharacterId(char.id);
                        }}
                        aria-pressed={selected}
                        className={`min-h-[48px] px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sys-color-border-focus)] ${
                          selected
                            ? "bg-[var(--sys-color-surface-low)] border-[var(--sys-color-text-primary)] text-[var(--sys-color-text-primary)]"
                            : "bg-transparent border-[var(--sys-color-border-subtle)] text-[var(--sys-color-text-secondary)] hover:bg-[var(--sys-color-surface-low)]"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[var(--sys-color-text-primary)] truncate">
                            {char.name}
                          </div>
                          <div className="text-[10px] text-[var(--sys-color-text-muted)] truncate">
                            {char.tagline}
                          </div>
                        </div>
                        <span
                          className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center border ${
                            selected
                              ? "bg-[var(--sys-color-text-primary)] text-[var(--sys-color-surface-lowest)] border-[var(--sys-color-text-primary)]"
                              : "bg-[var(--sys-color-surface-lowest)] text-[var(--sys-color-text-primary)] border-[var(--sys-color-border-default)]"
                          }`}
                        >
                          <CharacterIcon
                            iconKey={char.iconKey}
                            className="w-3.5 h-3.5"
                            strokeWidth={2.2}
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pass & Play Tabletop Perspective Controls */}
            {mode === "2p" && (
              <div className="tonal-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-[var(--sys-color-text-primary)]">
                    Pass &amp; Play view
                  </h2>
                  <span className="text-xs text-[var(--sys-color-text-muted)]">
                    {isBoardFlipped ? "Black bottom" : "White bottom"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      soundEngine.playPickup();
                      setAutoFlip(false);
                      setManualFlipped((f) => !f);
                    }}
                    className="flex-1"
                  >
                    <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
                    <span>Flip board</span>
                  </Button>
                  <button
                    type="button"
                    aria-pressed={autoFlip}
                    onClick={() => {
                      soundEngine.playPickup();
                      setAutoFlip((prev) => !prev);
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      autoFlip
                        ? "bg-[var(--sys-color-surface-low)] border-[var(--sys-color-text-primary)] text-[var(--sys-color-text-primary)]"
                        : "bg-transparent border-[var(--sys-color-border-subtle)] text-[var(--sys-color-text-secondary)] hover:bg-[var(--sys-color-surface-low)]"
                    }`}
                  >
                    Auto-flip
                  </button>
                </div>
              </div>
            )}

            {/* Quiet Rules Reminder */}
            <div className="tonal-card p-4 text-xs text-[var(--sys-color-text-secondary)] space-y-1.5 leading-relaxed">
              <div className="font-semibold text-[var(--sys-color-text-primary)]">
                Tactile Chess
              </div>
              <p>
                White always moves first. Choose to move first with White or
                second with Black — castling, en passant, and pawn promotion are
                all active.
              </p>
            </div>

            {/* Quiet Footer Navigation */}
            <div className="flex items-center justify-between px-1 text-xs text-[var(--sys-color-text-muted)]">
              <span>Tap a piece, then a square</span>
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
