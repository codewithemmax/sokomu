"use client";

import { serverTimestamp, writeBatch } from "firebase/firestore";
import {
  listPendingDrillResults,
  markDrillResultsSynced,
} from "@/lib/db/drill-queue";
import { setMetaValue, type QueuedDrillRecord } from "@/lib/db/idb";
import { getFirebase } from "@/lib/firebase/client";
import { userDrillResultDocRef } from "@/lib/firebase/firestore";

export interface SyncFlushResult {
  flushedCount: number;
  remainingCount: number;
}

export interface FlushDrillQueueOptions {
  writer?: (items: readonly QueuedDrillRecord[]) => Promise<void>;
}

let inFlightFlush: Promise<SyncFlushResult> | null = null;

async function defaultFirestoreWriter(
  items: readonly QueuedDrillRecord[],
): Promise<void> {
  const { db } = getFirebase();
  const batch = writeBatch(db);

  for (const item of items) {
    // Idempotent document path: users/{uid}/drillResults/{clientEventId}
    const ref = userDrillResultDocRef(item.uid, item.clientEventId, db);
    batch.set(
      ref,
      {
        clientEventId: item.clientEventId,
        scenarioId: item.scenarioId,
        kind: item.kind,
        score: item.score,
        items: item.items,
        tonal: item.tonal,
        inferenceSource: item.inferenceSource,
        createdAt: item.createdAt,
        syncedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  await batch.commit();
}

export async function flushDrillQueue(
  options: FlushDrillQueueOptions = {},
): Promise<SyncFlushResult> {
  if (inFlightFlush) {
    return inFlightFlush;
  }

  const run = async (): Promise<SyncFlushResult> => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      const pending = await listPendingDrillResults();
      return { flushedCount: 0, remainingCount: pending.length };
    }

    const pending = await listPendingDrillResults();
    if (pending.length === 0) {
      return { flushedCount: 0, remainingCount: 0 };
    }

    const writer = options.writer ?? defaultFirestoreWriter;
    try {
      await writer(pending);
      const syncedIds = pending.map((item) => item.clientEventId);
      await markDrillResultsSynced(syncedIds);
      await setMetaValue("lastSyncAt", Date.now());
      const remaining = await listPendingDrillResults();
      return {
        flushedCount: syncedIds.length,
        remainingCount: remaining.length,
      };
    } catch {
      return { flushedCount: 0, remainingCount: pending.length };
    }
  };

  inFlightFlush = run().finally(() => {
    inFlightFlush = null;
  });

  return inFlightFlush;
}

export function startSyncEngine(
  onFlush?: (result: SyncFlushResult) => void,
  options?: FlushDrillQueueOptions,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleOnline = (): void => {
    void flushDrillQueue(options).then((res) => {
      onFlush?.(res);
    });
  };

  window.addEventListener("online", handleOnline);
  if (typeof navigator === "undefined" || navigator.onLine) {
    handleOnline();
  }

  return () => {
    window.removeEventListener("online", handleOnline);
  };
}
