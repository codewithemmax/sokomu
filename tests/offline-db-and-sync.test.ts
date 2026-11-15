import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getOnlineSnapshot,
  getServerOnlineSnapshot,
} from "@/hooks/useOnlineStatus";
import {
  buildAudioCacheKey,
  clearAllAudioCache,
  computePromptHash,
  deleteCachedAudioByScenario,
  getCachedAudio,
  getCachedAudioForScenario,
  listCachedAudio,
  putCachedAudio,
} from "@/lib/db/audio-cache";
import {
  clearDrillQueueForTests,
  enqueueDrillResult,
  listPendingDrillResults,
  markDrillResultsSynced,
} from "@/lib/db/drill-queue";
import {
  clearMemoryGlossaryForTests,
  getCachedGlossaryByDialect,
  getCachedGlossaryByScenario,
  putGlossaryEntries,
} from "@/lib/db/glossary-cache";
import {
  estimateStorageUsage,
  getMetaValue,
  requestPersistentStorage,
  setMetaValue,
  type AudioCacheRecord,
} from "@/lib/db/idb";
import {
  clearMemoryScenariosForTests,
  getCachedScenario,
  getCachedScenariosByDialect,
  putScenarios,
} from "@/lib/db/scenario-cache";
import {
  appendTelemetryEvent,
  clearTelemetryForTests,
  getStoredTelemetrySummary,
  listRecentTelemetryEvents,
  saveTelemetrySummary,
} from "@/lib/db/telemetry-store";
import { flushDrillQueue } from "@/lib/sync/sync-engine";
import type { DrillResult } from "@/types/ai";
import type { GlossaryEntry, Scenario } from "@/types/domain";

const ROOT = process.cwd();
const SEED_SCENARIOS = JSON.parse(
  readFileSync(join(ROOT, "scripts/seed-data/scenarios.json"), "utf8"),
) as Scenario[];
const SEED_GLOSSARY = JSON.parse(
  readFileSync(join(ROOT, "scripts/seed-data/glossary.json"), "utf8"),
) as GlossaryEntry[];

