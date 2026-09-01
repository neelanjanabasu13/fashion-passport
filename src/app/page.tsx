"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { DressArt } from "@/components/dress-art";
import { Icon } from "@/components/icons";
import { demoProfile, retailers, tasteProducts } from "@/lib/data";
import { rankProducts } from "@/lib/scoring";
import type { Product, Retailer, ScoredProduct } from "@/lib/types";

const STORE_CONNECTED = "fashion-passport:connected";
const STORE_ONBOARDED = "fashion-passport:onboarded";
const STORE_SIGNALS = "fashion-passport:learned-avoid";

type View = "shop" | "passport" | "taste" | "privacy";
type Reaction = "up" | "down";

function retailerKind(retailer: Retailer) {
  return retailer.kind === "shopify" ? "Native Shopify UCP" : "Retailer catalogue";
}

function ProductCard({ item, reaction, onReact }: { item: ScoredProduct; reaction?: Reaction; onReact: (item: ScoredProduct, reaction: Reaction) => void }) {
  const topReasons = item.reasons.filter((reason) => reason.kind !== "warning").slice(0, 3);
  const warning = item.reasons.find((reason) => reason.kind === "warning");
  return (
    <article className={`product-card ${item.blocked ? "blocked" : ""}`} data-product-id={item.id}>
      <div className="product-visual">
        {item.imageUrl ? <Image className="real-product-image" src={item.imageUrl} alt={`${item.name} at ${item.brand}`} fill sizes="(max-width: 700px) 92vw, (max-width: 1000px) 45vw, 22vw" /> : <DressArt product={item} />}
        {item.score > 0 && <div className={`match-badge ${item.score >= 90 ? "best" : ""}`}><strong>{item.score}%</strong><span>match</span></div>}
        <div className="reaction-row" aria-label={`Give feedback on ${item.name}`}>
          <button className={reaction === "down" ? "active" : ""} onClick={() => onReact(item, "down")} aria-label="Show me less like this"><Icon name="thumbsDown" /></button>
          <button className={reaction === "up" ? "active positive" : ""} onClick={() => onReact(item, "up")} aria-label="Show me more like this"><Icon name="thumbsUp" /></button>
        </div>
      </div>
      <div className="product-copy">
        <div className="brand-line"><span>{item.brand}</span><strong>£{item.price}</strong></div>
        <h3>{item.name}</h3>
        <ul className="reason-list">
          {topReasons.map((reason) => <li key={reason.label}><Icon name="check" />{reason.label}</li>)}
          {warning && <li className="warning"><span>!</span>{warning.label}</li>}
        </ul>
        {item.productUrl ? <a className="view-item" href={item.productUrl} target="_blank" rel="noreferrer">View real item <Icon name="external" /></a> : <button className="view-item">View item <Icon name="arrow" /></button>}
      </div>
    </article>
  );
}

function ApprovalModal({ onApprove, onClose }: { onApprove: () => void; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="approval-modal" role="dialog" aria-modal="true" aria-labelledby="approval-title">
        <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        <div className="approval-icon"><Icon name="passport" /></div>
        <p className="eyebrow">One-time permission</p>
        <h2 id="approval-title">Connect your Passport once?</h2>
        <p className="modal-lede">This single approval lets Fashion Passport apply your profile when you search compatible Shopify fashion stores. It will not ask again for every shop, category or query. Browsing history stays here.</p>
        <div className="share-preview">
          <div><span>Size & fit</span><strong>UK 10 · 163 cm</strong></div>
          <div><span>Style context</span><strong>Deep Winter · Inverted triangle</strong></div>
          <div><span>Taste & limits</span><strong>Colours, cuts, fabric · £100 max</strong></div>
        </div>
        <div className="local-note"><Icon name="shield" /><span><strong>Your signals stay local.</strong> Likes, skips and browsing behaviour remain in this browser.</span></div>
        <button className="primary-button wide" onClick={onApprove}>Connect my Passport once<Icon name="arrow" /></button>
        <button className="text-button" onClick={onClose}>Not now</button>
      </section>
    </div>
  );
}

