"use client";

import { useRef } from "react";

import { button } from "@/components/ui";

/** One big camera button plus a gallery fallback; works in any phone browser, nothing to install. */
export function PhotoCapture({
  label,
  onPhoto,
  disabled = false,
}: {
  label: string;
  onPhoto: (file: File) => void;
  disabled?: boolean;
}) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);

  const handle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onPhoto(file);
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        className={button.primary}
        disabled={disabled}
        onClick={() => camera.current?.click()}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
        {label}
      </button>
      <button
        type="button"
        className={button.secondary}
        disabled={disabled}
        onClick={() => gallery.current?.click()}
      >
        Choose from gallery
      </button>
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handle}
        data-testid="camera-input"
      />
      <input
        ref={gallery}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handle}
        data-testid="gallery-input"
      />
    </div>
  );
}
