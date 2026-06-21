# Next.js Wedding Invitation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing HTML/CSS/JS wedding invitation site into a Next.js 15 App Router app with a Blush & Rose Gold luxury redesign, deployed to Vercel.

**Architecture:** Three routes (`/`, `/invitation`, `/plan`) map to the three existing HTML pages. All CSS via Tailwind + CSS custom properties in `globals.css`. Client components handle animations, countdown timer, gallery modal, Google Sign-In, and RSVP form. No API routes needed — RSVP and payment POST directly to the existing Google Apps Script URL.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS 4, React 19, `next/font/google` (Libre Baskerville + Lato), Vercel

## Global Constraints

- Branch: `feature/nextjs` (create from `main` at start of Task 1)
- Node.js >= 20
- Next.js 15, TypeScript strict mode, Tailwind CSS 4
- Wedding date: `new Date("2026-11-22T07:00:00+07:00")`
- Google Apps Script URL: `https://script.google.com/macros/s/AKfycbz4aY1uz9X68BxN5zR_Xf-E8h65zHyCO4fnEAyqDxIg5dVr-S5ZXYhR6WvJn6MZ8Wy_/exec`
- Google Client ID: `679261672981-7f2b6ekit43s411jee55nv60i3q7ujn5.apps.googleusercontent.com`
- Design palette: `--bg:#FDF6F0`, `--bg-alt:#F5EBE4`, `--accent:#B76E79`, `--accent-light:#D4949F`, `--gold:#C9A07A`, `--text:#2D2D2D`, `--text-soft:#7A6B6B`
- Dress code colors (hardcoded, not theme): `#f2d7df #edc1cd #f1b984 #789666 #8e1e1c`
- No AOS on gallery items (causes opacity:0 masonry bug — use Intersection Observer instead)
- `images: { unoptimized: true }` in `next.config.ts` (local JPEG assets)
- All commits go to `feature/nextjs` branch

---

## File Map

```
wedding-nextjs/                   <- root of new Next.js project
app/
  layout.tsx                      <- fonts, metadata, I18nProvider wrapper
  globals.css                     <- Tailwind base + CSS custom properties
  page.tsx                        <- / (envelope animation)
  invitation/
    page.tsx                      <- /invitation (all sections)
  plan/
    page.tsx                      <- /plan (checklist)
components/
  envelope/
    EnvelopeAnimation.tsx         <- CSS animation, portrait card, CTA
  invitation/
    HeroSection.tsx               <- hero banner with couple names + date
    InvitationSection.tsx         <- family names, photos, date/venue invite card
    CountdownSection.tsx          <- client-only countdown timer
    ScheduleSection.tsx           <- 4 schedule items grid
    GallerySection.tsx            <- masonry columns + zoom modal
    VenueSection.tsx              <- venue name, address, map link, dress code
    RSVPSection.tsx               <- Google Sign-In + manual + RSVP form + payment
  ui/
    LanguageSwitcher.tsx          <- dropdown flag switcher
    GoldDivider.tsx               <- thin gold hr decorative element
    FadeInSection.tsx             <- Intersection Observer scroll-fade wrapper
    GalleryModal.tsx              <- lightbox modal
lib/
  i18n.ts                         <- full translations object { th: {...}, en: {...} }
  types.ts                        <- Lang type, TranslationKey type
providers/
  I18nProvider.tsx                <- React Context: lang state + t() function
public/
  gallory/                        <- 20 JPEG photos (copied from existing repo)
  bride.jpeg                      <- C4D20F07-... renamed
  groom.jpeg                      <- 25E11052-... renamed
  couple.jpeg                     <- 701AFFE2-... renamed
  portrait.jpeg                   <- B936D023-... renamed
next.config.ts
```

---

### Task 1: Project Scaffold + Branch

**Files:**
- Create: `wedding-nextjs/` (entire Next.js project via CLI)
- Create: `wedding-nextjs/next.config.ts`

**Interfaces:**
- Produces: working `npm run dev` on port 3000

- [ ] **Step 1: Create the branch**

```bash
git checkout -b feature/nextjs
```

Expected: `Switched to a new branch 'feature/nextjs'`

- [ ] **Step 2: Scaffold Next.js project**

```bash
npx create-next-app@latest wedding-nextjs \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
cd wedding-nextjs
```

When prompted interactively, accept all defaults.

- [ ] **Step 3: Configure next.config.ts**

Replace contents of `wedding-nextjs/next.config.ts` with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

- [ ] **Step 4: Copy photo assets**

From the repo root (one level up from `wedding-nextjs/`):

```bash
cp -r ../gallory wedding-nextjs/public/gallory
cp "../C4D20F07-3D9D-4484-94F3-3324C1D50CBF_4_5005_c.jpeg" wedding-nextjs/public/bride.jpeg
cp "../25E11052-D0F6-4C88-8FFE-3DF9C8A81D85_4_5005_c.jpeg" wedding-nextjs/public/groom.jpeg
cp "../701AFFE2-8D0D-4D05-8D45-2D18633A0EBA_4_5005_c.jpeg" wedding-nextjs/public/couple.jpeg
cp "../B936D023-B78C-4BBC-85F2-CB2978783E5E_4_5005_c.jpeg" wedding-nextjs/public/portrait.jpeg
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: `Ready in ...ms` on http://localhost:3000. Default Next.js page loads.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js 15 project with Tailwind"
```

---

### Task 2: Design Tokens + i18n + Layout

**Files:**
- Create: `wedding-nextjs/lib/types.ts`
- Create: `wedding-nextjs/lib/i18n.ts`
- Create: `wedding-nextjs/providers/I18nProvider.tsx`
- Modify: `wedding-nextjs/app/globals.css`
- Modify: `wedding-nextjs/app/layout.tsx`

**Interfaces:**
- Produces: `useI18n()` hook returns `{ lang: Lang, setLang: (l: Lang) => void, t: (key: TranslationKey) => string }`
- Produces: CSS custom properties `var(--accent)`, `var(--bg)`, etc. available globally

- [ ] **Step 1: Write `lib/types.ts`**

```ts
export type Lang = "th" | "en";

export const LANG_LIST: Lang[] = ["th", "en"];
```

- [ ] **Step 2: Write `lib/i18n.ts`**

