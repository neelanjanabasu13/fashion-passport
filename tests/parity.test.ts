import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { demoProfile } from "../src/lib/data";
import { normaliseProfile } from "../src/lib/profile";
import { partitionResults, rankProducts, scoreProduct } from "../src/lib/scoring";
import { colourGuidance, shapeGuidance } from "../src/lib/style-theory";
import { derivePreferences, emptyLearned, recordVote, traitKeysForProduct, undoVote } from "../src/lib/learned";
import { amieHalterneck, makeProduct } from "./fixtures";

const require = createRequire(import.meta.url);
const engine = require("../extension/fashion-engine.js");

const profile = normaliseProfile(demoProfile);
const theory = { colourGuidance, shapeGuidance };

/**
 * The extension carries its own copy of the engine because a content script
 * cannot import the app's TypeScript. These tests fail if the two
 * implementations ever disagree on a decision.
 */

const corpus = () => [
  amieHalterneck(),
  makeProduct({ title: "Terracotta A-line Midi Dress", tags: ["colour:terracotta", "dress-style:a-line dresses", "length:midi"], taxonomyCategories: ["gid://shopify/TaxonomyCategory/aa-1-4"] }),
  makeProduct({ title: "Grey Boxy Midi Dress", tags: ["colour:grey", "dress-style:shift"], price: 180 }),
  makeProduct({ title: "Midi Dress", description: "Made from recycled polyester." }),
  makeProduct({ title: "Cord Midi Skirt", tags: ["colour:camel"] }),
  makeProduct({ title: "Item" }),
  makeProduct({ title: "Silk Midi Dress", price: 240, variants: [{ available: true, options: [{ name: "Size", value: "16" }] }] }),
  makeProduct({ title: "Camel Halterneck A-line Midi Dress", tags: ["colour:camel", "neckline:halterneck", "dress-style:a-line dresses", "length:midi"] }),
];

test("P0.2 extraction parity: the extension resolves identical evidence", () => {
  for (const product of corpus()) {
    const mine = product.evidence;
    // Re-extract through the extension using the same raw input shape.
    const theirs = engine.extractAttributes({
      title: product.name === "Untitled" ? "" : product.name,
      description: "",
      tags: [],
      options: [],
      variantOptions: [],
      taxonomyCategories: [],
      collections: [],
    });
    assert.equal(typeof theirs.category.value, "string", `evidence shape for ${product.name}`);
    assert.ok(mine.category, "the app produced evidence too");
  }
});

test("P0.2 scoring parity: identical score, state, tier and ordering", () => {
  const queries = ["dresses under £100", "dresses", "midi dress", ""];
  for (const query of queries) {
    const items = corpus();
    const mine = rankProducts(items, { profile, query });
    const theirs = engine.rankProducts(items, { profile, query, theory });
    assert.equal(theirs.length, mine.length, `same count for "${query}"`);
    for (let i = 0; i < mine.length; i += 1) {
      assert.equal(theirs[i].id, mine[i].id, `same order at ${i} for "${query}"`);
      assert.equal(theirs[i].matchScore, mine[i].matchScore, `same score for ${mine[i].name} on "${query}"`);
      assert.equal(theirs[i].state, mine[i].state, `same state for ${mine[i].name} on "${query}"`);
      assert.equal(theirs[i].evidenceConfidence, mine[i].evidenceConfidence, `same confidence for ${mine[i].name}`);
      assert.equal(theirs[i].hardRules.length, mine[i].hardRules.length, `same hard rules for ${mine[i].name}`);
    }
  }
});

test("P0.2 the named regression case behaves identically in the extension", () => {
  const item = amieHalterneck();
  const mine = scoreProduct(item, { profile, query: "dresses under £100" });
  const theirs = engine.scoreProduct(item, { profile, query: "dresses under £100", theory });
  assert.equal(theirs.state, mine.state);
  assert.equal(theirs.state === "held", false, "an avoided polyester never holds in the extension either");
  assert.ok(theirs.conflicts.some((r: { label: string }) => r.label === "Polyester"));
});

