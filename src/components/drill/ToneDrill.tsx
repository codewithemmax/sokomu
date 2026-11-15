"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-edge-600">
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
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-mono font-semibold text-text-muted">
            Tone Item {currentIndex + 1} of {items.length}
          </span>
          <span className="font-mono text-[11px] text-edge-600">
            {source} &middot; {latencyMs} ms
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-semibold text-text-primary">
            {currentItem.instruction}
          </h3>
          <p className="text-sm text-text-secondary">
            Meaning: <strong>&ldquo;{currentItem.meaningEn}&rdquo;</strong>{" "}
            &middot; {currentItem.syllableCount} syllable
            {currentItem.syllableCount === 1 ? "" : "s"} &middot; Pattern:{" "}
            <span className="font-mono font-semibold text-indigo-700">
              {currentItem.expectedTonePattern.join(" \u00B7 ")}
            </span>
          </p>
          {currentItem.hint ? (
            <p className="text-xs text-text-muted">Hint: {currentItem.hint}</p>
          ) : null}
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
            className="tonal-text h-14 w-full rounded-[10px] border border-border bg-surface-sunken px-4 text-[1.75rem] sm:text-[2rem] font-medium text-text-primary focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <DiacriticPicker
          language={language}
          value={answer}
          onChange={setAnswer}
          targetRef={inputRef}
        />

        <div className="flex items-center justify-between gap-3">
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
