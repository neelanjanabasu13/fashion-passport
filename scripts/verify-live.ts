/**
 * Live verification against real retailer UCP endpoints.
 * Run manually: npm run verify:live
 * Deliberately separate from `npm test`, which must stay deterministic.
 */
import { retailers } from "../src/lib/data";
import { demoProfile } from "../src/lib/data";
import { normaliseProfile } from "../src/lib/profile";
import { walkCatalog } from "../src/lib/shopify";
import { categoryCorrect, rankProducts, tierCounts } from "../src/lib/scoring";
import { FASHION_DIMENSIONS } from "../src/lib/ontology";

const profile = normaliseProfile(demoProfile);
const query = process.argv[3] || "dresses";
const wanted = process.argv[2] || "nobodyschild";
const retailer = retailers.find((item) => item.id === wanted);
if (!retailer) throw new Error(`Unknown retailer ${wanted}`);

const started = Date.now();
const { products, scanned, truncated } = await walkCatalog(retailer, query, profile, 8);
const ranked = rankProducts(products, { profile, query });
const correct = categoryCorrect(ranked, query);
const counts = tierCounts(scanned, ranked, query);

console.log(`retailer         ${retailer.name}  (${retailer.endpoint})`);
console.log(`query            "${query}"`);
console.log(`verified at      ${new Date().toISOString()}  in ${Date.now() - started}ms`);
console.log(`pagination       ${scanned} scanned, more pages remaining: ${truncated}`);
console.log(`tiers            scanned ${counts.catalogueScanned} · category-correct ${counts.categoryCorrect} · strong ${counts.strong} · worth ${counts.worth} · other ${counts.other} · held ${counts.held}`);

const wrongCategory = correct.filter((item) => item.evidence.category.value !== "Dress");
console.log(`category gate    ${wrongCategory.length} non-dresses admitted to the dress set`);

const known = (item: (typeof ranked)[number]) =>
  FASHION_DIMENSIONS.filter((dimension) => item.evidence[dimension].value !== "Unknown").length;
const coverage = FASHION_DIMENSIONS.map((dimension) => {
  const hits = ranked.filter((item) => item.evidence[dimension].value !== "Unknown").length;
  return `${dimension} ${Math.round((hits / Math.max(1, ranked.length)) * 100)}%`;
}).join(" · ");
console.log(`attribute cover  ${coverage}`);
console.log(`confidence       high ${ranked.filter((i) => i.evidenceConfidence === "high").length} · medium ${ranked.filter((i) => i.evidenceConfidence === "medium").length} · low ${ranked.filter((i) => i.evidenceConfidence === "low").length}`);

const scores = ranked.map((item) => item.matchScore);
console.log(`score spread     min ${Math.min(...scores)} · max ${Math.max(...scores)} · distinct ${new Set(scores).size}`);

console.log(`\ntop 5 by rank`);
for (const item of ranked.slice(0, 5)) {
  console.log(`  ${String(item.matchScore).padStart(2)}  ${item.state.padEnd(6)} ${item.name.slice(0, 52).padEnd(52)} £${item.price}  attrs ${known(item)}/7`);
  if (item.reasons.length) console.log(`      + ${item.reasons.slice(0, 3).map((r) => r.label).join(" · ")}`);
  if (item.conflicts.length) console.log(`      ! ${item.conflicts.map((r) => r.label).join(" · ")}`);
}

const halter = ranked.filter((item) => item.evidence.neckline.value === "Halter");
console.log(`\nhalterneck products found: ${halter.length}`);
for (const item of halter.slice(0, 4)) {
  console.log(`  ${item.matchScore} ${item.state.padEnd(6)} ${item.name} | material ${item.evidence.material.value} (${item.evidence.material.source}) | held: ${item.hardRules.length > 0}`);
}

const heldReasons = new Map<string, number>();
for (const item of ranked.filter((entry) => entry.state === "held")) {
  for (const rule of item.hardRules) {
    const key = rule.label.replace(/£\d+/, "£n").replace(/^UK \d+/, "your size");
    heldReasons.set(key, (heldReasons.get(key) || 0) + 1);
  }
}
console.log(`\nheld by rule:`);
for (const [reason, count] of [...heldReasons].sort((a, b) => b[1] - a[1])) console.log(`  ${String(count).padStart(3)}  ${reason}`);
const top = ranked.filter((item) => item.matchScore === 99).length;
console.log(`\nclamped at 99: ${top} of ${ranked.length} (${Math.round((top / ranked.length) * 100)}%)`);
