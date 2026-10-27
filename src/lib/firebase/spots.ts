"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "@/lib/firebase/client";
import type { Photo, Spot, Verification } from "@/lib/types";

export type Live<T> = { data: T; loading: boolean; error: string | null };

function friendly(error: Error): string {
  console.error(error);
  return "Couldn't reach the live data. Check your connection.";
}

/** Every spot, live. A change on one device shows up on every other within seconds (M2). */
export function useSpots(): Live<Spot[]> {
  const [live, setLive] = useState<Live<Spot[]>>({ data: [], loading: true, error: null });
  useEffect(
    () =>
      onSnapshot(
        query(collection(db(), "spots"), orderBy("createdAt", "desc")),
        (snap) =>
          setLive({
            data: snap.docs.map((d) => ({ ...(d.data() as Omit<Spot, "id">), id: d.id })),
            loading: false,
            error: null,
          }),
        (err) => setLive({ data: [], loading: false, error: friendly(err) }),
      ),
    [],
  );
  return live;
}

export function useSpot(id: string | null): Live<Spot | null> {
  const [live, setLive] = useState<Live<Spot | null> & { id: string | null }>({
    id: null,
    data: null,
    loading: true,
    error: null,
  });
  useEffect(() => {
    if (!id) return undefined;
    return onSnapshot(
      doc(db(), "spots", id),
      (snap) =>
        setLive({
          id,
          data: snap.exists() ? { ...(snap.data() as Omit<Spot, "id">), id: snap.id } : null,
          loading: false,
          error: null,
        }),
      (err) => setLive({ id, data: null, loading: false, error: friendly(err) }),
    );
  }, [id]);

  if (!id) return { data: null, loading: false, error: null };
  if (live.id !== id) return { data: null, loading: true, error: null };
  return live;
}

export function useVerifications(): Live<Verification[]> {
  const [live, setLive] = useState<Live<Verification[]>>({ data: [], loading: true, error: null });
  useEffect(
    () =>
      onSnapshot(
        collection(db(), "verifications"),
        (snap) =>
          setLive({
            data: snap.docs.map((d) => ({ ...(d.data() as Omit<Verification, "id">), id: d.id })),
            loading: false,
            error: null,
          }),
        (err) => setLive({ data: [], loading: false, error: friendly(err) }),
      ),
    [],
  );
  return live;
}

export async function getPhoto(id: string): Promise<Photo | null> {
  const snap = await getDoc(doc(db(), "photos", id));
  return snap.exists() ? (snap.data() as Photo) : null;
}

export function usePhoto(id: string | null): Photo | null {
  const [loaded, setLoaded] = useState<{ id: string; photo: Photo | null } | null>(null);
  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    getPhoto(id)
      .then((photo) => {
        if (!cancelled) setLoaded({ id, photo });
      })
      .catch((err: Error) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [id]);
  return id && loaded?.id === id ? loaded.photo : null;
}

/** Writes a new spot and its before photo together, so a pin never appears without its photo. */
export async function createSpot(
  spot: Omit<Spot, "id" | "beforePhotoId">,
  photo: Photo | null,
): Promise<string> {
  const spotRef = doc(collection(db(), "spots"));
  const batch = writeBatch(db());
  const beforePhotoId = photo ? `${spotRef.id}_before_${photo.createdAt}` : null;
  batch.set(spotRef, { ...spot, beforePhotoId });
  if (photo && beforePhotoId) batch.set(doc(db(), "photos", beforePhotoId), photo);
  await batch.commit();
  return spotRef.id;
}

/** Updates a spot and, optionally, stores a new photo under the given field in one batch. */
export async function updateSpot(
  id: string,
  changes: Partial<Omit<Spot, "id">>,
  photo?: { field: "beforePhotoId" | "afterPhotoId"; data: Photo },
): Promise<void> {
  if (!photo) {
    await updateDoc(doc(db(), "spots", id), changes);
    return;
  }
  const kind = photo.field === "beforePhotoId" ? "before" : "after";
  const photoId = `${id}_${kind}_${photo.data.createdAt}`;
  const batch = writeBatch(db());
  batch.set(doc(db(), "photos", photoId), photo.data);
  batch.update(doc(db(), "spots", id), { ...changes, [photo.field]: photoId });
  await batch.commit();
}

export async function logVerification(v: Omit<Verification, "id">): Promise<void> {
  await addDoc(collection(db(), "verifications"), v);
}
