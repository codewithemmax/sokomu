# Remote Config Dialect Rule Promotion Workflow

This runbook documents how recurring orthographic and phonological patterns approved in the Native Speaker Trainer Portal (`T-7.1` through `T-7.6`) are promoted into `dialect_rules_json` in Firebase Remote Config (`T-7.7`), updating both on-device Gemini Nano and Cloud Gemini grounding prompts without requiring a client redeploy.

## 1. Two-Tier Knowledge Architecture

Sokomu separates **vocabulary items** from **dialect-level generation rules**:

| Layer | Storage | Review Requirement | Delivery Latency |
| --- | --- | --- | --- |
| Regional Vocabulary (`GlossaryEntry`) | Firestore `glossary/{entryId}` | Two trainers (`submittedBy != reviewerUid`) | Immediate for online devices; cached in IDB `glossary` store |
| Phonological & Tonal Rules (`DialectRulesMap`) | Remote Config parameter `dialect_rules_json` | Lead Architect review + JSON validation | Live within Remote Config fetch interval (12h prod / 60s preview or `/settings/diagnostics` force refresh) |

## 2. Eligibility for Promotion

Promote a note or pattern from `trainerSubmissions` or `glossary` into `dialect_rules_json` when **all** of the following hold:

1. **Peer-verified pattern:** At least three approved `GlossaryEntry` documents (reviewed by independent native speakers) demonstrate the same dialect-to-standard phonological shift, pronoun elision, or orthography convention.
2. **Unicode NFC compliance:** Every example in the rule string is normalized to Unicode NFC (matching `src/lib/tone/normalize.ts`) and uses authentic dialect diacritics (sub-dots, hooked letters, acute/grave accents).
3. **Budget safety:** Keeping each dialect summary under 300 characters preserves prompt room for on-device Gemini Nano context windows (`quiz_grounding_max_entries`).

## 3. Step-by-Step Promotion Procedure

1. **Export current `dialect_rules_json` baseline** from `src/lib/firebase/remote-config-defaults.ts` or Firebase Console -> Remote Config -> `dialect_rules_json`.
2. **Add or refine the dialect key** using an existing `DialectId` (`yo-ijebu`, `yo-ekiti`, `yo-ondo`, `ig-owerri`, `ig-onitsha`, `ig-ikwerre`, `ha-kano`, `pcm-lagos`):
   - Keep `systemNotes` crisp (grammatical particles, tone rules, sub-dot contrasts).
   - Keep `commonPitfalls` actionable so `formatDialectRulesBlock()` guides distractor design and `TrainerAssist` warnings.
3. **Validate with Sokomu type guards locally:**
   - Ensure `isDialectRulesMap(parsedJson)` returns `true` (`src/types/guards.ts`).
   - Run `bun test` to verify prompt builders (`buildQuizPrompt`, `buildTonalDrillPrompt`, `buildGradingPrompt`, `buildTrainerAssistPrompt`) and seed catalogs remain valid.
4. **Update `REMOTE_CONFIG_DEFAULTS.dialect_rules_json` in git** so cold-start offline devices immediately inherit the updated rule defaults on the next release, and **publish the identical JSON string in Firebase Console -> Remote Config**.
5. **Verify propagation on-device:**
   - Open `/settings/diagnostics` (or `/diagnostics`) and click **Force Remote Config fetch**.
   - Run a **Force Cloud Drill** or **Trainer AI Consistency Check** and verify the updated rule summary influences warnings and grading notes without exceeding token budgets.

## 4. Rollback Procedure

If a published `dialect_rules_json` string fails JSON parsing or degrades on-device prompt adherence:

1. Open Firebase Console -> Remote Config -> Change History.
2. Click **Roll back** on the previous version of `dialect_rules_json`.
3. Client apps automatically fall back to `REMOTE_CONFIG_DEFAULTS.dialect_rules_json` whenever `JSON.parse()` fails inside `formatDialectRulesBlock()` (`src/lib/ai/prompts.ts`).
