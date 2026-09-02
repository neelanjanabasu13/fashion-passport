import type { FashionProfile, Retailer } from "./types";

export const demoProfile: FashionProfile = {
  label: "My Fashion Passport",
  country: "UK",
  size: "UK 10",
  heightCm: 163,
  colourSeason: "Deep Winter",
  bodyShape: "Inverted triangle",
  budget: 100,
  budgetMode: "usual",
  // Canonical ontology labels so preferences compare cleanly against evidence.
  colours: {
    love: ["Red", "Burnt orange", "Terracotta", "Navy", "Dark pink", "Camel"],
    avoid: ["Olive", "Grey", "Taupe"],
    never: [],
  },
  silhouettes: { love: ["Flowy", "A-line", "Fit and flare"], avoid: ["Shift/boxy", "Tailored/structured"], never: [] },
  necklines: { love: ["Square", "Boat/bateau", "Scoop"], avoid: ["Cowl"], never: [] },
  sleeves: { love: ["Long", "3/4", "Sleeveless"], avoid: ["Cap"], never: [] },
  patterns: { love: ["Ditsy/small floral", "Gingham", "Check/plaid", "Solid/plain"], avoid: ["Abstract/large print", "Animal"], never: [] },
  // Polyester is an ordinary avoid, never a hard block. See the named regression case.
  materials: { love: ["Chiffon", "Silk", "Cotton/pure cotton", "Linen"], avoid: ["Polyester"], never: [] },
  lengths: { love: ["Midi/midaxi"], avoid: [], never: [] },
  retailers: { love: ["John Lewis", "ASOS", "Next", "Zara", "Mango"], avoid: ["Primark", "Shein", "Temu"], never: [] },
};

export const retailers: Retailer[] = [
  { id: "jigsaw", name: "Jigsaw", url: "https://www.jigsaw-online.com/collections/dresses", endpoint: "https://www.jigsaw-online.com/api/ucp/mcp", kind: "shopify" },
  { id: "lucyandyak", name: "Lucy & Yak", url: "https://lucyandyak.com/collections/dresses", endpoint: "https://lucyandyak.com/api/ucp/mcp", kind: "shopify" },
  { id: "ohpolly", name: "Oh Polly", url: "https://www.ohpolly.com/collections/dresses", endpoint: "https://ohpolly.com/api/ucp/mcp", kind: "shopify" },
  { id: "neverfullydressed", name: "Never Fully Dressed", url: "https://www.neverfullydressed.com/collections/dresses", endpoint: "https://www.neverfullydressed.com/api/ucp/mcp", kind: "shopify" },
  { id: "rixo", name: "RIXO", url: "https://rixolondon.com", endpoint: "https://rixolondon.com/api/ucp/mcp", kind: "shopify" },
  { id: "kitri", name: "KITRI", url: "https://kitristudio.com", endpoint: "https://kitristudio.com/api/ucp/mcp", kind: "shopify" },
  { id: "omnes", name: "OMNES", url: "https://omnes.com", endpoint: "https://omnes.com/api/ucp/mcp", kind: "shopify" },
  { id: "nobodyschild", name: "Nobody's Child", url: "https://nobodyschild.com", endpoint: "https://nobodyschild.com/api/ucp/mcp", kind: "shopify" },
  { id: "houseofsunny", name: "House of Sunny", url: "https://houseofsunny.com", endpoint: "https://houseofsunny.com/api/ucp/mcp", kind: "shopify" },
  { id: "motelrocks", name: "Motel Rocks", url: "https://motelrocks.com", endpoint: "https://motelrocks.com/api/ucp/mcp", kind: "shopify" },
  { id: "meshki", name: "MESHKI", url: "https://meshki.co.uk", endpoint: "https://meshki.co.uk/api/ucp/mcp", kind: "shopify" },
  { id: "nadinemerabi", name: "Nadine Merabi", url: "https://nadinemerabi.com", endpoint: "https://nadinemerabi.com/api/ucp/mcp", kind: "shopify" },
  { id: "finisterre", name: "Finisterre", url: "https://finisterre.com", endpoint: "https://finisterre.com/api/ucp/mcp", kind: "shopify" },
  { id: "passenger", name: "Passenger", url: "https://passenger-clothing.com", endpoint: "https://passenger-clothing.com/api/ucp/mcp", kind: "shopify" },
  { id: "beyondnine", name: "Beyond Nine", url: "https://beyondnine.co.uk", endpoint: "https://beyondnine.co.uk/api/ucp/mcp", kind: "shopify" },
  { id: "albaray", name: "Albaray", url: "https://albaray.co.uk", endpoint: "https://albaray.co.uk/api/ucp/mcp", kind: "shopify" },
  { id: "roandzo", name: "Ro&Zo", url: "https://roandzo.com", endpoint: "https://roandzo.com/api/ucp/mcp", kind: "shopify" },
  { id: "disturbia", name: "Disturbia", url: "https://disturbia.co.uk", endpoint: "https://disturbia.co.uk/api/ucp/mcp", kind: "shopify" },
];
