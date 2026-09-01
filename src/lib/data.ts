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
  { id: "asos", name: "ASOS", url: "https://www.asos.com/women/dresses/cat/?cid=8799", kind: "retailer" },
  { id: "next", name: "Next", url: "https://www.next.co.uk/shop/womens/clothing/dresses", kind: "retailer" },
  { id: "jigsaw", name: "Jigsaw", url: "https://www.jigsaw-online.com/collections/dresses", kind: "shopify" },
  { id: "jovonna", name: "Jovonna", url: "https://jovonnalondon.com/collections/dresses-fp", kind: "shopify" },
  { id: "vinted", name: "Vinted", url: "https://www.vinted.co.uk/", kind: "secondhand" },
  { id: "johnlewis", name: "John Lewis", url: "https://www.johnlewis.com/browse/women/womens-dresses/_/N-flw", kind: "retailer" },
];

export const products: Product[] = [
  { id: "p1", retailerId: "asos", name: "Satin square-neck midi dress", brand: "ASOS Design", price: 58, colour: "Dark pink", hex: "#A81955", silhouette: "Fit and flare", neckline: "Square", sleeve: "Long", pattern: "Solid", material: "Silk", length: "Midi", sizes: ["UK 8", "UK 10", "UK 12"] },
  { id: "p2", retailerId: "asos", name: "Ditsy chiffon tea dress", brand: "Never Fully Dressed", price: 92, colour: "Jewel tones", hex: "#173F4F", silhouette: "A-line", neckline: "Scoop", sleeve: "3/4", pattern: "Ditsy", material: "Chiffon", length: "Midi", sizes: ["UK 10", "UK 12", "UK 14"], accent: "#D13A69" },
  { id: "p3", retailerId: "asos", name: "Soft drape cowl midi", brand: "Selected", price: 76, colour: "Grey", hex: "#98999B", silhouette: "Flowy", neckline: "Cowl", sleeve: "Sleeveless", pattern: "Solid", material: "Polyester", length: "Midi", sizes: ["UK 8", "UK 10"] },
  { id: "p4", retailerId: "asos", name: "Linen gingham sundress", brand: "Reclaimed Vintage", price: 64, colour: "Red", hex: "#B62B35", silhouette: "A-line", neckline: "Square", sleeve: "Sleeveless", pattern: "Gingham", material: "Linen", length: "Midi", sizes: ["UK 6", "UK 8", "UK 10", "UK 12"], accent: "#F6E9D9" },
  { id: "p5", retailerId: "next", name: "Cotton boat-neck day dress", brand: "Next", price: 46, colour: "Camel", hex: "#B47A4E", silhouette: "Fit and flare", neckline: "Boat", sleeve: "3/4", pattern: "Solid", material: "Pure cotton", length: "Midi", sizes: ["UK 10", "UK 12", "UK 14"] },
  { id: "p6", retailerId: "next", name: "Terracotta linen wrap dress", brand: "Love & Roses", price: 78, colour: "Terracotta", hex: "#B5543C", silhouette: "Flowy", neckline: "Scoop", sleeve: "Long", pattern: "Solid", material: "Linen", length: "Midi", sizes: ["UK 8", "UK 10", "UK 12"] },
  { id: "p7", retailerId: "next", name: "Olive utility shift dress", brand: "Friends Like These", price: 52, colour: "Olive", hex: "#72704B", silhouette: "Boxy", neckline: "Boat", sleeve: "Cap", pattern: "Solid", material: "Pure cotton", length: "Mini", sizes: ["UK 8", "UK 10"] },
  { id: "p8", retailerId: "jigsaw", name: "Jewel silk pleated dress", brand: "Jigsaw", price: 98, colour: "Jewel tones", hex: "#315A64", silhouette: "A-line", neckline: "Boat", sleeve: "Sleeveless", pattern: "Solid", material: "Silk", length: "Midi", sizes: ["UK 10", "UK 12"] },
  { id: "p9", retailerId: "jovonna", name: "Ruby scoop-neck midi", brand: "Jovonna London", price: 89, colour: "Red", hex: "#9E2632", silhouette: "Fit and flare", neckline: "Scoop", sleeve: "Long", pattern: "Solid", material: "Chiffon", length: "Midi", sizes: ["UK 8", "UK 10"] },
  { id: "p10", retailerId: "vinted", name: "Pre-loved plaid midi dress", brand: "Mango", price: 28, colour: "Dark pink", hex: "#74384E", silhouette: "A-line", neckline: "Square", sleeve: "3/4", pattern: "Plaid", material: "Pure cotton", length: "Midi", sizes: ["UK 10"], accent: "#E9B8A7" },
  { id: "p11", retailerId: "johnlewis", name: "Burnt orange linen midi", brand: "Whistles", price: 95, colour: "Burnt orange", hex: "#C35E2D", silhouette: "Flowy", neckline: "Square", sleeve: "Sleeveless", pattern: "Solid", material: "Linen", length: "Midi", sizes: ["UK 8", "UK 10", "UK 12"] },
  { id: "p12", retailerId: "johnlewis", name: "Taupe animal-print column dress", brand: "Phase Eight", price: 99, colour: "Taupe", hex: "#8B7969", silhouette: "Structured", neckline: "Cowl", sleeve: "Cap", pattern: "Animal", material: "Polyester", length: "Maxi", sizes: ["UK 10", "UK 12"] },
];

