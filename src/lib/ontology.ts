/**
 * Canonical fashion ontology.
 *
 * Retailers publish attributes under their own tag namespaces: Nobody's Child
 * uses `neckline:halterneck` and `fabric-group:jersey`, Jigsaw uses
 * `canonical_colour:red` and `category:Dresses`. The ontology therefore maps
 * free values onto one canonical vocabulary rather than hard-coding any single
 * retailer's keys.
 */

export type Dimension =
  | "category"
  | "colour"
  | "silhouette"
  | "neckline"
  | "sleeve"
  | "length"
  | "pattern"
  | "material";

export const FASHION_DIMENSIONS: Exclude<Dimension, "category">[] = [
  "colour",
  "silhouette",
  "neckline",
  "sleeve",
  "length",
  "pattern",
  "material",
];

type Vocabulary = Record<string, readonly [string, readonly string[]][]>;

/** Canonical label -> recognised synonyms. Order matters: the first hit wins. */
export const VOCABULARY: Vocabulary = {
  category: [
    ["Jumpsuit/playsuit", ["jumpsuit", "playsuit", "romper", "all-in-one", "boilersuit"]],
    ["Coat/jacket", ["coat", "jacket", "blazer", "trench", "parka", "gilet", "overshirt", "shacket"]],
    ["Knitwear", ["knitwear", "jumper", "cardigan", "sweater", "knit top", "pullover"]],
    ["Jean", ["jean", "jeans", "denim trouser"]],
    ["Trouser", ["trouser", "trousers", "pant", "pants", "chino", "legging", "culotte"]],
    ["Short", ["short", "shorts"]],
    ["Skirt", ["skirt", "skort"]],
    ["Dress", ["dress", "dresses", "gown", "frock"]],
    ["Shirt/blouse", ["shirt", "blouse"]],
    ["Top", ["top", "tops", "bodysuit", "vest", "camisole", "cami", "tee", "t-shirt", "bralet", "corset"]],
  ],
  colour: [
    ["Burnt orange", ["burnt orange"]],
    ["Terracotta", ["terracotta", "rust"]],
    ["Dark pink", ["dark pink", "fuchsia", "magenta", "mulberry", "raspberry", "cerise"]],
    ["Camel", ["camel", "tan", "biscuit", "caramel"]],
    ["Olive", ["olive", "khaki"]],
    ["Taupe", ["taupe", "mushroom", "oatmeal"]],
    ["Navy", ["navy", "midnight"]],
    ["Red", ["red", "ruby", "burgundy", "crimson", "scarlet", "wine", "cherry"]],
    ["Purple", ["purple", "plum", "lilac", "lavender", "violet", "damson"]],
    ["Green", ["green", "emerald", "sage", "mint", "forest"]],
    ["Blue", ["blue", "cobalt", "sapphire", "teal", "denim blue", "indigo"]],
    ["Pink", ["pink", "blush", "rose"]],
    ["Orange", ["orange", "apricot", "coral"]],
    ["Yellow", ["yellow", "butter", "lemon", "mustard"]],
    ["Brown", ["brown", "chocolate", "coffee", "espresso"]],
    ["Grey", ["grey", "gray", "silver", "charcoal", "slate"]],
    ["Black", ["black"]],
    ["White", ["white", "ivory", "cream", "ecru", "off-white"]],
    ["Multi", ["multi", "multicolour", "multicolor"]],
  ],
  silhouette: [
    ["Fit and flare", ["fit and flare", "fit-and-flare", "fit & flare", "waisted", "skater", "nipped waist"]],
    ["A-line", ["a-line", "a line"]],
    ["Wrap", ["wrap"]],
    ["Wide-leg", ["wide-leg", "wide leg", "palazzo", "flare leg"]],
    ["Bodycon", ["bodycon", "body-con", "second skin"]],
    ["Column", ["column", "sheath", "slip dress", "slip"]],
    ["Shift/boxy", ["shift", "boxy", "oversized", "relaxed fit", "smock"]],
    ["Tailored/structured", ["tailored", "structured", "corset", "utility"]],
    ["Straight", ["straight leg", "straight-leg", "straight"]],
    ["Flowy", ["flowy", "fluid", "floaty", "drapey", "tiered", "swing"]],
  ],
  neckline: [
    ["Asymmetric/one-shoulder", ["asymmetric", "one shoulder", "one-shoulder"]],
    ["Halter", ["halterneck", "halter neck", "halter"]],
    ["Sweetheart", ["sweetheart"]],
    ["Square", ["square neck", "square-neck", "square neckline"]],
    ["Boat/bateau", ["boat neck", "boat-neck", "bateau", "slash neck", "slash-neck"]],
    ["Scoop", ["scoop neck", "scoop-neck", "scoop"]],
    ["Cowl", ["cowl"]],
    ["Strapless", ["strapless", "bandeau"]],
    ["V-neck", ["v-neck", "v neck", "vneck", "plunge"]],
    ["High/crew", ["high neck", "high-neck", "crew neck", "crew-neck", "funnel neck", "roll neck", "polo neck"]],
  ],
  sleeve: [
    ["Bardot/off-shoulder", ["bardot", "off shoulder", "off-shoulder", "off-the-shoulder"]],
    ["Flutter", ["flutter", "angel sleeve"]],
    ["Puff", ["puff sleeve", "puff-sleeve", "puffed sleeve", "balloon sleeve"]],
    ["3/4", ["3/4 sleeve", "three-quarter sleeve", "three quarter sleeve", "3/4"]],
    ["Cap", ["cap sleeve", "cap-sleeve"]],
    ["Strappy/camisole", ["strappy", "cami", "camisole", "spaghetti strap"]],
    ["Sleeveless", ["sleeveless", "no sleeve"]],
    ["Long", ["long sleeve", "long-sleeve", "long sleeves"]],
    ["Short", ["short sleeve", "short-sleeve", "short sleeves"]],
  ],
  length: [
    ["Midi/midaxi", ["midi", "midaxi", "mid-length"]],
    ["Maxi/floor", ["maxi", "floor length", "floor-length", "full length"]],
    ["Mini", ["mini", "above knee", "above-the-knee"]],
    ["Knee", ["knee length", "knee-length", "on the knee"]],
  ],
  pattern: [
    ["Ditsy/small floral", ["ditsy", "small floral", "micro floral"]],
    ["Gingham", ["gingham"]],
    ["Check/plaid", ["check", "checked", "plaid", "tartan", "houndstooth"]],
    ["Polka dot", ["polka dot", "polka-dot", "spot", "spotted"]],
    ["Animal", ["animal print", "leopard", "zebra", "snake print", "cheetah"]],
    ["Stripe", ["stripe", "striped", "pinstripe"]],
    ["Floral", ["floral", "flower print"]],
    ["Abstract/large print", ["abstract", "large print", "bold print", "geometric", "placement print"]],
    ["Solid/plain", ["solid", "plain", "block colour", "block color"]],
  ],
  material: [
    ["Cotton/pure cotton", ["100% cotton", "pure cotton", "organic cotton", "cotton", "broderie", "poplin"]],
    ["Linen", ["linen"]],
    ["Silk", ["silk"]],
    ["Chiffon", ["chiffon", "georgette"]],
    ["Viscose", ["viscose", "rayon", "lyocell", "tencel", "modal"]],
    ["Polyester", ["polyester", "polyamide"]],
    ["Wool", ["wool", "merino", "cashmere", "alpaca"]],
    ["Denim", ["denim"]],
    ["Satin", ["satin"]],
    ["Jersey", ["jersey"]],
    ["Knit", ["knit", "knitted", "rib knit", "ribbed"]],
  ],
};

