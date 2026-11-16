"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useAuthUser } from "@/hooks/useAuthUser";
import { ConnectivityBadge } from "./ConnectivityBadge";
import { DataSavedCounter } from "./DataSavedCounter";
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
    <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface-sunken/75 px-3 py-1.5 text-xs font-medium text-text-secondary">
      <Icon name={matched.icon} size={14} className="text-gold-600" />
      <span>{matched.label}</span>
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
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-surface-raised/90 backdrop-blur-md">
      <div
        aria-hidden="true"
        className="h-[3px] w-full bg-gradient-to-r from-indigo-900 via-gold-600 to-indigo-500"
      />
      <div
        className={[
          "flex h-16 items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6",
          hasSidebar
            ? "w-full lg:pr-8"
            : "mx-auto w-full max-w-[1376px] lg:px-8",
        ].join(" ")}
      >
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={
              hasSidebar
                ? "flex shrink-0 items-center lg:w-[216px] lg:border-r lg:border-border/80 lg:pr-4"
                : "flex shrink-0 items-center"
            }
          >
            <Link
              href="/map"
              aria-label="Sokomu home"
              className="group inline-flex min-h-10 items-center gap-2 sm:gap-2.5 rounded-xl pr-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/sokomu-icon.svg"
                alt=""
                className="size-8 sm:size-9 shrink-0 rounded-xl shadow-[var(--shadow-1)] ring-1 ring-indigo-900/10 transition-transform duration-150 group-hover:scale-[1.03]"
              />
              <span className="flex flex-col">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/sokomu-wordmark.svg"
                  alt="Sokomu"
                  className="h-4 sm:h-[18px] w-auto self-start"
                />
                <span className="hidden sm:block mt-1 text-[11px] font-medium tracking-wide leading-none text-text-muted">
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
          <div className="hidden xl:inline-flex">
            <DataSavedCounter
              compact
              tooltipPlacement="bottom"
              onClick={onOpenTelemetryDrawer}
              className="h-10 rounded-xl border border-border/80 bg-surface-sunken/70 px-3 py-1 hover:border-gold-600/40 hover:bg-gold-100/40"
            />
          </div>

          <div className="flex items-center gap-1.5 sm:h-10 sm:gap-1 sm:rounded-xl sm:border sm:border-border/80 sm:bg-surface-sunken/75 sm:p-1">
            <InferenceSourcePill
              onOpenDetails={onOpenTelemetryDrawer}
              className="h-10 rounded-xl px-2.5 text-[11px] shadow-[var(--shadow-1)] sm:h-8 sm:rounded-lg sm:border-0 sm:bg-surface-raised sm:text-xs sm:hover:bg-surface-base"
            />
            <ConnectivityBadge className="h-10 rounded-xl px-2 text-[11px] sm:h-8 sm:rounded-lg sm:border-0 sm:bg-transparent sm:px-2.5 sm:text-xs" />
          </div>

          <Link
            href="/settings"
            aria-label={`Account settings (${accountLabel})`}
            className="inline-flex h-10 w-10 sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-surface-raised sm:px-3 text-xs font-medium text-text-primary shadow-[var(--shadow-1)] transition-all hover:border-indigo-500/40 hover:bg-indigo-100/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <span className="flex size-6 items-center justify-center rounded-lg bg-indigo-900 text-[11px] font-bold text-gold-400">
              {accountLabel.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:inline font-semibold">{accountLabel}</span>
            <Icon name="settings" size={14} className="hidden sm:inline text-text-muted" />
          </Link>
        </div>
      </div>
    </header>
  );
}
