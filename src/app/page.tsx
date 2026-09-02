"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { DressArt } from "@/components/dress-art";
import { Icon } from "@/components/icons";
import { BodyShapeVisual, COLOUR_SWATCHES, ColourSignalVisual, PaletteVisual } from "@/components/profile-visuals";
import { demoProfile, retailers } from "@/lib/data";
import { analysisFit, partitionResults, rankProducts, scoreLabel } from "@/lib/scoring";
import { derivePreferences, emptyLearned, legacySignalsToPreferences, recordVote, traitKeysForProduct, undoVote } from "@/lib/learned";
import { SEASONS, theoryFor as seasonTheory } from "@/lib/style-theory";
import { FASHION_DIMENSIONS, VOCABULARY, pluralCategory, requestedCategory, type Dimension } from "@/lib/ontology";
import type { LearnedTaste, PreferenceGroup, PreferenceLevel } from "@/lib/types";
import { inferColourSeason, theoryFor } from "@/lib/style-theory";
import { readProfile } from "@/lib/profile";
import type { FashionProfile, Product, Retailer, ScoredProduct } from "@/lib/types";

const STORE_CONNECTED = "fashion-passport:connected";
const STORE_ONBOARDED = "fashion-passport:onboarded-v2";
const STORE_SIGNALS = "fashion-passport:learned-avoid";
const STORE_PROFILE = "fashion-passport:profile";
const STORE_TASTE_VOTES = "fashion-passport:taste-votes";

type View = "travel" | "shop" | "passport" | "taste" | "privacy";
type Reaction = "up" | "down";
const TASTE_TARGET = 20;
/** A render batch for performance. Never a recommendation cap. */
const RENDER_BATCH = 24;
type TierView = "strong" | "worth" | "all" | "held";

function retailerKind(retailer: Retailer) {
  return retailer.kind === "shopify" ? "Native Shopify UCP" : "Retailer catalogue";
}

