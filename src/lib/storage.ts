"use client";

function getPreviousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() - 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

/* ---------- Loom & Latch Persistence ---------- */
export interface DailyCompletionRecord {
  dateKey: string;
  elapsedSeconds: number;
  moves: number;
  usedHint: boolean;
  shareText: string;
  completedAt: string;
}

export interface LoomStats {
  currentStreak: number;
  bestStreak: number;
  totalDailySolved: number;
  totalZenSolved: number;
  lastCompletedDate: string | null;
  history: Record<string, DailyCompletionRecord>;
}

const STATS_KEY = "coffee-break:loom-and-latch:stats:v1";

const DEFAULT_STATS: LoomStats = {
  currentStreak: 0,
  bestStreak: 0,
  totalDailySolved: 0,
  totalZenSolved: 0,
  lastCompletedDate: null,
  history: {},
};

export function loadLoomStats(): LoomStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw) as Partial<LoomStats>;
    return {
      ...DEFAULT_STATS,
      ...parsed,
      history: parsed.history ?? {},
    };
  } catch {
    return DEFAULT_STATS;
  }
}

export function recordDailyCompletion(
  record: DailyCompletionRecord
): LoomStats {
  const stats = loadLoomStats();
  const alreadySolved = Boolean(stats.history[record.dateKey]);
  const updatedHistory = {
    ...stats.history,
    [record.dateKey]: record,
  };

  let currentStreak = stats.currentStreak;
  let totalDailySolved = stats.totalDailySolved;

  if (!alreadySolved) {
    totalDailySolved += 1;
    const yesterday = getPreviousDateKey(record.dateKey);
    if (stats.lastCompletedDate === yesterday) {
      currentStreak = stats.currentStreak + 1;
    } else if (stats.lastCompletedDate === record.dateKey) {
      currentStreak = Math.max(1, stats.currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  const nextStats: LoomStats = {
    ...stats,
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    totalDailySolved,
    lastCompletedDate: record.dateKey,
    history: updatedHistory,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STATS_KEY, JSON.stringify(nextStats));
    } catch {
      // Ignore storage quota errors
    }
  }
  return nextStats;
}

export function recordZenCompletion(): LoomStats {
  const stats = loadLoomStats();
  const nextStats: LoomStats = {
    ...stats,
    totalZenSolved: stats.totalZenSolved + 1,
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STATS_KEY, JSON.stringify(nextStats));
    } catch {
      // Ignore storage quota errors
    }
  }
  return nextStats;
}

/* ---------- Connect 4 Persistence ---------- */
export interface DailyFourCompletionRecord {
  dateKey: string;
  outcome: "win" | "draw";
  moves: number;
  elapsedSeconds: number;
  emblemPairId: string;
  shareText: string;
  completedAt: string;
}

export interface DailyFourStats {
  currentStreak: number;
  bestStreak: number;
  totalDailySolved: number;
  totalZenPlayed: number;
  lastCompletedDate: string | null;
  history: Record<string, DailyFourCompletionRecord>;
}

const DAILY_FOUR_STATS_KEY = "coffee-break:daily-four:stats:v1";

const DEFAULT_DAILY_FOUR_STATS: DailyFourStats = {
  currentStreak: 0,
  bestStreak: 0,
  totalDailySolved: 0,
  totalZenPlayed: 0,
  lastCompletedDate: null,
  history: {},
};

export function loadDailyFourStats(): DailyFourStats {
  if (typeof window === "undefined") return DEFAULT_DAILY_FOUR_STATS;
  try {
    const raw = window.localStorage.getItem(DAILY_FOUR_STATS_KEY);
    if (!raw) return DEFAULT_DAILY_FOUR_STATS;
    const parsed = JSON.parse(raw) as Partial<DailyFourStats>;
    return {
      ...DEFAULT_DAILY_FOUR_STATS,
      ...parsed,
      history: parsed.history ?? {},
    };
  } catch {
    return DEFAULT_DAILY_FOUR_STATS;
  }
}

export function recordDailyFourDailyCompletion(
  record: DailyFourCompletionRecord
): DailyFourStats {
  const stats = loadDailyFourStats();
  const alreadySolved = Boolean(stats.history[record.dateKey]);
  const updatedHistory = {
    ...stats.history,
    [record.dateKey]: record,
  };

  let currentStreak = stats.currentStreak;
  let totalDailySolved = stats.totalDailySolved;

  if (!alreadySolved) {
    totalDailySolved += 1;
    const yesterday = getPreviousDateKey(record.dateKey);
    if (stats.lastCompletedDate === yesterday) {
      currentStreak = stats.currentStreak + 1;
    } else if (stats.lastCompletedDate === record.dateKey) {
      currentStreak = Math.max(1, stats.currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  const nextStats: DailyFourStats = {
    ...stats,
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    totalDailySolved,
    lastCompletedDate: record.dateKey,
    history: updatedHistory,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        DAILY_FOUR_STATS_KEY,
        JSON.stringify(nextStats)
      );
    } catch {
      // Ignore storage quota errors
    }
  }
  return nextStats;
}

export function recordDailyFourZenCompletion(): DailyFourStats {
  const stats = loadDailyFourStats();
  const nextStats: DailyFourStats = {
    ...stats,
    totalZenPlayed: stats.totalZenPlayed + 1,
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        DAILY_FOUR_STATS_KEY,
        JSON.stringify(nextStats)
      );
    } catch {
      // Ignore storage quota errors
    }
  }
  return nextStats;
}

/* ---------- Chroma Calm Persistence ---------- */
export interface ChromaCompletionRecord {
  dateKey: string;
  paletteName: string;
  swaps: number;
  elapsedSeconds: number;
  shareText: string;
  completedAt: string;
}

