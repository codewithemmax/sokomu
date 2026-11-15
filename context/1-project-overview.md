# 1. Project Overview: Charter, Scope Baseline and UX Research Strategy

Document owner: Olayinka Emmanuel (Product and Lead Architect)
Status: Baseline v1.0, frozen for the hackathon build on November 15, 2026
Read next: context/2-architecture.md

---

## 0. Name and One-Line Thesis

Sokomu combines So (Yoruba: speak), Koya (Hausa: learn) and Muta (Igbo: learn). It is an offline-first, hybrid AI web application that teaches Nigerian indigenous languages (Yoruba, Igbo, Hausa, Nigerian Pidgin) down to the regional dialect and tonal level.

Winning thesis in one sentence: Sokomu turns high-frequency language practice into a zero-latency, zero-data, zero-token-cost loop by running structured drills on Gemini Nano 4 inside Chrome, and reserves the cloud for what only the cloud can do well (natural multi-speaker dialect audio from gemini-3.1-flash-tts-preview), cached once in IndexedDB and replayed offline forever.

---

## 1. Project Charter

### 1.1 Background and Problem

Indigenous language transmission among Nigerian youth in urban hubs (Lagos, Abuja, Port Harcourt) and in the diaspora (United Kingdom, United States, Canada) is eroding quickly. Children understand their parents but answer in English. Grandparents speak dialects that textbook courses do not teach.

The current market fails these learners in four ways:

| Gap | Existing option | Why it fails |
|---|---|---|
| Cost | Lingawa live tutoring at 10.50 to 15.00 USD per session | Unscalable for weekly practice, prohibitive for domestic learners |
| Depth | Yoruba101, Genii Games | Static vocabulary flashcards, no tone feedback, no dialects |
| Focus | uLesson (12,000 Naira per 3 months), Afrilearn (2,500 Naira per month) | Built for WAEC and NECO subjects, not conversational mother tongue |
| Coverage | Duolingo | Does not offer Yoruba, Igbo, Hausa or Pidgin courses at a usable depth |

Dialect gap: Standard Oyo or Egba Yoruba and Central Igbo do not prepare a learner to talk to a grandmother in Ijebu Ode, Ekiti, Ondo, Onitsha, Owerri, or Ikwerre. Examples captured from field research (to be verified by native trainers before shipping, see section 6.4):

- Yoruba (Ijebu and Ondo lects): yam shifts from isu to usu, fowl shifts from adie (adiye) to ediye, with distinct nasalization rules.
- Igbo (Ikwerre lect): child shifts from nwa / umu (plural) to rumu.

Tonal gap: Yoruba is a three-tone language (high, mid, low, often taught as Do-Re-Mi). One base spelling carries several meanings:

| Written form | Tone pattern | Meaning |
|---|---|---|
| ọkọ | mid, mid | husband |
| ọkọ̀ | mid, low | vehicle (car, boat) |
| ọ̀kọ̀ | low, low | spear |
| oko | mid, mid (no sub-dots) | farm |

A text-only translator that drops diacritics teaches the wrong word. Sokomu treats tone as a first-class, gradable skill.

### 1.2 Infrastructure Imperative

- Mobile data in Nigeria is expensive relative to income. MTN daily bundles cost about 500 Naira for 500 MB or 800 Naira for 1 GB, which is roughly 0.35 to 1.00 Naira per megabyte depending on bundle size and promotions. Sokomu uses 0.78 Naira per MB (800 Naira divided by 1,024 MB) as a conservative default, stored in Remote Config so it can be updated.
- Cellular connectivity is unstable. A cloud-only tutor drains bundles and fails mid-lesson.
- An edge-first hybrid architecture keeps practice working in Airplane Mode and keeps marginal inference cost at zero.

### 1.3 Objectives

