"use client";

import Link from "next/link";
import { useState } from "react";
import { useFirebase } from "@/app/providers";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { emitInferenceTelemetryEvent } from "@/hooks/useInferenceTelemetry";
import { useNanoReadiness } from "@/hooks/useNanoReadiness";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  getCloudFallbackCountToday,
  resetCloudFallbackUsage,
} from "@/lib/ai/config";
import { refreshRemoteConfig } from "@/lib/firebase/remote-config";
import { REMOTE_CONFIG_DEFAULTS } from "@/lib/firebase/remote-config-defaults";

export function DiagnosticsView() {
  const { services, ready, configVersion } = useFirebase();
  const { status, statusState, refresh: refreshNano, startDownload } =
    useNanoReadiness();
  const online = useOnlineStatus();

  const [cloudCountToday, setCloudCountToday] = useState<number>(() =>
    getCloudFallbackCountToday(),
  );
  const [refreshingRc, setRefreshingRc] = useState(false);

  const hasAppCheckSiteKey = Boolean(
    process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY,
  );
  const hasDebugTokenEnv = Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN,
  );

  const handleRefreshRemoteConfig = async () => {
    if (!services?.remoteConfig) return;
    setRefreshingRc(true);
    try {
      await refreshRemoteConfig(services.remoteConfig);
    } finally {
      setRefreshingRc(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/settings"
              className="text-xs font-medium text-indigo-700 hover:underline"
            >
              &larr; Back to settings
            </Link>
            <h1 className="mt-1 font-display text-3xl font-semibold text-indigo-900">
              Hybrid AI &amp; Firebase Diagnostics
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Judge and developer verification panel for Gemini Nano readiness,
              App Check attestation, and live Remote Config parameters.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Gemini Nano (Chrome AI)</CardTitle>
              <span className="rounded-full bg-edge-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-edge-600">
                {status.state}
              </span>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-text-secondary">
              <p>
                Normalized readiness:{" "}
                <strong className="font-mono text-text-primary">
                  {statusState}
                </strong>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void refreshNano()}
                >
                  Re-check API
                </Button>
                {status.state === "downloadable" ? (
                  <Button
                    size="sm"
                    variant="primary"
                    offlineDimmed={!online}
                    onClick={() => void startDownload()}
                  >
                    Download model
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Firebase App Check</CardTitle>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-indigo-700">
                {services?.appCheck ? "Initialized" : "Pending"}
              </span>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-text-secondary">
              <p>
                reCAPTCHA Enterprise key:{" "}
                <strong className="font-mono text-text-primary">
                  {hasAppCheckSiteKey ? "Configured" : "Missing"}
                </strong>
              </p>
              <p>
                Debug token mode:{" "}
                <strong className="font-mono text-text-primary">
                  {hasDebugTokenEnv ? "Enabled (dev/judge)" : "Disabled (prod)"}
                </strong>
              </p>
              <p>
                Firebase client ready:{" "}
                <strong className="font-mono text-text-primary">
                  {String(ready)}
                </strong>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cloud Fallback Guard</CardTitle>
              <span className="font-mono text-xs text-cloud-600">
                {cloudCountToday} /{" "}
                {REMOTE_CONFIG_DEFAULTS.cloud_fallback_daily_limit} today
              </span>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-text-secondary">
              <p>
                Enforces daily cap per browser in UTC before switching drills to{" "}
                <code className="font-mono">ONLY_ON_DEVICE</code>.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    resetCloudFallbackUsage();
                    setCloudCountToday(getCloudFallbackCountToday());
                  }}
                >
                  Reset daily counter
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void emitInferenceTelemetryEvent({
                      feature: "vocab_quiz",
                      source: "ON_DEVICE",
                      latencyMs: 245,
                    })
                  }
                >
                  Simulate ON_DEVICE event
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Firebase Remote Config Parameters</CardTitle>
              <p className="mt-0.5 text-xs text-text-muted">
                Config version: {configVersion} &middot; 24 governed parameters
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              loading={refreshingRc}
              offlineDimmed={!online}
              onClick={() => void handleRefreshRemoteConfig()}
            >
              Fetch &amp; activate
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="py-2 pr-4 font-mono">Key</th>
                    <th className="py-2 font-mono">Default / Baseline Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {Object.entries(REMOTE_CONFIG_DEFAULTS).map(([key, val]) => (
                    <tr key={key}>
                      <td className="py-2 pr-4 font-semibold text-indigo-900 align-top">
                        {key}
                      </td>
                      <td className="py-2 text-text-secondary break-all">
                        {String(val)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default function SettingsDiagnosticsPage() {
  return <DiagnosticsView />;
}
