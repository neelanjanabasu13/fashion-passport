# Claude handoff

Branch: `claude/prescriptive-build`
Base: `codex/mvp` at `c491cd1` (*Clarify live counts and unknown product tiering*)
Prepared: 2 September 2026

## 1. Commits

| Workstream | Commit | Message |
|---|---|---|
| 1 | `430ab53` | Implement evidence-based fashion ranking |
| 2 | `9622a5d` | Build the Verdict Book onboarding and Passport |
| 3 | `38f403a` | Add complete live retailer ranking and learning |
| 4 | this commit | Add submission evidence and demo guide |

The commit for workstream 4 is the tip of this branch; it cannot cite its own hash. No commit was amended after the branch was bundled. Nothing was force-pushed, merged or deployed.

## 2. Files changed by workstream

**Commit 1, ranking**
Added `src/lib/ontology.ts`, `src/lib/extract.ts`, `src/lib/learned.ts`,
`src/lib/profile.ts`, `tests/` (fixtures, two suites, a ten-line TS resolver),
`scripts/verify-live.ts`.
Modified `src/lib/types.ts`, `src/lib/scoring.ts`, `src/lib/shopify.ts`,
`src/lib/style-theory.ts`, `src/lib/data.ts`, `src/app/page.tsx` (call sites
only), `package.json`.

**Commit 2, onboarding and Passport**
Modified `src/app/page.tsx`, `src/app/globals.css`.
Added `docs/images/onboarding-desktop-1440.png`,
`docs/images/onboarding-mobile-390.png`.

**Commit 3, retailer experience**
Modified `src/app/page.tsx`, `src/app/globals.css`,
`src/app/api/shopify/search/route.ts`, `src/app/api/shopify/search-all/route.ts`,
`src/lib/ontology.ts`, `extension/content.js`, `extension/content.css`,
`extension/manifest.json` (0.5.2 to 0.6.0).
Added `docs/images/retailer-results-1440.png`,
`docs/images/retailer-results-390.png`.

**Commit 4, evidence**
Modified `README.md`, `src/app/page.tsx` (removed a hard-coded market figure).
Added `docs/ARCHITECTURE.md`, `docs/DEMO.md`, `docs/DEVPOST_DRAFT.md`,
`docs/PRIVACY.md`, `CLAUDE_HANDOFF.md`.

## 3. Commands and results

```
npm run lint      clean, 0 errors 0 warnings
npm run build     compiled successfully, 5 routes
npm test          21 tests, 21 pass, 0 fail
node --check extension/content.js      ok
node --check extension/page-tools.js   ok
node --check extension/popup.js        ok
git diff --check                       clean
```

`npm test` runs Node's built-in test runner. No test framework was added. The
only supporting file is `tests/resolve-ts.mjs`, ten lines, which lets the
runner resolve the app's extensionless TypeScript imports.

`npm run verify:live [retailerId] [query]` runs the pipeline against a real
endpoint. It is deliberately excluded from `npm test`, which must stay
deterministic.

## 4. Live retailers verified

All against the retailer's own `https://{domain}/api/ucp/mcp`, through the new
pipeline, on 2 September 2026.

**Nobody's Child**, query `dresses`, verified 11:39 UTC, 10.4 seconds
- 320 products scanned across 8 cursor pages, more pages still available
- 316 category-correct, **0 non-dresses admitted**
- 144 strong, 78 worth a look, 14 other, 80 held
- Scores from 31 to 99 across **57 distinct values**, 2% at the ceiling
- Attribute coverage: colour 100%, length 100%, sleeve 97%, neckline 95%,
  pattern 89%, silhouette 78%, material 54%
- Evidence confidence: 309 high, 7 medium, 0 low
- All 80 held products held for one confirmed reason: size sold out
- 28 halternecks found, **none held**

**Jigsaw**, query `dresses`, verified 12:07 UTC, 6.2 seconds
- 200 scanned, catalogue exhausted
- 101 category-correct, **0 non-dresses admitted**
- Attribute coverage: colour 100%, material 73%, silhouette 48%, length 28%,
  pattern 20%, sleeve 18%, neckline 17%

**Cross-store hub**, query `dresses under £100`, in-browser
- 1,115 scanned across 18 responding stores, 1,002 dresses found
- 71 strong, 166 worth a look, 765 held

The coverage gap between the two retailers is the reason evidence confidence is
reported separately from the match score. Jigsaw publishes no structured
neckline tags, so more of its products correctly show "Possible match, limited
product information" instead of a percentage.

## 5. Screenshots

`docs/images/onboarding-desktop-1440.png`
`docs/images/onboarding-mobile-390.png`
`docs/images/retailer-results-1440.png`
`docs/images/retailer-results-390.png`

