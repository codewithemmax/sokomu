import type {
  DialectRulesMap,
  QuestionType,
  SyllableGrade,
  TonalDrill,
  TonalDrillItem,
  TonalGrading,
  TrainerAssist,
  VocabularyQuestion,
  VocabularyQuiz,
} from "./ai";
import type { DialectId, Tone } from "./domain";

const DIALECT_IDS: readonly DialectId[] = [
  "yo-ijebu",
  "yo-ekiti",
  "yo-ondo",
  "ig-owerri",
  "ig-onitsha",
  "ig-ikwerre",
  "ha-kano",
  "pcm-lagos",
];

export const VALID_DIALECT_IDS: ReadonlySet<DialectId> = new Set<DialectId>(DIALECT_IDS);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function isDialectId(v: unknown): v is DialectId {
  return typeof v === "string" && VALID_DIALECT_IDS.has(v as DialectId);
}

export function isTone(v: unknown): v is Tone {
  return v === "H" || v === "M" || v === "L";
}

export function isReceivedTone(v: unknown): v is Tone | "NONE" {
  return isTone(v) || v === "NONE";
}

export function isQuestionType(v: unknown): v is QuestionType {
  return (
    v === "meaning_to_word" ||
    v === "word_to_meaning" ||
    v === "dialect_to_standard"
  );
}

function isVocabularyQuestion(
  v: unknown,
  allowedEntryIds?: ReadonlySet<string>,
): v is VocabularyQuestion {
  if (!isRecord(v)) return false;
  if (!isNonEmptyString(v.id) || !isQuestionType(v.type) || !isNonEmptyString(v.prompt)) {
    return false;
  }
  if (
    !Array.isArray(v.options) ||
    v.options.length !== 4 ||
    !v.options.every((opt) => isNonEmptyString(opt))
  ) {
    return false;
  }
  if (
    typeof v.correctIndex !== "number" ||
    !Number.isInteger(v.correctIndex) ||
    v.correctIndex < 0 ||
    v.correctIndex > 3
  ) {
    return false;
  }
  if (!isNonEmptyString(v.glossaryEntryId)) {
    return false;
  }
  if (allowedEntryIds && !allowedEntryIds.has(v.glossaryEntryId)) {
    return false;
  }
  return isNonEmptyString(v.explanation);
}

export function isVocabularyQuiz(
  v: unknown,
  allowedEntryIds?: ReadonlySet<string>,
): v is VocabularyQuiz {
  if (!isRecord(v) || !isDialectId(v.dialectId)) {
    return false;
  }
  if (!Array.isArray(v.questions) || v.questions.length === 0) {
    return false;
  }
  return v.questions.every((q) => isVocabularyQuestion(q, allowedEntryIds));
}

function isTonalDrillItem(
  v: unknown,
  allowedEntryIds?: ReadonlySet<string>,
): v is TonalDrillItem {
  if (!isRecord(v)) return false;
  if (!isNonEmptyString(v.id) || !isNonEmptyString(v.glossaryEntryId)) {
    return false;
  }
  if (allowedEntryIds && !allowedEntryIds.has(v.glossaryEntryId)) {
    return false;
  }
  if (!isNonEmptyString(v.instruction) || !isNonEmptyString(v.meaningEn)) {
    return false;
  }
  if (
    typeof v.syllableCount !== "number" ||
    !Number.isInteger(v.syllableCount) ||
    v.syllableCount <= 0
  ) {
    return false;
  }
  if (
    !Array.isArray(v.expectedTonePattern) ||
    v.expectedTonePattern.length !== v.syllableCount ||
    !v.expectedTonePattern.every((t) => isTone(t))
  ) {
    return false;
  }
  if (v.hint !== undefined && typeof v.hint !== "string") {
    return false;
  }
  return true;
}

export function isTonalDrill(
  v: unknown,
  allowedEntryIds?: ReadonlySet<string>,
): v is TonalDrill {
  if (!isRecord(v) || !isDialectId(v.dialectId)) {
    return false;
  }
  if (!Array.isArray(v.items) || v.items.length === 0) {
    return false;
  }
  return v.items.every((item) => isTonalDrillItem(item, allowedEntryIds));
}

function isSyllableGrade(v: unknown): v is SyllableGrade {
  if (!isRecord(v)) return false;
  return (
    typeof v.expected === "string" &&
    typeof v.received === "string" &&
    isTone(v.expectedTone) &&
    isReceivedTone(v.receivedTone) &&
    typeof v.correct === "boolean"
  );
}

export function isTonalGrading(v: unknown): v is TonalGrading {
  if (!isRecord(v)) return false;
  if (typeof v.isCorrect !== "boolean") return false;
  if (
    typeof v.score !== "number" ||
    !Number.isFinite(v.score) ||
    v.score < 0 ||
    v.score > 1
  ) {
    return false;
  }
  if (
    !Array.isArray(v.syllables) ||
    v.syllables.length === 0 ||
    !v.syllables.every((s) => isSyllableGrade(s))
  ) {
    return false;
  }
  if (typeof v.producedMeaningEn !== "string") return false;
  return isNonEmptyString(v.feedback);
}

export function isTrainerAssist(v: unknown): v is TrainerAssist {
  if (!isRecord(v)) return false;
  if (
    !Array.isArray(v.syllables) ||
    v.syllables.length === 0 ||
    !v.syllables.every((s) => isNonEmptyString(s))
  ) {
    return false;
  }
  if (
    !Array.isArray(v.suggestedTonePattern) ||
    v.suggestedTonePattern.length !== v.syllables.length ||
    !v.suggestedTonePattern.every((t) => isTone(t))
  ) {
    return false;
  }
  return Array.isArray(v.warnings) && v.warnings.every((w) => typeof w === "string");
}

export function isDialectRulesMap(v: unknown): v is DialectRulesMap {
  if (!isRecord(v)) return false;
  for (const dialectId of DIALECT_IDS) {
    const entry = v[dialectId];
    if (!isRecord(entry)) return false;
    if (!isNonEmptyString(entry.name)) return false;
    if (
      !Array.isArray(entry.rules) ||
      !entry.rules.every((r) => isNonEmptyString(r))
    ) {
      return false;
    }
  }
  return true;
}
