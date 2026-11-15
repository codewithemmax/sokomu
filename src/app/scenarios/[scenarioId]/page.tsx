"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { QuizCard } from "@/components/drill/QuizCard";
import { ToneChip } from "@/components/drill/ToneChip";
import { ToneDrill } from "@/components/drill/ToneDrill";
import { AppShell } from "@/components/layout/AppShell";
import { StampUnlockedModal } from "@/components/map/StampUnlockedModal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TabPanel, Tabs } from "@/components/ui/Tabs";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useHybridModel } from "@/hooks/useHybridModel";
import { buildFallbackTonalDrill, buildFallbackVocabularyQuiz } from "@/lib/ai/fallback-quiz";
import { enqueueDrillResult } from "@/lib/db/drill-queue";
import { loadGlossaryForScenario } from "@/lib/db/glossary-cache";
import { loadScenario } from "@/lib/db/scenario-cache";
import {
  getSeedDialect,
  getSeedGlossaryByScenario,
  getSeedScenario,
  SEED_SCENARIOS,
} from "@/lib/db/seed-catalog";
import {
  aggregateTonalMastery,
  createEmptyTonalStats,
  findWeakestTones,
  getLocalDialectProgress,
  recordScenarioDrillProgress,
} from "@/lib/progress/mastery";
import { evaluateAndAwardStamp } from "@/lib/progress/stamps";
import type {
  HybridCallOutcome,
  InferenceSourceLabel,
  SyllableGrade,
  TonalDrill as TonalDrillModel,
  VocabularyQuiz,
} from "@/types/ai";
import type { EarnedStamp, GlossaryEntry, Scenario } from "@/types/domain";

const DualSpeakerPlayer = dynamic(
  () =>
    import("@/components/audio/DualSpeakerPlayer").then(
      (mod) => mod.DualSpeakerPlayer,
    ),
  { ssr: false },
);

type ScenarioTab = "listen" | "vocab" | "tone";

