# Fashion Passport — Prescriptive Build Specification

Status: authoritative implementation handoff  
Owner of product decisions: Neelanjana Basu  
Implementation agent: Claude  
Final reviewer: Codex  
Deadline context: WebMCP Challenge submission; optimise for a credible, polished demonstrator and a clear judge demo.

This file is the source of truth for the next implementation pass. Execute it literally. Do not reinterpret the product, invent features, reduce scope, introduce arbitrary result limits, or replace live data with placeholders. If a requirement is blocked, record the exact blocker in `CLAUDE_HANDOFF.md`, continue with unaffected work, and do not silently substitute a different behaviour.

---

## 1. Access, repository and branch

### Repository

- GitHub: `https://github.com/neelanjanabasu13/fashion-passport`
- Local checkout: `/Users/neelanjanabasu/Documents/New project/fashion-passport`
- Base branch: `codex/mvp`
- Base commit at handoff: `a8c12d1` (`Make body and colour onboarding visual`)
- Required implementation branch: `claude/prescriptive-build`

Before changing files:

```bash
cd "/Users/neelanjanabasu/Documents/New project/fashion-passport"
git status --short
git switch codex/mvp
git pull --ff-only origin codex/mvp
git switch -c claude/prescriptive-build
npm install
```

If the local branch already exists, switch to it rather than recreating it. Never force-push, rewrite history, delete user changes, or merge into `codex/mvp` or `main`.

### Repository permissions

Preferred execution surface: Claude Code launched from the local checkout. In that case Claude inherits access to the working tree and does not require a GitHub connector merely to edit and commit.

If using Claude in the web application instead:

1. Connect GitHub in Claude settings.
2. Grant access only to `neelanjanabasu13/fashion-passport`.
3. Select `codex/mvp` as the source branch.
4. Work only on `claude/prescriptive-build`.
5. Do not grant access to unrelated repositories.

Never paste a GitHub token into source files, prompts, commit messages or `CLAUDE_HANDOFF.md`.

### Vercel access and permissions

The checkout is currently **not locally linked** to a Vercel project: `.vercel/project.json` does not exist. No Vercel access is required for implementation, local testing, commits or screenshots.

The human owner must perform authentication. Claude must not request, print, store or commit credentials.

When Neelanjana is ready to enable Vercel access, she should run:

```bash
cd "/Users/neelanjanabasu/Documents/New project/fashion-passport"
npx vercel login
npx vercel link
```

During `vercel link`, select the **existing Fashion Passport project**. Do not create a replacement project unless Neelanjana explicitly instructs it. `.vercel/` must remain ignored and must not be committed.

After authentication and linking:

- A preview deployment may be created only after Neelanjana explicitly says to deploy.
- A production deployment may be created only after Neelanjana explicitly says to deploy to production.
- Never expose or commit `VERCEL_TOKEN`, project IDs, organisation IDs or environment secrets.
- This demonstrator currently requires no environment variables. `.env.local.example` is authoritative.

Approved deployment commands, only after explicit approval:

```bash
npx vercel --yes
npx vercel --prod --yes
```

The first command is preview. The second is production. Do not run either during the implementation workstreams below.

---

## 2. Read before implementation

Read these files completely before editing:

- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `package.json`
- `src/lib/types.ts`
- `src/lib/data.ts`
- `src/lib/style-theory.ts`
- `src/lib/scoring.ts`
- `src/lib/shopify.ts`
- `src/app/page.tsx`
- `src/app/globals.css`
- all three routes under `src/app/api/shopify/`
- every file under `extension/`

This is Next.js 16.3.4. Follow `AGENTS.md`: consult the relevant installed Next.js documentation under `node_modules/next/dist/docs/` before changing framework code.

Design references supplied by Neelanjana:

- `/Users/neelanjanabasu/Downloads/fashion-passport-poc.html`
- `/Users/neelanjanabasu/Downloads/fashion-passport-spec.md`

If Claude cannot access those absolute paths, Neelanjana must upload both files. Do not attempt to reproduce them from memory.

---

## 3. Product statement

Fashion Passport is a portable personal relevance layer for fashion shopping.

It solves two problems:

1. Shoppers repeat the same size, budget and preference filtering on every retailer.
2. Retail search does not account for what may suit a shopper's proportions and colouring, while shoppers may still prefer something outside those guidelines.

The product combines two deliberately separate layers:

- **Suitability foundation:** body proportions and colour analysis provide a starting point.
- **Personal taste:** explicit choices and behaviour can overrule the foundation.

The Passport is created once, approved once, stored locally by default, and applied across compatible Shopify UCP retailers. Raw browsing reactions remain local. Only the derived profile required for ranking is included in an approved retailer request.

Current scope: womenswear. Menswear must be visibly labelled `Coming soon` and must not pretend to work.

---

## 4. Non-negotiable product principles

1. Never cap the recommendation set at 8, 10, 30 or another arbitrary number.
2. The first viewport may render a subset for performance, but every qualifying product must remain accessible by progressive loading or pagination.
3. Use real retailer products and images whenever the user is judging clothing.
4. Simple diagrams are permitted only for body proportions, colouring explanations and other abstract education.
5. Do not hard-code catalogue counts, recommendation counts, scores, profile outputs or retailer results.
6. Do not call all UCP products `relevant`. Report catalogue scanned, category-correct products, result tiers and hard-held items separately.
7. Do not treat ordinary dislikes as absolute exclusions.
8. Personal taste has more influence than styling theory.
9. Unknown product attributes are neutral, not positive evidence.
10. A score is not confidence. Report extraction confidence separately.
11. Product feedback must genuinely update subsequent rankings.
12. After onboarding, the shopper must never need to maintain the profile manually.
13. One connection applies across compatible retailers, tabs, categories and queries until revoked.
14. Do not claim compatibility with every Shopify fashion store. Say compatible Shopify UCP retailers are discovered at runtime; name only stores that were actually verified.
15. Every product assertion shown to the user must be traceable to live UCP data, parsed retailer text, selected variant data, explicit profile data or learned signals.

---

## 5. Frozen information model

Evolve `FashionProfile` without discarding existing saved profiles. Add a migration/fallback for the current local-storage shape.

### Profile layers

```ts
type PreferenceLevel = "love" | "avoid" | "never" | "neutral";

type PreferenceGroup = {
  love: string[];
  avoid: string[];
  never: string[];
};

type FashionProfile = {
  // retain current identity, country, size, height, budget and retailer fields
  colourSeason: string;
  bodyShape: string;
  colours: PreferenceGroup;
  silhouettes: PreferenceGroup;
  necklines: PreferenceGroup;
  sleeves: PreferenceGroup;
  patterns: PreferenceGroup;
  materials: PreferenceGroup;
  lengths: PreferenceGroup;
  budgetMode: "usual" | "strict";
};
```

Existing `love` and `avoid` arrays remain valid. Missing `never` arrays default to `[]`. Existing budget defaults to `usual`, not strict.

### Learned signals

Store locally:

```ts
type TraitVote = {
  up: number;
  down: number;
  updatedAt: string;
};

type LearnedTaste = Record<string, TraitVote>;
```

Use canonical keys such as:

```text
colour:navy
silhouette:a-line
neckline:square
sleeve:long
length:midi
material:polyester
pattern:gingham
```

Derived learning rules:

- `up - down >= 2`: learned positive preference.
- `down - up >= 2`: learned negative preference.
- Confidence: `min(1, abs(up - down) / 4)`.
- A single vote never creates an absolute rule.
- Only an explicit user-selected `never` can create a trait hard block.
- Preserve raw tallies locally so preferences can recover when behaviour changes.

### Product record

Every ranked product must expose:

```ts
type AttributeEvidence = {
  value: string;
  confidence: "high" | "medium" | "low" | "unknown";
  source: "variant" | "title" | "tag" | "option" | "description" | "image" | "unknown";
};

type RankedFashionProduct = {
  // retain existing product identity, retailer, price, URL, image and sizes
  category: AttributeEvidence;
  colour: AttributeEvidence;
  silhouette: AttributeEvidence;
  neckline: AttributeEvidence;
  sleeve: AttributeEvidence;
  length: AttributeEvidence;
  pattern: AttributeEvidence;
  material: AttributeEvidence;
  matchScore: number;
  evidenceConfidence: "high" | "medium" | "low";
  state: "strong" | "worth" | "other" | "held";
  reasons: ScoreReason[];
  conflicts: ScoreReason[];
  hardRules: ScoreReason[];
};
```

An equivalent implementation is acceptable if it preserves every semantic requirement above.

---

## 6. Garment ontology and extraction

Use common fashion nomenclature and synonyms. Do not infer all attributes through one loose text search.

### Required canonical categories