| ID | Objective | Measure of success (hackathon) |
|---|---|---|
| OBJ-1 | Prove a real hybrid AI loop | Live demo shows the same drill running ON_DEVICE, then IN_CLOUD fallback, with the telemetry pill changing in real time |
| OBJ-2 | Prove offline utility | Full drill session completes in Airplane Mode with zero network requests (verified in Chrome DevTools Network panel) |
| OBJ-3 | Prove natural dialect audio | At least 6 two-speaker scenario dialogues synthesized by gemini-3.1-flash-tts-preview, cached in IndexedDB, replayed offline |
| OBJ-4 | Prove production backend | Firestore progress, Anonymous plus Google Auth, Remote Config prompt templates, App Check enforced, budget alerts configured |
| OBJ-5 | Prove cultural depth | 4 languages, at least 6 regional dialect stamps, tonal accuracy scoring for Yoruba and Igbo |
| OBJ-6 | Ship a compliant submission | Public repo, Apache 2.0 LICENSE, no secrets in history, demo video under 2:55 with hardcoded English subtitles, submitted before November 30, 2026 2:00 PM PT |

### 1.4 Business Goals and Unit Economics

| Item | Value | Notes |
|---|---|---|
| Marginal cost per on-device drill | 0.00 USD | Gemini Nano 4 runs locally, no tokens billed |
| Marginal cost per cloud text fallback | Fractions of a cent | gemini-3.5-flash-lite, capped by Remote Config rate limits and a Firebase budget alert |
| TTS cost per scenario | One-time per scenario per user device | Cached in IndexedDB, replay is free. Post-hackathon: shared pre-synthesized audio in Cloud Storage reduces cost further |
| Gross margin target | 90 percent or higher | Achievable because more than 80 percent of interactions run on device |
| Diaspora B2C price | 9.99 to 12.99 USD per month or 89.99 USD per year | Primary commercial wedge |
| Domestic B2C price | Freemium, 500 Naira weekly micro-billing, 5,000 Naira termly plan | Paystack or Flutterwave (post-hackathon) |
| B2B schools price | 5,000 to 10,000 Naira per student per term | Elite private schools with 1.9 to 4.4 million Naira annual fees |
| Data flywheel | Native trainer submissions | Defensible dialect dataset in Firestore |

### 1.5 System Boundaries

Inside the system:

- Next.js 16 App Router web client (TypeScript, Tailwind CSS v4, Bun) targeting Chrome Desktop 139+ and mobile viewports.
- Firebase project: Authentication, Cloud Firestore, Remote Config (client templates and Server Prompt Templates), App Check (reCAPTCHA Enterprise), Firebase AI Logic (hybrid inference), Firebase Hosting or App Hosting, budget alerts.
- Browser storage: IndexedDB (audio blobs, glossary nodes, drill queue, telemetry), Cache Storage via service worker for the app shell.

Outside the system (explicitly not built):

- Native Android or iOS apps.
- Any custom backend server holding a Gemini API key.
- Payment processing (pricing is documented, not implemented).
- Speech recognition grading of learner voice (post-hackathon).

### 1.6 Stakeholders

| Role | Name or group | Interest |
|---|---|---|
| Product and Lead Architect | Olayinka Emmanuel | Owns scope, architecture, submission |
| AI Coding Agents | Claude Code, Google Antigravity, Cursor, Firebase Studio MCP | Implement tasks under .codexrules |
| Native Dialect Reviewers | Volunteer speakers of Ijebu, Ekiti, Ondo, Owerri, Onitsha, Ikwerre, Kano Hausa, Lagos Pidgin | Verify glossary, tones, audio |
| Judges | Ankita Saxena, Cynthia Jiang, Yvonne Monterroso, Ken Nevarez and panel | Evaluate on Devpost rubric |

### 1.7 Constraints and Assumptions

- Hard deadline: November 30, 2026 at 2:00 PM PT. Judging December 10 to 16, 2026. Prize pool 30,000 USD.
- Gemini Nano 4 requires Chrome 139+ and capable hardware (guideline used in this plan: 12 GB or more RAM, 22 GB or more free storage, supported GPU or CPU path). Devices below this run the cloud fallback path.
- One primary developer supported by AI coding agents.
- All dialect content is seed data verified by at least one native reviewer before it is shown as verified.

---

## 2. Scope Definition Document

