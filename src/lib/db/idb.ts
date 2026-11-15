"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { DrillResult } from "@/types/ai";
import type { GlossaryEntry, Scenario } from "@/types/domain";
import type { InferenceEvent } from "@/types/telemetry";

export const IDB_NAME = "sokomu";
export const IDB_VERSION = 1;

export interface AudioCacheRecord {
  key: string;
  scenarioId: string;
  pcm: ArrayBuffer;
  sampleRate: 24000;
  channels: 1;
  bytes: number;
  durationMs: number;
  ttsModel: string;
  promptHash: string;
  createdAt: number;
}

export type QueuedDrillRecord = DrillResult & { synced: 0 | 1 };

export interface MetaRecord {
  key: string;
  value: unknown;
}

export interface SokomuDB extends DBSchema {
  audioCache: {
    key: string;
    value: AudioCacheRecord;
    indexes: { byScenario: string };
  };
  glossary: {
    key: string;
    value: GlossaryEntry;
    indexes: { byDialect: string; byScenario: string };
  };
  scenarios: {
    key: string;
    value: Scenario;
    indexes: { byDialect: string };
  };
  drillQueue: {
    key: string;
    value: QueuedDrillRecord;
    indexes: { byCreatedAt: number; bySynced: number };
  };
  telemetry: {
    key: number;
    value: InferenceEvent;
    indexes: { byTs: number };
  };
  meta: {
    key: string;
    value: MetaRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<SokomuDB>> | null = null;
const memoryMeta = new Map<string, unknown>();

export function isIdbSupported(): boolean {
  return typeof indexedDB !== "undefined";
}

export function openSokomuDb(): Promise<IDBPDatabase<SokomuDB>> {
  if (!isIdbSupported()) {
    return Promise.reject(
      new Error("IndexedDB unavailable (SSR or restricted browser mode)."),
    );
  }
  dbPromise ??= openDB<SokomuDB>(IDB_NAME, IDB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("audioCache")) {
        const audio = db.createObjectStore("audioCache", { keyPath: "key" });
        audio.createIndex("byScenario", "scenarioId");
      }
      if (!db.objectStoreNames.contains("glossary")) {
        const glossary = db.createObjectStore("glossary", {
          keyPath: "entryId",
        });
        glossary.createIndex("byDialect", "dialectId");
        glossary.createIndex("byScenario", "scenarioIds", { multiEntry: true });
      }
      if (!db.objectStoreNames.contains("scenarios")) {
        const scenarios = db.createObjectStore("scenarios", {
          keyPath: "scenarioId",
        });
        scenarios.createIndex("byDialect", "dialectId");
      }
      if (!db.objectStoreNames.contains("drillQueue")) {
        const queue = db.createObjectStore("drillQueue", {
          keyPath: "clientEventId",
        });
        queue.createIndex("byCreatedAt", "createdAt");
        queue.createIndex("bySynced", "synced");
      }
      if (!db.objectStoreNames.contains("telemetry")) {
        const telemetry = db.createObjectStore("telemetry", {
          keyPath: "id",
          autoIncrement: true,
        });
        telemetry.createIndex("byTs", "ts");
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    },
  });
  return dbPromise;
}

export async function getMetaValue<T>(key: string): Promise<T | null> {
  if (!isIdbSupported()) {
    return (memoryMeta.get(key) as T | undefined) ?? null;
  }
  try {
    const db = await openSokomuDb();
    const record = await db.get("meta", key);
    return (record?.value as T | undefined) ?? null;
  } catch {
    return (memoryMeta.get(key) as T | undefined) ?? null;
  }
}

export async function setMetaValue(key: string, value: unknown): Promise<void> {
  memoryMeta.set(key, value);
  if (!isIdbSupported()) {
    return;
  }
  try {
    const db = await openSokomuDb();
    await db.put("meta", { key, value });
  } catch {
    // Keep in-memory meta value when IDB write fails.
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !navigator.storage ||
    typeof navigator.storage.persist !== "function"
  ) {
    return false;
  }
  try {
    const alreadyPersisted =
      typeof navigator.storage.persisted === "function"
        ? await navigator.storage.persisted()
        : false;
    if (alreadyPersisted) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export interface StorageEstimateInfo {
  usageBytes: number;
  quotaBytes: number;
  persisted: boolean;
}

export async function estimateStorageUsage(): Promise<StorageEstimateInfo> {
  if (typeof navigator === "undefined" || !navigator.storage) {
    return { usageBytes: 0, quotaBytes: 0, persisted: false };
  }
  try {
    const [estimate, persisted] = await Promise.all([
      typeof navigator.storage.estimate === "function"
        ? navigator.storage.estimate()
        : Promise.resolve({ usage: 0, quota: 0 }),
      typeof navigator.storage.persisted === "function"
        ? navigator.storage.persisted()
        : Promise.resolve(false),
    ]);
    return {
      usageBytes: estimate.usage ?? 0,
      quotaBytes: estimate.quota ?? 0,
      persisted,
    };
  } catch {
    return { usageBytes: 0, quotaBytes: 0, persisted: false };
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export function clearMemoryMetaForTests(): void {
  memoryMeta.clear();
}
