"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { ConfirmationCard } from "@/components/ConfirmationCard";
import { StatusBadge } from "@/components/SpotPin";
import { placeLine } from "@/components/SpotSummary";
import { StatusTrail } from "@/components/StatusTrail";
import { Card, Notice, SeverityChip, Spinner, button, sacksRange } from "@/components/ui";
import { usePhoto, useSpot } from "@/lib/firebase/spots";
import { verifyHref } from "@/lib/routes";
import { isOpen } from "@/lib/spot-status";
import { SITE_LABELS } from "@/lib/types";

export default function SpotPage() {
  return (
    <Suspense fallback={<Spinner label="Loading spot…" />}>
      <SpotDetails />
    </Suspense>
  );
}

function SpotDetails() {
  const id = useSearchParams().get("id");
  const { data: spot, loading, error } = useSpot(id);
  const before = usePhoto(spot?.beforePhotoId ?? null);
  const after = usePhoto(spot?.afterPhotoId ?? null);
  const [showCard, setShowCard] = useState(false);

  if (loading) return <Spinner label="Loading spot…" />;
  if (error || !spot) {
    return (
      <main className="mx-auto max-w-xl p-4">
        <Notice tone="error" title={error ?? "Spot not found"} />
        <Link href="/" className={`${button.secondary} mt-4`}>
          Back to the map
        </Link>
      </main>
    );
  }

  const verifiedClean = spot.status === "verified" || spot.status === "cleaned";

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 pt-4 pb-6">
      <Link href="/" className="text-sm font-bold text-brand">
        ← Map
      </Link>

      {before && after ? (
        <BeforeAfterSlider before={before.dataUrl} after={after.dataUrl} />
      ) : before ? (
        <img
          src={before.dataUrl}
          alt="Reported spot, faces blurred"
          className="aspect-[4/3] w-full rounded-3xl object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl bg-white text-sm text-muted">
          {spot.beforePhotoId ? "Loading photo…" : "No photo stored"}
        </div>
      )}

      <Card>
        <h1 className="text-2xl font-extrabold">{SITE_LABELS[spot.siteType]}</h1>
        <p className="text-sm text-muted">{placeLine(spot)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge spot={spot} />
          <SeverityChip severity={spot.severity} />
        </div>
        <p className="mt-4 text-sm">
          <b>Reported:</b> {sacksRange(spot.estSacksMin, spot.estSacksMax)} (estimate).{" "}
          {spot.aiReason}
        </p>
        {spot.verdict ? (
          <p className="mt-2 text-sm">
            <b>Last check:</b> {spot.verdict} cleaned, {Math.round((spot.confidence ?? 0) * 100)}%
            confidence. {spot.verifyReason}
          </p>
        ) : null}
        {spot.sacksRemoved > 0 ? (
          <p className="mt-2 text-sm">
            <b>Removed so far:</b> about {spot.sacksRemoved} sacks
          </p>
        ) : null}
      </Card>

      {spot.status === "needs_review" ? (
        <Notice tone="warning" title="Needs review">
          Gemini wasn’t confident enough to call this clean. An officer will take a look, or try a
          clearer after photo.
        </Notice>
      ) : null}

      {isOpen(spot.status) ? (
        <Link href={verifyHref(spot.id)} className={button.primary}>
          It’s been cleaned · add after photo
        </Link>
      ) : null}

      {verifiedClean ? (
        showCard ? (
          <ConfirmationCard spot={spot} />
        ) : (
          <button type="button" className={button.primary} onClick={() => setShowCard(true)}>
            Show verified card
          </button>
        )
      ) : null}

      <Card>
        <h2 className="mb-4 text-lg font-extrabold">Status trail</h2>
        <StatusTrail spot={spot} />
      </Card>
    </main>
  );
}
