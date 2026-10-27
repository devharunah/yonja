"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { ConfirmationCard } from "@/components/ConfirmationCard";
import { PhotoCapture } from "@/components/PhotoCapture";
import { placeLine } from "@/components/SpotSummary";
import { Card, Notice, PageHeader, Spinner, button } from "@/components/ui";
import { compareBeforeAfter } from "@/lib/ai/tasks";
import { logVerification, updateSpot, usePhoto, useSpot } from "@/lib/firebase/spots";
import { type LatLng, distanceM, getPosition } from "@/lib/geo";
import { compressPhoto, dHash, hammingHex, pixelateFaces } from "@/lib/image";
import { spotHref } from "@/lib/routes";
import { applyVerdict, preCheckAfterPhoto } from "@/lib/spot-status";
import { SITE_LABELS, type Spot } from "@/lib/types";

type Step =
  | { kind: "capture" }
  | { kind: "checking"; label: string }
  | { kind: "rejected"; reason: string }
  | { kind: "failed"; reason: string }
  | { kind: "result"; after: string };

export default function VerifyPage() {
  return (
    <Suspense fallback={<Spinner label="Loading spot…" />}>
      <Verify />
    </Suspense>
  );
}

function Verify() {
  const id = useSearchParams().get("id");
  const { data: spot, loading } = useSpot(id);
  const before = usePhoto(spot?.beforePhotoId ?? null);
  const [step, setStep] = useState<Step>({ kind: "capture" });
  const [position, setPosition] = useState<LatLng | null>(null);
  const [positionError, setPositionError] = useState<string | null>(null);

  useEffect(() => {
    getPosition()
      .then(setPosition)
      .catch((err: Error) => setPositionError(err.message));
  }, []);

  if (loading) return <Spinner label="Loading spot…" />;
  if (!spot) {
    return (
      <main className="mx-auto max-w-xl p-4">
        <Notice tone="error" title="Spot not found" />
      </main>
    );
  }

  async function reject(
    target: Spot,
    reason: string,
    distance: number,
    extra: { samePlace?: boolean } = {},
  ) {
    setStep({ kind: "rejected", reason });
    await logVerification({
      spotId: target.id,
      accepted: false,
      rejectReason: reason,
      verdict: null,
      confidence: null,
      samePlace: extra.samePlace ?? null,
      distanceM: Math.round(distance),
      createdAt: Date.now(),
    }).catch((err: Error) => console.error(err));
  }

  async function onPhoto(file: File) {
    if (!spot || !before) return;
    if (!position) {
      setStep({
        kind: "failed",
        reason:
          "Yonja needs your location to prove the after photo was taken at the spot. Turn on location and try again.",
      });
      return;
    }
    const target = spot;
    try {
      setStep({ kind: "checking", label: "Checking where and when the photo was taken…" });
      const compressed = await compressPhoto(file);
      const hash = await dHash(compressed);
      const distance = distanceM(position, target);

      // Anti-cheat runs before Gemini: wrong place or the same photo again never gets a verdict (V2).
      const pre = preCheckAfterPhoto(distance, hammingHex(hash, before.dHash));
      if (!pre.ok) {
        await reject(target, pre.reason, distance);
        return;
      }

      setStep({ kind: "checking", label: "Gemini is comparing before and after…" });
      const result = await compareBeforeAfter(before.dataUrl, compressed);
      if (!result.ok) {
        setStep({ kind: "failed", reason: result.error });
        return;
      }
      const ai = result.data;
      if (!ai.same_place) {
        await reject(target, `This doesn’t look like the same place. ${ai.reason}`, distance, {
          samePlace: false,
        });
        return;
      }

      const blurred = await pixelateFaces(compressed, ai.faces);
      const now = Date.now();
      const changes = applyVerdict(
        target,
        {
          verdict: ai.verdict,
          confidence: ai.confidence,
          sacksRemoved: ai.est_sacks_removed,
          reason: ai.reason,
        },
        now,
      );
      await updateSpot(target.id, changes, {
        field: "afterPhotoId",
        data: {
          dataUrl: blurred,
          dHash: hash,
          lat: position.lat,
          lng: position.lng,
          createdAt: now,
        },
      });
      await logVerification({
        spotId: target.id,
        accepted: true,
        rejectReason: "",
        verdict: ai.verdict,
        confidence: ai.confidence,
        samePlace: true,
        distanceM: Math.round(distance),
        createdAt: now,
      });
      setStep({ kind: "result", after: blurred });
    } catch (err) {
      console.error(err);
      setStep({ kind: "failed", reason: "Something went wrong saving the check. Try again." });
    }
  }

  return (
    <main className="mx-auto max-w-xl pb-6">
      <PageHeader
        title="Prove it’s clean"
        subtitle={`${SITE_LABELS[spot.siteType]} · ${placeLine(spot)}`}
      />
      <div className="flex flex-col gap-4 px-4">
        {step.kind === "capture" ? (
          <>
            {before ? (
              <img
                src={before.dataUrl}
                alt="Before"
                className="aspect-[4/3] w-full rounded-3xl object-cover"
              />
            ) : (
              <Spinner label="Loading the before photo…" />
            )}
            <Card>
              <p className="font-semibold">
                Stand where the before photo was taken and snap the same view.
              </p>
              <p className="mt-1 text-sm text-muted">
                Gemini compares the two. The photo must be within 75 m of the pin and new.
              </p>
              <p className="mt-2 text-xs text-muted">
                {position
                  ? `📡 Location ready · ${Math.round(distanceM(position, spot))} m from the pin`
                  : positionError
                    ? `Location unavailable: ${positionError}`
                    : "📡 Finding your location…"}
              </p>
            </Card>
            <PhotoCapture label="Take the after photo" onPhoto={onPhoto} disabled={!before} />
          </>
        ) : null}

        {step.kind === "checking" ? <Spinner label={step.label} /> : null}

        {step.kind === "rejected" ? (
          <>
            <Notice tone="error" title="Clean-up not accepted">
              {step.reason}
            </Notice>
            <PhotoCapture label="Try a new after photo" onPhoto={onPhoto} />
          </>
        ) : null}

        {step.kind === "failed" ? (
          <>
            <Notice tone="error" title="Couldn’t check">
              {step.reason} The spot was not marked clean.
            </Notice>
            <PhotoCapture label="Try again" onPhoto={onPhoto} />
          </>
        ) : null}

        {step.kind === "result" && before ? (
          <VerdictResult spot={spot} before={before.dataUrl} after={step.after} />
        ) : null}
      </div>
    </main>
  );
}

function VerdictResult({ spot, before, after }: { spot: Spot; before: string; after: string }) {
  return (
    <>
      <BeforeAfterSlider before={before} after={after} />
      {spot.status === "verified" ? <ConfirmationCard spot={spot} /> : null}
      {spot.status === "partly" ? (
        <Notice tone="warning" title="Partly cleaned">
          {spot.verifyReason} About {spot.sacksRemoved} sacks counted so far. Finish the job and add
          another after photo.
        </Notice>
      ) : null}
      {spot.status === "needs_review" ? (
        <Notice tone="warning" title="Needs review">
          Gemini was only {Math.round((spot.confidence ?? 0) * 100)}% sure, so this stays “needs
          review” instead of turning green. {spot.verifyReason}
        </Notice>
      ) : null}
      {spot.status === "dirty" ? (
        <Notice tone="error" title="Not cleaned yet">
          {spot.verifyReason}
        </Notice>
      ) : null}
      <Link href={spotHref(spot.id)} className={button.secondary}>
        View the spot
      </Link>
    </>
  );
}
