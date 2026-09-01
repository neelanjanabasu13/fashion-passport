export const colourGuidance: Record<string, string[]> = {
  "Deep Winter": ["Black", "White", "Red", "Dark pink", "Jewel tones", "Blue"],
  "Soft Summer": ["Blue", "Grey", "Pink", "White", "Taupe", "Green"],
  "Warm Spring": ["Red", "Burnt orange", "Yellow", "Green", "Pink", "Camel"],
  "Deep Autumn": ["Terracotta", "Burnt orange", "Camel", "Olive", "Brown", "Jewel tones"],
};

export const shapeGuidance: Record<string, { silhouettes: string[]; necklines: string[] }> = {
  "Inverted triangle": { silhouettes: ["A-line", "Fit and flare", "Flowy"], necklines: ["V-neck", "Scoop", "Asymmetric"] },
  "Pear": { silhouettes: ["A-line", "Fit and flare", "Structured"], necklines: ["Boat", "Square", "Cowl"] },
  "Hourglass": { silhouettes: ["Fit and flare", "Structured", "A-line"], necklines: ["V-neck", "Scoop", "Square"] },
  "Rectangle": { silhouettes: ["Fit and flare", "Flowy", "Structured"], necklines: ["Asymmetric", "Cowl", "Scoop"] },
  "Apple": { silhouettes: ["Flowy", "A-line", "Structured"], necklines: ["V-neck", "Scoop", "Asymmetric"] },
};

export function inferColourSeason(undertone: string, contrast: string, depth: string) {
  if (undertone === "warm") return contrast === "clear" && depth !== "deep" ? "Warm Spring" : "Deep Autumn";
  if (undertone === "cool") return contrast === "high" || depth === "deep" ? "Deep Winter" : "Soft Summer";
  return contrast === "high" || depth === "deep" ? "Deep Winter" : "Soft Summer";
}

export function theoryFor(colourSeason: string, bodyShape: string) {
  return {
    colours: colourGuidance[colourSeason] || [],
    silhouettes: shapeGuidance[bodyShape]?.silhouettes || [],
    necklines: shapeGuidance[bodyShape]?.necklines || [],
  };
}
