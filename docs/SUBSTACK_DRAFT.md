# Every fashion website forgets you

## What I built in ten days, and why shopping may need a Passport rather than another retailer profile

Every fashion website starts the same conversation from zero.

You arrive knowing a surprising amount about yourself: your size, budget, the
fabrics you will not wear, the colours you reach for and the cuts that make you
feel right. Maybe you even know your colour season or the proportions you like
to balance. Then the website gives you a search box and a sea of products built
for everybody.

Move from ASOS to Next, from a marketplace to an independent Shopify store, and
that context disappears. Retailers have spent years building profiles and
recommendation systems, but those profiles are passports valid in only one
country.

So I built Fashion Passport.

The premise is simple: hard-won knowledge about a shopper should belong to the
shopper, and it should travel.

### What suits you is not the same as what you love

Most styling products make one of two mistakes. They treat body shape and
colour theory as law, or they ignore suitability and learn only from clicks.

Neither feels human.

People often want help understanding what may suit their proportions and
colouring. That guidance can be useful. It can also be wrong, culturally narrow
or irrelevant to how someone wants to dress. The durable product has to hold
two datasets at once: “this may suit you” and “you genuinely love this.”

In Fashion Passport, the second always wins.

The onboarding is a short fitting presented as a physical “Verdict Book.” It
uses visual proportion diagrams and colour swatches for a transparent starting
point. Then it offers optional Love, Avoid and Never choices across colour,
silhouette, neckline, sleeve, length, print and material. Finally, the shopper
reacts to real retailer products—not cartoons—so preference can reveal itself
without turning setup into form-filling homework.

If the shopper rejects more than half of the theory-led choices, the fitting
widens automatically. That is the product admitting the person knows something
the rulebook does not.

### Avoid is not Never

Recommendation systems often make invisible decisions. A click becomes a
preference. A preference becomes a filter. Products disappear and the user
cannot tell why.

Fashion Passport uses a deliberately conservative hierarchy. An Avoid lowers a
product’s rank and prints the conflict. It does not hide it. Only an explicit
Never, a hard price cap in the query, strict budget mode or confirmed size
unavailability can hold an item. One thumbs-down never creates a learned rule.
Repeated evidence is required, confidence is visible and Undo is available.

This sounds like implementation detail. It is product ethics made concrete.

### Why this needed WebMCP

Cross-retailer shopping has been attempted many times. The failure mode is
usually the same: scraping.

Scraping makes an agent guess through interfaces designed for humans. A theme
changes, a selector moves or a bot wall appears, and the product breaks. It also
muddles responsibility: whose product data is authoritative, and what exactly
did the user permit the agent to share?

WebMCP changes the shape of the solution. It lets websites expose structured,
typed tools that agents can call directly. Fashion Passport exposes tools for
reading an approved Passport, finding personal matches, comparing compatible
stores and recording a style signal. Compatible Shopify stores expose their
own catalogue tools through UCP. The agent can compose the two contracts: carry
the shopper’s context to retailer-owned inventory, then bring back an
explainable ranking.

The human provides taste and permission. The agent handles breadth and
repetition. The retailer remains the source of truth.

That division of labour is the real idea.

### The moment the product becomes credible

The web app is useful, but the decisive demonstration happens somewhere else:
on a retailer’s own website.

The Chrome extension checks whether the current store exposes a compatible
catalogue endpoint. If it does not, Fashion Passport stays out of the way. If
it does, the user approves the Passport once and a live panel opens over the
store, using real retailer images, prices and product links.

Then the user opens another compatible retailer.

No repeated filters. No rewritten query. No second approval. The same size,
taste, suitability context and learned reactions are already there.

That is the travel analogy made real.

### Truthful numbers are a feature

Live commerce data is messy. A search for dresses can return tops, coats and
editorial records. Some products have structured material and neckline tags;
others barely have a title. A single API page is not a whole catalogue.

Fashion Passport shows a count hierarchy instead of one impressive but
misleading number: catalogue scanned, category-correct, strong matches, worth a
look, other options and items held by a confirmed rule. Twenty-four is only a
render batch. Load more continues until every qualifying product is reachable.

Missing evidence never earns points. Score and evidence confidence are
separate. Thin retailer data stays visible as a possible match with limited
information rather than receiving a fabricated percentage.

This was some of the least glamorous work and some of the most important.

### What Fashion Passport is—and is not

It is a working demonstrator for womenswear. Menswear is labelled Coming soon
because it needs its own tested guidance model.

It does not claim to search every Shopify store simultaneously. Shopify exposes
per-store catalogue endpoints, not a public global merchant directory. The
comparison hub uses eighteen directly verified fashion retailers; the extension
discovers compatibility at runtime on the store the shopper chooses. That test
panel proves the adapter without pretending to define the whole universe.

It uses no paid feed, licensed styling database or retained photograph.
Browsing reactions remain in the browser. Cross-device sync is off.

### The larger possibility

Fashion is the sharpest example of a broader problem. The web is excellent at
remembering people inside platforms and strangely bad at letting people carry
their own context between them.

A Passport could hold travel accessibility needs, food constraints, furniture
dimensions, procurement policies or sustainability requirements. The important
part is the ownership model: context should be portable, permissioned and
legible.

The future of agents should not be one where they secretly infer everything
about us on every site. It should be one where we hand them a purpose-built
piece of context, see exactly what it contains, and take it back.

One fitting. Every compatible shop.

That is Fashion Passport.

---

Live demo: https://fashion-passport.vercel.app  
Source: https://github.com/neelanjanabasu13/fashion-passport
