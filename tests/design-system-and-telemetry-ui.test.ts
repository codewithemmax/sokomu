import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { formatDataSavedDisplay } from "../src/components/telemetry/DataSavedCounter";
import { resolveInferencePillMeta } from "../src/components/telemetry/InferenceSourcePill";
import { OFFLINE_BANNER_COPY } from "../src/components/telemetry/OfflineBanner";
import { formatFeatureLabel } from "../src/components/telemetry/TelemetryDrawer";

describe("Design system tokens and SVG assets (T-6.1)", () => {
  test("globals.css defines all required Path C colour, font, and tone tokens", () => {
    const css = readFileSync(
      join(process.cwd(), "src", "app", "globals.css"),
      "utf8",
    );
    const requiredTokens = [
      "--color-surface-base: #F7F5F0",
      "--color-indigo-900: #121A3F",
      "--color-gold-600: #B7791F",
      "--color-edge-600: #047857",
      "--color-cloud-600: #0369A1",
      "--color-cached-600: #475569",
      "--color-tone-high: #9D174D",
      "--color-tone-mid: #3730A3",
      "--color-tone-low: #0F766E",
      "--font-display:",
      "--font-sans:",
      "--font-mono:",
    ];

    for (const token of requiredTokens) {
      expect(css).toContain(token);
    }
  });

  test("brand and telemetry SVG icons exist and stay under 4 KB", () => {
    const svgPaths = [
      "public/brand/sokomu-mark.svg",
      "public/brand/sokomu-wordmark.svg",
      "public/icons/icon-chip-edge.svg",
      "public/icons/icon-cloud-wave.svg",
      "public/icons/icon-cached-box.svg",
      "public/icons/icon-naira.svg",
      "public/icons/icon-tone-high.svg",
      "public/icons/icon-tone-mid.svg",
      "public/icons/icon-tone-low.svg",
      "public/icons/icon-talking-drum.svg",
    ];

    for (const rel of svgPaths) {
      const fullPath = join(process.cwd(), rel);
      const stat = statSync(fullPath);
      expect(stat.size).toBeGreaterThan(50);
      expect(stat.size).toBeLessThan(4096);
      const content = readFileSync(fullPath, "utf8");
      expect(content).toContain("<svg");
    }
  });
});

describe("Telemetry UI formatting helpers (T-5.3, T-5.4, T-5.5, T-5.6)", () => {
  test("resolveInferencePillMeta builds honest labels and aria-labels per source", () => {
    const onDevice = resolveInferencePillMeta("ON_DEVICE", "Gemini Nano", 380);
    expect(onDevice.badgeLabel).toBe("ON_DEVICE");
    expect(onDevice.shortMobileLabel).toBe("DEVICE");
    expect(onDevice.ariaLabel).toBe(
      "Last response generated on device by Gemini Nano in 380 milliseconds",
    );

    const inCloud = resolveInferencePillMeta(
      "IN_CLOUD",
      "gemini-3.1-flash-tts-preview",
      720,
    );
    expect(inCloud.badgeLabel).toBe("IN_CLOUD");
    expect(inCloud.shortMobileLabel).toBe("CLOUD");
    expect(inCloud.ariaLabel).toContain("gemini-3.1-flash-tts-preview");

    const cached = resolveInferencePillMeta("CACHED_FALLBACK", "IndexedDB", 8);
    expect(cached.badgeLabel).toBe("OFFLINE . CACHED");
    expect(cached.shortMobileLabel).toBe("CACHED");
  });

  test("formatDataSavedDisplay formats MB with 1 decimal under 100 MB and integer at/above 100 MB", () => {
    const small = formatDataSavedDisplay(14.6 * 1_048_576, 11.39);
    expect(small.mbLabel).toBe("14.6 MB");
    expect(small.nairaLabel).toContain("11.39");

    const large = formatDataSavedDisplay(125.4 * 1_048_576, 97.81);
    expect(large.mbLabel).toBe("125 MB");
  });

  test("exposes offline banner copy and feature labels", () => {
    expect(OFFLINE_BANNER_COPY).toContain("Drills keep working on your device");
    expect(formatFeatureLabel("vocab_quiz")).toBe("Vocabulary quiz");
    expect(formatFeatureLabel("tts_dialogue")).toBe("Two-speaker TTS");
    expect(formatFeatureLabel("cached_replay")).toBe("Offline audio replay");
  });
});
