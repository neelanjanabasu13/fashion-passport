(() => {
  if (window.__fashionPassportWebMCPRegistered) return;
  window.__fashionPassportWebMCPRegistered = true;

  const profile = {
    country: "UK", size: "UK 10", heightCm: 163, budgetGbp: 100,
    colourSeason: "Deep Winter", bodyShape: "Inverted triangle",
    loves: {
      colours: ["red", "burnt orange", "terracotta", "jewel tones", "dark pink", "camel"],
      silhouettes: ["flowy", "a-line", "fit and flare"],
      necklines: ["square", "boat", "scoop"],
      materials: ["chiffon", "silk", "pure cotton", "linen"],
      length: ["midi"]
    },
    avoids: ["polyester", "boxy", "structured", "cowl", "cap sleeve", "olive", "grey", "taupe", "animal print"]
  };

  const approved = () => document.documentElement.dataset.fashionPassportApproved === "true";
  const requestAction = (action, detail = {}) => {
    document.dispatchEvent(new CustomEvent("fashion-passport:agent-action", { detail: { action, ...detail } }));
    return { status: "requested", action, retailer: location.hostname };
  };

  const register = async () => {
    if (!document.modelContext?.registerTool) return;
    const controller = new AbortController();
    window.addEventListener("pagehide", () => controller.abort(), { once: true });
    const tools = [
      {
        name: "get_fashion_passport",
        title: "Read Fashion Passport",
        description: "Returns the shopper's portable fashion profile after this retailer has been approved. Explicit taste overrides styling theory.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true },
        execute: async () => approved() ? { status: "approved", profile, privacy: { photosRetained: false, browsingSignals: "local-only" } } : { status: "approval_required", retailer: location.hostname }
      },
      {
        name: "apply_fashion_passport",
        title: "Apply Fashion Passport",
        description: "Requests visible user consent if needed, then filters and reranks the current retailer page using the shopper's Passport.",
        inputSchema: { type: "object", properties: { request: { type: "string", description: "Optional current shopping intent" } }, additionalProperties: false },
        execute: async (input) => requestAction(approved() ? "personalize" : "request-approval", { request: input.request || "" })
      },
      {
        name: "get_personalization_summary",
        title: "Get Personalization Summary",
        description: "Reports how many visible products were ranked, recommended or hidden by Fashion Passport on this page.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true },
        execute: async () => {
          let summary = {};
          try { summary = JSON.parse(document.documentElement.dataset.fashionPassportSummary || "{}"); } catch { /* No ranking has run yet. */ }
          return { status: approved() ? "applied" : "approval_required", retailer: location.hostname, ...summary };
        }
      }
    ];
    await Promise.all(tools.map((tool) => document.modelContext.registerTool(tool, { signal: controller.signal }).catch(() => undefined)));
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", register, { once: true }); else register();
})();
