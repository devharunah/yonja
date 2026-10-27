import type { Spot, TrailStep } from "@/lib/types";

const LABELS: Record<TrailStep, string> = {
  reported: "Reported",
  verified: "Verified",
  cleaned: "Cleaned",
  came_back: "Came back",
};

const DOT: Record<TrailStep, string> = {
  reported: "bg-dirty",
  verified: "bg-clean",
  cleaned: "bg-brand-dark",
  came_back: "bg-ink",
};

function nextStep(spot: Spot): string | null {
  if (spot.status === "verified") return "Cleaned · an officer confirms";
  if (spot.status === "cleaned") return null;
  return "Verified · needs an after photo";
}

/** Reported → Verified → Cleaned → Came back, with dates, like FixMyStreet's trail (V6). */
export function StatusTrail({ spot }: { spot: Spot }) {
  const upcoming = nextStep(spot);
  return (
    <ol className="relative flex flex-col gap-4 border-l-2 border-line pl-6">
      {spot.history.map((entry) => (
        <li key={`${entry.step}-${entry.at}`} className="relative">
          <span
            className={`absolute top-1 -left-[31px] h-4 w-4 rounded-full border-2 border-white ${DOT[entry.step]}`}
          />
          <p className="font-bold">{LABELS[entry.step]}</p>
          <p className="text-xs text-muted">
            {new Date(entry.at).toLocaleString("en-UG", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </li>
      ))}
      {upcoming ? (
        <li className="relative">
          <span className="absolute top-1 -left-[31px] h-4 w-4 rounded-full border-2 border-line bg-white" />
          <p className="font-bold text-muted">{upcoming}</p>
        </li>
      ) : null}
    </ol>
  );
}
