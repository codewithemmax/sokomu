const DIALECT_RULES_DEFAULT = JSON.stringify({
  "yo-ijebu": {
    name: "Ijebu Yoruba",
    rules: [
      "Initial i- often shifts to u- before rounded vowels (isu -> usu).",
      "Initial a- in certain nouns shifts to e- (adiye -> ediye).",
      "Preserve three-way tonal distinction: High (acute), Mid (unmarked), Low (grave).",
    ],
  },
  "yo-ekiti": {
    name: "Ekiti Yoruba",
    rules: [
      "Use Ekiti honorific greeting forms and vowel harmony patterns.",
      "Preserve sub-dots on e, o, s and full three-tone marks.",
    ],
  },
  "yo-ondo": {
    name: "Ondo Yoruba",
    rules: [
      "Reflect Ondo lexical variants such as usu for yam and ediye for fowl.",
      "Preserve three-tone diacritics on every syllable.",
    ],
  },
  "ig-owerri": {
    name: "Owerri Igbo (Isuama)",
    rules: [
      "Reflect Owerri aspiration and nasalization conventions where present in the glossary.",
      "Preserve sub-dots (i, o, u) and High/Low tone marks.",
    ],
  },
  "ig-onitsha": {
    name: "Onitsha Igbo",
    rules: [
      "Use Onitsha lexical forms and riverine greeting conventions from the glossary.",
    ],
  },
  "ig-ikwerre": {
    name: "Ikwerre",
    rules: [
      "Reflect Ikwerre lexical shifts such as rumu for children (Standard Igbo umu).",
    ],
  },
  "ha-kano": {
    name: "Kano Hausa",
    rules: [
      "Preserve hooked letters (b, d, k, y) and Kano market politeness formulas.",
    ],
  },
  "pcm-lagos": {
    name: "Lagos Nigerian Pidgin",
    rules: [
      "Use natural Lagos street and danfo transit expressions from the glossary without artificial anglicization.",
    ],
  },
});

export const REMOTE_CONFIG_DEFAULTS = {
  ai_cloud_text_model: "gemini-3.5-flash-lite",
  ai_tts_model: "gemini-3.1-flash-tts-preview",
  ai_drill_temperature: 0.4,
  ai_grading_temperature: 0.1,
  ai_system_instruction_quiz:
    "You are Sokomu, a respectful Nigerian language tutor. Create vocabulary quiz questions ONLY from the glossary entries provided in CONTEXT. Never invent words. Preserve every diacritic exactly as written. Write questions and explanations in clear English. Follow the dialect rules provided. Return JSON that matches the schema.",
  ai_system_instruction_tone:
    "You are Sokomu, a tonal drill generator. Using ONLY the glossary entries in CONTEXT, create items that ask the learner to write a word with correct tone marks. Provide syllables and the expected tone pattern using H, M, L. Return JSON that matches the schema.",
  ai_system_instruction_grading:
    "You are Sokomu, a tonal grader. Compare the learner answer to the expected headword syllable by syllable. Use the provided deterministic comparison as ground truth for correctness. Explain any meaning change respectfully and briefly. Return JSON that matches the schema.",
  ai_tts_style_instruction:
    "Read warmly and naturally, as family members speaking at home.",
  dialect_rules_json: DIALECT_RULES_DEFAULT,
  tts_voice_map_json:
    '{"elder_female":"Kore","elder_male":"Charon","young_male":"Puck","young_female":"Leda","trader":"Fenrir"}',
  tts_enabled: true,
  cloud_fallback_enabled: true,
  cloud_fallback_daily_limit: 50,
  quiz_question_count: 5,
  quiz_grounding_max_entries: 12,
  stamp_accuracy_threshold: 0.8,
  telemetry_cloud_drill_kb: 48,
  telemetry_naira_per_mb: 0.78,
  feature_trainer_portal: true,
  show_mid_macron: false,
  demo_announcement: "",
  prompt_template_quiz_id: "sokomu-quiz-v1",
  prompt_template_grade_id: "sokomu-grade-v1",
  prompt_template_tts_id: "sokomu-tts-dialogue-v1",
} as const;

export type RemoteConfigKey = keyof typeof REMOTE_CONFIG_DEFAULTS;
