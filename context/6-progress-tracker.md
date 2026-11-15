# 6. Progress Tracker: Work Breakdown Structure, Roadmap, Sprint Schedule and Demo Playbook

Document owner: Technical Program Manager (Olayinka Emmanuel)
Updated by: every agent and human after every completed task (see .codexrules Rule 7)
Today at baseline: November 15, 2026
Submission deadline: November 30, 2026 at 2:00 PM PT (23:00 WAT, 22:00 GMT)
Internal submission target: November 29, 2026 at 18:00 WAT (buffer of more than 24 hours)

Status legend: [ ] not started, [~] in progress, [x] done, [!] blocked (reason required)

---

## 1. Current Status Snapshot

| Field | Value |
|---|---|
| Current sprint | Sprint 0: Discovery and Foundation (November 15 to 16) |
| Overall progress | Epic 0 complete, Epic 1 started |
| Next milestone | M1 Foundation ready (November 16, 23:59 WAT) |
| Open blockers | None |
| Open S1 issues | 0 |

---

## 2. Work Breakdown Structure (WBS)

### Epic 0: Repository Foundation and Compliance

User story US-0.1: As the Lead Architect, I want a secure, licensed public repository so the submission cannot be disqualified.

- [x] T-0.1 Harden .gitignore (env files, Firebase credentials, node_modules, .next)
- [x] T-0.2 Add Apache 2.0 LICENSE (Copyright 2026 Olayinka Emmanuel)
- [x] T-0.3 Write judge-ready README.md
- [x] T-0.4 Add .env.example with NEXT_PUBLIC_FIREBASE_* placeholders
- [x] T-0.5 Create public GitHub repo codewithemmax/sokomu on main and push
- [x] T-0.6 Create .codexrules and context/1 to 6 planning suite
- [x] T-0.7 Add scripts/check-secrets.ts and bun run check:secrets script
- [x] T-0.8 Confirm GitHub About sidebar shows Apache-2.0, add topics (firebase, gemini, hybrid-ai, nextjs, yoruba, igbo, hausa, nigerian-pidgin)

### Epic 1: Firebase Platform and Security

US-1.1: As a learner, my data is protected and the app's AI endpoints cannot be abused.
US-1.2: As the operator, I can change prompts and limits without redeploying.

- [x] T-1.1 Create Firebase project, register web app, enable Gemini Developer API backend for Firebase AI Logic
- [~] T-1.2 Enable Authentication providers: Anonymous and Google
- [~] T-1.3 Create Cloud Firestore database (production mode), choose region (europe-west2 or nearest to users)
- [~] T-1.4 Create reCAPTCHA Enterprise key, register App Check for the web app, register debug tokens
- [x] T-1.5 Implement src/lib/firebase/config.ts, app-check.ts, client.ts (fixed init order)
- [x] T-1.6 Implement src/lib/firebase/auth.ts (ensureAnonymousUser, upgradeWithGoogle with linkWithPopup)
- [x] T-1.7 Implement remote-config-defaults.ts and remote-config.ts (typed getters, onConfigUpdate)
- [x] T-1.8 Publish initial Remote Config template matching defaults; export to remoteconfig.template.json
- [~] T-1.9 Create Server Prompt Templates sokomu-quiz-v1, sokomu-grade-v1, sokomu-tts-dialogue-v1
- [x] T-1.10 Write firestore.rules and firestore.indexes.json; add firebase.json
- [x] T-1.11 Firestore rules unit tests with emulator (all allow and deny paths)
- [~] T-1.12 Enable App Check enforcement for Firestore and Firebase AI Logic
- [x] T-1.13 Configure Cloud Billing budget alerts at 5, 15, 30 USD and document spend cap procedure in README
- [~] T-1.14 Restrict browser API key by HTTP referrer (localhost and hosting domain)

### Epic 2: Content and Data Seeding

US-2.1: As a learner, I practise with verified regional dialect content.

