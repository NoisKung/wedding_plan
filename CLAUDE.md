# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local Development

Serve the site locally for testing (Playwright requires HTTP, not `file://`):
```bash
python3 -m http.server 8787
```
Then open `http://localhost:8787/index.html`.

Jekyll is configured (`_config.yml`) for GitHub Pages deployment at `https://noiskung.github.io`, but day-to-day development uses the Python server above.

Regenerate the QR code:
```bash
python3 qrcodegen.py   # requires: pip install qrcode Pillow
```

## Page Architecture & Flow

Three standalone HTML pages — all CSS and JS are inline (no build step, no bundler):

```
index.html          → envelope animation → portrait card → navigates to wedding_card.html
wedding_card.html   → full e-invitation (hero, countdown, schedule, gallery, venue, RSVP, payment)
weddingplan.html    → internal planning checklist (Tailwind CSS, separate from invitation theme)
```

### Color Theme (CSS variables in `:root`)

Both `index.html` and `wedding_card.html` share the same palette — always update both if changing theme:

| Variable | Value | Usage |
|---|---|---|
| `--blush` | `#ede8df` | Page backgrounds |
| `--blush-pale` | `#f8f6f2` | Light card backgrounds |
| `--blush-mid` | `#d9d2c6` | Borders, dividers |
| `--wine` | `#4a6b48` | Primary accent (sage green) — buttons, headings, countdown bg |
| `--wine-mid` | `#7d9e7b` | Soft accent |
| `--text` | `#1c1c1c` | Body text |
| `--text-soft` | `#6b6b6b` | Secondary text |

Hardcoded `rgba(74, 107, 72, …)` shadows also appear throughout — these correspond to `--wine` and must be updated manually if the accent color changes.

### Photo Assets

Real photos live in two places:
- **Root**: `25E11052-…jpeg` (groom solo), `701AFFE2-…jpeg` (couple), `C4D20F07-…jpeg` (bride solo) — used in the invitation hero card
- **`gallory/`** (note spelling): 19 pre-wedding photos used in Section 4 gallery

`index.html` uses:
- `701AFFE2-…jpeg` → envelope card strip (right side)
- `gallory/B936D023-…jpeg` → portrait card (revealed after envelope opens)

### Gallery (Section 4 — `wedding_card.html`)

Uses CSS **`columns`** (masonry layout), **not** CSS Grid. Key constraints:
- **Never add `data-aos` to `.gal-item` elements** — AOS sets `opacity: 0` before scroll, which breaks CSS columns height calculation and causes photos to disappear
- Use `loading="lazy"` on `<img>` tags instead of AOS for deferred loading
- Items must have `display: inline-block`, `break-inside: avoid`, and `width: 100%`

### RSVP & Payment Backend

`wedding_card.html` posts to a Google Apps Script Web App URL (`scriptURL` variable in the JS). The Apps Script code is in `google_apps_script/Code.gs`. To wire up a real deployment, replace `SPREADSHEET_ID` and `DRIVE_FOLDER_ID` in `Code.gs`, deploy as a Web App, and update `scriptURL` in `wedding_card.html`.

Google Sign-In (`data-client_id` in `wedding_card.html`) only works on the production domain — 403 errors on localhost are expected and harmless.

### Dress Code Colors (Section 5 — Venue)

The `.dress-dots` in the venue section use hardcoded `background` hex values (not CSS variables):
`#f2d7df`, `#edc1cd`, `#f1b984`, `#789666`, `#8e1e1c` — these represent the wedding dress code palette and are intentionally separate from the site theme.
