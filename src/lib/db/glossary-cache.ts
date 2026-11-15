"use client";

import { getDocs, query, where } from "firebase/firestore";
import { glossaryColRef } from "@/lib/firebase/firestore";
import { nfc } from "@/lib/tone/normalize";
import type { DialectId, GlossaryEntry } from "@/types/domain";
import { isIdbSupported, openSokomuDb } from "./idb";

const memoryGlossary = new Map<string, GlossaryEntry>();

function normalizeEntry(entry: GlossaryEntry): GlossaryEntry {
  return {
    ...entry,
    headword: nfc(entry.headword),
    standardForm: entry.standardForm ? nfc(entry.standardForm) : null,
    syllables: entry.syllables.map(nfc),
    example: entry.example
      ? {
          text: nfc(entry.example.text),
          translation: entry.example.translation,
        }
      : null,
  };
}

export async function putGlossaryEntries(
  entries: readonly GlossaryEntry[],
): Promise<void> {
  const normalized = entries.map(normalizeEntry);
  for (const entry of normalized) {
    memoryGlossary.set(entry.entryId, entry);
  }
  if (!isIdbSupported()) {
    return;
  }
  try {
    const db = await openSokomuDb();
    const tx = db.transaction("glossary", "readwrite");
    await Promise.all([
      ...normalized.map((entry) => tx.store.put(entry)),
      tx.done,
    ]);
  } catch {
    // Keep in-memory cache when IDB transaction fails.
  }
}

export async function getCachedGlossaryByDialect(
  dialectId: DialectId,
): Promise<GlossaryEntry[]> {
  if (!isIdbSupported()) {
    return Array.from(memoryGlossary.values()).filter(
      (e) => e.dialectId === dialectId,
    );
  }
  try {
    const db = await openSokomuDb();
    return await db.getAllFromIndex("glossary", "byDialect", dialectId);
  } catch {
    return Array.from(memoryGlossary.values()).filter(
      (e) => e.dialectId === dialectId,
    );
  }
}

export async function getCachedGlossaryByScenario(
  scenarioId: string,
): Promise<GlossaryEntry[]> {
  if (!isIdbSupported()) {
    return Array.from(memoryGlossary.values()).filter((e) =>
      e.scenarioIds.includes(scenarioId),
    );
  }
  try {
    const db = await openSokomuDb();
    return await db.getAllFromIndex("glossary", "byScenario", scenarioId);
  } catch {
    return Array.from(memoryGlossary.values()).filter((e) =>
      e.scenarioIds.includes(scenarioId),
    );
  }
}

export async function loadGlossaryForScenario(
  scenarioId: string,
  dialectId: DialectId,
): Promise<GlossaryEntry[]> {
  const cached = await getCachedGlossaryByScenario(scenarioId);
  if (cached.length > 0) {
    return cached;
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return [];
  }

  try {
    const q = query(
      glossaryColRef(),
      where("scenarioIds", "array-contains", scenarioId),
      where("dialectId", "==", dialectId),
    );
    const snap = await getDocs(q);
    const fetched = snap.docs.map((d) => d.data() as GlossaryEntry);
    if (fetched.length > 0) {
      await putGlossaryEntries(fetched);
    }
    return fetched;
  } catch {
    return [];
  }
}

export async function loadGlossaryForDialect(
  dialectId: DialectId,
): Promise<GlossaryEntry[]> {
  const cached = await getCachedGlossaryByDialect(dialectId);
  if (cached.length > 0) {
    return cached;
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return [];
  }

  try {
    const q = query(
      glossaryColRef(),
      where("dialectId", "==", dialectId),
      where("verified", "==", true),
    );
    const snap = await getDocs(q);
    const fetched = snap.docs.map((d) => d.data() as GlossaryEntry);
    if (fetched.length > 0) {
      await putGlossaryEntries(fetched);
    }
    return fetched;
  } catch {
    return [];
  }
}

export function clearMemoryGlossaryForTests(): void {
  memoryGlossary.clear();
}
