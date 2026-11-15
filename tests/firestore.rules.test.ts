import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const rulesText = readFileSync(join(ROOT, "firestore.rules"), "utf8");
const indexesJson = JSON.parse(readFileSync(join(ROOT, "firestore.indexes.json"), "utf8")) as {
  indexes: Array<{
    collectionGroup: string;
    fields: Array<{ fieldPath: string; order?: string; arrayConfig?: string }>;
  }>;
};
const remoteConfigTemplate = JSON.parse(
  readFileSync(join(ROOT, "remoteconfig.template.json"), "utf8"),
) as {
  parameters: Record<string, { defaultValue?: { value?: string }; valueType?: string }>;
};

describe("firestore.rules security invariants", () => {
  test("uses rules_version 2 and cloud.firestore service", () => {
    expect(rulesText).toContain("rules_version = '2';");
    expect(rulesText).toContain("service cloud.firestore");
  });

  test("enforces self-only access and role immutability on users/{uid}", () => {
    expect(rulesText).toContain("match /users/{uid}");
    expect(rulesText).toContain('allow create: if isSelf(uid) && request.resource.data.role == "learner";');
    expect(rulesText).toContain(
      "allow update: if isSelf(uid) && request.resource.data.role == resource.data.role;",
    );
    expect(rulesText).toContain("allow delete: if false;");
    expect(rulesText).toContain("match /{sub=**}");
  });

  test("enforces trainer submission creation and blocks self-approval", () => {
    expect(rulesText).toContain("match /trainerSubmissions/{id}");
    expect(rulesText).toContain("request.resource.data.submittedBy == request.auth.uid");
    expect(rulesText).toContain('request.resource.data.status == "pending"');
    expect(rulesText).toContain("resource.data.submittedBy != request.auth.uid");
    expect(rulesText).toContain('request.resource.data.status in ["approved", "rejected"]');
    expect(rulesText).toContain("request.resource.data.reviewerUid == request.auth.uid");
  });

  test("restricts glossary creation by trainers to verified trainer entries", () => {
    expect(rulesText).toContain("match /glossary/{id}");
    expect(rulesText).toContain("request.resource.data.verified == true");
    expect(rulesText).toContain('request.resource.data.source == "trainer"');
  });
});

describe("firestore.indexes.json composite indexes", () => {
  test("defines the 3 required composite indexes for glossary and trainerSubmissions", () => {
    expect(indexesJson.indexes.length).toBe(3);
    const groups = indexesJson.indexes.map((i) => i.collectionGroup);
    expect(groups).toEqual(["glossary", "glossary", "trainerSubmissions"]);
  });
});

describe("remoteconfig.template.json baseline parameters", () => {
  const requiredKeys = [
    "ai_cloud_text_model",
    "ai_tts_model",
    "ai_drill_temperature",
    "ai_grading_temperature",
    "ai_system_instruction_quiz",
    "ai_system_instruction_tone",
    "ai_system_instruction_grading",
    "ai_tts_style_instruction",
    "dialect_rules_json",
    "tts_voice_map_json",
    "tts_enabled",
    "cloud_fallback_enabled",
    "cloud_fallback_daily_limit",
    "quiz_question_count",
    "quiz_grounding_max_entries",
    "stamp_accuracy_threshold",
    "telemetry_cloud_drill_kb",
    "telemetry_naira_per_mb",
    "feature_trainer_portal",
    "show_mid_macron",
    "demo_announcement",
    "prompt_template_quiz_id",
    "prompt_template_grade_id",
    "prompt_template_tts_id",
  ];

  test("contains all required Remote Config keys", () => {
    for (const key of requiredKeys) {
      expect(remoteConfigTemplate.parameters[key]).toBeDefined();
    }
  });

  test("uses approved model names and valid JSON parameters", () => {
    expect(remoteConfigTemplate.parameters.ai_cloud_text_model?.defaultValue?.value).toBe(
      "gemini-3.5-flash-lite",
    );
    expect(remoteConfigTemplate.parameters.ai_tts_model?.defaultValue?.value).toBe(
      "gemini-3.1-flash-tts-preview",
    );
    const dialectRules = JSON.parse(
      remoteConfigTemplate.parameters.dialect_rules_json?.defaultValue?.value ?? "{}",
    ) as Record<string, unknown>;
    expect(Object.keys(dialectRules)).toEqual([
      "yo-ijebu",
      "yo-ekiti",
      "yo-ondo",
      "ig-owerri",
      "ig-onitsha",
      "ig-ikwerre",
      "ha-kano",
      "pcm-lagos",
    ]);
  });
});
