"use client";

import { setDoc } from "firebase/firestore";
import { getMetaValue, setMetaValue } from "@/lib/db/idb";
import { getFirebase } from "@/lib/firebase/client";
import { userDocRef } from "@/lib/firebase/firestore";
import type {
  DialectId,
  LanguageId,
  LearningGoal,
  NanoStatusState,
  UserProfile,
} from "@/types/domain";

const USER_PROFILE_META_KEY = "userProfile";

export const DEFAULT_USER_PROFILE: UserProfile = {
  uid: "guest",
  displayName: null,
  role: "learner",
  isAnonymous: true,
  languageId: "yo",
  dialectId: "yo-ijebu",
  goal: "elder-greetings",
  nanoStatus: "fallback",
  createdAt: 0,
  updatedAt: 0,
};

export async function getLocalUserProfile(): Promise<UserProfile> {
  const stored = await getMetaValue<UserProfile>(USER_PROFILE_META_KEY);
  if (!stored || typeof stored !== "object") {
    return { ...DEFAULT_USER_PROFILE };
  }
  return {
    ...DEFAULT_USER_PROFILE,
    ...stored,
  };
}

export interface SaveUserProfileInput {
  uid?: string | null;
  displayName?: string | null;
  isAnonymous?: boolean;
  languageId: LanguageId;
  dialectId: DialectId;
  goal: LearningGoal;
  nanoStatus: NanoStatusState;
}

export async function saveUserProfilePreferences(
  input: SaveUserProfileInput,
): Promise<UserProfile> {
  const existing = await getLocalUserProfile();
  const now = Date.now();
  const next: UserProfile = {
    uid: input.uid ?? existing.uid ?? "guest",
    displayName:
      input.displayName !== undefined ? input.displayName : existing.displayName,
    role: existing.role ?? "learner",
    isAnonymous: input.isAnonymous ?? existing.isAnonymous ?? true,
    languageId: input.languageId,
    dialectId: input.dialectId,
    goal: input.goal,
    nanoStatus: input.nanoStatus,
    createdAt: existing.createdAt > 0 ? existing.createdAt : now,
    updatedAt: now,
  };

  await setMetaValue(USER_PROFILE_META_KEY, next);

  const isOffline =
    typeof navigator !== "undefined" && navigator.onLine === false;
  if (!input.uid || isOffline) {
    return next;
  }

  try {
    const { db } = getFirebase();
    // Write only learner-editable fields so Firestore rules (role immutability) pass.
    await setDoc(
      userDocRef(input.uid, db),
      {
        uid: input.uid,
        displayName: next.displayName,
        isAnonymous: next.isAnonymous,
        languageId: next.languageId,
        dialectId: next.dialectId,
        goal: next.goal,
        nanoStatus: next.nanoStatus,
        updatedAt: next.updatedAt,
      },
      { merge: true },
    );
  } catch {
    // Keep local IndexedDB profile when Firestore write is unavailable.
  }

  return next;
}
