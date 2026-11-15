"use client";

import { ResponseModality } from "firebase/ai";
import {
  concatPcmChunks,
  estimatePcmDurationMs,
} from "@/lib/audio/pcm-player";
import {
  buildAudioCacheKey,
  computePromptHash,
  getCachedAudio,
  getCachedAudioForScenario,
  putCachedAudio,
} from "@/lib/db/audio-cache";
import type { AudioCacheRecord } from "@/lib/db/idb";
import { emitInferenceTelemetryEvent } from "@/hooks/useInferenceTelemetry";
import { getFirebase } from "@/lib/firebase/client";
import { rcBoolean, rcString } from "@/lib/firebase/remote-config";
import { REMOTE_CONFIG_DEFAULTS } from "@/lib/firebase/remote-config-defaults";
import { nfc } from "@/lib/tone/normalize";
import type { Scenario, SpeakerVoiceKey } from "@/types/domain";
import { sanitizeGenerationConfig } from "./config";
import { getTtsModel } from "./models";

export interface SpeakerVoice {
  speaker: string;
  voiceName: string;
}

export type TtsVoiceMap = Record<SpeakerVoiceKey, string>;

const DEFAULT_VOICE_MAP: TtsVoiceMap = {
  elder_female: "Kore",
  elder_male: "Charon",
  young_male: "Puck",
  young_female: "Leda",
  trader: "Fenrir",
};

export type TtsErrorCode =
  | "OFFLINE"
  | "TTS_DISABLED"
  | "SECURITY_CHECK_FAILED"
  | "TRANSIENT_CLOUD_ERROR"
  | "MID_STREAM_OFFLINE"
  | "SYNTHESIS_FAILED";

export class TtsSynthesisError extends Error {
  readonly code: TtsErrorCode;
  readonly userMessage: string;

  constructor(code: TtsErrorCode, userMessage: string, causeMessage?: string) {
    super(causeMessage ?? userMessage);
    this.name = "TtsSynthesisError";
    this.code = code;
    this.userMessage = userMessage;
  }
}

export function classifyTtsError(err: unknown): TtsSynthesisError {
  if (err instanceof TtsSynthesisError) {
    return err;
  }

  const rawMsg = err instanceof Error ? err.message : String(err ?? "");
  const lower = rawMsg.toLowerCase();

  if (
    lower.includes("app check") ||
    lower.includes("appcheck") ||
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("unauthenticated") ||
    lower.includes("permission_denied")
  ) {
    return new TtsSynthesisError(
      "SECURITY_CHECK_FAILED",
      "Security check failed. Verify App Check configuration and try again.",
      rawMsg,
    );
  }

  if (
    lower.includes("429") ||
    lower.includes("500") ||
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("504") ||
    lower.includes("resource_exhausted") ||
    lower.includes("unavailable")
  ) {
    return new TtsSynthesisError(
      "TRANSIENT_CLOUD_ERROR",
      "Voice synthesis service is temporarily busy. Retrying or try again shortly.",
      rawMsg,
    );
  }

  if (lower.includes("offline") || lower.includes("network")) {
    return new TtsSynthesisError(
      "MID_STREAM_OFFLINE",
      "Connection dropped during audio streaming. Partial audio was discarded; reconnect to retry.",
      rawMsg,
    );
  }

  return new TtsSynthesisError(
    "SYNTHESIS_FAILED",
    "Could not synthesize dialogue audio right now.",
    rawMsg,
  );
}

export function parseTtsVoiceMap(rawJson: string): TtsVoiceMap {
  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (typeof parsed !== "object" || parsed === null) {
      return { ...DEFAULT_VOICE_MAP };
    }
    const obj = parsed as Record<string, unknown>;
    return {
      elder_female:
        typeof obj.elder_female === "string" && obj.elder_female
          ? obj.elder_female
          : DEFAULT_VOICE_MAP.elder_female,
      elder_male:
        typeof obj.elder_male === "string" && obj.elder_male
          ? obj.elder_male
          : DEFAULT_VOICE_MAP.elder_male,
      young_male:
        typeof obj.young_male === "string" && obj.young_male
          ? obj.young_male
          : DEFAULT_VOICE_MAP.young_male,
      young_female:
        typeof obj.young_female === "string" && obj.young_female
          ? obj.young_female
          : DEFAULT_VOICE_MAP.young_female,
      trader:
        typeof obj.trader === "string" && obj.trader
          ? obj.trader
          : DEFAULT_VOICE_MAP.trader,
    };
  } catch {
    return { ...DEFAULT_VOICE_MAP };
  }
}

