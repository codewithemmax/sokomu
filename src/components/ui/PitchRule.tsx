import type { Tone } from "@/types/domain";

export interface PitchRuleProps {
  /** Tone sequence to draw, e.g. ["M", "L"] for ọkọ̀. */
  pattern?: readonly Tone[];
  /** Segment length per syllable in px. */
  step?: number;
  /** Draw every segment in currentColor instead of the tone colours. */
  monochrome?: boolean;
  /** Optional faint three-line staff behind the contour. */
  staff?: boolean;
  className?: string;
}

const LEVEL: Record<Tone, number> = { H: 4, M: 14, L: 24 };
const TONE_STROKE: Record<Tone, string> = {
  H: "var(--color-tone-high)",
  M: "var(--color-tone-mid)",
  L: "var(--color-tone-low)",
};
const GAP = 10;
const HEIGHT = 28;

/**
 * The tone contour: one rounded segment per syllable, placed on the high,
 * mid or low line and coloured by tone. Sokomu's only decorative motif
 * (drill progress, waveform baseline, landing hero). Decorative only; the
 * tone is always also given as text nearby.
 */
export function PitchRule({
  pattern = ["M", "H", "L", "M"],
  step = 22,
  monochrome = false,
  staff = false,
  className = "",
}: PitchRuleProps) {
  const width = pattern.length * step + (pattern.length - 1) * GAP;

  return (
    <svg
      aria-hidden="true"
      viewBox={`-3 0 ${width + 6} ${HEIGHT}`}
      width={width + 6}
      height={HEIGHT}
      className={`max-w-full overflow-visible ${className}`}
      fill="none"
      strokeLinecap="round"
    >
      {staff ? (
        <path
          d={`M-3 ${LEVEL.H}H${width + 3}M-3 ${LEVEL.M}H${width + 3}M-3 ${LEVEL.L}H${width + 3}`}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
      ) : null}
      {pattern.map((tone, index) => {
        const x = index * (step + GAP);
        return (
          <path
            key={`${tone}-${index}`}
            d={`M${x} ${LEVEL[tone]}H${x + step}`}
            stroke={monochrome ? "currentColor" : TONE_STROKE[tone]}
            strokeWidth={4}
          />
        );
      })}
    </svg>
  );
}
