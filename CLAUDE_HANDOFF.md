# Claude handoff

> Historical implementation handoff. Its listed P0/P1 findings were resolved
> by commit `8a6c8f6`. Use `README.md` and `docs/DEMO.md` for current setup and
> verification instructions.

Branch: `claude/prescriptive-build`
Reviewed tip: `bbf7f2b` (*Document blocking review findings*)
Base: `codex/mvp` at `c491cd1`
Prepared: 2 September 2026

All P0 and P1 corrections in `CODEX_REVIEW.md` are implemented. One review item
turned out to be worse than reported; that is recorded in section 7.

## 1. Commits

| # | Commit | Message |
|---|---|---|
| 1 | `430ab53` | Implement evidence-based fashion ranking |
| 2 | `9622a5d` | Build the Verdict Book onboarding and Passport |
| 3 | `38f403a` | Add complete live retailer ranking and learning |
| 4 | `4263c52` | Add submission evidence and demo guide |
| 5 | `bbf7f2b` | Document blocking review findings (Codex) |
| 6 | this commit | Correct blocking review findings |

No commit was amended. Nothing was force-pushed, merged or deployed.

## 2. How each finding was corrected

### P0.1 — extension feedback was non-functional

`extension/content.js` now records raw `{up, down, updatedAt}` tallies in
`chrome.storage.local` under `fashion-passport:taste-votes`, with the same
semantics as `src/lib/learned.ts`.

- Both reactions record every known canonical trait. The `.slice(0, 0)` that
  always produced an empty string is gone, as is the singular `dataset.trait`
  read. Buttons now carry an index into the rendered tier and the handler works
  from the product object.
- One vote crosses no threshold; two net votes create a preference at 0.5
  confidence, scaling to 1.0 at four.
- The panel reranks in place and reports a **measured** moved count, computed by
  comparing the order before and after, not asserted.
- Undo restores the previous tallies and the previous order.
- The optional reason prompt narrows the broad vote to one chosen trait by
  reversing the broad vote and reapplying it to that trait alone. It never
  blocks continuation.

Tests: parity of tallies, thresholds, confidence and undo against `src/lib`;
both reactions recording every trait; four reactions demoting a matching
product in the extension's own ranking without removing it.

### P0.2 — the extension used an obsolete word-count engine

Added `extension/fashion-engine.js`, a self-contained script exposing
`globalThis.FashionEngine`, loaded before `content.js` and loadable as a
CommonJS module in tests. It carries the canonical ontology, the extraction
order, evidence confidence, the fixed weights, the five hard rules, the four
result states, deterministic sorting, the partition and the learned-signal
model.

The data tables were copied mechanically from `src/lib/ontology.ts`,
`src/lib/scoring.ts` and `src/lib/style-theory.ts` rather than retyped, so they
cannot drift by transcription error. `content.js` now makes no ranking decision
of its own: `hasTerm`, `productText`, `theoryTerms`, `matchesCategory` and the
local scorer are deleted.

Selected colour is parsed apart from alternative colourways, stated fibre
composition still outranks a marketing fabric tag, unknown attributes
contribute zero, soft avoids never hold, and `never`, strict budget, a hard
query cap and a confirmed sold-out size all hold correctly in the extension.

`tests/parity.test.ts` runs one corpus through both implementations across four
queries and fails on any disagreement in score, state, confidence, hard-rule
count or ordering.

### P0.3 — profile and learned data did not travel

`syncPassportApp()` now syncs the complete migrated `FashionProfile`, including
every `never` group and `budgetMode`, plus the raw `fashion-passport:taste-votes`
tallies. The block that flattened the grouped profile into two arrays is
deleted. The extension listens for `fashion-passport:learned-changed` and for
storage events, so later learning keeps flowing. Legacy flat signals are still
imported and converted rather than discarded.

### P0.4 — WebMCP `record_style_signal` used the broken path

The tool and the visible product card now call one function, `applyReaction`.
It records both reactions through `traitKeysForProduct` and `recordVote`,
persists, reranks and measures the moved count. The tool returns the learned
keys, whether a derived preference actually changed, and the moved count.

### P0.5 — counts and tiers included wrong-category products

Added `partitionResults()`. Every visible figure now comes from one set:

```
categoryCorrect = strong + worth + other + held
```

Products of a different, known category are gated out at stage 1 and appear in
no tier and no count, because the shopper set no rule about them. Products whose
category could not be established are counted separately and shown only under
All products. The hub and the extension both render from this one partition.

