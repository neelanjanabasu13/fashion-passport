import type { FashionProfile, Product, Retailer } from "./types";
import { alternativeColours, availableSizes, extractAttributes, type ExtractionInput } from "./extract";
import { mapToCanonical, requestedCategory } from "./ontology";

const AGENT_PROFILE = "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json";

type UcpMoney = { amount?: number; currency?: string };
type UcpMedia = { type?: string; url?: string };
type UcpOption = { name?: string; label?: string };
type UcpVariant = { availability?: { available?: boolean }; options?: UcpOption[]; media?: UcpMedia[] };
type UcpCategory = { value?: string };
type UcpCollection = { handle?: string; title?: string };
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
  categories?: UcpCategory[];
  collections?: UcpCollection[];
};

type UcpPayload = {
  ucp?: { status?: string };
  products?: UcpProduct[];
  pagination?: { has_next_page?: boolean; cursor?: string };
};

export type CatalogPage = {
  products: Product[];
  /** Products the retailer returned, before any category gate or ranking. */
  scanned: number;
  cursor: string | null;
};

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const colourHex: Record<string, string> = {
  "Dark pink": "#8f3157", Terracotta: "#b6543c", "Burnt orange": "#c25d2d", Red: "#982b3b",
  Navy: "#243c5c", Purple: "#5b4066", Camel: "#b18055", Olive: "#70704d", Grey: "#97999b",
  Taupe: "#89796a", Green: "#53745c", Blue: "#426784", Pink: "#c76986", Orange: "#d47734",
  Black: "#202020", White: "#eeeae2", Yellow: "#d7bc55", Brown: "#63483a", Multi: "#8d7467",
  Unknown: "#8d7467",
};

/**
 * Retained for callers that only need a coarse title check. The authoritative
 * category gate now runs on extracted evidence in `scoring.categoryCorrect`.
 */
export function matchesRequestedCategory(productName: string, query: string) {
  const wanted = requestedCategory(query);
  if (!wanted) return true;
  return mapToCanonical("category", productName) === wanted;
}

function extractionInput(item: UcpProduct): ExtractionInput {
  const displayed = item.variants?.find((variant) => variant.availability?.available !== false) || item.variants?.[0];
  return {
    title: item.title || "",
    description: stripHtml(item.description?.html),
    tags: item.tags || [],
    options: (item.options || []).map((option) => ({
      name: option.name || "",
      values: (option.values || []).map((value) => value.label || "").filter(Boolean),
    })),
    variantOptions: (displayed?.options || []).map((option) => ({ name: option.name || "", value: option.label || "" })),
    taxonomyCategories: (item.categories || []).map((category) => category.value || "").filter(Boolean),
    collections: (item.collections || []).flatMap((collection) => [collection.handle || "", collection.title || ""]).filter(Boolean),
  };
}

function normaliseProduct(item: UcpProduct, retailer: Retailer): Product {
  const input = extractionInput(item);
  const evidence = extractAttributes(input);
  const variants = (item.variants || []).map((variant) => ({
    available: variant.availability?.available !== false,
    options: (variant.options || []).map((option) => ({ name: option.name || "", value: option.label || "" })),
  }));
  const sizes = availableSizes(variants);
  const media =
    item.media?.find((entry) => entry.type === "image" && entry.url)?.url ||
    (item.variants || []).flatMap((variant) => variant.media || []).find((entry) => entry.type === "image" && entry.url)?.url;
  const rawId = item.id?.split("/").pop() || item.url || item.title || crypto.randomUUID();
  const colour = evidence.colour.value;

  return {
    id: `${retailer.id}-${rawId}`,
    retailerId: retailer.id,
    name: item.title || "Untitled product",
    brand: retailer.name,
    price: Math.round(((item.price_range?.min?.amount || 0) / 100) * 100) / 100,
    colour,
    hex: colourHex[colour] || colourHex.Unknown,
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
    `never ${[...profile.colours.never, ...profile.silhouettes.never, ...profile.necklines.never, ...profile.materials.never].join(", ")}`,
    `budget GBP ${profile.budget} (${profile.budgetMode})`,
  ].join("; ");
}

/** One page of the retailer's own catalogue. Preserves the existing transport. */
export async function fetchCatalogPage(
  retailer: Retailer,
  query: string,
  profile?: FashionProfile,
  limit = 40,
  cursor?: string | null,
): Promise<CatalogPage> {
  const context = profile
    ? { address_country: "GB", language: "en-GB", currency: "GBP", intent: approvedPassportIntent(profile) }
    : { address_country: "GB", language: "en-GB", currency: "GBP" };
  const pagination: Record<string, unknown> = { limit: Math.max(1, Math.min(limit, 40)) };
  if (cursor) pagination.cursor = cursor;
  const body = {
    jsonrpc: "2.0",
    method: "tools/call",
    id: crypto.randomUUID(),
    params: {
      name: "search_catalog",
      arguments: { meta: { "ucp-agent": { profile: AGENT_PROFILE } }, catalog: { query, context, pagination } },
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
  const rpc = (await response.json()) as { error?: { message?: string }; result?: { content?: { type?: string; text?: string }[] } };
  if (rpc.error) throw new Error(rpc.error.message || `${retailer.name} returned an MCP error`);
  const text = rpc.result?.content?.find((entry) => entry.type === "text")?.text;
  if (!text) throw new Error(`${retailer.name} returned no catalogue payload`);
  const payload = JSON.parse(text) as UcpPayload;
  if (payload.ucp?.status !== "success") throw new Error(`${retailer.name} did not return a successful UCP response`);
  const raw = payload.products || [];
  return {
    products: raw.map((item) => normaliseProduct(item, retailer)).filter((item) => item.productUrl && item.imageUrl),
    scanned: raw.length,
    cursor: payload.pagination?.has_next_page ? payload.pagination.cursor || null : null,
  };
}

/**
 * Walks the retailer's cursor until the catalogue is exhausted or the page
 * budget is reached. `maxPages` bounds request volume; it is never a
 * recommendation cap, and `truncated` reports honestly when more remains.
 */
export async function walkCatalog(
  retailer: Retailer,
  query: string,
  profile?: FashionProfile,
  maxPages = 8,
): Promise<{ products: Product[]; scanned: number; truncated: boolean }> {
  const products: Product[] = [];
  const seen = new Set<string>();
  let cursor: string | null | undefined = undefined;
  let scanned = 0;
  let pages = 0;
  do {
    const page: CatalogPage = await fetchCatalogPage(retailer, query, profile, 40, cursor);
    scanned += page.scanned;
    for (const product of page.products) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      products.push(product);
    }
    cursor = page.cursor;
    pages += 1;
  } while (cursor && pages < maxPages);
  return { products, scanned, truncated: Boolean(cursor) };
}

/** Backward-compatible single-page helper used by the existing routes. */
export async function searchShopifyCatalog(retailer: Retailer, query: string, profile?: FashionProfile, limit = 24) {
  const page = await fetchCatalogPage(retailer, query, profile, limit);
  return page.products;
}
