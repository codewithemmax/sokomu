"use client";

import Link from "next/link";
import { useAuthUser } from "@/hooks/useAuthUser";
import { ConnectivityBadge } from "./ConnectivityBadge";
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
    <header className="sticky top-0 z-40 h-16 w-full border-b border-border bg-surface-raised px-4 lg:px-8">
      <div className="mx-auto grid h-full max-w-[1376px] grid-cols-[1fr_auto] items-center gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/map"
            className="inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            <img src="/brand/sokomu-mark.svg" alt="" className="size-9" />
            <span className="hidden sm:inline-flex">
              <img src="/brand/sokomu-wordmark.svg" alt="Sokomu" className="h-6 w-[140px]" />
            </span>
          </Link>
          <div className="hidden h-6 w-px bg-border lg:block" />
          <span className="hidden text-sm text-text-secondary lg:inline">
            Learn it where it lives
          </span>
        </div>

        <div className="flex items-center justify-end gap-3">
          <div className="hidden items-center gap-1 rounded-xl border border-border bg-surface-sunken p-1 sm:flex">
            <InferenceSourcePill
              onOpenDetails={onOpenTelemetryDrawer}
              className="h-8 rounded-lg border-0 bg-transparent px-2.5 text-text-secondary hover:bg-surface-raised"
            />
            <ConnectivityBadge className="h-8 rounded-lg border-0 bg-transparent px-2.5 hover:bg-surface-raised" />
          </div>
          <div className="flex sm:hidden">
            <ConnectivityBadge />
          </div>
          <Link
            href="/settings"
            aria-label={`Account settings (${accountLabel})`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface-sunken px-2.5 text-xs font-medium text-text-primary hover:bg-indigo-100/60 focus-visible:outline-2 focus-visible:outline-indigo-500 sm:px-3"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-900">
              {accountLabel.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:inline">{accountLabel}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
