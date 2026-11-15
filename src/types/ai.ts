import type { DialectId, Tone } from "./domain";

export type { Tone };

export type InferenceSourceLabel = "ON_DEVICE" | "IN_CLOUD" | "CACHED_FALLBACK";

export type DrillMode = "prefer_on_device" | "only_on_device" | "only_in_cloud";

export type QuestionType =
  | "meaning_to_word"
  | "word_to_meaning"
  | "dialect_to_standard";

export type NanoStatus =
  | { state: "checking" }
  | { state: "unsupported" }
  | { state: "unavailable" }
  | { state: "downloadable" }
  | { state: "downloading"; progress: number }
  | { state: "ready" }
  | { state: "error"; message: string };

export interface DialectRuleEntry {
  name: string;
  rules: string[];
}

export type DialectRulesMap = Record<DialectId, DialectRuleEntry>;

export interface VocabularyQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  glossaryEntryId: string;
  explanation: string;
}

export interface VocabularyQuiz {
  dialectId: DialectId;
  questions: VocabularyQuestion[];
}

export interface TonalDrillItem {
  id: string;
  glossaryEntryId: string;
  instruction: string;
  meaningEn: string;
  syllableCount: number;
  expectedTonePattern: Tone[];
  hint?: string;
}

export interface TonalDrill {
  dialectId: DialectId;
  items: TonalDrillItem[];
}

export interface SyllableGrade {
  expected: string;
  received: string;
  expectedTone: Tone;
  receivedTone: Tone | "NONE";
  correct: boolean;
}

export interface TonalGrading {
  isCorrect: boolean;
  score: number;
  syllables: SyllableGrade[];
  producedMeaningEn: string;
  feedback: string;
}

export interface TrainerAssist {
  syllables: string[];
  suggestedTonePattern: Tone[];
  warnings: string[];
}

export interface DrillResult {
  clientEventId: string;
  uid: string;
  scenarioId: string;
  kind: "vocab" | "tone";
  score: number;
  items: number;
  tonal: Record<Tone, { correct: number; total: number }>;
  inferenceSource: InferenceSourceLabel;
  createdAt: number;
}

export interface HybridCallOutcome<T> {
  data: T;
  source: InferenceSourceLabel;
  latencyMs: number;
  retried: boolean;
}
