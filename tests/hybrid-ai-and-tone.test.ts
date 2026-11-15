import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  mergeDeterministicAndModelGrading,
  resolveEffectiveDrillMode,
  runGuardedGeneration,
} from "@/hooks/useHybridModel";
import { toNanoStatusState } from "@/hooks/useNanoReadiness";
import {
  canUseCloudFallback,
  getCloudFallbackCountToday,
  incrementCloudFallbackCount,
  resetCloudFallbackUsage,
  sanitizeGenerationConfig,
  setCloudFallbackTestStore,
} from "@/lib/ai/config";
import {
  buildFallbackTonalDrill,
  buildFallbackVocabularyQuiz,
} from "@/lib/ai/fallback-quiz";
import {
  selectGroundingEntries,
  serializeGroundingContext,
} from "@/lib/ai/grounding";
import { normalizeInferenceSource } from "@/lib/ai/inference-source";
import { checkNanoAvailability } from "@/lib/ai/nano";
import {
  buildGradingPrompt,
  buildQuizPrompt,
  buildTonalDrillPrompt,
  formatDialectRulesBlock,
} from "@/lib/ai/prompts";
import {
  TonalDrillSchema,
  TonalGradingSchema,
  TrainerAssistSchema,
  VocabularyQuizSchema,
} from "@/lib/ai/schemas";
import { REMOTE_CONFIG_DEFAULTS } from "@/lib/firebase/remote-config-defaults";
import { compareTonalAnswer, segmentInputIntoSyllables } from "@/lib/tone/compare";
import {
  applyToneToSyllable,
  extractTonePattern,
  nfc,
  stripAllDiacritics,
  stripTones,
  toneOfSyllable,
} from "@/lib/tone/normalize";
import type { TonalGrading } from "@/types/ai";
import type { GlossaryEntry } from "@/types/domain";
import {
  isDialectRulesMap,
  isTonalDrill,
  isTonalGrading,
  isTrainerAssist,
  isVocabularyQuiz,
} from "@/types/guards";

const ROOT = process.cwd();
const ALL_GLOSSARY = JSON.parse(
  readFileSync(join(ROOT, "scripts/seed-data/glossary.json"), "utf8"),
) as GlossaryEntry[];

const BY_ID = new Map(ALL_GLOSSARY.map((e) => [e.entryId, e]));
const IJEBU_GLOSSARY = ALL_GLOSSARY.filter((e) => e.dialectId === "yo-ijebu");
const OWERRI_GLOSSARY = ALL_GLOSSARY.filter((e) => e.dialectId === "ig-owerri");

describe("sanitizeGenerationConfig and cloud fallback limit (T-3.4, T-3.14)", () => {
  test("removes topK, topP, penalties, and MINIMAL thinkingLevel", () => {
    const cleaned = sanitizeGenerationConfig({
      temperature: 0.4,
      topK: 40,
      topP: 0.9,
      top_k: 40,
      top_p: 0.9,
      presencePenalty: 0.2,
      frequencyPenalty: 0.1,
      thinkingConfig: { thinkingLevel: "MINIMAL" },
      responseMimeType: "application/json",
    });

    expect(cleaned).toEqual({
      temperature: 0.4,
      responseMimeType: "application/json",
    });
  });

  test("preserves non-MINIMAL thinkingConfig", () => {
    const cleaned = sanitizeGenerationConfig({
      temperature: 0.2,
      thinkingConfig: { thinkingLevel: "LOW" },
    });
    expect(cleaned).toEqual({
      temperature: 0.2,
      thinkingConfig: { thinkingLevel: "LOW" },
    });
  });

  test("enforces cloud_fallback_daily_limit and resets across UTC dates", () => {
    let memValue: string | null = null;
    setCloudFallbackTestStore({
      read: () => memValue,
      write: (s) => {
        memValue = s;
      },
      clear: () => {
        memValue = null;
      },
    });
    resetCloudFallbackUsage();

    const day1 = new Date("2026-11-15T10:00:00Z");
    const day2 = new Date("2026-11-16T01:00:00Z");

    expect(getCloudFallbackCountToday(day1)).toBe(0);
    expect(canUseCloudFallback(2, true, day1)).toBe(true);

    incrementCloudFallbackCount(day1);
    expect(getCloudFallbackCountToday(day1)).toBe(1);
    expect(canUseCloudFallback(2, true, day1)).toBe(true);

    incrementCloudFallbackCount(day1);
    expect(getCloudFallbackCountToday(day1)).toBe(2);
    expect(canUseCloudFallback(2, true, day1)).toBe(false);
    expect(canUseCloudFallback(5, false, day1)).toBe(false);

    // Next UTC day resets count to zero.
    expect(getCloudFallbackCountToday(day2)).toBe(0);
    expect(canUseCloudFallback(2, true, day2)).toBe(true);

    resetCloudFallbackUsage();
    setCloudFallbackTestStore(null);
  });

  test("resolveEffectiveDrillMode switches to only_on_device offline or when capped", () => {
    expect(
      resolveEffectiveDrillMode({
        online: true,
        cloudFallbackEnabled: true,
        withinDailyCloudLimit: true,
      }),
    ).toBe("prefer_on_device");

    expect(
      resolveEffectiveDrillMode({
        online: false,
        cloudFallbackEnabled: true,
        withinDailyCloudLimit: true,
        forceCloud: true,
      }),
    ).toBe("only_on_device");

    expect(
      resolveEffectiveDrillMode({
        online: true,
        cloudFallbackEnabled: true,
        withinDailyCloudLimit: false,
        forceCloud: true,
      }),
    ).toBe("only_on_device");

    expect(
      resolveEffectiveDrillMode({
        online: true,
        cloudFallbackEnabled: true,
        withinDailyCloudLimit: true,
        forceCloud: true,
      }),
    ).toBe("only_in_cloud");
  });
});

