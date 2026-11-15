# 2. Architecture: Information Architecture, User Flows and Functional/Technical Specifications

Document owner: Olayinka Emmanuel (Lead Architect)
Depends on: context/1-project-overview.md
Read next: context/3-ui-context.md

---

## 1. System Architecture Overview

```text
+------------------------------------------------------------------------------------+
|                        BROWSER (Chrome Desktop 139+, mobile Chrome)                |
|                                                                                    |
|  Next.js 16 App Router client (React 19, TypeScript, Tailwind CSS v4)              |
|  +-------------------+   +-------------------+   +------------------------------+  |
|  | UI (src/app,      |   | Hooks             |   | Service Worker (app shell,   |  |
|  | src/components)   |<->| useHybridModel    |   | static assets, fonts)        |  |
|  |                   |   | useInference...   |   +------------------------------+  |
|  +---------+---------+   | useOnlineStatus   |                                     |
|            |             | useNanoReadiness  |                                     |
|            v             +---------+---------+                                     |
|  +--------------------------------+-------------------------------------------+    |
|  | src/lib/ai (Firebase AI Logic hybrid router)                               |    |
|  |   getGenerativeModel(ai, { mode: PREFER_ON_DEVICE | ONLY_ON_DEVICE, ... })  |    |
|  |        |                                   |                               |    |
|  |        v                                   v                               |    |
|  |  Chrome built-in AI                  Cloud (via Firebase AI Logic proxy)   |    |
|  |  Gemini Nano 4 (LanguageModel)       gemini-3.5-flash-lite (text fallback) |    |
|  |  ON_DEVICE, 0 ms network            gemini-3.1-flash-tts-preview (AUDIO)   |    |
|  +--------------------------------+-------------------------------------------+    |
|            |                                                                       |
|  +---------v----------------------------------+   +-----------------------------+  |
|  | src/lib/db (IndexedDB "sokomu" v1)         |   | src/lib/firebase            |  |
|  | audioCache, glossary, scenarios,           |   | App Check (first), Auth,    |  |
|  | drillQueue, telemetry, meta                |   | Firestore (offline cache),  |  |
|  +--------------------------------------------+   | Remote Config               |  |
|                                                   +--------------+--------------+  |
+------------------------------------------------------------------|-----------------+
                                                                   | HTTPS + App Check token
                                                                   v
+------------------------------------------------------------------------------------+
|                                  FIREBASE PROJECT                                  |
|  App Check (reCAPTCHA Enterprise, debug tokens)   Authentication (Anonymous,Google)|
|  Cloud Firestore (users, progress, glossary,      Remote Config (client template + |
|  scenarios, trainerSubmissions)                    Server Prompt Templates)        |
|  Firebase AI Logic (Gemini Developer API backend)  Hosting / App Hosting           |
|  Budget alerts and spend cap procedure (Cloud Billing)                             |
+------------------------------------------------------------------------------------+
```

Principles:

1. Edge first. Every interaction that can run on device runs on device.
2. Cloud for quality, cached for life. TTS audio is synthesized once and stored in IndexedDB.
3. Structured at the edge. Nano only produces JSON that matches a Schema.object contract.
4. Config over code. Prompts, dialect rules, model names, constants, and kill switches live in Remote Config.
5. Every request is attested. App Check protects Firestore and AI Logic.

---

## 2. Information Architecture

### 2.1 Sitemap

