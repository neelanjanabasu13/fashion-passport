# Codex review of `claude/prescriptive-build`

> Historical review record. The findings below were addressed by commit
> `8a6c8f6`; the current release gate is documented in `README.md`.

Reviewed: 2 September 2026  
Reviewed tip: `4263c52`  
Verdict: **NOT READY TO MERGE OR DEPLOY**

The bundle history is valid and is now pushed to GitHub. Independent checks confirmed:

- `npm run lint`: pass
- `npm test`: 21/21 pass
- `npm run build`: pass
- `git diff --check codex/mvp...HEAD`: fail because of trailing whitespace in `src/app/page.tsx`

The following are blocking corrections. Implement them mechanically on `claude/prescriptive-build`, add tests for each code defect, update `CLAUDE_HANDOFF.md`, rerun every gate, and return a new bundle. Do not merge or deploy.

## P0.1 , Retailer extension feedback is non-functional

Evidence in `extension/content.js`:

- The down button writes `data-traits`, but constructs it with `.slice(0, 0)`, which always produces an empty string.
- The event handler reads `button.dataset.trait` singular, not `dataset.traits`.
- Thumbs-up never adds any learned signal.
- The stored array therefore cannot change future ranking.

Required correction:

1. Represent each extension result with canonical product traits: `dimension:value`.
2. Store raw `{up, down, updatedAt}` tallies in `chrome.storage.local`, using the same semantics as `src/lib/learned.ts`.
3. Up and down must both record every known trait.
4. One vote changes no derived preference.
5. Two net votes create a learned preference with confidence scaling.
6. Rerank the current extension results immediately after feedback.
7. Show the truthful moved count.
8. Add Undo and restore the prior order after Undo.
9. Add the optional reason prompt so the broad vote can be narrowed to one chosen trait.
10. Add deterministic tests that exercise the extension implementation, not only the Next.js implementation.

Acceptance test:

- Four repeated `Less like this` reactions on products sharing an otherwise unstated trait must demote matching products in the current extension panel.
- A subsequent compatible retailer must use the same learned preference.
- Undo must restore the previous tallies and order.

## P0.2 , The extension still uses the obsolete loose word-count engine

`extension/content.js` does not use the new ontology, evidence model, fixed weights, confidence calculation or deterministic tie-breaks. It still searches one flattened text string and calculates a separate simplified score. Documentation currently claims `extension/content.js` applies the same rules; that is false.

Required correction:

1. Add a self-contained extension engine loaded before `content.js`, for example `extension/fashion-engine.js` exposed as a namespaced global.
2. Port the canonical ontology, extraction order, evidence confidence, scoring weights, hard rules, result states and deterministic sorting from `src/lib/` without changing their decisions.
3. Parse selected/title colour separately from alternative colourways.
4. Preserve stated fibre composition precedence for material.
5. Unknown attributes must contribute zero.
6. Soft avoids must never hold a product.
7. Explicit `never`, strict budget, hard query cap and confirmed unavailable size must work in the extension.
8. Add Node-executable parity tests using the named regression fixture and representative products from the existing scoring tests.

Do not claim engine parity until these tests exist and pass.

## P0.3 , New profile and learned data do not travel into the extension

`syncPassportApp()` reads the legacy key `fashion-passport:learned-avoid`. The new web app writes raw votes to `fashion-passport:taste-votes`. The extension also fails to import grouped `never` preferences and `budgetMode` from the saved profile.

Required correction:

1. Sync the complete migrated `FashionProfile`, including every `never` group and `budgetMode`, from the Passport app into `chrome.storage.local`.
2. Sync raw `fashion-passport:taste-votes` into extension storage.
3. Listen for subsequent Passport learning changes and update extension storage.
4. On a retailer page, derive learned preferences from those raw tallies.
5. Do not collapse the new model back into only flat love/avoid arrays.

Acceptance test:

- A learned negative created in the Passport web app is present on the first retailer.
- A new signal created on that retailer is present on the next retailer without a second approval.
- Explicit `Never: Polyester` holds confirmed polyester; `Avoid: Polyester` does not.

