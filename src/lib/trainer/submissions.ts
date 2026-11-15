import {
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { putGlossaryEntries } from "@/lib/db/glossary-cache";
import { getMetaValue, setMetaValue } from "@/lib/db/idb";
import { getFirebase } from "@/lib/firebase/client";
import {
  glossaryColRef,
  trainerRequestDocRef,
  trainerSubmissionsColRef,
} from "@/lib/firebase/firestore";
import { nfc } from "@/lib/tone/normalize";
import type {
  DialectId,
  GlossaryEntry,
  GlossaryExample,
  LanguageId,
  Tone,
  TrainerRequest,
  TrainerSubmission,
} from "@/types/domain";
import { isDialectId, isTone } from "@/types/guards";

function inferLanguageId(dialectId: DialectId): LanguageId {
  if (dialectId.startsWith("yo-")) return "yo";
  if (dialectId.startsWith("ig-")) return "ig";
  if (dialectId.startsWith("ha-")) return "ha";
  return "pcm";
}

export const TRAINER_SUBMISSION_QUEUE_META_KEY = "trainerSubmissionQueue";
export const TRAINER_REQUEST_META_PREFIX = "trainerAccessRequest:";

export interface TrainerSubmissionDraft {
  dialectId: DialectId;
  headword: string;
  standardForm?: string | null;
  glossEn: string;
  syllables: string[];
  tonePattern: Tone[];
  exampleLine?: string;
  exampleGlossEn?: string;
  note?: string | null;
  scenarioIds?: string[];
}

export interface TrainerSubmissionRecord extends TrainerSubmission {
  scenarioIds?: string[];
  pendingSync?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  normalizedDraft: {
    dialectId: DialectId;
    headword: string;
    standardForm: string | null;
    glossEn: string;
    syllables: string[];
    tonePattern: Tone[];
    example: GlossaryExample | null;
    note: string | null;
    scenarioIds: string[];
  };
}

function isBrowserOnline(): boolean {
  if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
    return navigator.onLine;
  }
  return true;
}

function generateId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Validates and NFC-normalizes a trainer entry draft before persistence.
 */
export function validateTrainerEntryDraft(
  draft: TrainerSubmissionDraft,
): ValidationResult {
  const errors: string[] = [];

  if (!isDialectId(draft.dialectId)) {
    errors.push("Select a valid Nigerian dialect.");
  }

  const headword = nfc(draft.headword).trim();
  if (!headword) {
    errors.push("Headword is required.");
  } else if (headword.length > 120) {
    errors.push("Headword must be 120 characters or fewer.");
  }

  const standardRaw = draft.standardForm ? nfc(draft.standardForm).trim() : "";
  const standardForm = standardRaw ? standardRaw : null;
  if (standardForm && standardForm.length > 120) {
    errors.push("Standard form must be 120 characters or fewer.");
  }

  const glossEn = draft.glossEn.trim();
  if (!glossEn) {
    errors.push("English gloss is required.");
  } else if (glossEn.length > 200) {
    errors.push("English gloss must be 200 characters or fewer.");
  }

  const syllables = draft.syllables
    .map((s) => nfc(s).trim())
    .filter((s) => s.length > 0);
  if (syllables.length === 0) {
    errors.push("Enter at least one syllable.");
  } else if (syllables.length > 24) {
    errors.push("Entries cannot exceed 24 syllables.");
  }

  const tonePattern = draft.tonePattern.filter((t): t is Tone => isTone(t));
  if (tonePattern.length !== draft.tonePattern.length) {
    errors.push("Each tone must be H, M, or L.");
  }
  if (syllables.length > 0 && tonePattern.length !== syllables.length) {
    errors.push(
      `Tone pattern length (${tonePattern.length}) must match syllable count (${syllables.length}).`,
    );
  }

  const exampleLine = draft.exampleLine ? nfc(draft.exampleLine).trim() : "";
  const exampleGlossEn = draft.exampleGlossEn
    ? draft.exampleGlossEn.trim()
    : "";
  if ((exampleLine && !exampleGlossEn) || (!exampleLine && exampleGlossEn)) {
    errors.push(
      "Provide both the example sentence in dialect and its English translation, or leave both blank.",
    );
  }
  const example: GlossaryExample | null =
    exampleLine && exampleGlossEn
      ? { text: exampleLine, translation: exampleGlossEn }
      : null;

  const noteRaw = draft.note ? draft.note.trim() : "";
  const note = noteRaw ? noteRaw.slice(0, 400) : null;
  const scenarioIds = Array.from(
    new Set(
      (draft.scenarioIds ?? []).map((id) => id.trim()).filter(Boolean),
    ),
  );

  return {
    valid: errors.length === 0,
    errors,
    normalizedDraft: {
      dialectId: draft.dialectId,
      headword,
      standardForm,
      glossEn,
      syllables,
      tonePattern,
      example,
      note,
      scenarioIds,
    },
  };
}

