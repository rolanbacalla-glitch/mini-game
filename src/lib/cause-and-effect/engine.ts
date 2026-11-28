export type CauseEffectThemeId = "history" | "pop-culture" | "science";
export type CardRole = "cause" | "effect";
export type CardStyleMode = "words" | "pictures";

export type PictureTone =
  | "emerald"
  | "terracotta"
  | "lavender"
  | "ochre"
  | "slate"
  | "rose"
  | "teal";

export type PictureIconKey =
  | "Sun"
  | "Moon"
  | "Star"
  | "CloudRain"
  | "Snowflake"
  | "Flame"
  | "Leaf"
  | "TreePine"
  | "Flower2"
  | "Mountain"
  | "Anchor"
  | "Compass"
  | "Sailboat"
  | "Bike"
  | "Rocket"
  | "Plane"
  | "Coffee"
  | "Croissant"
  | "Apple"
  | "Cherry"
  | "Pizza"
  | "CakeSlice"
  | "Crown"
  | "Gem"
  | "Key"
  | "Bell"
  | "Camera"
  | "Guitar"
  | "Headphones"
  | "BookOpen"
  | "Palette"
  | "Telescope"
  | "Hourglass"
  | "Umbrella"
  | "Feather"
  | "Bird"
  | "Fish"
  | "PawPrint"
  | "Gift"
  | "Lightbulb";

export interface PictureCardEntry {
  id: string;
  icon: PictureIconKey;
  label: string;
  tone: PictureTone;
}

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
  icon?: PictureIconKey;
  tone?: PictureTone;
}

export interface ChainLinkRecord {
  pairId: string;
  cause: string;
  effect: string;
  multiplier: number;
  pointsEarned: number;
  step: number;
  icon?: PictureIconKey;
  tone?: PictureTone;
}

export const PAIRS_PER_GAME = 10;