## P0.4 , WebMCP `record_style_signal` still implements the old broken behaviour

In `src/app/page.tsx`, the registered WebMCP tool records only thumbs-down and adds only `item.neckline` to the legacy avoid list. It does not use the raw vote model, does not record thumbs-up, and does not rerank using the same path as the visible UI.

Required correction:

- Route the tool through the same `traitKeysForProduct`, `recordVote`, persistence, reranking and moved-count behaviour used by the visible product card.
- Return the learned keys, whether a derived preference changed, and the moved count.
- Test both reactions and repeated-evidence thresholds.

## P0.5 , Result counts and visible tiers include wrong-category products

The screenshot reports:

- 1,002 dresses found
- 348 non-held products
- 765 held products

`348 + 765 = 1,113`, so the tiers are not describing the claimed 1,002-dress set. `tierCounts()` calculates `categoryCorrect` from the category-correct subset but calculates strong/worth/other/held from all ranked products. Wrong-category products are therefore displayed as held and inflate the personal-rule count.

Required correction:

1. Treat category matching as the Stage 1 gate.
2. Wrong-category products must not appear in Strong, Worth, Other or Held-by-your-rules counts.
3. Category-unknown products may appear only under All products and must not inflate the claimed category count.
4. `Held by your rules` must contain only category-correct products held by size, query price, explicit never or strict budget.
5. Derive all visible counts from one internally consistent set.

Acceptance invariant:

```text
categoryCorrect = strong + worth + other + heldWithinCategory
```

Unknown-category products shown under All must be reported separately if present.

## P0.6 , The extension still has a catalogue-page ceiling

`readFullCatalog()` stops after 12 UCP pages. This can leave hundreds of retailer products unread. Every product returned is reachable, but every qualifying catalogue product is not yet reachable.

Required correction:

- On a single retailer, continue cursor pagination to exhaustion with a defensive high safety ceiling, or continue scanning in the background/on demand until exhausted.
- Never display a complete catalogue or category total while `has_next_page` remains true.
- If a safety ceiling is reached, label counts `scanned so far` and provide a user action that continues from the saved cursor.
- Loading more products must deduplicate and rerank the enlarged set.

The cross-store comparison hub may remain deliberately bounded if it keeps `so far` and `more available` truthful. The on-retailer extension is the core proof and must be able to reach the catalogue end.

## P1.1 , Remove the remaining arbitrary-product copy

`src/app/page.tsx` still says the hub `shows the best 30`. The UI now uses progressive loading and does not stop at 30. Replace this with truthful copy that says all qualifying results remain accessible.

## P1.2 , Submission screenshots are incorrect

`docs/images/onboarding-desktop-1440.png` and `docs/images/onboarding-mobile-390.png` are byte-for-byte identical. The mobile file is not a mobile capture.

Required correction:

- Capture a genuine 390px onboarding screen.
- Use distinct, correctly labelled desktop and mobile evidence.
- Verify image dimensions and SHA-256 values differ.

## P1.3 , Documentation contains counts produced by the broken tier calculation

README and Devpost materials must not retain the current cross-store strong/worth/held figures after P0.5 changes.

Required correction:

- Re-run live verification after the category/tier fix.
- Update measured counts everywhere from one saved verification output.
- Do not call wrong-category products `held by your rules`.
- Do not claim extension learning or engine parity until P0.1–P0.4 pass.

## P1.4 , Clean gate failure

Remove the trailing whitespace at `src/app/page.tsx:507`, then rerun `git diff --check codex/mvp...HEAD`.

## Required return evidence

The next handoff must include:

1. New commit hashes.
2. Tests specifically covering P0.1–P0.5.
3. Extension syntax checks.
4. Corrected live verification counts.
5. Correct desktop/mobile screenshot hashes and dimensions.
6. An honest statement that Chrome MV3 end-to-end verification is still pending if it remains unobserved.
7. Final line `NOT READY FOR REVIEW` until the unpacked Chrome flow is observed successfully on Neelanjana's machine.
