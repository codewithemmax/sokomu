"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

const MOBILE_TABS = [
  { href: "/map", label: "Explore", icon: "map" },
  { href: "/scenarios", label: "Practice", icon: "sparkles" },
  { href: "/library", label: "Library", icon: "book" },
  { href: "/progress", label: "Progress", icon: "chart" },
] as const;

export function BottomTabBar() {
  const pathname = usePathname() ?? "/map";

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 inset-x-0 z-40 flex md:hidden items-stretch justify-around border-t border-border bg-surface-raised px-1 pb-[env(safe-area-inset-bottom)]"
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
              "relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
              isActive
                ? "font-semibold text-indigo-900"
                : "font-medium text-text-secondary hover:text-text-primary",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-8 w-14 items-center justify-center rounded-[var(--radius-button)]",
                isActive ? "bg-indigo-100 text-indigo-700" : "",
              ].join(" ")}
            >
              <Icon name={tab.icon as IconName} size={20} />
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
