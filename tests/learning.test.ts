import { test } from "node:test";
import assert from "node:assert/strict";
import { derivePreferences, emptyLearned, recordVote, traitKey, traitKeysForProduct, undoVote } from "../src/lib/learned";
import { normaliseProfile, readProfile } from "../src/lib/profile";
import { demoProfile } from "../src/lib/data";
import { rankProducts, scoreProduct } from "../src/lib/scoring";
import { makeProduct } from "./fixtures";

const halterneck = () =>
  makeProduct({ title: "Amie Midi Dress", tags: ["neckline:halterneck", "colour:camel"] });

test("a single reaction leaves learned preferences unchanged", () => {
  const learned = recordVote(emptyLearned(), ["neckline:halter"], "down");
  assert.equal(derivePreferences(learned).length, 0, "one vote must not become a rule");
});

test("repeated evidence creates a preference, with confidence scaling", () => {
  let learned = emptyLearned();
  for (let i = 0; i < 2; i += 1) learned = recordVote(learned, ["neckline:halter"], "down");
  const [first] = derivePreferences(learned);
  assert.equal(first.direction, "negative");
  assert.equal(first.confidence, 0.5);

  for (let i = 0; i < 2; i += 1) learned = recordVote(learned, ["neckline:halter"], "down");
  assert.equal(derivePreferences(learned)[0].confidence, 1);
});

test("a preference recovers when behaviour changes, because raw tallies are kept", () => {
  let learned = emptyLearned();
  for (let i = 0; i < 3; i += 1) learned = recordVote(learned, ["colour:navy"], "down");
  assert.equal(derivePreferences(learned)[0].direction, "negative");
  for (let i = 0; i < 5; i += 1) learned = recordVote(learned, ["colour:navy"], "up");
  assert.equal(derivePreferences(learned)[0].direction, "positive");
  assert.equal(learned["colour:navy"].down, 3, "raw tallies survive");
});

test("undo reverses the most recent signal", () => {
  let learned = recordVote(emptyLearned(), ["neckline:halter"], "down");
  learned = recordVote(learned, ["neckline:halter"], "down");
  assert.equal(derivePreferences(learned).length, 1);
  learned = undoVote(learned, ["neckline:halter"], "down");
  assert.equal(derivePreferences(learned).length, 0);
});

test("a reaction records every known trait across the product", () => {
  const keys = traitKeysForProduct(halterneck().evidence as unknown as Record<string, { value: string }>);
  assert.ok(keys.includes(traitKey("neckline", "Halter")));
  assert.ok(keys.includes(traitKey("colour", "Camel")));
  assert.ok(keys.length > 1, "feedback must not collapse onto one dimension");
});

test("a learned negative demotes a product without hiding it", () => {
  let learned = emptyLearned();
  for (let i = 0; i < 4; i += 1) learned = recordVote(learned, ["neckline:halter"], "down");
  const preferences = derivePreferences(learned);
  const profile = normaliseProfile(demoProfile);
  const before = scoreProduct(halterneck(), { profile, query: "dresses" });
  const after = scoreProduct(halterneck(), { profile, query: "dresses", learned: preferences });
  assert.ok(after.matchScore < before.matchScore, "the learned signal must move the score");
  assert.equal(after.state === "held", false, "learning never hard-blocks");
});

test("an explicit preference outranks a learned signal", () => {
  let learned = emptyLearned();
  for (let i = 0; i < 4; i += 1) learned = recordVote(learned, ["colour:camel"], "down");
  const profile = normaliseProfile(demoProfile); // Camel is an explicit love
  const item = makeProduct({ title: "Camel Midi Dress", tags: ["colour:camel"] });
  const scored = scoreProduct(item, { profile, query: "dresses", learned: derivePreferences(learned) });
  assert.ok(scored.reasons.some((reason) => /Camel is one you love/.test(reason.label)));
  assert.equal(scored.reasons.some((reason) => /after your feedback/.test(reason.label)), false);
});

test("reranking is immediate: the catalogue reorders once a signal exists", () => {
  // A leads on explicit preferences, B is close behind. A halterneck signal
  // should be enough to swap them while keeping both products eligible.
  const a = makeProduct({
    title: "Camel Halterneck A-line Midi Dress",
    tags: ["colour:camel", "neckline:halterneck", "dress-style:a-line dresses", "length:midi"],
  });
  const b = makeProduct({
    title: "Navy Square Neck Midi Dress",
    tags: ["colour:navy", "neckline:square neck", "length:midi"],
  });
  const profile = normaliseProfile(demoProfile);
  const before = rankProducts([a, b], { profile, query: "dresses" });
  assert.equal(before[0].name, a.name, "A leads before any feedback");

  let learned = emptyLearned();
  for (let i = 0; i < 4; i += 1) learned = recordVote(learned, ["neckline:halter"], "down");
  const after = rankProducts([a, b], { profile, query: "dresses", learned: derivePreferences(learned) });

  assert.equal(after[0].name, b.name, "B overtakes once halternecks are learned down");
  assert.equal(after.length, 2, "reranking never removes a product");
  assert.equal(after.find((item) => item.name === a.name)!.state === "held", false);
});

test("a saved profile migrates forward without losing anything", () => {
  const legacy = {
    ...demoProfile,
    colours: { love: ["Red"], avoid: ["Grey"] },
    materials: { love: [], avoid: ["Polyester"] },
  };
  delete (legacy as Record<string, unknown>).budgetMode;
  const migrated = readProfile(JSON.stringify(legacy), demoProfile);
  assert.deepEqual(migrated.colours.love, ["Red"]);
  assert.deepEqual(migrated.colours.never, [], "a missing never list defaults to empty");
  assert.equal(migrated.budgetMode, "usual", "a missing budget mode defaults to usual, never strict");
  assert.deepEqual(migrated.materials.avoid, ["Polyester"]);
});

test("a corrupt saved profile returns the safe fallback", () => {
  assert.equal(readProfile("{not json", demoProfile).label, demoProfile.label);
  assert.equal(readProfile(null, demoProfile).label, demoProfile.label);
});
