import type { Tone } from "@/types/domain";

export interface PitchRuleProps {
  /** Tone sequence to draw, e.g. ["M", "L"] for ọkọ̀. */
  pattern?: readonly Tone[];
  className?: string;
}

const LEVEL: Record<Tone, number> = { H: 2, M: 8, L: 14 };
const STEP = 22;
const RISE = 6;

/**
 * Decorative pitch contour drawn as a printed rule: flat runs at each tone
 * level joined by short slopes. Signature motif for headings and dividers.
 */
export function PitchRule({
  pattern = ["M", "H", "L", "M"],
  className = "",
}: PitchRuleProps) {
  const width = pattern.length * STEP + (pattern.length - 1) * RISE;
  let x = 0;
  const points: string[] = [];
  pattern.forEach((tone, index) => {
    const y = LEVEL[tone];
    points.push(`${index === 0 ? "M" : "L"}${x} ${y}`);
    x += STEP;
    points.push(`L${x} ${y}`);
    x += RISE;
  });

  return (
    <svg
      aria-hidden="true"
      viewBox={`-2 0 ${width + 4} 16`}
      width={width + 4}
      height={16}
      className={`overflow-visible ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d={points.join(" ")} />
    </svg>
  );
}
