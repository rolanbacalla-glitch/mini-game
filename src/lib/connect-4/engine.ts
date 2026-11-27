export const ROWS = 6;
export const COLS = 7;

export type Player = 1 | 2;
export type CellValue = 0 | Player;
export type Board = CellValue[][];

export type Difficulty = "gentle" | "clever" | "advanced";
export type OpponentMode = "bot" | "local";
export type EmblemPairId = "cafe" | "critters" | "celestial" | "tactile";

export interface EmblemSpec {
  iconKey:
    | "coffee"
    | "croissant"
    | "cat"
    | "fish"
    | "sun"
    | "moon"
    | "star"
    | "anchor";
  name: string;
  shareGlyph: string;
}

export interface EmblemPair {
  id: EmblemPairId;
  label: string;
  description: string;
  p1: EmblemSpec;
  p2: EmblemSpec;
}

export const EMBLEM_PAIRS: EmblemPair[] = [
  {
    id: "cafe",
    label: "Café",
    description: "Steaming cup vs. curved croissant",
    p1: { iconKey: "coffee", name: "Coffee", shareGlyph: "☕" },
    p2: { iconKey: "croissant", name: "Croissant", shareGlyph: "🥐" },
  },
  {
    id: "critters",
    label: "Critters",
    description: "Pointed-ear cat vs. tapered fish",
    p1: { iconKey: "cat", name: "Cat", shareGlyph: "▲" },
    p2: { iconKey: "fish", name: "Fish", shareGlyph: "◈" },
  },
  {
    id: "celestial",
    label: "Celestial",
    description: "Radiant sun vs. hollow crescent",
    p1: { iconKey: "sun", name: "Sun", shareGlyph: "☀" },
    p2: { iconKey: "moon", name: "Moon", shareGlyph: "☾" },
  },
  {
    id: "tactile",
    label: "Tactile",
    description: "Solid star vs. grooved anchor",
    p1: { iconKey: "star", name: "Star", shareGlyph: "★" },
    p2: { iconKey: "anchor", name: "Anchor", shareGlyph: "◎" },
  },
];

export interface MoveRecord {
  row: number;
  col: number;
  player: Player;
}

export interface BoardResult {
  winner: Player | "draw" | null;
  winningCells: Array<[number, number]>;
}

/** Deterministic FNV-1a hash for daily seeds */
export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 deterministic PRNG */
export function createSeededRng(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailyEmblemPair(dateKey: string): EmblemPair {
  const idx = hashSeed(`daily-four::pair::${dateKey}`) % EMBLEM_PAIRS.length;
  return EMBLEM_PAIRS[idx];
}

export function getEmblemPairById(id: EmblemPairId): EmblemPair {
  return EMBLEM_PAIRS.find((p) => p.id === id) ?? EMBLEM_PAIRS[0];
}

export function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => 0 as CellValue)
  );
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/** Returns lowest available row index in `col`, or -1 if full */
export function getDropRow(board: Board, col: number): number {
  if (col < 0 || col >= COLS) return -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) return r;
  }
  return -1;
}

export function getValidColumns(board: Board): number[] {
  const cols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === 0) cols.push(c);
  }
  return cols;
}

export function dropPiece(
  board: Board,
  col: number,
  player: Player
): { board: Board; row: number } | null {
  const row = getDropRow(board, col);
  if (row === -1) return null;
  const next = cloneBoard(board);
  next[row][col] = player;
  return { board: next, row };
}

