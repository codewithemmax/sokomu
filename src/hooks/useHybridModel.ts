"use client";

import { useCallback } from "react";
import {
  canUseCloudFallback,
  incrementCloudFallbackCount,
  syncCloudFallbackUsageWithIdb,
} from "@/lib/ai/config";
import {
  buildFallbackTonalDrill,
  buildFallbackVocabularyQuiz,
} from "@/lib/ai/fallback-quiz";
import { selectGroundingEntries } from "@/lib/ai/grounding";
import { normalizeInferenceSource } from "@/lib/ai/inference-source";
import { getStructuredModel } from "@/lib/ai/models";
import {
  buildGradingPrompt,
  buildQuizPrompt,
  buildTonalDrillPrompt,
  formatDialectRulesBlock,
} from "@/lib/ai/prompts";
import {
  TonalDrillSchema,
  TonalGradingSchema,
  VocabularyQuizSchema,
} from "@/lib/ai/schemas";
import { getFirebase } from "@/lib/firebase/client";
import { rcBoolean, rcNumber, rcString } from "@/lib/firebase/remote-config";
import { REMOTE_CONFIG_DEFAULTS } from "@/lib/firebase/remote-config-defaults";
import { compareTonalAnswer } from "@/lib/tone/compare";
import type {
  DrillMode,
  HybridCallOutcome,
  InferenceSourceLabel,
  TonalDrill,
  TonalGrading,
  VocabularyQuiz,
} from "@/types/ai";
import type { DialectId, GlossaryEntry, Tone } from "@/types/domain";
import { isTonalDrill, isTonalGrading, isVocabularyQuiz } from "@/types/guards";

const RETRY_SUFFIX =
  "\n\nIMPORTANT: Return ONLY valid JSON matching the required schema and CONTEXT entryIds.";

export interface ResolveModeParams {
  online: boolean;
  cloudFallbackEnabled: boolean;
  withinDailyCloudLimit: boolean;
  forceCloud?: boolean;
}

export function resolveEffectiveDrillMode(params: ResolveModeParams): DrillMode {
  if (!params.online) {
    return "only_on_device";
  }
  if (!params.cloudFallbackEnabled || !params.withinDailyCloudLimit) {
    return "only_on_device";
  }
  if (params.forceCloud) {
    return "only_in_cloud";
  }
  return "prefer_on_device";
}

export interface ModelInvocationResult {
  text: string;
  inferenceSource?: unknown;
}

export interface GuardedGenerationParams<T> {
  prompt: string;
  invokeModel: (promptText: string) => Promise<ModelInvocationResult>;
  guard: (v: unknown) => v is T;
  buildFallback: () => T;
  onCloudCall?: () => void;
}

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export async function runGuardedGeneration<T>(
  params: GuardedGenerationParams<T>,
): Promise<HybridCallOutcome<T>> {
  const started = nowMs();

  const tryOnce = async (
    promptText: string,
  ): Promise<{
    parsed: T;
    source: Exclude<InferenceSourceLabel, "CACHED_FALLBACK">;
  } | null> => {
    const response = await params.invokeModel(promptText);
    const source = normalizeInferenceSource(response.inferenceSource);
    if (source === "IN_CLOUD") {
      params.onCloudCall?.();
    }
    const parsed: unknown = JSON.parse(response.text.trim());
    if (params.guard(parsed)) {
      return { parsed, source };
    }
    return null;
  };

  try {
    const first = await tryOnce(params.prompt);
    if (first) {
      return {
        data: first.parsed,
        source: first.source,
        latencyMs: Math.round(nowMs() - started),
        retried: false,
      };
    }
  } catch {
    // Attempt one corrective retry below before falling back cleanly.
  }

  try {
    const second = await tryOnce(`${params.prompt}${RETRY_SUFFIX}`);
    if (second) {
      return {
        data: second.parsed,
        source: second.source,
        latencyMs: Math.round(nowMs() - started),
        retried: true,
      };
    }
  } catch {
    // Fall through to deterministic offline generator.
  }

  return {
    data: params.buildFallback(),
    source: "CACHED_FALLBACK",
    latencyMs: Math.round(nowMs() - started),
    retried: true,
  };
}

export function mergeDeterministicAndModelGrading(
  deterministicGrade: TonalGrading,
  modelCandidate: unknown,
): TonalGrading {
  if (!isTonalGrading(modelCandidate)) {
    return deterministicGrade;
  }

  return {
    // Deterministic correctness, score, and syllable grades are always ground truth (D-004).
    isCorrect: deterministicGrade.isCorrect,
    score: deterministicGrade.score,
    syllables: deterministicGrade.syllables,
    producedMeaningEn:
      deterministicGrade.producedMeaningEn || modelCandidate.producedMeaningEn,
    feedback:
      modelCandidate.feedback.trim().length > 0
        ? modelCandidate.feedback.trim()
        : deterministicGrade.feedback,
  };
}

