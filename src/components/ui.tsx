import type { Severity } from "@/lib/types";

export const button = {
  primary:
    "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-base font-bold text-white shadow-sm active:bg-brand-dark disabled:opacity-50",
  secondary:
    "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-line bg-white px-5 text-base font-bold text-ink active:bg-paper disabled:opacity-50",
  small:
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white active:bg-brand-dark disabled:opacity-50",
};

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="px-4 pt-6 pb-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Yonja</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
    </header>
  );
}

export function Card({
  children,
  className = "",
}: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl bg-white p-5 shadow-sm ${className}`}>{children}</section>
  );
}

const severityStyles: Record<Severity, string> = {
  low: "bg-brand-soft text-brand-dark",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

export function SeverityChip({ severity }: { severity: Severity }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${severityStyles[severity]}`}
    >
      {severity} severity
    </span>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <output className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-soft border-t-brand" />
      <p className="text-sm font-semibold text-muted">{label}</p>
    </output>
  );
}

export function Notice({
  tone,
  title,
  children,
}: {
  tone: "error" | "warning" | "info";
  title: string;
  children?: React.ReactNode;
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    info: "border-brand-soft bg-brand-soft text-brand-dark",
  }[tone];
  return (
    <div
      className={`rounded-2xl border p-4 ${styles}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <p className="font-bold">{title}</p>
      {children ? <div className="mt-1 text-sm">{children}</div> : null}
    </div>
  );
}

export function sacksRange(min: number, max: number): string {
  if (max <= 0) return "under 1 sack";
  if (min === max) return `about ${min} sack${min === 1 ? "" : "s"}`;
  return `about ${min}–${max} sacks`;
}

/** Never blocks the screen on the connection: data appears as soon as Firestore answers. */
export function LivePill({ loading, count }: { loading: boolean; count?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-sm">
      <span className={`h-2 w-2 animate-pulse rounded-full ${loading ? "bg-partly" : "bg-clean"}`} />
      {loading ? "Connecting…" : count === undefined ? "Live" : `Live · ${count}`}
    </span>
  );
}