- dress
- skirt
- top
- shirt/blouse
- trouser
- jean
- jumpsuit/playsuit
- short
- coat/jacket
- knitwear

### Required canonical silhouettes

- A-line
- Fit and flare
- Flowy
- Wrap
- Shift/boxy
- Column
- Bodycon
- Tailored/structured
- Wide-leg
- Straight

### Required necklines

- Square
- Boat/bateau
- Scoop
- V-neck
- Cowl
- High/crew
- Halter
- Sweetheart
- Asymmetric/one-shoulder
- Strapless

### Required sleeve and strap forms

- Sleeveless
- Strappy/camisole
- Cap
- Short
- 3/4
- Long
- Puff
- Flutter
- Bardot/off-shoulder

### Required lengths

- Mini
- Knee
- Midi/midaxi
- Maxi/floor

### Required materials

- Cotton/pure cotton
- Linen
- Silk
- Chiffon
- Viscose
- Polyester
- Wool
- Denim
- Satin
- Jersey
- Knit

### Required patterns

- Solid/plain
- Ditsy/small floral
- Floral
- Gingham
- Check/plaid
- Stripe
- Polka dot
- Animal
- Abstract/large print

### Extraction order

1. Selected/displayed variant data.
2. Product title.
3. Structured tags and options.
4. Description.
5. Image analysis only when a visually important attribute is still unknown and an approved image-analysis service is available.

Do not score a product as matching every colour option. Prefer the colour in the title or selected/displayed variant. Preserve the other variants as alternatives rather than simultaneous matches.

Do not introduce a paid image service, API key or new commercial dependency. The deterministic ontology must work without one. If image analysis is unavailable, show lower evidence confidence rather than inventing an attribute.

---

## 7. Frozen filtering and scoring rules

### Stage 1: category gate

If the request is for dresses, only products classified as dresses enter the ranked dress set. The same rule applies to every recognised garment category.

Category-unknown products may appear only under `All products`, never inside a claimed category count.

### Stage 2: hard rules

A product is `held` only when at least one of these is confirmed:

1. A requested category is wrong.
2. The request contains a hard price constraint such as `under £100` and the product exceeds it.
3. Available size data exists and the shopper's size is confirmed unavailable.
4. The product matches an explicit `never` trait.
5. `budgetMode` is `strict` and the product exceeds the profile budget.

Unknown size availability is not a hard block. The profile's usual budget is not a hard block. Ordinary `avoid` traits are not hard blocks.

### Stage 3: match score

Start every category-correct, non-held product at 40. A product with no usable fashion attributes therefore remains in `other`; missing information must never promote it into `worth`.

Explicit positive preference weights:

| Attribute | Love |
|---|---:|
| Colour | +12 |
| Silhouette | +10 |
| Neckline | +8 |
| Sleeve | +5 |
| Length | +6 |
| Material | +7 |
| Pattern | +5 |

Explicit avoid weights:

| Attribute | Avoid |
|---|---:|
| Colour | -12 |
| Silhouette | -10 |
| Neckline | -8 |
| Sleeve | -5 |
| Length | -6 |
| Material | -9 |
| Pattern | -6 |

Suitability-foundation weights, applied only when that attribute is not explicitly avoided:

| Attribute | Theory match |
|---|---:|
| Colour | +5 |
| Silhouette | +5 |
| Neckline | +3 |
| Sleeve | +2 |
| Length | +2 |
| Material | +2 |

Learned preference:

- Positive: `+4 * confidence` for each matching learned-positive trait.
- Negative: `-4 * confidence` for each matching learned-negative trait.
- Explicit user preferences always outrank learned and theory weights.

Utility evidence:

- Confirmed shopper size available: +3.
- Confirmed within a hard query budget: +2.
- Over the usual profile budget when budget is not strict: -8.

Unknown attributes contribute 0. Do not infer a positive match from missing information.

Round once at the end and clamp to 1–99. Do not cap large groups at the same artificial maximum.

Deterministic tie-break order:

1. Higher match score.
2. More explicit-preference hits.
3. Higher evidence confidence.
4. More suitability-foundation hits.
5. Lower price when the request mentions value/budget; otherwise product name alphabetically.

### Result tiers

- `strong`: score >= 70 and not held.
- `worth`: score 50–69 and not held.
- `other`: score < 50 and not held.
- `held`: at least one confirmed hard rule.

If evidence confidence is low, replace a percentage badge with `Possible match · limited product information`. The score may still be used internally for ordering.

