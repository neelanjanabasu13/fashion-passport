# Fashion Passport

**Your size, taste and what truly suits you—working together on every fashion site.**

Fashion Passport is a portable personal relevance layer for fashion shopping. A shopper approves each retailer once; the same Passport can then filter and rerank products using hard constraints, explicit taste, learned feedback, and optional styling theory.

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

1. **Next.js demonstrator** — the complete product story, including the Passport, retailer consent, ranking explanations, frictionless taste learning, privacy controls and verified real-product snapshots from ASOS, Jigsaw and Jovonna London.
2. **Chrome extension** — the portability proof. It runs on the six real retailer domains, asks for one-time permission, annotates and reranks product tiles, and exposes Passport actions to browser agents through WebMCP.

No paid API, product feed, licensed styling database or retained photo is required.

### WebMCP tools

The web demonstrator registers:

- `get_fashion_passport`
- `find_personal_matches`
- `request_retailer_access`
- `record_style_signal`

On supported retailer pages, the extension registers:

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
```

## Load the Chrome extension

1. Open `chrome://extensions` in Chrome 152 or newer.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this repository’s `extension` directory.
5. Open one of the supported dress category pages.
6. Select the Fashion Passport control at the bottom-right, review the Passport, and approve the retailer.

Supported retailer domains:

- ASOS
- Next
- Jigsaw
- Jovonna London
- Vinted UK
- John Lewis

The standalone app never invents inventory under a retailer’s name. ASOS, Jigsaw and Jovonna cards use real public retailer metadata, retailer-hosted images and links to the real items, retrieved on 1 September 2026. Next, Vinted and John Lewis are demonstrated directly on their real pages through the extension because they do not expose a suitable stable public feed.

Retailer markup changes over time. Each domain has a small selector adapter in [`extension/content.js`](extension/content.js), followed by conservative fallbacks. The extension never sends page behaviour to a server.

## Privacy model

- Photos are processed temporarily and deleted immediately.
- Only derived values such as colour season may be retained.
- Every new retailer requires explicit approval.
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
- Vercel-ready static deployment

Supabase is not required for the prize demonstrator. It can later provide opt-in account and cross-device profile sync without changing the local-first default.

## Open foundations

The production path is designed to map onto open garment and commerce vocabularies rather than inventing a proprietary ontology:

- [Shopify Standard Product Taxonomy](https://github.com/Shopify/product-taxonomy) — MIT
- [Fashionpedia](https://fashionpedia.github.io/home/) — CC BY 4.0
- [MediaPipe](https://github.com/google-ai-edge/mediapipe) — Apache 2.0

The current demonstrator keeps its compact vocabulary in the repository so it remains deterministic, free and easy to judge.

## Status

This is a demonstrator-class submission for the 2026 WebMCP Challenge. Retailer product cards are dated public snapshots and link back to their source items. Abstract SVG garments appear only in the clearly labelled preference-learning exercise. The extension is the live real-site interoperability layer.

## License

[MIT](LICENSE)
