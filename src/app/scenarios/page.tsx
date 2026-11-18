"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { listCachedAudio } from "@/lib/db/audio-cache";
import { loadScenarios } from "@/lib/db/scenario-cache";
import {
  getSeedDialect,
  SEED_DIALECTS,
  SEED_SCENARIOS,
} from "@/lib/db/seed-catalog";
import type { DialectId, Scenario } from "@/types/domain";

export default function ScenariosLibraryPage() {
  const [scenarios, setScenarios] =
    useState<readonly Scenario[]>(SEED_SCENARIOS);
  const [dialectFilter, setDialectFilter] = useState<DialectId | "all">("all");
  const [onlyCached, setOnlyCached] = useState(false);
  const [cachedScenarioIds, setCachedScenarioIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    let active = true;
    void Promise.all([loadScenarios(), listCachedAudio()]).then(
      ([loadedScenarios, audioRecords]) => {
        if (!active) return;
        if (loadedScenarios.length > 0) {
          setScenarios(loadedScenarios);
        }
        setCachedScenarioIds(new Set(audioRecords.map((r) => r.scenarioId)));
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const filteredScenarios = useMemo(() => {
    return scenarios.filter((item) => {
      if (dialectFilter !== "all" && item.dialectId !== dialectFilter) {
        return false;
      }
      if (onlyCached && !cachedScenarioIds.has(item.scenarioId)) {
        return false;
      }
      return true;
    });
  }, [scenarios, dialectFilter, onlyCached, cachedScenarioIds]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-text-primary">
              Cultural Scenarios
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Two-speaker dialect dialogues with 24 kHz PCM streaming, local
              vocabulary grounding, and NFC tonal drills.
            </p>
          </div>
          <Link
            href="/library"
            className="inline-flex min-h-11 items-center text-xs sm:text-sm font-medium text-indigo-700 hover:underline"
          >
            Manage offline storage ({cachedScenarioIds.size} saved) &rarr;
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDialectFilter("all")}
              className={[
                "inline-flex min-h-11 items-center rounded-[var(--radius-button)] px-4 text-sm font-medium transition-colors cursor-pointer",
                dialectFilter === "all"
                  ? "border border-transparent bg-indigo-100 font-semibold text-indigo-900"
                  : "border border-border bg-surface-raised text-text-secondary hover:border-text-muted hover:text-text-primary",
              ].join(" ")}
            >
              All dialects ({scenarios.length})
            </button>
            {SEED_DIALECTS.map((dialect) => (
              <button
                key={dialect.dialectId}
                type="button"
                onClick={() => setDialectFilter(dialect.dialectId)}
                className={[
                  "inline-flex min-h-11 items-center rounded-[var(--radius-button)] px-4 text-sm font-medium transition-colors cursor-pointer",
                  dialectFilter === dialect.dialectId
                    ? "border border-transparent bg-indigo-100 font-semibold text-indigo-900"
                    : "border border-border bg-surface-raised text-text-secondary hover:border-text-muted hover:text-text-primary",
                ].join(" ")}
              >
                {dialect.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-pressed={onlyCached}
            onClick={() => setOnlyCached((v) => !v)}
            className={[
              "inline-flex min-h-11 items-center rounded-[var(--radius-button)] border px-4 text-sm font-medium transition-colors cursor-pointer",
              onlyCached
                ? "border-transparent bg-gold-100 font-semibold text-ink"
                : "border-border bg-surface-base text-text-secondary",
            ].join(" ")}
          >
            {onlyCached ? "Showing saved offline only" : "Filter: Saved offline"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredScenarios.map((scenario) => {
            const dialect = getSeedDialect(scenario.dialectId);
            const isCached = cachedScenarioIds.has(scenario.scenarioId);
            const estMb = (scenario.estimatedAudioBytes / 1_048_576).toFixed(1);

            return (
              <Card key={scenario.scenarioId} className="flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <div>
                      <span className="text-xs font-semibold text-text-secondary">
                        {dialect?.name ?? scenario.dialectId} &middot;{" "}
                        {dialect?.region ?? ""}
                      </span>
                      <CardTitle className="mt-1 font-display text-xl">
                        {scenario.title}
                      </CardTitle>
                    </div>
                    <span
                      className={[
                        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        isCached
                          ? "bg-gold-100 text-ink border border-transparent"
                          : "bg-cloud-100 text-cloud-600",
                      ].join(" ")}
                    >
                      {isCached ? "Saved offline" : `${estMb} MB`}
                    </span>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-sm text-text-secondary">
                      {scenario.summary}
                    </p>
                    <div className="rounded-xl border border-border bg-surface-base p-3 text-xs text-text-secondary">
                      <strong className="text-text-primary">Speakers:</strong>{" "}
                      {scenario.speakers[0].displayName} &amp;{" "}
                      {scenario.speakers[1].displayName} &middot;{" "}
                      {scenario.script.length} dialogue lines &middot;{" "}
                      {scenario.glossaryEntryIds.length} glossary words
                    </div>
                  </CardContent>
                </div>

                <CardFooter>
                  <Link
                    href={`/scenarios/${scenario.scenarioId}?tab=listen`}
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] border border-transparent bg-indigo-700 px-4 py-2 text-xs sm:text-sm font-semibold text-on-indigo hover:bg-indigo-900"
                  >
                    Listen
                  </Link>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/scenarios/${scenario.scenarioId}?tab=vocab`}
                      className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] border border-border bg-surface-raised px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-base"
                    >
                      Vocabulary Quiz
                    </Link>
                    <Link
                      href={`/scenarios/${scenario.scenarioId}?tab=tone`}
                      className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] border border-border bg-surface-raised px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-base"
                    >
                      Tone Drill
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
