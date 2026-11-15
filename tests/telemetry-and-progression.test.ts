import { beforeEach, describe, expect, test } from "bun:test";
import { calculateDataSavedMetrics } from "../src/hooks/useDataSaved";
import {
  applyEventToSummary,
  computeInferenceBytesSaved,
  emitInferenceTelemetryEvent,
  subscribeTelemetryEvents,
} from "../src/hooks/useInferenceTelemetry";
import { clearMemoryMetaForTests } from "../src/lib/db/idb";
import {
  clearTelemetryForTests,
  getStoredTelemetrySummary,
} from "../src/lib/db/telemetry-store";
import {
  aggregateTonalMastery,
  computeOverallTonalAccuracyPercent,
  computeTonalAccuracyPercent,
  createEmptyTonalStats,
  findWeakestTones,
  mergeScenarioProgress,
  recordScenarioDrillProgress,
} from "../src/lib/progress/mastery";
import {
  buildStampId,
  evaluateAndAwardStamp,
  evaluateStampUnlock,
  listEarnedStamps,
} from "../src/lib/progress/stamps";

beforeEach(() => {
  clearMemoryMetaForTests();
  clearTelemetryForTests();
});

describe("Telemetry events and FR-TEL-03 Data Saved math (T-5.1, T-5.2)", () => {
  test("computes bytesSaved strictly for ON_DEVICE drills and cached audio replays (AC-C3)", () => {
    expect(
      computeInferenceBytesSaved({
        feature: "vocab_quiz",
        source: "ON_DEVICE",
        cloudDrillKb: 48,
      }),
    ).toBe(49_152);

    expect(
      computeInferenceBytesSaved({
        feature: "cached_replay",
        source: "CACHED_FALLBACK",
        customBytesSaved: 240_000,
      }),
    ).toBe(240_000);

    expect(
      computeInferenceBytesSaved({
        feature: "vocab_quiz",
        source: "IN_CLOUD",
        cloudDrillKb: 48,
      }),
    ).toBe(0);

    expect(
      computeInferenceBytesSaved({
        feature: "vocab_quiz",
        source: "CACHED_FALLBACK",
        cloudDrillKb: 48,
      }),
    ).toBe(0);
  });

  test("calculates KB, MB, and Naira saved from bytesSaved and rate", () => {
    const oneMb = calculateDataSavedMetrics(1_048_576, 0.78);
    expect(oneMb.kbSaved).toBe(1024);
    expect(oneMb.mbSaved).toBe(1);
    expect(oneMb.nairaSaved).toBe(0.78);
    expect(oneMb.formattedMb).toBe("1.00 MB");
    expect(oneMb.formattedNaira).toBe("\u20A60.78");
  });

  test("emits telemetry events, updates summary, and notifies subscribers", async () => {
    const seenSources: string[] = [];
    const unsubscribe = subscribeTelemetryEvents((payload) => {
      seenSources.push(payload.latestEvent.source);
    });

    await emitInferenceTelemetryEvent({
      feature: "vocab_quiz",
      source: "ON_DEVICE",
      latencyMs: 112,
    });
    await emitInferenceTelemetryEvent({
      feature: "tts_dialogue",
      source: "IN_CLOUD",
      latencyMs: 690,
    });
    await emitInferenceTelemetryEvent({
      feature: "cached_replay",
      source: "CACHED_FALLBACK",
      latencyMs: 6,
      customBytesSaved: 100_000,
    });

    unsubscribe();

    expect(seenSources).toEqual(["ON_DEVICE", "IN_CLOUD", "CACHED_FALLBACK"]);

    const summary = await getStoredTelemetrySummary();
    expect(summary.onDeviceCount).toBe(1);
    expect(summary.cloudCount).toBe(1);
    expect(summary.cachedReplayCount).toBe(1);
    expect(summary.bytesSaved).toBe(49_152 + 100_000);
    expect(summary.nairaSaved).toBeGreaterThan(0);

    const manual = applyEventToSummary(
      summary,
      {
        feature: "tone_drill",
        source: "CACHED_FALLBACK",
        latencyMs: 5,
        bytesSaved: 0,
        ts: 9999,
      },
      0.78,
    );
    expect(manual.bytesSaved).toBe(summary.bytesSaved);
  });
});

describe("Tonal Accuracy Mastery and Path C stamps (T-5.7, T-5.8, T-5.9)", () => {
  test("aggregates H/M/L tonal mastery and ranks weakest tones first", () => {
    const initial = createEmptyTonalStats();
    const updated = aggregateTonalMastery(initial, [
      {
        expected: "\u1ECD",
        received: "\u1ECD",
        expectedTone: "M",
        receivedTone: "M",
        correct: true,
      },
      {
        expected: "k\u1ECD\u0300",
        received: "k\u1ECD\u0301",
        expectedTone: "L",
        receivedTone: "H",
        correct: false,
      },
      {
        expected: "w\u00E1",
        received: "w\u00E1",
        expectedTone: "H",
        receivedTone: "H",
        correct: true,
      },
    ]);

    expect(updated.M).toEqual({ correct: 1, total: 1 });
    expect(updated.L).toEqual({ correct: 0, total: 1 });
    expect(updated.H).toEqual({ correct: 1, total: 1 });
    expect(computeTonalAccuracyPercent(updated.M)).toBe(100);
    expect(computeTonalAccuracyPercent(updated.L)).toBe(0);
    expect(computeOverallTonalAccuracyPercent(updated)).toBe(67);
    expect(findWeakestTones(updated)[0]).toBe("L");
  });

  test("merges scenario progress and keeps best scenario score", async () => {
    const first = mergeScenarioProgress(null, {
      dialectId: "yo-ijebu",
      scenarioId: "ijebu-elder-greeting",
      accuracy: 0.6,
      now: 1000,
    });
    expect(first.scenarioScores["ijebu-elder-greeting"]).toBe(0.6);
    expect(first.scenariosCompleted).toEqual(["ijebu-elder-greeting"]);

    const second = await recordScenarioDrillProgress(null, {
      dialectId: "yo-ijebu",
      scenarioId: "ijebu-elder-greeting",
      accuracy: 0.9,
      now: 2000,
    });
    expect(second.scenarioScores["ijebu-elder-greeting"]).toBe(0.9);
  });

  test("unlocks Path C stamps at threshold >= 0.8 and prevents duplicate awards", async () => {
    expect(buildStampId("yo-ijebu", "ijebu-elder-greeting")).toBe(
      "yo-ijebu_ijebu-elder-greeting",
    );

    const below = evaluateStampUnlock({
      dialectId: "yo-ijebu",
      scenarioId: "ijebu-elder-greeting",
      accuracy: 0.75,
      threshold: 0.8,
    });
    expect(below).toBeNull();

    const firstAward = await evaluateAndAwardStamp(null, {
      dialectId: "yo-ijebu",
      scenarioId: "ijebu-elder-greeting",
      accuracy: 0.85,
      threshold: 0.8,
      earnedOffline: true,
      now: 5000,
    });
    expect(firstAward.unlocked).not.toBeNull();
    expect(firstAward.unlocked?.stampId).toBe("yo-ijebu_ijebu-elder-greeting");
    expect(firstAward.unlocked?.earnedOffline).toBe(true);

    const duplicateAward = await evaluateAndAwardStamp(null, {
      dialectId: "yo-ijebu",
      scenarioId: "ijebu-elder-greeting",
      accuracy: 0.95,
      threshold: 0.8,
      now: 6000,
    });
    expect(duplicateAward.unlocked).toBeNull();
    expect((await listEarnedStamps()).length).toBe(1);
  });
});
