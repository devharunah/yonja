import { generateJson } from "@/lib/ai/gemini";
import {
  askSchema,
  compareSchema,
  faceSchema,
  planSchema,
  sortSchema,
  spotCheckSchema,
} from "@/lib/ai/schemas";
import type { RainDay } from "@/lib/weather";

const CONTEXT =
  "You work for Yonja, an app that verifies clean-ups on Uganda's National Cleaning Days in Kampala.";

const FACES =
  "List a bounding box for every human face visible, as ymin, xmin, ymax, xmax normalised to 0-1000. Include partial and distant faces. Return an empty list if there are none.";

export function spotCheck(photo: string) {
  return generateJson(
    spotCheckSchema,
    `${CONTEXT}
A resident photographed a spot they say needs cleaning.
- is_waste_site: true only for a blocked drain, illegal dump, litter, or an overflowing skip. Selfies, indoor scenes, clean streets, documents and screenshots are false.
- site_type: the closest match.
- severity: low (one person clears it in minutes), medium (needs a small group), high (blocks water flow, is a health risk, or needs a truck).
- est_sacks_min / est_sacks_max: an honest range of how many 50 kg sacks the waste would fill.
- reason: one short plain-English sentence on what you see. If it is not a waste site, say why.
- faces: ${FACES}`,
    [photo],
  );
}

export function detectFaces(photo: string) {
  return generateJson(faceSchema, `${CONTEXT}\n${FACES}`, [photo]);
}

export function compareBeforeAfter(before: string, after: string) {
  return generateJson(
    compareSchema,
    `${CONTEXT}
Image 1 is the BEFORE photo of a reported waste spot. Image 2 is the AFTER photo someone submitted to prove it was cleaned. People may try to cheat with a photo of a different, clean place.
- same_place: true only if fixed landmarks match (walls, drain edges, buildings, trees, road edges, poles). A different angle is fine; a different location is false.
- verdict: fully (the waste in the before photo is gone), partly (clearly reduced but some remains), not (no real change).
- confidence: 0-1, how sure you are of the verdict. Be honest; unclear photos deserve low confidence.
- est_sacks_removed: 50 kg sacks of waste removed between the photos.
- reason: one short sentence naming the evidence.
- faces: in image 2 only. ${FACES}`,
    [before, after],
  );
}

export function sortItem(photo: string) {
  return generateJson(
    sortSchema,
    `${CONTEXT}
A resident photographed one item of rubbish and wants to know which bin it goes in.
- item: what the item is, in a few words.
- bin: organic (food, peels, garden waste), recyclable (plastic bottles, clean paper, cardboard, metal cans, glass), hazardous (batteries, bulbs, medicine, chemicals, e-waste, sharps), general (everything else).
- bin_colour: organic green, recyclable blue, hazardous red, general black.
- advice_en: one or two short sentences of practical advice in simple English.
- advice_lg: the same advice in Luganda.
- reuse_tip: one practical reuse or resale tip that works in Kampala, for example selling plastics or scrap metal to collectors, or composting.`,
    [photo],
  );
}

export function askData(question: string, data: unknown) {
  return generateJson(
    askSchema,
    `${CONTEXT}
A division environment officer asked a question about the reported spots.
Answer ONLY from the DATA below. Do not guess or use outside knowledge. If the data cannot answer it, answer exactly "No data for that yet." Keep the answer to one to three sentences with the numbers that matter.
data_used: short labels for the fields and filters you used, for example "division", "site_type = blocked_drain".

QUESTION: ${question}

DATA (JSON):
${JSON.stringify(data)}`,
  );
}

export function planNextDay(openSpots: unknown, rain: RainDay[]) {
  return generateJson(
    planSchema,
    `${CONTEXT}
Rank the open spots below for tomorrow's clean-up crews, most urgent first, at most 10.
Weigh: severity (high first), estimated sacks (more first), relapse (true means the mess came back after a clean-up), and rain in the next 3 days (heavy rain makes blocked drains flood, so they move up).
- ranked: spot_id from the data, and a reason that names the factors you used, for example "High severity blocked drain, 4-6 sacks, 18 mm rain due Thursday".
- summary: one sentence for the officer about tomorrow.
Only use spot_ids that appear in the data.

RAIN FORECAST (Kampala, mm per day):
${JSON.stringify(rain)}

OPEN SPOTS (JSON):
${JSON.stringify(openSpots)}`,
  );
}
