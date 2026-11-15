import { describe, expect, test } from "bun:test";
import { loadSeedBundle, validateSeedBundle } from "../scripts/seed-firestore";

describe("Linguistic seed bundle (U-04)", () => {
  const bundle = validateSeedBundle(loadSeedBundle());

  test("contains 4 languages and 8 regional dialects", () => {
    expect(bundle.languages.map((l) => l.languageId)).toEqual(["yo", "ig", "ha", "pcm"]);
    expect(bundle.dialects.map((d) => d.dialectId)).toEqual([
      "yo-ijebu",
      "yo-ekiti",
      "yo-ondo",
      "ig-owerri",
      "ig-onitsha",
      "ig-ikwerre",
      "ha-kano",
      "pcm-lagos",
    ]);
  });

  test("contains 8 two-speaker scenarios with at least 8 dialogue lines each", () => {
    expect(bundle.scenarios.length).toBe(8);
    for (const scenario of bundle.scenarios) {
      expect(scenario.speakers.length).toBe(2);
      expect(scenario.script.length).toBeGreaterThanOrEqual(8);
    }
  });

  test("includes canonical Yoruba tonal minimal pairs and regional lexical shifts", () => {
    const byId = new Map(bundle.glossary.map((g) => [g.entryId, g]));

    const husband = byId.get("yo-ijebu-oko-husband");
    const vehicle = byId.get("yo-ijebu-oko-vehicle");
    const spear = byId.get("yo-ijebu-oko-spear");
    const farm = byId.get("yo-ijebu-oko-farm");
    const usu = byId.get("yo-ijebu-usu");
    const ediye = byId.get("yo-ijebu-ediye");
    const rumu = byId.get("ig-ikwerre-rumu");

    expect(husband?.headword).toBe("ọkọ".normalize("NFC"));
    expect(husband?.tonePattern).toEqual(["M", "M"]);

    expect(vehicle?.headword).toBe("ọkọ̀".normalize("NFC"));
    expect(vehicle?.tonePattern).toEqual(["M", "L"]);

    expect(spear?.headword).toBe("ọ̀kọ̀".normalize("NFC"));
    expect(spear?.tonePattern).toEqual(["L", "L"]);

    expect(farm?.headword).toBe("oko");
    expect(farm?.tonePattern).toEqual(["M", "M"]);

    expect(usu?.headword).toBe("usu");
    expect(usu?.standardForm).toBe("isu");

    expect(ediye?.headword).toBe("ẹdiyẹ".normalize("NFC"));
    expect(ediye?.standardForm).toBe("adìyẹ".normalize("NFC"));

    expect(rumu?.headword).toBe("rụ́mụ̀".normalize("NFC"));
    expect(rumu?.standardForm).toBe("ụ́mụ̀".normalize("NFC"));
  });

  test("enforces 100% NFC normalization and syllable-to-tone parity across all entries", () => {
    expect(bundle.glossary.length).toBeGreaterThanOrEqual(75);
    for (const entry of bundle.glossary) {
      expect(entry.headword).toBe(entry.headword.normalize("NFC"));
      expect(entry.syllables.length).toBe(entry.tonePattern.length);
      expect(entry.verified).toBe(true);
    }
  });
});
