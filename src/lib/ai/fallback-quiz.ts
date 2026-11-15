import type {
  QuestionType,
  TonalDrill,
  TonalDrillItem,
  VocabularyQuestion,
  VocabularyQuiz,
} from "@/types/ai";
import type { DialectId, GlossaryEntry } from "@/types/domain";
import { nfc, stripTones } from "@/lib/tone/normalize";

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