- [ ] T-2.1 Define seed JSON: 4 languages, 8 dialects (yo-ijebu, yo-ekiti, yo-ondo, ig-owerri, ig-onitsha, ig-ikwerre, ha-kano, pcm-lagos)
- [ ] T-2.2 Write 6 scenario scripts (8 to 12 lines each, two speakers) with translations and cultural notes
- [ ] T-2.3 Build glossary seed: at least 15 entries per scenario dialect with syllables and tone patterns, NFC normalized
- [ ] T-2.4 Native reviewer pass on scripts and glossary; set verified flags
- [ ] T-2.5 scripts/seed-firestore.ts (Admin SDK via local application default credentials, never committed keys)
- [ ] T-2.6 Seed Firestore and verify reads through Security Rules
- [x] T-2.7 Populate dialect_rules_json for each dialect in Remote Config

### Epic 3: Hybrid AI Engine

US-3.1: As a learner, drills run instantly on my device and fall back to the cloud when needed.
US-3.2: As a judge, I can see where each response was generated.

- [ ] T-3.1 Ambient Chrome AI types (src/types/chrome-ai.d.ts) and globals.d.ts
- [ ] T-3.2 src/lib/ai/nano.ts availability and download with monitor progress
- [ ] T-3.3 NanoReadinessProvider and useNanoReadiness hook (state machine in Flow A)
- [ ] T-3.4 src/lib/ai/config.ts sanitizeGenerationConfig plus unit tests
- [ ] T-3.5 src/lib/ai/schemas.ts plus src/types/ai.ts plus src/types/guards.ts (with tests)
- [ ] T-3.6 src/lib/ai/models.ts getStructuredModel (PREFER_ON_DEVICE, ONLY_ON_DEVICE, ONLY_IN_CLOUD)
- [ ] T-3.7 src/lib/ai/grounding.ts local RAG selection and serialization
- [ ] T-3.8 src/lib/ai/prompts.ts data-only prompt builders
- [ ] T-3.9 useHybridModel hook: generate, parse, guard, retry, fallback, telemetry record
- [ ] T-3.10 src/lib/ai/inference-source.ts normalization plus test
- [ ] T-3.11 src/lib/tone/normalize.ts and compare.ts with full unit tests (Yoruba and Igbo cases including ọkọ, ọkọ̀, ọ̀kọ̀)
- [ ] T-3.12 Tonal grading pipeline: deterministic compare first, Nano feedback second
- [ ] T-3.13 src/lib/ai/fallback-quiz.ts deterministic generator plus tests
- [ ] T-3.14 Cloud fallback daily limit enforcement (cloud_fallback_daily_limit, stored in IDB meta)
- [ ] T-3.15 Diagnostics page: Nano status, force cloud toggle, Remote Config values, App Check status

### Epic 4: Cloud TTS and Offline Caching

US-4.1: As a diaspora learner, I hear natural two-speaker dialogue in my family dialect.
US-4.2: As a student, I download once and replay offline forever.

- [ ] T-4.1 src/lib/db/idb.ts schema v1 and store modules
- [ ] T-4.2 Scenario and glossary cache (IDB first, Firestore fallback)
- [ ] T-4.3 src/lib/ai/tts.ts streaming multi-speaker synthesis
- [ ] T-4.4 src/lib/audio/pcm-player.ts gapless 24 kHz playback
- [ ] T-4.5 Persist complete PCM in audioCache, promptHash keying
- [ ] T-4.6 Cached replay path plus telemetry cachedReplay event
- [ ] T-4.7 navigator.storage.persist request and storage estimate on Library page
- [ ] T-4.8 Service worker for app shell and /offline page
- [ ] T-4.9 Sync engine: drillQueue flush on reconnect, idempotent clientEventId
- [ ] T-4.10 TTS error handling (retry, mid-stream offline, App Check failure)

### Epic 5: Telemetry and Path C Progression

US-5.1: As a learner, I see honest proof of where my practice ran and what it saved me.
US-5.2: As a learner, I earn dialect stamps for real cultural milestones.