export function resolveScenarioSpeakerVoices(
  scenario: Scenario,
  voiceMap: TtsVoiceMap,
): SpeakerVoice[] {
  return scenario.speakers.map((speaker) => ({
    speaker: speaker.displayName,
    voiceName:
      voiceMap[speaker.voiceKey] ?? DEFAULT_VOICE_MAP[speaker.voiceKey] ?? "Kore",
  }));
}

export function buildDialogueTtsPrompt(
  scenario: Scenario,
  styleInstruction: string,
): string {
  const speakerNames = scenario.speakers.map((s) => s.displayName).join(" and ");
  const lines = scenario.script
    .map((line) => {
      const displayName =
        scenario.speakers.find((s) => s.id === line.speakerId)?.displayName ??
        line.speakerId;
      return `${displayName}: ${nfc(line.text)}`;
    })
    .join("\n");

  return `${styleInstruction.trim()}\nTTS the following conversation between ${speakerNames}:\n${lines}`;
}

export function base64ToBytes(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  }
  return new Uint8Array(Buffer.from(b64, "base64"));
}

function readRuntimeTtsConfig(): {
  ttsEnabled: boolean;
  ttsModel: string;
  styleInstruction: string;
  voiceMap: TtsVoiceMap;
} {
  try {
    const { remoteConfig } = getFirebase();
    return {
      ttsEnabled: rcBoolean(remoteConfig, "tts_enabled"),
      ttsModel: rcString(remoteConfig, "ai_tts_model"),
      styleInstruction: rcString(remoteConfig, "ai_tts_style_instruction"),
      voiceMap: parseTtsVoiceMap(rcString(remoteConfig, "tts_voice_map_json")),
    };
  } catch {
    return {
      ttsEnabled: REMOTE_CONFIG_DEFAULTS.tts_enabled,
      ttsModel: REMOTE_CONFIG_DEFAULTS.ai_tts_model,
      styleInstruction: REMOTE_CONFIG_DEFAULTS.ai_tts_style_instruction,
      voiceMap: parseTtsVoiceMap(REMOTE_CONFIG_DEFAULTS.tts_voice_map_json),
    };
  }
}

export interface StreamDialogueOptions {
  retryDelayMs?: number;
  invokeStream?: (
    promptText: string,
    voices: readonly SpeakerVoice[],
  ) => Promise<AsyncIterable<string>>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function defaultInvokeTtsStream(
  promptText: string,
  voices: readonly SpeakerVoice[],
): Promise<AsyncIterable<string>> {
  const model = getTtsModel();
  const result = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ type: "text", text: promptText }] }],
    generationConfig: sanitizeGenerationConfig({
      responseModalities: [ResponseModality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: voices.map((v) => ({
            speaker: v.speaker,
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: v.voiceName },
            },
          })),
        },
      },
    }),
  });

  return {
    async *[Symbol.asyncIterator]() {
      for await (const chunk of result.stream) {
        const parts = chunk.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          if ("inlineData" in part && part.inlineData?.data) {
            yield part.inlineData.data;
          }
        }
      }
    },
  };
}

export async function* streamDialogueAudio(
  scenario: Scenario,
  voices: SpeakerVoice[],
  styleInstruction: string,
  options: StreamDialogueOptions = {},
): AsyncGenerator<Uint8Array> {
  const promptText = buildDialogueTtsPrompt(scenario, styleInstruction);
  const invoke = options.invokeStream ?? defaultInvokeTtsStream;
  const retryDelayMs = options.retryDelayMs ?? 2_000;

  let base64Stream: AsyncIterable<string>;
  try {
    base64Stream = await invoke(promptText, voices);
  } catch (firstErr: unknown) {
    const classified = classifyTtsError(firstErr);
    if (classified.code !== "TRANSIENT_CLOUD_ERROR") {
      throw classified;
    }
    await delay(retryDelayMs);
    try {
      base64Stream = await invoke(promptText, voices);
    } catch (secondErr: unknown) {
      throw classifyTtsError(secondErr);
    }
  }

  let yieldedChunks = 0;
  try {
    for await (const b64 of base64Stream) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        throw new TtsSynthesisError(
          "MID_STREAM_OFFLINE",
          "Connection dropped during audio streaming. Partial audio was discarded; reconnect to retry.",
        );
      }
      const bytes = base64ToBytes(b64);
      if (bytes.byteLength > 0) {
        yieldedChunks += 1;
        yield bytes;
      }
    }
  } catch (streamErr: unknown) {
    if (
      yieldedChunks > 0 &&
      typeof navigator !== "undefined" &&
      navigator.onLine === false
    ) {
      throw new TtsSynthesisError(
        "MID_STREAM_OFFLINE",
        "Connection dropped during audio streaming. Partial audio was discarded; reconnect to retry.",
      );
    }
    throw classifyTtsError(streamErr);
  }
}

