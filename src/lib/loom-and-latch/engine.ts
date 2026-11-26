export const GRID_SIZE = 5;

export interface Coord {
  row: number;
  col: number;
}

export interface TilePalette {
  id: string;
  name: string;
  fill: string;
  stroke: string;
  emoji: string;
}

export const TILE_PALETTE: TilePalette[] = [
  {
    id: "emerald",
    name: "Sage Emerald",
    fill: "var(--tile-emerald-fill)",
    stroke: "var(--tile-emerald-stroke)",
    emoji: "🟩",
  },
  {
    id: "lavender",
    name: "Soft Lavender",
    fill: "var(--tile-lavender-fill)",
    stroke: "var(--tile-lavender-stroke)",
    emoji: "🟪",
  },
  {
    id: "terracotta",
    name: "Warm Terracotta",
    fill: "var(--tile-terracotta-fill)",
    stroke: "var(--tile-terracotta-stroke)",
    emoji: "🟧",
  },
  {
    id: "slate",
    name: "Harbour Slate",
    fill: "var(--tile-slate-fill)",
    stroke: "var(--tile-slate-stroke)",
    emoji: "🟦",
  },
  {
    id: "ochre",
    name: "Honey Ochre",
    fill: "var(--tile-ochre-fill)",
    stroke: "var(--tile-ochre-stroke)",
    emoji: "🟨",
  },
  {
    id: "rose",
    name: "Dusty Rose",
    fill: "var(--tile-rose-fill)",
    stroke: "var(--tile-rose-stroke)",
    emoji: "🟥",
  },
  {
    id: "teal",
    name: "Deep Seafoam",
    fill: "var(--tile-teal-fill)",
    stroke: "var(--tile-teal-stroke)",
    emoji: "🟦",
  },
];

export interface LatchPeg {
  row: number;
  col: number;
  pieceId: string;
  colour: TilePalette;
}

export interface PuzzlePiece {
  id: string;
  colour: TilePalette;
  /** Normalised coordinates in the solution orientation */
  solutionCells: Coord[];
  /** Top-left origin of the piece in the reference solution */
  solutionOrigin: Coord;
  /** Initial rotation (0..3 quarter-turns clockwise) applied when placed in tray */
  initialRotation: number;
  /** Index inside cells array that carries a brass eyelet, or null */
  eyeletIndex: number | null;
}

export interface LoomPuzzle {
  seed: string;
  gridSize: number;
  pieces: PuzzlePiece[];
  pegs: LatchPeg[];
}

export interface PlacedPieceState {
  pieceId: string;
  origin: Coord;
  rotation: number; // 0, 1, 2, 3
}

