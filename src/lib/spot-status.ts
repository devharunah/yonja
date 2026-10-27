import {
  MIN_CONFIDENCE,
  RELAPSE_DAYS,
  RELAPSE_RADIUS_M,
  SAME_PHOTO_MAX_DISTANCE,
  VERIFY_RADIUS_M,
} from "@/lib/constants";
import { distanceM, type LatLng } from "@/lib/geo";
import type { Spot, SpotStatus, Verdict } from "@/lib/types";

const DAY_MS = 86_400_000;

export type PinColour = "dirty" | "partly" | "clean" | "pending";

export function pinColour(status: SpotStatus): PinColour {
  switch (status) {
    case "verified":
    case "cleaned":
      return "clean";
    case "partly":
    case "needs_review":
      return "partly";
    case "pending_ai":
      return "pending";
    case "dirty":
      return "dirty";
  }
}

export function isOpen(status: SpotStatus): boolean {
  return status !== "verified" && status !== "cleaned";
}

export const STATUS_LABELS: Record<SpotStatus, string> = {
  pending_ai: "AI check pending",
  dirty: "Needs cleaning",
  partly: "Partly cleaned",
  verified: "Verified clean",
  cleaned: "Cleaned",
  needs_review: "Needs review",
};

export type VerdictInput = {
  verdict: Verdict;
  confidence: number;
  sacksRemoved: number;
  reason: string;
};

/**
 * Turns an accepted before/after verdict into the spot update. A low-confidence verdict never
 * turns a spot green: it stays "needs review" and removes nothing from the totals.
 */
export function applyVerdict(spot: Spot, input: VerdictInput, now: number): Partial<Spot> {
  const base = {
    verdict: input.verdict,
    confidence: input.confidence,
    verifyReason: input.reason,
    afterCount: spot.afterCount + 1,
    updatedAt: now,
  };

  if (input.confidence < MIN_CONFIDENCE) {
    return { ...base, status: "needs_review" };
  }

  if (input.verdict === "not") {
    return { ...base, status: "dirty" };
  }

  const removed = Math.max(0, Math.round(input.sacksRemoved));
  const counted = { sacksRemoved: spot.sacksRemoved + removed, lastVerifiedAt: now };

  if (input.verdict === "partly") {
    return { ...base, ...counted, status: "partly" };
  }

  return {
    ...base,
    ...counted,
    status: "verified",
    relapse: false,
    history: [...spot.history, { step: "verified", at: now }],
  };
}

export function confirmCleaned(spot: Spot, now: number): Partial<Spot> {
  return {
    status: "cleaned",
    updatedAt: now,
    history: [...spot.history, { step: "cleaned", at: now }],
  };
}

/** The most recent time a spot was verified or confirmed clean, or null if never. */
export function lastCleanedAt(spot: Spot): number | null {
  let latest: number | null = null;
  for (const entry of spot.history) {
    if ((entry.step === "verified" || entry.step === "cleaned") && (latest === null || entry.at > latest)) {
      latest = entry.at;
    }
  }
  return latest;
}

/**
 * A spot cleaned within the relapse window and radius, nearest first. A new report there is the
 * same mess coming back, so it reopens that spot instead of creating a second pin.
 */
export function findRelapseCandidate(spots: Spot[], point: LatLng, now: number): Spot | null {
  let best: Spot | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const spot of spots) {
    if (isOpen(spot.status)) continue;
    const cleanedAt = lastCleanedAt(spot);
    if (cleanedAt === null || now - cleanedAt > RELAPSE_DAYS * DAY_MS) continue;
    const d = distanceM(point, spot);
    if (d <= RELAPSE_RADIUS_M && d < bestDistance) {
      best = spot;
      bestDistance = d;
    }
  }
  return best;
}

export type CheatCheck = { ok: true } | { ok: false; reason: string };

/**
 * The checks that run before Gemini sees the after photo (V2). Both are cheap and certain, so a
 * re-uploaded before photo or a photo from across town never costs an AI call.
 */
export function preCheckAfterPhoto(distanceFromPinM: number, hashDistance: number): CheatCheck {
  if (distanceFromPinM > VERIFY_RADIUS_M) {
    return {
      ok: false,
      reason: `The after photo was taken ${Math.round(distanceFromPinM)} m from the pin. It must be within ${VERIFY_RADIUS_M} m.`,
    };
  }
  if (hashDistance <= SAME_PHOTO_MAX_DISTANCE) {
    return { ok: false, reason: "That is the before photo again. Take a new photo after cleaning." };
  }
  return { ok: true };
}