export default function ScenarioDetailPage() {
  const params = useParams<{ scenarioId: string }>();
  const searchParams = useSearchParams();
  const { user } = useAuthUser();
  const { generateQuiz, generateTonalDrill } = useHybridModel();

  const rawScenarioId =
    typeof params?.scenarioId === "string"
      ? params.scenarioId
      : SEED_SCENARIOS[0].scenarioId;

  const initialTabParam = searchParams?.get("tab");
  const initialTab: ScenarioTab =
    initialTabParam === "vocab" || initialTabParam === "tone"
      ? initialTabParam
      : "listen";

  const [activeTab, setActiveTab] = useState<ScenarioTab>(initialTab);
  const [scenario, setScenario] = useState<Scenario>(
    () => getSeedScenario(rawScenarioId) ?? SEED_SCENARIOS[0],
  );
  const [glossary, setGlossary] = useState<GlossaryEntry[]>(() =>
    getSeedGlossaryByScenario(rawScenarioId),
  );
  const [activeLineIdx, setActiveLineIdx] = useState<number>(0);

  const [quizOutcome, setQuizOutcome] =
    useState<HybridCallOutcome<VocabularyQuiz> | null>(null);
  const [toneDrillOutcome, setToneDrillOutcome] =
    useState<HybridCallOutcome<TonalDrillModel> | null>(null);
  const [loadingDrill, setLoadingDrill] = useState(false);
  const [unlockedStamp, setUnlockedStamp] = useState<EarnedStamp | null>(null);

  useEffect(() => {
    let active = true;
    async function hydrateScenarioAndGlossary() {
      const loadedScenario =
        (await loadScenario(rawScenarioId)) ??
        getSeedScenario(rawScenarioId) ??
        SEED_SCENARIOS[0];
      const loadedGlossary = await loadGlossaryForScenario(
        loadedScenario.scenarioId,
        loadedScenario.dialectId,
      );
      if (!active) return;
      setScenario(loadedScenario);
      setGlossary(
        loadedGlossary.length > 0
          ? loadedGlossary
          : getSeedGlossaryByScenario(
              loadedScenario.scenarioId,
              loadedScenario.dialectId,
            ),
      );
    }
    void hydrateScenarioAndGlossary();
    return () => {
      active = false;
    };
  }, [rawScenarioId]);

  const prepareQuiz = useCallback(async () => {
    if (glossary.length === 0) return;
    setLoadingDrill(true);
    try {
      const progress = await getLocalDialectProgress(scenario.dialectId);
      const weakestTones = findWeakestTones(progress.tonal);
      const outcome = await generateQuiz({
        dialectId: scenario.dialectId,
        scenarioId: scenario.scenarioId,
        entries: glossary,
        weakestTones,
      });
      setQuizOutcome(outcome);
    } catch {
      setQuizOutcome({
        data: buildFallbackVocabularyQuiz(scenario.dialectId, glossary, 5),
        source: "CACHED_FALLBACK",
        latencyMs: 4,
        retried: false,
      });
    } finally {
      setLoadingDrill(false);
    }
  }, [generateQuiz, glossary, scenario.dialectId, scenario.scenarioId]);

  const prepareToneDrill = useCallback(async () => {
    if (glossary.length === 0) return;
    setLoadingDrill(true);
    try {
      const progress = await getLocalDialectProgress(scenario.dialectId);
      const weakestTones = findWeakestTones(progress.tonal);
      const outcome = await generateTonalDrill({
        dialectId: scenario.dialectId,
        scenarioId: scenario.scenarioId,
        entries: glossary,
        weakestTones,
      });
      setToneDrillOutcome(outcome);
    } catch {
      setToneDrillOutcome({
        data: buildFallbackTonalDrill(scenario.dialectId, glossary, 5),
        source: "CACHED_FALLBACK",
        latencyMs: 4,
        retried: false,
      });
    } finally {
      setLoadingDrill(false);
    }
  }, [generateTonalDrill, glossary, scenario.dialectId, scenario.scenarioId]);

  useEffect(() => {
    if (activeTab === "vocab" && !quizOutcome && !loadingDrill) {
      void prepareQuiz();
    } else if (activeTab === "tone" && !toneDrillOutcome && !loadingDrill) {
      void prepareToneDrill();
    }
  }, [activeTab, quizOutcome, toneDrillOutcome, loadingDrill, prepareQuiz, prepareToneDrill]);

  const handleDrillCompletion = async (
    kind: "vocab" | "tone",
    accuracy: number,
    source: InferenceSourceLabel,
    syllableGrades?: readonly SyllableGrade[],
  ) => {
    const uid = user?.uid ?? "guest";
    const clientEventId = `${uid}_${scenario.scenarioId}_${kind}_${Date.now()}`;
    const drillTonal = aggregateTonalMastery(
      createEmptyTonalStats(),
      syllableGrades ?? [],
    );

    await enqueueDrillResult({
      clientEventId,
      uid,
      scenarioId: scenario.scenarioId,
      kind,
      score: accuracy,
      items: 5,
      tonal: drillTonal,
      inferenceSource: source,
      createdAt: Date.now(),
    });

    await recordScenarioDrillProgress(user?.uid ?? null, {
      dialectId: scenario.dialectId,
      scenarioId: scenario.scenarioId,
      accuracy,
      syllableGrades,
    });

    const award = await evaluateAndAwardStamp(user?.uid ?? null, {
      dialectId: scenario.dialectId,
      scenarioId: scenario.scenarioId,
      accuracy,
    });

    if (award.unlocked) {
      setUnlockedStamp(award.unlocked);
    }
  };

  const dialect = getSeedDialect(scenario.dialectId);
  const speakerById = new Map(
    scenario.speakers.map((s) => [s.id, s.displayName]),
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/scenarios"
              className="text-xs font-medium text-indigo-700 hover:underline"
            >
              &larr; Back to scenarios
            </Link>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-indigo-900">
                {scenario.title}
              </h1>
              <span className="rounded-full bg-gold-100 px-3 py-0.5 font-mono text-xs font-semibold text-gold-600">
                {dialect?.name ?? scenario.dialectId}
              </span>
            </div>
          </div>

          <Tabs<ScenarioTab>
            items={[
              { id: "listen", label: "Listen" },
              {
                id: "vocab",
                label: "Vocabulary",
                badge: glossary.length,
              },
              { id: "tone", label: "Tone drill" },
            ]}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab)}
            ariaLabel="Scenario practice mode"
          />
        </div>

        <TabPanel tabId="listen" activeTab={activeTab}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <DualSpeakerPlayer
                scenario={scenario}
                onActiveLineChange={setActiveLineIdx}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Dialogue Transcript</CardTitle>
                  <span className="font-mono text-xs text-text-muted">
                    {scenario.script.length} lines
                  </span>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {scenario.script.map((line, index) => {
                      const isCurrent = index === activeLineIdx;
                      return (
                        <li
                          key={`${line.speakerId}-${index}`}
                          onClick={() => setActiveLineIdx(index)}
                          className={[
                            "rounded-xl border p-3.5 transition-colors cursor-pointer",
                            isCurrent
                              ? "border-indigo-500 bg-indigo-100/60"
                              : "border-border bg-surface-sunken hover:bg-surface-sunken/70",
                          ].join(" ")}
                        >
                          <p className="text-xs font-mono font-semibold text-indigo-700">
                            {speakerById.get(line.speakerId) ?? line.speakerId}
                          </p>
                          <p className="tonal-text mt-1 text-lg sm:text-xl font-medium text-text-primary">
                            {line.text}
                          </p>
                          <p className="mt-1 text-xs sm:text-sm text-text-muted">
                            {line.translation}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 lg:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cultural Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {scenario.culturalNote}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Words in This Scene</CardTitle>
                  <span className="font-mono text-xs text-text-muted">
                    NFC Grounded
                  </span>
                </CardHeader>
                <CardContent className="space-y-3">
                  {glossary.map((entry) => (
                    <div
                      key={entry.entryId}
                      className="rounded-xl border border-border bg-surface-sunken p-3 space-y-2"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="tonal-text text-base font-semibold text-text-primary">
                          {entry.headword}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {entry.glossEn}
                        </span>
                      </div>
                      {entry.standardForm &&
                      entry.standardForm !== entry.headword ? (
                        <p className="tonal-text text-xs text-text-muted">
                          Standard form: {entry.standardForm}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-1.5">
                        {entry.syllables.map((syl, idx) => (
                          <ToneChip
                            key={`${entry.entryId}-syl-${idx}`}
                            syllable={syl}
                            tone={entry.tonePattern[idx] ?? "M"}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel tabId="vocab" activeTab={activeTab}>
          <div className="mx-auto max-w-3xl space-y-4">
            {loadingDrill || !quizOutcome ? (
              <Card className="p-8 text-center">
                <p className="font-mono text-sm text-text-secondary">
                  Generating structured vocabulary quiz via Firebase AI Logic...
                </p>
              </Card>
            ) : (
              <QuizCard
                quiz={quizOutcome.data}
                source={quizOutcome.source}
                latencyMs={quizOutcome.latencyMs}
                onRegenerate={() => void prepareQuiz()}
                onComplete={(accuracy, source) =>
                  void handleDrillCompletion("vocab", accuracy, source)
                }
              />
            )}
          </div>
        </TabPanel>

        <TabPanel tabId="tone" activeTab={activeTab}>
          <div className="mx-auto max-w-3xl space-y-4">
            {loadingDrill || !toneDrillOutcome ? (
              <Card className="p-8 text-center">
                <p className="font-mono text-sm text-text-secondary">
                  Preparing NFC tonal minimal-pair drill...
                </p>
              </Card>
            ) : (
              <>
                <ToneDrill
                  language={dialect?.languageId ?? "yo"}
                  drill={toneDrillOutcome.data}
                  glossary={glossary}
                  source={toneDrillOutcome.source}
                  latencyMs={toneDrillOutcome.latencyMs}
                  onComplete={(accuracy, grades, source) =>
                    void handleDrillCompletion("tone", accuracy, source, grades)
                  }
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void prepareToneDrill()}
                  >
                    Regenerate drill items
                  </Button>
                </div>
              </>
            )}
          </div>
        </TabPanel>
      </div>

      <StampUnlockedModal
        open={unlockedStamp !== null}
        onClose={() => setUnlockedStamp(null)}
        stamp={unlockedStamp}
        dialect={dialect}
      />
    </AppShell>
  );
}
