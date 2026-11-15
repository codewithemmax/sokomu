# 3. UI Context: Wireframes, Visual Design System, Prototyping and Developer Handoff

Document owner: Lead Product Designer (Olayinka Emmanuel with UI/UX agent support)
Depends on: context/1-project-overview.md (Path C), context/2-architecture.md (sitemap, flows)
Read next: context/4-code-standards.md

---

## 1. Design Principles (Path C Applied to Pixels)

1. Respect first. Adult, calm, culturally rich surfaces. No mascots, hearts, confetti explosions, or cartoon praise.
2. Show the machine honestly. The inference source (ON_DEVICE or IN_CLOUD) and the data saved are always visible, never hidden in a settings page.
3. Tone is visual. Every Yoruba and Igbo syllable can be displayed with its tone class colour and mark, so learners see pitch.
4. Offline is a mode, not an error. Offline dims cloud-only actions, keeps everything else bright and usable.
5. Cultural craft. Gold accents inspired by adire, akwete, and Hausa embroidery patterns, used sparingly as line art on stamps and dividers.

---

## 2. Low-Fidelity Wireframes (Greyscale Structural Blueprints)

Legend: [ ] button, ( ) pill or badge, {} dynamic value, ### image or map area, ... scrollable list, | | column boundary.

### 2.1 Telemetry and Data-Saver Header Bar

Desktop 1440 px (height 64 px, sticky top, full width, content max 1376 px with 32 px side padding):

```text
+--------------------------------------------------------------------------------------------------------+
| [=] SOKOMU  So . Koya . Muta    |  ( * ON_DEVICE  Gemini Nano  412 ms )  ( Online )  |  Data saved      |
|                                 |                                                    |  {14.6 MB}       |
|                                 |                                                    |  {N11.39}  [Ada v]|
+--------------------------------------------------------------------------------------------------------+
  ^ logo 32px      ^ tagline (hidden < 1024px)  ^ InferenceSourcePill  ^ ConnectivityBadge  ^ DataSavedCounter ^ Account menu
```

Mobile 390 px (height 56 px):

```text
+--------------------------------------+
| SOKOMU   (* DEVICE)  (Online)  14.6MB |
|                               N11.39 o|
+--------------------------------------+
  pill collapses to icon + short label; tapping pill opens TelemetryDrawer (bottom sheet)
```

Offline state (desktop):

```text
+--------------------------------------------------------------------------------------------------------+
| [=] SOKOMU                      |  ( * ON_DEVICE  Gemini Nano )  ( x Offline )       | Data saved {15.0 MB}|
+--------------------------------------------------------------------------------------------------------+
| ! You are offline. Drills keep working on your device. Audio synthesis will resume when you reconnect. |
+--------------------------------------------------------------------------------------------------------+
```

### 2.2 Cultural Map Dashboard (/map)

Desktop 1440 px (12-column grid, 24 px gutters; left rail 240 px fixed; content area 1136 px):

```text
+------------------+----------------------------------------------------------------------------------+
| LEFT RAIL 240    |  TELEMETRY HEADER BAR                                                            |
|                  +----------------------------------------------------------------------------------+
| (o) Map          |  E kaabo, Ada.  Your path: Igbo . Owerri . Visiting family                       |
| ( ) Scenarios    |                                                                                  |
| ( ) Library      |  +------------------------------------------------+  +--------------------------+ |
| ( ) Progress     |  |                                                |  | REGION DRAWER (380px)    | |
| ( ) Trainer      |  |   ############################################ |  | Owerri, Imo State        | |
| ( ) Settings     |  |   ######  INTERACTIVE SVG MAP OF NIGERIA  #### |  | Stamp: [locked/earned]   | |
|                  |  |   ###  regions: Ijebu, Ekiti, Ondo, Oyo, #####  |  | Tonal mastery  H 82%     | |
|                  |  |   ###  Owerri, Onitsha, Ikwerre, Kano,   #####  |  |                M 74%     | |
|                  |  |   ###  Lagos (Pidgin)                    #####  |  |                L 61%     | |
|                  |  |   ###  earned regions filled gold        #####  |  | Scenarios                | |
|                  |  |   ###  locked regions outlined           #####  |  |  > Visiting Nne  (saved) | |
|                  |  |   ############################################ |  |  > Market day    (cloud) | |
|                  |  +------------------------------------------------+  |  [Continue scenario]     | |
|                  |    cols 1-8 (752px)                                   +--------------------------+ |
|                  |                                                         cols 9-12 (360px)        |
| Nano: ready      |  +-----------------+ +-----------------+ +-----------------+ +-----------------+  |
| Storage 18 MB    |  | STAMP CARD      | | STAMP CARD      | | STAMP CARD      | | STAMP CARD      |  |
|                  |  | Ijebu  earned   | | Owerri  65%     | | Kano  locked    | | Lagos  locked   |  |
|                  |  +-----------------+ +-----------------+ +-----------------+ +-----------------+  |
|                  |   4 cards x cols 3 each                                                          |
|                  |  +--------------------------------------+ +---------------------------------------+|
|                  |  | TONAL ACCURACY MASTERY  (bar x3)     | | DATA SAVED THIS WEEK (sparkline)      ||
|                  |  +--------------------------------------+ +---------------------------------------+|
+------------------+----------------------------------------------------------------------------------+
```

