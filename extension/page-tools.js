(() => {
  if (window.__fashionPassportWebMCPListener) return;
  window.__fashionPassportWebMCPListener = true;

  const profile = {
    country: "UK", size: "UK 10", heightCm: 163, budgetGbp: 100,
    colourSeason: "Deep Winter", bodyShape: "Inverted triangle",
    loves: { colours: ["red", "burnt orange", "terracotta", "jewel tones", "dark pink", "camel"], silhouettes: ["flowy", "a-line", "fit and flare"], necklines: ["square", "boat", "scoop"], materials: ["chiffon", "silk", "pure cotton", "linen"], length: ["midi"] },
    avoids: ["polyester", "boxy", "structured", "cowl", "cap sleeve", "olive", "grey", "taupe", "animal print"]
  };
  let registered = false;
  const approved = () => document.documentElement.dataset.fashionPassportApproved === "true";
  const currentProfile = () => {
    try { return JSON.parse(document.documentElement.dataset.fashionPassportProfile || JSON.stringify(profile)); } catch { return profile; }
  };
  const requestAction = (action, payload = {}) => {
    delete document.documentElement.dataset.fashionPassportActionResult;
    document.documentElement.dataset.fashionPassportAction = JSON.stringify({ action, ...payload });
    document.dispatchEvent(new Event("fashion-passport:agent-action"));
    try {
      const result = JSON.parse(document.documentElement.dataset.fashionPassportActionResult || "null");
      if (result) return result;
    } catch { /* The visible action remains the fallback response. */ }
    return { status: "requested", action, retailer: location.hostname, endpoint: document.documentElement.dataset.fashionPassportEndpoint };
  };

  const register = async () => {
    if (registered || document.documentElement.dataset.fashionPassportCompatible !== "true" || !document.modelContext?.registerTool) return;
    registered = true;
    const controller = new AbortController(); window.addEventListener("pagehide", () => controller.abort(), { once: true });
    const tools = [
      {
        name: "get_fashion_passport", title: "Read Fashion Passport",
        description: "Returns the shopper's portable fashion profile after the one-time Fashion Passport connection, with explicit taste weighted above styling theory.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true },
        execute: async () => approved() ? { status: "connected", profile: currentProfile(), retailer: location.hostname, privacy: { photosRetained: false, browsingSignals: "local-only" } } : { status: "connection_required", retailer: location.hostname }
      },
      {
        name: "apply_fashion_passport", title: "Apply Fashion Passport to this Shopify store",
        description: "Requests visible consent if needed, then calls this retailer's official Shopify UCP catalogue and opens a ranked panel containing real current products.",
        inputSchema: { type: "object", properties: { request: { type: "string", description: "What the shopper wants to find at this retailer" } }, additionalProperties: false }, annotations: { untrustedContentHint: true },
        execute: async (input) => requestAction(approved() ? "personalize" : "request-approval", { request: input.request || "" })
      },
      {
        name: "update_fashion_passport", title: "Teach Fashion Passport",
        description: "Saves one explicit fashion preference, reranks open retailer results immediately and carries the updated Passport to other compatible stores.",
        inputSchema: {
          type: "object",
          properties: {
            dimension: { type: "string", enum: ["colour", "silhouette", "neckline", "sleeve", "length", "pattern", "material"], description: "The fashion trait being updated" },
            value: { type: "string", description: "The colour, cut, neckline, sleeve, length, pattern or material" },
            preference: { type: "string", enum: ["love", "avoid", "never"], description: "Love boosts, avoid demotes and never holds matching products" }
          },
          required: ["dimension", "value", "preference"], additionalProperties: false
        },
        execute: async (input) => requestAction(approved() ? "update-preference" : "request-approval", input)
      },
      {
        name: "get_personalization_summary", title: "Get live Shopify personalization summary",
        description: "Reports the native endpoint and how many real retailer products Fashion Passport ranked, recommended or held back.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true },
        execute: async () => { let summary = {}; try { summary = JSON.parse(document.documentElement.dataset.fashionPassportSummary || "{}"); } catch { /* No results yet. */ } return { status: approved() ? "applied" : "connection_required", retailer: location.hostname, ...summary }; }
      }
    ];
    await Promise.all(tools.map((tool) => document.modelContext.registerTool(tool, { signal: controller.signal }).catch(() => undefined)));
  };
  document.addEventListener("fashion-passport:compatibility", register);
  if (document.readyState !== "loading") register();
})();