### 2.1 In-Scope MVP (must ship by November 30, 2026)

| ID | Feature | Description |
|---|---|---|
| S-01 | Onboarding and dialect selection | Choose language, then regional dialect, then learning goal (elder greetings, market, family, transit) |
| S-02 | Gemini Nano readiness check | Detect availability states: available, downloadable, downloading, unavailable. Show download progress. Choose PREFER_ON_DEVICE or cloud fallback |
| S-03 | Cultural Map Dashboard | Interactive SVG map of Nigeria with dialect regions, locked and unlocked stamps, progress rings |
| S-04 | Scenario library | At least 6 scenarios: Greeting an elder in Ijebu Ode (Yoruba), Visiting family in Owerri (Igbo), Bargaining at Kurmi market in Kano (Hausa), Danfo ride in Lagos (Pidgin), Ekiti family greeting (Yoruba), Onitsha market (Igbo) |
| S-05 | Cloud two-speaker TTS | gemini-3.1-flash-tts-preview, responseModalities AUDIO, multi-speaker voice config, 24 kHz PCM decoded in Web Audio |
| S-06 | Offline caching | IndexedDB stores for audio blobs, glossary nodes, scenario scripts, drill queue, telemetry |
| S-07 | On-device structured drills | Vocabulary quiz and tonal diacritic drill generated by Gemini Nano 4 with Schema.object JSON output, grounded in cached glossary nodes |
| S-08 | Tonal grading | Gemini Nano grades learner diacritic input against glossary truth with a deterministic pre-check |
| S-09 | Telemetry header | InferenceSourcePill (ON_DEVICE emerald, IN_CLOUD sky), connectivity state, Mobile Data and Naira Saved counter |
| S-10 | Tonal Accuracy Mastery score | Per-language high, mid, low accuracy tracked in Firestore |
| S-11 | Diacritic picker | On-screen picker for Yoruba (ẹ, ọ, ṣ, acute, grave, macron) and Igbo (ị, ọ, ụ, ṅ, acute, grave) |
| S-12 | Authentication | Anonymous sign-in by default, Google sign-in upgrade with account linking |
| S-13 | Firestore persistence | Users, progress, stamps, glossary, trainer submissions, with Security Rules |
| S-14 | Remote Config | System instructions, dialect rules, model names, telemetry constants, feature flags, live update demo |
| S-15 | App Check | reCAPTCHA Enterprise in production, debug token for local and judge testing, enforced on Firestore and AI Logic |
| S-16 | Native Trainer Portal (minimal) | Trainer role sign-in, submit dialect entry with tone pattern, review queue view |
| S-17 | Budget guardrail | Firebase budget alert and documented spend cap procedure |
| S-18 | Submission assets | README, LICENSE, demo video under 2:55 with hardcoded subtitles, Devpost write-up, architecture diagram |

### 2.2 Out-of-Scope (post-hackathon roadmap)

| ID | Feature | Reason deferred |
|---|---|---|
| O-01 | Speech recognition grading of learner pronunciation | Requires audio model evaluation and consent flows |
| O-02 | Native mobile apps (Android with Gemini Nano via AICore, iOS) | Web in Chrome is the hackathon target |
| O-03 | Payments (Paystack, Flutterwave, Stripe) | Pricing validated in docs only |
| O-04 | B2B school admin dashboard and class rosters | Persona researched, not built |
| O-05 | Trainer payouts and reputation scoring | Requires legal and payment rails |
| O-06 | Additional languages (Tiv, Efik, Ibibio, Kanuri, Edo, Fulfulde) | Content verification capacity |
| O-07 | Shared pre-synthesized audio CDN in Cloud Storage | Optimization after usage data |
| O-08 | Social features, leaderboards, friends | Conflicts with Path C respect-driven design |
| O-09 | Fine-tuned or LoRA adapted Nano models | Not supported in target browser APIs for this build |

### 2.3 Change Control

Any request to move an item from Out-of-Scope to In-Scope must be logged in context/6-progress-tracker.md with the Lead Architect's approval and a matching removal or deferral of equal effort.

---

