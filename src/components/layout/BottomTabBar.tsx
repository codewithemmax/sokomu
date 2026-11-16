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
      className="fixed bottom-0 inset-x-0 z-40 flex h-16 md:hidden items-center justify-around border-t-2 border-indigo-900/80 bg-surface-raised pb-[env(safe-area-inset-bottom)]"
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
              "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-indigo-500",
              isActive
                ? "border-t-2 border-gold-600 text-indigo-900 font-semibold"
                : "border-t-2 border-transparent text-text-muted hover:text-text-primary",
            ].join(" ")}
          >
            <Icon name={tab.icon as IconName} size={20} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