```ts
import type { Lang } from "./types";

export const translations: Record<Lang, Record<string, string>> = {
  th: {
    langName: "ไทย",
    flag: "🇹🇭",
    heroSubtitle: "We're Getting Married",
    heroNames: "สุนีย์ และ ศุภกิตติ์",
    heroDate: "22.11.2026",
    invitationText: "ขอเรียนเชิญเพื่อเป็นเกียรติในพิธีมงคลสมรสระหว่าง",
    brideName: "สุนีย์",
    brideFullname: "(สุนีย์ มงคลวรกิจชัย)",
    brideParents: "บุตรีของ (ชาญชัย มงคลวรกิจชัย) และ (มาลัย วรรณภูงา)",
    groomName: "ศุภกิตติ์",
    groomFullname: "(ศุภกิตติ์ สุจริตชีววงศ์)",
    groomParents: "บุตรของ (สมชัย สุจริตชีววงศ์) และ (สุพร ซูพูล)",
    brideFamily: "คุณมาลัย วรรณภูงา\nคุณชาญชัย มงคลวรกิจชัย",
    groomFamily: "คุณสุพร ซูพูล\nคุณสมชัย สุจริตชีววงศ์",
    brideFamilyName: "มงคลวรกิจชัย",
    groomFamilyName: "สุจริตชีววงศ์",
    brideFullDisplay: "สุนีย์ มงคลวรกิจชัย",
    groomFullDisplay: "ศุภกิตติ์ สุจริตชีววงศ์",
    invDetailDate: "วันอาทิตย์ที่ 22 พฤศจิกายน 2569 เวลา 07:00 น.",
    invDetailVenue: "ณ BokRak VIVACE WEDDING HALL ราชพฤกษ์",
    footerApology: "ขออภัยหากมิได้มาเรียนเชิญด้วยตนเอง",
    countdownTitle: "นับถอยหลังสู่วันของเรา",
    countdownComplete: "วันแต่งงานมาถึงแล้ว!",
    days: "วัน",
    hours: "ชั่วโมง",
    minutes: "นาที",
    seconds: "วินาที",
    scheduleTitle: "กำหนดการ",
    scheduleSubtitle: '"งานเช้า เลี้ยงเที่ยง"',
    time1: "08:09 น.",
    buddhist: "พิธีสงฆ์",
    time2: "09:09 น.",
    procession: "แห่ขันหมาก",
    time3: "10:09 น.",
    waterBlessing: "พิธีรดน้ำสังข์",
    time4: "12:00 น.",
    luncheon: "รับประทานอาหาร",
    galleryTitle: "แกลเลอรี่ความทรงจำ",
    venueTitle: "สถานที่จัดงาน",
    venueName: "ณ VIVACE WEDDING HALL ราชพฤกษ์",
    venueAddress: "18/15 ถ. ราชพฤกษ์ ตำบลอ้อมเกร็ด อำเภอปากเกร็ด จังหวัดนนทบุรี 11120",
    viewMap: "ดูแผนที่",
    venueDateNum: "22.11.69",
    venueDateSub: "ณ BokRak VIVACE WEDDING HALL ราชพฤกษ์",
    dressCode: "การแต่งกาย",
    themeColor: "ธีมสี:",
    rsvpTitle: "ตอบรับการเข้าร่วมงาน",
    signInPrompt: "กรุณาเข้าสู่ระบบด้วย Google เพื่อตอบรับการเข้าร่วมงาน",
    guestToggle: "ไม่ได้ใช้ Gmail? ลงทะเบียนด้วยชื่อ",
    nameLabel: "ชื่อ-นามสกุล",
    namePlaceholder: "เช่น: สมชาย ใจดี",
    emailLabel: "อีเมล (ไม่บังคับ)",
    attending: "เข้าร่วม",
    notAttending: "ไม่เข้าร่วม",
    guestsLabel: "จำนวนผู้ติดตาม",
    guestCountPlaceholder: "จำนวนผู้ร่วมงาน (รวมตัวท่าน)",
    submitRsvp: "ยืนยันการเข้าร่วม",
    rsvpThanks: "ขอบคุณที่ตอบรับ",
    rsvpSuccess: "แล้วพบกันในวันงานนะคะ!",
    signOutBtn: "เปลี่ยนบัญชี / ยกเลิก",
    calendarTitle: "บันทึกวันสำคัญของเรา",
    calendarDesc: "เพิ่มวันแต่งงานของเราลงในปฏิทินของคุณ",
    addToCalendar: "เพิ่มในปฏิทิน",
    calendarEventTitle: "งานแต่งงานสุนีย์ & ศุภกิตติ์",
    calendarEventDetails: "ร่วมแสดงความยินดีในวันสำคัญของเรา - #SuneeSupakitWedding",
    payBtn: "โอนเงิน",
    payTitle: "สนับสนุนของขวัญ — โอนเงิน",
    payerNameLabel: "ชื่อผู้โอน (แสดงบนสลิป)",
    payerNamePlaceholder: "ชื่อ - นามสกุล",
    payerEmailLabel: "อีเมล (ไม่บังคับ)",
    amountLabel: "จำนวนเงิน (บาท)",
    messageLabel: "คำอวยพร / ข้อความ",
    messagePlaceholder: "คำอวยพรถึงคู่บ่าวสาว",
    uploadSlip: "อัพโหลดสลิป (รูปหรือ PDF)",
    copyAccount: "คัดลอกเลขบัญชี",
    submitPayment: "แจ้งโอน & สลิป",
    payFooterNote: "โปรดแนบสลิปหรือแจ้งชื่อ-จำนวนผู้เข้าร่วมหากต้องการ",
    alertPleaseEnterName: "กรุณากรอกชื่อของคุณ",
    alertNoAccountNumber: "ไม่มีเลขบัญชีที่สามารถคัดลอกได้",
    alertAccountCopied: "คัดลอกเลขบัญชีเรียบร้อย: ",
    alertCannotCopyAccount: "ไม่สามารถคัดลอกเลขบัญชีได้",
    alertPleaseEnterValidAmount: "กรุณาระบุจำนวนเงินที่ถูกต้อง",
    alertPaymentSuccess: "อัพโหลดสลิปและแจ้งโอนเรียบร้อย ขอบคุณมากค่ะ",
    alertCannotReadSlip: "ไม่สามารถอ่านไฟล์สลิปได้",
    alertSending: "กำลังส่ง...",
    alertFileTooLarge: "ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)",
    alertInvalidFileType: "ประเภทไฟล์ไม่ถูกต้อง (รองรับ JPG, PNG, GIF, WebP, PDF)",
    submit: "ส่ง",
    cancel: "ยกเลิก",
    close: "ปิด",
    uploading: "กำลังอัพโหลด:",
  },
  en: {
    langName: "English",
    flag: "🇺🇸",
    heroSubtitle: "We're Getting Married",
    heroNames: "Sunee & Supakit",
    heroDate: "22.11.2026",
    invitationText: "You are cordially invited to the wedding ceremony of",
    brideName: "Sunee",
    brideFullname: "(Sunee Mongkolvorakitchai)",
    brideParents: "Daughter of Mr. Chanchai Mongkolvorakitchai & Mrs. Malai Wannapoonga",
    groomName: "Supakit",
    groomFullname: "(Supakit Sujaritcheewawong)",
    groomParents: "Son of Mr. Somchai Sujaritcheewawong & Mrs. Suporn Supool",
    brideFamily: "Mrs. Malai Wannapoonga\nMr. Chanchai Mongkolvorakitchai",
    groomFamily: "Mrs. Suporn Supool\nMr. Somchai Sujaritcheewawong",
    brideFamilyName: "Mongkolvorakitchai",
    groomFamilyName: "Sujaritcheewawong",
    brideFullDisplay: "Sunee Mongkolvorakitchai",
    groomFullDisplay: "Supakit Sujaritcheewawong",
    invDetailDate: "Sunday, 22 November 2026 at 07:00 AM",
    invDetailVenue: "BokRak VIVACE WEDDING HALL Ratchapruek",
    footerApology: "We apologize if we could not invite you in person",
    countdownTitle: "Counting Down to Our Day",
    countdownComplete: "The Wedding Day is Here!",
    days: "Days",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
    scheduleTitle: "Wedding Schedule",
    scheduleSubtitle: '"Morning Ceremony, Luncheon Reception"',
    time1: "08:09 AM",
    buddhist: "Buddhist Ceremony",
    time2: "09:09 AM",
    procession: "Groom's Procession",
    time3: "10:09 AM",
    waterBlessing: "Water Blessing Ceremony",
    time4: "12:00 PM",
    luncheon: "Luncheon Reception",
    galleryTitle: "Our Memories",
    venueTitle: "Venue",
    venueName: "VIVACE WEDDING HALL Ratchapruek",
    venueAddress: "18/15 Ratchapruek Road, Om Kret, Pak Kret, Nonthaburi 11120, Thailand",
    viewMap: "View Map",
    venueDateNum: "22.11.26",
    venueDateSub: "BokRak VIVACE WEDDING HALL Ratchapruek",
    dressCode: "Dress Code",
    themeColor: "Theme Colors:",
    rsvpTitle: "RSVP",
    signInPrompt: "Please sign in with Google to RSVP",
    guestToggle: "No Gmail? Register with your name",
    nameLabel: "Full Name",
    namePlaceholder: "e.g., John Smith",
    emailLabel: "Email (optional)",
    attending: "Attending",
    notAttending: "Not Attending",
    guestsLabel: "Number of Guests",
    guestCountPlaceholder: "Number of guests (including yourself)",
    submitRsvp: "Confirm Attendance",
    rsvpThanks: "Thank you for your response",
    rsvpSuccess: "See you at the wedding!",
    signOutBtn: "Change account / Cancel",
    calendarTitle: "Save Our Date",
    calendarDesc: "Add our wedding to your calendar",
    addToCalendar: "Add to Calendar",
    calendarEventTitle: "Sunee & Supakit Wedding",
    calendarEventDetails: "Join us for our special day - #SuneeSupakitWedding",
    payBtn: "Send Gift",
    payTitle: "Wedding Gift — Bank Transfer",
    payerNameLabel: "Your Name (as shown on slip)",
    payerNamePlaceholder: "Full Name",
    payerEmailLabel: "Email (optional)",
    amountLabel: "Amount (THB)",
    messageLabel: "Blessing Message",
    messagePlaceholder: "Your blessing to the couple",
    uploadSlip: "Upload Slip (Image or PDF)",
    copyAccount: "Copy Account",
    submitPayment: "Submit Transfer",
    payFooterNote: "Please attach slip or provide your name and guest count if needed",
    alertPleaseEnterName: "Please enter your name",
    alertNoAccountNumber: "No account number available to copy",
    alertAccountCopied: "Account number copied: ",
    alertCannotCopyAccount: "Cannot copy account number",
    alertPleaseEnterValidAmount: "Please enter a valid amount",
    alertPaymentSuccess: "Slip uploaded and payment confirmed. Thank you!",
    alertCannotReadSlip: "Cannot read slip file",
    alertSending: "Sending...",
    alertFileTooLarge: "File is too large (max 5MB)",
    alertInvalidFileType: "Invalid file type (only JPG, PNG, GIF, WebP, PDF allowed)",
    submit: "Submit",
    cancel: "Cancel",
    close: "Close",
    uploading: "Uploading:",
  },
};

export type TranslationKey = keyof (typeof translations)["th"];
```

