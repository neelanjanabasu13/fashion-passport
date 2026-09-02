import type {
  FashionProfile,
  LearnedPreference,
  Product,
  ResultState,
  ScoreReason,
  ScoredProduct,
  TierCounts,
} from "./types";
import { FASHION_DIMENSIONS, type Dimension, requestedCategory } from "./ontology";
import { evidenceConfidenceFor, hardPriceCap, sizeConfirmedUnavailable } from "./extract";
import { lookupPreference } from "./learned";
import { theoryFit, theoryFor } from "./style-theory";

/** EXECUTION_SPEC section 7. Explicit preference outranks theory and learning. */
const LOVE_WEIGHT: Record<Dimension, number> = {
  category: 0, colour: 12, silhouette: 10, neckline: 8, sleeve: 5, length: 6, material: 7, pattern: 5,
};
const AVOID_WEIGHT: Record<Dimension, number> = {
  category: 0, colour: 12, silhouette: 10, neckline: 8, sleeve: 5, length: 6, material: 9, pattern: 6,
};
const THEORY_WEIGHT: Record<Dimension, number> = {
  category: 0, colour: 5, silhouette: 5, neckline: 3, sleeve: 2, length: 2, material: 2, pattern: 0,
};

const PROFILE_GROUP: Record<Dimension, keyof FashionProfile | null> = {
  category: null, colour: "colours", silhouette: "silhouettes", neckline: "necklines",
  sleeve: "sleeves", length: "lengths", material: "materials", pattern: "patterns",
};

const THEORY_GROUP: Record<Dimension, keyof ReturnType<typeof theoryFor> | null> = {
  category: null, colour: "colours", silhouette: "silhouettes", neckline: "necklines",
  sleeve: "sleeves", length: "lengths", material: "materials", pattern: null,
};

const normalise = (value: string) => value.trim().toLowerCase();
const listHas = (values: string[] | undefined, value: string) =>
  value !== "Unknown" && (values ?? []).some((entry) => normalise(entry) === normalise(value));

export type ScoreContext = {
  profile: FashionProfile;
  /** The shopper's own query, used only for a hard price cap and category intent. */
  query?: string;
  learned?: LearnedPreference[];
};

export function scoreProduct(product: Product, context: ScoreContext): ScoredProduct {
  const { profile, query = "", learned = [] } = context;
  const evidence = product.evidence;
  const reasons: ScoreReason[] = [];
  const conflicts: ScoreReason[] = [];
  const hardRules: ScoreReason[] = [];

  // Base 40. A product with no usable attributes therefore stays in `other`;
  // missing information must never promote it into `worth`.
  let score = 40;
  const add = (label: string, weight: number, kind: ScoreReason["kind"]) => {
    score += weight;
    (weight >= 0 ? reasons : conflicts).push({ label, weight, kind });
  };

  // ---- Stage 2: hard rules. Only these five can hold a product. ----
  const wantedCategory = requestedCategory(query);
  if (wantedCategory && evidence.category.value !== "Unknown" && evidence.category.value !== wantedCategory) {
    hardRules.push({ label: `Not a ${wantedCategory.toLowerCase()}`, weight: 0, kind: "hard" });
  }
  const cap = hardPriceCap(query);
  if (cap !== null && product.price > cap) {
    hardRules.push({ label: `Over your £${cap} limit for this search`, weight: 0, kind: "hard" });
  }
  if (sizeConfirmedUnavailable(product.availableSizes, profile.size)) {
    hardRules.push({ label: `${profile.size} is sold out`, weight: 0, kind: "hard" });
  }
  for (const dimension of FASHION_DIMENSIONS) {
    const group = PROFILE_GROUP[dimension];
    const value = evidence[dimension].value;
    if (group && listHas((profile[group] as { never?: string[] })?.never, value)) {
      hardRules.push({ label: `${value} is on your never list`, weight: 0, kind: "hard" });
    }
  }
  if (profile.budgetMode === "strict" && product.price > profile.budget) {
    hardRules.push({ label: `Over your £${profile.budget} budget`, weight: 0, kind: "hard" });
  }

  // ---- Stage 3: match score. ----
  const theory = theoryFor(profile.colourSeason, profile.bodyShape);

  for (const dimension of FASHION_DIMENSIONS) {
    const value = evidence[dimension].value;
    if (value === "Unknown") continue; // unknown contributes nothing, in either direction
    const group = PROFILE_GROUP[dimension];
    const preferences = group ? (profile[group] as { love?: string[]; avoid?: string[] }) : undefined;

    const loved = listHas(preferences?.love, value);
    const avoided = listHas(preferences?.avoid, value);

    if (loved) add(`${value} is one you love`, LOVE_WEIGHT[dimension], "positive");
    else if (avoided) add(`${value}`, -AVOID_WEIGHT[dimension], "warning");

    // Theory applies only when the attribute is not explicitly avoided.
    const theoryKey = THEORY_GROUP[dimension];
    if (!avoided && theoryKey && listHas(theory[theoryKey], value)) {
      add(`${value} suits your ${dimension === "colour" ? profile.colourSeason : profile.bodyShape.toLowerCase()}`,
        THEORY_WEIGHT[dimension], "theory");
    }

    // Learned signals never outrank an explicit preference.
    const preference = lookupPreference(learned, dimension, value);
    if (preference && !loved && !avoided) {
      const weight = Math.round(4 * preference.confidence * (preference.direction === "positive" ? 1 : -1));
      if (weight !== 0) {
        add(preference.direction === "positive" ? `More ${value.toLowerCase()} after your feedback`
          : `Less ${value.toLowerCase()} after your feedback`, weight, "learned");
      }
    }
  }

  // Utility evidence.
  if (product.availableSizes.length > 0 && !sizeConfirmedUnavailable(product.availableSizes, profile.size)) {
    add(`${profile.size} in stock`, 3, "positive");
  }
  if (cap !== null && product.price <= cap) add(`Under your £${cap} limit`, 2, "positive");
  if (profile.budgetMode !== "strict" && product.price > profile.budget) {
    add(`Over your usual £${profile.budget}`, -8, "warning");
  }

  const matchScore = Math.max(1, Math.min(99, Math.round(score)));
  const evidenceConfidence = evidenceConfidenceFor(evidence);
  const state: ResultState = hardRules.length > 0 ? "held" : matchScore >= 70 ? "strong" : matchScore >= 50 ? "worth" : "other";

  return {
    ...product,
    score: matchScore,
    matchScore,
    evidenceConfidence,
    state,
    reasons,
    conflicts,
    hardRules,
    blocked: state === "held",
  };
}

