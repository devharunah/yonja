import { DIVISION_CENTROIDS, DIVISIONS, type Division } from "@/lib/constants";

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_000;

export function distanceM(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function guessDivision(point: LatLng): Division {
  let best: Division = "Central";
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const division of DIVISIONS) {
    const d = distanceM(point, DIVISION_CENTROIDS[division]);
    if (d < bestDistance) {
      best = division;
      bestDistance = d;
    }
  }
  return best;
}

export function getPosition(timeoutMs = 10_000): Promise<LatLng & { accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("This browser cannot share its location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(new Error(err.message || "Location unavailable.")),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 },
    );
  });
}