- [ ] **Step 3: Write `providers/I18nProvider.tsx`**

```tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { translations, TranslationKey } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("th");

  function t(key: TranslationKey): string {
    return translations[lang][key] ?? translations["th"][key] ?? key;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
```

- [ ] **Step 4: Replace `app/globals.css`**

```css
@import "tailwindcss";

:root {
  --bg: #fdf6f0;
  --bg-alt: #f5ebe4;
  --accent: #b76e79;
  --accent-light: #d4949f;
  --gold: #c9a07a;
  --text: #2d2d2d;
  --text-soft: #7a6b6b;
  --white: #ffffff;
}

body {
  background-color: var(--bg);
  color: var(--text);
}

.font-serif-display {
  font-family: var(--font-libre-baskerville), Georgia, serif;
}

.fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}
```

- [ ] **Step 5: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Libre_Baskerville, Lato } from "next/font/google";
import { I18nProvider } from "@/providers/I18nProvider";
import "./globals.css";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-libre-baskerville",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: "Sunee & Supakit | The Wedding",
  description: "You are cordially invited to our wedding on 22 November 2026",
  openGraph: {
    title: "Sunee & Supakit | The Wedding",
    description: "22 November 2026 · BokRak VIVACE WEDDING HALL",
    images: ["/portrait.jpeg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${libreBaskerville.variable} ${lato.variable}`}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css app/layout.tsx lib/ providers/
git commit -m "feat: add design tokens, i18n system, layout"
```

---

### Task 3: Shared UI Atoms

**Files:**
- Create: `wedding-nextjs/components/ui/GoldDivider.tsx`
- Create: `wedding-nextjs/components/ui/FadeInSection.tsx`
- Create: `wedding-nextjs/components/ui/LanguageSwitcher.tsx`

**Interfaces:**
- Consumes: `useI18n()` from `@/providers/I18nProvider` (LanguageSwitcher only)
- Produces:
  - `<GoldDivider className? />` — decorative gold hr line
  - `<FadeInSection className? delay? children />` — Intersection Observer fade wrapper
  - `<LanguageSwitcher />` — flag dropdown calls `setLang`

- [ ] **Step 1: Write `components/ui/GoldDivider.tsx`**

```tsx
export function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex-1 h-px bg-[var(--gold)] opacity-40" />
      <div className="w-1 h-1 rounded-full bg-[var(--gold)] opacity-60" />
      <div className="flex-1 h-px bg-[var(--gold)] opacity-40" />
    </div>
  );
}
```

- [ ] **Step 2: Write `components/ui/FadeInSection.tsx`**

```tsx
"use client";

