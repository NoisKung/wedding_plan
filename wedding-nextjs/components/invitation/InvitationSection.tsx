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
