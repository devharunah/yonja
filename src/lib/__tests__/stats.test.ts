import { parseAiJson } from "@/lib/ai/parse";
import { compareSchema } from "@/lib/ai/schemas";
import { byDivision, kpis, monthSacks } from "@/lib/stats";
import type { Verification } from "@/lib/types";
import { parseForecast } from "@/lib/weather";

import { DAY, NOW, makeSpot } from "./fixtures";

const spots = [
  makeSpot({ id: "a" }),
  makeSpot({ id: "b", status: "verified", sacksRemoved: 4, lastVerifiedAt: NOW - DAY }),
  makeSpot({
    id: "c",
    status: "cleaned",
    division: "Nakawa",
    siteType: "litter",
    sacksRemoved: 2,
    lastVerifiedAt: NOW - 60 * DAY,
  }),
];

const rejected: Verification = {
  id: "v1",
  spotId: "a",
  accepted: false,
  rejectReason: "Same photo",
  verdict: null,
  confidence: null,
  samePlace: null,
  distanceM: 3,
  createdAt: NOW,
};

describe("kpis", () => {
  it("counts reported, verified, open, sacks, drains and rejections", () => {
    expect(kpis(spots, [rejected])).toEqual({
      reported: 3,
      verified: 2,
      open: 1,
      sacksRemoved: 6,
      blockedDrains: 2,
      rejectedCleanups: 1,
    });
  });
});

describe("byDivision", () => {
  it("returns all five divisions with cleaned vs reported", () => {
    const rows = byDivision(spots);
    expect(rows).toHaveLength(5);
    expect(rows.find((r) => r.division === "Kawempe")).toEqual({
      division: "Kawempe",
      reported: 2,
      cleaned: 1,
    });
  });
});

describe("monthSacks", () => {
  it("counts only sacks from spots verified this month, largest first", () => {
    const rows = monthSacks(spots, NOW);
    expect(rows[0]).toEqual({ division: "Kawempe", sacks: 4 });
    expect(rows.find((r) => r.division === "Nakawa")?.sacks).toBe(0);
  });
});

describe("parseAiJson", () => {
  it("accepts a reply that matches the schema", () => {
    const reply = JSON.stringify({
      same_place: true,
      verdict: "fully",
      confidence: 0.9,
      est_sacks_removed: 3,
      reason: "Drain clear.",
      faces: [],
    });
    expect(parseAiJson(compareSchema, reply).ok).toBe(true);
  });

  it("treats malformed or off-schema replies as couldn't check, never a pass", () => {
    expect(parseAiJson(compareSchema, "not json").ok).toBe(false);
    expect(parseAiJson(compareSchema, JSON.stringify({ verdict: "fully" })).ok).toBe(false);
    const outOfRange = JSON.stringify({
      same_place: true,
      verdict: "fully",
      confidence: 7,
      est_sacks_removed: 3,
      reason: "",
      faces: [],
    });
    expect(parseAiJson(compareSchema, outOfRange).ok).toBe(false);
  });
});

describe("parseForecast", () => {
  it("zips Open-Meteo daily arrays into rain days", () => {
    const body = {
      daily: {
        time: ["2026-10-28", "2026-10-29"],
        precipitation_sum: [12.5, null],
        precipitation_probability_max: [80, 20],
      },
    };
    expect(parseForecast(body)).toEqual([
      { date: "2026-10-28", rain_mm: 12.5, chance_pct: 80 },
      { date: "2026-10-29", rain_mm: 0, chance_pct: 20 },
    ]);
  });
});
