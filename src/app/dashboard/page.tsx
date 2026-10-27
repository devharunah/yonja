"use client";

import Link from "next/link";
import { useState } from "react";

import { StatusBadge } from "@/components/SpotPin";
import { placeLine } from "@/components/SpotSummary";
import { Card, Notice, SeverityChip, Spinner, button, sacksRange } from "@/components/ui";
import type { AskAnswer, Plan } from "@/lib/ai/schemas";
import { askData, planNextDay } from "@/lib/ai/tasks";
import { updateSpot, useSpots, useVerifications } from "@/lib/firebase/spots";
import { spotHref } from "@/lib/routes";
import { confirmCleaned, isOpen } from "@/lib/spot-status";
import { byDivision, dataRows, kpis } from "@/lib/stats";
import { SITE_LABELS, type Spot } from "@/lib/types";
import { type RainDay, rainForecast } from "@/lib/weather";

export default function DashboardPage() {
  const { data: spots, loading, error } = useSpots();
  const { data: verifications } = useVerifications();

  if (loading) return <Spinner label="Loading live data…" />;

  const k = kpis(spots, verifications);
  const relapses = spots.filter((s) => s.relapse && isOpen(s.status));
  const awaitingConfirm = spots.filter((s) => s.status === "verified");

  return (
    <main className="mx-auto max-w-6xl px-4 pt-6 pb-8">
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
            Yonja · Officer view
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Kampala Cleaning Day
          </h1>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-clean" /> Live
        </span>
      </header>

      {error ? <Notice tone="error" title={error} /> : null}

      <section
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        aria-label="Key numbers"
      >
        <Kpi label="Spots reported" value={k.reported} />
        <Kpi label="Verified clean" value={k.verified} tone="good" />
        <Kpi label="Still open" value={k.open} tone="bad" />
        <Kpi label="Sacks removed" value={k.sacksRemoved} tone="good" hint="estimate" />
        <Kpi label="Blocked drains" value={k.blockedDrains} />
        <Kpi label="Rejected clean-ups" value={k.rejectedCleanups} hint="caught by anti-cheat" />
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <DivisionBars spots={spots} />
          <ActionLists relapses={relapses} awaitingConfirm={awaitingConfirm} />
        </div>
        <div className="flex flex-col gap-5">
          <AskTheData spots={spots} />
          <Planner spots={spots} />
        </div>
      </div>
    </main>
  );
}

