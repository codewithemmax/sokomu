"use client";

import { Cloud, Cpu, Database, type LucideIcon } from "lucide-react";
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
        "bg-edge-100 text-text-primary border border-transparent",
      dotClass: "text-edge-600",
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
        "bg-cloud-100 text-text-primary border border-transparent",
      dotClass: "text-cloud-600",
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
        "bg-cached-100 text-text-primary border border-transparent",
      dotClass: "text-cached-600",
    };
  }

  const model = modelLabel ?? "Gemini Nano";
  return {
    badgeLabel: "ON_DEVICE . READY",
    shortMobileLabel: "READY",
    modelDisplay: model,
    ariaLabel: `Hybrid AI ready (${model})`,
    containerClass:
      "bg-surface-base text-text-secondary border border-border",
    dotClass: "text-edge-600",
  };
}

/** Sentence-case visible labels and icons; meta labels stay for telemetry. */
const PILL_DISPLAY: Record<
  PillSourceState,
  { label: string; short: string; icon: LucideIcon }
> = {
  ON_DEVICE: { label: "On-device", short: "Device", icon: Cpu },
  IN_CLOUD: { label: "Cloud", short: "Cloud", icon: Cloud },
  CACHED_FALLBACK: { label: "Offline, cached", short: "Cached", icon: Database },
  IDLE: { label: "On-device ready", short: "Ready", icon: Cpu },
};

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

  const display = PILL_DISPLAY[effectiveSource] ?? PILL_DISPLAY.IDLE;
  const SourceIcon = display.icon;

  return (
    <button
      type="button"
      role="status"
      aria-live="polite"
      aria-label={meta.ariaLabel}
      onClick={onOpenDetails}
      className={[
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors duration-200 hover:brightness-[0.97]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus cursor-pointer",
        meta.containerClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {streaming ? (
        <span aria-hidden="true" className="tone-loader">
          <i />
          <i />
          <i />
        </span>
      ) : (
        <SourceIcon
          aria-hidden="true"
          size={16}
          strokeWidth={1.5}
          className={`shrink-0 ${meta.dotClass}`}
        />
      )}
      <span className="sm:hidden">{display.short}</span>
      <span className="hidden sm:inline">{display.label}</span>
      <span className="hidden text-xs text-text-secondary md:inline">
        {meta.modelDisplay}
      </span>
      {typeof effectiveLatency === "number" && effectiveLatency > 0 ? (
        <span className="hidden tabular-nums text-xs text-text-secondary sm:inline">
          {Math.round(effectiveLatency)} ms
        </span>
      ) : null}
    </button>
  );
}
