"use client";

import type { DrillResult } from "@/types/ai";
import {
  isIdbSupported,
  openSokomuDb,
  type QueuedDrillRecord,
} from "./idb";

const memoryDrillQueue = new Map<string, QueuedDrillRecord>();

export async function enqueueDrillResult(
  result: DrillResult,
): Promise<QueuedDrillRecord> {
  const existingMem = memoryDrillQueue.get(result.clientEventId);
  if (existingMem && existingMem.synced === 1) {
    return existingMem;
  }

  const record: QueuedDrillRecord = { ...result, synced: 0 };
  memoryDrillQueue.set(record.clientEventId, record);

  if (!isIdbSupported()) {
    return record;
  }

  try {
    const db = await openSokomuDb();
    const existing = await db.get("drillQueue", result.clientEventId);
    if (existing && existing.synced === 1) {
      memoryDrillQueue.set(existing.clientEventId, existing);
      return existing;
    }
    await db.put("drillQueue", record);
    return record;
  } catch {
    return record;
  }
}

export async function listPendingDrillResults(): Promise<QueuedDrillRecord[]> {
  if (!isIdbSupported()) {
    return Array.from(memoryDrillQueue.values())
      .filter((r) => r.synced === 0)
      .sort((a, b) => a.createdAt - b.createdAt);
  }
  try {
    const db = await openSokomuDb();
    const unsynced = await db.getAllFromIndex("drillQueue", "bySynced", 0);
    return unsynced.sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return Array.from(memoryDrillQueue.values())
      .filter((r) => r.synced === 0)
      .sort((a, b) => a.createdAt - b.createdAt);
  }
}

export async function markDrillResultsSynced(
  clientEventIds: readonly string[],
): Promise<void> {
  for (const id of clientEventIds) {
    const existing = memoryDrillQueue.get(id);
    if (existing) {
      memoryDrillQueue.set(id, { ...existing, synced: 1 });
    }
  }

  if (!isIdbSupported() || clientEventIds.length === 0) {
    return;
  }

  try {
    const db = await openSokomuDb();
    const tx = db.transaction("drillQueue", "readwrite");
    for (const id of clientEventIds) {
      const existing = await tx.store.get(id);
      if (existing) {
        await tx.store.put({ ...existing, synced: 1 });
      }
    }
    await tx.done;
  } catch {
    // In-memory state already marked synced.
  }
}

export function clearDrillQueueForTests(): void {
  memoryDrillQueue.clear();
}
