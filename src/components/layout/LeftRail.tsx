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
      className="hidden md:flex md:w-[72px] lg:w-[240px] shrink-0 flex-col justify-between border-r border-border bg-surface-raised px-2 lg:px-4 py-7"
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
                "relative flex min-h-[44px] items-center justify-center lg:justify-start gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
                isActive
                  ? "border-l-gold-600 bg-gold-100/45 text-indigo-900 font-semibold"
                  : "border-l-transparent text-text-secondary hover:border-l-border hover:bg-surface-sunken/70 hover:text-text-primary",
              ].join(" ")}
            >
              <span className={isActive ? "text-indigo-700" : "text-text-muted"}><Icon name={item.icon} size={19} /></span>
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden lg:block space-y-2 border-t border-b border-border bg-surface-sunken/70 px-2 py-4 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-medium text-text-primary">
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