describe("normalizeInferenceSource and Nano SSR checks (T-3.2, T-3.3, T-3.10)", () => {
  test("maps SDK inferenceSource accurately without guessing", () => {
    expect(normalizeInferenceSource("on_device")).toBe("ON_DEVICE");
    expect(normalizeInferenceSource("ON_DEVICE")).toBe("ON_DEVICE");
    expect(normalizeInferenceSource("in_cloud")).toBe("IN_CLOUD");
    expect(normalizeInferenceSource("IN_CLOUD")).toBe("IN_CLOUD");
    expect(normalizeInferenceSource(undefined)).toBe("IN_CLOUD");
  });

  test("checkNanoAvailability returns unsupported during SSR and toNanoStatusState maps states", async () => {
    expect(await checkNanoAvailability()).toBe("unsupported");
    expect(toNanoStatusState({ state: "ready" })).toBe("ready");
    expect(toNanoStatusState({ state: "unsupported" })).toBe("unsupported");
    expect(toNanoStatusState({ state: "downloadable" })).toBe("fallback");
    expect(toNanoStatusState({ state: "downloading", progress: 0.4 })).toBe(
      "fallback",
    );
  });
});

describe("Tone normalization and minimal-pair grading (T-3.11, T-3.12)", () => {
  test("strips tone marks while preserving dot-below (U+0323)", () => {
    expect(stripTones("ọkọ̀")).toBe(nfc("ọkọ"));
    expect(stripTones("ọ̀kọ̀")).toBe(nfc("ọkọ"));
    expect(stripTones("ụ́lọ̀")).toBe(nfc("ụlọ"));
    expect(stripAllDiacritics("ọkọ̀")).toBe("oko");
  });

  test("identifies H, M, L tones and applies tones to syllables safely", () => {
    expect(toneOfSyllable("á")).toBe("H");
    expect(toneOfSyllable("kọ́")).toBe("H");
    expect(toneOfSyllable("ọ")).toBe("M");
    expect(toneOfSyllable("o\u0304")).toBe("M");
    expect(toneOfSyllable("kọ̀")).toBe("L");
    expect(extractTonePattern(["ọ", "kọ̀"])).toEqual(["M", "L"]);

    expect(applyToneToSyllable("ọ", "L")).toBe(nfc("ọ̀"));
    expect(applyToneToSyllable("kọ", "H")).toBe(nfc("kọ́"));
    expect(applyToneToSyllable("kọ̀", "M")).toBe(nfc("kọ"));
    expect(applyToneToSyllable("ko", "M", true)).toBe(nfc("ko\u0304"));
  });

  test("segments continuous and hyphenated learner input into expected syllables", () => {
    expect(segmentInputIntoSyllables("ọkọ̀", ["ọ", "kọ"])).toEqual([
      nfc("ọ"),
      nfc("kọ̀"),
    ]);
    expect(segmentInputIntoSyllables("ọ-kọ̀", ["ọ", "kọ"])).toEqual([
      nfc("ọ"),
      nfc("kọ̀"),
    ]);
    expect(segmentInputIntoSyllables("ákwà", ["á", "kwà"])).toEqual([
      nfc("á"),
      nfc("kwà"),
    ]);
  });

  test("grades Yoruba minimal-pair quartet deterministically (ọkọ, ọkọ̀, ọ̀kọ̀, oko)", () => {
    const husband = BY_ID.get("yo-ijebu-oko-husband");
    expect(husband).toBeDefined();
    if (!husband) return;

    const exact = compareTonalAnswer(husband, "ọkọ", IJEBU_GLOSSARY);
    expect(exact.isCorrect).toBe(true);
    expect(exact.score).toBe(1);
    expect(exact.syllables.every((s) => s.correct)).toBe(true);

    // Learner writes ọkọ̀ (vehicle) instead of ọkọ (husband)
    const vehicleMistake = compareTonalAnswer(husband, "ọkọ̀", IJEBU_GLOSSARY);
    expect(vehicleMistake.isCorrect).toBe(false);
    expect(vehicleMistake.score).toBe(0.5);
    expect(vehicleMistake.syllables[0]?.correct).toBe(true);
    expect(vehicleMistake.syllables[1]).toEqual({
      expected: nfc("kọ"),
      received: nfc("kọ̀"),
      expectedTone: "M",
      receivedTone: "L",
      correct: false,
    });
    expect(vehicleMistake.producedMeaningEn).toBe("vehicle (car, boat)");
    expect(vehicleMistake.feedback).toContain("vehicle");

    // Learner writes ọ̀kọ̀ (spear) instead of ọkọ (husband)
    const spearMistake = compareTonalAnswer(husband, "ọ̀kọ̀", IJEBU_GLOSSARY);
    expect(spearMistake.isCorrect).toBe(false);
    expect(spearMistake.score).toBe(0);
    expect(spearMistake.producedMeaningEn).toBe("spear");

    // Learner omits sub-dots and writes oko (farm) instead of ọkọ (husband)
    const subdotMistake = compareTonalAnswer(husband, "oko", IJEBU_GLOSSARY);
    expect(subdotMistake.isCorrect).toBe(false);
    expect(subdotMistake.score).toBe(0);
    expect(subdotMistake.producedMeaningEn).toBe("farm");
    expect(subdotMistake.feedback.toLowerCase()).toContain("sub-dot");
  });

  test("grades Igbo minimal-pair trio deterministically (ákwà, ákwá, àkwá)", () => {
    const cloth = BY_ID.get("ig-owerri-akwa-cloth");
    expect(cloth).toBeDefined();
    if (!cloth) return;

    expect(compareTonalAnswer(cloth, "ákwà", OWERRI_GLOSSARY).isCorrect).toBe(
      true,
    );

    const wroteEgg = compareTonalAnswer(cloth, "àkwá", OWERRI_GLOSSARY);
    expect(wroteEgg.isCorrect).toBe(false);
    expect(wroteEgg.score).toBe(0);
    expect(wroteEgg.producedMeaningEn).toBe("egg");
  });
});

