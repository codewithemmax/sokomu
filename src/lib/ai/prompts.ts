import type { TonalGrading } from "@/types/ai";
import type { DialectId, GlossaryEntry } from "@/types/domain";
import { isDialectRulesMap } from "@/types/guards";
import { nfc } from "@/lib/tone/normalize";
import { serializeGroundingContext } from "./grounding";

export function formatDialectRulesBlock(
  dialectId: DialectId,
  dialectRulesJson: string,
): string {
  try {
    const parsed: unknown = JSON.parse(dialectRulesJson);
    if (isDialectRulesMap(parsed)) {
      const ruleEntry = parsed[dialectId];
      if (ruleEntry) {
        return `Dialect: ${ruleEntry.name} (${dialectId})\nRules:\n- ${ruleEntry.rules.join("\n- ")}`;
      }
    }
  } catch {
    // Ignore malformed Remote Config JSON and fall back to dialectId label.
  }
  return `Dialect: ${dialectId}`;
}

export function buildQuizPrompt(
  entries: readonly GlossaryEntry[],
  count: number,
  dialectId?: DialectId,
): string {
  const resolvedDialect = dialectId ?? entries[0]?.dialectId ?? "yo-ijebu";
  const contextJson = serializeGroundingContext(entries);
  return `CONTEXT:\n${contextJson}\n\nDIALECT_ID: ${resolvedDialect}\nTASK: Create ${count} vocabulary quiz questions using ONLY entryIds in CONTEXT.`;
}

export function buildTonalDrillPrompt(
  entries: readonly GlossaryEntry[],
  count: number,
  dialectId?: DialectId,
): string {
  const resolvedDialect = dialectId ?? entries[0]?.dialectId ?? "yo-ijebu";
  const contextJson = serializeGroundingContext(entries);
  return `CONTEXT:\n${contextJson}\n\nDIALECT_ID: ${resolvedDialect}\nTASK: Create ${count} tonal drill items using ONLY entryIds in CONTEXT.`;
}

export function buildGradingPrompt(
  entry: GlossaryEntry,
  learnerAnswer: string,
  deterministicGrade: TonalGrading,
): string {
  const entryPayload = {
    entryId: nfc(entry.entryId),
    dialectId: entry.dialectId,
    headword: nfc(entry.headword),
    glossEn: entry.glossEn,
    syllables: entry.syllables.map(nfc),
    tonePattern: entry.tonePattern,
  };

  return [
    `ENTRY:\n${JSON.stringify(entryPayload)}`,
    `LEARNER_ANSWER: ${nfc(learnerAnswer)}`,
    `DETERMINISTIC_GROUND_TRUTH:\n${JSON.stringify(deterministicGrade)}`,
    "TASK: Return JSON matching TonalGradingSchema while keeping isCorrect, score, and syllable grades aligned to DETERMINISTIC_GROUND_TRUTH.",
  ].join("\n\n");
}

export function buildTrainerAssistPrompt(
  headword: string,
  glossEn: string,
  dialectId: DialectId,
): string {
  return `DATA:\n${JSON.stringify({ dialectId, headword: nfc(headword), glossEn })}\n\nTASK: Segment headword into syllables, suggest tonePattern using H, M, L, and list any orthography warnings.`;
}