export const PICTURE_POOL: PictureCardEntry[] = [
  { id: "pic1", icon: "Sun", label: "Sun", tone: "ochre" },
  { id: "pic2", icon: "Moon", label: "Moon", tone: "lavender" },
  { id: "pic3", icon: "Star", label: "Star", tone: "ochre" },
  { id: "pic4", icon: "CloudRain", label: "Rain Cloud", tone: "slate" },
  { id: "pic5", icon: "Snowflake", label: "Snowflake", tone: "teal" },
  { id: "pic6", icon: "Flame", label: "Flame", tone: "terracotta" },
  { id: "pic7", icon: "Leaf", label: "Leaf", tone: "emerald" },
  { id: "pic8", icon: "TreePine", label: "Pine Tree", tone: "emerald" },
  { id: "pic9", icon: "Flower2", label: "Blossom", tone: "rose" },
  { id: "pic10", icon: "Mountain", label: "Mountain", tone: "slate" },
  { id: "pic11", icon: "Anchor", label: "Anchor", tone: "slate" },
  { id: "pic12", icon: "Compass", label: "Compass", tone: "terracotta" },
  { id: "pic13", icon: "Sailboat", label: "Sailboat", tone: "teal" },
  { id: "pic14", icon: "Bike", label: "Bicycle", tone: "emerald" },
  { id: "pic15", icon: "Rocket", label: "Rocket", tone: "terracotta" },
  { id: "pic16", icon: "Plane", label: "Aeroplane", tone: "slate" },
  { id: "pic17", icon: "Coffee", label: "Coffee", tone: "ochre" },
  { id: "pic18", icon: "Croissant", label: "Croissant", tone: "ochre" },
  { id: "pic19", icon: "Apple", label: "Apple", tone: "rose" },
  { id: "pic20", icon: "Cherry", label: "Cherries", tone: "rose" },
  { id: "pic21", icon: "Pizza", label: "Pizza", tone: "terracotta" },
  { id: "pic22", icon: "CakeSlice", label: "Cake", tone: "rose" },
  { id: "pic23", icon: "Crown", label: "Crown", tone: "ochre" },
  { id: "pic24", icon: "Gem", label: "Gemstone", tone: "lavender" },
  { id: "pic25", icon: "Key", label: "Key", tone: "ochre" },
  { id: "pic26", icon: "Bell", label: "Bell", tone: "ochre" },
  { id: "pic27", icon: "Camera", label: "Camera", tone: "slate" },
  { id: "pic28", icon: "Guitar", label: "Guitar", tone: "terracotta" },
  { id: "pic29", icon: "Headphones", label: "Headphones", tone: "lavender" },
  { id: "pic30", icon: "BookOpen", label: "Open Book", tone: "emerald" },
  { id: "pic31", icon: "Palette", label: "Palette", tone: "rose" },
  { id: "pic32", icon: "Telescope", label: "Telescope", tone: "lavender" },
  { id: "pic33", icon: "Hourglass", label: "Hourglass", tone: "terracotta" },
  { id: "pic34", icon: "Umbrella", label: "Umbrella", tone: "teal" },
  { id: "pic35", icon: "Feather", label: "Feather", tone: "lavender" },
  { id: "pic36", icon: "Bird", label: "Bird", tone: "teal" },
  { id: "pic37", icon: "Fish", label: "Fish", tone: "teal" },
  { id: "pic38", icon: "PawPrint", label: "Paw Print", tone: "terracotta" },
  { id: "pic39", icon: "Gift", label: "Gift Box", tone: "rose" },
  { id: "pic40", icon: "Lightbulb", label: "Lightbulb", tone: "ochre" },
];

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
      { id: "h1", cause: "Johannes Gutenberg", effect: "Movable-Type Printing Press" },
      { id: "h2", cause: "Alexander Fleming", effect: "Penicillin Antibiotic" },
      { id: "h3", cause: "Wright Brothers", effect: "Powered Airplane Flight" },
      { id: "h4", cause: "Tim Berners-Lee", effect: "World Wide Web" },
      { id: "h5", cause: "Marie Curie", effect: "Discovery of Radium" },
      { id: "h6", cause: "Galileo Galilei", effect: "Astronomical Telescope" },
      { id: "h7", cause: "Alexander Graham Bell", effect: "First Telephone" },
      { id: "h8", cause: "James Watt", effect: "Condensing Steam Engine" },
      { id: "h9", cause: "Louis Pasteur", effect: "Milk Pasteurisation" },
      { id: "h10", cause: "Ada Lovelace", effect: "First Computer Algorithm" },
      { id: "h11", cause: "Louis Braille", effect: "Tactile Reading System" },
      { id: "h12", cause: "Samuel Morse", effect: "Dot-and-Dash Telegraph Code" },
      { id: "h13", cause: "Edward Jenner", effect: "Smallpox Vaccine" },
      { id: "h14", cause: "Alfred Nobel", effect: "Dynamite Explosive" },
      { id: "h15", cause: "Karl Benz", effect: "Petrol-Powered Motorcar" },
      { id: "h16", cause: "John Logie Baird", effect: "Mechanical Television" },
      { id: "h17", cause: "Guglielmo Marconi", effect: "Long-Distance Radio" },
      { id: "h18", cause: "Nikola Tesla", effect: "Alternating Current Motor" },
      { id: "h19", cause: "Thomas Edison", effect: "Phonograph Sound Recorder" },
      { id: "h20", cause: "Grace Hopper", effect: "First Programming Compiler" },
      { id: "h21", cause: "Alan Turing", effect: "Enigma Codebreaking Machine" },
      { id: "h22", cause: "Hedy Lamarr", effect: "Frequency-Hopping Wireless" },
      { id: "h23", cause: "Frank Whittle", effect: "Turbojet Aircraft Engine" },
      { id: "h24", cause: "Elisha Otis", effect: "Safety Elevator Brake" },
      { id: "h25", cause: "Charles Goodyear", effect: "Vulcanised Rubber Tyres" },
      { id: "h26", cause: "George Eastman", effect: "Kodak Roll-Film Camera" },
      { id: "h27", cause: "Wilhelm Röntgen", effect: "Medical X-Ray Imaging" },
      { id: "h28", cause: "Rudolf Diesel", effect: "Compression-Ignition Engine" },
      { id: "h29", cause: "Henry Bessemer", effect: "Mass Steelmaking Process" },
      { id: "h30", cause: "Eli Whitney", effect: "Mechanical Cotton Gin" },
      { id: "h31", cause: "James Dyson", effect: "Bagless Cyclone Vacuum" },
      { id: "h32", cause: "Percy Spencer", effect: "Microwave Cooking Oven" },
      { id: "h33", cause: "Stephanie Kwolek", effect: "Kevlar Bulletproof Fibre" },
      { id: "h34", cause: "George de Mestral", effect: "Velcro Hook-and-Loop Fastener" },
      { id: "h35", cause: "Bette Nesmith Graham", effect: "Liquid Correction Fluid" },
      { id: "h36", cause: "Mary Anderson", effect: "Windscreen Wiper Blade" },
      { id: "h37", cause: "Nils Bohlin", effect: "Three-Point Seatbelt" },
      { id: "h38", cause: "László Bíró", effect: "Ballpoint Ink Pen" },
      { id: "h39", cause: "Robert Goddard", effect: "Liquid-Fuelled Rocket" },
      { id: "h40", cause: "Alessandro Volta", effect: "First Electric Battery" },
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
      { id: "p1", cause: "“Here’s looking at you, kid.”", effect: "Casablanca" },
      { id: "p2", cause: "“May the Force be with you.”", effect: "Star Wars" },
      { id: "p3", cause: "“There’s no place like home.”", effect: "The Wizard of Oz" },
      { id: "p4", cause: "“I’ll be back.”", effect: "The Terminator" },
      { id: "p5", cause: "“You’re gonna need a bigger boat.”", effect: "Jaws" },
      { id: "p6", cause: "“Life is like a box of chocolates.”", effect: "Forrest Gump" },
      { id: "p7", cause: "“I see dead people.”", effect: "The Sixth Sense" },
      { id: "p8", cause: "“To infinity and beyond!”", effect: "Toy Story" },
      { id: "p9", cause: "“Just keep swimming.”", effect: "Finding Nemo" },
      { id: "p10", cause: "“You shall not pass!”", effect: "The Lord of the Rings" },
      { id: "p11", cause: "“E.T. phone home.”", effect: "E.T. the Extra-Terrestrial" },
      { id: "p12", cause: "“Nobody puts Baby in a corner.”", effect: "Dirty Dancing" },
      { id: "p13", cause: "“I’m the king of the world!”", effect: "Titanic" },
      { id: "p14", cause: "“Houston, we have a problem.”", effect: "Apollo 13" },
      { id: "p15", cause: "“Show me the money!”", effect: "Jerry Maguire" },
      { id: "p16", cause: "“Why so serious?”", effect: "The Dark Knight" },
      { id: "p17", cause: "“Wakanda forever!”", effect: "Black Panther" },
      { id: "p18", cause: "“Let it go!”", effect: "Frozen" },
      { id: "p19", cause: "“Hakuna Matata.”", effect: "The Lion King" },
      { id: "p20", cause: "“Where we’re going, we don’t need roads.”", effect: "Back to the Future" },
      { id: "p21", cause: "“Life, uh, finds a way.”", effect: "Jurassic Park" },
      { id: "p22", cause: "“I feel the need for speed.”", effect: "Top Gun" },
      { id: "p23", cause: "“Wax on, wax off.”", effect: "The Karate Kid" },
      { id: "p24", cause: "“Say hello to my little friend!”", effect: "Scarface" },
      { id: "p25", cause: "“An offer he can’t refuse.”", effect: "The Godfather" },
      { id: "p26", cause: "“You can’t handle the truth!”", effect: "A Few Good Men" },
      { id: "p27", cause: "“Here’s Johnny!”", effect: "The Shining" },
      { id: "p28", cause: "“Keep the change, ya filthy animal.”", effect: "Home Alone" },
      { id: "p29", cause: "“As you wish.”", effect: "The Princess Bride" },
      { id: "p30", cause: "“Yippee-ki-yay!”", effect: "Die Hard" },
      { id: "p31", cause: "“Are you not entertained?”", effect: "Gladiator" },
      { id: "p32", cause: "“Carpe diem. Seize the day.”", effect: "Dead Poets Society" },
      { id: "p33", cause: "“Get busy living, or get busy dying.”", effect: "The Shawshank Redemption" },
      { id: "p34", cause: "“There’s no crying in baseball!”", effect: "A League of Their Own" },
      { id: "p35", cause: "“I’ll have what she’s having.”", effect: "When Harry Met Sally" },
      { id: "p36", cause: "“You talkin’ to me?”", effect: "Taxi Driver" },
      { id: "p37", cause: "“A spoonful of sugar…”", effect: "Mary Poppins" },
      { id: "p38", cause: "“There is no spoon.”", effect: "The Matrix" },
      { id: "p39", cause: "“Wilson! I’m sorry, Wilson!”", effect: "Cast Away" },
      { id: "p40", cause: "“Ohana means family.”", effect: "Lilo & Stitch" },
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
      { id: "s1", cause: "Sunlight hits green leaves", effect: "Photosynthesis releases oxygen" },
      { id: "s2", cause: "Water cools below 0 °C", effect: "Freezes into solid ice" },
      { id: "s3", cause: "Moon orbits the Earth", effect: "Ocean tides rise and fall" },
      { id: "s4", cause: "Baking soda meets vinegar", effect: "Fizzes with carbon dioxide" },
      { id: "s5", cause: "Tectonic plates slip suddenly", effect: "Earthquake seismic waves" },
      { id: "s6", cause: "Iron sits in damp air", effect: "Reddish-brown rust forms" },
      { id: "s7", cause: "White light enters a prism", effect: "Splits into a rainbow spectrum" },
      { id: "s8", cause: "Current coils round iron", effect: "Temporary electromagnet forms" },
      { id: "s9", cause: "Warm vapour hits cold glass", effect: "Condenses into water droplets" },
      { id: "s10", cause: "Rubbing two palms rapidly", effect: "Friction produces warmth" },
      { id: "s11", cause: "Water heated to 100 °C", effect: "Boils into rising steam" },
      { id: "s12", cause: "Balloon rubbed on wool jumper", effect: "Static cling lifts hair" },
      { id: "s13", cause: "Salt stirred into warm water", effect: "Dissolves into brine solution" },
      { id: "s14", cause: "Yeast feeds on dough sugars", effect: "Gas bubbles make bread rise" },
      { id: "s15", cause: "Cut apple left in open air", effect: "Enzymes turn flesh brown" },
      { id: "s16", cause: "Lightning superheats the air", effect: "Shockwave booms as thunder" },
      { id: "s17", cause: "Earth tilts on its axis", effect: "Annual four seasons cycle" },
      { id: "s18", cause: "Sound wave hits canyon wall", effect: "Bounces back as an echo" },
      { id: "s19", cause: "Same magnet poles meet", effect: "Magnetic force pushes apart" },
      { id: "s20", cause: "Dry ice warms at room air", effect: "Sublimes straight into fog" },
      { id: "s21", cause: "Copper roof weathers outdoors", effect: "Green patina layer develops" },
      { id: "s22", cause: "Sunlight strikes solar panel", effect: "Cells generate electric current" },
      { id: "s23", cause: "Acid touches blue litmus", effect: "Indicator paper turns red" },
      { id: "s24", cause: "Silver meets sulphur air", effect: "Dark surface tarnish appears" },
      { id: "s25", cause: "Guitar string plucked firmly", effect: "Vibrations create musical pitch" },
      { id: "s26", cause: "Earth spins every 24 hours", effect: "Daylight turns into night" },
      { id: "s27", cause: "Magma erupts through crust", effect: "Lava cools into volcanic rock" },
      { id: "s28", cause: "Salt spread on icy pavement", effect: "Lowers freezing point to melt" },
      { id: "s29", cause: "Moon blocks Sun from Earth", effect: "Solar eclipse casts shadow" },
      { id: "s30", cause: "Perfume sprayed in a room", effect: "Diffusion spreads scent evenly" },
      { id: "s31", cause: "Light ray enters clear water", effect: "Refraction bends straw’s image" },
      { id: "s32", cause: "Warm air rises over cool sea", effect: "Coastal breeze blows inland" },
      { id: "s33", cause: "Roots absorb moist soil", effect: "Capillary pull feeds the stem" },
      { id: "s34", cause: "Soap hits oily dishwater", effect: "Emulsifies grease into droplets" },
      { id: "s35", cause: "Egg white heated in a pan", effect: "Proteins set and turn white" },
      { id: "s36", cause: "Pendulum dropped from side", effect: "Gravity swings arc back & forth" },
      { id: "s37", cause: "Bees carry flower pollen", effect: "Pollination fertilises seeds" },
      { id: "s38", cause: "Oxygen feeds glowing ember", effect: "Combustion sparks open flame" },
      { id: "s39", cause: "Lemon juice meets warm milk", effect: "Curds separate from whey" },
      { id: "s40", cause: "Coiled spring is released", effect: "Elastic energy launches forward" },
    ],
  },
];

