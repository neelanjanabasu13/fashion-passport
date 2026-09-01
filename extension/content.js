(() => {
  if (window.__fashionPassportContentLoaded) return;
  window.__fashionPassportContentLoaded = true;

  const endpoint = `${location.origin}/api/ucp/mcp`;
  const host = location.hostname.replace(/^www\./, "");
  const approvalKey = "fashion-passport:connected-once";
  const signalKey = "fashion-passport:learned-signals";
  const agentProfile = "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json";
  const profile = {
    size: "UK 10", heightCm: 163, budget: 100, season: "Deep Winter", shape: "Inverted triangle",
    love: ["red", "ruby", "burgundy", "pink", "jewel", "navy", "emerald", "camel", "orange", "terracotta", "a-line", "fit and flare", "flowy", "square neck", "boat neck", "scoop neck", "midi", "silk", "linen", "cotton", "chiffon", "ditsy", "gingham", "plaid"],
    avoid: ["polyester", "boxy", "structured", "cowl", "cap sleeve", "olive", "grey", "gray", "taupe", "animal print", "leopard", "snake print"]
  };

  let retailerName = host;
  let approved = false;
  let personalized = false;
  let root;
  let panel;
  let products = [];
  let learnedSignals = [];

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  const safeUrl = (value) => { try { const url = new URL(value, location.origin); return url.protocol === "https:" ? url.href : ""; } catch { return ""; } };
  const hasTerm = (text, term) => new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(text);
  const stripHtml = (value = "") => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const money = (amount) => Number.isFinite(amount) ? Number(amount) / 100 : 0;
  const merchantName = () => document.querySelector('meta[property="og:site_name"]')?.content?.trim() || document.title.split(/[|–—]/)[0].trim() || host;
  const queryFromPage = () => {
    const heading = document.querySelector("h1")?.textContent?.trim();
    if (heading && heading.length < 70 && /dress|skirt|top|trouser|jean|jumpsuit|clothing|women|occasion|new|sale/i.test(heading)) return heading;
    const page = `${location.pathname} ${document.title}`;
    if (/skirt/i.test(page)) return "skirts";
    if (/dress/i.test(page)) return "midi dress";
    return "women's clothing";
  };
  const fullIntent = () => `Shopper explicitly approved sharing this Fashion Passport: ${profile.size}, ${profile.heightCm} cm; ${profile.season}; ${profile.shape}; loves ${profile.love.join(", ")}; avoids ${profile.avoid.join(", ")}; budget GBP ${profile.budget}`;

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

  const productText = (item) => {
    const description = stripHtml(item.description?.html || "");
    const tags = Array.isArray(item.tags) ? item.tags.join(" ") : "";
    const options = Array.isArray(item.options) ? item.options.flatMap((option) => (option.values || []).map((value) => `${option.name}:${value.label}`)).join(" ") : "";
    return `${item.title || ""} ${description} ${tags} ${options}`.toLowerCase();
  };

  const matchesCategory = (item, query) => {
    const request = query.toLowerCase(); const title = String(item.title || "").toLowerCase();
    const groups = [
      { q: ["skirt", "skirts"], p: ["skirt", "skort"] }, { q: ["dress", "dresses"], p: ["dress", "gown"] },
      { q: ["top", "tops"], p: ["top", "blouse", "shirt", "bodysuit", "vest", "camisole"] },
      { q: ["trouser", "trousers", "pants"], p: ["trouser", "pants"] }, { q: ["jean", "jeans"], p: ["jean", "denim"] }
    ];
    const category = groups.find((group) => group.q.some((term) => new RegExp(`\\b${term}\\b`, "i").test(request)));
    return !category || category.p.some((term) => new RegExp(`\\b${term}s?\\b`, "i").test(title));
  };

  const analyse = (item) => {
    const text = productText(item);
    const titleText = String(item.title || "").toLowerCase();
    const loves = profile.love.filter((term) => hasTerm(titleText, term));
    const avoids = [...profile.avoid, ...learnedSignals].filter((term) => hasTerm(text, term));
    const price = money(item.price_range?.min?.amount);
    const sizeOptions = (item.variants || []).filter((variant) => variant.availability?.available !== false).flatMap((variant) => (variant.options || []).filter((option) => option.name?.toLowerCase() === "size").map((option) => option.label));
    const hasSizeData = sizeOptions.length > 0;
    const hasSize = sizeOptions.some((size) => /(^|\D)10(\D|$)/.test(String(size)));
    const overBudget = price > profile.budget;
    const blocked = avoids.includes("polyester") || overBudget || (hasSizeData && !hasSize);
    const uniqueLoves = [...new Set(loves)].slice(0, 3);
    const score = Math.max(18, Math.min(97, 64 + uniqueLoves.length * 8 - avoids.length * 12 - (overBudget ? 22 : 0) - (hasSizeData && !hasSize ? 30 : 0)));
    const reasons = [];
    if (hasSize) reasons.push("UK 10 available");
    if (uniqueLoves[0]) reasons.push(`Matches your ${uniqueLoves[0]} preference`);
    if (uniqueLoves[1]) reasons.push(`Also ${uniqueLoves[1]}`);
    if (!overBudget) reasons.push(`Within £${profile.budget} budget`);
    if (overBudget) reasons.push(`Over £${profile.budget} budget`);
    if (avoids[0]) reasons.push(`Contains avoided ${avoids[0]}`);
    return { item, text, price, score, reasons, blocked, image: item.media?.find((media) => media.type === "image")?.url || item.variants?.flatMap((variant) => variant.media || []).find((media) => media.type === "image")?.url || "" };
  };

  const renderPill = (status = "") => {
    if (!root) return;
    const label = status || (personalized ? "Live matches open" : approved ? "Shopify ready" : "Permission needed");
    root.innerHTML = `<button class="fp-pill ${personalized ? "is-on" : ""}" aria-label="${personalized ? "Hide" : "Apply"} Fashion Passport"><span class="fp-icon">▣</span><span><small>Fashion Passport · Shopify</small><strong>${escapeHtml(label)}</strong></span><i></i></button>`;
    root.querySelector("button").addEventListener("click", () => personalized ? togglePanel() : approved ? searchCatalogue(queryFromPage()) : showApproval());
  };

  const showApproval = () => {
    document.getElementById("fashion-passport-consent")?.remove();
    const modal = document.createElement("div"); modal.id = "fashion-passport-consent";
    modal.innerHTML = `<div class="fp-consent-card"><button class="fp-close" aria-label="Close">×</button><div class="fp-passport">▣</div><p class="fp-kicker">Official Shopify connection detected</p><h2>Connect Fashion Passport once?</h2><p>This single approval applies your Passport on compatible Shopify stores, including ${escapeHtml(retailerName)}, without asking again for every shop or category. Browsing history stays in this browser.</p><dl><div><dt>Size & fit</dt><dd>UK 10 · 163 cm</dd></div><div><dt>Style context</dt><dd>Deep Winter · Inverted triangle</dd></div><div><dt>Taste & limits</dt><dd>Colours, cuts, fabric · £100 max</dd></div></dl><button class="fp-allow">Connect once →</button><button class="fp-not-now">Not now</button><small>${escapeHtml(endpoint)}</small></div>`;
    document.documentElement.appendChild(modal);
    modal.querySelector(".fp-close").addEventListener("click", () => modal.remove());
    modal.querySelector(".fp-not-now").addEventListener("click", () => modal.remove());
    modal.querySelector(".fp-allow").addEventListener("click", async () => {
      approved = true; await chrome.storage.local.set({ [approvalKey]: true }); document.documentElement.dataset.fashionPassportApproved = "true"; modal.remove(); await searchCatalogue(queryFromPage());
    });
  };

  const renderPanel = (query, ranked) => {
    panel?.remove(); panel = document.createElement("aside"); panel.id = "fashion-passport-results";
    const visible = ranked.filter((result) => !result.blocked).slice(0, 8);
    const cards = visible.map((result) => {
      const url = safeUrl(result.item.url); const image = safeUrl(result.image);
      return `<article class="fp-result-card"><a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${image ? `<img src="${escapeHtml(image)}" alt="">` : ""}<span class="fp-score">${result.score}%</span><div><small>${escapeHtml(retailerName)}</small><h3>${escapeHtml(result.item.title)}</h3><strong>£${result.price.toFixed(2)}</strong><ul>${result.reasons.slice(0, 3).map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul></div></a><div class="fp-feedback"><button data-signal="down" data-trait="${escapeHtml(result.text.includes("cowl") ? "cowl" : result.text.includes("polyester") ? "polyester" : "style")}" aria-label="Show less like this">↓</button><button data-signal="up" aria-label="Show more like this">↑</button></div></article>`;
    }).join("");
    panel.innerHTML = `<header><div><p>Fashion Passport</p><h2>${escapeHtml(retailerName)}</h2><span><i></i> Live Shopify UCP</span></div><button class="fp-panel-close" aria-label="Close">×</button></header><form><input value="${escapeHtml(query)}" aria-label="Search this retailer"><button>Rank</button></form><div class="fp-result-summary"><strong>${visible.length}</strong> best matches from ${ranked.length} live products · ${ranked.filter((result) => result.blocked).length} held back</div><div class="fp-results-grid">${cards || `<p class="fp-empty">No suitable live matches returned. Try a broader search.</p>`}</div><footer>One Passport adapter · retailer-owned products · personal ranking</footer>`;
    document.documentElement.appendChild(panel);
    panel.querySelector(".fp-panel-close").addEventListener("click", togglePanel);
    panel.querySelector("form").addEventListener("submit", (event) => { event.preventDefault(); const value = panel.querySelector("input").value.trim(); if (value) searchCatalogue(value); });
    panel.querySelectorAll("[data-signal]").forEach((button) => button.addEventListener("click", async () => {
      if (button.dataset.signal === "down" && button.dataset.trait !== "style") learnedSignals = [...new Set([...learnedSignals, button.dataset.trait])];
      await chrome.storage.local.set({ [signalKey]: learnedSignals }); showToast(button.dataset.signal === "up" ? "Saved — more like this" : "Saved — less like this");
    }));
  };

  const togglePanel = () => {
    if (!panel) return;
    const hidden = panel.classList.toggle("fp-panel-hidden"); personalized = !hidden; renderPill();
  };

  const searchCatalogue = async (query) => {
    if (!approved) return showApproval();
    renderPill("Calling native endpoint…");
    try {
      const result = await rpc("tools/call", { name: "search_catalog", arguments: { meta: { "ucp-agent": { profile: agentProfile } }, catalog: { query, context: { address_country: "GB", language: "en-GB", currency: "GBP", intent: fullIntent() }, pagination: { limit: 30 } } } });
      const text = result?.content?.find((entry) => entry.type === "text")?.text;
      const payload = JSON.parse(text || "{}");
      products = (payload.products || []).filter((item) => matchesCategory(item, query));
      const ranked = products.map(analyse).sort((a, b) => b.score - a.score);
      renderPanel(query, ranked); personalized = true;
      document.documentElement.dataset.fashionPassportSummary = JSON.stringify({ protocol: "Shopify UCP/MCP", endpoint, scanned: ranked.length, recommended: ranked.filter((item) => item.score >= 82 && !item.blocked).length, hidden: ranked.filter((item) => item.blocked).length, query });
      renderPill(); showToast(`${ranked.length} real products ranked`);
    } catch (error) {
      renderPill("Connection needs retry"); showToast(`Could not read this catalogue: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  };

  const showToast = (message) => { document.querySelector(".fp-toast")?.remove(); const toast = document.createElement("div"); toast.className = "fp-toast"; toast.textContent = `✓ ${message}`; document.documentElement.appendChild(toast); window.setTimeout(() => toast.remove(), 3200); };

  const syncPassportApp = async () => {
    const connected = localStorage.getItem("fashion-passport:connected") === "true";
    approved = connected;
    await chrome.storage.local.set({ [approvalKey]: connected });
  };

  const init = async () => {
    if (document.querySelector('meta[name="fashion-passport-app"]')) {
      await syncPassportApp();
      document.addEventListener("fashion-passport:connection-changed", syncPassportApp);
      return;
    }
    const compatible = await probe();
    if (!compatible) return;
    retailerName = merchantName();
    const saved = await chrome.storage.local.get([approvalKey, signalKey]); approved = saved[approvalKey] === true; learnedSignals = Array.isArray(saved[signalKey]) ? saved[signalKey] : [];
    document.documentElement.dataset.fashionPassportCompatible = "true";
    document.documentElement.dataset.fashionPassportEndpoint = endpoint;
    document.documentElement.dataset.fashionPassportApproved = String(approved);
    document.dispatchEvent(new Event("fashion-passport:compatibility"));
    root = document.createElement("div"); root.id = "fashion-passport-extension-root"; document.documentElement.appendChild(root); renderPill();
  };

  document.addEventListener("fashion-passport:agent-action", () => {
    let action = {}; try { action = JSON.parse(document.documentElement.dataset.fashionPassportAction || "{}"); } catch { /* Ignore invalid page data. */ }
    if (action.action === "request-approval") showApproval();
    if (action.action === "personalize") searchCatalogue(action.request || queryFromPage());
  });
  init();
})();
