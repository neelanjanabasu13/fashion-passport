import {
  FASHION_DIMENSIONS,
  TAXONOMY_CATEGORY,
  type Dimension,
  containsTerm,
  dimensionForTagKey,
  mapToCanonical,
} from "./ontology";
import type { AttributeEvidence, EvidenceConfidence, ProductEvidence } from "./types";

export const UNKNOWN: AttributeEvidence = { value: "Unknown", confidence: "unknown", source: "unknown" };

/** Raw fields the extractor reads. Shaped to match the UCP product payload. */
export type ExtractionInput = {
  title: string;
  description: string;
  tags: string[];
  options: { name: string; values: string[] }[];
  /** Options on the selected or first available variant. */
  variantOptions: { name: string; value: string }[];
  taxonomyCategories: string[];
  collections: string[];
};

type Candidate = { value: string; source: AttributeEvidence["source"]; confidence: AttributeEvidence["confidence"] };

/**
 * Extraction order, highest authority first (EXECUTION_SPEC section 6):
 *   1. selected/displayed variant data
 *   2. product title
 *   3. structured tags and options
 *   4. description
 * Image analysis is deliberately absent: no approved service exists, so a
 * visually-only attribute stays unknown rather than being invented.
 */
export function extractAttributes(input: ExtractionInput): ProductEvidence {
  const evidence = {} as ProductEvidence;

  for (const dimension of ["category", ...FASHION_DIMENSIONS] as Dimension[]) {
    evidence[dimension] = resolve(dimension, input);
  }
  return evidence;
}

function resolve(dimension: Dimension, input: ExtractionInput): AttributeEvidence {
  for (const candidate of candidatesFor(dimension, input)) {
    if (candidate.value) return { value: candidate.value, confidence: candidate.confidence, source: candidate.source };
  }
  return UNKNOWN;
}

/**
 * A stated fibre composition ("95% polyester") is the most authoritative
 * material evidence a retailer publishes, so it outranks a marketing fabric
 * tag such as `fabric-group:jersey`, which describes construction rather than
 * fibre. Scoped to the material dimension only; every other dimension keeps
 * the plain order in EXECUTION_SPEC section 6.
 */
function statedComposition(description: string): string | null {
  const matches = description.matchAll(/(\d{1,3})\s*%\s*([a-z][a-z\s-]{2,20})/gi);
  let best: { share: number; value: string } | null = null;
  for (const match of matches) {
    const share = Number(match[1]);
    const mapped = mapToCanonical("material", match[2].trim());
    if (!mapped) continue;
    if (!best || share > best.share) best = { share, value: mapped };
  }
  return best?.value ?? null;
}

