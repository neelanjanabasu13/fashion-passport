# Devpost draft

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

## What it does that generic relevance does not

Generic search answers "does this match the query?". Fashion Passport answers
"is this unusually suitable for this person?", and it shows its working:

- **A soft dislike is not a hard block.** Polyester on the avoid list ranks a
  product down and prints the conflict. It never hides it. Only an explicit
  Never can hold a product, alongside a wrong category, a hard price cap in the
  query, a confirmed sold-out size, and strict budget mode.
- **Absence of evidence is never positive evidence.** Scoring starts at 40, so
  a product with no extractable attributes stays in the lowest tier instead of
  drifting upward on silence.
- **A score is not confidence.** Evidence confidence is reported separately.
  Where a retailer publishes little, the percentage is withheld and the product
  is labelled "Possible match, limited product information".
- **One reaction never creates a rule.** It takes repeated evidence, and the
  raw tallies are kept so a preference recovers when behaviour changes.

## How it works

The extension asks the store whether it exposes the standard UCP catalogue
tool. If it does not, nothing renders and no profile is sent. If it does, the
Passport applies on the retailer's own page, against the retailer's own live
catalogue, walking its cursor rather than reading one page.

Attributes are extracted in priority order: displayed variant, title,
structured tags and options, then description. Retailers use their own
namespaces, so the ontology maps any `key:value` tag onto one canonical
vocabulary rather than hard-coding a retailer's keys.

## Verified, on 2 September 2026

- Nobody's Child, query "dresses", catalogue read to exhaustion: 1,000 products
  scanned across 25 cursor pages with none remaining, 980 dresses found, 382
  strong matches, 299 worth a look, 77 other, 222 held. Zero wrong-category
  products admitted. Scores spread from 29 to 99 across 71 distinct values.
- Jigsaw, same query: 200 scanned, catalogue exhausted, 101 dresses found. The
  retailer's own search returned 96 products that are not dresses; those are
  gated out rather than counted against the shopper's rules.
- Cross-store hub, "dresses under £100": 1,117 scanned across 18 responding
  stores, 1,002 dresses, 71 strong, 170 worth a look, 106 other, 655 held.
- In every run `categoryCorrect = strong + worth + other + held` held exactly.

## Not yet proved

The Chrome extension shares one engine with the web app, and a parity test
suite fails if the two ever disagree on a decision. The unpacked Manifest V3
flow itself, meaning the single approval, cross-tab persistence and the second
retailer with no second prompt, has not yet been observed running end to end.

## Honest limitations

Womenswear only. The shape and palette rules are built for it and men's needs
its own set, which is not written.

Four questions is a thin colour analysis. A trained analyst uses drapes in
daylight. It is close enough to be a useful starting point and not close enough
to be final, which is why personal taste outranks it everywhere.

Shopify publishes per-store endpoints and no global catalogue, so the
comparison hub can only reach stores verified by hand. The extension does not
carry that limit: it discovers compatibility at runtime on whatever store the
shopper opens.

Attribute coverage varies by retailer and the interface says so rather than
pretending otherwise.

## Built with

Next.js 16, React 19, TypeScript, Chrome Manifest V3, the imperative WebMCP API
(`document.modelContext.registerTool`), and Shopify's UCP `search_catalog`
contract. No paid API, no product feed, no licensed styling database, no
retained photograph.
