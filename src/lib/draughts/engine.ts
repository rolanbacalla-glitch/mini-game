export const BOARD_SIZE = 8;

export type Player = 1 | 2;
export type Difficulty = "gentle" | "clever" | "advanced";
export type OpponentMode = "bot" | "local";

export interface Piece {
  id: string;
  player: Player;
  king: boolean;
}

export type Cell = Piece | null;
export type DraughtsBoard = Cell[][];

export interface Coord {
  row: number;
  col: number;
}

/** A complete legal turn (either a 1-step slide or a 1+ hop capture chain) */
export interface DraughtsMove {
  from: Coord;
  /** Every intermediate & final square the piece lands on */
  path: Coord[];
  /** Every enemy square jumped over in order */
  captured: Coord[];
  /** Whether the moving piece becomes a King at the end of this move */
  promotes: boolean;
}

export interface GameOutcome {
  winner: Player | "draw" | null;
  reason: "captured-all" | "no-moves" | "draw-rule" | null;
}

export function isPlayableSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 1;
}

export function createInitialBoard(): DraughtsBoard {
  const board: DraughtsBoard = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );

  let p2Idx = 1;
  let p1Idx = 1;

  // Player 2 (Bot / Dark grooved) starts on rows 0..2
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isPlayableSquare(r, c)) {
        board[r][c] = { id: `p2-${p2Idx++}`, player: 2, king: false };
      }
    }
  }

  // Player 1 (You / Light ivory) starts on rows 5..7
  for (let r = 5; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isPlayableSquare(r, c)) {
        board[r][c] = { id: `p1-${p1Idx++}`, player: 1, king: false };
      }
    }
  }

  return board;
}

export function cloneBoard(board: DraughtsBoard): DraughtsBoard {
  return board.map((row) =>
    row.map((cell) => (cell ? { ...cell } : null))
  );
}

function getMoveDirections(piece: Piece): Array<[number, number]> {
  if (piece.king) {
    return [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  }
  return piece.player === 1
    ? [
        [-1, -1],
        [-1, 1],
      ]
    : [
        [1, -1],
        [1, 1],
      ];
}

function isPromotionRow(player: Player, row: number): boolean {
  return (player === 1 && row === 0) || (player === 2 && row === BOARD_SIZE - 1);
}

/** Recursively collects all maximal capture chains starting from `(row, col)` */
function collectCaptureChains(
  board: DraughtsBoard,
  origin: Coord,
  current: Coord,
  piece: Piece,
  path: Coord[],
  captured: Coord[],
  results: DraughtsMove[]
): void {
  const dirs = getMoveDirections(piece);
  let extended = false;

  for (const [dr, dc] of dirs) {
    const midR = current.row + dr;
    const midC = current.col + dc;
    const landR = current.row + dr * 2;
    const landC = current.col + dc * 2;

    if (
      landR < 0 ||
      landR >= BOARD_SIZE ||
      landC < 0 ||
      landC >= BOARD_SIZE
    ) {
      continue;
    }

    const midPiece = board[midR][midC];
    const landCell = board[landR][landC];

    if (midPiece && midPiece.player !== piece.player && landCell === null) {
      extended = true;

      // Temporarily execute jump on board
      const savedMid = midPiece;
      board[current.row][current.col] = null;
      board[midR][midC] = null;

      const promotesNow = !piece.king && isPromotionRow(piece.player, landR);
      const nextPiece: Piece = promotesNow ? { ...piece, king: true } : piece;
      board[landR][landC] = nextPiece;

      const nextPath = [...path, { row: landR, col: landC }];
      const nextCaptured = [...captured, { row: midR, col: midC }];

      // In English Draughts, crowning immediately ends the turn
      if (promotesNow) {
        results.push({
          from: origin,
          path: nextPath,
          captured: nextCaptured,
          promotes: true,
        });
      } else {
        collectCaptureChains(
          board,
          origin,
          { row: landR, col: landC },
          nextPiece,
          nextPath,
          nextCaptured,
          results
        );
      }

      // Undo temporary jump
      board[landR][landC] = null;
      board[midR][midC] = savedMid;
      board[current.row][current.col] = piece;
    }
  }

  if (!extended && captured.length > 0) {
    results.push({
      from: origin,
      path,
      captured,
      promotes: false,
    });
  }
}

/**
 * Generates all legal moves for `player`.
 * Enforces mandatory captures (if any jump exists, only jumps are returned).
 */
export function getLegalMoves(
  board: DraughtsBoard,
  player: Player
): DraughtsMove[] {
  const captures: DraughtsMove[] = [];
  const working = cloneBoard(board);

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = working[r][c];
      if (!piece || piece.player !== player) continue;
      collectCaptureChains(
        working,
        { row: r, col: c },
        { row: r, col: c },
        piece,
        [],
        [],
        captures
      );
    }
  }

  if (captures.length > 0) {
    return captures;
  }

  const slides: DraughtsMove[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (!piece || piece.player !== player) continue;
      const dirs = getMoveDirections(piece);

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 &&
          nr < BOARD_SIZE &&
          nc >= 0 &&
          nc < BOARD_SIZE &&
          board[nr][nc] === null
        ) {
          slides.push({
            from: { row: r, col: c },
            path: [{ row: nr, col: nc }],
            captured: [],
            promotes: !piece.king && isPromotionRow(player, nr),
          });
        }
      }
    }
  }

  return slides;
}

