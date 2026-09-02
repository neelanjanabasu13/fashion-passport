# Privacy

## What is stored, and where

| Data | Where it lives | Leaves the browser? |
|---|---|---|
| Body shape and colour season | `localStorage` | Only inside an approved retailer request |
| Size, height, budget and budget mode | `localStorage` | Only inside an approved retailer request |
| Stated Love, Avoid and Never traits | `localStorage` | Only inside an approved retailer request |
| Raw up and down tallies per trait | `localStorage` / `chrome.storage.local` | Never |
| Which products were shown or skipped | `localStorage` / `chrome.storage.local` | Never |
| The one-time connection approval | `chrome.storage.local` | Never |

There is no Fashion Passport server. The Next.js routes are stateless: they
forward a search to the retailer's own endpoint and return the response. No
account, no database, no analytics.

## The single approval

Before any profile is sent, the extension sends an anonymous `tools/list`
capability check to the origin being visited. That check contains no profile.

If the store is compatible and the shopper has not yet approved, the extension
asks once, listing what will be sent. After approval it never asks again
because the shopper changed store, category, query or tab. The approval holds
until it is revoked from Privacy.

## What a retailer receives

Only the derived profile needed to rank: shape, colouring, size, budget and
the stated trait preferences. Raw reactions are not included. Browsing history
is not included and is never transmitted anywhere.

## Photographs

The onboarding never asks for a photograph. Nothing is uploaded and nothing is
stored. If a photo path is added later, the specification requires the image to
be processed in the moment, reduced to derived values, and deleted immediately.

## Revoking

Privacy in the hub disconnects the Passport. The extension stops applying it on
every retailer. Local tallies can be cleared by clearing site data.
