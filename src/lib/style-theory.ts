/**
 * Suitability foundation. Deliberately the weakest layer in scoring: it is a
 * starting point, not a diagnosis, and explicit taste always outranks it.
 * All values use the canonical ontology labels so they compare cleanly.
 */

export const SEASONS = [
  "Deep Winter", "Cool Winter", "Clear Winter",
  "Cool Summer", "Soft Summer", "Light Summer",
  "Soft Autumn", "Warm Autumn", "Deep Autumn",
  "Light Spring", "Warm Spring", "Clear Spring",
] as const;
export type Season = (typeof SEASONS)[number];

export const colourGuidance: Record<string, string[]> = {
  "Deep Winter": ["Black", "White", "Red", "Navy", "Purple", "Dark pink"],
  "Cool Winter": ["Navy", "White", "Dark pink", "Blue", "Grey", "Purple"],
  "Clear Winter": ["Black", "White", "Red", "Blue", "Green", "Dark pink"],
  "Cool Summer": ["Blue", "Grey", "Pink", "Purple", "White", "Navy"],
  "Soft Summer": ["Blue", "Grey", "Pink", "White", "Taupe", "Green"],
  "Light Summer": ["Blue", "Pink", "White", "Grey", "Purple", "Green"],
  "Soft Autumn": ["Terracotta", "Camel", "Olive", "Green", "Brown", "Taupe"],
  "Warm Autumn": ["Burnt orange", "Terracotta", "Camel", "Olive", "Brown", "Green"],
  "Deep Autumn": ["Terracotta", "Burnt orange", "Camel", "Olive", "Brown", "Red"],
  "Light Spring": ["Pink", "Yellow", "Green", "Blue", "White", "Camel"],
  "Warm Spring": ["Red", "Burnt orange", "Yellow", "Green", "Pink", "Camel"],
  "Clear Spring": ["Red", "Blue", "Green", "Yellow", "Pink", "White"],
};

export type ShapeGuidance = { silhouettes: string[]; necklines: string[]; sleeves: string[]; lengths: string[]; materials: string[] };

export const shapeGuidance: Record<string, ShapeGuidance> = {
  "Inverted triangle": {
    silhouettes: ["A-line", "Fit and flare", "Flowy"],
    necklines: ["V-neck", "Scoop", "Asymmetric/one-shoulder"],
    sleeves: ["Sleeveless", "3/4"],
    lengths: ["Midi/midaxi", "Maxi/floor"],
    materials: ["Chiffon", "Silk", "Linen"],
  },
  Pear: {
    silhouettes: ["A-line", "Fit and flare", "Tailored/structured"],
    necklines: ["Boat/bateau", "Square", "Cowl"],
    sleeves: ["Long", "3/4", "Puff"],
    lengths: ["Midi/midaxi", "Maxi/floor"],
    materials: ["Cotton/pure cotton", "Linen", "Silk"],
  },
  Hourglass: {
    silhouettes: ["Fit and flare", "Wrap", "Tailored/structured"],
    necklines: ["V-neck", "Scoop", "Square", "Sweetheart"],
    sleeves: ["3/4", "Long", "Sleeveless"],
    lengths: ["Midi/midaxi", "Knee"],
    materials: ["Silk", "Cotton/pure cotton", "Jersey"],
  },
  Rectangle: {
    silhouettes: ["Fit and flare", "Flowy", "Wrap"],
    necklines: ["Asymmetric/one-shoulder", "Cowl", "Scoop", "Halter"],
    sleeves: ["Cap", "3/4", "Puff"],
    lengths: ["Mini", "Midi/midaxi"],
    materials: ["Chiffon", "Silk", "Linen"],
  },
  Apple: {
    silhouettes: ["Flowy", "A-line", "Column"],
    necklines: ["V-neck", "Scoop", "Asymmetric/one-shoulder"],
    sleeves: ["3/4", "Long"],
    lengths: ["Midi/midaxi", "Maxi/floor"],
    materials: ["Silk", "Chiffon", "Viscose"],
  },
};

export const BODY_SHAPES = Object.keys(shapeGuidance);

/**
 * Grouped routes into the 12-season vocabulary. The demonstrator asks about
 * undertone, depth and contrast; the model keeps the full season list so a
 * shopper who already knows their season can select it directly.
 */
export function inferColourSeason(undertone: string, contrast: string, depth: string): Season {
  if (undertone === "warm") {
    if (depth === "deep") return "Deep Autumn";
    if (depth === "light") return contrast === "high" ? "Clear Spring" : "Light Spring";
    return contrast === "high" ? "Warm Spring" : "Soft Autumn";
  }
  if (undertone === "cool") {
    if (depth === "deep") return contrast === "high" ? "Deep Winter" : "Cool Winter";
    if (depth === "light") return "Light Summer";
    return contrast === "high" ? "Cool Winter" : "Soft Summer";
  }
  if (depth === "deep") return contrast === "high" ? "Deep Winter" : "Soft Autumn";
  if (depth === "light") return contrast === "high" ? "Clear Spring" : "Light Summer";
  return contrast === "high" ? "Clear Winter" : "Soft Summer";
}

export function theoryFor(colourSeason: string, bodyShape: string) {
  const shape = shapeGuidance[bodyShape];
  return {
    colours: colourGuidance[colourSeason] || [],
    silhouettes: shape?.silhouettes || [],
    necklines: shape?.necklines || [],
    sleeves: shape?.sleeves || [],
    lengths: shape?.lengths || [],
    materials: shape?.materials || [],
  };
}

type TheoryProduct = { colour: string; silhouette: string; neckline: string; sleeve: string; length: string; material: string };
const same = (values: string[], value: string) =>
  value !== "Unknown" && value !== "Not stated" && values.some((item) => item.toLowerCase() === value.toLowerCase());

export function theoryFit(product: TheoryProduct, colourSeason: string, bodyShape: string) {
  const guidance = theoryFor(colourSeason, bodyShape);
  const matches = [
    same(guidance.colours, product.colour) && `Colour · ${product.colour}`,
    same(guidance.silhouettes, product.silhouette) && `Shape · ${product.silhouette}`,
    same(guidance.necklines, product.neckline) && `Neckline · ${product.neckline}`,
    same(guidance.sleeves, product.sleeve) && `Sleeve · ${product.sleeve}`,
    same(guidance.lengths, product.length) && `Length · ${product.length}`,
    same(guidance.materials, product.material) && `Fabric · ${product.material}`,
  ].filter((value): value is string => Boolean(value));
  return { score: matches.length, matches };
}