## 3. Problem Statements and Feature Prioritization

### 3.1 Problem Statements

| ID | Persona | Problem statement |
|---|---|---|
| PS-1 | Diaspora parent | I want my children to greet their grandmother in her Ijebu dialect with the right tones, but every app teaches only standard Yoruba and live tutors cost too much for weekly practice. |
| PS-2 | Domestic student | I want to practice Igbo daily, but every AI app burns my MTN data and stops working when my network drops on the way to campus. |
| PS-3 | School coordinator | I must deliver mother-tongue instruction across three languages without enough trained teachers or textbooks, and I need proof of progress for parents. |
| PS-4 | Native trainer | I know the Owerri words and tones that are disappearing, but there is no structured place to record them so learners actually use them. |

### 3.2 MoSCoW Prioritization Matrix

Rubric pillars: TI (Technological Implementation), DE (Design), PI (Potential Impact), QI (Quality of the Idea). Impact scale: 3 high, 2 medium, 1 low.

| Feature | MoSCoW | TI | DE | PI | QI | Primary persona | Judge focus |
|---|---|---|---|---|---|---|---|
| Hybrid inference PREFER_ON_DEVICE with cloud fallback | Must | 3 | 1 | 3 | 3 | All | Cynthia Jiang, Ken Nevarez |
| Telemetry pill bound to inferenceSource | Must | 3 | 3 | 2 | 3 | All | Cynthia Jiang |
| Schema.object structured Nano drills | Must | 3 | 1 | 2 | 3 | Student, Diaspora | Ken Nevarez |
| Airplane Mode offline drill session | Must | 3 | 2 | 3 | 3 | Student | Cynthia Jiang, Ankita Saxena |
| Two-speaker cloud TTS with IndexedDB cache | Must | 3 | 3 | 3 | 3 | Diaspora | Ankita Saxena |
| App Check (reCAPTCHA Enterprise plus debug) | Must | 3 | 0 | 1 | 2 | All | Ken Nevarez, Ankita Saxena |
| Remote Config prompts and live update | Must | 3 | 1 | 2 | 3 | Trainer, Ops | Ken Nevarez |
| Firestore progress plus Auth | Must | 3 | 1 | 2 | 2 | All | Yvonne Monterroso |
| Mobile Data and Naira Saved counter | Must | 2 | 3 | 3 | 3 | Student | Ankita Saxena |
| Cultural Map Dashboard with stamps | Must | 1 | 3 | 2 | 3 | Diaspora | Design pillar |
| Diacritic picker | Must | 1 | 3 | 3 | 2 | All | Design pillar |
| Tonal Accuracy Mastery score | Should | 2 | 2 | 3 | 3 | All | Quality of idea |
| Nano download progress banner | Should | 2 | 2 | 1 | 2 | All | Cynthia Jiang |
| Native Trainer Portal submission | Should | 2 | 2 | 3 | 3 | Trainer | Yvonne Monterroso |
| Budget alert and spend cap docs | Should | 2 | 0 | 1 | 1 | Ops | Ankita Saxena, Yvonne Monterroso |
| Service worker app shell offline | Should | 2 | 1 | 2 | 1 | Student | Cynthia Jiang |
| Dark mode | Could | 0 | 2 | 1 | 1 | All | Design |
| Trainer review queue moderation UI | Could | 1 | 1 | 2 | 2 | Trainer | Yvonne Monterroso |
| Session history timeline | Could | 1 | 2 | 1 | 1 | Diaspora | Design |
| Speech recognition grading | Won't (this build) | | | | | | |
| Payments and subscriptions | Won't (this build) | | | | | | |
| Leaderboards and streak gimmicks | Won't (conflicts with Path C) | | | | | | |

---

## 4. UX Research and Strategy

### 4.1 Strategic Evaluation of Path C: Contextual Cultural Mastery and Respect-Driven Progression

Three candidate pedagogical frameworks were evaluated.

