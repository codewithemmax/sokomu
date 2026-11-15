# 4. Code Standards: Engineering Standards, Type Schemas and Disqualification Guardrails

Document owner: Lead Architect
Depends on: context/2-architecture.md
Read next: context/5-ai-workflow-rules.md

> Version note: Sokomu runs Next.js 16.4.x, React 19.3, Tailwind CSS 4.3, TypeScript 5, Bun 1.3, and the Firebase JS SDK (modular, v12 or newer). Before implementing a pattern below, confirm the exact exported names against node_modules/firebase/ai/dist type declarations and node_modules/next/dist/docs/. If an export name differs in the installed version, keep the architecture and adapt the call, then record the difference in the Change Log of context/6-progress-tracker.md.

---

## 1. Folder Structure (C:\dev\sokomu)

```text
sokomu/
+-- .codexrules                      Master agent rules
+-- AGENTS.md                        Next.js agent notice (auto-managed by next dev)
+-- LICENSE                          Apache 2.0
+-- README.md
+-- .env.example                     Placeholders only
+-- .gitignore
+-- firebase.json                    Hosting, Firestore rules and indexes, emulators
+-- firestore.rules
+-- firestore.indexes.json
+-- remoteconfig.template.json       Exported Remote Config template (no secrets)
+-- context/                         1 to 6 planning files (single source of truth)
+-- public/
|   +-- brand/  icons/  maps/  stamps/
|   +-- sw.js                        Service worker (app shell cache)
+-- scripts/
|   +-- seed-firestore.ts            Seeds languages, dialects, scenarios, glossary (Admin SDK, local only)
|   +-- check-secrets.ts             Pre-commit scan for secret patterns
+-- src/
    +-- app/                         Next.js App Router
    |   +-- layout.tsx               Root layout (Server Component), fonts, Providers wrapper
    |   +-- providers.tsx            "use client": FirebaseProvider, NanoReadinessProvider, TelemetryProvider
    |   +-- globals.css              Tailwind v4 @theme tokens
    |   +-- page.tsx                 Landing
    |   +-- onboarding/page.tsx
    |   +-- map/page.tsx
    |   +-- scenarios/page.tsx
    |   +-- scenarios/[scenarioId]/page.tsx
    |   +-- library/page.tsx
    |   +-- progress/page.tsx
    |   +-- settings/page.tsx
    |   +-- settings/diagnostics/page.tsx
    |   +-- trainer/page.tsx
    |   +-- trainer/submit/page.tsx
    |   +-- trainer/queue/page.tsx
    |   +-- trainer/entries/page.tsx
    |   +-- offline/page.tsx
    +-- components/
    |   +-- telemetry/   InferenceSourcePill, DataSavedCounter, ConnectivityBadge, NanoDownloadBanner,
    |   |                OfflineBanner, TelemetryHeaderBar, TelemetryDrawer
    |   +-- map/         NigeriaMap, StampCard, RegionDrawer
    |   +-- audio/       DualSpeakerPlayer, Waveform
    |   +-- drill/       QuizCard, ToneDrill, DiacriticPicker, ToneChip, FeedbackCard
    |   +-- trainer/     DictionaryDrawer, EntryForm, ReviewItem
    |   +-- layout/      LeftRail, BottomTabBar, AppShell
    |   +-- ui/          Button, Card, Drawer, Modal, Tabs, Tooltip, Toaster, ProgressBar
    +-- lib/
    |   +-- firebase/
    |   |   +-- config.ts                  Reads NEXT_PUBLIC_FIREBASE_* env, validates presence
    |   |   +-- client.ts                  getFirebase(): app, appCheck, auth, db, remoteConfig, ai (lazy)
    |   |   +-- app-check.ts               initAppCheck(app)
    |   |   +-- auth.ts                    ensureAnonymousUser, upgradeWithGoogle
    |   |   +-- firestore.ts               typed refs, converters
    |   |   +-- remote-config.ts           initRemoteConfig, typed getters, live updates
    |   |   +-- remote-config-defaults.ts  In-app defaults (only place prompt defaults live)
    |   +-- ai/
    |   |   +-- models.ts                  getDrillModel, getGradingModel, getTtsModel, getTemplateModel
    |   |   +-- config.ts                  sanitizeGenerationConfig (forbidden key guard)
    |   |   +-- schemas.ts                 Schema.object contracts
    |   |   +-- prompts.ts                 Prompt builders (data only, instructions come from Remote Config)
    |   |   +-- grounding.ts               Local RAG: select and serialize glossary nodes
    |   |   +-- nano.ts                    Chrome LanguageModel availability and download monitor
    |   |   +-- tts.ts                     synthesizeDialogue (stream), PCM decode
    |   |   +-- fallback-quiz.ts           Deterministic offline quiz generator
    |   |   +-- inference-source.ts        Normalize SDK inferenceSource to ON_DEVICE or IN_CLOUD
    |   +-- db/
    |   |   +-- idb.ts                     openSokomuDb (idb), schema v1, upgrade
    |   |   +-- audio-cache.ts
    |   |   +-- glossary-cache.ts
    |   |   +-- scenario-cache.ts
    |   |   +-- drill-queue.ts
    |   |   +-- telemetry-store.ts
    |   +-- audio/
    |   |   +-- pcm-player.ts              Gapless 24 kHz scheduler
    |   +-- tone/
    |   |   +-- normalize.ts               NFC, strip and apply tone marks
    |   |   +-- compare.ts                 Deterministic syllable tone comparison
    |   +-- sync/
    |       +-- sync-engine.ts             Flush drillQueue on reconnect
    +-- hooks/
    |   +-- useOnlineStatus.ts
    |   +-- useNanoReadiness.ts
    |   +-- useHybridModel.ts
    |   +-- useInferenceTelemetry.ts
    |   +-- useDataSaved.ts
    |   +-- useRemoteConfigValue.ts
    |   +-- useAuthUser.ts
    +-- types/
        +-- domain.ts                     Language, Dialect, Scenario, GlossaryEntry, Tone
        +-- ai.ts                         VocabularyQuiz, TonalDrill, TonalGrading, TrainerAssist
        +-- telemetry.ts                  InferenceEvent, TelemetrySummary
        +-- guards.ts                     Runtime type guards
        +-- chrome-ai.d.ts                Ambient types for window.LanguageModel
        +-- globals.d.ts                  FIREBASE_APPCHECK_DEBUG_TOKEN global
```

