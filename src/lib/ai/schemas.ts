import { z } from "zod";

import { SEVERITIES, SITE_TYPES, VERDICTS } from "@/lib/types";

/** Boxes are Gemini's native 0–1000 normalised coordinates. */
const box = z.object({
  ymin: z.number().min(0).max(1000),
  xmin: z.number().min(0).max(1000),
  ymax: z.number().min(0).max(1000),
  xmax: z.number().min(0).max(1000),
});
export type FaceBox = z.infer<typeof box>;

export const spotCheckSchema = z.object({
  is_waste_site: z.boolean(),
  site_type: z.enum(SITE_TYPES),
  severity: z.enum(SEVERITIES),
  est_sacks_min: z.number().int().min(0),
  est_sacks_max: z.number().int().min(0),
  reason: z.string(),
  faces: z.array(box),
});
export type SpotCheck = z.infer<typeof spotCheckSchema>;

export const faceSchema = z.object({ faces: z.array(box) });

export const compareSchema = z.object({
  same_place: z.boolean(),
  verdict: z.enum(VERDICTS),
  confidence: z.number().min(0).max(1),
  est_sacks_removed: z.number().min(0),
  reason: z.string(),
  faces: z.array(box),
});
export type Compare = z.infer<typeof compareSchema>;

export const BINS = ["organic", "recyclable", "hazardous", "general"] as const;
export type Bin = (typeof BINS)[number];

export const sortSchema = z.object({
  item: z.string(),
  bin: z.enum(BINS),
  bin_colour: z.enum(["green", "blue", "red", "black"]),
  advice_en: z.string(),
  advice_lg: z.string(),
  reuse_tip: z.string(),
});
export type SortAdvice = z.infer<typeof sortSchema>;

export const askSchema = z.object({
  answer: z.string(),
  data_used: z.array(z.string()),
});
export type AskAnswer = z.infer<typeof askSchema>;

export const planSchema = z.object({
  summary: z.string(),
  ranked: z.array(
    z.object({
      spot_id: z.string(),
      reason: z.string(),
    }),
  ),
});
export type Plan = z.infer<typeof planSchema>;