- [ ] T-5.1 TelemetryProvider and useInferenceTelemetry (event store, latest source)
- [ ] T-5.2 useDataSaved implementing FR-TEL-03 with Remote Config constants
- [ ] T-5.3 InferenceSourcePill component
- [ ] T-5.4 DataSavedCounter component
- [ ] T-5.5 ConnectivityBadge and OfflineBanner (under 100 ms transition)
- [ ] T-5.6 TelemetryDrawer
- [ ] T-5.7 Tonal Accuracy Mastery computation and Firestore progress writes
- [ ] T-5.8 Stamp award logic and StampUnlockedModal
- [ ] T-5.9 Telemetry summary sync to users/{uid}/telemetry/summary

### Epic 6: UI and Screens

US-6.1: As a learner, the app feels respectful, beautiful, and clear on desktop and mobile.

- [ ] T-6.1 Tailwind v4 theme tokens in globals.css, fonts via next/font (Noto Serif Display, Noto Sans, JetBrains Mono)
- [ ] T-6.2 UI primitives: Button, Card, Drawer, Modal, Tabs, Tooltip, Toaster, ProgressBar
- [ ] T-6.3 AppShell: LeftRail, BottomTabBar, TelemetryHeaderBar
- [ ] T-6.4 Landing page
- [ ] T-6.5 Onboarding wizard (language, dialect, goal, readiness)
- [ ] T-6.6 NanoDownloadBanner
- [ ] T-6.7 NigeriaMap SVG component and asset
- [ ] T-6.8 StampCard and 8 stamp SVGs
- [ ] T-6.9 RegionDrawer
- [ ] T-6.10 Map dashboard page
- [ ] T-6.11 Scenario library page
- [ ] T-6.12 Scenario page: tabs, DualSpeakerPlayer, transcript, cultural note
- [ ] T-6.13 QuizCard and Vocabulary tab
- [ ] T-6.14 DiacriticPicker
- [ ] T-6.15 ToneDrill, ToneChip, FeedbackCard
- [ ] T-6.16 Progress page (mastery bars, stamps grid, data saved history)
- [ ] T-6.17 Library page (cached scenarios, storage meter, clear cache)
- [ ] T-6.18 Settings page with SignInUpgradeModal
- [ ] T-6.19 Offline dimming applied per matrix in 3-ui-context.md 5.3
- [ ] T-6.20 Remote Config demo_announcement bar
- [ ] T-6.21 Accessibility pass (focus, aria-live, labels, contrast, reduced motion)

### Epic 7: Native Trainer Portal

US-7.1: As a native trainer, I can submit and review dialect entries with correct tones, even on a weak network.

- [ ] T-7.1 Role gating and trainer request flow
- [ ] T-7.2 EntryForm with DiacriticPicker and tone pattern buttons
- [ ] T-7.3 Optional on-device TrainerAssist check (Schema.object)
- [ ] T-7.4 Submission write with offline queue indicator
- [ ] T-7.5 Review queue with approve or reject batch (no self-approval)
- [ ] T-7.6 DictionaryDrawer for learners and trainers
- [ ] T-7.7 Document Remote Config dialect rule promotion procedure

### Epic 8: Quality, Testing and Hardening

- [ ] T-8.1 Unit test suite green (bun test)
- [ ] T-8.2 Rules tests green
- [ ] T-8.3 Execute usability tests UT-01 to UT-15, log findings in 5-ai-workflow-rules.md
- [ ] T-8.4 Native audio audit (UT-05) and content audit (UT-06)
- [ ] T-8.5 Fix all S1 and S2 findings
- [ ] T-8.6 Lighthouse pass on /map and scenario page (LCP, CLS, INP targets)
- [ ] T-8.7 Cross-device matrix: Chrome 139+ Nano capable, low-RAM laptop, Android Chrome
- [ ] T-8.8 Secret audit of full git history (git log -p search for key patterns)

### Epic 9: Deployment and Submission