```text
/                                   Landing (pitch, "Start learning", judge quick start link)
|
+-- /onboarding                      Multi-step wizard (single route, step state in URL search param ?step=)
|     +-- step=language              Yoruba | Igbo | Hausa | Nigerian Pidgin
|     +-- step=dialect               Regional dialect list for chosen language (with map preview)
|     +-- step=goal                  Elder greetings | Market | Family visit | Transit
|     +-- step=readiness             Gemini Nano readiness check and download progress
|     +-- step=done                  Redirect to /map
|
+-- /map                             Cultural Map Dashboard (default home after onboarding)
|     +-- [drawer] RegionDrawer      Selected region: dialects, stamps, scenarios
|     +-- [modal]  StampUnlockedModal
|
+-- /scenarios                       Scenario library (filter by language, dialect, cached status)
|     +-- /scenarios/[scenarioId]    Scenario screen with tabs
|           +-- ?tab=listen          Two-speaker dialogue player, transcript, cache control
|           +-- ?tab=vocab           On-device vocabulary quiz (Schema.object)
|           +-- ?tab=tone            Tonal diacritic drill with DiacriticPicker and grading
|           +-- [drawer] DictionaryDrawer   Glossary entries used in this scenario
|           +-- [modal]  ScenarioCompleteModal (stamp award, accuracy, data saved)
|
+-- /library                         Offline library: cached scenarios, storage used, clear cache
|
+-- /progress                        Tonal Accuracy Mastery, stamps grid, data saved history
|
+-- /settings                        Account, sign-in upgrade, inference preference, storage
|     +-- /settings/diagnostics      Judge and developer diagnostics: Nano availability, RAM hint,
|                                    inference counters, App Check status, Remote Config values
|
+-- /trainer                         Native Trainer Portal home (role gated)
|     +-- /trainer/submit            New dialect entry form
|     +-- /trainer/queue             Review queue (pending submissions in trainer's dialect)
|     +-- /trainer/entries           Trainer's own submissions and verification status
|
+-- /offline                         Fallback page served by the service worker when route is not cached

Global overlays (rendered in root layout, client only):
  TelemetryHeaderBar      InferenceSourcePill, ConnectivityBadge, DataSavedCounter, account menu
  NanoDownloadBanner      Sticky banner while Gemini Nano downloads
  OfflineBanner           Appears within 100 ms of losing connectivity
  TelemetryDrawer         Opened from the pill: last 20 inference events with source and latency
  SignInUpgradeModal      Anonymous to Google account linking
  Toaster                 Non-blocking status messages
```

### 2.2 Navigation Model

| Viewport | Primary navigation | Secondary |
|---|---|---|
| Desktop 1440 px | Left rail: Map, Scenarios, Library, Progress, Trainer (if role), Settings | TelemetryHeaderBar at top |
| Tablet 768 to 1279 px | Collapsible left rail (icons only) | TelemetryHeaderBar |
| Mobile 390 px | Bottom tab bar: Map, Scenarios, Library, Progress | Compact TelemetryHeaderBar, Settings and Trainer in account menu |

---

## 3. User Flows and Task Flows

### Flow A: First-Time Onboarding, Dialect Selection and Gemini Nano Readiness Check

```text
[User opens /]
      |
      v
[Firebase init (client only): initializeApp -> initializeAppCheck -> signInAnonymously]
      |
      v
[Tap "Start learning"] --> /onboarding?step=language
      |
      v
[Select language] --> [Select dialect] --> [Select goal]
      |
      v
[Write users/{uid} profile to Firestore (offline queued if needed)]
      |
      v
/onboarding?step=readiness
      |
      v
[Is window.LanguageModel defined?] --No--> [state: unsupported] ----------------------+
      |Yes                                                                             |
      v                                                                                |
[await LanguageModel.availability(expectedIO options)]                                 |
      |                                                                                |
      +-- "available" ----> [state: ready] -> emerald pill "On-device ready" ---------+ |
      |                                                                               | |
      +-- "downloadable" -> [Show "Download on-device AI (approx size)" button]       | |
      |                        |  user taps (user activation required)                | |
      |                        v                                                      | |
      +-- "downloading" --> [LanguageModel.create({ monitor(m) {                      | |
      |                        m.addEventListener("downloadprogress", e => ...)}})]   | |
      |                        |  NanoDownloadBanner shows e.loaded (0..1)            | |
      |                        |  user may continue; UI never blocks                  | |
      |                        v                                                      | |
      |                     [download complete] -> [state: ready] --------------------+ |
      |                        |                                                      | |
      |                     [error or cancelled] -> [state: fallback] --------------+ | |
      |                                                                             | | |
      +-- "unavailable" --> [state: fallback] (hardware below 12 GB RAM / 22 GB     | | |
                             storage or unsupported GPU)                            | | |
                                                                                    v v v
                                          [Persist nanoStatus in IndexedDB meta and users/{uid}]
                                                             |
                                                             v
                       ready    -> inference preference = PREFER_ON_DEVICE, pill emerald
                       fallback -> inference preference = PREFER_ON_DEVICE (SDK routes to cloud
                                   gemini-3.5-flash-lite), pill sky "Cloud mode"
                       unsupported -> same as fallback, plus tip "Use Chrome 139+ for offline AI"
                                                             |
                                                             v
                                                [Redirect to /map, first stamp region highlighted]
```

