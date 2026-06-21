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
