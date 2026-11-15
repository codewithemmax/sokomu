import type { SyllableGrade, TonalGrading } from "@/types/ai";
import type { GlossaryEntry, Tone } from "@/types/domain";
import {
  nfc,
  splitGraphemeClusters,
  stripAllDiacritics,
  stripTones,
  toneOfSyllable,
} from "./normalize";

export function segmentInputIntoSyllables(
  input: string,
  expectedSyllables: readonly string[],
): string[] {
  const cleaned = nfc(input.trim());
  if (expectedSyllables.length <= 1) {
    return [cleaned];
  }

  const explicitParts = cleaned.split(/[\s-]+/).filter(Boolean);
  if (explicitParts.length === expectedSyllables.length) {
    return explicitParts.map(nfc);
  }

  const compact = cleaned.replace(/[\s-]+/g, "");
  const inputGraphemes = splitGraphemeClusters(compact);
  const result: string[] = [];
  let cursor = 0;

  for (let i = 0; i < expectedSyllables.length; i += 1) {
    const expectedLen = Math.max(
      1,
      splitGraphemeClusters(expectedSyllables[i] ?? "").length,
    );
    const isLast = i === expectedSyllables.length - 1;
    const slice = isLast
      ? inputGraphemes.slice(cursor)
      : inputGraphemes.slice(cursor, cursor + expectedLen);
    cursor += slice.length;
    result.push(nfc(slice.join("")));
  }

  return result;
}

function buildDeterministicFeedback(params: {
  entry: GlossaryEntry;
  learnerTrimmed: string;
  isCorrect: boolean;
  syllables: readonly SyllableGrade[];
  producedMeaningEn: string;
}): string {
  const { entry, learnerTrimmed, isCorrect, syllables, producedMeaningEn } = params;
  const targetWord = nfc(entry.headword);

  if (isCorrect) {
    return `Correct. "${targetWord}" (${entry.glossEn}) matches all syllables and tones.`;
  }

  if (!learnerTrimmed) {
    return `Enter "${targetWord}" (${entry.glossEn}) using exact tone marks and sub-dots.`;
  }

  const missingSubdots =
    stripAllDiacritics(targetWord).toLowerCase() ===
      stripAllDiacritics(learnerTrimmed).toLowerCase() &&
    stripTones(targetWord).toLowerCase() !==
      stripTones(learnerTrimmed).toLowerCase();

  if (producedMeaningEn) {
    if (missingSubdots) {
      return `You wrote "${learnerTrimmed}" (${producedMeaningEn}) without sub-dots instead of "${targetWord}" (${entry.glossEn}). Add the required underdots and tones.`;
    }
    return `You wrote "${learnerTrimmed}" (${producedMeaningEn}) instead of "${targetWord}" (${entry.glossEn}). Check each syllable's tone mark.`;
  }

  if (missingSubdots) {
    return `Your base letters match, but "${targetWord}" (${entry.glossEn}) requires sub-dots under the marked vowels or consonants.`;
  }

  const firstMismatchIndex = syllables.findIndex((s) => !s.correct);
  if (firstMismatchIndex >= 0) {
    const mis = syllables[firstMismatchIndex];
    const sylNum = firstMismatchIndex + 1;
    if (mis && mis.expectedTone !== mis.receivedTone) {
      return `Syllable ${sylNum} expected tone ${mis.expectedTone} ("${mis.expected}"), not "${mis.received || "missing"}" (${mis.receivedTone}).`;
    }
    if (mis) {
      return `Syllable ${sylNum} expected "${mis.expected}", not "${mis.received || "missing"}".`;
    }
  }

  return `Not quite. Expected "${targetWord}" (${entry.glossEn}).`;
}

export function compareTonalAnswer(
  entry: GlossaryEntry,
  learnerInput: string,
  dialectGlossary: readonly GlossaryEntry[] = [],
): TonalGrading {
  const expectedSyllables = entry.syllables;
  const receivedSyllables = segmentInputIntoSyllables(
    learnerInput,
    expectedSyllables,
  );

  const grades: SyllableGrade[] = expectedSyllables.map((rawExpected, index) => {
    const expected = nfc(rawExpected);
    const received = nfc(receivedSyllables[index] ?? "");
    const expectedTone: Tone = entry.tonePattern[index] ?? toneOfSyllable(expected);
    const receivedTone: Tone | "NONE" =
      received.length === 0 ? "NONE" : toneOfSyllable(received);

    const baseMatches =
      stripTones(expected).toLowerCase() === stripTones(received).toLowerCase();
    const toneMatches = receivedTone === expectedTone;

    return {
      expected,
      received,
      expectedTone,
      receivedTone,
      correct: baseMatches && toneMatches,
    };
  });

  const correctCount = grades.filter((g) => g.correct).length;
  const score =
    grades.length > 0 ? Math.round((correctCount / grades.length) * 100) / 100 : 0;
  const isCorrect = grades.length > 0 && grades.every((g) => g.correct);

  const learnerTrimmed = nfc(learnerInput.trim());
  let producedMeaningEn = "";

  if (!isCorrect && learnerTrimmed.length > 0) {
    const matchedOther = dialectGlossary.find(
      (candidate) =>
        candidate.dialectId === entry.dialectId &&
        candidate.entryId !== entry.entryId &&
        nfc(candidate.headword).toLowerCase() === learnerTrimmed.toLowerCase(),
    );
    if (matchedOther) {
      producedMeaningEn = matchedOther.glossEn;
    }
  }

  const feedback = buildDeterministicFeedback({
    entry,
    learnerTrimmed,
    isCorrect,
    syllables: grades,
    producedMeaningEn,
  });

  return {
    isCorrect,
    score,
    syllables: grades,
    producedMeaningEn,
    feedback,
  };
}