Acceptance criteria:

- AC-A1: Readiness state is determined within 1.5 s on supported hardware, and the UI renders a skeleton until hydration (no hydration mismatch).
- AC-A2: The download button is only shown for "downloadable" and is triggered by a user gesture.
- AC-A3: Download progress updates at least every 500 ms and survives navigation (state held in a client context provider).
- AC-A4: On "unavailable" the app is fully usable through cloud fallback and cached content.

### Flow B: Online Scenario Selection, Cloud Multi-Speaker TTS, 24 kHz PCM Streaming and IndexedDB Caching

```text
[User on /map taps region "Ijebu"] --> RegionDrawer --> [Scenario "Greeting an elder in Ijebu Ode"]
      |
      v
/scenarios/ijebu-elder-greeting?tab=listen
      |
      v
[Load scenario: IndexedDB scenarios store -> hit? use it : Firestore scenarios/{id} -> save to IDB]
[Load glossary nodes for scenario: Firestore glossary where scenarioIds array-contains id -> IDB]
      |
      v
[Check audioCache for key = scenarioId + promptHash + ttsModel]
      |
      +-- HIT --> [Decode stored PCM into AudioBuffer (24 kHz, mono, 16-bit)] --> [Play]
      |              |
      |              v
      |           [telemetry: cachedReplay, bytesSaved += blob.bytes] --> DataSavedCounter
      |
      +-- MISS
            |
            v
      [navigator.onLine?] --No--> [Listen tab shows "Audio not cached yet. Connect once to save it."]
            |Yes                   (cloud action dimmed, drills still available)
            v
      [Remote Config: tts_enabled? ai_tts_model, ai_tts_style_instruction, tts_voice_map_json]
            |
            v
      [Build TTS request (no topK, no topP):
         model: gemini-3.1-flash-tts-preview
         contents: "TTS the following conversation between Mama and Tunde: ...script..."
         generationConfig: {
           responseModalities: ["AUDIO"],
           speechConfig: { multiSpeakerVoiceConfig: { speakerVoiceConfigs: [
             { speaker: "Mama",  voiceConfig: { prebuiltVoiceConfig: { voiceName: <map> } } },
             { speaker: "Tunde", voiceConfig: { prebuiltVoiceConfig: { voiceName: <map> } } } ] } }
         } ]
            |
            v
      [Pill -> sky "IN_CLOUD · TTS"]   [App Check token attached automatically by SDK]
            |
            v
      [Stream response: for each chunk with inlineData (audio/L16;rate=24000 PCM base64)]
            |   decode base64 -> Int16Array -> Float32Array
            |   schedule into AudioContext({ sampleRate: 24000 }) at nextStartTime
            |   append chunk bytes to in-memory buffer
            v
      [First chunk plays (target under 1.5 s from tap)]  Waveform animates
            |
            v
      [Stream ends] --> [Concatenate PCM -> save audioCache record
                          { key, pcm: ArrayBuffer, sampleRate: 24000, channels: 1,
                            bytes, durationMs, ttsModel, promptHash, createdAt }]
            |
            v
      [Cache indicator turns gold "Saved offline"]  [Firestore users/{uid}/progress listened = true]
            |
            v
      [On error: 429 or 5xx -> retry once after 2 s; App Check failure -> show "Security check failed";
       mid-stream offline -> keep partial audio playing, discard partial cache, show retry]
```

Acceptance criteria:

- AC-B1: Playback starts on the first streamed chunk without waiting for the full response.
- AC-B2: The cached record replays offline with identical audio and zero network requests.
- AC-B3: No Gemini API key exists in client code; all calls go through Firebase AI Logic with App Check.
- AC-B4: When tts_enabled is false in Remote Config, the synthesize action is hidden and cached audio still plays.

### Flow C: Offline Airplane Mode Drill Execution

