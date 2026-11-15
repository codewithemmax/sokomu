import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  base64ToBytes,
  buildDialogueTtsPrompt,
  classifyTtsError,
  parseTtsVoiceMap,
  resolveScenarioSpeakerVoices,
  streamDialogueAudio,
  synthesizeOrReplayScenarioAudio,
  TtsSynthesisError,
} from "@/lib/ai/tts";
import {
  concatPcmChunks,
  estimatePcmDurationMs,
  PCM_SAMPLE_RATE,
  pcm16LeToFloat32,
} from "@/lib/audio/pcm-player";
import { clearAllAudioCache, getCachedAudio } from "@/lib/db/audio-cache";
import {
  clearTelemetryForTests,
  listRecentTelemetryEvents,
} from "@/lib/db/telemetry-store";
import type { Scenario } from "@/types/domain";

const ROOT = process.cwd();
const SCENARIOS = JSON.parse(
  readFileSync(join(ROOT, "scripts/seed-data/scenarios.json"), "utf8"),
) as Scenario[];
const IJEBU_SCENARIO = SCENARIOS[0]!;

describe("24 kHz PCM conversion and odd-byte carry handling (T-4.4)", () => {
  test("converts 16-bit little-endian PCM and carries trailing odd byte across chunks", () => {
    // Two 16-bit samples: 16384 (0x4000 -> +0.5) and -16384 (0xC000 -> -0.5)
    // Bytes: [0x00, 0x40, 0x00, 0xC0]
    const chunk1 = new Uint8Array([0x00, 0x40, 0x00]); // 3 bytes (odd)
    const chunk2 = new Uint8Array([0xc0]); // 1 byte completing second sample

    const res1 = pcm16LeToFloat32(chunk1, null);
    expect(res1.samples.length).toBe(1);
    expect(res1.samples[0]).toBe(0.5);
    expect(res1.carryOut).toEqual(new Uint8Array([0x00]));

    const res2 = pcm16LeToFloat32(chunk2, res1.carryOut);
    expect(res2.samples.length).toBe(1);
    expect(res2.samples[0]).toBe(-0.5);
    expect(res2.carryOut).toBeNull();

    // 48,000 bytes at 24 kHz mono 16-bit is 1,000 ms (1 second)
    expect(estimatePcmDurationMs(48_000, PCM_SAMPLE_RATE)).toBe(1000);
    expect(concatPcmChunks([chunk1, chunk2]).byteLength).toBe(4);
  });
});

describe("Multi-speaker TTS streaming, caching, offline replay, and error handling (T-4.3, T-4.5, T-4.6, T-4.10)", () => {
  test("parses voice map and builds NFC multi-speaker dialogue prompt", () => {
    const map = parseTtsVoiceMap(
      '{"elder_female":"Kore","elder_male":"Charon","young_male":"Puck","young_female":"Leda","trader":"Fenrir"}',
    );
    const voices = resolveScenarioSpeakerVoices(IJEBU_SCENARIO, map);
    expect(voices.length).toBe(2);
    expect(voices[0]?.voiceName).toBe("Kore");

    const prompt = buildDialogueTtsPrompt(
      IJEBU_SCENARIO,
      "Read warmly and naturally.",
    );
    expect(prompt).toContain("TTS the following conversation between");
    expect(prompt).toContain(IJEBU_SCENARIO.speakers[0].displayName);
  });

  test("retries once on transient 503 error and streams base64 PCM chunks", async () => {
    let attempts = 0;
    const rawChunk = Buffer.from([0x00, 0x40, 0x00, 0xc0]).toString("base64");

    const chunks: Uint8Array[] = [];
    const voices = resolveScenarioSpeakerVoices(
      IJEBU_SCENARIO,
      parseTtsVoiceMap("{}"),
    );

    for await (const chunk of streamDialogueAudio(
      IJEBU_SCENARIO,
      voices,
      "Warm tone",
      {
        retryDelayMs: 5,
        invokeStream: async () => {
          attempts += 1;
          if (attempts === 1) {
            throw new Error("503 Service Unavailable");
          }
          return {
            async *[Symbol.asyncIterator]() {
              yield rawChunk;
            },
          };
        },
      },
    )) {
      chunks.push(chunk);
    }

    expect(attempts).toBe(2);
    expect(chunks.length).toBe(1);
    expect(chunks[0]?.byteLength).toBe(4);
    expect(base64ToBytes(rawChunk).byteLength).toBe(4);
  });

  test("caches synthesized PCM on first run and replays offline from audioCache on second run", async () => {
    await clearAllAudioCache();
    clearTelemetryForTests();

    const rawChunk1 = Buffer.from([1, 2, 3, 4]).toString("base64");
    const rawChunk2 = Buffer.from([5, 6, 7, 8]).toString("base64");
    let synthesisCalls = 0;
    const streamedChunks: number[] = [];

    const firstRun = await synthesizeOrReplayScenarioAudio(IJEBU_SCENARIO, {
      configOverride: { online: true, ttsEnabled: true },
      onChunk: (c) => streamedChunks.push(c.byteLength),
      streamOptions: {
        invokeStream: async () => {
          synthesisCalls += 1;
          return {
            async *[Symbol.asyncIterator]() {
              yield rawChunk1;
              yield rawChunk2;
            },
          };
        },
      },
    });

    expect(firstRun.fromCache).toBe(false);
    expect(firstRun.record.bytes).toBe(8);
    expect(streamedChunks).toEqual([4, 4]);
    expect(synthesisCalls).toBe(1);
    expect(await getCachedAudio(firstRun.record.key)).toBeDefined();

    // Second run offline replays from cache with zero cloud synthesis calls
    const replayChunks: number[] = [];
    const secondRun = await synthesizeOrReplayScenarioAudio(IJEBU_SCENARIO, {
      configOverride: { online: false, ttsEnabled: true },
      onChunk: (c) => replayChunks.push(c.byteLength),
    });

    expect(secondRun.fromCache).toBe(true);
    expect(secondRun.record.bytes).toBe(8);
    expect(replayChunks).toEqual([8]);
    expect(synthesisCalls).toBe(1);

    const events = await listRecentTelemetryEvents(5);
    expect(events.some((e) => e.feature === "cached_replay")).toBe(true);
    expect(events.some((e) => e.feature === "tts_dialogue")).toBe(true);
  });

  test("classifies App Check 403, offline cache miss, and kill-switch errors cleanly", async () => {
    await clearAllAudioCache();

    const appCheckErr = classifyTtsError(
      new Error("403 PERMISSION_DENIED: App Check token invalid"),
    );
    expect(appCheckErr).toBeInstanceOf(TtsSynthesisError);
    expect(appCheckErr.code).toBe("SECURITY_CHECK_FAILED");
    expect(appCheckErr.userMessage).toContain("Security check failed");

    let offlineError: unknown = null;
    try {
      await synthesizeOrReplayScenarioAudio(IJEBU_SCENARIO, {
        configOverride: { online: false, ttsEnabled: true },
      });
    } catch (err: unknown) {
      offlineError = err;
    }
    expect(offlineError).toBeInstanceOf(TtsSynthesisError);
    expect((offlineError as TtsSynthesisError).code).toBe("OFFLINE");

    let disabledError: unknown = null;
    try {
      await synthesizeOrReplayScenarioAudio(IJEBU_SCENARIO, {
        configOverride: { online: true, ttsEnabled: false },
      });
    } catch (err: unknown) {
      disabledError = err;
    }
    expect(disabledError).toBeInstanceOf(TtsSynthesisError);
    expect((disabledError as TtsSynthesisError).code).toBe("TTS_DISABLED");
  });
});
