"use client";

import { useState } from "react";

import { Card, Notice, PageHeader, button } from "@/components/ui";
import { useSpots } from "@/lib/firebase/spots";
import { clearDemoData, seedDemoData } from "@/lib/seed";

/** Hidden helper for demo day: fills all five divisions with realistic, clearly labelled spots. */
export default function SeedPage() {
  const { data: spots } = useSpots();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: () => Promise<number>, done: (n: number) => string) {
    setBusy(true);
    setMessage(null);
    try {
      setMessage(done(await action()));
    } catch (err) {
      console.error(err);
      setMessage(`Failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl pb-6">
      <PageHeader title="Demo data" subtitle={`${spots.length} spots live right now.`} />
      <div className="flex flex-col gap-4 px-4">
        <Card>
          <p className="text-sm">
            Adds 40 spots across all five divisions with a mix of open, partly cleaned, verified,
            cleaned and relapsed spots. Photos are labelled “Demo data”.
          </p>
        </Card>
        <button
          type="button"
          className={button.primary}
          disabled={busy}
          onClick={() =>
            run(
              () => seedDemoData(),
              (n) => `Seeded ${n} spots.`,
            )
          }
        >
          Seed demo data
        </button>
        <button
          type="button"
          className={button.secondary}
          disabled={busy}
          onClick={() => {
            if (window.confirm("Remove every seeded spot? Real reports are kept.")) {
              void run(clearDemoData, (n) => `Removed ${n} seeded documents.`);
            }
          }}
        >
          Remove seeded data
        </button>
        {message ? <Notice tone="info" title={message} /> : null}
      </div>
    </main>
  );
}