```text
[User enables Airplane Mode]
      |
      v
[window "offline" event + navigator.onLine === false]
      |  within 100 ms
      v
[OfflineBanner visible, ConnectivityBadge "Offline", cloud-only actions dimmed (opacity 40%,
 aria-disabled, tooltip "Needs connection"), inference mode for drills forced to ONLY_ON_DEVICE]
      |
      v
[User opens ?tab=vocab or ?tab=tone]
      |
      v
[nanoStatus === ready?] --No--> [Deterministic fallback: src/lib/ai/fallback-quiz.ts builds quiz
      |Yes                       from cached glossary, pill grey "OFFLINE · CACHED", no data counted
      |                          as on-device inference, but still fully usable]
      v
[Local RAG injection:
   1. Read glossary nodes for dialectId and scenarioId from IndexedDB
   2. Rank top N (Remote Config quiz_grounding_max_entries, default 12) by scenario membership
      and learner weakness (lowest tonal accuracy class first)
   3. Serialize to compact JSON context block]
      |
      v
[System instruction = cached Remote Config value ai_system_instruction_quiz
 + dialect_rules_json[dialectId] (both last-activated values, persisted by Remote Config SDK)]
      |
      v
[model = getGenerativeModel(ai, { mode: ONLY_ON_DEVICE, ...
   generationConfig: { responseMimeType: "application/json",
                       responseSchema: VocabularyQuizSchema, temperature: 0.4 } })]
      |
      v
[result = await model.generateContent(prompt)]   Pill emerald "ON_DEVICE"
      |
      v
[JSON.parse -> isVocabularyQuiz guard]
      |
      +-- invalid --> retry once --> still invalid --> fallback-quiz.ts
      |
      v
[Render quiz. Each answer:
   1. Deterministic pre-check (NFC normalize, compare headword and tone marks)
   2. For tone drills: Nano grading call with TonalGradingSchema (ONLY_ON_DEVICE)
   3. Show per-syllable tone feedback (H/M/L) and meaning explanation]
      |
      v
[Each successful ON_DEVICE completion:
   telemetry.onDeviceCount += 1
   bytesSaved += telemetry_cloud_drill_kb * 1024
   nairaSaved  = (bytesSaved / 1048576) * telemetry_naira_per_mb
   write event to IndexedDB telemetry store]
      |
      v
[Drill result appended to IndexedDB drillQueue { uid, scenarioId, scores, tonalStats, ts }]
      |
      v
[Scenario accuracy >= stamp_accuracy_threshold (0.8)?] --Yes--> [StampUnlockedModal (local)]
      |
      v
[User disables Airplane Mode -> "online" event]
      |
      v
[Sync drillQueue to Firestore (batched writes), Firestore offline cache flushes pending writes,
 Remote Config fetchAndActivate (respecting minimumFetchIntervalMillis), banner hides,
 drills return to PREFER_ON_DEVICE]
```

Acceptance criteria:

- AC-C1: A full 5-question quiz and a 5-item tone drill complete in Airplane Mode with zero network requests (DevTools Network panel shows none).
- AC-C2: Pill shows ON_DEVICE for every Nano response, bound to the SDK inference source, not to a guess.
- AC-C3: Data Saved counter increases only on genuine ON_DEVICE completions and cached audio replays.
- AC-C4: Queued results sync within 5 s of reconnecting.

### Flow D: Native Speaker Trainer Portal

```text
[Trainer opens /trainer]
      |
      v
[Signed in with Google?] --No--> [SignInUpgradeModal: Google sign-in (linkWithPopup if anonymous)]
      |Yes
      v
[Read users/{uid}.role] --role != "trainer"--> [Request access screen: submits trainerRequests doc]
      |trainer
      v
/trainer  (dialect assignment, counts: pending, approved, rejected)
      |
      +--> /trainer/submit
      |       |
      |       v
      |    [Form: headword (DiacriticPicker), dialect (pre-filled), standard form,
      |     English gloss, tone pattern buttons (H M L per syllable), example sentence,
      |     example translation, optional note, related scenario]
      |       |
      |       v
      |    [Client validation: NFC normalize, syllable count == tone pattern length,
      |     required fields, max lengths]
      |       |
      |       v
      |    [Optional on-device assist (PREFER_ON_DEVICE): Nano returns Schema.object
      |     { syllables[], suggestedTonePattern[], warnings[] } to flag inconsistencies.
      |     Trainer decides; AI never overwrites trainer input]
      |       |
      |       v
      |    [Write trainerSubmissions/{id} status "pending" (queued offline if needed)]
      |
      +--> /trainer/queue
              |
              v
           [List pending submissions for same dialect, excluding own]
              |
              v
           [Approve -> Cloud Firestore batch: trainerSubmissions status "approved",
            create glossary/{entryId} with verified true, verifiedBy [submitter, reviewer]]
           [Reject -> status "rejected" with reason]
              |
              v
           [Admin (Lead Architect) periodically promotes approved phonetic rules into
            Remote Config dialect_rules_json and publishes a new template version]
              |
              v
           [Clients receive update via fetchAndActivate on next launch or real-time
            onConfigUpdate listener, then activate(); new rules affect next drill]
```

