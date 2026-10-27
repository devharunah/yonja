import type { Spot } from "@/lib/types";

export const NOW = new Date(2026, 9, 27, 12).getTime();
export const DAY = 86_400_000;

export function makeSpot(overrides: Partial<Spot> = {}): Spot {
  return {
    id: "s1",
    status: "dirty",
    relapse: false,
    siteType: "blocked_drain",
    severity: "high",
    estSacksMin: 3,
    estSacksMax: 5,
    aiReason: "Drain blocked with plastic.",
    lat: 0.3796,
    lng: 32.5584,
    division: "Kawempe",
    parish: "Bwaise I",
    sacksRemoved: 0,
    verdict: null,
    confidence: null,
    verifyReason: "",
    lastVerifiedAt: null,
    afterCount: 0,
    beforePhotoId: "s1_before_1",
    afterPhotoId: null,
    history: [{ step: "reported", at: NOW - 2 * DAY }],
    createdAt: NOW - 2 * DAY,
    updatedAt: NOW - 2 * DAY,
    ...overrides,
  };
}
