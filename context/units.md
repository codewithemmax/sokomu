# Sokomu Work Units (units.md)

Document owner: Technical Program Manager (Olayinka Emmanuel)
Depends on: context/4-code-standards.md, context/5-ai-workflow-rules.md, context/6-progress-tracker.md
Purpose: Decompose the Sokomu WBS into self-contained, parallelizable work units with explicit file ownership, dependencies, and verification gates so multiple AI coding agents or human contributors can execute without merge conflicts.

---

## 1. Execution Dependency Graph

```text
[U-01 Repo Guardrails]
         |
         v
[U-02 Firebase Console & Rules] ---> [U-03 Firebase Client SDK]
         |                                    |
         +---> [U-04 Seed Data & Scripts]     +---> [U-05 Hybrid AI Core]
         |                                    |            |
         |                                    +---> [U-06 IndexedDB & Offline Cache]
         |                                    |            |
         |                                    +------------+---> [U-07 Cloud TTS & PCM Player]
         |                                                 |
         |                                                 +---> [U-08 Telemetry & Path C Logic]
         |
         +---> [U-09 Design Tokens & App Shell]
                        |
                        +---> [U-10 Onboarding & Cultural Map UI]
                        |
                        +---> [U-11 Scenario, Drill & Diacritic UI]  (needs U-05, U-07, U-08)
                        |
                        +---> [U-12 Library, Progress & Settings UI] (needs U-06, U-08)
                        |
                        +---> [U-13 Native Trainer Portal]           (needs U-03, U-05, U-11)
                                       |
                                       v
                        [U-14 Quality, Testing & Audits]
                                       |
                                       v
                        [U-15 Deployment, Demo & Submission]
```

Parallel lanes after U-03 is complete:
- Lane A (Backend and Offline Data): U-04, U-06, U-07
- Lane B (Hybrid AI and Tone Engine): U-05, U-08
- Lane C (Design System and Shell): U-09, U-10

---

## 2. Work Unit Definitions

### Unit U-01: Repository Guardrails and GitHub Metadata
- Sprint: Sprint 0 (November 15)
- Mapped WBS tasks: T-0.7, T-0.8 (T-0.1 to T-0.6 already complete)
- Dependencies: None
- Parallelizable with: U-02, U-09
- Primary owner: AGT (with PLA for GitHub settings)
- Files owned:
  - scripts/check-secrets.ts
  - package.json (scripts section)
- Inputs: context/4-code-standards.md section 2 and 8
- Deliverables:
  - Secret scanner script checking for AIza, BEGIN PRIVATE KEY, client_secret, serviceAccount, and unignored .env files
  - GitHub repository About sidebar verified for Apache-2.0 and topics added
- Done criteria: G2, G5 pass; bun run check:secrets exits 0

### Unit U-02: Firebase Project, Security Rules and Billing Guardrails
- Sprint: Sprint 0 (November 16)
- Mapped WBS tasks: T-1.1, T-1.2, T-1.3, T-1.4, T-1.8, T-1.9, T-1.10, T-1.11, T-1.12, T-1.13, T-1.14
- Dependencies: U-01
- Parallelizable with: U-09
- Primary owner: PLA and Firebase Studio MCP
- Files owned:
  - firebase.json
  - .firebaserc
  - firestore.rules
  - firestore.indexes.json
  - remoteconfig.template.json
  - tests/firestore.rules.test.ts
- Inputs: context/2-architecture.md section 4.2 and 4.4, context/4-code-standards.md section 7
- Deliverables:
  - Firebase project configured with Anonymous + Google Auth, Firestore, App Check (reCAPTCHA Enterprise + debug tokens), Remote Config template, and Server Prompt Templates
  - Firestore rules and composite indexes deployed and tested with emulator
  - Cloud Billing budget alerts at 5, 15, and 30 USD; browser API key restricted by HTTP referrer
- Done criteria: G4, G5 pass; emulator unit tests cover all allow/deny paths; no secrets committed

### Unit U-03: Firebase Client SDK, App Check, Auth and Remote Config Layer
- Sprint: Sprint 0 (November 16)
- Mapped WBS tasks: T-1.5, T-1.6, T-1.7
- Dependencies: U-02
- Parallelizable with: U-04, U-09
- Primary owner: AGT
- Files owned:
  - src/types/globals.d.ts
  - src/lib/firebase/config.ts
  - src/lib/firebase/app-check.ts
  - src/lib/firebase/client.ts
  - src/lib/firebase/auth.ts
  - src/lib/firebase/firestore.ts
  - src/lib/firebase/remote-config-defaults.ts
  - src/lib/firebase/remote-config.ts
  - src/hooks/useAuthUser.ts
  - src/hooks/useRemoteConfigValue.ts
  - src/app/providers.tsx (FirebaseProvider portion)
