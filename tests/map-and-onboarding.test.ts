import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, test } from "bun:test";
import { NIGERIA_DIALECT_REGIONS } from "../src/components/map/NigeriaMap";
import { clearMemoryMetaForTests } from "../src/lib/db/idb";
import {
  getSeedDialectsByLanguage,
  getSeedGlossaryByScenario,
  SEED_DIALECTS,
} from "../src/lib/db/seed-catalog";
import {
  getLocalUserProfile,
  saveUserProfilePreferences,
} from "../src/lib/progress/profile";

beforeEach(() => {
  clearMemoryMetaForTests();
});

describe("Cultural Map SVG, 8 Dialect Stamp SVGs, and Onboarding Profile (U-10)", () => {
  test("public/maps/nigeria-dialects.svg is under 60 KB and contains all 8 dialect mapRegionIds", () => {
    const mapPath = join(
      process.cwd(),
      "public",
      "maps",
      "nigeria-dialects.svg",
    );
    const stat = statSync(mapPath);
    expect(stat.size).toBeLessThan(60 * 1024);

    const svg = readFileSync(mapPath, "utf8");
    expect(NIGERIA_DIALECT_REGIONS.length).toBe(8);

    for (const dialect of SEED_DIALECTS) {
      expect(svg).toContain(`id="${dialect.mapRegionId}"`);
      const regionGeom = NIGERIA_DIALECT_REGIONS.find(
        (r) => r.dialectId === dialect.dialectId,
      );
      expect(regionGeom?.mapRegionId).toBe(dialect.mapRegionId);
    }
  });

  test("all 8 cultural stamp SVGs exist under 12 KB and include an accessible <title>", () => {
    for (const dialect of SEED_DIALECTS) {
      const relativeStampPath = dialect.stampArt.replace(/^\//, "");
      const fullPath = join(process.cwd(), "public", relativeStampPath);
      const stat = statSync(fullPath);
      expect(stat.size).toBeGreaterThan(100);
      expect(stat.size).toBeLessThan(12 * 1024);

      const content = readFileSync(fullPath, "utf8");
      expect(content).toContain("<svg");
      expect(content).toContain("<title>");
    }
  });

  test("persists onboarding profile preferences and filters dialects by language", async () => {
    const igboDialects = getSeedDialectsByLanguage("ig");
    expect(igboDialects.map((d) => d.dialectId)).toEqual([
      "ig-owerri",
      "ig-onitsha",
      "ig-ikwerre",
    ]);

    const saved = await saveUserProfilePreferences({
      languageId: "ig",
      dialectId: "ig-owerri",
      goal: "family",
      nanoStatus: "ready",
    });
    expect(saved.dialectId).toBe("ig-owerri");
    expect(saved.goal).toBe("family");

    const loaded = await getLocalUserProfile();
    expect(loaded.languageId).toBe("ig");
    expect(loaded.dialectId).toBe("ig-owerri");
    expect(loaded.nanoStatus).toBe("ready");

    const owerriGlossary = getSeedGlossaryByScenario(
      "ig-owerri-family-visit",
      "ig-owerri",
    );
    expect(owerriGlossary.length).toBeGreaterThan(0);
  });
});