function readRuntimeAiConfig(): {
  cloudFallbackEnabled: boolean;
  cloudFallbackDailyLimit: number;
  questionCount: number;
  maxGroundingEntries: number;
  dialectRulesJson: string;
} {
  try {
    const { remoteConfig } = getFirebase();
    return {
      cloudFallbackEnabled: rcBoolean(remoteConfig, "cloud_fallback_enabled"),
      cloudFallbackDailyLimit: rcNumber(
        remoteConfig,
        "cloud_fallback_daily_limit",
      ),
      questionCount: rcNumber(remoteConfig, "quiz_question_count"),
      maxGroundingEntries: rcNumber(remoteConfig, "quiz_grounding_max_entries"),
      dialectRulesJson: rcString(remoteConfig, "dialect_rules_json"),
    };
  } catch {
    return {
      cloudFallbackEnabled: REMOTE_CONFIG_DEFAULTS.cloud_fallback_enabled,
      cloudFallbackDailyLimit: REMOTE_CONFIG_DEFAULTS.cloud_fallback_daily_limit,
      questionCount: REMOTE_CONFIG_DEFAULTS.quiz_question_count,
      maxGroundingEntries: REMOTE_CONFIG_DEFAULTS.quiz_grounding_max_entries,
      dialectRulesJson: REMOTE_CONFIG_DEFAULTS.dialect_rules_json,
    };
  }
}

export interface GenerateQuizOptions {
  dialectId: DialectId;
  entries: readonly GlossaryEntry[];
  scenarioId?: string;
  count?: number;
  weakestTones?: readonly Tone[];
  forceCloud?: boolean;
}

export interface GradeToneOptions {
  entry: GlossaryEntry;
  learnerInput: string;
  dialectGlossary?: readonly GlossaryEntry[];
  forceCloud?: boolean;
}

export interface UseHybridModelResult {
  generateQuiz: (
    options: GenerateQuizOptions,
  ) => Promise<HybridCallOutcome<VocabularyQuiz>>;
  generateTonalDrill: (
    options: GenerateQuizOptions,
  ) => Promise<HybridCallOutcome<TonalDrill>>;
  gradeToneAttempt: (
    options: GradeToneOptions,
  ) => Promise<HybridCallOutcome<TonalGrading>>;
}

