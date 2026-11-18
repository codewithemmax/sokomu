"use client";

import { Suspense, useState, type ReactNode } from "react";
import { DemoAnnouncementBar } from "@/components/telemetry/DemoAnnouncementBar";
import { NanoDownloadBanner } from "@/components/telemetry/NanoDownloadBanner";
import { OfflineBanner } from "@/components/telemetry/OfflineBanner";
import { TelemetryDrawer } from "@/components/telemetry/TelemetryDrawer";
import { TelemetryHeaderBar } from "@/components/telemetry/TelemetryHeaderBar";
import { BottomTabBar } from "./BottomTabBar";
import { LeftRail } from "./LeftRail";

export interface AppShellProps {
  children: ReactNode;
  hideNavigation?: boolean;
}

export function AppShell({ children, hideNavigation = false }: AppShellProps) {
  const [telemetryDrawerOpen, setTelemetryDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh flex flex-col bg-surface-raised text-text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius-button)] focus:bg-indigo-700 focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-on-indigo focus:shadow-[var(--shadow-float)] focus:outline-2 focus:outline-offset-2 focus:outline-focus"
      >
        Skip to main content
      </a>
      <DemoAnnouncementBar />
      <TelemetryHeaderBar
        hasSidebar={!hideNavigation}
        onOpenTelemetryDrawer={() => setTelemetryDrawerOpen(true)}
      />
      <NanoDownloadBanner />
      <OfflineBanner />

      <div
        className={
          hideNavigation
            ? "flex-1"
            : "flex-1 grid grid-cols-1 md:grid-cols-[72px_1fr] lg:grid-cols-[248px_1fr]"
        }
      >
        {!hideNavigation ? (
          <Suspense fallback={null}>
            <LeftRail />
          </Suspense>
        ) : null}
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1376px] px-4 sm:px-5 md:px-6 lg:px-8 py-6 lg:py-8 pb-28 md:pb-8 focus:outline-none"
        >
          {children}
        </main>
      </div>

      {!hideNavigation ? (
        <Suspense fallback={null}>
          <BottomTabBar />
        </Suspense>
      ) : null}
      <TelemetryDrawer
        open={telemetryDrawerOpen}
        onClose={() => setTelemetryDrawerOpen(false)}
      />
    </div>
  );
}
