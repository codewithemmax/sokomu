"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  appendTelemetryEvent,
  getStoredTelemetrySummary,
  listRecentTelemetryEvents,
  saveTelemetrySummary,
} from "@/lib/db/telemetry-store";
import { getFirebase } from "@/lib/firebase/client";
import { rcNumber } from "@/lib/firebase/remote-config";
import { REMOTE_CONFIG_DEFAULTS } from "@/lib/firebase/remote-config-defaults";
import { syncTelemetrySummaryToFirestore } from "@/lib/progress/stamps";
import type {
  InferenceEvent,
  InferenceFeature,
  InferenceSourceLabel,
  TelemetrySummary,
} from "@/types/telemetry";

export interface ComputeBytesSavedInput {
  feature: InferenceFeature;
  source: InferenceSourceLabel;
  cloudDrillKb?: number;
  customBytesSaved?: number;
}

export function computeInferenceBytesSaved(
  input: ComputeBytesSavedInput,
): number {
  if (input.feature === "cached_replay") {
    return Math.max(0, Math.round(input.customBytesSaved ?? 0));
  }
  if (input.source === "ON_DEVICE") {
    const kb =
      typeof input.cloudDrillKb === "number" && Number.isFinite(input.cloudDrillKb)
        ? input.cloudDrillKb
        : REMOTE_CONFIG_DEFAULTS.telemetry_cloud_drill_kb;
    return Math.max(0, Math.round(kb * 1024));
  }
  // AC-C3: IN_CLOUD and CACHED_FALLBACK do not add to Data Saved.
  return 0;
}

export function applyEventToSummary(
  current: TelemetrySummary,
  event: Omit<InferenceEvent, "id">,
  nairaPerMb: number = REMOTE_CONFIG_DEFAULTS.telemetry_naira_per_mb,
): TelemetrySummary {
  const isCachedReplay = event.feature === "cached_replay";
  const onDeviceDelta =
    !isCachedReplay && event.source === "ON_DEVICE" ? 1 : 0;
  const cloudDelta = !isCachedReplay && event.source === "IN_CLOUD" ? 1 : 0;
  const cachedReplayDelta = isCachedReplay ? 1 : 0;

  const bytesSaved = current.bytesSaved + Math.max(0, Math.round(event.bytesSaved));
  const mbSaved = bytesSaved / 1_048_576;
  const nairaSaved = Number((mbSaved * nairaPerMb).toFixed(4));

  return {
    onDeviceCount: current.onDeviceCount + onDeviceDelta,
    cloudCount: current.cloudCount + cloudDelta,
    cachedReplayCount: current.cachedReplayCount + cachedReplayDelta,
    bytesSaved,
    nairaSaved,
    updatedAt: event.ts,
  };
}

function readTelemetryConfig(): {
  cloudDrillKb: number;
  nairaPerMb: number;
  uid: string | null;
} {
  try {
    const { remoteConfig, auth } = getFirebase();
    return {
      cloudDrillKb: rcNumber(remoteConfig, "telemetry_cloud_drill_kb"),
      nairaPerMb: rcNumber(remoteConfig, "telemetry_naira_per_mb"),
      uid: auth.currentUser?.uid ?? null,
    };
  } catch {
    return {
      cloudDrillKb: REMOTE_CONFIG_DEFAULTS.telemetry_cloud_drill_kb,
      nairaPerMb: REMOTE_CONFIG_DEFAULTS.telemetry_naira_per_mb,
      uid: null,
    };
  }
}

export interface RecordInferenceEventInput {
  feature: InferenceFeature;
  source: InferenceSourceLabel;
  latencyMs: number;
  customBytesSaved?: number;
  ts?: number;
}

type TelemetryListener = (payload: {
  latestEvent: InferenceEvent;
  summary: TelemetrySummary;
}) => void;

const listeners = new Set<TelemetryListener>();

