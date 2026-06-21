# Next.js Wedding Invitation — Design Spec
**Date:** 2026-06-21  
**Branch:** `feature/nextjs`  
**Deploy Target:** Vercel  
**Status:** Approved

---

## Overview

Convert the existing 3-page HTML/CSS/JS wedding invitation site to a Next.js 15 App Router project with a luxury Blush & Rose Gold redesign, deployed to Vercel.

## Goals

- Preserve all existing functionality (envelope animation, countdown, schedule, gallery, RSVP, payment)
- Luxury redesign: Blush & Rose Gold Romantic aesthetic
- Bilingual Thai/English (React Context-based i18n)
- Vercel deployment ready
- RSVP backend: keep existing Google Apps Script URL (no migration)

---

## Architecture

```
app/
├── page.tsx                ← Envelope animation → portrait card
├── invitation/
│   └── page.tsx            ← Full e-invitation (all sections)
├── plan/
│   └── page.tsx            ← Internal wedding checklist
├── layout.tsx              ← Fonts (Google Fonts), metadata, providers
└── globals.css             ← Tailwind base + CSS custom properties

components/
├── envelope/
│   └── EnvelopeAnimation.tsx
├── invitation/
│   ├── HeroSection.tsx
│   ├── CountdownSection.tsx
│   ├── ScheduleSection.tsx
│   ├── GallerySection.tsx
│   ├── VenueSection.tsx
│   └── RSVPSection.tsx
├── ui/
│   ├── Button.tsx
│   ├── GalleryModal.tsx
│   └── LanguageSwitcher.tsx
└── providers/
    └── I18nProvider.tsx

lib/
├── i18n.ts                 ← Thai/English translation strings
└── types.ts

public/
└── gallory/                ← 19 pre-wedding photos (copied from existing)
```

## Routing

| URL | Source | Description |
|-----|--------|-------------|
| `/` | `index.html` | Envelope animation, opens to portrait card, navigates to `/invitation` |
| `/invitation` | `wedding_card.html` | Full e-invitation: hero, countdown, schedule, gallery, venue, RSVP |
| `/plan` | `weddingplan.html` | Internal wedding checklist (Tailwind, kept simple) |

---

## Design System

### Color Palette

```css
--bg:           #FDF6F0   /* blush white — page backgrounds */
--bg-alt:       #F5EBE4   /* warm blush — alternate sections */
--accent:       #B76E79   /* rose gold — primary buttons, headings */
--accent-light: #D4949F   /* light rose — hover states */
--gold:         #C9A07A   /* warm gold — dividers, decorative lines */
--text:         #2D2D2D   /* near black — body text */
--text-soft:    #7A6B6B   /* muted rose-brown — secondary text */
--white:        #FFFFFF   /* pure white — cards */
```

### Typography

- **Headings:** Libre Baskerville (serif) — letter-spacing: 0.08em, elegant
- **Body:** Lato (sans-serif) — clean, readable
- Load via `next/font/google`

### Luxury Design Touches

- Thin gold horizontal dividers (`1px solid #C9A07A` with opacity)
- Section headings: uppercase, wide letter-spacing, Libre Baskerville
- Subtle drop shadows on cards: `shadow-rose-100`
- Gallery modal: smooth fade + scale animation (CSS transitions)
- Scroll fade-in: Intersection Observer (no AOS dependency)
- Envelope animation: CSS keyframes (converted from existing)

---

## Key Components

### EnvelopeAnimation (page.tsx)

- Recreate CSS envelope open animation
- On animation complete: show portrait card
- Portrait card has "Open Invitation" button → navigate to `/invitation`
- Use `useEffect` + CSS class toggle (no GSAP needed)

### CountdownSection

- `useEffect` with `setInterval` for live countdown
- Client-only via `dynamic(() => import(...), { ssr: false })`
- Styled as blush/rose gold card with backdrop-blur

### GallerySection

- CSS `columns` masonry layout (same as current — proven to work)
- `loading="lazy"` on all `<img>` tags
- NO AOS on gallery items (causes opacity:0 bug)
- `GalleryModal` component for zoom view
- `display: inline-block; break-inside: avoid; width: 100%`

### LanguageSwitcher / I18n

- `I18nProvider` wraps the app (React Context)
- `useI18n()` hook returns `{ t, lang, setLang }`
- All strings in `lib/i18n.ts` as `{ th: {...}, en: {...} }` keyed by section

### RSVPSection

- Google Sign-In via `data-client_id` script (same as original)
- Manual guest input fallback
- POST to `scriptURL` (Google Apps Script) — same URL as current
- Styled with luxury form inputs (rose gold borders, serif labels)

---

## Data / Content

All content (names, dates, venue, schedule times) extracted from existing HTML:
- `lib/i18n.ts` — bilingual strings
- Component constants — dates, coordinates, dress code colors

Dress code colors (intentionally separate from theme):
`#f2d7df, #edc1cd, #f1b984, #789666, #8e1e1c`

---

## Deployment

### Vercel Setup

1. Connect GitHub repo to Vercel
2. Framework: Next.js (auto-detected)
3. Environment variables: none required initially
4. Auto-deploy on push to `feature/nextjs`

### next.config.ts

```ts
const nextConfig = {
  images: { unoptimized: true }
}
```

---

## Out of Scope

- Migrating RSVP backend to Next.js API routes
- `weddingplan.html` full redesign (convert as-is)
- Analytics

---

## Implementation Order

1. Create `feature/nextjs` branch
2. `npx create-next-app@latest` with TypeScript + Tailwind
3. Copy photo assets to `public/`
4. Set up design tokens in `globals.css`
5. Build `EnvelopeAnimation` (page `/`)
6. Build invitation sections one by one
7. Build `LanguageSwitcher` + i18n
8. Port `/plan` checklist
9. Test key flows with Playwright
10. Commit + push → Vercel auto-deploys
