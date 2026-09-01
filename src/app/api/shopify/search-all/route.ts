import { demoProfile, retailers } from "@/lib/data";
import { searchShopifyCatalog } from "@/lib/shopify";
import type { FashionProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { query?: string; sharePassport?: boolean; profile?: FashionProfile };
    const query = body.query?.trim().slice(0, 160) || "midi dress";
    const sharedProfile = body.sharePassport ? body.profile || demoProfile : undefined;
    const results = await Promise.all(retailers.map(async (retailer) => {
      try {
        const products = await searchShopifyCatalog(retailer, query, sharedProfile, 30);
        return { retailer, products };
      } catch (error) {
        return { retailer, products: [], error: error instanceof Error ? error.message : "Retailer unavailable" };
      }
    }));
    const products = results.flatMap((result) => result.products);
    return Response.json({
      status: products.length ? "connected" : "no_results",
      protocol: "Shopify UCP/MCP 2026-04-08",
      query,
      storesQueried: retailers.length,
      storesResponding: results.filter((result) => result.products.length).length,
      candidatesConsidered: products.length,
      errors: results.filter((result) => result.error).map((result) => ({ retailer: result.retailer.name, error: result.error })),
      products,
      liveAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Live Shopify search failed" }, { status: 502 });
  }
}
