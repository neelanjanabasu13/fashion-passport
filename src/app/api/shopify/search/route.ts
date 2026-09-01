import { demoProfile, retailers } from "@/lib/data";
import { searchShopifyCatalog } from "@/lib/shopify";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { retailerId?: string; query?: string; sharePassport?: boolean };
    const retailer = retailers.find((item) => item.id === body.retailerId);
    if (!retailer) return Response.json({ error: "Unknown retailer" }, { status: 400 });
    const query = body.query?.trim().slice(0, 160) || "midi dress";
    const products = await searchShopifyCatalog(retailer, query, body.sharePassport ? demoProfile : undefined);
    return Response.json({
      status: "connected",
      protocol: "Shopify UCP/MCP 2026-04-08",
      retailer: { id: retailer.id, name: retailer.name, endpoint: retailer.endpoint },
      products,
      liveAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live Shopify search failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
