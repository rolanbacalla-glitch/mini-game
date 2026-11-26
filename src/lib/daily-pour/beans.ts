export interface CoffeeBean {
  id: string;
  name: string;
  origin: string;
  elevation: string;
  roast: "Light" | "Medium-Light" | "Medium";
  notes: [string, string, string];
  grindLabel: "Medium-Fine" | "Medium" | "Medium-Coarse";
  waterTempC: number;
  bloomMl: number;
  targetMl: number;
}

const BEAN_CATALOGUE: CoffeeBean[] = [
  {
    id: "yirgacheffe",
    name: "Ethiopia Yirgacheffe",
    origin: "Gedeb, Ethiopia",
    elevation: "2,050m",
    roast: "Light",
    notes: ["Bergamot", "White Peach", "Jasmine"],
    grindLabel: "Medium-Fine",
    waterTempC: 94,
    bloomMl: 45,
    targetMl: 250,
  },
  {
    id: "huila",
    name: "Colombia Huila",
    origin: "Pitalito, Colombia",
    elevation: "1,780m",
    roast: "Medium-Light",
    notes: ["Caramel", "Red Apple", "Toasted Almond"],
    grindLabel: "Medium",
    waterTempC: 93,
    bloomMl: 45,
    targetMl: 250,
  },
  {
    id: "nyeri",
    name: "Kenya Nyeri AA",
    origin: "Mount Kenya, Kenya",
    elevation: "1,850m",
    roast: "Light",
    notes: ["Blackcurrant", "Pink Grapefruit", "Hibiscus"],
    grindLabel: "Medium-Fine",
    waterTempC: 94,
    bloomMl: 45,
    targetMl: 250,
  },
  {
    id: "antigua",
    name: "Guatemala Antigua",
    origin: "Sacatepéquez, Guatemala",
    elevation: "1,650m",
    roast: "Medium",
    notes: ["Dark Chocolate", "Orange Peel", "Hazelnut"],
    grindLabel: "Medium",
    waterTempC: 92,
    bloomMl: 45,
    targetMl: 250,
  },
  {
    id: "tarrazu",
    name: "Costa Rica Tarrazú",
    origin: "San Marcos, Costa Rica",
    elevation: "1,720m",
    roast: "Medium-Light",
    notes: ["Wild Honey", "Apricot", "Clementine"],
    grindLabel: "Medium",
    waterTempC: 93,
    bloomMl: 45,
    targetMl: 250,
  },
  {
    id: "bourbon",
    name: "Rwanda Red Bourbon",
    origin: "Lake Kivu, Rwanda",
    elevation: "1,900m",
    roast: "Light",
    notes: ["Blood Orange", "Spiced Plum", "Brown Sugar"],
    grindLabel: "Medium-Fine",
    waterTempC: 93,
    bloomMl: 45,
    targetMl: 250,
  },
  {
    id: "boquete",
    name: "Panama Boquete",
    origin: "Chiriquí, Panama",
    elevation: "1,800m",
    roast: "Light",
    notes: ["Honeysuckle", "Meyer Lemon", "Oolong Tea"],
    grindLabel: "Medium-Fine",
    waterTempC: 94,
    bloomMl: 45,
    targetMl: 250,
  },
  {
    id: "mandheling",
    name: "Sumatra Mandheling",
    origin: "Aceh, Indonesia",
    elevation: "1,500m",
    roast: "Medium",
    notes: ["Cedarwood", "Cocoa Nib", "Sweet Fig"],
    grindLabel: "Medium-Coarse",
    waterTempC: 91,
    bloomMl: 45,
    targetMl: 250,
  },
  {
    id: "cajamarca",
    name: "Peru Cajamarca",
    origin: "Jaén, Peru",
    elevation: "1,750m",
    roast: "Medium-Light",
    notes: ["Milk Chocolate", "Pear", "Vanilla Bean"],
    grindLabel: "Medium",
    waterTempC: 93,
    bloomMl: 45,
    targetMl: 250,
  },
  {
    id: "cerrado",
    name: "Brazil Cerrado",
    origin: "Minas Gerais, Brazil",
    elevation: "1,200m",
    roast: "Medium",
    notes: ["Roasted Pecan", "Toffee", "Cacao"],
    grindLabel: "Medium-Coarse",
    waterTempC: 91,
    bloomMl: 45,
    targetMl: 250,
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

export function getDailyBean(seed: string): CoffeeBean {
  const idx = hashSeed(`daily-pour::${seed}`) % BEAN_CATALOGUE.length;
  return BEAN_CATALOGUE[idx];
}

export function getExtractionVerdict(extractionPct: number): string {
  if (extractionPct >= 95) return "Silky & Luminous";
  if (extractionPct >= 90) return "Balanced & Bright";
  if (extractionPct >= 84) return "Warm & Rounded";
  return "Gentle & Mellow";
}

export function buildPourShareCard(
  bean: CoffeeBean,
  dateLabel: string,
  extractionPct: number,
  durationLabel: string
): string {
  const filledDots = Math.max(1, Math.min(5, Math.round((extractionPct - 75) / 5)));
  const meter = "●".repeat(filledDots) + "○".repeat(5 - filledDots);
  return [
    `Daily Pour · ${dateLabel}`,
    `${bean.name} (${bean.roast})`,
    `${extractionPct}% Extraction · ${getExtractionVerdict(extractionPct)} ${meter}`,
    `${bean.notes.join(" · ")} · ${durationLabel}`,
  ].join("\n");
}
