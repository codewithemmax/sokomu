import { beforeEach, describe, expect, test } from "bun:test";
import { formatStorageBytes } from "../src/app/library/page";
import {
  clearAllAudioCache,
  deleteCachedAudioByScenario,
  listCachedAudio,
  putCachedAudio,
} from "../src/lib/db/audio-cache";
import { REMOTE_CONFIG_DEFAULTS } from "../src/lib/firebase/remote-config-defaults";

beforeEach(async () => {
  await clearAllAudioCache();
});

describe("Offline Library, Storage formatting, and Diagnostics config (U-12)", () => {
  test("formatStorageBytes formats B, KB, and MB accurately", () => {
    expect(formatStorageBytes(0)).toBe("0 B");
    expect(formatStorageBytes(512)).toBe("512 B");
    expect(formatStorageBytes(49_152)).toBe("48.0 KB");
    expect(formatStorageBytes(2 * 1_048_576)).toBe("2.00 MB");
  });

  test("manages cached scenario audio records for the Library page", async () => {
    await putCachedAudio({
      key: "yo-ijebu-elder-greeting:abc:gemini-3.1-flash-tts-preview",
      scenarioId: "yo-ijebu-elder-greeting",
      pcm: new Uint8Array([1, 2, 3, 4]).buffer,
      sampleRate: 24000,
      channels: 1,
      bytes: 4,
      durationMs: 100,
      ttsModel: "gemini-3.1-flash-tts-preview",
      promptHash: "abc",
      createdAt: 1000,
    });
    await putCachedAudio({
      key: "ig-owerri-family-visit:def:gemini-3.1-flash-tts-preview",
      scenarioId: "ig-owerri-family-visit",
      pcm: new Uint8Array([5, 6, 7, 8]).buffer,
      sampleRate: 24000,
      channels: 1,
      bytes: 4,
      durationMs: 100,
      ttsModel: "gemini-3.1-flash-tts-preview",
      promptHash: "def",
      createdAt: 2000,
    });

    expect((await listCachedAudio()).length).toBe(2);

    const removed = await deleteCachedAudioByScenario("yo-ijebu-elder-greeting");
    expect(removed).toBe(1);
    expect((await listCachedAudio()).length).toBe(1);

    await clearAllAudioCache();
    expect((await listCachedAudio()).length).toBe(0);
  });

  test("exposes all 24 Remote Config parameters for the Diagnostics table", () => {
    const keys = Object.keys(REMOTE_CONFIG_DEFAULTS);
    expect(keys.length).toBe(24);
    expect(keys).toContain("ai_cloud_text_model");
    expect(keys).toContain("ai_tts_model");
    expect(keys).toContain("cloud_fallback_daily_limit");
    expect(keys).toContain("demo_announcement");
  });
});
