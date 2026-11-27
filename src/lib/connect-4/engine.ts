export const ROWS = 6;
export const COLS = 7;

export type Player = 1 | 2;
export type CellValue = 0 | Player;
export type Board = CellValue[][];

export type Difficulty = "gentle" | "clever" | "master";
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
   Alpha-Beta Minimax AI (Fast, Centre-Aware, 3 Distinct Difficulties)
   ============================================================================ */

const COLUMN_SEARCH_ORDER = [3, 2, 4, 1, 5, 0, 6];

function scoreWindow(window: CellValue[], bot: Player, opp: Player): number {
  let botCount = 0;
  let oppCount = 0;
  let emptyCount = 0;

  for (let i = 0; i < 4; i++) {
    if (window[i] === bot) botCount++;
    else if (window[i] === opp) oppCount++;
    else emptyCount++;
  }

  if (botCount === 4) return 10000;
  if (botCount === 3 && emptyCount === 1) return 14;
  if (botCount === 2 && emptyCount === 2) return 4;

  if (oppCount === 3 && emptyCount === 1) return -18;
  if (oppCount === 2 && emptyCount === 2) return -3;

  return 0;
}

function evaluateBoard(board: Board, bot: Player): number {
  const opp: Player = bot === 1 ? 2 : 1;
  let score = 0;

  // Centre column preference
  const centerCol = Math.floor(COLS / 2);
  let centerCount = 0;
  for (let r = 0; r < ROWS; r++) {
    if (board[r][centerCol] === bot) centerCount++;
  }
  score += centerCount * 6;

  // Horizontal windows
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow(
        [board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]],
        bot,
        opp
      );
    }
  }

  // Vertical windows
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      score += scoreWindow(
        [board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]],
        bot,
        opp
      );
    }
  }

  // Positive slope diagonals
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow(
        [
          board[r][c],
          board[r + 1][c + 1],
          board[r + 2][c + 2],
          board[r + 3][c + 3],
        ],
        bot,
        opp
      );
    }
  }

  // Negative slope diagonals
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      score += scoreWindow(
        [
          board[r][c],
          board[r + 1][c - 1],
          board[r + 2][c - 2],
          board[r + 3][c - 3],
        ],
        bot,
        opp
      );
    }
  }

  return score;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  bot: Player
): { col: number; score: number } {
  const opp: Player = bot === 1 ? 2 : 1;
  const result = checkBoardResult(board);

  if (result.winner === bot) {
    return { col: -1, score: 1_000_000 + depth * 100 };
  }
  if (result.winner === opp) {
    return { col: -1, score: -1_000_000 - depth * 100 };
  }
  if (result.winner === "draw") {
    return { col: -1, score: 0 };
  }
  if (depth === 0) {
    return { col: -1, score: evaluateBoard(board, bot) };
  }

  const validCols = COLUMN_SEARCH_ORDER.filter((c) => board[0][c] === 0);
  let bestCol = validCols[0];

  if (maximizing) {
    let value = -Infinity;
    for (const col of validCols) {
      const row = getDropRow(board, col);
      board[row][col] = bot;
      const evalScore = minimax(board, depth - 1, alpha, beta, false, bot).score;
      board[row][col] = 0;
      if (evalScore > value) {
        value = evalScore;
        bestCol = col;
      }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return { col: bestCol, score: value };
  } else {
    let value = Infinity;
    for (const col of validCols) {
      const row = getDropRow(board, col);
      board[row][col] = opp;
      const evalScore = minimax(board, depth - 1, alpha, beta, true, bot).score;
      board[row][col] = 0;
      if (evalScore < value) {
        value = evalScore;
        bestCol = col;
      }
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return { col: bestCol, score: value };
  }
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
    const win = checkBoardResult(working).winner === bot;
    working[row][col] = 0;
    if (win) return col;
  }

  // 2. Block immediate opponent winning move (Gentle misses 20% to stay approachable)
  for (const col of validCols) {
    const row = getDropRow(working, col);
    working[row][col] = opp;
    const oppWins = checkBoardResult(working).winner === opp;
    working[row][col] = 0;
    if (oppWins) {
      if (difficulty !== "gentle" || rng() < 0.8) {
        return col;
      }
    }
  }

  // 3. Early opening variety on the first 2 bot moves
  const totalPieces = working.flat().filter((v) => v !== 0).length;
  if (totalPieces <= 1) {
    const openings = difficulty === "master" ? [3, 3, 2, 4] : [3, 2, 4, 1, 5];
    const pick = openings[Math.floor(rng() * openings.length)];
    if (validCols.includes(pick)) return pick;
  }

  if (difficulty === "gentle" && rng() < 0.28) {
    // Occasional gentle non-losing exploratory move
    return validCols[Math.floor(rng() * validCols.length)];
  }

  const depth =
    difficulty === "gentle" ? 2 : difficulty === "clever" ? 4 : 5;

  // Score all valid moves to allow deterministic or gentle tie-breaking
  let bestScore = -Infinity;
  let candidates: number[] = [];

  for (const col of validCols) {
    const row = getDropRow(working, col);
    working[row][col] = bot;
    const score = minimax(
      working,
      depth - 1,
      -Infinity,
      Infinity,
      false,
      bot
    ).score;
    working[row][col] = 0;

    if (score > bestScore) {
      bestScore = score;
      candidates = [col];
    } else if (score === bestScore) {
      candidates.push(col);
    }
  }

  return candidates[Math.floor(rng() * candidates.length)];
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
