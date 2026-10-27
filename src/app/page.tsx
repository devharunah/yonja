"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { MapView } from "@/components/MapView";
import { MonthCounters } from "@/components/MonthCounters";
import { SpotList, SpotSheet } from "@/components/SpotSummary";
import { Notice, button } from "@/components/ui";
import { useSpots } from "@/lib/firebase/spots";

export default function Home() {
  const { data: spots, error } = useSpots();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "list">("map");
  const [mapFailed, setMapFailed] = useState(false);
  const onMapFail = useCallback(() => setMapFailed(true), []);

  const selected = spots.find((s) => s.id === selectedId) ?? null;
  const showList = view === "list" || mapFailed;

  return (
    <main className="relative h-[calc(100dvh-4rem)] overflow-hidden">
      {showList ? (
        <div className="h-full overflow-y-auto pt-44">
          {mapFailed ? (
            <div className="px-4">
              <Notice tone="info" title="Map unavailable">
                Showing the live list instead.
              </Notice>
            </div>
          ) : null}
          <SpotList spots={spots} />
        </div>
      ) : (
        <MapView
          spots={spots}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onFail={onMapFail}
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-paper via-paper/80 to-transparent px-4 pt-4 pb-6">
        <div className="pointer-events-auto mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Yonja</h1>
              <p className="text-xs font-semibold text-muted">Report it, clean it, prove it.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-clean" /> Live ·{" "}
                {spots.length}
              </span>
              {!mapFailed ? (
                <button
                  type="button"
                  onClick={() => setView(view === "map" ? "list" : "map")}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-sm"
                >
                  {view === "map" ? "List" : "Map"}
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-3">
            <MonthCounters spots={spots} />
          </div>
          {error ? (
            <div className="mt-2">
              <Notice tone="error" title={error} />
            </div>
          ) : null}
        </div>
      </div>

      {!showList ? (
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
          <div className="mx-auto max-w-xl">
            {selected ? (
              <SpotSheet spot={selected} onClose={() => setSelectedId(null)} />
            ) : (
              <>
                <Legend />
                <Link href="/report" className={`${button.primary} shadow-lg`}>
                  + Report a spot
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Legend() {
  const items = [
    ["bg-dirty", "Dirty"],
    ["bg-partly", "Partly"],
    ["bg-clean", "Cleaned"],
  ] as const;
  return (
    <div className="mb-2 flex justify-center">
      <div className="inline-flex items-center gap-3 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold shadow-sm">
        {items.map(([colour, label]) => (
          <span key={label} className="inline-flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded-full ${colour}`} /> {label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-dirty ring-2 ring-black" /> Came back
        </span>
      </div>
    </div>
  );
}