Acceptance criteria:

- AC-D1: Only users with role "trainer" or "admin" can create or review submissions (enforced in Security Rules, not only UI).
- AC-D2: A trainer cannot approve their own submission.
- AC-D3: Approved entries appear in learner glossary caches after the next sync.
- AC-D4: Remote Config template update is reflected in the app without redeploying (demo segment 4).

---

## 4. Functional Requirements Document (FRD)

### 4.1 Requirement Catalogue

| ID | Area | Requirement | Input | Output |
|---|---|---|---|---|
| FR-AUTH-01 | Auth | Sign in anonymously on first launch | none | Firebase user with isAnonymous true |
| FR-AUTH-02 | Auth | Upgrade to Google via linkWithPopup preserving uid and data | user gesture | linked credential |
| FR-AUTH-03 | Auth | Read role from users/{uid}.role, default "learner" | uid | role |
| FR-ONB-01 | Onboarding | Persist language, dialect, goal | selections | users/{uid} fields |
| FR-ONB-02 | Onboarding | Run Nano readiness state machine (Flow A) | browser APIs | NanoStatus union |
| FR-MAP-01 | Map | Render SVG map with dialect regions, stamp state per region | dialects, stamps | interactive map |
| FR-MAP-02 | Map | Region selection opens RegionDrawer with scenarios | regionId | drawer |
| FR-SCN-01 | Scenario | Load scenario from IDB first, then Firestore | scenarioId | Scenario |
| FR-SCN-02 | Scenario | Cache scenario and linked glossary nodes in IDB | Scenario | IDB records |
| FR-TTS-01 | TTS | Synthesize two-speaker dialogue with gemini-3.1-flash-tts-preview, responseModalities AUDIO | script, voice map | PCM stream |
| FR-TTS-02 | TTS | Stream 24 kHz PCM to Web Audio with gapless scheduling | chunks | audio playback |
| FR-TTS-03 | TTS | Persist complete PCM in audioCache | ArrayBuffer | IDB record |
| FR-TTS-04 | TTS | Replay from cache offline | key | audio playback |
| FR-AI-01 | AI | Generate vocabulary quiz using VocabularyQuizSchema, grounded on cached glossary | glossary nodes, dialect rules | VocabularyQuiz JSON |
| FR-AI-02 | AI | Generate tonal drill items using TonalDrillSchema | glossary nodes | TonalDrill JSON |
| FR-AI-03 | AI | Grade learner tonal answer using TonalGradingSchema | expected, answer | TonalGrading JSON |
| FR-AI-04 | AI | Use PREFER_ON_DEVICE online, ONLY_ON_DEVICE offline | connectivity, nanoStatus | mode |
| FR-AI-05 | AI | Validate all model output with runtime guards; fallback to deterministic generator | raw text | typed object |
| FR-AI-06 | AI | Strip forbidden generationConfig keys (topK, topP, thinking level MINIMAL) before every call | config | sanitized config |
| FR-TEL-01 | Telemetry | Record inference events { source, latencyMs, feature, ts } | SDK response | IDB event |
| FR-TEL-02 | Telemetry | Bind InferenceSourcePill to latest event source | event | pill state |
| FR-TEL-03 | Telemetry | Data saved formula: on-device completion adds telemetry_cloud_drill_kb x 1024 bytes; cached audio replay adds record.bytes; Naira = MB x telemetry_naira_per_mb | events | counter values |
| FR-TEL-04 | Telemetry | Persist summary to users/{uid}/telemetry/summary on sync | summary | Firestore doc |
| FR-TONE-01 | Tone | Compute Tonal Accuracy per class (H, M, L) per language | graded items | stats |
| FR-TONE-02 | Tone | DiacriticPicker inserts NFC-normalized characters at caret | key press | text |
| FR-STAMP-01 | Stamps | Award stamp when scenario accuracy meets stamp_accuracy_threshold | scores | stamp record |
| FR-SYNC-01 | Sync | Flush drillQueue to Firestore on reconnect, idempotent by clientEventId | queue | Firestore writes |
| FR-RC-01 | Remote Config | Initialize defaults, fetchAndActivate on load, real-time onConfigUpdate listener | none | active config |
| FR-RC-02 | Remote Config | Expose typed getters for all keys in section 4.4 | key | typed value |
| FR-SEC-01 | Security | Initialize App Check before any Firebase product call | env | App Check instance |
| FR-SEC-02 | Security | Debug token mode only when NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN is set | env | debug provider |
| FR-TRN-01 | Trainer | Create submission with validation | form | trainerSubmissions doc |
| FR-TRN-02 | Trainer | Review queue approve or reject (not own) | submission | status update, glossary doc |
| FR-OPS-01 | Ops | Budget alert at 5, 15, 30 USD with documented spend cap procedure | billing | alerts |