/**
 * Builds an immutable pending TrainerSubmissionRecord from a validated draft.
 */
export function buildPendingSubmission(params: {
  submissionId?: string;
  submittedBy: string;
  draft: TrainerSubmissionDraft;
  now?: number;
}): TrainerSubmissionRecord {
  if (!params.submittedBy.trim()) {
    throw new Error("A signed-in trainer UID is required to submit entries.");
  }
  const validation = validateTrainerEntryDraft(params.draft);
  if (!validation.valid) {
    throw new Error(validation.errors[0] ?? "Invalid trainer submission.");
  }

  const timestamp = params.now ?? Date.now();
  const submissionId = params.submissionId ?? generateId("sub");
  const { normalizedDraft } = validation;

  return {
    submissionId,
    submittedBy: params.submittedBy,
    dialectId: normalizedDraft.dialectId,
    headword: normalizedDraft.headword,
    standardForm: normalizedDraft.standardForm,
    glossEn: normalizedDraft.glossEn,
    syllables: normalizedDraft.syllables,
    tonePattern: normalizedDraft.tonePattern,
    example: normalizedDraft.example,
    note: normalizedDraft.note,
    scenarioIds: normalizedDraft.scenarioIds,
    status: "pending",
    reviewerUid: null,
    rejectionReason: null,
    createdAt: timestamp,
    reviewedAt: null,
  };
}

/**
 * Builds the verified GlossaryEntry created atomically on peer approval.
 */
export function buildApprovedGlossaryEntry(params: {
  submission: TrainerSubmissionRecord;
  reviewerUid: string;
  entryId?: string;
  now?: number;
}): GlossaryEntry {
  const { submission, reviewerUid } = params;
  if (!reviewerUid.trim()) {
    throw new Error("Reviewer UID is required.");
  }
  if (submission.submittedBy === reviewerUid) {
    throw new Error("Self-approval is not permitted for trainer submissions.");
  }
  if (submission.status !== "pending") {
    throw new Error(
      `Only pending submissions can be approved (found status: ${submission.status}).`,
    );
  }

  const timestamp = params.now ?? Date.now();
  return {
    entryId: params.entryId ?? `trn-${submission.submissionId}`,
    languageId: inferLanguageId(submission.dialectId),
    dialectId: submission.dialectId,
    headword: nfc(submission.headword),
    standardForm: submission.standardForm ? nfc(submission.standardForm) : null,
    glossEn: submission.glossEn.trim(),
    syllables: submission.syllables.map((s) => nfc(s)),
    tonePattern: [...submission.tonePattern],
    example: submission.example
      ? {
          text: nfc(submission.example.text),
          translation: submission.example.translation.trim(),
        }
      : null,
    scenarioIds: submission.scenarioIds ? [...submission.scenarioIds] : [],
    verified: true,
    verifiedBy: [submission.submittedBy, reviewerUid],
    source: "trainer",
    updatedAt: timestamp,
  };
}

export async function listQueuedSubmissions(): Promise<
  TrainerSubmissionRecord[]
> {
  const raw = await getMetaValue<TrainerSubmissionRecord[]>(
    TRAINER_SUBMISSION_QUEUE_META_KEY,
  );
  if (!Array.isArray(raw)) {
    return [];
  }
  return [...raw].sort((a, b) => b.createdAt - a.createdAt);
}

async function saveQueuedSubmissions(
  items: TrainerSubmissionRecord[],
): Promise<TrainerSubmissionRecord[]> {
  const deduped = new Map<string, TrainerSubmissionRecord>();
  for (const item of items) {
    deduped.set(item.submissionId, item);
  }
  const sorted = Array.from(deduped.values()).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
  await setMetaValue(TRAINER_SUBMISSION_QUEUE_META_KEY, sorted);
  return sorted;
}

export async function upsertQueuedSubmission(
  record: TrainerSubmissionRecord,
): Promise<TrainerSubmissionRecord[]> {
  const existing = await listQueuedSubmissions();
  return saveQueuedSubmissions([
    record,
    ...existing.filter((item) => item.submissionId !== record.submissionId),
  ]);
}

