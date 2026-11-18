"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNanoReadiness } from "@/hooks/useNanoReadiness";
import { Icon, type IconName } from "@/components/ui/Icon";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  { href: "/map", label: "Explore map", icon: "map" },
  { href: "/scenarios", label: "Practice", icon: "sparkles" },
  { href: "/library", label: "Library", icon: "book" },
  { href: "/progress", label: "Progress", icon: "chart" },
  { href: "/trainer", label: "Trainer portal", icon: "graduation" },
  { href: "/settings", label: "Settings", icon: "settings" },
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
      className="hidden md:flex md:w-[72px] lg:w-[248px] shrink-0 flex-col justify-between gap-6 bg-surface-base px-2 lg:px-3 py-6"
    >
      <nav className="flex flex-col gap-1">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "relative flex min-h-12 items-center justify-center lg:justify-start gap-3 rounded-[var(--radius-button)] px-3 text-base transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                isActive
                  ? "bg-indigo-100 font-semibold text-indigo-900"
                  : "font-medium text-text-secondary hover:bg-surface-base hover:text-text-primary",
              ].join(" ")}
            >
              <span className={isActive ? "text-indigo-700" : "text-text-secondary"}><Icon name={item.icon} size={20} /></span>
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden lg:flex flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-surface-raised p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-text-primary">
            {nanoLabel}
          </span>
          <span
            aria-hidden="true"
            className={`inline-block size-2 rounded-full ${
              statusState === "ready" ? "bg-edge-600" : "bg-gold-600"
            }`}
          />
        </div>
        <p className="text-xs text-text-secondary">
          Firebase AI Logic Hybrid Mode
        </p>
        <Link
          href="/diagnostics"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700 underline-offset-4 hover:text-indigo-900 hover:underline"
        >
          Open AI Diagnostics &rarr;
        </Link>
      </div>
    </aside>
  );
}