### 4.2 Cloud Firestore Data Model

```text
users/{uid}
  displayName: string | null
  role: "learner" | "trainer" | "admin"           (writable only by admin)
  isAnonymous: boolean
  languageId: "yo" | "ig" | "ha" | "pcm"
  dialectId: string                                (e.g. "yo-ijebu")
  goal: "elder-greetings" | "market" | "family" | "transit"
  nanoStatus: "ready" | "fallback" | "unsupported"
  createdAt: Timestamp
  updatedAt: Timestamp

users/{uid}/progress/{dialectId}
  scenariosCompleted: string[]
  scenarioScores: map<scenarioId, number>          (0..1 best accuracy)
  tonal: { H: {correct: number, total: number},
           M: {correct: number, total: number},
           L: {correct: number, total: number} }
  lastPracticedAt: Timestamp

users/{uid}/stamps/{stampId}                       (stampId = dialectId + "_" + scenarioId)
  dialectId: string
  scenarioId: string
  accuracy: number
  earnedAt: Timestamp
  earnedOffline: boolean

users/{uid}/telemetry/summary
  onDeviceCount: number
  cloudCount: number
  cachedReplayCount: number
  bytesSaved: number
  nairaSaved: number
  updatedAt: Timestamp

users/{uid}/drillResults/{clientEventId}          (idempotent sync target)
  scenarioId: string
  kind: "vocab" | "tone"
  score: number
  items: number
  inferenceSource: "ON_DEVICE" | "IN_CLOUD" | "CACHED_FALLBACK"
  createdAt: Timestamp

languages/{languageId}                             (public read)
  name: string, nativeName: string, toneSystem: "three-tone" | "two-tone-downstep" | "none"

dialects/{dialectId}                               (public read)
  languageId: string
  name: string                                     (e.g. "Ijebu")
  region: string                                   (e.g. "Ijebu Ode, Ogun State")
  mapRegionId: string                              (SVG path id)
  stampArt: string                                 (SVG asset path)
  order: number

scenarios/{scenarioId}                             (public read)
  dialectId: string
  title: string
  summary: string
  culturalNote: string
  speakers: [{ id: string, displayName: string, role: string, voiceKey: string }]
  script: [{ speakerId: string, text: string, translation: string }]
  glossaryEntryIds: string[]
  estimatedAudioBytes: number
  order: number

glossary/{entryId}                                 (public read, trainer or admin write via approval)
  languageId: string
  dialectId: string
  headword: string                                 (NFC, full diacritics)
  standardForm: string | null                      (e.g. "isu" for Ijebu "usu")
  glossEn: string
  syllables: string[]
  tonePattern: ("H" | "M" | "L")[]
  example: { text: string, translation: string } | null
  scenarioIds: string[]
  verified: boolean
  verifiedBy: string[]                             (uids)
  source: "seed" | "trainer"
  updatedAt: Timestamp

trainerSubmissions/{submissionId}
  submittedBy: string                              (uid)
  dialectId: string
  headword, standardForm, glossEn, syllables, tonePattern, example, note
  status: "pending" | "approved" | "rejected"
  reviewerUid: string | null
  rejectionReason: string | null
  createdAt: Timestamp
  reviewedAt: Timestamp | null

trainerRequests/{uid}
  dialectId: string, motivation: string, createdAt: Timestamp
```

Security Rules summary (full rules in firestore.rules, see 4-code-standards.md):

- users/{uid} and subcollections: read and write only when request.auth.uid == uid; role field immutable by owner.
- languages, dialects, scenarios, glossary: public read; writes only by admin, except glossary create allowed in the approval batch for trainers.
- trainerSubmissions: create by trainer for own uid with status "pending"; update to approved or rejected only by a trainer or admin who is not the submitter.
- All access requires App Check enforcement enabled in the console.

