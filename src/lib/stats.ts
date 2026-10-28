import { DIVISIONS, type Division } from "@/lib/constants";
import { isOpen } from "@/lib/spot-status";
import type { Spot, Verification } from "@/lib/types";

export type Kpis = {
  reported: number;
  verified: number;
  open: number;
  sacksRemoved: number;
  blockedDrains: number;
  rejectedCleanups: number;
};

export function kpis(spots: Spot[], verifications: Verification[]): Kpis {
  return {
    reported: spots.length,
    verified: spots.filter((s) => !isOpen(s.status)).length,
    open: spots.filter((s) => isOpen(s.status)).length,
    sacksRemoved: spots.reduce((sum, s) => sum + s.sacksRemoved, 0),
    blockedDrains: spots.filter((s) => s.siteType === "blocked_drain").length,
    rejectedCleanups: verifications.filter((v) => !v.accepted).length,
  };
}

export type DivisionRow = { division: Division; reported: number; cleaned: number };

export function byDivision(spots: Spot[]): DivisionRow[] {
  return DIVISIONS.map((division) => {
    const inDivision = spots.filter((s) => s.division === division);
    return {
      division,
      reported: inDivision.length,
      cleaned: inDivision.filter((s) => !isOpen(s.status)).length,
    };
  });
}

function startOfMonth(now: number): number {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

/** Sacks removed per division from spots verified this calendar month, largest first. */
export function monthSacks(spots: Spot[], now: number): { division: Division; sacks: number }[] {
  const from = startOfMonth(now);
  return DIVISIONS.map((division) => ({
    division,
    sacks: spots
      .filter((s) => s.division === division && s.lastVerifiedAt !== null && s.lastVerifiedAt >= from)
      .reduce((sum, s) => sum + s.sacksRemoved, 0),
  })).sort((a, b) => b.sacks - a.sacks);
}

/** The compact rows "Ask the data" and the planner hand to Gemini. */
export function dataRows(spots: Spot[]) {
  return spots.map((s) => ({
    id: s.id,
    division: s.division,
    parish: s.parish || "unknown",
    site_type: s.siteType,
    severity: s.severity,
    status: s.status,
    open: isOpen(s.status),
    relapse: s.relapse,
    est_sacks: `${s.estSacksMin}-${s.estSacksMax}`,
    sacks_removed: s.sacksRemoved,
    reported_on: new Date(s.createdAt).toISOString().slice(0, 10),
  }));
}
