import type { Tone } from "@/types/domain";

export interface ToneChipProps {
  syllable: string;
  tone: Tone;
  correct?: boolean;
  className?: string;
}

const TONE_STYLES: Record<
  Tone,
  { border: string; text: string; label: string }
> = {
  H: {
    border: "border-b-[3px] border-b-tone-high",
    text: "text-tone-high",
    label: "H (High)",
  },
  M: {
    border: "border-b-[3px] border-b-tone-mid",
    text: "text-tone-mid",
    label: "M (Mid)",
  },
  L: {
    border: "border-b-[3px] border-b-tone-low",
    text: "text-tone-low",
    label: "L (Low)",
  },
};

export function ToneChip({
  syllable,
  tone,
  correct,
  className = "",
}: ToneChipProps) {
  const style = TONE_STYLES[tone] ?? TONE_STYLES.M;
  const statusBorder =
    correct === true
      ? "outline outline-1 -outline-offset-1 outline-success-600/60 bg-edge-100/50"
      : correct === false
        ? "outline outline-1 -outline-offset-1 outline-danger-600/60 bg-danger-100/60"
        : "bg-surface-sunken";

  return (
    <span
      aria-label={`Syllable ${syllable}, tone ${style.label}`}
      className={[
        "inline-flex items-baseline gap-1.5 px-2.5 py-1",
        style.border,
        statusBorder,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="tonal-text text-base font-semibold text-text-primary">
        {syllable}
      </span>
      <span className={`font-mono text-[11px] font-bold ${style.text}`}>
        {tone}
      </span>
    </span>
  );
}