/** Applies a complete move (or single hop step) to a cloned board */
export function applyMove(
  board: DraughtsBoard,
  move: DraughtsMove
): DraughtsBoard {
  const next = cloneBoard(board);
  const piece = next[move.from.row][move.from.col];
  if (!piece) return next;

  next[move.from.row][move.from.col] = null;
  for (const cap of move.captured) {
    next[cap.row][cap.col] = null;
  }

  const dest = move.path[move.path.length - 1];
  const promoted = piece.king || move.promotes || isPromotionRow(piece.player, dest.row);
  next[dest.row][dest.col] = { ...piece, king: promoted };
  return next;
}

/** Applies one single step of a multi-jump move (for smooth animated hops & interactive step-by-step capture) */
export function applySingleStep(
  board: DraughtsBoard,
  from: Coord,
  to: Coord,
  capturedSquare: Coord | null
): { board: DraughtsBoard; promoted: boolean } {
  const next = cloneBoard(board);
  const piece = next[from.row][from.col];
  if (!piece) return { board: next, promoted: false };

  next[from.row][from.col] = null;
  if (capturedSquare) {
    next[capturedSquare.row][capturedSquare.col] = null;
  }

  const promoted = !piece.king && isPromotionRow(piece.player, to.row);
  next[to.row][to.col] = { ...piece, king: piece.king || promoted };
  return { board: next, promoted };
}

export function countPieces(board: DraughtsBoard): {
  p1Men: number;
  p1Kings: number;
  p2Men: number;
  p2Kings: number;
} {
  let p1Men = 0;
  let p1Kings = 0;
  let p2Men = 0;
  let p2Kings = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (!cell) continue;
      if (cell.player === 1) {
        if (cell.king) p1Kings++;
        else p1Men++;
      } else {
        if (cell.king) p2Kings++;
        else p2Men++;
      }
    }
  }

  return { p1Men, p1Kings, p2Men, p2Kings };
}

export function evaluateOutcome(
  board: DraughtsBoard,
  playerToMove: Player,
  quietMovesWithoutProgress: number
): GameOutcome {
  const counts = countPieces(board);
  const p1Total = counts.p1Men + counts.p1Kings;
  const p2Total = counts.p2Men + counts.p2Kings;

  if (p1Total === 0) return { winner: 2, reason: "captured-all" };
  if (p2Total === 0) return { winner: 1, reason: "captured-all" };

  const legal = getLegalMoves(board, playerToMove);
  if (legal.length === 0) {
    return {
      winner: playerToMove === 1 ? 2 : 1,
      reason: "no-moves",
    };
  }

  if (quietMovesWithoutProgress >= 40) {
    return { winner: "draw", reason: "draw-rule" };
  }

  return { winner: null, reason: null };
}

/* ============================================================================
   High-Strength Advanced Draughts AI
   - Iterative deepening alpha-beta search (up to 10 ply) with 240ms budget
   - Transposition table with best-move ordering
   - Quiescence search over forced capture sequences (zero horizon blunders!)
   - Expert positional heuristics: back-rank bridge, centrality, promotion drive,
     diagonal backing cohesion, mobility, and endgame king-chase distance
   ============================================================================ */

const WIN_SCORE = 100_000;
const TIME_EXCEEDED = Number.NaN;