Mobile 390 px (single column, 16 px side padding, bottom tab bar 64 px):

```text
+--------------------------------------+
| HEADER (56)                          |
+--------------------------------------+
| Nnoo, Ada                            |
| Igbo . Owerri . Visiting family      |
| +----------------------------------+ |
| | ################################ | |
| | ####  MAP (aspect 4:5, 358w) ### | |
| | ################################ | |
| +----------------------------------+ |
| [Continue: Visiting Nne  >]          |
| Stamps                       See all |
| +--------+ +--------+ +--------+ ... |  horizontal scroll, 132px cards
| | Ijebu  | | Owerri | | Kano   |     |
| +--------+ +--------+ +--------+     |
| Tonal mastery                        |
| H ========== 82%                     |
| M ========   74%                     |
| L ======     61%                     |
+--------------------------------------+
| (Map) (Scenarios) (Library) (Progress)|  bottom tab bar
+--------------------------------------+
Region tap opens RegionDrawer as bottom sheet (snap points 40% and 90%).
```

### 2.3 Interactive Scenario and Tonal Drill Screen (/scenarios/[scenarioId])

Desktop 1440 px:

```text
+------------------+----------------------------------------------------------------------------------+
| LEFT RAIL        |  HEADER                                                                          |
|                  +----------------------------------------------------------------------------------+
|                  |  < Back   Greeting an elder in Ijebu Ode         (Yoruba . Ijebu)  [Dictionary]  |
|                  |  [ Listen ] [ Vocabulary ] [ Tone drill ]      <- tabs                           |
|                  |  +-----------------------------------------------+ +----------------------------+ |
|                  |  | DUAL-SPEAKER PCM WAVEFORM PLAYER              | | CULTURAL NOTE              | |
|                  |  | Mama Iyabo  ~~~~^^^~~~~~~^^~~~~~  (gold)      | | Young men prostrate        | |
|                  |  | Tunde       ~~^^~~~~~~^^^^~~~~~~  (indigo)    | | (dobale) when greeting an  | |
|                  |  | [> Play]  00:12 / 00:48   (Saved offline)     | | elder in Ijebu...          | |
|                  |  | (IN_CLOUD . TTS streaming...)                 | +----------------------------+ |
|                  |  +-----------------------------------------------+ +----------------------------+ |
|                  |  +-----------------------------------------------+ | WORDS IN THIS SCENE        | |
|                  |  | TRANSCRIPT                                    | | ẹ kú àárọ̀   H? tone chips  | |
|                  |  | Mama: ...yoruba line...                       | | usu (isu)  yam             | |
|                  |  |       ...english translation (muted)          | | ...                        | |
|                  |  | Tunde: ...                                    | +----------------------------+ |
|                  |  +-----------------------------------------------+                                |
|                  |     cols 1-8                                          cols 9-12                  |
+------------------+----------------------------------------------------------------------------------+
```

Tone drill tab (desktop):

```text
|  [ Listen ] [ Vocabulary ] [(Tone drill)]                        Question 3 of 5   (* ON_DEVICE 380ms) |
|  +--------------------------------------------------------------------------------------------------+ |
|  |  Write the word for "vehicle" with the correct tones.                                            | |
|  |  Hint: two syllables, pattern  M . L                                                             | |
|  |                                                                                                  | |
|  |  +--------------------------------------------------------------------------------------------+  | |
|  |  |  ọkọ|                                                                     (input 56px)    |  | |
|  |  +--------------------------------------------------------------------------------------------+  | |
|  |  DIACRITIC PICKER                                                                                | |
|  |  Letters: [ẹ] [ọ] [ṣ] [Ẹ] [Ọ] [Ṣ]        Tones: [ ́ High] [ ̄ Mid] [ ̀ Low]                       | |
|  |                                                                                                  | |
|  |  [Check answer]                                                     [Skip]                       | |
|  +--------------------------------------------------------------------------------------------------+ |
|  +--------------------------------------------------------------------------------------------------+ |
|  |  FEEDBACK                                                                                        | |
|  |  ọ (M) correct    kọ̀ (L) expected, you wrote kọ (M)                                              | |
|  |  You wrote ọkọ (husband). The elder heard "husband", not "vehicle".                              | |
|  |  Tone accuracy this drill:  H 2/2   M 3/3   L 1/2                                                | |
|  +--------------------------------------------------------------------------------------------------+ |
```

