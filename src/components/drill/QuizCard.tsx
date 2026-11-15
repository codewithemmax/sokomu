"use client";

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
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-edge-600">
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
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-mono font-semibold text-text-muted">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span
          className={[
            "rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold",
            source === "ON_DEVICE"
              ? "bg-edge-100 text-edge-600"
              : source === "IN_CLOUD"
                ? "bg-cloud-100 text-cloud-600"
                : "bg-cached-100 text-cached-600",
          ].join(" ")}
        >
          {source} &middot; {latencyMs} ms
        </span>
      </div>

      <h3 className="tonal-text text-lg sm:text-xl font-semibold text-text-primary">
        {currentQuestion.prompt}
      </h3>

      <div className="grid grid-cols-1 gap-3">
        {currentQuestion.options.map((optionText, idx) => {
          const isChosen = selectedIndex === idx;
          const isCorrectOption = idx === currentQuestion.correctIndex;
          const showResult = selectedIndex !== null;

          let stateClasses =
            "border-border bg-surface-sunken hover:bg-indigo-100/40 text-text-primary";
          if (showResult) {
            if (isCorrectOption) {
              stateClasses =
                "border-2 border-success-600 bg-edge-100/60 text-text-primary font-semibold";
            } else if (isChosen) {
              stateClasses =
                "border-2 border-danger-600 bg-offline-100/60 text-danger-600";
            } else {
              stateClasses = "border-border bg-surface-sunken opacity-60";
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
                "tonal-text flex min-h-[56px] w-full items-center justify-between rounded-[10px] border px-4 py-3 text-left text-base transition-all",
                "focus-visible:outline-2 focus-visible:outline-indigo-500",
                stateClasses,
                showResult ? "cursor-default" : "cursor-pointer",
              ].join(" ")}
            >
              <span>{optionText}</span>
              <span className="font-mono text-xs text-text-muted">
                {String.fromCharCode(65 + idx)}
              </span>
            </button>
          );
        })}
      </div>

      {selectedIndex !== null ? (
        <div className="space-y-3 rounded-xl border border-border bg-surface-sunken p-4">
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
