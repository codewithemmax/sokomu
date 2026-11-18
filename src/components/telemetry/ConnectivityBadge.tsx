"use client";

import { Wifi, WifiOff } from "lucide-react";
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
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors duration-100",
        isOnline
          ? "bg-surface-raised text-text-primary border border-border"
          : "bg-offline-100 text-offline-600 border border-transparent",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isOnline ? (
        <Wifi aria-hidden="true" size={16} strokeWidth={1.5} className="shrink-0 text-success-600" />
      ) : (
        <WifiOff aria-hidden="true" size={16} strokeWidth={1.5} className="shrink-0 text-offline-600" />
      )}
      <span>{isOnline ? "Online" : "Offline"}</span>
    </span>
  );
}