Mobile 390 px tone drill:

```text
+--------------------------------------+
| HEADER                               |
+--------------------------------------+
| < Ijebu elder greeting               |
| [Listen][Vocab][(Tone)]              |
| Q3/5            (* DEVICE 380ms)     |
| Write "vehicle" with correct tones   |
| Pattern: M . L                       |
| +----------------------------------+ |
| | ọkọ|                             | |
| +----------------------------------+ |
| +----------------------------------+ |
| | [ẹ][ọ][ṣ]  [ ́ ][ ̄ ][ ̀ ]         | |  picker docked above keyboard
| +----------------------------------+ |
| [ Check answer               ]      |  full-width 48px
| Feedback card (expands)              |
+--------------------------------------+
```

### 2.4 Native Trainer Dictionary Drawer

Desktop: right-side drawer 480 px wide, full height under header, overlay scrim 40 percent.

```text
                                            +----------------------------------------------+
                                            | DICTIONARY . Yoruba . Ijebu          [x]     |
                                            | [Search headword or English...        ]      |
                                            | Filters: (Verified) (Pending) (This scene)   |
                                            +----------------------------------------------+
                                            | usu                       (Verified)  [>]    |
                                            | standard: isu . yam . H? M M                 |
                                            | by R. Ogunbanjo, reviewed by 1               |
                                            +----------------------------------------------+
                                            | ẹdiyẹ                      (Pending)   [>]    |
                                            | standard: adìyẹ . fowl . M M M               |
                                            +----------------------------------------------+
                                            | ...                                          |
                                            +----------------------------------------------+
                                            | [+ Submit new entry]  (trainers only)        |
                                            +----------------------------------------------+
```

Entry form (inside drawer for trainers, or full page /trainer/submit on mobile):

```text
| Headword        [ ẹdiyẹ                  ]  DiacriticPicker below |
| Standard form   [ adìyẹ                  ]                        |
| English gloss   [ fowl, chicken          ]                        |
| Syllables       ẹ | di | yẹ   (auto split, editable)              |
| Tone pattern    [H][M][L]  [H][M][L]  [H][M][L]   (one per syl.)  |
| Example         [ ...                    ]                        |
| Translation     [ ...                    ]                        |
| (AI check: 1 warning . syllables vs tones mismatch)   ON_DEVICE  |
| [Save draft]                                [Submit for review]   |
```

Mobile 390 px: drawer becomes full-screen sheet with sticky search at top and sticky submit button at bottom (safe-area inset aware).

---

## 3. Visual Design System

### 3.1 Colour Palette

Core brand tokens (values are final; WCAG ratios measured against the stated surface):

| Token | Light mode | Dark mode | Usage |
|---|---|---|---|
| --color-surface-base | #F7F5F0 (warm paper) | #0B1026 (midnight) | App background |
| --color-surface-raised | #FFFFFF | #131A3A | Cards, drawers |
| --color-surface-sunken | #EEEAE1 | #080C1E | Inputs, wells |
| --color-surface-inverse | #121A3F | #F7F5F0 | Header bar in light mode |
| --color-indigo-900 | #121A3F | #121A3F | Primary brand, header, rail |
| --color-indigo-700 | #26337A | #3A4AA8 | Primary buttons, links |
| --color-indigo-500 | #4457C4 | #6C7EE6 | Focus ring base, selected states |
| --color-indigo-100 | #E3E7FB | #1D2654 | Subtle selected backgrounds |
| --color-gold-600 | #B7791F | #D69E2E | Cultural accents, earned stamps, cached indicator |
| --color-gold-400 | #E0A93B | #ECC15E | Stamp fill, map earned regions |
| --color-gold-100 | #FBF1DC | #3A2C10 | Gold tinted backgrounds |
| --color-text-primary | #141829 | #F2F3F8 | Body text (15.8:1 light, 15.1:1 dark) |
| --color-text-secondary | #4A5068 | #B4B9CF | Secondary text (7.9:1 light, 8.6:1 dark) |
| --color-text-muted | #6B7088 | #8C92AD | Translations, captions (4.9:1 light, 5.6:1 dark) |
| --color-border | #D9D4C7 | #26305E | Dividers, input borders |

Inference and status tokens:

