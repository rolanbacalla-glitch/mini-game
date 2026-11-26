"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  Flame,
  Lightbulb,
  RotateCw,
  Shuffle,
  Sparkles,
  Trash2,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { soundEngine } from "@/lib/audio";
import { formatShortBritishDate, getTodayKey } from "@/lib/games";
import {
  buildShareCard,
  checkPlacement,
  generateLoomPuzzle,
  getAbsoluteCells,
  getPieceDimensions,
  GRID_SIZE,
  isPuzzleSolved,
  rotateCells,
  type Coord,
  type PlacedPieceState,
  type PuzzlePiece,
} from "@/lib/loom-and-latch/engine";
import {
  formatDuration,
  loadLoomStats,
  recordDailyCompletion,
  recordZenCompletion,
  type LoomStats,
} from "@/lib/storage";

type GameMode = "daily" | "zen";

function computeCentredOrigin(
  piece: PuzzlePiece,
  rotation: number,
  targetCell: Coord
): Coord {
  const rotated = rotateCells(piece.solutionCells, rotation);
  const { rows, cols } = getPieceDimensions(rotated);

  // If the piece has an eyelet and the user hovers directly over its matching peg,
  // snap the origin so the eyelet aligns right onto the peg!
  const rawRow = targetCell.row - Math.floor(rows / 2);
  const rawCol = targetCell.col - Math.floor(cols / 2);

  const clampedRow = Math.max(0, Math.min(GRID_SIZE - rows, rawRow));
  const clampedCol = Math.max(0, Math.min(GRID_SIZE - cols, rawCol));

  return { row: clampedRow, col: clampedCol };
}

