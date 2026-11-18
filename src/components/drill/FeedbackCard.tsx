import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { InferenceSourceLabel, TonalGrading } from "@/types/ai";
import { ToneChip } from "./ToneChip";

export interface FeedbackCardProps {
  grading: TonalGrading;
  expectedHeadword: string;
  expectedMeaningEn: string;
  source: InferenceSourceLabel;
  latencyMs?: number;
}

export function FeedbackCard({
  grading,
  expectedHeadword,
  expectedMeaningEn,
  source,
  latencyMs,
}: FeedbackCardProps) {
  return (
    <Card
      className={[
        "space-y-4",
        grading.isCorrect ? "border-success-600!" : "border-danger-600!",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={[
              "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium",
              grading.isCorrect
                ? "border border-success-600 bg-surface-raised text-success-600"
                : "bg-danger-100 text-danger-600",
            ].join(" ")}
          >
            {grading.isCorrect ? (
              <Check aria-hidden="true" size={16} strokeWidth={2} />
            ) : (
              <X aria-hidden="true" size={16} strokeWidth={2} />
            )}
            {grading.isCorrect ? "Correct tones" : "Tone mismatch"}
          </span>
          <span className="text-xs text-text-muted">
            Score: {Math.round(grading.score * 100)}%
          </span>
        </div>

        <span className="text-xs text-text-muted">
          {source}
          {typeof latencyMs === "number" ? ` \u00B7 ${latencyMs} ms` : ""}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {grading.syllables.map((syl, index) => (
          <div
            key={`${syl.expected}-${index}`}
            className="flex items-center gap-1.5 rounded-[var(--radius-button)] bg-surface-base px-3 py-2 text-sm"
          >
            <ToneChip
              syllable={syl.expected}
              tone={syl.expectedTone}
              correct={syl.correct}
            />
            {!syl.correct ? (
              <span className="text-danger-600">
                (you wrote{" "}
                <strong className="tonal-text">{syl.received || "\u2205"}</strong>{" "}
                {syl.receivedTone})
              </span>
            ) : (
              <span className="text-success-600 font-medium">correct</span>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-1 text-sm">
        <p className="font-medium text-text-primary">{grading.feedback}</p>
        {!grading.isCorrect && grading.producedMeaningEn ? (
          <p className="text-xs text-text-secondary">
            Expected <strong className="tonal-text">{expectedHeadword}</strong>{" "}
            ({expectedMeaningEn}); your tones produced:{" "}
            <strong>{grading.producedMeaningEn}</strong>.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
