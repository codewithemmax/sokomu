"use client";

import {
  isIdbSupported,
  openSokomuDb,
  requestPersistentStorage,
  type AudioCacheRecord,
} from "./idb";

const memoryAudioCache = new Map<string, AudioCacheRecord>();
let persistenceRequested = false;

// Deterministic FNV-1a 32-bit hash for keying dialogue script + voice map + style.
export function computePromptHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildAudioCacheKey(
  scenarioId: string,
  promptHash: string,
  ttsModel: string,
): string {
  return `${scenarioId}:${promptHash}:${ttsModel}`;
}

export async function getCachedAudio(
  key: string,
): Promise<AudioCacheRecord | null> {
  if (!isIdbSupported()) {
    return memoryAudioCache.get(key) ?? null;
  }
  try {
    const db = await openSokomuDb();
    return (await db.get("audioCache", key)) ?? null;
  } catch {
    return memoryAudioCache.get(key) ?? null;
  }
}

export async function getCachedAudioForScenario(
  scenarioId: string,
): Promise<AudioCacheRecord | null> {
  if (!isIdbSupported()) {
    const matches = Array.from(memoryAudioCache.values())
      .filter((r) => r.scenarioId === scenarioId)
      .sort((a, b) => b.createdAt - a.createdAt);
    return matches[0] ?? null;
  }
  try {
    const db = await openSokomuDb();
    const records = await db.getAllFromIndex(
      "audioCache",
      "byScenario",
      scenarioId,
    );
    records.sort((a, b) => b.createdAt - a.createdAt);
    return records[0] ?? null;
  } catch {
    return null;
  }
}

export async function putCachedAudio(record: AudioCacheRecord): Promise<void> {
  memoryAudioCache.set(record.key, record);
  if (!persistenceRequested) {
    persistenceRequested = true;
    void requestPersistentStorage();
  }
  if (!isIdbSupported()) {
    return;
  }
  try {
    const db = await openSokomuDb();
    await db.put("audioCache", record);
  } catch {
    // Keep in-memory fallback record if IndexedDB write fails.
  }
}

export async function listCachedAudio(): Promise<AudioCacheRecord[]> {
  if (!isIdbSupported()) {
    return Array.from(memoryAudioCache.values()).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  }
  try {
    const db = await openSokomuDb();
    const all = await db.getAll("audioCache");
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return Array.from(memoryAudioCache.values());
  }
}

export async function deleteCachedAudioByScenario(
  scenarioId: string,
): Promise<number> {
  let deleted = 0;
  for (const [k, v] of memoryAudioCache.entries()) {
    if (v.scenarioId === scenarioId) {
      memoryAudioCache.delete(k);
      deleted += 1;
    }
  }
  if (!isIdbSupported()) {
    return deleted;
  }
  try {
    const db = await openSokomuDb();
    const records = await db.getAllFromIndex(
      "audioCache",
      "byScenario",
      scenarioId,
    );
    const tx = db.transaction("audioCache", "readwrite");
    await Promise.all([
      ...records.map((r) => tx.store.delete(r.key)),
      tx.done,
    ]);
    return records.length;
  } catch {
    return deleted;
  }
}

export async function clearAllAudioCache(): Promise<void> {
  memoryAudioCache.clear();
  if (!isIdbSupported()) {
    return;
  }
  try {
    const db = await openSokomuDb();
    await db.clear("audioCache");
  } catch {
    // Ignore clear failure when offline DB is unavailable.
  }
}
