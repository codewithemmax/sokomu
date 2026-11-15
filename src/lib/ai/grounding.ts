import type { DialectId, GlossaryEntry, Tone } from "@/types/domain";
import { nfc } from "@/lib/tone/normalize";

export interface GroundingSelectOptions {
  dialectId: DialectId;
  scenarioId?: string;
  maxEntries?: number;
  weakestTones?: readonly Tone[];
}

function scoreEntryRelevance(
  entry: GlossaryEntry,
  options: GroundingSelectOptions,
): number {
  let score = 0;
  if (options.scenarioId && entry.scenarioIds.includes(options.scenarioId)) {
    score += 100;
  }
  if (options.weakestTones && options.weakestTones.length > 0) {
    const weakSet = new Set<Tone>(options.weakestTones);
    const matchingWeak = entry.tonePattern.filter((tone) => weakSet.has(tone)).length;
    score += matchingWeak * 10;
  }
  if (entry.verified) {
    score += 5;
  }
  if (entry.standardForm && entry.standardForm !== entry.headword) {
    score += 2;
  }
  return score;
}

export function selectGroundingEntries(
  entries: readonly GlossaryEntry[],
  options: GroundingSelectOptions,
): GlossaryEntry[] {
  const maxEntries = Math.max(1, options.maxEntries ?? 12);
  const dialectEntries = entries.filter(
    (entry) => entry.dialectId === options.dialectId,
  );

  const ranked = [...dialectEntries].sort((a, b) => {
    const diff = scoreEntryRelevance(b, options) - scoreEntryRelevance(a, options);
    if (diff !== 0) return diff;
    return a.entryId.localeCompare(b.entryId);
  });

  return ranked.slice(0, maxEntries);
}

export function serializeGroundingContext(
  entries: readonly GlossaryEntry[],
): string {
  const compact = entries.map((e) => ({
    entryId: nfc(e.entryId),
    headword: nfc(e.headword),
    standardForm: e.standardForm ? nfc(e.standardForm) : null,
    glossEn: e.glossEn,
    syllables: e.syllables.map(nfc),
    tonePattern: e.tonePattern,
    example: e.example
      ? {
          text: nfc(e.example.text),
          translation: e.example.translation,
        }
      : null,
  }));
  return JSON.stringify(compact);
}
