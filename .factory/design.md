# Worklog Bridge visual thesis

## Direction

**Night-market neon signage** fits a tool that gathers scattered traces after a day of work. Each Git commit and calendar event is treated like a paper order ticket under practical street light. Cyan marks source data, amber marks human review, and mint marks approval. The interface is dark by design, like a focused evening reconciliation desk, but never hides legibility behind glow.

The signature composition is a **receipt rail**: a cyan source lane feeds an amber review lane, then a mint approval stamp. Irregular clipped corners, fine ticket perforations, monospaced metadata, and hand-authored signs make the product recognisable without generic SaaS cards or gradient blobs.

## Tokens

| Role | Token | Value | Use |
|---|---|---:|---|
| Background | `--ink` | `#090b10` | Night pavement |
| Raised background | `--stall` | `#11151d` | Work surfaces |
| Surface | `--paper` | `#171d27` | Tickets and panels |
| Main text | `--rice` | `#f7f1df` | Headings and body |
| Muted text | `--smoke` | `#abb5c2` | Supporting copy |
| Source accent | `--neon-cyan` | `#63e6ff` | Git and calendar sources |
| Review accent | `--lantern` | `#ffbd4a` | Drafts and focus |
| Approval | `--mint` | `#75efb3` | Confirmed entries |
| Danger | `--chili` | `#ff6b6b` | Errors and removal |
| Focus | `--focus` | `#fff19a` | Three-pixel focus outline |

All text/background pairs are designed for WCAG AA. Color is always paired with a word, icon, or border pattern.

## Type

- Display: `Arial Narrow`, `Aptos Narrow`, system sans-serif. Uppercase labels and compact headings feel like painted stall boards without downloading a font.
- Body: `Inter`, `Segoe UI`, system sans-serif. The system stack avoids a font payload and stays clear at 16 px.
- Data: `ui-monospace`, `SFMono-Regular`, `Consolas`, monospace. Dates, durations, hashes, and totals use tabular figures.

The scale is 16, 18, 23, 32, and 56 px. Reading lines stop near 68 characters.

## Spacing and shape

Spacing follows an 8 px base with 4 px for tight metadata. Main sections use 64–112 px. Controls are at least 44 px tall. Surfaces have small 8–14 px radii, clipped ticket corners, 1 px keylines, and hard offset shadows. Panels group only genuinely separate items; working lists use ruled rows.

## Interaction grammar

- Cyan selects evidence; amber asks for review; mint confirms a durable outcome.
- Every data-changing action reports its result in the live status rail.
- Draft entries expand in place so edits come from their source position.
- Destructive actions require a named confirmation or offer undo.
- Keyboard shortcuts: `/` focuses filters, `n` starts an entry, and `e` exports.

## M2 account and billing treatment

Account backup is an optional **cyan source ticket** in the existing worklog
side rail, not a separate profile dashboard. The signed-in state names the
account in plain words, then gives four deliberate actions: back up, load,
download, and delete the account copy. Mint marks the affirmative backup
action; the delete action stays outlined with a named confirmation. On the
sample route the same rail becomes a small explanatory ticket: it says the
sample never starts sign-in, backup, or billing. This preserves the visual
meaning of cyan as an explicitly selected source and makes the privacy
boundary legible without extra product chrome.

## Motion policy

The receipt rail advances once when a draft is created: source tickets slide 12 px toward review while the approval stamp fades in over 220 ms. Hover and focus transitions last 140 ms and change opacity or transform only. Nothing loops. With `prefers-reduced-motion: reduce`, transforms and smooth scrolling are removed and state changes are instant.

## Image plan and provenance

The hero illustration is an original cinematic still of an empty night-market bookkeeping stall. A laptop-like abstract terminal, Git ticket fragments, calendar slips, and a blank approval stamp explain reconstruction without depicting monitoring. It contains no required text.

Prompt sheet: “Editorial cinematic illustration of an empty night-market bookkeeping stall after rain, overhead receipt rail carrying abstract code commit tickets and calendar slips toward a clean approval stamp, black-blue pavement, cyan tube light, amber paper lantern, mint verification glow, tactile paper, brushed steel, subtle grain, oblique 35mm lens, high contrast but readable shadows, no people, no readable text, no letters, no logos, no watermark, no brands, no screenshots, no surveillance cameras.”

- Generator: Azure AI Foundry image generation via `/opt/fleet/lib/gen-image.sh` (`factory-image`).
- Date: 2026-08-28.
- License/provenance: generated specifically for Worklog Bridge; original factory asset.
- Source candidates and prompt sidecars live in `assets/src/`. Optimised WebP derivatives ship in `public/assets/`.

Hand-authored SVG assets include the bridge wordmark, source icons, favicon, empty-state lantern, and social preview composition. They use only geometric shapes and the palette above.

## Responsive decisions

At 390 px, the hero art becomes a short banner below the primary action. Source lanes become a single ordered stack. The worklog table becomes ruled entry blocks with labels, while edit and remove controls remain full-size. The desktop app keeps the total and export action visible in a bottom review bar; the website does not use a sticky bar.
