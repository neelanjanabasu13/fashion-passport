"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DressArt } from "@/components/dress-art";
import { Icon } from "@/components/icons";
import { demoProfile, products, retailers } from "@/lib/data";
import { rankProducts } from "@/lib/scoring";
import type { Retailer, ScoredProduct } from "@/lib/types";

const STORE_APPROVALS = "fashion-passport:retailer-approvals";
const STORE_SIGNALS = "fashion-passport:learned-avoid";

type View = "shop" | "passport" | "taste" | "privacy";
type Reaction = "up" | "down";

function retailerKind(retailer: Retailer) {
  if (retailer.kind === "shopify") return "Shopify + WebMCP";
  if (retailer.kind === "secondhand") return "Secondhand";
  return "Retailer catalogue";
}

function ProductCard({ item, reaction, onReact }: { item: ScoredProduct; reaction?: Reaction; onReact: (item: ScoredProduct, reaction: Reaction) => void }) {
  const topReasons = item.reasons.filter((reason) => reason.kind !== "warning").slice(0, 3);
  const warning = item.reasons.find((reason) => reason.kind === "warning");
  return (
    <article className={`product-card ${item.blocked ? "blocked" : ""}`} data-product-id={item.id}>
      <div className="product-visual">
        <DressArt product={item} />
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
        <button className="view-item">View item <Icon name="arrow" /></button>
      </div>
    </article>
  );
}