| Token | Light | Dark | Meaning |
|---|---|---|---|
| --color-edge-600 (emerald) | #047857 | #34D399 | ON_DEVICE text and icon |
| --color-edge-100 | #D1FAE5 | #052E22 | ON_DEVICE pill background |
| --color-cloud-600 (sky) | #0369A1 | #38BDF8 | IN_CLOUD text and icon, TTS streaming |
| --color-cloud-100 | #E0F2FE | #072A40 | IN_CLOUD pill background |
| --color-cached-600 (slate) | #475569 | #CBD5E1 | CACHED_FALLBACK (deterministic offline) |
| --color-cached-100 | #E2E8F0 | #1E293B | CACHED_FALLBACK background |
| --color-success-600 | #15803D | #4ADE80 | Correct answer |
| --color-warning-600 | #B45309 | #FBBF24 | Pending, download in progress |
| --color-danger-600 | #B91C1C | #F87171 | Incorrect answer, security failure |
| --color-offline-600 | #7C2D12 | #FDBA74 | Offline banner text |
| --color-offline-100 | #FFEDD5 | #3B1A08 | Offline banner background |

Tone class tokens (used in chips, syllable underlines, mastery bars):

| Token | Light | Dark | Tone |
|---|---|---|---|
| --color-tone-high | #9D174D (rose) | #F472B6 | High (acute mark) |
| --color-tone-mid | #3730A3 (indigo) | #A5B4FC | Mid (unmarked or macron) |
| --color-tone-low | #0F766E (teal) | #5EEAD4 | Low (grave mark) |

Tone colour is never the only signal: each chip also shows the letter H, M, or L and the diacritic.

### 3.2 Typography

Font pairing (loaded with next/font/google, subsets latin and latin-ext, display swap):

| Role | Family | Why |
|---|---|---|
| Display and headings | Noto Serif Display (fallback Noto Serif, Georgia) | Elegant, cultural gravitas, full coverage of Latin Extended Additional (ẹ, ọ, ṣ, ị, ụ, ṅ) and correct stacking of combining acute, grave, and macron above dot-below letters |
| Body and UI | Noto Sans (fallback system-ui, Segoe UI) | Best-in-class combining diacritic positioning, Hausa hooked letters (ɓ, ɗ, ƙ, ƴ), consistent metrics |
| Numerals and telemetry | JetBrains Mono (fallback ui-monospace) | Tabular figures for counters and latency |

Diacritic rendering rules:

- Store and render NFC. Characters such as ọ̀ (o with dot below plus combining grave) have no precomposed form, so line height must leave room above and below: minimum line-height 1.5 for any Yoruba or Igbo text.
- Never apply letter-spacing tighter than 0 to Yoruba or Igbo text (marks collide).
- Apply font-feature-settings "ccmp" and "mark" (default in modern browsers, do not disable).
- Uppercasing Yoruba is forbidden in headings (Ẹ̀ with marks above capitals is cramped); use sentence case.

Type scale (root 16 px):

| Token | rem | px | Weight | Line height | Letter spacing | Family | Usage |
|---|---|---|---|---|---|---|---|
| text-display | 3.0 | 48 | 600 | 1.15 | -0.01em | Serif Display | Landing hero |
| text-h1 | 2.25 | 36 | 600 | 1.2 | -0.005em | Serif Display | Page titles |
| text-h2 | 1.75 | 28 | 600 | 1.25 | 0 | Serif Display | Section titles |
| text-h3 | 1.375 | 22 | 600 | 1.35 | 0 | Noto Sans | Card titles |
| text-lesson-xl | 2.0 | 32 | 500 | 1.6 | 0.01em | Noto Sans | Drill target word, input text |
| text-lesson | 1.25 | 20 | 400 | 1.7 | 0.005em | Noto Sans | Transcript lines in indigenous languages |
| text-body | 1.0 | 16 | 400 | 1.6 | 0 | Noto Sans | Body |
| text-body-sm | 0.875 | 14 | 400 | 1.55 | 0 | Noto Sans | Secondary, translations |
| text-caption | 0.75 | 12 | 500 | 1.4 | 0.02em | Noto Sans | Labels, pill text |
| text-mono | 0.875 | 14 | 500 | 1.4 | 0 | JetBrains Mono | Counters, latency |

Mobile adjustments (below 640 px): text-display 2.25 rem, text-h1 1.75 rem, text-h2 1.375 rem, text-lesson-xl 1.75 rem. Lesson text never drops below 1.125 rem.

### 3.3 Spacing, Radius, Elevation

- Spacing base unit 4 px (Tailwind default scale). Layout rhythm uses 4, 8, 12, 16, 24, 32, 48, 64.
- Radius: radius-sm 6 px (chips), radius-md 10 px (inputs, buttons), radius-lg 16 px (cards), radius-xl 24 px (drawers, modals), radius-full (pills).
- Elevation: shadow-1 0 1px 2px rgba(18,26,63,0.08); shadow-2 0 4px 12px rgba(18,26,63,0.10); shadow-3 0 12px 32px rgba(18,26,63,0.16). Dark mode replaces shadows with 1 px borders in --color-border plus surface-raised.

