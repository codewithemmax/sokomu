"use client";

import {
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirebase } from "./client";

function hasErrorCode(err: unknown, targetCode: string): boolean {
  if (typeof err !== "object" || err === null || !("code" in err)) {
    return false;
  }
  return (err as { code?: unknown }).code === targetCode;
}

export async function ensureAnonymousUser(authInstance?: Auth): Promise<User> {
  const auth = authInstance ?? getFirebase().auth;
  await auth.authStateReady();
  if (auth.currentUser) {
    return auth.currentUser;
  }
  const credential = await signInAnonymously(auth);
  return credential.user;
}

const POPUP_BLOCKED_CODES = [
  "auth/popup-blocked",
  "auth/operation-not-supported-in-environment",
  "auth/web-storage-unsupported",
];

/** Error with a message that can be shown to the learner as-is. */
export class GoogleSignInError extends Error {
  constructor(
    message: string,
    readonly code: string | null,
  ) {
    super(message);
    this.name = "GoogleSignInError";
  }
}

function toGoogleSignInError(err: unknown): unknown {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code?: unknown }).code)
      : null;
  if (code && POPUP_BLOCKED_CODES.includes(code)) {
    return new GoogleSignInError(
      "Your browser blocked the Google sign-in window. Allow pop-ups for this site " +
        "(or open it in Chrome or Safari instead of an in-app browser) and try again.",
      code,
    );
  }
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return new GoogleSignInError("Sign-in was cancelled before it finished.", code);
  }
  return err;
}

export async function upgradeWithGoogle(authInstance?: Auth): Promise<User> {
  const auth = authInstance ?? getFirebase().auth;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    if (auth.currentUser && auth.currentUser.isAnonymous) {
      try {
        // Must be the first await so the popup opens inside the click gesture.
        const linked = await linkWithPopup(auth.currentUser, provider);
        return linked.user;
      } catch (err: unknown) {
        if (hasErrorCode(err, "auth/credential-already-in-use")) {
          // This Google account already belongs to another Sokomu user. Reuse
          // the credential the popup just returned instead of opening a
          // second popup: that one runs outside the click gesture, so
          // browsers block it and the learner silently stays a guest.
          const credential = GoogleAuthProvider.credentialFromError(
            err as Parameters<typeof GoogleAuthProvider.credentialFromError>[0],
          );
          if (credential) {
            const signedIn = await signInWithCredential(auth, credential);
            return signedIn.user;
          }
        }
        throw err;
      }
    }

    const signedIn = await signInWithPopup(auth, provider);
    return signedIn.user;
  } catch (err: unknown) {
    throw toGoogleSignInError(err);
  }
}

export async function signOutUser(authInstance?: Auth): Promise<void> {
  const auth = authInstance ?? getFirebase().auth;
  await signOut(auth);
}

export function subscribeToAuthChanges(
  callback: (user: User | null) => void,
  authInstance?: Auth,
): () => void {
  const auth = authInstance ?? getFirebase().auth;
  return onAuthStateChanged(auth, callback);
}