/** Checks for 4-in-a-row (or more connected along the winning line) or draw */
export function checkBoardResult(board: Board): BoardResult {
  const directions: Array<[number, number]> = [
    [0, 1], // horizontal
    [1, 0], // vertical
    [1, 1], // diagonal down-right
    [1, -1], // diagonal down-left
  ];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c];
      if (cell === 0) continue;

      for (const [dr, dc] of directions) {
        // Only start from the beginning of a contiguous segment
        const prevR = r - dr;
        const prevC = c - dc;
        if (
          prevR >= 0 &&
          prevR < ROWS &&
          prevC >= 0 &&
          prevC < COLS &&
          board[prevR][prevC] === cell
        ) {
          continue;
        }

        const line: Array<[number, number]> = [[r, c]];
        let nr = r + dr;
        let nc = c + dc;
        while (
          nr >= 0 &&
          nr < ROWS &&
          nc >= 0 &&
          nc < COLS &&
          board[nr][nc] === cell
        ) {
          line.push([nr, nc]);
          nr += dr;
          nc += dc;
        }

        if (line.length >= 4) {
          return { winner: cell, winningCells: line };
        }
      }
    }
  }

  const hasEmpty = board[0].some((v) => v === 0);
  if (!hasEmpty) {
    return { winner: "draw", winningCells: [] };
  }

  return { winner: null, winningCells: [] };
}

/* ============================================================================
   High-Strength Alpha-Beta Minimax AI
   - Fast O(1) last-move 4-in-a-row detection
   - Per-search transposition table with alpha/beta bounds
   - Positional centrality matrix + threat parity + fork & trap awareness
   ============================================================================ */

const COLUMN_SEARCH_ORDER = [3, 2, 4, 1, 5, 0, 6];

// Number of possible 4-in-a-row lines passing through each cell (classic Connect 4 heat map)
const POSITION_WEIGHTS: number[][] = [
  [3, 4, 5, 7, 5, 4, 3],
  [4, 6, 8, 10, 8, 6, 4],
  [5, 8, 11, 13, 11, 8, 5],
  [5, 8, 11, 13, 11, 8, 5],
  [4, 6, 8, 10, 8, 6, 4],
  [3, 4, 5, 7, 5, 4, 3],
];

const WIN_SCORE = 1_000_000;

/** Fast O(1) check whether placing `player` at `(row, col)` creates 4+ in a row */
function isWinningAt(
  board: Board,
  row: number,
  col: number,
  player: Player
): boolean {
  const axes: Array<[number, number]> = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [dr, dc] of axes) {
    let count = 1;

    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }

    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }

    if (count >= 4) return true;
  }

  return false;
}

function encodeBoard(board: Board, maximizing: boolean): string {
  let key = maximizing ? "1:" : "0:";
  for (let r = 0; r < ROWS; r++) {
    const row = board[r];
    key += `${row[0]}${row[1]}${row[2]}${row[3]}${row[4]}${row[5]}${row[6]}`;
  }
  return key;
}

function scoreWindow(
  a: CellValue,
  b: CellValue,
  c: CellValue,
  d: CellValue,
  emptyRow: number,
  bot: Player,
  opp: Player
): number {
  let botCount = 0;
  let oppCount = 0;

  if (a === bot) botCount++;
  else if (a === opp) oppCount++;
  if (b === bot) botCount++;
  else if (b === opp) oppCount++;
  if (c === bot) botCount++;
  else if (c === opp) oppCount++;
  if (d === bot) botCount++;
  else if (d === opp) oppCount++;

  if (botCount > 0 && oppCount > 0) return 0;

  if (botCount === 4) return 50_000;
  if (oppCount === 4) return -50_000;

  // Classic Connect 4 parity bonus: Player 2 benefits from even 0-indexed rows (rows 0, 2, 4 from top)
  const parityBonus =
    emptyRow >= 0 && ((bot === 2 && emptyRow % 2 === 0) || (bot === 1 && emptyRow % 2 === 1))
      ? 10
      : 0;

  if (botCount === 3) return 42 + parityBonus;
  if (botCount === 2) return 7;

  const oppParityPenalty =
    emptyRow >= 0 && ((opp === 2 && emptyRow % 2 === 0) || (opp === 1 && emptyRow % 2 === 1))
      ? 12
      : 0;

  if (oppCount === 3) return -(52 + oppParityPenalty);
  if (oppCount === 2) return -8;

  return 0;
}

