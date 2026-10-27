"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PhotoCapture } from "@/components/PhotoCapture";
import {
  Card,
  Notice,
  PageHeader,
  SeverityChip,
  Spinner,
  button,
  sacksRange,
} from "@/components/ui";
import type { SpotCheck } from "@/lib/ai/schemas";
import { spotCheck } from "@/lib/ai/tasks";
import { DIVISIONS, DIVISION_CENTROIDS, type Division } from "@/lib/constants";
import { createSpot, updateSpot, useSpots } from "@/lib/firebase/spots";
import { type LatLng, getPosition, guessDivision } from "@/lib/geo";
import { compressPhoto, dHash, pixelateFaces } from "@/lib/image";
import { spotHref } from "@/lib/routes";
import { findRelapseCandidate } from "@/lib/spot-status";
import { SITE_LABELS } from "@/lib/types";

type Located = LatLng & { approximate: boolean };

type Step =
  | { kind: "capture" }
  | { kind: "checking" }
  | { kind: "rejected"; reason: string }
  | { kind: "failed"; reason: string }
  | { kind: "review"; photo: string; check: SpotCheck }
  | { kind: "saving" }
  | { kind: "done"; spotId: string; relapse: boolean };

export default function ReportPage() {
  const [step, setStep] = useState<Step>({ kind: "capture" });
  const [location, setLocation] = useState<Located | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [division, setDivision] = useState<Division>("Central");
  const [parish, setParish] = useState("");
  const { data: spots } = useSpots();
  const [openedAt] = useState(() => Date.now());

  // Start GPS as soon as the screen opens so it is ready by the time the photo is checked.
  useEffect(() => {
    getPosition()
      .then((pos) => {
        setLocation({ lat: pos.lat, lng: pos.lng, approximate: false });
        setDivision(guessDivision(pos));
      })
      .catch((err: Error) => setLocationError(err.message));
  }, []);

  const relapse = location ? findRelapseCandidate(spots, location, openedAt) : null;

  async function onPhoto(file: File) {
    setStep({ kind: "checking" });
    try {
      const compressed = await compressPhoto(file);
      const result = await spotCheck(compressed);
      if (!result.ok) {
        // Without a face check the photo cannot be blurred, so it is never stored (R4).
        setStep({ kind: "failed", reason: result.error });
        return;
      }
      if (!result.data.is_waste_site) {
        setStep({ kind: "rejected", reason: result.data.reason });
        return;
      }
      const blurred = await pixelateFaces(compressed, result.data.faces);
      setStep({ kind: "review", photo: blurred, check: result.data });
    } catch (err) {
      setStep({ kind: "failed", reason: (err as Error).message });
    }
  }

  async function submit(photo: string, check: SpotCheck) {
    const now = Date.now();
    // Without GPS, fall back to the division centre so the report still lands on the map.
    const point: Located = location ?? { ...DIVISION_CENTROIDS[division], approximate: true };
    setStep({ kind: "saving" });
    try {
      const photoDoc = {
        dataUrl: photo,
        dHash: await dHash(photo),
        lat: point.lat,
        lng: point.lng,
        createdAt: now,
      };
      const report = {
        siteType: check.site_type,
        severity: check.severity,
        estSacksMin: Math.min(check.est_sacks_min, check.est_sacks_max),
        estSacksMax: Math.max(check.est_sacks_min, check.est_sacks_max),
        aiReason: check.reason,
      };

      if (relapse) {
        await updateSpot(
          relapse.id,
          {
            ...report,
            status: "dirty",
            relapse: true,
            verdict: null,
            confidence: null,
            verifyReason: "",
            afterPhotoId: null,
            history: [...relapse.history, { step: "came_back", at: now }],
            updatedAt: now,
          },
          { field: "beforePhotoId", data: photoDoc },
        );
        setStep({ kind: "done", spotId: relapse.id, relapse: true });
        return;
      }

      const spotId = await createSpot(
        {
          ...report,
          status: "dirty",
          relapse: false,
          lat: point.lat,
          lng: point.lng,
          division,
          parish: parish.trim(),
          sacksRemoved: 0,
          verdict: null,
          confidence: null,
          verifyReason: "",
          lastVerifiedAt: null,
          afterCount: 0,
          afterPhotoId: null,
          history: [{ step: "reported", at: now }],
          createdAt: now,
          updatedAt: now,
        },
        photoDoc,
      );
      setStep({ kind: "done", spotId, relapse: false });
    } catch (err) {
      console.error(err);
      setStep({
        kind: "failed",
        reason: "Couldn't save the report. Check your connection and try again.",
      });
    }
  }

  return (
    <main className="mx-auto max-w-xl pb-6">
      <PageHeader
        title="Report a spot"
        subtitle="Snap the mess. Yonja checks it and pins it live."
      />
      <div className="flex flex-col gap-4 px-4">
        {step.kind === "capture" ? (
          <>
            <Card>
              <p className="text-base font-semibold">
                Blocked drain, dump, litter or an overflowing skip?
              </p>
              <p className="mt-1 text-sm text-muted">
                Faces are blurred before anything is saved. Your name is never stored.
              </p>
            </Card>
            <PhotoCapture label="Take a photo" onPhoto={onPhoto} />
            <LocationLine location={location} error={locationError} />
          </>
        ) : null}

        {step.kind === "checking" ? (
          <Spinner label="Gemini is checking the photo and blurring faces…" />
        ) : null}
        {step.kind === "saving" ? <Spinner label="Pinning it on the live map…" /> : null}

        {step.kind === "rejected" ? (
          <>
            <Notice tone="warning" title="That doesn't look like a waste spot">
              {step.reason}
            </Notice>
            <PhotoCapture label="Try another photo" onPhoto={onPhoto} />
          </>
        ) : null}

        {step.kind === "failed" ? (
          <>
            <Notice tone="error" title="Couldn't check the photo">
              {step.reason} Nothing was saved, so no unblurred photo left your phone.
            </Notice>
            <PhotoCapture label="Try again" onPhoto={onPhoto} />
          </>
        ) : null}

        {step.kind === "review" ? (
          <>
            <img
              src={step.photo}
              alt="Your photo, faces blurred"
              className="w-full rounded-3xl object-cover"
            />
            <Card>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-extrabold">{SITE_LABELS[step.check.site_type]}</span>
                <SeverityChip severity={step.check.severity} />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-brand">
                {sacksRange(step.check.est_sacks_min, step.check.est_sacks_max)}
              </p>
              <p className="text-xs text-muted">Gemini estimate, not a measured count</p>
              <p className="mt-3 text-sm">{step.check.reason}</p>
            </Card>

            {relapse ? (
              <Notice tone="warning" title="This spot was cleaned recently">
                A clean-up within 75 m was verified in the last 30 days. Submitting flags it as a
                relapse so officers can send a truck.
              </Notice>
            ) : (
              <Card>
                <label className="block text-sm font-bold" htmlFor="division">
                  Division
                </label>
                <select
                  id="division"
                  value={division}
                  onChange={(e) => setDivision(e.target.value as Division)}
                  className="mt-1 min-h-12 w-full rounded-xl border border-line bg-white px-3 text-base"
                >
                  {DIVISIONS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <label className="mt-4 block text-sm font-bold" htmlFor="parish">
                  Parish <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  id="parish"
                  value={parish}
                  onChange={(e) => setParish(e.target.value)}
                  placeholder="e.g. Bwaise I"
                  className="mt-1 min-h-12 w-full rounded-xl border border-line px-3 text-base"
                />
                <LocationLine location={location} error={locationError} />
              </Card>
            )}

            <button
              type="button"
              className={button.primary}
              onClick={() => submit(step.photo, step.check)}
            >
              {relapse ? "Report it came back" : "Submit report"}
            </button>
            <button
              type="button"
              className={button.secondary}
              onClick={() => setStep({ kind: "capture" })}
            >
              Retake
            </button>
          </>
        ) : null}

        {step.kind === "done" ? (
          <>
            <Card className="text-center">
              <p className="text-5xl">📍</p>
              <h2 className="mt-2 text-2xl font-extrabold">
                {step.relapse ? "Flagged as a relapse" : "Your pin is live"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Officers can see it on the map right now. Come back with an after photo once it’s
                cleaned.
              </p>
            </Card>
            <Link href={spotHref(step.spotId)} className={button.primary}>
              View the spot
            </Link>
            <button
              type="button"
              className={button.secondary}
              onClick={() => {
                setParish("");
                setStep({ kind: "capture" });
              }}
            >
              Report another
            </button>
          </>
        ) : null}
      </div>
    </main>
  );
}

function LocationLine({ location, error }: { location: Located | null; error: string | null }) {
  if (location) {
    return (
      <p className="mt-3 text-xs text-muted">
        📡 Location captured ({location.lat.toFixed(5)}, {location.lng.toFixed(5)})
      </p>
    );
  }
  if (error) {
    return (
      <p className="mt-3 text-xs text-amber-800">
        Location unavailable ({error}). The pin will go at the division centre.
      </p>
    );
  }
  return <p className="mt-3 text-xs text-muted">📡 Finding your location…</p>;
}
