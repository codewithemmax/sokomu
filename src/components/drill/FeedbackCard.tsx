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
        "space-y-4 border-l-4",
        grading.isCorrect ? "border-l-success-600" : "border-l-danger-600",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={[
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              grading.isCorrect
                ? "bg-edge-100 text-edge-600"
                : "bg-offline-100 text-danger-600",
            ].join(" ")}
          >
            {grading.isCorrect ? "Correct tones" : "Tone mismatch"}
          </span>
          <span className="font-mono text-xs text-text-muted">
            Score: {Math.round(grading.score * 100)}%
          </span>
        </div>

        <span className="font-mono text-[11px] text-text-muted">
          {source}
          {typeof latencyMs === "number" ? ` \u00B7 ${latencyMs} ms` : ""}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {grading.syllables.map((syl, index) => (
          <div
            key={`${syl.expected}-${index}`}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-sunken px-2.5 py-1.5 text-xs"
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