Naming conventions:

- Components: PascalCase files and named exports (export function StampCard). No default exports except Next.js route files (page.tsx, layout.tsx) which require them.
- Hooks: useCamelCase, one hook per file.
- Library modules: kebab-case files, named exports.
- Types: PascalCase interfaces, string literal unions instead of enums for domain types.
- Constants: SCREAMING_SNAKE_CASE only for true constants (IDB_NAME, IDB_VERSION).

---

## 2. Dependencies (install with Bun only)

```bash
bun add firebase idb
bun add -d firebase-tools @firebase/rules-unit-testing
```

Package script additions (package.json):

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "bun test",
    "check:secrets": "bun run scripts/check-secrets.ts",
    "emulators": "firebase emulators:start --only firestore,auth"
  }
}
```

No other runtime dependency may be added without a Change Log entry and Lead Architect approval.

---

## 3. Environment Configuration

```ts
// src/lib/firebase/config.ts
export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// NEXT_PUBLIC_* values must be referenced literally so Next.js can inline them at build time.
export const firebaseConfig: FirebaseWebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
};

export const recaptchaEnterpriseSiteKey =
  process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY ?? "";

export const appCheckDebugToken =
  process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN ?? "";

export function assertFirebaseConfig(): void {
  const missing = Object.entries(firebaseConfig)
    .filter(([key, value]) => key !== "measurementId" && !value)
    .map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Missing Firebase config values: ${missing.join(", ")}. Copy .env.example to .env.local.`);
  }
}
```

Notes:

- The Firebase web apiKey is an identifier, not a secret, but it is still kept out of git via .env.local to avoid scanner noise and to keep projects swappable. Real protection comes from App Check, Security Rules, and API key restrictions (HTTP referrer restriction in Google Cloud console).
- NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN is embedded in the client bundle when set. Set it only in .env.local for development and in a dedicated judge build. Never set it in the production hosting environment. Revoke judge debug tokens in the console after December 16, 2026.

---

## 4. Firebase Initialization Patterns

### 4.1 Global Type Declarations

```ts
// src/types/globals.d.ts
export {};

declare global {
  // Read by the Firebase App Check SDK before initializeAppCheck runs.
  // eslint-disable-next-line no-var
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined;
}
```

### 4.2 App Check (environment-conditional)

```ts
// src/lib/firebase/app-check.ts
"use client";

import type { FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { appCheckDebugToken, recaptchaEnterpriseSiteKey } from "./config";

let appCheckInstance: AppCheck | null = null;

export function initAppCheck(app: FirebaseApp): AppCheck {
  if (typeof window === "undefined") {
    throw new Error("initAppCheck must only run in the browser.");
  }
  if (appCheckInstance) return appCheckInstance;

  // Debug mode: local development and judge testing only.
  // Must be assigned BEFORE initializeAppCheck is called.
  if (appCheckDebugToken) {
    globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN =
      appCheckDebugToken === "true" ? true : appCheckDebugToken;
  }

  if (!recaptchaEnterpriseSiteKey) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY.");
  }

  appCheckInstance = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(recaptchaEnterpriseSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
  return appCheckInstance;
}
```

Rules:

- When the debug token is "true", the SDK prints a generated token to the browser console. Register it in Firebase console, App Check, Apps, Manage debug tokens, then put the exact value in .env.local so it is stable.
- The ReCaptchaEnterpriseProvider is always constructed. In debug mode the SDK uses the debug provider path internally.

### 4.3 Client Singleton (fixed initialization order)

```ts
// src/lib/firebase/client.ts
"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import type { AppCheck } from "firebase/app-check";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import type { RemoteConfig } from "firebase/remote-config";
import { getAI, GoogleAIBackend, type AI } from "firebase/ai";
import { assertFirebaseConfig, firebaseConfig } from "./config";
import { initAppCheck } from "./app-check";
import { initRemoteConfig } from "./remote-config";

export interface FirebaseServices {
  app: FirebaseApp;
  appCheck: AppCheck;
  auth: Auth;
  db: Firestore;
  remoteConfig: RemoteConfig;
  ai: AI;
}

let services: FirebaseServices | null = null;

export function getFirebase(): FirebaseServices {
  if (typeof window === "undefined") {
    throw new Error("getFirebase() called during server rendering. Call it inside useEffect or an event handler.");
  }
  if (services) return services;

  assertFirebaseConfig();

  // 1. App
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  // 2. App Check (must precede every other product)
  const appCheck = initAppCheck(app);
  // 3. Products
  const auth = getAuth(app);
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  const remoteConfig = initRemoteConfig(app);
  const ai = getAI(app, { backend: new GoogleAIBackend() });

  services = { app, appCheck, auth, db, remoteConfig, ai };
  return services;
}
```

### 4.4 Remote Config

```ts
// src/lib/firebase/remote-config-defaults.ts
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
  ai_tts_style_instruction: "Read warmly and naturally, as family members speaking at home.",
  dialect_rules_json: "{}",
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
```

```ts
// src/lib/firebase/remote-config.ts
"use client";

import type { FirebaseApp } from "firebase/app";
import {
  activate,
  fetchAndActivate,
  getRemoteConfig,
  getValue,
  onConfigUpdate,
  type RemoteConfig,
} from "firebase/remote-config";
import { REMOTE_CONFIG_DEFAULTS, type RemoteConfigKey } from "./remote-config-defaults";

export function initRemoteConfig(app: FirebaseApp): RemoteConfig {
  const rc = getRemoteConfig(app);
  rc.settings.minimumFetchIntervalMillis =
    process.env.NODE_ENV === "development" ? 0 : 3_600_000;
  rc.settings.fetchTimeoutMillis = 10_000;
  rc.defaultConfig = { ...REMOTE_CONFIG_DEFAULTS };
  return rc;
}

export async function refreshRemoteConfig(rc: RemoteConfig): Promise<void> {
  if (!navigator.onLine) return; // Last activated values persist for offline use.
  try {
    await fetchAndActivate(rc);
  } catch {
    // Keep last activated or default values. Never block the UI on config.
  }
}

export function subscribeToConfigUpdates(rc: RemoteConfig, onChange: (keys: Set<string>) => void): () => void {
  return onConfigUpdate(rc, {
    next: async (update) => {
      await activate(rc);
      onChange(update.getUpdatedKeys());
    },
    error: () => {
      /* Real-time channel failed: periodic fetch remains as fallback. */
    },
    complete: () => {},
  });
}

export function rcString(rc: RemoteConfig, key: RemoteConfigKey): string {
  return getValue(rc, key).asString();
}
export function rcNumber(rc: RemoteConfig, key: RemoteConfigKey): number {
  return getValue(rc, key).asNumber();
}
export function rcBoolean(rc: RemoteConfig, key: RemoteConfigKey): boolean {
  return getValue(rc, key).asBoolean();
}
export function rcJson<T>(rc: RemoteConfig, key: RemoteConfigKey, guard: (v: unknown) => v is T, fallback: T): T {
  try {
    const parsed: unknown = JSON.parse(getValue(rc, key).asString());
    return guard(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}
```

### 4.5 Firebase AI Logic: Hybrid Models

```ts
// src/lib/ai/config.ts
const FORBIDDEN_KEYS = ["topK", "topP", "top_k", "top_p"] as const;

export function sanitizeGenerationConfig<T extends Record<string, unknown>>(config: T): T {
  const clean: Record<string, unknown> = { ...config };
  for (const key of FORBIDDEN_KEYS) delete clean[key];
  const thinking = clean["thinkingConfig"];
  if (thinking && typeof thinking === "object" && "thinkingLevel" in thinking) {
    const level = (thinking as { thinkingLevel?: unknown }).thinkingLevel;
    if (typeof level === "string" && level.toUpperCase() === "MINIMAL") {
      delete clean["thinkingConfig"];
    }
  }
  if (process.env.NODE_ENV !== "production" && Object.keys(clean).length !== Object.keys(config).length) {
    console.warn("[sokomu] Removed forbidden generationConfig keys.");
  }
  return clean as T;
}
```

```ts
// src/lib/ai/models.ts
"use client";

import {
  getGenerativeModel,
  InferenceMode,
  ResponseModality,
  type GenerativeModel,
  type Schema,
} from "firebase/ai";
import { getFirebase } from "@/lib/firebase/client";
import { rcNumber, rcString } from "@/lib/firebase/remote-config";
import { sanitizeGenerationConfig } from "./config";

export type DrillMode = "prefer_on_device" | "only_on_device" | "only_in_cloud";

function toInferenceMode(mode: DrillMode): InferenceMode {
  switch (mode) {
    case "only_on_device":
      return InferenceMode.ONLY_ON_DEVICE;
    case "only_in_cloud":
      return InferenceMode.ONLY_IN_CLOUD;
    default:
      return InferenceMode.PREFER_ON_DEVICE;
  }
}

interface StructuredModelOptions {
  mode: DrillMode;
  schema: Schema;
  systemInstructionKey: "ai_system_instruction_quiz" | "ai_system_instruction_tone" | "ai_system_instruction_grading";
  temperatureKey: "ai_drill_temperature" | "ai_grading_temperature";
  dialectRules: string;
}

export function getStructuredModel(opts: StructuredModelOptions): GenerativeModel {
  const { ai, remoteConfig } = getFirebase();
  const systemInstruction = `${rcString(remoteConfig, opts.systemInstructionKey)}\n\nDIALECT RULES:\n${opts.dialectRules}`;

  return getGenerativeModel(ai, {
    mode: toInferenceMode(opts.mode),
    inCloudParams: {
      model: rcString(remoteConfig, "ai_cloud_text_model"),
      systemInstruction,
      generationConfig: sanitizeGenerationConfig({
        temperature: rcNumber(remoteConfig, opts.temperatureKey),
        responseMimeType: "application/json",
        responseSchema: opts.schema,
      }),
    },
    onDeviceParams: {
      createOptions: {
        initialPrompts: [{ role: "system", content: systemInstruction }],
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
      },
      promptOptions: {
        // Constrains Gemini Nano decoding to the same JSON schema.
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
```

Notes for implementers:

- If the installed SDK places systemInstruction differently for on-device sessions, keep a single systemInstruction string and pass it wherever the type declarations accept it. Do not duplicate prompt text in components.
- The multi-speaker speechConfig is passed per request in tts.ts (section 4.7) because voice mapping depends on the scenario.

### 4.6 Inference Source Normalization

```ts
// src/lib/ai/inference-source.ts
import type { InferenceSourceLabel } from "@/types/telemetry";

// The SDK exposes response.inferenceSource with values representing on-device or in-cloud.
export function normalizeInferenceSource(raw: unknown): Exclude<InferenceSourceLabel, "CACHED_FALLBACK"> {
  const value = String(raw ?? "").toLowerCase();
  if (value.includes("device")) return "ON_DEVICE";
  return "IN_CLOUD";
}
```

```ts
// usage inside useHybridModel
const started = performance.now();
const result = await model.generateContent(prompt);
const source = normalizeInferenceSource(result.response.inferenceSource);
telemetry.record({ feature: "vocab_quiz", source, latencyMs: Math.round(performance.now() - started) });
```

### 4.7 TTS Streaming and PCM Playback

```ts
// src/lib/ai/tts.ts
"use client";

import type { Scenario } from "@/types/domain";
import { getTtsModel } from "./models";

export interface SpeakerVoice { speaker: string; voiceName: string }

export async function* streamDialogueAudio(
  scenario: Scenario,
  voices: SpeakerVoice[],
  styleInstruction: string,
): AsyncGenerator<Uint8Array> {
  const model = getTtsModel();
  const lines = scenario.script
    .map((l) => `${scenario.speakers.find((s) => s.id === l.speakerId)?.displayName ?? l.speakerId}: ${l.text}`)
    .join("\n");

  const result = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ text: `${styleInstruction}\n${lines}` }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: voices.map((v) => ({
            speaker: v.speaker,
            voiceConfig: { prebuiltVoiceConfig: { voiceName: v.voiceName } },
          })),
        },
      },
    },
  });

  for await (const chunk of result.stream) {
    for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
      const data = part.inlineData?.data;
      if (data) yield base64ToBytes(data); // audio/L16 PCM, 24 kHz, mono, little-endian
    }
  }
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}
```

```ts
// src/lib/audio/pcm-player.ts
"use client";

export const PCM_SAMPLE_RATE = 24_000;

export class PcmStreamPlayer {
  private ctx = new AudioContext({ sampleRate: PCM_SAMPLE_RATE });
  private nextStart = 0;
  private carry: Uint8Array | null = null;

  enqueue(bytes: Uint8Array): void {
    let buf = bytes;
    if (this.carry) {
      buf = new Uint8Array(this.carry.length + bytes.length);
      buf.set(this.carry);
      buf.set(bytes, this.carry.length);
      this.carry = null;
    }
    if (buf.length % 2 === 1) {
      this.carry = buf.slice(buf.length - 1);
      buf = buf.slice(0, buf.length - 1);
    }
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    const samples = new Float32Array(buf.byteLength / 2);
    for (let i = 0; i < samples.length; i += 1) samples[i] = view.getInt16(i * 2, true) / 32768;

    const audioBuffer = this.ctx.createBuffer(1, samples.length, PCM_SAMPLE_RATE);
    audioBuffer.copyToChannel(samples, 0);
    const src = this.ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(this.ctx.destination);
    const startAt = Math.max(this.ctx.currentTime + 0.05, this.nextStart);
    src.start(startAt);
    this.nextStart = startAt + audioBuffer.duration;
  }

  async resume(): Promise<void> { if (this.ctx.state === "suspended") await this.ctx.resume(); }
  async close(): Promise<void> { await this.ctx.close(); }
}
```

### 4.8 Gemini Nano Readiness (Chrome Prompt API)

```ts
// src/types/chrome-ai.d.ts (minimal ambient types; prefer official types if a package is added)
export {};
declare global {
  type LanguageModelAvailability = "unavailable" | "downloadable" | "downloading" | "available";
  interface LanguageModelDownloadProgressEvent extends Event { loaded: number }
  interface LanguageModelMonitor extends EventTarget {
    addEventListener(type: "downloadprogress", listener: (e: LanguageModelDownloadProgressEvent) => void): void;
  }
  interface LanguageModelStatic {
    availability(options?: Record<string, unknown>): Promise<LanguageModelAvailability>;
    create(options?: { monitor?: (m: LanguageModelMonitor) => void; signal?: AbortSignal } & Record<string, unknown>): Promise<{ destroy(): void }>;
  }
  // eslint-disable-next-line no-var
  var LanguageModel: LanguageModelStatic | undefined;
}
```

```ts
// src/lib/ai/nano.ts
"use client";

const EXPECTED_IO = {
  expectedInputs: [{ type: "text", languages: ["en"] }],
  expectedOutputs: [{ type: "text", languages: ["en"] }],
};

export async function checkNanoAvailability(): Promise<LanguageModelAvailability | "unsupported"> {
  if (typeof window === "undefined" || typeof globalThis.LanguageModel === "undefined") return "unsupported";
  try {
    return await globalThis.LanguageModel.availability(EXPECTED_IO);
  } catch {
    return "unavailable";
  }
}

// Must be called from a user gesture handler when availability is "downloadable".
export async function downloadNano(onProgress: (fraction: number) => void, signal?: AbortSignal): Promise<void> {
  const lm = globalThis.LanguageModel;
  if (!lm) throw new Error("Chrome built-in AI is not supported in this browser.");
  const session = await lm.create({
    ...EXPECTED_IO,
    signal,
    monitor(m) {
      m.addEventListener("downloadprogress", (e) => onProgress(e.loaded));
    },
  });
  session.destroy(); // Firebase AI Logic manages its own sessions; this only triggers the download.
}
```

### 4.9 IndexedDB

```ts
// src/lib/db/idb.ts
"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { GlossaryEntry, Scenario } from "@/types/domain";
import type { InferenceEvent } from "@/types/telemetry";
import type { DrillResult } from "@/types/ai";

export const IDB_NAME = "sokomu";
export const IDB_VERSION = 1;

export interface AudioCacheRecord {
  key: string; scenarioId: string; pcm: ArrayBuffer; sampleRate: 24000; channels: 1;
  bytes: number; durationMs: number; ttsModel: string; promptHash: string; createdAt: number;
}

interface SokomuDB extends DBSchema {
  audioCache: { key: string; value: AudioCacheRecord; indexes: { byScenario: string } };
  glossary: { key: string; value: GlossaryEntry; indexes: { byDialect: string; byScenario: string } };
  scenarios: { key: string; value: Scenario; indexes: { byDialect: string } };
  drillQueue: { key: string; value: DrillResult & { synced: 0 | 1 }; indexes: { byCreatedAt: number; bySynced: number } };
  telemetry: { key: number; value: InferenceEvent; indexes: { byTs: number } };
  meta: { key: string; value: { key: string; value: unknown } };
}

let dbPromise: Promise<IDBPDatabase<SokomuDB>> | null = null;

export function openSokomuDb(): Promise<IDBPDatabase<SokomuDB>> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB unavailable (SSR or private mode)."));
  dbPromise ??= openDB<SokomuDB>(IDB_NAME, IDB_VERSION, {
    upgrade(db) {
      const audio = db.createObjectStore("audioCache", { keyPath: "key" });
      audio.createIndex("byScenario", "scenarioId");
      const glossary = db.createObjectStore("glossary", { keyPath: "entryId" });
      glossary.createIndex("byDialect", "dialectId");
      glossary.createIndex("byScenario", "scenarioIds", { multiEntry: true });
      const scenarios = db.createObjectStore("scenarios", { keyPath: "scenarioId" });
      scenarios.createIndex("byDialect", "dialectId");
      const queue = db.createObjectStore("drillQueue", { keyPath: "clientEventId" });
      queue.createIndex("byCreatedAt", "createdAt");
      queue.createIndex("bySynced", "synced");
      const telemetry = db.createObjectStore("telemetry", { keyPath: "id", autoIncrement: true });
      telemetry.createIndex("byTs", "ts");
      db.createObjectStore("meta", { keyPath: "key" });
    },
  });
  return dbPromise;
}
```

### 4.10 SSR-Safe Hook Pattern

```ts
// src/hooks/useOnlineStatus.ts
"use client";

import { useSyncExternalStore } from "react";

function subscribe(cb: () => void): () => void {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true, // Server snapshot: deterministic, avoids hydration mismatch
  );
}
```

---

## 5. Structured Output Schemas (Schema.object Contracts)

### 5.1 Schemas

```ts
// src/lib/ai/schemas.ts
import { Schema } from "firebase/ai";

const toneEnum = Schema.enumString({ enum: ["H", "M", "L"] });

export const VocabularyQuizSchema = Schema.object({
  properties: {
    dialectId: Schema.string(),
    questions: Schema.array({
      items: Schema.object({
        properties: {
          id: Schema.string(),
          type: Schema.enumString({ enum: ["meaning_to_word", "word_to_meaning", "dialect_to_standard"] }),
          prompt: Schema.string({ description: "Question shown to the learner, in English" }),
          options: Schema.array({ items: Schema.string(), description: "Exactly 4 options" }),
          correctIndex: Schema.integer({ description: "0 to 3" }),
          glossaryEntryId: Schema.string({ description: "Must be an entryId from CONTEXT" }),
          explanation: Schema.string({ description: "One respectful sentence" }),
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
    producedMeaningEn: Schema.string({ description: "Meaning of what the learner wrote if it is a known word, else empty" }),
    feedback: Schema.string({ description: "Max 2 sentences, respectful, explains meaning change" }),
  },
});

export const TrainerAssistSchema = Schema.object({
  properties: {
    syllables: Schema.array({ items: Schema.string() }),
    suggestedTonePattern: Schema.array({ items: toneEnum }),
    warnings: Schema.array({ items: Schema.string() }),
  },
});
```

### 5.2 Matching TypeScript Interfaces

```ts
// src/types/ai.ts
export type Tone = "H" | "M" | "L";

export interface VocabularyQuestion {
  id: string;
  type: "meaning_to_word" | "word_to_meaning" | "dialect_to_standard";
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  glossaryEntryId: string;
  explanation: string;
}
export interface VocabularyQuiz { dialectId: string; questions: VocabularyQuestion[] }

export interface TonalDrillItem {
  id: string; glossaryEntryId: string; instruction: string; meaningEn: string;
  syllableCount: number; expectedTonePattern: Tone[]; hint?: string;
}
export interface TonalDrill { dialectId: string; items: TonalDrillItem[] }

export interface SyllableGrade {
  expected: string; received: string; expectedTone: Tone; receivedTone: Tone | "NONE"; correct: boolean;
}
export interface TonalGrading {
  isCorrect: boolean; score: number; syllables: SyllableGrade[]; producedMeaningEn: string; feedback: string;
}

export interface TrainerAssist { syllables: string[]; suggestedTonePattern: Tone[]; warnings: string[] }

export interface DrillResult {
  clientEventId: string; uid: string; scenarioId: string; kind: "vocab" | "tone";
  score: number; items: number; tonal: Record<Tone, { correct: number; total: number }>;
  inferenceSource: "ON_DEVICE" | "IN_CLOUD" | "CACHED_FALLBACK"; createdAt: number;
}
```

### 5.3 Runtime Guards (example)

```ts
// src/types/guards.ts
import type { VocabularyQuiz } from "./ai";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

export function isVocabularyQuiz(v: unknown, allowedEntryIds: ReadonlySet<string>): v is VocabularyQuiz {
  if (!isObj(v) || typeof v.dialectId !== "string" || !Array.isArray(v.questions)) return false;
  return v.questions.every((q) =>
    isObj(q) &&
    typeof q.id === "string" &&
    typeof q.prompt === "string" &&
    Array.isArray(q.options) && q.options.length === 4 && q.options.every((o) => typeof o === "string") &&
    typeof q.correctIndex === "number" && Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex <= 3 &&
    typeof q.glossaryEntryId === "string" && allowedEntryIds.has(q.glossaryEntryId) &&
    typeof q.explanation === "string",
  );
}
```

The allowedEntryIds check is the grounding guarantee: a question referencing a glossary entry that was not injected is rejected (hallucination guard).

### 5.4 Prompt Construction (data only)

```ts
// src/lib/ai/prompts.ts
import type { GlossaryEntry } from "@/types/domain";

export function buildQuizPrompt(entries: GlossaryEntry[], count: number): string {
  const context = entries.map((e) => ({
    entryId: e.entryId, headword: e.headword, standardForm: e.standardForm,
    glossEn: e.glossEn, tonePattern: e.tonePattern.join(""),
  }));
  return `CONTEXT:\n${JSON.stringify(context)}\n\nTASK: Create ${count} questions.`;
}
```

---

## 6. Tone Utilities (deterministic ground truth)

```ts
// src/lib/tone/normalize.ts
const ACUTE = "\u0301"; const GRAVE = "\u0300"; const MACRON = "\u0304";
const TONE_MARKS = new RegExp(`[${ACUTE}${GRAVE}${MACRON}]`, "g");

export const nfc = (s: string): string => s.normalize("NFC");

export function toneOfSyllable(syllable: string): "H" | "M" | "L" {
  const d = syllable.normalize("NFD");
  if (d.includes(ACUTE)) return "H";
  if (d.includes(GRAVE)) return "L";
  return "M"; // Unmarked or macron is mid in Yoruba orthography
}

export function stripTones(s: string): string {
  return nfc(s.normalize("NFD").replace(TONE_MARKS, "")); // Keeps dot-below (U+0323)
}
```

Tonal grading always runs the deterministic comparison first (src/lib/tone/compare.ts). The model output may enrich feedback text but cannot overturn the deterministic correctness result. This prevents a quantized model from marking a wrong tone as correct.

---

## 7. Firestore Security Rules (baseline)

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() { return request.auth != null; }
    function isSelf(uid) { return signedIn() && request.auth.uid == uid; }
    function userDoc() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
    function hasRole(r) { return signedIn() && exists(/databases/$(database)/documents/users/$(request.auth.uid)) && userDoc().role == r; }
    function isTrainer() { return hasRole("trainer") || hasRole("admin"); }

    match /users/{uid} {
      allow read: if isSelf(uid);
      allow create: if isSelf(uid) && request.resource.data.role == "learner";
      allow update: if isSelf(uid) && request.resource.data.role == resource.data.role;
      allow delete: if false;

      match /{sub=**} {
        allow read, write: if isSelf(uid);
      }
    }

    match /languages/{id} { allow read: if true; allow write: if hasRole("admin"); }
    match /dialects/{id}  { allow read: if true; allow write: if hasRole("admin"); }
    match /scenarios/{id} { allow read: if true; allow write: if hasRole("admin"); }

    match /glossary/{id} {
      allow read: if true;
      allow create: if isTrainer() && request.resource.data.verified == true
                    && request.resource.data.source == "trainer";
      allow update, delete: if hasRole("admin");
    }

    match /trainerSubmissions/{id} {
      allow read: if isTrainer();
      allow create: if isTrainer()
                    && request.resource.data.submittedBy == request.auth.uid
                    && request.resource.data.status == "pending";
      allow update: if isTrainer()
                    && resource.data.submittedBy != request.auth.uid
                    && request.resource.data.status in ["approved", "rejected"]
                    && request.resource.data.reviewerUid == request.auth.uid
                    && request.resource.data.submittedBy == resource.data.submittedBy;
      allow delete: if hasRole("admin");
    }

    match /trainerRequests/{uid} {
      allow create, read: if isSelf(uid);
      allow update, delete: if hasRole("admin");
    }
  }
}
```

---

## 8. Forbidden Anti-Patterns (Disqualification Guardrails)

| ID | Anti-pattern | Why it is forbidden | Correct approach |
|---|---|---|---|
| AP-01 | Committing .env, .env.local, service account JSON, or any key | Disqualification risk, security breach | .gitignore, check:secrets script, .env.example only |
| AP-02 | Using a Gemini API key directly in client or a Next.js route handler | Exposes key, bypasses App Check | Firebase AI Logic client SDK with App Check |
| AP-03 | generationConfig with topK, topP, or thinking level MINIMAL | 400 Bad Request on target models | sanitizeGenerationConfig, allowed fields only |
| AP-04 | Calling window, navigator, indexedDB, LanguageModel, AudioContext at module top level or in Server Components | SSR crash, hydration errors | "use client", useEffect, typeof window guards, useSyncExternalStore |
| AP-05 | Initializing Firestore, Remote Config, or AI before App Check | Requests rejected when enforcement is on | Fixed order in client.ts |
| AP-06 | Disabling or commenting out App Check to "fix" errors | Security regression, judge red flag | Register debug token, fix site key |
| AP-07 | Free-text (unconstrained) generation on device | Quantized Nano hallucinates, unparseable output | Schema.object with responseConstraint and responseSchema |
| AP-08 | Rendering model output without a guard | UI crashes, hallucinated content | JSON.parse in try/catch plus guard plus fallback |
| AP-09 | Hardcoding prompts or model names in components | Cannot update at runtime, violates config-over-code | Remote Config keys and defaults file |
| AP-10 | Faking the inference source or data saved counter | Dishonest demo, judges inspect code | Bind to SDK inferenceSource and real events |
| AP-11 | Using any, ts-ignore, or disabling strict mode | Type safety is a judging criterion | unknown plus guards |
| AP-12 | Using npm, npx, yarn, or pnpm | Lockfile drift | Bun only |
| AP-13 | Blocking UI while Gemini Nano downloads | Poor UX | Non-blocking banner with monitor progress |
| AP-14 | Storing Yoruba or Igbo strings without NFC normalization | Comparison bugs, tone grading errors | nfc() on input and seed data |
| AP-15 | Default exports for non-route components | Inconsistent imports, refactor risk | Named exports |
| AP-16 | Unbounded cloud calls | Spend unpredictability | cloud_fallback_daily_limit, budget alerts, kill switches |
| AP-17 | Em dashes in UI copy or docs | Style rule | Commas, colons, parentheses |
| AP-18 | Legacy Next.js APIs from training data without checking docs | Next.js 16 breaking changes | Read node_modules/next/dist/docs first |

---

## 9. Testing Standards

| Layer | Tool | Required coverage |
|---|---|---|
| Unit (pure functions: tone, guards, sanitize, grounding, fallback quiz, telemetry math) | bun test | 100 percent of exported functions in src/lib/tone, src/types/guards.ts, src/lib/ai/config.ts |
| Firestore rules | @firebase/rules-unit-testing with Firestore emulator | Every allow and deny path in section 7 |
| Integration (manual scripted) | Chrome 139+ with DevTools | Usability test cases in context/5-ai-workflow-rules.md |
| Build gate | bun run build and bun run lint | Must pass before every commit |

Example unit test:

```ts
// src/lib/ai/config.test.ts
import { describe, expect, test } from "bun:test";
import { sanitizeGenerationConfig } from "./config";

describe("sanitizeGenerationConfig", () => {
  test("removes topK, topP and MINIMAL thinking", () => {
    const out = sanitizeGenerationConfig({
      temperature: 0.4, topK: 40, topP: 0.9, thinkingConfig: { thinkingLevel: "MINIMAL" },
    });
    expect(out).toEqual({ temperature: 0.4 });
  });
});
```

---

## 10. Git and Commit Standards

- Branch: main for releases; feature branches feat/<area>-<short-name> merged via fast-forward or squash.
- Conventional Commits with scope: feat(ai), feat(ui), fix(db), chore(firebase), docs(context), test(tone).
- Before every commit: bun run lint, bun run build, bun run check:secrets, git diff --cached review.
- Never force-push main after the first public push except to purge a leaked secret (and then rotate the secret first).
