"use client";

import type { Dialect } from "@/types/domain";
import type { RegionStampState } from "./NigeriaMap";

export interface StampCardProps {
  dialect: Dialect;
  state: RegionStampState;
  progress: number;
  earnedAt?: number;
  selected?: boolean;
  /** Fill the parent grid cell instead of the fixed width used in horizontal scrollers. */
  fluid?: boolean;
  onSelect: (dialect: Dialect) => void;
}

export function StampCard({
  dialect,
  state,
  progress,
  earnedAt,
  selected = false,
  fluid = false,
  onSelect,
}: StampCardProps) {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const isEarned = state === "earned";
  const isInProgress = state === "in-progress";

  const earnedDateStr =
    isEarned && earnedAt
      ? new Date(earnedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(dialect)}
      aria-label={`${dialect.name} stamp: ${state}, ${safeProgress}% progress`}
      className={[
        fluid ? "w-full min-w-0" : "w-[144px] sm:w-full shrink-0",
        "group relative flex flex-col items-center justify-between rounded-2xl p-3.5 text-left transition-all duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus cursor-pointer",
        selected
          ? "border-2 border-indigo-500 bg-surface-raised "
          : isEarned
            ? "border-2 border-gold-600 bg-gold-100/60"
            : isInProgress
              ? "border border-indigo-500 bg-surface-raised"
              : "border border-dashed border-border bg-surface-raised/80 hover:border-indigo-300",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex w-full items-center justify-between gap-1 text-xs">
        <span className="text-text-muted">
          {dialect.languageId.toUpperCase()}
        </span>
        {isEarned ? (
          <span className="rounded-full bg-gold-400 px-2.5 py-0.5 text-xs font-semibold text-ink">
            Earned
          </span>
        ) : isInProgress ? (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            {safeProgress}%
          </span>
        ) : (
          <span className="text-xs text-text-muted">Locked</span>
        )}
      </div>

      <div
        className={[
          "my-3 flex size-20 items-center justify-center rounded-xl transition-transform",
          isEarned
            ? "rotate-[-2deg] group-hover:rotate-0"
            : state === "locked"
              ? "opacity-35 grayscale"
              : "opacity-85",
        ].join(" ")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dialect.stampArt}
          alt={`${dialect.name} cultural stamp`}
          className="size-20 object-contain"
        />
      </div>

      <div className="w-full">
        <p className="font-display text-base font-semibold text-text-primary leading-tight">
          {dialect.name}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-text-muted">
          {earnedDateStr
            ? `Earned ${earnedDateStr}`
            : state === "locked"
              ? "Complete a scenario to earn"
              : dialect.region}
        </p>
      </div>
    </button>
  );
}