- Inputs: context/4-code-standards.md section 3 and 4.1 to 4.4
- Deliverables:
  - Lazy, SSR-guarded singleton initialization in fixed order: initializeApp -> initAppCheck -> Auth, Firestore (persistent local cache), Remote Config, AI
  - Anonymous sign-in and Google linkWithPopup upgrade
  - Typed Remote Config getters and real-time onConfigUpdate listener
- Done criteria: G1, G2, G5, G6 pass; App Check initializes before any product call

### Unit U-04: Linguistic Seed Data and Firestore Seeder
- Sprint: Sprint 2 (November 15 to 21)
- Mapped WBS tasks: T-2.1, T-2.2, T-2.3, T-2.4, T-2.5, T-2.6, T-2.7
- Dependencies: U-02
- Parallelizable with: U-03, U-05, U-06, U-09
- Primary owner: NDR (content) and AGT (scripts)
- Files owned:
  - src/types/domain.ts
  - scripts/seed-data/languages.json
  - scripts/seed-data/dialects.json
  - scripts/seed-data/scenarios.json
  - scripts/seed-data/glossary.json
  - scripts/seed-firestore.ts
- Inputs: context/1-project-overview.md section 1.1 and 2.1, context/2-architecture.md section 4.2
- Deliverables:
  - 4 languages, 8 dialects, 6 two-speaker scenario scripts, and 15+ NFC-normalized glossary entries per scenario dialect
  - Native reviewer verification flags applied; dialect_rules_json populated in Remote Config
- Done criteria: G1, G3 (NFC normalization check), G5 pass; seeded data readable through Security Rules

### Unit U-05: Hybrid AI Core, Schemas, Nano Readiness and Tone Engine
- Sprint: Sprint 2 (November 19 to 21)
- Mapped WBS tasks: T-3.1 to T-3.14
- Dependencies: U-03, U-04 (domain types)
- Parallelizable with: U-06, U-09, U-10
- Primary owner: AGT
- Files owned:
  - src/types/chrome-ai.d.ts
  - src/types/ai.ts
  - src/types/guards.ts
  - src/lib/ai/config.ts
  - src/lib/ai/nano.ts
  - src/lib/ai/schemas.ts
  - src/lib/ai/models.ts
  - src/lib/ai/grounding.ts
  - src/lib/ai/prompts.ts
  - src/lib/ai/inference-source.ts
  - src/lib/ai/fallback-quiz.ts
  - src/lib/tone/normalize.ts
  - src/lib/tone/compare.ts
  - src/hooks/useNanoReadiness.ts
  - src/hooks/useHybridModel.ts
- Inputs: context/2-architecture.md Flow A and C, context/4-code-standards.md section 4.5 to 4.8, 5, 6
- Deliverables:
  - Chrome LanguageModel availability state machine and non-blocking download monitor
  - Structured JSON generation via PREFER_ON_DEVICE, ONLY_ON_DEVICE, and ONLY_IN_CLOUD with sanitizeGenerationConfig guard
  - Runtime type guards with allowedEntryIds grounding check and deterministic fallback quiz generator
  - Deterministic NFC tone comparison and grading pipeline
- Done criteria: G1, G2, G3 (unit tests for config, guards, tone, fallback quiz, inference source), G6 pass

### Unit U-06: IndexedDB Storage, App Shell Service Worker and Sync Engine
- Sprint: Sprint 3 (November 22 to 23)
- Mapped WBS tasks: T-4.1, T-4.2, T-4.7, T-4.8, T-4.9
- Dependencies: U-03, U-04 (domain types)
- Parallelizable with: U-05, U-09, U-10
- Primary owner: AGT
- Files owned:
  - src/lib/db/idb.ts
  - src/lib/db/audio-cache.ts
  - src/lib/db/glossary-cache.ts
  - src/lib/db/scenario-cache.ts
  - src/lib/db/drill-queue.ts
  - src/lib/db/telemetry-store.ts
  - src/lib/sync/sync-engine.ts
  - src/hooks/useOnlineStatus.ts
  - public/sw.js
  - src/app/offline/page.tsx
- Inputs: context/2-architecture.md section 4.3 and Flow C, context/4-code-standards.md section 4.9 and 4.10
- Deliverables:
  - IndexedDB "sokomu" v1 stores and typed CRUD helpers
  - IDB-first scenario and glossary loader with Firestore fallback
  - Service worker for app shell and /offline route; idempotent drillQueue flush on reconnect
- Done criteria: G1, G2, G6, G7 pass; offline transition under 100 ms

