import type { Tone } from "@/types/domain";
import { ToneStaff } from "./ToneStaff";

export interface ToneChipProps {
  syllable: string;
  tone: Tone;
  correct?: boolean;
  className?: string;
}

const TONE_LABEL: Record<Tone, string> = {
  H: "H (High)",
  M: "M (Mid)",
  L: "L (Low)",
};

const TONE_TEXT: Record<Tone, string> = {
  H: "text-tone-high",
  M: "text-tone-mid",
  L: "text-tone-low",
};

export function ToneChip({
  syllable,
  tone,
  correct,
  className = "",
}: ToneChipProps) {
  const safeTone: Tone = TONE_LABEL[tone] ? tone : "M";
  const statusClass =
    correct === true
      ? "border-2 border-success-600 bg-surface-raised"
      : correct === false
        ? "border-2 border-danger-600 bg-danger-100"
        : "border border-border bg-surface-raised";

  return (
    <span
      aria-label={`Syllable ${syllable}, tone ${TONE_LABEL[safeTone]}`}
      className={[
        "inline-flex min-h-9 items-center gap-2 rounded-full py-1 pl-2.5 pr-3",
        statusClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ToneStaff tone={safeTone} />
      <span className="tonal-text font-display text-base font-bold text-text-primary">
        {syllable}
      </span>
      <span className={`text-xs font-semibold ${TONE_TEXT[safeTone]}`}>
        {safeTone}
      </span>
    </span>
  );
}