const explicitHits = (item: ScoredProduct) =>
  item.reasons.filter((reason) => reason.kind === "positive").length + item.conflicts.filter((reason) => reason.kind === "warning").length;
const theoryHits = (item: ScoredProduct) => item.reasons.filter((reason) => reason.kind === "theory").length;
const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1 } as const;

/** Deterministic tie-break order from EXECUTION_SPEC section 7. */
export function compareRanked(a: ScoredProduct, b: ScoredProduct, valueQuery = false) {
  if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
  if (explicitHits(b) !== explicitHits(a)) return explicitHits(b) - explicitHits(a);
  const confidence = CONFIDENCE_RANK[b.evidenceConfidence] - CONFIDENCE_RANK[a.evidenceConfidence];
  if (confidence !== 0) return confidence;
  if (theoryHits(b) !== theoryHits(a)) return theoryHits(b) - theoryHits(a);
  if (valueQuery && a.price !== b.price) return a.price - b.price;
  return a.name.localeCompare(b.name);
}

const VALUE_QUERY = /\b(budget|cheap|affordable|value|under|less than|bargain|sale)\b/i;

export function rankProducts(items: Product[], context: ScoreContext): ScoredProduct[] {
  const valueQuery = VALUE_QUERY.test(context.query || "");
  return items.map((item) => scoreProduct(item, context)).sort((a, b) => compareRanked(a, b, valueQuery));
}

/**
 * Stage 1 category gate. Category-unknown products never enter a claimed
 * category count; they remain reachable under All products.
 */
export function categoryCorrect(items: ScoredProduct[], query: string) {
  const wanted = requestedCategory(query);
  if (!wanted) return items;
  return items.filter((item) => item.evidence.category.value === wanted);
}

export function tierCounts(scanned: number, ranked: ScoredProduct[], query: string): TierCounts {
  const correct = categoryCorrect(ranked, query);
  return {
    catalogueScanned: scanned,
    categoryCorrect: correct.length,
    strong: ranked.filter((item) => item.state === "strong").length,
    worth: ranked.filter((item) => item.state === "worth").length,
    other: ranked.filter((item) => item.state === "other").length,
    held: ranked.filter((item) => item.state === "held").length,
  };
}

/** Low evidence hides the percentage but never the product. */
export function scoreLabel(item: ScoredProduct) {
  if (item.evidenceConfidence === "low") return "Possible match · limited product information";
  return `${item.matchScore}%`;
}

export function analysisFit(product: Product, profile: FashionProfile) {
  return theoryFit(
    {
      colour: product.colour,
      silhouette: product.silhouette,
      neckline: product.neckline,
      sleeve: product.sleeve,
      length: product.length,
      material: product.material,
    },
    profile.colourSeason,
    profile.bodyShape,
  );
}
