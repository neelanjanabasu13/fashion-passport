# Prize demo script (2 minutes 40 seconds)

Live app: [fashion-passport.vercel.app](https://fashion-passport.vercel.app)

Everything runs against live retailer endpoints. Figures are computed from the
response in front of you and may change between recordings.

## Before recording

1. Load `extension/` unpacked in Chrome 152+ and confirm version 0.8.0.
2. Keep Nobody's Child, Jigsaw and Lucy & Yak open as fallback retailer tabs.
3. Reset the Passport connection only if you need to capture the one-time
   approval; otherwise keep it connected for the portability sequence.
4. Record at 1440×900 or 1920×1080 with browser zoom set so counts and product
   names are legible.

## Exact sequence and voiceover

**0:00–0:12 — the problem.** Show a busy fashion category, then the Fashion
Passport title card.

> Every fashion site forgets you. Your size, budget, colours, proportions and
> hard noes disappear the moment you change retailer. Fashion Passport makes
> that context portable.

**0:12–0:36 — the fitting.** Show the Verdict Book intro, one body-shape visual,
the colour swatches and a real-product taste reaction.

> A ninety-second fitting combines two datasets retailers keep apart: what may
> suit you, and what you actually love. Theory is only a starting point. Your
> preference always wins.

**0:36–1:00 — human plus agent.** In ChatGPT’s in-app browser ask: “Use my
Fashion Passport to find a colourful work dress under £100.” Show the WebMCP
tool call and live results.

> The agent does not guess at the UI or scrape a page. The site exposes typed
> WebMCP tools. With permission, the agent receives the Passport, calls
> retailer-owned Shopify catalogues and returns explainable personal matches.

**1:00–1:24 — truthful breadth.** Show the count hierarchy, move through Strong,
Worth a look, All products and Held, then press Load 24 more.

> These are live counts, never hardcoded. Catalogue scanned is different from
> category-correct; twenty-four is a render batch, never a recommendation cap.
> Every qualifying item remains reachable.

**1:24–1:47 — transparent learning.** In Held, show a confirmed sold-out size,
then react Less to a visible product.

> An Avoid lowers rank but never hides. Only an explicit Never, hard query cap,
> strict budget or confirmed unavailable size can hold an item. Feedback reranks
> immediately, but one reaction never creates an overconfident rule. Undo is
> always available.

**1:47–2:17 — the wow moment.** Open Nobody’s Child with the extension, approve
the listed Passport data once, then open Jigsaw or Lucy & Yak in a new tab.

> The Passport appears on the retailer’s own website. Open another compatible
> store: no repeated filters, no rewritten query and no second approval. The
> same profile and learned taste travel across different catalogues and
> vocabularies.

**2:17–2:40 — why WebMCP / close.** Show the Passport, then a three-box slide:
Human verdict → WebMCP contract → retailer-owned UCP.

> Without an open tool contract this becomes brittle scraping or
> retailer-by-retailer integration. With WebMCP, the human supplies judgment,
> the agent does the catalogue work and retailers keep ownership of inventory.
> One fitting. Every compatible shop. Fashion Passport.

## Recording rules

- Use a real microphone and continuous voiceover; the challenge requires audio.
- Keep the final cut below three minutes and upload publicly or unlisted to
  YouTube.
- Cut from a started live request to its completed response if a retailer is
  slow; never imply the products are cached.
- Avoid scrolling long pages on camera. Cut between the strongest product
  states.

## Fallbacks and honest claims

If Nobody's Child is unavailable, use Jigsaw. If both are unavailable, use
Lucy & Yak. Do not substitute static products.

Do not say every Shopify store works. Compatibility is discovered at runtime;
the eighteen retailers in `src/lib/data.ts` are the directly verified test
panel. Do not quote a fixed live result count in voiceover. Do say there are no
paid feeds, retained photos or retailer-specific DOM adapters.
