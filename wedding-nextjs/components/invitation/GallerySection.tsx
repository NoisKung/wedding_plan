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
          <h2
            className="font-serif-display text-[var(--accent)] mb-3"
            style={{ fontSize: "clamp(1.3rem,3.5vw,1.8rem)", letterSpacing: "0.06em" }}
          >
            {t("galleryTitle")}
          </h2>
          <GoldDivider className="max-w-xs mx-auto mt-4" />
        </FadeInSection>

        {/* CSS columns masonry — NO FadeInSection on items (AOS opacity:0 breaks column height) */}
        <div style={{ columnCount: 2, columnGap: 12 }} className="sm:[column-count:3] lg:[column-count:4]">
          {GALLERY_IMAGES.map((filename) => (
            <div
              key={filename}
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
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/gallory/${filename}`}
                alt="Pre-wedding photo"
                loading="lazy"
                className="w-full h-auto block"
                style={{ userSelect: "none", pointerEvents: "none" }}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <GalleryModal src={modal.src} alt={modal.alt} onClose={() => setModal(null)} />
      )}
    </section>
  );
}