export function useHybridModel(): UseHybridModelResult {
  const resolveMode = useCallback(async (forceCloud?: boolean): Promise<DrillMode> => {
    const cfg = readRuntimeAiConfig();
    const online = typeof navigator !== "undefined" ? navigator.onLine : true;
    await syncCloudFallbackUsageWithIdb();
    const withinLimit = canUseCloudFallback(
      cfg.cloudFallbackDailyLimit,
      cfg.cloudFallbackEnabled,
    );
    return resolveEffectiveDrillMode({
      online,
      cloudFallbackEnabled: cfg.cloudFallbackEnabled,
      withinDailyCloudLimit: withinLimit,
      forceCloud,
    });
  }, []);

  const generateQuiz = useCallback(
    async (
      options: GenerateQuizOptions,
    ): Promise<HybridCallOutcome<VocabularyQuiz>> => {
      const cfg = readRuntimeAiConfig();
      const count = options.count ?? cfg.questionCount;
      const grounded = selectGroundingEntries(options.entries, {
        dialectId: options.dialectId,
        scenarioId: options.scenarioId,
        maxEntries: cfg.maxGroundingEntries,
        weakestTones: options.weakestTones,
      });

      const fallbackEntries = grounded.length > 0 ? grounded : options.entries;
      const allowedIds = new Set(fallbackEntries.map((e) => e.entryId));
      const mode = await resolveMode(options.forceCloud);
      const dialectRules = formatDialectRulesBlock(
        options.dialectId,
        cfg.dialectRulesJson,
      );
      const prompt = buildQuizPrompt(fallbackEntries, count, options.dialectId);

      const started = nowMs();
      let model;
      try {
        model = getStructuredModel({
          mode,
          schema: VocabularyQuizSchema,
          systemInstructionKey: "ai_system_instruction_quiz",
          temperatureKey: "ai_drill_temperature",
          dialectRules,
        });
      } catch {
        return {
          data: buildFallbackVocabularyQuiz(
            options.dialectId,
            fallbackEntries,
            count,
          ),
          source: "CACHED_FALLBACK",
          latencyMs: Math.round(nowMs() - started),
          retried: false,
        };
      }

      return runGuardedGeneration<VocabularyQuiz>({
        prompt,
        invokeModel: async (text) => {
          const result = await model.generateContent(text);
          return {
            text: result.response.text(),
            inferenceSource: result.response.inferenceSource,
          };
        },
        guard: (v): v is VocabularyQuiz => isVocabularyQuiz(v, allowedIds),
        buildFallback: () =>
          buildFallbackVocabularyQuiz(options.dialectId, fallbackEntries, count),
        onCloudCall: () => {
          incrementCloudFallbackCount();
        },
      });
    },
    [resolveMode],
  );

  const generateTonalDrill = useCallback(
    async (
      options: GenerateQuizOptions,
    ): Promise<HybridCallOutcome<TonalDrill>> => {
      const cfg = readRuntimeAiConfig();
      const count = options.count ?? cfg.questionCount;
      const grounded = selectGroundingEntries(options.entries, {
        dialectId: options.dialectId,
        scenarioId: options.scenarioId,
        maxEntries: cfg.maxGroundingEntries,
        weakestTones: options.weakestTones,
      });

      const fallbackEntries = grounded.length > 0 ? grounded : options.entries;
      const allowedIds = new Set(fallbackEntries.map((e) => e.entryId));
      const mode = await resolveMode(options.forceCloud);
      const dialectRules = formatDialectRulesBlock(
        options.dialectId,
        cfg.dialectRulesJson,
      );
      const prompt = buildTonalDrillPrompt(
        fallbackEntries,
        count,
        options.dialectId,
      );

      const started = nowMs();
      let model;
      try {
        model = getStructuredModel({
          mode,
          schema: TonalDrillSchema,
          systemInstructionKey: "ai_system_instruction_tone",
          temperatureKey: "ai_drill_temperature",
          dialectRules,
        });
      } catch {
        return {
          data: buildFallbackTonalDrill(
            options.dialectId,
            fallbackEntries,
            count,
          ),
          source: "CACHED_FALLBACK",
          latencyMs: Math.round(nowMs() - started),
          retried: false,
        };
      }

      return runGuardedGeneration<TonalDrill>({
        prompt,
        invokeModel: async (text) => {
          const result = await model.generateContent(text);
          return {
            text: result.response.text(),
            inferenceSource: result.response.inferenceSource,
          };
        },
        guard: (v): v is TonalDrill => isTonalDrill(v, allowedIds),
        buildFallback: () =>
          buildFallbackTonalDrill(options.dialectId, fallbackEntries, count),
        onCloudCall: () => {
          incrementCloudFallbackCount();
        },
      });
    },
    [resolveMode],
  );

  const gradeToneAttempt = useCallback(
    async (
      options: GradeToneOptions,
    ): Promise<HybridCallOutcome<TonalGrading>> => {
      const started = nowMs();
      const deterministicGrade = compareTonalAnswer(
        options.entry,
        options.learnerInput,
        options.dialectGlossary,
      );

      const cfg = readRuntimeAiConfig();
      const mode = await resolveMode(options.forceCloud);
      const dialectRules = formatDialectRulesBlock(
        options.entry.dialectId,
        cfg.dialectRulesJson,
      );
      const prompt = buildGradingPrompt(
        options.entry,
        options.learnerInput,
        deterministicGrade,
      );

      let model;
      try {
        model = getStructuredModel({
          mode,
          schema: TonalGradingSchema,
          systemInstructionKey: "ai_system_instruction_grading",
          temperatureKey: "ai_grading_temperature",
          dialectRules,
        });
      } catch {
        return {
          data: deterministicGrade,
          source: "CACHED_FALLBACK",
          latencyMs: Math.round(nowMs() - started),
          retried: false,
        };
      }

      const rawOutcome = await runGuardedGeneration<TonalGrading>({
        prompt,
        invokeModel: async (text) => {
          const result = await model.generateContent(text);
          return {
            text: result.response.text(),
            inferenceSource: result.response.inferenceSource,
          };
        },
        guard: isTonalGrading,
        buildFallback: () => deterministicGrade,
        onCloudCall: () => {
          incrementCloudFallbackCount();
        },
      });

      return {
        ...rawOutcome,
        data: mergeDeterministicAndModelGrading(
          deterministicGrade,
          rawOutcome.data,
        ),
      };
    },
    [resolveMode],
  );

  return {
    generateQuiz,
    generateTonalDrill,
    gradeToneAttempt,
  };
}