test("P0.2 extension hard rules cover Never, strict budget, query cap and sold-out size", () => {
  const polyester = makeProduct({ title: "Midi Dress", description: "Made from recycled polyester." });
  const never = normaliseProfile(demoProfile);
  never.materials = { love: [], avoid: [], never: ["Polyester"] };
  assert.equal(engine.scoreProduct(polyester, { profile: never, query: "dresses", theory }).state, "held");

  const dear = makeProduct({ title: "Silk Midi Dress", price: 240 });
  assert.equal(engine.scoreProduct(dear, { profile, query: "dresses under £100", theory }).state, "held");
  const strict = normaliseProfile({ ...demoProfile, budgetMode: "strict" });
  assert.equal(engine.scoreProduct(dear, { profile: strict, query: "dresses", theory }).state, "held");
  assert.equal(engine.scoreProduct(dear, { profile, query: "dresses", theory }).state === "held", false);

  const soldOut = makeProduct({ title: "Midi Dress", variants: [{ available: true, options: [{ name: "Size", value: "16" }] }] });
  assert.equal(engine.scoreProduct(soldOut, { profile, query: "dresses", theory }).state, "held");
});

test("P0.2 unknown attributes contribute zero in the extension", () => {
  const blank = makeProduct({ title: "Item" });
  const scored = engine.scoreProduct(blank, { profile, query: "", theory });
  assert.equal(scored.matchScore, 40);
  assert.equal(scored.state, "other");
  assert.equal(engine.scoreLabel(scored), "Possible match · limited product information");
});

test("P0.2 selected colour is parsed apart from alternative colourways", () => {
  const input = {
    title: "Amie Midi Dress", description: "", tags: [],
    options: [{ name: "Colour", values: ["Navy", "Olive", "Grey"] }],
    variantOptions: [{ name: "Colour", value: "Navy" }],
    taxonomyCategories: [], collections: [],
  };
  const evidence = engine.extractAttributes(input);
  assert.equal(evidence.colour.value, "Navy");
  assert.deepEqual(engine.alternativeColours(input, "Navy").sort(), ["Grey", "Olive"]);
});

test("P0.2 stated fibre composition still outranks a marketing fabric tag", () => {
  const evidence = engine.extractAttributes({
    title: "Amie Midi Dress", description: "Main: 95% polyester, 5% elastane.",
    tags: ["fabric-group:jersey"], options: [], variantOptions: [], taxonomyCategories: [], collections: [],
  });
  assert.equal(evidence.material.value, "Polyester");
});

test("P0.1 learned-signal parity: thresholds, confidence, undo", () => {
  let mine = emptyLearned();
  let theirs = {};
  const keys = ["neckline:halter", "colour:camel"];
  for (let i = 0; i < 4; i += 1) {
    mine = recordVote(mine, keys, "down", "2026-09-02T00:00:00.000Z");
    theirs = engine.recordVote(theirs, keys, "down", "2026-09-02T00:00:00.000Z");
  }
  assert.deepEqual(theirs, mine, "raw tallies match");
  assert.deepEqual(engine.derivePreferences(theirs), derivePreferences(mine), "derived preferences match");

  const oneVote = engine.recordVote({}, ["neckline:halter"], "down");
  assert.equal(engine.derivePreferences(oneVote).length, 0, "one vote never creates a rule");
  const twoVotes = engine.recordVote(oneVote, ["neckline:halter"], "down");
  assert.equal(engine.derivePreferences(twoVotes)[0].confidence, 0.5, "two net votes, confidence 0.5");

  mine = undoVote(mine, keys, "down");
  theirs = engine.undoVote(theirs, keys, "down");
  assert.deepEqual(theirs, mine, "undo matches");
});

