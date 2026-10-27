"use client";

import { useState } from "react";

import { monthSacks } from "@/lib/stats";
import type { Spot } from "@/lib/types";

/** "Kawempe: 312 sacks removed" — a running count that makes small actions feel big (M4). */
export function MonthCounters({ spots }: { spots: Spot[] }) {
  const [now] = useState(() => Date.now());
  const rows = monthSacks(spots, now);
  const month = new Date(now).toLocaleString("en-UG", { month: "long" });
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]"
      aria-label={`Sacks removed in ${month}`}
    >
      {rows.map((row) => (
        <div
          key={row.division}
          className="shrink-0 rounded-2xl bg-white/95 px-4 py-2 shadow-sm backdrop-blur"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
            {row.division} · {month}
          </p>
          <p className="text-lg font-extrabold leading-tight">
            <span className="text-brand">{row.sacks.toLocaleString()}</span>{" "}
            <span className="text-sm font-bold">sacks removed</span>
          </p>
        </div>
      ))}
    </div>
  );
}
