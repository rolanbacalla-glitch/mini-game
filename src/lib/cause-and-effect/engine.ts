export type CauseEffectThemeId = "history" | "pop-culture" | "science";
export type CardRole = "cause" | "effect";

export interface CauseEffectPair {
  id: string;
  cause: string;
  effect: string;
}

export interface CauseEffectTheme {
  id: CauseEffectThemeId;
  title: string;
  shortTitle: string;
  causeLabel: string;
  effectLabel: string;
  description: string;
  pairs: CauseEffectPair[];
}

export interface DeckCard {
  uid: string;
  pairId: string;
  role: CardRole;
  text: string;
  pairedText: string;
}

export interface ChainLinkRecord {
  pairId: string;
  cause: string;
  effect: string;
  multiplier: number;
  pointsEarned: number;
  step: number;
}

export const CAUSE_EFFECT_THEMES: CauseEffectTheme[] = [
  {
    id: "history",
    title: "History: Inventions & Inventors",
    shortTitle: "Inventions & Inventors",
    causeLabel: "Inventor",
    effectLabel: "Invention",
    description:
      "Pair each historic pioneer with the breakthrough they brought into the world.",
    pairs: [
      {
        id: "h1",
        cause: "Johannes Gutenberg",
        effect: "Movable-Type Printing Press",
      },
      {
        id: "h2",
        cause: "Alexander Fleming",
        effect: "Penicillin Antibiotic",
      },
      {
        id: "h3",
        cause: "Wright Brothers",
        effect: "Powered Airplane Flight",
      },
      {
        id: "h4",
        cause: "Tim Berners-Lee",
        effect: "World Wide Web",
      },
      {
        id: "h5",
        cause: "Marie Curie",
        effect: "Discovery of Radium",
      },
      {
        id: "h6",
        cause: "Galileo Galilei",
        effect: "Astronomical Telescope",
      },
      {
        id: "h7",
        cause: "Alexander Graham Bell",
        effect: "First Telephone",
      },
      {
        id: "h8",
        cause: "James Watt",
        effect: "Condensing Steam Engine",
      },
      {
        id: "h9",
        cause: "Louis Pasteur",
        effect: "Milk Pasteurisation",
      },
      {
        id: "h10",
        cause: "Ada Lovelace",
        effect: "First Computer Algorithm",
      },
    ],
  },
  {
    id: "pop-culture",
    title: "Pop Culture: Iconic Quotes & Films",
    shortTitle: "Iconic Quotes & Films",
    causeLabel: "Quote",
    effectLabel: "Film",
    description:
      "Connect each unforgettable line of cinema with the film that made it famous.",
    pairs: [
      {
        id: "p1",
        cause: "“Here’s looking at you, kid.”",
        effect: "Casablanca",
      },
      {
        id: "p2",
        cause: "“May the Force be with you.”",
        effect: "Star Wars",
      },
      {
        id: "p3",
        cause: "“There’s no place like home.”",
        effect: "The Wizard of Oz",
      },
      {
        id: "p4",
        cause: "“I’ll be back.”",
        effect: "The Terminator",
      },
      {
        id: "p5",
        cause: "“You’re gonna need a bigger boat.”",
        effect: "Jaws",
      },
      {
        id: "p6",
        cause: "“Life is like a box of chocolates.”",
        effect: "Forrest Gump",
      },
      {
        id: "p7",
        cause: "“I see dead people.”",
        effect: "The Sixth Sense",
      },
      {
        id: "p8",
        cause: "“To infinity and beyond!”",
        effect: "Toy Story",
      },
      {
        id: "p9",
        cause: "“Just keep swimming.”",
        effect: "Finding Nemo",
      },
      {
        id: "p10",
        cause: "“You shall not pass!”",
        effect: "The Lord of the Rings",
      },
    ],
  },
  {
    id: "science",
    title: "Science: Actions & Reactions",
    shortTitle: "Actions & Reactions",
    causeLabel: "Action",
    effectLabel: "Reaction",
    description:
      "Link each natural trigger or experiment to the physical or chemical effect it produces.",
    pairs: [
      {
        id: "s1",
        cause: "Sunlight hits green leaves",
        effect: "Photosynthesis releases oxygen",
      },
      {
        id: "s2",
        cause: "Water cools below 0 °C",
        effect: "Freezes into solid ice",
      },
      {
        id: "s3",
        cause: "Moon orbits the Earth",
        effect: "Ocean tides rise and fall",
      },
      {
        id: "s4",
        cause: "Baking soda meets vinegar",
        effect: "Fizzes with carbon dioxide",
      },
      {
        id: "s5",
        cause: "Tectonic plates slip suddenly",
        effect: "Earthquake seismic waves",
      },
      {
        id: "s6",
        cause: "Iron sits in damp air",
        effect: "Reddish-brown rust forms",
      },
      {
        id: "s7",
        cause: "White light enters a prism",
        effect: "Splits into a rainbow spectrum",
      },
      {
        id: "s8",
        cause: "Current coils round iron",
        effect: "Temporary electromagnet forms",
      },
      {
        id: "s9",
        cause: "Warm vapour hits cold glass",
        effect: "Condenses into water droplets",
      },
      {
        id: "s10",
        cause: "Rubbing two palms rapidly",
        effect: "Friction produces warmth",
      },
    ],
  },
];

