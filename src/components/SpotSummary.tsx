"use client";

import Link from "next/link";

import { StatusBadge } from "@/components/SpotPin";
import { SeverityChip, button, sacksRange } from "@/components/ui";
import { usePhoto } from "@/lib/firebase/spots";
import { spotHref } from "@/lib/routes";
import { SITE_LABELS, type Spot } from "@/lib/types";

export function placeLine(spot: Spot): string {
  return spot.parish ? `${spot.parish}, ${spot.division}` : `${spot.division} division`;
}

/** The bottom sheet a pin opens: photo, details and the verification result (M3). */
export function SpotSheet({ spot, onClose }: { spot: Spot; onClose: () => void }) {
  const photo = usePhoto(spot.afterPhotoId ?? spot.beforePhotoId);
  return (
    <div className="rounded-3xl bg-white p-4 shadow-xl">
      <div className="flex gap-3">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-paper">
          {photo ? (
            <img src={photo.dataUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-extrabold leading-tight">{SITE_LABELS[spot.siteType]}</h2>
            <button
              type="button"
              onClick={onClose}
              className="-mt-1 -mr-1 p-2 text-muted"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="truncate text-sm text-muted">{placeLine(spot)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge spot={spot} />
            <SeverityChip severity={spot.severity} />
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm">
        {spot.sacksRemoved > 0 ? (
          <>
            <b>{spot.sacksRemoved} sacks removed</b> (estimate)
          </>
        ) : (
          <>Needs {sacksRange(spot.estSacksMin, spot.estSacksMax)} cleared (estimate)</>
        )}
      </p>
      {spot.verifyReason ? <p className="mt-1 text-sm text-muted">“{spot.verifyReason}”</p> : null}
      <Link href={spotHref(spot.id)} className={`${button.primary} mt-3 min-h-12`}>
        Open spot
      </Link>
    </div>
  );
}

export function SpotList({ spots }: { spots: Spot[] }) {
  if (spots.length === 0) {
    return <p className="p-6 text-center text-muted">No spots reported yet. Be the first.</p>;
  }
  return (
    <ul className="flex flex-col gap-2 p-4">
      {spots.map((spot) => (
        <li key={spot.id}>
          <Link
            href={spotHref(spot.id)}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold">{SITE_LABELS[spot.siteType]}</p>
              <p className="truncate text-sm text-muted">{placeLine(spot)}</p>
            </div>
            <StatusBadge spot={spot} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
