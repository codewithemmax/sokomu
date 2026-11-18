"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PitchRule } from "@/components/ui/PitchRule";
import { useHybridModel } from "@/hooks/useHybridModel";
import type {
  InferenceSourceLabel,
  SyllableGrade,
  TonalDrill as TonalDrillModel,
  TonalGrading,
} from "@/types/ai";
import type { GlossaryEntry, LanguageId } from "@/types/domain";
import { DiacriticPicker } from "./DiacriticPicker";
import { FeedbackCard } from "./FeedbackCard";

export interface ToneDrillProps {
  language: LanguageId;
  drill: TonalDrillModel;
  glossary: readonly GlossaryEntry[];
  source: InferenceSourceLabel;
  latencyMs: number;
  onComplete: (
    accuracy: number,
    syllableGrades: readonly SyllableGrade[],
    source: InferenceSourceLabel,
  ) => void;
}

export function ToneDrill({
  language,
  drill,
  glossary,
  source,
  latencyMs,
  onComplete,
}: ToneDrillProps) {
  const { gradeToneAttempt } = useHybridModel();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [gradingState, setGradingState] = useState<{
    grading: TonalGrading;
    source: InferenceSourceLabel;
    latencyMs: number;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [collectedGrades, setCollectedGrades] = useState<SyllableGrade[]>([]);
  const [finished, setFinished] = useState(false);

  const items = drill.items;
  const currentItem = items[currentIndex];
  const entryById = new Map(glossary.map((e) => [e.entryId, e]));
  const currentEntry = currentItem
    ? (entryById.get(currentItem.glossaryEntryId) ?? glossary[0])
    : undefined;

  if (!currentItem || !currentEntry) {
    return null;
  }

  const handleCheckAnswer = async () => {
    if (!answer.trim() || checking) return;
    setChecking(true);
    try {
      const outcome = await gradeToneAttempt({
        entry: currentEntry,
        learnerInput: answer,
        dialectGlossary: glossary,
      });
      setGradingState({
        grading: outcome.data,
        source: outcome.source,
        latencyMs: outcome.latencyMs,
      });
      setTotalScore((prev) => prev + outcome.data.score);
      setCollectedGrades((prev) => [...prev, ...outcome.data.syllables]);
    } finally {
      setChecking(false);
    }
  };

  const handleNextItem = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= items.length) {
      setFinished(true);
      const avgAccuracy = items.length > 0 ? totalScore / items.length : 0;
      onComplete(
        avgAccuracy,
        collectedGrades,
        gradingState?.source ?? source,
      );
      return;
    }
    setAnswer("");
    setGradingState(null);
    setCurrentIndex(nextIdx);
  };

  if (finished) {
    const avgPct = Math.round((totalScore / items.length) * 100);
    return (
      <Card className="space-y-4 text-center">
        <p className="text-xs font-semibold text-edge-600">
          Tonal Drill Complete
        </p>
        <h3 className="font-display text-2xl font-semibold text-text-primary">
          Tonal Accuracy: {avgPct}%
        </h3>
        <p className="text-sm text-text-secondary">
          Your High (H), Mid (M), and Low (L) syllable statistics have been
          recorded locally and queued for sync.
        </p>
        <div>
          <Button
            variant="secondary"
            onClick={() => {
              setCurrentIndex(0);
              setAnswer("");
              setGradingState(null);
              setTotalScore(0);
              setCollectedGrades([]);
              setFinished(false);
            }}
          >
            Practise tone drill again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-5">
        <div className="space-y-5 rounded-[var(--radius-card)] bg-indigo-900 p-5 sm:p-8 text-on-indigo">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-indigo-100">
              Tone Item{" "}
              <span className="font-display font-extrabold tabular-nums text-on-indigo">
                {currentIndex + 1}
              </span>{" "}
              of {items.length}
            </span>
            <span className="inline-flex h-7 items-center rounded-full bg-on-indigo/10 px-2.5 text-xs font-medium text-on-indigo">
              {source} &middot; {latencyMs} ms
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-on-indigo">
              {currentItem.instruction}
            </h3>
            <p className="text-sm text-indigo-100">
              Meaning: <strong className="text-on-indigo">&ldquo;{currentItem.meaningEn}&rdquo;</strong>{" "}
              &middot; {currentItem.syllableCount} syllable
              {currentItem.syllableCount === 1 ? "" : "s"} &middot; Pattern:{" "}
              <span className="font-semibold text-gold-400">
                {currentItem.expectedTonePattern.join(" \u00B7 ")}
              </span>
            </p>
            <PitchRule
              pattern={currentItem.expectedTonePattern}
              monochrome
              staff
              step={32}
              className="text-gold-400"
            />
            {currentItem.hint ? (
              <p className="text-sm text-indigo-100">Hint: {currentItem.hint}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="tone-drill-input" className="sr-only">
            Write the word with tone marks
          </label>
          <input
            ref={inputRef}
            id="tone-drill-input"
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.normalize("NFC"))}
            disabled={gradingState !== null}
            placeholder="Type with diacritic picker below..."
            className="tonal-text h-16 w-full rounded-[var(--radius-input)] border border-text-muted bg-surface-raised px-4 font-display text-xl sm:text-2xl font-bold text-text-primary placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-text-muted focus:border-focus focus:outline-2 focus:outline-offset-2 focus:outline-focus disabled:border-border disabled:bg-surface-sunken"
          />
        </div>

        <DiacriticPicker
          language={language}
          value={answer}
          onChange={setAnswer}
          targetRef={inputRef}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          {gradingState === null ? (
            <>
              <Button
                variant="primary"
                loading={checking}
                disabled={!answer.trim()}
                onClick={() => void handleCheckAnswer()}
              >
                Check answer
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setAnswer(currentEntry.headword);
                }}
              >
                Reveal target word
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={handleNextItem}>
              {currentIndex + 1 >= items.length
                ? "Finish tone drill"
                : "Next item \u2192"}
            </Button>
          )}
        </div>
      </Card>

      {gradingState ? (
        <FeedbackCard
          grading={gradingState.grading}
          expectedHeadword={currentEntry.headword}
          expectedMeaningEn={currentEntry.glossEn}
          source={gradingState.source}
          latencyMs={gradingState.latencyMs}
        />
      ) : null}
    </div>
  );
}
