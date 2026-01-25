# Repository Guidelines

## Project Structure & Module Organization
- Root HTML pages: `index.html`, `weddingplan.html`, and `wedding_card.html` are the primary UI entry points.
- Static assets live in `assets/` (notably `assets/theme/` for imagery) plus root-level images like `heart.png` and `qrcode.png`.
- Google Apps Script helper lives in `google_apps_script/` with deploy notes in `google_apps_script/README.md`.
- Data and utilities: `Wedding-Planner-2025-08-09.csv` for planning data, and `qrcodegen.py` for QR generation.

## Build, Test, and Development Commands
- `bundle install` installs Ruby dependencies for the Jekyll build.
- `bundle exec jekyll serve` runs a local site at `http://localhost:4000`.
- `python3 qrcodegen.py` regenerates `qrcode.png` (requires `qrcode` and `Pillow`).

## Coding Style & Naming Conventions
- HTML/CSS/JS files are hand-edited and mostly live at repo root; keep formatting consistent with surrounding file style.
- Use clear, descriptive IDs/classes (e.g., `wedding-card`, `guest-list`) and prefer kebab-case in HTML/CSS.
- Images and assets should use lowercase filenames with underscores or hyphens (match existing assets).

## Testing Guidelines
- No automated test suite is present. Validate changes manually:
  - Run Jekyll and check key pages in a browser.
  - If you touch payment flow, test the Apps Script endpoint using `wedding_card.html`.

## Commit & Pull Request Guidelines
- Commit history favors short, imperative messages with optional prefixes like `fix:`, `update:`, or `modify`.
- PRs should include a concise summary, screenshots for UI changes, and any relevant data/endpoint updates.

## Security & Configuration Tips
- `google_apps_script/Code.gs` contains placeholders for IDs. Do not commit real spreadsheet or Drive IDs.
- Treat any payment or guest data as sensitive; avoid committing personal data files beyond sample CSVs.
