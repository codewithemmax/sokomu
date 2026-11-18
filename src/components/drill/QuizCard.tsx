"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { InferenceSourceLabel, VocabularyQuiz } from "@/types/ai";

export interface QuizCardProps {
  quiz: VocabularyQuiz;
  source: InferenceSourceLabel;
  latencyMs: number;
  onComplete: (accuracy: number, source: InferenceSourceLabel) => void;
  onRegenerate?: () => void;
}

export function QuizCard({
  quiz,
  source,
  latencyMs,
  onComplete,
  onRegenerate,
}: QuizCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const questions = quiz.questions;
  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return null;
  }

  const handleSelectOption = (optionIndex: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(optionIndex);
    if (optionIndex === currentQuestion.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= questions.length) {
      setFinished(true);
      const accuracy = questions.length > 0 ? correctCount / questions.length : 0;
      onComplete(accuracy, source);
      return;
    }
    setSelectedIndex(null);
    setCurrentIndex(nextIdx);
  };

  if (finished) {
    const accuracyPct = Math.round((correctCount / questions.length) * 100);
    return (
      <Card className="space-y-4 text-center">
        <p className="text-xs font-semibold text-edge-600">
          Vocabulary Drill Complete &middot; {source}
        </p>
        <h3 className="font-display text-2xl font-semibold text-text-primary">
          You scored {correctCount} of {questions.length} ({accuracyPct}%)
        </h3>
        <p className="text-sm text-text-secondary">
          {accuracyPct >= 80
            ? "Excellent regional vocabulary mastery! You have met the 80% cultural stamp threshold."
            : "Keep practising the regional lexical forms in this scene to reach 80% accuracy."}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={() => {
              setCurrentIndex(0);
              setSelectedIndex(null);
              setCorrectCount(0);
              setFinished(false);
              onRegenerate?.();
            }}
          >
            Practise again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-text-secondary">
          Question{" "}
          <span className="font-display font-extrabold tabular-nums text-text-primary">
            {currentIndex + 1}
          </span>{" "}
          of {questions.length}
        </span>
        <span
          className={[
            "inline-flex h-7 items-center rounded-full px-2.5 text-xs font-medium text-text-primary",
            source === "ON_DEVICE"
              ? "bg-edge-100"
              : source === "IN_CLOUD"
                ? "bg-cloud-100"
                : "bg-cached-100",
          ].join(" ")}
        >
          {source} &middot; {latencyMs} ms
        </span>
      </div>

      <h3 className="tonal-text font-display text-xl sm:text-2xl font-bold text-text-primary">
        {currentQuestion.prompt}
      </h3>

      <div className="grid grid-cols-1 gap-3">
        {currentQuestion.options.map((optionText, idx) => {
          const isChosen = selectedIndex === idx;
          const isCorrectOption = idx === currentQuestion.correctIndex;
          const showResult = selectedIndex !== null;

          let stateClasses =
            "border-border bg-surface-raised hover:bg-surface-base hover:border-text-muted text-text-primary";
          if (showResult) {
            if (isCorrectOption) {
              stateClasses =
                "border-2 border-success-600 bg-surface-raised text-success-600 font-semibold";
            } else if (isChosen) {
              stateClasses =
                "border-2 border-danger-600 bg-danger-100 text-danger-600";
            } else {
              stateClasses = "border-transparent bg-surface-base text-text-muted";
            }
          } else if (isChosen) {
            stateClasses = "border-indigo-700 bg-indigo-100 text-indigo-900";
          }

          return (
            <button
              key={`${currentQuestion.id}-opt-${idx}`}
              type="button"
              disabled={showResult}
              onClick={() => handleSelectOption(idx)}
              className={[
                "tonal-text flex min-h-[56px] w-full items-center justify-between rounded-[var(--radius-input)] border px-4 py-3 text-left text-base transition-all",
                "focus-visible:outline-2 focus-visible:outline-focus",
                stateClasses,
                showResult ? "cursor-default" : "cursor-pointer",
              ].join(" ")}
            >
              <span>{optionText}</span>
              {showResult && isCorrectOption ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold">
                  <Check aria-hidden="true" size={16} strokeWidth={2} />
                  Correct
                </span>
              ) : showResult && isChosen ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold">
                  <X aria-hidden="true" size={16} strokeWidth={2} />
                  Your answer
                </span>
              ) : (
                <span className="text-sm font-medium text-text-muted">
                  {String.fromCharCode(65 + idx)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedIndex !== null ? (
        <div className="space-y-3 rounded-xl bg-surface-base p-4">
          <p className="tonal-text text-sm text-text-secondary">
            {currentQuestion.explanation}
          </p>
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleNext}>
              {currentIndex + 1 >= questions.length
                ? "Finish quiz"
                : "Next question \u2192"}
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
