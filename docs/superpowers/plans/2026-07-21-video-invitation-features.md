# Video-Inspired Invitation Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a background music player, a full-bleed photo section, and a vertical timeline redesign of the schedule section to `wedding_card.html`, matching features seen in a reference e-invitation demo video while keeping the site's existing sage-green theme and inline (no build step) architecture.

**Architecture:** All changes are additive inline `<style>`/`<script>` blocks and markup inserted directly into `wedding_card.html`, following the file's existing convention (single static HTML file, no bundler, no framework). One new binary asset (`assets/audio/gymnopedie-no1.mp3`) is added. New CSS is namespaced (`.bgm-*`, `.photo-break*`, `.tl-*`) to avoid colliding with existing classes.

**Tech Stack:** Plain HTML/CSS/vanilla JS, existing AOS library (already loaded), native `<audio>` element, native `IntersectionObserver` (no new dependency).

## Global Constraints

- No build step, no bundler, no new npm/JS dependency — plain inline HTML/CSS/JS only, per `docs/superpowers/specs/2026-07-21-video-invitation-features-design.md`.
- Use only the existing `--wine` (`#4a6b48`) / `--blush` / `--white` palette from `:root` (wedding_card.html:28-38) — no new colors.
- Never re-encode, resize, or recompress any existing photo asset — reuse files as-is (CSS overlay/gradient only).
- Every new user-facing string must be added to all three `translations` blocks: `th` (~line 2411), `en` (~line 2520), `ja` (~line 2632), and referenced via `data-i18n="<key>"`.
- Audio track is CC BY licensed (Kevin MacLeod / incompetech.com) — attribution HTML comment is required next to the `<audio>` element.
- No automated test suite exists for this project — verification is `grep`-based structural checks plus manual browser checks via `python3 -m http.server 8787` (per `CLAUDE.md`).

---

## Task 1: Background Music Player

**Files:**
- Create: `assets/audio/gymnopedie-no1.mp3`
- Modify: `wedding_card.html` (CSS after line 1298; HTML after line 1447; floating button near line 1899; i18n after lines 2433, 2543, 2653; new `<script>` before `</body>` at line 2899)

**Interfaces:**
- Produces: `#bgm` (`<audio>` element), `#bgmPromptBtn` (tap-to-start control), `#bgmToggle` (persistent floating play/pause button), i18n key `bgmPrompt`.
- Consumes: existing `translations` object and `setLanguage()` mechanism (wedding_card.html:2761-2790) — no changes to that function needed, since it already applies `data-i18n` generically.

- [ ] **Step 1: Download and verify the audio asset**

```bash
mkdir -p /Users/supakit-s/Github/wedding_plan/assets/audio
curl -sL --max-time 30 -o /Users/supakit-s/Github/wedding_plan/assets/audio/gymnopedie-no1.mp3 \
  "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gymnopedie%20No%201.mp3"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 \
  /Users/supakit-s/Github/wedding_plan/assets/audio/gymnopedie-no1.mp3
```

Expected: `duration=187.089000` (or very close — confirms a valid, complete MP3 download, not an error page).

- [ ] **Step 2: Add CSS for the prompt and floating toggle**

In `wedding_card.html`, insert immediately after the `.pay-btn` responsive block (after line 1298, before the `/* ── RESPONSIVE ── */` comment at line 1300):

```css
        .bgm-prompt {
            max-width: 320px;
            margin: 24px auto 0;
            padding: 14px 20px;
            background: var(--card-bg);
            border: 1px solid var(--blush-mid);
            border-radius: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            font-size: 0.85rem;
            color: var(--wine);
            box-shadow: 0 4px 16px rgba(74, 107, 72, 0.12);
        }

        .bgm-prompt svg {
            width: 18px;
            height: 18px;
            flex-shrink: 0;
        }

        .bgm-prompt.hidden {
            display: none;
        }

        .bgm-toggle {
            position: fixed;
            left: 18px;
            bottom: 18px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--wine);
            color: var(--white);
            border: none;
            z-index: 200;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(74, 107, 72, 0.35);
        }

        .bgm-toggle svg {
            width: 20px;
            height: 20px;
        }

        @media (max-width: 480px) {
            .bgm-toggle {
                bottom: max(18px, env(safe-area-inset-bottom));
            }
        }

```

