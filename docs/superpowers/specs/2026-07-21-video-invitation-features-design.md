# wedding_card.html — Background Music, Photo Sections & Timeline Schedule

## Overview

Source video: a promotional demo for a third-party wedding e-invitation template
("Bella & Andrew" theme, by vendor Cherchewa). Comparing it against the current
`wedding_card.html`, most sections already exist (invitation card, countdown,
schedule grid, gallery, venue + map + dress code, RSVP, QR payment). Three
things from the video are genuinely missing and are the scope of this spec:

1. A background music player (instrumental track + play/pause control).
2. Photo-based section backgrounds (the current site uses flat color
   backgrounds only).
3. A vertical, one-event-at-a-time schedule timeline on a solid green
   background (the current schedule is a 4-cell grid).

Everything else from the video (RSVP envelope, QR payment, dress-code dots,
map) is intentionally **out of scope** — it already exists and matches.

## Goals

- Add the three features above without introducing a build step, framework,
  or external JS dependency — `wedding_card.html` is plain inline
  HTML/CSS/JS today and stays that way.
- Reuse existing photo assets and the existing sage-green (`--wine`) palette
  defined in `CLAUDE.md` — no new illustration assets, no off-theme colors.
- Do not reduce the quality of any existing photo asset when reusing it as a
  section background (CSS overlay/gradient only, never re-encode/downsize the
  source file).
- Keep i18n (`data-i18n`) coverage for any new user-facing copy across the
  three existing language blocks (th/en/ja).

## Non-Goals

- No redesign of invitation card, countdown, gallery, venue/map/dress-code,
  RSVP, or QR payment sections — these already match the video.
- No parallax library, no animation framework — one small vanilla
  `IntersectionObserver` is the only new JS mechanism, used solely to fill in
  the timeline connector line as the user scrolls.
- No changes to the Google Apps Script backend or RSVP/payment logic.

## Architecture

All three features are additive blocks of inline `<style>` and `<script>`
inside `wedding_card.html`, following the file's existing convention (no
external files, no bundler). New CSS classes are namespaced to avoid
collisions with existing ones (`.bgm-*` for the music player, `.tl-*` for the
timeline, `.photo-break-*` for full-bleed photo sections).

### A. Background Music Player

- New track file: `assets/audio/gymnopedie-no1.mp3` — "Gymnopedie No. 1"
  (Erik Satie, arranged by Kevin MacLeod / incompetech.com), 3:07, CC BY
  license. Downloaded and verified (200 OK, valid MP3, ffprobe duration
  187s) during brainstorming.
- Attribution requirement is satisfied with a small HTML comment near the
  `<audio>` element plus a low-visual-weight credit line (small, muted text,
  not part of the main flow) — matches CC BY terms without competing with
  the design.
- Markup: a `<audio id="bgm" loop preload="none">` with the mp3 source,
  plus:
  - An inline prompt directly under the invitation card / above the
    countdown ("กดเพื่อฟังเพลง" style, matching the video), which starts
    playback on tap and then hides itself.
  - A persistent small floating play/pause button (fixed position, opposite
    corner from the existing `#open-pay` floating button so they don't
    overlap) that stays visible for the rest of the page so the user can
    mute/unmute at any time.
- No autoplay-on-load (browsers block audio autoplay with sound; the design
  already assumes a tap-to-start interaction, same as the reference video).
- State (`playing`/`paused`) is local to the page load — no persistence
  needed across reloads.

### B. Photo Background Sections

- One full-bleed photo section inserted between the countdown section and
  the schedule timeline, echoing the video's dramatic full-screen photo
  moment.
- Reuses the existing `701AFFE2-…jpeg` couple photo (already the featured
  hero/couple image used elsewhere on the site) — no new image asset added,
  no resizing/re-encoding of the source file.
- A CSS `linear-gradient` scrim (sage-green-tinted, using `--wine` at low
  opacity, darkest at the bottom) sits over the photo purely via
  `background-image: linear-gradient(...), url(...)` so any overlay text
  stays readable — the underlying `<img>`/file itself is untouched.
- Section has no interactive content — it's a visual breather/transition,
  matching the video's use of a full-screen photo as a pacing device.

### C. Schedule Timeline Redesign

- Replaces the existing `.sch-grid` (4-cell grid) markup with a vertical
  list: one event per row, centered icon, connected by a vertical line
  (`::before`/`::after` pseudo-elements or a single absolutely-positioned
  line element behind the icons).
- Section background becomes solid `--wine` (green) with white/light text
  and line-art icons, reusing the **same inline SVGs already in the grid
  version** (clock, rings, tea-cup, gift) — no new icon assets.
- Progressive line-fill effect: a single `IntersectionObserver` watches each
  `.tl-item`; when an item enters the viewport, a class is toggled that
  extends a `background`/`height` on the connector segment above it via CSS
  transition. This is the one new small JS mechanism in this spec — no
  external library.
- Existing `data-aos` fade-up behavior is kept per item for the icon/text
  reveal; the observer only drives the connecting line, not the item
  fade-in (AOS already does that job).
- Event content (time + name) is unchanged from what's already in the grid
  version — only the layout/background changes.

## Data / Content

No new copy needed beyond:

- The "tap to play music" prompt string (3 languages: th/en/ja) — added to
  the existing i18n data object alongside current keys.
- Attribution credit line (static, not translated — attribution text is
  typically left as-is regardless of page language).

No changes to RSVP/payment data flow, Google Apps Script, or spreadsheet
schema.

## Error Handling

- If the audio file fails to load (network hiccup, browser blocks the
  format), the play button click handler should fail silently — no broken
  UI, no console-blocking alerts. The floating button simply has no audible
  effect; this is acceptable since music is decorative, not functional.
- `IntersectionObserver` usage is guarded with a feature check
  (`if ('IntersectionObserver' in window)`); on unsupported browsers the
  timeline still renders (icons + line via CSS), just without the
  progressive fill animation.

## Testing / Verification

- Manual verification via local server (`python3 -m http.server 8787`) in
  browser:
  - Tap-to-play prompt starts audio; floating button toggles play/pause;
    reloading the page resets to paused state (expected, no persistence).
  - Photo background section renders at full width/height on mobile and
    desktop viewport, text/overlay remains legible.
  - Schedule timeline: confirm all existing event times/names are still
    present and correct (no content regression), connector line fills
    progressively on scroll in a browser that supports
    `IntersectionObserver`, and degrades gracefully (static line, no JS
    errors) if the feature is stubbed out.
  - Re-check all three language switches (th/en/ja) still render the new
    "tap to play music" string correctly.
- No automated test suite exists for this static-HTML project; verification
  is manual/visual, consistent with how the rest of the site is maintained.

## Implementation Order

1. Download/verify audio asset (done during brainstorming) → add to
   `assets/audio/`.
2. Add `<audio>` element, tap-to-play prompt, floating toggle button, and
   i18n string for the prompt.
3. Add the full-bleed photo background section markup + CSS scrim.
4. Rebuild the schedule section markup as a vertical timeline; port over
   existing icons/times/labels 1:1.
5. Add the `IntersectionObserver` progressive line-fill script.
6. Manual pass in browser across th/en/ja, mobile + desktop widths.

## Out of Scope

- Invitation card / hero section
- Countdown numbers section
- Gallery section
- Venue / map / dress code section
- RSVP section
- QR payment section
- Any change to `index.html` (envelope-opening flow) beyond what was already
  fixed earlier in this session (couple-photo `object-fit`)
