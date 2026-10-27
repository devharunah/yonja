"use client";

import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";

import { DIVISIONS, DIVISION_CENTROIDS, type Division } from "@/lib/constants";
import { db } from "@/lib/firebase/client";
import type { HistoryEntry, Severity, SiteType, Spot, SpotStatus } from "@/lib/types";

const PARISHES: Record<Division, string[]> = {
  Central: ["Kisenyi", "Kamwokya", "Old Kampala", "Nakasero", "Industrial Area", "Kololo"],
  Kawempe: ["Bwaise I", "Bwaise II", "Kazo", "Kanyanya", "Mpererwe", "Kawempe I"],
  Makindye: ["Katwe", "Kabalagala", "Nsambya", "Kibuye", "Kansanga", "Lukuli"],
  Nakawa: ["Kiswa", "Ntinda", "Naguru", "Kyambogo", "Bugolobi", "Mbuya"],
  Rubaga: ["Natete", "Kasubi", "Nakulabye", "Mengo", "Ndeeba", "Lungujja"],
};

const REASONS: Record<SiteType, string> = {
  blocked_drain: "Drain channel choked with plastic bottles and silt; water is backing up.",
  illegal_dump: "Pile of mixed household waste dumped by the roadside.",
  litter: "Scattered polythene bags and food wrappers along the path.",
  overflowing_skip: "Skip is full and waste has spilled onto the ground around it.",
  other: "Mixed waste gathered beside the market stalls.",
};