### Evidence confidence

- High: five or more fashion attributes are known from variant/title/tag/option/description evidence.
- Medium: three or four are known.
- Low: zero to two are known.

---

## 8. Onboarding experience

Target completion time: under two minutes for a decisive user. Nothing except the one final retailer connection is compulsory beyond what is required to create a usable starting point.

### Act 1: suitability foundation

Keep the dark fitting-room visual world from the supplied POC.

Body shape:

- Show five visual proportion choices: Inverted triangle, Pear, Hourglass, Rectangle and Apple.
- Visual first; concise explanatory text remains.
- Immediately explain likely starting silhouettes and necklines after selection.

Colour direction:

- Use visual examples for undertone, skin depth and natural contrast.
- Use a common 12-season vocabulary in the data model, even if the demonstrator initially presents grouped routes.
- Allow `Not sure` and `I already know my season`.
- Describe the result as a starting point, not a scientific diagnosis.
- Show the resulting palette visually.

No uploaded photo is required. If a later photo path is retained, process temporarily, retain only derived values and delete the image immediately.

### Act 2: what the shopper already knows

Add a fast optional preference-card step covering:

- Colours
- Silhouettes
- Necklines
- Sleeves
- Lengths
- Patterns
- Materials

Each trait supports `Love`, `Avoid` and `Never`. Neutral is the default. Use compact tactile cards/tabs consistent with the swatch-book aesthetic, not a dense form.

Do not force the user to answer every category.

### Act 3: adaptive real-product taste pass

- Use real products and real images sourced from multiple responding UCP retailers.
- Present at least 12 diverse products.
- Avoid repeated products and near-identical variants.
- Ensure the deck covers colour, silhouette, neckline, sleeve, length, material and pattern wherever data permits.
- Primary actions: `Not me` and `Love it`.
- After an ambiguous reaction, show an optional short-lived prompt: `What worked?` or `What put you off?` with the known traits as one-tap reasons.
- The prompt must never block continuation.
- If more than half the early theory-led products are disliked, visibly switch to taste-led exploration and broaden outside the foundation.

### Passport result

The resulting Passport must show three layers separately:

1. `Likely to suit you` — theory foundation.
2. `What you chose` — explicit Love/Avoid/Never.
3. `Learning as you shop` — learned traits with confidence and interaction count.

The supplied colour swatch book is one section of the Passport, not the entire Passport. Add sections/cards for fit, neckline, sleeves/length, materials/patterns and hard rules.

Use the copy:

> Your taste outranks the rulebook.

And:

> Fashion Passport keeps learning as you shop. You do not need to maintain this profile.

---

## 9. Retailer experience

The extension must operate on the real retailer domain and use real UCP products. It must not send the shopper back to a generic Fashion Passport shopping landing page.

### Connection

- Probe capability without sending the profile.
- If compatible and not connected, ask once.
- Once approved, never ask again because the shopper changed store, category, query or tab.
- Approval remains until revoked.
- Raw browsing interactions stay in browser-local storage.

### Results header

Show live, truthful counts using this hierarchy:

```text
{catalogueScanned} catalogue products scanned
{categoryCorrect} {category} found
{strongCount} strong matches · {worthCount} worth a look · {heldCount} held by your rules
```

Do not use fixed counts. Do not describe the first rendered page as the entire result set.

### Result navigation

Provide:

- Strong matches
- Worth a look
- All products
- Held by rules

Default to Strong matches when at least one exists. Render an initial batch of 24 for performance and provide `Load 24 more` until every product in the selected tier is accessible. The number 24 is a render batch, never a recommendation cap.

### Product presentation

- Real image, title, price and retailer link.
- Selected/displayed variant colour where available.
- Concise positive reasons.
- Visible conflicts.
- A hard-rule explanation only when actually held.
- Do not desaturate or strike through ordinary soft-conflict products.
- Use the visual labels `Strong match`, `With a note` and `Held by rule` sparingly.
- Preserve the retailer's visual identity. Fashion Passport is an annotation and ranking layer, not a replacement retailer brand.

### Ongoing education

Every result card must support `More like this` and `Less like this`.

On reaction:

1. Persist the product's known canonical traits in local tallies.
2. Recompute learned preferences.
3. Rerank the current catalogue immediately.
4. Show an Undo-able message, for example:

   `Passport learned: less halternecks. 8 products moved down.`

