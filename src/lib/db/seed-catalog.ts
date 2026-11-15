import dialectsData from "../../../scripts/seed-data/dialects.json";
import glossaryData from "../../../scripts/seed-data/glossary.json";
import languagesData from "../../../scripts/seed-data/languages.json";
import scenariosData from "../../../scripts/seed-data/scenarios.json";
import type {
  Dialect,
  DialectId,
  GlossaryEntry,
  Language,
  LanguageId,
  Scenario,
} from "@/types/domain";

export const SEED_LANGUAGES: readonly Language[] =
  languagesData as unknown as Language[];

export const SEED_DIALECTS: readonly Dialect[] =
  dialectsData as unknown as Dialect[];

export const SEED_SCENARIOS: readonly Scenario[] =
  scenariosData as unknown as Scenario[];

export const SEED_GLOSSARY: readonly GlossaryEntry[] =
  glossaryData as unknown as GlossaryEntry[];

export function getSeedLanguage(languageId: LanguageId): Language | undefined {
  return SEED_LANGUAGES.find((lang) => lang.languageId === languageId);
}

export function getSeedDialect(dialectId: DialectId): Dialect | undefined {
  return SEED_DIALECTS.find((dialect) => dialect.dialectId === dialectId);
}

export function getSeedDialectsByLanguage(
  languageId?: LanguageId,
): Dialect[] {
  const list = languageId
    ? SEED_DIALECTS.filter((d) => d.languageId === languageId)
    : [...SEED_DIALECTS];
  return [...list].sort((a, b) => a.order - b.order);
}

export function getSeedScenario(scenarioId: string): Scenario | undefined {
  return SEED_SCENARIOS.find((s) => s.scenarioId === scenarioId);
}

export function getSeedScenariosByDialect(dialectId?: DialectId): Scenario[] {
  const list = dialectId
    ? SEED_SCENARIOS.filter((s) => s.dialectId === dialectId)
    : [...SEED_SCENARIOS];
  return [...list].sort((a, b) => a.order - b.order);
}

export function getSeedGlossaryByScenario(
  scenarioId: string,
  dialectId?: DialectId,
): GlossaryEntry[] {
  return SEED_GLOSSARY.filter(
    (entry) =>
      entry.scenarioIds.includes(scenarioId) &&
      (!dialectId || entry.dialectId === dialectId),
  );
}

export function getSeedGlossaryByDialect(
  dialectId: DialectId,
): GlossaryEntry[] {
  return SEED_GLOSSARY.filter((entry) => entry.dialectId === dialectId);
}
