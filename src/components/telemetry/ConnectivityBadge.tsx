"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export interface ConnectivityBadgeProps {
  online?: boolean;
  className?: string;
}

export function ConnectivityBadge({
  online,
  className = "",
}: ConnectivityBadgeProps) {
  const hookOnline = useOnlineStatus();
  const isOnline = online ?? hookOnline;

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={isOnline ? "Network status: Online" : "Network status: Offline"}
      className={[
        "inline-flex h-7 items-center gap-1.5 px-2.5 font-mono text-xs font-medium transition-colors duration-100",
        isOnline
          ? "bg-transparent text-text-secondary border border-ink/25"
          : "bg-offline-100 text-offline-600 border border-offline-600/30 font-semibold",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden="true"
        className={`inline-block size-2 ${
          isOnline ? "bg-success-600" : "bg-offline-600"
        }`}
      />
      <span>{isOnline ? "Online" : "Offline"}</span>
    </span>
  );
}
