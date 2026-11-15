"use client";

import { setDoc } from "firebase/firestore";
import { getMetaValue, setMetaValue } from "@/lib/db/idb";
import { getFirebase } from "@/lib/firebase/client";
import {
  userStampDocRef,
  userTelemetrySummaryDocRef,
} from "@/lib/firebase/firestore";
import { REMOTE_CONFIG_DEFAULTS } from "@/lib/firebase/remote-config-defaults";
import type { DialectId, EarnedStamp } from "@/types/domain";
import type { TelemetrySummary } from "@/types/telemetry";

const EARNED_STAMPS_META_KEY = "earnedStamps";

export function buildStampId(dialectId: DialectId, scenarioId: string): string {
  return `${dialectId}_${scenarioId}`;
}

export interface EvaluateStampUnlockParams {
  dialectId: DialectId;
  scenarioId: string;
  accuracy: number;
  threshold?: number;
  existingStampIds?: ReadonlySet<string> | readonly string[];
  earnedOffline?: boolean;
  now?: number;
}

export function evaluateStampUnlock(
  params: EvaluateStampUnlockParams,
): EarnedStamp | null {
  const threshold =
    typeof params.threshold === "number" && Number.isFinite(params.threshold)
      ? params.threshold
      : REMOTE_CONFIG_DEFAULTS.stamp_accuracy_threshold;

  const normalizedAccuracy = Number(
    Math.min(1, Math.max(0, params.accuracy)).toFixed(4),
  );
  if (normalizedAccuracy < threshold) {
    return null;
  }

  const stampId = buildStampId(params.dialectId, params.scenarioId);
  const existingSet =
    params.existingStampIds instanceof Set
      ? params.existingStampIds
      : new Set(params.existingStampIds ?? []);

  if (existingSet.has(stampId)) {
    return null;
  }

  return {
    stampId,
    dialectId: params.dialectId,
    scenarioId: params.scenarioId,
    accuracy: normalizedAccuracy,
    earnedAt: params.now ?? Date.now(),
    earnedOffline: Boolean(params.earnedOffline),
  };
}

export async function listEarnedStamps(): Promise<EarnedStamp[]> {
  const stored = await getMetaValue<EarnedStamp[]>(EARNED_STAMPS_META_KEY);
  if (!Array.isArray(stored)) {
    return [];
  }
  return [...stored].sort((a, b) => b.earnedAt - a.earnedAt);
}

export async function saveEarnedStamp(
  uid: string | null,
  stamp: EarnedStamp,
): Promise<EarnedStamp[]> {
  const current = await listEarnedStamps();
  const filtered = current.filter((item) => item.stampId !== stamp.stampId);
  const next = [stamp, ...filtered].sort((a, b) => b.earnedAt - a.earnedAt);
  await setMetaValue(EARNED_STAMPS_META_KEY, next);

  const isOffline =
    typeof navigator !== "undefined" && navigator.onLine === false;
  if (!uid || isOffline) {
    return next;
  }

  try {
    const { db } = getFirebase();
    await setDoc(userStampDocRef(uid, stamp.stampId, db), stamp, {
      merge: true,
    });
  } catch {
    // Offline or unauthenticated stamp stays persisted in IndexedDB.
  }

  return next;
}

export async function evaluateAndAwardStamp(
  uid: string | null,
  params: Omit<EvaluateStampUnlockParams, "existingStampIds">,
): Promise<{ unlocked: EarnedStamp | null; allStamps: EarnedStamp[] }> {
  const existing = await listEarnedStamps();
  const existingIds = new Set(existing.map((s) => s.stampId));
  const earnedOffline =
    params.earnedOffline ??
    (typeof navigator !== "undefined" && navigator.onLine === false);

  const unlocked = evaluateStampUnlock({
    ...params,
    existingStampIds: existingIds,
    earnedOffline,
  });

  if (!unlocked) {
    return { unlocked: null, allStamps: existing };
  }

  const allStamps = await saveEarnedStamp(uid, unlocked);
  return { unlocked, allStamps };
}

export async function syncTelemetrySummaryToFirestore(
  uid: string,
  summary: TelemetrySummary,
): Promise<boolean> {
  if (!uid) {
    return false;
  }
  const isOffline =
    typeof navigator !== "undefined" && navigator.onLine === false;
  if (isOffline) {
    return false;
  }

  try {
    const { db } = getFirebase();
    await setDoc(userTelemetrySummaryDocRef(uid, db), summary, {
      merge: true,
    });
    return true;
  } catch {
    return false;
  }
}
