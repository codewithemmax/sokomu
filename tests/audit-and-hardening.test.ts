import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

function walkFiles(dirPath: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dirPath)) {
    const full = join(dirPath, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (stat.isFile()) {
      results.push(full);
    }
  }
  return results;
}

describe("Quality, Accessibility, Security and Hardening Audit (U-14)", () => {
  const rootDir = process.cwd();
  const srcDir = resolve(rootDir, "src");
  const testsDir = resolve(rootDir, "tests");
  const docsDir = resolve(rootDir, "docs");

  test("enforces zero hardcoded model IDs, forbidden AI config keys, any types, or ts-ignore in src/", () => {
    const srcFiles = walkFiles(srcDir);
    expect(srcFiles.length).toBeGreaterThan(30);

    for (const file of srcFiles) {
      const rel = relative(rootDir, file).replace(/\\/g, "/");
      const content = readFileSync(file, "utf8");

      if (rel !== "src/lib/firebase/remote-config-defaults.ts") {
        expect(content.includes("gemini-3.5-flash-lite")).toBe(false);
        expect(content.includes("gemini-3.1-flash-tts-preview")).toBe(false);
      }

      if (rel !== "src/lib/ai/config.ts") {
        expect(/\btopK\b/.test(content)).toBe(false);
        expect(/\btopP\b/.test(content)).toBe(false);
        expect(/\bMINIMAL\b/.test(content)).toBe(false);
      }

      expect(/:\s*any\b/.test(content)).toBe(false);
      expect(/\bas\s+any\b/.test(content)).toBe(false);
      expect(content.includes("@ts-ignore")).toBe(false);
      expect(content.includes("@ts-expect-error")).toBe(false);
    }
  });

  test("enforces zero em dashes across src/, tests/, and docs/", () => {
    const dirs = [srcDir, testsDir, docsDir].filter((d) => existsSync(d));
    for (const dir of dirs) {
      for (const file of walkFiles(dir)) {
        const content = readFileSync(file, "utf8");
        expect(content.includes("\u2014")).toBe(false);
      }
    }
  });

  test("verifies Accessibility (T-6.21), reduced motion, valid Tailwind v4 tokens, and Suspense wrappers", () => {
    const globalsCss = readFileSync(resolve(srcDir, "app/globals.css"), "utf8");
    expect(globalsCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globalsCss).toContain("--color-danger-100");

    const appShell = readFileSync(
      resolve(srcDir, "components/layout/AppShell.tsx"),
      "utf8",
    );
    expect(appShell).toContain('href="#main-content"');
    expect(appShell).toContain("Skip to main content");
    expect(appShell).toContain('id="main-content"');

    const picker = readFileSync(
      resolve(srcDir, "components/drill/DiacriticPicker.tsx"),
      "utf8",
    );
    expect(picker).toContain('role="toolbar"');
    expect(picker).toContain("ArrowRight");
    expect(picker).toContain("ArrowLeft");
    expect(picker.includes("<span>\\u0301 High</span>")).toBe(false);
    expect(picker.includes("<span>\\u0300 Low</span>")).toBe(false);

    const modal = readFileSync(
      resolve(srcDir, "components/ui/Modal.tsx"),
      "utf8",
    );
    expect(modal).toContain('aria-modal="true"');
    expect(modal).toContain("aria-labelledby=");
    expect(modal).toContain('event.key === "Escape"');
    expect(modal).toContain("previousFocus");

    const drawer = readFileSync(
      resolve(srcDir, "components/ui/Drawer.tsx"),
      "utf8",
    );
    expect(drawer).toContain('aria-modal="true"');
    expect(drawer).toContain("aria-labelledby=");
    expect(drawer).toContain('event.key === "Escape"');
    expect(drawer).toContain("previousFocus");

    for (const file of walkFiles(srcDir)) {
      const content = readFileSync(file, "utf8");
      expect(content.includes("terracotta-")).toBe(false);
      expect(content.includes("bg-tone-mid-bg")).toBe(false);
      expect(content.includes("font-dialect")).toBe(false);
      expect(content.includes("border-gold-500")).toBe(false);
    }

    const scenarioDetail = readFileSync(
      resolve(srcDir, "app/scenarios/[scenarioId]/page.tsx"),
      "utf8",
    );
    expect(scenarioDetail).toContain("<Suspense");

    const trainerSubmit = readFileSync(
      resolve(srcDir, "app/trainer/submit/page.tsx"),
      "utf8",
    );
    expect(trainerSubmit).toContain("<Suspense");
  });

  test("verifies offline shell and repository compliance files exist", () => {
    expect(existsSync(resolve(srcDir, "app/offline/page.tsx"))).toBe(true);
    expect(existsSync(resolve(rootDir, "public/sw.js"))).toBe(true);
    expect(existsSync(resolve(rootDir, "LICENSE"))).toBe(true);
    expect(existsSync(resolve(rootDir, "README.md"))).toBe(true);
    expect(existsSync(resolve(rootDir, ".env.example"))).toBe(true);
  });
});
