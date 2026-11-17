"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { RegionStampState } from "@/components/map/NigeriaMap";
import { StampCard } from "@/components/map/StampCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useDataSaved } from "@/hooks/useDataSaved";
import { useInferenceTelemetry } from "@/hooks/useInferenceTelemetry";
import { SEED_DIALECTS } from "@/lib/db/seed-catalog";
import {
  computeOverallTonalAccuracyPercent,
  computeTonalAccuracyPercent,
  createEmptyTonalStats,
  getLocalDialectProgress,
} from "@/lib/progress/mastery";
import { listEarnedStamps } from "@/lib/progress/stamps";
import type {
  DialectId,
  DialectProgress,
  EarnedStamp,
  Tone,
  TonalClassStat,
} from "@/types/domain";

export default function ProgressPage() {
  const router = useRouter();
  const dataSaved = useDataSaved();
  const { recentEvents, summary } = useInferenceTelemetry();

  const [progressMap, setProgressMap] = useState<
    Partial<Record<DialectId, DialectProgress>>
  >({});
  const [stamps, setStamps] = useState<EarnedStamp[]>([]);

  useEffect(() => {
    let active = true;
    async function loadAllProgress() {
      const [earnedStamps, entries] = await Promise.all([
        listEarnedStamps(),
        Promise.all(
          SEED_DIALECTS.map(async (d) => {
            const p = await getLocalDialectProgress(d.dialectId);
            return [d.dialectId, p] as const;
          }),
        ),
      ]);
      if (!active) return;
      setStamps(earnedStamps);
      const next: Partial<Record<DialectId, DialectProgress>> = {};
      for (const [id, p] of entries) {
        next[id] = p;
      }
      setProgressMap(next);
    }
    void loadAllProgress();
    return () => {
      active = false;
    };
  }, []);

  const combinedTonal = useMemo(() => {
    const totals: Record<Tone, TonalClassStat> = createEmptyTonalStats();
    for (const d of SEED_DIALECTS) {
      const p = progressMap[d.dialectId];
      if (!p) continue;
      for (const tone of ["H", "M", "L"] as const) {
        totals[tone].correct += p.tonal[tone]?.correct ?? 0;
        totals[tone].total += p.tonal[tone]?.total ?? 0;
      }
    }
    return totals;
  }, [progressMap]);

  const earnedByDialect = useMemo(() => {
    const map = new Map<DialectId, EarnedStamp>();
    for (const stamp of stamps) {
      if (!map.has(stamp.dialectId)) {
        map.set(stamp.dialectId, stamp);
      }
    }
    return map;
  }, [stamps]);

  const overallAccuracy = computeOverallTonalAccuracyPercent(combinedTonal);

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-4xl sm:text-[2.75rem] leading-[0.98] text-indigo-900">
            Cultural Mastery &amp; Data Saved Passport
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Path C progression: real tonal accuracy across High, Mid, and Low
            registers, earned regional stamps, and transparent hybrid telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-7">
            <CardHeader>
              <div>
                <CardTitle>Tonal Accuracy Mastery</CardTitle>
                <p className="mt-0.5 text-xs text-text-muted">
                  Aggregated across all Yoruba, Igbo, and Hausa tonal drills
                </p>
              </div>
              <span className="rounded-sm bg-indigo-100 px-3 py-1 font-mono text-xs font-semibold text-indigo-700">
                Overall: {overallAccuracy}%
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProgressBar
                label={`High tone (H) \u00B7 ${combinedTonal.H.correct}/${combinedTonal.H.total} syllables`}
                value={computeTonalAccuracyPercent(combinedTonal.H)}
                showValueLabel
                tone="tone-high"
              />
              <ProgressBar
                label={`Mid tone (M) \u00B7 ${combinedTonal.M.correct}/${combinedTonal.M.total} syllables`}
                value={computeTonalAccuracyPercent(combinedTonal.M)}
                showValueLabel
                tone="tone-mid"
              />
              <ProgressBar
                label={`Low tone (L) \u00B7 ${combinedTonal.L.correct}/${combinedTonal.L.total} syllables`}
                value={computeTonalAccuracyPercent(combinedTonal.L)}
                showValueLabel
                tone="tone-low"
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Mobile Data &amp; Naira Saved</CardTitle>
              <span className="rounded-sm bg-edge-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-edge-600">
                FR-TEL-03
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-surface-sunken p-3">
                  <p className="text-xs text-text-muted">Data Saved</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-text-primary">
                    {dataSaved.formattedMb}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-sunken p-3">
                  <p className="text-xs text-text-muted">Naira Equivalent</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-gold-600">
                    {dataSaved.formattedNaira}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="rounded-lg border border-border bg-surface-sunken p-2">
                  <p className="text-[10px] text-text-muted">ON_DEVICE</p>
                  <p className="font-semibold text-edge-600">
                    {summary.onDeviceCount}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface-sunken p-2">
                  <p className="text-[10px] text-text-muted">CACHED</p>
                  <p className="font-semibold text-gold-600">
                    {summary.cachedReplayCount}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface-sunken p-2">
                  <p className="text-[10px] text-text-muted">IN_CLOUD</p>
                  <p className="font-semibold text-cloud-600">
                    {summary.cloudCount}
                  </p>
                </div>
              </div>
              <p className="text-xs text-text-muted">
                Recent events logged: {recentEvents.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <section aria-labelledby="passport-stamps-heading" className="space-y-4">
          <h2
            id="passport-stamps-heading"
            className="font-display text-2xl font-semibold text-text-primary"
          >
            Regional Dialect Stamps ({stamps.length} of {SEED_DIALECTS.length})
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {SEED_DIALECTS.map((dialect) => {
              const p = progressMap[dialect.dialectId];
              const scores = p ? Object.values(p.scenarioScores) : [];
              const bestPct =
                scores.length > 0 ? Math.round(Math.max(...scores) * 100) : 0;
              const earned = earnedByDialect.get(dialect.dialectId);
              const state: RegionStampState = earned
                ? "earned"
                : bestPct > 0
                  ? "in-progress"
                  : "locked";

              return (
                <StampCard
                  key={dialect.dialectId}
                  dialect={dialect}
                  state={state}
                  progress={earned ? 100 : bestPct}
                  earnedAt={earned?.earnedAt}
                  onSelect={(d) => {
                    router.push(`/scenarios?dialect=${d.dialectId}`);
                  }}
                />
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