function ApprovalModal({ retailer, onApprove, onClose }: { retailer: Retailer; onApprove: () => void; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="approval-modal" role="dialog" aria-modal="true" aria-labelledby="approval-title">
        <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        <div className="approval-icon"><Icon name="passport" /></div>
        <p className="eyebrow">One-time permission</p>
        <h2 id="approval-title">Use your Passport on {retailer.name}?</h2>
        <p className="modal-lede">Fashion Passport will use your full profile to filter and rank this retailer. {retailer.name} does not receive your browsing history.</p>
        <div className="share-preview">
          <div><span>Size & fit</span><strong>UK 10 · 163 cm</strong></div>
          <div><span>Style context</span><strong>Deep Winter · Inverted triangle</strong></div>
          <div><span>Taste & limits</span><strong>Colours, cuts, fabric · £100 max</strong></div>
        </div>
        <div className="local-note"><Icon name="shield" /><span><strong>Your signals stay local.</strong> Likes, skips and browsing behaviour remain in this browser.</span></div>
        <button className="primary-button wide" onClick={onApprove}>Allow on {retailer.name}<Icon name="arrow" /></button>
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
  const choices = products.slice(0, 4);
  const [index, setIndex] = useState(0);
  const [rated, setRated] = useState(0);
  const current = choices[index % choices.length];
  const react = () => { setRated((n) => n + 1); setIndex((n) => n + 1); };
  return (
    <main className="taste-page">
      <div className="page-heading compact"><p className="eyebrow">No questionnaire</p><h1>Teach it by reacting.</h1><p>A few instinctive taps work better than asking you to describe your style.</p></div>
      <section className="taste-stage">
        <div className="progress-line"><span style={{ width: `${Math.min(100, rated * 20)}%` }} /></div>
        <div className="taste-card" key={`${current.id}-${index}`}><DressArt product={current} /><div className="taste-caption"><strong>{current.silhouette}</strong><span>{current.neckline} neck · {current.pattern}</span></div></div>
        <div className="taste-actions"><button onClick={react} aria-label="Not for me"><Icon name="thumbsDown" /><span>Not me</span></button><button className="love" onClick={react} aria-label="Love it"><Icon name="thumbsUp" /><span>Love it</span></button></div>
        <p className="microcopy">No typing. We learn the details in the background.</p>
        {rated >= 5 && <button className="primary-button" onClick={onDone}>See what I learned <Icon name="arrow" /></button>}
      </section>
    </main>
  );
}

function PrivacyView({ approvals, onRevoke }: { approvals: string[]; onRevoke: (id: string) => void }) {
  return (
    <main className="secondary-page privacy-page">
      <div className="page-heading"><p className="eyebrow">Privacy by default</p><h1>You carry the Passport.<br/>It doesn’t carry you.</h1><p>Nothing follows you to a new shop without your say-so.</p></div>
      <div className="privacy-grid">
        <section className="privacy-principles">
          <article><Icon name="shield"/><div><h3>Photos disappear</h3><p>Uploads are processed temporarily. Only the colour season or body-shape result is retained.</p></div><span>Always on</span></article>
          <article><Icon name="lock"/><div><h3>Learning stays here</h3><p>Browsing, likes and skips are stored in this browser. Cross-device sync is off.</p></div><span>Local</span></article>
          <article><Icon name="passport"/><div><h3>Permission per shop</h3><p>Every new retailer must be approved before your full Passport is applied.</p></div><span>Ask first</span></article>
        </section>
        <section className="access-panel"><div><p className="eyebrow">Retailer access</p><h2>{approvals.length} approved</h2></div>{approvals.length === 0 ? <p className="empty-access">No retailers have access yet.</p> : approvals.map((id) => { const retailer = retailers.find(r => r.id === id); return retailer ? <div className="access-row" key={id}><div className="retailer-avatar">{retailer.name.slice(0,1)}</div><div><strong>{retailer.name}</strong><span>Full Passport · browsing local</span></div><button onClick={() => onRevoke(id)}>Revoke</button></div> : null; })}</section>
      </div>
    </main>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("shop");
  const [retailerId, setRetailerId] = useState("asos");
  const [approved, setApproved] = useState<string[]>([]);
  const [approvalTarget, setApprovalTarget] = useState<Retailer | null>(null);
  const [learnedAvoid, setLearnedAvoid] = useState<string[]>([]);
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [passportOn, setPassportOn] = useState(true);
  const [showBlocked, setShowBlocked] = useState(false);
  const [query, setQuery] = useState("Find me a colourful work dress under £100");
  const [notice, setNotice] = useState("");
  const stateRef = useRef({ retailerId, approved, learnedAvoid });

  useEffect(() => {
    stateRef.current = { retailerId, approved, learnedAvoid };
  }, [retailerId, approved, learnedAvoid]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setApproved(JSON.parse(localStorage.getItem(STORE_APPROVALS) || "[]"));
        setLearnedAvoid(JSON.parse(localStorage.getItem(STORE_SIGNALS) || "[]"));
      } catch { /* A fresh local profile is safe fallback. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const retailer = retailers.find((item) => item.id === retailerId) || retailers[0];
  const isApproved = approved.includes(retailerId);
  const ranked = useMemo(() => {
    const baseItems = products.filter((product) => product.retailerId === retailerId);
    const expandedItems = baseItems.length >= 3 ? baseItems : [...baseItems, ...products.filter((p) => p.retailerId !== retailerId).slice(0, 4 - baseItems.length).map((p) => ({ ...p, id: `${retailerId}-${p.id}`, retailerId }))];
    return rankProducts(expandedItems, demoProfile, learnedAvoid);
  }, [retailerId, learnedAvoid]);
  const visible = passportOn && isApproved ? ranked.filter((item) => showBlocked || !item.blocked) : ranked.map((item) => ({ ...item, score: 0 }));
  const hiddenCount = passportOn && isApproved ? ranked.filter((item) => item.blocked).length : 0;

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
          execute: async () => ({ ...demoProfile, privacy: { photosRetained: false, browsingSignals: "local-only", retailerApprovalRequired: true } }),
        },
        {
          name: "find_personal_matches", title: "Find Personal Matches",
          description: "Ranks this demonstrator's fashion catalogue for the shopper. Explicit personal preferences always overrule colour-season or body-shape theory.",
          inputSchema: { type: "object", properties: { request: { type: "string", description: "What the shopper is looking for" }, retailer: { type: "string", enum: retailers.map((r) => r.id) } }, required: ["request"], additionalProperties: false },
          annotations: { readOnlyHint: true },
          execute: async (input: Record<string, unknown>) => {
            const selected = typeof input.retailer === "string" ? input.retailer : stateRef.current.retailerId;
            if (!stateRef.current.approved.includes(selected)) return { status: "approval_required", retailer: selected, instruction: "Ask the shopper to approve this retailer in the Fashion Passport interface." };
            return { request: input.request, matches: rankProducts(products.filter((p) => p.retailerId === selected), demoProfile, stateRef.current.learnedAvoid).slice(0, 5).map(({ id, name, brand, price, score, reasons }) => ({ id, name, brand, price, score, reasons: reasons.slice(0, 4).map(r => r.label) })) };
          },
        },
        {
          name: "request_retailer_access", title: "Request Retailer Access",
          description: "Opens the one-time consent screen for a retailer. This never grants access silently; the shopper must approve in the visible interface.",
          inputSchema: { type: "object", properties: { retailer: { type: "string", enum: retailers.map((r) => r.id) } }, required: ["retailer"], additionalProperties: false },
          execute: async (input: Record<string, unknown>) => {
            const target = retailers.find((r) => r.id === input.retailer);
            if (!target) return { status: "not_found" };
            setRetailerId(target.id); setApprovalTarget(target);
            return { status: "awaiting_user_approval", retailer: target.name };
          },
        },
        {
          name: "record_style_signal", title: "Record Style Signal",
          description: "Records a thumbs-up or thumbs-down for a product in local browser memory so future rankings adapt without a questionnaire.",
          inputSchema: { type: "object", properties: { productId: { type: "string" }, reaction: { type: "string", enum: ["up", "down"] } }, required: ["productId", "reaction"], additionalProperties: false },
          execute: async (input: Record<string, unknown>) => {
            const item = products.find((p) => p.id === input.productId);
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
  const approveRetailer = () => {
    if (!approvalTarget) return;
    const next = Array.from(new Set([...approved, approvalTarget.id]));
    setApproved(next); localStorage.setItem(STORE_APPROVALS, JSON.stringify(next));
    setApprovalTarget(null); setPassportOn(true); setNotice(`Passport applied to ${approvalTarget.name}`); setTimeout(() => setNotice(""), 2600);
  };
  const reactTo = (item: ScoredProduct, reaction: Reaction) => {
    setReactions((current) => ({ ...current, [item.id]: reaction }));
    if (reaction === "down") {
      const next = Array.from(new Set([...learnedAvoid, item.neckline])); setLearnedAvoid(next); localStorage.setItem(STORE_SIGNALS, JSON.stringify(next));
      setNotice(`Got it — less ${item.neckline.toLowerCase()} necklines`);
    } else setNotice("Saved — more like this");
    setTimeout(() => setNotice(""), 2200);
  };
  const revoke = (id: string) => { const next = approved.filter((item) => item !== id); setApproved(next); localStorage.setItem(STORE_APPROVALS, JSON.stringify(next)); };

  return (
    <div className="app-shell">
      <header className="topbar"><button className="brand" onClick={() => setView("shop")}><span><Icon name="passport" /></span><strong>Fashion<br/>Passport</strong></button><nav>{(["shop", "passport", "taste", "privacy"] as View[]).map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item === "taste" ? "Teach my taste" : item[0].toUpperCase() + item.slice(1)}</button>)}</nav><div className="webmcp-pill"><i></i><span>WebMCP ready</span></div></header>
      {view === "passport" && <PassportView />}
      {view === "taste" && <TasteView onDone={() => setView("shop")} />}
      {view === "privacy" && <PrivacyView approvals={approved} onRevoke={revoke} />}
      {view === "shop" && <main className="shop-page">
        <section className="hero-copy"><p className="eyebrow"><Icon name="sparkle" /> Shopping, with your context intact</p><h1>Stop starting from scratch.</h1><p>Your size, taste and what truly suits you—working together on every fashion site.</p>
          <form className="search-box" onSubmit={(e) => { e.preventDefault(); if (!isApproved) setApprovalTarget(retailer); else setNotice("Re-ranked for your request"); }}><Icon name="search"/><input aria-label="What are you shopping for?" value={query} onChange={(e) => setQuery(e.target.value)} /><button>Find my matches<Icon name="arrow"/></button></form>
          <div className="query-chips"><span>Try</span>{["Summer wedding", "Casual cotton with sleeves", "Colourful work dress"].map((text) => <button key={text} onClick={() => setQuery(text)}>{text}</button>)}</div>
        </section>
        <section className="storefront">
          <div className="retailer-strip"><div className="retailer-tabs">{retailers.map((item) => <button key={item.id} onClick={() => selectRetailer(item.id)} className={retailerId === item.id ? "active" : ""}><span>{item.name}</span>{item.kind === "shopify" && <small>Shopify</small>}</button>)}</div><a href={retailer.url} target="_blank" rel="noreferrer">Open real store <Icon name="external"/></a></div>
          <div className="store-heading"><div><div className="store-label"><span className="retailer-avatar">{retailer.name.slice(0, 1)}</span><p>{retailerKind(retailer)}<strong>{retailer.name} · Dresses</strong></p></div></div><div className={`passport-switch ${passportOn && isApproved ? "on" : ""}`}><div><Icon name="passport"/><span>Fashion Passport<strong>{isApproved ? (passportOn ? "Applied" : "Paused") : "Permission needed"}</strong></span></div>{isApproved ? <button role="switch" aria-checked={passportOn} onClick={() => setPassportOn(!passportOn)}><i/></button> : <button className="apply-small" onClick={() => setApprovalTarget(retailer)}>Review & apply</button>}</div></div>
          {passportOn && isApproved ? <div className="applied-banner"><Icon name="check"/><span><strong>Passport applied.</strong> UK 10 · under £100 · personalised to your colour, shape and taste</span><button onClick={() => setView("passport")}>See profile</button></div> : <div className="permission-banner"><Icon name="lock"/><span><strong>Your Passport is private.</strong> Approve {retailer.name} once to filter and rank this page.</span><button onClick={() => setApprovalTarget(retailer)}>Review & apply <Icon name="arrow"/></button></div>}
          <div className="catalogue-toolbar"><p><strong>{visible.length}</strong> dresses {passportOn && isApproved ? "picked for you" : "in the catalogue"}</p><div><button className="filter-button"><Icon name="sliders"/> Filters</button><select aria-label="Sort products"><option>Best match</option><option>Price low to high</option></select></div></div>
          <div className="product-grid">{visible.map((item) => <ProductCard key={item.id} item={item} reaction={reactions[item.id]} onReact={reactTo}/>)}</div>
          {hiddenCount > 0 && !showBlocked && <button className="hidden-products" onClick={() => setShowBlocked(true)}><Icon name="shield"/><span><strong>{hiddenCount} unsuitable {hiddenCount === 1 ? "item" : "items"} hidden</strong>Wrong size, over budget or avoided material</span><span>Show anyway</span></button>}
        </section>
      </main>}
      <footer><span>Fashion Passport</span><p>Your taste travels. Your data doesn’t.</p><div>Built for the WebMCP Challenge · 2026</div></footer>
      {approvalTarget && <ApprovalModal retailer={approvalTarget} onApprove={approveRetailer} onClose={() => setApprovalTarget(null)}/>} 
      {notice && <div className="toast"><Icon name="check"/>{notice}</div>}
    </div>
  );
}
