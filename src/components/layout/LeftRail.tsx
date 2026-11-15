"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNanoReadiness } from "@/hooks/useNanoReadiness";

export interface NavItem {
  href: string;
  label: string;
  shortCode: string;
}

export const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  { href: "/map", label: "Map", shortCode: "MP" },
  { href: "/scenarios", label: "Scenarios", shortCode: "SC" },
  { href: "/library", label: "Library", shortCode: "LB" },
  { href: "/progress", label: "Progress", shortCode: "PR" },
  { href: "/trainer", label: "Trainer", shortCode: "TR" },
  { href: "/settings", label: "Settings", shortCode: "ST" },
];

export function LeftRail() {
  const pathname = usePathname() ?? "/map";
  const { statusState } = useNanoReadiness();

  const nanoLabel =
    statusState === "ready"
      ? "Nano: ready"
      : statusState === "fallback"
        ? "Nano: fallback"
        : "Nano: cloud/cache";

  return (
    <aside
      aria-label="Primary navigation"
      className="hidden md:flex md:w-[72px] lg:w-[240px] shrink-0 flex-col justify-between border-r border-border bg-surface-raised px-2 lg:px-4 py-5"
    >
      <nav className="space-y-1">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex min-h-[44px] items-center justify-center lg:justify-start gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
                isActive
                  ? "bg-indigo-100 text-indigo-900 font-semibold"
                  : "text-text-secondary hover:bg-surface-sunken hover:text-text-primary",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-mono font-bold",
                  isActive
                    ? "bg-indigo-700 text-white"
                    : "bg-surface-sunken text-text-secondary",
                ].join(" ")}
              >
                {item.shortCode}
              </span>
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden lg:block space-y-2 rounded-xl border border-border bg-surface-sunken p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-mono font-medium text-text-primary">
            {nanoLabel}
          </span>
          <span
            aria-hidden="true"
            className={`inline-block size-2 rounded-full ${
              statusState === "ready" ? "bg-edge-600" : "bg-gold-600"
            }`}
          />
        </div>
        <p className="text-[11px] text-text-muted">
          Firebase AI Logic Hybrid Mode
        </p>
        <Link
          href="/diagnostics"
          className="inline-block text-[11px] font-medium text-indigo-700 hover:underline"
        >
          Open AI Diagnostics &rarr;
        </Link>
      </div>
    </aside>
  );
}