describe("Schemas, runtime guards, grounding, and fallback generators (T-3.5, T-3.7, T-3.8, T-3.13)", () => {
  test("exports non-empty Schema.object contracts and validates dialect_rules_json default", () => {
    expect(VocabularyQuizSchema).toBeDefined();
    expect(TonalDrillSchema).toBeDefined();
    expect(TonalGradingSchema).toBeDefined();
    expect(TrainerAssistSchema).toBeDefined();

    const parsedRules: unknown = JSON.parse(
      REMOTE_CONFIG_DEFAULTS.dialect_rules_json,
    );
    expect(isDialectRulesMap(parsedRules)).toBe(true);
    expect(
      formatDialectRulesBlock(
        "yo-ijebu",
        REMOTE_CONFIG_DEFAULTS.dialect_rules_json,
      ),
    ).toContain("Ijebu Yoruba");
  });

  test("selectGroundingEntries prioritizes scenario and weakest tones and serializes compact JSON", () => {
    const selected = selectGroundingEntries(ALL_GLOSSARY, {
      dialectId: "yo-ijebu",
      scenarioId: "yo-ijebu-elder-greeting",
      maxEntries: 6,
      weakestTones: ["L"],
    });

    expect(selected.length).toBe(6);
    expect(selected.every((e) => e.dialectId === "yo-ijebu")).toBe(true);

    const quizPrompt = buildQuizPrompt(selected, 5, "yo-ijebu");
    const tonePrompt = buildTonalDrillPrompt(selected, 5, "yo-ijebu");
    expect(quizPrompt).toContain(serializeGroundingContext(selected));
    expect(tonePrompt).toContain("DIALECT_ID: yo-ijebu");
  });

  test("fallback vocabulary quiz and tonal drill satisfy runtime guards with allowedEntryIds", () => {
    const allowedIds = new Set(IJEBU_GLOSSARY.map((e) => e.entryId));
    const fallbackQuiz = buildFallbackVocabularyQuiz(
      "yo-ijebu",
      IJEBU_GLOSSARY,
      5,
    );
    const fallbackDrill = buildFallbackTonalDrill(
      "yo-ijebu",
      IJEBU_GLOSSARY,
      5,
    );

    expect(fallbackQuiz.questions.length).toBe(5);
    expect(isVocabularyQuiz(fallbackQuiz, allowedIds)).toBe(true);

    expect(fallbackDrill.items.length).toBe(5);
    expect(isTonalDrill(fallbackDrill, allowedIds)).toBe(true);

    // Reject hallucinated glossaryEntryId
    const hallucinated = {
      ...fallbackQuiz,
      questions: fallbackQuiz.questions.map((q, idx) =>
        idx === 0 ? { ...q, glossaryEntryId: "non-existent-word" } : q,
      ),
    };
    expect(isVocabularyQuiz(hallucinated, allowedIds)).toBe(false);
    expect(isTonalDrill({ dialectId: "yo-ijebu", items: [] }, allowedIds)).toBe(
      false,
    );
  });

  test("validates TrainerAssist and TonalGrading runtime guards", () => {
    expect(
      isTrainerAssist({
        syllables: ["ẹ", "kàá", "bọ̀"],
        suggestedTonePattern: ["M", "H", "L"],
        warnings: [],
      }),
    ).toBe(true);
    expect(
      isTrainerAssist({
        syllables: ["ẹ", "kàá"],
        suggestedTonePattern: ["M"],
        warnings: [],
      }),
    ).toBe(false);
  });

  test("runGuardedGeneration handles ON_DEVICE pass, 1x retry recovery, and CACHED_FALLBACK", async () => {
    const allowedIds = new Set(IJEBU_GLOSSARY.map((e) => e.entryId));
    const validQuiz = buildFallbackVocabularyQuiz("yo-ijebu", IJEBU_GLOSSARY, 4);

    // 1. Direct ON_DEVICE pass
    const direct = await runGuardedGeneration({
      prompt: "test",
      invokeModel: async () => ({
        text: JSON.stringify(validQuiz),
        inferenceSource: "on_device",
      }),
      guard: (v): v is typeof validQuiz => isVocabularyQuiz(v, allowedIds),
      buildFallback: () => validQuiz,
    });
    expect(direct.source).toBe("ON_DEVICE");
    expect(direct.retried).toBe(false);

    // 2. Malformed first output, recovered on retry with IN_CLOUD counter increment
    let calls = 0;
    let cloudCounter = 0;
    const recovered = await runGuardedGeneration({
      prompt: "test",
      invokeModel: async () => {
        calls += 1;
        if (calls === 1) {
          return { text: "{broken json", inferenceSource: "in_cloud" };
        }
        return { text: JSON.stringify(validQuiz), inferenceSource: "in_cloud" };
      },
      guard: (v): v is typeof validQuiz => isVocabularyQuiz(v, allowedIds),
      buildFallback: () => validQuiz,
      onCloudCall: () => {
        cloudCounter += 1;
      },
    });
    expect(recovered.source).toBe("IN_CLOUD");
    expect(recovered.retried).toBe(true);
    expect(calls).toBe(2);
    expect(cloudCounter).toBe(2);

    // 3. Double failure falls back to CACHED_FALLBACK
    const fellBack = await runGuardedGeneration({
      prompt: "test",
      invokeModel: async () => ({
        text: JSON.stringify({
          ...validQuiz,
          questions: [
            { ...validQuiz.questions[0], glossaryEntryId: "hallucinated-id" },
          ],
        }),
        inferenceSource: "on_device",
      }),
      guard: (v): v is typeof validQuiz => isVocabularyQuiz(v, allowedIds),
      buildFallback: () => validQuiz,
    });
    expect(fellBack.source).toBe("CACHED_FALLBACK");
    expect(fellBack.retried).toBe(true);
    expect(fellBack.data).toEqual(validQuiz);
  });

  test("mergeDeterministicAndModelGrading prevents quantized models from overturning correctness (D-004)", () => {
    const husband = BY_ID.get("yo-ijebu-oko-husband");
    expect(husband).toBeDefined();
    if (!husband) return;

    const deterministic = compareTonalAnswer(husband, "ọkọ̀", IJEBU_GLOSSARY);
    const gradingPrompt = buildGradingPrompt(husband, "ọkọ̀", deterministic);
    expect(gradingPrompt).toContain("DETERMINISTIC_GROUND_TRUTH");

    const hallucinatedModelOutput: TonalGrading = {
      isCorrect: true,
      score: 1,
      syllables: deterministic.syllables.map((s) => ({ ...s, correct: true })),
      producedMeaningEn: "",
      feedback: "Good try, notice the low tone on kọ̀ changes husband to vehicle.",
    };

    const merged = mergeDeterministicAndModelGrading(
      deterministic,
      hallucinatedModelOutput,
    );
    expect(isTonalGrading(merged)).toBe(true);
    expect(merged.isCorrect).toBe(false);
    expect(merged.score).toBe(0.5);
    expect(merged.syllables).toEqual(deterministic.syllables);
    expect(merged.producedMeaningEn).toBe("vehicle (car, boat)");
    expect(merged.feedback).toBe(hallucinatedModelOutput.feedback);
  });
});