| Criterion | Path A: Standard Gamification (Duolingo-style) | Path B: Pure Academic Drills (WAEC-style) | Path C: Contextual Cultural Mastery (selected) |
|---|---|---|---|
| Core motivator | Streaks, hearts, XP, leagues | Exam scores, syllabus coverage | Real conversations with family and community |
| Tone toward learner | Playful, often childish | Formal, impersonal | Respectful, adult, culturally grounded |
| Dialect support | Usually none | Standard variant only | Regional dialect as the organizing unit |
| Retention mechanism | Fear of losing a streak | External exam pressure | Tangible cultural milestones (stamps), visible real-world utility (data saved), mastery growth |
| Fit for diaspora adults | Weak (feels infantile) | Weak (feels like school) | Strong (connects to identity and family) |
| Fit for domestic students | Medium | Medium | Strong when paired with data savings |
| Fit for schools | Weak (gimmicky) | Strong for exams, weak for speaking | Strong (scenario-based, measurable tonal accuracy) |
| Hybrid AI showcase | Neutral | Neutral | Strong (scenario audio from cloud, drills on device, savings visible) |
| Judge differentiation | Low (common) | Low | High (novel cultural framing plus measurable utility) |

Decision: Path C is the core framework. Rationale:

1. Respect over gimmicks. In Nigerian cultures, how you greet an elder (kneeling or prostrating in Yoruba culture, honorific pronouns such as ẹ instead of o) is itself the lesson. Cartoon hearts trivialize that context.
2. Scenarios as the unit of learning. Every lesson is framed as a real situation: greeting an elder in Ijebu Ode, bargaining at a Kano market, visiting family in Owerri, navigating a danfo in Lagos Pidgin.
3. Tangible, honest metrics. Learners see three numbers that matter:
   - Regional Dialect Stamps on a cultural map of Nigeria (earned by completing a scenario with at least 80 percent accuracy).
   - Mobile Data Saved in MB and Naira, computed from actual on-device completions and cached audio replays.
   - Tonal Accuracy Mastery across high, mid, and low pitch markers.
4. Hybrid AI is the pedagogy, not decoration. Scenario audio needs natural voices (cloud TTS, cached once). Drills need infinite, instant, private repetition (on-device Nano). The architecture and the learning model reinforce each other.

Path C design rules (binding for UI and copy):

- No hearts, no lives, no streak-loss punishment, no mascots.
- Progress copy uses cultural framing: "You greeted Mama properly" rather than "Great job!".
- Mistakes are explained with the tone pattern and meaning that was produced (for example: "You wrote ọkọ̀ (vehicle). The elder heard 'car', not 'husband'.").
- Learners can always see whether their practice ran on their own device or in the cloud.

### 4.2 User Personas

#### Persona 1: Adaeze "Ada" Okafor-Williams, Diaspora Parent and Learner

| Attribute | Detail |
|---|---|
| Age, location | 38, London (Peckham), parents from Owerri, Imo State |
| Occupation | NHS pharmacist |
| Household | Husband (British-Jamaican), two children aged 8 and 11 |
| Languages | English native, understands Igbo passively, speaks broken Central Igbo |
| Goal | Her children greet and hold a short conversation with their grandmother in Owerri Igbo during the Christmas visit; she wants to stop answering in English herself |
| Frustrations | Apps teach only Central Igbo; Lingawa is 15 USD per session for each child; flashcards bore her kids; she cannot judge tones herself |
| Technical comfort | High. Uses Chrome on a MacBook Pro (M3, 16 GB RAM) and a Pixel 9 |
| Device and network | Unmetered home fibre, 5G mobile |
| Willingness to pay | 12.99 USD per month or 89.99 USD per year for a family plan |
| Success signal | Grandmother says "Ị na-asụ Igbo nke ọma" on a video call |
| Quote | "I don't want my kids learning textbook Igbo. I want them to sound like they're from home." |

#### Persona 2: Tunde Bakare, Domestic University Student

