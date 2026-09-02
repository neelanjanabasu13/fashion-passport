import type { BudgetMode, FashionProfile, PreferenceGroup, StoredFashionProfile } from "./types";

const GROUP_KEYS = [
  "colours",
  "silhouettes",
  "necklines",
  "sleeves",
  "patterns",
  "materials",
  "lengths",
  "retailers",
] as const;

const group = (value?: Partial<PreferenceGroup>): PreferenceGroup => ({
  love: value?.love ?? [],
  avoid: value?.avoid ?? [],
  never: value?.never ?? [],
});

/**
 * Migrates a saved profile forward without discarding it.
 * Existing `love`/`avoid` arrays stay valid, a missing `never` becomes `[]`,
 * and a missing budget mode becomes `usual` rather than `strict`.
 */
export function normaliseProfile(stored: StoredFashionProfile | FashionProfile): FashionProfile {
  const source = stored as StoredFashionProfile;
  const migrated = { ...(source as unknown as FashionProfile) };
  for (const key of GROUP_KEYS) migrated[key] = group(source[key]);
  migrated.budgetMode = (source.budgetMode as BudgetMode) === "strict" ? "strict" : "usual";
  return migrated;
}

export function readProfile(raw: string | null, fallback: FashionProfile): FashionProfile {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as StoredFashionProfile;
    if (!parsed || typeof parsed !== "object") return fallback;
    return normaliseProfile({ ...(fallback as unknown as StoredFashionProfile), ...parsed });
  } catch {
    return fallback;
  }
}
