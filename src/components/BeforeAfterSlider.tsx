"use client";

import { useState } from "react";

/**
 * Drag the divider to reveal the after photo over the before photo (V4). A transparent range
 * input sits on top, so touch, mouse and keyboard all work without custom pointer handling.
 */
export function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-3xl bg-ink">
      <img
        src={before}
        alt="Before the clean-up"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <img
        src={after}
        alt="After the clean-up"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 w-1 -translate-x-1/2 bg-white shadow"
        style={{ left: `${position}%` }}
      >
        <span className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg font-bold text-ink shadow-lg">
          ⇆
        </span>
      </div>
      <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-dirty px-3 py-1 text-xs font-bold text-white">
        Before
      </span>
      <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-clean px-3 py-1 text-xs font-bold text-white">
        After
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Drag to compare before and after"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