export interface SynthesizeOrReplayOptions {
  onChunk?: (chunk: Uint8Array) => void;
  streamOptions?: StreamDialogueOptions;
  configOverride?: {
    ttsEnabled?: boolean;
    ttsModel?: string;
    styleInstruction?: string;
    voiceMap?: TtsVoiceMap;
    online?: boolean;
  };
}

export interface SynthesizeOrReplayResult {
  record: AudioCacheRecord;
  fromCache: boolean;
  latencyToFirstChunkMs: number;
}

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export async function synthesizeOrReplayScenarioAudio(
  scenario: Scenario,
  options: SynthesizeOrReplayOptions = {},
): Promise<SynthesizeOrReplayResult> {
  const started = nowMs();
  const runtimeCfg = readRuntimeTtsConfig();

  const ttsEnabled = options.configOverride?.ttsEnabled ?? runtimeCfg.ttsEnabled;
  const ttsModel = options.configOverride?.ttsModel ?? runtimeCfg.ttsModel;
  const styleInstruction =
    options.configOverride?.styleInstruction ?? runtimeCfg.styleInstruction;
  const voiceMap = options.configOverride?.voiceMap ?? runtimeCfg.voiceMap;
  const online =
    options.configOverride?.online ??
    (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true);

  const voices = resolveScenarioSpeakerVoices(scenario, voiceMap);
  const promptText = buildDialogueTtsPrompt(scenario, styleInstruction);
  const promptHash = computePromptHash(
    `${promptText}|${JSON.stringify(voices)}`,
  );
  const cacheKey = buildAudioCacheKey(scenario.scenarioId, promptHash, ttsModel);

  const exactHit = await getCachedAudio(cacheKey);
  const cachedRecord =
    exactHit ??
    (!online ? await getCachedAudioForScenario(scenario.scenarioId) : null);

  if (cachedRecord) {
    const firstChunkMs = Math.round(nowMs() - started);
    options.onChunk?.(new Uint8Array(cachedRecord.pcm));
    await emitInferenceTelemetryEvent({
      feature: "cached_replay",
      source: "CACHED_FALLBACK",
      latencyMs: firstChunkMs,
      customBytesSaved: cachedRecord.bytes,
    });
    return {
      record: cachedRecord,
      fromCache: true,
      latencyToFirstChunkMs: firstChunkMs,
    };
  }

  if (!online) {
    throw new TtsSynthesisError(
      "OFFLINE",
      "Audio not cached yet. Connect once to save it.",
    );
  }

  if (!ttsEnabled) {
    throw new TtsSynthesisError(
      "TTS_DISABLED",
      "Cloud voice synthesis is currently disabled by Remote Config.",
    );
  }

  const chunks: Uint8Array[] = [];
  let firstChunkLatencyMs: number | null = null;

  for await (const chunk of streamDialogueAudio(
    scenario,
    voices,
    styleInstruction,
    options.streamOptions,
  )) {
    if (firstChunkLatencyMs === null) {
      firstChunkLatencyMs = Math.round(nowMs() - started);
    }
    chunks.push(chunk);
    options.onChunk?.(chunk);
  }

  const pcm = concatPcmChunks(chunks);
  const bytes = pcm.byteLength;
  const durationMs = estimatePcmDurationMs(bytes);
  const record: AudioCacheRecord = {
    key: cacheKey,
    scenarioId: scenario.scenarioId,
    pcm,
    sampleRate: 24000,
    channels: 1,
    bytes,
    durationMs,
    ttsModel,
    promptHash,
    createdAt: Date.now(),
  };

  await putCachedAudio(record);
  await emitInferenceTelemetryEvent({
    feature: "tts_dialogue",
    source: "IN_CLOUD",
    latencyMs: firstChunkLatencyMs ?? Math.round(nowMs() - started),
  });

  return {
    record,
    fromCache: false,
    latencyToFirstChunkMs: firstChunkLatencyMs ?? Math.round(nowMs() - started),
  };
}