export interface ChromaStats {
  currentStreak: number;
  bestStreak: number;
  totalDailySolved: number;
  totalZenSolved: number;
  lastCompletedDate: string | null;
  history: Record<string, ChromaCompletionRecord>;
}

const CHROMA_STATS_KEY = "coffee-break:chroma-calm:stats:v1";

const DEFAULT_CHROMA_STATS: ChromaStats = {
  currentStreak: 0,
  bestStreak: 0,
  totalDailySolved: 0,
  totalZenSolved: 0,
  lastCompletedDate: null,
  history: {},
};

export function loadChromaStats(): ChromaStats {
  if (typeof window === "undefined") return DEFAULT_CHROMA_STATS;
  try {
    const raw = window.localStorage.getItem(CHROMA_STATS_KEY);
    if (!raw) return DEFAULT_CHROMA_STATS;
    const parsed = JSON.parse(raw) as Partial<ChromaStats>;
    return {
      ...DEFAULT_CHROMA_STATS,
      ...parsed,
      history: parsed.history ?? {},
    };
  } catch {
    return DEFAULT_CHROMA_STATS;
  }
}

export function recordChromaDailyCompletion(
  record: ChromaCompletionRecord
): ChromaStats {
  const stats = loadChromaStats();
  const alreadySolved = Boolean(stats.history[record.dateKey]);
  const updatedHistory = {
    ...stats.history,
    [record.dateKey]: record,
  };

  let currentStreak = stats.currentStreak;
  let totalDailySolved = stats.totalDailySolved;

  if (!alreadySolved) {
    totalDailySolved += 1;
    const yesterday = getPreviousDateKey(record.dateKey);
    if (stats.lastCompletedDate === yesterday) {
      currentStreak = stats.currentStreak + 1;
    } else if (stats.lastCompletedDate === record.dateKey) {
      currentStreak = Math.max(1, stats.currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  const nextStats: ChromaStats = {
    ...stats,
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    totalDailySolved,
    lastCompletedDate: record.dateKey,
    history: updatedHistory,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CHROMA_STATS_KEY, JSON.stringify(nextStats));
    } catch {
      // Ignore storage quota errors
    }
  }
  return nextStats;
}

export function recordChromaZenCompletion(): ChromaStats {
  const stats = loadChromaStats();
  const nextStats: ChromaStats = {
    ...stats,
    totalZenSolved: stats.totalZenSolved + 1,
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CHROMA_STATS_KEY, JSON.stringify(nextStats));
    } catch {
      // Ignore storage quota errors
    }
  }
  return nextStats;
}

/* ---------- Draughts Persistence ---------- */
export interface DraughtsCompletionRecord {
  dateKey: string;
  outcome: "win" | "draw";
  turns: number;
  elapsedSeconds: number;
  shareText: string;
  completedAt: string;
}

export interface DraughtsStats {
  currentStreak: number;
  bestStreak: number;
  totalDailySolved: number;
  totalZenPlayed: number;
  lastCompletedDate: string | null;
  history: Record<string, DraughtsCompletionRecord>;
}

const DRAUGHTS_STATS_KEY = "coffee-break:draughts:stats:v1";

const DEFAULT_DRAUGHTS_STATS: DraughtsStats = {
  currentStreak: 0,
  bestStreak: 0,
  totalDailySolved: 0,
  totalZenPlayed: 0,
  lastCompletedDate: null,
  history: {},
};

export function loadDraughtsStats(): DraughtsStats {
  if (typeof window === "undefined") return DEFAULT_DRAUGHTS_STATS;
  try {
    const raw = window.localStorage.getItem(DRAUGHTS_STATS_KEY);
    if (!raw) return DEFAULT_DRAUGHTS_STATS;
    const parsed = JSON.parse(raw) as Partial<DraughtsStats>;
    return {
      ...DEFAULT_DRAUGHTS_STATS,
      ...parsed,
      history: parsed.history ?? {},
    };
  } catch {
    return DEFAULT_DRAUGHTS_STATS;
  }
}

export function recordDraughtsDailyCompletion(
  record: DraughtsCompletionRecord
): DraughtsStats {
  const stats = loadDraughtsStats();
  const alreadySolved = Boolean(stats.history[record.dateKey]);
  const updatedHistory = {
    ...stats.history,
    [record.dateKey]: record,
  };

  let currentStreak = stats.currentStreak;
  let totalDailySolved = stats.totalDailySolved;

  if (!alreadySolved) {
    totalDailySolved += 1;
    const yesterday = getPreviousDateKey(record.dateKey);
    if (stats.lastCompletedDate === yesterday) {
      currentStreak = stats.currentStreak + 1;
    } else if (stats.lastCompletedDate === record.dateKey) {
      currentStreak = Math.max(1, stats.currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  const nextStats: DraughtsStats = {
    ...stats,
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    totalDailySolved,
    lastCompletedDate: record.dateKey,
    history: updatedHistory,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        DRAUGHTS_STATS_KEY,
        JSON.stringify(nextStats)
      );
    } catch {
      // Ignore storage quota errors
    }
  }
  return nextStats;
}

export function recordDraughtsZenCompletion(): DraughtsStats {
  const stats = loadDraughtsStats();
  const nextStats: DraughtsStats = {
    ...stats,
    totalZenPlayed: stats.totalZenPlayed + 1,
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        DRAUGHTS_STATS_KEY,
        JSON.stringify(nextStats)
      );
    } catch {
      // Ignore storage quota errors
    }
  }
  return nextStats;
}