### 3.4 Iconography

- Base set: Lucide icons, 1.75 px stroke, 20 px default, 16 px in pills.
- Custom SVG icons (public/icons/, 24 by 24 viewBox, currentColor stroke, 1.75 px):
  - icon-chip-edge.svg: microchip with leaf vein (ON_DEVICE).
  - icon-cloud-wave.svg: cloud with sound wave (IN_CLOUD TTS).
  - icon-cached-box.svg: archive box with check (CACHED_FALLBACK, saved offline).
  - icon-naira.svg: Naira sign with double strike, optically balanced.
  - icon-tone-high.svg, icon-tone-mid.svg, icon-tone-low.svg: pitch contours.
  - icon-talking-drum.svg: dundun outline for audio player idle state.
- Stamp art (public/stamps/, 160 by 160 viewBox, two-colour gold and indigo line art): ijebu.svg (Ijebu Ode gate motif), ekiti.svg (hills), ondo.svg, owerri.svg (Mbari house), onitsha.svg (Niger bridge), ikwerre.svg, kano.svg (city walls and dye pits), lagos-pidgin.svg (danfo bus).
- Nigeria map: public/maps/nigeria-dialects.svg, each region path has id matching dialects/{dialectId}.mapRegionId, simplified to under 60 KB.

---

## 4. Component Library Specifications

### 4.1 InferenceSourcePill (Live Telemetry)

| Property | Spec |
|---|---|
| File | src/components/telemetry/InferenceSourcePill.tsx |
| Props | source: "ON_DEVICE" or "IN_CLOUD" or "CACHED_FALLBACK" or "IDLE"; modelLabel: string; latencyMs?: number; streaming?: boolean; onOpenDetails: () => void |
| Size | Height 32 px desktop, 28 px mobile; padding-x 12 px; gap 8 px; radius-full |
| ON_DEVICE | bg edge-100, text and icon edge-600, icon icon-chip-edge, label "ON_DEVICE", model "Gemini Nano" |
| IN_CLOUD | bg cloud-100, text cloud-600, icon icon-cloud-wave, label "IN_CLOUD", model from Remote Config |
| CACHED_FALLBACK | bg cached-100, text cached-600, label "OFFLINE . CACHED" |
| IDLE | border 1 px --color-border, text-secondary, label of last known source |
| Streaming | 6 px dot left of label pulsing (scale 1 to 1.4, 1.2 s ease-in-out infinite) |
| Change animation | Cross-fade background colour 200 ms, label slides up 8 px with spring (stiffness 400, damping 30) |
| Accessibility | role="status", aria-live="polite", aria-label "Last response generated on device by Gemini Nano in 412 milliseconds" |
| Data binding | Value comes from useInferenceTelemetry, which reads the SDK response inferenceSource; never inferred from settings |

### 4.2 DataSavedCounter (Mobile Data and Naira Saved)

| Property | Spec |
|---|---|
| File | src/components/telemetry/DataSavedCounter.tsx |
| Props | bytesSaved: number; nairaSaved: number; compact?: boolean |
| Layout | Two stacked lines, right aligned: MB (text-mono 14 px, 600) and Naira (text-mono 12 px, gold-600) |
| Format | MB with 1 decimal under 100 MB, integer above; Naira with Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }) |
| Increment animation | Number tween 600 ms ease-out; a "+48 KB" chip floats up 12 px and fades over 900 ms |
| Tooltip | "Estimated data you would have used if this ran in the cloud. Rate: N0.78 per MB (MTN 1 GB bundle)." Values read from Remote Config |
| Accessibility | aria-live="polite" with throttled announcements (max once per 10 s) |

### 4.3 CulturalDialectStampCard

| Property | Spec |
|---|---|
| File | src/components/map/StampCard.tsx |
| Props | dialect: Dialect; state: "locked" or "in-progress" or "earned"; progress: number; earnedAt?: Date |
| Size | Desktop 1 of 4 columns (min 200 px), aspect 4:5; mobile 132 by 168 px |
| Locked | Stamp art at 30 percent opacity, greyscale filter, dashed 1.5 px border, lock icon, label "Complete a scenario to earn" |
| In progress | Progress ring 48 px around stamp (stroke 4 px, indigo-500 on border colour), percentage label |
| Earned | Full colour gold and indigo art, solid 2 px gold-600 border, perforated edge mask (SVG), earned date in caption, subtle 2 degree rotation |
| Earn animation | Scale 0.6 to 1 with spring (stiffness 260, damping 18), ink-press shadow fade, 1 gentle haptic on mobile (navigator.vibrate(15) if available) |
| Interaction | Click opens RegionDrawer focused on that dialect |

