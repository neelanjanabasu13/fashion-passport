export const colourGuidance: Record<string, string[]> = {
  "Deep Winter": ["Black", "White", "Red", "Dark pink", "Jewel tones", "Blue"],
  "Soft Summer": ["Blue", "Grey", "Pink", "White", "Taupe", "Green"],
  "Warm Spring": ["Red", "Burnt orange", "Yellow", "Green", "Pink", "Camel"],
  "Deep Autumn": ["Terracotta", "Burnt orange", "Camel", "Olive", "Brown", "Jewel tones"],
};

export type ShapeGuidance = { silhouettes: string[]; necklines: string[]; sleeves: string[]; lengths: string[]; materials: string[] };

export const shapeGuidance: Record<string, ShapeGuidance> = {
  "Inverted triangle": { silhouettes: ["A-line", "Fit and flare", "Flowy"], necklines: ["V-neck", "Scoop", "Asymmetric"], sleeves: ["Sleeveless", "3/4"], lengths: ["Midi", "Maxi"], materials: ["Chiffon", "Silk", "Linen"] },
  "Pear": { silhouettes: ["A-line", "Fit and flare", "Structured"], necklines: ["Boat", "Square", "Cowl"], sleeves: ["Long", "3/4"], lengths: ["Midi", "Maxi"], materials: ["Pure cotton", "Linen", "Silk"] },
  "Hourglass": { silhouettes: ["Fit and flare", "Structured", "A-line"], necklines: ["V-neck", "Scoop", "Square"], sleeves: ["3/4", "Long", "Sleeveless"], lengths: ["Midi"], materials: ["Silk", "Pure cotton", "Linen"] },
  "Rectangle": { silhouettes: ["Fit and flare", "Flowy", "Structured"], necklines: ["Asymmetric", "Cowl", "Scoop"], sleeves: ["Cap", "3/4"], lengths: ["Mini", "Midi"], materials: ["Chiffon", "Silk", "Linen"] },
  "Apple": { silhouettes: ["Flowy", "A-line", "Structured"], necklines: ["V-neck", "Scoop", "Asymmetric"], sleeves: ["3/4", "Long"], lengths: ["Midi", "Maxi"], materials: ["Silk", "Chiffon", "Linen"] },
};

export function inferColourSeason(undertone: string, contrast: string, depth: string) {
  if (undertone === "warm") return contrast === "clear" && depth !== "deep" ? "Warm Spring" : "Deep Autumn";
  if (undertone === "cool") return contrast === "high" || depth === "deep" ? "Deep Winter" : "Soft Summer";
  return contrast === "high" || depth === "deep" ? "Deep Winter" : "Soft Summer";
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
const same = (values: string[], value: string) => value !== "Not stated" && values.some((item) => item.toLowerCase() === value.toLowerCase());

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
