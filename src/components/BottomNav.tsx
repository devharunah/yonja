"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs: { href: Route; label: string; icon: React.ReactNode }[] = [
  {
    href: "/",
    label: "Map",
    icon: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" />,
  },
  {
    href: "/report",
    label: "Report",
    icon: <path d="M12 5v14M5 12h14" />,
  },
  {
    href: "/coach",
    label: "Coach",
    icon: <path d="M6 7h12l-1 13H7L6 7Zm3 0V4h6v3M4 7h16" />,
  },
  {
    href: "/dashboard",
    label: "Officer",
    icon: <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur">
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {tab.icon}
                </svg>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