- [ ] T-9.1 Deploy to Firebase Hosting or App Hosting with production env (no debug token)
- [ ] T-9.2 Judge build or judge instructions with a dedicated registered debug token, documented in Devpost testing notes (not in git)
- [ ] T-9.3 Architecture diagram image for README and Devpost
- [ ] T-9.4 Pre-cache demo scenarios on recording machine
- [ ] T-9.5 Record demo video (under 2:55) per playbook in section 5
- [ ] T-9.6 Burn in hardcoded English subtitles, export 1080p, upload to YouTube (public or unlisted per rules)
- [ ] T-9.7 Devpost write-up: problem, solution, hybrid architecture, Firebase products used, challenges, impact, what is next
- [ ] T-9.8 Final repository audit (section 6)
- [ ] T-9.9 Submit on Devpost by internal target November 29, 18:00 WAT
- [ ] T-9.10 Post-submission: freeze main, keep services and quota alive through December 16, 2026

---

## 3. Milestones

| ID | Milestone | Date (WAT, end of day) | Exit criteria |
|---|---|---|---|
| M0 | Planning baseline | November 15 | Epic 0 tasks T-0.1 to T-0.6 done |
| M1 | Foundation ready | November 16 | Firebase project, App Check debug path, client init, Remote Config defaults, rules deployed |
| M2 | Design system ready | November 18 | Tokens, fonts, primitives, AppShell, header telemetry shell |
| M3 | Core hybrid engine | November 21 | Structured Nano quiz and tone drill work ON_DEVICE with fallback and live pill |
| M4 | Offline and TTS complete | November 23 | TTS streaming, IDB cache, Airplane Mode drill flow, sync engine |
| M5 | Feature complete | November 25 | Map, stamps, progress, trainer portal, Remote Config live update |
| M6 | Tested and hardened | November 27 | Usability tests run, S1 and S2 fixed, audits done |
| M7 | Demo recorded | November 28 | Video under 2:55 with subtitles, Devpost draft complete |
| M8 | Submitted | November 29, 18:00 WAT | Devpost submission confirmed, repo audited |
| Deadline | Official | November 30, 14:00 PT (23:00 WAT) | Buffer only, no new work |

---

## 4. Project Roadmap and Day-by-Day Sprint Schedule

```text
Nov:  15  16 | 17  18 | 19  20  21 | 22  23 | 24  25 | 26  27 | 28 | 29 | 30
      Disc+Fnd | Design | Core Hybrid  | Offline | Feature | Testing | Demo| Sub| Buffer
      Sprint 0 | Spr 1  | Sprint 2     | Spr 3   | Spr 4   | Spr 5   | Sprint 6
```

| Date | Sprint and phase | Planned tasks | Deliverable at end of day |
|---|---|---|---|
| Sun Nov 15 | Sprint 0: Discovery | T-0.1 to T-0.8, review context suite, start T-2.1 and T-2.2 drafting with native reviewers | Repo compliant, planning suite committed, reviewers contacted |
| Mon Nov 16 | Sprint 0: Foundation | T-1.1 to T-1.8, T-1.10, T-3.1 | Firebase project live, App Check debug working locally, Remote Config defaults, rules deployed |
| Tue Nov 17 | Sprint 1: Design | T-6.1, T-6.2, T-6.3, icon set, stamp art briefs, T-1.11 | Tokens and primitives, AppShell renders with header |
| Wed Nov 18 | Sprint 1: Design | T-6.4, T-6.5 (UI only), T-6.7 map asset, T-6.8 stamps, T-5.3, T-5.4, T-5.5 (UI) | Landing, onboarding screens, map and stamps, telemetry components |
| Thu Nov 19 | Sprint 2: Core Hybrid Engine | T-3.2, T-3.3, T-6.6, T-3.4, T-3.5 | Nano readiness and download banner, schemas and guards with tests |
| Fri Nov 20 | Sprint 2: Core Hybrid Engine | T-3.6, T-3.7, T-3.8, T-3.9, T-3.10, T-5.1 | First ON_DEVICE structured quiz with live pill |
| Sat Nov 21 | Sprint 2: Core Hybrid Engine | T-3.11, T-3.12, T-3.13, T-3.14, T-6.13, T-6.14, T-6.15, T-2.3 to T-2.6 seed | Tone drill with picker and grading, fallback generator, seeded content. M3 |
| Sun Nov 22 | Sprint 3: Offline Caching | T-4.1, T-4.2, T-4.3, T-4.4, T-4.5 | TTS streaming plays and caches audio |
| Mon Nov 23 | Sprint 3: Offline Caching | T-4.6 to T-4.10, T-5.2, T-5.5 behaviour, T-6.19 | Full Airplane Mode flow, data saved counter, sync. M4 |
| Tue Nov 24 | Sprint 4: Features and UI Polish | T-6.9 to T-6.12, T-5.7, T-5.8, T-5.9, T-6.16, T-6.17 | Map dashboard, scenarios, progress, stamps |
| Wed Nov 25 | Sprint 4: Features and UI Polish | T-7.1 to T-7.7, T-6.18, T-6.20, T-1.9, T-1.12 to T-1.14, T-2.7, T-3.15 | Trainer portal, Remote Config live update, enforcement on. M5 |
| Thu Nov 26 | Sprint 5: Testing | T-8.1, T-8.2, T-8.3 (UT-01 to UT-08), T-8.4, T-6.21 | Test findings logged |
| Fri Nov 27 | Sprint 5: Testing and Hardening | T-8.3 (UT-09 to UT-15), T-8.5, T-8.6, T-8.7, T-8.8, T-9.1, T-9.3 | S1 and S2 fixed, deployed, audits passed. M6. Code freeze 23:59 WAT |
| Sat Nov 28 | Sprint 6: Demo Production | T-9.4, T-9.5, T-9.6, T-9.7, T-9.2 | Final video uploaded, Devpost draft complete. M7 |
| Sun Nov 29 | Sprint 6: Submission | T-9.8, T-9.9 by 18:00 WAT | Submitted. M8 |
| Mon Nov 30 | Buffer | Only critical fixes to Devpost text if needed, no code changes after submission unless rules allow | Deadline 14:00 PT |
| Dec 1 to Dec 16 | Judging support | T-9.10, monitor quota, budget, App Check metrics | Services live for judges (judging December 10 to 16) |