Required composite indexes:

- glossary: dialectId ASC, verified ASC, updatedAt DESC
- glossary: scenarioIds ARRAY_CONTAINS, dialectId ASC
- trainerSubmissions: dialectId ASC, status ASC, createdAt ASC

### 4.3 IndexedDB Schema (database "sokomu", version 1, via idb)

| Store | keyPath | Indexes | Value shape | Purpose |
|---|---|---|---|---|
| audioCache | key (string: scenarioId:promptHash:ttsModel) | byScenario (scenarioId) | { key, scenarioId, pcm: ArrayBuffer, sampleRate: 24000, channels: 1, bytes, durationMs, ttsModel, promptHash, createdAt } | Offline dialogue audio |
| glossary | entryId | byDialect (dialectId), byScenario (scenarioIds, multiEntry) | GlossaryEntry | Local RAG grounding |
| scenarios | scenarioId | byDialect (dialectId) | Scenario | Offline scripts |
| drillQueue | clientEventId | byCreatedAt | DrillResult plus synced flag | Offline result queue |
| telemetry | id (auto-increment) | byTs | InferenceEvent | Pill history and counters |
| meta | key | none | { key, value } | nanoStatus, schemaVersion, telemetrySummary, lastSyncAt |

Storage budget: see NFR-STO.

### 4.4 Remote Config Parameters

| Key | Type | In-app default | Purpose |
|---|---|---|---|
| ai_cloud_text_model | string | gemini-3.5-flash-lite | Cloud fallback model for text drills |
| ai_tts_model | string | gemini-3.1-flash-tts-preview | Speech synthesis model |
| ai_drill_temperature | number | 0.4 | Drill generation temperature |
| ai_grading_temperature | number | 0.1 | Grading temperature |
| ai_system_instruction_quiz | string | (see remote-config-defaults.ts) | System instruction for quiz generation |
| ai_system_instruction_tone | string | (default) | System instruction for tonal drills |
| ai_system_instruction_grading | string | (default) | System instruction for grading |
| ai_tts_style_instruction | string | "Read warmly and naturally, as family members speaking at home." | TTS style prefix |
| dialect_rules_json | JSON | {} keyed by dialectId with rules arrays | Regional phonetic and lexical rules |
| tts_voice_map_json | JSON | { "elder_female": "Kore", "elder_male": "Charon", "young_male": "Puck", "young_female": "Leda", "trader": "Fenrir" } | voiceKey to prebuilt voice |
| tts_enabled | boolean | true | Kill switch for TTS |
| cloud_fallback_enabled | boolean | true | Kill switch for cloud text fallback |
| cloud_fallback_daily_limit | number | 50 | Per-device cap on cloud text calls per day |
| quiz_question_count | number | 5 | Questions per quiz |
| quiz_grounding_max_entries | number | 12 | Glossary entries injected per prompt |
| stamp_accuracy_threshold | number | 0.8 | Stamp unlock threshold |
| telemetry_cloud_drill_kb | number | 48 | Estimated KB per equivalent cloud drill round trip |
| telemetry_naira_per_mb | number | 0.78 | Naira per MB |
| feature_trainer_portal | boolean | true | Show trainer portal |
| demo_announcement | string | "" | Live update demo banner text |
| prompt_template_quiz_id | string | sokomu-quiz-v1 | Server Prompt Template ID (cloud path) |
| prompt_template_grade_id | string | sokomu-grade-v1 | Server Prompt Template ID (cloud path) |
| prompt_template_tts_id | string | sokomu-tts-dialogue-v1 | Server Prompt Template ID for TTS |

Server Prompt Templates are used for cloud requests so prompts are versioned server-side. The on-device path cannot call server templates, so it uses the activated Remote Config system instruction strings (persisted by the SDK for offline use). Both sources must be kept semantically identical; the Lead Architect updates both in one change.

Fetch policy: minimumFetchIntervalMillis 3,600,000 in production, 0 in development; real-time updates via onConfigUpdate followed by activate().

### 4.5 Core TypeScript Contracts (summary; canonical code in src/types)

