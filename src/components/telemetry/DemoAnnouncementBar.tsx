"use client";

import { useRemoteConfigString } from "@/hooks/useRemoteConfigValue";

export function DemoAnnouncementBar() {
  const announcement = useRemoteConfigString("demo_announcement").trim();

  if (!announcement) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full border-b border-gold-600/30 bg-gold-100 px-4 py-2 text-xs sm:text-sm font-medium text-indigo-900 lg:px-8"
    >
      <div className="mx-auto flex max-w-[1376px] items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-gold-600" />
          <span>{announcement}</span>
        </div>
        <span className="hidden text-xs text-text-secondary sm:inline">
          Firebase Remote Config
        </span>
      </div>
    </div>
  );
}
