# Devpost draft

Live demo: [fashion-passport.vercel.app](https://fashion-passport.vercel.app)

Source and reproducible setup:
[github.com/neelanjanabasu13/fashion-passport](https://github.com/neelanjanabasu13/fashion-passport)

## The one-sentence version

A shopper who already knows she wears a UK 10, never wears polyester and stops
looking above £100 has to say so again at every new shop. Fashion Passport says
it for her, once, on the retailer's own website.

## What it does

Fashion Passport is a portable personal relevance layer for fashion shopping.
It combines two deliberately separate layers: a suitability foundation from
body proportions and colour analysis, and personal taste, which can overrule
it. The shopper builds it once in under two minutes, approves it once, and it
then applies on any compatible Shopify UCP retailer without asking again.

## What it adds to generic relevance

Generic search evaluates the query. Fashion Passport adds personal suitability
and makes the following decisions visible.

- **A soft dislike lowers rank.** Polyester on the Avoid list ranks a product
  down and prints the conflict while keeping it visible. An explicit Never can
  hold a product, alongside a wrong category, hard query price cap, confirmed
  sold-out size or strict budget mode.
- **Missing evidence adds no positive score.** Scoring starts at 40, so a
  product with no extractable attributes stays in the lowest tier.
- **Score and confidence are separate.** When a retailer publishes little
  evidence, the percentage is withheld and the product receives the label
  "Possible match, limited product information".
- **Learning requires repeated evidence.** Raw tallies allow a preference to
  recover when behaviour changes.

## How it works

The extension asks the store whether it exposes the standard UCP catalogue
tool. Unsupported stores receive no interface or profile, while compatible
stores can apply the Passport to their live catalogue after approval. The
extension follows every available cursor page.

Attributes are extracted in priority order: displayed variant, title,
structured tags and options, then description. Retailers use their own
namespaces, so the ontology maps any `key:value` tag onto one canonical
vocabulary through a retailer-independent mapping.

## Verified, on 2 September 2026

- Nobody's Child, query "dresses", catalogue read to exhaustion: 1,000 products
  scanned across 25 cursor pages with none remaining, 980 dresses found, 382
  strong matches, 299 worth a look, 77 other, 222 held. Zero wrong-category
  products admitted. Scores spread from 29 to 99 across 71 distinct values.
- Jigsaw, same query: 200 scanned, catalogue exhausted, 101 dresses found. The
  retailer's own search returned 96 products outside the dress category, and
  the category gate removed them before scoring.
- Cross-store hub, "dresses under £100": 1,117 scanned across 18 responding
  stores, 1,002 dresses, 71 strong, 170 worth a look, 106 other, 655 held.
- In every run `categoryCorrect = strong + worth + other + held` held exactly.

## Validation status

The Chrome extension shares one engine with the web app, and a parity test
suite fails if the two ever disagree on a decision. The unpacked Manifest V3
flow requires Chrome and is documented as a short reproducible check in
`docs/DEMO.md`: approve once, teach a repeated signal, undo it, then open a
second compatible retailer and confirm that no second approval appears.

## Honest limitations

The current demonstrator supports Womenswear. Menswear needs a separate shape
and palette guidance model.

Four questions provide an initial colour direction. A trained analyst uses
drapes in daylight, so Fashion Passport treats its result as lower-weight
guidance and gives personal taste greater weight.

Shopify publishes per-store endpoints without a global catalogue, so the
comparison hub reaches stores verified by hand. The extension discovers
compatibility at runtime on the store the shopper opens.

The interface reports the evidence confidence created by each retailer's attribute coverage.

## Built with

Next.js 16, React 19, TypeScript, Chrome Manifest V3, the imperative WebMCP API
(`document.modelContext.registerTool`), and Shopify's UCP `search_catalog`
contract. The demonstrator uses no paid API, product feed, licensed styling
database or retained photograph.

## Reproduce it

Clone the repository, check out `claude/prescriptive-build`, run `npm ci`,
`npm test`, `npm run lint`, and `npm run build`, then use `npm run dev` for the
web app. Load the repository's `extension/` directory unpacked in Chrome 152+
with Developer mode enabled. No secrets or environment variables are needed;
live retailer results require internet access.
