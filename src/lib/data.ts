import type { FashionProfile, Product, Retailer } from "./types";

export const demoProfile: FashionProfile = {
  label: "My Fashion Passport",
  country: "UK",
  size: "UK 10",
  heightCm: 163,
  colourSeason: "Deep Winter",
  bodyShape: "Inverted triangle",
  budget: 100,
  colours: {
    love: ["Red", "Burnt orange", "Terracotta", "Jewel tones", "Dark pink", "Camel"],
    avoid: ["Olive", "Grey", "Taupe"],
  },
  silhouettes: { love: ["Flowy", "A-line", "Fit and flare"], avoid: ["Boxy", "Structured"] },
  necklines: { love: ["Square", "Boat", "Scoop"], avoid: ["Cowl"] },
  sleeves: { love: ["Long", "3/4", "Sleeveless"], avoid: ["Cap"] },
  patterns: { love: ["Ditsy", "Gingham", "Plaid", "Solid"], avoid: ["Large print", "Animal"] },
  materials: { love: ["Chiffon", "Silk", "Pure cotton", "Linen"], avoid: ["Polyester"] },
  lengths: { love: ["Midi"], avoid: [] },
  retailers: { love: ["John Lewis", "ASOS", "Next", "Zara", "Mango"], avoid: ["Primark", "Shein", "Temu"] },
};

export const retailers: Retailer[] = [
  { id: "jigsaw", name: "Jigsaw", url: "https://www.jigsaw-online.com/collections/dresses", endpoint: "https://www.jigsaw-online.com/api/ucp/mcp", kind: "shopify" },
  { id: "lucyandyak", name: "Lucy & Yak", url: "https://lucyandyak.com/collections/dresses", endpoint: "https://lucyandyak.com/api/ucp/mcp", kind: "shopify" },
  { id: "ohpolly", name: "Oh Polly", url: "https://www.ohpolly.com/collections/dresses", endpoint: "https://ohpolly.com/api/ucp/mcp", kind: "shopify" },
  { id: "neverfullydressed", name: "Never Fully Dressed", url: "https://www.neverfullydressed.com/collections/dresses", endpoint: "https://www.neverfullydressed.com/api/ucp/mcp", kind: "shopify" },
];

export const tasteProducts: Product[] = [
  { id: "p1", retailerId: "taste", name: "Satin square-neck midi dress", brand: "Preference study", price: 0, colour: "Dark pink", hex: "#A81955", silhouette: "Fit and flare", neckline: "Square", sleeve: "Long", pattern: "Solid", material: "Silk", length: "Midi", sizes: [] },
  { id: "p2", retailerId: "taste", name: "Ditsy chiffon tea dress", brand: "Preference study", price: 0, colour: "Jewel tones", hex: "#173F4F", silhouette: "A-line", neckline: "Scoop", sleeve: "3/4", pattern: "Ditsy", material: "Chiffon", length: "Midi", sizes: [], accent: "#D13A69" },
  { id: "p3", retailerId: "taste", name: "Soft drape cowl midi", brand: "Preference study", price: 0, colour: "Grey", hex: "#98999B", silhouette: "Flowy", neckline: "Cowl", sleeve: "Sleeveless", pattern: "Solid", material: "Polyester", length: "Midi", sizes: [] },
  { id: "p4", retailerId: "taste", name: "Linen gingham sundress", brand: "Preference study", price: 0, colour: "Red", hex: "#B62B35", silhouette: "A-line", neckline: "Square", sleeve: "Sleeveless", pattern: "Gingham", material: "Linen", length: "Midi", sizes: [], accent: "#F6E9D9" },
  { id: "p5", retailerId: "taste", name: "Cotton boat-neck day dress", brand: "Preference study", price: 0, colour: "Camel", hex: "#B47A4E", silhouette: "Fit and flare", neckline: "Boat", sleeve: "3/4", pattern: "Solid", material: "Pure cotton", length: "Midi", sizes: [] },
  { id: "p6", retailerId: "taste", name: "Terracotta linen wrap dress", brand: "Preference study", price: 0, colour: "Terracotta", hex: "#B5543C", silhouette: "Flowy", neckline: "Scoop", sleeve: "Long", pattern: "Solid", material: "Linen", length: "Midi", sizes: [] },
  { id: "p7", retailerId: "taste", name: "Olive utility shift dress", brand: "Preference study", price: 0, colour: "Olive", hex: "#72704B", silhouette: "Boxy", neckline: "Boat", sleeve: "Cap", pattern: "Solid", material: "Pure cotton", length: "Mini", sizes: [] },
  { id: "p8", retailerId: "taste", name: "Jewel silk pleated dress", brand: "Preference study", price: 0, colour: "Jewel tones", hex: "#315A64", silhouette: "A-line", neckline: "Boat", sleeve: "Sleeveless", pattern: "Solid", material: "Silk", length: "Midi", sizes: [] },
  { id: "p9", retailerId: "taste", name: "Ruby scoop-neck midi", brand: "Preference study", price: 0, colour: "Red", hex: "#9E2632", silhouette: "Fit and flare", neckline: "Scoop", sleeve: "Long", pattern: "Solid", material: "Chiffon", length: "Midi", sizes: [] },
  { id: "p10", retailerId: "taste", name: "Plaid midi dress", brand: "Preference study", price: 0, colour: "Dark pink", hex: "#74384E", silhouette: "A-line", neckline: "Square", sleeve: "3/4", pattern: "Plaid", material: "Pure cotton", length: "Midi", sizes: [], accent: "#E9B8A7" },
  { id: "p11", retailerId: "taste", name: "Burnt orange linen midi", brand: "Preference study", price: 0, colour: "Burnt orange", hex: "#C35E2D", silhouette: "Flowy", neckline: "Square", sleeve: "Sleeveless", pattern: "Solid", material: "Linen", length: "Midi", sizes: [] },
  { id: "p12", retailerId: "taste", name: "Taupe animal-print column dress", brand: "Preference study", price: 0, colour: "Taupe", hex: "#8B7969", silhouette: "Structured", neckline: "Cowl", sleeve: "Cap", pattern: "Animal", material: "Polyester", length: "Maxi", sizes: [] },
];
