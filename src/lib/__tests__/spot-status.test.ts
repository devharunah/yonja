import {
  applyVerdict,
  confirmCleaned,
  findRelapseCandidate,
  isOpen,
  pinColour,
} from "@/lib/spot-status";

import { DAY, NOW, makeSpot } from "./fixtures";

describe("applyVerdict", () => {
  it("turns a confident full clean-up green and counts the sacks", () => {
    const update = applyVerdict(
      makeSpot(),
      { verdict: "fully", confidence: 0.9, sacksRemoved: 4, reason: "Drain clear." },
      NOW,
    );
    expect(update.status).toBe("verified");
    expect(update.sacksRemoved).toBe(4);
    expect(update.lastVerifiedAt).toBe(NOW);
    expect(update.history?.at(-1)).toEqual({ step: "verified", at: NOW });
  });

  it("keeps a low-confidence verdict in review and counts nothing", () => {
    const update = applyVerdict(
      makeSpot(),
      { verdict: "fully", confidence: 0.4, sacksRemoved: 4, reason: "Blurry." },
      NOW,
    );
    expect(update.status).toBe("needs_review");
    expect(update.sacksRemoved).toBeUndefined();
    expect(update.history).toBeUndefined();
  });

  it("marks a partial clean-up amber but still counts its sacks", () => {
    const update = applyVerdict(
      makeSpot({ sacksRemoved: 2 }),
      { verdict: "partly", confidence: 0.8, sacksRemoved: 1.4, reason: "Some left." },
      NOW,
    );
    expect(update.status).toBe("partly");
    expect(update.sacksRemoved).toBe(3);
  });

  it("leaves an uncleaned spot dirty", () => {
    const update = applyVerdict(
      makeSpot(),
      { verdict: "not", confidence: 0.95, sacksRemoved: 0, reason: "No change." },
      NOW,
    );
    expect(update.status).toBe("dirty");
  });
});

describe("confirmCleaned", () => {
  it("adds the cleaned step to the trail", () => {
    const update = confirmCleaned(makeSpot({ status: "verified" }), NOW);
    expect(update.status).toBe("cleaned");
    expect(update.history?.at(-1)?.step).toBe("cleaned");
  });
});

describe("pinColour and isOpen", () => {
  it("maps statuses to pin colours", () => {
    expect(pinColour("dirty")).toBe("dirty");
    expect(pinColour("needs_review")).toBe("partly");
    expect(pinColour("cleaned")).toBe("clean");
    expect(pinColour("pending_ai")).toBe("pending");
  });

  it("treats only verified and cleaned spots as closed", () => {
    expect(isOpen("verified")).toBe(false);
    expect(isOpen("cleaned")).toBe(false);
    expect(isOpen("partly")).toBe(true);
  });
});

describe("findRelapseCandidate", () => {
  const cleaned = makeSpot({
    status: "verified",
    history: [
      { step: "reported", at: NOW - 10 * DAY },
      { step: "verified", at: NOW - 5 * DAY },
    ],
  });

  it("finds a spot cleaned in the last 30 days within 75 m", () => {
    const point = { lat: cleaned.lat + 0.0003, lng: cleaned.lng };
    expect(findRelapseCandidate([cleaned], point, NOW)?.id).toBe("s1");
  });

  it("ignores spots further than 75 m away", () => {
    const point = { lat: cleaned.lat + 0.001, lng: cleaned.lng };
    expect(findRelapseCandidate([cleaned], point, NOW)).toBeNull();
  });

  it("ignores clean-ups older than 30 days", () => {
    expect(findRelapseCandidate([cleaned], cleaned, NOW + 40 * DAY)).toBeNull();
  });

  it("ignores spots that are still open", () => {
    expect(findRelapseCandidate([makeSpot()], makeSpot(), NOW)).toBeNull();
  });
});