### 4.4 DiacriticPicker (Yoruba and Igbo Tonal Input)

| Property | Spec |
|---|---|
| File | src/components/drill/DiacriticPicker.tsx |
| Props | language: "yo" or "ig" or "ha"; targetRef: RefObject of HTMLInputElement or HTMLTextAreaElement; onInsert?: (text) => void |
| Yoruba letter keys | ẹ, ọ, ṣ, Ẹ, Ọ, Ṣ |
| Igbo letter keys | ị, ọ, ụ, ṅ, Ị, Ọ, Ụ, Ṅ |
| Hausa letter keys | ɓ, ɗ, ƙ, ƴ, ʼ (and capitals) |
| Tone keys (yo, ig) | High (combining acute U+0301), Mid (combining macron U+0304, optional, shown only when Remote Config flag show_mid_macron is true, otherwise "clear tone"), Low (combining grave U+0300), Clear (removes combining marks from the character before caret) |
| Behaviour | Tone key applies the combining mark to the character immediately before the caret, replacing any existing tone mark, then normalizes the whole value to NFC and restores caret position |
| Key size | 44 by 44 px minimum, gap 8 px, radius-md, text-lesson (20 px) |
| Tone key colours | Text uses tone tokens with H, M, L subscript labels |
| Keyboard shortcuts | Alt+1 high, Alt+2 mid, Alt+3 low, Alt+0 clear, Alt+E ẹ, Alt+O ọ, Alt+S ṣ (Yoruba) |
| Mobile | Docked above virtual keyboard using visualViewport resize listener; buttons preventDefault on pointerdown to keep input focus |
| Accessibility | Each key has aria-label (for example "Insert o with dot below", "Apply low tone"), role="toolbar" with arrow-key roving focus |

### 4.5 DualSpeakerWaveformPlayer (with Offline Cache Indicator)

| Property | Spec |
|---|---|
| File | src/components/audio/DualSpeakerPlayer.tsx (loaded with next/dynamic ssr false) |
| Props | scenario: Scenario; cacheState: "none" or "streaming" or "cached"; onSynthesize: () => void; onPlay: () => void |
| Layout | Two waveform lanes (height 40 px each, gap 8 px), speaker name left (120 px column), transport row below |
| Lane colours | Speaker A gold-600, speaker B indigo-500; inactive lane 35 percent opacity |
| Waveform | Canvas, 2 px bars with 2 px gap, peaks computed from PCM in 50 ms windows; live lane during streaming draws bars as chunks arrive |
| Transport | Play or Pause 48 px circular button, scrubber (disabled while streaming), time text-mono, speed 0.75x or 1x toggle (learning aid) |
| Cache indicator | none: outline chip "Not saved" plus [Save for offline] (cloud action, dims offline); streaming: sky chip "IN_CLOUD . streaming" with progress dots; cached: gold chip with icon-cached-box "Saved offline . 2.3 MB" |
| Transcript sync | Current line highlighted with indigo-100 background based on line timing estimate (characters proportion) |
| Errors | Inline danger text with Retry; never a blocking modal |

### 4.6 NanoDownloadBanner

| Property | Spec |
|---|---|
| File | src/components/telemetry/NanoDownloadBanner.tsx |
| Placement | Sticky under header, full width, height 48 px desktop, 56 px mobile |
| States | downloadable: "Download on-device AI to practise offline (one-time, large download)" with [Download] button; downloading: progress bar (height 4 px, emerald) plus "Downloading Gemini Nano . 46%" with [Hide]; ready: success toast "On-device AI ready" auto dismiss 4 s; error: warning colours with [Retry] and "Using cloud mode meanwhile" |
| Behaviour | Non-blocking; hide persists in session storage; progress shared via NanoReadinessProvider context |
| Accessibility | Progress bar role="progressbar" with aria-valuenow |

### 4.7 Supporting Components

| Component | Spec summary |
|---|---|
| ConnectivityBadge | Pill 28 px; Online (success-600 dot) or Offline (offline-600 dot plus label); updates within 100 ms |
| OfflineBanner | offline-100 background, 44 px, icon plus copy from section 2.1; slides down 180 ms |
| TelemetryDrawer | Lists last 20 inference events: time, feature, source chip, model, latency; shows counters and share of ON_DEVICE |
| QuizCard | Question text-h3, 4 options as 56 px tall buttons, selected indigo-100, correct success border, incorrect danger border with explanation |
| ToneChip | Syllable plus tone letter, underline 3 px in tone colour, radius-sm |
| MasteryBar | Label H, M, L; track 8 px border colour; fill tone colour; percentage text-mono |
| RegionDrawer | 380 px desktop side panel, bottom sheet on mobile |
| ScenarioCompleteModal | Accuracy, stamp preview, data saved during session, [Continue] |
| SignInUpgradeModal | Explains benefits (sync across devices), Google button per brand guidelines |
| Buttons | Primary indigo-700 bg, white text, 44 px height (48 mobile), radius-md; Secondary outline; Ghost; Gold (stamp actions only) |