function evaluateBoard(board: Board, bot: Player): number {
  const opp: Player = bot === 1 ? 2 : 1;
  let score = 0;

  // 1. Positional heat-map control
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c];
      if (cell === bot) score += POSITION_WEIGHTS[r][c] * 2;
      else if (cell === opp) score -= POSITION_WEIGHTS[r][c] * 2;
    }
  }

  // 2. Count immediate playable threats (fork awareness)
  let botImmediateThreats = 0;
  let oppImmediateThreats = 0;
  for (let c = 0; c < COLS; c++) {
    const r = getDropRow(board, c);
    if (r === -1) continue;

    board[r][c] = bot;
    if (isWinningAt(board, r, c, bot)) botImmediateThreats++;
    board[r][c] = opp;
    if (isWinningAt(board, r, c, opp)) oppImmediateThreats++;
    board[r][c] = 0;
  }

  if (botImmediateThreats >= 2) score += 450;
  else if (botImmediateThreats === 1) score += 36;

  if (oppImmediateThreats >= 2) score -= 520;
  else if (oppImmediateThreats === 1) score -= 44;

  // 3. Evaluate all 69 four-cell windows
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const a = board[r][c];
      const b = board[r][c + 1];
      const c3 = board[r][c + 2];
      const d = board[r][c + 3];
      const emptyRow = a === 0 || b === 0 || c3 === 0 || d === 0 ? r : -1;
      score += scoreWindow(a, b, c3, d, emptyRow, bot, opp);
    }
  }

  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const a = board[r][c];
      const b = board[r + 1][c];
      const c3 = board[r + 2][c];
      const d = board[r + 3][c];
      score += scoreWindow(a, b, c3, d, -1, bot, opp);
    }
  }

  // Positive slope diagonals
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const a = board[r][c];
      const b = board[r + 1][c + 1];
      const c3 = board[r + 2][c + 2];
      const d = board[r + 3][c + 3];
      const emptyRow =
        a === 0 ? r : b === 0 ? r + 1 : c3 === 0 ? r + 2 : d === 0 ? r + 3 : -1;
      score += scoreWindow(a, b, c3, d, emptyRow, bot, opp);
    }
  }

  // Negative slope diagonals
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      const a = board[r][c];
      const b = board[r + 1][c - 1];
      const c3 = board[r + 2][c - 2];
      const d = board[r + 3][c - 3];
      const emptyRow =
        a === 0 ? r : b === 0 ? r + 1 : c3 === 0 ? r + 2 : d === 0 ? r + 3 : -1;
      score += scoreWindow(a, b, c3, d, emptyRow, bot, opp);
    }
  }

  return score;
}

interface TTEntry {
  depth: number;
  score: number;
  flag: "exact" | "lower" | "upper";
  bestCol: number;
}

