export const CHROMA_GRID_SIZE = 5;

export interface OklchColor {
  l: number; // 0..1
  c: number; // 0..0.3
  h: number; // 0..360
}

export interface ChromaPalette {
  id: string;
  name: string;
  subtitle: string;
  topLeft: OklchColor;
  topRight: OklchColor;
  bottomLeft: OklchColor;
  bottomRight: OklchColor;
}

export interface ChromaSwatch {
  /** Target index 0..24 in the solved 5x5 matrix */
  targetIndex: number;
  cssColor: string;
  locked: boolean;
}

export interface ChromaPuzzle {
  seed: string;
  palette: ChromaPalette;
  /** Current board arrangement (length 25) */
  initialBoard: ChromaSwatch[];
  /** Reference solved board (length 25) */
  solvedBoard: ChromaSwatch[];
}

const PALETTES: ChromaPalette[] = [
  {
    id: "cornish-tide",
    name: "Cornish Tide",
    subtitle: "Seafoam glass to deep Atlantic indigo",
    topLeft: { l: 0.84, c: 0.09, h: 165 },
    topRight: { l: 0.72, c: 0.14, h: 215 },
    bottomLeft: { l: 0.62, c: 0.13, h: 190 },
    bottomRight: { l: 0.42, c: 0.15, h: 258 },
  },
  {
    id: "highland-heather",
    name: "Highland Heather",
    subtitle: "Misty lilac into twilight plum & warm amber",
    topLeft: { l: 0.85, c: 0.08, h: 295 },
    topRight: { l: 0.74, c: 0.14, h: 350 },
    bottomLeft: { l: 0.50, c: 0.14, h: 268 },
    bottomRight: { l: 0.68, c: 0.15, h: 55 },
  },
  {
    id: "kyoto-moss",
    name: "Kyoto Moss",
    subtitle: "Morning matcha, cedar bark, and river stone",
    topLeft: { l: 0.86, c: 0.10, h: 135 },
    topRight: { l: 0.78, c: 0.12, h: 88 },
    bottomLeft: { l: 0.48, c: 0.11, h: 162 },
    bottomRight: { l: 0.56, c: 0.13, h: 42 },
  },
  {
    id: "terracotta-dusk",
    name: "Terracotta Dusk",
    subtitle: "Sunbaked clay fading into dusk violet",
    topLeft: { l: 0.84, c: 0.11, h: 72 },
    topRight: { l: 0.68, c: 0.16, h: 34 },
    bottomLeft: { l: 0.64, c: 0.13, h: 355 },
    bottomRight: { l: 0.44, c: 0.14, h: 282 },
  },
  {
    id: "cotswold-honey",
    name: "Cotswold Honey",
    subtitle: "Warm limestone, ochre fields, and sage hedgerows",
    topLeft: { l: 0.88, c: 0.09, h: 92 },
    topRight: { l: 0.74, c: 0.14, h: 52 },
    bottomLeft: { l: 0.66, c: 0.11, h: 148 },
    bottomRight: { l: 0.48, c: 0.12, h: 210 },
  },
  {
    id: "obsidian-aurora",
    name: "Obsidian Aurora",
    subtitle: "Northern emerald ribbons over arctic slate",
    topLeft: { l: 0.82, c: 0.13, h: 158 },
    topRight: { l: 0.72, c: 0.15, h: 265 },
    bottomLeft: { l: 0.46, c: 0.11, h: 205 },
    bottomRight: { l: 0.40, c: 0.14, h: 315 },
  },
  {
    id: "botanical-mist",
    name: "Botanical Mist",
    subtitle: "Eucalyptus leaf, blush peony, and slate rain",
    topLeft: { l: 0.85, c: 0.08, h: 172 },
    topRight: { l: 0.82, c: 0.10, h: 15 },
    bottomLeft: { l: 0.52, c: 0.11, h: 230 },
    bottomRight: { l: 0.56, c: 0.14, h: 342 },
  },
  {
    id: "aegean-linen",
    name: "Aegean Linen",
    subtitle: "Sunlit chalk, cerulean bay, and apricot stone",
    topLeft: { l: 0.88, c: 0.06, h: 85 },
    topRight: { l: 0.70, c: 0.15, h: 240 },
    bottomLeft: { l: 0.72, c: 0.13, h: 42 },
    bottomRight: { l: 0.45, c: 0.15, h: 258 },
  },
];

