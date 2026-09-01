import { retailers } from "@/lib/data";
import { searchShopifyCatalog } from "@/lib/shopify";

export const runtime = "nodejs";
export const maxDuration = 30;

const tasteSeeds = [
  ["jigsaw", "midi dresses"],
  ["lucyandyak", "skirts"],
  ["ohpolly", "tops"],
  ["neverfullydressed", "midi dresses"],
  ["rixo", "dresses"],
  ["kitri", "skirts"],
  ["nobodyschild", "tops"],
  ["disturbia", "dresses"],
] as const;

export async function GET() {
  const batches = await Promise.all(tasteSeeds.map(async ([retailerId, query]) => {
    const retailer = retailers.find((item) => item.id === retailerId);
    if (!retailer) return [];
    try {
      return await searchShopifyCatalog(retailer, query, undefined, 8);
    } catch {
      return [];
    }
  }));
  const interleaved = Array.from({ length: Math.max(...batches.map((batch) => batch.length), 0) }, (_, index) => batches.map((batch) => batch[index]).filter(Boolean)).flat();
  const unique = Array.from(new Map(interleaved.map((product) => [product.id, product])).values());
  return Response.json({ products: unique, sources: batches.filter((batch) => batch.length).length, profileShared: false });
}
