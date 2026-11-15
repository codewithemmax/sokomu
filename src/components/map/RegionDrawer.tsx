"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { computeTonalAccuracyPercent } from "@/lib/progress/mastery";
import type {
  Dialect,
  DialectProgress,
  Scenario,
} from "@/types/domain";
import type { RegionStampState } from "./NigeriaMap";

export interface RegionDrawerProps {
  dialect: Dialect;
  stampState: RegionStampState;
  progress: DialectProgress;
  scenarios: readonly Scenario[];
  cachedScenarioIds: ReadonlySet<string>;
}

export function RegionDrawer({
  dialect,
  stampState,
  progress,
  scenarios,
  cachedScenarioIds,
}: RegionDrawerProps) {
  const highPct = computeTonalAccuracyPercent(progress.tonal.H);
  const midPct = computeTonalAccuracyPercent(progress.tonal.M);
  const lowPct = computeTonalAccuracyPercent(progress.tonal.L);
  const primaryScenario = scenarios[0];

  return (
    <Card className="flex flex-col justify-between space-y-5">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-gold-600">
              {dialect.region}
            </p>
            <h2 className="mt-0.5 font-display text-2xl font-semibold text-text-primary">
              {dialect.name}
            </h2>
          </div>
          <span
            className={[
              "rounded-full px-2.5 py-1 font-mono text-xs font-semibold",
              stampState === "earned"
                ? "bg-gold-100 text-gold-600 border border-gold-600/30"
                : stampState === "in-progress"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-surface-sunken text-text-muted",
            ].join(" ")}
          >
            Stamp: {stampState}
          </span>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed">
          {dialect.description}
        </p>

        <div className="space-y-2.5 rounded-xl border border-border bg-surface-sunken p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Tonal Mastery ({dialect.name})
          </p>
          <ProgressBar
            label="H (High tone)"
            value={highPct}
            showValueLabel
            tone="tone-high"
            size="sm"
          />
          <ProgressBar
            label="M (Mid tone)"
            value={midPct}
            showValueLabel
            tone="tone-mid"
            size="sm"
          />
          <ProgressBar
            label="L (Low tone)"
            value={lowPct}
            showValueLabel
            tone="tone-low"
            size="sm"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Scenarios in {dialect.name}
          </p>
          <ul className="space-y-2">
            {scenarios.map((scenario) => {
              const isCached = cachedScenarioIds.has(scenario.scenarioId);
              const bestScore = Math.round(
                (progress.scenarioScores[scenario.scenarioId] ?? 0) * 100,
              );
              return (
                <li key={scenario.scenarioId}>
                  <Link
                    href={`/scenarios/${scenario.scenarioId}?tab=listen`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-sunken px-3.5 py-2.5 text-sm transition-colors hover:bg-indigo-100/50 focus-visible:outline-2 focus-visible:outline-indigo-500"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {scenario.title}
                      </p>
                      <p className="text-xs text-text-muted">
                        {bestScore > 0 ? `Best score: ${bestScore}%` : scenario.summary}
                      </p>
                    </div>
                    <span
                      className={[
                        "shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium",
                        isCached
                          ? "bg-gold-100 text-gold-600"
                          : "bg-cloud-100 text-cloud-600",
                      ].join(" ")}
                    >
                      {isCached ? "saved" : "cloud"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {primaryScenario ? (
        <Link
          href={`/scenarios/${primaryScenario.scenarioId}?tab=listen`}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-indigo-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-900 focus-visible:outline-2 focus-visible:outline-indigo-500"
        >
          Continue scenario: {primaryScenario.title}
        </Link>
      ) : null}
    </Card>
  );
}
