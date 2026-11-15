import { readFileSync } from "node:fs";
import { join } from "node:path";
import { initializeApp, getApps, getApp } from "firebase/app";
import { doc, getFirestore, writeBatch } from "firebase/firestore";
import { assertFirebaseConfig, firebaseConfig } from "../src/lib/firebase/config";
import type {
  Dialect,
  GlossaryEntry,
  Language,
  Scenario,
} from "../src/types/domain";

const SEED_DIR = join(process.cwd(), "scripts", "seed-data");

export interface SeedBundle {
  languages: Language[];
  dialects: Dialect[];
  scenarios: Scenario[];
  glossary: GlossaryEntry[];
}

export function loadSeedBundle(): SeedBundle {
  const languages = JSON.parse(
    readFileSync(join(SEED_DIR, "languages.json"), "utf8"),
  ) as Language[];
  const dialects = JSON.parse(
    readFileSync(join(SEED_DIR, "dialects.json"), "utf8"),
  ) as Dialect[];
  const scenarios = JSON.parse(
    readFileSync(join(SEED_DIR, "scenarios.json"), "utf8"),
  ) as Scenario[];
  const glossary = JSON.parse(
    readFileSync(join(SEED_DIR, "glossary.json"), "utf8"),
  ) as GlossaryEntry[];

  return { languages, dialects, scenarios, glossary };
}

function assertNfcAndNoEmDash(value: unknown, path: string): void {
  if (typeof value === "string") {
    if (value !== value.normalize("NFC")) {
      throw new Error(`Non-NFC string at ${path}: "${value}"`);
    }
    if (value.includes("\u2014")) {
      throw new Error(`Forbidden em dash at ${path}: "${value}"`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, idx) => assertNfcAndNoEmDash(item, `${path}[${idx}]`));
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const [k, v] of Object.entries(value)) {
      assertNfcAndNoEmDash(v, `${path}.${k}`);
    }
  }
}

export function validateSeedBundle(bundle: SeedBundle = loadSeedBundle()): SeedBundle {
  assertNfcAndNoEmDash(bundle.languages, "languages");
  assertNfcAndNoEmDash(bundle.dialects, "dialects");
  assertNfcAndNoEmDash(bundle.scenarios, "scenarios");
  assertNfcAndNoEmDash(bundle.glossary, "glossary");

  const languageIds = new Set(bundle.languages.map((l) => l.languageId));
  const dialectIds = new Set(bundle.dialects.map((d) => d.dialectId));
  const scenarioIds = new Set(bundle.scenarios.map((s) => s.scenarioId));
  const glossaryById = new Map(bundle.glossary.map((g) => [g.entryId, g]));

  for (const dialect of bundle.dialects) {
    if (!languageIds.has(dialect.languageId)) {
      throw new Error(`Dialect ${dialect.dialectId} references unknown language ${dialect.languageId}`);
    }
  }

  for (const entry of bundle.glossary) {
    if (!languageIds.has(entry.languageId)) {
      throw new Error(`Glossary ${entry.entryId} references unknown language ${entry.languageId}`);
    }
    if (!dialectIds.has(entry.dialectId)) {
      throw new Error(`Glossary ${entry.entryId} references unknown dialect ${entry.dialectId}`);
    }
    if (entry.syllables.length === 0 || entry.syllables.length !== entry.tonePattern.length) {
      throw new Error(
        `Glossary ${entry.entryId} has mismatched syllables (${entry.syllables.length}) and tonePattern (${entry.tonePattern.length})`,
      );
    }
    for (const sid of entry.scenarioIds) {
      if (!scenarioIds.has(sid)) {
        throw new Error(`Glossary ${entry.entryId} references unknown scenario ${sid}`);
      }
    }
  }

  for (const scenario of bundle.scenarios) {
    if (!dialectIds.has(scenario.dialectId)) {
      throw new Error(`Scenario ${scenario.scenarioId} references unknown dialect ${scenario.dialectId}`);
    }
    if (scenario.script.length < 8) {
      throw new Error(`Scenario ${scenario.scenarioId} must have at least 8 dialogue lines`);
    }
    for (const gid of scenario.glossaryEntryIds) {
      const entry = glossaryById.get(gid);
      if (!entry) {
        throw new Error(`Scenario ${scenario.scenarioId} references missing glossary entry ${gid}`);
      }
      if (!entry.scenarioIds.includes(scenario.scenarioId)) {
        throw new Error(
          `Glossary entry ${gid} does not list scenario ${scenario.scenarioId} in scenarioIds`,
        );
      }
    }
  }

  return bundle;
}

async function applySeedToFirestore(bundle: SeedBundle): Promise<void> {
  assertFirebaseConfig();
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const batch = writeBatch(db);

  for (const lang of bundle.languages) {
    batch.set(doc(db, "languages", lang.languageId), lang);
  }
  for (const dialect of bundle.dialects) {
    batch.set(doc(db, "dialects", dialect.dialectId), dialect);
  }
  for (const scenario of bundle.scenarios) {
    batch.set(doc(db, "scenarios", scenario.scenarioId), scenario);
  }
  for (const entry of bundle.glossary) {
    batch.set(doc(db, "glossary", entry.entryId), entry);
  }

  await batch.commit();
}

const isDirectExecution = process.argv[1]
  ?.replace(/\\/g, "/")
  .endsWith("scripts/seed-firestore.ts");

if (isDirectExecution) {
  const bundle = validateSeedBundle();
  console.log(
    `Validated seed bundle: ${bundle.languages.length} languages, ${bundle.dialects.length} dialects, ${bundle.scenarios.length} scenarios, ${bundle.glossary.length} glossary entries (100% NFC).`,
  );
  if (process.argv.includes("--apply")) {
    await applySeedToFirestore(bundle);
    console.log("Seeded Firestore collections: languages, dialects, scenarios, glossary.");
  } else {
    console.log("Dry-run complete. Pass --apply to write seed documents to Firestore.");
  }
}