---

## 5. High-Fidelity Mockup Specifications and Interactive Prototype States

### 5.1 Motion System

| Token | Value | Use |
|---|---|---|
| motion-fast | 120 ms cubic-bezier(0.2, 0, 0, 1) | Hover, press |
| motion-base | 200 ms cubic-bezier(0.2, 0, 0, 1) | Colour changes, pill cross-fade |
| motion-slow | 320 ms cubic-bezier(0.2, 0, 0, 1) | Drawers, sheets |
| spring-snappy | stiffness 400, damping 30 | Pill label, tabs indicator |
| spring-gentle | stiffness 260, damping 18 | Stamp earn, modal entrance |
| Reduced motion | All transforms disabled, opacity transitions max 120 ms | prefers-reduced-motion: reduce |

Implementation note: use CSS transitions and the Web Animations API or a lightweight spring helper. Do not add a heavy animation dependency without approval.

### 5.2 Interaction States (all interactive components)

| State | Visual |
|---|---|
| Default | As specified |
| Hover (pointer fine only) | Background shifts one step (indigo-700 to indigo-900; outline gains indigo-100 fill), motion-fast |
| Focus-visible | 2 px solid indigo-500 outline, 2 px offset; on dark surfaces gold-400 outline |
| Active or pressed | Scale 0.98, motion-fast |
| Disabled | 40 percent opacity, cursor not-allowed, aria-disabled true, no hover |
| Loading | Inline spinner 16 px replaces leading icon, label kept, aria-busy true |
| Offline-dimmed (cloud-only actions) | 40 percent opacity, cloud icon with slash, tooltip "Needs connection", aria-disabled true; still focusable for explanation |
| Error | Danger border 1.5 px, helper text in danger-600 |

### 5.3 Offline Dimming Matrix

| Action | Online | Offline |
|---|---|---|
| Play cached audio | Enabled | Enabled |
| Synthesize new audio (TTS) | Enabled | Dimmed |
| Vocabulary quiz (Nano ready) | Enabled (PREFER_ON_DEVICE) | Enabled (ONLY_ON_DEVICE) |
| Vocabulary quiz (Nano not ready) | Enabled (cloud fallback) | Enabled (CACHED_FALLBACK deterministic) |
| Tone grading explanation (Nano not ready) | Cloud | Deterministic comparison only |
| Sign in with Google | Enabled | Dimmed |
| Trainer submit | Enabled | Enabled (queued, "Will sync" chip) |
| Trainer approve | Enabled | Dimmed |
| Download Gemini Nano | Enabled | Dimmed |

### 5.4 Key Prototype Sequences (for demo and Figma prototype)

1. Pill transition: drill answered ON_DEVICE (emerald), user toggles "Force cloud" in diagnostics, next answer IN_CLOUD (sky), cross-fade 200 ms.
2. Airplane Mode: offline event, banner slides in within 100 ms, TTS button dims, quiz continues emerald, counter floats "+48 KB".
3. TTS streaming: tap Save for offline, sky chip with dots, first waveform bars within 1.5 s, chip turns gold "Saved offline" on completion.
4. Stamp earn: last answer correct, ScenarioCompleteModal springs in, stamp scales in, map region fills gold on close (fill transition 600 ms).
5. Remote Config live update: demo_announcement appears as a gold announcement bar without reload.

---

## 6. Developer Handoff Specs and Redlines

### 6.1 Breakpoints (Tailwind v4 defaults retained)

| Name | Min width | Layout |
|---|---|---|
| base | 0 | Mobile single column, bottom tab bar, 16 px side padding |
| sm | 640 px | Mobile large, 20 px side padding |
| md | 768 px | Tablet, icon-only rail 72 px, 24 px padding, 8-column grid |
| lg | 1024 px | Rail 240 px, 12-column grid, 24 px gutters, 32 px padding |
| xl | 1280 px | Same as lg, region drawer docked |
| 2xl | 1536 px | Content max width 1376 px centered |

Design reference frames: Desktop 1440 by 900, Mobile 390 by 844.

### 6.2 Grid and Layout Redlines

