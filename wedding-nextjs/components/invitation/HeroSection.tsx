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
