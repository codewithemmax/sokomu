"use client";

import { useInferenceTelemetry } from "@/hooks/useInferenceTelemetry";
import { useRemoteConfigString } from "@/hooks/useRemoteConfigValue";
import type { InferenceSourceLabel } from "@/types/ai";

export type PillSourceState = InferenceSourceLabel | "IDLE";

export interface InferenceSourcePillProps {
  source?: PillSourceState;
  modelLabel?: string;
  latencyMs?: number;
  streaming?: boolean;
  onOpenDetails?: () => void;
  className?: string;
}

export interface InferencePillMeta {
  badgeLabel: string;
  shortMobileLabel: string;
  modelDisplay: string;
  ariaLabel: string;
  containerClass: string;
  dotClass: string;
}

export function resolveInferencePillMeta(
  source: PillSourceState,
  modelLabel?: string,
  latencyMs?: number,
): InferencePillMeta {
  const latencySuffix =
    typeof latencyMs === "number" && latencyMs > 0
      ? ` in ${Math.round(latencyMs)} milliseconds`
      : "";

  if (source === "ON_DEVICE") {
    const model = modelLabel ?? "Gemini Nano";
    return {
      badgeLabel: "ON_DEVICE",
      shortMobileLabel: "DEVICE",
      modelDisplay: model,
      ariaLabel: `Last response generated on device by ${model}${latencySuffix}`,
      containerClass:
        "bg-edge-100 text-edge-600 border border-edge-600/30",
      dotClass: "bg-edge-600",
    };
  }

  if (source === "IN_CLOUD") {
    const model = modelLabel ?? "Gemini Cloud";
    return {
      badgeLabel: "IN_CLOUD",
      shortMobileLabel: "CLOUD",
      modelDisplay: model,
      ariaLabel: `Last response generated in cloud by ${model}${latencySuffix}`,
      containerClass:
        "bg-cloud-100 text-cloud-600 border border-cloud-600/30",
      dotClass: "bg-cloud-600",
    };
  }

  if (source === "CACHED_FALLBACK") {
    const model = modelLabel ?? "Local cache";
    return {
      badgeLabel: "OFFLINE . CACHED",
      shortMobileLabel: "CACHED",
      modelDisplay: model,
      ariaLabel: `Last response served offline from local cache${latencySuffix}`,
      containerClass:
        "bg-cached-100 text-cached-600 border border-cached-600/30",
      dotClass: "bg-cached-600",
    };
  }

  const model = modelLabel ?? "Gemini Nano";
  return {
    badgeLabel: "ON_DEVICE . READY",
    shortMobileLabel: "READY",
    modelDisplay: model,
    ariaLabel: `Hybrid AI ready (${model})`,
    containerClass:
      "bg-surface-raised text-text-secondary border border-border",
    dotClass: "bg-edge-600",
  };
}

export function InferenceSourcePill({
  source,
  modelLabel,
  latencyMs,
  streaming = false,
  onOpenDetails,
  className = "",
}: InferenceSourcePillProps) {
  const { latestEvent } = useInferenceTelemetry();
  const cloudTextModel = useRemoteConfigString("ai_cloud_text_model");

  const effectiveSource: PillSourceState =
    source ?? latestEvent?.source ?? "IDLE";
  const effectiveLatency = latencyMs ?? latestEvent?.latencyMs;
  const defaultModel =
    effectiveSource === "IN_CLOUD"
      ? cloudTextModel
      : effectiveSource === "CACHED_FALLBACK"
        ? "IndexedDB"
        : "Gemini Nano";

  const meta = resolveInferencePillMeta(
    effectiveSource,
    modelLabel ?? defaultModel,
    effectiveLatency,
  );

  return (
    <button
      type="button"
      role="status"
      aria-live="polite"
      aria-label={meta.ariaLabel}
      onClick={onOpenDetails}
      className={[
        "inline-flex h-7 lg:h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 cursor-pointer",
        meta.containerClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "inline-block size-2 rounded-full",
          meta.dotClass,
          streaming ? "animate-ping" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      />
      <span className="font-mono font-semibold tracking-tight sm:hidden">
        {meta.shortMobileLabel}
      </span>
      <span className="hidden font-mono font-semibold tracking-tight sm:inline">
        {meta.badgeLabel}
      </span>
      <span className="hidden text-[11px] opacity-85 md:inline">
        {meta.modelDisplay}
      </span>
      {typeof effectiveLatency === "number" && effectiveLatency > 0 ? (
        <span className="font-mono tabular-nums text-[11px] opacity-80">
          {Math.round(effectiveLatency)} ms
        </span>
      ) : null}
    </button>
  );
}
