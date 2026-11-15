"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export interface OfflineBannerProps {
  online?: boolean;
}

export const OFFLINE_BANNER_COPY =
  "You are offline. Drills keep working on your device. Audio synthesis will resume when you reconnect.";

export function OfflineBanner({ online }: OfflineBannerProps) {
  const hookOnline = useOnlineStatus();
  const isOnline = online ?? hookOnline;

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full border-b border-offline-600/25 bg-offline-100 px-4 py-2.5 text-offline-600 transition-all duration-150 lg:px-8"
    >
      <div className="mx-auto flex max-w-[1376px] items-center gap-2.5 text-xs sm:text-sm font-medium">
        <span
          aria-hidden="true"
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-offline-600 text-white text-xs font-bold"
        >
          !
        </span>
        <p>{OFFLINE_BANNER_COPY}</p>
      </div>
    </div>
  );
}
