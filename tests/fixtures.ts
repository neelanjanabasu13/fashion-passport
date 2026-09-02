import { extractAttributes, availableSizes, alternativeColours, type ExtractionInput } from "../src/lib/extract";
import type { Product } from "../src/lib/types";

export const emptyInput = (): ExtractionInput => ({
  title: "",
  description: "",
  tags: [],
  options: [],
  variantOptions: [],
  taxonomyCategories: [],
  collections: [],
});

export function makeProduct(
  overrides: Partial<ExtractionInput> & {
    price?: number;
    variants?: { available: boolean; options: { name: string; value: string }[] }[];
    id?: string;
  } = {},
): Product {
  const input: ExtractionInput = { ...emptyInput(), ...overrides };
  const evidence = extractAttributes(input);
  const sizes = availableSizes(overrides.variants ?? []);
  const colour = evidence.colour.value;
  return {
    id: overrides.id ?? `test-${input.title || Math.random().toString(36).slice(2)}`,
    retailerId: "test",
    name: input.title || "Untitled",
    brand: "Test Retailer",
    price: overrides.price ?? 50,
    colour,
    hex: "#000000",
    silhouette: evidence.silhouette.value,
    neckline: evidence.neckline.value,
    sleeve: evidence.sleeve.value,
    pattern: evidence.pattern.value,
    material: evidence.material.value,
    length: evidence.length.value,
    category: evidence.category.value,
    evidence,
    alternativeColours: alternativeColours(input, colour === "Unknown" ? null : colour),
    availableSizes: sizes,
    sizes,
    imageUrl: "https://example.test/image.jpg",
    productUrl: "https://example.test/product",
    source: "live-ucp",
  };
}

/**
 * The live Nobody's Child "Amie" halterneck midi dress, as returned by the
 * retailer's own UCP endpoint on 2 September 2026, with polyester added to the
 * description so the named regression case can be exercised deterministically.
 * See CLAUDE_HANDOFF.md: no navy Amie halterneck exists in the live catalogue.
 */
export const amieHalterneck = () =>
  makeProduct({
    id: "nobodyschild-amie-navy",
    title: "Navy Halterneck Amie Midi Dress",
    description:
      "Tie-fastening halterneck V-neck Drop waist Open back Comfort stretch Lightly lined. Main: 95% polyester, 5% elastane.",
    tags: [
      "colour:navy",
      "colour-group:blue",
      "dress-style:a-line dresses",
      "neckline:halterneck",
      "fabric-group:jersey",
      "CLOTHING",
    ],
    options: [{ name: "Size", values: ["4", "6", "8", "10", "12", "14", "16", "18"] }],
    variantOptions: [{ name: "Size", value: "10" }],
    taxonomyCategories: ["gid://shopify/TaxonomyCategory/aa-1-4"],
    collections: ["dresses", "midi-dresses"],
    price: 63.2,
    variants: [
      { available: true, options: [{ name: "Size", value: "10" }] },
      { available: true, options: [{ name: "Size", value: "12" }] },
    ],
  });
