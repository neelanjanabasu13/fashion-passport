"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { DressArt } from "@/components/dress-art";
import { Icon } from "@/components/icons";
import { BodyShapeVisual, ColourSignalVisual, PaletteVisual } from "@/components/profile-visuals";
import { demoProfile, retailers } from "@/lib/data";
import { analysisFit, rankProducts } from "@/lib/scoring";
import { inferColourSeason, theoryFor } from "@/lib/style-theory";
import type { FashionProfile, Product, Retailer, ScoredProduct } from "@/lib/types";

const STORE_CONNECTED = "fashion-passport:connected";
const STORE_ONBOARDED = "fashion-passport:onboarded-v2";
const STORE_SIGNALS = "fashion-passport:learned-avoid";
const STORE_PROFILE = "fashion-passport:profile";
const STORE_TASTE_VOTES = "fashion-passport:taste-votes";

type View = "travel" | "shop" | "passport" | "taste" | "privacy";
type Reaction = "up" | "down";
const TASTE_TARGET = 20;

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

function ApprovalModal({ profile, onApprove, onClose }: { profile: FashionProfile; onApprove: () => void; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="approval-modal" role="dialog" aria-modal="true" aria-labelledby="approval-title">
        <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        <div className="approval-icon"><Icon name="passport" /></div>
        <p className="eyebrow">One-time permission</p>
        <h2 id="approval-title">Connect your Passport once?</h2>
        <p className="modal-lede">This single approval lets Fashion Passport apply your profile when you search compatible Shopify fashion stores. It will not ask again for every shop, category or query. Browsing history stays here.</p>
        <div className="share-preview">
          <div><span>Size & fit</span><strong>{profile.size} · {profile.heightCm} cm</strong></div>
          <div><span>Suitability guidance</span><strong>{profile.colourSeason} · {profile.bodyShape}</strong></div>
          <div><span>Taste & limits</span><strong>Personal choices · £{profile.budget} max</strong></div>
        </div>
        <div className="local-note"><Icon name="shield" /><span><strong>Your signals stay local.</strong> Likes, skips and browsing behaviour remain in this browser.</span></div>
        <button className="primary-button wide" onClick={onApprove}>Connect my Passport once<Icon name="arrow" /></button>
        <button className="text-button" onClick={onClose}>Not now</button>
      </section>
    </div>
  );
}

function PassportView({ profile, onRebuild }: { profile: FashionProfile; onRebuild: () => void }) {
  const theory = theoryFor(profile.colourSeason, profile.bodyShape);
  const preferenceGroups = [
    ["Colours I choose", profile.colours.love],
    ["Cuts I choose", [...profile.silhouettes.love, ...profile.necklines.love, ...profile.lengths.love]],
    ["Details I choose", [...profile.sleeves.love, ...profile.patterns.love]],
    ["Fabrics I choose", profile.materials.love],
  ] as const;
  return (
    <main className="secondary-page">
      <div className="page-heading"><p className="eyebrow">Womenswear Passport · Menswear coming soon</p><h1>What suits you.<br/>What you choose.</h1><p>Two distinct datasets travel together. Guidance helps when you are unsure; your stated taste wins whenever they disagree.</p></div>
      <div className="passport-layout">
        <aside className="passport-card">
          <div className="passport-watermark">FP</div><Icon name="passport" className="passport-mark" />
          <p>Fashion Passport</p><h2>{profile.label}</h2>
          <dl><div><dt>Home</dt><dd>{profile.country}</dd></div><div><dt>Size</dt><dd>{profile.size}</dd></div><div><dt>Height</dt><dd>{profile.heightCm} cm</dd></div></dl>
          <div className="passport-status"><span></span>Private & ready</div>
        </aside>
        <section className="profile-groups">
          <div className="profile-layer theory-layer"><div className="profile-title"><div><small>01 · GUIDANCE</small><h3>Likely to suit you</h3></div><button onClick={onRebuild}>Retake</button></div><p>Derived from your proportions, undertone, skin depth and contrast—not from what a model is wearing.</p><div className="theory-results"><span><strong>{profile.bodyShape}</strong> proportions</span><span><strong>{profile.colourSeason}</strong> colouring</span></div><div className="tag-cloud">{[...theory.colours, ...theory.silhouettes, ...theory.necklines].map((value) => <span className="theory-tag" key={value}>{value}</span>)}</div></div>
          <div className="layer-join"><span>+</span><strong>married to</strong></div>
          <div className="profile-layer preference-layer"><div className="profile-title"><div><small>02 · PERSONAL TASTE</small><h3>What you actually choose</h3></div><button onClick={onRebuild}>Teach more</button></div><p>Learned from real products across retailers. These choices overrule the guidance layer.</p></div>
          {preferenceGroups.map(([title, values]) => <div className="profile-group" key={title}><div className="profile-title"><h3>{title}</h3></div><div className="tag-cloud">{values.map((value) => <span key={value}>{value}<small>♥</small></span>)}</div></div>)}
          <div className="override-callout"><Icon name="sparkle" /><div><strong>Your taste outranks the guidance</strong><p>For example, burnt orange, terracotta and camel remain prioritised because you love them—even if your colour result suggests otherwise.</p></div></div>
          <div className="avoid-row"><strong>Always avoid</strong><div>{["Polyester", "Boxy", "Cowl neck", "Olive", "Grey", "Taupe"].map(x => <span key={x}>− {x}</span>)}</div></div>
        </section>
      </div>
    </main>
  );
}

