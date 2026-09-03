## Inspiration
As an avid online shopper of fashion products, I have spent thousands of hours browsing different catalogues, using the exact same filters and visual judgement again and again to narrow down choices to what I actually like and what suist me. This frustrates me because I need to keep doing the same thing every time. I know there are others like me who hate this repetition. A user who knows she wears a UK 10, avoids polyester, prefers midi lengths and stops looking above £100 still has to repeat that context at every retailer. Retailer profiles only work on their own websites, so you cannot take your preferences with you if you want to buy from a different store. Shopping search overwhelms users with endless options without fully understanding their specific colours, proportions and silhouettes, or the fact that personal taste should overrule every styling rule. Fashion Passport captures that judgment once and applies it across compatible stores.

## What it does
Fashion Passport creates a portable personal style profile for womenswear. Its sub-two-minute "Verdict Book" fitting keeps three sources of truth separate:

a.) a transparent starting point from body proportions and colour direction;
b.) explicit Love, Avoid and Never choices across seven garment traits;
c.) preference patterns learned from reactions to real retailer products.

The ordering gives your preference greater weight than theory. An ordinary Avoid lowers rank while keeping the product visible, and repeated evidence is required before reactions create a learned preference. Once approved, an agent can use the Passport to search live retailer-owned Shopify catalogues, enforce the requested garment category, rank every product and explain why each item is Strong, Worth a look, another option or Held by a confirmed rule. The Chrome extension proves the same Passport on the retailer's own website and carries it to the next compatible retailer without another approval.

This setup enables collaboration that was previously impossible: you supply subjective judgment, grant permission and can overrule; the agent handles catalogue breadth, category enforcement and reranking; the retailer remains source of truth for products, prices and availability. A single approval covers retailer, category, query and tab changes, eliminating the repetitive re-entry of context that defines current online shopping.

## Role of WebMCP
Portability depends on a shared tool contract. WebMCP lets Fashion Passport expose typed tools to the agent while compatible retailers expose their own catalogue tools. The agent composes the two safely by obtaining approved user context, querying retailer-owned inventory and returning a personal, explainable ranking. People and agents do different work together:
a.) you supply subjective judgment, grant permission and can overrule;
b.) the agent handles catalogue breadth, category enforcement and reranking;
c.) the retailer remains source of truth for products, prices and availability.

WebMCP specifically enables the system to discover retailers as you browse without needing a central merchant directory, which standard APIs cannot provide because Shopify gives each store its own catalogue access only within individual store boundaries. The system combines this runtime store discovery with a verified comparison panel and shows you exactly where each piece of information comes from. The tool contract ensures that unknown attributes add no positive score, Avoid lowers rank, Never can hold a product, render batches control presentation, and catalogue-scanned counts remain separate from dress counts.

## How we built it
The Next.js app registers five WebMCP tools: get_fashion_passport, find_personal_matches, compare_shopify_stores, request_passport_connection and record_style_signal. The Chrome extension registers an on-retailer surface and discovers compatibility at runtime. Before approval it sends only an anonymous capability check. After one-time approval, it reads the retailer's official Shopify catalogue data, normalises product information, applies the ranking engine and displays real retailer-hosted images and links. The ranking system applies:
a.) category gate first;
b.) hard rules only for explicit Never, hard query cap, strict budget and confirmed unavailable size;
c.) explicit preference above learned preference;
d.) styling theory at the lowest weight;
e.) zero positive evidence for unknown attributes;
f.) deterministic tie-breaks and evidence confidence separate from score.

The web app and extension run against identical test data. The release requirements are lint clean, production-build clean, 36/36 tests passing, every extension script passing node --check, and browser verification at desktop and 390px mobile width. WebMCP tool registration differs from standard API integration by enabling the agent to discover retailer capabilities dynamically and invoke tools across domain boundaries while maintaining explicit user approval. The extension uses one browser engine and tests fail on any difference in evidence, score, tier, hard rule or ordering, ensuring the WebMCP-powered extension delivers identical ranking behavior to the web application.

a.) category gate first;
b.) hard rules only for explicit Never, hard query cap, strict budget and confirmed unavailable size;
c.) explicit preference above learned preference;
d.) styling theory at the lowest weight;
e.) zero positive evidence for unknown attributes;
f.) deterministic tie-breaks and evidence confidence separate from score.

The web and extension run against a shared parity corpus. The release gate is lint clean, production-build clean, 36/36 tests, every extension script passing node --check, and browser verification at desktop and 390px.

## Challenges we ran into
The hardest problem was keeping recommendations accurate when retailer data is imperfect. Retailer search sometimes returns the wrong garment category. Those results must be filtered out rather than mislabeled as products that match your rules. Product information also varies across stores, so the system separates confidence from score and never rewards missing evidence.

The second hard problem was consistency. An extension that behaves differently from the web app creates confusion. The extension now uses the same engine as the web app and tests fail on any difference in evidence, score, tier, hard rule or ordering.

WebMCP introduces specific challenges around discovering stores and verifying compatibility as you browse. Shopify gives each store its own catalogue access without a central directory, requiring the system to discover stores at runtime while comparing them against a verified panel. The tool contract must show you exactly where each piece of information comes from so you understand when results come from live retailer data versus cached checks.

## Accomplishments that we're proud of
The public application works without requiring you to log in, pay for API access, or manage any technical setup. The test panel includes eighteen directly verified fashion retailers on Shopify, with the system discovering additional compatible stores as you browse.

The interface shows you exactly what is happening: which catalogues have been scanned, which items match your category, and how many results fall into each of four quality tiers. Every clothing evaluation uses real product photography from the retailer, and your reactions rerank results immediately with full Undo support. One approval covers retailer, category, query, and tab changes, and your saved Passports carry forward as the system evolves.

The product combines WebMCP with a coherent shopping experience, demonstrating the ranking system on a real retailer's domain. Every count and product comes from live retailer data. Items you softly dislike rank lower without disappearing permanently, your personal taste can overrule theoretical styling rules, and the system requires repeated evidence before changing a learned preference. The Verdict Book visual system makes the whole process clear to shoppers.

## What we learned
Shopify does not provide a central directory of all stores, so the system discovers compatible retailers as you browse and compares them against a verified panel. You always see exactly where each piece of information comes from.

The ranking system handles incomplete data carefully. Missing information never counts as a positive, items you marked Avoid appear lower but stay visible, items you marked Never can be held back entirely, and the system keeps its internal counts separate from the actual dress counts you see.

WebMCP allows the system to work across different retailer websites without asking you to log in or grant permission on each one. Standard web technology would require you to re-authenticate on every store, but WebMCP's shared tool model maintains your approval as you move between sites.

## What's next for Fashion Passport
The roadmap focuses on making the tool useful for more shoppers and more stores. We will add many more retailers so you have a larger selection to choose from. Menswear launches next with its own tested guidance model, currently marked as Coming soon. You will be able to sync your preferences across devices if you choose, though your data stays on your device by default. The platform will pull richer fit and availability information directly from merchants so recommendations become more accurate over time. Your portable Passport will eventually work beyond fashion into other shopping categories where your personal preferences matter.

WebMCP makes this expansion possible by letting new shopping categories expose their own tools while Fashion Passport keeps your preferences working across all of them.