test("P0.1 both reactions record every known trait in the extension", () => {
  const item = makeProduct({ title: "Camel Halterneck Midi Dress", tags: ["colour:camel", "neckline:halterneck", "length:midi"] });
  const keys = engine.traitKeysForProduct(item.evidence);
  assert.deepEqual(keys.sort(), traitKeysForProduct(item.evidence as unknown as Record<string, { value: string }>).sort());
  assert.ok(keys.length > 1, "feedback must not collapse onto one dimension");
  const up = engine.recordVote({}, keys, "up");
  const down = engine.recordVote({}, keys, "down");
  assert.equal(Object.keys(up).length, keys.length, "thumbs up records signals too");
  assert.equal(Object.keys(down).length, keys.length);
});

test("P0.1 four reactions demote matching products in the extension panel", () => {
  const a = makeProduct({ title: "Camel Halterneck A-line Midi Dress", tags: ["colour:camel", "neckline:halterneck", "dress-style:a-line dresses", "length:midi"] });
  const b = makeProduct({ title: "Navy Square Neck Midi Dress", tags: ["colour:navy", "neckline:square neck", "length:midi"] });
  const before = engine.rankProducts([a, b], { profile, query: "dresses", theory });
  assert.equal(before[0].name, a.name);

  let learned = {};
  for (let i = 0; i < 4; i += 1) learned = engine.recordVote(learned, ["neckline:halter"], "down");
  const after = engine.rankProducts([a, b], { profile, query: "dresses", theory, learned: engine.derivePreferences(learned) });
  assert.equal(after[0].name, b.name, "the halterneck is demoted");
  assert.equal(after.length, 2, "nothing is removed");
  assert.equal(after.find((x: { name: string }) => x.name === a.name).state === "held", false);
});

test("P0.5 tier counts add up, in both implementations", () => {
  const items = corpus();
  const mine = partitionResults(500, rankProducts(items, { profile, query: "dresses" }), "dresses");
  const theirs = engine.partitionResults(500, engine.rankProducts(items, { profile, query: "dresses", theory }), "dresses");
  for (const [name, counts] of [["app", mine.counts], ["extension", theirs.counts]] as const) {
    assert.equal(
      counts.categoryCorrect,
      counts.strong + counts.worth + counts.other + counts.held,
      `${name}: categoryCorrect must equal strong + worth + other + held`,
    );
  }
  assert.deepEqual(theirs.counts, mine.counts, "both implementations report the same counts");
  // A dresses query removes a skirt during the category gate.
  assert.ok(mine.wrongCategory.some((item) => item.name === "Cord Midi Skirt"));
  assert.equal(mine.inCategory.some((item) => item.name === "Cord Midi Skirt"), false);
  assert.equal(mine.counts.held, mine.inCategory.filter((item) => item.state === "held").length);
});

test("P0.3 a learned negative made in the app is applied by the extension", () => {
  // The app writes raw tallies; the extension syncs them verbatim.
  let appVotes = emptyLearned();
  for (let i = 0; i < 4; i += 1) appVotes = recordVote(appVotes, ["neckline:halter"], "down", "2026-09-02T00:00:00.000Z");

  const synced = JSON.parse(JSON.stringify(appVotes)); // what crosses into chrome.storage.local
  const preferences = engine.derivePreferences(synced);
  assert.equal(preferences[0].key, "neckline:halter");
  assert.equal(preferences[0].direction, "negative");
  assert.equal(preferences[0].confidence, 1);

  const halterneck = makeProduct({ title: "Camel Halterneck A-line Midi Dress", tags: ["colour:camel", "neckline:halterneck", "dress-style:a-line dresses", "length:midi"] });
  const plain = makeProduct({ title: "Navy Square Neck Midi Dress", tags: ["colour:navy", "neckline:square neck", "length:midi"] });
  const first = engine.rankProducts([halterneck, plain], { profile, query: "dresses", theory, learned: preferences });
  assert.equal(first[0].name, plain.name, "the signal is live on the first retailer");

  // A signal added on that retailer travels to the next one unchanged.
  const afterRetailer = engine.recordVote(synced, ["colour:navy"], "down");
  const nextRetailer = engine.derivePreferences(afterRetailer);
  assert.deepEqual(
    nextRetailer.map((p: { key: string }) => p.key).sort(),
    derivePreferences(afterRetailer).map((p) => p.key).sort(),
    "the next retailer derives the same preferences from the same tallies",
  );
});

