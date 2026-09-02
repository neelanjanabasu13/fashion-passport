import { test } from "node:test";
import assert from "node:assert/strict";
import { demoProfile } from "../src/lib/data";
import { normaliseProfile } from "../src/lib/profile";
import { categoryCorrect, compareRanked, rankProducts, scoreLabel, scoreProduct } from "../src/lib/scoring";
import type { FashionProfile } from "../src/lib/types";
import { amieHalterneck, makeProduct } from "./fixtures";

const profile = (overrides: Partial<FashionProfile> = {}): FashionProfile =>
  normaliseProfile({ ...demoProfile, ...overrides } as FashionProfile);

test("1. a dresses query keeps only dresses in the category-correct set", () => {
  const dress = makeProduct({ title: "Amie Midi Dress", taxonomyCategories: ["gid://shopify/TaxonomyCategory/aa-1-4"] });
  const skirt = makeProduct({ title: "Cord Midi Skirt" });
  const unknown = makeProduct({ title: "Amie" });
  const ranked = rankProducts([dress, skirt, unknown], { profile: profile(), query: "dresses" });
  const correct = categoryCorrect(ranked, "dresses");
  assert.deepEqual(correct.map((item) => item.name), ["Amie Midi Dress"]);
  // Category-unknown products stay reachable in a separate count.
  assert.ok(ranked.some((item) => item.name === "Amie"));
});

test("2. a product over a hard query cap is held", () => {
  const item = makeProduct({ title: "Silk Midi Dress", price: 180 });
  const scored = scoreProduct(item, { profile: profile(), query: "dresses under £100" });
  assert.equal(scored.state, "held");
  assert.match(scored.hardRules[0].label, /Over your £100 limit/);
});

test("3. over the usual profile budget is a soft penalty, strict mode holds", () => {
  const item = makeProduct({ title: "Silk Midi Dress", price: 180 });
  const soft = scoreProduct(item, { profile: profile(), query: "dresses" });
  assert.equal(soft.state !== "held", true);
  assert.ok(soft.conflicts.some((reason) => /Over your usual £100/.test(reason.label)));

  const strict = scoreProduct(item, { profile: profile({ budgetMode: "strict" }), query: "dresses" });
  assert.equal(strict.state, "held");
});

test("4. Avoid keeps a polyester product eligible", () => {
  const item = makeProduct({ title: "Midi Dress", description: "Made from recycled polyester." });
  const scored = scoreProduct(item, { profile: profile(), query: "dresses" });
  assert.equal(scored.evidence.material.value, "Polyester");
  assert.equal(scored.state === "held", false);
  assert.equal(scored.hardRules.length, 0);
  assert.ok(scored.conflicts.some((reason) => reason.label === "Polyester"));
});

test("5. Never holds a confirmed polyester product", () => {
  const item = makeProduct({ title: "Midi Dress", description: "Made from recycled polyester." });
  const strictProfile = profile();
  strictProfile.materials = { love: [], avoid: [], never: ["Polyester"] };
  const scored = scoreProduct(item, { profile: strictProfile, query: "dresses" });
  assert.equal(scored.state, "held");
  assert.match(scored.hardRules[0].label, /never list/);
});

test("6. confirmed unavailable size holds while unknown size stays eligible", () => {
  const soldOut = makeProduct({
    title: "Midi Dress",
    variants: [{ available: true, options: [{ name: "Size", value: "16" }] }],
  });
  assert.equal(scoreProduct(soldOut, { profile: profile(), query: "dresses" }).state, "held");

  const noSizeData = makeProduct({ title: "Midi Dress" });
  const scored = scoreProduct(noSizeData, { profile: profile(), query: "dresses" });
  assert.equal(scored.state === "held", false);
});

test("7. unknown attributes add no positive score and stay in other", () => {
  const blank = makeProduct({ title: "Item" });
  const scored = scoreProduct(blank, { profile: profile(), query: "" });
  assert.equal(scored.matchScore, 40);
  assert.equal(scored.state, "other");
  assert.equal(scored.evidenceConfidence, "low");
  assert.equal(scoreLabel(scored), "Possible match · limited product information");
});

test("8. a selected variant colour stays separate from alternative colourways", () => {
  const item = makeProduct({
    title: "Amie Midi Dress",
    variantOptions: [{ name: "Colour", value: "Navy" }],
    options: [{ name: "Colour", values: ["Navy", "Olive", "Grey"] }],
  });
  assert.equal(item.colour, "Navy");
  assert.deepEqual(item.alternativeColours.sort(), ["Grey", "Olive"]);
  const scored = scoreProduct(item, { profile: profile(), query: "dresses" });
  // Olive and Grey are on the avoid list; neither may penalise this navy variant.
  assert.equal(scored.conflicts.length, 0);
});

test("9. results retain a meaningful score spread", () => {
  const items = [
    makeProduct({ title: "Navy Halterneck Amie Midi Dress", tags: ["colour:navy", "neckline:halterneck"] }),
    makeProduct({ title: "Grey Boxy Midi Dress", tags: ["colour:grey", "dress-style:shift"] }),
    makeProduct({ title: "Terracotta A-line Midi Dress", tags: ["colour:terracotta", "dress-style:a-line dresses"] }),
    makeProduct({ title: "Dress" }),
  ];
  const scores = rankProducts(items, { profile: profile(), query: "dresses" }).map((item) => item.matchScore);
  assert.equal(new Set(scores).size > 1, true, "scores must spread, not saturate");
});

test("10. equal scores use tie-breaks independent of API order", () => {
  const richer = makeProduct({
    title: "Camel A-line Midi Dress",
    tags: ["colour:camel", "dress-style:a-line dresses", "neckline:square neck", "sleeve-length:long sleeve", "fabric-group:linen"],
  });
  const sparser = makeProduct({ title: "Camel Midi Dress", tags: ["colour:camel"] });
  const order = [sparser, richer].sort((a, b) =>
    compareRanked(scoreProduct(a, { profile: profile(), query: "dresses" }), scoreProduct(b, { profile: profile(), query: "dresses" })),
  );
  assert.equal(order[0].name, "Camel A-line Midi Dress");
});

test("named regression case keeps the Amie halterneck eligible when polyester is Avoid", () => {
  const item = amieHalterneck();
  assert.equal(item.evidence.neckline.value, "Halter");
  assert.equal(item.evidence.material.value, "Polyester");
  assert.equal(item.evidence.colour.value, "Navy");
  assert.equal(item.evidence.length.value, "Midi/midaxi");
  assert.equal(item.evidence.category.value, "Dress");

  const scored = scoreProduct(item, { profile: profile(), query: "dresses under £100" });
  assert.equal(scored.state === "held", false, "must never be held while Polyester is only an avoid");
  assert.equal(scored.hardRules.length, 0);
  assert.ok(["strong", "worth"].includes(scored.state), `expected strong or worth, got ${scored.state}`);
  assert.ok(scored.conflicts.some((reason) => reason.label === "Polyester"), "polyester must surface as a visible conflict");
  assert.ok(scored.reasons.some((reason) => /Navy/.test(reason.label)), "navy must count as a loved colour");
  assert.ok(scored.reasons.some((reason) => /UK 10 in stock/.test(reason.label)));
  assert.ok(scored.reasons.some((reason) => /Under your £100 limit/.test(reason.label)));
});
