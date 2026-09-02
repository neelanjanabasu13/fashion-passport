export type PreferenceStrength = "love" | "avoid" | "never";
export type PreferenceLevel = "love" | "avoid" | "never" | "neutral";

/**
 * `love` and `avoid` are the original two layers and remain valid.
 * `never` is the only user-selectable level that can hard-block a product.
 */
export type PreferenceGroup = {
  love: string[];
  avoid: string[];
  never: string[];
};

export type BudgetMode = "usual" | "strict";

export type EvidenceConfidence = "high" | "medium" | "low";

export type AttributeEvidence = {
  value: string;
  confidence: EvidenceConfidence | "unknown";
  source: "variant" | "title" | "tag" | "option" | "description" | "image" | "unknown";
};

export type ProductEvidence = {
  category: AttributeEvidence;
  colour: AttributeEvidence;
  silhouette: AttributeEvidence;
  neckline: AttributeEvidence;
  sleeve: AttributeEvidence;
  length: AttributeEvidence;
  pattern: AttributeEvidence;
  material: AttributeEvidence;
};

export type ResultState = "strong" | "worth" | "other" | "held";

/** Raw local tallies. Preserved so a preference can recover when behaviour changes. */
export type TraitVote = { up: number; down: number; updatedAt: string };
export type LearnedTaste = Record<string, TraitVote>;
export type LearnedPreference = { key: string; direction: "positive" | "negative"; confidence: number; interactions: number };

export type FashionProfile = {
  label: string;
  country: string;
  size: string;
  heightCm: number;
  colourSeason: string;
  bodyShape: string;
  budget: number;
  colours: PreferenceGroup;
  silhouettes: PreferenceGroup;
  necklines: PreferenceGroup;
  sleeves: PreferenceGroup;
  patterns: PreferenceGroup;
  materials: PreferenceGroup;
  lengths: PreferenceGroup;
  retailers: PreferenceGroup;
  budgetMode: BudgetMode;
};

/** The shape older saved profiles may still have in local storage. */
export type StoredFashionProfile = Omit<
  FashionProfile,
  "colours" | "silhouettes" | "necklines" | "sleeves" | "patterns" | "materials" | "lengths" | "retailers" | "budgetMode"
> & {
  colours?: Partial<PreferenceGroup>;
  silhouettes?: Partial<PreferenceGroup>;
  necklines?: Partial<PreferenceGroup>;
  sleeves?: Partial<PreferenceGroup>;
  patterns?: Partial<PreferenceGroup>;
  materials?: Partial<PreferenceGroup>;
  lengths?: Partial<PreferenceGroup>;
  retailers?: Partial<PreferenceGroup>;
  budgetMode?: BudgetMode;
};

export type Retailer = {
  id: string;
  name: string;
  url: string;
  kind: "shopify";
  endpoint: string;
};

export type Product = {
  id: string;
  retailerId: string;
  name: string;
  brand: string;
  price: number;
  colour: string;
  hex: string;
  silhouette: string;
  neckline: string;
  sleeve: string;
  pattern: string;
  material: string;
  length: string;
  sizes: string[];
  accent?: string;
  imageUrl?: string;
  productUrl?: string;
  source?: "live-ucp" | "preference-sketch";
  /** Canonical category, e.g. "Dress". "Unknown" when it could not be established. */
  category: string;
  /** Per-attribute value with the evidence that produced it. */
  evidence: ProductEvidence;
  /** Other colourways offered. Recorded as alternatives, never scored as matches. */
  alternativeColours: string[];
  /** Every size a purchasable variant reports. Empty means size data is unknown. */
  availableSizes: string[];
};

export type ScoreReason = {
  label: string;
  kind: "positive" | "warning" | "theory" | "learned" | "hard";
  weight: number;
};

export type ScoredProduct = Product & {
  /** 1-99. Ordering only; it is not a confidence measure. */
  score: number;
  matchScore: number;
  evidenceConfidence: EvidenceConfidence;
  state: ResultState;
  reasons: ScoreReason[];
  /** Soft conflicts. Never a reason to hide a product. */
  conflicts: ScoreReason[];
  /** Confirmed hard rules. Non-empty exactly when state is "held". */
  hardRules: ScoreReason[];
  /** Retained for existing consumers. Equivalent to state === "held". */
  blocked: boolean;
};

export type TierCounts = {
  catalogueScanned: number;
  categoryCorrect: number;
  /** Products whose category could not be established. Reported separately. */
  unknownCategory: number;
  strong: number;
  worth: number;
  other: number;
  held: number;
};

export type ResultPartition = {
  requested: string | null;
  inCategory: ScoredProduct[];
  unknownCategory: ScoredProduct[];
  wrongCategory: ScoredProduct[];
  counts: TierCounts;
};