function TravelView({ connected, onConnect, onCompare }: { connected: boolean; onConnect: () => void; onCompare: () => void }) {
  const [storeUrl, setStoreUrl] = useState("");
  const openStore = (event: FormEvent) => {
    event.preventDefault();
    try {
      const url = new URL(/^https?:\/\//i.test(storeUrl) ? storeUrl : `https://${storeUrl}`);
      if (url.protocol === "https:") window.open(url.href, "_blank", "noopener,noreferrer");
    } catch { /* Keep the user on the safe launcher. */ }
  };
  return (
    <main className="travel-page">
      <section className="travel-hero"><p className="eyebrow"><Icon name="sparkle"/> The actual Passport experience</p><h1>Take it with you.</h1><p>Open a compatible Shopify store. Fashion Passport discovers its official endpoint and applies the same size, taste and suitability profile on the retailer’s own website.</p>
        <div className={`travel-status ${connected ? "ready" : ""}`}><Icon name={connected ? "check" : "lock"}/><span><strong>{connected ? "Passport connected once" : "Connect once before travelling"}</strong>{connected ? "No new prompt when you change retailer, category, query or tab." : "One clear approval replaces repetitive retailer-by-retailer consent."}</span>{!connected && <button onClick={onConnect}>Connect once</button>}</div>
      </section>
      <section className="travel-demo">
        <div className="travel-demo-copy"><p className="eyebrow">The wow moment</p><h2>Jigsaw → Lucy & Yak.<br/>Same Passport.</h2><ol><li>Reload the unpacked extension once.</li><li>Open Jigsaw and use Fashion Passport on the live site.</li><li>Open Lucy & Yak. Your Passport is already there—no second approval.</li></ol><button className="text-button" onClick={onCompare}>Or compare all verified test stores →</button></div>
        <div className="travel-pair">{retailers.slice(0, 2).map((store, index) => <a key={store.id} href={store.url} target="_blank" rel="noreferrer"><span>{index + 1}</span><div><small>Open real retailer</small><strong>{store.name}</strong><em>{index === 0 ? "Passport appears" : "Already connected"}</em></div><Icon name="external"/></a>)}</div>
      </section>
      <section className="any-store"><div><p className="eyebrow">Not limited to a shortlist</p><h2>Try another Shopify fashion store</h2><p>The extension checks the store you choose at runtime. If it exposes the compatible catalogue tool, the Passport appears; if not, it stays out of the way.</p></div><form onSubmit={openStore}><input value={storeUrl} onChange={(event) => setStoreUrl(event.target.value)} placeholder="shop.example.com" aria-label="Shopify store URL"/><button>Travel there <Icon name="arrow"/></button></form></section>
      <section className="verified-destinations"><div><p className="eyebrow">Live test panel</p><h2>{retailers.length} destinations we directly checked</h2><span>These prove the adapter; they do not define its reach.</span></div><div>{retailers.map((store) => <a key={store.id} href={store.url} target="_blank" rel="noreferrer"><strong>{store.name}</strong><small>Official UCP endpoint verified</small><Icon name="external"/></a>)}</div></section>
    </main>
  );
}

function TasteView({ profile, onProfile, onDone }: { profile: FashionProfile; onProfile: (profile: FashionProfile) => void; onDone: () => void }) {
  const [stage, setStage] = useState<"intro" | "body" | "colour" | "result" | "taste">("intro");
  const [bodyShape, setBodyShape] = useState("");
  const [undertone, setUndertone] = useState("");
  const [depth, setDepth] = useState("");
  const [contrast, setContrast] = useState("");
  const [knownSeason, setKnownSeason] = useState("");
  const [choices, setChoices] = useState<Product[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState(0);
  const [theoryAligned, setTheoryAligned] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [broadened, setBroadened] = useState(false);
  const [reactionNote, setReactionNote] = useState("");
  const estimatedSeason = knownSeason || inferColourSeason(undertone, contrast, depth);
  const derivedProfile = { ...profile, colourSeason: estimatedSeason, bodyShape: bodyShape || profile.bodyShape };
  const applyGuidance = () => {
    onProfile(derivedProfile);
    localStorage.setItem(STORE_PROFILE, JSON.stringify(derivedProfile));
    document.dispatchEvent(new Event("fashion-passport:connection-changed"));
    setStage("result");
  };
  const startTaste = async () => {
    setStage("taste"); setLoading(true); setChoices([]); setIndex(0); setDislikes(0); setBroadened(false); setReactionNote("");
    try {
      const response = await fetch("/api/shopify/taste", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: derivedProfile }) });
      const payload = await response.json() as { products?: Product[]; sources?: number; theoryAligned?: number };
      const seen = new Set((JSON.parse(localStorage.getItem("fashion-passport:taste-onboarding") || "[]") as { productId: string }[]).map((item) => item.productId));
      setChoices((payload.products || []).filter((product) => !seen.has(product.id)));
      setSources(payload.sources || 0); setTheoryAligned(payload.theoryAligned || 0);
    } catch { setChoices([]); }
    finally { setLoading(false); }
  };
  const current = choices[index];
  const react = (reaction: Reaction) => {
    if (!current) return;
    const saved = JSON.parse(localStorage.getItem("fashion-passport:taste-onboarding") || "[]") as { productId: string; reaction: Reaction }[];
    localStorage.setItem("fashion-passport:taste-onboarding", JSON.stringify([...saved.filter((item) => item.productId !== current.id), { productId: current.id, reaction }]));
    const traits = [current.colour, current.silhouette, current.neckline, current.sleeve, current.pattern, current.material, current.length].filter((trait) => trait !== "Not stated");
    const votes = JSON.parse(localStorage.getItem(STORE_TASTE_VOTES) || "{}") as Record<string, { up: number; down: number }>;
    traits.forEach((trait) => { const tally = votes[trait] || { up: 0, down: 0 }; tally[reaction] += 1; votes[trait] = tally; });
    localStorage.setItem(STORE_TASTE_VOTES, JSON.stringify(votes));
    const signals = Object.entries(votes).flatMap(([trait, tally]) => tally.up - tally.down >= 2 ? [`love:${trait}`] : tally.down - tally.up >= 2 ? [`avoid:${trait}`] : []);
    localStorage.setItem(STORE_SIGNALS, JSON.stringify(signals));
    const nextDislikes = dislikes + (reaction === "down" ? 1 : 0);
    const nextTotal = index + 1;
    setDislikes(nextDislikes);
    if (!broadened && nextTotal >= 6 && nextDislikes / nextTotal > 0.5) {
      setBroadened(true);
      setChoices((deck) => {
        const seen = deck.slice(0, nextTotal); const remaining = deck.slice(nextTotal);
        return [...seen, ...remaining.sort((a, b) => analysisFit(a, derivedProfile).score - analysisFit(b, derivedProfile).score)];
      });
      setReactionNote("Your taste is overruling the analysis, so the next choices will deliberately broaden beyond it.");
    } else {
      const fitsTheory = analysisFit(current, derivedProfile).score > 0;
      setReactionNote(reaction === "down" && fitsTheory ? "Got it. Your preference overrides this suitability suggestion." : reaction === "up" ? "Saved. We wait for a repeated pattern before changing your profile." : "Saved. One dislike will not blacklist every feature on this item.");
    }
    setIndex((n) => n + 1);
  };
  const bodyOptions = [
    ["Inverted triangle", "Shoulders are wider than hips"], ["Pear", "Hips are wider than shoulders"],
    ["Hourglass", "Shoulders and hips balance; waist is defined"], ["Rectangle", "Shoulders and hips balance; waist is subtle"],
    ["Apple", "Midsection is the fullest point"],
  ];
  const theory = theoryFor(derivedProfile.colourSeason, derivedProfile.bodyShape);
  const currentFit = current ? analysisFit(current, derivedProfile) : { score: 0, matches: [] };
  return (
    <main className="onboarding-page">
      <div className="onboarding-progress"><span className={stage !== "intro" ? "done" : "active"}>1 · You</span><span className={["colour", "result", "taste"].includes(stage) ? "done" : stage === "body" ? "active" : ""}>2 · Shape</span><span className={["result", "taste"].includes(stage) ? "done" : stage === "colour" ? "active" : ""}>3 · Colour</span><span className={stage === "taste" ? "active" : ""}>4 · Taste</span></div>
      {stage === "intro" && <section className="onboarding-panel intro-panel"><p className="eyebrow">Your Passport in under 2 minutes</p><h1>First, what may suit you.<br/>Then, what you love.</h1><p>We estimate a useful starting point from your proportions, undertone, skin depth and contrast. Then real-product reactions teach your taste. If the two disagree, your preference wins.</p><div className="scope-choice"><button onClick={() => setStage("body")}><span>Available now</span><strong>Womenswear</strong><small>Build my Passport →</small></button><button disabled><span>Coming soon</span><strong>Menswear</strong><small>The same portable profile model</small></button></div><div className="two-layer-proof"><div><strong>01</strong><span>Suitability guidance<small>Body + colouring</small></span></div><b>+</b><div><strong>02</strong><span>Personal preference<small>Real-product reactions</small></span></div><b>=</b><div><strong>FP</strong><span>Your ranking<small>Preference can overrule</small></span></div></div></section>}
      {stage === "body" && <section className="onboarding-panel question-panel"><p className="eyebrow">About 20 seconds</p><h2>Which shape looks most like your proportions?</h2><p>Start with the visual relationship between shoulders, waist and hips. The text underneath makes the distinction precise.</p><div className="answer-grid body-answers">{bodyOptions.map(([value, label]) => <button className={bodyShape === value ? "selected" : ""} key={value} onClick={() => setBodyShape(value)}><BodyShapeVisual shape={value}/><span className="body-answer-copy"><strong>{value}</strong><small>{label}</small></span></button>)}</div>{bodyShape && <div className="guidance-preview"><BodyShapeVisual shape={bodyShape} compact/><span><strong>Usually worth trying first</strong>{theoryFor(profile.colourSeason, bodyShape).silhouettes.join(", ")} shapes · {theoryFor(profile.colourSeason, bodyShape).necklines.join(", ")} necklines · {theoryFor(profile.colourSeason, bodyShape).materials.join(", ")} fabrics</span></div>}<div className="step-actions"><button className="text-button" onClick={() => setStage("intro")}>← Back</button><button className="primary-button" disabled={!bodyShape} onClick={() => setStage("colour")}>Next: colouring <Icon name="arrow"/></button></div></section>}
      {stage === "colour" && <section className="onboarding-panel question-panel colour-panel"><p className="eyebrow">About 35 seconds</p><h2>Find your colour starting point</h2><p>Look first, then use the short description to choose. These signals are more useful together than skin colour alone.</p><div className="colour-questions"><fieldset><legend>Undertone</legend><small>Which metal-and-neutral pairing tends to make your skin look clearer?</small><div>{[["cool","Silver + optic white"],["warm","Gold + cream"],["neutral","Both / not sure"]].map(([value,label]) => <button type="button" className={undertone === value ? "selected" : ""} key={value} onClick={() => setUndertone(value)}><ColourSignalVisual group="undertone" value={value}/><span>{label}</span></button>)}</div></fieldset><fieldset><legend>Skin depth</legend><small>Choose the closest visual depth; this does not decide your undertone.</small><div>{[["light","Fair / light"],["medium","Medium / olive"],["deep","Deep"]].map(([value,label]) => <button type="button" className={depth === value ? "selected" : ""} key={value} onClick={() => setDepth(value)}><ColourSignalVisual group="depth" value={value}/><span>{label}</span></button>)}</div></fieldset><fieldset><legend>Natural contrast</legend><small>Look at the visual difference between hair, eyes and skin.</small><div>{[["high","High / striking"],["soft","Soft / blended"],["clear","Clear / bright"]].map(([value,label]) => <button type="button" className={contrast === value ? "selected" : ""} key={value} onClick={() => setContrast(value)}><ColourSignalVisual group="contrast" value={value}/><span>{label}</span></button>)}</div></fieldset></div><label className="known-season">Already know your season?<select value={knownSeason} onChange={(event) => setKnownSeason(event.target.value)}><option value="">Let Passport estimate</option>{["Deep Winter","Soft Summer","Warm Spring","Deep Autumn"].map((season) => <option key={season}>{season}</option>)}</select></label>{undertone && depth && contrast && <div className="guidance-preview colour-preview"><PaletteVisual colours={theoryFor(estimatedSeason, bodyShape || profile.bodyShape).colours}/><span><strong>{estimatedSeason} starting palette</strong>{theoryFor(estimatedSeason, bodyShape || profile.bodyShape).colours.join(", ")} are usually stronger starting points.</span></div>}<div className="step-actions"><button className="text-button" onClick={() => setStage("body")}>← Back</button><button className="primary-button" disabled={!undertone || !depth || !contrast} onClick={applyGuidance}>See my foundation <Icon name="arrow"/></button></div></section>}
      {stage === "result" && <section className="onboarding-panel result-panel"><p className="eyebrow">Your suitability foundation</p><h2>A starting point—not a rulebook.</h2><div className="foundation-results"><article><BodyShapeVisual shape={derivedProfile.bodyShape} compact/><span>Body proportions</span><strong>{derivedProfile.bodyShape}</strong><p>Try first: {theory.silhouettes.join(", ").toLowerCase()} shapes; {theory.necklines.join(", ").toLowerCase()} necklines; {theory.sleeves.join(", ").toLowerCase()} sleeves; {theory.lengths.join(", ").toLowerCase()} lengths; {theory.materials.join(", ").toLowerCase()} fabrics.</p></article><article><PaletteVisual colours={theory.colours}/><span>Colour direction</span><strong>{derivedProfile.colourSeason}</strong><p>Colours likely to be stronger starting points: {theory.colours.join(", ").toLowerCase()}.</p></article></div><div className="override-callout"><Icon name="sparkle"/><div><strong>You remain in charge</strong><p>The next products primarily follow this analysis. If you dislike more than half, the deck automatically broadens and lets your taste overrule it.</p></div></div><div className="step-actions"><button className="text-button" onClick={() => setStage("colour")}>Adjust answers</button><button className="primary-button" onClick={() => void startTaste()}>Now teach my taste <Icon name="arrow"/></button></div></section>}
      {stage === "taste" && <><div className="page-heading compact"><p className="eyebrow">{broadened ? "Taste-led mode" : "Analysis-led mode"} · {sources || "multiple"} live retailers</p><h1>Now make it yours.</h1><p>Twenty rapid reactions reveal patterns across colour, silhouette, neckline, sleeve, length, fabric and print. The first deck follows your analysis; it broadens automatically only if you reject more than half.</p></div><section className="taste-stage">
        <div className="deck-status"><strong>{broadened ? "Your taste has overruled the analysis" : `${theoryAligned} analysis-aligned products found`}</strong><span>{broadened ? "Showing wider choices now" : "Prioritising these before exploration"}</span></div>
        <div className="progress-meta"><span>{loading ? "Building your analysis-led deck" : `${Math.min(index + 1, choices.length)} of ${choices.length} available`}</span><span>{Math.min(index, TASTE_TARGET)} / {TASTE_TARGET} signals</span></div>
        <div className="progress-line"><span style={{ width: `${Math.min(100, (index / TASTE_TARGET) * 100)}%` }} /></div>
        {loading ? <div className="taste-loading">Matching live products to your body and colour analysis…</div> : current ? <>
          <div className="taste-card" key={current.id}>{current.imageUrl && <Image className="taste-real-image" src={current.imageUrl} alt={current.name} fill sizes="340px" />}<div className="taste-caption"><strong>{current.brand}</strong><span>{current.name}</span></div></div>
          {currentFit.score > 0 && <div className="theory-nudge"><Icon name="sparkle"/><span><strong>{currentFit.score} analysis {currentFit.score === 1 ? "match" : "matches"}</strong>{currentFit.matches.slice(0, 3).join(" · ")}</span></div>}
          <div className="taste-actions"><button onClick={() => react("down")} aria-label="Not for me"><Icon name="thumbsDown" /><span>Not me</span></button><button className="love" onClick={() => react("up")} aria-label="Love it"><Icon name="thumbsUp" /><span>Love it</span></button></div>
          <p className="microcopy">{reactionNote || "Stored locally. This real product will not appear again."}</p>
          {index >= TASTE_TARGET && <button className="primary-button taste-finish" onClick={onDone}>Finish my Passport <Icon name="arrow"/></button>}
        </> : <div className="taste-complete"><div className="approval-icon"><Icon name="check" /></div><h2>Your Passport is ready</h2><p>Your suitability foundation and preference patterns are saved locally and ready to travel.</p><button className="primary-button" onClick={onDone}>Take my Passport shopping <Icon name="arrow" /></button></div>}
      </section></>}
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
  const [profile, setProfile] = useState<FashionProfile>(demoProfile);
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
  const stateRef = useRef({ retailerId, connected, learnedAvoid, liveProducts, profile });

  useEffect(() => {
    stateRef.current = { retailerId, connected, learnedAvoid, liveProducts, profile };
  }, [retailerId, connected, learnedAvoid, liveProducts, profile]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setConnected(localStorage.getItem(STORE_CONNECTED) === "true");
        setView(localStorage.getItem(STORE_ONBOARDED) === "true" ? "travel" : "taste");
        setLearnedAvoid(JSON.parse(localStorage.getItem(STORE_SIGNALS) || "[]"));
        const savedProfile = localStorage.getItem(STORE_PROFILE);
        if (savedProfile) setProfile(JSON.parse(savedProfile));
      } catch { /* A fresh local profile is safe fallback. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const retailer = retailers.find((item) => item.id === retailerId);
  const ranked = useMemo(() => rankProducts(retailerId === "all" ? liveProducts : liveProducts.filter((product) => product.retailerId === retailerId), profile, learnedAvoid), [liveProducts, retailerId, learnedAvoid, profile]);
  const visible = (passportOn && connected ? ranked.filter((item) => showBlocked || !item.blocked) : ranked.map((item) => ({ ...item, score: 0 }))).slice(0, 30);
  const hiddenCount = passportOn && connected ? ranked.filter((item) => item.blocked).length : 0;

  const loadCatalogue = async (requestText: string) => {
    setCatalogueState("loading"); setCatalogueError(""); setLiveProducts([]); setShowBlocked(false);
    try {
      const response = await fetch("/api/shopify/search-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: requestText, sharePassport: true, profile }),
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
          execute: async () => ({ ...stateRef.current.profile, profileLayers: { guidance: "body proportions + colour analysis", preference: "explicit taste; overrides guidance" }, privacy: { photosRetained: false, browsingSignals: "local-only", connection: "one-time global user approval" } }),
        },
        {
          name: "find_personal_matches", title: "Find Personal Matches",
          description: "Searches every verified live Shopify UCP catalogue with one request and returns a cross-store personal ranking. Explicit preferences overrule styling theory.",
          inputSchema: { type: "object", properties: { request: { type: "string", description: "What the shopper is looking for" } }, required: ["request"], additionalProperties: false },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: async (input: Record<string, unknown>) => {
            if (!stateRef.current.connected) return { status: "approval_required", instruction: "Ask the shopper to connect Fashion Passport once in the visible interface." };
            const response = await fetch("/api/shopify/search-all", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: input.request, sharePassport: true, profile: stateRef.current.profile }) });
            const payload = await response.json() as { error?: string; products?: Product[]; liveAt?: string; storesQueried?: number; storesResponding?: number };
            if (!response.ok) return { status: "network_unavailable", error: payload.error };
            const nextProducts = payload.products || [];
            setRetailerId("all"); setLiveProducts(nextProducts); setLiveAt(payload.liveAt || new Date().toISOString()); setCatalogueState("connected");
            return { status: "connected", protocol: "Shopify UCP/MCP", storesQueried: payload.storesQueried, storesResponding: payload.storesResponding, request: input.request, matches: rankProducts(nextProducts, stateRef.current.profile, stateRef.current.learnedAvoid).slice(0, 10).map(({ id, retailerId, name, brand, price, score, productUrl, reasons }) => ({ id, retailer: retailers.find((item) => item.id === retailerId)?.name, name, brand, price, score, productUrl, reasons: reasons.slice(0, 4).map(r => r.label) })) };
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
                const response = await fetch("/api/shopify/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ retailerId: destination.id, query: request, sharePassport: true, profile: stateRef.current.profile }) });
                const payload = await response.json() as { error?: string; products?: Product[]; liveAt?: string };
                return response.ok ? { destination, products: payload.products || [], liveAt: payload.liveAt } : { destination, products: [] as Product[], error: payload.error };
              } catch (error) {
                return { destination, products: [] as Product[], error: error instanceof Error ? error.message : "Retailer unavailable" };
              }
            }));
            const matches = rankProducts(responses.flatMap((result) => result.products), stateRef.current.profile, stateRef.current.learnedAvoid).slice(0, 10);
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
    document.dispatchEvent(new Event("fashion-passport:connection-changed"));
    setShowApproval(false); setPassportOn(true); if (view === "shop") void loadCatalogue(query);
  };
  const reactTo = (item: ScoredProduct, reaction: Reaction) => {
    setReactions((current) => ({ ...current, [item.id]: reaction }));
    if (reaction === "down") {
      const next = Array.from(new Set([...learnedAvoid, item.neckline])); setLearnedAvoid(next); localStorage.setItem(STORE_SIGNALS, JSON.stringify(next));
      setNotice(`Got it — less ${item.neckline.toLowerCase()} necklines`);
    } else setNotice("Saved — more like this");
    setTimeout(() => setNotice(""), 2200);
  };
  const revoke = () => { setConnected(false); localStorage.removeItem(STORE_CONNECTED); document.dispatchEvent(new Event("fashion-passport:connection-changed")); setLiveProducts([]); setCatalogueState("idle"); };
  const finishOnboarding = () => { localStorage.setItem(STORE_ONBOARDED, "true"); try { setLearnedAvoid(JSON.parse(localStorage.getItem(STORE_SIGNALS) || "[]")); } catch { /* Keep the stable profile. */ } setView("travel"); };

  return (
    <div className="app-shell">
      <header className="topbar"><button className="brand" onClick={() => setView("travel")}><span><Icon name="passport" /></span><strong>Fashion<br/>Passport</strong></button><nav>{(["travel", "shop", "passport", "taste", "privacy"] as View[]).map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item === "shop" ? "Compare stores" : item === "taste" ? "Build my Passport" : item[0].toUpperCase() + item.slice(1)}</button>)}</nav><div className="webmcp-pill"><i></i><span>WebMCP ready</span></div></header>
      {view === "travel" && <TravelView connected={connected} onConnect={() => setShowApproval(true)} onCompare={() => setView("shop")}/>}
      {view === "passport" && <PassportView profile={profile} onRebuild={() => setView("taste")} />}
      {view === "taste" && <TasteView profile={profile} onProfile={setProfile} onDone={finishOnboarding} />}
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
      {showApproval && (
        <ApprovalModal profile={profile} onApprove={connectPassport} onClose={() => setShowApproval(false)}/>
      )}
      {notice && <div className="toast"><Icon name="check"/>{notice}</div>}
    </div>
  );
}