/** Deterministic string hash -> uint32 */
function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 deterministic PRNG */
function createRng(seedStr: string): () => number {
  let a = hashSeed(seedStr) || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Normalise coordinates so min row and min col are 0 */
export function normaliseCells(cells: Coord[]): Coord[] {
  const minR = Math.min(...cells.map((c) => c.row));
  const minC = Math.min(...cells.map((c) => c.col));
  return cells.map((c) => ({ row: c.row - minR, col: c.col - minC }));
}

/** Rotate a normalised shape `steps` quarter-turns clockwise (preserves cell index order for eyelets) */
export function rotateCells(cells: Coord[], steps: number): Coord[] {
  const turns = ((steps % 4) + 4) % 4;
  let current = normaliseCells(cells);

  for (let t = 0; t < turns; t++) {
    const maxR = Math.max(...current.map((c) => c.row));
    current = normaliseCells(
      current.map((c) => ({
        row: c.col,
        col: maxR - c.row,
      }))
    );
  }
  return current;
}

export function getPieceDimensions(cells: Coord[]): { rows: number; cols: number } {
  const maxR = Math.max(...cells.map((c) => c.row));
  const maxC = Math.max(...cells.map((c) => c.col));
  return { rows: maxR + 1, cols: maxC + 1 };
}

const ORTHO_DIRS: Coord[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

const PIECE_SIZE_PROFILES: number[][] = [
  [5, 4, 4, 4, 4, 4],
  [5, 5, 4, 4, 4, 3],
  [5, 4, 4, 4, 5, 3],
  [4, 4, 4, 4, 3, 3, 3],
];

function partitionBoard(rng: () => number): Coord[][] {
  for (let attempt = 0; attempt < 120; attempt++) {
    const profile =
      PIECE_SIZE_PROFILES[Math.floor(rng() * PIECE_SIZE_PROFILES.length)];
    // Shuffle the profile
    const sizes = [...profile];
    for (let i = sizes.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [sizes[i], sizes[j]] = [sizes[j], sizes[i]];
    }

    const grid: number[][] = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(-1)
    );
    const regions: Coord[][] = [];
    let failed = false;

    const countFreeNeighbours = (r: number, c: number): number => {
      let count = 0;
      for (const d of ORTHO_DIRS) {
        const nr = r + d.row;
        const nc = c + d.col;
        if (
          nr >= 0 &&
          nr < GRID_SIZE &&
          nc >= 0 &&
          nc < GRID_SIZE &&
          grid[nr][nc] === -1
        ) {
          count++;
        }
      }
      return count;
    };

    for (let p = 0; p < sizes.length; p++) {
      const targetSize = sizes[p];

      // Choose an unassigned starting cell with minimum free neighbours (avoids 1-cell pockets)
      const candidates: { row: number; col: number; deg: number }[] = [];
      let minDeg = 99;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[r][c] === -1) {
            const deg = countFreeNeighbours(r, c);
            if (deg < minDeg) minDeg = deg;
            candidates.push({ row: r, col: c, deg });
          }
        }
      }

      const bestStarts = candidates.filter((x) => x.deg === minDeg);
      if (bestStarts.length === 0) {
        failed = true;
        break;
      }

      const start = bestStarts[Math.floor(rng() * bestStarts.length)];
      const region: Coord[] = [{ row: start.row, col: start.col }];
      grid[start.row][start.col] = p;

      while (region.length < targetSize) {
        const frontierMap = new Map<string, Coord>();
        for (const cell of region) {
          for (const d of ORTHO_DIRS) {
            const nr = cell.row + d.row;
            const nc = cell.col + d.col;
            if (
              nr >= 0 &&
              nr < GRID_SIZE &&
              nc >= 0 &&
              nc < GRID_SIZE &&
              grid[nr][nc] === -1
            ) {
              frontierMap.set(`${nr},${nc}`, { row: nr, col: nc });
            }
          }
        }

        const frontier = Array.from(frontierMap.values());
        if (frontier.length === 0) {
          failed = true;
          break;
        }

        // Slightly bias toward lower-degree frontier cells to keep remaining space connected
        frontier.sort(
          (a, b) =>
            countFreeNeighbours(a.row, a.col) - countFreeNeighbours(b.row, b.col)
        );
        const pickPool = frontier.slice(0, Math.min(2, frontier.length));
        const nextCell = pickPool[Math.floor(rng() * pickPool.length)];
        grid[nextCell.row][nextCell.col] = p;
        region.push(nextCell);
      }

      if (failed) break;
      regions.push(region);
    }

    if (!failed && regions.length === sizes.length) {
      return regions;
    }
  }

  // Deterministic fallback tiling (guaranteed valid 5x5)
  return [
    [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 0 },
    ],
    [
      { row: 0, col: 3 },
      { row: 0, col: 4 },
      { row: 1, col: 3 },
      { row: 1, col: 4 },
    ],
    [
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 2 },
    ],
    [
      { row: 2, col: 0 },
      { row: 3, col: 0 },
      { row: 4, col: 0 },
      { row: 3, col: 1 },
    ],
    [
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
    ],
    [
      { row: 4, col: 1 },
      { row: 4, col: 2 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
    ],
  ];
}

/** Generate a deterministic, guaranteed-solvable 5×5 Loom & Latch puzzle */
export function generateLoomPuzzle(seed: string): LoomPuzzle {
  const rng = createRng(`loom-and-latch::${seed}`);
  const regions = partitionBoard(rng);

  // Shuffle colour palette deterministically
  const palette = [...TILE_PALETTE];
  for (let i = palette.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [palette[i], palette[j]] = [palette[j], palette[i]];
  }

  // Pick 3 distinct piece indices to receive brass Latch Pegs + Eyelets
  const pieceIndices = regions.map((_, idx) => idx);
  for (let i = pieceIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pieceIndices[i], pieceIndices[j]] = [pieceIndices[j], pieceIndices[i]];
  }
  const latchedSet = new Set(pieceIndices.slice(0, 3));

  const pegs: LatchPeg[] = [];
  const pieces: PuzzlePiece[] = regions.map((region, idx) => {
    const minR = Math.min(...region.map((c) => c.row));
    const minC = Math.min(...region.map((c) => c.col));
    const solutionCells = region.map((c) => ({
      row: c.row - minR,
      col: c.col - minC,
    }));
    const colour = palette[idx % palette.length];
    const id = `piece-${idx}`;

    let eyeletIndex: number | null = null;
    if (latchedSet.has(idx)) {
      eyeletIndex = Math.floor(rng() * region.length);
      const pegCell = region[eyeletIndex];
      pegs.push({
        row: pegCell.row,
        col: pegCell.col,
        pieceId: id,
        colour,
      });
    }

    // Rotate pieces in tray so the player enjoys tactile rotation
    const initialRotation = Math.floor(rng() * 4);

    return {
      id,
      colour,
      solutionCells,
      solutionOrigin: { row: minR, col: minC },
      initialRotation,
      eyeletIndex,
    };
  });

  // Shuffle tray order deterministically
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }

  return {
    seed,
    gridSize: GRID_SIZE,
    pieces,
    pegs,
  };
}