const TIME_EXCEEDED = Number.NaN;

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  bot: Player,
  tt: Map<string, TTEntry>,
  deadline: number,
  nodeCounter: { count: number }
): number {
  nodeCounter.count++;
  if ((nodeCounter.count & 2047) === 0 && performance.now() >= deadline) {
    return TIME_EXCEEDED;
  }

  const opp: Player = bot === 1 ? 2 : 1;

  // Check if board is full
  let hasMove = false;
  for (let i = 0; i < COLS; i++) {
    if (board[0][i] === 0) {
      hasMove = true;
      break;
    }
  }
  if (!hasMove) return 0;

  if (depth === 0) {
    return evaluateBoard(board, bot);
  }

  const ttKey = encodeBoard(board, maximizing);
  const cached = tt.get(ttKey);
  const origAlpha = alpha;
  const origBeta = beta;

  if (cached && cached.depth >= depth) {
    if (cached.flag === "exact") return cached.score;
    if (cached.flag === "lower") alpha = Math.max(alpha, cached.score);
    else if (cached.flag === "upper") beta = Math.min(beta, cached.score);
    if (alpha >= beta) return cached.score;
  }

  const mover = maximizing ? bot : opp;

  // Immediate win check at this ply before recursing
  for (const col of COLUMN_SEARCH_ORDER) {
    const row = getDropRow(board, col);
    if (row === -1) continue;
    board[row][col] = mover;
    const winsNow = isWinningAt(board, row, col, mover);
    board[row][col] = 0;
    if (winsNow) {
      return maximizing ? WIN_SCORE + depth * 100 : -(WIN_SCORE + depth * 100);
    }
  }

  // Try transposition-table best move first for massive alpha-beta pruning
  const orderedCols =
    cached && cached.bestCol !== -1
      ? [
          cached.bestCol,
          ...COLUMN_SEARCH_ORDER.filter((c) => c !== cached.bestCol),
        ]
      : COLUMN_SEARCH_ORDER;

  let bestValue = maximizing ? -Infinity : Infinity;
  let bestCol = -1;

  if (maximizing) {
    for (const col of orderedCols) {
      const row = getDropRow(board, col);
      if (row === -1) continue;
      board[row][col] = bot;
      const evalScore = minimax(
        board,
        depth - 1,
        alpha,
        beta,
        false,
        bot,
        tt,
        deadline,
        nodeCounter
      );
      board[row][col] = 0;
      if (Number.isNaN(evalScore)) return TIME_EXCEEDED;
      if (evalScore > bestValue) {
        bestValue = evalScore;
        bestCol = col;
      }
      if (bestValue > alpha) alpha = bestValue;
      if (alpha >= beta) break;
    }
  } else {
    for (const col of orderedCols) {
      const row = getDropRow(board, col);
      if (row === -1) continue;
      board[row][col] = opp;
      const evalScore = minimax(
        board,
        depth - 1,
        alpha,
        beta,
        true,
        bot,
        tt,
        deadline,
        nodeCounter
      );
      board[row][col] = 0;
      if (Number.isNaN(evalScore)) return TIME_EXCEEDED;
      if (evalScore < bestValue) {
        bestValue = evalScore;
        bestCol = col;
      }
      if (bestValue < beta) beta = bestValue;
      if (alpha >= beta) break;
    }
  }

  let flag: TTEntry["flag"] = "exact";
  if (bestValue <= origAlpha) flag = "upper";
  else if (bestValue >= origBeta) flag = "lower";

  if (tt.size < 80_000) {
    tt.set(ttKey, { depth, score: bestValue, flag, bestCol });
  }

  return bestValue;
}

