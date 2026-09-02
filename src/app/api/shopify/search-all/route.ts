import { demoProfile, retailers } from "@/lib/data";
import { walkCatalog } from "@/lib/shopify";
import type { FashionProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Cross-store search. Every responding retailer is walked through its own
 * cursor so the reported figures describe the catalogue actually scanned, not
 * the first page. `pagesPerStore` bounds request volume within the function
 * timeout; `truncated` reports honestly when a retailer has more to give.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query?: string; sharePassport?: boolean; profile?: FashionProfile; pagesPerStore?: number };
    const query = body.query?.trim().slice(0, 160) || "midi dress";
    const sharedProfile = body.sharePassport ? body.profile || demoProfile : undefined;
    const pagesPerStore = Math.max(1, Math.min(body.pagesPerStore ?? 2, 8));

    const results = await Promise.all(
      retailers.map(async (retailer) => {
        try {
          const walked = await walkCatalog(retailer, query, sharedProfile, pagesPerStore);
          return { retailer, ...walked };
        } catch (error) {
          return {
            retailer,
            products: [],
            scanned: 0,
            truncated: false,
            error: error instanceof Error ? error.message : "Retailer unavailable",
          };
        }
      }),
    );

    const products = results.flatMap((result) => result.products);
    const catalogueScanned = results.reduce((total, result) => total + result.scanned, 0);
    return Response.json({
      status: products.length ? "connected" : "no_results",
      protocol: "Shopify UCP/MCP 2026-08-25",
      query,
      storesQueried: retailers.length,
      storesResponding: results.filter((result) => result.products.length).length,
      catalogueScanned,
      moreAvailable: results.some((result) => result.truncated),
      errors: results.filter((result) => "error" in result && result.error).map((result) => ({ retailer: result.retailer.name, error: (result as { error?: string }).error })),
      products,
      liveAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Live Shopify search failed" }, { status: 502 });
  }
}
