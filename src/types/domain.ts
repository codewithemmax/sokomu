export type LanguageId = "yo" | "ig" | "ha" | "pcm";

export type DialectId =
  | "yo-ijebu"
  | "yo-ekiti"
  | "yo-ondo"
  | "ig-owerri"
  | "ig-onitsha"
  | "ig-ikwerre"
  | "ha-kano"
  | "pcm-lagos";

export type Tone = "H" | "M" | "L";

export type ToneSystem = "three-tone" | "two-tone-downstep" | "none";

export type UserRole = "learner" | "trainer" | "admin";

export type LearningGoal = "elder-greetings" | "market" | "family" | "transit";

export type NanoStatusState = "ready" | "fallback" | "unsupported";

export interface Language {
  languageId: LanguageId;
  name: string;
  nativeName: string;
  greeting: string;
  toneSystem: ToneSystem;
}

export interface Dialect {
  dialectId: DialectId;
  languageId: LanguageId;
  name: string;
  region: string;
  mapRegionId: string;
  stampArt: string;
  order: number;
  description: string;
}

export type SpeakerVoiceKey =
  | "elder_female"
  | "elder_male"
  | "young_male"
  | "young_female"
  | "trader";

export interface ScenarioSpeaker {
  id: string;
  displayName: string;
  role: string;
  voiceKey: SpeakerVoiceKey;
}

export interface ScenarioLine {
  speakerId: string;
  text: string;
  translation: string;
}

export interface Scenario {
  scenarioId: string;
  dialectId: DialectId;
  title: string;
  summary: string;
  culturalNote: string;
  speakers: [ScenarioSpeaker, ScenarioSpeaker];
  script: ScenarioLine[];
  glossaryEntryIds: string[];
  estimatedAudioBytes: number;
  order: number;
}

export interface GlossaryExample {
  text: string;
  translation: string;
}

export interface GlossaryEntry {
  entryId: string;
  languageId: LanguageId;
  dialectId: DialectId;
  headword: string;
  standardForm: string | null;
  glossEn: string;
  syllables: string[];
  tonePattern: Tone[];
  example: GlossaryExample | null;
  scenarioIds: string[];
  verified: boolean;
  verifiedBy: string[];
  source: "seed" | "trainer";
  updatedAt: number;
}

export interface TonalClassStat {
  correct: number;
  total: number;
}

export interface DialectProgress {
  dialectId: DialectId;
  scenariosCompleted: string[];
  scenarioScores: Record<string, number>;
  tonal: Record<Tone, TonalClassStat>;
  lastPracticedAt: number;
}

export interface EarnedStamp {
  stampId: string;
  dialectId: DialectId;
  scenarioId: string;
  accuracy: number;
  earnedAt: number;
  earnedOffline: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  role: UserRole;
  isAnonymous: boolean;
  languageId: LanguageId;
  dialectId: DialectId;
  goal: LearningGoal;
  nanoStatus: NanoStatusState;
  createdAt: number;
  updatedAt: number;
}

export interface TrainerSubmission {
  submissionId: string;
  submittedBy: string;
  dialectId: DialectId;
  headword: string;
  standardForm: string | null;
  glossEn: string;
  syllables: string[];
  tonePattern: Tone[];
  example: GlossaryExample | null;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  reviewerUid: string | null;
  rejectionReason: string | null;
  createdAt: number;
  reviewedAt: number | null;
}

export interface TrainerRequest {
  uid: string;
  dialectId: DialectId;
  motivation: string;
  createdAt: number;
}
