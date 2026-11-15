"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  NigeriaMap,
  type RegionStampState,
} from "@/components/map/NigeriaMap";
import { RegionDrawer } from "@/components/map/RegionDrawer";
import { StampCard } from "@/components/map/StampCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useDataSaved } from "@/hooks/useDataSaved";
import { listCachedAudio } from "@/lib/db/audio-cache";
import { loadScenarios } from "@/lib/db/scenario-cache";
import {
  getSeedDialect,
  getSeedLanguage,
  SEED_DIALECTS,
  SEED_SCENARIOS,
} from "@/lib/db/seed-catalog";
import {
  computeTonalAccuracyPercent,
  createDefaultDialectProgress,
  getLocalDialectProgress,
} from "@/lib/progress/mastery";
import { getLocalUserProfile } from "@/lib/progress/profile";
import { listEarnedStamps } from "@/lib/progress/stamps";
import type {
  DialectId,
  DialectProgress,
  EarnedStamp,
  Scenario,
  UserProfile,
} from "@/types/domain";

export default function MapDashboardPage() {
  const dataSaved = useDataSaved();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedDialectId, setSelectedDialectId] =
    useState<DialectId>("yo-ijebu");
  const [progressMap, setProgressMap] = useState<
    Partial<Record<DialectId, DialectProgress>>
  >({});
  const [stamps, setStamps] = useState<EarnedStamp[]>([]);
  const [scenarios, setScenarios] =
    useState<readonly Scenario[]>(SEED_SCENARIOS);
  const [cachedScenarioIds, setCachedScenarioIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    let active = true;
    async function loadDashboardState() {
      const [userProfile, earnedStamps, allScenarios, audioRecords] =
        await Promise.all([
          getLocalUserProfile(),
          listEarnedStamps(),
          loadScenarios(),
          listCachedAudio(),
        ]);

      const dialectProgressEntries = await Promise.all(
        SEED_DIALECTS.map(async (d) => {
          const p = await getLocalDialectProgress(d.dialectId);
          return [d.dialectId, p] as const;
        }),
      );

      if (!active) return;

      setProfile(userProfile);
      setSelectedDialectId(userProfile.dialectId);
      setStamps(earnedStamps);
      if (allScenarios.length > 0) {
        setScenarios(allScenarios);
      }
      setCachedScenarioIds(new Set(audioRecords.map((r) => r.scenarioId)));

      const nextProgressMap: Partial<Record<DialectId, DialectProgress>> = {};
      for (const [id, p] of dialectProgressEntries) {
        nextProgressMap[id] = p;
      }
      setProgressMap(nextProgressMap);
    }

    void loadDashboardState();
    return () => {
      active = false;
    };
  }, []);

  const earnedByDialect = useMemo(() => {
    const map = new Map<DialectId, EarnedStamp>();
    for (const stamp of stamps) {
      if (!map.has(stamp.dialectId)) {
        map.set(stamp.dialectId, stamp);
      }
    }
    return map;
  }, [stamps]);

  const regionStates = useMemo(() => {
    const states: Partial<Record<DialectId, RegionStampState>> = {};
    for (const dialect of SEED_DIALECTS) {
      if (earnedByDialect.has(dialect.dialectId)) {
        states[dialect.dialectId] = "earned";
      } else {
        const p = progressMap[dialect.dialectId];
        const scores = p ? Object.values(p.scenarioScores) : [];
        const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
        states[dialect.dialectId] = bestScore > 0 ? "in-progress" : "locked";
      }
    }
    return states;
  }, [earnedByDialect, progressMap]);

  const selectedDialect =
    getSeedDialect(selectedDialectId) ?? SEED_DIALECTS[0];
  const selectedProgress =
    progressMap[selectedDialect.dialectId] ??
    createDefaultDialectProgress(selectedDialect.dialectId);
  const selectedScenarios = useMemo(
    () =>
      scenarios.filter((s) => s.dialectId === selectedDialect.dialectId),
    [scenarios, selectedDialect.dialectId],
  );

  const activeLanguage = getSeedLanguage(
    profile?.languageId ?? selectedDialect.languageId,
  );
  const greeting = activeLanguage?.greeting ?? "\u1EB8 k\u00FA \u00E0b\u1ECD\u0300";
  const learnerName = profile?.displayName?.split(" ")[0] ?? "Learner";

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="tonal-text font-display text-2xl sm:text-3xl font-semibold text-indigo-900">
              {greeting}, {learnerName}.
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Your path:{" "}
              <span className="font-semibold text-text-primary">
                {activeLanguage?.name ?? "Yoruba"}
              </span>{" "}
              &middot;{" "}
              <span className="font-semibold text-indigo-700">
                {selectedDialect.name}
              </span>{" "}
              &middot;{" "}
              <span className="capitalize">
                {(profile?.goal ?? "elder-greetings").replace("-", " ")}
              </span>
            </p>
          </div>
          <Link
            href="/onboarding"
            className="inline-flex min-h-10 items-center text-xs font-medium text-indigo-700 hover:underline"
          >
            Change dialect or goal &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <NigeriaMap
              dialects={SEED_DIALECTS}
              selectedDialectId={selectedDialect.dialectId}
              regionStates={regionStates}
              onSelectDialect={(dialectId) => setSelectedDialectId(dialectId)}
            />
          </div>
          <div className="lg:col-span-4">
            <RegionDrawer
              dialect={selectedDialect}
              stampState={regionStates[selectedDialect.dialectId] ?? "locked"}
              progress={selectedProgress}
              scenarios={selectedScenarios}
              cachedScenarioIds={cachedScenarioIds}
            />
          </div>
        </div>

        <section aria-labelledby="stamps-heading" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="stamps-heading"
              className="font-display text-xl font-semibold text-text-primary"
            >
              Cultural Dialect Stamps ({stamps.length} of {SEED_DIALECTS.length}{" "}
              earned)
            </h2>
            <Link
              href="/progress"
              className="inline-flex min-h-10 shrink-0 items-center text-xs font-medium text-indigo-700 hover:underline"
            >
              See full passport &rarr;
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 md:grid-cols-4 lg:gap-5">
            {SEED_DIALECTS.map((dialect) => {
              const p = progressMap[dialect.dialectId];
              const scores = p ? Object.values(p.scenarioScores) : [];
              const bestPct =
                scores.length > 0 ? Math.round(Math.max(...scores) * 100) : 0;
              const earned = earnedByDialect.get(dialect.dialectId);
              const state = regionStates[dialect.dialectId] ?? "locked";

              return (
                <StampCard
                  key={dialect.dialectId}
                  dialect={dialect}
                  state={state}
                  progress={earned ? 100 : bestPct}
                  earnedAt={earned?.earnedAt}
                  selected={dialect.dialectId === selectedDialect.dialectId}
                  onSelect={(d) => setSelectedDialectId(d.dialectId)}
                />
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Tonal Accuracy Mastery ({selectedDialect.name})
              </CardTitle>
              <span className="font-mono text-xs text-text-muted">
                H &middot; M &middot; L
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProgressBar
                label="High tone (\u0301 acute)"
                value={computeTonalAccuracyPercent(selectedProgress.tonal.H)}
                showValueLabel
                tone="tone-high"
              />
              <ProgressBar
                label="Mid tone (unmarked / \u0304 macron)"
                value={computeTonalAccuracyPercent(selectedProgress.tonal.M)}
                showValueLabel
                tone="tone-mid"
              />
              <ProgressBar
                label="Low tone (\u0300 grave)"
                value={computeTonalAccuracyPercent(selectedProgress.tonal.L)}
                showValueLabel
                tone="tone-low"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mobile Data &amp; Naira Saved</CardTitle>
              <span className="rounded-full bg-edge-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-edge-600">
                ON_DEVICE + Cache
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="font-mono text-2xl font-semibold tabular-nums text-text-primary">
                    {dataSaved.formattedMb}
                  </p>
                  <p className="text-xs text-text-muted">
                    Total bandwidth saved locally
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xl font-semibold tabular-nums text-gold-600">
                    {dataSaved.formattedNaira}
                  </p>
                  <p className="text-xs text-text-muted">
                    At \u20A6{dataSaved.nairaPerMb.toFixed(2)}/MB
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <div className="rounded-xl border border-border bg-surface-sunken p-2.5">
                  <span className="text-text-muted">On-device drills: </span>
                  <span className="font-mono font-semibold text-edge-600">
                    {dataSaved.onDeviceCount}
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-surface-sunken p-2.5">
                  <span className="text-text-muted">Cached replays: </span>
                  <span className="font-mono font-semibold text-gold-600">
                    {dataSaved.cachedReplayCount}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
