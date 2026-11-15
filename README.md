# Sokomu

**An offline-first Nigerian dialect and tonal tutor for Yoruba, Igbo, Hausa, and Nigerian Pidgin, built for the Web in Chrome.**

> Built for the **#BuildHybridAI 2026 Hackathon**

---

## Overview & Elevator Pitch

Nigeria is home to over 500 languages, yet younger generations, both at home and in the diaspora, face rapid **regional dialect attrition** and struggle with **tonal accuracy** (such as Yoruba's *do-re-mi* / low-mid-high pitch distinctions or Igbo's high/low tone markers) that standard text-only translators miss. At the same time, high mobile data costs and intermittent connectivity make cloud-only AI tutors impractical for everyday learning.

**Sokomu** solves both problems with a **hybrid-first architecture**:
- **Zero-data interactive drills:** Tonal drills, diacritic checks, and conversational exercises run **on-device** in Chrome using **Gemini Nano 4** via **Firebase AI Logic**, eliminating per-turn network latency and mobile data consumption.
- **Offline-capable multi-speaker audio:** Natural pronunciation and dialogue audio are synthesized with **Gemini 3.1 Flash TTS Preview** and cached locally in **browser IndexedDB**, so learners can replay lessons offline without re-fetching audio.
- **Seamless cloud fallback:** When on-device inference is unavailable or a complex cultural/linguistic explanation is needed, Firebase AI Logic automatically routes requests to the cloud.

---

## Hybrid AI Architecture

```text
+-------------------------------------------------------------------+
|                        Sokomu Web App (Next.js)                   |
|                 Yoruba | Igbo | Hausa | Nigerian Pidgin           |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                       Firebase AI Logic SDK                       |
|                  (Hybrid On-Device + Cloud Router)                |
+----------------+---------------------------------+----------------+
                 |                                 |
      [On-Device Primary]                   [Cloud Fallback & TTS]
                 |                                 |
                 v                                 v
+---------------------------------+  +------------------------------+
|  Gemini Nano 4 (Chrome Built-in)|  |  Gemini 3.1 Flash TTS Preview|
|  - Interactive tonal & text     |  |  - Multi-speaker dialect     |
|    drills                       |  |    audio synthesis           |
|  - Diacritic & grammar feedback |  |  - Cloud inference fallback  |
|  - Zero mobile data cost        |  +--------------+---------------+
+---------------------------------+                 |
                                                    v
                                     +------------------------------+
                                     |      Browser IndexedDB       |
                                     |  - Cached TTS audio blobs    |
                                     |  - Offline lesson playback   |
                                     +------------------------------+
```

1. **On-Device Inference (`Gemini Nano 4` in Chrome):** Handles low-latency, high-frequency text drills, tone-marking exercises, and immediate learner feedback directly on the user's device through Firebase AI Logic.
2. **Cloud Fallback & Multi-Speaker TTS (`Gemini 3.1 Flash TTS Preview`):** Generates expressive, multi-speaker dialect dialogues and handles fallback inference when the device lacks local model support.
3. **Offline Audio Cache (`IndexedDB`):** Synthesized audio clips are persisted in IndexedDB so learners only download an audio segment once and can practice offline indefinitely.

---

## Security & Dynamic Configuration

Sokomu uses Firebase services to secure AI endpoints, manage prompt engineering dynamically, and synchronize curated dialect content:

- **Firebase App Check:** Protects backend AI and Firestore endpoints from abuse using **reCAPTCHA Enterprise** in production and **local debug tokens** (`NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN`) during development.
- **Firebase Remote Config:** Stores and updates dialect-specific prompt templates, tonal scoring rubrics, and hybrid routing thresholds dynamically without requiring app redeployments.
- **Firebase Authentication:** Manages learner profiles and tracks per-dialect mastery progress.
- **Cloud Firestore:** Hosts curated dialect glossaries, tonal minimal pairs, and cultural context notes for Yoruba, Igbo, Hausa, and Nigerian Pidgin with offline persistence enabled.

### Cost Predictability, Budget Alerts & Spend Cap Procedure

- **Cloud Billing Budget Alerts:** Configured in Google Cloud Billing with threshold notifications at **5 USD, 15 USD, and 30 USD**.
- **Runtime Kill Switches & Daily Caps (Remote Config):**
  - `cloud_fallback_daily_limit` (default `50`): Caps cloud fallback text requests per device per UTC day.
  - `cloud_fallback_enabled` (default `true`): Can be toggled to `false` in Firebase Remote Config to immediately halt cloud text fallback while keeping on-device Gemini Nano and cached deterministic drills running.
  - `tts_enabled` (default `true`): Can be toggled to `false` in Firebase Remote Config to halt new cloud TTS synthesis while keeping cached IndexedDB audio replay active.
- **API Key Restrictions:** The Firebase Web API key is restricted by HTTP referrer (`http://localhost:3000/*` and the production Firebase Hosting domain) and scoped to required Firebase and Gemini Developer APIs.

---

## Local Setup

### Prerequisites

- [Bun](https://bun.sh/) (`v1.3+` recommended)
- Google Chrome (Dev / Canary or Stable with Built-in AI support)
- A Firebase project with **Firebase AI Logic**, **App Check**, **Remote Config**, **Authentication**, and **Firestore** enabled

### 1. Install Dependencies

```bash
bun install
```

### 2. Enable Chrome Flags for Gemini Nano

To run on-device inference locally in Chrome, open `chrome://flags` and enable:

1. **Prompt API for Gemini Nano** (`#prompt-api-for-gemini-nano`) -> **Enabled**
2. **Optimization Guide On Device Model** (`#optimization-guide-on-device-model`) -> **Enabled BypassPerfRequirement**

Restart Chrome, then visit `chrome://components`, locate **Optimization Guide On Device Model**, and click **Check for update** to download the local model weights.

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and populate it with your Firebase Web SDK credentials:

```bash
cp .env.example .env.local
```

> **Note:** `.env.local` is gitignored. Never commit real API keys, service account files, or App Check secrets.

### 4. Run the Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome to start using Sokomu.

---

## License

This project is licensed under the **Apache License, Version 2.0**. See the [LICENSE](LICENSE) file for details.