| Attribute | Detail |
|---|---|
| Age, location | 21, Lagos (Akoka, studying Mass Communication at UNILAG), family from Ijebu Ode |
| Languages | Fluent Lagos Pidgin and English, conversational standard Yoruba, cannot follow Ijebu speech at family events |
| Goal | Understand and reply to older relatives in Ijebu Yoruba; improve tone accuracy for a campus radio presenting role |
| Frustrations | MTN data runs out midweek (buys 500 Naira for 500 MB daily bundles); network drops on BRT and in lecture halls; AI apps "eat data" |
| Technical comfort | Medium-high. Chrome on a mid-range Windows laptop (Intel i5, 8 GB RAM, so Gemini Nano is not available) and a Tecno Camon phone |
| Device and network | Campus Wi-Fi is congested, relies on mobile hotspot |
| Willingness to pay | Free tier, maybe 500 Naira weekly |
| Success signal | Mobile Data Saved counter shows real Naira saved; completes drills offline on the bus via cached content |
| Quote | "If it works when my data finishes, I'll use it every day." |
| Architecture note | Represents the low-RAM cloud fallback path. Laptop uses gemini-3.5-flash-lite fallback when online; offline he still replays cached audio and runs the deterministic cached quiz generator |

#### Persona 3: Mrs. Folasade Adeyemi-Eze, Elite School Curriculum Coordinator

| Attribute | Detail |
|---|---|
| Age, location | 46, Lekki Phase 1, Lagos |
| Organization | Private secondary school, annual fees about 3.2 million Naira |
| Responsibility | Cultural studies and Nigerian languages curriculum for JSS1 to SS3 |
| Goal | Deliver Yoruba, Igbo, and Hausa instruction to 600 students with only two trained language teachers, after the December 2025 reversal of the 2022 National Language Policy left schools without enough trained teachers and textbooks |
| Frustrations | No scalable tools, parents demand measurable progress, worries about student data privacy and cost unpredictability |
| Technical comfort | Medium. School ICT lab has Chromebooks and Windows desktops of mixed capability |
| Budget | 5,000 to 10,000 Naira per student per term if outcomes are visible |
| Success signal | Termly report showing tonal accuracy improvement per student |
| Quote | "I need proof that it works and proof that it is safe for children." |

#### Persona 4: Chief (Mrs.) Ngozi Iwu and Pa Rasheed Ogunbanjo, Native Dialect Trainers

| Attribute | Detail |
|---|---|
| Trainer A | Ngozi Iwu, 58, retired secondary school Igbo teacher, Owerri, Imo State |
| Trainer B | Rasheed Ogunbanjo, 64, community elder and Awujale palace historian, Ijebu Ode, Ogun State |
| Goal | Preserve local words, proverbs, and tone patterns; see them used by young people; be credited |
| Frustrations | Dialect words dying out; no structured channel to contribute; distrust of tech companies taking knowledge without credit |
| Technical comfort | Low to medium. Android phone with Chrome, WhatsApp-native; needs large tap targets and clear Yoruba/Igbo diacritic input |
| Network | 3G or 4G, intermittent power and data |
| Success signal | Submitted entries appear as verified with their name; learners hear and practice them |
| Quote (Ngozi) | "In Owerri we say it differently. If nobody writes it down, my grandchildren will never know." |

### 4.3 Empathy Maps

#### Empathy Map: Ada (Diaspora Parent)

| Quadrant | Content |
|---|---|
| Thinks | "Am I losing my children's connection to home?" "Is this teaching real Owerri Igbo or textbook Igbo?" "Is the audio a real-sounding voice?" |
| Feels | Guilt about not teaching Igbo earlier, hope before the December trip, skepticism about AI accuracy |
| Sees | Generic apps with no Igbo dialects, expensive tutors, children bored by flashcards |
| Does | Searches YouTube for Igbo songs, pays for occasional tutor sessions, practises greetings in the car |
| Pains | Cost, lack of dialect depth, no tone feedback |
| Gains | Scenario audio that sounds like family, children earn an Owerri stamp, honest progress |

#### Empathy Map: Tunde (Domestic Student)