### Unit U-07: Cloud Multi-Speaker TTS and Gapless 24 kHz PCM Player
- Sprint: Sprint 3 (November 22 to 23)
- Mapped WBS tasks: T-4.3, T-4.4, T-4.5, T-4.6, T-4.10
- Dependencies: U-03, U-05 (models), U-06 (audioCache)
- Parallelizable with: U-08, U-10
- Primary owner: AGT
- Files owned:
  - src/lib/ai/tts.ts
  - src/lib/audio/pcm-player.ts
- Inputs: context/2-architecture.md Flow B, context/4-code-standards.md section 4.7
- Deliverables:
  - Streaming multi-speaker synthesis via gemini-3.1-flash-tts-preview with responseModalities AUDIO
  - Gapless 24 kHz mono 16-bit PCM Web Audio playback starting on first chunk
  - Full PCM persistence in audioCache keyed by scenarioId, promptHash, and ttsModel, plus offline replay and error handling
- Done criteria: G1, G2, G6, G7, G8 pass; first audio under 1.5 s online, offline replay identical

### Unit U-08: Telemetry, Data Saved Math and Path C Progression Logic
- Sprint: Sprint 3 to 4 (November 20 to 24)
- Mapped WBS tasks: T-5.1, T-5.2, T-5.7, T-5.8, T-5.9
- Dependencies: U-03, U-05, U-06
- Parallelizable with: U-07, U-10
- Primary owner: AGT
- Files owned:
  - src/types/telemetry.ts
  - src/hooks/useInferenceTelemetry.ts
  - src/hooks/useDataSaved.ts
  - src/lib/progress/mastery.ts
  - src/lib/progress/stamps.ts
- Inputs: context/2-architecture.md FR-TEL-01 to 04, FR-TONE-01, FR-STAMP-01
- Deliverables:
  - TelemetryProvider and hooks bound directly to SDK inferenceSource
  - Mobile Data and Naira Saved calculator using Remote Config constants (telemetry_cloud_drill_kb, telemetry_naira_per_mb)
  - Tonal Accuracy Mastery (H, M, L) aggregation, stamp award logic, and Firestore summary sync
- Done criteria: G1, G2, G3, G6 pass