export function getCauseEffectTheme(id: CauseEffectThemeId): CauseEffectTheme {
  return (
    CAUSE_EFFECT_THEMES.find((t) => t.id === id) ?? CAUSE_EFFECT_THEMES[0]
  );
}

/**
 * Converts a YYYY-MM-DD local date key into an integer UTC day number
 * so consecutive calendar days increment monotonically by +1.
 */
export function getDayIndex(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return 0;
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/**
 * Deterministic daily theme selector rotating cleanly through all 3 themes each day.
 */
export function getDailyThemeId(dateKey: string): CauseEffectThemeId {
  const dayIndex = Math.abs(getDayIndex(dateKey));
  return CAUSE_EFFECT_THEMES[dayIndex % CAUSE_EFFECT_THEMES.length].id;
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

function shuffleWithRng<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

/**
 * Deterministically selects a fresh daily slice of `count` items from a 40-item pool.
 * Splits the pool into two disjoint 20-item halves (slots 0–1 from Half A, slots 2–3 from Half B),
 * reshuffling each half per 4-day cycle. This guarantees:
 *  - Every 4-day cycle visits all 40 items with zero duplicates
 *  - Any two consecutive days (even across a cycle boundary) share ZERO items
 */
function selectDailySlice<T>(
  pool: readonly T[],
  count: number,
  dateKey: string,
  namespace: string
): T[] {
  const halfSize = Math.floor(pool.length / 2);
  const halfA = pool.slice(0, halfSize);
  const halfB = pool.slice(halfSize);
  const slotsPerHalf = Math.max(1, Math.floor(halfSize / count));
  const slotsPerCycle = slotsPerHalf * 2;

  const dayIndex = Math.abs(getDayIndex(dateKey));
  const cycleNumber = Math.floor(dayIndex / slotsPerCycle);
  const slotInCycle = dayIndex % slotsPerCycle;

  if (slotInCycle < slotsPerHalf) {
    const rng = createSeededRng(`${namespace}:A:${cycleNumber}`);
    const shuffledA = shuffleWithRng(halfA, rng);
    return shuffledA.slice(slotInCycle * count, (slotInCycle + 1) * count);
  }

  const bSlot = slotInCycle - slotsPerHalf;
  const rng = createSeededRng(`${namespace}:B:${cycleNumber}`);
  const shuffledB = shuffleWithRng(halfB, rng);
  return shuffledB.slice(bSlot * count, (bSlot + 1) * count);
}

/**
 * Selects today's deterministic 10-pair questionnaire from the theme's 40-pair bank.
 */
export function selectDailyPairs(
  themeId: CauseEffectThemeId,
  dateKey: string
): CauseEffectPair[] {
  const theme = getCauseEffectTheme(themeId);
  return selectDailySlice(
    theme.pairs,
    PAIRS_PER_GAME,
    dateKey,
    `cause-effect:daily-cycle:v2:${themeId}`
  );
}

/**
 * Selects a fresh 10-pair questionnaire from the theme's full 40-pair bank for Free Play.
 */
export function selectRandomPairs(
  themeId: CauseEffectThemeId,
  seed?: string
): CauseEffectPair[] {
  const theme = getCauseEffectTheme(themeId);
  const rng = seed ? createSeededRng(`pairs:${seed}`) : Math.random;
  return shuffleWithRng(theme.pairs, rng).slice(0, PAIRS_PER_GAME);
}

function pairsToShuffledDeck(
  pairs: CauseEffectPair[],
  rng: () => number
): DeckCard[] {
  const cards: DeckCard[] = [];

  for (const pair of pairs) {
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

  return shuffleWithRng(cards, rng);
}

/**
 * Builds today's daily 20-card (10 Cause + 10 Effect) deck.
 * Automatically refreshes with a new 10-pair questionnaire and grid layout each calendar day.
 */
export function buildDailyDeck(
  themeId: CauseEffectThemeId,
  dateKey: string
): DeckCard[] {
  const dailyPairs = selectDailyPairs(themeId, dateKey);
  const layoutRng = createSeededRng(
    `cause-effect:daily-layout:v1:${dateKey}:${themeId}`
  );
  return pairsToShuffledDeck(dailyPairs, layoutRng);
}

/**
 * Builds a fresh 20-card (10 Cause + 10 Effect) deck for Free Play or custom seeds,
 * sampling 10 pairs from the full 40-pair theme pool.
 */
export function buildShuffledDeck(
  themeId: CauseEffectThemeId,
  seed?: string
): DeckCard[] {
  const chosenPairs = selectRandomPairs(themeId, seed);
  const layoutRng = seed ? createSeededRng(`layout:${seed}`) : Math.random;
  return pairsToShuffledDeck(chosenPairs, layoutRng);
}

/**
 * Selects today's deterministic 10-icon visual set from the 40-icon pool.
 */
export function selectDailyPictureSet(dateKey: string): PictureCardEntry[] {
  return selectDailySlice(
    PICTURE_POOL,
    PAIRS_PER_GAME,
    dateKey,
    "cause-effect:daily-pictures:v2"
  );
}

function picturesToShuffledDeck(
  entries: PictureCardEntry[],
  rng: () => number
): DeckCard[] {
  const cards: DeckCard[] = [];

  for (const item of entries) {
    cards.push({
      uid: `${item.id}-a`,
      pairId: item.id,
      role: "cause",
      text: item.label,
      pairedText: item.label,
      icon: item.icon,
      tone: item.tone,
    });
    cards.push({
      uid: `${item.id}-b`,
      pairId: item.id,
      role: "effect",
      text: item.label,
      pairedText: item.label,
      icon: item.icon,
      tone: item.tone,
    });
  }

  return shuffleWithRng(cards, rng);
}

/**
 * Builds today's daily 20-card Picture Pairs deck (10 fresh visual pairs each day).
 */
export function buildDailyPictureDeck(dateKey: string): DeckCard[] {
  const dailyPics = selectDailyPictureSet(dateKey);
  const layoutRng = createSeededRng(
    `cause-effect:daily-pictures-layout:v1:${dateKey}`
  );
  return picturesToShuffledDeck(dailyPics, layoutRng);
}

/**
 * Builds a fresh random 20-card Picture Pairs deck from the 40-icon pool for Free Play.
 */
export function buildRandomPictureDeck(seed?: string): DeckCard[] {
  const pairRng = seed ? createSeededRng(`pic-pairs:${seed}`) : Math.random;
  const chosen = shuffleWithRng(PICTURE_POOL, pairRng).slice(0, PAIRS_PER_GAME);
  const layoutRng = seed ? createSeededRng(`pic-layout:${seed}`) : Math.random;
  return picturesToShuffledDeck(chosen, layoutRng);
}

/**
 * Checks whether two flipped cards form a valid pair (Cause + Effect or matching Pictures).
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
  const chainIcons = Array.from({
    length: Math.min(10, Math.max(1, longestChain)),
  })
    .map(() => "◆")
    .join("→");

  return [
    `Coffee Break · Cause & Effect (${dateLabel})`,
    themeTitle,
    `${score.toLocaleString()} pts · ${moves} moves · ${longestChain}x max chain · ${durationLabel}`,
    chainIcons,
  ].join("\n");
}