function MiniPiecePreview({
  piece,
  rotation,
  cellSize = 20,
}: {
  piece: PuzzlePiece;
  rotation: number;
  cellSize?: number;
}) {
  const cells = rotateCells(piece.solutionCells, rotation);
  const { rows, cols } = getPieceDimensions(cells);
  const cellMap = new Map<string, number>();
  cells.forEach((c, idx) => cellMap.set(`${c.row},${c.col}`, idx));

  return (
    <div
      className="grid gap-1"
      style={{
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
      }}
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => {
          const cellIndex = cellMap.get(`${r},${c}`);
          if (cellIndex === undefined) {
            return <div key={`${r}-${c}`} />;
          }
          const isEyelet = piece.eyeletIndex === cellIndex;
          return (
            <div
              key={`${r}-${c}`}
              style={{
                backgroundColor: piece.colour.fill,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1.5px 0 ${piece.colour.stroke}`,
              }}
              className="rounded-[5px] relative flex items-center justify-center"
            >
              {isEyelet && (
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--bg-paper)] ring-2 ring-white/90 shadow-xs" />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export function LoomAndLatchGame() {
  const searchParams = useSearchParams();
  const initialMode: GameMode =
    searchParams.get("mode") === "zen" ? "zen" : "daily";

  const [mode, setMode] = useState<GameMode>(initialMode);
  const [todayKey] = useState<string>(() => getTodayKey());
  const [zenCounter, setZenCounter] = useState<number>(1);

  const seed = mode === "daily" ? todayKey : `zen-${todayKey}-${zenCounter}`;
  const puzzle = useMemo(() => generateLoomPuzzle(seed), [seed]);

  const [placedPieces, setPlacedPieces] = useState<
    Record<string, PlacedPieceState>
  >({});
  const [trayRotations, setTrayRotations] = useState<Record<string, number>>(
    {}
  );
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<Coord | null>(null);
  const [hintCells, setHintCells] = useState<Coord[] | null>(null);
  const [hintPieceColour, setHintPieceColour] = useState<string | null>(null);
  const [usedHint, setUsedHint] = useState<boolean>(false);

  const [moves, setMoves] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [solved, setSolved] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [stats, setStats] = useState<LoomStats | null>(null);

  // Reset board cleanly whenever the puzzle seed changes
  useEffect(() => {
    const initialRots: Record<string, number> = {};
    puzzle.pieces.forEach((p) => {
      initialRots[p.id] = p.initialRotation;
    });
    setPlacedPieces({});
    setTrayRotations(initialRots);
    setSelectedPieceId(puzzle.pieces[0]?.id ?? null);
    setHoverCell(null);
    setHintCells(null);
    setHintPieceColour(null);
    setUsedHint(false);
    setMoves(0);
    setElapsedSeconds(0);
    setSolved(false);
    setCopied(false);
  }, [puzzle]);

  // Load persisted stats on mount
  useEffect(() => {
    setStats(loadLoomStats());
  }, []);

  // Gentle elapsed timer for Daily Ritual (paused once solved)
  useEffect(() => {
    if (mode !== "daily" || solved) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mode, solved]);

  const selectedPiece = useMemo(
    () => puzzle.pieces.find((p) => p.id === selectedPieceId) ?? null,
    [puzzle.pieces, selectedPieceId]
  );

  const selectedRotation = selectedPieceId
    ? (trayRotations[selectedPieceId] ?? 0)
    : 0;

  const handleRotateSelected = useCallback(() => {
    if (!selectedPieceId || solved) return;
    soundEngine.playRotate();
    setTrayRotations((prev) => ({
      ...prev,
      [selectedPieceId]: ((prev[selectedPieceId] ?? 0) + 1) % 4,
    }));
  }, [selectedPieceId, solved]);

  // Keyboard shortcuts: R / Space to rotate, Escape to deselect
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (solved) return;
      if (e.key === "r" || e.key === "R" || e.key === " ") {
        if (selectedPieceId) {
          e.preventDefault();
          handleRotateSelected();
        }
      } else if (e.key === "Escape") {
        setSelectedPieceId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRotateSelected, selectedPieceId, solved]);

  // Compute smart ghost preview on hover
  const ghostPreview = useMemo(() => {
    if (!selectedPiece || !hoverCell || solved) return null;

    // Smart magnetic assist: if hovering directly on a matching peg for this piece,
    // snap the eyelet onto that peg!
    const pegAtHover = puzzle.pegs.find(
      (p) =>
        p.row === hoverCell.row &&
        p.col === hoverCell.col &&
        p.pieceId === selectedPiece.id
    );

    let origin: Coord;
    if (pegAtHover && selectedPiece.eyeletIndex !== null) {
      const rotated = rotateCells(selectedPiece.solutionCells, selectedRotation);
      const eyeletRel = rotated[selectedPiece.eyeletIndex];
      origin = {
        row: pegAtHover.row - eyeletRel.row,
        col: pegAtHover.col - eyeletRel.col,
      };
    } else {
      origin = computeCentredOrigin(selectedPiece, selectedRotation, hoverCell);
    }

    const check = checkPlacement(
      puzzle,
      selectedPiece,
      origin,
      selectedRotation,
      placedPieces
    );

    return {
      origin,
      ...check,
    };
  }, [
    hoverCell,
    placedPieces,
    puzzle,
    selectedPiece,
    selectedRotation,
    solved,
  ]);

  // Build quick lookup of placed cells on the 5×5 board
  const boardOccupancy = useMemo(() => {
    const map = new Map<
      string,
      { piece: PuzzlePiece; isEyelet: boolean; cellIndex: number }
    >();
    for (const [pieceId, state] of Object.entries(placedPieces)) {
      const piece = puzzle.pieces.find((p) => p.id === pieceId);
      if (!piece) continue;
      const cells = getAbsoluteCells(piece, state.origin, state.rotation);
      cells.forEach((c, idx) => {
        map.set(`${c.row},${c.col}`, {
          piece,
          isEyelet: piece.eyeletIndex === idx,
          cellIndex: idx,
        });
      });
    }
    return map;
  }, [placedPieces, puzzle.pieces]);

  const latchedCount = useMemo(() => {
    let count = 0;
    for (const peg of puzzle.pegs) {
      const occ = boardOccupancy.get(`${peg.row},${peg.col}`);
      if (occ && occ.piece.id === peg.pieceId && occ.isEyelet) {
        count++;
      }
    }
    return count;
  }, [boardOccupancy, puzzle.pegs]);

  const handleCellClick = (row: number, col: number) => {
    if (solved) return;

    // If a piece is currently selected, try to place it here
    if (selectedPiece) {
      const pegAtCell = puzzle.pegs.find(
        (p) => p.row === row && p.col === col && p.pieceId === selectedPiece.id
      );

      let origin: Coord;
      if (pegAtCell && selectedPiece.eyeletIndex !== null) {
        const rotated = rotateCells(
          selectedPiece.solutionCells,
          selectedRotation
        );
        const eyeletRel = rotated[selectedPiece.eyeletIndex];
        origin = {
          row: pegAtCell.row - eyeletRel.row,
          col: pegAtCell.col - eyeletRel.col,
        };
      } else {
        origin = computeCentredOrigin(selectedPiece, selectedRotation, {
          row,
          col,
        });
      }

      const check = checkPlacement(
        puzzle,
        selectedPiece,
        origin,
        selectedRotation,
        placedPieces
      );

      if (check.valid) {
        const nextPlaced: Record<string, PlacedPieceState> = {
          ...placedPieces,
          [selectedPiece.id]: {
            pieceId: selectedPiece.id,
            origin,
            rotation: selectedRotation,
          },
        };
        const nextMoves = moves + 1;

        setPlacedPieces(nextPlaced);
        setMoves(nextMoves);
        setHintCells(null);
        setHintPieceColour(null);

        const nowSolved = isPuzzleSolved(puzzle, nextPlaced);
        if (nowSolved) {
          setSolved(true);
          setSelectedPieceId(null);
          soundEngine.playComplete();

          if (mode === "daily") {
            const shareText = buildShareCard(
              puzzle,
              nextPlaced,
              formatShortBritishDate(todayKey),
              formatDuration(elapsedSeconds),
              nextMoves
            );
            const updated = recordDailyCompletion({
              dateKey: todayKey,
              elapsedSeconds,
              moves: nextMoves,
              usedHint,
              shareText,
              completedAt: new Date().toISOString(),
            });
            setStats(updated);
          } else {
            const updated = recordZenCompletion();
            setStats(updated);
          }
        } else {
          if (check.latchedPeg) {
            soundEngine.playLatch();
          } else {
            soundEngine.playSnap();
          }
          // Auto-select the next unplaced piece for effortless flow
          const nextUnplaced = puzzle.pieces.find((p) => !nextPlaced[p.id]);
          setSelectedPieceId(nextUnplaced?.id ?? null);
        }
        return;
      }

      // If the user clicked on an already-placed piece instead of a valid empty spot,
      // lift that placed piece up for easy repositioning
      const existing = boardOccupancy.get(`${row},${col}`);
      if (existing) {
        const liftedState = placedPieces[existing.piece.id];
        const nextPlaced = { ...placedPieces };
        delete nextPlaced[existing.piece.id];
        setPlacedPieces(nextPlaced);
        setTrayRotations((prev) => ({
          ...prev,
          [existing.piece.id]: liftedState?.rotation ?? 0,
        }));
        setSelectedPieceId(existing.piece.id);
        soundEngine.playPickup();
        return;
      }

      soundEngine.playInvalid();
      return;
    }

    // No piece selected: clicking a placed piece lifts it back into hand
    const existing = boardOccupancy.get(`${row},${col}`);
    if (existing) {
      const liftedState = placedPieces[existing.piece.id];
      const nextPlaced = { ...placedPieces };
      delete nextPlaced[existing.piece.id];
      setPlacedPieces(nextPlaced);
      setTrayRotations((prev) => ({
        ...prev,
        [existing.piece.id]: liftedState?.rotation ?? 0,
      }));
      setSelectedPieceId(existing.piece.id);
      soundEngine.playPickup();
    }
  };

  const handleTrayPieceClick = (pieceId: string) => {
    if (solved) return;
    if (selectedPieceId === pieceId) {
      // Tapping an already-selected piece rotates it 90° clockwise
      handleRotateSelected();
    } else {
      setSelectedPieceId(pieceId);
      soundEngine.playPickup();
    }
  };

  const handleClearBoard = () => {
    if (Object.keys(placedPieces).length === 0) return;
    soundEngine.playClear();
    setPlacedPieces({});
    setHintCells(null);
    setHintPieceColour(null);
    setSelectedPieceId(puzzle.pieces[0]?.id ?? null);
    setSolved(false);
  };

  const handleGentleNudge = () => {
    if (solved) return;
    const target =
      (selectedPiece && !placedPieces[selectedPiece.id]
        ? selectedPiece
        : puzzle.pieces.find((p) => !placedPieces[p.id])) ?? null;
    if (!target) return;

    const solutionAbs = target.solutionCells.map((c) => ({
      row: target.solutionOrigin.row + c.row,
      col: target.solutionOrigin.col + c.col,
    }));

    setSelectedPieceId(target.id);
    setTrayRotations((prev) => ({ ...prev, [target.id]: 0 }));
    setHintCells(solutionAbs);
    setHintPieceColour(target.colour.fill);
    setUsedHint(true);
    soundEngine.playPickup();

    window.setTimeout(() => {
      setHintCells(null);
      setHintPieceColour(null);
    }, 2400);
  };

  const handleCopyShare = async () => {
    const shareText = buildShareCard(
      puzzle,
      placedPieces,
      mode === "daily" ? formatShortBritishDate(todayKey) : "Zen Loom",
      mode === "daily" ? formatDuration(elapsedSeconds) : "Untimed",
      moves
    );
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      soundEngine.playPickup();
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard may be unavailable in restricted contexts
    }
  };

  const unplacedPieces = puzzle.pieces.filter((p) => !placedPieces[p.id]);
  const placedCount = Object.keys(placedPieces).length;

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar backHref="/" backLabel="All games" title="Loom & Latch" />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-2 pb-16 flex flex-col items-center">
        {/* Mode Switcher & Subtle Meta */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="inline-flex p-1 rounded-full bg-[var(--board-well)] border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setMode("daily")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                mode === "daily"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              Daily Ritual
            </button>
            <button
              type="button"
              onClick={() => setMode("zen")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                mode === "zen"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              Zen Mode
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-[var(--ink-muted)]">
            {mode === "daily" ? (
              <>
                <span>{formatShortBritishDate(todayKey)}</span>
                <span className="tabular-nums">
                  {formatDuration(elapsedSeconds)}
                </span>
                {stats && stats.currentStreak > 0 && (
                  <span className="inline-flex items-center gap-1 text-[var(--accent-emerald)]">
                    <Flame className="w-3.5 h-3.5" />
                    {stats.currentStreak}
                  </span>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClear();
                  setZenCounter((n) => n + 1);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                New Zen loom
              </button>
            )}
          </div>
        </div>

        {/* One-line Zero-Friction Visual Cue */}
        <div className="w-full flex items-center justify-between text-xs text-[var(--ink-muted)] mb-3 px-1">
          <span>
            Match each brass eyelet to its coloured peg &amp; fill the 5×5 loom.
          </span>
          <span className="shrink-0 ml-2 tabular-nums">
            {placedCount}/{puzzle.pieces.length} tiles · {latchedCount}/
            {puzzle.pegs.length} latched
          </span>
        </div>

        {/* 5×5 Tactile Loom Board */}
        <div
          className="w-full max-w-[380px] aspect-square rounded-[28px] p-3.5 sm:p-4 bg-[var(--board-well)] border border-[var(--border-subtle)] shadow-[var(--shadow-soft)] select-none"
          onMouseLeave={() => setHoverCell(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            handleRotateSelected();
          }}
        >
          <div className="grid grid-cols-5 grid-rows-5 gap-2 w-full h-full">
            {Array.from({ length: GRID_SIZE }).map((_, row) =>
              Array.from({ length: GRID_SIZE }).map((__, col) => {
                const key = `${row},${col}`;
                const occupied = boardOccupancy.get(key);
                const peg = puzzle.pegs.find(
                  (p) => p.row === row && p.col === col
                );

                const isGhostCell = ghostPreview?.cells.some(
                  (c) => c.row === row && c.col === col
                );
                const isHintCell = hintCells?.some(
                  (c) => c.row === row && c.col === col
                );

                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={`Row ${row + 1}, Column ${col + 1}${
                      occupied ? `, occupied by ${occupied.piece.colour.name}` : ""
                    }${peg ? `, ${peg.colour.name} latch peg` : ""}`}
                    onMouseEnter={() => setHoverCell({ row, col })}
                    onFocus={() => setHoverCell({ row, col })}
                    onClick={() => handleCellClick(row, col)}
                    className="relative rounded-xl border transition-all duration-150 flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-emerald)]"
                    style={{
                      backgroundColor: occupied
                        ? occupied.piece.colour.fill
                        : "var(--cell-empty)",
                      borderColor: occupied
                        ? occupied.piece.colour.stroke
                        : "var(--cell-border)",
                      boxShadow: occupied
                        ? `inset 0 2px 0 rgba(255,255,255,0.28), 0 2px 6px rgba(16,22,28,0.12)`
                        : "inset 0 1px 2px rgba(16,22,28,0.05)",
                    }}
                  >
                    {/* Magnetic Ghost Preview */}
                    {isGhostCell && ghostPreview && (
                      <span
                        className="absolute inset-0 rounded-[11px] pointer-events-none transition-opacity"
                        style={{
                          backgroundColor: ghostPreview.valid
                            ? selectedPiece?.colour.fill
                            : "#e06c65",
                          opacity: ghostPreview.valid ? 0.36 : 0.28,
                          border: ghostPreview.valid
                            ? `2px solid ${selectedPiece?.colour.fill}`
                            : "2px dashed #e06c65",
                        }}
                      />
                    )}

                    {/* Gentle Nudge Hint Pulse */}
                    {isHintCell && !occupied && (
                      <motion.span
                        initial={{ opacity: 0.2, scale: 0.92 }}
                        animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.95, 1, 0.95] }}
                        transition={{ duration: 1.1, repeat: Infinity }}
                        className="absolute inset-0.5 rounded-lg pointer-events-none"
                        style={{
                          backgroundColor: hintPieceColour ?? "#2ca884",
                        }}
                      />
                    )}

                    {/* Board Latch Peg (unoccupied) */}
                    {peg && !occupied && (
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center pointer-events-none"
                        style={{
                          backgroundColor: `${peg.colour.fill}26`,
                          border: `2.5px solid ${peg.colour.fill}`,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: peg.colour.fill }}
                        />
                      </span>
                    )}

                    {/* Latched Brass Eyelet (occupied) */}
                    {occupied && occupied.isEyelet && (
                      <motion.span
                        initial={{ scale: 0.6 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 420, damping: 22 }}
                        className="w-5 h-5 rounded-full bg-[var(--bg-paper)] ring-2 ring-white/95 shadow-sm flex items-center justify-center pointer-events-none"
                      >
                        {peg && peg.pieceId === occupied.piece.id && (
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: peg.colour.fill }}
                          />
                        )}
                      </motion.span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Action Controls */}
        {!solved && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={handleRotateSelected}
              disabled={!selectedPieceId}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--ink)] hover:border-[var(--border-strong)] disabled:opacity-45 transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              <span>Rotate</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] rounded bg-[var(--bg-canvas)] text-[var(--ink-muted)]">
                R
              </kbd>
            </button>

            <button
              type="button"
              onClick={handleGentleNudge}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Nudge</span>
            </button>

            <button
              type="button"
              onClick={handleClearBoard}
              disabled={placedCount === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--border-strong)] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
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
              className="mt-6 w-full max-w-[420px] rounded-3xl border border-[var(--accent-emerald)]/35 bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] text-center"
            >
              <div className="w-11 h-11 rounded-2xl bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)] flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5" />
              </div>

              <h2 className="font-[family-name:var(--font-plus-jakarta)] text-xl font-semibold text-[var(--ink)]">
                Loom complete.
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {mode === "daily"
                  ? `Solved in ${formatDuration(elapsedSeconds)} with ${moves} snaps. Take a breath — your break is done.`
                  : `Sorted in ${moves} snaps. Smooth, quiet closure.`}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyShare}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--ink)] text-[var(--bg-paper)] hover:opacity-90 transition-opacity cursor-pointer"
                >
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
                </button>

                {mode === "daily" ? (
                  <button
                    type="button"
                    onClick={() => setMode("zen")}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border-subtle)] text-[var(--ink)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>Try Zen Mode</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClear();
                      setZenCounter((n) => n + 1);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border-subtle)] text-[var(--ink)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>Another Zen loom</span>
                  </button>
                )}

                <Link
                  href="/"
                  className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  Back to Hub
                </Link>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Tactile Piece Tray */}
        {!solved && (
          <section
            aria-label="Available tiles"
            className="mt-6 w-full rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)]/80 p-4 sm:p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                Tile tray
              </h2>
              <span className="text-xs text-[var(--ink-muted)]">
                Tap a selected tile to rotate · click placed tiles to lift
              </span>
            </div>

            {unplacedPieces.length === 0 ? (
              <p className="text-sm text-center text-[var(--ink-muted)] py-4">
                All tiles placed.
              </p>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {unplacedPieces.map((piece) => {
                  const isSelected = selectedPieceId === piece.id;
                  const rot = trayRotations[piece.id] ?? 0;

                  return (
                    <motion.button
                      key={piece.id}
                      layout
                      type="button"
                      onClick={() => handleTrayPieceClick(piece.id)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      aria-pressed={isSelected}
                      aria-label={`${piece.colour.name} tile${
                        piece.eyeletIndex !== null ? " with latch eyelet" : ""
                      }${isSelected ? ", selected. Press again to rotate" : ""}`}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-center min-w-[84px] min-h-[84px] cursor-pointer ${
                        isSelected
                          ? "bg-[var(--surface-elevated)] border-[var(--accent-emerald)] ring-2 ring-[var(--accent-emerald)]/30 shadow-sm"
                          : "bg-[var(--board-well)]/60 border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <MiniPiecePreview piece={piece} rotation={rot} />
                    </motion.button>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
