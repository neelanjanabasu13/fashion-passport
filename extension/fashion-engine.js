/**
 * Fashion Passport shared engine.
 *
 * One implementation of the ontology, evidence extraction, scoring, tiering and
 * learned-signal model, used by the Chrome extension and exercised by Node
 * parity tests against `src/lib`. The data tables below are copied verbatim
 * from `src/lib/ontology.ts` and `src/lib/scoring.ts`; `tests/parity.test.ts`
 * fails if the two implementations ever disagree on a decision.
 *
 * Loaded as a content script before `content.js`, and as a CommonJS module in
 * tests. It touches no DOM and no chrome APIs.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FashionEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VOCABULARY = {
  category: [
    ["Jumpsuit/playsuit", ["jumpsuit", "playsuit", "romper", "all-in-one", "boilersuit"]],
    ["Coat/jacket", ["coat", "jacket", "blazer", "trench", "parka", "gilet", "overshirt", "shacket"]],
    ["Knitwear", ["knitwear", "jumper", "cardigan", "sweater", "knit top", "pullover"]],
    ["Jean", ["jean", "jeans", "denim trouser"]],
    ["Trouser", ["trouser", "trousers", "pant", "pants", "chino", "legging", "culotte"]],
    ["Short", ["short", "shorts"]],
    ["Skirt", ["skirt", "skort"]],
    ["Dress", ["dress", "dresses", "gown", "frock"]],
    ["Shirt/blouse", ["shirt", "blouse"]],
    ["Top", ["top", "tops", "bodysuit", "vest", "camisole", "cami", "tee", "t-shirt", "bralet", "corset"]],
  ],
  colour: [
    ["Burnt orange", ["burnt orange"]],
    ["Terracotta", ["terracotta", "rust"]],
    ["Dark pink", ["dark pink", "fuchsia", "magenta", "mulberry", "raspberry", "cerise"]],
    ["Camel", ["camel", "tan", "biscuit", "caramel"]],
    ["Olive", ["olive", "khaki"]],
    ["Taupe", ["taupe", "mushroom", "oatmeal"]],
    ["Navy", ["navy", "midnight"]],
    ["Red", ["red", "ruby", "burgundy", "crimson", "scarlet", "wine", "cherry"]],
    ["Purple", ["purple", "plum", "lilac", "lavender", "violet", "damson"]],
    ["Green", ["green", "emerald", "sage", "mint", "forest"]],
    ["Blue", ["blue", "cobalt", "sapphire", "teal", "denim blue", "indigo"]],
    ["Pink", ["pink", "blush", "rose"]],
    ["Orange", ["orange", "apricot", "coral"]],
    ["Yellow", ["yellow", "butter", "lemon", "mustard"]],
    ["Brown", ["brown", "chocolate", "coffee", "espresso"]],
    ["Grey", ["grey", "gray", "silver", "charcoal", "slate"]],
    ["Black", ["black"]],
    ["White", ["white", "ivory", "cream", "ecru", "off-white"]],
    ["Multi", ["multi", "multicolour", "multicolor"]],
  ],
  silhouette: [
    ["Fit and flare", ["fit and flare", "fit-and-flare", "fit & flare", "waisted", "skater", "nipped waist"]],
    ["A-line", ["a-line", "a line"]],
    ["Wrap", ["wrap"]],
    ["Wide-leg", ["wide-leg", "wide leg", "palazzo", "flare leg"]],
    ["Bodycon", ["bodycon", "body-con", "second skin"]],
    ["Column", ["column", "sheath", "slip dress", "slip"]],
    ["Shift/boxy", ["shift", "boxy", "oversized", "relaxed fit", "smock"]],
    ["Tailored/structured", ["tailored", "structured", "corset", "utility"]],
    ["Straight", ["straight leg", "straight-leg", "straight"]],
    ["Flowy", ["flowy", "fluid", "floaty", "drapey", "tiered", "swing"]],
  ],
  neckline: [
    ["Asymmetric/one-shoulder", ["asymmetric", "one shoulder", "one-shoulder"]],
    ["Halter", ["halterneck", "halter neck", "halter"]],
    ["Sweetheart", ["sweetheart"]],
    ["Square", ["square neck", "square-neck", "square neckline"]],
    ["Boat/bateau", ["boat neck", "boat-neck", "bateau", "slash neck", "slash-neck"]],
    ["Scoop", ["scoop neck", "scoop-neck", "scoop"]],
    ["Cowl", ["cowl"]],
    ["Strapless", ["strapless", "bandeau"]],
    ["V-neck", ["v-neck", "v neck", "vneck", "plunge"]],
    ["High/crew", ["high neck", "high-neck", "crew neck", "crew-neck", "funnel neck", "roll neck", "polo neck"]],
  ],
  sleeve: [
    ["Bardot/off-shoulder", ["bardot", "off shoulder", "off-shoulder", "off-the-shoulder"]],
    ["Flutter", ["flutter", "angel sleeve"]],
    ["Puff", ["puff sleeve", "puff-sleeve", "puffed sleeve", "balloon sleeve"]],
    ["3/4", ["3/4 sleeve", "three-quarter sleeve", "three quarter sleeve", "3/4"]],
    ["Cap", ["cap sleeve", "cap-sleeve"]],
    ["Strappy/camisole", ["strappy", "cami", "camisole", "spaghetti strap"]],
    ["Sleeveless", ["sleeveless", "no sleeve"]],
    ["Long", ["long sleeve", "long-sleeve", "long sleeves"]],
    ["Short", ["short sleeve", "short-sleeve", "short sleeves"]],
  ],
  length: [
    ["Midi/midaxi", ["midi", "midaxi", "mid-length"]],
    ["Maxi/floor", ["maxi", "floor length", "floor-length", "full length"]],
    ["Mini", ["mini", "above knee", "above-the-knee"]],
    ["Knee", ["knee length", "knee-length", "on the knee"]],
  ],
  pattern: [
    ["Ditsy/small floral", ["ditsy", "small floral", "micro floral"]],
    ["Gingham", ["gingham"]],
    ["Check/plaid", ["check", "checked", "plaid", "tartan", "houndstooth"]],
    ["Polka dot", ["polka dot", "polka-dot", "spot", "spotted"]],
    ["Animal", ["animal print", "leopard", "zebra", "snake print", "cheetah"]],
    ["Stripe", ["stripe", "striped", "pinstripe"]],
    ["Floral", ["floral", "flower print"]],
    ["Abstract/large print", ["abstract", "large print", "bold print", "geometric", "placement print"]],
    ["Solid/plain", ["solid", "plain", "block colour", "block color"]],
  ],
  material: [
    ["Cotton/pure cotton", ["100% cotton", "pure cotton", "organic cotton", "cotton", "broderie", "poplin"]],
    ["Linen", ["linen"]],
    ["Silk", ["silk"]],
    ["Chiffon", ["chiffon", "georgette"]],
    ["Viscose", ["viscose", "rayon", "lyocell", "tencel", "modal"]],
    ["Polyester", ["polyester", "polyamide"]],
    ["Wool", ["wool", "merino", "cashmere", "alpaca"]],
    ["Denim", ["denim"]],
    ["Satin", ["satin"]],
    ["Jersey", ["jersey"]],
    ["Knit", ["knit", "knitted", "rib knit", "ribbed"]],
  ],
};

  const TAXONOMY_CATEGORY = {
  "aa-1-4": "Dress",
  "aa-1-13": "Skirt",
  "aa-1-15": "Top",
  "aa-1-12": "Trouser",
  "aa-1-10": "Short",
  "aa-1-5": "Jumpsuit/playsuit",
  "aa-1-3": "Coat/jacket",
};

  const CATEGORY_PLURAL = {
  Dress: "dresses",
  Skirt: "skirts",
  Top: "tops",
  "Shirt/blouse": "shirts and blouses",
  Trouser: "trousers",
  Jean: "jeans",
  "Jumpsuit/playsuit": "jumpsuits and playsuits",
  Short: "shorts",
  "Coat/jacket": "coats and jackets",
  Knitwear: "knitwear",
};

  const KEY_HINTS = [
  [/neck/i, "neckline"],
  [/sleeve/i, "sleeve"],
  [/fabric|material|composition/i, "material"],
  [/colour|color/i, "colour"],
  [/print|pattern/i, "pattern"],
  [/length/i, "length"],
  [/style|fit|shape|silhouette/i, "silhouette"],
  [/category|type|garment|product-type/i, "category"],
];

  const LOVE_WEIGHT = {
  category: 0, colour: 12, silhouette: 10, neckline: 8, sleeve: 5, length: 6, material: 7, pattern: 5,
};

  const AVOID_WEIGHT = {
  category: 0, colour: 12, silhouette: 10, neckline: 8, sleeve: 5, length: 6, material: 9, pattern: 6,
};

  const THEORY_WEIGHT = {
  category: 0, colour: 5, silhouette: 5, neckline: 3, sleeve: 2, length: 2, material: 2, pattern: 0,
};
  const COLOUR_GUIDANCE = {
  "Deep Winter": ["Black", "White", "Red", "Navy", "Purple", "Dark pink"],
  "Cool Winter": ["Navy", "White", "Dark pink", "Blue", "Grey", "Purple"],
  "Clear Winter": ["Black", "White", "Red", "Blue", "Green", "Dark pink"],
  "Cool Summer": ["Blue", "Grey", "Pink", "Purple", "White", "Navy"],
  "Soft Summer": ["Blue", "Grey", "Pink", "White", "Taupe", "Green"],
  "Light Summer": ["Blue", "Pink", "White", "Grey", "Purple", "Green"],
  "Soft Autumn": ["Terracotta", "Camel", "Olive", "Green", "Brown", "Taupe"],
  "Warm Autumn": ["Burnt orange", "Terracotta", "Camel", "Olive", "Brown", "Green"],
  "Deep Autumn": ["Terracotta", "Burnt orange", "Camel", "Olive", "Brown", "Red"],
  "Light Spring": ["Pink", "Yellow", "Green", "Blue", "White", "Camel"],
  "Warm Spring": ["Red", "Burnt orange", "Yellow", "Green", "Pink", "Camel"],
  "Clear Spring": ["Red", "Blue", "Green", "Yellow", "Pink", "White"],
};

  const SHAPE_GUIDANCE = {
  "Inverted triangle": {
    silhouettes: ["A-line", "Fit and flare", "Flowy"],
    necklines: ["V-neck", "Scoop", "Asymmetric/one-shoulder"],
    sleeves: ["Sleeveless", "3/4"],
    lengths: ["Midi/midaxi", "Maxi/floor"],
    materials: ["Chiffon", "Silk", "Linen"],
  },
  Pear: {
    silhouettes: ["A-line", "Fit and flare", "Tailored/structured"],
    necklines: ["Boat/bateau", "Square", "Cowl"],
    sleeves: ["Long", "3/4", "Puff"],
    lengths: ["Midi/midaxi", "Maxi/floor"],
    materials: ["Cotton/pure cotton", "Linen", "Silk"],
  },
  Hourglass: {
    silhouettes: ["Fit and flare", "Wrap", "Tailored/structured"],
    necklines: ["V-neck", "Scoop", "Square", "Sweetheart"],
    sleeves: ["3/4", "Long", "Sleeveless"],
    lengths: ["Midi/midaxi", "Knee"],
    materials: ["Silk", "Cotton/pure cotton", "Jersey"],
  },
  Rectangle: {
    silhouettes: ["Fit and flare", "Flowy", "Wrap"],
    necklines: ["Asymmetric/one-shoulder", "Cowl", "Scoop", "Halter"],
    sleeves: ["Cap", "3/4", "Puff"],
    lengths: ["Mini", "Midi/midaxi"],
    materials: ["Chiffon", "Silk", "Linen"],
  },
  Apple: {
    silhouettes: ["Flowy", "A-line", "Column"],
    necklines: ["V-neck", "Scoop", "Asymmetric/one-shoulder"],
    sleeves: ["3/4", "Long"],
    lengths: ["Midi/midaxi", "Maxi/floor"],
    materials: ["Silk", "Chiffon", "Viscose"],
  },
};

  const THEORY = { colourGuidance: COLOUR_GUIDANCE, shapeGuidance: SHAPE_GUIDANCE };

  const FASHION_DIMENSIONS = ["colour", "silhouette", "neckline", "sleeve", "length", "pattern", "material"];
  const UNKNOWN = { value: "Unknown", confidence: "unknown", source: "unknown" };

  const escapeTerm = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function containsTerm(haystack, term) {
    return new RegExp(`(^|[^a-z0-9])${escapeTerm(term)}([^a-z0-9]|$)`, "i").test(haystack);
  }

  function mapToCanonical(dimension, text) {
    if (!text) return null;
    const haystack = String(text).toLowerCase();
    for (const [label, terms] of VOCABULARY[dimension]) {
      if (terms.some((term) => containsTerm(haystack, term))) return label;
    }
    return null;
  }

  function dimensionForTagKey(key) {
    for (const [pattern, dimension] of KEY_HINTS) if (pattern.test(key)) return dimension;
    return null;
  }

  const requestedCategory = (query) => mapToCanonical("category", query);
  const pluralCategory = (category) => CATEGORY_PLURAL[category] || String(category).toLowerCase();

  /** A stated fibre composition outranks a marketing fabric tag, material only. */
  function statedComposition(description) {
    const matches = String(description || "").matchAll(/(\d{1,3})\s*%\s*([a-z][a-z\s-]{2,20})/gi);
    let best = null;
    for (const match of matches) {
      const share = Number(match[1]);
      const mapped = mapToCanonical("material", match[2].trim());
      if (!mapped) continue;
      if (!best || share > best.share) best = { share, value: mapped };
    }
    return best ? best.value : null;
  }

  /** variant -> title -> structured tags and options -> description. No image analysis. */
  function* candidatesFor(dimension, input) {
    for (const option of input.variantOptions) {
      const hinted = dimensionForTagKey(option.name);
      if (hinted && hinted !== dimension) continue;
      const mapped = mapToCanonical(dimension, option.value);
      if (mapped) yield { value: mapped, source: "variant", confidence: "high" };
    }
    if (dimension === "category") {
      for (const gid of input.taxonomyCategories) {
        const key = String(gid).split("/").pop() || "";
        const mapped = TAXONOMY_CATEGORY[key];
        if (mapped) yield { value: mapped, source: "option", confidence: "high" };
      }
    }
    if (dimension === "material") {
      const composition = statedComposition(input.description);
      if (composition) yield { value: composition, source: "description", confidence: "high" };
    }
    const fromTitle = mapToCanonical(dimension, input.title);
    if (fromTitle) yield { value: fromTitle, source: "title", confidence: "high" };
    for (const tag of input.tags) {
      const separator = String(tag).indexOf(":");
      if (separator === -1) continue;
      const key = String(tag).slice(0, separator);
      const value = String(tag).slice(separator + 1);
      if (dimensionForTagKey(key) !== dimension) continue;
      const mapped = mapToCanonical(dimension, value);
      if (mapped) yield { value: mapped, source: "tag", confidence: "high" };
    }
    if (dimension === "category" || dimension === "length") {
      for (const collection of input.collections) {
        const mapped = mapToCanonical(dimension, String(collection).replace(/-/g, " "));
        if (mapped) yield { value: mapped, source: "tag", confidence: "medium" };
      }
    }
    for (const option of input.options) {
      if (dimensionForTagKey(option.name) !== dimension) continue;
      if (option.values.length !== 1) continue;
      const mapped = mapToCanonical(dimension, option.values[0]);
      if (mapped) yield { value: mapped, source: "option", confidence: "medium" };
    }
    for (const tag of input.tags) {
      if (String(tag).includes(":")) continue;
      const mapped = mapToCanonical(dimension, tag);
      if (mapped) yield { value: mapped, source: "tag", confidence: "medium" };
    }
    const fromDescription = mapToCanonical(dimension, input.description);
    if (fromDescription) yield { value: fromDescription, source: "description", confidence: "medium" };
  }

  function extractAttributes(input) {
    const evidence = {};
    for (const dimension of ["category", ...FASHION_DIMENSIONS]) {
      evidence[dimension] = UNKNOWN;
      for (const candidate of candidatesFor(dimension, input)) {
        if (candidate.value) { evidence[dimension] = candidate; break; }
      }
    }
    return evidence;
  }

  function alternativeColours(input, selected) {
    const option = input.options.find((entry) => /colour|color/i.test(entry.name));
    if (!option) return [];
    const mapped = option.values.map((value) => mapToCanonical("colour", value)).filter(Boolean);
    return Array.from(new Set(mapped.filter((value) => value !== selected)));
  }

  function evidenceConfidenceFor(evidence) {
    const known = FASHION_DIMENSIONS.filter((dimension) => evidence[dimension].value !== "Unknown").length;
    if (known >= 5) return "high";
    if (known >= 3) return "medium";
    return "low";
  }

  function availableSizes(variants) {
    const labels = variants
      .filter((variant) => variant.available)
      .flatMap((variant) => variant.options.filter((option) => /size/i.test(option.name)).map((option) => option.value))
      .filter(Boolean)
      .map((size) => (/^\d+$/.test(size) ? `UK ${size}` : size));
    return Array.from(new Set(labels));
  }

  function sizeConfirmedUnavailable(sizes, shopperSize) {
    if (sizes.length === 0) return false;
    const wanted = String(shopperSize || "").trim().toLowerCase();
    const bare = wanted.replace(/^uk\s*/, "");
    return !sizes.some((size) => {
      const value = String(size).trim().toLowerCase();
      return value === wanted || value.replace(/^uk\s*/, "") === bare;
    });
  }

  function hardPriceCap(query) {
    const match = String(query || "").match(/(?:under|below|less than|max(?:imum)?|up to)\s*£?\s*(\d+(?:\.\d{1,2})?)/i);
    if (match) return Number(match[1]);
    const symbol = String(query || "").match(/£\s*(\d+(?:\.\d{1,2})?)\s*(?:or less|and under)/i);
    return symbol ? Number(symbol[1]) : null;
  }

  const PROFILE_GROUP = {
    category: null, colour: "colours", silhouette: "silhouettes", neckline: "necklines",
    sleeve: "sleeves", length: "lengths", material: "materials", pattern: "patterns",
  };
  const THEORY_GROUP = {
    category: null, colour: "colours", silhouette: "silhouettes", neckline: "necklines",
    sleeve: "sleeves", length: "lengths", material: "materials", pattern: null,
  };

  const normalise = (value) => String(value).trim().toLowerCase();
  const listHas = (values, value) =>
    value !== "Unknown" && (values || []).some((entry) => normalise(entry) === normalise(value));

  /** Trait key shared with src/lib/learned.ts, e.g. `neckline:halter`. */
  const traitKey = (dimension, value) => `${dimension}:${String(value).toLowerCase()}`;

  function recordVote(learned, keys, direction, now) {
    const stamp = now || new Date().toISOString();
    const next = Object.assign({}, learned);
    for (const key of keys) {
      const current = next[key] || { up: 0, down: 0, updatedAt: stamp };
      next[key] = Object.assign({}, current, { [direction]: current[direction] + 1, updatedAt: stamp });
    }
    return next;
  }

  function undoVote(learned, keys, direction) {
    const next = Object.assign({}, learned);
    for (const key of keys) {
      const current = next[key];
      if (!current) continue;
      const updated = Object.assign({}, current, { [direction]: Math.max(0, current[direction] - 1) });
      if (updated.up === 0 && updated.down === 0) delete next[key];
      else next[key] = updated;
    }
    return next;
  }

  function derivePreferences(learned) {
    return Object.entries(learned || {})
      .map(([key, vote]) => {
        const delta = vote.up - vote.down;
        if (Math.abs(delta) < 2) return null;
        return {
          key,
          direction: delta > 0 ? "positive" : "negative",
          confidence: Math.min(1, Math.abs(delta) / 4),
          interactions: vote.up + vote.down,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.confidence - a.confidence || b.interactions - a.interactions);
  }

  function lookupPreference(preferences, dimension, value) {
    if (value === "Unknown") return undefined;
    return preferences.find((preference) => preference.key === traitKey(dimension, value));
  }

  function traitKeysForProduct(evidence) {
    return FASHION_DIMENSIONS
      .map((dimension) => {
        const attribute = evidence[dimension];
        return attribute && attribute.value !== "Unknown" ? traitKey(dimension, attribute.value) : null;
      })
      .filter(Boolean);
  }

  function theoryFor(colourSeason, bodyShape, theoryTables) {
    const shape = (theoryTables.shapeGuidance || {})[bodyShape];
    return {
      colours: (theoryTables.colourGuidance || {})[colourSeason] || [],
      silhouettes: (shape && shape.silhouettes) || [],
      necklines: (shape && shape.necklines) || [],
      sleeves: (shape && shape.sleeves) || [],
      lengths: (shape && shape.lengths) || [],
      materials: (shape && shape.materials) || [],
    };
  }

  function scoreProduct(product, context) {
    const profile = context.profile;
    const query = context.query || "";
    const learned = context.learned || [];
    const evidence = product.evidence;
    const reasons = [];
    const conflicts = [];
    const hardRules = [];

    let score = 40;
    const add = (label, weight, kind) => {
      score += weight;
      (weight >= 0 ? reasons : conflicts).push({ label, weight, kind });
    };

    const wanted = requestedCategory(query);
    if (wanted && evidence.category.value !== "Unknown" && evidence.category.value !== wanted) {
      hardRules.push({ label: `Not a ${wanted.toLowerCase()}`, weight: 0, kind: "hard" });
    }
    const cap = hardPriceCap(query);
    if (cap !== null && product.price > cap) {
      hardRules.push({ label: `Over your £${cap} limit for this search`, weight: 0, kind: "hard" });
    }
    if (sizeConfirmedUnavailable(product.availableSizes, profile.size)) {
      hardRules.push({ label: `${profile.size} is sold out`, weight: 0, kind: "hard" });
    }
    for (const dimension of FASHION_DIMENSIONS) {
      const group = PROFILE_GROUP[dimension];
      const value = evidence[dimension].value;
      if (group && listHas((profile[group] || {}).never, value)) {
        hardRules.push({ label: `${value} is on your never list`, weight: 0, kind: "hard" });
      }
    }
    if (profile.budgetMode === "strict" && product.price > profile.budget) {
      hardRules.push({ label: `Over your £${profile.budget} budget`, weight: 0, kind: "hard" });
    }

    const theory = theoryFor(profile.colourSeason, profile.bodyShape, context.theory || THEORY);

    for (const dimension of FASHION_DIMENSIONS) {
      const value = evidence[dimension].value;
      if (value === "Unknown") continue;
      const group = PROFILE_GROUP[dimension];
      const preferences = group ? profile[group] : undefined;
      const loved = listHas(preferences && preferences.love, value);
      const avoided = listHas(preferences && preferences.avoid, value);

      if (loved) add(`${value} is one you love`, LOVE_WEIGHT[dimension], "positive");
      else if (avoided) add(`${value}`, -AVOID_WEIGHT[dimension], "warning");

      const theoryKey = THEORY_GROUP[dimension];
      if (!avoided && theoryKey && listHas(theory[theoryKey], value)) {
        add(`${value} suits your ${dimension === "colour" ? profile.colourSeason : String(profile.bodyShape).toLowerCase()}`,
          THEORY_WEIGHT[dimension], "theory");
      }

      const preference = lookupPreference(learned, dimension, value);
      if (preference && !loved && !avoided) {
        const weight = Math.round(4 * preference.confidence * (preference.direction === "positive" ? 1 : -1));
        if (weight !== 0) {
          add(preference.direction === "positive" ? `More ${value.toLowerCase()} after your feedback`
            : `Less ${value.toLowerCase()} after your feedback`, weight, "learned");
        }
      }
    }

    if (product.availableSizes.length > 0 && !sizeConfirmedUnavailable(product.availableSizes, profile.size)) {
      add(`${profile.size} in stock`, 3, "positive");
    }
    if (cap !== null && product.price <= cap) add(`Under your £${cap} limit`, 2, "positive");
    if (profile.budgetMode !== "strict" && product.price > profile.budget) {
      add(`Over your usual £${profile.budget}`, -8, "warning");
    }

    const matchScore = Math.max(1, Math.min(99, Math.round(score)));
    const evidenceConfidence = evidenceConfidenceFor(evidence);
    const state = hardRules.length > 0 ? "held" : matchScore >= 70 ? "strong" : matchScore >= 50 ? "worth" : "other";
    return Object.assign({}, product, {
      score: matchScore, matchScore, evidenceConfidence, state, reasons, conflicts, hardRules,
      blocked: state === "held",
    });
  }

  const explicitHits = (item) =>
    item.reasons.filter((reason) => reason.kind === "positive").length + item.conflicts.filter((reason) => reason.kind === "warning").length;
  const theoryHits = (item) => item.reasons.filter((reason) => reason.kind === "theory").length;
  const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1 };

  function compareRanked(a, b, valueQuery) {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (explicitHits(b) !== explicitHits(a)) return explicitHits(b) - explicitHits(a);
    const confidence = CONFIDENCE_RANK[b.evidenceConfidence] - CONFIDENCE_RANK[a.evidenceConfidence];
    if (confidence !== 0) return confidence;
    if (theoryHits(b) !== theoryHits(a)) return theoryHits(b) - theoryHits(a);
    if (valueQuery && a.price !== b.price) return a.price - b.price;
    return a.name.localeCompare(b.name);
  }

  const VALUE_QUERY = /\b(budget|cheap|affordable|value|under|less than|bargain|sale)\b/i;

  function rankProducts(items, context) {
    const valueQuery = VALUE_QUERY.test(context.query || "");
    return items.map((item) => scoreProduct(item, context)).sort((a, b) => compareRanked(a, b, valueQuery));
  }

  function countTiers(scanned, items, categoryCorrect, unknownCategory) {
    return {
      catalogueScanned: scanned,
      categoryCorrect,
      unknownCategory,
      strong: items.filter((item) => item.state === "strong").length,
      worth: items.filter((item) => item.state === "worth").length,
      other: items.filter((item) => item.state === "other").length,
      held: items.filter((item) => item.state === "held").length,
    };
  }

  function partitionResults(scanned, ranked, query) {
    const requested = requestedCategory(query);
    if (!requested) {
      return { requested: null, inCategory: ranked, unknownCategory: [], wrongCategory: [], counts: countTiers(scanned, ranked, ranked.length, 0) };
    }
    const inCategory = [], unknownCategory = [], wrongCategory = [];
    for (const item of ranked) {
      const value = item.evidence.category.value;
      if (value === requested) inCategory.push(item);
      else if (value === "Unknown") unknownCategory.push(item);
      else wrongCategory.push(item);
    }
    return { requested, inCategory, unknownCategory, wrongCategory, counts: countTiers(scanned, inCategory, inCategory.length, unknownCategory.length) };
  }

  function scoreLabel(item) {
    if (item.evidenceConfidence === "low") return "Possible match · limited product information";
    return `${item.matchScore}%`;
  }

  /** Normalise one UCP product into the shape the engine scores. */
  function normaliseUcpProduct(item, retailerId, retailerName) {
    const stripHtml = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const displayed = (item.variants || []).find((v) => v.availability && v.availability.available !== false) || (item.variants || [])[0];
    const input = {
      title: item.title || "",
      description: stripHtml(item.description && item.description.html),
      tags: item.tags || [],
      options: (item.options || []).map((option) => ({
        name: option.name || "",
        values: (option.values || []).map((value) => value.label || "").filter(Boolean),
      })),
      variantOptions: ((displayed && displayed.options) || []).map((option) => ({ name: option.name || "", value: option.label || "" })),
      taxonomyCategories: (item.categories || []).map((category) => category.value || "").filter(Boolean),
      collections: (item.collections || []).flatMap((collection) => [collection.handle || "", collection.title || ""]).filter(Boolean),
    };
    const evidence = extractAttributes(input);
    const variants = (item.variants || []).map((variant) => ({
      available: !(variant.availability && variant.availability.available === false),
      options: (variant.options || []).map((option) => ({ name: option.name || "", value: option.label || "" })),
    }));
    const sizes = availableSizes(variants);
    const media = (item.media || []).find((entry) => entry.type === "image" && entry.url)
      || (item.variants || []).flatMap((variant) => variant.media || []).find((entry) => entry.type === "image" && entry.url);
    const colour = evidence.colour.value;
    const rawId = String(item.id || item.url || item.title || "").split("/").pop();
    return {
      id: `${retailerId}-${rawId}`,
      retailerId,
      name: item.title || "Untitled product",
      brand: retailerName,
      price: Math.round(((item.price_range && item.price_range.min && item.price_range.min.amount) || 0)) / 100,
      colour,
      category: evidence.category.value,
      evidence,
      alternativeColours: alternativeColours(input, colour === "Unknown" ? null : colour),
      availableSizes: sizes,
      sizes,
      imageUrl: media ? media.url : "",
      productUrl: item.url,
      source: "live-ucp",
    };
  }

  return {
    VOCABULARY, TAXONOMY_CATEGORY, CATEGORY_PLURAL, FASHION_DIMENSIONS, THEORY,
    containsTerm, mapToCanonical, dimensionForTagKey, requestedCategory, pluralCategory,
    extractAttributes, alternativeColours, evidenceConfidenceFor, availableSizes,
    sizeConfirmedUnavailable, hardPriceCap, statedComposition,
    traitKey, recordVote, undoVote, derivePreferences, lookupPreference, traitKeysForProduct,
    scoreProduct, compareRanked, rankProducts, partitionResults, scoreLabel, normaliseUcpProduct,
  };
});