function PassportView() {
  const groups = [
    ["Colour", ["Deep Winter", "Red", "Burnt orange", "Jewel tones", "Dark pink", "Camel"]],
    ["Shape & fit", ["Inverted triangle", "Flowy", "A-line", "Fit and flare", "Midi"]],
    ["Details", ["Square neck", "Boat neck", "Scoop neck", "Long sleeve", "Sleeveless"]],
    ["Fabric & print", ["Silk", "Pure cotton", "Linen", "Chiffon", "Ditsy", "Gingham", "Plaid"]],
  ] as const;
  return (
    <main className="secondary-page">
      <div className="page-heading"><p className="eyebrow">Your portable context</p><h1>One passport. Every shop.</h1><p>What suits you and what you actually like, kept separate so your taste always wins.</p></div>
      <div className="passport-layout">
        <aside className="passport-card">
          <div className="passport-watermark">FP</div><Icon name="passport" className="passport-mark" />
          <p>Fashion Passport</p><h2>Demo shopper</h2>
          <dl><div><dt>Home</dt><dd>United Kingdom</dd></div><div><dt>Size</dt><dd>UK 10</dd></div><div><dt>Height</dt><dd>163 cm</dd></div></dl>
          <div className="passport-status"><span></span>Private & ready</div>
        </aside>
        <section className="profile-groups">
          {groups.map(([title, values]) => <div className="profile-group" key={title}><div className="profile-title"><h3>{title}</h3><button>Edit</button></div><div className="tag-cloud">{values.map((value, index) => <span className={index === 0 ? "theory-tag" : ""} key={value}>{value}{index > 0 && <small>♥</small>}</span>)}</div></div>)}
          <div className="override-callout"><Icon name="sparkle" /><div><strong>Your taste outranks the rulebook</strong><p>Burnt orange, terracotta and camel stay prioritised because you love them—even when colour theory disagrees.</p></div></div>
          <div className="avoid-row"><strong>Always avoid</strong><div>{["Polyester", "Boxy", "Cowl neck", "Olive", "Grey", "Taupe"].map(x => <span key={x}>− {x}</span>)}</div></div>
        </section>
      </div>
    </main>
  );
}

