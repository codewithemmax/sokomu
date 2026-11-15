import { Schema } from "firebase/ai";

export const toneEnum = Schema.enumString({ enum: ["H", "M", "L"] });

export const VocabularyQuizSchema = Schema.object({
  properties: {
    dialectId: Schema.string(),
    questions: Schema.array({
      items: Schema.object({
        properties: {
          id: Schema.string(),
          type: Schema.enumString({
            enum: ["meaning_to_word", "word_to_meaning", "dialect_to_standard"],
          }),
          prompt: Schema.string({
            description: "Question shown to the learner, in English",
          }),
          options: Schema.array({
            items: Schema.string(),
            description: "Exactly 4 options",
          }),
          correctIndex: Schema.integer({ description: "0 to 3" }),
          glossaryEntryId: Schema.string({
            description: "Must be an entryId from CONTEXT",
          }),
          explanation: Schema.string({
            description: "One respectful sentence",
          }),
        },
      }),
    }),
  },
});

export const TonalDrillSchema = Schema.object({
  properties: {
    dialectId: Schema.string(),
    items: Schema.array({
      items: Schema.object({
        properties: {
          id: Schema.string(),
          glossaryEntryId: Schema.string(),
          instruction: Schema.string(),
          meaningEn: Schema.string(),
          syllableCount: Schema.integer(),
          expectedTonePattern: Schema.array({ items: toneEnum }),
          hint: Schema.string(),
        },
        optionalProperties: ["hint"],
      }),
    }),
  },
});

export const TonalGradingSchema = Schema.object({
  properties: {
    isCorrect: Schema.boolean(),
    score: Schema.number({ description: "0 to 1" }),
    syllables: Schema.array({
      items: Schema.object({
        properties: {
          expected: Schema.string(),
          received: Schema.string(),
          expectedTone: toneEnum,
          receivedTone: Schema.enumString({ enum: ["H", "M", "L", "NONE"] }),
          correct: Schema.boolean(),
        },
      }),
    }),
    producedMeaningEn: Schema.string({
      description: "Meaning of what the learner wrote if it is a known word, else empty",
    }),
    feedback: Schema.string({
      description: "Max 2 sentences, respectful, explains meaning change",
    }),
  },
});

export const TrainerAssistSchema = Schema.object({
  properties: {
    syllables: Schema.array({ items: Schema.string() }),
    suggestedTonePattern: Schema.array({ items: toneEnum }),
    warnings: Schema.array({ items: Schema.string() }),
  },
});
