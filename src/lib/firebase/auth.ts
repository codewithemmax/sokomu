"use client";

import {
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
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

export async function upgradeWithGoogle(authInstance?: Auth): Promise<User> {
  const auth = authInstance ?? getFirebase().auth;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  if (auth.currentUser && auth.currentUser.isAnonymous) {
    try {
      const linked = await linkWithPopup(auth.currentUser, provider);
      return linked.user;
    } catch (err: unknown) {
      if (hasErrorCode(err, "auth/credential-already-in-use")) {
        const signedIn = await signInWithPopup(auth, provider);
        return signedIn.user;
      }
      throw err;
    }
  }

  const signedIn = await signInWithPopup(auth, provider);
  return signedIn.user;
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