5. Apply the same derived preferences automatically on the next compatible retailer.

Do not assume a disliked product means the neckline was disliked. Use repeated trait evidence and the optional reason prompt.

---

## 10. Visual system

Use the supplied `The Verdict Book` direction with the following frozen interpretation.

### Keep

- Warm plaster base.
- Oxblood fitting-room environment.
- Newsreader editorial serif.
- Restricted monospaced annotations.
- Punched-card/binding detail.
- User palette as the principal saturated colour.
- Transition from fitting room to physical Passport.
- Restrained Passport seal on retailer pages.

### Change

- Use real product photography in taste and retail contexts.
- Reduce tiny monospace copy and ensure body text remains readable.
- Use fewer borders and boxes; preserve generous editorial whitespace.
- Do not stamp every product.
- Replace binary `Admitted/Refused` with the result states in this specification.
- Replace every fixed before/after product count with counts calculated from the current live catalogue response.
- Expand the book beyond colour.
- Make the Passport's learned layer visibly update after shopping feedback.

### Metaphor hierarchy

1. The fitting room creates the Passport.
2. The Passport is the persistent object.
3. A small seal proves it has travelled to a retailer.
4. Thumbs and optional reason tags teach it.

Do not add more metaphors or decorative interaction systems.

### Responsive and accessibility requirements

- Keyboard-accessible controls and visible focus states.
- Semantic buttons, headings, lists and status messages.
- No essential text below 12px.
- WCAG AA contrast for functional text.
- `prefers-reduced-motion` support.
- Mobile layout at 390px and desktop layout at 1440px.
- No horizontal overflow.
- Back/adjust controls during onboarding.
- `Not sure` where the user may reasonably not know an answer.

---

## 11. Required cross-store proof

The judge demo must prove portability, not merely cross-store search.

Required flow:

1. Open Fashion Passport and complete or use the saved demo Passport.
2. Connect once.
3. Open Nobody's Child on a real category page.
4. Show the full catalogue/category counts and personalised tiers.
5. React negatively to a clearly identifiable trait, preferably a halterneck or polyester item, and optionally choose the reason.
6. Show the catalogue rerank and the `Passport learned` message.
7. Open Jigsaw in another tab.
8. Show that no second approval appears.
9. Show that the learned preference is already reflected there.

If either live endpoint is temporarily unavailable, document a second verified retailer fallback in `CLAUDE_HANDOFF.md`. Do not replace the primary demo with static fake data.

---

## 12. Acceptance tests

All must pass before handoff.

### Data correctness

1. A dresses query contains only dresses in the category-correct set.
2. A product over a hard query cap is held.
3. A product over the usual profile budget receives a soft penalty unless budget mode is strict.
4. `Avoid: Polyester` never hides a product by itself.
5. `Never: Polyester` holds a confirmed polyester product.
6. Confirmed unavailable size holds; unknown size data does not.
7. Unknown attributes add no positive score.
8. Variant colour does not inherit every other available colour as a match.
9. Results do not all saturate at the same score.
10. Equal-score ordering follows the specified tie-breaks, not API order.

### Named regression case

Nobody's Child `Navy Halterneck Amie Midi Dress` must not be hidden merely because it contains polyester when Polyester is only in `avoid`.

Expected treatment with the current demo profile:

- Positive: navy/Deep Winter direction, V-neck/halter information where supported, midi, UK 10 if live availability confirms it, under a £100 hard query cap.
- Conflict: polyester.
- State: `strong` or `worth`, depending on current live evidence and exact explicit preferences; never `held` unless Polyester is explicitly `never`.

### Result completeness

1. If 74 products qualify as strong, all 74 can be reached through progressive loading.
2. The first 24 are clearly labelled as the initial rendered batch, not the full recommendation count.
3. Counts distinguish catalogue scanned, category-correct, strong, worth and held.
4. `All products` exposes non-held lower-ranked items.
5. `Held by rules` is inspectable and explains each hard rule.

### Learning

1. Thumbs-up persists a real positive signal.
2. Thumbs-down persists a real negative signal.
3. One reaction does not create a permanent trait preference.
4. Repeated evidence changes the derived preference.
5. Optional reason tags accelerate only the selected trait.
6. Undo reverses the most recent signal.
7. Current results rerank immediately.
8. A learned signal at Nobody's Child affects Jigsaw without manual profile editing.
9. Reloading the tab preserves the derived preference.

### Experience

