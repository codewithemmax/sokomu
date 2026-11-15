"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MOBILE_TABS = [
  { href: "/map", label: "Map", shortCode: "MP" },
  { href: "/scenarios", label: "Scenarios", shortCode: "SC" },
  { href: "/library", label: "Library", shortCode: "LB" },
  { href: "/progress", label: "Progress", shortCode: "PR" },
] as const;

export function BottomTabBar() {
  const pathname = usePathname() ?? "/map";

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 inset-x-0 z-40 flex h-16 md:hidden items-center justify-around border-t border-border bg-surface-raised pb-[env(safe-area-inset-bottom)]"
    >
      {MOBILE_TABS.map((tab) => {
        const isActive =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-indigo-500",
              isActive
                ? "text-indigo-900 font-semibold"
                : "text-text-muted hover:text-text-primary",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={[
                "inline-flex h-6 w-8 items-center justify-center rounded-full text-[11px] font-mono font-bold",
                isActive
                  ? "bg-indigo-100 text-indigo-900"
                  : "text-text-secondary",
              ].join(" ")}
            >
              {tab.shortCode}
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
