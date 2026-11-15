import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { initializeApp, type FirebaseApp } from "firebase/app";
import { assertFirebaseConfig, type FirebaseWebConfig } from "@/lib/firebase/config";
import { initAppCheck } from "@/lib/firebase/app-check";
import { getFirebase } from "@/lib/firebase/client";
import { REMOTE_CONFIG_DEFAULTS } from "@/lib/firebase/remote-config-defaults";

const ROOT = process.cwd();

describe("REMOTE_CONFIG_DEFAULTS parity", () => {
  test("matches every key in remoteconfig.template.json", () => {
    const template = JSON.parse(
      readFileSync(join(ROOT, "remoteconfig.template.json"), "utf8"),
    ) as { parameters: Record<string, unknown> };

    const templateKeys = Object.keys(template.parameters).sort();
    const defaultKeys = Object.keys(REMOTE_CONFIG_DEFAULTS).sort();
    expect(defaultKeys).toEqual(templateKeys);
  });
});

describe("assertFirebaseConfig", () => {
  const validConfig: FirebaseWebConfig = {
    apiKey: "test-api-key",
    authDomain: "sokomu.firebaseapp.com",
    projectId: "sokomu-test",
    storageBucket: "sokomu-test.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef",
  };

  test("passes when all required fields are populated and measurementId is omitted", () => {
    expect(() => assertFirebaseConfig(validConfig)).not.toThrow();
  });

  test("throws listing missing required fields", () => {
    const invalidConfig: FirebaseWebConfig = {
      ...validConfig,
      apiKey: "",
      projectId: "",
    };
    expect(() => assertFirebaseConfig(invalidConfig)).toThrow(
      /Missing Firebase config values: apiKey, projectId/,
    );
  });
});

describe("SSR window guards", () => {
  test("getFirebase throws when window is undefined", () => {
    expect(typeof window).toBe("undefined");
    expect(() => getFirebase()).toThrow(/server rendering/i);
  });

  test("initAppCheck throws when window is undefined", () => {
    const app: FirebaseApp = initializeApp(
      {
        apiKey: "test-api-key",
        authDomain: "sokomu.firebaseapp.com",
        projectId: "sokomu-test",
        appId: "1:123456789:web:abcdef",
      },
      "ssr-guard-test-app",
    );
    expect(() => initAppCheck(app)).toThrow(/browser/i);
  });
});
