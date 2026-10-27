"use client";

import { useState } from "react";

import { PhotoCapture } from "@/components/PhotoCapture";
import { Notice, PageHeader, Spinner, button } from "@/components/ui";
import type { SortAdvice } from "@/lib/ai/schemas";
import { sortItem } from "@/lib/ai/tasks";
import { compressPhoto } from "@/lib/image";

const BIN_STYLES: Record<SortAdvice["bin_colour"], string> = {
  green: "bg-green-700",
  blue: "bg-blue-700",
  red: "bg-red-700",
  black: "bg-neutral-900",
};

const BIN_NAMES: Record<SortAdvice["bin"], string> = {
  organic: "Organic bin",
  recyclable: "Recycling bin",
  hazardous: "Hazardous waste",
  general: "General waste",
};

type State =
  | { kind: "idle" }
  | { kind: "checking"; photo: string | null }
  | { kind: "advice"; photo: string; advice: SortAdvice }
  | { kind: "error"; message: string };

export default function CoachPage() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onPhoto(file: File) {
    setState({ kind: "checking", photo: null });
    try {
      const photo = await compressPhoto(file);
      setState({ kind: "checking", photo });
      const result = await sortItem(photo);
      setState(
        result.ok
          ? { kind: "advice", photo, advice: result.data }
          : { kind: "error", message: result.error },
      );
    } catch (err) {
      setState({ kind: "error", message: (err as Error).message });
    }
  }

  return (
    <main className="mx-auto max-w-xl pb-6">
      <PageHeader
        title="Sorting coach"
        subtitle="Snap one item of rubbish. Yonja tells you which bin."
      />
      <div className="flex flex-col gap-4 px-4">
        {state.kind === "checking" ? (
          <>
            {state.photo ? (
              <img
                src={state.photo}
                alt="Your item"
                className="max-h-64 w-full rounded-3xl object-cover"
              />
            ) : null}
            <Spinner label="Gemini is sorting it…" />
          </>
        ) : null}

        {state.kind === "error" ? <Notice tone="error" title={state.message} /> : null}

        {state.kind === "advice" ? <BinCard photo={state.photo} advice={state.advice} /> : null}

        {state.kind !== "checking" ? (
          <PhotoCapture
            label={state.kind === "idle" ? "Scan an item" : "Scan another item"}
            onPhoto={onPhoto}
          />
        ) : null}
      </div>
    </main>
  );
}

function BinCard({ photo, advice }: { photo: string; advice: SortAdvice }) {
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  function readAloud() {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${advice.item}. ${BIN_NAMES[advice.bin]}. ${advice.advice_en} ${advice.reuse_tip}`,
    );
    utterance.lang = "en-GB";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className={`flex items-center gap-4 p-5 text-white ${BIN_STYLES[advice.bin_colour]}`}>
        <img
          src={photo}
          alt=""
          className="h-20 w-20 shrink-0 rounded-2xl border-2 border-white/40 object-cover"
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/75">{advice.item}</p>
          <p className="text-2xl font-extrabold leading-tight">{BIN_NAMES[advice.bin]}</p>
          <p className="text-sm font-semibold capitalize text-white/85">{advice.bin_colour} bin</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted">English</h2>
          <p className="mt-1 text-base">{advice.advice_en}</p>
        </section>
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted">
            Luganda{" "}
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
              machine-translated · not yet reviewed
            </span>
          </h2>
          <p className="mt-1 text-base" lang="lg">
            {advice.advice_lg}
          </p>
        </section>
        <section className="rounded-2xl bg-brand-soft p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-brand-dark">
            Reuse or resell
          </h2>
          <p className="mt-1 text-sm text-brand-dark">{advice.reuse_tip}</p>
        </section>
        {canSpeak ? (
          <button type="button" className={button.secondary} onClick={readAloud}>
            🔊 Read aloud
          </button>
        ) : null}
      </div>
    </div>
  );
}
