import { DIVISION_CENTROIDS } from "@/lib/constants";
import { distanceM, guessDivision } from "@/lib/geo";
import { hammingHex } from "@/lib/image";

describe("distanceM", () => {
  it("is zero for the same point", () => {
    expect(distanceM({ lat: 0.3, lng: 32.5 }, { lat: 0.3, lng: 32.5 })).toBe(0);
  });

  it("measures ~111 m per 0.001 degree of latitude", () => {
    const d = distanceM({ lat: 0.3, lng: 32.5 }, { lat: 0.301, lng: 32.5 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });
});

describe("guessDivision", () => {
  it("returns the division whose centroid is nearest", () => {
    expect(guessDivision(DIVISION_CENTROIDS.Nakawa)).toBe("Nakawa");
    expect(guessDivision({ lat: 0.385, lng: 32.555 })).toBe("Kawempe");
  });
});

describe("hammingHex", () => {
  it("counts differing bits between two hex hashes", () => {
    expect(hammingHex("0000", "0000")).toBe(0);
    expect(hammingHex("000f", "0000")).toBe(4);
    expect(hammingHex("ffffffffffffffff", "0000000000000000")).toBe(64);
  });
});