export function subscribeTelemetryEvents(
  listener: TelemetryListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function emitInferenceTelemetryEvent(
  input: RecordInferenceEventInput,
): Promise<{ event: InferenceEvent; summary: TelemetrySummary }> {
  const cfg = readTelemetryConfig();
  const ts = input.ts ?? Date.now();
  const bytesSaved = computeInferenceBytesSaved({
    feature: input.feature,
    source: input.source,
    cloudDrillKb: cfg.cloudDrillKb,
    customBytesSaved: input.customBytesSaved,
  });

  const eventDraft: Omit<InferenceEvent, "id"> = {
    feature: input.feature,
    source: input.source,
    latencyMs: Math.max(0, Math.round(input.latencyMs)),
    bytesSaved,
    ts,
  };

  const savedEvent = await appendTelemetryEvent(eventDraft);
  const currentSummary = await getStoredTelemetrySummary();
  const nextSummary = applyEventToSummary(
    currentSummary,
    eventDraft,
    cfg.nairaPerMb,
  );
  await saveTelemetrySummary(nextSummary);

  for (const listener of listeners) {
    listener({ latestEvent: savedEvent, summary: nextSummary });
  }

  if (cfg.uid) {
    void syncTelemetrySummaryToFirestore(cfg.uid, nextSummary);
  }

  return { event: savedEvent, summary: nextSummary };
}

export interface InferenceTelemetryContextValue {
  latestEvent: InferenceEvent | null;
  recentEvents: InferenceEvent[];
  summary: TelemetrySummary;
  latestSource: InferenceSourceLabel | null;
  recordEvent: (
    input: RecordInferenceEventInput,
  ) => Promise<{ event: InferenceEvent; summary: TelemetrySummary }>;
  refresh: () => Promise<void>;
}

const DEFAULT_SUMMARY: TelemetrySummary = {
  onDeviceCount: 0,
  cloudCount: 0,
  cachedReplayCount: 0,
  bytesSaved: 0,
  nairaSaved: 0,
  updatedAt: 0,
};

const InferenceTelemetryContext =
  createContext<InferenceTelemetryContextValue>({
    latestEvent: null,
    recentEvents: [],
    summary: DEFAULT_SUMMARY,
    latestSource: null,
    recordEvent: emitInferenceTelemetryEvent,
    refresh: async () => undefined,
  });

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [latestEvent, setLatestEvent] = useState<InferenceEvent | null>(null);
  const [recentEvents, setRecentEvents] = useState<InferenceEvent[]>([]);
  const [summary, setSummary] = useState<TelemetrySummary>(DEFAULT_SUMMARY);

  const refresh = useCallback(async () => {
    const [events, storedSummary] = await Promise.all([
      listRecentTelemetryEvents(20),
      getStoredTelemetrySummary(),
    ]);
    setRecentEvents(events);
    setLatestEvent(events[0] ?? null);
    setSummary(storedSummary);
  }, []);

  useEffect(() => {
    void refresh();
    const unsubscribe = subscribeTelemetryEvents((payload) => {
      setLatestEvent(payload.latestEvent);
      setSummary(payload.summary);
      setRecentEvents((prev) =>
        [payload.latestEvent, ...prev].slice(0, 20),
      );
    });
    return unsubscribe;
  }, [refresh]);

  const recordEvent = useCallback(
    async (input: RecordInferenceEventInput) => {
      return emitInferenceTelemetryEvent(input);
    },
    [],
  );

  const value = useMemo<InferenceTelemetryContextValue>(
    () => ({
      latestEvent,
      recentEvents,
      summary,
      latestSource: latestEvent?.source ?? null,
      recordEvent,
      refresh,
    }),
    [latestEvent, recentEvents, summary, recordEvent, refresh],
  );

  return createElement(InferenceTelemetryContext.Provider, { value }, children);
}

export function useInferenceTelemetry(): InferenceTelemetryContextValue {
  return useContext(InferenceTelemetryContext);
}