- [ ] **Step 3: Verify CSS landed**

```bash
grep -c "\.bgm-prompt {" /Users/supakit-s/Github/wedding_plan/wedding_card.html
grep -c "\.bgm-toggle {" /Users/supakit-s/Github/wedding_plan/wedding_card.html
```

Expected: both commands print `1`.

- [ ] **Step 4: Add the `<audio>` element and tap-to-play prompt**

In `wedding_card.html`, insert immediately after line 1447 (`    </section>`, the closing tag of `<section id="invitation" class="inv-section">`) and before line 1449's comment block for the countdown section:

```html

    <!-- ══════════════════════════════════════════════════
         BACKGROUND MUSIC
    ══════════════════════════════════════════════════ -->
    <audio id="bgm" loop preload="none">
        <source
            src="assets/audio/gymnopedie-no1.mp3"
            type="audio/mpeg"
        />
    </audio>
    <!--
        "Gymnopedie No. 1" — composed by Erik Satie, arranged by
        Kevin MacLeod (incompetech.com). Licensed under Creative
        Commons: By Attribution 3.0 (https://creativecommons.org/licenses/by/3.0/)
    -->
    <button
        type="button"
        id="bgmPromptBtn"
        class="bgm-prompt"
        data-aos="fade-up"
    >
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
        </svg>
        <span data-i18n="bgmPrompt">กดเพื่อฟังเพลงประกอบ</span>
    </button>
```

- [ ] **Step 5: Add the persistent floating toggle button**

