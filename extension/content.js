(() => {
  if (window.__fashionPassportContentLoaded) return;
  window.__fashionPassportContentLoaded = true;

  const endpoint = `${location.origin}/api/ucp/mcp`;
  const host = location.hostname.replace(/^www\./, "");
  const approvalKey = "fashion-passport:connected-once";
  const signalKey = "fashion-passport:learned-signals";
  const profileKey = "fashion-passport:profile";
  const agentProfile = "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json";
  const votesKey = "fashion-passport:taste-votes";
  const FE = globalThis.FashionEngine;

  /**
   * The full migrated FashionProfile, not a flattened love/avoid pair.
   * Every `never` group and `budgetMode` travel, because only those can hold
   * a product. Overwritten by whatever the Passport app has saved.
   */
  const emptyGroup = () => ({ love: [], avoid: [], never: [] });
  let profile = {
    label: "My Fashion Passport", country: "UK", size: "UK 10", heightCm: 163,
    colourSeason: "Deep Winter", bodyShape: "Inverted triangle", budget: 100, budgetMode: "usual",
    colours: { love: ["Red", "Burnt orange", "Terracotta", "Navy", "Dark pink", "Camel"], avoid: ["Olive", "Grey", "Taupe"], never: [] },
    silhouettes: { love: ["Flowy", "A-line", "Fit and flare"], avoid: ["Shift/boxy", "Tailored/structured"], never: [] },
    necklines: { love: ["Square", "Boat/bateau", "Scoop"], avoid: ["Cowl"], never: [] },
    sleeves: { love: ["Long", "3/4", "Sleeveless"], avoid: ["Cap"], never: [] },
    patterns: { love: ["Ditsy/small floral", "Gingham", "Check/plaid", "Solid/plain"], avoid: ["Abstract/large print", "Animal"], never: [] },
    materials: { love: ["Chiffon", "Silk", "Cotton/pure cotton", "Linen"], avoid: ["Polyester"], never: [] },
    lengths: { love: ["Midi/midaxi"], avoid: [], never: [] },
    retailers: emptyGroup(),
  };

  const GROUP_KEYS = ["colours", "silhouettes", "necklines", "sleeves", "patterns", "materials", "lengths", "retailers"];
  /** Forward-migrates a saved profile without discarding it. Mirrors src/lib/profile.ts. */
  const normaliseProfile = (stored) => {
    const next = Object.assign({}, profile, stored || {});
    for (const key of GROUP_KEYS) {
      const group = (stored && stored[key]) || {};
      next[key] = { love: group.love || [], avoid: group.avoid || [], never: group.never || [] };
    }
    next.budgetMode = next.budgetMode === "strict" ? "strict" : "usual";
    return next;
  };

  let retailerName = host;
  let approved = false;
  let personalized = false;
  let root;
  let panel;
  let products = [];
  let learnedVotes = {};
  let lastReaction = null;
  let agentUpdateNotice = null;
  let ranked = [];
  let currentScan = { scanned: 0, pages: 0, complete: false, cursor: null };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  const safeUrl = (value) => { try { const url = new URL(value, location.origin); return url.protocol === "https:" ? url.href : ""; } catch { return ""; } };
  const merchantName = () => document.querySelector('meta[property="og:site_name"]')?.content?.trim() || document.title.split(/[|–\u2014]/)[0].trim() || host;
  const queryFromPage = () => {
    const heading = document.querySelector("h1")?.textContent?.trim();
    if (heading && heading.length < 70 && /dress|skirt|top|trouser|jean|jumpsuit|clothing|women|occasion|new|sale/i.test(heading)) return heading;
    const page = `${location.pathname} ${document.title}`;
    if (/skirt/i.test(page)) return "skirts";
    if (/dress/i.test(page)) return "midi dress";
    return "women's clothing";
  };
  const fullIntent = () => [
    `Shopper explicitly approved sharing this Fashion Passport: ${profile.size}, ${profile.heightCm} cm`,
    `${profile.colourSeason}; ${profile.bodyShape}`,
    `loves ${[...profile.colours.love, ...profile.silhouettes.love, ...profile.necklines.love, ...profile.materials.love].join(", ")}`,
    `avoids ${[...profile.colours.avoid, ...profile.silhouettes.avoid, ...profile.necklines.avoid, ...profile.materials.avoid].join(", ")}`,
    `never ${[...profile.colours.never, ...profile.silhouettes.never, ...profile.necklines.never, ...profile.materials.never].join(", ")}`,
    `budget GBP ${profile.budget} (${profile.budgetMode})`,
  ].join("; ");

  const rpc = async (method, params) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method, params, id: crypto.randomUUID() })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.error) throw new Error(payload.error.message || "Retailer MCP error");
    return payload.result;
  };

  const probe = async () => {
    try {
      const result = await rpc("tools/list");
      const names = (result?.tools || []).map((tool) => tool.name);
      return names.includes("search_catalog") && names.includes("get_product");
    } catch { return false; }
  };






  let panelTier = "strong";
  let panelShown = 24;

  /**
   * P0.2: every ranking decision comes from the shared engine, so the panel
   * and the Passport app cannot disagree. tests/parity.test.ts enforces it.
   */
  const learnedPreferences = () => FE.derivePreferences(learnedVotes);
  const scoreAll = (items, query) =>
    FE.rankProducts(items, { profile, query, learned: learnedPreferences(), theory: FE.THEORY });

  const renderPill = (status = "") => {
    if (!root) return;
    const label = status || (personalized ? "Live matches open" : approved ? "Shopify ready" : "Permission needed");
    root.innerHTML = `<button class="fp-pill ${personalized ? "is-on" : ""}" aria-label="${personalized ? "Hide" : "Apply"} Fashion Passport"><span class="fp-icon">▣</span><span><small>Fashion Passport · Shopify</small><strong>${escapeHtml(label)}</strong></span><i></i></button>`;
    root.querySelector("button").addEventListener("click", () => personalized ? togglePanel() : approved ? searchCatalogue(queryFromPage()) : showApproval());
  };

  const showApproval = () => {
    document.getElementById("fashion-passport-consent")?.remove();
    const modal = document.createElement("div"); modal.id = "fashion-passport-consent";
    modal.innerHTML = `<div class="fp-consent-card"><button class="fp-close" aria-label="Close">×</button><div class="fp-passport">▣</div><p class="fp-kicker">Official Shopify connection detected</p><h2>Connect Fashion Passport once?</h2><p>This single approval applies your Passport on compatible Shopify stores, including ${escapeHtml(retailerName)}, across shops and categories while browsing history stays in this browser.</p><dl><div><dt>Size &amp; fit</dt><dd>${escapeHtml(profile.size)} · ${escapeHtml(String(profile.heightCm))} cm</dd></div><div><dt>Style context</dt><dd>${escapeHtml(profile.colourSeason)} · ${escapeHtml(profile.bodyShape)}</dd></div><div><dt>Taste &amp; limits</dt><dd>Colours, cuts, fabric · £${escapeHtml(String(profile.budget))} ${escapeHtml(profile.budgetMode)}</dd></div></dl><button class="fp-allow">Connect once →</button><button class="fp-not-now">Not now</button><small>${escapeHtml(endpoint)}</small></div>`;
    document.documentElement.appendChild(modal);
    modal.querySelector(".fp-close").addEventListener("click", () => modal.remove());
    modal.querySelector(".fp-not-now").addEventListener("click", () => modal.remove());
    modal.querySelector(".fp-allow").addEventListener("click", async () => {
      approved = true; await chrome.storage.local.set({ [approvalKey]: true }); document.documentElement.dataset.fashionPassportApproved = "true"; modal.remove(); await searchCatalogue(queryFromPage());
    });
  };

  const renderPanel = (query) => {
    panel?.remove(); panel = document.createElement("aside"); panel.id = "fashion-passport-results";

    // P0.5: one partition feeds every visible figure, so the counts add up and
    // wrong-category products are gated out rather than reported as held.
    const partition = FE.partitionResults(currentScan.scanned, ranked, query);
    const counts = partition.counts;
    if (panelTier === "strong" && counts.strong === 0 && counts.worth > 0) panelTier = "worth";
    const inTier = panelTier === "held" ? partition.inCategory.filter((r) => r.state === "held")
      : panelTier === "all" ? [...partition.inCategory.filter((r) => r.state !== "held"), ...partition.unknownCategory]
      : partition.inCategory.filter((r) => r.state === panelTier);
    // A render batch for performance, never a recommendation cap.
    const visible = inTier.slice(0, panelShown);
    const remaining = inTier.length - visible.length;

    const cards = visible.map((result, index) => {
      const url = safeUrl(result.productUrl); const image = safeUrl(result.imageUrl);
      const badge = result.state === "held" || result.evidenceConfidence === "low" ? "" : `<span class="fp-score">${result.matchScore}%</span>`;
      const notes = [
        ...result.reasons.slice(0, 3).map((reason) => `<li>${escapeHtml(reason.label)}</li>`),
        ...result.conflicts.slice(0, 2).map((reason) => `<li class="fp-conflict">${escapeHtml(reason.label)}</li>`),
        ...result.hardRules.map((rule) => `<li class="fp-hard">${escapeHtml(rule.label)}</li>`),
      ].join("");
      return `<article class="fp-result-card"><a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${image ? `<img src="${escapeHtml(image)}" alt="">` : ""}${badge}<div><small>${escapeHtml(retailerName)}</small><h3>${escapeHtml(result.name)}</h3><strong>£${result.price.toFixed(2)}</strong><ul>${notes}</ul></div></a><div class="fp-feedback"><button data-signal="down" data-index="${index}" aria-label="Less like this">↓</button><button data-signal="up" data-index="${index}" aria-label="More like this">↑</button></div></article>`;
    }).join("");

    // P0.6: never present a total while the retailer says there is more.
    const scannedLabel = currentScan.complete ? String(currentScan.scanned) : `${currentScan.scanned} so far`;
    const categoryLine = partition.requested
      ? `<strong>${counts.categoryCorrect}</strong> ${escapeHtml(FE.pluralCategory(partition.requested))} found${currentScan.complete ? "" : " so far"}`
      : `<strong>${ranked.length}</strong> products ranked`;
    const tiers = [["strong", "Strong", counts.strong], ["worth", "Worth a look", counts.worth],
      ["all", "All", counts.strong + counts.worth + counts.other + counts.unknownCategory], ["held", "Held", counts.held]];

    panel.innerHTML = `<header><div><p>Fashion Passport</p><h2>${escapeHtml(retailerName)}</h2><span><i></i> Live Shopify UCP</span></div><button class="fp-panel-close" aria-label="Close">×</button></header>`
      + `<form><input value="${escapeHtml(query)}" aria-label="Search this retailer"><button>Rank</button></form>`
      + `<div class="fp-result-summary"><strong>${scannedLabel}</strong> catalogue products scanned · ${categoryLine}<br>${counts.strong} strong · ${counts.worth} worth a look · ${counts.other} other · ${counts.held} held by your rules</div>`
      + `<nav class="fp-tiers">${tiers.map(([key, label, count]) => `<button data-tier="${key}" class="${panelTier === key ? "is-on" : ""}">${escapeHtml(label)} <i>${count}</i></button>`).join("")}</nav>`
      + (agentUpdateNotice ? `<div class="fp-learned"><span>${escapeHtml(agentUpdateNotice)}</span></div>` : "")
      + (lastReaction ? `<div class="fp-learned"><span>Passport learned: ${escapeHtml(lastReaction.label)}.${lastReaction.moved > 0 ? ` ${lastReaction.moved} ${lastReaction.moved === 1 ? "product" : "products"} moved.` : " It takes repeated evidence to change the order."}</span><button class="fp-undo">Undo</button>${lastReaction.options.length ? `<div class="fp-reasons"><em>${lastReaction.direction === "up" ? "What worked?" : "What put you off?"}</em>${lastReaction.options.map((option) => `<button class="fp-reason" data-key="${escapeHtml(option.key)}">${escapeHtml(option.value)}</button>`).join("")}<button class="fp-reason fp-reason-skip">Skip</button></div>` : ""}</div>` : "")
      + `<div class="fp-results-grid">${cards || `<p class="fp-empty">This tier is empty, so try another tier or a broader search.</p>`}</div>`
      + (remaining > 0 ? `<button class="fp-load-more">Load ${Math.min(24, remaining)} more · ${remaining} still to see</button>` : "")
      + (!currentScan.complete ? `<button class="fp-scan-more">Keep scanning the catalogue · ${currentScan.pages} pages read</button>` : "")
      + `<footer>${currentScan.pages} catalogue ${currentScan.pages === 1 ? "page" : "pages"} read${currentScan.complete ? " · catalogue complete" : " · more available"} · retailer-owned products</footer>`;

    document.documentElement.appendChild(panel);
    panel.querySelector(".fp-panel-close").addEventListener("click", togglePanel);
    panel.querySelectorAll("[data-tier]").forEach((button) => button.addEventListener("click", () => {
      panelTier = button.dataset.tier; panelShown = 24; renderPanel(query);
    }));
    panel.querySelector(".fp-load-more")?.addEventListener("click", () => { panelShown += 24; renderPanel(query); });
    panel.querySelector(".fp-scan-more")?.addEventListener("click", () => { void continueScan(query); });
    panel.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault(); const value = panel.querySelector("input").value.trim(); if (value) searchCatalogue(value);
    });
    panel.querySelector(".fp-undo")?.addEventListener("click", () => { void undoLastReaction(query); });
    panel.querySelectorAll(".fp-reason").forEach((button) => button.addEventListener("click", () => {
      void narrowLastReaction(query, button.dataset.key || null);
    }));
    panel.querySelectorAll("[data-signal]").forEach((button) => button.addEventListener("click", () => {
      void react(query, visible[Number(button.dataset.index)], button.dataset.signal);
    }));
  };

  /**
   * P0.1: both reactions record every known trait as raw {up, down} tallies,
   * using the same semantics as src/lib/learned.ts. One vote changes no derived
   * preference; two net votes create one. The panel reranks immediately, the
   * moved count is measured rather than asserted, and Undo restores the
   * previous tallies and order.
   */
  const react = async (query, product, direction) => {
    if (!product) return;
    const keys = FE.traitKeysForProduct(product.evidence);
    if (keys.length === 0) return;
    const before = ranked.map((item) => item.id);
    const previousVotes = learnedVotes;
    learnedVotes = FE.recordVote(learnedVotes, keys, direction);
    ranked = scoreAll(products, query);
    const moved = ranked.reduce((total, item, index) => (before[index] === item.id ? total : total + 1), 0);

    // Name a trait the signal can actually move: an explicitly stated trait is
    // never affected by learning, so naming it would mislead.
    const groupFor = { colour: "colours", silhouette: "silhouettes", neckline: "necklines", sleeve: "sleeves", length: "lengths", pattern: "patterns", material: "materials" };
    const options = FE.FASHION_DIMENSIONS
      .map((dimension) => ({ dimension, value: product.evidence[dimension].value }))
      .filter((entry) => entry.value !== "Unknown")
      .map((entry) => ({ ...entry, key: FE.traitKey(entry.dimension, entry.value) }));
    const movable = options.find((entry) => {
      const group = profile[groupFor[entry.dimension]] || {};
      return ![...(group.love || []), ...(group.avoid || []), ...(group.never || [])]
        .some((stated) => String(stated).toLowerCase() === entry.value.toLowerCase());
    });
    lastReaction = {
      keys, direction, previousVotes, moved, options,
      label: `${direction === "up" ? "more" : "less"} ${(movable ? movable.value : "like this").toLowerCase()}`,
    };
    await persistVotes();
    panelShown = Math.max(panelShown, 24);
    renderPanel(query);
  };

  const undoLastReaction = async (query) => {
    if (!lastReaction) return;
    learnedVotes = lastReaction.previousVotes;
    lastReaction = null;
    ranked = scoreAll(products, query);
    await persistVotes();
    renderPanel(query);
  };

  /** Narrows the broad vote to one chosen trait. Optional, never blocking. */
  const narrowLastReaction = async (query, key) => {
    if (!lastReaction) return;
    if (key) {
      learnedVotes = FE.recordVote(FE.undoVote(learnedVotes, lastReaction.keys, lastReaction.direction), [key], lastReaction.direction);
      ranked = scoreAll(products, query);
      await persistVotes();
    }
    lastReaction = null;
    renderPanel(query);
  };

  const persistVotes = async () => {
    try { await chrome.storage.local.set({ [votesKey]: learnedVotes }); } catch { /* storage unavailable */ }
  };

  const updateAgentPreference = (action) => {
    if (!approved) { showApproval(); return { status: "connection_required", retailer: host }; }
    const groups = { colour: "colours", silhouette: "silhouettes", neckline: "necklines", sleeve: "sleeves", length: "lengths", pattern: "patterns", material: "materials" };
    const groupKey = groups[action.dimension];
    const preference = ["love", "avoid", "never"].includes(action.preference) ? action.preference : null;
    const canonical = groupKey ? FE.mapToCanonical(action.dimension, String(action.value || "")) : null;
    if (!groupKey || !preference || !canonical) return { status: "invalid_preference", retailer: host };
    const nextGroup = { ...profile[groupKey] };
    for (const level of ["love", "avoid", "never"]) nextGroup[level] = (nextGroup[level] || []).filter((item) => item.toLowerCase() !== canonical.toLowerCase());
    nextGroup[preference] = [...nextGroup[preference], canonical];
    profile = { ...profile, [groupKey]: nextGroup };
    document.documentElement.dataset.fashionPassportProfile = JSON.stringify(profile);
    void chrome.storage.local.set({ [profileKey]: profile });
    const query = panel?.querySelector("input")?.value.trim() || queryFromPage();
    const before = ranked.map((item) => item.id);
    if (products.length) ranked = scoreAll(products, query);
    const moved = ranked.reduce((total, item, index) => total + (before[index] === item.id ? 0 : 1), 0);
    agentUpdateNotice = `Fashion Passport now treats ${canonical} as ${preference}, and ${moved} ${moved === 1 ? "product moved" : "products moved"}.`;
    if (panel) renderPanel(query);
    return { status: "updated", retailer: host, dimension: action.dimension, value: canonical, preference, productsReranked: ranked.length, productsMoved: moved };
  };

  const togglePanel = () => {
    if (!panel) return;
    const hidden = panel.classList.toggle("fp-panel-hidden"); personalized = !hidden; renderPill();
  };

  const readCatalogPage = async (query, cursor) => {
    const result = await rpc("tools/call", { name: "search_catalog", arguments: { meta: { "ucp-agent": { profile: agentProfile } }, catalog: { query, context: { address_country: "GB", language: "en-GB", currency: "GBP", intent: fullIntent() }, pagination: { limit: 250, ...(cursor ? { cursor } : {}) } } } });
    const text = result?.content?.find((entry) => entry.type === "text")?.text;
    return JSON.parse(text || "{}");
  };

  /**
   * P0.6: the on-retailer surface is the core proof, so it reads the catalogue
   * to exhaustion. `SAFETY_PAGES` is a defensive ceiling against a retailer
   * that never stops paging, not a product cap: when it is reached the cursor
   * is saved, counts are labelled "so far", and the panel offers a control to
   * continue from exactly where it stopped.
   */
  const SAFETY_PAGES = 200;
  const rawById = new Map();

  const readCatalogFrom = async (query, startCursor, startPages) => {
    let cursor = startCursor || "";
    let hasNext = true;
    let pages = startPages || 0;
    let readThisRun = 0;
    while (hasNext && readThisRun < SAFETY_PAGES) {
      renderPill(rawById.size ? `Scanning ${rawById.size} live products…` : "Opening the live catalogue…");
      const payload = await readCatalogPage(query, cursor);
      const pageProducts = Array.isArray(payload.products) ? payload.products : [];
      pageProducts.forEach((item) => rawById.set(item.id || item.url || `${pages}:${item.title}`, item));
      pages += 1;
      readThisRun += 1;
      hasNext = Boolean(payload.pagination?.has_next_page && payload.pagination?.cursor && pageProducts.length);
      cursor = hasNext ? payload.pagination.cursor : "";
    }
    return { scanned: rawById.size, pages, complete: !hasNext, cursor: hasNext ? cursor : null };
  };

  /** Continues from the saved cursor, deduplicates and reranks the larger set. */
  const continueScan = async (query) => {
    if (currentScan.complete || !currentScan.cursor) return;
    try {
      currentScan = await readCatalogFrom(query, currentScan.cursor, currentScan.pages);
      products = [...rawById.values()].map((item) => FE.normaliseUcpProduct(item, host, retailerName)).filter((item) => item.productUrl);
      ranked = scoreAll(products, query);
      renderPill();
      renderPanel(query);
    } catch (error) {
      renderPill("Connection needs retry");
      showToast(`The catalogue could not continue because ${error instanceof Error ? error.message : "an unknown error occurred"}`);
    }
  };

  const searchCatalogue = async (query) => {
    if (!approved) return showApproval();
    renderPill("Calling native endpoint…");
    try {
      rawById.clear();
      panelTier = "strong"; panelShown = 24; lastReaction = null;
      currentScan = await readCatalogFrom(query, "", 0);
      products = [...rawById.values()].map((item) => FE.normaliseUcpProduct(item, host, retailerName)).filter((item) => item.productUrl);
      ranked = scoreAll(products, query);
      const partition = FE.partitionResults(currentScan.scanned, ranked, query);
      renderPanel(query); personalized = true;
      document.documentElement.dataset.fashionPassportSummary = JSON.stringify({
        protocol: "Shopify UCP/MCP", endpoint,
        catalogueScanned: currentScan.scanned,
        catalogueComplete: currentScan.complete,
        categoryCorrect: partition.counts.categoryCorrect,
        strong: partition.counts.strong, worth: partition.counts.worth,
        other: partition.counts.other, held: partition.counts.held,
        pages: currentScan.pages,
      });
      renderPill();
      showToast(`${partition.counts.categoryCorrect} ranked from ${currentScan.complete ? currentScan.scanned : `${currentScan.scanned} so far`} scanned`);
    } catch (error) {
      renderPill("Connection needs retry");
      showToast(`The catalogue could not be read because ${error instanceof Error ? error.message : "an unknown error occurred"}`);
    }
  };

  const showToast = (message) => { document.querySelector(".fp-toast")?.remove(); const toast = document.createElement("div"); toast.className = "fp-toast"; toast.textContent = `✓ ${message}`; document.documentElement.appendChild(toast); window.setTimeout(() => toast.remove(), 3200); };

  /**
   * P0.3: the complete migrated profile travels, including every `never` group
   * and `budgetMode`, alongside the raw vote tallies the app writes. Nothing is
   * collapsed back into flat love/avoid arrays.
   */
  const syncPassportApp = async () => {
    const connected = localStorage.getItem("fashion-passport:connected") === "true";
    let savedProfile = null;
    let savedVotes = {};
    let legacySignals = [];
    try { savedProfile = JSON.parse(localStorage.getItem(profileKey) || "null"); } catch { savedProfile = null; }
    try { savedVotes = JSON.parse(localStorage.getItem(votesKey) || "{}"); } catch { savedVotes = {}; }
    try { legacySignals = JSON.parse(localStorage.getItem("fashion-passport:learned-avoid") || "[]"); } catch { legacySignals = []; }
    approved = connected;
    if (savedProfile) profile = normaliseProfile(savedProfile);
    if (savedVotes && typeof savedVotes === "object") learnedVotes = savedVotes;
    await chrome.storage.local.set({
      [approvalKey]: connected,
      [votesKey]: learnedVotes,
      [signalKey]: Array.isArray(legacySignals) ? legacySignals : [],
      ...(savedProfile ? { [profileKey]: profile } : {}),
    });
  };

  const init = async () => {
    if (document.querySelector('meta[name="fashion-passport-app"]')) {
      await syncPassportApp();
      document.addEventListener("fashion-passport:connection-changed", syncPassportApp);
      document.addEventListener("fashion-passport:learned-changed", syncPassportApp);
      window.addEventListener("storage", (event) => {
        if (!event.key || event.key === votesKey || event.key === profileKey) void syncPassportApp();
      });
      return;
    }
    const compatible = await probe();
    if (!compatible) return;
    retailerName = merchantName();
    const saved = await chrome.storage.local.get([approvalKey, signalKey, profileKey, votesKey]);
    approved = saved[approvalKey] === true;
    // The full grouped profile is kept, never flattened into love/avoid pairs.
    if (saved[profileKey]) profile = normaliseProfile(saved[profileKey]);
    if (saved[votesKey] && typeof saved[votesKey] === "object") learnedVotes = saved[votesKey];
    // A profile saved before the vote model existed still contributes.
    const legacy = Array.isArray(saved[signalKey]) ? saved[signalKey] : [];
    for (const raw of legacy) {
      const value = String(raw).replace(/^(love|avoid):/, "");
      const direction = String(raw).startsWith("love:") ? "up" : "down";
      for (const dimension of FE.FASHION_DIMENSIONS) {
        const canonical = FE.mapToCanonical(dimension, value);
        if (!canonical) continue;
        const key = FE.traitKey(dimension, canonical);
        if (!learnedVotes[key]) learnedVotes = FE.recordVote(FE.recordVote(learnedVotes, [key], direction), [key], direction);
        break;
      }
    }
    document.documentElement.dataset.fashionPassportCompatible = "true";
    document.documentElement.dataset.fashionPassportEndpoint = endpoint;
    document.documentElement.dataset.fashionPassportApproved = String(approved);
    document.documentElement.dataset.fashionPassportProfile = JSON.stringify(profile);
    document.dispatchEvent(new Event("fashion-passport:compatibility"));
    root = document.createElement("div"); root.id = "fashion-passport-extension-root"; document.documentElement.appendChild(root); renderPill();
  };

  document.addEventListener("fashion-passport:agent-action", () => {
    let action = {}; try { action = JSON.parse(document.documentElement.dataset.fashionPassportAction || "{}"); } catch { /* Ignore invalid page data. */ }
    if (action.action === "request-approval") showApproval();
    if (action.action === "personalize") searchCatalogue(action.request || queryFromPage());
    if (action.action === "update-preference") document.documentElement.dataset.fashionPassportActionResult = JSON.stringify(updateAgentPreference(action));
  });
  init();
})();
