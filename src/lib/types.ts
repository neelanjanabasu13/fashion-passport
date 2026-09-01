export type PreferenceStrength = "love" | "avoid";

export type FashionProfile = {
  label: string;
  country: string;
  size: string;
  heightCm: number;
  colourSeason: string;
  bodyShape: string;
  budget: number;
  colours: { love: string[]; avoid: string[] };
  silhouettes: { love: string[]; avoid: string[] };
  necklines: { love: string[]; avoid: string[] };
  sleeves: { love: string[]; avoid: string[] };
  patterns: { love: string[]; avoid: string[] };
  materials: { love: string[]; avoid: string[] };
  lengths: { love: string[]; avoid: string[] };
  retailers: { love: string[]; avoid: string[] };
};

export type Retailer = {
  id: string;
  name: string;
  url: string;
  kind: "retailer" | "shopify" | "secondhand";
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
};

export type ScoreReason = {
  label: string;
  kind: "positive" | "warning" | "theory";
  weight: number;
};

export type ScoredProduct = Product & {
  score: number;
  reasons: ScoreReason[];
  blocked: boolean;
};

