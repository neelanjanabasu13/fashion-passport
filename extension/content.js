(() => {
  if (window.__fashionPassportContentLoaded) return;
  window.__fashionPassportContentLoaded = true;

  const host = location.hostname.replace(/^www\./, "");
  const retailerName = host.includes("asos") ? "ASOS" : host.includes("next") ? "Next" : host.includes("jigsaw") ? "Jigsaw" : host.includes("jovonna") ? "Jovonna" : host.includes("vinted") ? "Vinted" : host.includes("johnlewis") ? "John Lewis" : host;
  const approvalKey = `retailer:${host}:approved`;
  const profile = {
    size: "UK 10", budget: 100, season: "Deep Winter", shape: "Inverted triangle",
    love: ["red", "ruby", "burgundy", "pink", "jewel", "camel", "orange", "terracotta", "a-line", "fit and flare", "flowy", "square neck", "boat neck", "scoop neck", "midi", "silk", "linen", "cotton", "chiffon", "ditsy", "gingham", "plaid"],
    avoid: ["polyester", "boxy", "structured", "cowl", "cap sleeve", "olive", "grey", "gray", "taupe", "animal print", "leopard", "snake print"]
  };
  const selectors = {
    "asos.com": ["article[data-auto-id='productTile']", "[data-testid='product-card']"],
    "next.co.uk": ["[data-testid*='product-card']", "article"],
    "jigsaw-online.com": [".product-card", ".card-wrapper", ".grid__item"],
    "jovonnalondon.com": [".product-card", ".card-wrapper", ".grid__item"],
    "vinted.co.uk": ["[data-testid^='item-id']", "[data-testid*='feed-item']"],
    "johnlewis.com": ["[data-test='product-card']", "li[data-test='component-grid-column']", "article"]
  };
  let approved = false;
  let personalized = false;
  let root;

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  const money = (text) => { const match = text.match(/£\s?(\d+(?:\.\d{1,2})?)/); return match ? Number(match[1]) : null; };
  const analyse = (text) => {
    const haystack = text.toLowerCase();
    const loves = profile.love.filter((term) => haystack.includes(term));
    const avoids = profile.avoid.filter((term) => haystack.includes(term));
    const price = money(text);
    const overBudget = price !== null && price > profile.budget;
    const score = Math.max(18, Math.min(96, 66 + loves.length * 8 - avoids.length * 15 - (overBudget ? 25 : 0)));
    return { score, loves, avoids, overBudget };
  };
  const findCards = () => {
    const keys = Object.keys(selectors);
    const key = keys.find((candidate) => host.endsWith(candidate));
    if (!key) return [];
    for (const selector of selectors[key]) {
      const cards = Array.from(document.querySelectorAll(selector)).filter((card) => card.textContent.trim().length > 8);
      if (cards.length >= 2) return cards.slice(0, 60);
    }
    return [];
  };
  const clearRanking = () => {
    document.querySelectorAll("[data-fashion-passport-score]").forEach((card) => {
      card.style.order = ""; card.style.opacity = ""; card.style.display = "";
      delete card.dataset.fashionPassportScore;
      card.querySelector(":scope > .fashion-passport-match")?.remove();
    });
    personalized = false;
  };
  const personalize = () => {
    if (!approved) return showApproval();
    clearRanking();
    const cards = findCards();
    let hidden = 0;
    cards.forEach((card) => {
      const result = analyse(card.textContent || "");
      card.dataset.fashionPassportScore = String(result.score);
      card.style.position ||= "relative";
      card.style.order = String(100 - result.score);
      if (result.avoids.includes("polyester") || result.overBudget) { card.style.opacity = ".32"; hidden += 1; }
      const badge = document.createElement("div"); badge.className = "fashion-passport-match";
      badge.innerHTML = `<strong>${result.score}%</strong><span>${result.loves[0] ? escapeHtml(result.loves[0]) : "match"}</span>`;
      card.appendChild(badge);
    });
    personalized = true;
    document.documentElement.dataset.fashionPassportSummary = JSON.stringify({ scanned: cards.length, recommended: cards.filter((card) => Number(card.dataset.fashionPassportScore) >= 82).length, hidden });
    renderPill();
    showToast(cards.length ? `${cards.length} items ranked for you` : "Passport applied — open a product listing to rank items");
  };
  const renderPill = () => {
    if (!root) return;
    root.innerHTML = `<button class="fp-pill ${personalized ? "is-on" : ""}" aria-label="${personalized ? "Pause" : "Apply"} Fashion Passport"><span class="fp-icon">▣</span><span><small>Fashion Passport</small><strong>${personalized ? "Applied" : approved ? "Ready" : "Permission needed"}</strong></span><i></i></button>`;
    root.querySelector("button").addEventListener("click", () => personalized ? (clearRanking(), renderPill()) : approved ? personalize() : showApproval());
  };
  const showApproval = () => {
    document.getElementById("fashion-passport-consent")?.remove();
    const modal = document.createElement("div"); modal.id = "fashion-passport-consent";
    modal.innerHTML = `<div class="fp-consent-card"><button class="fp-close" aria-label="Close">×</button><div class="fp-passport">▣</div><p class="fp-kicker">One-time permission</p><h2>Use your Passport on ${escapeHtml(retailerName)}?</h2><p>Your full fashion profile will filter and rank this shop. Browsing signals remain local to your browser.</p><dl><div><dt>Size & fit</dt><dd>UK 10 · 163 cm</dd></div><div><dt>Style context</dt><dd>Deep Winter · Inverted triangle</dd></div><div><dt>Taste & limits</dt><dd>Colours, cuts, fabric · £100 max</dd></div></dl><button class="fp-allow">Allow on ${escapeHtml(retailerName)} →</button><button class="fp-not-now">Not now</button></div>`;
    document.documentElement.appendChild(modal);
    modal.querySelector(".fp-close").addEventListener("click", () => modal.remove());
    modal.querySelector(".fp-not-now").addEventListener("click", () => modal.remove());
    modal.querySelector(".fp-allow").addEventListener("click", async () => { approved = true; await chrome.storage.local.set({ [approvalKey]: true }); document.documentElement.dataset.fashionPassportApproved = "true"; modal.remove(); personalize(); });
  };
  const showToast = (message) => { const old = document.querySelector(".fp-toast"); old?.remove(); const toast = document.createElement("div"); toast.className = "fp-toast"; toast.textContent = `✓ ${message}`; document.documentElement.appendChild(toast); window.setTimeout(() => toast.remove(), 2800); };
  const init = async () => {
    const saved = await chrome.storage.local.get([approvalKey]); approved = saved[approvalKey] === true;
    document.documentElement.dataset.fashionPassportApproved = String(approved);
    root = document.createElement("div"); root.id = "fashion-passport-extension-root"; document.documentElement.appendChild(root); renderPill();
  };
  document.addEventListener("fashion-passport:agent-action", (event) => { const action = event.detail?.action; if (action === "request-approval") showApproval(); if (action === "personalize") personalize(); });
  init();
})();
