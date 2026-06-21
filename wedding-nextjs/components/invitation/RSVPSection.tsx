"use client";

import { useState, useRef } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeInSection } from "@/components/ui/FadeInSection";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz4aY1uz9X68BxN5zR_Xf-E8h65zHyCO4fnEAyqDxIg5dVr-S5ZXYhR6WvJn6MZ8Wy_/exec";
const GOOGLE_CLIENT_ID =
  "679261672981-7f2b6ekit43s411jee55nv60i3q7ujn5.apps.googleusercontent.com";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

function parseJwt(token: string): GoogleUser {
  const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(
    decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
  );
}

function sanitize(str: string, max = 500): string {
  return str
    .substring(0, max)
    .replace(/[<>"'`\\]/g, "")
    .trim();
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

  // Expose Google Sign-In callback globally
  if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>)["handleCredentialResponse"] = (response: {
      credential: string;
    }) => setUser(parseJwt(response.credential));
  }

  function signOut() {
    setUser(null);
    setShowManual(false);
    setManualName("");
    setManualEmail("");
  }

  async function handleRsvpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = sanitize(user?.name || manualName, 200);
    if (!name) {
      alert(t("alertPleaseEnterName"));
      return;
    }
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
    if (!amount || amount <= 0) {
      alert(t("alertPleaseEnterValidAmount"));
      return;
    }
    const slip = formData.get("slip") as File | null;
    if (slip && slip.size > 0) {
      if (slip.size > MAX_FILE_SIZE) {
        alert(t("alertFileTooLarge"));
        return;
      }
      if (!ALLOWED_TYPES.includes(slip.type)) {
        alert(t("alertInvalidFileType"));
        return;
      }
    }
    setPayStatus(t("alertSending"));
    formData.set("action", "payment");
    await fetch(SCRIPT_URL, { method: "POST", body: formData }).catch(() => null);
    setPayStatus(t("alertPaymentSuccess"));
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-[var(--bg-alt)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors";
  const labelClass = "block text-[var(--text-soft)] text-xs tracking-widest uppercase mb-1.5";

  return (
    <section className="py-20 px-6" style={{ background: "var(--bg)" }}>
      <div className="max-w-lg mx-auto">
        <FadeInSection className="text-center mb-10">
          <h2
            className="font-serif-display text-[var(--accent)] mb-3"
            style={{ fontSize: "clamp(1.3rem,3.5vw,1.8rem)", letterSpacing: "0.06em" }}
          >
            {t("rsvpTitle")}
          </h2>
          <GoldDivider className="max-w-xs mx-auto mt-4" />
        </FadeInSection>

        {!rsvpDone ? (
          <FadeInSection>
            <div
              className="bg-white rounded-2xl p-8 shadow-sm"
              style={{ borderTop: "3px solid var(--gold)" }}
            >
              {!user && (
                <div className="mb-6">
                  <p className="text-[var(--text-soft)] text-sm text-center mb-4">
                    {t("signInPrompt")}
                  </p>
                  <div className="flex justify-center mb-4">
                    <div
                      id="g_id_onload"
                      data-client_id={GOOGLE_CLIENT_ID}
                      data-callback="handleCredentialResponse"
                      data-auto_prompt="false"
                    />
                    <div
                      className="g_id_signin"
                      data-type="standard"
                      data-size="large"
                      data-theme="outline"
                      data-text="sign_in_with"
                      data-shape="pill"
                      data-logo_alignment="left"
                    />
                  </div>
                  <GoldDivider className="my-4" />
                  {!showManual ? (
                    <button
                      onClick={() => setShowManual(true)}
                      className="w-full text-center text-[var(--text-soft)] text-sm underline underline-offset-2"
                    >
                      {t("guestToggle")}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>{t("nameLabel")}</label>
                        <input
                          className={inputClass}
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          placeholder={t("namePlaceholder")}
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t("emailLabel")}</label>
                        <input
                          className={inputClass}
                          type="email"
                          value={manualEmail}
                          onChange={(e) => setManualEmail(e.target.value)}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user && (
                <div
                  className="flex items-center gap-3 mb-6 p-4 rounded-xl"
                  style={{ background: "var(--bg-alt)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text)] text-sm truncate">
                      {user.name}
                    </p>
                    <p className="text-[var(--text-soft)] text-xs truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={signOut}
                    className="text-xs text-[var(--text-soft)] underline shrink-0"
                  >
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
                        <label
                          key={val}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer text-sm transition-colors"
                          style={{ borderColor: "var(--bg-alt)" }}
                        >
                          <input
                            type="radio"
                            name="attending"
                            value={val}
                            className="accent-[var(--accent)]"
                            required
                          />
                          {t(val)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>{t("guestsLabel")}</label>
                    <input
                      className={inputClass}
                      type="number"
                      name="guestCount"
                      min={1}
                      max={20}
                      placeholder={t("guestCountPlaceholder")}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl text-white text-sm tracking-widest uppercase transition-transform hover:scale-[1.02]"
                    style={{ background: "var(--accent)" }}
                  >
                    {t("submitRsvp")}
                  </button>
                </form>
              )}
            </div>
          </FadeInSection>
        ) : (
          <FadeInSection>
            <div className="text-center py-10">
              <p className="font-serif-display text-[var(--accent)] text-2xl mb-2">
                {t("rsvpThanks")}
              </p>
              <p className="text-[var(--text-soft)]">{t("rsvpSuccess")}</p>
            </div>
          </FadeInSection>
        )}

        {/* PAYMENT */}
        <FadeInSection delay={200} className="mt-10">
          <GoldDivider className="mb-10" />
          {!showPayment ? (
            <div className="text-center">
              <button
                onClick={() => setShowPayment(true)}
                className="px-8 py-3 rounded-full text-white text-sm tracking-widest uppercase transition-transform hover:scale-105"
                style={{ background: "var(--gold)" }}
              >
                {t("payBtn")}
              </button>
            </div>
          ) : (
            <div
              className="bg-white rounded-2xl p-8 shadow-sm"
              style={{ borderTop: "3px solid var(--gold)" }}
            >
              <h3
                className="font-serif-display text-[var(--accent)] mb-6 text-center"
                style={{ fontSize: "clamp(1rem,2.5vw,1.2rem)" }}
              >
                {t("payTitle")}
              </h3>
              <form ref={payFormRef} onSubmit={handlePaySubmit} className="space-y-4">
                <div>
                  <label className={labelClass}>{t("payerNameLabel")}</label>
                  <input
                    className={inputClass}
                    name="payerName"
                    placeholder={t("payerNamePlaceholder")}
                    maxLength={200}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("payerEmailLabel")}</label>
                  <input className={inputClass} name="payerEmail" type="email" />
                </div>
                <div>
                  <label className={labelClass}>{t("amountLabel")}</label>
                  <input
                    className={inputClass}
                    name="amount"
                    type="number"
                    min={1}
                    step={0.01}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("messageLabel")}</label>
                  <textarea
                    className={`${inputClass} resize-none`}
                    name="message"
                    rows={3}
                    placeholder={t("messagePlaceholder")}
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("uploadSlip")}</label>
                  <input
                    className={inputClass}
                    name="slip"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                  />
                </div>
                {payStatus && (
                  <p className="text-sm text-center text-[var(--text-soft)]">{payStatus}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-white text-sm tracking-widest uppercase transition-transform hover:scale-[1.02]"
                  style={{ background: "var(--gold)" }}
                >
                  {t("submitPayment")}
                </button>
              </form>
              <p className="text-xs text-center text-[var(--text-soft)] mt-4 italic">
                {t("payFooterNote")}
              </p>
            </div>
          )}
        </FadeInSection>
      </div>
    </section>
  );
}
