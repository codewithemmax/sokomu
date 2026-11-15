import type {
  QuestionType,
  TonalDrill,
  TonalDrillItem,
  TrainerAssist,
  VocabularyQuestion,
  VocabularyQuiz,
} from "@/types/ai";
import type { DialectId, GlossaryEntry } from "@/types/domain";
import {
  extractTonePattern,
  nfc,
  splitGraphemeClusters,
  stripAllDiacritics,
  stripTones,
} from "@/lib/tone/normalize";

const FALLBACK_ENGLISH_DISTRACTORS = [
  "morning greeting",
  "clay cooking pot",
  "market basket",
  "courtyard path",
] as const;

const FALLBACK_WORD_DISTRACTORS = [
  "ilẹ̀",
  "ọjà",
  "omi",
  "ọ̀nà",
] as const;

function buildOptionsArray(
  correctValue: string,
  candidatePool: readonly string[],
  fallbackPool: readonly string[],
  correctIndex: 0 | 1 | 2 | 3,
): [string, string, string, string] {
  const distractors: string[] = [];
  const seen = new Set<string>([correctValue.toLowerCase()]);

  for (const item of [...candidatePool, ...fallbackPool]) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(trimmed);
    if (distractors.length === 3) break;
  }

  let padIndex = 1;
  while (distractors.length < 3) {
    const pad = `Option ${padIndex}`;
    padIndex += 1;
    if (!seen.has(pad.toLowerCase())) {
      seen.add(pad.toLowerCase());
      distractors.push(pad);
    }
  }

  const slots: [string, string, string, string] = ["", "", "", ""];
  let distractorCursor = 0;
  for (let i = 0; i < 4; i += 1) {
    if (i === correctIndex) {
      slots[i] = correctValue;
    } else {
      slots[i] = distractors[distractorCursor] ?? "";
      distractorCursor += 1;
    }
  }
  return slots;
}

export function buildFallbackVocabularyQuiz(
  dialectId: DialectId,
  entries: readonly GlossaryEntry[],
  count = 5,
): VocabularyQuiz {
  const scoped = entries.filter((e) => e.dialectId === dialectId);
  const sourceEntries = scoped.length > 0 ? scoped : entries;
  const targetCount = Math.min(Math.max(0, count), sourceEntries.length);

  const questions: VocabularyQuestion[] = [];

  for (let i = 0; i < targetCount; i += 1) {
    const entry = sourceEntries[i];
    if (!entry) continue;

    const headword = nfc(entry.headword);
    const standard = entry.standardForm ? nfc(entry.standardForm) : null;
    const hasDialectShift = standard !== null && standard !== headword;

    const type: QuestionType =
      hasDialectShift && i % 3 === 2
        ? "dialect_to_standard"
        : i % 2 === 0
          ? "word_to_meaning"
          : "meaning_to_word";

    const correctIndex = (i % 4) as 0 | 1 | 2 | 3;

    let prompt = "";
    let options: [string, string, string, string];
    let explanation = "";

    if (type === "word_to_meaning") {
      prompt = `What does "${headword}" mean in English?`;
      const otherMeanings = sourceEntries
        .filter((other) => other.entryId !== entry.entryId)
        .map((other) => other.glossEn);
      options = buildOptionsArray(
        entry.glossEn,
        otherMeanings,
        FALLBACK_ENGLISH_DISTRACTORS,
        correctIndex,
      );
      explanation = `"${headword}" means "${entry.glossEn}" in this dialect.`;
    } else if (type === "dialect_to_standard" && standard) {
      prompt = `What is the standard form corresponding to "${headword}" (${entry.glossEn})?`;
      const otherStandards = sourceEntries
        .filter((other) => other.entryId !== entry.entryId)
        .map((other) => nfc(other.standardForm ?? other.headword));
      options = buildOptionsArray(
        standard,
        otherStandards,
        FALLBACK_WORD_DISTRACTORS,
        correctIndex,
      );
      explanation = `Regional "${headword}" corresponds to "${standard}" (${entry.glossEn}).`;
    } else {
      prompt = `Which written form correctly means "${entry.glossEn}"?`;
      const otherWords = sourceEntries
        .filter((other) => other.entryId !== entry.entryId)
        .map((other) => nfc(other.headword));
      options = buildOptionsArray(
        headword,
        otherWords,
        FALLBACK_WORD_DISTRACTORS,
        correctIndex,
      );
      explanation = `"${headword}" carries the right spelling and tone pattern (${entry.tonePattern.join("-")}) for "${entry.glossEn}".`;
    }

    questions.push({
      id: `fallback-q-${i + 1}-${entry.entryId}`,
      type,
      prompt,
      options,
      correctIndex,
      glossaryEntryId: entry.entryId,
      explanation,
    });
  }

  return { dialectId, questions };
}