function Kpi({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone?: "good" | "bad";
  hint?: string;
}) {
  const colour = tone === "good" ? "text-clean" : tone === "bad" ? "text-dirty" : "text-ink";
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold tabular-nums ${colour}`}>
        {value.toLocaleString()}
      </p>
      {hint ? <p className="text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

function DivisionBars({ spots }: { spots: Spot[] }) {
  const rows = byDivision(spots);
  const max = Math.max(1, ...rows.map((r) => r.reported));
  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-extrabold">By division</h2>
        <p className="flex items-center gap-3 text-xs font-semibold text-muted">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-clean" /> Cleaned
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-line" /> Reported
          </span>
        </p>
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.division}>
            <div className="flex justify-between text-sm">
              <span className="font-bold">{row.division}</span>
              <span className="tabular-nums text-muted">
                <b className="text-ink">{row.cleaned}</b> of {row.reported} cleaned
              </span>
            </div>
            <div className="mt-1 h-3 rounded-full bg-paper">
              <div
                className="relative h-3 rounded-full bg-line"
                style={{ width: `${(row.reported / max) * 100}%` }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-clean"
                  style={{ width: row.reported ? `${(row.cleaned / row.reported) * 100}%` : "0%" }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SpotRow({ spot, children }: { spot: Spot; children?: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-line p-3">
      <Link href={spotHref(spot.id)} className="min-w-0 flex-1">
        <p className="font-bold">{SITE_LABELS[spot.siteType]}</p>
        <p className="truncate text-xs text-muted">
          {placeLine(spot)} · {sacksRange(spot.estSacksMin, spot.estSacksMax)}
        </p>
      </Link>
      {children}
    </li>
  );
}

function ActionLists({ relapses, awaitingConfirm }: { relapses: Spot[]; awaitingConfirm: Spot[] }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function confirm(spot: Spot) {
    setBusy(spot.id);
    try {
      await updateSpot(spot.id, confirmCleaned(spot, Date.now()));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Card>
        <h2 className="text-lg font-extrabold">Relapse alerts</h2>
        <p className="text-sm text-muted">
          Cleaned spots that came back. These need a municipal truck.
        </p>
        {relapses.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No relapses right now.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {relapses.map((spot) => (
              <SpotRow key={spot.id} spot={spot}>
                <span className="shrink-0 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
                  🚛 Truck
                </span>
              </SpotRow>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <h2 className="text-lg font-extrabold">Awaiting your confirmation</h2>
        <p className="text-sm text-muted">
          Gemini verified these. Confirm to mark them Cleaned on the trail.
        </p>
        {awaitingConfirm.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nothing waiting.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {awaitingConfirm.map((spot) => (
              <SpotRow key={spot.id} spot={spot}>
                <button
                  type="button"
                  className={button.small}
                  disabled={busy === spot.id}
                  onClick={() => confirm(spot)}
                >
                  Confirm
                </button>
              </SpotRow>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

const SUGGESTIONS = [
  "Which parish had the most blocked drains?",
  "How many sacks were removed in Kawempe?",
  "Which division has the most open spots?",
];

function AskTheData({ spots }: { spots: Spot[] }) {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "asking" }
    | { kind: "answer"; answer: AskAnswer }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuestion(trimmed);
    setState({ kind: "asking" });
    const result = await askData(trimmed, {
      by_division: byDivision(spots),
      spots: dataRows(spots),
    });
    setState(
      result.ok
        ? { kind: "answer", answer: result.data }
        : { kind: "error", message: result.error },
    );
  }

  return (
    <Card>
      <h2 className="text-lg font-extrabold">Ask the data</h2>
      <p className="text-sm text-muted">
        Plain-English questions, answered only from live Yonja data.
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about spots, sacks, divisions…"
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-line px-3 text-base"
          aria-label="Question"
        />
        <button type="submit" className={button.small} disabled={state.kind === "asking"}>
          Ask
        </button>
      </form>
      <div className="mt-2 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void ask(s)}
            className="rounded-full bg-brand-soft px-3 py-1.5 text-left text-xs font-semibold text-brand-dark"
          >
            {s}
          </button>
        ))}
      </div>
      {state.kind === "asking" ? <Spinner label="Gemini is reading the data…" /> : null}
      {state.kind === "error" ? (
        <div className="mt-3">
          <Notice tone="error" title={state.message} />
        </div>
      ) : null}
      {state.kind === "answer" ? (
        <div className="mt-4 rounded-2xl bg-paper p-4">
          <p className="text-base font-semibold">{state.answer.answer}</p>
          {state.answer.data_used.length > 0 ? (
            <p className="mt-2 text-xs text-muted">
              Based on: {state.answer.data_used.join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function Planner({ spots }: { spots: Spot[] }) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "planning" }
    | { kind: "plan"; plan: Plan; rain: RainDay[] }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const open = spots.filter((s) => isOpen(s.status));

  async function plan() {
    setState({ kind: "planning" });
    const rain = await rainForecast().catch((err: Error) => {
      console.error(err);
      return [] as RainDay[];
    });
    const result = await planNextDay(dataRows(open), rain);
    setState(
      result.ok
        ? { kind: "plan", plan: result.data, rain }
        : { kind: "error", message: result.error },
    );
  }

  const byId = new Map(spots.map((s) => [s.id, s]));

  return (
    <Card>
      <h2 className="text-lg font-extrabold">Next-day planner</h2>
      <p className="text-sm text-muted">
        Ranks {open.length} open spots by severity, volume, relapse and the 3-day rain forecast.
      </p>
      <button
        type="button"
        className={`${button.primary} mt-3`}
        onClick={plan}
        disabled={state.kind === "planning" || open.length === 0}
      >
        Plan tomorrow
      </button>
      {state.kind === "planning" ? <Spinner label="Checking the rain and ranking spots…" /> : null}
      {state.kind === "error" ? (
        <div className="mt-3">
          <Notice tone="error" title={state.message} />
        </div>
      ) : null}
      {state.kind === "plan" ? (
        <div className="mt-4">
          {state.rain.length > 0 ? (
            <div className="mb-3 flex gap-2">
              {state.rain.map((day) => (
                <div key={day.date} className="flex-1 rounded-2xl bg-sky-50 p-2 text-center">
                  <p className="text-[11px] font-bold text-sky-900">
                    {new Date(day.date).toLocaleDateString("en-UG", { weekday: "short" })}
                  </p>
                  <p className="text-lg font-extrabold text-sky-900">{day.rain_mm} mm</p>
                  <p className="text-[11px] text-sky-800">{day.chance_pct}% chance</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-3 text-xs text-muted">Rain forecast unavailable; ranked without it.</p>
          )}
          <p className="mb-3 text-sm font-semibold">{state.plan.summary}</p>
          <ol className="flex flex-col gap-2">
            {state.plan.ranked
              .filter((r) => byId.has(r.spot_id))
              .map((r, i) => {
                const spot = byId.get(r.spot_id) as Spot;
                return (
                  <li key={r.spot_id} className="flex gap-3 rounded-2xl border border-line p-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white">
                      {i + 1}
                    </span>
                    <Link href={spotHref(spot.id)} className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{SITE_LABELS[spot.siteType]}</span>
                        <SeverityChip severity={spot.severity} />
                        <StatusBadge spot={spot} />
                      </div>
                      <p className="text-xs text-muted">{placeLine(spot)}</p>
                      <p className="mt-1 text-sm">{r.reason}</p>
                    </Link>
                  </li>
                );
              })}
          </ol>
        </div>
      ) : null}
    </Card>
  );
}