/** Deterministic, so re-seeding produces the same demo city. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1_103_515_245 + 12_345) % 2_147_483_648;
    return s / 2_147_483_648;
  };
}

function placeholder(label: string, dirty: boolean): string {
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const sky = ctx.createLinearGradient(0, 0, 0, 360);
  sky.addColorStop(0, "#cfe3d6");
  sky.addColorStop(1, dirty ? "#7a6a52" : "#8c9a7a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 480, 360);
  ctx.fillStyle = "#5c5f60";
  ctx.fillRect(0, 230, 480, 50);
  ctx.fillStyle = "#3c4a52";
  ctx.fillRect(0, 280, 480, 22);
  if (dirty) {
    const r = rng(label.length * 97);
    const colours = ["#e9e3d5", "#2f6db5", "#d64933", "#f2c14e", "#3b3b3b", "#ffffff"];
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = colours[Math.floor(r() * colours.length)] ?? "#fff";
      ctx.beginPath();
      ctx.ellipse(
        40 + r() * 400,
        230 + r() * 70,
        6 + r() * 16,
        4 + r() * 9,
        r() * 3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  ctx.fillStyle = "rgba(16,37,31,0.75)";
  ctx.fillRect(0, 0, 480, 40);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(`Demo data · ${label}`, 14, 26);
  return canvas.toDataURL("image/jpeg", 0.7);
}

const DAY = 86_400_000;

export async function seedDemoData(count = 40): Promise<number> {
  const r = rng(2026);
  const now = Date.now();
  const pick = <T>(items: readonly T[]): T => items[Math.floor(r() * items.length)] as T;
  const batch = writeBatch(db());

  for (let i = 0; i < count; i++) {
    const division = DIVISIONS[i % DIVISIONS.length] as Division;
    const centre = DIVISION_CENTROIDS[division];
    const siteType = pick<SiteType>([
      "blocked_drain",
      "blocked_drain",
      "illegal_dump",
      "litter",
      "overflowing_skip",
    ]);
    const severity = pick<Severity>(["low", "medium", "medium", "high", "high"]);
    const estSacksMin = severity === "low" ? 1 : severity === "medium" ? 2 : 4;
    const estSacksMax = estSacksMin + 1 + Math.floor(r() * 3);
    const roll = r();
    const status: SpotStatus =
      roll < 0.42 ? "dirty" : roll < 0.52 ? "partly" : roll < 0.8 ? "verified" : "cleaned";
    const relapse = status === "dirty" && r() < 0.25;
    const reportedAt = now - Math.floor((2 + r() * 18) * DAY);
    const verifiedAt = Math.min(now - DAY / 2, reportedAt + Math.floor((0.5 + r() * 2) * DAY));

    const history: HistoryEntry[] = [{ step: "reported", at: reportedAt }];
    if (status === "verified" || status === "cleaned" || relapse)
      history.push({ step: "verified", at: verifiedAt });
    if (status === "cleaned" || relapse)
      history.push({ step: "cleaned", at: verifiedAt + DAY / 4 });
    if (relapse)
      history.push({ step: "came_back", at: Math.min(now - DAY / 4, verifiedAt + 3 * DAY) });

    const cleanedNow = status === "verified" || status === "cleaned";
    const sacksRemoved =
      cleanedNow || relapse
        ? estSacksMin + Math.floor(r() * 3)
        : status === "partly"
          ? estSacksMin
          : 0;

    const spotRef = doc(collection(db(), "spots"));
    const beforePhotoId = `${spotRef.id}_before_seed`;
    const afterPhotoId = cleanedNow || status === "partly" ? `${spotRef.id}_after_seed` : null;
    const lat = centre.lat + (r() - 0.5) * 0.03;
    const lng = centre.lng + (r() - 0.5) * 0.03;

    const spot: Omit<Spot, "id"> & { seeded: true } = {
      seeded: true,
      status,
      relapse,
      siteType,
      severity,
      estSacksMin,
      estSacksMax,
      aiReason: REASONS[siteType],
      lat,
      lng,
      division,
      parish: pick(PARISHES[division]),
      sacksRemoved,
      verdict: cleanedNow ? "fully" : status === "partly" ? "partly" : null,
      confidence: cleanedNow || status === "partly" ? 0.75 + r() * 0.22 : null,
      verifyReason: cleanedNow
        ? "Waste is gone and the drain channel is clear in the after photo."
        : status === "partly"
          ? "Most of the pile is gone but some bags remain at the edge."
          : "",
      lastVerifiedAt: sacksRemoved > 0 ? verifiedAt : null,
      afterCount: afterPhotoId ? 1 : 0,
      beforePhotoId,
      afterPhotoId,
      history,
      createdAt: reportedAt,
      updatedAt: history.at(-1)?.at ?? reportedAt,
    };
    batch.set(spotRef, spot);
    batch.set(doc(db(), "photos", beforePhotoId), {
      dataUrl: placeholder(`${spot.parish} before`, true),
      dHash: "0000000000000000",
      lat,
      lng,
      createdAt: reportedAt,
    });
    if (afterPhotoId) {
      batch.set(doc(db(), "photos", afterPhotoId), {
        dataUrl: placeholder(`${spot.parish} after`, status === "partly"),
        dHash: "ffffffffffffffff",
        lat,
        lng,
        createdAt: verifiedAt,
      });
    }
    if (i % 7 === 0) {
      batch.set(doc(collection(db(), "verifications")), {
        seeded: true,
        spotId: spotRef.id,
        accepted: false,
        rejectReason:
          i % 2
            ? "That is the before photo again."
            : "The after photo was taken 412 m from the pin.",
        verdict: null,
        confidence: null,
        samePlace: null,
        distanceM: i % 2 ? 4 : 412,
        createdAt: reportedAt + DAY,
      });
    }
  }

  await batch.commit();
  return count;
}

/** Removes only seeded documents; anything reported for real stays. */
export async function clearDemoData(): Promise<number> {
  let removed = 0;
  for (const name of ["spots", "verifications"]) {
    const snap = await getDocs(query(collection(db(), name), where("seeded", "==", true)));
    const batch = writeBatch(db());
    for (const d of snap.docs) {
      batch.delete(d.ref);
      if (name === "spots") {
        const data = d.data() as Spot;
        if (data.beforePhotoId) batch.delete(doc(db(), "photos", data.beforePhotoId));
        if (data.afterPhotoId) batch.delete(doc(db(), "photos", data.afterPhotoId));
      }
      removed++;
    }
    await batch.commit();
  }
  return removed;
}