export function buildFallbackTonalDrill(
  dialectId: DialectId,
  entries: readonly GlossaryEntry[],
  count = 5,
): TonalDrill {
  const scoped = entries.filter((e) => e.dialectId === dialectId);
  const pool = scoped.length > 0 ? scoped : entries;

  const prioritized = [...pool].sort((a, b) => {
    const aHasToneContrast = a.tonePattern.some((t) => t === "H" || t === "L")
      ? 1
      : 0;
    const bHasToneContrast = b.tonePattern.some((t) => t === "H" || t === "L")
      ? 1
      : 0;
    return bHasToneContrast - aHasToneContrast;
  });

  const targetCount = Math.min(Math.max(0, count), prioritized.length);
  const items: TonalDrillItem[] = [];

  for (let i = 0; i < targetCount; i += 1) {
    const entry = prioritized[i];
    if (!entry) continue;

    const hintSyllables = entry.syllables.map((s) => stripTones(s)).join("-");
    items.push({
      id: `fallback-tone-${i + 1}-${entry.entryId}`,
      glossaryEntryId: entry.entryId,
      instruction: `Write "${entry.glossEn}" with full tone marks and sub-dots.`,
      meaningEn: entry.glossEn,
      syllableCount: entry.syllables.length,
      expectedTonePattern: [...entry.tonePattern],
      hint: hintSyllables,
    });
  }

  return { dialectId, items };
}

function isVowelCluster(cluster: string): boolean {
  const base = stripAllDiacritics(cluster).toLowerCase();
  return base === "a" || base === "e" || base === "i" || base === "o" || base === "u";
}

function hasExplicitToneNasal(cluster: string): boolean {
  const plain = stripTones(cluster);
  const base = stripAllDiacritics(cluster).toLowerCase();
  return (base === "n" || base === "m") && plain !== nfc(cluster);
}

/**
 * Splits a Nigerian language headword into approximate syllables for TrainerAssist fallback.
 */
export function segmentSyllablesHeuristic(headword: string): string[] {
  const normalized = nfc(headword).trim();
  if (!normalized) return [];

  const tokens = normalized.split(/[\s-]+/).filter(Boolean);
  const out: string[] = [];

  for (const token of tokens) {
    const clusters = splitGraphemeClusters(token);
    let current = "";
    for (const cluster of clusters) {
      current += cluster;
      if (isVowelCluster(cluster) || hasExplicitToneNasal(cluster)) {
        out.push(current);
        current = "";
      }
    }
    if (current) {
      if (out.length > 0 && tokens.length === 1) {
        out[out.length - 1] = `${out[out.length - 1]}${current}`;
      } else if (out.length > 0 && !current.includes("'") && current.length <= 2) {
        out[out.length - 1] = `${out[out.length - 1]}${current}`;
      } else {
        out.push(current);
      }
    }
  }

  return out.length > 0 ? out : [normalized];
}

/**
 * Deterministic orthography and tone check fallback when on-device and cloud AI are unavailable.
 */
export function buildFallbackTrainerAssist(
  headword: string,
  dialectId: DialectId,
): TrainerAssist {
  const trimmedRaw = headword.trim();
  const normalized = nfc(trimmedRaw);
  const syllables = segmentSyllablesHeuristic(normalized);
  const safeSyllables = syllables.length > 0 ? syllables : [normalized || "?"];
  const suggestedTonePattern = extractTonePattern(safeSyllables);

  const warnings: string[] = [];
  if (trimmedRaw !== normalized) {
    warnings.push(
      "Input contained decomposed diacritics; saved entries normalize to Unicode NFC.",
    );
  }
  const isTonal = dialectId.startsWith("yo-") || dialectId.startsWith("ig-");
  if (
    isTonal &&
    normalized.length > 0 &&
    suggestedTonePattern.every((tone) => tone === "M")
  ) {
    warnings.push(
      "No acute (high) or grave (low) tone marks detected; verify whether all syllables are mid tone.",
    );
  }

  return {
    syllables: safeSyllables,
    suggestedTonePattern,
    warnings,
  };
}