Daily ritual: 09:00 WAT review tracker and pick tasks; 21:00 WAT update tracker, push, note blockers.

---

## 5. Demo Video Execution Checklist (target 2:50, hard limit under 2:55)

The five-segment structure follows the 3-minute plan, compressed so the final cut ends by 2:50 with a 5 second safety margin. Planned narrative timestamps (0:45, 1:30, 2:15, 3:00) map to compressed cut points (0:42, 1:24, 2:06, 2:50).

### 5.1 Pre-Production

- [ ] Script written and timed aloud (target 380 to 420 words of narration)
- [ ] Recording machine: Chrome 139+, Gemini Nano status available, 1920 by 1080, zoom 110 percent, bookmarks bar hidden, notifications off
- [ ] Demo account signed in with Google, progress seeded to show 2 earned stamps and partial third
- [ ] Ijebu scenario NOT cached (to show live TTS), Owerri scenario cached (for offline replay)
- [ ] Firebase console tabs open: Remote Config (demo_announcement and dialect rule edit drafted), Firestore (users/{uid}/progress), App Check (metrics showing verified requests)
- [ ] DevTools Network panel docked bottom, cleared, filter All
- [ ] Phone or OS Airplane Mode toggle visible (or use OS network toggle on camera)
- [ ] Screen recorder at 60 fps, microphone tested, background noise check
- [ ] No secrets visible on screen (check .env.local is never opened, console API key columns hidden)

### 5.2 Second-by-Second Production Tracker