const escapeTerm = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Whole-word match so "short" never matches inside "shorts sleeve" incorrectly. */
export function containsTerm(haystack: string, term: string) {
  return new RegExp(`(^|[^a-z0-9])${escapeTerm(term)}([^a-z0-9]|$)`, "i").test(haystack);
}

/** Map any free text onto a canonical label for one dimension. */
export function mapToCanonical(dimension: Dimension, text: string): string | null {
  if (!text) return null;
  const haystack = text.toLowerCase();
  for (const [label, terms] of VOCABULARY[dimension]) {
    if (terms.some((term) => containsTerm(haystack, term))) return label;
  }
  return null;
}

/** Tag key hints, so `neckline:halterneck` is read as a neckline first. */
const KEY_HINTS: [RegExp, Dimension][] = [
  [/neck/i, "neckline"],
  [/sleeve/i, "sleeve"],
  [/fabric|material|composition/i, "material"],
  [/colour|color/i, "colour"],
  [/print|pattern/i, "pattern"],
  [/length/i, "length"],
  [/style|fit|shape|silhouette/i, "silhouette"],
  [/category|type|garment|product-type/i, "category"],
];

export function dimensionForTagKey(key: string): Dimension | null {
  for (const [pattern, dimension] of KEY_HINTS) if (pattern.test(key)) return dimension;
  return null;
}

/** Shopify taxonomy GIDs that unambiguously identify a garment category. */
export const TAXONOMY_CATEGORY: Record<string, string> = {
  "aa-1-4": "Dress",
  "aa-1-13": "Skirt",
  "aa-1-15": "Top",
  "aa-1-12": "Trouser",
  "aa-1-10": "Short",
  "aa-1-5": "Jumpsuit/playsuit",
  "aa-1-3": "Coat/jacket",
};

/** Which canonical category a shopper's query is asking for, if any. */
export function requestedCategory(query: string): string | null {
  return mapToCanonical("category", query);
}