In `wedding_card.html`, find the existing "Floating pay button" comment (line 1898-1899:
```html
    <!-- Floating pay button -->
    <button id="open-pay" class="pay-btn" aria-haspopup="dialog" aria-controls="pay-modal" data-i18n="payBtn">
```
Insert immediately **before** that comment:

```html
    <!-- Floating music toggle -->
    <button
        type="button"
        id="bgmToggle"
        class="bgm-toggle"
        aria-label="Toggle background music"
        style="display: none"
    >
        <svg id="bgmIconPlay" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
        </svg>
        <svg
            id="bgmIconPause"
            viewBox="0 0 24 24"
            fill="currentColor"
            style="display: none"
        >
            <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
        </svg>
    </button>

```

- [ ] **Step 6: Add the `bgmPrompt` i18n key to all three languages**

In `wedding_card.html`, insert immediately after line 2433 (`                    scheduleSubtitle: '"งานเช้า เลี้ยงเที่ยง"',`, inside the `th` block):

```js
                    bgmPrompt: "กดเพื่อฟังเพลงประกอบ",
```

Insert immediately after line 2543 (`                        '"Morning Ceremony, Luncheon Reception"',`, inside the `en` block):

```js
                    bgmPrompt: "Tap to play background music",
```

Insert immediately after line 2653 (`                    scheduleSubtitle: "「午前の式典、昼食会」",`, inside the `ja` block):

```js
                    bgmPrompt: "タップして音楽を再生",
```

- [ ] **Step 7: Verify i18n keys landed in all three languages**

```bash
grep -c "bgmPrompt:" /Users/supakit-s/Github/wedding_plan/wedding_card.html
```

Expected: `3` (one per language block).

- [ ] **Step 8: Add the audio control script**

In `wedding_card.html`, insert a new `<script>` block immediately before the final `</body>` tag (currently at line 2900, right after the last existing `</script>`):

```html
    <script>
        (function () {
            const bgm = document.getElementById("bgm");
            const promptBtn = document.getElementById("bgmPromptBtn");
            const toggleBtn = document.getElementById("bgmToggle");
            const iconPlay = document.getElementById("bgmIconPlay");
            const iconPause = document.getElementById("bgmIconPause");
            if (!bgm || !promptBtn || !toggleBtn) return;

            function showPlayingIcon(isPlaying) {
                iconPlay.style.display = isPlaying ? "none" : "block";
                iconPause.style.display = isPlaying ? "block" : "none";
            }

            function startMusic() {
                bgm.play()
                    .then(() => {
                        promptBtn.classList.add("hidden");
                        toggleBtn.style.display = "flex";
                        showPlayingIcon(true);
                    })
                    .catch(() => {
                        /* autoplay blocked or file unavailable — leave prompt visible */
                    });
            }

            promptBtn.addEventListener("click", startMusic);

            toggleBtn.addEventListener("click", function () {
                if (bgm.paused) {
                    bgm.play()
                        .then(() => showPlayingIcon(true))
                        .catch(() => {});
                } else {
                    bgm.pause();
                    showPlayingIcon(false);
                }
            });
        })();
    </script>
</body>
```

(Replace the bare `</body>` at the end of the file with the block above, which re-adds `</body>` after the new script.)

- [ ] **Step 9: Verify script landed and file is well-formed**

```bash
grep -c 'id="bgmToggle"' /Users/supakit-s/Github/wedding_plan/wedding_card.html
grep -c "startMusic" /Users/supakit-s/Github/wedding_plan/wedding_card.html
python3 -c "import re; s=open('/Users/supakit-s/Github/wedding_plan/wedding_card.html').read(); assert s.count('<script>') == s.count('</script>'), 'mismatched script tags'; print('script tags balanced:', s.count('<script>'))"
```

Expected: first two commands print `2` (button + JS reference) and `1` respectively; the Python check prints `script tags balanced: N` with no assertion error.

- [ ] **Step 10: Manual browser verification**

```bash
cd /Users/supakit-s/Github/wedding_plan && python3 -m http.server 8787
```

Open `http://localhost:8787/wedding_card.html`. Confirm:
- The "กดเพื่อฟังเพลงประกอบ" prompt appears below the invitation card.
- Tapping it starts audio playback and reveals the floating toggle button (bottom-left) instead.
- Clicking the floating toggle pauses/resumes playback and swaps the play/pause icon.
- Switching language (top-right switcher) to English/Japanese updates the prompt text before it's tapped.

- [ ] **Step 11: Commit**

```bash
cd /Users/supakit-s/Github/wedding_plan
git add assets/audio/gymnopedie-no1.mp3 wedding_card.html
git commit -m "feat: add background music player to wedding_card.html"
```

---

## Task 2: Full-Bleed Photo Break Section

**Files:**
- Modify: `wedding_card.html` (CSS near line 528; HTML between lines 1474 and 1476; i18n after lines 2433/2433+1 for th, and equivalent en/ja lines added in Task 1 Step 6 — insert on the line directly below the new `bgmPrompt` key in each block)

**Interfaces:**
- Produces: `.photo-break` section (no ID needed — it's non-interactive), i18n key `photoBreakText`.
- Consumes: existing `701AFFE2-8D0D-4D05-8D45-2D18633A0EBA_4_5005_c.jpeg` file (already in repo root, used elsewhere as the couple photo) and the existing `--wine` CSS variable.

- [ ] **Step 1: Add the `.photo-break` CSS**

In `wedding_card.html`, insert immediately before the `/* ═══... SECTION 4 — GALLERY` comment (currently at line 529):

```css
        /* ═══════════════════════════════════════════════════
           PHOTO BREAK
        ═══════════════════════════════════════════════════ */
        .photo-break {
            position: relative;
            min-height: 60vh;
            background-image:
                linear-gradient(
                    180deg,
                    rgba(74, 107, 72, 0.15) 0%,
                    rgba(74, 107, 72, 0.8) 100%
                ),
                url("701AFFE2-8D0D-4D05-8D45-2D18633A0EBA_4_5005_c.jpeg");
            background-size: cover;
            background-position: center;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding: 32px 24px;
        }

        .photo-break-text {
            color: var(--white);
            font-family: var(--font-display);
            font-size: clamp(1rem, 3vw, 1.3rem);
            font-style: italic;
            text-align: center;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
            max-width: 480px;
        }

```

- [ ] **Step 2: Verify CSS landed**

```bash
grep -c "\.photo-break {" /Users/supakit-s/Github/wedding_plan/wedding_card.html
```

Expected: `1`.

- [ ] **Step 3: Insert the photo-break section markup**

In `wedding_card.html`, insert between line 1474 (`    </section>`, closing `<section id="countdown-section" class="cd-section">`) and line 1476 (the `<!-- ══...` comment that introduces `SECTION 3 — SCHEDULE`):

```html

    <!-- ══════════════════════════════════════════════════
         PHOTO BREAK
    ══════════════════════════════════════════════════ -->
    <section class="photo-break" data-aos="fade-in">
        <p class="photo-break-text" data-i18n="photoBreakText">
            เรื่องราวของเราสองคน กำลังจะเริ่มต้นบทใหม่
        </p>
    </section>
```

- [ ] **Step 4: Add the `photoBreakText` i18n key to all three languages**

In `wedding_card.html`, insert directly below the `bgmPrompt:` line added in Task 1 Step 6, in each of the three blocks:

`th` block:
```js
                    photoBreakText: "เรื่องราวของเราสองคน กำลังจะเริ่มต้นบทใหม่",
```

`en` block:
```js
                    photoBreakText: "Our story is about to begin a new chapter",
```

`ja` block:
```js
                    photoBreakText: "私たちの物語は、新しい章を迎えようとしています",
```

- [ ] **Step 5: Verify i18n keys and section landed**

```bash
grep -c "photoBreakText:" /Users/supakit-s/Github/wedding_plan/wedding_card.html
grep -c 'class="photo-break"' /Users/supakit-s/Github/wedding_plan/wedding_card.html
```

Expected: `3` and `1` respectively.

- [ ] **Step 6: Manual browser verification**

With the local server still running (`http://localhost:8787/wedding_card.html`):
- Scroll from the countdown section to the schedule section; confirm the full-bleed couple photo appears in between, with the italic caption legible over the darkened bottom of the photo.
- Confirm the photo is the existing `701AFFE2-…jpeg` file (not stretched, not pixelated beyond its native quality).
- Switch language and confirm the caption updates in all three languages.

- [ ] **Step 7: Commit**

```bash
cd /Users/supakit-s/Github/wedding_plan
git add wedding_card.html
git commit -m "feat: add full-bleed photo break section to wedding_card.html"
```

---

## Task 3: Schedule Timeline Redesign

**Files:**
- Modify: `wedding_card.html` (CSS lines 485-527 replaced; HTML lines 1479-1536 replaced; new `<script>` before `</body>`)

**Interfaces:**
- Produces: `.tl-list` / `.tl-item` / `.tl-icon` / `.tl-time` / `.tl-event` / `.tl-line-fill` CSS classes, `#tlList` and `#tlLineFill` element IDs.
- Consumes: existing `.section-title` / `.section-sub` classes (must keep working for Gallery/Venue sections elsewhere — do not delete those shared rules, only scope new overrides under `.sch-section`). Existing i18n keys `scheduleTitle`, `scheduleSubtitle`, `time1`-`time4`, `buddhist`, `procession`, `waterBlessing`, `luncheon` are reused unchanged — no new i18n keys in this task.

- [ ] **Step 1: Replace the schedule CSS block**

In `wedding_card.html`, replace lines 485-527 (from `        .sch-grid {` through the closing `        }` of `.sch-event`) with:

```css
        .sch-section .section-title,
        .sch-section .section-sub {
            color: var(--white);
        }

        .sch-section .section-sub {
            color: rgba(255, 255, 255, 0.75);
        }

        .tl-list {
            position: relative;
            max-width: 360px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 56px;
        }

        .tl-list::before {
            content: "";
            position: absolute;
            top: 0;
            bottom: 0;
            left: 50%;
            width: 2px;
            background: rgba(255, 255, 255, 0.25);
            transform: translateX(-50%);
        }

        .tl-line-fill {
            position: absolute;
            top: 0;
            left: 50%;
            width: 2px;
            height: 0%;
            background: var(--white);
            transform: translateX(-50%);
            transition: height 0.6s ease;
        }

        .tl-item {
            position: relative;
            z-index: 1;
        }

        .tl-icon {
            width: 56px;
            height: 56px;
            background: var(--white);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 14px;
            color: var(--wine);
        }

        .tl-icon svg {
            width: 28px;
            height: 28px;
        }

        .tl-time {
            font-weight: 600;
            color: var(--white);
            font-size: 0.92rem;
            margin-bottom: 4px;
        }

        .tl-event {
            color: rgba(255, 255, 255, 0.85);
            font-size: 0.88rem;
        }
```

Also change line 464 (`            background: var(--section-alt);` inside `.sch-section`) to:

```css
            background: var(--wine);
```

- [ ] **Step 2: Verify CSS landed and old classes are gone**

```bash
grep -c "\.tl-list {" /Users/supakit-s/Github/wedding_plan/wedding_card.html
grep -c "\.sch-grid {" /Users/supakit-s/Github/wedding_plan/wedding_card.html
```

Expected: `1` and `0` (the old grid rule is fully replaced, not duplicated).

- [ ] **Step 3: Replace the schedule section markup**

In `wedding_card.html`, replace lines 1479-1536 (from `    <section class="sch-section">` through its matching `    </section>`) with:

```html
    <section class="sch-section">
        <div data-aos="fade-up">
            <h3 class="section-title" data-i18n="scheduleTitle">
                กำหนดการ
            </h3>
            <p class="section-sub" data-i18n="scheduleSubtitle">
                "งานเช้า เลี้ยงเที่ยง"
            </p>
        </div>
        <div class="tl-list" id="tlList">
            <div class="tl-line-fill" id="tlLineFill"></div>
            <div class="tl-item" data-aos="fade-up" data-aos-delay="100">
                <div class="tl-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div class="tl-time" data-i18n="time1">07:09 น.</div>
                <div class="tl-event" data-i18n="buddhist">พิธีสงฆ์</div>
            </div>
            <div class="tl-item" data-aos="fade-up" data-aos-delay="200">
                <div class="tl-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <div class="tl-time" data-i18n="time2">08:29 น.</div>
                <div class="tl-event" data-i18n="procession">
                    แห่ขันหมาก
                </div>
            </div>
            <div class="tl-item" data-aos="fade-up" data-aos-delay="300">
                <div class="tl-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <div class="tl-time" data-i18n="time3">09:49 น.</div>
                <div class="tl-event" data-i18n="waterBlessing">
                    ยกน้ำชา
                </div>
            </div>
            <div class="tl-item" data-aos="fade-up" data-aos-delay="400">
                <div class="tl-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c-.454-.303-.977-.454-1.5-.454V8.546c.523 0 1.046-.151 1.5-.454a2.704 2.704 0 013 0 2.704 2.704 0 003 0 2.704 2.704 0 013 0 2.704 2.704 0 003 0c.454.303.977.454 1.5.454v7z" />
                    </svg>
                </div>
                <div class="tl-time" data-i18n="time4">11:30 น.</div>
                <div class="tl-event" data-i18n="luncheon">
                    รับประทานอาหาร
                </div>
            </div>
        </div>
    </section>
```

- [ ] **Step 4: Verify markup landed**

```bash
grep -c 'id="tlList"' /Users/supakit-s/Github/wedding_plan/wedding_card.html
grep -c 'class="sch-grid"' /Users/supakit-s/Github/wedding_plan/wedding_card.html
python3 -c "
s = open('/Users/supakit-s/Github/wedding_plan/wedding_card.html').read()
for key in ['time1', 'time2', 'time3', 'time4', 'buddhist', 'procession', 'waterBlessing', 'luncheon']:
    assert f'data-i18n=\"{key}\"' in s, f'missing {key}'
print('all 8 schedule i18n keys still referenced')
"
```

Expected: `1`, `0`, and the Python script prints `all 8 schedule i18n keys still referenced` with no `AssertionError`.

- [ ] **Step 5: Add the progressive line-fill script**

In `wedding_card.html`, insert a new `<script>` block immediately before the final `</body>` tag (after the script added in Task 1 Step 8):

```html
    <script>
        (function () {
            if (!("IntersectionObserver" in window)) return;
            const items = document.querySelectorAll(".tl-item");
            const fill = document.getElementById("tlLineFill");
            const list = document.getElementById("tlList");
            if (!items.length || !fill || !list) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        const item = entry.target;
                        const percent =
                            ((item.offsetTop + item.offsetHeight / 2) /
                                list.offsetHeight) *
                            100;
                        fill.style.height = Math.min(percent, 100) + "%";
                    });
                },
                { threshold: 0.5 },
            );

            items.forEach((item) => observer.observe(item));
        })();
    </script>
</body>
```

(As in Task 1 Step 8, this replaces the bare `</body>` with the script + `</body>`.)

- [ ] **Step 6: Verify script landed**

```bash
grep -c "tlLineFill" /Users/supakit-s/Github/wedding_plan/wedding_card.html
python3 -c "s=open('/Users/supakit-s/Github/wedding_plan/wedding_card.html').read(); assert s.count('<script>') == s.count('</script>'); print('script tags balanced:', s.count('<script>'))"
```

Expected: `grep -c` prints `3` or more (CSS class + 2 element refs in JS/HTML); the Python check prints a balanced count with no assertion error.

- [ ] **Step 7: Manual browser verification**

With the local server still running (`http://localhost:8787/wedding_card.html`):
- Confirm the schedule section now shows a solid green background with events listed vertically, connected by a line, instead of the old 4-cell grid.
- Confirm all four event times/labels (07:09 พิธีสงฆ์, 08:29 แห่ขันหมาก, 09:49 ยกน้ำชา, 11:30 รับประทานอาหาร) are still present and correct.
- Scroll slowly through the section and confirm the white line fills progressively as each event scrolls into view.
- Open DevTools console and confirm no JavaScript errors are logged.

- [ ] **Step 8: Commit**

```bash
cd /Users/supakit-s/Github/wedding_plan
git add wedding_card.html
git commit -m "feat: redesign schedule section as a vertical timeline"
```

---

## Self-Review Notes

- **Spec coverage:** Task 1 covers spec section A (music player), Task 2 covers section B (photo background), Task 3 covers section C (timeline). All three spec features have a corresponding task; nothing in the spec's "Goals" is left unaddressed.
- **Placeholder scan:** no TBD/TODO; every step has literal code, not a description of code.
- **Type/name consistency:** `#bgm`, `#bgmPromptBtn`, `#bgmToggle`, `#bgmIconPlay`, `#bgmIconPause` are used identically across Task 1's HTML and JS steps. `#tlList` / `#tlLineFill` are used identically across Task 3's HTML and JS steps. i18n key names (`bgmPrompt`, `photoBreakText`) match between the HTML `data-i18n` attributes and the `translations` object insertions.
- **Ordering dependency:** Task 1 must run before Task 2 (Task 2's i18n step inserts below the line Task 1 adds). Task 3 is independent of Tasks 1-2 and could run in any order, but is listed last to match the spec's implementation order.