| Quadrant | Content |
|---|---|
| Thinks | "How much data will this use?" "Will it work on the bus?" |
| Feels | Embarrassed at family gatherings, anxious about running out of data |
| Sees | Data balance SMS alerts, apps that spin forever on weak network |
| Does | Downloads content on campus Wi-Fi, turns data off to save money |
| Pains | Data cost, unreliable network, low-RAM laptop |
| Gains | Cached Ijebu scenario works offline, Naira Saved counter proves value |

#### Empathy Map: Mrs. Adeyemi-Eze (School Coordinator)

| Quadrant | Content |
|---|---|
| Thinks | "Can this replace a missing teacher for practice time?" "What data is collected about students?" |
| Feels | Pressure from parents and the board, cautious optimism |
| Sees | Policy reversal headlines, teacher shortage, mixed hardware in the lab |
| Does | Builds timetable slots for language practice, requests demos from vendors |
| Pains | Unscalable instruction, no metrics, cost unpredictability |
| Gains | Tonal Accuracy Mastery reports, offline lab use, predictable per-student pricing |

#### Empathy Map: Ngozi and Rasheed (Native Trainers)

| Quadrant | Content |
|---|---|
| Thinks | "Will they credit me?" "Will they get the tones right?" |
| Feels | Pride in heritage, worry about loss, wariness of technology |
| Sees | Young people speaking only English or Pidgin, no written records of their lect |
| Does | Tells stories at gatherings, corrects grandchildren, uses WhatsApp voice notes |
| Pains | Small screens, hard diacritic typing, no feedback loop |
| Gains | Simple submission form with diacritic picker, entries marked verified with attribution |

### 4.4 User Journey Maps

Stages: (1) Onboarding, (2) Online scenario caching, (3) Offline Airplane Mode practice, (4) Tonal feedback.

#### Journey: Ada (Diaspora Parent, high-end MacBook, Nano available)

| Stage | Thinks | Feels | Sees | Does | Friction | Hybrid AI intervention |
|---|---|---|---|---|---|---|
| 1 Onboarding | "Do they have Owerri Igbo?" | Hopeful | Language and dialect picker with Owerri listed | Selects Igbo, then Owerri, goal "Visiting family" | Unsure if her browser supports AI | Readiness check shows "On-device AI ready" with emerald badge or download progress banner |
| 2 Online caching | "Does this sound real?" | Moved when hearing two voices | Scenario card "Visiting Nne in Owerri" with play button and cache indicator | Plays dialogue, taps "Save for offline" | Waiting for audio | gemini-3.1-flash-tts-preview streams 24 kHz PCM, playback begins on first chunk, blob saved to IndexedDB, sky blue IN_CLOUD badge during synthesis |
| 3 Offline practice | "Can the kids practise on the plane to Lagos?" | Relieved | Offline banner, cloud actions dimmed, drills still active | Runs vocabulary quiz in Airplane Mode | None if cached | Gemini Nano generates Schema.object quiz from cached glossary, emerald ON_DEVICE badge, data saved counter increments |
| 4 Tonal feedback | "Did I say it right?" | Encouraged, respected | Tone breakdown per syllable (high, mid, low) | Uses diacritic picker to correct | Typing diacritics on a laptop | Picker inserts combining marks; Nano grades against glossary truth with explanation |

#### Journey: Tunde (Domestic Student, 8 GB laptop, Nano unavailable)

| Stage | Thinks | Feels | Sees | Does | Friction | Hybrid AI intervention |
|---|---|---|---|---|---|---|
| 1 Onboarding | "Will this eat my data?" | Wary | Data-saver explanation and estimated download size per scenario | Selects Yoruba, then Ijebu, goal "Family gatherings" | Device does not meet Nano requirements | Readiness check reports unavailable, shows "Cloud mode (light data)" sky badge, explains offline replay still works |
| 2 Online caching | "Download now while I'm on campus Wi-Fi" | In control | Per-scenario size estimate in MB | Caches 3 Ijebu scenarios | Congested Wi-Fi | Resumable caching queue, glossary nodes and audio saved to IndexedDB |
| 3 Offline practice | "Data finished, does it still work?" | Surprised | Offline banner, cached quizzes available | Replays audio, runs cached deterministic quiz | No on-device model | fallback-quiz generator uses cached glossary, replay counter adds to Data Saved (audio not re-downloaded) |
| 4 Tonal feedback | "Why is this wrong?" | Curious | Deterministic tone comparison per syllable | Retries | Fewer explanations offline | Online again: cloud gemini-3.5-flash-lite gives explanation, queued drills sync to Firestore |

