"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import {
  ensureAnonymousUser,
  subscribeToAuthChanges,
  upgradeWithGoogle,
} from "@/lib/firebase/auth";
import { getFirebase } from "@/lib/firebase/client";
import { userDocRef } from "@/lib/firebase/firestore";
import { getLocalUserProfile } from "@/lib/progress/profile";
import type { UserRole } from "@/types/domain";

function normalizeUserRole(value: unknown): UserRole {
  if (value === "trainer" || value === "admin") {
    return value;
  }
  return "learner";
}

export interface UseAuthUserResult {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  role: UserRole;
  roleLoading: boolean;
  error: string | null;
  upgradeWithGoogle: () => Promise<User | null>;
}

export function useAuthUser(): UseAuthUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [role, setRole] = useState<UserRole>("learner");
  const [roleLoading, setRoleLoading] = useState<boolean>(false);
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

  useEffect(() => {
    if (!user?.uid) {
      setRole("learner");
      setRoleLoading(false);
      return;
    }

    let active = true;
    let unsubscribeRole: (() => void) | undefined;
    setRoleLoading(true);

    void getLocalUserProfile()
      .then((cached) => {
        if (active && cached?.role) {
          setRole(normalizeUserRole(cached.role));
        }
      })
      .catch(() => {
        // Ignore IDB read issues while online Firestore subscription attaches.
      });

    try {
      const { db } = getFirebase();
      unsubscribeRole = onSnapshot(
        userDocRef(user.uid, db),
        (snapshot) => {
          if (!active) return;
          if (snapshot.exists()) {
            const data = snapshot.data() as Record<string, unknown>;
            setRole(normalizeUserRole(data.role));
          } else {
            setRole("learner");
          }
          setRoleLoading(false);
        },
        () => {
          if (!active) return;
          setRoleLoading(false);
        },
      );
    } catch {
      setRoleLoading(false);
    }

    return () => {
      active = false;
      if (unsubscribeRole) {
        unsubscribeRole();
      }
    };
  }, [user?.uid]);

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
    role,
    roleLoading,
    error,
    upgradeWithGoogle: handleUpgradeWithGoogle,
  };
}