| Element | Tailwind classes (reference) | Redline |
|---|---|---|
| App shell | grid lg:grid-cols-[240px_1fr] md:grid-cols-[72px_1fr] | Rail fixed, content scrolls |
| Header | sticky top-0 z-40 h-14 lg:h-16 px-4 lg:px-8 | Bottom border 1 px border colour |
| Content container | mx-auto max-w-[1376px] px-4 sm:px-5 md:px-6 lg:px-8 py-6 lg:py-8 | |
| Map dashboard grid | grid grid-cols-1 lg:grid-cols-12 gap-6 | Map lg:col-span-8, drawer lg:col-span-4 |
| Stamp row | grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 (mobile uses horizontal scroll flex gap-3 snap-x) | |
| Card | rounded-2xl p-4 lg:p-6 bg-surface-raised shadow-1 | 16 px radius |
| Scenario layout | grid lg:grid-cols-12 gap-6 | Player and transcript lg:col-span-8, side lg:col-span-4 |
| Drill input | h-14 px-4 text-[2rem] rounded-[10px] | 56 px tall |
| Diacritic key | size-11 rounded-[10px] text-xl | 44 px |
| Bottom tab bar | fixed bottom-0 inset-x-0 h-16 pb-[env(safe-area-inset-bottom)] | 4 tabs equal width |
| Drawer (desktop) | fixed right-0 top-16 w-[480px] h-[calc(100dvh-4rem)] | Trainer dictionary |
| Pill | h-8 px-3 gap-2 rounded-full text-xs font-medium | |

### 6.3 Tailwind v4 Theme Tokens (src/app/globals.css)

```css
@import "tailwindcss";

@theme {
  --color-surface-base: #F7F5F0;
  --color-surface-raised: #FFFFFF;
  --color-surface-sunken: #EEEAE1;
  --color-indigo-900: #121A3F;
  --color-indigo-700: #26337A;
  --color-indigo-500: #4457C4;
  --color-indigo-100: #E3E7FB;
  --color-gold-600: #B7791F;
  --color-gold-400: #E0A93B;
  --color-gold-100: #FBF1DC;
  --color-edge-600: #047857;
  --color-edge-100: #D1FAE5;
  --color-cloud-600: #0369A1;
  --color-cloud-100: #E0F2FE;
  --color-cached-600: #475569;
  --color-cached-100: #E2E8F0;
  --color-tone-high: #9D174D;
  --color-tone-mid: #3730A3;
  --color-tone-low: #0F766E;
  --color-text-primary: #141829;
  --color-text-secondary: #4A5068;
  --color-text-muted: #6B7088;
  --color-border: #D9D4C7;
  --color-offline-600: #7C2D12;
  --color-offline-100: #FFEDD5;

  --font-display: var(--font-noto-serif-display), "Noto Serif", Georgia, serif;
  --font-sans: var(--font-noto-sans), system-ui, "Segoe UI", sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-surface-base: #0B1026;
    --color-surface-raised: #131A3A;
    --color-surface-sunken: #080C1E;
    --color-text-primary: #F2F3F8;
    --color-text-secondary: #B4B9CF;
    --color-text-muted: #8C92AD;
    --color-border: #26305E;
    --color-edge-600: #34D399;
    --color-edge-100: #052E22;
    --color-cloud-600: #38BDF8;
    --color-cloud-100: #072A40;
    --color-gold-600: #D69E2E;
    --color-tone-high: #F472B6;
    --color-tone-mid: #A5B4FC;
    --color-tone-low: #5EEAD4;
  }
}
```

Note: Dark mode is a Could-Have. The light theme is the demo default. If a manual toggle is added, switch the media query to a data-theme attribute selector.

### 6.4 SVG Asset Requirements

| Asset | Path | Constraints |
|---|---|---|
| Logo mark | public/brand/sokomu-mark.svg | 32 by 32 viewBox, two colours (indigo-900, gold-600), under 4 KB |
| Wordmark | public/brand/sokomu-wordmark.svg | Height 24 px at 1x |
| Nigeria dialect map | public/maps/nigeria-dialects.svg | Region paths with ids, stroke 1 px, no embedded raster, under 60 KB, inlined via React component for interactivity |
| Stamps (8) | public/stamps/*.svg | 160 by 160 viewBox, two colours, under 12 KB each, include title element for accessibility |
| Custom icons | public/icons/*.svg | 24 by 24, currentColor, 1.75 px stroke |
| Favicon and PWA icons | src/app/icon.png, src/app/apple-icon.png, public/icons/pwa-192.png, pwa-512.png | Generated from mark |
| Open Graph image | src/app/opengraph-image.png | 1200 by 630 |

### 6.5 Copy Guidelines

- Greetings by language: Yoruba "E kaabo" (written with full diacritics in the UI: Ẹ kú àbọ̀), Igbo "Nnọọ", Hausa "Sannu", Pidgin "How far".
- Feedback copy explains meaning, never just right or wrong.
- No em dashes in UI strings. Use commas, colons, or parentheses.