export function chooseBotColumn(
  board: Board,
  bot: Player,
  difficulty: Difficulty,
  rng: () => number = Math.random
): number {
  const validCols = COLUMN_SEARCH_ORDER.filter((c) => board[0][c] === 0);
  if (validCols.length === 0) return -1;
  if (validCols.length === 1) return validCols[0];

  const working = cloneBoard(board);
  const opp: Player = bot === 1 ? 2 : 1;

  // 1. Always take an immediate winning move
  for (const col of validCols) {
    const row = getDropRow(working, col);
    working[row][col] = bot;
    const win = isWinningAt(working, row, col, bot);
    working[row][col] = 0;
    if (win) return col;
  }

  // 2. Block immediate opponent winning move (Gentle misses 20% to stay approachable)
  for (const col of validCols) {
    const row = getDropRow(working, col);
    working[row][col] = opp;
    const oppWins = isWinningAt(working, row, col, opp);
    working[row][col] = 0;
    if (oppWins) {
      if (difficulty !== "gentle" || rng() < 0.8) {
        return col;
      }
    }
  }

  // Count pieces played for opening book & adaptive endgame search
  let totalPieces = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (working[r][c] !== 0) totalPieces++;
    }
  }

  // 3. Opening book: Advanced always claims the centre column
  if (totalPieces <= 1) {
    if (difficulty === "advanced") {
      return validCols.includes(3) ? 3 : validCols[0];
    }
    const openings = [3, 2, 4, 1, 5];
    const pick = openings[Math.floor(rng() * openings.length)];
    if (validCols.includes(pick)) return pick;
  }

  if (difficulty === "gentle" && rng() < 0.25) {
    return validCols[Math.floor(rng() * validCols.length)];
  }

  const maxDepth =
    difficulty === "gentle" ? 2 : difficulty === "clever" ? 5 : 9;
  const timeBudgetMs =
    difficulty === "gentle" ? 40 : difficulty === "clever" ? 110 : 220;

  const deadline = performance.now() + timeBudgetMs;
  const tt = new Map<string, TTEntry>();
  const nodeCounter = { count: 0 };

  let bestOverallCol = validCols[0];
  let orderedRootCols = [...validCols];

  // Iterative deepening: completes depth 3..maxDepth cleanly within timeBudgetMs
  const startDepth = difficulty === "gentle" ? 2 : 3;
  for (let depth = startDepth; depth <= maxDepth; depth++) {
    let alpha = -Infinity;
    let bestScore = -Infinity;
    let bestColThisDepth = orderedRootCols[0];
    let timedOut = false;

    for (const col of orderedRootCols) {
      const row = getDropRow(working, col);
      working[row][col] = bot;
      const score = minimax(
        working,
        depth - 1,
        alpha,
        Infinity,
        false,
        bot,
        tt,
        deadline,
        nodeCounter
      );
      working[row][col] = 0;

      if (Number.isNaN(score)) {
        timedOut = true;
        break;
      }

      if (score > bestScore) {
        bestScore = score;
        bestColThisDepth = col;
      }
      if (bestScore > alpha) {
        alpha = bestScore;
      }
    }

    if (timedOut) break;

    bestOverallCol = bestColThisDepth;
    // Put best move first for the next deeper iteration
    orderedRootCols = [
      bestColThisDepth,
      ...orderedRootCols.filter((c) => c !== bestColThisDepth),
    ];

    // Stop early if a forced win is already found
    if (bestScore >= WIN_SCORE) break;
  }

  return bestOverallCol;
}

/** Builds a pure-symbol, colour-free shareable board snapshot */
export function buildConnect4ShareCard(params: {
  dateLabel: string;
  pair: EmblemPair;
  board: Board;
  winningCells: Array<[number, number]>;
  outcomeLabel: string;
  moves: number;
  durationLabel: string;
}): string {
  const { dateLabel, pair, board, winningCells, outcomeLabel, moves, durationLabel } =
    params;

  const winSet = new Set(winningCells.map(([r, c]) => `${r},${c}`));

  // Find topmost occupied row so the share card stays compact & crisp
  let topRow = ROWS - 1;
  for (let r = 0; r < ROWS; r++) {
    if (board[r].some((v) => v !== 0)) {
      topRow = r;
      break;
    }
  }

  const gridLines: string[] = [];
  for (let r = topRow; r < ROWS; r++) {
    const line = board[r]
      .map((cell, c) => {
        if (cell === 0) return "·";
        const isWin = winSet.has(`${r},${c}`);
        if (cell === 1) return isWin ? `[${pair.p1.shareGlyph}]` : pair.p1.shareGlyph;
        return isWin ? `[${pair.p2.shareGlyph}]` : pair.p2.shareGlyph;
      })
      .join(" ");
    gridLines.push(line);
  }

  return [
    `Connect 4 · ${dateLabel}`,
    `${pair.p1.name} (${pair.p1.shareGlyph}) vs ${pair.p2.name} (${pair.p2.shareGlyph})`,
    `${outcomeLabel} · ${moves} moves · ${durationLabel}`,
    "",
    ...gridLines,
    "",
    "Coffee Break — zero-colour tactile Connect 4",
  ].join("\n");
}
