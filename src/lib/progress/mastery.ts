"use client";

import { setDoc } from "firebase/firestore";
import { getMetaValue, setMetaValue } from "@/lib/db/idb";
import { getFirebase } from "@/lib/firebase/client";
import { userProgressDocRef } from "@/lib/firebase/firestore";
import type { SyllableGrade } from "@/types/ai";
import type {
  DialectId,
  DialectProgress,
  Tone,
  TonalClassStat,
} from "@/types/domain";

const TONE_ORDER: readonly Tone[] = ["H", "M", "L"];

export function createEmptyTonalStats(): Record<Tone, TonalClassStat> {
  return {
    H: { correct: 0, total: 0 },
    M: { correct: 0, total: 0 },
    L: { correct: 0, total: 0 },
  };
}

export function createDefaultDialectProgress(
  dialectId: DialectId,
): DialectProgress {
  return {
    dialectId,
    scenariosCompleted: [],
    scenarioScores: {},
    tonal: createEmptyTonalStats(),
    lastPracticedAt: 0,
  };
}

export function aggregateTonalMastery(
  current: Record<Tone, TonalClassStat>,
  grades: readonly SyllableGrade[],
): Record<Tone, TonalClassStat> {
  const next: Record<Tone, TonalClassStat> = {
    H: {
      correct: Math.max(0, Math.round(current.H?.correct ?? 0)),
      total: Math.max(0, Math.round(current.H?.total ?? 0)),
    },
    M: {
      correct: Math.max(0, Math.round(current.M?.correct ?? 0)),
      total: Math.max(0, Math.round(current.M?.total ?? 0)),
    },
    L: {
      correct: Math.max(0, Math.round(current.L?.correct ?? 0)),
      total: Math.max(0, Math.round(current.L?.total ?? 0)),
    },
  };

  for (const grade of grades) {
    const tone = grade.expectedTone;
    if (tone === "H" || tone === "M" || tone === "L") {
      next[tone].total += 1;
      if (grade.correct) {
        next[tone].correct += 1;
      }
    }
  }

  return next;
}

export function computeTonalAccuracyPercent(stat: TonalClassStat): number {
  if (!stat || stat.total <= 0) {
    return 0;
  }
  const ratio = Math.min(1, Math.max(0, stat.correct / stat.total));
  return Math.round(ratio * 100);
}

export function computeOverallTonalAccuracyPercent(
  tonal: Record<Tone, TonalClassStat>,
): number {
  const total =
    (tonal.H?.total ?? 0) + (tonal.M?.total ?? 0) + (tonal.L?.total ?? 0);
  if (total <= 0) {
    return 0;
  }
  const correct =
    (tonal.H?.correct ?? 0) +
    (tonal.M?.correct ?? 0) +
    (tonal.L?.correct ?? 0);
  return Math.round(Math.min(1, Math.max(0, correct / total)) * 100);
}

export function findWeakestTones(
  tonal: Record<Tone, TonalClassStat>,
): Tone[] {
  return [...TONE_ORDER].sort((a, b) => {
    const statA = tonal[a] ?? { correct: 0, total: 0 };
    const statB = tonal[b] ?? { correct: 0, total: 0 };
    // Prioritize unpracticed tones first, then lowest accuracy ratio.
    const ratioA = statA.total <= 0 ? -1 : statA.correct / statA.total;
    const ratioB = statB.total <= 0 ? -1 : statB.correct / statB.total;
    if (ratioA !== ratioB) {
      return ratioA - ratioB;
    }
    return TONE_ORDER.indexOf(a) - TONE_ORDER.indexOf(b);
  });
}

export interface MergeScenarioProgressParams {
  dialectId: DialectId;
  scenarioId: string;
  accuracy: number;
  syllableGrades?: readonly SyllableGrade[];
  now?: number;
}

export function mergeScenarioProgress(
  current: DialectProgress | null | undefined,
  params: MergeScenarioProgressParams,
): DialectProgress {
  const base = current ?? createDefaultDialectProgress(params.dialectId);
  const clampedAccuracy = Number(
    Math.min(1, Math.max(0, params.accuracy)).toFixed(4),
  );
  const prevBest = base.scenarioScores[params.scenarioId] ?? 0;
  const bestScore = Math.max(prevBest, clampedAccuracy);

  const completedSet = new Set(base.scenariosCompleted);
  if (clampedAccuracy > 0) {
    completedSet.add(params.scenarioId);
  }

  const nextTonal = aggregateTonalMastery(
    base.tonal,
    params.syllableGrades ?? [],
  );

  return {
    dialectId: params.dialectId,
    scenariosCompleted: Array.from(completedSet),
    scenarioScores: {
      ...base.scenarioScores,
      [params.scenarioId]: bestScore,
    },
    tonal: nextTonal,
    lastPracticedAt: params.now ?? Date.now(),
  };
}

function progressMetaKey(dialectId: DialectId): string {
  return `progress:${dialectId}`;
}

export async function getLocalDialectProgress(
  dialectId: DialectId,
): Promise<DialectProgress> {
  const stored = await getMetaValue<DialectProgress>(
    progressMetaKey(dialectId),
  );
  if (!stored || typeof stored !== "object") {
    return createDefaultDialectProgress(dialectId);
  }
  return {
    dialectId,
    scenariosCompleted: Array.isArray(stored.scenariosCompleted)
      ? stored.scenariosCompleted
      : [],
    scenarioScores:
      stored.scenarioScores && typeof stored.scenarioScores === "object"
        ? stored.scenarioScores
        : {},
    tonal: stored.tonal ?? createEmptyTonalStats(),
    lastPracticedAt: Number(stored.lastPracticedAt ?? 0),
  };
}

export async function saveDialectProgress(
  uid: string | null,
  progress: DialectProgress,
): Promise<DialectProgress> {
  await setMetaValue(progressMetaKey(progress.dialectId), progress);

  const isOffline =
    typeof navigator !== "undefined" && navigator.onLine === false;
  if (!uid || isOffline) {
    return progress;
  }

  try {
    const { db } = getFirebase();
    await setDoc(userProgressDocRef(uid, progress.dialectId, db), progress, {
      merge: true,
    });
  } catch {
    // Local IDB progress remains source of truth offline or before auth initializes.
  }

  return progress;
}

export async function recordScenarioDrillProgress(
  uid: string | null,
  params: MergeScenarioProgressParams,
): Promise<DialectProgress> {
  const current = await getLocalDialectProgress(params.dialectId);
  const next = mergeScenarioProgress(current, params);
  return saveDialectProgress(uid, next);
}