// Fast compact 32-char board key (only the 32 dark playable squares!)
function encodeBoard(board: DraughtsBoard, playerToMove: Player): string {
  let key = playerToMove === 2 ? "2:" : "1:";
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = (r + 1) % 2; c < BOARD_SIZE; c += 2) {
      const cell = board[r][c];
      if (!cell) key += ".";
      else if (cell.player === 1) key += cell.king ? "W" : "w";
      else key += cell.king ? "B" : "b";
    }
  }
  return key;
}

function moveKey(move: DraughtsMove): string {
  const dest = move.path[move.path.length - 1];
  return `${move.from.row},${move.from.col}-${dest.row},${dest.col}-${move.captured.length}`;
}

function evaluateBoard(board: DraughtsBoard, bot: Player): number {
  const opp: Player = bot === 1 ? 2 : 1;
  let score = 0;

  let botPieces = 0;
  let oppPieces = 0;
  const botKings: Coord[] = [];
  const oppCoords: Coord[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = (r + 1) % 2; c < BOARD_SIZE; c += 2) {
      const cell = board[r][c];
      if (!cell) continue;

      const isBot = cell.player === bot;
      if (isBot) botPieces++;
      else oppPieces++;

      const sign = isBot ? 1 : -1;

      if (cell.king) {
        score += sign * 192;
        // Kings dominate the centre of the board
        const centerDist = Math.abs(r - 3.5) + Math.abs(c - 3.5);
        score += sign * Math.round((7 - centerDist) * 5);
        if (isBot) botKings.push({ row: r, col: c });
        else oppCoords.push({ row: r, col: c });
      } else {
        score += sign * 100;
        if (!isBot) oppCoords.push({ row: r, col: c });

        // Advancement bonus toward crowning (quadratic push in upper half)
        const progress = cell.player === 2 ? r : 7 - r; // 0..6
        score += sign * (progress * 5 + (progress >= 4 ? (progress - 3) * 8 : 0));

        // Back-rank bridge defence (keep home row guarded until late game)
        const isHomeRow =
          (cell.player === 2 && r === 0) || (cell.player === 1 && r === 7);
        if (isHomeRow) {
          // Central back-rank guard squares (cols 1,3,5) are especially strong
          const isBridgeSquare = c >= 1 && c <= 6;
          score += sign * (isBridgeSquare ? 18 : 10);
        }

        // Centre control bonus
        if (r >= 2 && r <= 5 && c >= 2 && c <= 5) {
          score += sign * 12;
        } else if (c === 0 || c === 7) {
          // Edge squares cannot be jumped over
          score += sign * 5;
        }

        // Diagonal support / cohesion: protected from behind by friendly piece
        const backR = cell.player === 2 ? r - 1 : r + 1;
        if (backR >= 0 && backR < BOARD_SIZE) {
          let supporters = 0;
          if (c > 0 && board[backR][c - 1]?.player === cell.player) supporters++;
          if (c < BOARD_SIZE - 1 && board[backR][c + 1]?.player === cell.player)
            supporters++;
          score += sign * supporters * 6;
        }
      }
    }
  }

  if (oppPieces === 0) return WIN_SCORE;
  if (botPieces === 0) return -WIN_SCORE;

  // Endgame advantage amplification: trading pieces when ahead wins cleanly
  const totalPieces = botPieces + oppPieces;
  if (botPieces > oppPieces && totalPieces <= 12) {
    score += (botPieces - oppPieces) * (14 - totalPieces) * 4;
  } else if (oppPieces > botPieces && totalPieces <= 12) {
    score -= (oppPieces - botPieces) * (14 - totalPieces) * 4;
  }

  // Endgame king-hunt: pull ahead bot kings closer to remaining enemy pieces
  if (totalPieces <= 10 && botPieces >= oppPieces && botKings.length > 0 && oppCoords.length > 0) {
    let distSum = 0;
    for (const k of botKings) {
      let nearest = 14;
      for (const e of oppCoords) {
        const d = Math.abs(k.row - e.row) + Math.abs(k.col - e.col);
        if (d < nearest) nearest = d;
      }
      distSum += nearest;
    }
    score -= distSum * 4;
  }

  // Subtle mobility check (open options)
  const botMoves = getLegalMoves(board, bot).length;
  const oppMoves = getLegalMoves(board, opp).length;
  if (oppMoves === 0) return WIN_SCORE - 50;
  if (botMoves === 0) return -(WIN_SCORE - 50);
  score += (botMoves - oppMoves) * 3;

  return score;
}