### Unit U-09: Design System Tokens, Primitives and App Shell
- Sprint: Sprint 1 (November 17 to 18)
- Mapped WBS tasks: T-5.3, T-5.4, T-5.5, T-5.6, T-6.1, T-6.2, T-6.3, T-6.4, T-6.6, T-6.20
- Dependencies: U-01 (can start UI shell before U-03 finishes; wire live hooks after U-08)
- Parallelizable with: U-02, U-03, U-04, U-05, U-06
- Primary owner: UIX and AGT
- Files owned:
  - src/app/globals.css
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/components/ui/*
  - src/components/layout/*
  - src/components/telemetry/*
  - public/brand/*
  - public/icons/*
- Inputs: context/3-ui-context.md section 2.1, 3, 4.1, 4.2, 4.6, 4.7, 6
- Deliverables:
  - Tailwind v4 @theme tokens and Google Fonts (Noto Serif Display, Noto Sans, JetBrains Mono)
  - Reusable UI primitives, responsive AppShell (LeftRail + BottomTabBar), Landing page
  - TelemetryHeaderBar, InferenceSourcePill, DataSavedCounter, ConnectivityBadge, OfflineBanner, NanoDownloadBanner, TelemetryDrawer, and Remote Config announcement bar
- Done criteria: G1, G2, G6, G9, G10 pass

### Unit U-10: Onboarding Wizard and Cultural Map Dashboard
- Sprint: Sprint 1 to 4 (November 18 and 24)
- Mapped WBS tasks: T-6.5, T-6.7, T-6.8, T-6.9, T-6.10
- Dependencies: U-03, U-05 (readiness), U-08 (stamps and mastery), U-09
- Parallelizable with: U-11, U-12
- Primary owner: UIX and AGT
- Files owned:
  - src/app/onboarding/page.tsx
  - src/app/map/page.tsx
  - src/components/map/*
  - public/maps/nigeria-dialects.svg
  - public/stamps/*.svg
- Inputs: context/2-architecture.md Flow A, context/3-ui-context.md section 2.2, 4.3, 6.4
- Deliverables:
  - Multi-step onboarding wizard (language, dialect, goal, Gemini Nano readiness)
  - Interactive Nigeria SVG dialect map, 8 cultural stamp SVGs, StampCard, RegionDrawer, StampUnlockedModal
- Done criteria: G1, G2, G6, G9, G10 pass

### Unit U-11: Scenario Library, Dual-Speaker Player and Tonal Drill Screens
- Sprint: Sprint 2 to 4 (November 21 to 24)
- Mapped WBS tasks: T-6.11, T-6.12, T-6.13, T-6.14, T-6.15, T-6.19
- Dependencies: U-05, U-07, U-08, U-09
- Parallelizable with: U-10, U-12
- Primary owner: AGT and UIX
- Files owned:
  - src/app/scenarios/page.tsx
  - src/app/scenarios/[scenarioId]/page.tsx
  - src/components/audio/*
  - src/components/drill/*
- Inputs: context/2-architecture.md Flow B and C, context/3-ui-context.md section 2.3, 4.4, 4.5, 5.3
- Deliverables:
  - Scenario filter library and tabbed scenario screen (Listen, Vocabulary, Tone drill)
  - DualSpeakerWaveformPlayer (dynamic ssr: false), transcript sync, cultural note
  - QuizCard, ToneDrill, DiacriticPicker (Yoruba, Igbo, Hausa NFC input), ToneChip, FeedbackCard, and offline dimming matrix
- Done criteria: G1, G2, G6, G7, G8, G9, G10 pass

### Unit U-12: Offline Library, Progress, Settings and Diagnostics Pages
- Sprint: Sprint 4 (November 24 to 25)
- Mapped WBS tasks: T-3.15, T-6.16, T-6.17, T-6.18
- Dependencies: U-03, U-06, U-08, U-09
- Parallelizable with: U-10, U-11
- Primary owner: AGT
- Files owned:
  - src/app/library/page.tsx
  - src/app/progress/page.tsx
  - src/app/settings/page.tsx
  - src/app/settings/diagnostics/page.tsx
  - src/components/ui/SignInUpgradeModal.tsx
- Inputs: context/2-architecture.md section 2.1, context/3-ui-context.md
- Deliverables:
  - Offline cache manager with storage estimate and persistent storage request
  - Tonal Accuracy Mastery breakdown, stamps grid, and data saved history
  - Account settings with Google upgrade modal and judge/developer diagnostics page
- Done criteria: G1, G2, G6, G9, G10 pass

### Unit U-13: Native Speaker Trainer Portal
- Sprint: Sprint 4 (November 25)
- Mapped WBS tasks: T-7.1 to T-7.7
- Dependencies: U-03, U-05, U-09, U-11 (DiacriticPicker)
- Parallelizable with: U-12
- Primary owner: AGT and NDR
- Files owned:
  - src/app/trainer/page.tsx
  - src/app/trainer/submit/page.tsx
  - src/app/trainer/queue/page.tsx
  - src/app/trainer/entries/page.tsx
  - src/components/trainer/*
- Inputs: context/2-architecture.md Flow D, context/3-ui-context.md section 2.4
- Deliverables:
  - Trainer role gating, request access flow, EntryForm with tone pattern buttons and optional ON_DEVICE TrainerAssist check
  - Peer review queue (no self-approval) writing approved entries to glossary, DictionaryDrawer, and documented Remote Config rule promotion workflow
- Done criteria: G1, G2, G4, G6, G7, G9, G10 pass

### Unit U-14: Quality, Accessibility, Usability Testing and Security Audit
- Sprint: Sprint 5 (November 26 to 27)
- Mapped WBS tasks: T-6.21, T-8.1 to T-8.8
- Dependencies: U-10, U-11, U-12, U-13
- Parallelizable with: None (integration phase)
- Primary owner: PLA, UIX, NDR, AGT
- Files owned:
  - context/5-ai-workflow-rules.md (Feedback Log and Audio Audit Sheet updates)
  - Cross-cutting fixes across src/
- Inputs: context/5-ai-workflow-rules.md section 3
- Deliverables:
  - All unit tests, Firestore rules tests, and Lighthouse targets passing
  - Usability tests UT-01 to UT-15 executed and S1/S2 findings resolved
  - Full git history secret scan clean
- Done criteria: G1 to G10 pass; zero open S1 issues at code freeze (November 27, 23:59 WAT)

### Unit U-15: Deployment, Demo Production and Devpost Submission
- Sprint: Sprint 6 (November 28 to 30)
- Mapped WBS tasks: T-9.1 to T-9.10
- Dependencies: U-14
- Parallelizable with: None
- Primary owner: PLA
- Files owned:
  - README.md (architecture diagram and spend cap updates)
  - context/6-progress-tracker.md (final sign-off)
- Inputs: context/6-progress-tracker.md section 5 and 6
- Deliverables:
  - Production Firebase Hosting deployment (no debug token in production env)
  - Judge testing instructions with dedicated debug token in Devpost notes
  - Demo video under 2:55 with burned-in English subtitles, final repository audit, and Devpost submission by November 29, 18:00 WAT
- Done criteria: Final Repository Audit Checklist 100 percent checked; services live through December 16, 2026