The scale of the original defect, measured live: at Jigsaw, 96 of 200 products
returned for a dresses query are not dresses. Every one of them was previously
counted as "held by your rules".

### P0.6 — the extension had a catalogue ceiling

`readFullCatalog`'s ceiling of 12 pages is replaced by `readCatalogFrom`, which
follows the cursor to exhaustion with a defensive ceiling of 200 pages. If that
ceiling is ever reached the cursor is saved, every count is labelled "so far",
the footer says "more available", and the panel offers "Keep scanning the
catalogue", which resumes from the saved cursor, deduplicates and reranks the
enlarged set. No total is displayed while `has_next_page` is true.

Verified live: Nobody's Child now reads to exhaustion, 1,000 products across 25
pages, `more pages remaining: false`.

### P1.1 — arbitrary-product copy

"shows the best 30" replaced with copy stating that every qualifying product
stays reachable through the tiers and Load more.

### P1.2 — screenshots

See section 7. The cause was worse than reported.

### P1.3 — documentation counts

Every measured figure in `README.md`, `docs/DEVPOST_DRAFT.md`, `docs/DEMO.md`
and `docs/ARCHITECTURE.md` now comes from the single verification run in
section 4, taken after the P0.5 fix. Wrong-category products are no longer
described as held. No claim of extension learning or engine parity is made
anywhere without the tests that back it.

### P1.4 — clean gate

Trailing whitespace removed from `src/app/page.tsx`. `git diff --check` reports
only two trailing-whitespace markers inside `CODEX_REVIEW.md` itself, which are
markdown hard line breaks in Codex's own document. That file was deliberately
left untouched.

## 3. Commands and results

```
npm run lint                            clean, 0 errors 0 warnings
npm run build                            compiled successfully, 5 routes
npm test                                 36 tests, 36 pass, 0 fail
node --check extension/fashion-engine.js ok
node --check extension/content.js        ok
node --check extension/page-tools.js     ok
node --check extension/popup.js          ok
git diff --check c491cd1...HEAD          clean apart from CODEX_REVIEW.md, see P1.4
```

Tests covering the review findings, all in `tests/parity.test.ts`:

| Finding | Tests |
|---|---|
| P0.1 | learned-signal parity; both reactions record every trait; four reactions demote in the extension panel |
| P0.2 | extraction parity; scoring parity across four queries; the named regression case; hard rules in the extension; unknown attributes contribute zero; selected colour apart from colourways; stated composition precedence |
| P0.3 | a learned negative made in the app applies on the first retailer and travels to the next; never holds and avoid does not, on the synced grouped profile |
| P0.4 | both reactions record and only repeated evidence crosses the threshold; the moved count is measured against a real rerank |
| P0.5 | tier counts add up in both implementations; a skirt under a dresses query is gated out, not held |

## 4. Live verification, 2 September 2026

One run, used for every figure in the documentation.

**Nobody's Child**, query `dresses`, 13:15 UTC, 36.7 seconds, catalogue read to
exhaustion.

```
pagination    1,000 scanned across 25 pages, more pages remaining: false
tiers         category-correct 980 · strong 382 · worth 299 · other 77 · held 222
invariant     980 === 382 + 299 + 77 + 222   OK
gated out     2 wrong-category · 0 unknown-category
attributes    colour 100% · length 100% · sleeve 96% · neckline 93% · pattern 87% · silhouette 76% · material 54%
confidence    933 high · 49 medium · 0 low
scores        29 to 99 across 71 distinct values
```

**Jigsaw**, query `dresses`, 13:15 UTC, 5.6 seconds, catalogue exhausted.

```
pagination    200 scanned, more pages remaining: false
tiers         category-correct 101 · strong 1 · worth 22 · other 10 · held 68
invariant     101 === 1 + 22 + 10 + 68   OK
gated out     96 wrong-category · 3 unknown-category
attributes    colour 100% · material 74% · silhouette 48% · length 28% · pattern 20% · sleeve 18% · neckline 17%
confidence    19 high · 118 medium · 63 low
```

**Cross-store hub**, query `dresses under £100`, in-browser at 1440 and 390.

```
1,117 catalogue products scanned so far across 18 live stores
1,002 dresses found · 14 more could not be categorised, shown under All products
71 strong · 170 worth a look · 106 other · 655 held by your rules
invariant on screen: 1,002 === 71 + 170 + 106 + 655   OK
```

## 5. Screenshots

