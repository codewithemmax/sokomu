"use client";

import { Drawer } from "@/components/ui/Drawer";
import { useDataSaved } from "@/hooks/useDataSaved";
import { useInferenceTelemetry } from "@/hooks/useInferenceTelemetry";
import type { InferenceFeature } from "@/types/telemetry";

export interface TelemetryDrawerProps {
  open: boolean;
  onClose: () => void;
}

const FEATURE_LABELS: Record<InferenceFeature, string> = {
  vocab_quiz: "Vocabulary quiz",
  tone_drill: "Tonal drill",
  tone_grading: "Tone grading",
  trainer_assist: "Trainer assist",
  tts_dialogue: "Two-speaker TTS",
  cached_replay: "Offline audio replay",
};

export function formatFeatureLabel(feature: InferenceFeature): string {
  return FEATURE_LABELS[feature] ?? feature;
}

export function TelemetryDrawer({ open, onClose }: TelemetryDrawerProps) {
  const { recentEvents, summary } = useInferenceTelemetry();
  const dataSaved = useDataSaved();

  const totalCalls =
    summary.onDeviceCount + summary.cloudCount + summary.cachedReplayCount;
  const onDeviceShare =
    totalCalls > 0
      ? Math.round(
          ((summary.onDeviceCount + summary.cachedReplayCount) / totalCalls) *
            100,
        )
      : 100;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Hybrid AI Telemetry"
      subtitle="Bound directly to Firebase AI Logic SDK response.inferenceSource"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-surface-base p-3">
            <p className="text-xs font-medium text-text-muted">ON_DEVICE</p>
            <p className="mt-1 font-display text-lg font-extrabold tabular-nums text-edge-600">
              {summary.onDeviceCount}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-base p-3">
            <p className="text-xs font-medium text-text-muted">IN_CLOUD</p>
            <p className="mt-1 font-display text-lg font-extrabold tabular-nums text-cloud-600">
              {summary.cloudCount}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-base p-3">
            <p className="text-xs font-medium text-text-muted">
              Local / Offline
            </p>
            <p className="mt-1 font-display text-lg font-extrabold tabular-nums text-indigo-700">
              {onDeviceShare}%
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gold-600/30 bg-gold-100/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-primary">
              Estimated Mobile Data Saved
            </span>
            <span className="text-sm font-semibold tabular-nums text-text-secondary">
              {dataSaved.formattedMb} ({dataSaved.formattedNaira})
            </span>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Calculated at {dataSaved.cloudDrillKb} KB per on-device drill plus
            cached 24 kHz PCM replays ({"\u20A6"}{dataSaved.nairaPerMb.toFixed(2)}/MB).
          </p>
        </div>

        <div>
          <h3 className="mb-2.5 text-xs font-semibold text-text-muted">
            Last {recentEvents.length} Inference Events
          </h3>
          {recentEvents.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-text-muted">
              No inference events recorded yet in this session. Start a drill or
              dialogue to see live telemetry.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface-raised">
              {recentEvents.map((event, idx) => {
                const timeStr = new Date(event.ts).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });
                const kbSaved = Math.round(event.bytesSaved / 1024);
                return (
                  <li
                    key={event.id ?? `${event.ts}-${idx}`}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {formatFeatureLabel(event.feature)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {timeStr}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          event.source === "ON_DEVICE"
                            ? "bg-edge-100 text-edge-600"
                            : event.source === "IN_CLOUD"
                              ? "bg-cloud-100 text-cloud-600"
                              : "bg-cached-100 text-cached-600",
                        ].join(" ")}
                      >
                        {event.source}
                      </span>
                      <span className="w-14 tabular-nums text-text-secondary">
                        {event.latencyMs} ms
                      </span>
                      {kbSaved > 0 ? (
                        <span className="tabular-nums text-gold-600">
                          +{kbSaved} KB
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Drawer>
  );
}
