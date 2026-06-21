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