import { useEffect, useRef, ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeInSection({ children, className = "", delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("visible"), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`fade-in ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Write `components/ui/LanguageSwitcher.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { LANG_LIST } from "@/lib/types";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--gold)] text-sm text-[var(--text-soft)] hover:border-[var(--accent)] transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{t("flag")}</span>
        <span>{t("langName")}</span>
        <span className="text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-[var(--bg-alt)] z-50 overflow-hidden"
        >
          {LANG_LIST.map((l) => (
            <button
              key={l}
              role="option"
              aria-selected={l === lang}
              onClick={() => { setLang(l); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-[var(--bg-alt)] transition-colors ${
                l === lang ? "text-[var(--accent)] font-semibold" : "text-[var(--text)]"
              }`}
            >
              <span>{l === "th" ? "🇹🇭" : "🇺🇸"}</span>
              <span>{l === "th" ? "ไทย" : "English"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/ui/
git commit -m "feat: add GoldDivider, FadeInSection, LanguageSwitcher"
```

---

### Task 4: Envelope Animation Page (`/`)

**Files:**
- Create: `wedding-nextjs/components/envelope/EnvelopeAnimation.tsx`
- Modify: `wedding-nextjs/app/page.tsx`

**Interfaces:**
- Consumes: `next/navigation` `useRouter`
- Produces: animated envelope click → portrait card → navigate to `/invitation`

- [ ] **Step 1: Write `components/envelope/EnvelopeAnimation.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Phase = "idle" | "opening" | "card";

export function EnvelopeAnimation() {
  const [phase, setPhase] = useState<Phase>("idle");
  const router = useRouter();

  function handleEnvelopeClick() {
    if (phase !== "idle") return;
    setPhase("opening");
    setTimeout(() => setPhase("card"), 1600);
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "var(--bg)" }}
    >
      {/* ENVELOPE */}
      <div
        onClick={handleEnvelopeClick}
        style={{
          position: "relative",
          cursor: phase === "card" ? "default" : "pointer",
          filter: "drop-shadow(0 20px 48px rgba(183,110,121,0.18))",
          transition: "opacity 0.5s ease",
          opacity: phase === "card" ? 0 : 1,
          pointerEvents: phase === "card" ? "none" : "auto",
        }}
      >
        <div style={{ position: "relative", width: "min(88vw, 480px)", aspectRatio: "3/2" }}>
          {/* envelope back */}
          <div className="absolute inset-0 rounded-md z-[1]" style={{ background: "var(--accent)" }} />

          {/* card inside */}
          <div
            className="absolute z-[2]"
            style={{
              top: 8, left: 8, right: 8, bottom: 5,
              transition: phase === "opening" ? "transform 1.4s cubic-bezier(0.34,1.56,0.64,1)" : "none",
              transform: phase === "opening" ? "translateY(-90px)" : "none",
              transformOrigin: "bottom center",
            }}
          >
            <div className="w-full h-full bg-white rounded-sm overflow-hidden grid" style={{ gridTemplateColumns: "1fr auto" }}>
              <div className="flex flex-col justify-center p-[clamp(14px,4vw,24px)] gap-1">
                <p className="font-serif-display italic uppercase tracking-widest text-[var(--accent-light)]"
                   style={{ fontSize: "clamp(0.52rem,1.4vw,0.68rem)" }}>
                  Wedding Invitation
                </p>
                <h1 className="font-serif-display text-[var(--accent)] leading-tight"
                    style={{ fontSize: "clamp(1.4rem,3.8vw,2.1rem)" }}>
                  Sunee<br />&amp; Supakit
                </h1>
                <div className="w-7 h-px bg-[var(--gold)] opacity-50 my-1" />
                <p className="text-[var(--text-soft)]" style={{ fontSize: "clamp(0.65rem,1.6vw,0.8rem)" }}>22.11.2026</p>
                <p className="text-[var(--text-soft)]" style={{ fontSize: "clamp(0.6rem,1.4vw,0.72rem)" }}>VIVACE WEDDING HALL</p>
              </div>
              <div className="relative w-[clamp(80px,22vw,130px)]">
                <Image src="/couple.jpeg" alt="Sunee & Supakit" fill className="object-cover" priority />
              </div>
            </div>
          </div>

          {/* flap top */}
          <div className="absolute left-0 right-0 top-0 z-[3]"
               style={{
                 height: "50%",
                 background: "var(--accent)",
                 clipPath: "polygon(0 0, 50% 80%, 100% 0)",
                 transformOrigin: "top center",
                 transition: phase === "opening" ? "transform 0.6s ease 0.2s" : "none",
                 transform: phase === "opening" ? "rotateX(180deg)" : "rotateX(0deg)",
                 backfaceVisibility: "hidden",
               }} />
          {/* bottom-left flap */}
          <div className="absolute left-0 bottom-0 z-[4]"
               style={{ width: "50%", height: "55%", background: "var(--accent-light)", opacity: 0.85,
                        clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }} />
          {/* bottom-right flap */}
          <div className="absolute right-0 bottom-0 z-[4]"
               style={{ width: "50%", height: "55%", background: "var(--accent)", opacity: 0.9,
                        clipPath: "polygon(0 100%, 100% 100%, 0 0)" }} />
        </div>
      </div>

      {/* tap hint */}
      {phase === "idle" && (
        <p className="mt-6 text-[var(--text-soft)] text-sm tracking-widest uppercase animate-pulse">
          Tap to open
        </p>
      )}

      {/* PORTRAIT CARD */}
      {phase === "card" && (
        <div className="flex flex-col items-center gap-6"
             style={{ animation: "fadeUp 0.7s ease forwards" }}>
          <div className="relative rounded-2xl overflow-hidden"
               style={{ width: "min(75vw, 300px)", aspectRatio: "3/4",
                        boxShadow: "0 20px 60px rgba(183,110,121,0.25)" }}>
            <Image src="/portrait.jpeg" alt="Sunee & Supakit" fill className="object-cover" priority />
            <div className="absolute inset-0"
                 style={{ background: "linear-gradient(to top, rgba(45,45,45,0.5) 0%, transparent 60%)" }} />
            <div className="absolute bottom-4 left-0 right-0 text-center text-white">
              <p className="font-serif-display italic text-lg">Sunee &amp; Supakit</p>
              <p className="text-xs tracking-widest opacity-80 mt-1">22 · 11 · 2026</p>
            </div>
          </div>

          <button
            onClick={() => router.push("/invitation")}
            className="px-8 py-3 rounded-full text-white text-sm tracking-widest uppercase transition-transform hover:scale-105 active:scale-95"
            style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(183,110,121,0.4)" }}
          >
            Open Invitation
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Replace `app/page.tsx`**

```tsx
import { EnvelopeAnimation } from "@/components/envelope/EnvelopeAnimation";

export default function HomePage() {
  return <EnvelopeAnimation />;
}
```

- [ ] **Step 3: Verify in browser**

http://localhost:3000 — blush background, envelope center. Click → flap opens, card rises → portrait card fades in → "Open Invitation" button → navigates to /invitation (404 for now).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/envelope/
git commit -m "feat: add envelope animation page"
```

---

### Task 5: Hero + Invitation Card Section

**Files:**
- Create: `wedding-nextjs/components/invitation/HeroSection.tsx`
- Create: `wedding-nextjs/components/invitation/InvitationSection.tsx`
- Create: `wedding-nextjs/app/invitation/page.tsx`

**Interfaces:**
- Consumes: `useI18n()`, `<GoldDivider />`, `<LanguageSwitcher />`, `<FadeInSection />`
- Produces: hero + invitation card visible at `/invitation`

- [ ] **Step 1: Write `components/invitation/HeroSection.tsx`**

```tsx
"use client";

import Image from "next/image";
import { useI18n } from "@/providers/I18nProvider";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { GoldDivider } from "@/components/ui/GoldDivider";

export function HeroSection() {
  const { t } = useI18n();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-16 overflow-hidden"
             style={{ background: "var(--bg)" }}>
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      {/* background photo */}
      <div className="absolute inset-0">
        <Image src="/couple.jpeg" alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-0"
             style={{ background: "linear-gradient(to bottom, rgba(253,246,240,0.85) 0%, rgba(253,246,240,0.7) 50%, rgba(253,246,240,0.92) 100%)" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5 max-w-lg">
        <p className="text-[var(--text-soft)] tracking-[0.3em] uppercase text-xs">
          {t("heroSubtitle")}
        </p>
        <GoldDivider className="w-32" />
        <h1 className="font-serif-display text-[var(--accent)] leading-tight"
            style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)" }}>
          {t("heroNames")}
        </h1>
        <GoldDivider className="w-32" />
        <p className="text-[var(--text-soft)] tracking-[0.2em]"
           style={{ fontSize: "clamp(0.8rem, 2vw, 1rem)" }}>
          {t("heroDate")}
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--text-soft)]">
        <span className="text-xs tracking-widest uppercase opacity-60">Scroll</span>
        <div className="w-px h-8 bg-[var(--gold)] opacity-50 animate-bounce" />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write `components/invitation/InvitationSection.tsx`**

```tsx
"use client";

import Image from "next/image";
import { useI18n } from "@/providers/I18nProvider";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeInSection } from "@/components/ui/FadeInSection";

export function InvitationSection() {
  const { t } = useI18n();

  return (
    <section className="py-20 px-6" style={{ background: "var(--bg-alt)" }}>
      <div className="max-w-2xl mx-auto">
        <FadeInSection className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 text-[var(--text-soft)] mb-6"
               style={{ fontSize: "clamp(0.75rem, 1.8vw, 0.9rem)" }}>
            <div className="text-right leading-relaxed whitespace-pre-line">{t("brideFamily")}</div>
            <div className="text-[var(--gold)] text-2xl font-serif-display">&amp;</div>
            <div className="text-left leading-relaxed whitespace-pre-line">{t("groomFamily")}</div>
          </div>
          <p className="text-[var(--text-soft)] mb-8 italic"
             style={{ fontSize: "clamp(0.8rem, 1.8vw, 0.95rem)" }}>
            {t("invitationText")}
          </p>
        </FadeInSection>

        <FadeInSection className="flex items-center justify-center gap-6 mb-10">
          {/* Bride */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative overflow-hidden border-2 border-[var(--gold)]"
                 style={{ width: "clamp(90px,22vw,140px)", height: "clamp(110px,27vw,175px)", borderRadius: "100px" }}>
              <Image src="/bride.jpeg" alt={t("brideName")} fill className="object-cover" />
            </div>
            <p className="font-serif-display text-[var(--accent)] text-xl">{t("brideName")}</p>
            <p className="text-[var(--text-soft)] text-xs tracking-wide">{t("brideFamilyName")}</p>
          </div>

          <div className="font-serif-display italic text-[var(--accent)] self-center"
               style={{ fontSize: "clamp(2rem,6vw,3rem)" }}>
            &amp;
          </div>

          {/* Groom */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative overflow-hidden border-2 border-[var(--gold)]"
                 style={{ width: "clamp(90px,22vw,140px)", height: "clamp(110px,27vw,175px)", borderRadius: "100px" }}>
              <Image src="/groom.jpeg" alt={t("groomName")} fill className="object-cover" />
            </div>
            <p className="font-serif-display text-[var(--accent)] text-xl">{t("groomName")}</p>
            <p className="text-[var(--text-soft)] text-xs tracking-wide">{t("groomFamilyName")}</p>
          </div>
        </FadeInSection>

        <FadeInSection className="text-center" delay={200}>
          <GoldDivider className="mb-6" />
          <p className="font-semibold text-[var(--text)] mb-1" style={{ fontSize: "clamp(0.85rem,2vw,1rem)" }}>
            {t("invDetailDate")}
          </p>
          <p className="text-[var(--text-soft)]" style={{ fontSize: "clamp(0.8rem,1.8vw,0.95rem)" }}>
            {t("invDetailVenue")}
          </p>
          <GoldDivider className="mt-6 mb-4" />
          <p className="italic text-[var(--text-soft)] text-sm">{t("footerApology")}</p>
        </FadeInSection>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `app/invitation/page.tsx`**

```tsx
import { HeroSection } from "@/components/invitation/HeroSection";
import { InvitationSection } from "@/components/invitation/InvitationSection";

export default function InvitationPage() {
  return (
    <main>
      <HeroSection />
      <InvitationSection />
    </main>
  );
}
```

- [ ] **Step 4: Verify**

http://localhost:3000/invitation — hero with couple photo bg, rose gold names, gold dividers, language switcher. Scroll to invitation card: family names, arch photos, date/venue. Switch to English — text changes.

- [ ] **Step 5: Commit**

```bash
git add app/invitation/ components/invitation/HeroSection.tsx components/invitation/InvitationSection.tsx
git commit -m "feat: add hero and invitation card sections"
```

---

### Task 6: Countdown Section

**Files:**
- Create: `wedding-nextjs/components/invitation/CountdownSection.tsx`
- Modify: `wedding-nextjs/app/invitation/page.tsx`

**Interfaces:**
- Consumes: `useI18n()` → `t("countdownTitle")`, `t("days")`, `t("hours")`, `t("minutes")`, `t("seconds")`, `t("countdownComplete")`
- Produces: client-only countdown to `new Date("2026-11-22T07:00:00+07:00")`

- [ ] **Step 1: Write `components/invitation/CountdownSection.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeInSection } from "@/components/ui/FadeInSection";

const WEDDING_DATE = new Date("2026-11-22T07:00:00+07:00");

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number; }

function getTimeLeft(): TimeLeft {
  const diff = WEDDING_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

export function CountdownSection() {
  const { t } = useI18n();
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTime(getTimeLeft());
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const isDone = time !== null && Object.values(time).every((v) => v === 0);

  return (
    <section className="py-20 px-6" style={{ background: "var(--bg)" }}>
      <div className="max-w-xl mx-auto text-center">
        <FadeInSection>
          <h2 className="font-serif-display text-[var(--accent)] mb-8"
              style={{ fontSize: "clamp(1.3rem,3.5vw,1.8rem)", letterSpacing: "0.06em" }}>
            {t("countdownTitle")}
          </h2>
        </FadeInSection>

        <FadeInSection delay={100}>
          {isDone ? (
            <p className="font-serif-display text-[var(--accent)] text-2xl italic">{t("countdownComplete")}</p>
          ) : (
            <div className="flex items-start justify-center gap-4">
              {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
                <div key={unit} className="flex flex-col items-center">
                  <div className="rounded-xl flex items-center justify-center font-serif-display text-white"
                       style={{ background: "var(--accent)", width: "clamp(60px,16vw,88px)", height: "clamp(60px,16vw,88px)",
                                fontSize: "clamp(1.6rem,5vw,2.5rem)", boxShadow: "0 4px 20px rgba(183,110,121,0.3)" }}>
                    {time ? pad(time[unit]) : "00"}
                  </div>
                  <span className="mt-2 text-[var(--text-soft)] tracking-widest uppercase"
                        style={{ fontSize: "clamp(0.55rem,1.3vw,0.65rem)" }}>
                    {t(unit)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </FadeInSection>

        <FadeInSection delay={200} className="mt-10"><GoldDivider /></FadeInSection>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update `app/invitation/page.tsx`**

```tsx
import { HeroSection } from "@/components/invitation/HeroSection";
import { InvitationSection } from "@/components/invitation/InvitationSection";
import { CountdownSection } from "@/components/invitation/CountdownSection";

export default function InvitationPage() {
  return (
    <main>
      <HeroSection />
      <InvitationSection />
      <CountdownSection />
    </main>
  );
}
```

- [ ] **Step 3: Verify** — countdown shows live digits updating each second.

- [ ] **Step 4: Commit**

```bash
git add components/invitation/CountdownSection.tsx app/invitation/page.tsx
git commit -m "feat: add live countdown section"
```

---

### Task 7: Schedule Section

**Files:**
- Create: `wedding-nextjs/components/invitation/ScheduleSection.tsx`
- Modify: `wedding-nextjs/app/invitation/page.tsx`

**Interfaces:**
- Consumes: `useI18n()` → time1-4 keys, event name keys, scheduleTitle, scheduleSubtitle
- Produces: 4-item responsive grid with icon circles

- [ ] **Step 1: Write `components/invitation/ScheduleSection.tsx`**

```tsx
"use client";

import { useI18n } from "@/providers/I18nProvider";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeInSection } from "@/components/ui/FadeInSection";
import type { TranslationKey } from "@/lib/i18n";

const SCHEDULE_SVG_PATHS = [
  "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
];

const ITEMS: { timeKey: TranslationKey; eventKey: TranslationKey }[] = [
  { timeKey: "time1", eventKey: "buddhist" },
  { timeKey: "time2", eventKey: "procession" },
  { timeKey: "time3", eventKey: "waterBlessing" },
  { timeKey: "time4", eventKey: "luncheon" },
];

export function ScheduleSection() {
  const { t } = useI18n();

  return (
    <section className="py-20 px-6" style={{ background: "var(--bg-alt)" }}>
      <div className="max-w-3xl mx-auto">
        <FadeInSection className="text-center mb-12">
          <h2 className="font-serif-display text-[var(--accent)] mb-3"
              style={{ fontSize: "clamp(1.3rem,3.5vw,1.8rem)", letterSpacing: "0.06em" }}>
            {t("scheduleTitle")}
          </h2>
          <p className="italic text-[var(--text-soft)] text-sm">{t("scheduleSubtitle")}</p>
          <GoldDivider className="mt-6 max-w-xs mx-auto" />
        </FadeInSection>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {ITEMS.map(({ timeKey, eventKey }, i) => (
            <FadeInSection key={timeKey} delay={i * 100}>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="rounded-full flex items-center justify-center"
                     style={{ width: 56, height: 56, background: "var(--bg)",
                              border: "1.5px solid var(--gold)", color: "var(--accent)" }}>
                  <svg width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={SCHEDULE_SVG_PATHS[i]} />
                  </svg>
                </div>
                <p className="font-semibold text-[var(--accent)]" style={{ fontSize: "clamp(0.85rem,2vw,1rem)" }}>
                  {t(timeKey)}
                </p>
                <p className="text-[var(--text-soft)]" style={{ fontSize: "clamp(0.75rem,1.8vw,0.9rem)" }}>
                  {t(eventKey)}
                </p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update `app/invitation/page.tsx`**

```tsx
import { HeroSection } from "@/components/invitation/HeroSection";
import { InvitationSection } from "@/components/invitation/InvitationSection";
import { CountdownSection } from "@/components/invitation/CountdownSection";
import { ScheduleSection } from "@/components/invitation/ScheduleSection";

export default function InvitationPage() {
  return (
    <main>
      <HeroSection />
      <InvitationSection />
      <CountdownSection />
      <ScheduleSection />
    </main>
  );
}
```

- [ ] **Step 3: Verify** — 4 schedule items in 2x2 grid on mobile, 4-across on sm+.

- [ ] **Step 4: Commit**

```bash
git add components/invitation/ScheduleSection.tsx app/invitation/page.tsx
git commit -m "feat: add schedule section"
```

---

### Task 8: Gallery Section + Modal

**Files:**
- Create: `wedding-nextjs/components/ui/GalleryModal.tsx`
- Create: `wedding-nextjs/components/invitation/GallerySection.tsx`
- Modify: `wedding-nextjs/app/invitation/page.tsx`

**Interfaces:**
- Consumes: `useI18n()` → `t("galleryTitle")`
- Produces: CSS columns masonry, click → `<GalleryModal>` lightbox
- CONSTRAINT: No FadeInSection on individual gallery items (AOS/opacity breaks column height)

- [ ] **Step 1: Write `components/ui/GalleryModal.tsx`**

```tsx
"use client";

import { useEffect } from "react";

interface Props { src: string; alt: string; onClose: () => void; }

export function GalleryModal({ src, alt, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
         onClick={onClose}>
      <button className="absolute top-4 right-4 text-white text-3xl leading-none z-10"
              onClick={onClose} aria-label="Close">&times;</button>
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt}
             className="max-w-[90vw] max-h-[90vh] rounded-lg object-contain"
             style={{ userSelect: "none", pointerEvents: "none" }}
             draggable={false}
             onContextMenu={(e) => e.preventDefault()} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `components/invitation/GallerySection.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeInSection } from "@/components/ui/FadeInSection";
import { GalleryModal } from "@/components/ui/GalleryModal";

const GALLERY_IMAGES = [
  "0DDC2E8C-D066-4D08-8E29-4EE235F49664_4_5005_c.jpeg",
  "1D7A9659-D955-4901-A46E-D2750CC311CB_4_5005_c.jpeg",
  "2444242F-7559-4BCE-8078-7DB2821EB427_4_5005_c.jpeg",
  "2C109171-DFD5-42AA-95DD-707182DD5D91_4_5005_c.jpeg",
  "325A1400-7312-4FBF-A84F-33E9298892D5_4_5005_c.jpeg",
  "33E9EBA4-35EC-4C12-9969-15EAC5378F58_4_5005_c.jpeg",
  "3AA7D0B6-357A-4A2F-9B64-E8896BD3539F_4_5005_c.jpeg",
  "3D6A8116-637B-4792-9AF0-2FF3B2DEC3BC_4_5005_c.jpeg",
  "47172C94-4F19-438B-B42C-11937A8E904E_4_5005_c.jpeg",
  "5D420CFC-9E80-4DA7-A171-E248EA5972C3_4_5005_c.jpeg",
  "6B9E29C6-8765-4387-ACA3-87817BDBD0FB_4_5005_c.jpeg",
  "7356CAF7-8B78-4401-A39C-1CBE7BD76403_4_5005_c.jpeg",
  "743884F6-F4EC-4EA1-AB86-0BEBA0FB44B8_4_5005_c.jpeg",
  "8B6C6F8D-E94B-492F-8F35-D682FFE55D07_4_5005_c.jpeg",
  "8DE6BD0D-869A-42B6-A2D2-A56EE19BDECD_4_5005_c.jpeg",
  "B20F5DEB-7EE1-4C9C-87A1-0A49033111F5_4_5005_c.jpeg",
  "B44639D5-BFB1-4B74-A0E8-48F86966DBB3_4_5005_c.jpeg",
  "B936D023-B78C-4BBC-85F2-CB2978783E5E_4_5005_c.jpeg",
  "C778697B-B20C-4107-BB53-3A3F41C83B50_4_5005_c.jpeg",
  "D8A3291D-B3CA-44C9-ADA6-77135852AFE1_4_5005_c.jpeg",
];

export function GallerySection() {
  const { t } = useI18n();
  const [modal, setModal] = useState<{ src: string; alt: string } | null>(null);

  return (
    <section className="py-20 px-4" style={{ background: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto">
        <FadeInSection className="text-center mb-12">
          <h2 className="font-serif-display text-[var(--accent)] mb-3"
              style={{ fontSize: "clamp(1.3rem,3.5vw,1.8rem)", letterSpacing: "0.06em" }}>
            {t("galleryTitle")}
          </h2>
          <GoldDivider className="max-w-xs mx-auto mt-4" />
        </FadeInSection>

        {/* CSS columns masonry — NO FadeInSection on items */}
        <div style={{ columnCount: 2, columnGap: 12 }}
             className="sm:[column-count:3] lg:[column-count:4]">
          {GALLERY_IMAGES.map((filename) => (
            <div key={filename}
                 className="inline-block w-full mb-3 break-inside-avoid overflow-hidden rounded-lg cursor-pointer"
                 style={{ transition: "transform 0.25s ease, box-shadow 0.25s ease" }}
                 onClick={() => setModal({ src: `/gallory/${filename}`, alt: t("galleryTitle") })}
                 onMouseEnter={(e) => {
                   const el = e.currentTarget as HTMLElement;
                   el.style.transform = "scale(1.02)";
                   el.style.boxShadow = "0 8px 30px rgba(183,110,121,0.25)";
                 }}
                 onMouseLeave={(e) => {
                   const el = e.currentTarget as HTMLElement;
                   el.style.transform = "scale(1)";
                   el.style.boxShadow = "none";
                 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/gallory/${filename}`} alt="Pre-wedding photo"
                   loading="lazy" className="w-full h-auto block"
                   style={{ userSelect: "none", pointerEvents: "none" }}
                   draggable={false} onContextMenu={(e) => e.preventDefault()} />
            </div>
          ))}
        </div>
      </div>

      {modal && <GalleryModal src={modal.src} alt={modal.alt} onClose={() => setModal(null)} />}
    </section>
  );
}
```

- [ ] **Step 3: Update `app/invitation/page.tsx`**

```tsx
import { HeroSection } from "@/components/invitation/HeroSection";
import { InvitationSection } from "@/components/invitation/InvitationSection";
import { CountdownSection } from "@/components/invitation/CountdownSection";
import { ScheduleSection } from "@/components/invitation/ScheduleSection";
import { GallerySection } from "@/components/invitation/GallerySection";

export default function InvitationPage() {
  return (
    <main>
      <HeroSection />
      <InvitationSection />
      <CountdownSection />
      <ScheduleSection />
      <GallerySection />
    </main>
  );
}
```

- [ ] **Step 4: Verify** — 20 photos in masonry, click → modal opens, Escape closes, photos not invisible.

- [ ] **Step 5: Commit**

```bash
git add components/invitation/GallerySection.tsx components/ui/GalleryModal.tsx app/invitation/page.tsx
git commit -m "feat: add masonry gallery with zoom modal"
```

---

### Task 9: Venue + Dress Code Section

**Files:**
- Create: `wedding-nextjs/components/invitation/VenueSection.tsx`
- Modify: `wedding-nextjs/app/invitation/page.tsx`

**Interfaces:**
- Consumes: `useI18n()` → venueTitle, venueName, venueAddress, viewMap, venueDateNum, venueDateSub, dressCode, themeColor
- Produces: venue card + date badge + dress code swatches

- [ ] **Step 1: Write `components/invitation/VenueSection.tsx`**

```tsx
"use client";

import { useI18n } from "@/providers/I18nProvider";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeInSection } from "@/components/ui/FadeInSection";

const MAP_URL = "https://www.google.com/maps/search/?api=1&query=VIVACE+WEDDING+HALL+Ratchapruek+Nonthaburi";

const DRESS_COLORS = [
  { hex: "#f2d7df", label: "Light Pink" },
  { hex: "#edc1cd", label: "Blush" },
  { hex: "#f1b984", label: "Peach" },
  { hex: "#789666", label: "Sage" },
  { hex: "#8e1e1c", label: "Wine" },
];

export function VenueSection() {
  const { t } = useI18n();

  return (
    <section className="py-20 px-6" style={{ background: "var(--bg-alt)" }}>
      <div className="max-w-2xl mx-auto">
        <FadeInSection className="text-center mb-12">
          <h2 className="font-serif-display text-[var(--accent)] mb-3"
              style={{ fontSize: "clamp(1.3rem,3.5vw,1.8rem)", letterSpacing: "0.06em" }}>
            {t("venueTitle")}
          </h2>
          <GoldDivider className="max-w-xs mx-auto mt-4" />
        </FadeInSection>

        <FadeInSection>
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8" style={{ borderTop: "3px solid var(--gold)" }}>
            <p className="font-serif-display text-[var(--accent)] mb-2"
               style={{ fontSize: "clamp(1rem,2.5vw,1.25rem)" }}>{t("venueName")}</p>
            <p className="text-[var(--text-soft)] text-sm mb-6 leading-relaxed">{t("venueAddress")}</p>
            <a href={MAP_URL} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm tracking-wider transition-transform hover:scale-105"
               style={{ background: "var(--accent)" }}>
              <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t("viewMap")}
            </a>
          </div>
        </FadeInSection>

        <FadeInSection delay={100} className="text-center mb-10">
          <div className="inline-flex flex-col items-center px-10 py-5 rounded-2xl"
               style={{ background: "var(--bg)", border: "1px solid var(--gold)" }}>
            <p className="font-serif-display text-[var(--accent)]"
               style={{ fontSize: "clamp(1.6rem,5vw,2.2rem)", letterSpacing: "0.1em" }}>
              {t("venueDateNum")}
            </p>
            <p className="text-[var(--text-soft)] text-xs tracking-widest uppercase mt-1">
              {t("venueDateSub")}
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center" style={{ borderTop: "3px solid var(--gold)" }}>
            <h3 className="font-serif-display text-[var(--accent)] mb-2"
                style={{ fontSize: "clamp(1rem,2.5vw,1.25rem)" }}>{t("dressCode")}</h3>
            <p className="text-[var(--text-soft)] text-xs mb-5 tracking-widest uppercase">{t("themeColor")}</p>
            <div className="flex items-center justify-center gap-3">
              {DRESS_COLORS.map(({ hex, label }) => (
                <div key={hex} title={label} className="rounded-full border-2 border-white"
                     style={{ width: "clamp(36px,9vw,52px)", height: "clamp(36px,9vw,52px)",
                              background: hex, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }} />
              ))}
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update `app/invitation/page.tsx`**

```tsx
import { HeroSection } from "@/components/invitation/HeroSection";
import { InvitationSection } from "@/components/invitation/InvitationSection";
import { CountdownSection } from "@/components/invitation/CountdownSection";
import { ScheduleSection } from "@/components/invitation/ScheduleSection";
import { GallerySection } from "@/components/invitation/GallerySection";
import { VenueSection } from "@/components/invitation/VenueSection";

export default function InvitationPage() {
  return (
    <main>
      <HeroSection />
      <InvitationSection />
      <CountdownSection />
      <ScheduleSection />
      <GallerySection />
      <VenueSection />
    </main>
  );
}
```

- [ ] **Step 3: Verify** — venue card, View Map link opens Google Maps, date badge, 5 color swatches.

- [ ] **Step 4: Commit**

```bash
git add components/invitation/VenueSection.tsx app/invitation/page.tsx
git commit -m "feat: add venue and dress code section"
```

---

### Task 10: RSVP + Payment Section

**Files:**
- Create: `wedding-nextjs/components/invitation/RSVPSection.tsx`
- Modify: `wedding-nextjs/app/invitation/page.tsx`
- Modify: `wedding-nextjs/app/layout.tsx` (add Google Sign-In script)

**Interfaces:**
- Consumes: `useI18n()` → all RSVP/payment keys
- Produces: Google Sign-In + manual guest entry + RSVP form → POST to Apps Script; payment form with slip upload

- [ ] **Step 1: Add Google Sign-In script tag to `app/layout.tsx`**

Add `import Script from "next/script"` and a `<Script>` tag. Full updated file:

```tsx
import type { Metadata } from "next";
import { Libre_Baskerville, Lato } from "next/font/google";
import Script from "next/script";
import { I18nProvider } from "@/providers/I18nProvider";
import "./globals.css";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-libre-baskerville",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: "Sunee & Supakit | The Wedding",
  description: "You are cordially invited to our wedding on 22 November 2026",
  openGraph: {
    title: "Sunee & Supakit | The Wedding",
    description: "22 November 2026 · BokRak VIVACE WEDDING HALL",
    images: ["/portrait.jpeg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${libreBaskerville.variable} ${lato.variable}`}>
        <I18nProvider>{children}</I18nProvider>
        <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Write `components/invitation/RSVPSection.tsx`**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeInSection } from "@/components/ui/FadeInSection";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz4aY1uz9X68BxN5zR_Xf-E8h65zHyCO4fnEAyqDxIg5dVr-S5ZXYhR6WvJn6MZ8Wy_/exec";
const GOOGLE_CLIENT_ID =
  "679261672981-7f2b6ekit43s411jee55nv60i3q7ujn5.apps.googleusercontent.com";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];

interface GoogleUser { email: string; name: string; picture: string; sub: string; }

function parseJwt(token: string): GoogleUser {
  const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(decodeURIComponent(atob(b64).split("").map((c) =>
    "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")));
}

function sanitize(str: string, max = 500): string {
  return str.substring(0, max).replace(/[<>"'`\\]/g, "").trim();
}

export function RSVPSection() {
  const { t } = useI18n();
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [rsvpDone, setRsvpDone] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [payStatus, setPayStatus] = useState("");
  const payFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    (window as unknown as Record<string, unknown>)["handleCredentialResponse"] =
      (response: { credential: string }) => setUser(parseJwt(response.credential));
  }, []);

  function signOut() {
    setUser(null); setShowManual(false); setManualName(""); setManualEmail("");
  }

  async function handleRsvpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = sanitize(user?.name || manualName, 200);
    if (!name) { alert(t("alertPleaseEnterName")); return; }
    const data = new FormData(e.currentTarget);
    data.set("name", name);
    data.set("email", user?.email || manualEmail || "");
    data.set("action", "rsvp");
    await fetch(SCRIPT_URL, { method: "POST", body: data }).catch(() => null);
    setRsvpDone(true);
  }

  async function handlePaySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount") as string);
    if (!amount || amount <= 0) { alert(t("alertPleaseEnterValidAmount")); return; }
    const slip = formData.get("slip") as File | null;
    if (slip && slip.size > 0) {
      if (slip.size > MAX_FILE_SIZE) { alert(t("alertFileTooLarge")); return; }
      if (!ALLOWED_TYPES.includes(slip.type)) { alert(t("alertInvalidFileType")); return; }
    }
    setPayStatus(t("alertSending"));
    formData.set("action", "payment");
    await fetch(SCRIPT_URL, { method: "POST", body: formData }).catch(() => null);
    setPayStatus(t("alertPaymentSuccess"));
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-[var(--bg-alt)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors";
  const labelClass = "block text-[var(--text-soft)] text-xs tracking-widest uppercase mb-1.5";

  return (
    <section className="py-20 px-6" style={{ background: "var(--bg)" }}>
      <div className="max-w-lg mx-auto">
        <FadeInSection className="text-center mb-10">
          <h2 className="font-serif-display text-[var(--accent)] mb-3"
              style={{ fontSize: "clamp(1.3rem,3.5vw,1.8rem)", letterSpacing: "0.06em" }}>
            {t("rsvpTitle")}
          </h2>
          <GoldDivider className="max-w-xs mx-auto mt-4" />
        </FadeInSection>

        {!rsvpDone ? (
          <FadeInSection>
            <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ borderTop: "3px solid var(--gold)" }}>
              {!user && (
                <div className="mb-6">
                  <p className="text-[var(--text-soft)] text-sm text-center mb-4">{t("signInPrompt")}</p>
                  <div className="flex justify-center mb-4">
                    <div id="g_id_onload" data-client_id={GOOGLE_CLIENT_ID}
                         data-callback="handleCredentialResponse" data-auto_prompt="false" />
                    <div className="g_id_signin" data-type="standard" data-size="large"
                         data-theme="outline" data-text="sign_in_with" data-shape="pill" data-logo_alignment="left" />
                  </div>
                  <GoldDivider className="my-4" />
                  {!showManual ? (
                    <button onClick={() => setShowManual(true)}
                            className="w-full text-center text-[var(--text-soft)] text-sm underline underline-offset-2">
                      {t("guestToggle")}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>{t("nameLabel")}</label>
                        <input className={inputClass} value={manualName} onChange={(e) => setManualName(e.target.value)}
                               placeholder={t("namePlaceholder")} maxLength={200} />
                      </div>
                      <div>
                        <label className={labelClass}>{t("emailLabel")}</label>
                        <input className={inputClass} type="email" value={manualEmail}
                               onChange={(e) => setManualEmail(e.target.value)} placeholder="email@example.com" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user && (
                <div className="flex items-center gap-3 mb-6 p-4 rounded-xl" style={{ background: "var(--bg-alt)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text)] text-sm truncate">{user.name}</p>
                    <p className="text-[var(--text-soft)] text-xs truncate">{user.email}</p>
                  </div>
                  <button onClick={signOut} className="text-xs text-[var(--text-soft)] underline shrink-0">
                    {t("signOutBtn")}
                  </button>
                </div>
              )}

              {(user || (showManual && manualName.trim())) && (
                <form onSubmit={handleRsvpSubmit} className="space-y-5">
                  <div>
                    <label className={labelClass}>{t("attending")}</label>
                    <div className="flex gap-3">
                      {(["attending", "notAttending"] as const).map((val) => (
                        <label key={val}
                               className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer text-sm transition-colors"
                               style={{ borderColor: "var(--bg-alt)" }}>
                          <input type="radio" name="attending" value={val} className="accent-[var(--accent)]" required />
                          {t(val)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>{t("guestsLabel")}</label>
                    <input className={inputClass} type="number" name="guestCount" min={1} max={20}
                           placeholder={t("guestCountPlaceholder")} />
                  </div>
                  <button type="submit"
                          className="w-full py-3 rounded-xl text-white text-sm tracking-widest uppercase transition-transform hover:scale-[1.02]"
                          style={{ background: "var(--accent)" }}>
                    {t("submitRsvp")}
                  </button>
                </form>
              )}
            </div>
          </FadeInSection>
        ) : (
          <FadeInSection>
            <div className="text-center py-10">
              <p className="font-serif-display text-[var(--accent)] text-2xl mb-2">{t("rsvpThanks")}</p>
              <p className="text-[var(--text-soft)]">{t("rsvpSuccess")}</p>
            </div>
          </FadeInSection>
        )}

        {/* PAYMENT */}
        <FadeInSection delay={200} className="mt-10">
          <GoldDivider className="mb-10" />
          {!showPayment ? (
            <div className="text-center">
              <button onClick={() => setShowPayment(true)}
                      className="px-8 py-3 rounded-full text-white text-sm tracking-widest uppercase transition-transform hover:scale-105"
                      style={{ background: "var(--gold)" }}>
                {t("payBtn")}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ borderTop: "3px solid var(--gold)" }}>
              <h3 className="font-serif-display text-[var(--accent)] mb-6 text-center"
                  style={{ fontSize: "clamp(1rem,2.5vw,1.2rem)" }}>{t("payTitle")}</h3>
              <form ref={payFormRef} onSubmit={handlePaySubmit} className="space-y-4">
                <div><label className={labelClass}>{t("payerNameLabel")}</label>
                  <input className={inputClass} name="payerName" placeholder={t("payerNamePlaceholder")} maxLength={200} required /></div>
                <div><label className={labelClass}>{t("payerEmailLabel")}</label>
                  <input className={inputClass} name="payerEmail" type="email" /></div>
                <div><label className={labelClass}>{t("amountLabel")}</label>
                  <input className={inputClass} name="amount" type="number" min={1} step={0.01} required /></div>
                <div><label className={labelClass}>{t("messageLabel")}</label>
                  <textarea className={`${inputClass} resize-none`} name="message" rows={3}
                            placeholder={t("messagePlaceholder")} maxLength={500} /></div>
                <div><label className={labelClass}>{t("uploadSlip")}</label>
                  <input className={inputClass} name="slip" type="file"
                         accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" /></div>
                {payStatus && <p className="text-sm text-center text-[var(--text-soft)]">{payStatus}</p>}
                <button type="submit"
                        className="w-full py-3 rounded-xl text-white text-sm tracking-widest uppercase transition-transform hover:scale-[1.02]"
                        style={{ background: "var(--gold)" }}>
                  {t("submitPayment")}
                </button>
              </form>
              <p className="text-xs text-center text-[var(--text-soft)] mt-4 italic">{t("payFooterNote")}</p>
            </div>
          )}
        </FadeInSection>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Update `app/invitation/page.tsx` (final)**

```tsx
import { HeroSection } from "@/components/invitation/HeroSection";
import { InvitationSection } from "@/components/invitation/InvitationSection";
import { CountdownSection } from "@/components/invitation/CountdownSection";
import { ScheduleSection } from "@/components/invitation/ScheduleSection";
import { GallerySection } from "@/components/invitation/GallerySection";
import { VenueSection } from "@/components/invitation/VenueSection";
import { RSVPSection } from "@/components/invitation/RSVPSection";

export default function InvitationPage() {
  return (
    <main>
      <HeroSection />
      <InvitationSection />
      <CountdownSection />
      <ScheduleSection />
      <GallerySection />
      <VenueSection />
      <RSVPSection />
    </main>
  );
}
```

- [ ] **Step 4: Verify** — RSVP shows Google button + manual toggle. Enter name → form appears. Submit → thank you. Payment button → payment form. Note: Google Sign-In shows 403 on localhost (expected, only works on production domain).

- [ ] **Step 5: Commit**

```bash
git add components/invitation/RSVPSection.tsx app/invitation/page.tsx app/layout.tsx
git commit -m "feat: add RSVP and payment section"
```

---

### Task 11: Plan Page + Final Build

**Files:**
- Create: `wedding-nextjs/app/plan/page.tsx`

**Interfaces:**
- Produces: `/plan` route with static Thai checklist

- [ ] **Step 1: Write `app/plan/page.tsx`**

```tsx
export const metadata = { title: "Wedding Plan | Supakit & Sunee" };

const SECTIONS = [
  {
    title: "6+ เดือนก่อนงาน",
    items: ["กำหนดวันงาน", "ตั้งงบประมาณ", "จองสถานที่จัดงาน", "วางแผนจำนวนแขก",
            "จองช่างภาพ / วิดีโอ", "เลือก theme งาน", "จองแคทเทอริ่ง / ร้านอาหาร"],
  },
  {
    title: "3-5 เดือนก่อนงาน",
    items: ["ส่งการ์ดเชิญ / save the date", "จองดอกไม้และตกแต่ง", "เลือกชุดแต่งงาน / ชุดบ่าว",
            "เลือกเค้กแต่งงาน", "ทำ e-invitation", "ประสานงาน MC / ดนตรี"],
  },
  {
    title: "1-2 เดือนก่อนงาน",
    items: ["ยืนยันจำนวนแขกกับสถานที่", "ซ้อมพิธี", "จัดเตรียมของที่ระลึก",
            "ยืนยัน vendor ทุกราย", "เตรียม playlist เพลง", "ทำ seating plan"],
  },
  {
    title: "1 สัปดาห์ก่อนงาน",
    items: ["ยืนยัน RSVP สุดท้าย", "รับชุดแต่งงาน", "เตรียมซอง/บัตรที่นั่ง",
            "เตรียมเงินสำหรับ vendor", "พักผ่อนให้เพียงพอ"],
  },
];

export default function PlanPage() {
  return (
    <main className="min-h-screen py-16 px-6" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-serif-display text-center text-[var(--accent)] mb-3"
            style={{ fontSize: "clamp(1.5rem,4vw,2rem)", letterSpacing: "0.06em" }}>
          Wedding Planner
        </h1>
        <p className="text-center text-[var(--text-soft)] text-sm mb-10">
          Sunee &amp; Supakit · 22 November 2026
        </p>
        <div className="space-y-8">
          {SECTIONS.map((sec) => (
            <div key={sec.title} className="bg-white rounded-2xl p-6 shadow-sm"
                 style={{ borderLeft: "4px solid var(--gold)" }}>
              <h2 className="font-serif-display text-[var(--accent)] mb-4"
                  style={{ fontSize: "clamp(0.95rem,2.5vw,1.1rem)" }}>{sec.title}</h2>
              <ul className="space-y-2">
                {sec.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[var(--text)]">
                    <span className="mt-0.5 w-4 h-4 rounded border border-[var(--gold)] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Run full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Run ESLint**

```bash
npm run lint
```

Expected: no errors. Fix any warnings.

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Expected: `Compiled successfully`. All routes: `/`, `/invitation`, `/plan` listed.

- [ ] **Step 5: Push to remote**

```bash
cd .. && git add wedding-nextjs/
git push -u origin feature/nextjs
```

- [ ] **Step 6: Connect to Vercel**

Go to https://vercel.com → "Add New Project" → Import `wedding_plan` repo → Branch: `feature/nextjs` → Root Directory: `wedding-nextjs` → Deploy.

Or use CLI: `cd wedding-nextjs && npx vercel`

- [ ] **Step 7: Commit**

```bash
git add app/plan/
git commit -m "feat: add plan page; production build verified"
git push
```

---

## Self-Review

**Spec coverage:**
- [x] New branch `feature/nextjs` — Task 1
- [x] Next.js 15 App Router + TypeScript + Tailwind — Task 1
- [x] Blush & Rose Gold palette with CSS vars — Task 2
- [x] Libre Baskerville + Lato via next/font — Task 2
- [x] Thai/English i18n with React Context — Task 2+3
- [x] Envelope animation → portrait card → `/invitation` — Task 4
- [x] Hero with couple photo bg + LanguageSwitcher — Task 5
- [x] Invitation card: family names, arch photos, date/venue — Task 5
- [x] Countdown to `2026-11-22T07:00:00+07:00` — Task 6
- [x] Schedule 4 events with icons — Task 7
- [x] Gallery masonry 20 photos, NO AOS, lazy load, zoom modal — Task 8
- [x] Venue card + map link + date badge + dress code swatches — Task 9
- [x] RSVP Google Sign-In + manual, POST → Apps Script — Task 10
- [x] Payment form slip upload, POST → Apps Script — Task 10
- [x] `/plan` checklist — Task 11
- [x] Vercel deploy-ready — Task 11

**Placeholder scan:** No TBD/TODO. All code blocks are complete and runnable.

**Type consistency:** `TranslationKey = keyof translations["th"]` used consistently in `useI18n().t()`, `ScheduleSection` `ITEMS` array, and `CountdownSection` unit array. `Lang = "th" | "en"` consistent throughout.