function TasteView({ onDone }: { onDone: () => void }) {
  const choices = tasteProducts;
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem("fashion-passport:taste-onboarding") || "[]") as { productId: string }[];
        setIndex(Math.min(saved.length, choices.length));
      } catch { /* Start at the first distinct preference card. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [choices.length]);
  const current = choices[index];
  const react = (reaction: Reaction) => {
    if (!current) return;
    const saved = JSON.parse(localStorage.getItem("fashion-passport:taste-onboarding") || "[]") as { productId: string; reaction: Reaction }[];
    localStorage.setItem("fashion-passport:taste-onboarding", JSON.stringify([...saved.filter((item) => item.productId !== current.id), { productId: current.id, reaction }]));
    setIndex((n) => n + 1);
  };
  return (
    <main className="taste-page">
      <div className="page-heading compact"><p className="eyebrow">Abstract preference study</p><h1>Teach it by reacting.</h1><p>These are deliberately neutral garment sketches—not retailer products—so you can react to shape, neckline and pattern without brand or price getting in the way.</p></div>
      <section className="taste-stage">
        <div className="progress-meta"><span>{Math.min(index + 1, choices.length)} of {choices.length}</span><span>No repeats</span></div>
        <div className="progress-line"><span style={{ width: `${Math.min(100, (index / choices.length) * 100)}%` }} /></div>
        {current ? <>
          <div className="taste-card" key={current.id}><DressArt product={current} /><div className="taste-caption"><strong>{current.silhouette}</strong><span>{current.neckline} neck · {current.pattern}</span></div></div>
          <div className="taste-actions"><button onClick={() => react("down")} aria-label="Not for me"><Icon name="thumbsDown" /><span>Not me</span></button><button className="love" onClick={() => react("up")} aria-label="Love it"><Icon name="thumbsUp" /><span>Love it</span></button></div>
          <p className="microcopy">One tap stores the signal locally. This sketch will not appear again.</p>
        </> : <div className="taste-complete"><div className="approval-icon"><Icon name="check" /></div><h2>Taste pass complete</h2><p>Twelve distinct reactions have been saved locally and are ready to influence ranking.</p><button className="primary-button" onClick={onDone}>See my matches <Icon name="arrow" /></button></div>}
      </section>
    </main>
  );
}

function PrivacyView({ connected, onRevoke }: { connected: boolean; onRevoke: () => void }) {
  return (
    <main className="secondary-page privacy-page">
      <div className="page-heading"><p className="eyebrow">Privacy by default</p><h1>You carry the Passport.<br/>It doesn’t carry you.</h1><p>You connect once, can pause it anywhere, and can disconnect it here.</p></div>
      <div className="privacy-grid">
        <section className="privacy-principles">
          <article><Icon name="shield"/><div><h3>Photos disappear</h3><p>Uploads are processed temporarily. Only the colour season or body-shape result is retained.</p></div><span>Always on</span></article>
          <article><Icon name="lock"/><div><h3>Learning stays here</h3><p>Browsing, likes and skips are stored in this browser. Cross-device sync is off.</p></div><span>Local</span></article>
          <article><Icon name="passport"/><div><h3>One clear connection</h3><p>Approve Fashion Passport once, then use it across compatible stores without repetitive prompts.</p></div><span>Once</span></article>
        </section>
        <section className="access-panel"><div><p className="eyebrow">Passport connection</p><h2>{connected ? "Connected once" : "Not connected"}</h2></div>{connected ? <div className="access-row"><div className="retailer-avatar">FP</div><div><strong>Compatible Shopify fashion</strong><span>Profile on search · browsing local</span></div><button onClick={onRevoke}>Disconnect</button></div> : <p className="empty-access">Your Passport is still private.</p>}</section>
      </div>
    </main>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("taste");
  const [retailerId, setRetailerId] = useState("all");
  const [connected, setConnected] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [learnedAvoid, setLearnedAvoid] = useState<string[]>([]);
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [passportOn, setPassportOn] = useState(true);
  const [showBlocked, setShowBlocked] = useState(false);
  const [query, setQuery] = useState("Find me a colourful work dress under £100");
  const [notice, setNotice] = useState("");
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [catalogueState, setCatalogueState] = useState<"idle" | "loading" | "connected" | "error">("idle");
  const [catalogueError, setCatalogueError] = useState("");
  const [liveAt, setLiveAt] = useState("");
  const [searchStats, setSearchStats] = useState({ storesQueried: 0, storesResponding: 0, candidatesConsidered: 0 });
  const stateRef = useRef({ retailerId, connected, learnedAvoid, liveProducts });

  useEffect(() => {
    stateRef.current = { retailerId, connected, learnedAvoid, liveProducts };
  }, [retailerId, connected, learnedAvoid, liveProducts]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setConnected(localStorage.getItem(STORE_CONNECTED) === "true");
        setView(localStorage.getItem(STORE_ONBOARDED) === "true" ? "shop" : "taste");
        setLearnedAvoid(JSON.parse(localStorage.getItem(STORE_SIGNALS) || "[]"));
      } catch { /* A fresh local profile is safe fallback. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const retailer = retailers.find((item) => item.id === retailerId);
  const ranked = useMemo(() => rankProducts(retailerId === "all" ? liveProducts : liveProducts.filter((product) => product.retailerId === retailerId), demoProfile, learnedAvoid), [liveProducts, retailerId, learnedAvoid]);
  const visible = (passportOn && connected ? ranked.filter((item) => showBlocked || !item.blocked) : ranked.map((item) => ({ ...item, score: 0 }))).slice(0, 30);
  const hiddenCount = passportOn && connected ? ranked.filter((item) => item.blocked).length : 0;

  const loadCatalogue = async (requestText: string) => {
    setCatalogueState("loading"); setCatalogueError(""); setLiveProducts([]); setShowBlocked(false);
    try {
      const response = await fetch("/api/shopify/search-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: requestText, sharePassport: true }),
      });
      const payload = await response.json() as { error?: string; products?: Product[]; liveAt?: string; storesQueried?: number; storesResponding?: number; candidatesConsidered?: number };
      if (!response.ok) throw new Error(payload.error || "The Shopify network did not respond");
      const nextProducts = payload.products || [];
      setLiveProducts(nextProducts); setRetailerId("all"); setLiveAt(payload.liveAt || new Date().toISOString()); setCatalogueState("connected");
      setSearchStats({ storesQueried: payload.storesQueried || retailers.length, storesResponding: payload.storesResponding || 0, candidatesConsidered: payload.candidatesConsidered || nextProducts.length });
      setNotice(`${nextProducts.length} category-correct products considered across ${payload.storesResponding || 0} stores`); setTimeout(() => setNotice(""), 2600);
      return nextProducts;
    } catch (error) {
      setCatalogueState("error"); setCatalogueError(error instanceof Error ? error.message : "Live Shopify search failed");
      return [];
    }
  };

  useEffect(() => {
    if (!document.modelContext) return;
    const controller = new AbortController();
    const register = async () => {
      const tools = [
        {
          name: "get_fashion_passport", title: "Read Fashion Passport",
          description: "Returns the shopper's stable fashion profile, including size, budget, colour season, body shape, loved and avoided garment attributes. Use before fashion search or ranking.",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: true },
          execute: async () => ({ ...demoProfile, privacy: { photosRetained: false, browsingSignals: "local-only", connection: "one-time global user approval" } }),
        },
        {
          name: "find_personal_matches", title: "Find Personal Matches",
          description: "Searches every verified live Shopify UCP catalogue with one request and returns a cross-store personal ranking. Explicit preferences overrule styling theory.",
          inputSchema: { type: "object", properties: { request: { type: "string", description: "What the shopper is looking for" } }, required: ["request"], additionalProperties: false },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: async (input: Record<string, unknown>) => {
            if (!stateRef.current.connected) return { status: "approval_required", instruction: "Ask the shopper to connect Fashion Passport once in the visible interface." };
            const response = await fetch("/api/shopify/search-all", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: input.request, sharePassport: true }) });
            const payload = await response.json() as { error?: string; products?: Product[]; liveAt?: string; storesQueried?: number; storesResponding?: number };
            if (!response.ok) return { status: "network_unavailable", error: payload.error };
            const nextProducts = payload.products || [];
            setRetailerId("all"); setLiveProducts(nextProducts); setLiveAt(payload.liveAt || new Date().toISOString()); setCatalogueState("connected");
            return { status: "connected", protocol: "Shopify UCP/MCP", storesQueried: payload.storesQueried, storesResponding: payload.storesResponding, request: input.request, matches: rankProducts(nextProducts, demoProfile, stateRef.current.learnedAvoid).slice(0, 10).map(({ id, retailerId, name, brand, price, score, productUrl, reasons }) => ({ id, retailer: retailers.find((item) => item.id === retailerId)?.name, name, brand, price, score, productUrl, reasons: reasons.slice(0, 4).map(r => r.label) })) };
          },
        },
        {
          name: "compare_shopify_stores", title: "Compare Shopify Stores",
          description: "After the single Passport connection, runs one request across every verified retailer through the same Shopify UCP adapter and returns one ranking.",
          inputSchema: { type: "object", properties: { request: { type: "string", description: "What the shopper wants to find across stores" } }, required: ["request"], additionalProperties: false },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: async (input: Record<string, unknown>) => {
            const request = typeof input.request === "string" ? input.request.trim().slice(0, 240) : "";
            const destinations = stateRef.current.connected ? retailers : [];
            if (!destinations.length) return { status: "approval_required", instruction: "Ask the shopper to connect Fashion Passport once in the visible interface." };
            const responses = await Promise.all(destinations.map(async (destination) => {
              try {
                const response = await fetch("/api/shopify/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ retailerId: destination.id, query: request, sharePassport: true }) });
                const payload = await response.json() as { error?: string; products?: Product[]; liveAt?: string };
                return response.ok ? { destination, products: payload.products || [], liveAt: payload.liveAt } : { destination, products: [] as Product[], error: payload.error };
              } catch (error) {
                return { destination, products: [] as Product[], error: error instanceof Error ? error.message : "Retailer unavailable" };
              }
            }));
            const matches = rankProducts(responses.flatMap((result) => result.products), demoProfile, stateRef.current.learnedAvoid).slice(0, 10);
            return {
              status: matches.length ? "connected" : "no_results",
              protocol: "Shopify UCP/MCP",
              request,
              storesQueried: destinations.length,
              storesResponding: responses.filter((result) => result.products.length).length,
              errors: responses.filter((result) => result.error).map((result) => ({ retailer: result.destination.name, error: result.error })),
              matches: matches.map(({ id, retailerId, name, brand, price, score, productUrl, reasons }) => ({ id, retailer: retailers.find((item) => item.id === retailerId)?.name, name, brand, price, score, productUrl, reasons: reasons.slice(0, 4).map((reason) => reason.label) })),
            };
          },
        },
        {
          name: "request_passport_connection", title: "Request Passport Connection",
          description: "Opens the single visible consent screen for Fashion Passport. This never connects silently; the shopper must approve in the interface.",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          execute: async () => {
            setShowApproval(true);
            return { status: "awaiting_user_approval", scope: "compatible Shopify fashion stores" };
          },
        },
        {
          name: "record_style_signal", title: "Record Style Signal",
          description: "Records a thumbs-up or thumbs-down for a product in local browser memory so future rankings adapt without a questionnaire.",
          inputSchema: { type: "object", properties: { productId: { type: "string" }, reaction: { type: "string", enum: ["up", "down"] } }, required: ["productId", "reaction"], additionalProperties: false },
          execute: async (input: Record<string, unknown>) => {
            const item = stateRef.current.liveProducts.find((p) => p.id === input.productId);
            if (!item) return { status: "not_found" };
            setReactions((current) => ({ ...current, [item.id]: input.reaction as Reaction }));
            if (input.reaction === "down") {
              const next = Array.from(new Set([...stateRef.current.learnedAvoid, item.neckline]));
              setLearnedAvoid(next); localStorage.setItem(STORE_SIGNALS, JSON.stringify(next));
            }
            return { status: "learned", storage: "local-browser", product: item.name };
          },
        },
      ];
      await Promise.all(tools.map((tool) => document.modelContext!.registerTool(tool, { signal: controller.signal }).catch(() => undefined)));
    };
    register();
    return () => controller.abort();
  }, []);

  const selectRetailer = (id: string) => { setRetailerId(id); setShowBlocked(false); };
  const connectPassport = () => {
    setConnected(true); localStorage.setItem(STORE_CONNECTED, "true");
    setShowApproval(false); setPassportOn(true); void loadCatalogue(query);
  };
  const reactTo = (item: ScoredProduct, reaction: Reaction) => {
    setReactions((current) => ({ ...current, [item.id]: reaction }));
    if (reaction === "down") {
      const next = Array.from(new Set([...learnedAvoid, item.neckline])); setLearnedAvoid(next); localStorage.setItem(STORE_SIGNALS, JSON.stringify(next));
      setNotice(`Got it — less ${item.neckline.toLowerCase()} necklines`);
    } else setNotice("Saved — more like this");
    setTimeout(() => setNotice(""), 2200);
  };
  const revoke = () => { setConnected(false); localStorage.removeItem(STORE_CONNECTED); setLiveProducts([]); setCatalogueState("idle"); };
  const finishOnboarding = () => { localStorage.setItem(STORE_ONBOARDED, "true"); setView("shop"); };

  return (
    <div className="app-shell">
      <header className="topbar"><button className="brand" onClick={() => setView("shop")}><span><Icon name="passport" /></span><strong>Fashion<br/>Passport</strong></button><nav>{(["shop", "passport", "taste", "privacy"] as View[]).map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item === "taste" ? "Teach my taste" : item[0].toUpperCase() + item.slice(1)}</button>)}</nav><div className="webmcp-pill"><i></i><span>WebMCP ready</span></div></header>
      {view === "passport" && <PassportView />}
      {view === "taste" && <TasteView onDone={finishOnboarding} />}
      {view === "privacy" && <PrivacyView connected={connected} onRevoke={revoke} />}
      {view === "shop" && <main className="shop-page">
        <section className="hero-copy"><p className="eyebrow"><Icon name="sparkle" /> One Passport across Shopify fashion</p><h1>Stop starting from scratch.</h1><p>One standard adapter carries your size, taste and suitability context into any compatible Shopify fashion store.</p>
          <div className="scale-proof"><strong>818,354</strong><span>estimated live Shopify apparel stores <a href="https://storeleads.app/reports/shopify/category/Apparel" target="_blank" rel="noreferrer">source · 28 Aug 2026</a></span><i></i><strong>1 adapter</strong><span>discovered at runtime</span></div>
          <form className="search-box" onSubmit={(e) => { e.preventDefault(); if (!connected) setShowApproval(true); else void loadCatalogue(query); }}><Icon name="search"/><input aria-label="What are you shopping for?" value={query} onChange={(e) => setQuery(e.target.value)} /><button disabled={catalogueState === "loading"}>{catalogueState === "loading" ? `Searching ${retailers.length} stores…` : "Find my matches"}<Icon name="arrow"/></button></form>
          <div className="query-chips"><span>Try</span>{["Summer wedding", "Casual cotton with sleeves", "Colourful work dress"].map((text) => <button key={text} onClick={() => setQuery(text)}>{text}</button>)}</div>
        </section>
        <aside className="surface-explainer"><Icon name="passport"/><div><strong>Two ways to use it</strong><span>This hub compares stores. To stay on a brand’s own website, load the extension, choose a store below and select “Use on real store”. The Passport panel appears there.</span></div></aside>
        <section className="storefront">
          <div className="retailer-strip"><div className="retailer-tabs"><button onClick={() => selectRetailer("all")} className={retailerId === "all" ? "active" : ""}><span>All {retailers.length} live stores</span><small>One cross-store search</small></button>{retailers.map((item) => <button key={item.id} onClick={() => selectRetailer(item.id)} className={retailerId === item.id ? "active" : ""}><span>{item.name}</span><small>Open UCP endpoint</small></button>)}</div>{retailer && <a href={retailer.url} target="_blank" rel="noreferrer">Use on real store <Icon name="external"/></a>}</div>
          <div className="store-heading"><div><div className="store-label"><span className="retailer-avatar">{retailer ? retailer.name.slice(0, 1) : "18"}</span><p>{retailer ? retailerKind(retailer) : "Cross-store Shopify UCP"}<strong>{retailer ? `${retailer.name} · filtered results` : `${retailers.length} verified fashion stores · one search`}</strong></p></div><div className={`native-status ${catalogueState}`}><i></i>{catalogueState === "connected" ? `${searchStats.storesResponding} live endpoints responded` : catalogueState === "loading" ? "Calling live endpoints" : catalogueState === "error" ? "Network needs retry" : `${retailers.length} official endpoints verified`}</div></div><div className={`passport-switch ${passportOn && connected ? "on" : ""}`}><div><Icon name="passport"/><span>Fashion Passport<strong>{connected ? (passportOn ? "Connected once" : "Paused") : "Not connected"}</strong></span></div>{connected ? <button role="switch" aria-checked={passportOn} onClick={() => setPassportOn(!passportOn)}><i/></button> : <button className="apply-small" onClick={() => setShowApproval(true)}>Connect once</button>}</div></div>
          {passportOn && connected ? <div className="applied-banner"><Icon name="check"/><span><strong>Passport connected once.</strong> It remains applied across shops, categories, queries and tab changes.</span><button onClick={() => setView("passport")}>See profile</button></div> : <div className="permission-banner"><Icon name="lock"/><span><strong>Your Passport is private.</strong> Connect it once for compatible Shopify fashion stores.</span><button onClick={() => setShowApproval(true)}>Connect once <Icon name="arrow"/></button></div>}
          {ranked.length ? <>
            <div className="search-evidence"><strong>{searchStats.candidatesConsidered}</strong><span>category-correct products considered</span><strong>{searchStats.storesResponding}</strong><span>live stores responded</span><strong>{visible.length}</strong><span>best matches shown</span></div>
            <div className="catalogue-toolbar"><p><strong>{visible.length}</strong> top matches for “{query}” {retailer ? `at ${retailer.name}` : `across ${searchStats.storesResponding} stores`}</p><div><span className="snapshot-date">Live via UCP · {liveAt ? new Date(liveAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "now"}</span><select aria-label="Sort products"><option>Best match</option><option>Price low to high</option></select></div></div>
            <div className="product-grid">{visible.map((item) => <ProductCard key={item.id} item={item} reaction={reactions[item.id]} onReact={reactTo}/>)}</div>
            {hiddenCount > 0 && !showBlocked && <button className="hidden-products" onClick={() => setShowBlocked(true)}><Icon name="shield"/><span><strong>{hiddenCount} unsuitable {hiddenCount === 1 ? "item" : "items"} hidden</strong>Wrong size, over budget or avoided material</span><span>Show anyway</span></button>}
          </> : <section className={`live-site-only ${catalogueState === "error" ? "has-error" : ""}`}><div className="live-site-icon"><Icon name={catalogueState === "error" ? "close" : "external"} /></div><p className="eyebrow">{catalogueState === "error" ? "Live connection needs another try" : "Retailer-owned products only"}</p><h2>{catalogueState === "error" ? catalogueError : `Search ${retailers.length} live fashion stores together.`}</h2><p>{catalogueState === "error" ? "No cached or invented products have replaced the retailer response." : "Connect once. Fashion Passport calls every verified retailer-owned Shopify endpoint, enforces the requested garment category, and shows the best 30—not a sea of irrelevant stock."}</p>{connected ? <button className="primary-button" onClick={() => void loadCatalogue(query)}>Search live stores <Icon name="arrow" /></button> : <button className="primary-button" onClick={() => setShowApproval(true)}>Connect once <Icon name="arrow" /></button>}<small>For the on-site experience, load the extension and open any compatible Shopify store.</small></section>}
        </section>
      </main>}
      <footer><span>Fashion Passport</span><p>Your taste travels. Your data doesn’t.</p><div>Built for the WebMCP Challenge · 2026</div></footer>
      {showApproval && <ApprovalModal onApprove={connectPassport} onClose={() => setShowApproval(false)}/>}
      {notice && <div className="toast"><Icon name="check"/>{notice}</div>}
    </div>
  );
}
