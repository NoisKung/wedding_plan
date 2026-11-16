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

Run the unit tests (Node 18+, no install needed):
```bash
npm test               # = node --test 'tests/*.test.js'
```

## Page Architecture & Flow

Four standalone HTML pages — CSS and JS are inline (no build step, no bundler),
except `photos/photos-core.js`, a plain script kept separate so Node can unit-test it:

```
index.html          → envelope animation → portrait card → navigates to wedding_card.html
wedding_card.html   → full e-invitation (hero, countdown, schedule, gallery, venue, RSVP, payment)
weddingplan.html    → internal planning checklist (Tailwind CSS, separate from invitation theme)
photos/index.html   → /photos — guest camera: guest types a name, photos upload to Google Drive
```

### Color Theme (CSS variables in `:root`)

`index.html`, `wedding_card.html` and `photos/index.html` share the same palette — always update all three if changing theme:

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
- **`gallory/`** (note spelling): 18 pre-wedding photos, all used in Section 4 gallery

`index.html` uses:
- `701AFFE2-…jpeg` → envelope card strip (right side)
- `gallory/B20F5DEB-…jpeg` → portrait card (revealed after envelope opens)

The portrait card frame (`.np-photo-wrap`) is roughly square (~0.9 ratio) while the source photos are 540×360 landscape, so `object-fit: cover` keeps only the **central ~60% of the width**. Any replacement must have both subjects near the horizontal centre — compositions with people at the left and right edges get cropped out.

### Gallery (Section 4 — `wedding_card.html`)

Uses CSS **`columns`** (masonry layout), **not** CSS Grid. Key constraints:
- **Never add `data-aos` to `.gal-item` elements** — AOS sets `opacity: 0` before scroll, which breaks CSS columns height calculation and causes photos to disappear
- Use `loading="lazy"` on `<img>` tags instead of AOS for deferred loading
- Items must have `display: inline-block`, `break-inside: avoid`, and `width: 100%`

### RSVP & Payment Backend

`wedding_card.html` posts to a Google Apps Script Web App URL (`scriptURL` variable in the JS). The Apps Script code is in `google_apps_script/Code.gs`. To wire up a real deployment, replace `SPREADSHEET_ID` and `DRIVE_FOLDER_ID` in `Code.gs`, deploy as a Web App, and update `scriptURL` in `wedding_card.html`.

Google Sign-In (`data-client_id` in `wedding_card.html`) only works on the production domain — 403 errors on localhost are expected and harmless.

### Guest Photos (`/photos`)

`photos/index.html` is served at `https://noiskung.github.io/wedding_plan/photos/`.
It talks to its **own** Apps Script project, `google_apps_script/Photos.gs`,
not the RSVP/payment script, so the two can be deployed independently.
Deploy steps are in `google_apps_script/README.md`;
the page shows "not switched on yet" until `PHOTOS_SCRIPT_URL` is set.

- Drive layout: `<parent folder>/<guest name>/<shot id>.jpg`.
  The parent folder ID lives in Script Properties (`PHOTOS_FOLDER_ID`), not in git.
  Two guests who type the same name share one folder.
- Uploads are one request per photo, one at a time per phone,
  because "Execute as: Me" web apps share the owner's simultaneous-execution quota.
- The body is a JSON string with **no** `Content-Type` header,
  so it goes as `text/plain` and skips the CORS preflight Apps Script can't answer.
  Keep it that way.
- The shot id (`YYYYMMDD-HHMMSS-xxxxxx`) makes retries idempotent:
  the server skips a file that already exists.
  The client relies on this for its final `no-cors` resend (shown as "sent, not confirmed").
- That resend can't tell "arrived" from "script never ran",
  so it is used only while the browser has not yet read a response from the script
  (`corsVerified`, set by the `doGet` health check or any confirmed upload).
  Failed photos are re-sent automatically every 60 s while the page is open.
- Photos are re-encoded on a canvas (long edge 2048 px, JPEG 0.85),
  which also converts HEIC and strips EXIF/GPS.
  Film look and date stamp are applied on the same canvas.
- `sanitizeName` in `photos-core.js` and `sanitizeGuestName_` in `Photos.gs` must stay identical;
  both are covered by `tests/`.
- Settings at the top of the page script: `SHOT_LIMIT` (0 = unlimited), `FILM_DEFAULT`, `MAX_EDGE`.

### Dress Code Colors (Section 5 — Venue)

The `.dress-dots` in the venue section use hardcoded `background` hex values (not CSS variables):
`#f2d7df`, `#edc1cd`, `#f1b984`, `#789666`, `#8e1e1c` — these represent the wedding dress code palette and are intentionally separate from the site theme.
