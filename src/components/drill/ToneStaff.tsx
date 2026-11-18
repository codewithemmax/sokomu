import type { Tone } from "@/types/domain";

const LEVEL_Y: Record<Tone, number> = { H: 3, M: 8, L: 13 };
const LEVEL_STROKE: Record<Tone, string> = {
  H: "var(--color-tone-high)",
  M: "var(--color-tone-mid)",
  L: "var(--color-tone-low)",
};

export interface ToneStaffProps {
  tone: Tone;
  /** Draw on an indigo or tone-coloured fill (selected state). */
  inverted?: boolean;
  /** Greyed out (disabled state). */
  muted?: boolean;
  className?: string;
}

/**
 * Three-line staff with the tone's level drawn heavy: the tone-contour motif
 * at chip size. Decorative; the tone is always also given as text.
 */
export function ToneStaff({
  tone,
  inverted = false,
  muted = false,
  className = "",
}: ToneStaffProps) {
  const y = LEVEL_Y[tone] ?? LEVEL_Y.M;
  const levelStroke = muted
    ? "var(--color-text-muted)"
    : inverted
      ? "var(--color-on-indigo)"
      : LEVEL_STROKE[tone];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 16"
      width={24}
      height={16}
      fill="none"
      className={`shrink-0 ${className}`}
    >
      <path
        d="M2 3h20M2 8h20M2 13h20"
        stroke={inverted ? "rgba(241,236,224,0.45)" : "var(--color-border)"}
        strokeWidth={1}
      />
      <path
        d={`M3 ${y}h18`}
        stroke={levelStroke}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}
