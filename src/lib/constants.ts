export const DIVISIONS = ["Central", "Kawempe", "Makindye", "Nakawa", "Rubaga"] as const;
export type Division = (typeof DIVISIONS)[number];

// Rough centroids of Kampala's five divisions, used to pre-fill the division from GPS.
export const DIVISION_CENTROIDS: Record<Division, { lat: number; lng: number }> = {
  Central: { lat: 0.3163, lng: 32.5822 },
  Kawempe: { lat: 0.3796, lng: 32.5584 },
  Makindye: { lat: 0.2833, lng: 32.6012 },
  Nakawa: { lat: 0.3376, lng: 32.6366 },
  Rubaga: { lat: 0.3003, lng: 32.5528 },
};

export const KAMPALA = { lat: 0.3236, lng: 32.5876 } as const;

/** Anti-cheat: an after photo must be taken within this distance of the pin. */
export const VERIFY_RADIUS_M = 75;
/** A new report this close to a recently cleaned spot is a relapse. */
export const RELAPSE_RADIUS_M = VERIFY_RADIUS_M;
export const RELAPSE_DAYS = 30;
/** Below this, a before/after verdict stays "needs review" rather than "cleaned". */
export const MIN_CONFIDENCE = 0.6;
/** dHash Hamming distance at or below which two photos count as the same picture. */
export const SAME_PHOTO_MAX_DISTANCE = 6;

export const GEMINI_MODEL = "gemini-2.5-flash";
export const GEMINI_TIMEOUT_MS = 25_000;