#### Journey: Mrs. Adeyemi-Eze (School Coordinator, lab of mixed devices)

| Stage | Thinks | Feels | Sees | Does | Friction | Hybrid AI intervention |
|---|---|---|---|---|---|---|
| 1 Onboarding | "Is it safe?" | Cautious | Privacy note: drills run on device, no voice recorded | Signs in with Google | Policy approval | App Check and Firestore rules documented; Anonymous mode for students |
| 2 Online caching | "Can I preload the lab before class?" | Practical | Scenario list per language | Pre-caches content on each machine | Repeated downloads across machines | Post-hackathon shared CDN; MVP caches per device |
| 3 Offline practice | "Lab internet is down again" | Relieved | Drills working offline | Runs class practice | Mixed hardware | Capable machines use Nano; others use cached deterministic quizzes |
| 4 Tonal feedback | "Can I show parents progress?" | Confident | Tonal Accuracy Mastery per language | Screenshots dashboard | No admin view in MVP | Progress stored in Firestore for future reporting |

#### Journey: Ngozi and Rasheed (Native Trainers)

| Stage | Thinks | Feels | Sees | Does | Friction | Hybrid AI intervention |
|---|---|---|---|---|---|---|
| 1 Onboarding | "Is this respectful of our language?" | Wary | Trainer portal invite with their dialect | Signs in with Google, accepts trainer role | Small phone screen | Large tap targets, simple copy |
| 2 Submission | "Let me add the Owerri word" | Proud | Form: word, dialect, standard equivalent, tone pattern, example sentence | Uses diacritic picker | Typing tones | Picker plus tone pattern buttons (H, M, L) |
| 3 Sync | "Did it save? My network is bad" | Anxious | Pending sync indicator | Submits offline | Intermittent data | Firestore offline persistence queues writes and syncs later |
| 4 Impact | "Are learners using my words?" | Fulfilled | Entry marked verified with attribution | Reviews peers' entries | None | Verified entries flow into glossary cache and Remote Config dialect rules |

---

## 5. Success Metrics for Judging

| Rubric pillar | What judges will see | Evidence |
|---|---|---|
| Technological Implementation | Real hybrid inference, structured output, TTS streaming, App Check, Remote Config live update | Demo video segments 2 to 4, repo code in src/lib/ai and src/lib/firebase |
| Design | Path C, cultural map, telemetry pill, diacritic picker, accessible contrast | Demo video and live app |
| Potential Impact | Language preservation, data savings in Naira, B2B schools, trainer flywheel | README and Devpost write-up |
| Quality of the Idea | Dialect plus tone depth with edge-first economics | Pitch hook in first 45 seconds |

---

## 6. Risks and Mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | Gemini Nano unavailable on judge hardware | High | High | Automatic cloud fallback, clear telemetry, demo video recorded on capable hardware, debug token instructions in README |
| R-2 | TTS preview model quota or latency spikes | Medium | High | Pre-cache demo scenarios, Remote Config kill switch tts_enabled, cached audio replay |
| R-3 | Incorrect dialect or tone content | Medium | High | Native reviewer verification flag, unverified content labeled |
| R-4 | Secret leak in git | Low | Fatal | .gitignore hardening, pre-commit check, App Check, no server keys |
| R-5 | Deprecated generationConfig fields cause 400 errors | Medium | High | Guard in src/lib/ai/config.ts strips forbidden keys, unit test |
| R-6 | Scope creep | High | High | MoSCoW, change control in tracker |
| R-7 | Demo video exceeds 2:55 | Medium | Fatal | Second-by-second checklist in 6-progress-tracker.md |
| R-8 | SSR crashes from browser APIs | Medium | Medium | Rule 2 of .codexrules, client-only modules |