function orderMoves(moves: DraughtsMove[], preferredKey: string | null): DraughtsMove[] {
  if (moves.length <= 1) return moves;
  return [...moves].sort((a, b) => {
    if (preferredKey) {
      const aPref = moveKey(a) === preferredKey ? 1 : 0;
      const bPref = moveKey(b) === preferredKey ? 1 : 0;
      if (aPref !== bPref) return bPref - aPref;
    }
    // Prefer multi-captures, then promotions, then central destinations
    if (b.captured.length !== a.captured.length) {
      return b.captured.length - a.captured.length;
    }
    if (b.promotes !== a.promotes) {
      return b.promotes ? 1 : -1;
    }
    const aDest = a.path[a.path.length - 1];
    const bDest = b.path[b.path.length - 1];
    const aCenter = Math.abs(aDest.row - 3.5) + Math.abs(aDest.col - 3.5);
    const bCenter = Math.abs(bDest.row - 3.5) + Math.abs(bDest.col - 3.5);
    return aCenter - bCenter;
  });
}

interface TTEntry {
  depth: number;
  score: number;
  flag: "exact" | "lower" | "upper";
  bestMoveKey: string | null;
}

/** Quiescence search: resolves forced captures past the search horizon so the AI never walks into blunder trades */
function quiescence(
  board: DraughtsBoard,
  alpha: number,
  beta: number,
  maximizing: boolean,
  bot: Player,
  qDepth: number,
  deadline: number,
  nodeCounter: { count: number }
): number {
  nodeCounter.count++;
  if ((nodeCounter.count & 1023) === 0 && performance.now() >= deadline) {
    return TIME_EXCEEDED;
  }

  const mover: Player = maximizing ? bot : bot === 1 ? 2 : 1;
  const moves = getLegalMoves(board, mover);

  if (moves.length === 0) {
    return maximizing ? -(WIN_SCORE - 200) : WIN_SCORE - 200;
  }

  // Only forced captures continue in quiescence
  const hasCaptures = moves[0].captured.length > 0;
  if (!hasCaptures || qDepth <= 0) {
    return evaluateBoard(board, bot);
  }

  const ordered = orderMoves(moves, null);

  if (maximizing) {
    let best = -Infinity;
    for (const move of ordered) {
      const next = applyMove(board, move);
      const score = quiescence(
        next,
        alpha,
        beta,
        false,
        bot,
        qDepth - 1,
        deadline,
        nodeCounter
      );
      if (Number.isNaN(score)) return TIME_EXCEEDED;
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of ordered) {
      const next = applyMove(board, move);
      const score = quiescence(
        next,
        alpha,
        beta,
        true,
        bot,
        qDepth - 1,
        deadline,
        nodeCounter
      );
      if (Number.isNaN(score)) return TIME_EXCEEDED;
      if (score < best) best = score;
      if (best < beta) beta = best;
      if (alpha >= beta) break;
    }
    return best;
  }
}

function alphaBeta(
  board: DraughtsBoard,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  bot: Player,
  useQuiescence: boolean,
  tt: Map<string, TTEntry>,
  deadline: number,
  nodeCounter: { count: number }
): number {
  nodeCounter.count++;
  if ((nodeCounter.count & 1023) === 0 && performance.now() >= deadline) {
    return TIME_EXCEEDED;
  }

  const mover: Player = maximizing ? bot : bot === 1 ? 2 : 1;
  const legalMoves = getLegalMoves(board, mover);

  if (legalMoves.length === 0) {
    return maximizing ? -(WIN_SCORE + depth * 50) : WIN_SCORE + depth * 50;
  }

  // Single forced move extension: don't burn depth on a forced 1-move reply
  const effectiveDepth = legalMoves.length === 1 && depth <= 5 ? depth : depth;

  if (effectiveDepth <= 0) {
    if (useQuiescence && legalMoves[0].captured.length > 0) {
      return quiescence(board, alpha, beta, maximizing, bot, 6, deadline, nodeCounter);
    }
    return evaluateBoard(board, bot);
  }

  const key = encodeBoard(board, mover);
  const cached = tt.get(key);
  const origAlpha = alpha;
  const origBeta = beta;

  if (cached && cached.depth >= effectiveDepth) {
    if (cached.flag === "exact") return cached.score;
    if (cached.flag === "lower") alpha = Math.max(alpha, cached.score);
    else if (cached.flag === "upper") beta = Math.min(beta, cached.score);
    if (alpha >= beta) return cached.score;
  }

  const ordered = orderMoves(legalMoves, cached?.bestMoveKey ?? null);
  let bestVal = maximizing ? -Infinity : Infinity;
  let bestKey: string | null = null;

  const nextDepth = legalMoves.length === 1 ? effectiveDepth : effectiveDepth - 1;

  if (maximizing) {
    for (const move of ordered) {
      const next = applyMove(board, move);
      const score = alphaBeta(
        next,
        nextDepth,
        alpha,
        beta,
        false,
        bot,
        useQuiescence,
        tt,
        deadline,
        nodeCounter
      );
      if (Number.isNaN(score)) return TIME_EXCEEDED;
      if (score > bestVal) {
        bestVal = score;
        bestKey = moveKey(move);
      }
      if (bestVal > alpha) alpha = bestVal;
      if (alpha >= beta) break;
    }
  } else {
    for (const move of ordered) {
      const next = applyMove(board, move);
      const score = alphaBeta(
        next,
        nextDepth,
        alpha,
        beta,
        true,
        bot,
        useQuiescence,
        tt,
        deadline,
        nodeCounter
      );
      if (Number.isNaN(score)) return TIME_EXCEEDED;
      if (score < bestVal) {
        bestVal = score;
        bestKey = moveKey(move);
      }
      if (bestVal < beta) beta = bestVal;
      if (alpha >= beta) break;
    }
  }

  let flag: TTEntry["flag"] = "exact";
  if (bestVal <= origAlpha) flag = "upper";
  else if (bestVal >= origBeta) flag = "lower";

  if (tt.size < 65_000) {
    tt.set(key, { depth: effectiveDepth, score: bestVal, flag, bestMoveKey: bestKey });
  }

  return bestVal;
}

