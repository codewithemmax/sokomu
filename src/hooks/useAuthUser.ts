"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  ensureAnonymousUser,
  subscribeToAuthChanges,
  upgradeWithGoogle,
} from "@/lib/firebase/auth";
import { getFirebase } from "@/lib/firebase/client";

export interface UseAuthUserResult {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  error: string | null;
  upgradeWithGoogle: () => Promise<User | null>;
}

export function useAuthUser(): UseAuthUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    try {
      const { auth } = getFirebase();
      unsubscribe = subscribeToAuthChanges((nextUser) => {
        if (!active) return;
        setUser(nextUser);
        if (!nextUser && typeof navigator !== "undefined" && navigator.onLine) {
          void ensureAnonymousUser(auth)
            .then((anonUser) => {
              if (!active) return;
              setUser(anonUser);
              setLoading(false);
            })
            .catch((err: unknown) => {
              if (!active) return;
              setError(err instanceof Error ? err.message : "Failed to initialize anonymous session.");
              setLoading(false);
            });
          return;
        }
        setLoading(false);
      }, auth);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Firebase initialization failed.");
      setLoading(false);
    }

    return () => {
      active = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleUpgradeWithGoogle = useCallback(async (): Promise<User | null> => {
    setError(null);
    try {
      const linkedUser = await upgradeWithGoogle();
      setUser(linkedUser);
      return linkedUser;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      return null;
    }
  }, []);

  return {
    user,
    loading,
    isAnonymous: user?.isAnonymous ?? true,
    error,
    upgradeWithGoogle: handleUpgradeWithGoogle,
  };
}
