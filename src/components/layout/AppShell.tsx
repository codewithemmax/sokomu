"use client";

import { useState, type ReactNode } from "react";
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
    <div className="min-h-dvh flex flex-col bg-surface-base text-text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[10px] focus:bg-indigo-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-[var(--shadow-3)] focus:outline-2 focus:outline-offset-2 focus:outline-gold-400"
      >
        Skip to main content
      </a>
      <DemoAnnouncementBar />
      <TelemetryHeaderBar
        onOpenTelemetryDrawer={() => setTelemetryDrawerOpen(true)}
      />
      <NanoDownloadBanner />
      <OfflineBanner />

      <div
        className={
          hideNavigation
            ? "flex-1"
            : "flex-1 grid grid-cols-1 md:grid-cols-[72px_1fr] lg:grid-cols-[240px_1fr]"
        }
      >
        {!hideNavigation ? <LeftRail /> : null}
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1376px] px-4 sm:px-5 md:px-6 lg:px-8 py-6 lg:py-8 pb-24 md:pb-8 focus:outline-none"
        >
          {children}
        </main>
      </div>

      {!hideNavigation ? <BottomTabBar /> : null}
      <TelemetryDrawer
        open={telemetryDrawerOpen}
        onClose={() => setTelemetryDrawerOpen(false)}
      />
    </div>
  );
}
