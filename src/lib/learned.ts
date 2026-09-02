import type { LearnedPreference, LearnedTaste, TraitVote } from "./types";
import { FASHION_DIMENSIONS, mapToCanonical, type Dimension } from "./ontology";

/**
 * Canonical trait keys, e.g. `colour:navy`, `neckline:halter`, `material:polyester`.
 * Raw up/down tallies are kept so a preference can recover when behaviour changes.
 */
export const traitKey = (dimension: Dimension, value: string) => `${dimension}:${value.toLowerCase()}`;

export const emptyLearned = (): LearnedTaste => ({});

/** One reaction records a vote. It never creates a rule on its own. */
export function recordVote(
  learned: LearnedTaste,
  keys: string[],
  direction: "up" | "down",
  now = new Date().toISOString(),
): LearnedTaste {
  const next: LearnedTaste = { ...learned };
  for (const key of keys) {
    const current: TraitVote = next[key] ?? { up: 0, down: 0, updatedAt: now };
    next[key] = { ...current, [direction]: current[direction] + 1, updatedAt: now };
  }
  return next;
}

/** Reverses one previously recorded reaction. */
export function undoVote(learned: LearnedTaste, keys: string[], direction: "up" | "down"): LearnedTaste {
  const next: LearnedTaste = { ...learned };
  for (const key of keys) {
    const current = next[key];
    if (!current) continue;
    const value = Math.max(0, current[direction] - 1);
    const updated = { ...current, [direction]: value };
    if (updated.up === 0 && updated.down === 0) delete next[key];
    else next[key] = updated;
  }
  return next;
}

/**
 * EXECUTION_SPEC section 5:
 *   up - down >= 2   learned positive
 *   down - up >= 2   learned negative
 *   confidence       min(1, |up - down| / 4)
 */
export function derivePreferences(learned: LearnedTaste): LearnedPreference[] {
  return Object.entries(learned)
    .map(([key, vote]) => {
      const delta = vote.up - vote.down;
      if (Math.abs(delta) < 2) return null;
      return {
        key,
        direction: delta > 0 ? ("positive" as const) : ("negative" as const),
        confidence: Math.min(1, Math.abs(delta) / 4),
        interactions: vote.up + vote.down,
      };
    })
    .filter((entry): entry is LearnedPreference => entry !== null)
    .sort((a, b) => b.confidence - a.confidence || b.interactions - a.interactions);
}

export function lookupPreference(preferences: LearnedPreference[], dimension: Dimension, value: string) {
  if (value === "Unknown") return undefined;
  return preferences.find((preference) => preference.key === traitKey(dimension, value));
}

/** Trait keys carried by one product, used when a reaction is recorded. */
export function traitKeysForProduct(evidence: Record<string, { value: string }>): string[] {
  return FASHION_DIMENSIONS.map((dimension) => {
    const attribute = evidence[dimension];
    return attribute && attribute.value !== "Unknown" ? traitKey(dimension, attribute.value) : null;
  }).filter((key): key is string => key !== null);
}

/** Human label for the `Passport learned:` message. */
export function describeTrait(key: string) {
  const [dimension, value] = key.split(":");
  const label = value.charAt(0).toUpperCase() + value.slice(1);
  return { dimension: dimension as Dimension, label };
}

/**
 * Bridge for profiles saved before the vote model existed, where signals were a
 * flat list of bare trait values. Each value is resolved back to its dimension
 * so the preference survives the upgrade instead of being discarded.
 */
export function legacySignalsToPreferences(signals: string[]): LearnedPreference[] {
  const preferences: LearnedPreference[] = [];
  for (const raw of signals) {
    const value = raw.replace(/^(love|avoid):/, "");
    const direction = raw.startsWith("love:") ? ("positive" as const) : ("negative" as const);
    for (const dimension of FASHION_DIMENSIONS) {
      const canonical = mapToCanonical(dimension, value);
      if (!canonical) continue;
      preferences.push({ key: traitKey(dimension, canonical), direction, confidence: 0.5, interactions: 2 });
      break;
    }
  }
  return preferences;
}
