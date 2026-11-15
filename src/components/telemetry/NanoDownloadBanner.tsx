"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useNanoReadiness } from "@/hooks/useNanoReadiness";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function NanoDownloadBanner() {
  const { status, startDownload } = useNanoReadiness();
  const online = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  if (status.state === "downloadable") {
    return (
      <div
        role="region"
        aria-label="On-device AI setup"
        className="w-full border-b border-border bg-indigo-100/70 px-4 py-2.5 lg:px-8"
      >
        <div className="mx-auto flex max-w-[1376px] flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <p className="font-medium text-indigo-900">
            Download on-device AI to practise offline (one-time Gemini Nano model download).
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              offlineDimmed={!online}
              onClick={() => void startDownload()}
            >
              Download
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
            >
              Hide
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status.state === "downloading") {
    const pct = Math.round(Math.min(1, Math.max(0, status.progress)) * 100);
    return (
      <div
        role="region"
        aria-label="Downloading Gemini Nano"
        className="w-full border-b border-edge-600/25 bg-edge-100/60 px-4 py-2.5 lg:px-8"
      >
        <div className="mx-auto flex max-w-[1376px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 max-w-md">
            <ProgressBar
              value={pct}
              max={100}
              label={`Downloading Gemini Nano . ${pct}%`}
              showValueLabel
              tone="edge"
              size="sm"
            />
          </div>
          <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
            Hide
          </Button>
        </div>
      </div>
    );
  }

  if (status.state === "error") {
    return (
      <div
        role="region"
        aria-label="On-device AI status"
        className="w-full border-b border-warning-600/25 bg-offline-100 px-4 py-2.5 text-offline-600 lg:px-8"
      >
        <div className="mx-auto flex max-w-[1376px] flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <p className="font-medium">
            On-device model setup paused ({status.message}). Using cloud or cached mode meanwhile.
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              offlineDimmed={!online}
              onClick={() => void startDownload()}
            >
              Retry
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