| Time | Segment | On screen | Narration focus | Proof point | Done |
|---|---|---|---|---|---|
| 0:00 to 0:08 | Hook | Grandmother greeting audio over Ijebu map region | "My cousin can't greet our grandmother in Ijebu. Textbook Yoruba doesn't teach her dialect." | Emotional hook | [ ] |
| 0:08 to 0:20 | Problem | Text overlays: data cost (N800 per GB), dialect words (isu vs usu), tones (ọkọ, ọkọ̀, ọ̀kọ̀) | Dialect attrition, tone meaning, expensive unstable data | Problem clarity | [ ] |
| 0:20 to 0:42 | Hook and Telemetry | Map dashboard, header bar: emerald ON_DEVICE pill, Data Saved counter in MB and Naira | "Sokomu runs drills on Gemini Nano in Chrome through Firebase AI Logic. This badge comes straight from the SDK inferenceSource." | Live telemetry binding | [ ] |
| 0:42 to 0:55 | Airplane Mode setup | Open Owerri scenario Vocabulary tab, answer one question online | Introduce structured drills (Schema.object JSON, grounded on cached glossary) | Structured output | [ ] |
| 0:55 to 1:12 | Airplane Mode ON_DEVICE quiz | Toggle Airplane Mode on camera, offline banner appears, TTS button dims, quiz continues, pill stays emerald, Network panel empty | "Zero network, zero tokens, zero latency." | Offline hybrid proof | [ ] |
| 1:12 to 1:24 | Tone drill offline | Diacritic picker writes ọkọ̀, feedback "You wrote vehicle, not husband"; counter floats "+48 KB" | Tonal accuracy mastery, honest data saved | Path C and data saved | [ ] |
| 1:24 to 1:38 | Cloud TTS start | Reconnect, open Ijebu scenario, tap Save for offline, pill turns sky IN_CLOUD | "For natural dialect voices we use gemini-3.1-flash-tts-preview with two speakers." | Cloud routing visible | [ ] |
| 1:38 to 1:54 | 24 kHz PCM streaming | Waveform lanes draw as chunks arrive, audio plays immediately | "PCM streams straight into Web Audio, no middleman server." | Streaming | [ ] |
| 1:54 to 2:06 | Cache and offline replay | Chip turns gold "Saved offline", toggle offline, replay works | "Synthesized once, replayed forever offline from IndexedDB." | Cache | [ ] |
| 2:06 to 2:22 | Remote Config live update | Console: edit demo_announcement and Ijebu rule, Publish; app shows announcement without reload; next drill uses rule | "Prompts and dialect rules live in Remote Config and Server Prompt Templates." | Config over code | [ ] |
| 2:22 to 2:34 | Firestore and trainer | Trainer submits an Owerri word with tone pattern; Firestore console shows document; stamp progress in users/{uid} | "Native trainers grow a verified dialect dataset." | Real backend persistence | [ ] |
| 2:34 to 2:44 | App Check proof | App Check metrics page showing verified requests and enforcement on; brief mention of debug tokens for judges | "Every request is attested with reCAPTCHA Enterprise App Check." | Security | [ ] |
| 2:44 to 2:50 | Close | Map with stamps, logo, repo URL, "Apache 2.0, open source" | "Sokomu: So, Koya, Muta. Speak, learn, everywhere." | Memorable close | [ ] |
| 2:50 to 2:54 | Safety margin | Fade out | none | Duration compliance | [ ] |

### 5.3 Post-Production

- [ ] Hardcoded (burned-in) English subtitles for all narration and for Yoruba, Igbo, Hausa, Pidgin audio lines (with translations)
- [ ] Subtitle style: Noto Sans 42 px at 1080p, white with 70 percent black box, bottom center, max 2 lines, diacritics render correctly
- [ ] Final duration verified under 2:55 in the exported file properties (target 2:50)
- [ ] Audio levels normalized (narration about -16 LUFS), dialogue audible
- [ ] No secrets, emails, or personal data visible in any frame (scrub frame by frame around console segments)
- [ ] Export 1080p H.264, upload to YouTube, visibility per Devpost rules, link tested in a logged-out browser
- [ ] Thumbnail: map with stamps and emerald ON_DEVICE pill

---

## 6. Final Repository Audit Checklist (run on November 29 before submitting)

Compliance:

- [ ] LICENSE in root is unmodified Apache 2.0 text and GitHub About sidebar shows Apache-2.0
- [ ] Repository is public at https://github.com/codewithemmax/sokomu
- [ ] README includes overview, hybrid architecture, Firebase products, local setup with Bun, Chrome flags, judge testing notes, license
- [ ] Devpost lists all Firebase products used: Firebase AI Logic (hybrid on-device and cloud), App Check, Remote Config (with Server Prompt Templates), Authentication, Cloud Firestore, Hosting or App Hosting

Security:

- [ ] git log --all -p searched for patterns: AIza, BEGIN PRIVATE KEY, client_secret, serviceAccount, .env.local contents, debug token values: zero hits
- [ ] git ls-files shows no .env (other than .env.example), no service account JSON, no .firebase/ directory
- [ ] App Check enforcement on for Firestore and AI Logic
- [ ] Production hosting environment has no debug token variable
- [ ] Browser API key restricted by HTTP referrer
- [ ] Budget alerts active

Code quality:

- [ ] bun run build passes on a clean clone (bun install then bun run build)
- [ ] bun run lint passes
- [ ] bun test passes
- [ ] Search confirms zero occurrences of topK, topP, and MINIMAL thinking level in src
- [ ] Search confirms zero any types and zero ts-ignore
- [ ] No hardcoded model names outside remote-config-defaults.ts
- [ ] No console errors on /map, scenario page, trainer pages in production build

Product:

- [ ] Airplane Mode drill flow works on recording machine
- [ ] Cloud fallback works on low-RAM device
- [ ] At least 6 scenarios cached and playable offline
- [ ] Remote Config live update works
- [ ] Demo video link works and duration under 2:55

---

## 7. Decisions and Change Requests Log

| ID | Date | Decision or change | Reason | Approved by |
|---|---|---|---|---|
| D-001 | 2026-11-15 | Adopt Path C (Contextual Cultural Mastery) as UX framework | Differentiation, respect-driven pedagogy, aligns with hybrid architecture | Olayinka Emmanuel |
| D-002 | 2026-11-15 | Application code lives under src/ (matches create-next-app scaffold and @/* alias) | Consistency with existing tsconfig | Olayinka Emmanuel |
| D-003 | 2026-11-15 | Demo video segments compressed to end at 2:50 | Hard limit under 2:55 | Olayinka Emmanuel |
| D-004 | 2026-11-15 | Deterministic tone comparison is ground truth; Nano only enriches feedback | Prevent quantized model grading errors | Olayinka Emmanuel |

---

## 8. Change Log (append one row per completed task)

| Date | Task ID | Agent or human | Files touched | Verification |
|---|---|---|---|---|
| 2026-11-14 | T-0.1 | Google Antigravity | .gitignore | git status clean of secrets |
| 2026-11-14 | T-0.2 | Google Antigravity | LICENSE | Official Apache 2.0 text, copyright line set |
| 2026-11-14 | T-0.3 | Google Antigravity | README.md | Reviewed sections |
| 2026-11-14 | T-0.4 | Google Antigravity | .env.example | Placeholders only |
| 2026-11-14 | T-0.5 | Google Antigravity | git remote origin | Pushed main to codewithemmax/sokomu (commit d87b8c1) |
| 2026-11-15 | T-0.6 | Google Antigravity | .codexrules, context/1-project-overview.md to context/6-progress-tracker.md | Documents reviewed for scope and style (no em dashes) |
| 2026-11-15 | T-0.7, T-0.8 | Google Antigravity | LICENSE, package.json, scripts/check-secrets.ts, context/6-progress-tracker.md | bun run check:secrets and tsc --noEmit passed; GitHub topics added and canonical Apache-2.0 LICENSE pushed |
| 2026-11-15 | T-1.1, T-1.8, T-1.10, T-1.11, T-1.13, T-2.7 | Google Antigravity | .firebaserc, firebase.json, firestore.rules, firestore.indexes.json, remoteconfig.template.json, tests/firestore.rules.test.ts, src/types/globals.d.ts, src/types/bun-test.d.ts, README.md, package.json, bun.lock | bun test (7 pass, 45 assertions), tsc --noEmit, and bun run check:secrets passed |
| 2026-11-15 | T-1.5, T-1.6, T-1.7 | Google Antigravity | src/lib/firebase/*, src/hooks/useAuthUser.ts, src/hooks/useRemoteConfigValue.ts, src/app/providers.tsx, src/types/bun-test.d.ts, tests/firebase-client.test.ts, context/6-progress-tracker.md | bun test (12 pass, 51 assertions), tsc --noEmit, and bun run check:secrets passed |