function toFirestoreSubmissionPayload(
  record: TrainerSubmissionRecord,
): TrainerSubmission & { scenarioIds?: string[] } {
  return {
    submissionId: record.submissionId,
    submittedBy: record.submittedBy,
    dialectId: record.dialectId,
    headword: nfc(record.headword),
    standardForm: record.standardForm ? nfc(record.standardForm) : null,
    glossEn: record.glossEn,
    syllables: record.syllables.map((s) => nfc(s)),
    tonePattern: [...record.tonePattern],
    example: record.example,
    note: record.note,
    ...(record.scenarioIds && record.scenarioIds.length > 0
      ? { scenarioIds: record.scenarioIds }
      : {}),
    status: record.status,
    reviewerUid: record.reviewerUid,
    rejectionReason: record.rejectionReason,
    createdAt: record.createdAt,
    reviewedAt: record.reviewedAt,
  };
}

export async function submitTrainerEntry(params: {
  submittedBy: string;
  draft: TrainerSubmissionDraft;
  online?: boolean;
  db?: Firestore;
}): Promise<{ submission: TrainerSubmissionRecord; synced: boolean }> {
  const baseSubmission = buildPendingSubmission({
    submittedBy: params.submittedBy,
    draft: params.draft,
  });

  const localPending: TrainerSubmissionRecord = {
    ...baseSubmission,
    pendingSync: true,
  };
  await upsertQueuedSubmission(localPending);

  const canAttemptSync = params.online ?? isBrowserOnline();
  if (!canAttemptSync) {
    return { submission: localPending, synced: false };
  }

  try {
    const db = params.db ?? getFirebase().db;
    await setDoc(
      doc(trainerSubmissionsColRef(db), baseSubmission.submissionId),
      toFirestoreSubmissionPayload(baseSubmission),
    );
    const syncedRecord: TrainerSubmissionRecord = {
      ...baseSubmission,
      pendingSync: false,
    };
    await upsertQueuedSubmission(syncedRecord);
    return { submission: syncedRecord, synced: true };
  } catch {
    return { submission: localPending, synced: false };
  }
}

export async function flushTrainerSubmissionQueue(params?: {
  submittedBy?: string;
  db?: Firestore;
}): Promise<{ syncedCount: number; remainingCount: number }> {
  const queue = await listQueuedSubmissions();
  const pendingItems = queue.filter((item) => {
    if (!item.pendingSync) return false;
    if (params?.submittedBy && item.submittedBy !== params.submittedBy) {
      return false;
    }
    return true;
  });

  if (pendingItems.length === 0 || !isBrowserOnline()) {
    return {
      syncedCount: 0,
      remainingCount: queue.filter((item) => Boolean(item.pendingSync)).length,
    };
  }

  let db: Firestore;
  try {
    db = params?.db ?? getFirebase().db;
  } catch {
    return {
      syncedCount: 0,
      remainingCount: queue.filter((item) => Boolean(item.pendingSync)).length,
    };
  }

  let syncedCount = 0;
  const updated = new Map<string, TrainerSubmissionRecord>(
    queue.map((item) => [item.submissionId, item]),
  );

  for (const item of pendingItems) {
    try {
      await setDoc(
        doc(trainerSubmissionsColRef(db), item.submissionId),
        toFirestoreSubmissionPayload(item),
      );
      updated.set(item.submissionId, { ...item, pendingSync: false });
      syncedCount += 1;
    } catch {
      // Retain pendingSync: true for the next online flush attempt.
    }
  }

  const nextQueue = await saveQueuedSubmissions(Array.from(updated.values()));
  return {
    syncedCount,
    remainingCount: nextQueue.filter((item) => Boolean(item.pendingSync)).length,
  };
}