export function getCauseEffectTheme(id: CauseEffectThemeId): CauseEffectTheme {
  return (
    CAUSE_EFFECT_THEMES.find((t) => t.id === id) ?? CAUSE_EFFECT_THEMES[0]
  );
}

/**
 * Deterministic daily theme selector based on YYYY-MM-DD so every day offers a fresh theme.
 */
export function getDailyThemeId(dateKey: string): CauseEffectThemeId {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return CAUSE_EFFECT_THEMES[hash % CAUSE_EFFECT_THEMES.length].id;
}

function createSeededRng(seedStr: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds and shuffles a 20-card (10 Cause + 10 Effect) deck for the 4×5 grid.
 */
export function buildShuffledDeck(
  themeId: CauseEffectThemeId,
  seed?: string
): DeckCard[] {
  const theme = getCauseEffectTheme(themeId);
  const cards: DeckCard[] = [];

  for (const pair of theme.pairs) {
    cards.push({
      uid: `${pair.id}-cause`,
      pairId: pair.id,
      role: "cause",
      text: pair.cause,
      pairedText: pair.effect,
    });
    cards.push({
      uid: `${pair.id}-effect`,
      pairId: pair.id,
      role: "effect",
      text: pair.effect,
      pairedText: pair.cause,
    });
  }

  const rng = seed ? createSeededRng(seed) : Math.random;
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = cards[i];
    cards[i] = cards[j];
    cards[j] = tmp;
  }

  return cards;
}

/**
 * Checks whether two flipped cards form a valid asymmetrical Cause + Effect pair.
 */
export function isValidCauseEffectMatch(a: DeckCard, b: DeckCard): boolean {
  return a.uid !== b.uid && a.pairId === b.pairId && a.role !== b.role;
}

export function buildCauseEffectShareCard(params: {
  dateLabel: string;
  themeTitle: string;
  score: number;
  moves: number;
  longestChain: number;
  durationLabel: string;
}): string {
  const { dateLabel, themeTitle, score, moves, longestChain, durationLabel } =
    params;
  const chainIcons = Array.from({ length: Math.min(10, Math.max(1, longestChain)) })
    .map(() => "◆")
    .join("→");

  return [
    `Coffee Break · Cause & Effect (${dateLabel})`,
    themeTitle,
    `${score.toLocaleString()} pts · ${moves} moves · ${longestChain}x max chain · ${durationLabel}`,
    chainIcons,
  ].join("\n");
}
