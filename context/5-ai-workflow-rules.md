# 5. AI Workflow Rules: Agent Protocols, RACI Matrix and Usability Testing Plan

Document owner: Technical Program Manager (Olayinka Emmanuel)
Depends on: .codexrules, context/1 to 4
Read next: context/6-progress-tracker.md

---

## 1. AI Coding Agent Workflow Rules

These rules govern every autonomous or semi-autonomous coding session by Claude Code, Google Antigravity, Cursor, Firebase Studio MCP, or any other agent.

### 1.1 Session Protocol (step by step)

| Step | Action | Output |
|---|---|---|
| 1. Load | Read .codexrules, AGENTS.md, then context/1 to 6 in order | Mental model of scope and current status |
| 2. Select | Pick the next unchecked task in context/6-progress-tracker.md whose dependencies are done, or the task assigned by the Lead Architect | One task ID (for example T-3.4) |
| 3. Announce | State the task ID, acceptance criteria (copied from 2-architecture.md), files you expect to touch, and risks | Short plan in the chat or session log |
| 4. Research | Read the existing files you will touch; for Next.js APIs read node_modules/next/dist/docs; for Firebase APIs read node_modules/firebase type declarations | Confirmed API signatures |
| 5. Implement | Make the smallest change that meets acceptance criteria; follow 4-code-standards.md exactly | Code changes |
| 6. Verify | Run verification gates (section 1.2) | Pass or fail evidence |
| 7. Self-review | Run the self-review checklist (section 1.3) | Checklist confirmation |
| 8. Track | Tick the task in 6-progress-tracker.md and append a Change Log row | Updated tracker |
| 9. Commit | Conventional Commit message, no secrets staged | Commit hash |
| 10. Report | Summarize what changed, how it was verified, and any follow-up tasks | Session report |

Scope rules:

- One task per commit where possible. Never mix refactors with feature work.
- Do not touch files outside the announced list without saying so and why.
- Do not modify .codexrules or context/1 to 5 without Lead Architect approval. Agents may always update context/6-progress-tracker.md.

### 1.2 Verification Gates

| Gate | Command or check | Required for |
|---|---|---|
| G1 Typecheck and build | bun run build | Every TypeScript change |
| G2 Lint | bun run lint | Every change |
| G3 Unit tests | bun test | Changes in src/lib, src/types, src/hooks |
| G4 Rules tests | bun run emulators plus rules tests | Changes to firestore.rules |
| G5 Secret scan | bun run check:secrets and git diff --cached | Every commit |
| G6 SSR safety | bun run build succeeds and the page renders with JavaScript disabled without throwing (skeleton visible) | Any component using browser APIs |
| G7 Offline check | DevTools Network set to Offline, run affected flow | Changes to drills, caching, sync, telemetry |
| G8 Hybrid check | Verify InferenceSourcePill shows real source for ON_DEVICE and forced cloud | Changes to src/lib/ai or telemetry |
| G9 Accessibility | Keyboard tab-through, axe DevTools zero serious issues | UI components |
| G10 Copy check | Search changed files for the em dash character (U+2014) and remove | Docs and UI strings |

A task cannot be marked done if any applicable gate fails.

### 1.3 Self-Review Checklist

- [ ] No any, no ts-ignore, strict mode intact
- [ ] Browser APIs only in client modules and guarded
- [ ] App Check initialization order untouched
- [ ] No topK, topP, or MINIMAL thinking level anywhere
- [ ] Prompts and model names read from Remote Config
- [ ] All model output validated by guards with fallback
- [ ] Indigenous language strings NFC normalized
- [ ] Named exports (except route files)
- [ ] No new dependency without approval
- [ ] Tracker updated

### 1.4 Error Recovery Protocol

