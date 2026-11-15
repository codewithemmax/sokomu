"use client";

import { doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { scenariosColRef } from "@/lib/firebase/firestore";
import type { DialectId, Scenario } from "@/types/domain";
import { isIdbSupported, openSokomuDb } from "./idb";

const memoryScenarios = new Map<string, Scenario>();

export async function putScenario(scenario: Scenario): Promise<void> {
  memoryScenarios.set(scenario.scenarioId, scenario);
  if (!isIdbSupported()) {
    return;
  }
  try {
    const db = await openSokomuDb();
    await db.put("scenarios", scenario);
  } catch {
    // Keep in-memory scenario when IDB write fails.
  }
}

export async function putScenarios(
  scenarios: readonly Scenario[],
): Promise<void> {
  for (const s of scenarios) {
    memoryScenarios.set(s.scenarioId, s);
  }
  if (!isIdbSupported()) {
    return;
  }
  try {
    const db = await openSokomuDb();
    const tx = db.transaction("scenarios", "readwrite");
    await Promise.all([
      ...scenarios.map((scenario) => tx.store.put(scenario)),
      tx.done,
    ]);
  } catch {
    // Keep in-memory scenarios when IDB transaction fails.
  }
}

export async function getCachedScenario(
  scenarioId: string,
): Promise<Scenario | null> {
  if (!isIdbSupported()) {
    return memoryScenarios.get(scenarioId) ?? null;
  }
  try {
    const db = await openSokomuDb();
    return (await db.get("scenarios", scenarioId)) ?? null;
  } catch {
    return memoryScenarios.get(scenarioId) ?? null;
  }
}

export async function getCachedScenariosByDialect(
  dialectId?: DialectId,
): Promise<Scenario[]> {
  if (!isIdbSupported()) {
    const list = Array.from(memoryScenarios.values());
    const filtered = dialectId
      ? list.filter((s) => s.dialectId === dialectId)
      : list;
    return filtered.sort((a, b) => a.order - b.order);
  }
  try {
    const db = await openSokomuDb();
    const records = dialectId
      ? await db.getAllFromIndex("scenarios", "byDialect", dialectId)
      : await db.getAll("scenarios");
    return records.sort((a, b) => a.order - b.order);
  } catch {
    const list = Array.from(memoryScenarios.values());
    const filtered = dialectId
      ? list.filter((s) => s.dialectId === dialectId)
      : list;
    return filtered.sort((a, b) => a.order - b.order);
  }
}

export async function loadScenario(
  scenarioId: string,
): Promise<Scenario | null> {
  const cached = await getCachedScenario(scenarioId);
  if (cached) {
    return cached;
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return null;
  }

  try {
    const ref = doc(scenariosColRef(), scenarioId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return null;
    }
    const fetched = snap.data() as Scenario;
    await putScenario(fetched);
    return fetched;
  } catch {
    return null;
  }
}

export async function loadScenarios(
  dialectId?: DialectId,
): Promise<Scenario[]> {
  const cached = await getCachedScenariosByDialect(dialectId);
  if (cached.length > 0) {
    return cached;
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return [];
  }

  try {
    const col = scenariosColRef();
    const q = dialectId ? query(col, where("dialectId", "==", dialectId)) : col;
    const snap = await getDocs(q);
    const fetched = snap.docs
      .map((d) => d.data() as Scenario)
      .sort((a, b) => a.order - b.order);
    if (fetched.length > 0) {
      await putScenarios(fetched);
    }
    return fetched;
  } catch {
    return [];
  }
}

export function clearMemoryScenariosForTests(): void {
  memoryScenarios.clear();
}
