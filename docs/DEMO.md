# Two-minute demo script

Everything below runs against live retailer endpoints. Figures on screen are
computed from the response in front of you, so they will differ from the ones
recorded here.

## Before you start

```bash
npm install
npm run build
npm run start
```

Load `extension/` unpacked at `chrome://extensions` with Developer mode on,
Chrome 152 or newer. Reload the extension after any code change.

## The script

**0:00 — the problem, in one screen.** Open Nobody's Child at a dresses page
with the Passport off. The shop shows its whole category. Nothing here is
personal.

**0:15 — connect once.** Select the Fashion Passport control. Read the approval
card aloud: it lists exactly what travels and what stays. Approve.

**0:25 — the grid decides.** The panel reports the live hierarchy: catalogue
products scanned, dresses found, then strong, worth a look and held by your
rules. Move through the tiers. Open **Held by rules** and show that every held
product prints the confirmed rule that held it, and that "sold out in your
size" is a rule while "contains polyester" is not.

**0:55 — the honest bit.** Find a halterneck. Note that polyester appears as a
visible conflict on products that state it, and the product is still there. An
ordinary avoid ranks a product down. Only a Never hides one.

**1:10 — teach it.** Press Less on a halterneck. The first reaction reports
that a single vote changes nothing, because it takes repeated evidence. Press
Less on three more. The message now names how many products moved, and the
grid reorders in place. Press Undo and watch it revert.

**1:35 — the point of the whole thing.** Open Jigsaw in a new tab. No second
approval appears. The learned preference is already applied there, on a
different retailer with a completely different tag vocabulary.

**1:55 — close.** Open the Passport. Three layers: what may suit you, what you
chose, and what your reactions taught it, the last with confidence and
interaction counts.

## Fallback retailers

If Nobody's Child is unavailable, use **Jigsaw**, verified 2 September 2026:
200 catalogue products scanned in 6.2 seconds, 101 category-correct dresses,
0 non-dresses admitted.

If both are unavailable, **Lucy & Yak** also responds. Do not substitute static
data; say the endpoint is down and demonstrate on a store that responds.

Note when demonstrating on Jigsaw that attribute coverage is thinner there:
Jigsaw does not publish structured neckline tags, so more products carry
"Possible match, limited product information" instead of a percentage. That is
the evidence-confidence rule working, not a failure.

## What not to claim

Do not say every Shopify store works. Compatibility is discovered at runtime,
and the eighteen retailers in `src/lib/data.ts` are the ones actually verified.