## 6. Browser verification

Headless Chromium, from a cleared profile.

**Onboarding, 1440x900 and 390x844.** Intro, body, colour, result and
preferences all render with no horizontal overflow at either width. Thirteen
season controls (twelve seasons plus "Not sure, estimate it"). Nineteen
preference cards with fifty-seven Love/Avoid/Never controls on the first step.
Zero elements rendering text below 12px. Zero console errors.

**Retailer results, 1440x1000 then 390x844.** Live search "dresses under £100".
Header printed the count hierarchy. Four tiers navigable. Initial batch of 24,
Load more reached 48, remaining count accurate. Held by rules inspectable with
the confirmed rule printed per product ("UK 10 is sold out"). One reaction
reported that a single vote changes nothing; four reactions moved 482 products
and the grid reordered in place; Undo restored the previous state. No
horizontal overflow at either width. Zero console errors.

## 7. Known limitations

1. **The named regression product does not exist in the live catalogue.** The
   specification names *Navy Halterneck Amie Midi Dress* at Nobody's Child. The
   live catalogue has Black, Mint Green and Butter Yellow Amie halternecks and
   no navy one. Polyester is also stated in 0 of 240 dress records scanned.
   The behaviour is implemented generically and proved two ways: a deterministic
   fixture in `tests/fixtures.ts` that reproduces the exact named product, and a
   live check confirming that all 28 halternecks present are unheld. No
   substitute product is presented as the named one.

2. **Attribute coverage varies sharply by retailer.** See section 4. This is
   surfaced honestly rather than smoothed over.

3. **Extension behaviour is unverified end to end.** Loading the unpacked MV3
   extension, the single approval, cross-tab persistence and the Jigsaw
   no-second-prompt proof cannot be exercised from this environment. The code
   was changed, syntax-checked and reviewed against the specification, but the
   cross-store flow in section 11 of the specification has not been observed
   running. This is the largest open item.

4. **`src/app/layout.tsx` reports `Cannot find name 'LayoutProps'` under a bare
   `tsc --noEmit`.** Pre-existing. `LayoutProps` is generated by Next 16 during
   `next build`, which passes. Not introduced here and not modified.

5. **The hub walks two pages per store** to stay inside the function timeout
   across eighteen stores, and reports `moreAvailable` when a retailer has more.
   A single-retailer search walks up to eight. Neither is a recommendation cap:
   every product returned remains reachable through the tiers and Load more.

## 8. Specification interpretations recorded

1. **A stated fibre composition outranks a marketing fabric tag, for the
   material dimension only.** Nobody's Child tags the Amie dress
   `fabric-group:jersey` while its description states a polyester composition.
   Jersey describes construction, a stated percentage describes fibre. Without
   this, the named regression case cannot be exercised at all, because the
   product's material resolves to Jersey and polyester is never seen. Scoped to
   material; every other dimension keeps the plain order in section 6.

2. **Legacy learned signals are migrated, not discarded.** Profiles saved before
   the vote model existed stored a flat list of bare trait values. Each is
   resolved back to its dimension and carried forward at 0.5 confidence.

3. **`All products` includes `other`.** There is no separate Other tab, per the
   correction.

4. **The learning message names a trait the signal can actually move.** A trait
   the shopper stated explicitly is never affected by learning, so naming it
   would mislead. The message names the first known trait that is not explicitly
   stated.

5. **A hard-coded market figure was removed.** `src/app/page.tsx` displayed
   "818,354 estimated live Shopify apparel stores". Replaced with the count of
   retailers actually verified plus a statement that compatibility is discovered
   at runtime. The numbers 833 and 50 appear nowhere in the interface or the
   documentation.

## 9. Action still required from Neelanjana

1. **Push the branch.** This environment could not push: the git proxy declined
   to inject a credential because the repository is not in the session's
   authorised set, and no GitHub tool was available. The branch is delivered as
   a git bundle with full history. From the local checkout:
   ```bash
   git bundle verify /path/to/fashion-passport.bundle
   git fetch /path/to/fashion-passport.bundle claude/prescriptive-build:claude/prescriptive-build
   git push -u origin claude/prescriptive-build
   ```
2. **Run the extension proof.** Load `extension/` unpacked, then follow
   `docs/DEMO.md` from 0:15. Confirm the single approval, the tiers, Undo, and
   Jigsaw with no second prompt. This is limitation 3 above.
3. **Nothing on Vercel.** No Vercel command was run and `.vercel/` does not
   exist.

## 10. Confirmation

No deployment occurred. No merge occurred. No credential was written, printed
or committed. No commit was amended and no branch was force-pushed. `codex/mvp`
and `main` are untouched.

NOT READY FOR REVIEW — BLOCKERS LISTED ABOVE
