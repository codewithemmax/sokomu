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
      className="hidden md:flex md:w-[72px] lg:w-[240px] shrink-0 flex-col justify-between border-r border-ink/20 bg-surface-base px-2 lg:px-4 py-7"
    >
      <nav className="space-y-0.5">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "relative flex min-h-[44px] items-center justify-center lg:justify-start gap-3 border-l-4 px-3 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
                isActive
                  ? "border-l-gold-400 bg-indigo-900 text-on-indigo font-semibold"
                  : "border-l-transparent text-text-secondary hover:border-l-ink/30 hover:text-text-primary",
              ].join(" ")}
            >
              <span className={isActive ? "text-gold-400" : "text-text-muted"}><Icon name={item.icon} size={19} /></span>
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden lg:block space-y-2 border-t-[3px] border-ink px-1 pt-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-mono font-semibold text-text-primary">
            {nanoLabel}
          </span>
          <span
            aria-hidden="true"
            className={`inline-block size-2 ${
              statusState === "ready" ? "bg-edge-600" : "bg-gold-600"
            }`}
          />
        </div>
        <p className="text-[11px] text-text-muted">
          Firebase AI Logic Hybrid Mode
        </p>
        <Link
          href="/diagnostics"
          className="inline-block text-[11px] font-semibold text-indigo-700 underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          Open AI Diagnostics &rarr;
        </Link>
      </div>
    </aside>
  );
}