| File | Dimensions | SHA-256 (first 16) |
|---|---|---|
| `docs/images/onboarding-desktop-1440.png` | 1440 x 1354 | `1f5ff025071f5c27` |
| `docs/images/onboarding-mobile-390.png` | 390 x 1833 | `92d41a2dabb4bfbb` |
| `docs/images/retailer-results-1440.png` | 1440 x 1000 | `b4bbf61a74aae609` |
| `docs/images/retailer-results-390.png` | 390 x 844 | `2e617e30abf4075d` |

All four are distinct in both dimensions and hash.

## 6. Browser verification

Headless Chromium, separate browser contexts per width, cleared profile.

**Onboarding, 1440x900 and 390x844.** Intro, body, colour, result and
preferences render at both widths. 19 preference cards in both. No horizontal
overflow. Zero elements rendering text below 12px. Zero console errors.

**Hub, 1440x1000 and 390x844.** Live search "dresses under £100". The count
hierarchy renders, the uncategorised remainder is reported separately, and the
on-screen invariant holds at both widths. No horizontal overflow. Zero console
errors.

## 7. A review finding that was worse than reported

P1.2 said the two onboarding screenshots were byte-identical. They were, and the
cause was not a copy mistake.

The verification script passed `viewportSize` to Playwright's
`browser.newContext()`. That option is named `viewport`; `viewportSize` is
silently ignored. **Every earlier run therefore executed at the default
1280x720, at both the claimed 1440 and the claimed 390.** The identical
screenshots were the visible symptom of a verification harness that was never
testing the widths it reported.

Consequences, stated plainly:

- The "no horizontal overflow at 390px" claim in the previous handoff was not
  evidence. It had never been measured at 390px.
- The same applies to the previous mobile screenshot and the mobile row of the
  earlier browser verification.

The harness is fixed and everything in sections 4 to 6 was re-measured at real
viewport sizes. The results happen to hold, but they hold now because they were
tested, not because they were tested before.

## 8. Known limitations

1. **Chrome MV3 end-to-end verification is still pending.** The extension shares
   one engine with the app and the parity suite proves the decisions match, but
   loading the unpacked extension, the single approval, cross-tab persistence
   and the second retailer with no second prompt have not been observed running.
   This environment cannot load an unpacked extension. This remains the single
   open blocker.
2. **The named regression product still does not exist live.** No navy Amie
   halterneck is in Nobody's Child's catalogue and polyester is stated in none of
   its dress records. The behaviour is proved by a deterministic fixture
   reproducing the exact named product, and separately against the real
   halternecks that do exist. No substitute is presented as the named product.
3. **Attribute coverage varies sharply by retailer.** Section 4 quantifies it.
   Jigsaw reaches high evidence confidence on 19 of 200 products, so most of its
   results correctly show "Possible match, limited product information" instead
   of a percentage.
4. **The engine exists twice**, once in TypeScript and once as the extension
   script, because a content script cannot import the app's modules. The parity
   suite is the guard. If a rule changes in `src/lib`, the parity test fails
   until the engine is updated.
5. **`src/app/layout.tsx` reports `Cannot find name 'LayoutProps'`** under a bare
   `tsc --noEmit`. Pre-existing; `LayoutProps` is generated during `next build`,
   which passes.
6. **The cross-store hub remains deliberately bounded** at two pages per store
   to stay inside the function timeout across eighteen retailers, and labels its
   counts "so far" with `moreAvailable` when a retailer has more. The
   on-retailer extension, which is the core proof, reads to exhaustion.

## 9. Action still required from Neelanjana

1. **Push the branch.** This environment still cannot push: the git proxy will
   not inject a credential for a repository outside the session's authorised
   set, and no GitHub tool is available here.
   ```bash
   git bundle verify /path/to/fashion-passport-review-1.bundle
   git fetch /path/to/fashion-passport-review-1.bundle claude/prescriptive-build:claude-review-1
   git checkout claude/prescriptive-build && git merge --ff-only claude-review-1
   git push origin claude/prescriptive-build
   ```
2. **Run the Chrome MV3 proof.** Load `extension/` unpacked at
   `chrome://extensions`, then follow `docs/DEMO.md` from 0:15. Confirm the
   single approval, the tiers, four reactions demoting a trait, Undo, and Jigsaw
   with no second prompt. This closes limitation 1.
3. **Nothing on Vercel.** No Vercel command was run and `.vercel/` does not
   exist.

## 10. Confirmation

No deployment occurred. No merge occurred. No credential was written, printed or
committed. No commit was amended and no branch was force-pushed. `codex/mvp` and
`main` are untouched.

NOT READY FOR REVIEW — BLOCKERS LISTED ABOVE
