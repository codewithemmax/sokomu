import type { InferenceSourceLabel } from "./ai";

export type { InferenceSourceLabel };

export type InferenceFeature =
  | "vocab_quiz"
  | "tone_drill"
  | "tone_grading"
  | "trainer_assist"
  | "tts_dialogue"
  | "cached_replay";

export interface InferenceEvent {
  id?: number;
  feature: InferenceFeature;
  source: InferenceSourceLabel;
  latencyMs: number;
  bytesSaved: number;
  ts: number;
}

export interface TelemetrySummary {
  onDeviceCount: number;
  cloudCount: number;
  cachedReplayCount: number;
  bytesSaved: number;
  nairaSaved: number;
  updatedAt: number;
}
