import type { Division } from "@/lib/constants";

export const SITE_TYPES = [
  "blocked_drain",
  "illegal_dump",
  "litter",
  "overflowing_skip",
  "other",
] as const;
export type SiteType = (typeof SITE_TYPES)[number];

export const SEVERITIES = ["low", "medium", "high"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const VERDICTS = ["fully", "partly", "not"] as const;
export type Verdict = (typeof VERDICTS)[number];

export type SpotStatus =
  | "pending_ai"
  | "dirty"
  | "partly"
  | "verified"
  | "cleaned"
  | "needs_review";
export type TrailStep = "reported" | "verified" | "cleaned" | "came_back";
export type HistoryEntry = { step: TrailStep; at: number };

/** Times are epoch milliseconds, so documents round-trip without Timestamp conversion. */
export type Spot = {
  id: string;
  status: SpotStatus;
  relapse: boolean;
  siteType: SiteType;
  severity: Severity;
  estSacksMin: number;
  estSacksMax: number;
  aiReason: string;
  lat: number;
  lng: number;
  division: Division;
  parish: string;
  sacksRemoved: number;
  verdict: Verdict | null;
  confidence: number | null;
  verifyReason: string;
  lastVerifiedAt: number | null;
  afterCount: number;
  /** Ids in the `photos` collection; photos stay out of spot docs so live updates stay light. */
  beforePhotoId: string | null;
  afterPhotoId: string | null;
  history: HistoryEntry[];
  createdAt: number;
  updatedAt: number;
};

export type Photo = {
  dataUrl: string;
  dHash: string;
  lat: number;
  lng: number;
  createdAt: number;
};

export type Verification = {
  id: string;
  spotId: string;
  accepted: boolean;
  rejectReason: string;
  verdict: Verdict | null;
  confidence: number | null;
  samePlace: boolean | null;
  distanceM: number;
  createdAt: number;
};

export const SITE_LABELS: Record<SiteType, string> = {
  blocked_drain: "Blocked drain",
  illegal_dump: "Illegal dump",
  litter: "Litter",
  overflowing_skip: "Overflowing skip",
  other: "Waste site",
};
