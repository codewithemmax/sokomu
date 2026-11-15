"use client";

import type { InferenceEvent, TelemetrySummary } from "@/types/telemetry";
import {
  getMetaValue,
  isIdbSupported,
  openSokomuDb,
  setMetaValue,
} from "./idb";

const TELEMETRY_SUMMARY_KEY = "telemetrySummary";

const DEFAULT_SUMMARY: TelemetrySummary = {
  onDeviceCount: 0,
  cloudCount: 0,
  cachedReplayCount: 0,
  bytesSaved: 0,
  nairaSaved: 0,
  updatedAt: 0,
};

let memoryEvents: InferenceEvent[] = [];
let nextMemoryId = 1;

export async function appendTelemetryEvent(
  event: Omit<InferenceEvent, "id">,
): Promise<InferenceEvent> {
  const withId: InferenceEvent = { ...event, id: nextMemoryId };
  nextMemoryId += 1;
  memoryEvents.push(withId);

  if (!isIdbSupported()) {
    return withId;
  }

  try {
    const db = await openSokomuDb();
    const generatedId = await db.add("telemetry", { ...event });
    return { ...event, id: Number(generatedId) };
  } catch {
    return withId;
  }
}

export async function listRecentTelemetryEvents(
  limit = 20,
): Promise<InferenceEvent[]> {
  if (!isIdbSupported()) {
    return [...memoryEvents]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, Math.max(1, limit));
  }

  try {
    const db = await openSokomuDb();
    const all = await db.getAll("telemetry");
    return all
      .sort((a, b) => b.ts - a.ts)
      .slice(0, Math.max(1, limit));
  } catch {
    return [...memoryEvents]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, Math.max(1, limit));
  }
}

export async function getStoredTelemetrySummary(): Promise<TelemetrySummary> {
  const stored = await getMetaValue<TelemetrySummary>(TELEMETRY_SUMMARY_KEY);
  if (!stored || typeof stored !== "object") {
    return { ...DEFAULT_SUMMARY };
  }
  return {
    onDeviceCount: Number(stored.onDeviceCount ?? 0),
    cloudCount: Number(stored.cloudCount ?? 0),
    cachedReplayCount: Number(stored.cachedReplayCount ?? 0),
    bytesSaved: Number(stored.bytesSaved ?? 0),
    nairaSaved: Number(stored.nairaSaved ?? 0),
    updatedAt: Number(stored.updatedAt ?? 0),
  };
}

export async function saveTelemetrySummary(
  summary: TelemetrySummary,
): Promise<void> {
  await setMetaValue(TELEMETRY_SUMMARY_KEY, summary);
}

export function clearTelemetryForTests(): void {
  memoryEvents = [];
  nextMemoryId = 1;
}