export async function listTrainerSubmissions(params?: {
  dialectId?: DialectId;
  status?: TrainerSubmission["status"] | "all";
  online?: boolean;
  db?: Firestore;
}): Promise<TrainerSubmissionRecord[]> {
  const localItems = await listQueuedSubmissions();
  const merged = new Map<string, TrainerSubmissionRecord>();

  for (const item of localItems) {
    merged.set(item.submissionId, item);
  }

  const canFetchRemote = params?.online ?? isBrowserOnline();
  if (canFetchRemote) {
    try {
      const db = params?.db ?? getFirebase().db;
      const constraints = [];
      if (params?.dialectId) {
        constraints.push(where("dialectId", "==", params.dialectId));
      }
      if (params?.status && params.status !== "all") {
        constraints.push(where("status", "==", params.status));
      }
      const q =
        constraints.length > 0
          ? query(trainerSubmissionsColRef(db), ...constraints)
          : trainerSubmissionsColRef(db);
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as TrainerSubmissionRecord;
        merged.set(data.submissionId ?? docSnap.id, {
          ...data,
          submissionId: data.submissionId ?? docSnap.id,
          pendingSync: false,
        });
      }
    } catch {
      // Offline or unprivileged users fall back cleanly to local cached items.
    }
  }

  return Array.from(merged.values())
    .filter((item) => {
      if (params?.dialectId && item.dialectId !== params.dialectId) {
        return false;
      }
      if (params?.status && params.status !== "all" && item.status !== params.status) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function approveSubmission(params: {
  submission: TrainerSubmissionRecord;
  reviewerUid: string;
  db?: Firestore;
}): Promise<GlossaryEntry> {
  const { submission, reviewerUid } = params;
  const now = Date.now();
  const entry = buildApprovedGlossaryEntry({
    submission,
    reviewerUid,
    now,
  });

  if (!isBrowserOnline()) {
    throw new Error("Go online to approve submissions and publish to glossary.");
  }

  const db = params.db ?? getFirebase().db;
  const batch = writeBatch(db);
  batch.update(doc(trainerSubmissionsColRef(db), submission.submissionId), {
    status: "approved",
    reviewerUid,
    rejectionReason: null,
    reviewedAt: now,
  });
  batch.set(doc(glossaryColRef(db), entry.entryId), entry);
  await batch.commit();

  await putGlossaryEntries([entry]);
  await upsertQueuedSubmission({
    ...submission,
    status: "approved",
    reviewerUid,
    rejectionReason: null,
    reviewedAt: now,
    pendingSync: false,
  });

  return entry;
}

export async function rejectSubmission(params: {
  submission: TrainerSubmissionRecord;
  reviewerUid: string;
  reason: string;
  db?: Firestore;
}): Promise<TrainerSubmissionRecord> {
  const { submission, reviewerUid } = params;
  const reason = params.reason.trim();
  if (!reviewerUid.trim()) {
    throw new Error("Reviewer UID is required.");
  }
  if (submission.submittedBy === reviewerUid) {
    throw new Error("You cannot review or reject your own submission.");
  }
  if (submission.status !== "pending") {
    throw new Error("Only pending submissions can be rejected.");
  }
  if (!reason) {
    throw new Error("Please include a short reason when rejecting an entry.");
  }
  if (!isBrowserOnline()) {
    throw new Error("Go online to submit a peer review decision.");
  }

  const now = Date.now();
  const db = params.db ?? getFirebase().db;
  const batch = writeBatch(db);
  batch.update(doc(trainerSubmissionsColRef(db), submission.submissionId), {
    status: "rejected",
    reviewerUid,
    rejectionReason: reason,
    reviewedAt: now,
  });
  await batch.commit();

  const updatedRecord: TrainerSubmissionRecord = {
    ...submission,
    status: "rejected",
    reviewerUid,
    rejectionReason: reason,
    reviewedAt: now,
    pendingSync: false,
  };
  await upsertQueuedSubmission(updatedRecord);
  return updatedRecord;
}

export async function getMyTrainerRequest(
  uid: string,
  db?: Firestore,
): Promise<TrainerRequest | null> {
  const local = await getMetaValue<TrainerRequest>(
    `${TRAINER_REQUEST_META_PREFIX}${uid}`,
  );
  if (!isBrowserOnline()) {
    return local ?? null;
  }
  try {
    const resolvedDb = db ?? getFirebase().db;
    const snap = await getDoc(trainerRequestDocRef(uid, resolvedDb));
    if (snap.exists()) {
      const data = snap.data() as TrainerRequest;
      await setMetaValue(`${TRAINER_REQUEST_META_PREFIX}${uid}`, data);
      return data;
    }
  } catch {
    // Fall back to local stored request when offline or unauthenticated.
  }
  return local ?? null;
}

export async function submitTrainerAccessRequest(params: {
  uid: string;
  dialectId: DialectId;
  motivation: string;
  online?: boolean;
  db?: Firestore;
}): Promise<{ request: TrainerRequest; synced: boolean }> {
  if (!params.uid.trim()) {
    throw new Error("Sign in with Google before requesting trainer access.");
  }
  if (!isDialectId(params.dialectId)) {
    throw new Error("Select a valid dialect.");
  }
  const motivation = params.motivation.trim();
  if (motivation.length < 15) {
    throw new Error(
      "Share at least a short sentence (15+ characters) describing your dialect fluency.",
    );
  }

  const request: TrainerRequest = {
    uid: params.uid,
    dialectId: params.dialectId,
    motivation: motivation.slice(0, 600),
    createdAt: Date.now(),
  };

  await setMetaValue(`${TRAINER_REQUEST_META_PREFIX}${params.uid}`, request);

  const canSync = params.online ?? isBrowserOnline();
  if (!canSync) {
    return { request, synced: false };
  }

  try {
    const resolvedDb = params.db ?? getFirebase().db;
    await setDoc(trainerRequestDocRef(params.uid, resolvedDb), request);
    return { request, synced: true };
  } catch {
    return { request, synced: false };
  }
}
