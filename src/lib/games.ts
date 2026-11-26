export interface GameMeta {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  duration: string;
  status: "live" | "coming-soon";
  statusLabel: string;
  restorativeBenefit: string;
  accentColour: string;
}

export const GAMES: GameMeta[] = [
  {
    id: "loom-and-latch",
    slug: "/loom-and-latch",
    title: "Loom & Latch",
    subtitle: "Snap tactile geometric tiles into a calm 5×5 daily loom.",
    duration: "2–3 mins",
    status: "live",
    statusLabel: "Play today's ritual",
    restorativeBenefit: "Order from chaos — spatial closure with zero verbal strain.",
    accentColour: "var(--tile-emerald-fill)",
  },
  {
    id: "daily-pour",
    slug: "/daily-pour",
    title: "Daily Pour",
    subtitle: "Grind, bloom, and pour a steady spiral to unlock your daily tasting card.",
    duration: "2 mins",
    status: "coming-soon",
    statusLabel: "Up next",
    restorativeBenefit: "Rhythmic motor focus with soothing procedural kettle audio.",
    accentColour: "var(--tile-terracotta-fill)",
  },
  {
    id: "chroma-calm",
    slug: "/chroma-calm",
    title: "Chroma Calm",
    subtitle: "Rearrange scrambled colour swatches to restore a harmonious daily gradient.",
    duration: "2–3 mins",
    status: "coming-soon",
    statusLabel: "In the workshop",
    restorativeBenefit: "Gentle left-to-right brain switch into pure visual perception.",
    accentColour: "var(--tile-lavender-fill)",
  },
];

export function getTodayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatBritishDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatShortBritishDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
