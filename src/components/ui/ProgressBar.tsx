export type ProgressBarTone =
  | "indigo"
  | "gold"
  | "edge"
  | "tone-high"
  | "tone-mid"
  | "tone-low";

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValueLabel?: boolean;
  tone?: ProgressBarTone;
  size?: "sm" | "md";
  className?: string;
}

const FILL_CLASSES: Record<ProgressBarTone, string> = {
  indigo: "bg-indigo-500",
  gold: "bg-gold-600",
  edge: "bg-edge-600",
  "tone-high": "bg-tone-high",
  "tone-mid": "bg-tone-mid",
  "tone-low": "bg-tone-low",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValueLabel = false,
  tone = "indigo",
  size = "md",
  className = "",
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(safeMax, Math.max(0, value));
  const percentage = Math.round((clamped / safeMax) * 100);
  const heightClass = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={`w-full ${className}`}>
      {(label || showValueLabel) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          {label ? (
            <span className="font-medium text-text-secondary">{label}</span>
          ) : (
            <span />
          )}
          {showValueLabel ? (
            <span className="font-mono tabular-nums text-text-primary">
              {percentage}%
            </span>
          ) : null}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label ?? "Progress"}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`w-full overflow-hidden rounded-full bg-border/60 ${heightClass}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-200 ${FILL_CLASSES[tone]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
