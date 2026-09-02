import { demoProfile, retailers } from "@/lib/data";
import { searchShopifyCatalog } from "@/lib/shopify";
import { theoryFit } from "@/lib/style-theory";
import type { FashionProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const queries = ["dresses", "skirts", "tops", "jumpsuits", "trousers"] as const;

export async function POST(request: Request) {
  let profile = demoProfile;
  try {
    const body = await request.json() as { profile?: FashionProfile };
    if (body.profile?.colourSeason && body.profile?.bodyShape) profile = body.profile;
  } catch { /* Use the local demonstrator profile. */ }
  const batches = await Promise.all(retailers.map(async (retailer, index) => {
    try {
      return await searchShopifyCatalog(retailer, queries[index % queries.length], undefined, 6);
    } catch {
      return [];
    }
  }));
  const interleaved = Array.from({ length: Math.max(...batches.map((batch) => batch.length), 0) }, (_, index) => batches.map((batch) => batch[index]).filter(Boolean)).flat();
  const unique = Array.from(new Map(interleaved.map((product) => [product.id, product])).values());
  const analysed = unique.map((product, order) => ({ product, order, fit: theoryFit(product, profile.colourSeason, profile.bodyShape) }));
  const aligned = analysed.filter((item) => item.fit.score > 0).sort((a, b) => b.fit.score - a.fit.score || a.order - b.order);
  const exploration = analysed.filter((item) => item.fit.score === 0);
  const deck = [...aligned.slice(0, 54), ...exploration.slice(0, 18), ...aligned.slice(54), ...exploration.slice(18)].slice(0, 72);
  return Response.json({
    products: deck.map((item) => item.product),
    sources: batches.filter((batch) => batch.length).length,
    storesAttempted: retailers.length,
    theoryAligned: deck.filter((item) => item.fit.score > 0).length,
    explorationAvailable: deck.filter((item) => item.fit.score === 0).length,
    guidance: { colourSeason: profile.colourSeason, bodyShape: profile.bodyShape },
    profileSharedWithRetailers: false,
  });
}