export function chooseDraughtsMove(
  board: DraughtsBoard,
  bot: Player,
  difficulty: Difficulty,
  rng: () => number = Math.random
): DraughtsMove | null {
  const legalMoves = getLegalMoves(board, bot);
  if (legalMoves.length === 0) return null;
  if (legalMoves.length === 1) return legalMoves[0];

  if (difficulty === "gentle" && legalMoves[0].captured.length === 0 && rng() < 0.25) {
    return legalMoves[Math.floor(rng() * legalMoves.length)];
  }

  const maxDepth =
    difficulty === "gentle" ? 2 : difficulty === "clever" ? 5 : 10;
  const timeBudgetMs =
    difficulty === "gentle" ? 45 : difficulty === "clever" ? 120 : 240;
  const useQuiescence = difficulty !== "gentle";

  const deadline = performance.now() + timeBudgetMs;
  const tt = new Map<string, TTEntry>();
  const nodeCounter = { count: 0 };

  let orderedMoves = orderMoves(legalMoves, null);
  let bestOverallMove = orderedMoves[0];

  const startDepth = difficulty === "gentle" ? 2 : 3;

  for (let depth = startDepth; depth <= maxDepth; depth++) {
    let alpha = -Infinity;
    let bestScore = -Infinity;
    let bestMoveThisDepth = orderedMoves[0];
    let timedOut = false;

    for (const move of orderedMoves) {
      const next = applyMove(board, move);
      const score = alphaBeta(
        next,
        depth - 1,
        alpha,
        Infinity,
        false,
        bot,
        useQuiescence,
        tt,
        deadline,
        nodeCounter
      );

      if (Number.isNaN(score)) {
        timedOut = true;
        break;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMoveThisDepth = move;
      }
      if (bestScore > alpha) {
        alpha = bestScore;
      }
    }

    if (timedOut) break;

    bestOverallMove = bestMoveThisDepth;
    const bestKey = moveKey(bestMoveThisDepth);
    orderedMoves = [
      bestMoveThisDepth,
      ...orderedMoves.filter((m) => moveKey(m) !== bestKey),
    ];

    if (bestScore >= WIN_SCORE) break;
  }

  return bestOverallMove;
}

/** Builds a clean monochrome shareable summary of a completed Draughts match */
export function buildDraughtsShareCard(params: {
  dateLabel: string;
  outcomeLabel: string;
  turns: number;
  capturedByP1: number;
  capturedByP2: number;
  durationLabel: string;
}): string {
  const {
    dateLabel,
    outcomeLabel,
    turns,
    capturedByP1,
    capturedByP2,
    durationLabel,
  } = params;

  return [
    `Draughts · ${dateLabel}`,
    outcomeLabel,
    `${turns} turns · ${durationLabel}`,
    `Captured: ○ ${capturedByP1} · ● ${capturedByP2}`,
    "",
    "Coffee Break — tactile monochrome Draughts",
  ].join("\n");
}