```ts
type LanguageId = "yo" | "ig" | "ha" | "pcm";
type Tone = "H" | "M" | "L";
type InferenceSourceLabel = "ON_DEVICE" | "IN_CLOUD" | "CACHED_FALLBACK";
type NanoStatus =
  | { state: "checking" }
  | { state: "unsupported" }
  | { state: "unavailable" }
  | { state: "downloadable" }
  | { state: "downloading"; progress: number }
  | { state: "ready" }
  | { state: "error"; message: string };
type Connectivity = "online" | "offline";
```

---

## 5. Non-Functional Requirements (NFRs)

| ID | Category | Requirement | Target | Verification |
|---|---|---|---|---|
| NFR-PERF-01 | Latency | Network latency for ON_DEVICE drills | 0 ms (no network request) | DevTools Network panel empty during drill |
| NFR-PERF-02 | Latency | ON_DEVICE quiz generation (5 questions) on reference laptop | p50 under 3 s, p95 under 6 s | Telemetry latency events |
| NFR-PERF-03 | Latency | ON_DEVICE single tone grading | p50 under 1.5 s | Telemetry |
| NFR-PERF-04 | Latency | TTS time to first audio | under 1.5 s on broadband | Manual stopwatch, telemetry |
| NFR-PERF-05 | Latency | Cached audio replay start | under 150 ms | Performance mark |
| NFR-PERF-06 | Web vitals | LCP on /map | under 2.5 s on mid-range mobile | Lighthouse |
| NFR-PERF-07 | Web vitals | CLS | under 0.1 | Lighthouse |
| NFR-PERF-08 | Web vitals | INP | under 200 ms | Lighthouse, field data |
| NFR-OFF-01 | Offline | Offline transition UI recovery (banner, dimming, mode switch) | under 100 ms after offline event | Performance mark between event and render commit |
| NFR-OFF-02 | Offline | Online resync | queue flushed within 5 s | Manual test |
| NFR-OFF-03 | Offline | App shell loads offline after first visit | 100 percent of core routes | Service worker test |
| NFR-STO-01 | Storage | Audio per scenario (24 kHz mono 16-bit PCM is 48,000 bytes per second) | under 3 MB per scenario (about 60 s of dialogue) | IDB inspection |
| NFR-STO-02 | Storage | Total IndexedDB footprint for 6 scenarios plus glossary | under 25 MB | Library page storage meter (navigator.storage.estimate) |
| NFR-STO-03 | Storage | Request persistent storage | navigator.storage.persist() after first cache | Diagnostics page |
| NFR-STO-04 | Storage | JS bundle for first route | under 250 KB gzipped (excluding Firebase lazy chunks) | Next build output |
| NFR-SEC-01 | Security | App Check enforced on Firestore and AI Logic | Enforced mode in console | Console screenshot, rejected request test |
| NFR-SEC-02 | Security | No secrets in repository or history | zero findings | git log search, gitleaks style scan |
| NFR-SEC-03 | Security | Firestore rules deny cross-user access | 100 percent of rule tests pass | Emulator rule tests |
| NFR-SEC-04 | Security | Cloud spend predictability | budget alerts at 5, 15, 30 USD; daily per-device cloud cap | Billing console |
| NFR-A11Y-01 | Accessibility | WCAG 2.2 AA contrast | 4.5:1 text, 3:1 UI components | Axe, manual |
| NFR-A11Y-02 | Accessibility | Keyboard operable | all interactive elements | Manual tab test |
| NFR-A11Y-03 | Accessibility | Screen reader | pill and counter use aria-live="polite"; tone marks announced via aria-label (for example "o with dot below, low tone") | NVDA, TalkBack |
| NFR-A11Y-04 | Accessibility | Reduced motion | respect prefers-reduced-motion | Manual |
| NFR-A11Y-05 | Accessibility | Touch targets | min 44 by 44 px | Redline review |
| NFR-I18N-01 | Text | All language text stored and rendered NFC normalized | 100 percent | Unit test on seed data |
| NFR-COMP-01 | Compatibility | Chrome Desktop 139+ full hybrid; other modern browsers cloud and cached modes | graceful | Manual matrix |
| NFR-REL-01 | Reliability | Malformed model output never reaches UI | 100 percent guarded | Unit tests with invalid JSON |
| NFR-OBS-01 | Observability | Every AI call logs feature, source, latency, success | 100 percent | Telemetry store |
| NFR-COST-01 | Cost | Share of drill interactions on device on capable hardware | 80 percent or more | Telemetry summary |
