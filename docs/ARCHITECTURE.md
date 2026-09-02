# Architecture

Fashion Passport is a portable personal relevance layer for fashion shopping.
It has two surfaces over one shared ranking model.

```
        ┌────────────────────────────────────────────────────────────┐
        │  THE SHOPPER'S BROWSER                                     │
        │                                                            │
        │  ┌──────────────────────┐      ┌────────────────────────┐  │
        │  │ Next.js hub          │      │ Chrome extension MV3   │  │
        │  │ compares retailers   │      │ runs on the retailer's │  │
        │  │                      │      │ own domain             │  │
        │  └──────────┬───────────┘      └───────────┬────────────┘  │
        │             │                              │               │
        │             └──────────┬───────────────────┘               │
        │                        │                                   │
        │              ┌─────────▼──────────┐                        │
        │              │ localStorage /     │  profile, raw up-down  │
        │              │ chrome.storage     │  tallies, one approval │
        │              └─────────┬──────────┘                        │
        └────────────────────────┼───────────────────────────────────┘
                                 │  approved profile only
                                 ▼
                   ┌─────────────────────────────┐
                   │ Retailer's own UCP endpoint │
                   │ https://{domain}/api/ucp/mcp│
                   │ tools/call search_catalog   │
                   └─────────────────────────────┘
```

## The ranking pipeline

```
UCP product
   │
   ├─ 1. extract        src/lib/extract.ts
   │     variant → title → structured tags and options → description
   │     every attribute carries { value, confidence, source }
   │     no image analysis, so an unseen attribute stays Unknown
   │
   ├─ 2. category gate  src/lib/scoring.ts categoryCorrect()
   │     a dresses query admits only products classified as dresses
   │     category-unknown products stay reachable under All products
   │
   ├─ 3. hard rules     five, and only five, can hold a product
   │     wrong category · hard price cap in the query · confirmed size
   │     unavailable · an explicit never · strict budget mode
   │
   ├─ 4. score          base 40, so no evidence means no promotion
   │     explicit preference  >  learned signal  >  suitability theory
   │
   └─ 5. tier           strong ≥70 · worth 50-69 · other <50 · held
```

## Modules

| File | Responsibility |
|---|---|
| `src/lib/ontology.ts` | Canonical vocabulary and the mapping from any retailer's tag namespace onto it. |
| `src/lib/extract.ts` | Evidence extraction, evidence confidence, size availability, hard price caps. |
| `src/lib/scoring.ts` | Category gate, hard rules, weights, tiers, deterministic tie-breaks. |
| `src/lib/learned.ts` | Raw up-down tallies, derived preferences, undo. |
| `src/lib/profile.ts` | Forward migration of saved profiles. |
| `src/lib/shopify.ts` | UCP transport and cursor pagination. |
| `extension/fashion-engine.js` | The same ontology, extraction, scoring, tiering and learned-signal model, as a self-contained script the content script and Node tests both load. |
| `extension/content.js` | The retailer-page surface. It makes no ranking decisions of its own; every decision comes from the engine. |

`tests/parity.test.ts` runs one corpus through both `src/lib` and
`extension/fashion-engine.js` and fails if they disagree on any score, state,
tier, hard rule, ordering or learned threshold.

## Retailer-independent ontology mapping

Retailers publish attributes under their own namespaces. Nobody's Child
publishes `neckline:halterneck` and `fabric-group:jersey`. Jigsaw publishes
`canonical_colour:red` and `category:Dresses`. The extractor reads any
`key:value` tag, uses the key only as a hint, and maps the value onto one
canonical label. Nothing in the pipeline is specific to a single retailer.

This also means attribute coverage varies by retailer, which is why evidence
confidence is reported separately from the match score. Measured on 2 September 2026 across each retailer's full dress catalogue:
Nobody's Child returned a known neckline for 93% of products and reached high
evidence confidence on 933 of 982; Jigsaw returned a known neckline for 17% and
reached high confidence on 19 of 200.
