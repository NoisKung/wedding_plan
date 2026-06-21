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
