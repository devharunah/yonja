import { type PinColour, STATUS_LABELS, pinColour } from "@/lib/spot-status";
import type { Spot } from "@/lib/types";

export const PIN_BG: Record<PinColour, string> = {
  dirty: "bg-dirty",
  partly: "bg-partly",
  clean: "bg-clean",
  pending: "bg-pending",
};

/** Red dirty, amber partly cleaned, green cleaned, black ring for relapses (M1). */
export function SpotPin({ spot, selected = false }: { spot: Spot; selected?: boolean }) {
  const colour = pinColour(spot.status);
  return (
    <span
      title={STATUS_LABELS[spot.status]}
      className={`block rounded-full shadow-md transition-transform ${PIN_BG[colour]} ${
        spot.relapse ? "border-[5px] border-black" : "border-[3px] border-white"
      } ${selected ? "h-9 w-9 scale-110" : "h-7 w-7"}`}
    />
  );
}

export function StatusBadge({ spot }: { spot: Spot }) {
  const colour = pinColour(spot.status);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1 text-xs font-bold">
      <span
        className={`h-2.5 w-2.5 rounded-full ${PIN_BG[colour]} ${spot.relapse ? "ring-2 ring-black" : ""}`}
      />
      {spot.relapse && spot.status === "dirty" ? "Came back" : STATUS_LABELS[spot.status]}
    </span>
  );
}
