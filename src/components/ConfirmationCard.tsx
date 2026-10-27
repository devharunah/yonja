"use client";

import { placeLine } from "@/components/SpotSummary";
import { SITE_LABELS, type Spot } from "@/lib/types";

function formatDate(at: number): string {
  return new Date(at).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** The "Done, here's your receipt" moment: big, green and easy to share on WhatsApp (V5). */
export function ConfirmationCard({ spot }: { spot: Spot }) {
  const at = spot.lastVerifiedAt ?? spot.updatedAt;
  const message = `✅ Verified clean-up on Yonja: ${SITE_LABELS[spot.siteType].toLowerCase()} in ${placeLine(spot)}. About ${spot.sacksRemoved} sacks removed on ${formatDate(at)}. Report it, clean it, prove it.`;
  const url = typeof window === "undefined" ? "" : window.location.href.replace("/verify", "/spot");

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: message, url });
        return;
      } catch {
        // Cancelled or unsupported payload; fall through to WhatsApp.
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`,
      "_blank",
      "noopener",
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-3xl bg-clean text-white shadow-lg">
        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-4xl text-clean">
            ✓
          </span>
          <p className="mt-3 text-sm font-bold uppercase tracking-[0.25em] text-white/80">Yonja</p>
          <h2 className="text-4xl font-extrabold">Verified</h2>
          <p className="mt-4 text-6xl font-extrabold leading-none">{spot.sacksRemoved}</p>
          <p className="text-lg font-bold">sacks removed</p>
          <p className="text-xs text-white/75">Gemini estimate</p>
        </div>
        <dl className="grid grid-cols-2 gap-px bg-white/20 text-sm">
          <div className="bg-clean px-4 py-3">
            <dt className="text-white/70">Where</dt>
            <dd className="font-bold">{placeLine(spot)}</dd>
          </div>
          <div className="bg-clean px-4 py-3">
            <dt className="text-white/70">When</dt>
            <dd className="font-bold">{formatDate(at)}</dd>
          </div>
          <div className="bg-clean px-4 py-3">
            <dt className="text-white/70">What</dt>
            <dd className="font-bold">{SITE_LABELS[spot.siteType]}</dd>
          </div>
          <div className="bg-clean px-4 py-3">
            <dt className="text-white/70">Confidence</dt>
            <dd className="font-bold">{Math.round((spot.confidence ?? 0) * 100)}%</dd>
          </div>
        </dl>
      </div>
      <button
        type="button"
        onClick={share}
        className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 text-base font-bold text-white shadow-sm"
      >
        Share on WhatsApp
      </button>
    </div>
  );
}
