"use client";

import { Tooltip } from "@/components/ui/Tooltip";
import { useDataSaved } from "@/hooks/useDataSaved";

export interface DataSavedCounterProps {
  bytesSaved?: number;
  nairaSaved?: number;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
  tooltipPlacement?: "top" | "bottom";
}

export interface FormattedDataSavedDisplay {
  mbLabel: string;
  nairaLabel: string;
}

export function formatDataSavedDisplay(
  bytesSaved: number,
  nairaSaved: number,
): FormattedDataSavedDisplay {
  const safeBytes = Math.max(0, bytesSaved);
  const mb = safeBytes / 1_048_576;
  const mbLabel =
    mb >= 100 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;

  const safeNaira = Math.max(0, nairaSaved);
  let nairaLabel: string;
  try {
    nairaLabel = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeNaira);
  } catch {
    nairaLabel = `\u20A6${safeNaira.toFixed(2)}`;
  }

  return { mbLabel, nairaLabel };
}

export function DataSavedCounter({
  bytesSaved,
  nairaSaved,
  compact = false,
  onClick,
  className = "",
  tooltipPlacement = "top",
}: DataSavedCounterProps) {
  const hookData = useDataSaved();
  const effectiveBytes = bytesSaved ?? hookData.bytesSaved;
  const effectiveNaira = nairaSaved ?? hookData.nairaSaved;
  const { mbLabel, nairaLabel } = formatDataSavedDisplay(
    effectiveBytes,
    effectiveNaira,
  );

  const tooltipCopy = `Estimated data you would have used if this ran in the cloud. Rate: \u20A6${hookData.nairaPerMb.toFixed(2)} per MB (MTN 1 GB bundle).`;

  return (
    <Tooltip content={tooltipCopy} placement={tooltipPlacement}>
      <button
        type="button"
        onClick={onClick}
        aria-live="polite"
        aria-label={`Mobile data saved: ${mbLabel}, approximately ${nairaLabel}`}
        className={[
          "inline-flex flex-col items-end justify-center gap-0.5 rounded-[10px] px-2.5 py-1 text-right leading-none transition-colors",
          "hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-indigo-500 cursor-pointer",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="flex items-center gap-1.5">
          {!compact ? (
            <span className="hidden text-[11px] font-medium text-text-muted lg:inline">
              Data saved
            </span>
          ) : null}
          <span className="font-mono text-xs sm:text-sm font-semibold tabular-nums text-text-primary">
            {mbLabel}
          </span>
        </div>
        <span className="font-mono text-[11px] font-medium tabular-nums text-gold-600">
          {nairaLabel}
        </span>
      </button>
    </Tooltip>
  );
}