describe("IndexedDB caches, audio cache keys, and storage helpers (T-4.1, T-4.2, T-4.7)", () => {
  test("computes deterministic promptHash and stores/retrieves audioCache records", async () => {
    await clearAllAudioCache();

    const h1 = computePromptHash("Mama: Ẹ káàárọ̀\nTunde: Ẹ káàárọ̀ mà");
    const h2 = computePromptHash("Mama: Ẹ káàárọ̀\nTunde: Ẹ káàárọ̀ mà");
    const h3 = computePromptHash("Different script");
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
    expect(h1.length).toBe(8);

    const key = buildAudioCacheKey(
      "yo-ijebu-elder-greeting",
      h1,
      "gemini-3.1-flash-tts-preview",
    );
    const pcmBuffer = new Uint8Array([1, 2, 3, 4]).buffer;
    const record: AudioCacheRecord = {
      key,
      scenarioId: "yo-ijebu-elder-greeting",
      pcm: pcmBuffer,
      sampleRate: 24000,
      channels: 1,
      bytes: 4,
      durationMs: 100,
      ttsModel: "gemini-3.1-flash-tts-preview",
      promptHash: h1,
      createdAt: 1763164800000,
    };

    await putCachedAudio(record);
    expect(await getCachedAudio(key)).toEqual(record);
    expect(await getCachedAudioForScenario("yo-ijebu-elder-greeting")).toEqual(
      record,
    );
    expect((await listCachedAudio()).length).toBe(1);

    const deletedCount = await deleteCachedAudioByScenario(
      "yo-ijebu-elder-greeting",
    );
    expect(deletedCount).toBe(1);
    expect(await getCachedAudio(key)).toBeNull();
  });

  test("caches and filters scenarios and NFC glossary entries by dialect and scenario", async () => {
    clearMemoryScenariosForTests();
    clearMemoryGlossaryForTests();

    await putScenarios(SEED_SCENARIOS);
    await putGlossaryEntries(SEED_GLOSSARY.slice(0, 20));

    const ijebuScenario = await getCachedScenario("yo-ijebu-elder-greeting");
    expect(ijebuScenario?.dialectId).toBe("yo-ijebu");

    const ijebuList = await getCachedScenariosByDialect("yo-ijebu");
    expect(ijebuList.length).toBeGreaterThanOrEqual(1);

    const ijebuGlossary = await getCachedGlossaryByDialect("yo-ijebu");
    expect(ijebuGlossary.length).toBeGreaterThan(0);

    const byScenario = await getCachedGlossaryByScenario(
      "yo-ijebu-elder-greeting",
    );
    expect(byScenario.length).toBeGreaterThan(0);
  });

  test("handles meta store, telemetry store, and SSR storage/online snapshots", async () => {
    clearTelemetryForTests();

    await setMetaValue("schemaCheck", "v1");
    expect(await getMetaValue<string>("schemaCheck")).toBe("v1");

    await appendTelemetryEvent({
      feature: "vocab_quiz",
      source: "ON_DEVICE",
      latencyMs: 320,
      bytesSaved: 49152,
      ts: 1000,
    });
    await appendTelemetryEvent({
      feature: "tone_grading",
      source: "ON_DEVICE",
      latencyMs: 210,
      bytesSaved: 49152,
      ts: 2000,
    });

    const recent = await listRecentTelemetryEvents(10);
    expect(recent.length).toBe(2);
    expect(recent[0]?.ts).toBe(2000);

    await saveTelemetrySummary({
      onDeviceCount: 2,
      cloudCount: 0,
      cachedReplayCount: 1,
      bytesSaved: 98304,
      nairaSaved: 0.07,
      updatedAt: 2000,
    });
    const summary = await getStoredTelemetrySummary();
    expect(summary.onDeviceCount).toBe(2);

    expect(await requestPersistentStorage()).toBe(false);
    expect(await estimateStorageUsage()).toEqual({
      usageBytes: 0,
      quotaBytes: 0,
      persisted: false,
    });
    expect(getServerOnlineSnapshot()).toBe(true);
    expect(typeof getOnlineSnapshot()).toBe("boolean");
  });
});

describe("Idempotent drillQueue and sync-engine flush (T-4.9)", () => {
  test("enqueues drill results, flushes idempotently by clientEventId, and skips already synced items", async () => {
    clearDrillQueueForTests();

    const item1: DrillResult = {
      clientEventId: "evt-ijebu-001",
      uid: "user-123",
      scenarioId: "yo-ijebu-elder-greeting",
      kind: "vocab",
      score: 0.8,
      items: 5,
      tonal: {
        H: { correct: 2, total: 2 },
        M: { correct: 1, total: 2 },
        L: { correct: 1, total: 1 },
      },
      inferenceSource: "ON_DEVICE",
      createdAt: 1000,
    };

    const item2: DrillResult = {
      ...item1,
      clientEventId: "evt-ijebu-002",
      kind: "tone",
      score: 1,
      createdAt: 2000,
    };

    await enqueueDrillResult(item1);
    await enqueueDrillResult(item2);

    const pendingBefore = await listPendingDrillResults();
    expect(pendingBefore.map((p) => p.clientEventId)).toEqual([
      "evt-ijebu-001",
      "evt-ijebu-002",
    ]);

    const flushedIds: string[] = [];
    const flushRes = await flushDrillQueue({
      writer: async (items) => {
        for (const it of items) {
          flushedIds.push(it.clientEventId);
        }
      },
    });

    expect(flushRes).toEqual({ flushedCount: 2, remainingCount: 0 });
    expect(flushedIds).toEqual(["evt-ijebu-001", "evt-ijebu-002"]);
    expect((await listPendingDrillResults()).length).toBe(0);

    // Re-enqueueing an already-synced clientEventId does not create a duplicate pending item
    const duplicate = await enqueueDrillResult(item1);
    expect(duplicate.synced).toBe(1);
    expect((await listPendingDrillResults()).length).toBe(0);

    // Mark helper is safe on empty arrays
    await markDrillResultsSynced([]);
  });
});
