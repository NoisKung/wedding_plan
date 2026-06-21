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
