# Fashion Passport

**Your size, taste and what truly suits you—working together on every fashion site.**

Live demonstrator: **[fashion-passport.vercel.app](https://fashion-passport.vercel.app)**

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

1. **Next.js Passport office** — a sub-two-minute Womenswear onboarding, the Travel launcher and a secondary live multi-store comparison. Onboarding first derives a transparent body-proportion and colouring foundation, then anonymously retrieves distinct garments across the full verified retailer panel and prioritises those matching that analysis for 20 rapid preference reactions. If the shopper dislikes more than half, the deck automatically broadens. Menswear is explicitly marked coming soon; no cartoon garments or profile sharing with retailers are involved.
2. **Chrome extension** — the primary portability proof. It discovers the current store's official Shopify UCP endpoint at runtime, stays invisible on unsupported sites and opens an on-store panel of real ranked products. The one-time site approval synchronises into extension storage, so the Passport follows the user to the next compatible store without another prompt.

The web demonstrator searches an 18-store directly verified **test panel** with one adapter. Measured on 2 September 2026 with the query "dresses under £100": 1,117 catalogue products scanned across 18 responding stores, 1,002 dresses found, 71 strong matches, 170 worth a look, 106 other and 655 held by the profile's own rules, with a further 14 products whose category could not be established shown separately under All products.

Against Nobody's Child alone with the query "dresses", the catalogue was read to exhaustion: 1,000 products scanned across 25 cursor pages with no pages remaining, 980 dresses found, 382 strong, 299 worth a look, 77 other and 222 held. Zero wrong-category products were admitted to the claimed dress set. Scores ranged from 29 to 99 across 71 distinct values.

This panel proves the adapter; it does not define its reach. Travel mode accepts any store the user chooses and the extension discovers compatibility at runtime. Searching every Shopify store at once would require a merchant directory and a global index; Shopify exposes per-store endpoints, not a public global catalogue endpoint. No paid API, product feed, licensed styling database or retained photo is required.

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

## Reproduce the demonstrator locally

Requirements: Git, Node.js 20+, npm and Chrome 152 or newer. No API keys,
database, paid feed or `.env` file are required. Internet access is required
because product results come from retailer-owned live endpoints.

```bash
git clone https://github.com/neelanjanabasu13/fashion-passport.git
cd fashion-passport
git checkout claude/prescriptive-build
npm ci
npm test
npm run lint
npm run build
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The test suite includes scoring regressions, preference learning and parity
between the web and extension ranking engines. Run the complete release gate:

```bash
npm test
npm run lint
npm run build
node --check extension/fashion-engine.js
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
8. The extension follows the retailer's official catalogue cursors in pages of up to 250, deduplicates the response, and opens an on-site ranked results panel. The panel distinguishes the top products shown, category-relevant products ranked and complete live catalogue products scanned; it never presents one API page as the retailer's total.

To reproduce the portability proof, approve the Passport once on Nobody's
Child, react **Less** to four products sharing a trait, use **Undo**, and then
open Jigsaw in a new tab. The second retailer should use the same Passport and
learned signals without another approval. The exact two-minute sequence and
fallback retailers are in [`docs/DEMO.md`](docs/DEMO.md).

Live verified retailers as of 2 September 2026 include Jigsaw, Lucy & Yak, Oh Polly, Never Fully Dressed, RIXO, KITRI, OMNES, Nobody's Child, House of Sunny, Motel Rocks, MESHKI, Nadine Merabi, Finisterre, Passenger, Beyond Nine, Albaray, Ro&Zo and Disturbia.

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

The transparent rules engine lives in [`src/lib/scoring.ts`](src/lib/scoring.ts), with the four-season and five-body-shape guidance table in [`src/lib/style-theory.ts`](src/lib/style-theory.ts). The table maps body and colour results to starting-point colours, silhouettes, necklines, sleeves, lengths and materials. Ranking combines:

1. hard constraints, including size, budget and avoided materials;
2. explicit likes and dislikes;
3. learned local feedback, promoted only after repeated evidence rather than one overconfident thumbs-down;
4. lower-weight colour-season and body-shape guidance.

This ordering is intentional. The demo profile is Deep Winter but loves burnt orange, terracotta and camel, so those colours remain prioritised. It dislikes grey, so grey is penalised even though some greys may suit Winter palettes.

## Technology

- Next.js 16, React 19 and TypeScript
- Static, dependency-light ranking engine
- Chrome Manifest V3 extension using isolated and MAIN execution worlds
- Imperative WebMCP API (`document.modelContext.registerTool`)
- Local-first browser storage
- Vercel-hosted Next.js deployment with a stateless Shopify UCP route

## Deploy your own copy

After the release gate above passes:

```bash
npx vercel@latest deploy -y
```

That creates a preview deployment. To intentionally update a production
deployment, use `npx vercel@latest deploy --prod -y`. The first CLI run asks
you to sign in and links the local directory to a Vercel project. No environment
variables are required for the current demonstrator.

Supabase is not required for the prize demonstrator. It can later provide opt-in account and cross-device profile sync without changing the local-first default.

## Open foundations

The production path is designed to map onto open garment and commerce vocabularies rather than inventing a proprietary ontology:

- [Shopify Standard Product Taxonomy](https://github.com/Shopify/product-taxonomy) — MIT
- [Fashionpedia](https://fashionpedia.github.io/home/) — CC BY 4.0
- [MediaPipe](https://github.com/google-ai-edge/mediapipe) — Apache 2.0

The current demonstrator keeps its compact vocabulary in the repository so it remains deterministic, free and easy to judge.

## Scope

Womenswear only. Menswear is labelled `Coming soon` and does not pretend to
work.

## Status

This is a demonstrator-class submission for the 2026 WebMCP Challenge.
See [`docs/DEMO.md`](docs/DEMO.md) for the two-minute script,
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the pipeline, and
[`docs/PRIVACY.md`](docs/PRIVACY.md) for what is stored and where. Onboarding and shopping cards are retrieved live through retailer-owned Shopify UCP endpoints; there is no static product fallback. The extension proves the same Passport can travel to compatible real storefronts without retailer-specific DOM adapters.

## License

[MIT](LICENSE)