| Situation | Agent action |
|---|---|
| Build fails after your change | Read the full error, fix the root cause, re-run G1. After 3 failed attempts, revert your change (git restore or git checkout of touched files), mark the task [!] with the error summary, and report |
| Type declaration mismatch with this document (Firebase or Next.js API differs) | Follow the installed types, keep the architecture, record the difference in the Change Log, notify the Lead Architect |
| App Check 401 or 403 in development | Confirm NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN is set and registered in console; never disable App Check |
| 400 Bad Request from model | Inspect request for forbidden generationConfig fields and invalid schema types; confirm model name from Remote Config |
| Model returns invalid JSON | Confirm schema is passed to both inCloudParams and onDeviceParams; tighten system instruction in Remote Config defaults; ensure guard and fallback path work |
| Gemini Nano unavailable on dev machine | Test with cloud fallback; use a capable machine or ask the Lead Architect for on-device verification; do not stub the inference source |
| Hydration mismatch | Move browser-derived values into useEffect or useSyncExternalStore with a deterministic server snapshot |
| Secret accidentally staged | git restore --staged <file>, add pattern to .gitignore, re-run G5 |
| Secret accidentally committed | Stop. Do not push. Report immediately. Lead Architect rotates the credential and rewrites history |
| Scope ambiguity | Stop and ask; do not guess |
| Conflicting instructions between files | .codexrules wins, then 4-code-standards.md, then 2-architecture.md, then 3-ui-context.md; report the conflict |

### 1.5 Agent-Specific Notes

| Agent | Strength used for | Notes |
|---|---|---|
| Google Antigravity | Multi-file feature implementation, terminal-driven verification, repo setup | Runs commands in PowerShell on Windows; use Bun commands |
| Claude Code | Careful refactors, type contracts, schemas, documentation | Keep changes small and reviewed |
| Cursor | Fast UI iteration on components with visual feedback | Must still pass G1 to G10 |
| Firebase Studio MCP | Firebase console operations: Firestore indexes, rules deploy, Remote Config template publishing, App Check registration | Never export or print service account credentials; console changes must be logged in the Change Log |

### 1.6 Prompting Templates for Agents

Feature task template:

```text
Task: T-<id> <title>
Read: .codexrules, context/2-architecture.md section <x>, context/3-ui-context.md section <y>, context/4-code-standards.md section <z>
Acceptance criteria: <copied>
Files expected: <list>
Constraints: Bun only, strict TS, SSR guards, no forbidden generationConfig keys, prompts from Remote Config
Done when: G1, G2 (plus applicable gates) pass and tracker updated
```

Bug task template:

```text
Bug: <symptom>
Repro: <steps>
Expected: <behaviour>
Constraints: smallest fix, add a regression test where possible, do not disable App Check
```

---

## 2. RACI Matrix

Roles:

- PLA: Product and Lead Architect (Olayinka Emmanuel)
- UIX: UI/UX System (design owner role, Olayinka with design-focused agent support)
- AGT: AI Coding Agents (Antigravity, Claude Code, Cursor, Firebase Studio MCP)
- NDR: Native Dialect Reviewers

R = Responsible (does the work), A = Accountable (final approval, one per row), C = Consulted, I = Informed.

| Module or deliverable | PLA | UIX | AGT | NDR |
|---|---|---|---|---|
| Project charter and scope baseline | A, R | C | I | C |
| MoSCoW prioritization and change control | A, R | C | I | I |
| Personas, empathy and journey maps | A | R | I | C |
| Sitemap and user flows | A | R | C | I |
| FRD and NFRs | A, R | C | C | I |
| Firestore data model and Security Rules | A | I | R | I |
| Firebase project setup (Auth, Firestore, Hosting) | A, R | I | C | I |
| App Check (reCAPTCHA Enterprise, debug tokens) | A | I | R | I |
| Remote Config template and Server Prompt Templates | A | I | R | C |
| Prompt and system instruction content | A, R | I | C | C |
| Dialect rules (dialect_rules_json) | A | I | C | R |
| Firebase AI Logic hybrid model layer (src/lib/ai) | A | I | R | I |
| Schema.object contracts and guards | A | I | R | I |
| Gemini Nano readiness and download UX | A | C | R | I |
| TTS streaming, PCM player, audio cache | A | C | R | C |
| IndexedDB layer and sync engine | A | I | R | I |
| Telemetry (pill, counter, data saved math) | A | C | R | I |
| Design tokens, typography, iconography | C | A, R | C | I |
| Cultural map and stamp art | C | A, R | C | C |
| Component library implementation | C | A | R | I |
| Diacritic picker behaviour | C | A | R | C |
| Glossary seed data (content) | A | I | C | R |
| Glossary seed data (scripts and import) | A | I | R | C |
| Scenario scripts and cultural notes | A | C | C | R |
| TTS voice selection per speaker role | A | C | R | C |
| Tone accuracy audit of generated audio | A | I | I | R |
| Native Trainer Portal implementation | A | C | R | C |
| Usability testing execution | A | R | C | C |
| Accessibility audit | A | R | C | I |
| Budget alerts and spend cap | A, R | I | C | I |
| Secret hygiene and repo audit | A | I | R | I |
| README and Devpost write-up | A, R | C | C | C |
| Demo video script, recording, subtitles | A, R | C | I | C |
| Final submission on Devpost | A, R | I | I | I |
| Progress tracker upkeep | A | C | R | I |

