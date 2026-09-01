import { retailers } from "@/lib/data";
import { searchShopifyCatalog } from "@/lib/shopify";

export const runtime = "nodejs";
export const maxDuration = 30;

const queries = ["dresses", "skirts", "tops", "jumpsuits", "trousers"] as const;

export async function GET() {
  const batches = await Promise.all(retailers.map(async (retailer, index) => {
    try {
      return await searchShopifyCatalog(retailer, queries[index % queries.length], undefined, 6);
    } catch {
      return [];
    }
  }));
  const interleaved = Array.from({ length: Math.max(...batches.map((batch) => batch.length), 0) }, (_, index) => batches.map((batch) => batch[index]).filter(Boolean)).flat();
  const unique = Array.from(new Map(interleaved.map((product) => [product.id, product])).values());
  return Response.json({ products: unique.slice(0, 72), sources: batches.filter((batch) => batch.length).length, storesAttempted: retailers.length, profileShared: false });
}
