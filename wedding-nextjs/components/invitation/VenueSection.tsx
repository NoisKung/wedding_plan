"use client";

import { useI18n } from "@/providers/I18nProvider";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeInSection } from "@/components/ui/FadeInSection";

const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=VIVACE+WEDDING+HALL+Ratchapruek+Nonthaburi";

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
          <h2
            className="font-serif-display text-[var(--accent)] mb-3"
            style={{ fontSize: "clamp(1.3rem,3.5vw,1.8rem)", letterSpacing: "0.06em" }}
          >
            {t("venueTitle")}
          </h2>
          <GoldDivider className="max-w-xs mx-auto mt-4" />
        </FadeInSection>

        <FadeInSection>
          <div
            className="bg-white rounded-2xl p-8 shadow-sm mb-8"
            style={{ borderTop: "3px solid var(--gold)" }}
          >
            <p
              className="font-serif-display text-[var(--accent)] mb-2"
              style={{ fontSize: "clamp(1rem,2.5vw,1.25rem)" }}
            >
              {t("venueName")}
            </p>
            <p className="text-[var(--text-soft)] text-sm mb-6 leading-relaxed">
              {t("venueAddress")}
            </p>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm tracking-wider transition-transform hover:scale-105"
              style={{ background: "var(--accent)" }}
            >
              <svg
                width={16}
                height={16}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {t("viewMap")}
            </a>
          </div>
        </FadeInSection>

        <FadeInSection delay={100} className="text-center mb-8">
          <div
            className="inline-flex flex-col items-center px-10 py-5 rounded-2xl"
            style={{ background: "var(--bg)", border: "1px solid var(--gold)" }}
          >
            <p
              className="font-serif-display text-[var(--accent)]"
              style={{ fontSize: "clamp(1.6rem,5vw,2.2rem)", letterSpacing: "0.1em" }}
            >
              {t("venueDateNum")}
            </p>
            <p className="text-[var(--text-soft)] text-xs tracking-widest uppercase mt-1">
              {t("venueDateSub")}
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <div
            className="bg-white rounded-2xl p-8 shadow-sm text-center"
            style={{ borderTop: "3px solid var(--gold)" }}
          >
            <h3
              className="font-serif-display text-[var(--accent)] mb-2"
              style={{ fontSize: "clamp(1rem,2.5vw,1.25rem)" }}
            >
              {t("dressCode")}
            </h3>
            <p className="text-[var(--text-soft)] text-xs mb-5 tracking-widest uppercase">
              {t("themeColor")}
            </p>
            <div className="flex items-center justify-center gap-3">
              {DRESS_COLORS.map(({ hex, label }) => (
                <div
                  key={hex}
                  title={label}
                  className="rounded-full border-2 border-white"
                  style={{
                    width: "clamp(36px,9vw,52px)",
                    height: "clamp(36px,9vw,52px)",
                    background: hex,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  }}
                />
              ))}
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}
