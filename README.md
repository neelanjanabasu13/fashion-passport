# Fashion Passport

**Your size, taste and what truly suits you—working together on every fashion site.**

Fashion Passport is a portable personal relevance layer for fashion shopping. A shopper connects the Passport once; it can then filter and rerank compatible retailer products using hard constraints, explicit taste, learned feedback, and optional styling theory.

The central rule is deliberately human: **personal preference always overrules colour-season or body-shape theory**.

## Why this exists

Online fashion shopping repeatedly loses context:

- Every new retailer makes the shopper reselect size, budget, fabric, colour and fit filters.
- Retailer profiles are trapped inside individual stores.
- Search results rarely account for body proportions or complexion.
- Generic relevance answers “does this match the query?”, not “is this unusually suitable for this person?”

Fashion Passport makes that context portable.

## Demonstrator

The repository contains two complementary surfaces:

1. **Next.js Passport office** — real-product taste onboarding, the Travel launcher and a secondary live multi-store comparison. Onboarding anonymously retrieves distinct garments from retailer catalogues; no cartoon garments or profile sharing are involved.
2. **Chrome extension** — the primary portability proof. It discovers the current store's official Shopify UCP endpoint at runtime, stays invisible on unsupported sites and opens an on-store panel of real ranked products. The one-time site approval synchronises into extension storage, so the Passport follows the user to the next compatible store without another prompt.

The web demonstrator currently searches an 18-store directly verified **test panel** with one adapter. A test skirt query on 1 September 2026 considered 334 category-correct products from 16 responding stores, with zero dresses or tops admitted. This panel proves breadth but does not define reach: Travel mode accepts any store the user chooses and the extension discovers its compatibility at runtime. Searching every Shopify store at once would require a merchant directory and a global index; Shopify exposes per-store endpoints, not a public global catalogue endpoint. No paid API, product feed, licensed styling database or retained photo is required.

### WebMCP tools

The web demonstrator registers:

- `get_fashion_passport`
- `find_personal_matches` (live Shopify UCP search and local ranking)
- `compare_shopify_stores` (one request, one adapter, every verified store)
- `request_passport_connection`
- `record_style_signal`

On compatible Shopify retailer pages, the extension registers:

- `get_fashion_passport`
- `apply_fashion_passport`
- `get_personalization_summary`

Tool descriptions and JSON Schemas are defined in [`src/app/page.tsx`](src/app/page.tsx) and [`extension/page-tools.js`](extension/page-tools.js).

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Validation:

```bash
npm run lint
npm run build
node --check extension/content.js
node --check extension/page-tools.js
node --check extension/popup.js
```

## Load the Chrome extension

1. Open `chrome://extensions` in Chrome 152 or newer.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this repository’s `extension` directory.
5. Reload the extension after code updates, then click its toolbar icon to open the Jigsaw → Lucy & Yak travel demo.
6. Fashion Passport anonymously checks for the standard UCP tools. It renders nothing if the endpoint is absent.
7. Select the Fashion Passport control and review exactly what will be shared. This is the single connection prompt; subsequent compatible stores and category changes do not ask again.
8. The extension calls the retailer-owned live catalogue and opens an on-site ranked results panel.

Live verified examples as of 1 September 2026 include Jigsaw, Lucy & Yak, Oh Polly, Never Fully Dressed, RIXO, KITRI, OMNES, Nobody's Child, House of Sunny, Motel Rocks, MESHKI, Nadine Merabi, Finisterre, Passenger, Beyond Nine, Albaray, Ro&Zo and Disturbia.

The standalone app and extension never invent inventory under a retailer’s name. Both call `https://{retailer-domain}/api/ucp/mcp`, use Shopify's current `search_catalog` contract, enforce the requested garment category after retrieval, and display retailer-hosted images and links. The extension requests broad HTTPS host access because compatibility is discovered at runtime; before the one-time connection it sends only an anonymous `tools/list` capability check to the origin currently being visited. The full Passport is transmitted only after visible approval.

Retailer themes and markup can change without requiring selector maintenance because the extension consumes the shared protocol rather than scraping product cards.

## Privacy model

- Photos are processed temporarily and deleted immediately.
- Only derived values such as colour season may be retained.
- One explicit connection enables compatible retailers without repetitive prompts; it can be revoked from Privacy.
- The full Passport is available only after approval.
- Likes, skips and browsing interactions stay in `chrome.storage.local`.
- Cross-device sync is off by default and is not enabled in this demonstrator.

## Ranking logic

The transparent rules engine lives in [`src/lib/scoring.ts`](src/lib/scoring.ts). It combines:

1. hard constraints, including size, budget and avoided materials;
2. explicit likes and dislikes;
3. learned local feedback;
4. lower-weight colour-season and body-shape guidance.

This ordering is intentional. The demo profile is Deep Winter but loves burnt orange, terracotta and camel, so those colours remain prioritised. It dislikes grey, so grey is penalised even though some greys may suit Winter palettes.

## Technology

- Next.js 16, React 19 and TypeScript
- Static, dependency-light ranking engine
- Chrome Manifest V3 extension using isolated and MAIN execution worlds
- Imperative WebMCP API (`document.modelContext.registerTool`)
- Local-first browser storage
- Vercel-hosted Next.js deployment with a stateless Shopify UCP route

Supabase is not required for the prize demonstrator. It can later provide opt-in account and cross-device profile sync without changing the local-first default.

## Open foundations

The production path is designed to map onto open garment and commerce vocabularies rather than inventing a proprietary ontology:

- [Shopify Standard Product Taxonomy](https://github.com/Shopify/product-taxonomy) — MIT
- [Fashionpedia](https://fashionpedia.github.io/home/) — CC BY 4.0
- [MediaPipe](https://github.com/google-ai-edge/mediapipe) — Apache 2.0

The current demonstrator keeps its compact vocabulary in the repository so it remains deterministic, free and easy to judge.

## Status

This is a demonstrator-class submission for the 2026 WebMCP Challenge. Onboarding and shopping cards are retrieved live through retailer-owned Shopify UCP endpoints; there is no static product fallback. The extension proves the same Passport can travel to compatible real storefronts without retailer-specific DOM adapters.

## License

[MIT](LICENSE)
