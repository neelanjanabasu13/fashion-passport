import type { FashionProfile, Product, Retailer } from "./types";

const AGENT_PROFILE = "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json";

type UcpMoney = { amount?: number; currency?: string };
type UcpMedia = { type?: string; url?: string };
type UcpOption = { name?: string; label?: string };
type UcpVariant = { availability?: { available?: boolean }; options?: UcpOption[]; media?: UcpMedia[] };
type UcpProduct = {
  id?: string;
  title?: string;
  description?: { html?: string };
  url?: string;
  price_range?: { min?: UcpMoney };
  variants?: UcpVariant[];
  options?: { name?: string; values?: { label?: string }[] }[];
  media?: UcpMedia[];
  tags?: string[];
};

type UcpPayload = {
  ucp?: { status?: string };
  products?: UcpProduct[];
};

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const includesAny = (text: string, values: string[]) => values.find((value) => new RegExp(`(^|[^a-z0-9])${escapePattern(value)}([^a-z0-9]|$)`, "i").test(text));

function inferProductField(text: string, field: "colour" | "silhouette" | "neckline" | "sleeve" | "pattern" | "material" | "length") {
  const vocab = {
    colour: [
      ["Dark pink", ["dark pink", "fuchsia", "magenta", "mulberry", "raspberry"]],
      ["Terracotta", ["terracotta", "rust"]],
      ["Burnt orange", ["burnt orange"]],
      ["Red", ["red", "ruby", "burgundy", "crimson", "scarlet"]],
      ["Jewel tones", ["navy", "cobalt", "sapphire", "emerald", "teal", "purple"]],
      ["Camel", ["camel", "tan"]],
      ["Olive", ["olive", "khaki"]],
      ["Grey", ["grey", "gray", "silver"]],
      ["Taupe", ["taupe"]],
      ["Green", ["green"]],
      ["Blue", ["blue"]],
      ["Pink", ["pink"]],
      ["Orange", ["orange"]],
      ["Black", ["black"]],
      ["White", ["white", "ivory", "cream", "ecru"]],
      ["Yellow", ["yellow"]],
      ["Brown", ["brown", "chocolate"]],
    ],
    silhouette: [
      ["Fit and flare", ["fit and flare", "fit-and-flare", "fitted waist", "cinch in at the waist", "volume-hem"]],
      ["A-line", ["a-line", "a line", "skater"]],
      ["Flowy", ["flowy", "fluid", "drape", "drapey", "relaxed", "floaty"]],
      ["Boxy", ["boxy", "shift"]],
      ["Structured", ["structured", "bodycon", "column", "tailored"]],
    ],
    neckline: [
      ["Square", ["square neck", "square-neck"]],
      ["Boat", ["boat neck", "boat-neck", "bateau"]],
      ["Scoop", ["scoop neck", "scoop-neck"]],
      ["Cowl", ["cowl"]],
      ["V-neck", ["v-neck", "v neck", "wrap dress"]],
      ["Asymmetric", ["asymmetric", "one shoulder"]],
      ["High neck", ["high neck", "crew neck"]],
    ],
    sleeve: [
      ["3/4", ["3/4 sleeve", "three-quarter sleeve"]],
      ["Long", ["long sleeve", "long-sleeve"]],
      ["Cap", ["cap sleeve"]],
      ["Sleeveless", ["sleeveless", "strappy", "strapless", "cami"]],
      ["Short", ["short sleeve", "short-sleeve"]],
    ],
    pattern: [
      ["Gingham", ["gingham"]],
      ["Plaid", ["plaid", "check"]],
      ["Ditsy", ["ditsy", "small floral", "micro floral"]],
      ["Animal", ["animal print", "leopard", "zebra", "snake print"]],
      ["Large print", ["large print", "bold print", "floral", "printed"]],
      ["Solid", ["solid", "plain"]],
    ],
    material: [
      ["Pure cotton", ["100% cotton", "pure cotton", "cotton"]],
      ["Linen", ["linen"]],
      ["Silk", ["silk"]],
      ["Chiffon", ["chiffon"]],
      ["Polyester", ["polyester"]],
      ["Viscose", ["viscose"]],
    ],
    length: [
      ["Midi", ["midi", "midaxi"]],
      ["Maxi", ["maxi", "floor length"]],
      ["Mini", ["mini", "above knee"]],
    ],
  } as const;
  for (const [label, terms] of vocab[field]) if (includesAny(text, [...terms])) return label;
  return "Not stated";
}

const garmentCategories = [
  { query: ["skirt", "skirts"], product: ["skirt", "skort"] },
  { query: ["dress", "dresses"], product: ["dress", "gown"] },
  { query: ["top", "tops"], product: ["top", "blouse", "shirt", "bodysuit", "vest", "camisole"] },
  { query: ["trouser", "trousers", "pants"], product: ["trouser", "pants"] },
  { query: ["jean", "jeans", "denim"], product: ["jean", "denim"] },
  { query: ["jumpsuit", "jumpsuits", "playsuit", "playsuits"], product: ["jumpsuit", "playsuit", "romper"] },
  { query: ["short", "shorts"], product: ["short", "shorts"] },
  { query: ["coat", "coats", "jacket", "jackets"], product: ["coat", "jacket", "blazer"] },
] as const;