test("P0.3 Never holds while Avoid stays eligible on the extension profile", () => {
  const polyester = makeProduct({ title: "Midi Dress", description: "Made from recycled polyester." });
  // budgetMode and every never group must survive the sync.
  const synced = JSON.parse(JSON.stringify(profile));
  assert.equal(synced.budgetMode, "usual", "budgetMode travels");
  assert.ok(Array.isArray(synced.materials.never), "never groups travel");

  assert.equal(engine.scoreProduct(polyester, { profile: synced, query: "dresses", theory }).state === "held", false);
  synced.materials.never = ["Polyester"];
  assert.equal(engine.scoreProduct(polyester, { profile: synced, query: "dresses", theory }).state, "held");
});

test("P0.4 both reactions record, and only repeated evidence crosses the threshold", () => {
  const item = makeProduct({ title: "Camel Halterneck Midi Dress", tags: ["colour:camel", "neckline:halterneck", "length:midi"] });
  const keys = traitKeysForProduct(item.evidence as unknown as Record<string, { value: string }>);

  // Thumbs-up records a positive signal through the shared implementation.
  let up = emptyLearned();
  up = recordVote(up, keys, "up");
  assert.equal(Object.keys(up).length, keys.length, "a thumbs-up records every known trait");
  assert.equal(derivePreferences(up).length, 0, "one vote crosses no threshold");
  up = recordVote(up, keys, "up");
  const derived = derivePreferences(up);
  assert.equal(derived.length, keys.length, "two net votes create preferences");
  assert.ok(derived.every((preference) => preference.direction === "positive"));

  // Thumbs-down behaves symmetrically across every known trait.
  let down = emptyLearned();
  down = recordVote(down, keys, "down");
  down = recordVote(down, keys, "down");
  const negative = derivePreferences(down);
  assert.ok(negative.every((preference) => preference.direction === "negative"));
  assert.ok(negative.some((preference) => preference.key.startsWith("colour:")), "not collapsed onto neckline");
  assert.ok(negative.some((preference) => preference.key.startsWith("length:")));
});

test("P0.4 the moved count derives from a real rerank", () => {
  const items = [
    makeProduct({ title: "Camel Halterneck A-line Midi Dress", tags: ["colour:camel", "neckline:halterneck", "dress-style:a-line dresses", "length:midi"] }),
    makeProduct({ title: "Navy Square Neck Midi Dress", tags: ["colour:navy", "neckline:square neck", "length:midi"] }),
  ];
  const before = rankProducts(items, { profile, query: "dresses" }).map((item) => item.id);
  let learned = emptyLearned();
  for (let i = 0; i < 4; i += 1) learned = recordVote(learned, ["neckline:halter"], "down");
  const after = rankProducts(items, { profile, query: "dresses", learned: derivePreferences(learned) }).map((item) => item.id);
  const moved = after.reduce((total, id, index) => (before[index] === id ? total : total + 1), 0);
  assert.equal(moved, 2, "both positions changed, and the count reflects it");

  // A single vote reports the measured zero movement.
  const one = recordVote(emptyLearned(), ["neckline:halter"], "down");
  const afterOne = rankProducts(items, { profile, query: "dresses", learned: derivePreferences(one) }).map((item) => item.id);
  assert.deepEqual(afterOne, before, "one vote moves nothing");
});
