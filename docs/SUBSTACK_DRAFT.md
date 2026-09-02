# Every fashion website forgets you

## What I built in ten days, and why shopping needs a portable profile

Every fashion website starts the same conversation from zero.

You arrive knowing your size, budget, the
fabrics you will not wear, the colours you reach for and the cuts that make you
feel right. Maybe you even know your colour season or the proportions you like
to balance. Then the website gives you a search box and a sea of products built
for everybody.

Move from ASOS to Next, from a marketplace to an independent Shopify store, and
that context disappears. Retailers have spent years building profiles and
recommendation systems, but those profiles are passports valid in only one
country.

I built Fashion Passport so hard-won knowledge about a shopper can belong to the
shopper and remain useful across stores.

### How suitability and taste work together

People often want help understanding what may suit their proportions and
colouring. That guidance can be useful. It can also be wrong, culturally narrow
or irrelevant to how someone wants to dress. Fashion Passport therefore keeps
guidance about potential suitability separate from evidence about what the
shopper genuinely loves, with personal preference receiving greater weight.

The onboarding is a short fitting presented as a physical “Verdict Book.” It
uses visual proportion diagrams and colour swatches for a transparent starting
point. Then it offers optional Love, Avoid and Never choices across colour,
silhouette, neckline, sleeve, length, print and material. Finally, the shopper
reacts to real retailer products, so preference can emerge through clothes they
may buy.

If the shopper rejects more than half of the theory-led choices, the fitting
widens automatically, giving the shopper's judgment greater weight when it
conflicts with the initial guidance.

### Avoid and Never have different effects

Recommendation systems often make invisible decisions. A click becomes a
preference. A preference becomes a filter. Products disappear and the user
cannot tell why.

Fashion Passport uses a deliberately conservative hierarchy. An Avoid lowers a
product’s rank, prints the conflict and keeps the item visible. An explicit
Never, a hard price cap in the query, strict budget mode or confirmed size
unavailability can hold an item. Repeated evidence is required before feedback
creates a learned preference, while visible confidence and Undo keep the process
under the shopper's control. These implementation choices make the decision
policy concrete.

### Why this needed WebMCP

Many cross-retailer shopping products rely on scraping.

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

The human provides taste and permission, the agent handles breadth and
repetition, and the retailer remains the source of truth.

### The store-to-store demonstration

The web app supports comparison, while the retailer website demonstrates
portability directly.

The Chrome extension checks whether the current store exposes a compatible
catalogue endpoint. It stays out of the way on unsupported stores and opens a
live panel after approval on compatible stores, using real retailer images,
prices and product links.

When the user opens another compatible retailer, the same size, taste,
suitability context and learned reactions are available without repeated
filters, a rewritten query or another approval.

### Truthful numbers are a feature

Live commerce data is messy. A search for dresses can return tops, coats and
editorial records. Some products have structured material and neckline tags;
others barely have a title. A single API page is not a whole catalogue.

Fashion Passport shows a count hierarchy that separates catalogue scanned,
category-correct, strong matches, worth a look, other options and items held by
a confirmed rule. Twenty-four controls each render batch, and Load more continues
until every qualifying product is reachable.

Missing evidence never earns points. Score and evidence confidence are
separate. Thin retailer data stays visible as a possible match with limited
information rather than receiving a fabricated percentage.

This work protects the accuracy of the product claims and the usefulness of the ranking.

### Current scope

It is a working demonstrator for womenswear. Menswear is labelled Coming soon
because it needs its own tested guidance model.

Shopify exposes per-store catalogue endpoints without a public global merchant
directory, so the comparison hub uses eighteen directly verified fashion
retailers. The extension discovers compatibility at runtime on the store the
shopper chooses, which extends the adapter beyond the verified panel.

It uses no paid feed, licensed styling database or retained photograph.
Browsing reactions remain in the browser. Cross-device sync is off.

### The larger possibility

Fashion is the sharpest example of a broader problem. The web is excellent at
remembering people inside platforms and strangely bad at letting people carry
their own context between them.

A Passport could hold travel accessibility needs, food constraints, furniture
dimensions, procurement policies or sustainability requirements. The important
part is an ownership model where context remains portable, permissioned and
legible.

Agents can work from a purpose-built piece of context that people can inspect,
approve and revoke. Fashion Passport applies that model to fashion shopping
through one fitting and one reusable profile across compatible stores.

---

Live demo: https://fashion-passport.vercel.app  
Source: https://github.com/neelanjanabasu13/fashion-passport