function ProductCard({ item, reaction, onReact }: { item: ScoredProduct; reaction?: Reaction; onReact: (item: ScoredProduct, reaction: Reaction) => void }) {
  const positives = item.reasons.filter((reason) => reason.kind !== "warning").slice(0, 3);
  const held = item.state === "held";
  // Labels are used sparingly: only a strong match, a soft conflict, or a hard rule.
  const label = held ? "Held by rule" : item.state === "strong" ? "Strong match" : item.conflicts.length ? "With a note" : null;
  return (
    <article className={`product-card state-${item.state}`} data-product-id={item.id}>
      <div className="product-visual">
        {item.imageUrl ? <Image className="real-product-image" src={item.imageUrl} alt={`${item.name} at ${item.brand}`} fill sizes="(max-width: 700px) 92vw, (max-width: 1000px) 45vw, 22vw" /> : <DressArt product={item} />}
        {label && <span className={`state-label state-${item.state}`}>{label}</span>}
        {!held && item.evidenceConfidence !== "low" && <div className="match-badge"><strong>{item.matchScore}%</strong><span>match</span></div>}
        <div className="reaction-row" aria-label={`Teach the Passport about ${item.name}`}>
          <button className={reaction === "down" ? "active" : ""} onClick={() => onReact(item, "down")} aria-label={`Less like ${item.name}`} title="Less like this"><Icon name="thumbsDown" /></button>
          <button className={reaction === "up" ? "active positive" : ""} onClick={() => onReact(item, "up")} aria-label={`More like ${item.name}`} title="More like this"><Icon name="thumbsUp" /></button>
        </div>
      </div>
      <div className="product-copy">
        <div className="brand-line"><span>{item.brand}</span><strong>£{item.price}</strong></div>
        <h3>{item.name}</h3>
        {item.evidence.colour.value !== "Unknown" && <p className="variant-colour">{item.evidence.colour.value}{item.alternativeColours.length > 0 && <em> · also in {item.alternativeColours.slice(0, 3).join(", ").toLowerCase()}</em>}</p>}
        {item.evidenceConfidence === "low" && <p className="low-confidence">{scoreLabel(item)}</p>}
        <ul className="reason-list">
          {positives.map((reason) => <li key={reason.label}><Icon name="check" />{reason.label}</li>)}
          {item.conflicts.map((reason) => <li className="warning" key={reason.label}><span>!</span>{reason.label}</li>)}
          {held && item.hardRules.map((rule) => <li className="hard-rule" key={rule.label}><span>✕</span>{rule.label}</li>)}
        </ul>
        {item.productUrl ? <a className="view-item" href={item.productUrl} target="_blank" rel="noreferrer">View at {item.brand} <Icon name="external" /></a> : <button className="view-item">View item <Icon name="arrow" /></button>}
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

function PassportView({ profile, learned, onRebuild }: { profile: FashionProfile; learned: LearnedTaste; onRebuild: () => void }) {
  const theory = seasonTheory(profile.colourSeason, profile.bodyShape);
  const preferences = derivePreferences(learned);
  const groups: [string, PreferenceGroup][] = [
    ["Colours", profile.colours], ["Shapes", profile.silhouettes], ["Necklines", profile.necklines],
    ["Sleeves", profile.sleeves], ["Lengths", profile.lengths], ["Prints", profile.patterns], ["Fabrics", profile.materials],
  ];
  const stated = groups.filter(([, group]) => group.love.length + group.avoid.length + group.never.length > 0);
  const hardRules = groups.flatMap(([title, group]) => group.never.map((value) => ({ title, value })));
  return (
    <main className="secondary-page verdict-passport-page">
      <div className="page-heading"><p className="eyebrow">The verdict book · Womenswear</p><h1>What suits you <span className="heart-cross" role="img" aria-label="times"><svg viewBox="0 0 24 30" aria-hidden="true"><path d="M12 14C10 11 3 8 3 4.5 3 1.8 6.5.5 8.8 2.2 10.3 3.2 11.2 4.5 12 6c.8-1.5 1.7-2.8 3.2-3.8C17.5.5 21 1.8 21 4.5 21 8 14 11 12 14Z"/><path d="M12 16c2 3 9 6 9 9.5 0 2.7-3.5 4-5.8 2.3-1.5-1-2.4-2.3-3.2-3.8-.8 1.5-1.7 2.8-3.2 3.8C6.5 29.5 3 28.2 3 25.5 3 22 10 19 12 16Z"/></svg></span> what you love</h1><p>Your foundation, your choices and what Fashion Passport has learned—kept separate so you stay in control.</p></div>
      <div className="bound-book passport-bound-book">
        <div className="book-spine" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index}/>)}</div>
        <div className="passport-layout book-page">
        <aside className="passport-card">
          <div className="passport-watermark">FP</div><Icon name="passport" className="passport-mark" />
          <p>Fashion Passport</p><h2>{profile.label}</h2>
          <dl><div><dt>Home</dt><dd>{profile.country}</dd></div><div><dt>Size</dt><dd>{profile.size}</dd></div><div><dt>Height</dt><dd>{profile.heightCm} cm</dd></div><div><dt>Budget</dt><dd>£{profile.budget} {profile.budgetMode === "strict" ? "(strict)" : "(usual)"}</dd></div></dl>
          <div className="passport-status"><span></span>Private &amp; ready</div>
        </aside>
        <section className="profile-groups">

          <div className="profile-layer theory-layer">
            <div className="profile-title"><div><small>01 · FOUNDATION</small><h3>Likely to suit you</h3></div><button onClick={onRebuild}>Retake</button></div>
            <p>A starting point from your proportions and colouring. It is the weakest layer in every ranking.</p>
            <div className="theory-results">
              <span><strong>{profile.bodyShape}</strong> proportions</span>
              <span><strong>{profile.colourSeason}</strong> colouring</span>
            </div>
            <dl className="theory-detail">
              <div><dt>Shapes</dt><dd>{theory.silhouettes.join(", ") || "Not set"}</dd></div>
              <div><dt>Necklines</dt><dd>{theory.necklines.join(", ") || "Not set"}</dd></div>
              <div><dt>Sleeves &amp; lengths</dt><dd>{[...theory.sleeves, ...theory.lengths].join(", ") || "Not set"}</dd></div>
              <div><dt>Fabrics</dt><dd>{theory.materials.join(", ") || "Not set"}</dd></div>
              <div><dt>Palette</dt><dd className="palette-row">{theory.colours.map((colour) => <span key={colour}>{colour}</span>)}</dd></div>
            </dl>
          </div>

          <div className="layer-join"><span>+</span><strong>overruled by</strong></div>

          <div className="profile-layer preference-layer">
            <div className="profile-title"><div><small>02 · WHAT YOU CHOSE</small><h3>Your stated preferences</h3></div><button onClick={onRebuild}>Edit</button></div>
            <p>Set by you. These outrank the foundation whenever the two disagree.</p>
            {stated.length === 0 && <p className="empty-layer">Nothing stated yet. The taste pass will fill this in as you react.</p>}
            {stated.map(([title, group]) => (
              <div className="profile-group" key={title}>
                <div className="profile-title"><h3>{title}</h3></div>
                <div className="tag-cloud">
                  {group.love.map((value) => <span key={`love-${value}`}>{value}<small>♥</small></span>)}
                  {group.avoid.map((value) => <span className="tag-avoid" key={`avoid-${value}`}>− {value}</span>)}
                  {group.never.map((value) => <span className="tag-never" key={`never-${value}`}>✕ {value}</span>)}
                </div>
              </div>
            ))}
          </div>

          <div className="layer-join"><span>+</span><strong>sharpened by</strong></div>

          <div className="profile-layer learned-layer">
            <div className="profile-title"><div><small>03 · LEARNING AS YOU SHOP</small><h3>What your reactions taught it</h3></div></div>
            <p>Fashion Passport keeps learning as you shop. You do not need to maintain this profile.</p>
            {preferences.length === 0
              ? <p className="empty-layer">No pattern yet. A single reaction never creates a rule; it takes repeated evidence.</p>
              : <ul className="learned-list">{preferences.map((preference) => {
                  const [dimension, value] = preference.key.split(":");
                  return (
                    <li key={preference.key} className={preference.direction === "positive" ? "learned-up" : "learned-down"}>
                      <strong>{preference.direction === "positive" ? "More" : "Less"} {value}</strong>
                      <span>{dimension}</span>
                      <em>{Math.round(preference.confidence * 100)}% confidence · {preference.interactions} {preference.interactions === 1 ? "reaction" : "reactions"}</em>
                    </li>
                  );
                })}</ul>}
          </div>

          <div className="override-callout"><Icon name="sparkle" /><div><strong>Your taste outranks the rulebook.</strong><p>Where the foundation and your own choices disagree, your choices win. Learned signals refine the order; they never hide a product.</p></div></div>

          <div className="avoid-row">
            <strong>Held by your rules</strong>
            <div>{hardRules.length === 0 ? <span className="empty-rule">Nothing is hard-blocked. Only a Never sets a hard rule.</span> : hardRules.map(({ title, value }) => <span key={`${title}-${value}`}>✕ {value}</span>)}</div>
          </div>
        </section>
        </div>
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

/** The seven trait groups the shopper can set directly. Nothing here is compulsory. */
const PREFERENCE_STEPS: { dimension: Dimension; field: keyof FashionProfile; title: string; hint: string }[] = [
  { dimension: "colour", field: "colours", title: "Colours", hint: "Anything you reach for, or never wear." },
  { dimension: "silhouette", field: "silhouettes", title: "Shapes", hint: "How a garment sits on you." },
  { dimension: "neckline", field: "necklines", title: "Necklines", hint: "The line across your shoulders and chest." },
  { dimension: "sleeve", field: "sleeves", title: "Sleeves", hint: "Including straps and off-shoulder." },
  { dimension: "length", field: "lengths", title: "Lengths", hint: "Where a hem sits." },
  { dimension: "pattern", field: "patterns", title: "Prints", hint: "Scale matters more than motif." },
  { dimension: "material", field: "materials", title: "Fabrics", hint: "Never is the only level that hides a product." },
];

const LEVELS: { level: PreferenceLevel; label: string; help: string }[] = [
  { level: "love", label: "Love", help: "ranks higher" },
  { level: "avoid", label: "Avoid", help: "ranks lower, stays visible" },
  { level: "never", label: "Never", help: "held by your rules" },
];

function levelOf(group: PreferenceGroup, value: string): PreferenceLevel {
  if (group.never.includes(value)) return "never";
  if (group.avoid.includes(value)) return "avoid";
  if (group.love.includes(value)) return "love";
  return "neutral";
}

function withLevel(group: PreferenceGroup, value: string, level: PreferenceLevel): PreferenceGroup {
  const stripped: PreferenceGroup = {
    love: group.love.filter((entry) => entry !== value),
    avoid: group.avoid.filter((entry) => entry !== value),
    never: group.never.filter((entry) => entry !== value),
  };
  if (level === "neutral") return stripped;
  return { ...stripped, [level]: [...stripped[level], value] };
}

function PreferenceCards({ profile, onProfile, onDone, onBack }: { profile: FashionProfile; onProfile: (profile: FashionProfile) => void; onDone: () => void; onBack: () => void }) {
  const [step, setStep] = useState(0);
  const current = PREFERENCE_STEPS[step];
  const group = profile[current.field] as PreferenceGroup;
  const options = VOCABULARY[current.dimension].map(([label]) => label);
  const set = (value: string, level: PreferenceLevel) => {
    const next = { ...profile, [current.field]: withLevel(group, value, level) } as FashionProfile;
    onProfile(next);
    localStorage.setItem(STORE_PROFILE, JSON.stringify(next));
  };
  const chosen = group.love.length + group.avoid.length + group.never.length;
  return (
    <section className="onboarding-panel preference-panel">
      <p className="eyebrow">Optional · skip anything you have no view on</p>
      <h2>{current.title}</h2>
      <p>{current.hint}</p>
      <ul className="preference-cards">
        {options.map((value) => {
          const level = levelOf(group, value);
          return (
            <li key={value} className={`preference-card level-${level}`}>
              <span className="preference-name">{current.dimension === "colour" && <i className="colour-choice-swatch" style={{ background: COLOUR_SWATCHES[value] || "#7f2146" }} aria-hidden="true"/>}{value}</span>
              <span className="preference-levels" role="group" aria-label={`Set a preference for ${value}`}>
                {LEVELS.map((entry) => (
                  <button
                    key={entry.level}
                    type="button"
                    aria-pressed={level === entry.level}
                    className={level === entry.level ? "selected" : ""}
                    title={entry.help}
                    onClick={() => set(value, level === entry.level ? "neutral" : entry.level)}
                  >
                    {entry.label}
                  </button>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="preference-footer">
        <span className="preference-count">{chosen === 0 ? "Nothing set here yet, which is fine" : `${chosen} set`}</span>
        <div className="preference-actions">
          <button className="text-button" onClick={step === 0 ? onBack : () => setStep(step - 1)}>Back</button>
          <button className="text-button" onClick={step === PREFERENCE_STEPS.length - 1 ? onDone : () => setStep(step + 1)}>Skip</button>
          <button className="primary-button" onClick={step === PREFERENCE_STEPS.length - 1 ? onDone : () => setStep(step + 1)}>
            {step === PREFERENCE_STEPS.length - 1 ? "Start the taste pass" : "Next"} <Icon name="arrow" />
          </button>
        </div>
      </div>
      <div className="preference-progress" aria-hidden="true">
        {PREFERENCE_STEPS.map((entry, index) => <i key={entry.dimension} className={index <= step ? "done" : ""} />)}
      </div>
    </section>
  );
}

function TasteView({ profile, onProfile, onDone }: { profile: FashionProfile; onProfile: (profile: FashionProfile) => void; onDone: () => void }) {
  const [stage, setStage] = useState<"intro" | "body" | "colour" | "result" | "preferences" | "taste">("intro");
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
  const [lastReaction, setLastReaction] = useState<{ keys: string[]; reaction: Reaction; product: Product } | null>(null);
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
    // Every known trait on the product is recorded, so feedback is never
    // collapsed onto a single dimension.
    const keys = traitKeysForProduct(current.evidence as unknown as Record<string, { value: string }>);
    const stored = JSON.parse(localStorage.getItem(STORE_TASTE_VOTES) || "{}") as LearnedTaste;
    const updated = recordVote(stored, keys, reaction);
    localStorage.setItem(STORE_TASTE_VOTES, JSON.stringify(updated));
    setLastReaction({ keys, reaction, product: current });
    document.dispatchEvent(new Event("fashion-passport:learned-changed"));
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
  const fittingRoom = ["body", "colour", "taste"].includes(stage);
  const stageProgress: Record<typeof stage, number> = { intro: 8, body: 24, colour: 43, result: 57, preferences: 72, taste: 86 };
  const stageLabel: Record<typeof stage, string> = {
    intro: "The fitting room", body: "01 · Proportions", colour: "02 · Colouring",
    result: "Your foundation", preferences: "03 · Your choices", taste: "04 · Your actual taste",
  };
  return (
    <main className="onboarding-page verdict-onboarding">
      <section className="verdict-intro-copy">
        <p className="verdict-label">Body shape · colour theory · your actual taste</p>
        <h1>One fitting.<br/>Every shop.</h1>
        <p className="verdict-lede">Build a portable verdict from what is likely to suit you and what you genuinely love. Then carry it onto compatible fashion stores without starting again.</p>
        <dl className="verdict-proof"><div><dt>01</dt><dd>Suitability<small>Shape + colouring</small></dd></div><div><dt>02</dt><dd>Preference<small>Explicit + learned</small></dd></div><div><dt>03</dt><dd>Portable<small>One approval</small></dd></div></dl>
        <p className="verdict-meta">About 90 seconds · learning stays in this browser · menswear coming soon</p>
      </section>
      <section className="verdict-stage" data-room={fittingRoom ? "fitting" : "plain"}>
        <div className="book-spine" aria-hidden="true">{Array.from({ length: 7 }, (_, index) => <i key={index}/>)}</div>
        <div className="verdict-stage-page">
          <div className="verdict-stage-top"><p>{stageLabel[stage]}</p><span>{stage === "taste" ? `${Math.min(index, TASTE_TARGET)} of ${TASTE_TARGET} signals` : "Nothing leaves this browser"}</span></div>
          <div className="verdict-meter" aria-hidden="true"><i style={{ width: `${stage === "taste" ? Math.max(86, Math.min(100, 86 + (index / TASTE_TARGET) * 14)) : stageProgress[stage]}%` }}/></div>
      <div className="onboarding-progress"><span className={stage !== "intro" ? "done" : "active"}>1 · You</span><span className={["colour", "result", "taste"].includes(stage) ? "done" : stage === "body" ? "active" : ""}>2 · Shape</span><span className={["result", "taste"].includes(stage) ? "done" : stage === "colour" ? "active" : ""}>3 · Colour</span><span className={["preferences","taste"].includes(stage) ? "done" : ""}>4 · Preferences</span><span className={stage === "taste" ? "active" : ""}>5 · Taste</span></div>
      {stage === "intro" && <section className="onboarding-panel intro-panel"><p className="eyebrow">Your Passport in under 2 minutes</p><h1 className="intro-headline">What suits you <span className="heart-cross" role="img" aria-label="times"><svg viewBox="0 0 24 30" aria-hidden="true"><path d="M12 14C10 11 3 8 3 4.5 3 1.8 6.5.5 8.8 2.2 10.3 3.2 11.2 4.5 12 6c.8-1.5 1.7-2.8 3.2-3.8C17.5.5 21 1.8 21 4.5 21 8 14 11 12 14Z"/><path d="M12 16c2 3 9 6 9 9.5 0 2.7-3.5 4-5.8 2.3-1.5-1-2.4-2.3-3.2-3.8-.8 1.5-1.7 2.8-3.2 3.8C6.5 29.5 3 28.2 3 25.5 3 22 10 19 12 16Z"/></svg></span> what you love</h1><p>We estimate a useful starting point from your proportions, undertone, skin depth and contrast. Then real-product reactions teach your taste. If the two disagree, your preference wins.</p><div className="scope-choice"><button onClick={() => setStage("body")}><span>Available now</span><strong>Womenswear</strong><small>Build my Passport →</small></button><button disabled><span>Coming soon</span><strong>Menswear</strong><small>The same portable profile model</small></button></div><div className="two-layer-proof"><div><strong>01</strong><span>Suitability guidance<small>Body + colouring</small></span></div><b>+</b><div><strong>02</strong><span>Personal preference<small>Real-product reactions</small></span></div><b>=</b><div><strong>FP</strong><span>Your ranking<small>Preference can overrule</small></span></div></div></section>}
      {stage === "body" && <section className="onboarding-panel question-panel"><p className="eyebrow">About 20 seconds</p><h2>Which shape looks most like your proportions?</h2><p>Start with the visual relationship between shoulders, waist and hips. The text underneath makes the distinction precise.</p><div className="answer-grid body-answers">{bodyOptions.map(([value, label]) => <button className={bodyShape === value ? "selected" : ""} key={value} onClick={() => setBodyShape(value)}><BodyShapeVisual shape={value}/><span className="body-answer-copy"><strong>{value}</strong><small>{label}</small></span></button>)}</div>{bodyShape && <div className="guidance-preview"><BodyShapeVisual shape={bodyShape} compact/><span><strong>Usually worth trying first</strong>{theoryFor(profile.colourSeason, bodyShape).silhouettes.join(", ")} shapes · {theoryFor(profile.colourSeason, bodyShape).necklines.join(", ")} necklines · {theoryFor(profile.colourSeason, bodyShape).materials.join(", ")} fabrics</span></div>}<div className="step-actions"><button className="text-button" onClick={() => setStage("intro")}>← Back</button><button className="primary-button" disabled={!bodyShape} onClick={() => setStage("colour")}>Next: colouring <Icon name="arrow"/></button></div></section>}
      {stage === "colour" && <section className="onboarding-panel question-panel colour-panel"><p className="eyebrow">About 35 seconds</p><h2>Find your colour starting point</h2><p>Look first, then use the short description to choose. These signals are more useful together than skin colour alone.</p><div className="colour-questions"><fieldset><legend>Undertone</legend><small>Which metal-and-neutral pairing tends to make your skin look clearer?</small><div>{[["cool","Silver + optic white"],["warm","Gold + cream"],["neutral","Both / not sure"]].map(([value,label]) => <button type="button" className={undertone === value ? "selected" : ""} key={value} onClick={() => setUndertone(value)}><ColourSignalVisual group="undertone" value={value}/><span>{label}</span></button>)}</div></fieldset><fieldset><legend>Skin depth</legend><small>Choose the closest visual depth; this does not decide your undertone.</small><div>{[["light","Fair / light"],["medium","Medium / olive"],["deep","Deep"]].map(([value,label]) => <button type="button" className={depth === value ? "selected" : ""} key={value} onClick={() => setDepth(value)}><ColourSignalVisual group="depth" value={value}/><span>{label}</span></button>)}</div></fieldset><fieldset className="known-season"><legend>Already know your season?</legend><small>Skip the estimate and choose it directly. Leave this alone if you are not sure.</small><div><button type="button" className={knownSeason === "" ? "selected" : ""} onClick={() => setKnownSeason("")}>Not sure, estimate it</button>{SEASONS.map((season) => <button type="button" key={season} className={knownSeason === season ? "selected" : ""} onClick={() => setKnownSeason(season)}>{season}</button>)}</div></fieldset><fieldset><legend>Natural contrast</legend><small>Look at the visual difference between hair, eyes and skin.</small><div>{[["high","High / striking"],["soft","Soft / blended"],["clear","Clear / bright"]].map(([value,label]) => <button type="button" className={contrast === value ? "selected" : ""} key={value} onClick={() => setContrast(value)}><ColourSignalVisual group="contrast" value={value}/><span>{label}</span></button>)}</div></fieldset></div><label className="known-season">Already know your season?<select value={knownSeason} onChange={(event) => setKnownSeason(event.target.value)}><option value="">Let Passport estimate</option>{["Deep Winter","Soft Summer","Warm Spring","Deep Autumn"].map((season) => <option key={season}>{season}</option>)}</select></label>{undertone && depth && contrast && <div className="guidance-preview colour-preview"><PaletteVisual colours={theoryFor(estimatedSeason, bodyShape || profile.bodyShape).colours}/><span><strong>{estimatedSeason} starting palette</strong>{theoryFor(estimatedSeason, bodyShape || profile.bodyShape).colours.join(", ")} are usually stronger starting points.</span></div>}<div className="step-actions"><button className="text-button" onClick={() => setStage("body")}>← Back</button><button className="primary-button" disabled={!undertone || !depth || !contrast} onClick={applyGuidance}>See my foundation <Icon name="arrow"/></button></div></section>}
      {stage === "result" && <section className="onboarding-panel result-panel"><p className="eyebrow">Your suitability foundation</p><h2>A starting point—not a rulebook.</h2><div className="foundation-results"><article><BodyShapeVisual shape={derivedProfile.bodyShape} compact/><span>Body proportions</span><strong>{derivedProfile.bodyShape}</strong><p>Try first: {theory.silhouettes.join(", ").toLowerCase()} shapes; {theory.necklines.join(", ").toLowerCase()} necklines; {theory.sleeves.join(", ").toLowerCase()} sleeves; {theory.lengths.join(", ").toLowerCase()} lengths; {theory.materials.join(", ").toLowerCase()} fabrics.</p></article><article><PaletteVisual colours={theory.colours}/><span>Colour direction</span><strong>{derivedProfile.colourSeason}</strong><p>Colours likely to be stronger starting points: {theory.colours.join(", ").toLowerCase()}.</p></article></div><div className="override-callout"><Icon name="sparkle"/><div><strong>You remain in charge</strong><p>The next products primarily follow this analysis. If you dislike more than half, the deck automatically broadens and lets your taste overrule it.</p></div></div><div className="step-actions"><button className="text-button" onClick={() => setStage("colour")}>Adjust answers</button><button className="primary-button" onClick={() => setStage("preferences")}>Next: what you already know <Icon name="arrow"/></button></div></section>}
      {stage === "preferences" && <PreferenceCards profile={derivedProfile} onProfile={onProfile} onDone={startTaste} onBack={() => setStage("result")} />}
      {stage === "taste" && <><div className="page-heading compact"><p className="eyebrow">{broadened ? "Taste-led mode" : "Analysis-led mode"} · {sources || "multiple"} live retailers</p><h1>Now make it yours.</h1><p>Twenty rapid reactions reveal patterns across colour, silhouette, neckline, sleeve, length, fabric and print. The first deck follows your analysis; it broadens automatically only if you reject more than half.</p></div><section className="taste-stage">
        <div className="deck-status"><strong>{broadened ? "Your taste has overruled the analysis" : `${theoryAligned} analysis-aligned products found`}</strong><span>{broadened ? "Showing wider choices now" : "Prioritising these before exploration"}</span></div>
        <div className="progress-meta"><span>{loading ? "Building your analysis-led deck" : `${Math.min(index + 1, choices.length)} of ${choices.length} available`}</span><span>{Math.min(index, TASTE_TARGET)} / {TASTE_TARGET} signals</span></div>
        <div className="progress-line"><span style={{ width: `${Math.min(100, (index / TASTE_TARGET) * 100)}%` }} /></div>
        {loading ? <div className="taste-loading">Matching live products to your body and colour analysis…</div> : current ? <>
          <div className="taste-card" key={current.id}>{current.imageUrl && <Image className="taste-real-image" src={current.imageUrl} alt={current.name} fill sizes="340px" />}<div className="taste-caption"><strong>{current.brand}</strong><span>{current.name}</span></div></div>
          {currentFit.score > 0 && <div className="theory-nudge"><Icon name="sparkle"/><span><strong>{currentFit.score} analysis {currentFit.score === 1 ? "match" : "matches"}</strong>{currentFit.matches.slice(0, 3).join(" · ")}</span></div>}
          <div className="taste-actions"><button onClick={() => react("down")} aria-label="Not for me"><Icon name="thumbsDown" /><span>Not me</span></button><button className="love" onClick={() => react("up")} aria-label="Love it"><Icon name="thumbsUp" /><span>Love it</span></button></div>
          {lastReaction && (
            <div className="reason-prompt" role="status">
              <span>{lastReaction.reaction === "up" ? "What worked?" : "What put you off?"}</span>
              <div>
                {FASHION_DIMENSIONS.map((dimension) => {
                  const value = (lastReaction.product.evidence as Record<string, { value: string }>)[dimension]?.value;
                  if (!value || value === "Unknown") return null;
                  return (
                    <button
                      key={dimension}
                      type="button"
                      onClick={() => {
                        const stored = JSON.parse(localStorage.getItem(STORE_TASTE_VOTES) || "{}") as LearnedTaste;
                        // Reverse the broad signal, then re-apply it to the named trait only.
                        const narrowed = recordVote(undoVote(stored, lastReaction.keys, lastReaction.reaction), [`${dimension}:${value.toLowerCase()}`], lastReaction.reaction);
                        localStorage.setItem(STORE_TASTE_VOTES, JSON.stringify(narrowed));
                        document.dispatchEvent(new Event("fashion-passport:learned-changed"));
                        setReactionNote(`Noted: ${value.toLowerCase()} only.`);
                        setLastReaction(null);
                      }}
                    >
                      {value}
                    </button>
                  );
                })}
                <button type="button" className="reason-skip" onClick={() => setLastReaction(null)}>Skip</button>
              </div>
            </div>
          )}
          <p className="microcopy">{reactionNote || "Stored locally. This real product will not appear again."}</p>
          {index >= TASTE_TARGET && <button className="primary-button taste-finish" onClick={onDone}>Finish my Passport <Icon name="arrow"/></button>}
        </> : <div className="taste-complete"><div className="approval-icon"><Icon name="check" /></div><h2>Your Passport is ready</h2><p>Your suitability foundation and preference patterns are saved locally and ready to travel.</p><button className="primary-button" onClick={onDone}>Take my Passport shopping <Icon name="arrow" /></button></div>}
      </section></>}
        </div>
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
  const [profile, setProfile] = useState<FashionProfile>(demoProfile);
  const [showApproval, setShowApproval] = useState(false);
  const [learnedAvoid, setLearnedAvoid] = useState<string[]>([]);
  const [learnedTaste, setLearnedTaste] = useState<LearnedTaste>(emptyLearned());
  const [tier, setTier] = useState<TierView>("strong");
  const [shown, setShown] = useState(RENDER_BATCH);
  const [lastLearn, setLastLearn] = useState<{ keys: string[]; reaction: Reaction; label: string; moved: number } | null>(null);
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [passportOn, setPassportOn] = useState(true);
  const [query, setQuery] = useState("Find me a colourful work dress under £100");
  const [notice, setNotice] = useState("");
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [catalogueState, setCatalogueState] = useState<"idle" | "loading" | "connected" | "error">("idle");
  const [catalogueError, setCatalogueError] = useState("");
  const [liveAt, setLiveAt] = useState("");
  const [searchStats, setSearchStats] = useState({ storesQueried: 0, storesResponding: 0, catalogueScanned: 0, moreAvailable: false });
  const stateRef = useRef({ retailerId, connected, learnedAvoid, learnedTaste, liveProducts, profile });
  const reactionRef = useRef<((item: ScoredProduct, reaction: Reaction) => { keys: string[]; moved: number; label: string; learned: LearnedTaste } | null) | null>(null);

  useEffect(() => {
    stateRef.current = { retailerId, connected, learnedAvoid, learnedTaste, liveProducts, profile };
  }, [retailerId, connected, learnedAvoid, learnedTaste, liveProducts, profile]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setConnected(localStorage.getItem(STORE_CONNECTED) === "true");
        setView(localStorage.getItem(STORE_ONBOARDED) === "true" ? "travel" : "taste");
        setLearnedAvoid(JSON.parse(localStorage.getItem(STORE_SIGNALS) || "[]"));
        setLearnedTaste(JSON.parse(localStorage.getItem(STORE_TASTE_VOTES) || "{}") as LearnedTaste);
        setProfile(readProfile(localStorage.getItem(STORE_PROFILE), demoProfile));
      } catch { /* A fresh local profile is safe fallback. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const sync = () => {
      try {
        setLearnedTaste(JSON.parse(localStorage.getItem(STORE_TASTE_VOTES) || "{}") as LearnedTaste);
      } catch {
        setLearnedTaste(emptyLearned());
      }
    };
    document.addEventListener("fashion-passport:learned-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      document.removeEventListener("fashion-passport:learned-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const retailer = retailers.find((item) => item.id === retailerId);
  const ranked = useMemo(() => rankProducts(retailerId === "all" ? liveProducts : liveProducts.filter((product) => product.retailerId === retailerId), { profile, query, learned: [...derivePreferences(learnedTaste), ...legacySignalsToPreferences(learnedAvoid)] }), [liveProducts, retailerId, learnedAvoid, learnedTaste, profile, query]);
  const applied = passportOn && connected;
  // One partition feeds every visible figure, so the counts always add up.
  const partition = useMemo(() => partitionResults(searchStats.catalogueScanned, ranked, query), [ranked, query, searchStats.catalogueScanned]);
  const counts = partition.counts;
  // Default to Strong matches whenever at least one exists, without writing
  // state from an effect.
  const activeTier: TierView = tier === "strong" && counts.strong === 0 && counts.worth > 0 ? "worth" : tier;
  const tierItems = useMemo(() => {
    if (!applied) return [...partition.inCategory, ...partition.unknownCategory];
    // Wrong-category products are gated out at Stage 1. They are not held by
    // any rule the shopper set, so they appear in no tier and no count.
    if (activeTier === "held") return partition.inCategory.filter((item) => item.state === "held");
    if (activeTier === "all") return [...partition.inCategory.filter((item) => item.state !== "held"), ...partition.unknownCategory];
    return partition.inCategory.filter((item) => item.state === activeTier);
  }, [partition, activeTier, applied]);
  // A render batch only. Every qualifying product stays reachable below.
  const visible = tierItems.slice(0, shown);
  const remaining = Math.max(0, tierItems.length - visible.length);
  const requested = requestedCategory(query);



  const loadCatalogue = async (requestText: string) => {
    setShown(RENDER_BATCH);
    setCatalogueState("loading"); setCatalogueError(""); setLiveProducts([]);
    try {
      const response = await fetch("/api/shopify/search-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: requestText, sharePassport: true, profile }),
      });
      const payload = await response.json() as { error?: string; products?: Product[]; liveAt?: string; storesQueried?: number; storesResponding?: number; catalogueScanned?: number; moreAvailable?: boolean };
      if (!response.ok) throw new Error(payload.error || "The Shopify network did not respond");
      const nextProducts = payload.products || [];
      setLiveProducts(nextProducts); setRetailerId("all"); setLiveAt(payload.liveAt || new Date().toISOString()); setCatalogueState("connected");
      setSearchStats({ storesQueried: payload.storesQueried || 0, storesResponding: payload.storesResponding || 0, catalogueScanned: payload.catalogueScanned || 0, moreAvailable: Boolean(payload.moreAvailable) });
      setNotice(`${(payload.catalogueScanned || 0).toLocaleString("en-GB")} catalogue products scanned across ${payload.storesResponding || 0} stores`); setTimeout(() => setNotice(""), 2600);
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
            return { status: "connected", protocol: "Shopify UCP/MCP", storesQueried: payload.storesQueried, storesResponding: payload.storesResponding, request: input.request, matches: rankProducts(nextProducts, { profile: stateRef.current.profile, query: typeof input.request === "string" ? input.request : "", learned: [...derivePreferences(stateRef.current.learnedTaste), ...legacySignalsToPreferences(stateRef.current.learnedAvoid)] }).slice(0, 10).map(({ id, retailerId, name, brand, price, score, productUrl, reasons }) => ({ id, retailer: retailers.find((item) => item.id === retailerId)?.name, name, brand, price, score, productUrl, reasons: reasons.slice(0, 4).map(r => r.label) })) };
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
            const matches = rankProducts(responses.flatMap((result) => result.products), { profile: stateRef.current.profile, query: typeof input.request === "string" ? input.request : "", learned: [...derivePreferences(stateRef.current.learnedTaste), ...legacySignalsToPreferences(stateRef.current.learnedAvoid)] }).slice(0, 10);
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
            const reaction = input.reaction === "up" ? "up" : "down";
            const before = derivePreferences(stateRef.current.learnedTaste).length;
            // Identical path to the visible product card: same trait keys, same
            // persistence, same reranking, same measured moved count.
            const outcome = reactionRef.current?.(item as ScoredProduct, reaction) ?? null;
            if (!outcome) return { status: "no_traits", product: item.name };
            return {
              status: "learned",
              storage: "local-browser",
              product: item.name,
              reaction,
              learnedKeys: outcome.keys,
              preferenceChanged: derivePreferences(outcome.learned).length !== before,
              productsMoved: outcome.moved,
            };
          },
        },
      ];
      await Promise.all(tools.map((tool) => document.modelContext!.registerTool(tool, { signal: controller.signal }).catch(() => undefined)));
    };
    register();
    return () => controller.abort();
  }, []);

  const selectRetailer = (id: string) => { setRetailerId(id); setShown(RENDER_BATCH); };
  const connectPassport = () => {
    setConnected(true); localStorage.setItem(STORE_CONNECTED, "true");
    document.dispatchEvent(new Event("fashion-passport:connection-changed"));
    setShowApproval(false); setPassportOn(true); if (view === "shop") void loadCatalogue(query);
  };
  /**
   * The single reaction path. The product card, the WebMCP tool and any future
   * caller all go through here, so they cannot diverge.
   */
  const applyReaction = (item: ScoredProduct, reaction: Reaction) => {
    const keys = traitKeysForProduct(item.evidence as unknown as Record<string, { value: string }>);
    if (keys.length === 0) return null;

    const source = stateRef.current.liveProducts.length ? stateRef.current.liveProducts : liveProducts;
    const currentLearned = stateRef.current.learnedTaste;
    const activeProfile = stateRef.current.profile;
    const before = rankProducts(source, { profile: activeProfile, query, learned: derivePreferences(currentLearned) }).map((entry) => entry.id);
    const updated = recordVote(currentLearned, keys, reaction);
    const after = rankProducts(source, { profile: activeProfile, query, learned: derivePreferences(updated) }).map((entry) => entry.id);
    const moved = after.reduce((total, id, index) => (before[index] === id ? total : total + 1), 0);

    localStorage.setItem(STORE_TASTE_VOTES, JSON.stringify(updated));
    setLearnedTaste(updated);
    setReactions((current) => ({ ...current, [item.id]: reaction }));

    // Name a trait the signal can actually move. A trait the shopper stated
    // explicitly is never affected by learning, so naming it would mislead.
    const groupFor: Partial<Record<Dimension, keyof FashionProfile>> = {
      colour: "colours", silhouette: "silhouettes", neckline: "necklines",
      sleeve: "sleeves", length: "lengths", pattern: "patterns", material: "materials",
    };
    const movable = FASHION_DIMENSIONS.find((dimension) => {
      const value = (item.evidence as Record<string, { value: string }>)[dimension]?.value;
      if (!value || value === "Unknown") return false;
      const field = groupFor[dimension];
      if (!field) return false;
      const group = activeProfile[field] as PreferenceGroup;
      return ![...group.love, ...group.avoid, ...group.never].some((entry) => entry.toLowerCase() === value.toLowerCase());
    });
    const named = movable ? (item.evidence as Record<string, { value: string }>)[movable].value : null;
    const label = `${reaction === "up" ? "more" : "less"} ${(named || "like this").toLowerCase()}`;
    setLastLearn({ keys, reaction, label, moved });
    return { keys, moved, label, learned: updated };
  };

  const reactTo = (item: ScoredProduct, reaction: Reaction) => { applyReaction(item, reaction); };
  useEffect(() => { reactionRef.current = applyReaction; });

  const undoLastLearn = () => {
    if (!lastLearn) return;
    const reverted = undoVote(learnedTaste, lastLearn.keys, lastLearn.reaction);
    localStorage.setItem(STORE_TASTE_VOTES, JSON.stringify(reverted));
    setLearnedTaste(reverted);
    setLastLearn(null);
  };
  const revoke = () => { setConnected(false); localStorage.removeItem(STORE_CONNECTED); document.dispatchEvent(new Event("fashion-passport:connection-changed")); setLiveProducts([]); setCatalogueState("idle"); };
  const finishOnboarding = () => { localStorage.setItem(STORE_ONBOARDED, "true"); try { setLearnedAvoid(JSON.parse(localStorage.getItem(STORE_SIGNALS) || "[]")); } catch { /* Keep the stable profile. */ } setView("travel"); };

  return (
    <div className="app-shell">
      <header className="topbar"><button className="brand" onClick={() => setView("travel")}><span><Icon name="passport" /></span><strong>Fashion<br/>Passport</strong></button><nav>{(["travel", "shop", "passport", "taste", "privacy"] as View[]).map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item === "shop" ? "Compare stores" : item === "taste" ? "Build my Passport" : item[0].toUpperCase() + item.slice(1)}</button>)}</nav><div className="webmcp-pill"><i></i><span>WebMCP ready</span></div></header>
      {view === "travel" && <TravelView connected={connected} onConnect={() => setShowApproval(true)} onCompare={() => setView("shop")}/>}
      {view === "passport" && <PassportView profile={profile} learned={learnedTaste} onRebuild={() => setView("taste")} />}
      {view === "taste" && <TasteView profile={profile} onProfile={setProfile} onDone={finishOnboarding} />}
      {view === "privacy" && <PrivacyView connected={connected} onRevoke={revoke} />}
      {view === "shop" && <main className="shop-page">
        <section className="hero-copy"><p className="eyebrow"><Icon name="sparkle" /> One Passport across Shopify fashion</p><h1>Stop starting from scratch.</h1><p>One standard adapter carries your size, taste and suitability context into any compatible Shopify fashion store.</p>
          <div className="scale-proof"><strong>{retailers.length}</strong><span>retailers verified against their own UCP endpoint</span><i></i><strong>1 adapter</strong><span>compatibility discovered at runtime, not a fixed list</span></div>
          <form className="search-box" onSubmit={(e) => { e.preventDefault(); if (!connected) setShowApproval(true); else void loadCatalogue(query); }}><Icon name="search"/><input aria-label="What are you shopping for?" value={query} onChange={(e) => setQuery(e.target.value)} /><button disabled={catalogueState === "loading"}>{catalogueState === "loading" ? `Searching ${retailers.length} stores…` : "Find my matches"}<Icon name="arrow"/></button></form>
          <div className="query-chips"><span>Try</span>{["Summer wedding", "Casual cotton with sleeves", "Colourful work dress"].map((text) => <button key={text} onClick={() => setQuery(text)}>{text}</button>)}</div>
        </section>
        <aside className="surface-explainer"><Icon name="passport"/><div><strong>Two ways to use it</strong><span>This hub compares stores. To stay on a brand’s own website, load the extension, choose a store below and select “Use on real store”. The Passport panel appears there.</span></div></aside>
        <section className="storefront">
          <div className="retailer-strip"><div className="retailer-tabs"><button onClick={() => selectRetailer("all")} className={retailerId === "all" ? "active" : ""}><span>All {retailers.length} live stores</span><small>One cross-store search</small></button>{retailers.map((item) => <button key={item.id} onClick={() => selectRetailer(item.id)} className={retailerId === item.id ? "active" : ""}><span>{item.name}</span><small>Open UCP endpoint</small></button>)}</div>{retailer && <a href={retailer.url} target="_blank" rel="noreferrer">Use on real store <Icon name="external"/></a>}</div>
          <div className="store-heading"><div><div className="store-label"><span className="retailer-avatar">{retailer ? retailer.name.slice(0, 1) : "18"}</span><p>{retailer ? retailerKind(retailer) : "Cross-store Shopify UCP"}<strong>{retailer ? `${retailer.name} · filtered results` : `${retailers.length} verified fashion stores · one search`}</strong></p></div><div className={`native-status ${catalogueState}`}><i></i>{catalogueState === "connected" ? `${searchStats.storesResponding} live endpoints responded` : catalogueState === "loading" ? "Calling live endpoints" : catalogueState === "error" ? "Network needs retry" : `${retailers.length} official endpoints verified`}</div></div><div className={`passport-switch ${passportOn && connected ? "on" : ""}`}><div><Icon name="passport"/><span>Fashion Passport<strong>{connected ? (passportOn ? "Connected once" : "Paused") : "Not connected"}</strong></span></div>{connected ? <button role="switch" aria-checked={passportOn} onClick={() => setPassportOn(!passportOn)}><i/></button> : <button className="apply-small" onClick={() => setShowApproval(true)}>Connect once</button>}</div></div>
          {passportOn && connected ? <div className="applied-banner"><Icon name="check"/><span><strong>Passport connected once.</strong> It remains applied across shops, categories, queries and tab changes.</span><button onClick={() => setView("passport")}>See profile</button></div> : <div className="permission-banner"><Icon name="lock"/><span><strong>Your Passport is private.</strong> Connect it once for compatible Shopify fashion stores.</span><button onClick={() => setShowApproval(true)}>Connect once <Icon name="arrow"/></button></div>}
          {ranked.length ? <>
            <div className="result-header">
              <p className="result-scanned"><strong>{counts.catalogueScanned.toLocaleString("en-GB")}</strong> catalogue products scanned{searchStats.moreAvailable ? " so far" : ""}{searchStats.storesResponding > 1 ? ` across ${searchStats.storesResponding} live stores` : ""}</p>
              {requested && <p className="result-category"><strong>{counts.categoryCorrect.toLocaleString("en-GB")}</strong> {counts.categoryCorrect === 1 ? requested.toLowerCase() : pluralCategory(requested)} found{counts.unknownCategory > 0 && <em> · {counts.unknownCategory} more could not be categorised, shown under All products</em>}</p>}
              <p className="result-tiers"><strong>{counts.strong}</strong> strong {counts.strong === 1 ? "match" : "matches"} · <strong>{counts.worth}</strong> worth a look · <strong>{counts.other}</strong> other · <strong>{counts.held}</strong> held by your rules</p>
            </div>

            {applied && <nav className="tier-nav" aria-label="Result tiers">
              {([["strong", "Strong matches", counts.strong], ["worth", "Worth a look", counts.worth], ["all", "All products", counts.strong + counts.worth + counts.other + counts.unknownCategory], ["held", "Held by rules", counts.held]] as [TierView, string, number][]) .map(([key, label, count]) => (
                <button key={key} className={activeTier === key ? "active" : ""} aria-current={activeTier === key ? "true" : undefined} onClick={() => { setTier(key); setShown(RENDER_BATCH); }}>
                  {label} <span>{count}</span>
                </button>
              ))}
            </nav>}

            {lastLearn && <div className="learned-toast" role="status">
              <Icon name="sparkle" />
              <span><strong>Passport learned: {lastLearn.label}.</strong>{lastLearn.moved > 0 ? ` ${lastLearn.moved} ${lastLearn.moved === 1 ? "product" : "products"} moved.` : " It takes repeated evidence to change the order."}</span>
              <button onClick={undoLastLearn}>Undo</button>
            </div>}

            <div className="catalogue-toolbar">
              <p>Showing <strong>{visible.length}</strong> of <strong>{tierItems.length}</strong> in {activeTier === "all" ? "all products" : activeTier === "held" ? "held by rules" : activeTier === "strong" ? "strong matches" : "worth a look"} for &ldquo;{query}&rdquo;{retailer ? ` at ${retailer.name}` : ""}</p>
              <div><span className="snapshot-date">Live via UCP · {liveAt ? new Date(liveAt).toLocaleTimeString("en-GB") : "just now"}</span></div>
            </div>

            <div className="product-grid">{visible.map((item) => <ProductCard key={item.id} item={item} reaction={reactions[item.id]} onReact={reactTo}/>)}</div>

            {remaining > 0 && <button className="load-more" onClick={() => setShown(shown + RENDER_BATCH)}>
              Load {Math.min(RENDER_BATCH, remaining)} more <span>{remaining} still to see in this tier</span>
            </button>}
            {remaining === 0 && tierItems.length > RENDER_BATCH && <p className="tier-complete">That is every product in this tier.</p>}
          </> : <section className={`live-site-only ${catalogueState === "error" ? "has-error" : ""}`}><div className="live-site-icon"><Icon name={catalogueState === "error" ? "close" : "external"} /></div><p className="eyebrow">{catalogueState === "error" ? "Live connection needs another try" : "Retailer-owned products only"}</p><h2>{catalogueState === "error" ? catalogueError : `Search ${retailers.length} live fashion stores together.`}</h2><p>{catalogueState === "error" ? "No cached or invented products have replaced the retailer response." : "Connect once. Fashion Passport calls every verified retailer-owned Shopify endpoint, enforces the requested garment category, and ranks what comes back. Every qualifying product stays reachable through the tiers and Load more."}</p>{connected ? <button className="primary-button" onClick={() => void loadCatalogue(query)}>Search live stores <Icon name="arrow" /></button> : <button className="primary-button" onClick={() => setShowApproval(true)}>Connect once <Icon name="arrow" /></button>}<small>For the on-site experience, load the extension and open any compatible Shopify store.</small></section>}
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