function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

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

/** Shortest-arc hue interpolation in degrees */
function lerpHue(h1: number, h2: number, t: number): number {
  let diff = ((h2 - h1 + 540) % 360) - 180;
  if (diff < -180) diff += 360;
  return (h1 + diff * t + 360) % 360;
}

function lerpOklch(a: OklchColor, b: OklchColor, t: number): OklchColor {
  return {
    l: a.l + (b.l - a.l) * t,
    c: a.c + (b.c - a.c) * t,
    h: lerpHue(a.h, b.h, t),
  };
}

function formatOklch(col: OklchColor): string {
  return `oklch(${col.l.toFixed(3)} ${col.c.toFixed(3)} ${col.h.toFixed(1)})`;
}

const LOCKED_CORNERS = new Set([0, 4, 20, 24]);

export function generateChromaPuzzle(seed: string): ChromaPuzzle {
  const rng = createRng(`chroma-calm::${seed}`);
  const palette = PALETTES[Math.floor(rng() * PALETTES.length)];

  const solvedBoard: ChromaSwatch[] = [];
  for (let r = 0; r < CHROMA_GRID_SIZE; r++) {
    const ty = r / (CHROMA_GRID_SIZE - 1);
    const leftEdge = lerpOklch(palette.topLeft, palette.bottomLeft, ty);
    const rightEdge = lerpOklch(palette.topRight, palette.bottomRight, ty);

    for (let c = 0; c < CHROMA_GRID_SIZE; c++) {
      const tx = c / (CHROMA_GRID_SIZE - 1);
      const cellColour = lerpOklch(leftEdge, rightEdge, tx);
      const idx = r * CHROMA_GRID_SIZE + c;
      solvedBoard.push({
        targetIndex: idx,
        cssColor: formatOklch(cellColour),
        locked: LOCKED_CORNERS.has(idx),
      });
    }
  }

  // Shuffle only unlocked indices deterministically
  const movableIndices: number[] = [];
  for (let i = 0; i < solvedBoard.length; i++) {
    if (!solvedBoard[i].locked) movableIndices.push(i);
  }

  const shuffledMovable = [...movableIndices];
  for (let i = shuffledMovable.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffledMovable[i], shuffledMovable[j]] = [
      shuffledMovable[j],
      shuffledMovable[i],
    ];
  }

  // Ensure puzzle isn't trivially solved
  let matches = 0;
  for (let i = 0; i < movableIndices.length; i++) {
    if (shuffledMovable[i] === movableIndices[i]) matches++;
  }
  if (matches > 4) {
    const first = shuffledMovable.shift()!;
    shuffledMovable.push(first);
  }

  const initialBoard: ChromaSwatch[] = [...solvedBoard];
  movableIndices.forEach((slotIdx, i) => {
    initialBoard[slotIdx] = solvedBoard[shuffledMovable[i]];
  });

  return {
    seed,
    palette,
    initialBoard,
    solvedBoard,
  };
}

export function countAlignedMovable(board: ChromaSwatch[]): number {
  let aligned = 0;
  for (let i = 0; i < board.length; i++) {
    if (!board[i].locked && board[i].targetIndex === i) {
      aligned++;
    }
  }
  return aligned;
}

export function isChromaSolved(board: ChromaSwatch[]): boolean {
  return board.every((swatch, idx) => swatch.targetIndex === idx);
}

export function buildChromaShareCard(
  paletteName: string,
  dateLabel: string,
  swaps: number,
  durationLabel: string
): string {
  const row = "🟦🟩🟨🟧🟪";
  return [
    `Chroma Calm · ${dateLabel}`,
    `${paletteName} · ${swaps} swaps · ${durationLabel}`,
    "",
    row,
  ].join("\n");
}
