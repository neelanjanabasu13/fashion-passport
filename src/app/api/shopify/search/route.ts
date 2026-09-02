import { demoProfile, retailers } from "@/lib/data";
import { walkCatalog } from "@/lib/shopify";
import type { FashionProfile } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { retailerId?: string; query?: string; sharePassport?: boolean; profile?: FashionProfile; pages?: number };
    const retailer = retailers.find((item) => item.id === body.retailerId);
    if (!retailer) return Response.json({ error: "Unknown retailer" }, { status: 400 });
    const query = body.query?.trim().slice(0, 160) || "midi dress";
    const pages = Math.max(1, Math.min(body.pages ?? 8, 12));
    const { products, scanned, truncated } = await walkCatalog(retailer, query, body.sharePassport ? body.profile || demoProfile : undefined, pages);
    return Response.json({
      status: "connected",
      protocol: "Shopify UCP/MCP 2026-08-25",
      retailer: { id: retailer.id, name: retailer.name, endpoint: retailer.endpoint },
      products,
      catalogueScanned: scanned,
      moreAvailable: truncated,
      liveAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live Shopify search failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