1. Body and colouring questions are visual-first with explanatory text.
2. All five body shapes exist.
3. Real product images are used for taste decisions.
4. The Passport shows theory, explicit and learned layers.
5. Menswear is visibly Coming soon.
6. One retailer approval is requested only once.
7. No generic Passport landing page is substituted for the retailer experience.
8. Desktop and mobile layouts have no overflow.

---

## 13. Workstreams and commits

Complete in order. Commit after each workstream.

### Commit 1 — data model and ranking

Suggested message:

```text
Implement evidence-based fashion ranking
```

Deliver:

- Backward-compatible profile migration.
- `never`, budget mode and learned-vote model.
- Typed attribute extraction and evidence confidence.
- Category gate, hard rules, scoring, tiers and deterministic sorting.
- Unit/fixture tests using Node's built-in test runner or an equivalently lightweight test setup. Do not introduce a large test framework solely for this.

### Commit 2 — onboarding and Passport design

Suggested message:

```text
Build the Verdict Book onboarding and Passport
```

Deliver:

- Supplied visual direction integrated into the Next.js app.
- Five-shape and visual colour foundation.
- Optional Love/Avoid/Never preference cards.
- Real-product adaptive taste pass.
- Multidimensional Passport with theory, explicit and learned layers.
- Mobile and accessibility treatment.

### Commit 3 — complete retailer experience

Suggested message:

```text
Add complete live retailer ranking and learning
```

Deliver:

- Full tier counts and progressive loading.
- Real retailer products/images.
- Strong/with-note/held presentation.
- Working More/Less feedback, optional reason tags, Undo and immediate reranking.
- Cross-retailer local signal persistence.
- Extension version increment.

### Commit 4 — verification and submission artifacts

Suggested message:

```text
Add submission evidence and demo guide
```

Deliver:

- Updated `README.md` containing only verified claims.
- `docs/ARCHITECTURE.md` with a simple architecture diagram.
- `docs/DEMO.md` with a two-minute script and fallback retailer.
- `docs/DEVPOST_DRAFT.md`.
- `docs/PRIVACY.md`.
- Final screenshots stored in a sensible `docs/images/` location.
- `CLAUDE_HANDOFF.md`.

Do not deploy or merge after Commit 4.

---

## 14. Verification commands

Run after every workstream:

```bash
npm run lint
npm run build
git diff --check
```

Run all added tests. Include exact commands and results in `CLAUDE_HANDOFF.md`.

Browser verification must cover:

- Onboarding from a fresh profile.
- Saved profile restoration.
- Live cross-store search.
- Nobody's Child category correctness.
- Progressive loading through the end of a tier.
- Feedback, Undo and immediate reranking.
- Jigsaw carrying the learned signal without a second approval.
- 1440px desktop.
- 390px mobile.

Check browser console errors and failed network calls. Do not declare success while hiding an error behind fallback data.

---

## 15. Required handoff file

Create `CLAUDE_HANDOFF.md` containing:

1. Branch and commit hashes.
2. Files changed by workstream.
3. Exact test commands and results.
4. Live retailers verified and timestamp of verification.
5. Screenshot paths.
6. Known limitations.
7. Any requirement not completed and the exact reason.
8. Any user action still required.
9. Confirmation that no deployment, merge, credential write or force-push occurred.

The final line must be one of:

```text
READY FOR CODEX REVIEW
```

or:

```text
NOT READY FOR REVIEW — BLOCKERS LISTED ABOVE
```

---

## 16. Forbidden changes

Claude must not:

- Make product or scope decisions not specified here.
- Add a paid dependency, commercial feed, paid domain, stylist service or custom model integration.
- Store uploaded photos.
- Send browsing history to a server.
- Claim every Shopify store is compatible.
- Hard-code live counts or scores.
- Reintroduce SVG/cartoon garments where real products are being evaluated.
- Reintroduce an arbitrary recommendation cap.
- Treat soft dislikes as hard blocks.
- Make all feedback map to neckline.
- Show products from the wrong category.
- Replace the retailer-domain experience with a generic shopping landing page.
- Remove the one-time explicit approval.
- Deploy, merge, amend previous commits, force-push or expose secrets.
- Perform broad unrelated refactors.
- Change the prescribed visual direction without Neelanjana's approval.

When implementation details are ambiguous, choose the smallest change that satisfies this specification and record the choice in `CLAUDE_HANDOFF.md`. Do not redesign the requirement.