---

## 3. Usability Testing Plan

### 3.1 Objectives

1. Validate that learners understand the hybrid telemetry (pill and data saved) without explanation.
2. Validate that offline practice works end to end and feels intentional rather than broken.
3. Validate diacritic and tone input on desktop and mobile.
4. Validate that generated audio and drills are linguistically acceptable to native speakers.

### 3.2 Participants and Environment

| Group | Count | Devices |
|---|---|---|
| Diaspora learners (remote, video call) | 2 | High-end laptop with Chrome 139+ (Nano capable) |
| Domestic students (Lagos) | 2 | 8 GB RAM laptop (Nano unavailable), Android phone |
| Native reviewers (Yoruba Ijebu, Igbo Owerri, Hausa Kano, Pidgin Lagos) | 2 to 4 | Android phone or laptop |
| Developer self-test | 1 | Reference machine: 16 GB plus RAM, Chrome 139+, Windows 11 |

Session length 25 to 30 minutes, think-aloud protocol, screen recording with consent. Schedule in 6-progress-tracker.md (November 25 to 27, 2026).

### 3.3 Test Cases

| ID | Title | Preconditions | Steps | Expected result | Pass criteria | Related req |
|---|---|---|---|---|---|---|
| UT-01 | Live Airplane Mode disconnect | Nano ready; Ijebu scenario cached; signed in anonymously | 1. Open Ijebu scenario Vocabulary tab online. 2. Answer 1 question. 3. Enable OS Airplane Mode (or DevTools Offline). 4. Answer remaining 4 questions. 5. Switch to Tone tab and complete 5 items. 6. Disable Airplane Mode | Offline banner within 100 ms; TTS action dimmed; quiz continues with ON_DEVICE pill; data saved increments per completion; zero network requests while offline; results sync within 5 s after reconnect | All expected results observed; participant completes without assistance | Flow C, AC-C1 to C4, NFR-OFF-01 |
| UT-02 | Low-RAM cloud fallback | Device with under 12 GB RAM or Nano unavailable; online | 1. Complete onboarding. 2. Observe readiness step. 3. Open a scenario and run Vocabulary quiz | Readiness shows cloud mode explanation; quiz runs with IN_CLOUD pill (gemini-3.5-flash-lite); no errors; offline replay of cached audio still works | Participant understands why cloud mode is used (asked afterwards) | Flow A, AC-A4, FR-AI-04 |
| UT-03 | Diacritic input (desktop) | Yoruba tone drill open | 1. Type "oko" with keyboard. 2. Use picker to add dot-below to both o. 3. Apply low tone to second syllable. 4. Check answer for "vehicle" | Input shows ọkọ̀ in NFC; grading marks correct; per-syllable feedback shows M and L | Completed in under 45 s; no caret jumps | FR-TONE-02, 3-ui-context 4.4 |
| UT-04 | Diacritic input (mobile) | Android Chrome, Igbo drill | 1. Focus input. 2. Insert ụ and ọ via picker. 3. Apply high tone. 4. Submit | Picker docked above keyboard, keyboard stays open, characters correct | No focus loss; targets easy to hit | NFR-A11Y-05 |
| UT-05 | Native speaker tonal audio audit | Online; 6 scenarios synthesized and cached | 1. Reviewer listens to each dialogue. 2. Rates naturalness (1 to 5), tone correctness per line (correct, minor issue, wrong), dialect authenticity (1 to 5). 3. Notes corrections | Average naturalness 3.5 or higher; no line rated wrong in a way that changes meaning without a flag | Corrections logged; failing lines re-scripted or flagged as unverified | S-05, R-3 |
| UT-06 | Drill content accuracy audit | Glossary seeded | Reviewer runs 10 generated quiz questions per dialect | No invented words (all reference glossary entries); diacritics preserved | 100 percent grounded; 90 percent judged natural | FR-AI-05, guard allowedEntryIds |
| UT-07 | Telemetry comprehension | Any device | Ask participant after 5 minutes: "What does the green badge mean? What is the number in Naira?" | Participant explains on-device vs cloud and data saved in own words | 3 of 4 participants correct | S-09, Path C metrics |
| UT-08 | Gemini Nano download experience | Chrome with availability downloadable | 1. Tap Download in readiness step. 2. Navigate to Map during download. 3. Wait for completion | Banner shows progress, UI usable during download, success toast | No blocking; progress updates visible | Flow A, AC-A2, AC-A3 |
| UT-09 | TTS streaming and cache | Online, scenario not cached | 1. Tap Save for offline. 2. Measure time to first audio. 3. Go offline. 4. Replay | First audio under 1.5 s; cached chip appears; offline replay identical | Times recorded in feedback log | Flow B, NFR-PERF-04, 05 |
| UT-10 | Remote Config live update | App open; console access | 1. Change demo_announcement and a dialect rule in console, publish. 2. Observe app | Announcement bar appears without reload; next drill uses new rule | Visible within 60 s | FR-RC-01, AC-D4 |
| UT-11 | App Check enforcement | Enforcement on; test with a build lacking a valid token (or curl Firestore REST) | Attempt Firestore read and AI call without valid token | Requests rejected; app shows security message, not a crash | Rejected and handled | NFR-SEC-01 |
| UT-12 | Trainer submission offline | Trainer account; offline | 1. Fill entry with diacritics and tone pattern. 2. Submit offline. 3. Reconnect | Will sync chip; document created after reconnect with status pending | Created once (no duplicates) | Flow D, FR-TRN-01 |
| UT-13 | Trainer self-approval blocked | Trainer account with own pending submission | Try to approve own entry (UI and direct SDK call) | UI hides action; rules reject direct write | Rejected | AC-D2 |
| UT-14 | Anonymous to Google upgrade | Anonymous user with progress | Sign in with Google from settings | Same uid, progress retained | Progress retained | FR-AUTH-02 |
| UT-15 | Keyboard and screen reader pass | Desktop, NVDA | Navigate onboarding, map, drill using keyboard only | All actions reachable; pill announced politely; tone keys announced | Zero blockers | NFR-A11Y-02, 03 |

