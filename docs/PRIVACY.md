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

Fashion Passport uses stateless Next.js routes that forward a search to the
retailer's own endpoint and return the response. The demonstrator has no
account system, database or analytics service.

## The single approval

Before any profile is sent, the extension sends an anonymous `tools/list`
capability check to the origin being visited. That check contains no profile.

If the store is compatible and the shopper has not yet approved, the extension
asks once, listing what will be sent. After approval it never asks again
because the shopper changed store, category, query or tab. The approval holds
until it is revoked from Privacy.

## What a retailer receives

The retailer receives the derived shape, colouring, size, budget and stated
trait preferences needed for ranking. Raw reactions and browsing history remain
in the browser.

## Photographs

The current onboarding asks for no photograph, so it uploads and stores no image.
If a photo path is added later, the specification requires the image to
be processed in the moment, reduced to derived values, and deleted immediately.

## Revoking

Privacy in the hub disconnects the Passport. The extension stops applying it on
every retailer. Local tallies can be cleared by clearing site data.