/** Get the absolute board coordinates occupied by a piece placed at `origin` with `rotation` */
export function getAbsoluteCells(
  piece: PuzzlePiece,
  origin: Coord,
  rotation: number
): Coord[] {
  const rotated = rotateCells(piece.solutionCells, rotation);
  return rotated.map((c) => ({
    row: origin.row + c.row,
    col: origin.col + c.col,
  }));
}

export interface PlacementCheck {
  valid: boolean;
  latchedPeg: LatchPeg | null;
  cells: Coord[];
}

/** Check whether placing `piece` at `origin` with `rotation` is legal given other placed pieces */
export function checkPlacement(
  puzzle: LoomPuzzle,
  piece: PuzzlePiece,
  origin: Coord,
  rotation: number,
  placedPieces: Record<string, PlacedPieceState>
): PlacementCheck {
  const cells = getAbsoluteCells(piece, origin, rotation);

  // 1. Bounds check
  for (const c of cells) {
    if (
      c.row < 0 ||
      c.row >= puzzle.gridSize ||
      c.col < 0 ||
      c.col >= puzzle.gridSize
    ) {
      return { valid: false, latchedPeg: null, cells };
    }
  }

  // 2. Overlap check against all OTHER placed pieces
  const occupied = new Set<string>();
  for (const [otherId, state] of Object.entries(placedPieces)) {
    if (otherId === piece.id) continue;
    const otherPiece = puzzle.pieces.find((p) => p.id === otherId);
    if (!otherPiece) continue;
    for (const oc of getAbsoluteCells(otherPiece, state.origin, state.rotation)) {
      occupied.add(`${oc.row},${oc.col}`);
    }
  }

  for (const c of cells) {
    if (occupied.has(`${c.row},${c.col}`)) {
      return { valid: false, latchedPeg: null, cells };
    }
  }

  // 3. Latch peg check:
  //    - A peg can only be covered by its matching piece's eyelet cell.
  let latchedPeg: LatchPeg | null = null;
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    const peg = puzzle.pegs.find((p) => p.row === c.row && p.col === c.col);
    if (peg) {
      const isMatchingEyelet =
        peg.pieceId === piece.id && piece.eyeletIndex === i;
      if (!isMatchingEyelet) {
        return { valid: false, latchedPeg: null, cells };
      }
      latchedPeg = peg;
    }
  }

  return { valid: true, latchedPeg, cells };
}

/** Check if all pieces are placed cleanly on the board */
export function isPuzzleSolved(
  puzzle: LoomPuzzle,
  placedPieces: Record<string, PlacedPieceState>
): boolean {
  if (Object.keys(placedPieces).length !== puzzle.pieces.length) return false;

  const filled = new Set<string>();
  for (const piece of puzzle.pieces) {
    const state = placedPieces[piece.id];
    if (!state) return false;
    const check = checkPlacement(
      puzzle,
      piece,
      state.origin,
      state.rotation,
      placedPieces
    );
    if (!check.valid) return false;
    for (const c of check.cells) {
      filled.add(`${c.row},${c.col}`);
    }
  }

  return filled.size === puzzle.gridSize * puzzle.gridSize;
}

/** Build a spoiler-free mosaic share card */
export function buildShareCard(
  puzzle: LoomPuzzle,
  placedPieces: Record<string, PlacedPieceState>,
  dateLabel: string,
  durationLabel: string,
  moves: number
): string {
  const grid: string[][] = Array.from({ length: puzzle.gridSize }, () =>
    Array(puzzle.gridSize).fill("⬜")
  );

  for (const piece of puzzle.pieces) {
    const state = placedPieces[piece.id];
    if (!state) continue;
    const cells = getAbsoluteCells(piece, state.origin, state.rotation);
    for (const c of cells) {
      if (
        c.row >= 0 &&
        c.row < puzzle.gridSize &&
        c.col >= 0 &&
        c.col < puzzle.gridSize
      ) {
        grid[c.row][c.col] = piece.colour.emoji;
      }
    }
  }

  const mosaic = grid.map((row) => row.join("")).join("\n");
  return `Loom & Latch · ${dateLabel}\n${durationLabel} · ${moves} snaps\n\n${mosaic}`;
}