### 3.4 Severity Scale

| Level | Definition | Response |
|---|---|---|
| S1 Critical | Blocks a demo flow, data loss, security issue, wrong meaning taught without flag | Fix before next build, highest priority |
| S2 Major | Significant friction, workaround exists | Fix before November 28 |
| S3 Minor | Cosmetic or rare | Fix if time allows |
| S4 Suggestion | Idea for later | Add to post-hackathon backlog |

### 3.5 Feedback Log

Use one row per finding. Keep IDs sequential (FB-001, FB-002, ...).

| ID | Date | Test case | Participant (anonymized) | Device and browser | Observation | Quote | Severity | Proposed fix | Owner | Status | Linked task |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FB-001 | | | | | | | | | | Open | |
| FB-002 | | | | | | | | | | Open | |
| FB-003 | | | | | | | | | | Open | |
| FB-004 | | | | | | | | | | Open | |
| FB-005 | | | | | | | | | | Open | |
| FB-006 | | | | | | | | | | Open | |
| FB-007 | | | | | | | | | | Open | |
| FB-008 | | | | | | | | | | Open | |
| FB-009 | | | | | | | | | | Open | |
| FB-010 | | | | | | | | | | Open | |

### 3.6 Native Speaker Audio Audit Sheet

| Scenario ID | Line number | Speaker | Text | Naturalness (1 to 5) | Tone correctness (correct, minor, wrong) | Dialect authenticity (1 to 5) | Correction | Reviewer | Action |
|---|---|---|---|---|---|---|---|---|---|
| yo-ijebu-elder-greeting | 1 | | | | | | | | |
| yo-ekiti-family-greeting | 1 | | | | | | | | |
| ig-owerri-family-visit | 1 | | | | | | | | |
| ig-onitsha-market | 1 | | | | | | | | |
| ha-kano-market-bargain | 1 | | | | | | | | |
| pcm-lagos-danfo-ride | 1 | | | | | | | | |

### 3.7 Test Metrics Summary (fill after sessions)

| Metric | Target | Result |
|---|---|---|
| Task success rate across UT-01 to UT-04 | 90 percent or higher | |
| Telemetry comprehension (UT-07) | 75 percent or higher | |
| Mean audio naturalness (UT-05) | 3.5 or higher | |
| Grounded quiz rate (UT-06) | 100 percent | |
| Open S1 issues at code freeze | 0 | |
