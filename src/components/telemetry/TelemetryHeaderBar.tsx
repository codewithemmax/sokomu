"use client";

import Link from "next/link";
import { useAuthUser } from "@/hooks/useAuthUser";
import { ConnectivityBadge } from "./ConnectivityBadge";
import { DataSavedCounter } from "./DataSavedCounter";
import { InferenceSourcePill } from "./InferenceSourcePill";

export interface TelemetryHeaderBarProps {
  onOpenTelemetryDrawer: () => void;
}

export function TelemetryHeaderBar({
  onOpenTelemetryDrawer,
}: TelemetryHeaderBarProps) {
  const { user } = useAuthUser();
  const accountLabel = user
    ? user.isAnonymous
      ? "Guest"
      : (user.displayName?.split(" ")[0] ?? "Learner")
    : "Guest";

  return (
    <header className="sticky top-0 z-40 h-14 lg:h-16 w-full border-b border-border bg-surface-raised/95 backdrop-blur-xs px-4 lg:px-8">
      <div className="mx-auto flex h-full max-w-[1376px] items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/map"
            className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            <span
              aria-hidden="true"
              className="inline-flex size-8 items-center justify-center rounded-lg bg-indigo-900 text-gold-400 font-display font-bold text-base"
            >
              S
            </span>
            <span className="font-display text-lg font-bold tracking-wide text-indigo-900">
              SOKOMU
            </span>
          </Link>
          <span className="hidden text-xs font-medium text-text-muted lg:inline">
            So &middot; Koya &middot; Muta
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <InferenceSourcePill onOpenDetails={onOpenTelemetryDrawer} />
          <ConnectivityBadge />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <DataSavedCounter onClick={onOpenTelemetryDrawer} />
          <Link
            href="/settings"
            aria-label={`Account settings (${accountLabel})`}
            className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-border bg-surface-sunken px-3 text-xs font-medium text-text-primary hover:bg-indigo-100/60 focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            <span>{accountLabel}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
