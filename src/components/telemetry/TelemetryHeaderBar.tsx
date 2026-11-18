"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useAuthUser } from "@/hooks/useAuthUser";
import { ConnectivityBadge } from "./ConnectivityBadge";
import { InferenceSourcePill } from "./InferenceSourcePill";

export interface TelemetryHeaderBarProps {
  onOpenTelemetryDrawer: () => void;
  hasSidebar?: boolean;
}

const ROUTE_SECTIONS: readonly {
  prefix: string;
  label: string;
  icon: IconName;
}[] = [
  { prefix: "/settings/diagnostics", label: "AI Diagnostics", icon: "signal" },
  { prefix: "/diagnostics", label: "AI Diagnostics", icon: "signal" },
  { prefix: "/map", label: "Cultural Map", icon: "map" },
  { prefix: "/scenarios", label: "Practice Studio", icon: "sparkles" },
  { prefix: "/library", label: "Offline Library", icon: "book" },
  { prefix: "/progress", label: "Progress Passport", icon: "chart" },
  { prefix: "/trainer", label: "Trainer Portal", icon: "graduation" },
  { prefix: "/settings", label: "Account & Settings", icon: "settings" },
  { prefix: "/onboarding", label: "Learning Path", icon: "globe" },
];

function HeaderSectionContext() {
  const pathname = usePathname() ?? "/";
  const matched =
    ROUTE_SECTIONS.find(
      (item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
    ) ?? { label: "Nigerian Dialect Studio", icon: "globe" as IconName };

  return (
    <span className="inline-flex items-center gap-2 text-text-primary">
      <Icon name={matched.icon} size={20} className="text-text-secondary" />
      <span className="font-display text-lg font-bold leading-none">{matched.label}</span>
    </span>
  );
}

export function TelemetryHeaderBar({
  onOpenTelemetryDrawer,
  hasSidebar = true,
}: TelemetryHeaderBarProps) {
  const { user } = useAuthUser();
  const accountLabel = user
    ? user.isAnonymous
      ? "Guest"
      : (user.displayName?.split(" ")[0] ?? "Learner")
    : "Guest";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface-raised">
      <div
        className={[
          "flex min-h-[72px] items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6",
          hasSidebar
            ? "w-full lg:pr-8"
            : "mx-auto w-full max-w-[1376px] lg:px-8",
        ].join(" ")}
      >
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={
              hasSidebar
                ? "flex shrink-0 items-center lg:w-[224px]"
                : "flex shrink-0 items-center"
            }
          >
            <Link
              href="/map"
              aria-label="Sokomu home"
              className="group inline-flex min-h-11 items-center gap-2.5 rounded-[var(--radius-button)] pr-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/sokomu-icon.svg"
                alt=""
                className="size-8 shrink-0 rounded-[var(--radius-button)]"
              />
              <span className="flex flex-col">
                <span className="font-display text-xl font-extrabold leading-none tracking-[-0.02em] text-text-primary">
                  Sokomu
                </span>
                <span className="hidden sm:block mt-1 text-xs leading-none text-text-secondary">
                  Learn it where it lives
                </span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center">
            <Suspense fallback={null}>
              <HeaderSectionContext />
            </Suspense>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <div className="flex items-center gap-1 sm:h-10 sm:gap-1.5">
            <InferenceSourcePill
              onOpenDetails={onOpenTelemetryDrawer}
              className="h-11 px-3 text-xs sm:h-8 sm:text-sm"
            />
            <ConnectivityBadge className="h-11 px-3 text-xs sm:h-8 sm:text-sm" />
          </div>

          <Link
            href="/settings"
            aria-label={`Account settings (${accountLabel})`}
            className="inline-flex h-11 w-11 sm:w-auto items-center justify-center gap-2 rounded-full border border-border bg-surface-raised sm:pl-1 sm:pr-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-900">
              {accountLabel.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:inline font-semibold">{accountLabel}</span>
            <Icon name="settings" size={16} className="hidden sm:inline text-text-secondary" />
          </Link>
        </div>
      </div>
    </header>
  );
}
