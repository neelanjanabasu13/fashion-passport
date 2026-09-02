# Fashion Passport — Devpost final copy

## Tagline

One fitting. Every compatible shop. A portable fashion relevance layer that
combines what suits you with what you love.

## Inspiration

Every fashion website forgets you.

A shopper who knows she wears a UK 10, avoids polyester, prefers midi lengths
and stops looking above £100 has to repeat that context at every retailer.
Retailer profiles are passports valid in only one country. Shopping search also
rarely understands colour, proportions and silhouette—or the fact that personal
taste must be allowed to overrule every styling rule.

Fashion Passport asks for that judgment once and lets it travel.

## What it does

Fashion Passport creates a portable personal relevance layer for womenswear.
Its sub-two-minute “Verdict Book” fitting keeps three sources of truth separate:

1. a transparent starting point from body proportions and colour direction;
2. explicit Love, Avoid and Never choices across seven garment traits;
3. preference patterns learned from reactions to real retailer products.

The ordering is human by design: preference overrules theory. An ordinary Avoid
only lowers rank; it never hides a product. One reaction never creates a rule.

Once approved, an agent can use the Passport to search live retailer-owned
Shopify catalogues, enforce the requested garment category, rank every product
and explain why each item is Strong, Worth a look, another option or Held by a
confirmed rule. The Chrome extension proves the same Passport on the retailer’s
own website and carries it to the next compatible retailer without another
approval.

## Why WebMCP is essential

This is not AI pasted onto shopping. Portability is the product.

Without a shared tool contract, a cross-retailer Passport means brittle DOM
scraping or bespoke integrations retailer by retailer. WebMCP lets Fashion
Passport expose typed tools to the agent while compatible retailers expose
their own catalogue tools. The agent composes the two safely: obtain approved
user context, query retailer-owned inventory and return a personal, explainable
ranking.

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

- Public Vercel application with no login, paid API or environment secret.
- Eighteen directly verified fashion retailers as a test panel; runtime
  discovery means the panel does not define total reach.
- Truthful counts for catalogue scanned, category-correct and four result tiers.
- Progressive batches until every qualifying product is reachable.
- Real product photography everywhere clothing is evaluated.
- Local reactions that rerank immediately and can be undone.
- One approval across retailer, category, query and tab changes.
- Forward migration for legacy saved Passports.

## Challenges

The hardest problem was preserving truth across imperfect retailer data.
Retailer search can return the wrong garment category. Those results must be
gated out, not mislabeled as products held by the shopper’s rules. Attribute
coverage also varies, so Fashion Passport separates score from confidence and
never rewards missing evidence.

The second hard problem was parity. An extension that only resembles the web
ranking is dangerous. The extension now uses one browser engine and the tests
fail on any difference in evidence, score, tier, hard rule or ordering.

## Accomplishments we are proud of

- A coherent product experience, not just a tool-call proof.
- The core innovation visibly working on a real retailer’s domain.
- Every count and product derived live—nothing invented under a retailer name.
- Soft dislikes stay soft, taste can overrule theory, and one click cannot
  silently rewrite the user.
- The Verdict Book visual system makes a context protocol feel like a product a
  shopper could understand and want to keep.

## What we learned

Open protocols change product strategy. Shopify’s per-store UCP endpoints do
not provide a global merchant directory, so the honest architecture is a
runtime travel layer plus a verified comparison panel—not a fictional “all
Shopify stores” index.

Recommendation quality is also evidence semantics: Unknown is not Good; Avoid
is not Never; a render batch is not a cap; catalogue scanned is not dresses
found.

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
