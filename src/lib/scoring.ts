import type { FashionProfile, Product, ScoredProduct, ScoreReason } from "./types";
import { theoryFit, theoryFor } from "./style-theory";

const normalise = (value: string) => value.trim().toLowerCase();
const includes = (values: string[], value: string) => values.map(normalise).includes(normalise(value));

export function scoreProduct(product: Product, profile: FashionProfile, learnedAvoid: string[] = []): ScoredProduct {
  let score = 42;
  const reasons: ScoreReason[] = [];
  const positive = (label: string, weight: number, kind: ScoreReason["kind"] = "positive") => {
    score += weight;
    reasons.push({ label, weight, kind });
  };
  const warning = (label: string, weight: number) => {
    score -= weight;
    reasons.push({ label, weight: -weight, kind: "warning" });
  };

  const hardBlocks: string[] = [];
  if (product.sizes.length > 0 && !product.sizes.includes(profile.size)) hardBlocks.push(`${profile.size} unavailable`);
  if (product.price > profile.budget) hardBlocks.push(`Over £${profile.budget} budget`);
  if (product.material !== "Not stated" && includes(profile.materials.avoid, product.material)) hardBlocks.push(`${product.material} is on your avoid list`);
  if (product.colour !== "Not stated" && includes(profile.colours.avoid, product.colour)) hardBlocks.push(`${product.colour} is on your avoid list`);
  if (product.silhouette !== "Not stated" && includes(profile.silhouettes.avoid, product.silhouette)) hardBlocks.push(`${product.silhouette} is on your avoid list`);
  if (product.neckline !== "Not stated" && includes(profile.necklines.avoid, product.neckline)) hardBlocks.push(`${product.neckline} neckline is on your avoid list`);
  if (product.sleeve !== "Not stated" && includes(profile.sleeves.avoid, product.sleeve)) hardBlocks.push(`${product.sleeve} sleeves are on your avoid list`);
  if (product.pattern !== "Not stated" && includes(profile.patterns.avoid, product.pattern)) hardBlocks.push(`${product.pattern} is on your avoid list`);

  const theory = theoryFor(profile.colourSeason, profile.bodyShape);

  // Explicit taste is deliberately stronger than the guidance layer.
  if (includes(profile.colours.love, product.colour)) positive(`${product.colour} is a colour you love`, 16);
  else if (includes(profile.colours.avoid, product.colour)) warning(`${product.colour} is on your avoid list`, 16);
  if (!includes(profile.colours.avoid, product.colour) && includes(theory.colours, product.colour)) positive(`Likely to suit ${profile.colourSeason} colouring`, 6, "theory");

  if (includes(profile.silhouettes.love, product.silhouette)) positive(`${product.silhouette} silhouette`, 10);
  else if (includes(profile.silhouettes.avoid, product.silhouette)) warning(`${product.silhouette} is not your style`, 12);

  if (includes(profile.necklines.love, product.neckline)) positive(`${product.neckline} neckline`, 8);
  else if (includes(profile.necklines.avoid, product.neckline)) warning(`${product.neckline} neckline`, 12);

  if (includes(profile.sleeves.love, product.sleeve)) positive(`${product.sleeve} sleeves`, 5);
  else if (includes(profile.sleeves.avoid, product.sleeve)) warning(`${product.sleeve} sleeves`, 7);

  if (includes(profile.patterns.love, product.pattern)) positive(`${product.pattern} pattern`, 5);
  else if (includes(profile.patterns.avoid, product.pattern)) warning(product.pattern === "Large print" ? "Large-scale print" : product.pattern === "Animal" ? "Animal print" : product.pattern, 8);

  if (includes(profile.materials.love, product.material)) positive(`${product.material}`, 7);
  if (includes(profile.lengths.love, product.length)) positive(`${product.length} length`, 6);

  if (includes(theory.silhouettes, product.silhouette)) positive(`Likely to work with your ${profile.bodyShape.toLowerCase()} shape`, 7, "theory");
  if (includes(theory.necklines, product.neckline)) positive(`${product.neckline} is suggested for your proportions`, 4, "theory");
  if (includes(theory.sleeves, product.sleeve)) positive(`${product.sleeve} sleeves suit the guidance layer`, 3, "theory");
  if (includes(theory.lengths, product.length)) positive(`${product.length} length suits the guidance layer`, 3, "theory");
  if (includes(theory.materials, product.material)) positive(`${product.material} supports the suggested drape or structure`, 3, "theory");

  const learnedLikes = learnedAvoid.filter((trait) => trait.startsWith("love:")).map((trait) => trait.slice(5));
  const learnedDislikes = learnedAvoid.filter((trait) => trait.startsWith("avoid:")).map((trait) => trait.slice(6)).concat(learnedAvoid.filter((trait) => !trait.includes(":")));
  const learnedLikeHits = learnedLikes.filter((trait) =>
    [product.colour, product.silhouette, product.neckline, product.sleeve, product.pattern, product.material, product.length]
      .map(normalise)
      .includes(normalise(trait)),
  );
  if (learnedLikeHits.length) positive(`More ${learnedLikeHits[0]} after your feedback`, 6);

  const learnedHits = learnedDislikes.filter((trait) =>
    [product.colour, product.silhouette, product.neckline, product.sleeve, product.pattern, product.material, product.length]
      .map(normalise)
      .includes(normalise(trait)),
  );
  if (learnedHits.length) warning(`Less ${learnedHits[0]} after your feedback`, 9);

  hardBlocks.forEach((reason) => warning(reason, 22));
  return { ...product, score: Math.max(12, Math.min(96, Math.round(score))), reasons, blocked: hardBlocks.length > 0 };
}

export function rankProducts(items: Product[], profile: FashionProfile, learnedAvoid: string[] = []) {
  return items.map((item) => scoreProduct(item, profile, learnedAvoid)).sort((a, b) => b.score - a.score);
}

export function analysisFit(product: Product, profile: FashionProfile) {
  return theoryFit(product, profile.colourSeason, profile.bodyShape);
}