export function matchesRequestedCategory(productName: string, query: string) {
  const request = query.toLowerCase();
  const requested = garmentCategories.find((category) => category.query.some((term) => new RegExp(`\\b${term}\\b`, "i").test(request)));
  if (!requested) return true;
  const name = productName.toLowerCase();
  return requested.product.some((term) => new RegExp(`\\b${term}s?\\b`, "i").test(name));
}

const colourHex: Record<string, string> = {
  "Dark pink": "#8f3157", Terracotta: "#b6543c", "Burnt orange": "#c25d2d", Red: "#982b3b",
  "Jewel tones": "#244d62", Camel: "#b18055", Olive: "#70704d", Grey: "#97999b", Taupe: "#89796a",
  Green: "#53745c", Blue: "#426784", Pink: "#c76986", Orange: "#d47734", Black: "#202020", White: "#eeeae2",
  Yellow: "#d7bc55", Brown: "#63483a", "Not stated": "#8d7467",
};

function normaliseProduct(item: UcpProduct, retailer: Retailer): Product {
  const tags = item.tags?.join(" ") || "";
  const optionText = item.options?.flatMap((option) => option.values?.map((value) => `${option.name}:${value.label}`) || []).join(" ") || "";
  const description = stripHtml(item.description?.html);
  const titleText = (item.title || "").toLowerCase();
  const text = `${titleText} ${description} ${tags} ${optionText}`.toLowerCase();
  const colour = inferProductField(titleText, "colour");
  const availableVariants = item.variants?.filter((variant) => variant.availability?.available !== false) || [];
  const sizeLabels = availableVariants.flatMap((variant) => variant.options?.filter((option) => option.name?.toLowerCase() === "size").map((option) => option.label || "") || []).filter(Boolean);
  const fallbackSizes = item.options?.find((option) => option.name?.toLowerCase() === "size")?.values?.map((value) => value.label || "").filter(Boolean) || [];
  const media = item.media?.find((entry) => entry.type === "image" && entry.url)?.url || availableVariants.flatMap((variant) => variant.media || []).find((entry) => entry.type === "image" && entry.url)?.url;
  const rawId = item.id?.split("/").pop() || item.url || item.title || crypto.randomUUID();

  return {
    id: `${retailer.id}-${rawId}`,
    retailerId: retailer.id,
    name: item.title || "Untitled product",
    brand: retailer.name,
    price: Math.round(((item.price_range?.min?.amount || 0) / 100) * 100) / 100,
    colour,
    hex: colourHex[colour] || colourHex["Not stated"],
    silhouette: inferProductField(titleText, "silhouette"),
    neckline: inferProductField(titleText, "neckline"),
    sleeve: inferProductField(titleText, "sleeve"),
    pattern: inferProductField(titleText, "pattern"),
    material: inferProductField(text, "material"),
    length: inferProductField(text, "length"),
    sizes: Array.from(new Set((sizeLabels.length ? sizeLabels : fallbackSizes).map((size) => /^\d+$/.test(size) ? `UK ${size}` : size))),
    imageUrl: media,
    productUrl: item.url,
    source: "live-ucp",
  };
}

function approvedPassportIntent(profile: FashionProfile) {
  return [
    `Shopper explicitly approved sharing this Fashion Passport: ${profile.size}, ${profile.heightCm} cm`,
    `${profile.colourSeason}; ${profile.bodyShape}`,
    `loves colours ${profile.colours.love.join(", ")}`,
    `loves silhouettes ${profile.silhouettes.love.join(", ")}`,
    `loves necklines ${profile.necklines.love.join(", ")}`,
    `loves materials ${profile.materials.love.join(", ")}`,
    `avoids ${[...profile.colours.avoid, ...profile.silhouettes.avoid, ...profile.necklines.avoid, ...profile.materials.avoid].join(", ")}`,
    `budget GBP ${profile.budget}`,
  ].join("; ");
}

export async function searchShopifyCatalog(retailer: Retailer, query: string, profile?: FashionProfile, limit = 24) {
  const context = profile ? { address_country: "GB", language: "en-GB", currency: "GBP", intent: approvedPassportIntent(profile) } : { address_country: "GB", language: "en-GB", currency: "GBP" };
  const body = {
    jsonrpc: "2.0",
    method: "tools/call",
    id: crypto.randomUUID(),
    params: {
      name: "search_catalog",
      arguments: {
        meta: { "ucp-agent": { profile: AGENT_PROFILE } },
        catalog: { query, context, pagination: { limit: Math.max(1, Math.min(limit, 40)) } },
      },
    },
  };
  const response = await fetch(retailer.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${retailer.name} returned HTTP ${response.status}`);
  const rpc = await response.json() as { error?: { message?: string }; result?: { isError?: boolean; content?: { type?: string; text?: string }[] } };
  if (rpc.error) throw new Error(rpc.error.message || `${retailer.name} returned an MCP error`);
  const text = rpc.result?.content?.find((entry) => entry.type === "text")?.text;
  if (!text) throw new Error(`${retailer.name} returned no catalogue payload`);
  const payload = JSON.parse(text) as UcpPayload;
  if (payload.ucp?.status !== "success") throw new Error(`${retailer.name} did not return a successful UCP response`);
  return (payload.products || [])
    .map((item) => normaliseProduct(item, retailer))
    .filter((item) => item.productUrl && item.imageUrl && matchesRequestedCategory(item.name, query));
}