function* candidatesFor(dimension: Dimension, input: ExtractionInput): Generator<Candidate> {
  // 1. Variant: the colour and size actually being displayed.
  for (const option of input.variantOptions) {
    const hinted = dimensionForTagKey(option.name);
    if (hinted && hinted !== dimension) continue;
    const mapped = mapToCanonical(dimension, option.value);
    if (mapped) yield { value: mapped, source: "variant", confidence: "high" };
  }

  // 1b. Shopify taxonomy is authoritative for category.
  if (dimension === "category") {
    for (const gid of input.taxonomyCategories) {
      const key = gid.split("/").pop() || "";
      const mapped = TAXONOMY_CATEGORY[key];
      if (mapped) yield { value: mapped, source: "option", confidence: "high" };
    }
  }

  // 1c. Stated fibre composition, for material only.
  if (dimension === "material") {
    const composition = statedComposition(input.description);
    if (composition) yield { value: composition, source: "description", confidence: "high" };
  }

  // 2. Title.
  const fromTitle = mapToCanonical(dimension, input.title);
  if (fromTitle) yield { value: fromTitle, source: "title", confidence: "high" };

  // 3. Structured tags. A key hint makes the value authoritative for that
  //    dimension; an unhinted tag is still usable but at medium confidence.
  for (const tag of input.tags) {
    const separator = tag.indexOf(":");
    if (separator === -1) continue;
    const key = tag.slice(0, separator);
    const value = tag.slice(separator + 1);
    const hinted = dimensionForTagKey(key);
    if (hinted !== dimension) continue;
    const mapped = mapToCanonical(dimension, value);
    if (mapped) yield { value: mapped, source: "tag", confidence: "high" };
  }

  // 3b. Collection handles, e.g. `midi-dresses`, carry category and length.
  if (dimension === "category" || dimension === "length") {
    for (const collection of input.collections) {
      const mapped = mapToCanonical(dimension, collection.replace(/-/g, " "));
      if (mapped) yield { value: mapped, source: "tag", confidence: "medium" };
    }
  }

  // 3c. Product-level options (size aside) at medium confidence.
  for (const option of input.options) {
    const hinted = dimensionForTagKey(option.name);
    if (hinted !== dimension) continue;
    if (option.values.length !== 1) continue; // several values means several variants, not one match
    const mapped = mapToCanonical(dimension, option.values[0]);
    if (mapped) yield { value: mapped, source: "option", confidence: "medium" };
  }

  // 3d. Unhinted tags as a fallback.
  for (const tag of input.tags) {
    if (tag.includes(":")) continue;
    const mapped = mapToCanonical(dimension, tag);
    if (mapped) yield { value: mapped, source: "tag", confidence: "medium" };
  }

  // 4. Description, lowest authority.
  const fromDescription = mapToCanonical(dimension, input.description);
  if (fromDescription) yield { value: fromDescription, source: "description", confidence: "medium" };
}

/**
 * Colours are the one dimension where a product can legitimately have several
 * values. Only the displayed variant colour counts as a match; the rest are
 * recorded as alternatives so the product is never scored as matching them all.
 */
export function alternativeColours(input: ExtractionInput, selected: string | null): string[] {
  const option = input.options.find((entry) => /colour|color/i.test(entry.name));
  if (!option) return [];
  const mapped = option.values
    .map((value) => mapToCanonical("colour", value))
    .filter((value): value is string => Boolean(value));
  return Array.from(new Set(mapped.filter((value) => value !== selected)));
}

/** EXECUTION_SPEC section 7: high >= 5 known, medium 3-4, low 0-2. */
export function evidenceConfidenceFor(evidence: ProductEvidence): EvidenceConfidence {
  const known = FASHION_DIMENSIONS.filter((dimension) => evidence[dimension].value !== "Unknown").length;
  if (known >= 5) return "high";
  if (known >= 3) return "medium";
  return "low";
}

/** Sizes reported as available by at least one purchasable variant. */
export function availableSizes(
  variants: { available: boolean; options: { name: string; value: string }[] }[],
): string[] {
  const labels = variants
    .filter((variant) => variant.available)
    .flatMap((variant) => variant.options.filter((option) => /size/i.test(option.name)).map((option) => option.value))
    .filter(Boolean)
    .map((size) => (/^\d+$/.test(size) ? `UK ${size}` : size));
  return Array.from(new Set(labels));
}

/** True only when size data exists and the shopper's size is absent from it. */
export function sizeConfirmedUnavailable(sizes: string[], shopperSize: string) {
  if (sizes.length === 0) return false;
  const wanted = shopperSize.trim().toLowerCase();
  const bare = wanted.replace(/^uk\s*/, "");
  return !sizes.some((size) => {
    const value = size.trim().toLowerCase();
    return value === wanted || value.replace(/^uk\s*/, "") === bare;
  });
}

/** Hard price constraint stated in the shopper's own query, e.g. "under £100". */
export function hardPriceCap(query: string): number | null {
  const match = query.match(/(?:under|below|less than|max(?:imum)?|up to)\s*£?\s*(\d+(?:\.\d{1,2})?)/i);
  if (match) return Number(match[1]);
  const symbol = query.match(/£\s*(\d+(?:\.\d{1,2})?)\s*(?:or less|and under)/i);
  return symbol ? Number(symbol[1]) : null;
}

export { containsTerm };
