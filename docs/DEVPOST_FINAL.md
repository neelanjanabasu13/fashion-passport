# Fashion Passport Devpost final copy

## Tagline

A portable fashion relevance layer that combines what suits you with what you
love across compatible shops.

## Inspiration

A shopper who knows she wears a UK 10, avoids polyester, prefers midi lengths
and stops looking above £100 has to repeat that context at every retailer.
Retailer profiles are passports valid in only one country. Shopping search also
rarely understands colour, proportions and silhouette, or the fact that personal
taste must be allowed to overrule every styling rule.

Fashion Passport captures that judgment once and applies it across compatible stores.

## What it does

Fashion Passport creates a portable personal relevance layer for womenswear.
Its sub-two-minute “Verdict Book” fitting keeps three sources of truth separate:

1. a transparent starting point from body proportions and colour direction;
2. explicit Love, Avoid and Never choices across seven garment traits;
3. preference patterns learned from reactions to real retailer products.

The ordering gives preference greater weight than theory. An ordinary Avoid
lowers rank while keeping the product visible, and repeated evidence is required
before reactions create a learned preference.

Once approved, an agent can use the Passport to search live retailer-owned
Shopify catalogues, enforce the requested garment category, rank every product
and explain why each item is Strong, Worth a look, another option or Held by a
confirmed rule. The Chrome extension proves the same Passport on the retailer’s
own website and carries it to the next compatible retailer without another
approval.

## Why WebMCP is essential

Portability depends on a shared tool contract. WebMCP lets Fashion
Passport expose typed tools to the agent while compatible retailers expose
their own catalogue tools. The agent composes the two safely by obtaining
approved user context, querying retailer-owned inventory and returning a
personal, explainable ranking.

People and agents do different work together:

- the person supplies subjective judgment, grants permission and can overrule;
- the agent handles catalogue breadth, category enforcement and reranking;
- the retailer remains source of truth for products, prices and availability.

## How we built it

The Next.js app registers five imperative WebMCP tools using
`document.modelContext.registerTool`: `get_fashion_passport`,
`find_personal_matches`, `compare_shopify_stores`,
`request_passport_connection` and `record_style_signal`.

The Manifest V3 extension registers an on-retailer surface and discovers
compatibility at runtime. Before approval it sends only an anonymous capability
check. After one-time approval, it reads the retailer’s official Shopify UCP
catalogue cursor, normalises product evidence, applies the deterministic ranking
engine and renders real retailer-hosted images and links.

The inspectable ranking pipeline applies:

- category gate first;
- hard rules only for explicit Never, hard query cap, strict budget and
  confirmed unavailable size;
- explicit preference above learned preference;
- styling theory at the lowest weight;
- zero positive evidence for unknown attributes;
- deterministic tie-breaks and evidence confidence separate from score.

The web and extension run against a shared parity corpus. The release gate is
lint clean, production-build clean, 36/36 tests, every extension script passing
`node --check`, and browser verification at desktop and 390px.

## What is working now

- The public Vercel application requires no login, paid API or environment secret.
- The test panel contains eighteen directly verified fashion retailers, while runtime discovery supports additional compatible stores.
- The interface separates catalogue scanned, category-correct and four result-tier counts.
- Progressive batches keep every qualifying product reachable.
- Every clothing evaluation uses real product photography.
- Local reactions rerank immediately and support Undo.
- One approval covers retailer, category, query and tab changes.
- Forward migration preserves legacy saved Passports.

## Challenges

The hardest problem was preserving truth across imperfect retailer data.
Retailer search can return the wrong garment category. Those results must be
gated out, not mislabeled as products held by the shopper’s rules. Attribute
coverage also varies, so Fashion Passport separates score from confidence and
never rewards missing evidence.

The second hard problem was parity. An extension that only resembles the web
ranking is dangerous. The extension now uses one browser engine and the tests
fail on any difference in evidence, score, tier, hard rule or ordering.

## Accomplishments

- The product combines the WebMCP tool flow with a coherent shopper experience.
- The extension demonstrates the ranking on a real retailer’s domain.
- Every count and product comes from live retailer data.
- Soft dislikes lower rank, personal taste can overrule theory, and repeated evidence is required before learning changes a preference.
- The Verdict Book visual system makes the context protocol legible to shoppers.

## What we learned

Shopify’s per-store UCP endpoints provide catalogue access without a global
merchant directory. The architecture therefore combines runtime store discovery
with a verified comparison panel and makes the boundaries of each claim visible.

Recommendation quality depends on precise evidence semantics. Unknown attributes
add no positive score, Avoid lowers rank, Never can hold a product, render batches
control presentation, and catalogue-scanned counts remain separate from dress counts.

## What is next

- Merchant discovery/indexing for a much larger comparison universe.
- Menswear with its own tested guidance model (currently Coming soon).
- Optional consented cross-device sync; local-first remains default.
- Richer structured fit and availability evidence from merchants.
- Portable Passport permissions beyond fashion.

## Links and stack

- Live: https://fashion-passport.vercel.app
- Code: https://github.com/neelanjanabasu13/fashion-passport
- License: MIT
- Stack: WebMCP, Shopify UCP, Next.js 16, React 19, TypeScript, Chrome
  Manifest V3, Vercel and local-first browser storage.
