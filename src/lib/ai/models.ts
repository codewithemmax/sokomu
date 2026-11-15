"use client";

import {
  getGenerativeModel,
  getTemplateGenerativeModel,
  InferenceMode,
  ResponseModality,
  type GenerativeModel,
  type TemplateGenerativeModel,
  type TypedSchema,
} from "firebase/ai";
import { getFirebase } from "@/lib/firebase/client";
import { rcNumber, rcString } from "@/lib/firebase/remote-config";
import type { DrillMode } from "@/types/ai";
import { sanitizeGenerationConfig } from "./config";

export function toInferenceMode(mode: DrillMode): InferenceMode {
  switch (mode) {
    case "only_on_device":
      return InferenceMode.ONLY_ON_DEVICE;
    case "only_in_cloud":
      return InferenceMode.ONLY_IN_CLOUD;
    default:
      return InferenceMode.PREFER_ON_DEVICE;
  }
}

export interface StructuredModelOptions {
  mode: DrillMode;
  schema: TypedSchema;
  systemInstructionKey:
    | "ai_system_instruction_quiz"
    | "ai_system_instruction_tone"
    | "ai_system_instruction_grading";
  temperatureKey: "ai_drill_temperature" | "ai_grading_temperature";
  dialectRules: string;
}

export function getStructuredModel(
  opts: StructuredModelOptions,
): GenerativeModel {
  const { ai, remoteConfig } = getFirebase();
  const baseInstruction = rcString(remoteConfig, opts.systemInstructionKey);
  const systemInstruction = `${baseInstruction}\n\nDIALECT RULES:\n${opts.dialectRules}`;
  const temperature = rcNumber(remoteConfig, opts.temperatureKey);

  return getGenerativeModel(ai, {
    mode: toInferenceMode(opts.mode),
    inCloudParams: {
      model: rcString(remoteConfig, "ai_cloud_text_model"),
      systemInstruction,
      generationConfig: sanitizeGenerationConfig({
        temperature,
        responseMimeType: "application/json",
        responseSchema: opts.schema,
      }),
    },
    onDeviceParams: {
      createOptions: {
        initialPrompts: [
          {
            role: "system",
            content: [{ type: "text", value: systemInstruction }],
          },
        ],
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
      },
      promptOptions: {
        // Constrains Gemini Nano decoding to the same JSON schema contract.
        responseConstraint: opts.schema,
      },
    },
  });
}

export function getTtsModel(): GenerativeModel {
  const { ai, remoteConfig } = getFirebase();
  return getGenerativeModel(ai, {
    model: rcString(remoteConfig, "ai_tts_model"),
    generationConfig: sanitizeGenerationConfig({
      responseModalities: [ResponseModality.AUDIO],
    }),
  });
}

export function getTemplateModel(): TemplateGenerativeModel {
  const { ai } = getFirebase();
  return getTemplateGenerativeModel(ai);
}
